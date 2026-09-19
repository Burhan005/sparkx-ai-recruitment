"""
SparkX Email Delivery Service
Handles transactional and telemetry emails (Interview Invitations, Password Resets, Offers).
Supports:
  1. Live SMTP Delivery (Gmail, Outlook, SendGrid, Amazon SES, or custom SMTP).
  2. Fallback Development Logger (when SMTP credentials are not set in .env).
Zero crashes — always safe and non-blocking.
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Tuple
from dotenv import load_dotenv

# Ensure .env is loaded
load_dotenv()

def is_smtp_configured() -> bool:
    """Check if real SMTP credentials have been provided in the environment."""
    user = os.environ.get("SMTP_USER", "").strip()
    pw = os.environ.get("SMTP_PASSWORD", "").strip()
    return bool(user and pw)

def send_email(
    to_email: str,
    subject: str,
    body_text: str,
    html_content: Optional[str] = None
) -> Tuple[bool, str]:
    """
    Send an email to a candidate or recruiter.
    Returns (success: bool, status_message: str).
    """
    to_email = to_email.strip()
    if not to_email:
        return False, "Recipient email address is missing."

    host = os.environ.get("SMTP_HOST", "smtp.gmail.com").strip()
    port_str = os.environ.get("SMTP_PORT", "587").strip()
    try:
        port = int(port_str)
    except ValueError:
        port = 587

    user = os.environ.get("SMTP_USER", "").strip()
    password = os.environ.get("SMTP_PASSWORD", "").strip()
    from_email = os.environ.get("SMTP_FROM_EMAIL", user or "no-reply@sparkx.ai").strip()
    use_tls = os.environ.get("SMTP_TLS", "true").strip().lower() in ("true", "1", "yes")

    # If SMTP credentials are not configured, log to telemetry safely
    if not user or not password:
        safe_subj = subject.encode("ascii", "replace").decode("ascii")
        safe_body = body_text[:160].encode("ascii", "replace").decode("ascii")
        print(f"[EMAIL DEV TELEMETRY] To: {to_email} | Subject: {safe_subj}")
        print(f"--- Content Preview ---\n{safe_body}...\n-----------------------")
        return True, "Email recorded in development audit log (configure SMTP_USER & SMTP_PASSWORD in .env for live inbox delivery)."

    # Build MIME Message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"SparkX AI Recruitment <{from_email}>"
    msg["To"] = to_email

    # Plaintext part
    msg.attach(MIMEText(body_text, "plain", "utf-8"))

    # Optional HTML part
    if html_content:
        msg.attach(MIMEText(html_content, "html", "utf-8"))

    # Send via SMTP
    try:
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=10)
        else:
            server = smtplib.SMTP(host, port, timeout=10)
            if use_tls:
                server.starttls()

        server.login(user, password)
        server.sendmail(from_email, [to_email], msg.as_string())
        server.quit()
        print(f"[EMAIL DISPATCHED] Live SMTP email delivered to {to_email}")
        return True, "Email successfully sent to inbox."
    except Exception as e:
        err_msg = f"SMTP Delivery Failed: {str(e)}"
        print(f"[EMAIL WARNING] {err_msg}")
        return False, err_msg
