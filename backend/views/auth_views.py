"""
(V) Auth Views - Authentication Endpoints for Sign In & Sign Up
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from schemas import UserRegister, UserLogin, UserResponse
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