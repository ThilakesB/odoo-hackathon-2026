from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, require_admin

router = APIRouter(prefix="/employees", tags=["Employees"])

@router.get("/me", response_model=schemas.EmployeeOut)
def get_my_profile(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not emp:
        # Auto-create profile if missing
        emp = models.Employee(user_id=current_user.id)
        db.add(emp)
        db.commit()
        db.refresh(emp)
    return emp

@router.put("/me", response_model=schemas.EmployeeOut)
def update_my_profile(
    emp_update: schemas.EmployeeUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    emp = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee record not found")
    
    if emp_update.phone is not None:
        emp.phone = emp_update.phone
    if emp_update.address is not None:
        emp.address = emp_update.address
    if emp_update.profile_picture is not None:
        emp.profile_picture = emp_update.profile_picture
        current_user.avatar_url = emp_update.profile_picture
    if emp_update.emergency_contact is not None:
        emp.emergency_contact = emp_update.emergency_contact

    db.commit()
    db.refresh(emp)
    return emp

@router.get("", response_model=List[schemas.EmployeeOut])
def list_employees(
    department: Optional[str] = None,
    search: Optional[str] = None,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(models.Employee).join(models.User)
    
    if department and department != "All":
        query = query.filter(models.Employee.department == department)
        
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (models.User.name.ilike(search_fmt)) |
            (models.User.email.ilike(search_fmt)) |
            (models.User.employee_id.ilike(search_fmt)) |
            (models.Employee.designation.ilike(search_fmt))
        )
        
    return query.all()

@router.get("/{id}", response_model=schemas.EmployeeOut)
def get_employee(
    id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    emp = db.query(models.Employee).filter(models.Employee.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    if current_user.role != "admin" and emp.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    return emp

@router.put("/{id}", response_model=schemas.EmployeeOut)
def admin_update_employee(
    id: int,
    emp_update: schemas.EmployeeUpdate,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    emp = db.query(models.Employee).filter(models.Employee.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    for field, value in emp_update.dict(exclude_unset=True).items():
        setattr(emp, field, value)
        
    db.commit()
    db.refresh(emp)
    return emp

@router.get("/me/notifications", response_model=List[schemas.NotificationOut])
def get_notifications(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    emp = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not emp:
        return []
    return db.query(models.Notification).filter(models.Notification.employee_id == emp.id).order_by(models.Notification.created_at.desc()).limit(20).all()

@router.put("/me/notifications/{notif_id}/read")
def mark_notification_read(
    notif_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    emp = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    notif = db.query(models.Notification).filter(
        models.Notification.id == notif_id,
        models.Notification.employee_id == emp.id
    ).first()
    
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "ok"}
