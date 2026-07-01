from fastapi import Depends
from sqlalchemy.orm import Session

from app.application.services import AlbumService, UserService
from app.infrastructure.database import get_session
from app.infrastructure.repositories import SqlAlchemyAlbumRepository, SqlAlchemyUserRepository


def get_user_service(session: Session = Depends(get_session)) -> UserService:
    return UserService(SqlAlchemyUserRepository(session))


def get_album_service(session: Session = Depends(get_session)) -> AlbumService:
    users = SqlAlchemyUserRepository(session)
    albums = SqlAlchemyAlbumRepository(session)
    return AlbumService(users, albums)
