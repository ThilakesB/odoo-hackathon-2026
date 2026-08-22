from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, require_admin

router = APIRouter(prefix="/leave", tags=["Leave Management"])

@router.get("/balances")
def get_leave_balances(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Also calculate pending requests
    pending_days = sum(
        r.total_days for r in db.query(models.LeaveRequest).filter(
            models.LeaveRequest.employee_id == emp.id,
            models.LeaveRequest.status == "pending"
        ).all()
    )
    
    return {
        "paid": emp.leave_balance_paid,
        "sick": emp.leave_balance_sick,
        "unpaid": emp.leave_balance_unpaid,
        "total_available": emp.leave_balance_paid + emp.leave_balance_sick + emp.leave_balance_unpaid,
        "pending_days": pending_days
    }

@router.post("", response_model=schemas.LeaveOut)
def apply_leave(
    leave_in: schemas.LeaveApply,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    emp = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    if leave_in.end_date < leave_in.start_date:
        raise HTTPException(status_code=400, detail="End date cannot be earlier than start date")

    # Calculate days
    delta = (leave_in.end_date - leave_in.start_date).days + 1
    
    # Check leave type balance
    if leave_in.leave_type == "paid" and emp.leave_balance_paid < delta:
        raise HTTPException(status_code=400, detail=f"Insufficient paid leave balance. Available: {emp.leave_balance_paid} days")
    elif leave_in.leave_type == "sick" and emp.leave_balance_sick < delta:
        raise HTTPException(status_code=400, detail=f"Insufficient sick leave balance. Available: {emp.leave_balance_sick} days")

    new_leave = models.LeaveRequest(
        employee_id=emp.id,
        leave_type=leave_in.leave_type,
        start_date=leave_in.start_date,
        end_date=leave_in.end_date,
        total_days=delta,
        reason=leave_in.reason,
        status="pending"
    )
    db.add(new_leave)
    
    # Notification for employee
    notif = models.Notification(
        employee_id=emp.id,
        title="Leave Request Submitted 📅",
        message=f"Your request for {delta} day(s) of {leave_in.leave_type.capitalize()} leave ({leave_in.start_date} to {leave_in.end_date}) was submitted for review.",
        type="info"
    )
    db.add(notif)
    db.commit()
    db.refresh(new_leave)

    return {
        "id": new_leave.id,
        "employee_id": new_leave.employee_id,
        "leave_type": new_leave.leave_type,
        "start_date": new_leave.start_date,
        "end_date": new_leave.end_date,
        "total_days": new_leave.total_days,
        "reason": new_leave.reason,
        "status": new_leave.status,
        "admin_comment": new_leave.admin_comment,
        "applied_at": new_leave.applied_at,
        "employee_name": current_user.name,
        "employee_code": current_user.employee_id,
        "department": emp.department
    }

@router.get("", response_model=List[schemas.LeaveOut])
def get_leave_requests(
    status_filter: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.LeaveRequest).join(models.Employee).join(models.User)

    if current_user.role != "admin":
        emp = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
        if not emp:
            return []
        query = query.filter(models.LeaveRequest.employee_id == emp.id)

    if status_filter and status_filter != "all":
        query = query.filter(models.LeaveRequest.status == status_filter)

    leaves = query.order_by(models.LeaveRequest.applied_at.desc()).all()

    result = []
    for l in leaves:
        result.append({
            "id": l.id,
            "employee_id": l.employee_id,
            "leave_type": l.leave_type,
            "start_date": l.start_date,
            "end_date": l.end_date,
            "total_days": l.total_days,
            "reason": l.reason,
            "status": l.status,
            "admin_comment": l.admin_comment,
            "applied_at": l.applied_at,
            "employee_name": l.employee.user.name,
            "employee_code": l.employee.user.employee_id,
            "department": l.employee.department
        })
    return result

@router.put("/{id}", response_model=schemas.LeaveOut)
def update_leave_status(
    id: int,
    status_update: schemas.LeaveStatusUpdate,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    leave = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    old_status = leave.status
    leave.status = status_update.status
    leave.admin_comment = status_update.admin_comment

    emp = db.query(models.Employee).filter(models.Employee.id == leave.employee_id).first()

    # If status transitioned to approved, deduct balance
    if status_update.status == "approved" and old_status != "approved":
        if leave.leave_type == "paid":
            emp.leave_balance_paid = max(0, emp.leave_balance_paid - leave.total_days)
        elif leave.leave_type == "sick":
            emp.leave_balance_sick = max(0, emp.leave_balance_sick - leave.total_days)
        elif leave.leave_type == "unpaid":
            emp.leave_balance_unpaid = max(0, emp.leave_balance_unpaid - leave.total_days)

        # Notify employee
        notif = models.Notification(
            employee_id=emp.id,
            title="Leave Request Approved! 🎉",
            message=f"Your {leave.leave_type.capitalize()} leave for {leave.start_date} to {leave.end_date} has been approved by HR.",
            type="success"
        )
        db.add(notif)
    elif status_update.status == "rejected" and old_status != "rejected":
        # If previously approved, restore balance
        if old_status == "approved":
            if leave.leave_type == "paid":
                emp.leave_balance_paid += leave.total_days
            elif leave.leave_type == "sick":
                emp.leave_balance_sick += leave.total_days
            elif leave.leave_type == "unpaid":
                emp.leave_balance_unpaid += leave.total_days

        # Notify employee
        notif = models.Notification(
            employee_id=emp.id,
            title="Leave Request Update 📋",
            message=f"Your {leave.leave_type.capitalize()} leave request was rejected. Note: {status_update.admin_comment or 'No comment provided'}",
            type="warning"
        )
        db.add(notif)

    db.commit()
    db.refresh(leave)

    return {
        "id": leave.id,
        "employee_id": leave.employee_id,
        "leave_type": leave.leave_type,
        "start_date": leave.start_date,
        "end_date": leave.end_date,
        "total_days": leave.total_days,
        "reason": leave.reason,
        "status": leave.status,
        "admin_comment": leave.admin_comment,
        "applied_at": leave.applied_at,
        "employee_name": emp.user.name,
        "employee_code": emp.user.employee_id,
        "department": emp.department
    }
