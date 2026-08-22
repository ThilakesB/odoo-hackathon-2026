from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from app.database import get_db
from app import models
from app.auth import get_current_user, require_admin

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard-summary")
def get_dashboard_summary(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    total_employees = db.query(models.Employee).count()
    
    # Today attendance
    present_today = db.query(models.Attendance).filter(
        models.Attendance.date == today,
        models.Attendance.status.in_(["present", "half_day"])
    ).count()

    # Leave today
    leaves_today = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.status == "approved",
        models.LeaveRequest.start_date <= today,
        models.LeaveRequest.end_date >= today
    ).count()

    pending_leaves = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.status == "pending"
    ).count()

    absent_today = max(0, total_employees - present_today - leaves_today)

    # Monthly payroll spend
    current_month_name = today.strftime("%B")
    current_year = today.year
    payrolls = db.query(models.Payroll).filter(
        models.Payroll.month == current_month_name,
        models.Payroll.year == current_year
    ).all()
    monthly_payroll_total = sum(p.net_salary for p in payrolls) if payrolls else 0.0

    return {
        "total_employees": total_employees,
        "present_today": present_today,
        "absent_today": absent_today,
        "on_leave_today": leaves_today,
        "pending_leave_requests": pending_leaves,
        "monthly_payroll_spend": round(monthly_payroll_total, 2),
        "attendance_rate_today": round((present_today / (total_employees or 1)) * 100, 1)
    }

@router.get("/attendance-trends")
def get_attendance_trends(
    days: int = 7,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    results = []
    
    for i in range(days - 1, -1, -1):
        target_date = today - timedelta(days=i)
        day_name = target_date.strftime("%a (%b %d)")
        
        present_count = db.query(models.Attendance).filter(
            models.Attendance.date == target_date,
            models.Attendance.status.in_(["present", "half_day"])
        ).count()
        
        absent_count = db.query(models.Attendance).filter(
            models.Attendance.date == target_date,
            models.Attendance.status == "absent"
        ).count()

        leave_count = db.query(models.LeaveRequest).filter(
            models.LeaveRequest.status == "approved",
            models.LeaveRequest.start_date <= target_date,
            models.LeaveRequest.end_date >= target_date
        ).count()

        results.append({
            "date": target_date.isoformat(),
            "day": day_name,
            "present": present_count,
            "absent": absent_count,
            "leave": leave_count
        })

    return results

@router.get("/department-breakdown")
def get_department_breakdown(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    depts = db.query(models.Employee.department, func.count(models.Employee.id)).group_by(models.Employee.department).all()
    return [{"department": d[0] or "General", "count": d[1]} for d in depts]

@router.get("/leave-distribution")
def get_leave_distribution(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    leaves = db.query(models.LeaveRequest.leave_type, func.count(models.LeaveRequest.id)).group_by(models.LeaveRequest.leave_type).all()
    return [{"type": l[0].capitalize(), "count": l[1]} for l in leaves]

@router.get("/payroll-history")
def get_payroll_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    # Provide last 6 months trend
    records = db.query(models.Payroll).all()
    # Group by month
    grouped = {}
    for r in records:
        key = f"{r.month[:3]} {r.year}"
        if key not in grouped:
            grouped[key] = {"month": key, "total": 0.0, "tax": 0.0, "allowances": 0.0}
        grouped[key]["total"] += r.net_salary
        grouped[key]["tax"] += r.tax
        grouped[key]["allowances"] += r.allowances

    return list(grouped.values())[-6:] if grouped else []
