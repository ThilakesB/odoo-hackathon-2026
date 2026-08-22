from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="employee")  # "employee" or "admin"
    is_verified = Column(Boolean, default=True)
    avatar_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # 1-to-1 relationship with Employee profile
    employee_profile = relationship("Employee", back_populates="user", uselist=False, cascade="all, delete-orphan")

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    department = Column(String(100), default="Engineering")
    designation = Column(String(100), default="Software Engineer")
    joining_date = Column(Date, nullable=True)
    phone = Column(String(30), nullable=True)
    address = Column(Text, nullable=True)
    profile_picture = Column(Text, nullable=True)
    emergency_contact = Column(String(100), nullable=True)
    work_location = Column(String(100), default="Remote / Hybrid")
    
    # Leave Balances
    leave_balance_paid = Column(Integer, default=18)
    leave_balance_sick = Column(Integer, default=12)
    leave_balance_unpaid = Column(Integer, default=10)

    # Relationships
    user = relationship("User", back_populates="employee_profile")
    attendance_records = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    leave_requests = relationship("LeaveRequest", back_populates="employee", cascade="all, delete-orphan")
    payrolls = relationship("Payroll", back_populates="employee", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="employee", cascade="all, delete-orphan")

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    check_in = Column(String(30), nullable=True)   # e.g., "09:02 AM"
    check_out = Column(String(30), nullable=True)  # e.g., "05:45 PM"
    status = Column(String(20), default="present") # "present", "absent", "half_day", "leave"
    work_hours = Column(Float, default=0.0)
    notes = Column(String(255), nullable=True)

    employee = relationship("Employee", back_populates="attendance_records")

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    leave_type = Column(String(30), nullable=False) # "paid", "sick", "unpaid"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_days = Column(Integer, default=1)
    reason = Column(Text, nullable=False)
    status = Column(String(20), default="pending")  # "pending", "approved", "rejected"
    admin_comment = Column(Text, nullable=True)
    applied_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    employee = relationship("Employee", back_populates="leave_requests")

class Payroll(Base):
    __tablename__ = "payroll"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    month = Column(String(20), nullable=False) # e.g. "August"
    year = Column(Integer, nullable=False)     # e.g. 2025
    basic_salary = Column(Float, default=5000.0)
    allowances = Column(Float, default=1200.0) # HRA, Travel, Performance
    deductions = Column(Float, default=300.0)  # Health insurance, PF
    tax = Column(Float, default=400.0)
    net_salary = Column(Float, default=5500.0)
    payment_status = Column(String(20), default="paid") # "paid", "pending", "processing"
    payment_date = Column(Date, nullable=True)
    payslip_url = Column(String(255), nullable=True)

    employee = relationship("Employee", back_populates="payrolls")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info") # "info", "success", "warning", "alert"
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    employee = relationship("Employee", back_populates="notifications")
