from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.infrastructure.database import Base, get_session
from app.main import create_app


def make_client(tmp_path: Path):
    engine = create_engine(f"sqlite:///{tmp_path / 'test.sqlite'}", connect_args={"check_same_thread": False})
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)
    app = create_app()

    def override_session():
        with TestingSession() as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    return TestClient(app)


def register(client, email="gus@example.com", name="Gus", password="supersecret"):
    response = client.post("/api/auth/register", json={"email": email, "name": name, "password": password})
    assert response.status_code == 201
    payload = response.json()
    assert payload["access_token"]
    assert payload["token_type"] == "bearer"
    return payload


def auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


def test_auth_register_login_and_me(tmp_path):
    client = make_client(tmp_path)

    session = register(client)
    assert session["user"]["email"] == "gus@example.com"
    assert "password_hash" not in session["user"]

    duplicate = client.post("/api/auth/register", json={"email": "gus@example.com", "name": "Otro", "password": "supersecret"})
    assert duplicate.status_code == 409

    login = client.post("/api/auth/login", json={"email": "gus@example.com", "password": "supersecret"})
    assert login.status_code == 200
    me = client.get("/api/auth/me", headers=auth_headers(login.json()["access_token"]))
    assert me.status_code == 200
    assert me.json()["name"] == "Gus"
    assert "password_hash" not in me.json()

    bad_login = client.post("/api/auth/login", json={"email": "gus@example.com", "password": "wrongwrong"})
    assert bad_login.status_code == 401


def test_authenticated_album_roundtrip(tmp_path):
    client = make_client(tmp_path)
    token = register(client)["access_token"]

    assert client.get("/api/me/album").status_code == 401

    album = client.get("/api/me/album", headers=auth_headers(token)).json()
    album["stickers"]["MEX1"] = 2
    saved = client.put("/api/me/album", json=album, headers=auth_headers(token)).json()

    assert saved["stickers"]["MEX1"] == 2
    assert client.get("/api/me/album", headers=auth_headers(token)).json()["stickers"]["MEX1"] == 2


def test_album_actions(tmp_path):
    client = make_client(tmp_path)
    token = register(client, email="ana@example.com", name="Ana")["access_token"]
    headers = auth_headers(token)

    assert client.post("/api/me/album/stickers/MEX1/increment", headers=headers).json()["stickers"]["MEX1"] == 1
    assert client.patch("/api/me/album/coca-cola", json={"enabled": True}, headers=headers).json()["cocaColaEnabled"] is True
    crack_album = client.post(
        "/api/me/album/cracks",
        json={"player": "Nueva Estrella", "teamId": "MEX", "stickerCode": "MEX11"},
        headers=headers,
    ).json()
    assert len(crack_album["customCracks"]) == 1
    purchase_album = client.post("/api/me/album/purchases", json={"type": "pack", "quantity": 2, "price": 30}, headers=headers).json()
    assert len(purchase_album["purchases"]) == 1
    stats = client.get("/api/me/album/stats", headers=headers).json()
    assert stats["costs"]["spent"] == 30


def test_users_do_not_share_album_state(tmp_path):
    client = make_client(tmp_path)
    gus_token = register(client, email="gus@example.com", name="Gus")["access_token"]
    ana_token = register(client, email="ana@example.com", name="Ana")["access_token"]

    album = client.get("/api/me/album", headers=auth_headers(gus_token)).json()
    album["stickers"]["MEX1"] = 3
    client.put("/api/me/album", json=album, headers=auth_headers(gus_token))

    ana_album = client.get("/api/me/album", headers=auth_headers(ana_token)).json()
    assert ana_album["stickers"].get("MEX1", 0) == 0


def test_openapi_documents_bearer_auth(tmp_path):
    client = make_client(tmp_path)
    schema = client.get("/openapi.json").json()

    assert "HTTPBearer" in schema["components"]["securitySchemes"]
    assert "/api/auth/register" in schema["paths"]
    assert "/api/me/album" in schema["paths"]
