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
        "organization_id": getattr(current_user, "organization_id", "org-sparkx-default") or "org-sparkx-default",
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
    if current_user.id != user_id:
        if current_user.role != "recruiter":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to user profile")
        from models.db_models import UserModel, CandidateModel
        target_user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        rec_org = getattr(current_user, "organization_id", "org-sparkx-default") or "org-sparkx-default"
        target_org = getattr(target_user, "organization_id", "org-sparkx-default") or "org-sparkx-default"
        if target_user.role == "recruiter" and target_org != rec_org:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access forbidden: Cannot view recruiter profile from another organization.")
        elif target_user.role == "candidate":
            has_app = db.query(CandidateModel).filter(
                CandidateModel.email == target_user.email,
                CandidateModel.organization_id == rec_org
            ).first()
            if not has_app:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access forbidden: Candidate has no applications in your organization.")
    user, err = AuthController.get_user_profile(user_id, db)
    if err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=err)
    return user

@router.put("/profile/{user_id}", response_model=UserResponse)
def update_profile(user_id: str, payload: UserProfileUpdate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.id != user_id:
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

@router.post("/logout")
def logout(request: Request, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    raw_token = get_token_from_header(request)
    if raw_token:
        from controllers.auth_controller import revoke_token
        revoke_token(raw_token, db)
    return {"success": True, "message": "Logged out successfully"}