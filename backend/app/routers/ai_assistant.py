from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta, datetime
import httpx
import re
import json
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.config import settings

router = APIRouter(prefix="/ai-assistant", tags=["AI HR Assistant"])

SYSTEM_PROMPT = """You are Dayflow AI, an intelligent, empathetic, and ultra-efficient HR assistant for the Dayflow HRMS platform.
You assist employees with checking leave balances, applying for leave, viewing attendance summaries, and explaining payroll/salary breakdowns.
Keep responses concise, polite, professional, and formatted in clean markdown.
When an action is taken or data is requested, present the figures clearly."""

@router.post("/chat", response_model=schemas.AIChatResponse)
async def chat_with_assistant(
    req: schemas.AIChatRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    emp = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    user_msg = req.message.strip().lower()

    # Fetch context data for this employee
    today = date.today()
    payroll = db.query(models.Payroll).filter(models.Payroll.employee_id == emp.id).order_by(models.Payroll.id.desc()).first()
    attendance_records = db.query(models.Attendance).filter(
        models.Attendance.employee_id == emp.id,
        models.Attendance.date >= today.replace(day=1)
    ).all()
    present_days = sum(1 for r in attendance_records if r.status in ["present", "half_day"])

    # 1. Check if Gemini API is available and can be used
    if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 10:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
            context_str = f"""
Employee Context:
- Name: {current_user.name} (ID: {current_user.employee_id})
- Department: {emp.department}, Designation: {emp.designation}
- Leave Balances: Paid: {emp.leave_balance_paid} days, Sick: {emp.leave_balance_sick} days, Unpaid: {emp.leave_balance_unpaid} days.
- Today: {today.isoformat()}
- Attendance this month: {present_days} days present out of {len(attendance_records)} days recorded.
- Latest Net Salary: ${payroll.net_salary if payroll else 'No record yet'} (Basic: ${payroll.basic_salary if payroll else 'N/A'}, Allowances: ${payroll.allowances if payroll else 'N/A'}, Deductions: ${payroll.deductions if payroll else 'N/A'}, Tax: ${payroll.tax if payroll else 'N/A'}).
"""
            payload = {
                "contents": [
                    {"role": "user", "parts": [{"text": f"{SYSTEM_PROMPT}\n{context_str}\nUser Question: {req.message}"}]}
                ]
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    gemini_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    
                    # Detect if leave was requested in message
                    action_type = "none"
                    action_payload = None
                    if "apply" in user_msg and "leave" in user_msg:
                        action_type = "leave_proposal"
                        action_payload = {
                            "leave_type": "sick" if "sick" in user_msg else "paid",
                            "start_date": (today + timedelta(days=1)).isoformat() if "tomorrow" in user_msg else today.isoformat(),
                            "end_date": (today + timedelta(days=1)).isoformat() if "tomorrow" in user_msg else today.isoformat(),
                            "reason": req.message
                        }

                    return {
                        "reply": gemini_text,
                        "action_type": action_type,
                        "action_payload": action_payload
                    }
        except Exception as e:
            # Gracefully fallback to deterministic NLP engine
            pass

    # 2. Smart Deterministic NLP & Tool Execution Engine (Built-in)
    
    # Case A: Leave Balance Query
    if any(k in user_msg for k in ["leave balance", "how many leave", "leaves left", "remaining leave", "vacation days", "days off"]):
        reply = (
            f"### 🌴 Your Leave Balance Overview\n\n"
            f"Hi **{current_user.name}**, here is your current leave entitlement:\n\n"
            f"- **Paid / Annual Leave:** `{emp.leave_balance_paid}` days remaining\n"
            f"- **Sick Leave:** `{emp.leave_balance_sick}` days remaining\n"
            f"- **Unpaid Leave:** `{emp.leave_balance_unpaid}` days remaining\n\n"
            f"**Total Available Leave:** `{emp.leave_balance_paid + emp.leave_balance_sick + emp.leave_balance_unpaid}` days.\n\n"
            f"💡 *Would you like me to apply for leave on your behalf? Just say 'Apply sick leave for tomorrow' or 'Apply paid leave from Monday to Friday'.*"
        )
        return {
            "reply": reply,
            "action_type": "show_leave_balance",
            "action_payload": {
                "paid": emp.leave_balance_paid,
                "sick": emp.leave_balance_sick,
                "unpaid": emp.leave_balance_unpaid
            }
        }

    # Case B: Attendance Query
    if any(k in user_msg for k in ["attendance", "present", "check in", "hours worked", "timesheet"]):
        total_rec = len(attendance_records) or 1
        rate = round((present_days / total_rec) * 100, 1)
        today_att = db.query(models.Attendance).filter(models.Attendance.employee_id == emp.id, models.Attendance.date == today).first()
        today_status_text = f"Checked in at `{today_att.check_in}`" if (today_att and today_att.check_in) else "Not checked in yet today"

        reply = (
            f"### ⏱️ Attendance Summary for {today.strftime('%B %Y')}\n\n"
            f"- **Today's Status:** {today_status_text}\n"
            f"- **Days Present This Month:** `{present_days}` days\n"
            f"- **Attendance Rate:** `{rate}%`\n\n"
            f"You can quickly check in or check out directly from your top header bar or the Attendance tab."
        )
        return {
            "reply": reply,
            "action_type": "show_attendance",
            "action_payload": {
                "present_days": present_days,
                "attendance_rate": rate,
                "today_status": today_att.status if today_att else "not_checked_in"
            }
        }

    # Case C: Salary / Payroll Query
    if any(k in user_msg for k in ["salary", "payroll", "payslip", "take home", "compensation", "allowance", "deduction"]):
        if not payroll:
            return {
                "reply": f"Hi **{current_user.name}**, there is no payroll record generated for your account yet. Once your monthly payroll run is completed by HR, you will be able to view your complete breakdown and download your payslip.",
                "action_type": "none",
                "action_payload": None
            }

        basic = payroll.basic_salary
        allowances = payroll.allowances
        deductions = payroll.deductions
        tax = payroll.tax
        net = payroll.net_salary

        reply = (
            f"### 💵 Salary & Compensation Breakdown ({payroll.month} {payroll.year})\n\n"
            f"Here is the latest monthly breakdown for **{current_user.name}**:\n\n"
            f"| Item | Amount |\n"
            f"| :--- | :--- |\n"
            f"| **Basic Salary** | `${basic:,.2f}` |\n"
            f"| **Allowances (HRA/Special)** | `+${allowances:,.2f}` |\n"
            f"| **Deductions (Benefits/PF)** | `-${deductions:,.2f}` |\n"
            f"| **Tax Withheld** | `-${tax:,.2f}` |\n"
            f"| **Net Take-Home Pay** | **`${net:,.2f}`** |\n\n"
            f"📄 You can view and download your full printable payslip PDF in the **Salary & Payslips** tab."
        )
        return {
            "reply": reply,
            "action_type": "show_payroll",
            "action_payload": {
                "basic": basic,
                "allowances": allowances,
                "deductions": deductions,
                "tax": tax,
                "net": net
            }
        }

    # Case D: Apply Leave via Chat
    if any(k in user_msg for k in ["apply leave", "apply sick", "apply paid", "take off", "request leave", "book off"]):
        leave_type = "sick" if "sick" in user_msg else ("unpaid" if "unpaid" in user_msg else "paid")
        
        target_start = today
        if "tomorrow" in user_msg:
            target_start = today + timedelta(days=1)
        elif "next week" in user_msg:
            target_start = today + timedelta(days=7)
            
        target_end = target_start

        # Perform actual leave creation
        new_leave = models.LeaveRequest(
            employee_id=emp.id,
            leave_type=leave_type,
            start_date=target_start,
            end_date=target_end,
            total_days=1,
            reason=f"Applied via Dayflow AI Copilot: {req.message}",
            status="pending"
        )
        db.add(new_leave)

        notif = models.Notification(
            employee_id=emp.id,
            title="Leave Request Created by AI 🤖",
            message=f"Your {leave_type.capitalize()} leave request for {target_start.isoformat()} was submitted to HR.",
            type="info"
        )
        db.add(notif)
        db.commit()
        db.refresh(new_leave)

        reply = (
            f"### ✅ Leave Request Submitted Successfully!\n\n"
            f"I have submitted a **{leave_type.capitalize()} Leave** request on your behalf:\n\n"
            f"- **Date:** `{target_start.strftime('%A, %b %d, %Y')}`\n"
            f"- **Duration:** `1 day`\n"
            f"- **Status:** `Pending HR Approval` ⏳\n\n"
            f"Your HR manager has been notified and you will receive an alert once approved."
        )
        return {
            "reply": reply,
            "action_type": "leave_applied",
            "action_payload": {
                "leave_id": new_leave.id,
                "leave_type": leave_type,
                "start_date": target_start.isoformat(),
                "end_date": target_end.isoformat(),
                "status": "pending"
            }
        }

    # Case E: HR Policy & General Questions
    reply = (
        f"Hi **{current_user.name}**! 👋 I am your **Dayflow AI Copilot**.\n\n"
        f"I can help you with:\n"
        f"- 🌴 **Leave Queries:** *'How many leaves do I have left?'* or *'Apply sick leave for tomorrow'*\n"
        f"- ⏱️ **Attendance Records:** *'Show my attendance summary for this month'*\n"
        f"- 💵 **Payroll Breakdown:** *'What is my salary breakdown and take-home pay?'*\n"
        f"- 📋 **Company Policies:** Work hours (9 AM – 6 PM), Standard Paid Leave (18 days/yr), Sick Leave (12 days/yr).\n\n"
        f"How can I assist your workday today?"
    )
    return {
        "reply": reply,
        "action_type": "none",
        "action_payload": None
    }
