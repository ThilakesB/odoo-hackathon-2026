from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, require_admin

router = APIRouter(prefix="/payroll", tags=["Payroll"])

@router.get("", response_model=List[schemas.PayrollOut])
def get_payrolls(
    month: Optional[str] = None,
    year: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Payroll).join(models.Employee).join(models.User)

    if current_user.role != "admin":
        emp = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
        if not emp:
            return []
        query = query.filter(models.Payroll.employee_id == emp.id)

    if month and month != "All":
        query = query.filter(models.Payroll.month == month)
    if year:
        query = query.filter(models.Payroll.year == year)

    records = query.order_by(models.Payroll.year.desc(), models.Payroll.id.desc()).all()

    result = []
    for p in records:
        result.append({
            "id": p.id,
            "employee_id": p.employee_id,
            "month": p.month,
            "year": p.year,
            "basic_salary": p.basic_salary,
            "allowances": p.allowances,
            "deductions": p.deductions,
            "tax": p.tax,
            "net_salary": p.net_salary,
            "payment_status": p.payment_status,
            "payment_date": p.payment_date,
            "payslip_url": p.payslip_url,
            "employee_name": p.employee.user.name,
            "employee_code": p.employee.user.employee_id,
            "department": p.employee.department,
            "designation": p.employee.designation
        })
    return result

@router.get("/{id}", response_model=schemas.PayrollOut)
def get_payroll_by_id(
    id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    p = db.query(models.Payroll).filter(models.Payroll.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payroll record not found")

    emp = db.query(models.Employee).filter(models.Employee.id == p.employee_id).first()
    if current_user.role != "admin" and emp.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    return {
        "id": p.id,
        "employee_id": p.employee_id,
        "month": p.month,
        "year": p.year,
        "basic_salary": p.basic_salary,
        "allowances": p.allowances,
        "deductions": p.deductions,
        "tax": p.tax,
        "net_salary": p.net_salary,
        "payment_status": p.payment_status,
        "payment_date": p.payment_date,
        "payslip_url": p.payslip_url,
        "employee_name": emp.user.name,
        "employee_code": emp.user.employee_id,
        "department": emp.department,
        "designation": emp.designation
    }

@router.post("", response_model=schemas.PayrollOut)
def create_payroll(
    data: schemas.PayrollCreate,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    emp = db.query(models.Employee).filter(models.Employee.id == data.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    net_sal = data.basic_salary + data.allowances - data.deductions - data.tax
    payroll = models.Payroll(
        employee_id=data.employee_id,
        month=data.month,
        year=data.year,
        basic_salary=data.basic_salary,
        allowances=data.allowances,
        deductions=data.deductions,
        tax=data.tax,
        net_salary=round(net_sal, 2),
        payment_status=data.payment_status or "paid",
        payment_date=date.today()
    )
    db.add(payroll)

    # Notify employee
    notif = models.Notification(
        employee_id=emp.id,
        title="Payslip Generated 💵",
        message=f"Your payslip for {data.month} {data.year} (Net: ${net_sal:,.2f}) is now available in your portal.",
        type="success"
    )
    db.add(notif)
    db.commit()
    db.refresh(payroll)

    return {
        "id": payroll.id,
        "employee_id": payroll.employee_id,
        "month": payroll.month,
        "year": payroll.year,
        "basic_salary": payroll.basic_salary,
        "allowances": payroll.allowances,
        "deductions": payroll.deductions,
        "tax": payroll.tax,
        "net_salary": payroll.net_salary,
        "payment_status": payroll.payment_status,
        "payment_date": payroll.payment_date,
        "payslip_url": payroll.payslip_url,
        "employee_name": emp.user.name,
        "employee_code": emp.user.employee_id,
        "department": emp.department,
        "designation": emp.designation
    }

@router.put("/{id}", response_model=schemas.PayrollOut)
def update_payroll(
    id: int,
    data: schemas.PayrollCreate,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    payroll = db.query(models.Payroll).filter(models.Payroll.id == id).first()
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll record not found")

    emp = db.query(models.Employee).filter(models.Employee.id == payroll.employee_id).first()

    payroll.basic_salary = data.basic_salary
    payroll.allowances = data.allowances
    payroll.deductions = data.deductions
    payroll.tax = data.tax
    payroll.net_salary = round(data.basic_salary + data.allowances - data.deductions - data.tax, 2)
    payroll.payment_status = data.payment_status or payroll.payment_status

    db.commit()
    db.refresh(payroll)

    return {
        "id": payroll.id,
        "employee_id": payroll.employee_id,
        "month": payroll.month,
        "year": payroll.year,
        "basic_salary": payroll.basic_salary,
        "allowances": payroll.allowances,
        "deductions": payroll.deductions,
        "tax": payroll.tax,
        "net_salary": payroll.net_salary,
        "payment_status": payroll.payment_status,
        "payment_date": payroll.payment_date,
        "payslip_url": payroll.payslip_url,
        "employee_name": emp.user.name,
        "employee_code": emp.user.employee_id,
        "department": emp.department,
        "designation": emp.designation
    }
