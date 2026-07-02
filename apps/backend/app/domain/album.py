from __future__ import annotations

from copy import deepcopy
from datetime import date
from typing import Any
from uuid import uuid4

from app.domain.catalog import catalog, official_cracks, sticker_by_code, sticker_by_number


def empty_state() -> dict[str, Any]:
    return {
        "version": 2,
        "stickers": {},
        "specials": {},
        "cocaColaEnabled": catalog["addons"]["cocaCola"]["enabledDefault"],
        "cocaCola": {},
        "customCracks": [],
        "purchases": [],
    }


def normalize_copies(value: Any) -> int:
    try:
        copies = int(value)
    except (TypeError, ValueError):
        return 0
    return copies if copies > 0 else 0


def sanitize_state(value: Any) -> dict[str, Any]:
    next_state = empty_state()
    if not isinstance(value, dict):
        return next_state

    for code, copies in (value.get("stickers") or {}).items():
        normalized = normalize_copies(copies)
        sticker = sticker_by_code.get(code)
        if normalized and sticker and not sticker["isSpecial"] and sticker["type"] != "coca-cola":
            next_state["stickers"][code] = normalized

    for code, copies in (value.get("specials") or {}).items():
        normalized = normalize_copies(copies)
        sticker = sticker_by_code.get(code)
        if normalized and sticker and sticker["isSpecial"]:
            next_state["specials"][code] = normalized

    for code, copies in (value.get("cocaCola") or {}).items():
        normalized = normalize_copies(copies)
        sticker = sticker_by_code.get(code)
        if normalized and sticker and sticker["type"] == "coca-cola":
            next_state["cocaCola"][code] = normalized

    next_state["cocaColaEnabled"] = bool(value.get("cocaColaEnabled"))
    next_state["customCracks"] = [
        {
            "id": str(crack.get("id") or uuid4()),
            "player": str(crack["player"]),
            "teamId": str(crack["teamId"]),
            "stickerCode": str(crack["stickerCode"]),
            "official": False,
        }
        for crack in value.get("customCracks") or []
        if isinstance(crack, dict)
        and crack.get("player")
        and crack.get("teamId")
        and sticker_by_code.get(str(crack.get("stickerCode")))
    ]
    next_state["purchases"] = [
        {
            "id": str(purchase.get("id") or uuid4()),
            "type": str(purchase["type"]),
            "date": str(purchase.get("date") or date.today().isoformat()),
            "quantity": float(purchase.get("quantity") or 1),
            "price": float(purchase.get("price") or 0),
            "packsPerBox": float(purchase.get("packsPerBox") or 0),
            "stickersPerPack": float(purchase.get("stickersPerPack") or 7),
            "notes": str(purchase.get("notes") or ""),
        }
        for purchase in value.get("purchases") or []
        if isinstance(purchase, dict) and purchase.get("type") and _is_number(purchase.get("price"))
    ]
    return next_state


def migrate_v1(value: Any) -> dict[str, Any]:
    next_state = empty_state()
    if not isinstance(value, dict):
        return next_state
    for number, copies in value.items():
        sticker = sticker_by_number.get(str(number))
        normalized = normalize_copies(copies)
        if not sticker or not normalized:
            continue
        bucket = "specials" if sticker["isSpecial"] else "stickers"
        next_state[bucket][sticker["code"]] = normalized
    return next_state


def increment_sticker(state: dict[str, Any], code: str) -> dict[str, Any]:
    return set_sticker_copies(state, code, copies_for(state, code) + 1)


def decrement_sticker(state: dict[str, Any], code: str) -> dict[str, Any]:
    return set_sticker_copies(state, code, copies_for(state, code) - 1)


def set_sticker_copies(state: dict[str, Any], code: str, copies: int) -> dict[str, Any]:
    sticker = sticker_by_code.get(code)
    if not sticker:
        raise ValueError("Sticker desconocida")
    next_state = sanitize_state(deepcopy(state))
    bucket = collection_key(sticker)
    if copies <= 0:
        next_state[bucket].pop(code, None)
    else:
        next_state[bucket][code] = copies
    return next_state


def copies_for(state: dict[str, Any], code: str) -> int:
    sticker = sticker_by_code.get(code)
    if not sticker:
        return 0
    return normalize_copies(state.get(collection_key(sticker), {}).get(code))


def collection_key(sticker: dict[str, Any]) -> str:
    if sticker["type"] == "coca-cola":
        return "cocaCola"
    return "specials" if sticker["isSpecial"] else "stickers"


def get_album_stats(state: dict[str, Any]) -> dict[str, Any]:
    clean = sanitize_state(state)
    active = get_active_album_stickers(clean)
    base = summarize_list(catalog["stickers"], clean)
    all_stickers = summarize_list(active, clean)
    cracks = get_cracks(clean)
    found_cracks = len([crack for crack in cracks if copies_for(clean, crack["stickerCode"]) > 0])
    return {
        **all_stickers,
        "baseTotal": base["total"],
        "activeTotal": len(active),
        "shields": summarize_list([s for s in catalog["stickers"] if s["isShield"]], clean),
        "teamPhotos": summarize_list([s for s in catalog["stickers"] if s["isTeamPhoto"]], clean),
        "shieldsAndTeamPhotos": summarize_list([s for s in catalog["stickers"] if s["isShield"] or s["isTeamPhoto"]], clean),
        "completedTeams": summarize_completed_teams(clean),
        "specials": summarize_list(catalog["specials"], clean),
        "cocaCola": summarize_list(catalog["addons"]["cocaCola"]["stickers"], clean),
        "cracks": {
            "total": len(cracks),
            "owned": found_cracks,
            "missing": len(cracks) - found_cracks,
            "percent": round((found_cracks / len(cracks)) * 100, 1) if cracks else 0,
        },
        "costs": get_cost_stats(clean, all_stickers),
    }


def summarize_completed_teams(state: dict[str, Any]) -> dict[str, Any]:
    completed = 0
    for team in catalog["teams"]:
        summary = summarize_list(get_team_stickers(team["id"]), state)
        if summary["total"] > 0 and summary["owned"] == summary["total"]:
            completed += 1
    total = len(catalog["teams"])
    return {
        "total": total,
        "owned": completed,
        "missing": total - completed,
        "repeated": 0,
        "percent": round((completed / total) * 100, 1) if total else 0,
    }


def get_team_stickers(team_id: str) -> list[dict[str, Any]]:
    return [sticker for sticker in catalog["stickers"] if sticker["teamId"] == team_id]


def summarize_list(stickers: list[dict[str, Any]], state: dict[str, Any]) -> dict[str, Any]:
    owned = len([sticker for sticker in stickers if copies_for(state, sticker["code"]) > 0])
    repeated = sum(max(0, copies_for(state, sticker["code"]) - 1) for sticker in stickers)
    total = len(stickers)
    return {
        "total": total,
        "owned": owned,
        "missing": total - owned,
        "repeated": repeated,
        "percent": round((owned / total) * 100, 1) if total else 0,
    }


def get_active_album_stickers(state: dict[str, Any]) -> list[dict[str, Any]]:
    if state.get("cocaColaEnabled"):
        return [*catalog["stickers"], *catalog["addons"]["cocaCola"]["stickers"]]
    return catalog["stickers"]


def get_cracks(state: dict[str, Any]) -> list[dict[str, Any]]:
    return [*official_cracks, *state.get("customCracks", [])]


def add_custom_crack(state: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    sticker_code = str(payload.get("stickerCode") or "")
    if not payload.get("player") or not sticker_by_code.get(sticker_code):
        raise ValueError("Crack invalido")
    next_state = sanitize_state(deepcopy(state))
    if any(crack["stickerCode"] == sticker_code for crack in get_cracks(next_state)):
        raise ValueError("La figurita ya esta marcada como crack")
    next_state["customCracks"].append(
        {
            "id": str(payload.get("id") or uuid4()),
            "player": str(payload["player"]).strip(),
            "teamId": str(payload.get("teamId") or sticker_by_code[sticker_code].get("teamId")),
            "stickerCode": sticker_code,
            "official": False,
        }
    )
    return next_state


def remove_custom_crack(state: dict[str, Any], crack_id: str) -> dict[str, Any]:
    next_state = sanitize_state(deepcopy(state))
    next_state["customCracks"] = [crack for crack in next_state["customCracks"] if crack["id"] != crack_id]
    return next_state


def add_purchase(state: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    next_state = sanitize_state(deepcopy(state))
    next_state["purchases"].insert(0, sanitize_state({"purchases": [{**payload, "id": payload.get("id") or str(uuid4())}]} )["purchases"][0])
    return next_state


def remove_purchase(state: dict[str, Any], purchase_id: str) -> dict[str, Any]:
    next_state = sanitize_state(deepcopy(state))
    next_state["purchases"] = [purchase for purchase in next_state["purchases"] if purchase["id"] != purchase_id]
    return next_state


def get_cost_stats(state: dict[str, Any], album_stats: dict[str, Any]) -> dict[str, float]:
    stats = {"spent": 0, "income": 0, "packs": 0, "estimatedStickers": 0}
    for purchase in state.get("purchases", []):
        price = float(purchase.get("price") or 0)
        quantity = float(purchase.get("quantity") or 0)
        packs_per_box = float(purchase.get("packsPerBox") or 0)
        stickers_per_pack = float(purchase.get("stickersPerPack") or 7)
        purchase_type = purchase.get("type")
        is_income = purchase_type == "income"
        packs = quantity * packs_per_box if purchase_type == "box" else quantity if purchase_type == "pack" else 0
        estimated = (
            packs * stickers_per_pack
            if purchase_type in ("box", "pack")
            else quantity
            if purchase_type in ("single", "exchange")
            else 0
        )
        stats["spent"] += 0 if is_income else price
        stats["income"] += price if is_income else 0
        stats["packs"] += packs
        stats["estimatedStickers"] += estimated
    net = stats["spent"] - stats["income"]
    owned = album_stats.get("owned", 0)
    stats.update(
        {
            "net": net,
            "avgPerPack": net / stats["packs"] if stats["packs"] else 0,
            "avgPerSticker": net / stats["estimatedStickers"] if stats["estimatedStickers"] else 0,
            "avgPerNew": net / owned if owned else 0,
            "openingEfficiency": round((owned / stats["estimatedStickers"]) * 100, 1) if stats["estimatedStickers"] else 0,
        }
    )
    return stats


def _is_number(value: Any) -> bool:
    try:
        float(value)
    except (TypeError, ValueError):
        return False
    return True
