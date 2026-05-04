"""
Rate limiting setup using slowapi.
Supports Cloudflare proxy: reads CF-Connecting-IP header to get the real client IP,
so per-IP limits apply to the actual user, not Cloudflare's edge node IPs.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def _get_real_ip(request: Request) -> str:
    """
    Extract the real client IP in this priority order:
    1. CF-Connecting-IP  — set by Cloudflare, most reliable
    2. X-Forwarded-For   — standard reverse-proxy header (first non-private entry)
    3. Fallback to remote_address (direct connection)
    """
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.strip()

    x_forwarded = request.headers.get("X-Forwarded-For")
    if x_forwarded:
        # Header can be a comma-separated list; first entry is the original client
        return x_forwarded.split(",")[0].strip()

    return get_remote_address(request)


# Single shared Limiter instance — import this everywhere you need @limiter.limit(...)
limiter = Limiter(key_func=_get_real_ip)
