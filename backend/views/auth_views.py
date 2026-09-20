"""
(V) Auth Views - Authentication Endpoints for Sign In, Sign Up, & Password Recovery
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from schemas import UserRegister, UserLogin, UserResponse, ForgotPasswordRequest, ResetPasswordRequest, UserProfileUpdate
from controllers.auth_controller import AuthController

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

@router.get("/profile/{user_id}", response_model=UserResponse)
def get_profile(user_id: str, db: Session = Depends(get_db)):
    user, err = AuthController.get_user_profile(user_id, db)
    if err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=err)
    return user

@router.put("/profile/{user_id}", response_model=UserResponse)
def update_profile(user_id: str, payload: UserProfileUpdate, db: Session = Depends(get_db)):
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