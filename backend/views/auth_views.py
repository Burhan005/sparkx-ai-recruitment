"""
(V) Auth Views - Authentication Endpoints for Sign In, Sign Up, & Password Recovery
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from database import get_db
from schemas import UserRegister, UserLogin, UserResponse, ForgotPasswordRequest, ResetPasswordRequest, UserProfileUpdate
from controllers.auth_controller import AuthController
from auth_dependencies import get_current_user, get_token_from_header

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    user, err = AuthController.register_user(payload, db)
    if err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err)
    return user

@router.post("/login", response_model=UserResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user, err = AuthController.login_user(payload, db)
    if err:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=err)
    return user

@router.get("/me", response_model=UserResponse)
def get_me(request: Request, current_user = Depends(get_current_user)):
    """
    Authoritative session restoration endpoint.
    Returns the verified user profile and role from the database.
    """
    raw_token = get_token_from_header(request) or ""
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "token": raw_token,
        "phone": current_user.phone,
        "job_role": current_user.job_role,
        "experience_years": current_user.experience_years,
        "skills": current_user.skills or [],
        "education": current_user.education,
        "resume_filename": current_user.resume_filename,
        "resume_summary": current_user.resume_summary,
        "resume_text": current_user.resume_text
    }

@router.get("/profile/{user_id}", response_model=UserResponse)
def get_profile(user_id: str, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "recruiter" and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to user profile")
    user, err = AuthController.get_user_profile(user_id, db)
    if err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=err)
    return user

@router.put("/profile/{user_id}", response_model=UserResponse)
def update_profile(user_id: str, payload: UserProfileUpdate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "recruiter" and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: Cannot edit another user's profile")
    user, err = AuthController.update_user_profile(user_id, payload, db)
    if err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err)
    return user

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    result, err = AuthController.forgot_password(payload, db)
    if err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err)
    return result

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    result, err = AuthController.reset_password(payload, db)
    if err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err)
    return result