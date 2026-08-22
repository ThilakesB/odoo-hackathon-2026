from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta, datetime
import re
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.config import settings
from app.rag_service import RAGService
from app.gemini_service import GeminiService

router = APIRouter(prefix="/ai-assistant", tags=["AI HR Assistant"])

SYSTEM_PROMPT = """You are Dayflow AI, an intelligent, empathetic, and ultra-efficient HR Copilot for the Dayflow HRMS platform.
You assist employees with checking leave balances, company HR policies, attendance compliance, and payroll/salary breakdowns.
Keep responses concise, polite, professional, and formatted in clean markdown with bullet points and bold highlights.
Base your answers on the provided Employee Workspace Context and Retrieved Company HR Policies."""

@router.post("/chat", response_model=schemas.AIChatResponse)
async def chat_with_assistant(
    req: schemas.AIChatRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    RAG Pipeline with Gemini Generation:
    1. Embed user query and retrieve top-k relevant HR policy chunks from ChromaDB.
    2. Build prompt with System instructions + Employee Database State + Retrieved Policy Chunks.
    3. Generate response using Google Generative AI (Gemini 1.5 Flash).
    4. Return generated answer and source citations to the frontend.
    """
    emp = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee profile not found")

    user_msg = req.message.strip()
    user_msg_lower = user_msg.lower()

    # 1. Fetch live employee workspace status from Database
    today = date.today()
    payroll = db.query(models.Payroll).filter(models.Payroll.employee_id == emp.id).order_by(models.Payroll.id.desc()).first()
    attendance_records = db.query(models.Attendance).filter(
        models.Attendance.employee_id == emp.id,
        models.Attendance.date >= today.replace(day=1)
    ).all()
    present_days = sum(1 for r in attendance_records if r.status in ["present", "half_day"])

    net_sal = f"₹{payroll.net_salary:,.2f}" if payroll else "₹0.00"
    basic_sal = f"₹{payroll.basic_salary:,.2f}" if payroll else "₹0.00"
    allow_sal = f"₹{payroll.allowances:,.2f}" if payroll else "₹0.00"
    ded_sal = f"₹{payroll.deductions:,.2f}" if payroll else "₹0.00"
    tax_sal = f"₹{payroll.tax:,.2f}" if payroll else "₹0.00"

    employee_context = f"""### Current Employee Workspace State:
- Employee Name: {current_user.name} (Employee Code: {current_user.employee_id})
- Department: {emp.department} | Designation: {emp.designation}
- Leave Balances: Paid Leave: {emp.leave_balance_paid} days, Sick Leave: {emp.leave_balance_sick} days, Unpaid Leave: {emp.leave_balance_unpaid} days.
- Today's Date: {today.isoformat()}
- Attendance Current Month: {present_days} days present logged out of {len(attendance_records)} days recorded.
- Latest Net Salary: {net_sal} (Basic: {basic_sal}, Allowances: {allow_sal}, Deductions: {ded_sal}, Tax: {tax_sal})."""

    # 2. Retrieve top-k relevant policy chunks from ChromaDB Vector Store
    retrieved_sources = RAGService.retrieve_relevant_chunks(user_msg, top_k=3)

    # 3. Generate answer with Google Generative AI (Gemini)
    gemini_answer = GeminiService.generate_response(
        system_prompt=SYSTEM_PROMPT,
        retrieved_context=retrieved_sources,
        employee_context=employee_context,
        user_message=user_msg
    )

    # 4. Check for interactive intent triggers
    action_type = "none"
    action_payload = None

    if any(k in user_msg_lower for k in ["leave balance", "how many leave", "leaves left", "remaining leave", "vacation days"]):
        action_type = "show_leave_balance"
        action_payload = {
            "paid": emp.leave_balance_paid,
            "sick": emp.leave_balance_sick,
            "unpaid": emp.leave_balance_unpaid
        }
    elif "apply" in user_msg_lower and "leave" in user_msg_lower:
        action_type = "leave_proposal"
        action_payload = {
            "leave_type": "sick" if "sick" in user_msg_lower else "paid",
            "start_date": (today + timedelta(days=1)).isoformat() if "tomorrow" in user_msg_lower else today.isoformat(),
            "end_date": (today + timedelta(days=1)).isoformat() if "tomorrow" in user_msg_lower else today.isoformat(),
            "reason": user_msg
        }

    return {
        "reply": gemini_answer,
        "sources": retrieved_sources,
        "action_type": action_type,
        "action_payload": action_payload
    }
