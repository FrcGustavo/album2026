from app.domain.album import (
    add_custom_crack,
    add_purchase,
    decrement_sticker,
    empty_state,
    get_album_stats,
    increment_sticker,
    remove_custom_crack,
    remove_purchase,
    sanitize_state,
)
from app.domain.catalog import FIFA_GROUPS, catalog, sticker_by_code, team_by_id


def test_catalog_includes_bosnia_and_herzegovina():
    assert team_by_id["BIH"]["name"] == "Bosnia y Herzegovina"
    assert sticker_by_code["BIH1"]["title"] == "Escudo Bosnia y Herzegovina"
    assert len(catalog["stickers"]) == 980


def test_catalog_includes_dr_congo():
    assert team_by_id["COD"]["name"] == "Congo RD"
    assert sticker_by_code["COD1"]["title"] == "Escudo Congo RD"
    assert len(catalog["stickers"]) == 980


def test_catalog_includes_panama():
    assert team_by_id["PAN"]["name"] == "Panama"
    assert sticker_by_code["PAN1"]["title"] == "Escudo Panama"
    assert len(catalog["stickers"]) == 980


def test_catalog_uses_fifa_draw_groups():
    group_a = sorted([team for team in catalog["teams"] if team["group"] == "A"], key=lambda team: team["groupPosition"])

    assert [team["id"] for team in group_a] == ["MEX", "RSA", "KOR", "CZE"]
    assert all(len(team_ids) == 4 for team_ids in FIFA_GROUPS.values())
    assert len({team_id for team_ids in FIFA_GROUPS.values() for team_id in team_ids}) == 48


def test_increment_decrement_and_repeated():
    state = empty_state()
    state = increment_sticker(state, "MEX1")
    state = increment_sticker(state, "MEX1")
    stats = get_album_stats(state)

    assert state["stickers"]["MEX1"] == 2
    assert stats["owned"] == 1
    assert stats["repeated"] == 1

    state = decrement_sticker(state, "MEX1")
    assert state["stickers"]["MEX1"] == 1


def test_coca_cola_changes_active_total():
    state = empty_state()
    disabled = get_album_stats(state)
    state["cocaColaEnabled"] = True
    enabled = get_album_stats(state)

    assert enabled["activeTotal"] == disabled["activeTotal"] + 14


def test_custom_crack_lifecycle():
    state = add_custom_crack(empty_state(), {"player": "Mi Crack", "teamId": "MEX", "stickerCode": "MEX11"})
    crack_id = state["customCracks"][0]["id"]

    assert get_album_stats(state)["cracks"]["total"] == 49
    state = remove_custom_crack(state, crack_id)
    assert state["customCracks"] == []


def test_cost_stats_with_income():
    state = add_purchase(empty_state(), {"type": "box", "quantity": 1, "price": 100, "packsPerBox": 10, "stickersPerPack": 7})
    state = add_purchase(state, {"type": "income", "price": 25})
    stats = get_album_stats(state)["costs"]

    assert stats["spent"] == 100
    assert stats["income"] == 25
    assert stats["net"] == 75
    assert stats["packs"] == 10
    assert stats["estimatedStickers"] == 70


def test_sanitize_rejects_unknown_codes():
    state = sanitize_state({"stickers": {"NOPE": 2, "MEX1": 1}, "version": 2})

    assert state["stickers"] == {"MEX1": 1}
