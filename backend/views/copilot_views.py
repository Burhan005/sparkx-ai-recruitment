"""
(V) Copilot Views - HTTP Presentation & Route Endpoints for Ask SparkX Copilot
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas import CopilotQueryRequest, CopilotQueryResponse
from controllers.copilot_controller import CopilotController

router = APIRouter(prefix="/api/copilot", tags=["Copilot"])

@router.post("/query", response_model=CopilotQueryResponse)
def query_copilot(payload: CopilotQueryRequest, db: Session = Depends(get_db)):
    """Ask SparkX AI Copilot endpoint - Grounded recruitment intelligence & LLM reasoning."""
    return CopilotController.process_query(payload, db)
