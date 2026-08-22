from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from app.database import get_db
from app import models, schemas
from app.auth import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.Token)
def register(user_in: schemas.UserRegister, db: Session = Depends(get_db)):
    # Duplicate email check
    existing_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered in Dayflow",
        )
    
    # Duplicate employee_id check
    existing_emp = db.query(models.User).filter(models.User.employee_id == user_in.employee_id).first()
    if existing_emp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee ID is already in use",
        )
    
    # Create user
    new_user = models.User(
        employee_id=user_in.employee_id,
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role if user_in.role in ["admin", "employee"] else "employee",
        is_verified=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create associated employee profile
    employee_profile = models.Employee(
        user_id=new_user.id,
        department=user_in.department or "Engineering",
        designation=user_in.designation or "Associate",
        joining_date=date.today(),
        phone=user_in.phone,
        address=user_in.address,
        work_location="Remote / Hybrid"
    )
    db.add(employee_profile)

    # Create default notification
    welcome_notif = models.Notification(
        employee_id=employee_profile.id,
        title="Welcome to Dayflow! ✨",
        message="Your Dayflow workspace is ready. You can track attendance, request leave, and talk to your AI HR Assistant.",
        type="success"
    )
    db.add(welcome_notif)
    db.commit()

    # Generate JWT token
    access_token = create_access_token(data={"sub": new_user.email, "role": new_user.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": new_user.role,
        "user_id": new_user.id,
        "employee_id": new_user.employee_id,
        "name": new_user.name,
        "email": new_user.email
    }

@router.post("/login", response_model=schemas.Token)
def login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "employee_id": user.employee_id,
        "name": user.name,
        "email": user.email
    }

@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
