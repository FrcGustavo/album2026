import json
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.infrastructure.database import Base, get_session
from app.infrastructure.database import AlbumStateModel
from app.main import create_app


def make_client(tmp_path: Path):
    engine = create_engine(f"sqlite:///{tmp_path / 'test.sqlite'}", connect_args={"check_same_thread": False})
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)
    app = create_app()
    app.state.TestingSession = TestingSession

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
    assert "album_access_token" in response.cookies
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
    cookie_me = client.get("/api/auth/me")
    assert cookie_me.status_code == 200
    assert cookie_me.json()["email"] == "gus@example.com"

    logout = client.post("/api/auth/logout")
    assert logout.status_code == 204

    bad_login = client.post("/api/auth/login", json={"email": "gus@example.com", "password": "wrongwrong"})
    assert bad_login.status_code == 401


def test_authenticated_album_roundtrip(tmp_path):
    client = make_client(tmp_path)
    token = register(client)["access_token"]

    anonymous = make_client(tmp_path)
    assert anonymous.get("/api/me/album").status_code == 401

    album = client.get("/api/me/album", headers=auth_headers(token)).json()
    album["stickers"]["MEX1"] = 2
    response = client.put("/api/me/album", json=album, headers=auth_headers(token))
    saved = response.json()

    assert saved["stickers"]["MEX1"] == 2
    assert response.headers["X-Album-Revision"]
    assert response.headers["ETag"]
    assert response.headers["X-Album-Storage-Version"] == "normalized"
    assert response.headers["X-Album-Migration-Required"] == "false"
    assert client.get("/api/me/album", headers=auth_headers(token)).json()["stickers"]["MEX1"] == 2


def test_album_revision_conflicts(tmp_path):
    client = make_client(tmp_path)
    token = register(client)["access_token"]
    headers = auth_headers(token)
    loaded = client.get("/api/me/album", headers=headers)
    revision = loaded.headers["X-Album-Revision"]
    album = loaded.json()
    album["stickers"]["MEX1"] = 1

    first = client.put("/api/me/album", json=album, headers={**headers, "If-Match": f'"{revision}"'})
    assert first.status_code == 200
    stale = client.put("/api/me/album", json=album, headers={**headers, "If-Match": f'"{revision}"'})
    assert stale.status_code == 409


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
    assert client.post("/api/me/album/import", json={"state": {"purchases": [{"type": "pack", "price": 20, "source": "Oxxo"}]}}, headers=headers).json()["purchases"][0]["source"] == "Oxxo"
    stats = client.get("/api/me/album/stats", headers=headers).json()
    assert stats["costs"]["spent"] == 20


def test_users_do_not_share_album_state(tmp_path):
    client = make_client(tmp_path)
    gus_token = register(client, email="gus@example.com", name="Gus")["access_token"]
    client.post("/api/auth/logout")
    ana_token = register(client, email="ana@example.com", name="Ana")["access_token"]
    client.post("/api/auth/logout")

    album = client.get("/api/me/album", headers=auth_headers(gus_token)).json()
    album["stickers"]["MEX1"] = 3
    client.put("/api/me/album", json=album, headers=auth_headers(gus_token))

    ana_album = client.get("/api/me/album", headers=auth_headers(ana_token)).json()
    assert ana_album["stickers"].get("MEX1", 0) == 0


def test_legacy_album_requires_and_runs_migration(tmp_path):
    client = make_client(tmp_path)
    token = register(client)["access_token"]
    headers = auth_headers(token)
    legacy_state = {
        "version": 2,
        "stickers": {"MEX1": 2},
        "specials": {"FWC1": 1},
        "cocaColaEnabled": True,
        "cocaCola": {"CC1": 3},
        "customCracks": [{"id": "crack-1", "player": "Nueva Estrella", "teamId": "MEX", "stickerCode": "MEX11"}],
        "purchases": [{"id": "purchase-1", "type": "pack", "date": "2026-07-09", "quantity": 2, "price": 30, "packsPerBox": 0, "stickersPerPack": 7, "notes": "", "source": "Oxxo"}],
        "activityLog": [{"id": "activity-1", "type": "stickers", "message": "Agregaste MEX1", "stickerCode": "MEX1", "createdAt": "2026-07-09T00:00:00+00:00"}],
    }
    with client.app.state.TestingSession() as session:
        session.add(AlbumStateModel(user_id=1, state_json=json.dumps(legacy_state), revision=7))
        session.commit()

    loaded = client.get("/api/me/album", headers=headers)
    assert loaded.status_code == 200
    assert loaded.headers["X-Album-Storage-Version"] == "legacy"
    assert loaded.headers["X-Album-Migration-Required"] == "true"
    assert loaded.json()["stickers"]["MEX1"] == 2

    status = client.get("/api/me/album/migration-status", headers=headers).json()
    assert status == {"required": True, "storageVersion": "legacy", "legacyRevision": 7, "normalizedRevision": None}

    migrated = client.post("/api/me/album/migrate", headers=headers)
    assert migrated.status_code == 200
    assert migrated.headers["X-Album-Storage-Version"] == "normalized"
    assert migrated.headers["X-Album-Migration-Required"] == "false"
    assert migrated.json()["stickers"]["MEX1"] == 2
    assert migrated.json()["specials"]["FWC1"] == 1
    assert migrated.json()["cocaCola"]["CC1"] == 3
    assert migrated.json()["customCracks"][0]["stickerCode"] == "MEX11"
    assert migrated.json()["purchases"][0]["source"] == "Oxxo"
    assert migrated.json()["activityLog"][0]["stickerCode"] == "MEX1"

    second = client.post("/api/me/album/migrate", headers=headers)
    assert second.status_code == 200
    assert second.json() == migrated.json()

    status_after = client.get("/api/me/album/migration-status", headers=headers).json()
    assert status_after["required"] is False
    assert status_after["storageVersion"] == "normalized"
    assert status_after["normalizedRevision"] == 7


def test_openapi_documents_bearer_auth(tmp_path):
    client = make_client(tmp_path)
    schema = client.get("/openapi.json").json()

    assert "HTTPBearer" in schema["components"]["securitySchemes"]
    assert "/api/auth/register" in schema["paths"]
    assert "/api/me/album" in schema["paths"]
