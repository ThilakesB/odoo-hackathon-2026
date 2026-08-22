from datetime import date, timedelta
from app.database import SessionLocal, engine, Base
from app import models
from app.auth import get_password_hash

def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Seeding Libreo HRMS Database with custom organization users...")

        # 1. HR Admin: thilskeb@gmail.com / admin@123
        admin_user = models.User(
            employee_id="LIB-ADMIN-01",
            name="Thilakeswaran (HR Admin)",
            email="thilskeb@gmail.com",
            password_hash=get_password_hash("admin@123"),
            role="admin",
            is_verified=True,
            avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        admin_profile = models.Employee(
            user_id=admin_user.id,
            department="Human Resources",
            designation="VP of People Operations",
            joining_date=date.today(),
            phone="+91 98765 43210",
            address="Corporate HQ",
            profile_picture="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
            emergency_contact="Emergency Contact (+91 98765 00000)",
            work_location="Main Office (Hybrid)",
            leave_balance_paid=22,
            leave_balance_sick=12,
            leave_balance_unpaid=10
        )
        db.add(admin_profile)

        # 2. Employees defined by User:
        employees_data = [
            {
                "emp_id": "LIB-EMP-101",
                "name": "Sanjai",
                "email": "sanjai@gmail.com",
                "password": "sanjai@2006",
                "department": "Engineering",
                "designation": "Software Engineer",
                "salary": 75000.0,
                "allowance": 15000.0,
                "deduction": 4500.0,
                "tax": 6000.0
            },
            {
                "emp_id": "LIB-EMP-102",
                "name": "Santhiya",
                "email": "santhiya@gmail.com",
                "password": "Santhiya@2006",
                "department": "Product Design",
                "designation": "UI/UX Product Designer",
                "salary": 70000.0,
                "allowance": 14000.0,
                "deduction": 4000.0,
                "tax": 5500.0
            },
            {
                "emp_id": "LIB-EMP-103",
                "name": "Preevena",
                "email": "preevena@gmail.com",
                "password": "Prevvena@2006",
                "department": "Marketing & Growth",
                "designation": "Marketing Strategist",
                "salary": 68000.0,
                "allowance": 12000.0,
                "deduction": 3800.0,
                "tax": 5200.0
            },
        ]

        created_employees = [admin_profile]

        for item in employees_data:
            user = models.User(
                employee_id=item["emp_id"],
                name=item["name"],
                email=item["email"],
                password_hash=get_password_hash(item["password"]),
                role="employee",
                is_verified=True,
                avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={item['name']}"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            emp = models.Employee(
                user_id=user.id,
                department=item["department"],
                designation=item["designation"],
                joining_date=date.today(),
                phone="+91 98765 11111",
                address="Remote Office",
                profile_picture=f"https://api.dicebear.com/7.x/avataaars/svg?seed={item['name']}",
                work_location="Remote / Hybrid",
                leave_balance_paid=18,
                leave_balance_sick=10,
                leave_balance_unpaid=12
            )
            db.add(emp)
            db.commit()
            db.refresh(emp)
            created_employees.append(emp)

            # Notification welcome
            n = models.Notification(
                employee_id=emp.id,
                title="Welcome to Libreo ✨",
                message=f"Hi {item['name']}, your Libreo HRMS account is active. You can track attendance, apply leaves, and view payslips anytime.",
                type="success"
            )
            db.add(n)

            # Initial payroll record
            net = item["salary"] + item["allowance"] - item["deduction"] - item["tax"]
            pay = models.Payroll(
                employee_id=emp.id,
                month=date.today().strftime("%B"),
                year=date.today().year,
                basic_salary=item["salary"],
                allowances=item["allowance"],
                deductions=item["deduction"],
                tax=item["tax"],
                net_salary=round(net, 2),
                payment_status="paid",
                payment_date=date.today()
            )
            db.add(pay)

        db.commit()

        print("Libreo Database initialized successfully with bcrypt hashed credentials:")
        print("   1. HR Admin:   thilskeb@gmail.com  |  admin@123")
        print("   2. Employee 1: sanjai@gmail.com    |  sanjai@2006")
        print("   3. Employee 2: santhiya@gmail.com  |  Santhiya@2006")
        print("   4. Employee 3: preevena@gmail.com  |  Prevvena@2006")

    except Exception as e:
        db.rollback()
        print("Error seeding database:", e)
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
