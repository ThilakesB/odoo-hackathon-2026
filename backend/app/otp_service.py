import hashlib
import secrets
import time
import json
from typing import Optional, Tuple
from app.config import settings

# Thread-safe in-memory fallback stores
# _IN_MEMORY_OTP_STORE: { email: { "hash": str, "expires_at": float, "attempts": int } }
# _IN_MEMORY_RATE_LIMIT: { email: float (timestamp of last request) }
_IN_MEMORY_OTP_STORE = {}
_IN_MEMORY_RATE_LIMIT = {}

# Try importing redis if available
_redis_client = None
if settings.REDIS_URL:
    try:
        import redis
        _redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        # Test connection
        _redis_client.ping()
        print(f"[OTPService] Connected to Redis at {settings.REDIS_URL}")
    except Exception as e:
        print(f"[OTPService] Redis connection failed, falling back to in-memory store: {e}")
        _redis_client = None


class OTPService:
    OTP_EXPIRY_SECONDS: int = 300  # 5 minutes
    RATE_LIMIT_SECONDS: int = 60   # 1 request per 60 seconds
    MAX_ATTEMPTS: int = 5          # 5 attempts per OTP

    @staticmethod
    def generate_otp() -> str:
        """Generates a cryptographically secure 6-digit numerical OTP."""
        return f"{secrets.randbelow(900000) + 100000}"

    @staticmethod
    def hash_otp(email: str, otp: str) -> str:
        """Generates a SHA-256 hash of the email and OTP."""
        payload = f"{email.strip().lower()}:{otp.strip()}".encode("utf-8")
        return hashlib.sha256(payload).hexdigest()

    @classmethod
    def check_rate_limit(cls, email: str) -> Tuple[bool, int]:
        """
        Enforces a 60-second rate limit per email.
        Returns: (is_allowed: bool, retry_after_seconds: int)
        """
        email_clean = email.strip().lower()
        now = time.time()

        if _redis_client:
            try:
                rate_key = f"rate_limit:{email_clean}"
                ttl = _redis_client.ttl(rate_key)
                if ttl > 0:
                    return False, ttl
                # Set rate limit
                _redis_client.set(rate_key, "1", ex=cls.RATE_LIMIT_SECONDS)
                return True, 0
            except Exception as e:
                print(f"[OTPService] Redis rate_limit error, using in-memory: {e}")

        # In-memory fallback
        last_request_time = _IN_MEMORY_RATE_LIMIT.get(email_clean, 0)
        elapsed = now - last_request_time
        if elapsed < cls.RATE_LIMIT_SECONDS:
            remaining = int(cls.RATE_LIMIT_SECONDS - elapsed)
            return False, remaining

        _IN_MEMORY_RATE_LIMIT[email_clean] = now
        return True, 0

    @classmethod
    def store_otp(cls, email: str, otp: str, expiry_seconds: int = 300) -> str:
        """
        Hashes and stores the OTP with an expiration and attempt counter.
        """
        email_clean = email.strip().lower()
        hashed = cls.hash_otp(email_clean, otp)
        expires_at = time.time() + expiry_seconds

        if _redis_client:
            try:
                otp_key = f"otp:{email_clean}"
                data = {
                    "hash": hashed,
                    "attempts": 0
                }
                _redis_client.set(otp_key, json.dumps(data), ex=expiry_seconds)
                return hashed
            except Exception as e:
                print(f"[OTPService] Redis store_otp error, using in-memory: {e}")

        # In-memory fallback
        _IN_MEMORY_OTP_STORE[email_clean] = {
            "hash": hashed,
            "expires_at": expires_at,
            "attempts": 0
        }
        return hashed

    @classmethod
    def verify_otp(cls, email: str, otp: str) -> Tuple[bool, str]:
        """
        Verifies the OTP against its SHA-256 hash and validates expiration and attempt limits.
        Returns: (is_valid: bool, error_reason: str)
        """
        email_clean = email.strip().lower()
        submitted_hash = cls.hash_otp(email_clean, otp)
        now = time.time()

        if _redis_client:
            try:
                otp_key = f"otp:{email_clean}"
                raw_data = _redis_client.get(otp_key)
                if not raw_data:
                    return False, "OTP has expired or does not exist. Please request a new code."

                data = json.loads(raw_data)
                attempts = data.get("attempts", 0) + 1

                if attempts > cls.MAX_ATTEMPTS:
                    _redis_client.delete(otp_key)
                    return False, "Maximum verification attempts exceeded. Please request a new OTP."

                # Update attempts count with remaining TTL
                ttl = _redis_client.ttl(otp_key)
                if ttl > 0:
                    data["attempts"] = attempts
                    _redis_client.set(otp_key, json.dumps(data), ex=ttl)

                if data["hash"] != submitted_hash:
                    remaining_attempts = cls.MAX_ATTEMPTS - attempts
                    return False, f"Invalid OTP code. {remaining_attempts} attempt(s) remaining."

                # Success - delete OTP
                _redis_client.delete(otp_key)
                return True, "OTP verified successfully"
            except Exception as e:
                print(f"[OTPService] Redis verify_otp error, using in-memory: {e}")

        # In-memory fallback
        record = _IN_MEMORY_OTP_STORE.get(email_clean)
        if not record:
            return False, "OTP has expired or does not exist. Please request a new code."

        if now > record["expires_at"]:
            del _IN_MEMORY_OTP_STORE[email_clean]
            return False, "OTP has expired. Please request a new code."

        record["attempts"] += 1
        if record["attempts"] > cls.MAX_ATTEMPTS:
            del _IN_MEMORY_OTP_STORE[email_clean]
            return False, "Maximum verification attempts exceeded. Please request a new OTP."

        if record["hash"] != submitted_hash:
            remaining_attempts = cls.MAX_ATTEMPTS - record["attempts"]
            return False, f"Invalid OTP code. {remaining_attempts} attempt(s) remaining."

        # Success - delete OTP
        del _IN_MEMORY_OTP_STORE[email_clean]
        return True, "OTP verified successfully"

    @classmethod
    def delete_otp(cls, email: str) -> None:
        """Deletes OTP on demand."""
        email_clean = email.strip().lower()
        if _redis_client:
            try:
                _redis_client.delete(f"otp:{email_clean}")
            except Exception:
                pass
        _IN_MEMORY_OTP_STORE.pop(email_clean, None)
