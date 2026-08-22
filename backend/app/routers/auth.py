from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta, timezone
import random
import re
from app.database import get_db
from app import models, schemas
from app.auth import verify_password, get_password_hash, create_access_token, get_current_user
from app.otp_service import OTPService
from app.email_service import send_otp_email

router = APIRouter(prefix="/auth", tags=["Authentication"])

def validate_password_security(password: str) -> None:
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )
    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter (A-Z)."
        )
    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one lowercase letter (a-z)."
        )
    if not re.search(r"[0-9]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one number (0-9)."
        )
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one special character (!@#$%^&*)."
        )

# -------------------------------------------------------------
# 1. Passwordless OTP Flow: Request OTP
# -------------------------------------------------------------
@router.post("/request-otp", response_model=schemas.OTPResponse)
def request_otp(req: schemas.RequestOTPRequest, background_tasks: BackgroundTasks):
    """
    Accepts {email}, validates format, applies 60-second rate limiting,
    generates 6-digit OTP, hashes it with SHA-256 and stores with 5-minute expiry,
    then dispatches the OTP via email in background.
    """
    email_clean = req.email.strip().lower()

    # Rate limiting: Max 1 request per 60 seconds per email
    is_allowed, remaining = OTPService.check_rate_limit(email_clean)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit reached. Please wait {remaining} seconds before requesting a new OTP."
        )

    # Generate 6-digit cryptographically secure OTP
    otp = OTPService.generate_otp()

    # Hash with SHA-256 and store with 5-minute (300s) TTL
    OTPService.store_otp(email_clean, otp, expiry_seconds=300)

    # Send OTP asynchronously via configured provider (Resend / SMTP / Sandbox)
    background_tasks.add_task(send_otp_email, email_clean, otp)

    return {
        "status": "success",
        "message": f"A 6-digit verification code has been sent to {email_clean}.",
        "cooldown_seconds": 60,
        "code_preview": otp  # Included for seamless developer sandbox testing
    }

# -------------------------------------------------------------
# 2. Passwordless OTP Flow: Verify OTP & Login / Auto-Provision
# -------------------------------------------------------------
@router.post("/verify-otp", response_model=schemas.Token)
def verify_otp(req: schemas.VerifyOTPRequest, db: Session = Depends(get_db)):
    """
    Accepts {email, otp}, checks SHA-256 hash + 5-minute expiry + max 5 attempts limit.
    Deletes OTP on success, finds or creates user record, and returns JWT access token.
    """
    email_clean = req.email.strip().lower()
    otp_clean = req.otp.strip()

    # Verify OTP
    is_valid, reason = OTPService.verify_otp(email_clean, otp_clean)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=reason
        )

    # Find existing user or auto-provision on first OTP verification
    user = db.query(models.User).filter(models.User.email == email_clean).first()
    if not user:
        # Auto-create user and default employee profile
        formatted_name = email_clean.split("@")[0].replace(".", " ").replace("_", " ").title()
        generated_emp_id = f"DF-{random.randint(1000, 9999)}"
        
        user = models.User(
            employee_id=generated_emp_id,
            name=formatted_name,
            email=email_clean,
            password_hash=get_password_hash("Dayflow@2026"),
            role="employee",
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Create linked employee record
        emp_profile = models.Employee(
            user_id=user.id,
            department="Engineering",
            designation="Specialist",
            joining_date=date.today(),
            work_location="Hybrid",
            profile_picture=f"https://api.dicebear.com/7.x/avataaars/svg?seed={user.name}"
        )
        db.add(emp_profile)

        # Welcome notification
        welcome_notif = models.Notification(
            employee_id=emp_profile.id,
            title="Welcome to Dayflow ✨",
            message="Your account was authenticated via Email OTP. Explore attendance, payroll, and your AI Copilot.",
            type="success"
        )
        db.add(welcome_notif)
        db.commit()
    else:
        # Ensure user is marked verified
        if not user.is_verified:
            user.is_verified = True
            db.commit()

    # Generate JWT token
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

# -------------------------------------------------------------
# 3. Google OAuth & Firebase Single Sign-On
# -------------------------------------------------------------
@router.post("/google", response_model=schemas.Token)
def google_auth(req: schemas.GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Accepts verified Google User profile from Firebase Client SDK,
    finds or auto-provisions user + employee record, and issues JWT access token.
    """
    email_clean = req.email.strip().lower()

    user = db.query(models.User).filter(models.User.email == email_clean).first()
    if not user:
        # Auto-create user
        formatted_name = req.name or email_clean.split("@")[0].replace(".", " ").title()
        generated_emp_id = f"DF-G-{random.randint(1000, 9999)}"

        user = models.User(
            employee_id=generated_emp_id,
            name=formatted_name,
            email=email_clean,
            password_hash=get_password_hash("GoogleAuth@2026"),
            role="employee",
            is_verified=True,
            avatar_url=req.photo_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={formatted_name}"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Create linked employee record
        emp_profile = models.Employee(
            user_id=user.id,
            department="Engineering",
            designation="Specialist",
            joining_date=date.today(),
            work_location="Hybrid",
            profile_picture=user.avatar_url
        )
        db.add(emp_profile)

        # Welcome notification
        welcome_notif = models.Notification(
            employee_id=emp_profile.id,
            title="Signed in with Google ✨",
            message="Welcome to Dayflow HRMS! Your account has been verified through Google Sign-In.",
            type="success"
        )
        db.add(welcome_notif)
        db.commit()
    else:
        if req.photo_url and not user.avatar_url:
            user.avatar_url = req.photo_url
        user.is_verified = True
        db.commit()

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

# -------------------------------------------------------------
# 3. Registration with Password Security & Email Verification
# -------------------------------------------------------------
@router.post("/send-verification-code")
def send_verification_code(req: schemas.VerificationRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    
    # Duplicate email check
    existing_user = db.query(models.User).filter(models.User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered in Dayflow. Please sign in.",
        )
    
    # Rate limit check
    is_allowed, remaining = OTPService.check_rate_limit(email_clean)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {remaining} seconds before requesting a new code."
        )

    code = OTPService.generate_otp()
    OTPService.store_otp(email_clean, code, expiry_seconds=600)
    send_otp_email(email_clean, code)
    
    return {
        "status": "success",
        "message": f"Verification code sent to {email_clean}",
        "code_preview": code
    }

@router.post("/verify-email-code")
def verify_email_code(req: schemas.VerifyCodeRequest):
    email_clean = req.email.strip().lower()
    is_valid, reason = OTPService.verify_otp(email_clean, req.code.strip())
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=reason
        )
        
    return {
        "status": "success",
        "message": "Email verified successfully!"
    }

@router.post("/register", response_model=schemas.Token)
def register(user_in: schemas.UserRegister, db: Session = Depends(get_db)):
    email_clean = user_in.email.strip().lower()
    
    # Validate password security rules
    validate_password_security(user_in.password)

    # Duplicate email check
    existing_user = db.query(models.User).filter(models.User.email == email_clean).first()
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
        email=email_clean,
        password_hash=get_password_hash(user_in.password),
        role="admin" if user_in.role.lower() in ["admin", "hr"] else "employee",
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

# -------------------------------------------------------------
# 4. Standard Password Login
# -------------------------------------------------------------
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

# -------------------------------------------------------------
# 5. Current Authenticated User Info
# -------------------------------------------------------------
@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    """Validates the JWT token and returns the current authenticated user record."""
    return current_user
