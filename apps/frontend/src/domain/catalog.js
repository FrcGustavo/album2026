export const BASE_TOTAL = 980;
export const GROUPS = 'ABCDEFGHIJKL'.split('');

const RAW_TEAMS = [
  ['CAN', 'Canada', 'ca'],
  ['MEX', 'Mexico', 'mx'],
  ['USA', 'Estados Unidos', 'us'],
  ['JPN', 'Japon', 'jp'],
  ['NZL', 'Nueva Zelanda', 'nz'],
  ['IRN', 'Iran', 'ir'],
  ['ARG', 'Argentina', 'ar'],
  ['UZB', 'Uzbekistan', 'uz'],
  ['KOR', 'Corea del Sur', 'kr'],
  ['JOR', 'Jordania', 'jo'],
  ['AUS', 'Australia', 'au'],
  ['BRA', 'Brasil', 'br'],
  ['ECU', 'Ecuador', 'ec'],
  ['URU', 'Uruguay', 'uy'],
  ['COL', 'Colombia', 'co'],
  ['PAR', 'Paraguay', 'py'],
  ['MAR', 'Marruecos', 'ma'],
  ['TUN', 'Tunez', 'tn'],
  ['EGY', 'Egipto', 'eg'],
  ['ALG', 'Argelia', 'dz'],
  ['GHA', 'Ghana', 'gh'],
  ['CPV', 'Cabo Verde', 'cv'],
  ['RSA', 'Sudafrica', 'za'],
  ['SEN', 'Senegal', 'sn'],
  ['CIV', 'Costa de Marfil', 'ci'],
  ['COD', 'Congo RD', 'cd'],
  ['QAT', 'Qatar', 'qa'],
  ['KSA', 'Arabia Saudita', 'sa'],
  ['IRQ', 'Irak', 'iq'],
  ['FRA', 'Francia', 'fr'],
  ['GER', 'Alemania', 'de'],
  ['ESP', 'Espana', 'es'],
  ['ENG', 'Inglaterra', 'gb-eng'],
  ['POR', 'Portugal', 'pt'],
  ['NED', 'Paises Bajos', 'nl'],
  ['BEL', 'Belgica', 'be'],
  ['CRO', 'Croacia', 'hr'],
  ['SUI', 'Suiza', 'ch'],
  ['AUT', 'Austria', 'at'],
  ['NOR', 'Noruega', 'no'],
  ['SCO', 'Escocia', 'gb-sct'],
  ['TUR', 'Turquia', 'tr'],
  ['CZE', 'Republica Checa', 'cz'],
  ['PAN', 'Panama', 'pa'],
  ['SWE', 'Suecia', 'se'],
  ['BIH', 'Bosnia y Herzegovina', 'ba'],
  ['HAI', 'Haiti', 'ht'],
  ['CUW', 'Curazao', 'cw']
];

export const FIFA_GROUPS = {
  A: ['MEX', 'RSA', 'KOR', 'CZE'],
  B: ['CAN', 'BIH', 'QAT', 'SUI'],
  C: ['BRA', 'MAR', 'HAI', 'SCO'],
  D: ['USA', 'PAR', 'AUS', 'TUR'],
  E: ['GER', 'CUW', 'CIV', 'ECU'],
  F: ['NED', 'JPN', 'SWE', 'TUN'],
  G: ['BEL', 'EGY', 'IRN', 'NZL'],
  H: ['ESP', 'CPV', 'KSA', 'URU'],
  I: ['FRA', 'SEN', 'IRQ', 'NOR'],
  J: ['ARG', 'ALG', 'AUT', 'JOR'],
  K: ['POR', 'COD', 'UZB', 'COL'],
  L: ['ENG', 'CRO', 'GHA', 'PAN']
};

const TEAM_GROUPS = Object.fromEntries(
  Object.entries(FIFA_GROUPS).flatMap(([group, teamIds]) =>
    teamIds.map((teamId, groupPosition) => [teamId, { group, groupPosition }])
  )
);

export const STAR_PLAYERS = {
  CAN: 'Jonathan David',
  MEX: 'Edson Alvarez',
  USA: 'Christian Pulisic',
  JPN: 'Takefusa Kubo',
  NZL: 'Chris Wood',
  IRN: 'Mehdi Taremi',
  ARG: 'Lionel Messi',
  UZB: 'Eldor Shomurodov',
  KOR: 'Son Heung-min',
  JOR: 'Musa Al-Taamari',
  AUS: 'Mathew Ryan',
  BRA: 'Vinicius Junior',
  ECU: 'Moises Caicedo',
  URU: 'Federico Valverde',
  COL: 'Luis Diaz',
  PAR: 'Miguel Almiron',
  MAR: 'Achraf Hakimi',
  TUN: 'Ellyes Skhiri',
  EGY: 'Mohamed Salah',
  ALG: 'Riyad Mahrez',
  GHA: 'Mohammed Kudus',
  CPV: 'Ryan Mendes',
  RSA: 'Ronwen Williams',
  SEN: 'Sadio Mane',
  CIV: 'Franck Kessie',
  COD: 'Yoane Wissa',
  QAT: 'Akram Afif',
  KSA: 'Salem Al-Dawsari',
  IRQ: 'Aymen Hussein',
  FRA: 'Kylian Mbappe',
  GER: 'Jamal Musiala',
  ESP: 'Lamine Yamal',
  ENG: 'Jude Bellingham',
  POR: 'Cristiano Ronaldo',
  NED: 'Virgil van Dijk',
  BEL: 'Kevin De Bruyne',
  CRO: 'Luka Modric',
  SUI: 'Granit Xhaka',
  AUT: 'David Alaba',
  NOR: 'Erling Haaland',
  SCO: 'Scott McTominay',
  TUR: 'Hakan Calhanoglu',
  CZE: 'Patrik Schick',
  PAN: 'Adalberto Carrasquilla',
  SWE: 'Viktor Gyokeres',
  BIH: 'Edin Dzeko',
  HAI: 'Duckens Nazon',
  CUW: 'Leandro Bacuna'
};

const PLAYER_NAMES = [
  'Portero titular',
  'Defensa central',
  'Lateral derecho',
  'Lateral izquierdo',
  'Capitan',
  'Mediocampista',
  'Volante mixto',
  'Extremo derecho',
  'Extremo izquierdo',
  'Delantero centro',
  'Creador de juego',
  'Recambio clave',
  'Joven promesa',
  'Especialista',
  'Goleador',
  'Figura historica',
  'Arquero suplente',
  'Defensa suplente'
];

export const catalog = buildCatalog();
export const stickerByCode = Object.fromEntries(catalog.stickers.map((sticker) => [sticker.code, sticker]));
export const stickerByNumber = Object.fromEntries(catalog.stickers.map((sticker) => [String(sticker.number), sticker]));
export const teamById = Object.fromEntries(catalog.teams.map((team) => [team.id, team]));
export const officialCracks = catalog.teams.map((team) => {
  const player = STAR_PLAYERS[team.id] || `${team.name} - Crack`;
  return {
    id: `official-${team.id}`,
    player,
    teamId: team.id,
    stickerCode: `${team.id}10`,
    official: true
  };
});

function buildCatalog() {
  const teams = RAW_TEAMS.map(([id, name, flagCode], index) => ({
    id,
    code: id,
    name,
    group: TEAM_GROUPS[id].group,
    groupPosition: TEAM_GROUPS[id].groupPosition,
    flagUrl: `https://flagcdn.com/w80/${flagCode}.png`
  }));

  const specials = [
    { code: '00', number: 1, title: 'Emblema FIFA World Cup 26' },
    ...Array.from({ length: 19 }, (_, index) => ({
      code: `FWC${index + 1}`,
      number: index + 2,
      title: `Especial FWC${index + 1}`
    }))
  ].map((sticker) => ({
    ...sticker,
    teamId: null,
    type: 'especial',
    isSpecial: true,
    isShield: false,
    isTeamPhoto: false
  }));

  const teamStickers = teams.flatMap((team, teamIndex) =>
    Array.from({ length: 20 }, (_, index) => {
      const slot = index + 1;
      const isShield = slot === 1;
      const isTeamPhoto = slot === 2;
      const isCrack = slot === 10;
      return {
        code: `${team.id}${slot}`,
        number: 21 + teamIndex * 20 + index,
        teamId: team.id,
        type: isShield ? 'escudo' : isTeamPhoto ? 'equipo' : 'jugador',
        title: isShield
          ? `Escudo ${team.name}`
          : isTeamPhoto
            ? `Equipo completo ${team.name}`
            : isCrack
              ? STAR_PLAYERS[team.id] || `${team.name} - Jugador estrella`
              : `${team.name} - ${PLAYER_NAMES[(slot - 3 + PLAYER_NAMES.length) % PLAYER_NAMES.length]}`,
        isSpecial: false,
        isShield,
        isTeamPhoto
      };
    })
  );

  const cocaCola = Array.from({ length: 14 }, (_, index) => ({
    code: `CC${index + 1}`,
    number: BASE_TOTAL + index + 1,
    teamId: null,
    type: 'coca-cola',
    title: `Coca-Cola ${String(index + 1).padStart(2, '0')}`,
    isSpecial: false,
    isShield: false,
    isTeamPhoto: false
  }));

  return {
    baseTotal: BASE_TOTAL,
    teams,
    groups: GROUPS,
    specials,
    stickers: [...specials, ...teamStickers],
    addons: {
      cocaCola: {
        enabledDefault: false,
        stickers: cocaCola
      }
    }
  };
}
