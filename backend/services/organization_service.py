"""
(S) Organization Service - Authoritative Multi-Tenant Domain Logic
Manages organization lifecycle, tenant boundaries, reconciliation, and tenant-scoped lookups.
"""
import uuid
import re
from datetime import datetime
from typing import Optional, Dict, Any, Tuple, List
from sqlalchemy.orm import Session
from sqlalchemy import text
from models.db_models import OrganizationModel, UserModel, JobModel, CandidateModel

def sanitize_slug(text_val: str) -> str:
    """Produce clean URL-safe slug from organization name or ID."""
    clean = re.sub(r'[^a-zA-Z0-9_-]', '-', text_val.strip().lower())
    clean = re.sub(r'-+', '-', clean).strip('-')
    return clean or f"org-{uuid.uuid4().hex[:6]}"

def ensure_organization(
    db: Session,
    org_id: str,
    name: Optional[str] = None,
    slug: Optional[str] = None,
    domain: Optional[str] = None
) -> OrganizationModel:
    """
    Authoritatively get or create an organization by ID.
    Ensures every tenant-owned record has a valid parent row in organizations table.
    """
    if not org_id:
        org_id = "org-sparkx-default"

    org = db.query(OrganizationModel).filter(OrganizationModel.id == org_id).first()
    if org:
        return org

    # Derive sensible defaults
    if not name:
        if org_id == "org-sparkx-default":
            name = "SparkX Technologies"
        elif org_id == "org-alpha":
            name = "Organization Alpha"
        elif org_id == "org-beta":
            name = "Organization Beta"
        elif org_id.startswith("org-"):
            name = f"Organization {org_id.replace('org-', '').title()}"
        else:
            name = org_id.title()

    if not slug:
        slug = sanitize_slug(org_id)

    # Ensure slug uniqueness
    existing_slug = db.query(OrganizationModel).filter(OrganizationModel.slug == slug).first()
    if existing_slug:
        slug = f"{slug}-{uuid.uuid4().hex[:4]}"

    new_org = OrganizationModel(
        id=org_id,
        name=name,
        slug=slug,
        domain=domain,
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_org)
    try:
        db.commit()
        db.refresh(new_org)
        return new_org
    except Exception:
        db.rollback()
        # Concurrency safety: check if another thread inserted it
        org = db.query(OrganizationModel).filter(OrganizationModel.id == org_id).first()
        if org:
            return org
        raise

def reconcile_existing_organizations(db: Session):
    """
    Reconciliation job: scans users, jobs, candidates, assessments, coding_problems
    and ensures all existing organization_id strings are registered in organizations table.
    """
    tables = ["users", "jobs", "candidates", "assessments", "coding_problems"]
    discovered_ids = set()

    for tbl in tables:
        try:
            rows = db.execute(text(f"""
                SELECT DISTINCT organization_id FROM {tbl} 
                WHERE organization_id IS NOT NULL 
                  AND organization_id != '' 
                  AND organization_id != 'system'
            """)).fetchall()
            for r in rows:
                if r[0]:
                    discovered_ids.add(r[0])
        except Exception:
            pass

    for org_id in sorted(list(discovered_ids)):
        ensure_organization(db, org_id)

def get_organization_by_id(db: Session, org_id: str) -> Optional[OrganizationModel]:
    """Retrieve organization by primary key."""
    if not org_id:
        return None
    return db.query(OrganizationModel).filter(OrganizationModel.id == org_id).first()

def get_organization_details(db: Session, org_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve organization with live metrics (active jobs, candidates, users)."""
    org = get_organization_by_id(db, org_id)
    if not org:
        return None

    user_count = db.query(UserModel).filter(UserModel.organization_id == org.id).count()
    job_count = db.query(JobModel).filter(JobModel.organization_id == org.id).count()
    candidate_count = db.query(CandidateModel).filter(CandidateModel.organization_id == org.id).count()

    return {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
        "domain": org.domain,
        "is_active": org.is_active,
        "created_at": org.created_at.isoformat() if org.created_at else None,
        "updated_at": org.updated_at.isoformat() if org.updated_at else None,
        "user_count": user_count,
        "job_count": job_count,
        "candidate_count": candidate_count
    }

def update_organization(
    db: Session,
    org_id: str,
    name: Optional[str] = None,
    domain: Optional[str] = None
) -> Tuple[Optional[OrganizationModel], Optional[str]]:
    """Update organization display name or domain."""
    org = get_organization_by_id(db, org_id)
    if not org:
        return None, "Organization not found"

    if name and name.strip():
        org.name = name.strip()
    if domain is not None:
        org.domain = domain.strip() if domain.strip() else None

    org.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(org)
    return org, None
