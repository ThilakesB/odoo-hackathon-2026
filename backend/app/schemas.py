from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, datetime

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    employee_id: str
    name: str
    email: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserRegister(BaseModel):
    employee_id: str = Field(..., example="EMP-1001")
    name: str = Field(..., example="Alex Rivera")
    email: EmailStr = Field(..., example="alex.rivera@dayflow.io")
    password: str = Field(..., min_length=6, example="secret123")
    role: str = Field("employee", example="employee") # "employee" or "admin"
    department: Optional[str] = "Engineering"
    designation: Optional[str] = "Software Engineer"
    phone: Optional[str] = None
    address: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr = Field(..., example="alex.rivera@dayflow.io")
    password: str = Field(..., example="secret123")

class UserOut(BaseModel):
    id: int
    employee_id: str
    name: str
    email: EmailStr
    role: str
    is_verified: bool
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Employee Profile Schemas ---
class EmployeeOut(BaseModel):
    id: int
    user_id: int
    department: str
    designation: str
    joining_date: Optional[date] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    profile_picture: Optional[str] = None
    emergency_contact: Optional[str] = None
    work_location: Optional[str] = None
    leave_balance_paid: int
    leave_balance_sick: int
    leave_balance_unpaid: int
    user: UserOut

    class Config:
        from_attributes = True

class EmployeeUpdate(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None
    profile_picture: Optional[str] = None
    emergency_contact: Optional[str] = None
    # Admin-only fields
    department: Optional[str] = None
    designation: Optional[str] = None
    work_location: Optional[str] = None
    leave_balance_paid: Optional[int] = None
    leave_balance_sick: Optional[int] = None
    leave_balance_unpaid: Optional[int] = None

# --- Attendance Schemas ---
class AttendanceCreate(BaseModel):
    date: Optional[date] = None
    check_in: Optional[str] = None
    notes: Optional[str] = None

class AttendanceCheckOut(BaseModel):
    check_out: Optional[str] = None
    notes: Optional[str] = None

class AttendanceOut(BaseModel):
    id: int
    employee_id: int
    date: date
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    status: str
    work_hours: float
    notes: Optional[str] = None
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    department: Optional[str] = None

    class Config:
        from_attributes = True

class AttendanceSummary(BaseModel):
    today_status: str
    checked_in: bool
    checked_out: bool
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    work_hours_today: float
    total_days_present_month: int
    total_days_absent_month: int
    attendance_rate: float

# --- Leave Schemas ---
class LeaveApply(BaseModel):
    leave_type: str = Field(..., example="paid") # paid, sick, unpaid
    start_date: date
    end_date: date
    reason: str = Field(..., min_length=3)

class LeaveStatusUpdate(BaseModel):
    status: str = Field(..., example="approved") # approved, rejected
    admin_comment: Optional[str] = None

class LeaveOut(BaseModel):
    id: int
    employee_id: int
    leave_type: str
    start_date: date
    end_date: date
    total_days: int
    reason: str
    status: str
    admin_comment: Optional[str] = None
    applied_at: datetime
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    department: Optional[str] = None

    class Config:
        from_attributes = True

# --- Payroll Schemas ---
class PayrollCreate(BaseModel):
    employee_id: int
    month: str
    year: int
    basic_salary: float
    allowances: float
    deductions: float
    tax: float
    payment_status: Optional[str] = "paid"

class PayrollOut(BaseModel):
    id: int
    employee_id: int
    month: str
    year: int
    basic_salary: float
    allowances: float
    deductions: float
    tax: float
    net_salary: float
    payment_status: str
    payment_date: Optional[date] = None
    payslip_url: Optional[str] = None
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None

    class Config:
        from_attributes = True

# --- Notification Schemas ---
class NotificationOut(BaseModel):
    id: int
    employee_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- AI Assistant Schemas ---
class AIChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []

class AIChatResponse(BaseModel):
    reply: str
    action_type: Optional[str] = None # "none", "leave_applied", "show_payroll", "show_attendance"
    action_payload: Optional[dict] = None
