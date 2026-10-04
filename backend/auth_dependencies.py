"""
Authentication and Role-Based Access Control (RBAC) Dependencies for FastAPI.
Provides token verification, DB user resolution, and recruiter/candidate access gates.
"""
from typing import Optional, Any
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from database import get_db
from models.db_models import UserModel
from controllers.auth_controller import verify_access_token

def get_token_from_header(request: Request) -> Optional[str]:
    """Extracts raw bearer token from the Authorization header."""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None
    parts = auth_header.strip().split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1].strip()

def get_current_user(request: Request, db: Session = Depends(get_db)) -> UserModel:
    """
    Validates the bearer token and returns the authenticated UserModel from DB.
    Raises HTTP 401 Unauthorized if missing, malformed, or expired.
    """
    raw_token = get_token_from_header(request)
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Missing Bearer token.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    payload = verify_access_token(raw_token, db=db)
    if not payload or not payload.get("uid"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user = db.query(UserModel).filter(UserModel.id == payload["uid"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return user

def get_optional_current_user(request: Request, db: Session = Depends(get_db)) -> Optional[UserModel]:
    """Returns authenticated user if valid token is present, otherwise None."""
    raw_token = get_token_from_header(request)
    if not raw_token:
        return None
    payload = verify_access_token(raw_token, db=db)
    if not payload or not payload.get("uid"):
        return None
    return db.query(UserModel).filter(UserModel.id == payload["uid"]).first()

def require_recruiter(current_user: UserModel = Depends(get_current_user)) -> UserModel:
    """
    Enforces that the authenticated user has the 'recruiter' role.
    Raises HTTP 403 Forbidden if called by a candidate or unauthorized user.
    """
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Recruiter privileges required."
        )
    return current_user

def require_candidate(current_user: UserModel = Depends(get_current_user)) -> UserModel:
    """
    Enforces that the authenticated user has the 'candidate' role.
    Raises HTTP 403 Forbidden if called by a non-candidate user.
    """
    if current_user.role != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Candidate privileges required."
        )
    return current_user

def verify_candidate_ownership(current_user: UserModel, candidate: Any) -> None:
    """
    Strict server-side BOLA/IDOR verification:
    If current_user is a candidate, verifies candidate owns the resource.
    Raises HTTP 403 Forbidden if unauthorized.
    """
    if current_user.role == "candidate":
        cand_email = getattr(candidate, "email", "") or ""
        cand_user_id = getattr(candidate, "user_id", None)
        user_email = (current_user.email or "").strip().lower()
        user_id = current_user.id

        matches_email = cand_email.strip().lower() == user_email
        matches_user_id = bool(cand_user_id and cand_user_id == user_id)

        if not (matches_email or matches_user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You are not authorized to access or modify another candidate's resource."
            )

def verify_recruiter_tenant(current_user: UserModel, resource: Any, resource_type: str = "resource") -> None:
    """
    Strict server-side Multi-Tenant Isolation verification:
    Ensures the authenticated recruiter's organization matches the resource's organization.
    Raises HTTP 403 Forbidden if mismatched.
    """
    if current_user.role == "recruiter":
        user_org = (getattr(current_user, "organization_id", None) or "org-sparkx-default").strip()
        res_org = getattr(resource, "organization_id", None)
        if not res_org and hasattr(resource, "job") and resource.job:
            res_org = getattr(resource.job, "organization_id", None)
        res_org = (res_org or "org-sparkx-default").strip()

        if user_org != res_org:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cross-tenant access denied: This {resource_type} belongs to another organization."
            )

