from datetime import date, datetime, timezone
from app.database import SessionLocal, engine, Base
from app import models
from app.auth import get_password_hash

def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Seeding Dayflow HRMS Database (Clean Admin Only)...")

        # 1. Admin User Only
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
            joining_date=date.today(),
            phone="+1 (555) 234-5678",
            address="San Francisco HQ",
            profile_picture="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
            emergency_contact="Mark Rostova (+1 555-987-6543)",
            work_location="San Francisco HQ (Hybrid)",
            leave_balance_paid=20,
            leave_balance_sick=12,
            leave_balance_unpaid=10
        )
        db.add(admin_profile)
        db.commit()

        print("Dayflow Database initialized successfully!")
        print("   Admin Account: admin@dayflow.io / admin123")
        print("   New employees can be onboarded via Admin or Register page.")

    except Exception as e:
        db.rollback()
        print("Error seeding database:", e)
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
