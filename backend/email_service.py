"""
SparkX Email Delivery Service
Handles transactional and telemetry emails (Interview Invitations, Password Resets, Offers).
Supports:
  1. Live SMTP Delivery (Gmail, Outlook, SendGrid, Amazon SES, or custom SMTP).
  2. Automatic iCalendar (.ics) Meeting Invite generation for 1-click Google Calendar / Outlook integration.
  3. Fallback Development Logger (when SMTP credentials are not set in .env).
Zero crashes — always safe and non-blocking.
"""
import os
import re
import smtplib
from datetime import datetime, timedelta
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

def parse_slot_to_datetime(slot_str: str) -> datetime:
    """Parse human readable or ISO slot string into a UTC datetime object."""
    if not slot_str:
        return datetime.utcnow() + timedelta(days=1, hours=2)
    
    # Try YYYY-MM-DD HH:MM
    match = re.search(r"(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})", slot_str)
    if match:
        year, month, day, hour, minute = map(int, match.groups())
        return datetime(year, month, day, hour, minute)
    
    # Try ISO
    try:
        clean = slot_str.replace("Z", "").split("+")[0]
        return datetime.fromisoformat(clean)
    except Exception:
        pass
    
    # Default to tomorrow at 14:00 UTC
    tomorrow = datetime.utcnow() + timedelta(days=1)
    return tomorrow.replace(hour=14, minute=0, second=0, microsecond=0)

def create_ics_calendar_event(
    event_id: str,
    summary: str,
    description: str,
    start_dt: Optional[datetime] = None,
    candidate_name: str = "Candidate",
    candidate_email: str = "",
    organizer_email: str = "",
    meet_url: str = ""
) -> str:
    """Generate RFC 5545 compliant iCalendar (.ics) meeting invite with Google Meet conference metadata."""
    if not start_dt:
        start_dt = datetime.utcnow() + timedelta(days=1, hours=2)
    end_dt = start_dt + timedelta(minutes=45)

    dtstamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    dtstart = start_dt.strftime("%Y%m%dT%H%M%SZ")
    dtend = end_dt.strftime("%Y%m%dT%H%M%SZ")

    clean_desc = description.replace("\r\n", "\\n").replace("\n", "\\n")
    location_str = meet_url or "http://localhost:3000 (SparkX AI Video Interview Room)"
    conf_lines = f"X-GOOGLE-CONFERENCE:{meet_url}\r\nCONFERENCE;VALUE=URI:{meet_url}\r\n" if meet_url else ""

    ics = (
        "BEGIN:VCALENDAR\r\n"
        "VERSION:2.0\r\n"
        "PRODID:-//SparkX AI Recruitment//Interview Scheduler//EN\r\n"
        "CALSCALE:GREGORIAN\r\n"
        "METHOD:REQUEST\r\n"
        "BEGIN:VEVENT\r\n"
        f"UID:{event_id}@sparkx.ai\r\n"
        f"DTSTAMP:{dtstamp}\r\n"
        f"DTSTART:{dtstart}\r\n"
        f"DTEND:{dtend}\r\n"
        f"SUMMARY:{summary}\r\n"
        f"DESCRIPTION:{clean_desc}\r\n"
        f"LOCATION:{location_str}\r\n"
        f"{conf_lines}"
        "STATUS:CONFIRMED\r\n"
        f"ORGANIZER;CN=SparkX AI Recruitment:mailto:{organizer_email or 'no-reply@sparkx.ai'}\r\n"
        f"ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN={candidate_name}:mailto:{candidate_email}\r\n"
        "BEGIN:VALARM\r\n"
        "TRIGGER:-PT15M\r\n"
        "ACTION:DISPLAY\r\n"
        "DESCRIPTION:Reminder: SparkX AI Interview starts in 15 minutes\r\n"
        "END:VALARM\r\n"
        "END:VEVENT\r\n"
        "END:VCALENDAR\r\n"
    )
    return ics

def send_email(
    to_email: str,
    subject: str,
    body_text: str,
    html_content: Optional[str] = None,
    ics_content: Optional[str] = None
) -> Tuple[bool, str]:
    """
    Send an email to a candidate or recruiter with optional HTML card and calendar meeting invite (.ics).
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
    password = os.environ.get("SMTP_PASSWORD", "").strip().replace(" ", "")
    from_email = os.environ.get("SMTP_FROM_EMAIL", user or "no-reply@sparkx.ai").strip()
    use_tls = os.environ.get("SMTP_TLS", "true").strip().lower() in ("true", "1", "yes")

    # If SMTP credentials are not configured, log to telemetry safely
    if not user or not password:
        safe_subj = subject.encode("ascii", "replace").decode("ascii")
        safe_body = body_text[:160].encode("ascii", "replace").decode("ascii")
        print(f"[EMAIL DEV TELEMETRY] To: {to_email} | Subject: {safe_subj}")
        print(f"--- Content Preview ---\n{safe_body}...\n-----------------------")
        if ics_content:
            print("[CALENDAR INVITE] .ics meeting invite generated and attached.")
        return True, "Email recorded in development audit log (configure SMTP_USER & SMTP_PASSWORD in .env for live inbox delivery)."

    # Build MIME Message
    msg = MIMEMultipart("mixed")
    msg["Subject"] = subject
    msg["From"] = f"SparkX AI Recruitment <{from_email}>"
    msg["To"] = to_email

    # Alternative body (text + html)
    alt_part = MIMEMultipart("alternative")
    alt_part.attach(MIMEText(body_text, "plain", "utf-8"))
    if html_content:
        alt_part.attach(MIMEText(html_content, "html", "utf-8"))
    msg.attach(alt_part)

    # Attach interactive iCalendar invite (.ics)
    if ics_content:
        cal_part = MIMEText(ics_content, "calendar; method=REQUEST; name=invite.ics", "utf-8")
        cal_part.add_header("Content-Class", "urn:content-classes:calendarmessage")
        cal_part.add_header("Content-Disposition", "inline", filename="invite.ics")
        msg.attach(cal_part)

        file_part = MIMEText(ics_content, "calendar", "utf-8")
        file_part.add_header("Content-Disposition", "attachment", filename="invite.ics")
        msg.attach(file_part)

    # Send via SMTP
    try:
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=12)
        else:
            server = smtplib.SMTP(host, port, timeout=12)
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
