from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.infrastructure.database import init_db
from app.interfaces.http.router import router


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Album API", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router)

    return app


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = create_app()
