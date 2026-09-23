"""
(V) Google OAuth Views - Handles Google Account connection for real Google Meet link creation.
Routes:
  GET  /api/auth/google/status   - Check if Google is connected
  GET  /api/auth/google/connect  - Start OAuth flow (redirect to Google consent)
  GET  /api/auth/google/callback - Handle OAuth callback (exchange code for tokens)
  POST /api/auth/google/disconnect - Disconnect Google account
"""
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from google_meet_service import (
    is_google_configured,
    get_connection_status,
    get_auth_url,
    exchange_code_for_tokens,
    disconnect_google,
)

router = APIRouter(prefix="/api/auth/google", tags=["Google OAuth"])

@router.get("/status")
def google_status():
    """Check Google Meet integration status — used by frontend to show connection badge."""
    status = get_connection_status()
    return status

@router.get("/connect")
def google_connect():
    """Redirect recruiter to Google OAuth consent screen."""
    if not is_google_configured():
        raise HTTPException(
            status_code=400,
            detail="Google OAuth not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env"
        )
    url = get_auth_url()
    return RedirectResponse(url=url)

@router.get("/callback")
def google_callback(code: str = "", error: str = ""):
    """Handle Google OAuth redirect — exchange auth code for tokens."""
    if error:
        return HTMLResponse(content=f"""
        <html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:#fff;">
        <div style="text-align:center;">
            <h2 style="color:#ef4444;">❌ Google Connection Failed</h2>
            <p style="color:#94a3b8;">Error: {error}</p>
            <p style="color:#64748b;font-size:14px;">You can close this window and try again.</p>
        </div></body></html>
        """, status_code=400)

    if not code:
        raise HTTPException(status_code=400, detail="No authorization code received from Google")

    success, result = exchange_code_for_tokens(code)

    if success:
        return HTMLResponse(content=f"""
        <html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:#fff;">
        <div style="text-align:center;">
            <div style="font-size:64px;margin-bottom:16px;">✅</div>
            <h2 style="color:#22c55e;">Google Account Connected!</h2>
            <p style="color:#94a3b8;">Connected as <strong style="color:#60a5fa;">{result}</strong></p>
            <p style="color:#64748b;font-size:14px;margin-top:16px;">SparkX will now create real Google Meet links automatically.<br/>You can close this window and return to SparkX.</p>
            <script>
                // Notify the opener window (SparkX app) that connection succeeded
                if (window.opener) {{
                    window.opener.postMessage({{ type: 'GOOGLE_MEET_CONNECTED', email: '{result}' }}, '*');
                    setTimeout(() => window.close(), 2000);
                }}
            </script>
        </div></body></html>
        """)
    else:
        return HTMLResponse(content=f"""
        <html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:#fff;">
        <div style="text-align:center;">
            <h2 style="color:#ef4444;">❌ Connection Failed</h2>
            <p style="color:#94a3b8;">{result}</p>
            <p style="color:#64748b;font-size:14px;">You can close this window and try again.</p>
        </div></body></html>
        """, status_code=400)

@router.post("/disconnect")
def google_disconnect():
    """Remove stored Google tokens."""
    success = disconnect_google()
    if success:
        return {"status": "disconnected", "message": "Google account disconnected successfully"}
    raise HTTPException(status_code=500, detail="Failed to disconnect Google account")
