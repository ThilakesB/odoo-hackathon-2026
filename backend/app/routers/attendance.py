from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.get("/status", response_model=schemas.AttendanceSummary)
def get_today_status(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    today = date.today()
    att = db.query(models.Attendance).filter(
        models.Attendance.employee_id == emp.id,
        models.Attendance.date == today
    ).first()

    # Calculate month stats
    current_month_records = db.query(models.Attendance).filter(
        models.Attendance.employee_id == emp.id,
        models.Attendance.date >= today.replace(day=1)
    ).all()
    
    present_days = sum(1 for r in current_month_records if r.status in ["present", "half_day"])
    absent_days = sum(1 for r in current_month_records if r.status == "absent")
    total_tracked = len(current_month_records) or 1
    attendance_rate = round((present_days / total_tracked) * 100, 1)

    if not att:
        return {
            "today_status": "not_checked_in",
            "checked_in": False,
            "checked_out": False,
            "check_in_time": None,
            "check_out_time": None,
            "work_hours_today": 0.0,
            "total_days_present_month": present_days,
            "total_days_absent_month": absent_days,
            "attendance_rate": attendance_rate
        }
    
    return {
        "today_status": att.status,
        "checked_in": att.check_in is not None,
        "checked_out": att.check_out is not None,
        "check_in_time": att.check_in,
        "check_out_time": att.check_out,
        "work_hours_today": att.work_hours or 0.0,
        "total_days_present_month": present_days,
        "total_days_absent_month": absent_days,
        "attendance_rate": attendance_rate
    }

@router.post("/check-in", response_model=schemas.AttendanceOut)
def check_in(
    data: schemas.AttendanceCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    emp = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    check_date = data.date or date.today()
    att = db.query(models.Attendance).filter(
        models.Attendance.employee_id == emp.id,
        models.Attendance.date == check_date
    ).first()

    now_str = data.check_in or datetime.now().strftime("%I:%M %p")

    if att:
        if att.check_in:
            raise HTTPException(status_code=400, detail="Already checked in for today")
        att.check_in = now_str
        att.status = "present"
        if data.notes:
            att.notes = data.notes
    else:
        att = models.Attendance(
            employee_id=emp.id,
            date=check_date,
            check_in=now_str,
            status="present",
            work_hours=0.0,
            notes=data.notes
        )
        db.add(att)

    db.commit()
    db.refresh(att)
    
    return {
        "id": att.id,
        "employee_id": att.employee_id,
        "date": att.date,
        "check_in": att.check_in,
        "check_out": att.check_out,
        "status": att.status,
        "work_hours": att.work_hours,
        "notes": att.notes,
        "employee_name": current_user.name,
        "employee_code": current_user.employee_id,
        "department": emp.department
    }

@router.post("/check-out", response_model=schemas.AttendanceOut)
def check_out(
    data: schemas.AttendanceCheckOut,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    emp = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    today = date.today()
    att = db.query(models.Attendance).filter(
        models.Attendance.employee_id == emp.id,
        models.Attendance.date == today
    ).first()

    if not att or not att.check_in:
        raise HTTPException(status_code=400, detail="You must check in first before checking out")
    
    now_str = data.check_out or datetime.now().strftime("%I:%M %p")
    att.check_out = now_str

    # Estimate work hours
    try:
        t_in = datetime.strptime(att.check_in, "%I:%M %p")
        t_out = datetime.strptime(now_str, "%I:%M %p")
        delta = (t_out - t_in).total_seconds() / 3600.0
        att.work_hours = max(0.5, round(delta, 2))
        if att.work_hours < 4.0:
            att.status = "half_day"
    except Exception:
        att.work_hours = 8.0

    if data.notes:
        att.notes = (att.notes or "") + " | " + data.notes

    db.commit()
    db.refresh(att)

    return {
        "id": att.id,
        "employee_id": att.employee_id,
        "date": att.date,
        "check_in": att.check_in,
        "check_out": att.check_out,
        "status": att.status,
        "work_hours": att.work_hours,
        "notes": att.notes,
        "employee_name": current_user.name,
        "employee_code": current_user.employee_id,
        "department": emp.department
    }

@router.get("", response_model=List[schemas.AttendanceOut])
def get_attendance(
    month: Optional[int] = None,
    year: Optional[int] = None,
    employee_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Attendance).join(models.Employee).join(models.User)

    if current_user.role != "admin":
        emp = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
        if not emp:
            return []
        query = query.filter(models.Attendance.employee_id == emp.id)
    else:
        if employee_id:
            query = query.filter(models.Attendance.employee_id == employee_id)

    if status_filter and status_filter != "all":
        query = query.filter(models.Attendance.status == status_filter)

    records = query.order_by(models.Attendance.date.desc()).limit(100).all()

    result = []
    for r in records:
        result.append({
            "id": r.id,
            "employee_id": r.employee_id,
            "date": r.date,
            "check_in": r.check_in,
            "check_out": r.check_out,
            "status": r.status,
            "work_hours": r.work_hours or 0.0,
            "notes": r.notes,
            "employee_name": r.employee.user.name,
            "employee_code": r.employee.user.employee_id,
            "department": r.employee.department
        })
    return result
