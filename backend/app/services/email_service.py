import logging
import os
from typing import Dict, Any, Optional
import resend
from app.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("email_service")

# Initialize Resend API Key
RESEND_API_KEY = os.getenv("RESEND_API_KEY") or settings.RESEND_API_KEY
FROM_EMAIL = os.getenv("FROM_EMAIL") or settings.FROM_EMAIL or "onboarding@resend.dev"

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY.strip()
    logger.info("Resend SDK initialized successfully with API key.")
else:
    logger.warning("RESEND_API_KEY not found. Resend will run in sandbox fallback mode.")


def get_otp_html_template(otp: str) -> str:
    """
    Generates a responsive, branded HTML email template for Dayflow OTP verification.
    """
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Login OTP - Dayflow HRMS</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 30px 15px;
      color: #0f172a;
    }}
    .email-card {{
      max-width: 520px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      padding: 40px 36px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04);
    }}
    .brand-badge {{
      display: inline-block;
      width: 44px;
      height: 44px;
      background-color: #09090b;
      color: #ffffff;
      border-radius: 12px;
      text-align: center;
      line-height: 44px;
      font-weight: 900;
      font-size: 22px;
      margin-bottom: 24px;
    }}
    h1 {{
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #09090b;
      margin: 0 0 10px 0;
    }}
    p {{
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 20px 0;
    }}
    .otp-container {{
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1.5px dashed #cbd5e1;
      border-radius: 16px;
      padding: 24px 20px;
      text-align: center;
      margin: 28px 0;
    }}
    .otp-code {{
      font-family: 'SF Mono', 'Courier New', Courier, monospace;
      font-size: 38px;
      font-weight: 900;
      letter-spacing: 10px;
      color: #09090b;
      margin-bottom: 6px;
    }}
    .expiry-tag {{
      display: inline-block;
      padding: 5px 12px;
      background-color: #ecfdf5;
      color: #047857;
      font-size: 11px;
      font-weight: 700;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}
    .warning-box {{
      background-color: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 24px;
    }}
    .warning-text {{
      font-size: 12px;
      color: #92400e;
      margin: 0;
      line-height: 1.5;
    }}
    .footer {{
      border-top: 1px solid #f1f5f9;
      padding-top: 24px;
      margin-top: 28px;
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
      line-height: 1.5;
    }}
  </style>
</head>
<body>
  <div class="email-card">
    <div class="brand-badge">D</div>
    <h1>Your Login OTP</h1>
    <p>We received a sign-in request for your Dayflow HRMS workspace. Use the 6-digit one-time passcode below to authenticate:</p>
    
    <div class="otp-container">
      <div class="otp-code">{otp}</div>
      <div class="expiry-tag">⏱️ Valid for 5 Minutes</div>
    </div>
    
    <div class="warning-box">
      <p class="warning-text">
        🔒 <strong>Security Notice:</strong> Never share this OTP with anyone. Dayflow staff will never ask for your verification code. If you did not initiate this request, please contact your HR administrator immediately.
      </p>
    </div>
    
    <div class="footer">
      &copy; 2026 Dayflow Technologies, Inc. • Enterprise Human Resource Management System<br>
      Automated verification email — please do not reply.
    </div>
  </div>
</body>
</html>"""


def send_otp_email(email: str, otp: str) -> Dict[str, Any]:
    """
    Sends a 6-digit verification code to the recipient using the Resend Python SDK.
    
    Args:
        email (str): Recipient email address.
        otp (str): 6-digit one-time passcode.
        
    Returns:
        Dict[str, Any]: {"success": bool, "id": Optional[str], "message": str}
    """
    email_clean = email.strip().lower()
    subject = "Your Login OTP"
    html_body = get_otp_html_template(otp)

    api_key = os.getenv("RESEND_API_KEY") or settings.RESEND_API_KEY
    from_email = os.getenv("FROM_EMAIL") or settings.FROM_EMAIL or "onboarding@resend.dev"

    if not api_key:
        logger.warning(f"[EMAIL SANDBOX] No RESEND_API_KEY provided. OTP for {email_clean}: {otp}")
        return {
            "success": True,
            "id": "sandbox-local-id",
            "message": f"Sandbox mode: OTP {otp} logged to console."
        }

    try:
        resend.api_key = api_key.strip()
        params: resend.Emails.SendParams = {
            "from": f"Dayflow Auth <{from_email}>",
            "to": [email_clean],
            "subject": subject,
            "html": html_body,
        }

        logger.info(f"Dispatching OTP email to {email_clean} via Resend...")
        response = resend.Emails.send(params)
        email_id = response.get("id") if isinstance(response, dict) else str(response)

        logger.info(f"Resend email dispatched successfully! Message ID: {email_id}")
        return {
            "success": True,
            "id": email_id,
            "message": "OTP email sent successfully."
        }

    except Exception as exc:
        error_msg = str(exc)
        logger.error(f"Failed to send email via Resend to {email_clean}: {error_msg}")
        return {
            "success": False,
            "id": None,
            "message": f"Resend delivery error: {error_msg}"
        }
