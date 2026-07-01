from __future__ import annotations

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import Settings, get_settings


class PasslibPasswordHasher:
    def __init__(self) -> None:
        self.context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def hash(self, password: str) -> str:
        return self.context.hash(password)

    def verify(self, password: str, password_hash: str | None) -> bool:
        if not password_hash:
            return False
        return self.context.verify(password, password_hash)


class JoseTokenService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    def create_access_token(self, subject: str) -> str:
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=self.settings.access_token_expire_minutes)
        payload = {"sub": subject, "exp": expires_at}
        return jwt.encode(payload, self.settings.jwt_secret_key, algorithm=self.settings.jwt_algorithm)

    def decode_access_token(self, token: str) -> dict:
        try:
            return jwt.decode(token, self.settings.jwt_secret_key, algorithms=[self.settings.jwt_algorithm])
        except JWTError:
            raise ValueError("Token invalido o expirado") from None
