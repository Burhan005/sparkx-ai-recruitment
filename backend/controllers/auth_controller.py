"""
(C) Auth Controller - User Registration, Authentication & Password Recovery
Industry-standard security: Bcrypt password hashing with automatic legacy migration,
HMAC signed tokens with JTI and revocation check, single-use recruiter authorization,
and self-service 6-digit verification code password reset with attempt throttling.
"""
import os
import uuid
import base64
import hmac
import hashlib
import json
import secrets
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from models.db_models import UserModel, RevokedTokenModel, RecruiterInvitationModel
from schemas import UserRegister, UserLogin, ForgotPasswordRequest, ResetPasswordRequest, UserProfileUpdate
from email_service import send_email

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "sparkx-production-secret-key-2026-auth")
ENV_NAME = os.environ.get("ENVIRONMENT", os.environ.get("ENV", "development")).lower()

def check_jwt_production_guard():
    """Fail-fast production security guard: reject default secret key in production."""
    if ENV_NAME in ["production", "prod"]:
        if not os.environ.get("JWT_SECRET_KEY") or SECRET_KEY == "sparkx-production-secret-key-2026-auth":
            raise RuntimeError(
                "FATAL SECURITY MISCONFIGURATION: JWT_SECRET_KEY must be explicitly set to a "
                "strong random value in production environment."
            )

def hash_password(password: str) -> str:
    """Hash password using industry-standard bcrypt with automatic salt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, stored_hash: str) -> Tuple[bool, bool]:
    """
    Verify plain password against stored hash.
    Supports bcrypt ($2a$, $2b$, $2y$) and legacy salt$sha256 format.
    Returns (is_valid, needs_rehash).
    """
    if not stored_hash or not plain_password:
        return False, False
    try:
        # 1. Bcrypt check
        if stored_hash.startswith(("$2a$", "$2b$", "$2y$")):
            is_valid = bcrypt.checkpw(plain_password.encode("utf-8"), stored_hash.encode("utf-8"))
            return is_valid, False

        # 2. Legacy salt$sha256 fallback with transparent upgrade flag
        if "$" in stored_hash:
            parts = stored_hash.split("$", 1)
            if len(parts) == 2:
                salt, legacy_hash = parts
                computed = hashlib.sha256((plain_password + salt).encode("utf-8")).hexdigest()
                if hmac.compare_digest(computed, legacy_hash):
                    return True, True  # Valid credentials, flag for bcrypt upgrade
    except Exception:
        pass
    return False, False

def create_access_token(user_id: str, email: str, role: str) -> str:
    """Generate an HMAC-SHA256 signed bearer token with unique JTI."""
    jti = secrets.token_hex(16)
    payload = {
        "uid": user_id,
        "sub": email,
        "role": role,
        "jti": jti,
        "exp": (datetime.utcnow() + timedelta(days=7)).isoformat()
    }
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    signature = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    return f"spk.{payload_b64}.{signature}"

def verify_access_token(token: str, db: Optional[Session] = None) -> Optional[Dict[str, Any]]:
    """Verify HMAC signature, expiration, and token revocation status."""
    try:
        parts = token.strip().split(".")
        if len(parts) != 3 or parts[0] != "spk":
            return None
        payload_b64, signature = parts[1], parts[2]
        expected_sig = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected_sig):
            return None
        padding = "=" * (4 - len(payload_b64) % 4) if len(payload_b64) % 4 else ""
        payload = json.loads(base64.urlsafe_b64decode(payload_b64 + padding).decode())
        if datetime.fromisoformat(payload["exp"]) < datetime.utcnow():
            return None

        # Check token revocation if JTI and database session are provided
        if db and "jti" in payload:
            is_revoked = db.query(RevokedTokenModel).filter(RevokedTokenModel.token_jti == payload["jti"]).first()
            if is_revoked:
                return None

        return payload
    except Exception:
        return None

def revoke_token(token: str, db: Session) -> bool:
    """Revoke an active access token by storing its JTI in the revoked_tokens table."""
    try:
        payload = verify_access_token(token)
        if not payload or "jti" not in payload:
            return False
        jti = payload["jti"]
        exp_dt = datetime.fromisoformat(payload["exp"])
        revoked = RevokedTokenModel(
            id=f"rev-{uuid.uuid4().hex[:8]}",
            token_jti=jti,
            expires_at=exp_dt
        )
        db.add(revoked)
        db.commit()
        return True
    except Exception:
        db.rollback()
        return False

class AuthController:
    @staticmethod
    def register_user(payload: UserRegister, db: Session):
        email_clean = payload.email.strip().lower()

        # Recruiter Security Control: Require environment secret OR single-use invite code
        target_role = payload.role.lower() if payload.role in ["recruiter", "candidate"] else "candidate"
        if target_role == "recruiter":
            admin_code_input = (payload.admin_code or "").strip()
            env_secret = os.environ.get("RECRUITER_INVITE_SECRET", "").strip()

            authorized = False
            # Check 1: Match environment secret if configured
            if env_secret and hmac.compare_digest(admin_code_input, env_secret):
                authorized = True

            # Check 2: Single-use invitation in recruiter_invitations table
            if not authorized and admin_code_input:
                invite = db.query(RecruiterInvitationModel).filter(
                    RecruiterInvitationModel.invite_code == admin_code_input,
                    RecruiterInvitationModel.used_at == None
                ).first()
                if invite:
                    authorized = True
                    invite.used_at = datetime.utcnow()
                    invite.recipient_email = email_clean
                    db.commit()

            if not authorized:
                return None, "Recruiter Registration Restricted: Invalid or missing Admin Authorization Key."

        # Check if email already exists
        existing = db.query(UserModel).filter(UserModel.email == email_clean).first()
        if existing:
            return None, "Email address is already registered. Please sign in."

        user_id = f"usr-{uuid.uuid4().hex[:8]}"
        pw_hash = hash_password(payload.password)

        new_user = UserModel(
            id=user_id,
            name=payload.name.strip(),
            email=email_clean,
            password_hash=pw_hash,
            role=target_role,
            phone=payload.phone,
            job_role=payload.job_role,
            experience_years=payload.experience_years or 0.0,
            skills=payload.skills or [],
            education=payload.education,
            resume_filename=payload.resume_filename,
            resume_summary=payload.resume_summary,
            resume_text=payload.resume_text
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        token = create_access_token(new_user.id, new_user.email, new_user.role)
        return {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "token": token,
            "phone": new_user.phone,
            "job_role": new_user.job_role,
            "experience_years": new_user.experience_years,
            "skills": new_user.skills or [],
            "education": new_user.education,
            "resume_filename": new_user.resume_filename,
            "resume_summary": new_user.resume_summary,
            "resume_text": new_user.resume_text
        }, None

    @staticmethod
    def login_user(payload: UserLogin, db: Session):
        email_clean = payload.email.strip().lower()
        user = db.query(UserModel).filter(UserModel.email == email_clean).first()

        if not user:
            return None, "Invalid email or password."

        valid, needs_rehash = verify_password(payload.password, user.password_hash)
        if not valid:
            return None, "Invalid email or password."

        # Transparent security upgrade: rehash legacy SHA-256 password to bcrypt on successful login
        if needs_rehash:
            user.password_hash = hash_password(payload.password)
            db.commit()

        token = create_access_token(user.id, user.email, user.role)
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "token": token,
            "phone": user.phone,
            "job_role": user.job_role,
            "experience_years": user.experience_years,
            "skills": user.skills or [],
            "education": user.education,
            "resume_filename": user.resume_filename,
            "resume_summary": user.resume_summary,
            "resume_text": user.resume_text
        }, None

    @staticmethod
    def update_user_profile(user_id: str, payload: UserProfileUpdate, db: Session):
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user:
            return None, "User not found"

        if payload.name is not None:
            user.name = payload.name.strip()
        if payload.phone is not None:
            user.phone = payload.phone.strip()
        if payload.job_role is not None:
            user.job_role = payload.job_role.strip()
        if payload.experience_years is not None:
            user.experience_years = float(payload.experience_years)
        if payload.skills is not None:
            user.skills = payload.skills
        if payload.education is not None:
            user.education = payload.education.strip()
        if payload.resume_filename is not None:
            user.resume_filename = payload.resume_filename
        if payload.resume_summary is not None:
            user.resume_summary = payload.resume_summary
        if payload.resume_text is not None:
            user.resume_text = payload.resume_text

        db.commit()
        db.refresh(user)

        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "token": create_access_token(user.id, user.email, user.role),
            "phone": user.phone,
            "job_role": user.job_role,
            "experience_years": user.experience_years,
            "skills": user.skills or [],
            "education": user.education,
            "resume_filename": user.resume_filename,
            "resume_summary": user.resume_summary,
            "resume_text": user.resume_text
        }, None

    @staticmethod
    def get_user_profile(user_id: str, db: Session):
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user:
            return None, "User not found"
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "token": create_access_token(user.id, user.email, user.role),
            "phone": user.phone,
            "job_role": user.job_role,
            "experience_years": user.experience_years,
            "skills": user.skills or [],
            "education": user.education,
            "resume_filename": user.resume_filename,
            "resume_summary": user.resume_summary,
            "resume_text": user.resume_text
        }, None

    @staticmethod
    def forgot_password(payload: ForgotPasswordRequest, db: Session) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        email_clean = payload.email.strip().lower()
        user = db.query(UserModel).filter(UserModel.email == email_clean).first()

        # Generic response to completely eliminate account enumeration
        generic_response = {
            "success": True,
            "message": "If an account exists with that email address, a 6-digit verification code has been dispatched."
        }

        if not user:
            return generic_response, None

        # Generate cryptographically secure 6-digit verification code
        reset_code = f"{secrets.randbelow(900000) + 100000}"
        expiry = datetime.utcnow() + timedelta(minutes=15)

        # Hash code with unique salt before persisting to database
        code_salt = secrets.token_hex(8)
        code_hash = hashlib.sha256((reset_code + code_salt).encode("utf-8")).hexdigest()
        user.reset_token = f"{code_salt}${code_hash}"
        user.reset_token_expiry = expiry
        user.reset_token_attempts = 0
        db.commit()

        # Build secure email content
        subject = f"[SPARKX CODE: {reset_code}] Password Reset Verification Code"
        body_text = (
            f"Hello {user.name},\n\n"
            f"A password reset was requested for your SparkX AI account ({user.email}).\n\n"
            f"Your 6-digit verification code is: {reset_code}\n\n"
            f"This code will expire in 15 minutes.\n"
            f"If you did not request a password reset, please disregard this message.\n\n"
            f"— SparkX AI Security Team"
        )
        html_content = f"""
        <div style="font-family: Arial, sans-serif; background-color: #0B0F19; color: #FFFFFF; padding: 30px; border-radius: 12px; max-width: 500px;">
          <h2 style="color: #818cf8; margin-top: 0;">SparkX AI Security</h2>
          <p style="color: #cbd5e1; font-size: 14px;">Hello {user.name},</p>
          <p style="color: #cbd5e1; font-size: 14px;">We received a request to reset your password. Use the verification code below to complete the reset:</p>
          <div style="background-color: #1e1b4b; border: 1px solid #4338ca; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #a5b4fc;">{reset_code}</span>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">This code is valid for <strong>15 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #334155; margin: 20px 0;" />
          <p style="color: #64748b; font-size: 11px;">SparkX AI Recruitment Intelligence Platform</p>
        </div>
        """

        send_email(user.email, subject, body_text, html_content)

        # Strictly return generic_response without dev_code
        return generic_response, None

    @staticmethod
    def reset_password(payload: ResetPasswordRequest, db: Session) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        email_clean = payload.email.strip().lower()
        user = db.query(UserModel).filter(UserModel.email == email_clean).first()

        if not user:
            return None, "Invalid request. Please verify your email and code."

        if not user.reset_token or not user.reset_token_expiry:
            return None, "No active password reset request found. Please request a new verification code."

        if user.reset_token_expiry < datetime.utcnow():
            user.reset_token = None
            user.reset_token_expiry = None
            db.commit()
            return None, "This verification code has expired. Please request a new one."

        # Attempt throttling: max 5 failed attempts per code
        attempts = getattr(user, "reset_token_attempts", 0) or 0
        if attempts >= 5:
            user.reset_token = None
            user.reset_token_expiry = None
            user.reset_token_attempts = 0
            db.commit()
            return None, "Too many failed verification attempts. This code has been invalidated. Please request a new code."

        # Verify hashed code
        submitted_code = payload.reset_code.strip()
        code_parts = user.reset_token.split("$", 1)
        is_code_valid = False
        if len(code_parts) == 2:
            code_salt, expected_hash = code_parts
            computed_hash = hashlib.sha256((submitted_code + code_salt).encode("utf-8")).hexdigest()
            is_code_valid = hmac.compare_digest(computed_hash, expected_hash)
        elif user.reset_token == submitted_code:
            # Fallback for unhashed legacy tokens
            is_code_valid = True

        if not is_code_valid:
            user.reset_token_attempts = attempts + 1
            db.commit()
            remaining = 5 - (attempts + 1)
            return None, f"Invalid verification code. {remaining} attempt(s) remaining."

        if len(payload.new_password) < 6:
            return None, "Password must be at least 6 characters in length."

        # Set new password using bcrypt
        user.password_hash = hash_password(payload.new_password)
        user.reset_token = None
        user.reset_token_expiry = None
        user.reset_token_attempts = 0
        db.commit()

        return {
            "success": True,
            "message": "Password has been successfully updated! You can now sign in."
        }, None