from datetime import date, timedelta, datetime, timezone
from app.database import SessionLocal, engine, Base
from app import models
from app.auth import get_password_hash

def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Seeding Dayflow HRMS Database...")
        # (models creation code)


        # 1. Admin User
        admin_user = models.User(
            employee_id="DF-ADMIN-01",
            name="Elena Rostova",
            email="admin@dayflow.io",
            password_hash=get_password_hash("admin123"),
            role="admin",
            is_verified=True,
            avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        admin_profile = models.Employee(
            user_id=admin_user.id,
            department="People & Culture",
            designation="VP of Human Resources",
            joining_date=date(2022, 1, 15),
            phone="+1 (555) 234-5678",
            address="742 Evergreen Terrace, San Francisco, CA",
            profile_picture="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
            emergency_contact="Mark Rostova (+1 555-987-6543)",
            work_location="San Francisco HQ (Hybrid)",
            leave_balance_paid=22,
            leave_balance_sick=12,
            leave_balance_unpaid=15
        )
        db.add(admin_profile)

        # 2. Key Employees
        employees_data = [
            {
                "emp_id": "DF-EMP-101",
                "name": "Alex Rivera",
                "email": "alex.rivera@dayflow.io",
                "role": "employee",
                "department": "Engineering",
                "designation": "Senior Frontend Architect",
                "phone": "+1 (555) 345-6789",
                "address": "1204 Market Street, Apt 5B, San Francisco, CA",
                "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                "joining": date(2023, 3, 1),
                "salary": 7500.0,
                "allowance": 1800.0,
                "deduction": 450.0,
                "tax": 650.0
            },
            {
                "emp_id": "DF-EMP-102",
                "name": "Sarah Chen",
                "email": "sarah.chen@dayflow.io",
                "role": "employee",
                "department": "Product Design",
                "designation": "Staff UI/UX Designer",
                "phone": "+1 (555) 456-7890",
                "address": "88 King Street, Seattle, WA",
                "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
                "joining": date(2023, 6, 15),
                "salary": 7000.0,
                "allowance": 1500.0,
                "deduction": 400.0,
                "tax": 600.0
            },
            {
                "emp_id": "DF-EMP-103",
                "name": "Marcus Vance",
                "email": "marcus.vance@dayflow.io",
                "role": "employee",
                "department": "Engineering",
                "designation": "Cloud Infrastructure Lead",
                "phone": "+1 (555) 567-8901",
                "address": "450 Austin Ave, Austin, TX",
                "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
                "joining": date(2022, 11, 10),
                "salary": 8200.0,
                "allowance": 2000.0,
                "deduction": 500.0,
                "tax": 750.0
            },
            {
                "emp_id": "DF-EMP-104",
                "name": "Priya Patel",
                "email": "priya.patel@dayflow.io",
                "role": "employee",
                "department": "Marketing",
                "designation": "Growth Marketing Lead",
                "phone": "+1 (555) 678-9012",
                "address": "15 Wall Street, New York, NY",
                "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
                "joining": date(2024, 1, 8),
                "salary": 6500.0,
                "allowance": 1400.0,
                "deduction": 350.0,
                "tax": 550.0
            }
        ]

        created_employees = [admin_profile]

        for item in employees_data:
            user = models.User(
                employee_id=item["emp_id"],
                name=item["name"],
                email=item["email"],
                password_hash=get_password_hash("employee123"),
                role="employee",
                is_verified=True,
                avatar_url=item["avatar"]
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            emp = models.Employee(
                user_id=user.id,
                department=item["department"],
                designation=item["designation"],
                joining_date=item["joining"],
                phone=item["phone"],
                address=item["address"],
                profile_picture=item["avatar"],
                work_location="Remote (Global)",
                leave_balance_paid=16,
                leave_balance_sick=10,
                leave_balance_unpaid=12
            )
            db.add(emp)
            db.commit()
            db.refresh(emp)
            created_employees.append(emp)

            # Notifications
            n1 = models.Notification(
                employee_id=emp.id,
                title="Welcome to Dayflow ✨",
                message=f"Hi {item['name']}, your HR dashboard is active. You can track attendance and check payslips anytime.",
                type="success"
            )
            n2 = models.Notification(
                employee_id=emp.id,
                title="Company Holiday Announcement 🏖️",
                message="Upcoming Labor Day Weekend on Monday. Office will remain closed.",
                type="info"
            )
            db.add_all([n1, n2])

            # Payroll history (3 months)
            months = [("July", 2025), ("June", 2025), ("May", 2025)]
            for m, y in months:
                net = item["salary"] + item["allowance"] - item["deduction"] - item["tax"]
                pay = models.Payroll(
                    employee_id=emp.id,
                    month=m,
                    year=y,
                    basic_salary=item["salary"],
                    allowances=item["allowance"],
                    deductions=item["deduction"],
                    tax=item["tax"],
                    net_salary=round(net, 2),
                    payment_status="paid",
                    payment_date=date(y, 7 if m == "July" else (6 if m == "June" else 5), 28)
                )
                db.add(pay)

        db.commit()

        # 3. Attendance Records for last 14 days
        today = date.today()
        for emp in created_employees:
            for i in range(14, 0, -1):
                day_date = today - timedelta(days=i)
                # Skip weekends
                if day_date.weekday() in [5, 6]:
                    continue

                status_val = "present"
                hours = 8.5
                c_in = "09:05 AM"
                c_out = "05:35 PM"

                # Randomize occasional half-day or absence
                if i == 5 and emp.id == created_employees[1].id:
                    status_val = "half_day"
                    hours = 4.2
                    c_out = "01:15 PM"
                elif i == 9 and emp.id == created_employees[2].id:
                    status_val = "absent"
                    hours = 0.0
                    c_in = None
                    c_out = None

                att = models.Attendance(
                    employee_id=emp.id,
                    date=day_date,
                    check_in=c_in,
                    check_out=c_out,
                    status=status_val,
                    work_hours=hours,
                    notes="Regular remote check-in" if status_val == "present" else "Doctor appointment"
                )
                db.add(att)

            # Today record (Check-in already done for demo realism)
            today_att = models.Attendance(
                employee_id=emp.id,
                date=today,
                check_in="09:00 AM",
                check_out=None,
                status="present",
                work_hours=3.5,
                notes="Morning sync completed"
            )
            db.add(today_att)

        # 4. Leave Requests
        # Pending leave for Alex Rivera
        alex_emp = created_employees[1]
        l1 = models.LeaveRequest(
            employee_id=alex_emp.id,
            leave_type="paid",
            start_date=today + timedelta(days=5),
            end_date=today + timedelta(days=7),
            total_days=3,
            reason="Family vacation to Yosemite National Park.",
            status="pending"
        )
        # Approved leave for Sarah Chen
        sarah_emp = created_employees[2]
        l2 = models.LeaveRequest(
            employee_id=sarah_emp.id,
            leave_type="sick",
            start_date=today - timedelta(days=12),
            end_date=today - timedelta(days=11),
            total_days=2,
            reason="Flu and viral recovery.",
            status="approved",
            admin_comment="Approved. Take care and get well soon!"
        )
        # Rejected request for Marcus
        marcus_emp = created_employees[3]
        l3 = models.LeaveRequest(
            employee_id=marcus_emp.id,
            leave_type="paid",
            start_date=today + timedelta(days=1),
            end_date=today + timedelta(days=4),
            total_days=4,
            reason="Spontaneous road trip.",
            status="rejected",
            admin_comment="Critical release sprint scheduled this week. Please reschedule after deploy."
        )
        db.add_all([l1, l2, l3])

        print("Dayflow Database seeded successfully!")
        print("   Admin Login: admin@dayflow.io / admin123")
        print("   Employee Login: alex.rivera@dayflow.io / employee123")

    except Exception as e:
        db.rollback()
        print("Error seeding database:", e)
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
