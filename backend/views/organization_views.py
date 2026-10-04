"""
(V) Organization Views - Multi-Tenant Organization Management Endpoints
Provides authenticated tenant discovery, profile inspection, and metadata updates.
Enforces strict server-side tenant isolation (recruiter can only view/update their own organization).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from auth_dependencies import get_current_user, require_recruiter
from models.db_models import UserModel
from schemas import OrganizationResponse, OrganizationUpdate
from services.organization_service import (
    get_organization_details,
    update_organization,
    ensure_organization
)

router = APIRouter(prefix="/api/organizations", tags=["Organizations"])

@router.get("/current", response_model=OrganizationResponse)
def get_current_organization(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch the authoritative organization record for the currently authenticated user.
    Auto-registers organization if not already reconciled.
    """
    org_id = getattr(current_user, "organization_id", None) or "org-sparkx-default"
    # Ensure organization row exists
    ensure_organization(db, org_id)
    details = get_organization_details(db, org_id)
    if not details:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    return details

@router.put("/current", response_model=OrganizationResponse)
def update_current_organization(
    payload: OrganizationUpdate,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Update current organization metadata (name, domain). Recruiter role only.
    """
    org_id = getattr(current_user, "organization_id", None) or "org-sparkx-default"
    ensure_organization(db, org_id)
    org, err = update_organization(db, org_id, name=payload.name, domain=payload.domain)
    if err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err)

    details = get_organization_details(db, org_id)
    return details

@router.get("/{org_id}", response_model=OrganizationResponse)
def get_organization_by_id(
    org_id: str,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Lookup an organization by ID.
    Enforces strict tenant isolation: recruiters can only inspect their own organization.
    """
    user_org = getattr(current_user, "organization_id", None) or "org-sparkx-default"
    if user_org != org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cross-tenant access forbidden: Cannot access another organization's records."
        )

    ensure_organization(db, org_id)
    details = get_organization_details(db, org_id)
    if not details:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    return details
