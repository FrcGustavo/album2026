import pytest

from app.config import Settings, validate_settings
from app.infrastructure.security import JoseTokenService, PasslibPasswordHasher


def test_password_hasher_hashes_and_verifies():
    hasher = PasslibPasswordHasher()
    password_hash = hasher.hash("supersecret")

    assert password_hash != "supersecret"
    assert hasher.verify("supersecret", password_hash)
    assert not hasher.verify("wrongwrong", password_hash)


def test_token_service_decodes_subject():
    service = JoseTokenService(Settings(env="test", jwt_secret_key="test-secret"))
    token = service.create_access_token("123")

    assert service.decode_access_token(token)["sub"] == "123"


def test_token_service_rejects_expired_token():
    service = JoseTokenService(Settings(env="test", jwt_secret_key="test-secret", access_token_expire_minutes=-1))
    token = service.create_access_token("123")

    with pytest.raises(ValueError):
        service.decode_access_token(token)


def test_production_requires_explicit_jwt_secret():
    with pytest.raises(ValueError):
        validate_settings(Settings(env="production"))
