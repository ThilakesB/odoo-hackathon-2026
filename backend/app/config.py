import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Dayflow HRMS"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dayflow-super-secret-jwt-key-change-in-production-2025")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./dayflow.db")
    
    # Redis for OTP and cache (optional - falls back to in-memory store)
    REDIS_URL: Optional[str] = os.getenv("REDIS_URL", None)
    
    # Email Provider Configurations (Resend or Mailtrap/SMTP)
    RESEND_API_KEY: Optional[str] = os.getenv("RESEND_API_KEY", None)
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "onboarding@resend.dev")
    
    MAILTRAP_HOST: Optional[str] = os.getenv("MAILTRAP_HOST", "sandbox.smtp.mailtrap.io")
    MAILTRAP_PORT: int = int(os.getenv("MAILTRAP_PORT", "2525"))
    MAILTRAP_USER: Optional[str] = os.getenv("MAILTRAP_USER", None)
    MAILTRAP_PASS: Optional[str] = os.getenv("MAILTRAP_PASS", None)
    
    # Generic SMTP (Gmail, Brevo, SendGrid, etc.)
    SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST", None)
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: Optional[str] = os.getenv("SMTP_USER", None)
    SMTP_PASS: Optional[str] = os.getenv("SMTP_PASS", None)
    
    # Gemini AI Key
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "")

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
