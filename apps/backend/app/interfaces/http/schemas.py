from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)


class UserOut(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AlbumState(BaseModel):
    version: Literal[2] = 2
    stickers: dict[str, int] = Field(default_factory=dict)
    specials: dict[str, int] = Field(default_factory=dict)
    cocaColaEnabled: bool = False
    cocaCola: dict[str, int] = Field(default_factory=dict)
    customCracks: list[dict[str, Any]] = Field(default_factory=list)
    purchases: list[dict[str, Any]] = Field(default_factory=list)


class CocaColaPatch(BaseModel):
    enabled: bool


class CrackCreate(BaseModel):
    player: str
    teamId: str
    stickerCode: str


class PurchaseCreate(BaseModel):
    type: str
    date: Optional[str] = None
    quantity: float = 1
    price: float = 0
    packsPerBox: float = 0
    stickersPerPack: float = 7
    notes: str = ""
