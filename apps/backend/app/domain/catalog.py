from __future__ import annotations

BASE_TOTAL = 980
GROUPS = list("ABCDEFGHIJKL")

RAW_TEAMS = [
    ("CAN", "Canada", "ca"),
    ("MEX", "Mexico", "mx"),
    ("USA", "Estados Unidos", "us"),
    ("JPN", "Japon", "jp"),
    ("NZL", "Nueva Zelanda", "nz"),
    ("IRN", "Iran", "ir"),
    ("ARG", "Argentina", "ar"),
    ("UZB", "Uzbekistan", "uz"),
    ("KOR", "Corea del Sur", "kr"),
    ("JOR", "Jordania", "jo"),
    ("AUS", "Australia", "au"),
    ("BRA", "Brasil", "br"),
    ("ECU", "Ecuador", "ec"),
    ("URU", "Uruguay", "uy"),
    ("COL", "Colombia", "co"),
    ("PAR", "Paraguay", "py"),
    ("MAR", "Marruecos", "ma"),
    ("TUN", "Tunez", "tn"),
    ("EGY", "Egipto", "eg"),
    ("ALG", "Argelia", "dz"),
    ("GHA", "Ghana", "gh"),
    ("CPV", "Cabo Verde", "cv"),
    ("RSA", "Sudafrica", "za"),
    ("SEN", "Senegal", "sn"),
    ("CIV", "Costa de Marfil", "ci"),
    ("COD", "Congo RD", "cd"),
    ("QAT", "Qatar", "qa"),
    ("KSA", "Arabia Saudita", "sa"),
    ("IRQ", "Irak", "iq"),
    ("FRA", "Francia", "fr"),
    ("GER", "Alemania", "de"),
    ("ESP", "Espana", "es"),
    ("ENG", "Inglaterra", "gb-eng"),
    ("POR", "Portugal", "pt"),
    ("NED", "Paises Bajos", "nl"),
    ("BEL", "Belgica", "be"),
    ("CRO", "Croacia", "hr"),
    ("SUI", "Suiza", "ch"),
    ("AUT", "Austria", "at"),
    ("NOR", "Noruega", "no"),
    ("SCO", "Escocia", "gb-sct"),
    ("TUR", "Turquia", "tr"),
    ("CZE", "Republica Checa", "cz"),
    ("PAN", "Panama", "pa"),
    ("SWE", "Suecia", "se"),
    ("BIH", "Bosnia y Herzegovina", "ba"),
    ("HAI", "Haiti", "ht"),
    ("CUW", "Curazao", "cw"),
]

FIFA_GROUPS = {
    "A": ["MEX", "RSA", "KOR", "CZE"],
    "B": ["CAN", "BIH", "QAT", "SUI"],
    "C": ["BRA", "MAR", "HAI", "SCO"],
    "D": ["USA", "PAR", "AUS", "TUR"],
    "E": ["GER", "CUW", "CIV", "ECU"],
    "F": ["NED", "JPN", "SWE", "TUN"],
    "G": ["BEL", "EGY", "IRN", "NZL"],
    "H": ["ESP", "CPV", "KSA", "URU"],
    "I": ["FRA", "SEN", "IRQ", "NOR"],
    "J": ["ARG", "ALG", "AUT", "JOR"],
    "K": ["POR", "COD", "UZB", "COL"],
    "L": ["ENG", "CRO", "GHA", "PAN"],
}

TEAM_GROUPS = {
    team_id: {"group": group, "groupPosition": group_position}
    for group, team_ids in FIFA_GROUPS.items()
    for group_position, team_id in enumerate(team_ids)
}

STAR_PLAYERS = {
    "ARG": "Lionel Messi",
    "FRA": "Kylian Mbappe",
    "POR": "Cristiano Ronaldo",
    "ESP": "Lamine Yamal",
    "ENG": "Jude Bellingham",
    "BRA": "Vinicius Junior",
    "MEX": "Santiago Gimenez",
    "NOR": "Erling Haaland",
    "EGY": "Mohamed Salah",
    "GER": "Joshua Kimmich",
    "URU": "Federico Valverde",
    "NED": "Virgil van Dijk",
    "BIH": "Edin Dzeko",
}

PLAYER_NAMES = [
    "Portero titular",
    "Defensa central",
    "Lateral derecho",
    "Lateral izquierdo",
    "Capitan",
    "Mediocampista",
    "Volante mixto",
    "Extremo derecho",
    "Extremo izquierdo",
    "Delantero centro",
    "Creador de juego",
    "Recambio clave",
    "Joven promesa",
    "Especialista",
    "Goleador",
    "Figura historica",
    "Arquero suplente",
    "Defensa suplente",
]


def build_catalog() -> dict:
    teams = [
        {
            "id": team_id,
            "code": team_id,
            "name": name,
            "group": TEAM_GROUPS[team_id]["group"],
            "groupPosition": TEAM_GROUPS[team_id]["groupPosition"],
            "flagUrl": f"https://flagcdn.com/w80/{flag_code}.png",
        }
        for index, (team_id, name, flag_code) in enumerate(RAW_TEAMS)
    ]
    specials = [
        {"code": "00", "number": 1, "title": "Emblema FIFA World Cup 26"},
        *[
            {"code": f"FWC{index + 1}", "number": index + 2, "title": f"Especial FWC{index + 1}"}
            for index in range(19)
        ],
    ]
    specials = [
        {
            **sticker,
            "teamId": None,
            "type": "especial",
            "isSpecial": True,
            "isShield": False,
            "isTeamPhoto": False,
        }
        for sticker in specials
    ]
    team_stickers = []
    for team_index, team in enumerate(teams):
        for index in range(20):
            slot = index + 1
            is_shield = slot == 1
            is_team_photo = slot == 2
            is_crack = slot == 10
            title = (
                f"Escudo {team['name']}"
                if is_shield
                else f"Equipo completo {team['name']}"
                if is_team_photo
                else STAR_PLAYERS.get(team["id"], f"{team['name']} - Jugador estrella")
                if is_crack
                else f"{team['name']} - {PLAYER_NAMES[(slot - 3 + len(PLAYER_NAMES)) % len(PLAYER_NAMES)]}"
            )
            team_stickers.append(
                {
                    "code": f"{team['id']}{slot}",
                    "number": 21 + team_index * 20 + index,
                    "teamId": team["id"],
                    "type": "escudo" if is_shield else "equipo" if is_team_photo else "jugador",
                    "title": title,
                    "isSpecial": False,
                    "isShield": is_shield,
                    "isTeamPhoto": is_team_photo,
                }
            )
    coca_cola = [
        {
            "code": f"CC{index + 1}",
            "number": BASE_TOTAL + index + 1,
            "teamId": None,
            "type": "coca-cola",
            "title": f"Coca-Cola {index + 1:02}",
            "isSpecial": False,
            "isShield": False,
            "isTeamPhoto": False,
        }
        for index in range(14)
    ]
    return {
        "baseTotal": BASE_TOTAL,
        "teams": teams,
        "groups": GROUPS,
        "specials": specials,
        "stickers": [*specials, *team_stickers],
        "addons": {"cocaCola": {"enabledDefault": False, "stickers": coca_cola}},
    }


catalog = build_catalog()
sticker_by_code = {sticker["code"]: sticker for sticker in [*catalog["stickers"], *catalog["addons"]["cocaCola"]["stickers"]]}
sticker_by_number = {str(sticker["number"]): sticker for sticker in catalog["stickers"]}
team_by_id = {team["id"]: team for team in catalog["teams"]}
official_cracks = [
    {
        "id": f"official-{team['id']}",
        "player": STAR_PLAYERS.get(team["id"], f"{team['name']} - Crack"),
        "teamId": team["id"],
        "stickerCode": f"{team['id']}10",
        "official": True,
    }
    for team in catalog["teams"]
]
