# Expose the modular Resend email service
from app.services.email_service import send_otp_email, get_otp_html_template

__all__ = ["send_otp_email", "get_otp_html_template"]
