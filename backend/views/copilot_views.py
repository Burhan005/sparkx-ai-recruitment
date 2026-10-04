"""
(V) Copilot Views - HTTP Presentation & Route Endpoints for Ask SparkX Copilot
Protected with session authentication and role validation.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas import CopilotQueryRequest, CopilotQueryResponse
from controllers.copilot_controller import CopilotController
from auth_dependencies import get_current_user
from models.db_models import UserModel

router = APIRouter(prefix="/api/copilot", tags=["Copilot"])

@router.post("/query", response_model=CopilotQueryResponse)
def query_copilot(
    payload: CopilotQueryRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ask SparkX AI Copilot endpoint - Grounded recruitment intelligence & LLM reasoning.
    Enforces that candidate queries cannot impersonate recruiter role and only access
    their own candidate applications.
    """
    # Enforce authenticated user role to prevent privilege escalation in copilot queries
    payload.user_role = current_user.role
    if current_user.role == "candidate":
        payload.candidate_email = current_user.email
    if not payload.user_name and hasattr(current_user, "name"):
        payload.user_name = current_user.name
    org_id = current_user.organization_id if current_user.role == "recruiter" else None
    return CopilotController.process_query(payload, db, organization_id=org_id)
