"""
(S) SparkX Production Rate Limiter & Abuse Prevention Module
Provides thread-safe in-memory sliding window rate limiting for high-cost and sensitive endpoints.
Configured via environment variables:
  RATE_LIMIT_ENABLED (default: "true")
  RATE_LIMIT_AUTH_PER_MIN (default: 15)
  RATE_LIMIT_AI_PER_MIN (default: 30)
  RATE_LIMIT_SANDBOX_PER_MIN (default: 40)
  RATE_LIMIT_GENERAL_PER_MIN (default: 200)
"""
import os
import time
import threading
from collections import defaultdict
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

class SlidingWindowRateLimiter:
    """Thread-safe in-memory sliding window rate limiter."""

    def __init__(self):
        self._lock = threading.Lock()
        # Storage: {client_key: [(timestamp, cost)]}
        self._history = defaultdict(list)
        self.enabled = os.environ.get("RATE_LIMIT_ENABLED", "true").strip().lower() in ("true", "1", "yes")

        # Per-minute tier limits
        self.limits = {
            "auth": int(os.environ.get("RATE_LIMIT_AUTH_PER_MIN", "15")),
            "ai": int(os.environ.get("RATE_LIMIT_AI_PER_MIN", "30")),
            "sandbox": int(os.environ.get("RATE_LIMIT_SANDBOX_PER_MIN", "40")),
            "general": int(os.environ.get("RATE_LIMIT_GENERAL_PER_MIN", "200")),
        }

    def _get_tier(self, path: str) -> str:
        p = path.lower()
        if any(a in p for a in ["/api/auth/login", "/api/auth/register", "/api/auth/forgot-password", "/api/auth/reset-password"]):
            return "auth"
        if any(a in p for a in ["/api/candidates/parse-resume", "/api/assessment/generate", "/api/copilot/query"]):
            return "ai"
        if "/api/assessment/run-code" in p:
            return "sandbox"
        return "general"

    def check_rate_limit(self, client_id: str, path: str) -> tuple[bool, int, int]:
        """
        Check if request is permitted under sliding window.
        Returns: (is_allowed, remaining_quota, retry_after_sec)
        """
        if not self.enabled:
            return True, 999, 0

        tier = self._get_tier(path)
        limit = self.limits.get(tier, self.limits["general"])
        window_sec = 60.0
        now = time.time()
        key = f"{client_id}:{tier}"

        with self._lock:
            # Purge timestamps outside window
            entries = self._history[key]
            cutoff = now - window_sec
            valid_entries = [t for t in entries if t > cutoff]
            self._history[key] = valid_entries

            if len(valid_entries) >= limit:
                oldest = valid_entries[0]
                retry_after = max(1, int(window_sec - (now - oldest)))
                return False, 0, retry_after

            valid_entries.append(now)
            remaining = max(0, limit - len(valid_entries))
            return True, remaining, 0

    def reset(self):
        """Clear all rate limit history (useful for test suites)."""
        with self._lock:
            self._history.clear()

# Global singleton
rate_limiter = SlidingWindowRateLimiter()

def get_client_ip(request: Request) -> str:
    """Extract real client IP considering forward proxies safely."""
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    x_real_ip = request.headers.get("X-Real-IP")
    if x_real_ip:
        return x_real_ip.strip()
    if request.client:
        return request.client.host
    return "127.0.0.1"

class RateLimitMiddleware(BaseHTTPMiddleware):
    """FastAPI Middleware to enforce rate limits across incoming requests."""

    async def dispatch(self, request: Request, call_next):
        # Health, docs, openapi, and static paths exempt from rate limiting
        path = request.url.path
        if path.startswith(("/api/health", "/docs", "/openapi.json", "/redoc", "/favicon.ico")):
            return await call_next(request)

        client_ip = get_client_ip(request)
        allowed, remaining, retry_after = rate_limiter.check_rate_limit(client_ip, path)

        if not allowed:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Rate limit exceeded. Too many requests. Please retry later.",
                    "retry_after_seconds": retry_after
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Remaining": "0"
                }
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
