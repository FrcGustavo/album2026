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


def test_user_album_roundtrip(tmp_path):
    client = make_client(tmp_path)

    user = client.post("/api/users", json={"name": "Gus"}).json()
    assert user["id"]
    assert client.post("/api/users", json={"name": "gus"}).json()["id"] == user["id"]

    album = client.get(f"/api/users/{user['id']}/album").json()
    album["stickers"]["MEX1"] = 2
    saved = client.put(f"/api/users/{user['id']}/album", json=album).json()

    assert saved["stickers"]["MEX1"] == 2
    assert client.get(f"/api/users/{user['id']}/album").json()["stickers"]["MEX1"] == 2


def test_album_actions(tmp_path):
    client = make_client(tmp_path)
    user_id = client.post("/api/users", json={"name": "Ana"}).json()["id"]

    assert client.post(f"/api/users/{user_id}/album/stickers/MEX1/increment").json()["stickers"]["MEX1"] == 1
    assert client.patch(f"/api/users/{user_id}/album/coca-cola", json={"enabled": True}).json()["cocaColaEnabled"] is True
    crack_album = client.post(
        f"/api/users/{user_id}/album/cracks",
        json={"player": "Nueva Estrella", "teamId": "MEX", "stickerCode": "MEX11"},
    ).json()
    assert len(crack_album["customCracks"]) == 1
    purchase_album = client.post(f"/api/users/{user_id}/album/purchases", json={"type": "pack", "quantity": 2, "price": 30}).json()
    assert len(purchase_album["purchases"]) == 1
    stats = client.get(f"/api/users/{user_id}/album/stats").json()
    assert stats["costs"]["spent"] == 30
