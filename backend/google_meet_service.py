"""
SparkX Google Meet Integration Service
Creates REAL Google Meet links via Google Calendar API + OAuth2.

Flow:
  1. Recruiter clicks "Connect Google Account" → redirected to Google consent screen
  2. After consent, Google redirects back with auth code → exchanged for tokens
  3. Tokens stored in google_tokens.json (refresh token persists across restarts)
  4. When scheduling, creates a Google Calendar event with conferenceData → returns real Meet link

All configuration from environment variables — zero hardcoded secrets.
"""
import os
import json
import threading
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, Any, Tuple

# Token storage path (next to this file)
TOKENS_FILE = Path(__file__).parent / "google_tokens.json"

def _get_google_config() -> Dict[str, str]:
    """Read Google OAuth config from environment variables or google_client_secret.json."""
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "").strip()
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "").strip()
    redirect_uri = os.environ.get(
        "GOOGLE_REDIRECT_URI",
        "http://localhost:8000/api/auth/google/callback"
    ).strip()

    if not client_id or not client_secret:
        for json_name in ["google_client_secret.json", "client_secret.json"]:
            json_file = Path(__file__).parent / json_name
            if json_file.exists():
                try:
                    with open(json_file, "r") as f:
                        data = json.load(f)
                    web = data.get("web") or data.get("installed") or {}
                    if not client_id:
                        client_id = web.get("client_id", "").strip()
                    if not client_secret:
                        client_secret = web.get("client_secret", "").strip()
                    if client_id and client_secret:
                        break
                except Exception:
                    pass

    return {
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
    }

def is_google_configured() -> bool:
    """Check if Google OAuth credentials are provided in .env"""
    cfg = _get_google_config()
    return bool(cfg["client_id"] and cfg["client_secret"])

def _load_tokens() -> Dict[str, Any]:
    """Load stored tokens from disk."""
    if TOKENS_FILE.exists():
        try:
            with open(TOKENS_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def _save_tokens(tokens: Dict[str, Any]):
    """Persist tokens to disk."""
    try:
        with open(TOKENS_FILE, "w") as f:
            json.dump(tokens, f, indent=2)
    except Exception as e:
        print(f"[Google Meet] Warning: Could not save tokens: {e}")

def is_google_connected() -> bool:
    """Check if we have a valid refresh token stored."""
    tokens = _load_tokens()
    return bool(tokens.get("refresh_token"))

def get_connection_status() -> Dict[str, Any]:
    """Return full connection status for frontend."""
    configured = is_google_configured()
    tokens = _load_tokens()
    connected = bool(tokens.get("refresh_token"))
    return {
        "configured": configured,
        "connected": connected,
        "email": tokens.get("email", ""),
        "last_connected": tokens.get("connected_at", ""),
    }

def get_auth_url() -> str:
    """Generate the Google OAuth2 authorization URL for recruiter consent."""
    cfg = _get_google_config()
    if not cfg["client_id"]:
        raise ValueError("GOOGLE_CLIENT_ID not set in .env")

    scopes = [
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/userinfo.email",
    ]
    scope_str = "%20".join(scopes)

    url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={cfg['client_id']}"
        f"&redirect_uri={cfg['redirect_uri']}"
        f"&response_type=code"
        f"&scope={scope_str}"
        f"&access_type=offline"
        f"&prompt=consent"
    )
    return url

def exchange_code_for_tokens(code: str) -> Tuple[bool, str]:
    """Exchange the authorization code for access + refresh tokens."""
    import urllib.request
    import urllib.parse

    cfg = _get_google_config()

    data = urllib.parse.urlencode({
        "code": code,
        "client_id": cfg["client_id"],
        "client_secret": cfg["client_secret"],
        "redirect_uri": cfg["redirect_uri"],
        "grant_type": "authorization_code",
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://oauth2.googleapis.com/token",
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        return False, f"Token exchange failed: {e}"

    if "access_token" not in result:
        return False, f"No access_token in response: {result.get('error_description', 'Unknown error')}"

    # Get user email
    email = ""
    try:
        info_req = urllib.request.Request(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {result['access_token']}"},
        )
        with urllib.request.urlopen(info_req, timeout=10) as resp:
            user_info = json.loads(resp.read().decode("utf-8"))
            email = user_info.get("email", "")
    except Exception:
        pass

    tokens = {
        "access_token": result["access_token"],
        "refresh_token": result.get("refresh_token", ""),
        "expires_in": result.get("expires_in", 3600),
        "token_type": result.get("token_type", "Bearer"),
        "email": email,
        "connected_at": datetime.utcnow().isoformat(),
    }

    _save_tokens(tokens)
    print(f"[Google Meet] Successfully connected: {email}")
    return True, email

def _refresh_access_token() -> Optional[str]:
    """Refresh the access token using the stored refresh token."""
    import urllib.request
    import urllib.parse

    tokens = _load_tokens()
    refresh_token = tokens.get("refresh_token")
    if not refresh_token:
        print("[Google Meet] No refresh token available")
        return None

    cfg = _get_google_config()

    data = urllib.parse.urlencode({
        "refresh_token": refresh_token,
        "client_id": cfg["client_id"],
        "client_secret": cfg["client_secret"],
        "grant_type": "refresh_token",
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://oauth2.googleapis.com/token",
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"[Google Meet] Token refresh failed: {e}")
        return None

    new_access = result.get("access_token")
    if new_access:
        tokens["access_token"] = new_access
        tokens["expires_in"] = result.get("expires_in", 3600)
        _save_tokens(tokens)
        return new_access

    return None

def _get_valid_access_token() -> Optional[str]:
    """Get a valid access token, refreshing if necessary."""
    tokens = _load_tokens()
    access_token = tokens.get("access_token")

    if not access_token:
        return _refresh_access_token()

    # Try the existing token first; if it fails, we'll refresh
    return access_token

def _api_call(method: str, url: str, body: Optional[Dict] = None, retry: bool = True) -> Tuple[bool, Any]:
    """Make an authenticated Google API call with auto-refresh."""
    import urllib.request

    access_token = _get_valid_access_token()
    if not access_token:
        return False, "No valid access token. Please reconnect Google Account."

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            return True, result
    except urllib.error.HTTPError as e:
        if e.code == 401 and retry:
            # Token expired, refresh and retry once
            new_token = _refresh_access_token()
            if new_token:
                return _api_call(method, url, body, retry=False)
            return False, "Token refresh failed. Please reconnect Google Account."
        error_body = ""
        try:
            error_body = e.read().decode("utf-8")
        except Exception:
            pass
        return False, f"Google API error {e.code}: {error_body}"
    except Exception as e:
        return False, f"Network error: {e}"

def create_google_meet_event(
    summary: str,
    description: str,
    start_dt: datetime,
    end_dt: datetime,
    attendee_emails: list,
    timezone: str = "Asia/Kolkata",
) -> Tuple[bool, Dict[str, Any]]:
    """
    Create a Google Calendar event with automatic Google Meet conferencing.
    Returns (success, result_dict) where result_dict contains:
      - meet_url: the real Google Meet link
      - event_id: the Google Calendar event ID
      - html_link: link to view the event in Google Calendar
    """
    if not is_google_connected():
        return False, {"error": "Google account not connected. Please connect first."}

    event_body = {
        "summary": summary,
        "description": description,
        "start": {
            "dateTime": start_dt.strftime("%Y-%m-%dT%H:%M:%S"),
            "timeZone": timezone,
        },
        "end": {
            "dateTime": end_dt.strftime("%Y-%m-%dT%H:%M:%S"),
            "timeZone": timezone,
        },
        "attendees": [{"email": e} for e in attendee_emails if e],
        "conferenceData": {
            "createRequest": {
                "requestId": f"sparkx-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
                "conferenceSolutionKey": {
                    "type": "hangoutsMeet"
                },
            }
        },
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "email", "minutes": 30},
                {"method": "popup", "minutes": 15},
            ],
        },
    }

    url = "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all"
    success, result = _api_call("POST", url, event_body)

    if not success:
        return False, {"error": str(result)}

    # Extract Meet link from the response
    meet_url = ""
    conference_data = result.get("conferenceData", {})
    entry_points = conference_data.get("entryPoints", [])
    for ep in entry_points:
        if ep.get("entryPointType") == "video":
            meet_url = ep.get("uri", "")
            break

    # Fallback: check hangoutLink
    if not meet_url:
        meet_url = result.get("hangoutLink", "")

    meet_id = ""
    if meet_url:
        # Extract code from URL: https://meet.google.com/xxx-yyyy-zzz -> xxx-yyyy-zzz
        parts = meet_url.rstrip("/").split("/")
        if parts:
            meet_id = parts[-1]

    return True, {
        "meet_url": meet_url,
        "meet_id": meet_id,
        "event_id": result.get("id", ""),
        "html_link": result.get("htmlLink", ""),
        "status": result.get("status", ""),
    }

def disconnect_google() -> bool:
    """Remove stored Google tokens (disconnect)."""
    try:
        if TOKENS_FILE.exists():
            TOKENS_FILE.unlink()
        print("[Google Meet] Disconnected successfully")
        return True
    except Exception as e:
        print(f"[Google Meet] Disconnect error: {e}")
        return False
