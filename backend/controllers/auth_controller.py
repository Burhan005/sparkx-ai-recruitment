"""
(C) Auth Controller - User Registration & Authentication logic
"""
import uuid
import hashlib
import secrets
from sqlalchemy.orm import Session
from models.db_models import UserModel
from schemas import UserRegister, UserLogin

def hash_password(password: str, salt: str = None) -> str:
    """Hash password using SHA-256 with salt."""
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256((password + salt).encode('utf-8')).hexdigest()
    return f"{salt}${hashed}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against stored salt$hash."""
    try:
        salt, stored_hash = hashed_password.split('$', 1)
        return hash_password(plain_password, salt) == hashed_password
    except ValueError:
        return False

class AuthController:
    @staticmethod
    def register_user(payload: UserRegister, db: Session):
        email_clean = payload.email.strip().lower()
        
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
            role=payload.role if payload.role in ["recruiter", "candidate"] else "candidate"
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        token = f"spk_token_{uuid.uuid4().hex}"
        return {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "token": token
        }, None

    @staticmethod
    def login_user(payload: UserLogin, db: Session):
        email_clean = payload.email.strip().lower()
        user = db.query(UserModel).filter(UserModel.email == email_clean).first()
        
        if not user or not verify_password(payload.password, user.password_hash):
            return None, "Invalid email or password."

        token = f"spk_token_{uuid.uuid4().hex}"
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "token": token
        }, None