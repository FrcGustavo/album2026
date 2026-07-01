import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const BASE_TOTAL = 980;
const STORAGE_V1 = 'panini-world-cup-2026-mx-v1';
const STORAGE_V2 = 'panini-world-cup-2026-mx-v2';
const GROUPS = 'ABCDEFGHIJKL'.split('');

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
  ['NGA', 'Nigeria', 'ng'],
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
  ['DEN', 'Dinamarca', 'dk'],
  ['SWE', 'Suecia', 'se'],
  ['SRB', 'Serbia', 'rs'],
  ['HAI', 'Haiti', 'ht'],
  ['CUW', 'Curazao', 'cw']
];

const STAR_PLAYERS = {
  ARG: 'Lionel Messi',
  FRA: 'Kylian Mbappe',
  POR: 'Cristiano Ronaldo',
  ESP: 'Lamine Yamal',
  ENG: 'Jude Bellingham',
  BRA: 'Vinicius Junior',
  MEX: 'Santiago Gimenez',
  NOR: 'Erling Haaland',
  EGY: 'Mohamed Salah',
  GER: 'Joshua Kimmich',
  URU: 'Federico Valverde',
  NED: 'Virgil van Dijk'
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

const catalog = buildCatalog();
const stickerByCode = Object.fromEntries(catalog.stickers.map((sticker) => [sticker.code, sticker]));
const stickerByNumber = Object.fromEntries(catalog.stickers.map((sticker) => [String(sticker.number), sticker]));
const teamById = Object.fromEntries(catalog.teams.map((team) => [team.id, team]));
const officialCracks = catalog.teams.map((team) => {
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
    group: GROUPS[Math.floor(index / 4)],
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

function emptyState() {
  return {
    version: 2,
    stickers: {},
    specials: {},
    cocaColaEnabled: catalog.addons.cocaCola.enabledDefault,
    cocaCola: {},
    customCracks: [],
    purchases: []
  };
}

function normalizeCopies(value) {
  const copies = Number.parseInt(value, 10);
  return Number.isFinite(copies) && copies > 0 ? copies : 0;
}

function sanitizeState(value) {
  const next = emptyState();
  if (!value || typeof value !== 'object') return next;

  for (const [code, copies] of Object.entries(value.stickers || {})) {
    const normalized = normalizeCopies(copies);
    if (normalized && stickerByCode[code] && !stickerByCode[code].isSpecial) next.stickers[code] = normalized;
  }
  for (const [code, copies] of Object.entries(value.specials || {})) {
    const normalized = normalizeCopies(copies);
    if (normalized && catalog.specials.some((sticker) => sticker.code === code)) next.specials[code] = normalized;
  }
  for (const [code, copies] of Object.entries(value.cocaCola || {})) {
    const normalized = normalizeCopies(copies);
    if (normalized && catalog.addons.cocaCola.stickers.some((sticker) => sticker.code === code)) next.cocaCola[code] = normalized;
  }

  next.cocaColaEnabled = Boolean(value.cocaColaEnabled);
  next.customCracks = Array.isArray(value.customCracks)
    ? value.customCracks
        .filter((crack) => crack.player && crack.teamId && stickerByCode[crack.stickerCode])
        .map((crack) => ({
          id: crack.id || crypto.randomUUID(),
          player: String(crack.player),
          teamId: String(crack.teamId),
          stickerCode: String(crack.stickerCode),
          official: false
        }))
    : [];
  next.purchases = Array.isArray(value.purchases)
    ? value.purchases
        .filter((purchase) => purchase.type && Number.isFinite(Number(purchase.price)))
        .map((purchase) => ({
          id: purchase.id || crypto.randomUUID(),
          type: String(purchase.type),
          date: purchase.date || new Date().toISOString().slice(0, 10),
          quantity: Number(purchase.quantity) || 1,
          price: Number(purchase.price) || 0,
          packsPerBox: Number(purchase.packsPerBox) || 0,
          stickersPerPack: Number(purchase.stickersPerPack) || 7,
          notes: purchase.notes || ''
        }))
    : [];

  return next;
}

function migrateV1(value) {
  const next = emptyState();
  if (!value || typeof value !== 'object') return next;
  for (const [number, copies] of Object.entries(value)) {
    const sticker = stickerByNumber[number];
    const normalized = normalizeCopies(copies);
    if (!sticker || !normalized) continue;
    if (sticker.isSpecial) next.specials[sticker.code] = normalized;
    else next.stickers[sticker.code] = normalized;
  }
  return next;
}

function loadState() {
  try {
    const v2 = localStorage.getItem(STORAGE_V2);
    if (v2) return sanitizeState(JSON.parse(v2));
    const v1 = localStorage.getItem(STORAGE_V1);
    if (v1) return migrateV1(JSON.parse(v1));
  } catch {
    return emptyState();
  }
  return emptyState();
}

function saveState(state) {
  localStorage.setItem(STORAGE_V2, JSON.stringify(state));
}

function collectionForSticker(state, sticker) {
  if (sticker.type === 'coca-cola') return state.cocaCola;
  if (sticker.isSpecial) return state.specials;
  return state.stickers;
}

function copiesFor(state, sticker) {
  return collectionForSticker(state, sticker)[sticker.code] || 0;
}

function setStickerCopies(state, sticker, copies) {
  const next = {
    ...state,
    stickers: { ...state.stickers },
    specials: { ...state.specials },
    cocaCola: { ...state.cocaCola }
  };
  const bucket = collectionForSticker(next, sticker);
  if (copies <= 0) delete bucket[sticker.code];
  else bucket[sticker.code] = copies;
  return next;
}

function parseEntry(value) {
  return value
    .split(/[\s,;]+/)
    .map((token) => token.trim().toUpperCase())
    .filter(Boolean)
    .map((token) => stickerByCode[token] || stickerByNumber[token] || catalog.addons.cocaCola.stickers.find((sticker) => sticker.code === token))
    .filter(Boolean);
}

function summarizeList(stickers, state) {
  const owned = stickers.filter((sticker) => copiesFor(state, sticker) > 0).length;
  const repeated = stickers.reduce((sum, sticker) => sum + Math.max(0, copiesFor(state, sticker) - 1), 0);
  return {
    total: stickers.length,
    owned,
    missing: stickers.length - owned,
    repeated,
    percent: stickers.length ? Math.round((owned / stickers.length) * 1000) / 10 : 0
  };
}

function getActiveAlbumStickers(state) {
  return state.cocaColaEnabled ? [...catalog.stickers, ...catalog.addons.cocaCola.stickers] : catalog.stickers;
}

function getAlbumStats(state) {
  const active = getActiveAlbumStickers(state);
  const base = summarizeList(catalog.stickers, state);
  const all = summarizeList(active, state);
  const shields = summarizeList(catalog.stickers.filter((sticker) => sticker.isShield), state);
  const teamPhotos = summarizeList(catalog.stickers.filter((sticker) => sticker.isTeamPhoto), state);
  const specials = summarizeList(catalog.specials, state);
  const cocaCola = summarizeList(catalog.addons.cocaCola.stickers, state);
  const cracks = getCracks(state);
  const foundCracks = cracks.filter((crack) => copiesFor(state, stickerByCode[crack.stickerCode]) > 0).length;

  return {
    ...all,
    baseTotal: base.total,
    activeTotal: active.length,
    shields,
    teamPhotos,
    specials,
    cocaCola,
    cracks: {
      total: cracks.length,
      owned: foundCracks,
      missing: cracks.length - foundCracks,
      percent: cracks.length ? Math.round((foundCracks / cracks.length) * 1000) / 10 : 0
    }
  };
}

function getTeamStickers(teamId) {
  return catalog.stickers.filter((sticker) => sticker.teamId === teamId);
}

function getCountryStats(state) {
  return catalog.teams.map((team) => {
    const stickers = getTeamStickers(team.id);
    const summary = summarizeList(stickers, state);
    const shield = stickers.find((sticker) => sticker.isShield);
    const teamPhoto = stickers.find((sticker) => sticker.isTeamPhoto);
    return {
      ...team,
      ...summary,
      complete: summary.owned === summary.total,
      withoutShield: shield ? copiesFor(state, shield) === 0 : false,
      withoutTeamPhoto: teamPhoto ? copiesFor(state, teamPhoto) === 0 : false,
      hasRepeated: summary.repeated > 0
    };
  });
}

function getCracks(state) {
  return [...officialCracks, ...state.customCracks];
}

function getCostStats(state, albumStats) {
  return state.purchases.reduce(
    (stats, purchase) => {
      const price = Number(purchase.price) || 0;
      const quantity = Number(purchase.quantity) || 0;
      const packsPerBox = Number(purchase.packsPerBox) || 0;
      const stickersPerPack = Number(purchase.stickersPerPack) || 7;
      const isIncome = purchase.type === 'income';
      const packs =
        purchase.type === 'box'
          ? quantity * packsPerBox
          : purchase.type === 'pack'
            ? quantity
            : 0;
      const estimatedStickers =
        purchase.type === 'box' || purchase.type === 'pack'
          ? packs * stickersPerPack
          : purchase.type === 'single' || purchase.type === 'exchange'
            ? quantity
            : 0;

      stats.spent += isIncome ? 0 : price;
      stats.income += isIncome ? price : 0;
      stats.packs += packs;
      stats.estimatedStickers += estimatedStickers;
      return stats;
    },
    {
      spent: 0,
      income: 0,
      packs: 0,
      estimatedStickers: 0,
      get net() {
        return this.spent - this.income;
      },
      get avgPerPack() {
        return this.packs ? this.net / this.packs : 0;
      },
      get avgPerSticker() {
        return this.estimatedStickers ? this.net / this.estimatedStickers : 0;
      },
      get avgPerNew() {
        return albumStats.owned ? this.net / albumStats.owned : 0;
      },
      get openingEfficiency() {
        return this.estimatedStickers ? Math.round((albumStats.owned / this.estimatedStickers) * 1000) / 10 : 0;
      }
    }
  );
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function pct(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function App() {
  const [state, setState] = useState(loadState);
  const [activeTab, setActiveTab] = useState(() => window.location.hash.replace('#', '') || 'inicio');
  const [notice, setNotice] = useState('MVP local-first: el catalogo es editable y se podra reemplazar con el checklist oficial.');

  const albumStats = useMemo(() => getAlbumStats(state), [state]);
  const countryStats = useMemo(() => getCountryStats(state), [state]);
  const costStats = useMemo(() => getCostStats(state, albumStats), [state, albumStats]);

  useEffect(() => {
    function syncHash() {
      setActiveTab(window.location.hash.replace('#', '') || 'inicio');
    }
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  function update(nextState, nextNotice) {
    setState(nextState);
    saveState(nextState);
    if (nextNotice) setNotice(nextNotice);
  }

  function patch(updater, nextNotice) {
    setState((current) => {
      const nextState = updater(current);
      saveState(nextState);
      return nextState;
    });
    if (nextNotice) setNotice(nextNotice);
  }

  function setTab(tab) {
    setActiveTab(tab);
    window.location.hash = tab;
  }

  const context = {
    state,
    patch,
    update,
    notice,
    setNotice,
    albumStats,
    countryStats,
    costStats
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Album Panini Mundial 2026 - Mexico</p>
          <h1>Control total de figuritas</h1>
          <p className="header-copy">Progreso, repetidas, intercambios, costos y respaldos en una app local.</p>
        </div>
        <div className="progress-ring" aria-label={`Progreso ${albumStats.percent}%`}>
          <span>{pct(albumStats.percent)}</span>
          <small>{albumStats.owned}/{albumStats.activeTotal}</small>
        </div>
      </header>

      <nav className="tabs" aria-label="Secciones">
        {[
          ['inicio', 'Inicio'],
          ['paises', 'Paises'],
          ['album', 'Album completo'],
          ['especiales', 'Especiales'],
          ['cracks', 'Cracks'],
          ['coca-cola', 'Coca-Cola'],
          ['costos', 'Costos'],
          ['estadisticas', 'Estadisticas'],
          ['configuracion', 'Configuracion']
        ].map(([id, label]) => (
          <button className={activeTab === id ? 'active' : ''} type="button" key={id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      {activeTab === 'inicio' && <Dashboard {...context} />}
      {activeTab === 'paises' && <Countries {...context} />}
      {activeTab === 'album' && <FullAlbum {...context} />}
      {activeTab === 'especiales' && <Specials {...context} />}
      {activeTab === 'cracks' && <Cracks {...context} />}
      {activeTab === 'coca-cola' && <CocaCola {...context} />}
      {activeTab === 'costos' && <Costs {...context} />}
      {activeTab === 'estadisticas' && <Stats {...context} />}
      {activeTab === 'configuracion' && <Settings {...context} />}
    </main>
  );
}

function Dashboard({ state, patch, notice, albumStats, countryStats, costStats }) {
  const [entry, setEntry] = useState('');
  const leaders = [...countryStats].sort((a, b) => b.percent - a.percent).slice(0, 5);
  const lagging = [...countryStats].sort((a, b) => a.percent - b.percent).slice(0, 5);

  function addEntry(event) {
    event.preventDefault();
    const stickers = parseEntry(entry);
    if (!stickers.length) return;
    patch((current) => {
      let next = current;
      stickers.forEach((sticker) => {
        next = setStickerCopies(next, sticker, copiesFor(next, sticker) + 1);
      });
      return next;
    }, `${stickers.length} figurita(s) registradas.`);
    setEntry('');
  }

  return (
    <section className="view-stack">
      <div className="entry-panel">
        <form className="quick-entry" onSubmit={addEntry}>
          <label htmlFor="entry">Registro rapido</label>
          <div className="entry-row">
            <input id="entry" value={entry} placeholder="Ej. MEX1, ARG10, 21, FWC1, CC1" onChange={(event) => setEntry(event.target.value)} />
            <button type="submit">Agregar</button>
          </div>
          <p>{notice}</p>
        </form>
        <div className="stats-grid">
          <Stat label="Obtenidas" value={albumStats.owned} helper={`de ${albumStats.activeTotal}`} />
          <Stat label="Faltantes" value={albumStats.missing} helper="sin registrar" />
          <Stat label="Repetidas" value={albumStats.repeated} helper="copias extra" />
          <Stat label="Gasto neto" value={money(costStats.net)} helper="invertido" />
        </div>
      </div>

      <div className="metric-grid">
        <ProgressCard title="Escudos" summary={albumStats.shields} />
        <ProgressCard title="Equipos completos" summary={albumStats.teamPhotos} />
        <ProgressCard title="Especiales" summary={albumStats.specials} />
        <ProgressCard title="Cracks" summary={albumStats.cracks} />
        <ProgressCard title="Coca-Cola" summary={albumStats.cocaCola} disabled={!state.cocaColaEnabled} />
      </div>

      <div className="split-grid">
        <Ranking title="Top 5 mas completos" teams={leaders} />
        <Ranking title="Top 5 mas atrasados" teams={lagging} />
      </div>
    </section>
  );
}

function Countries({ countryStats }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const normalized = query.trim().toLowerCase();
  const visible = countryStats.filter((team) => {
    const match =
      !normalized ||
      team.name.toLowerCase().includes(normalized) ||
      team.code.toLowerCase().includes(normalized) ||
      getTeamStickers(team.id).some((sticker) => sticker.code.toLowerCase().includes(normalized));
    const filterMatch =
      filter === 'all' ||
      (filter === 'missing' && team.missing > 0) ||
      (filter === 'repeated' && team.hasRepeated) ||
      (filter === 'completed' && team.complete) ||
      (filter === 'shields' && team.withoutShield) ||
      (filter === 'teams' && team.withoutTeamPhoto);
    return match && filterMatch;
  });

  return (
    <section className="view-stack">
      <Toolbar>
        <input value={query} placeholder="Buscar por pais, codigo o figurita" onChange={(event) => setQuery(event.target.value)} />
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">Todas</option>
          <option value="missing">Faltantes</option>
          <option value="repeated">Repetidas</option>
          <option value="completed">Completas</option>
          <option value="shields">Sin escudo</option>
          <option value="teams">Sin equipo</option>
        </select>
      </Toolbar>
      {GROUPS.map((group) => {
        const teams = visible.filter((team) => team.group === group);
        if (!teams.length) return null;
        return (
          <section className="group-section" key={group}>
            <h2>Grupo {group}</h2>
            <div className="country-grid">
              {teams.map((team) => (
                <CountryCard key={team.id} team={team} />
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}

function FullAlbum({ state, patch }) {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();
  const teams = catalog.teams.filter((team) => !normalized || team.name.toLowerCase().includes(normalized) || team.code.toLowerCase().includes(normalized));

  return (
    <section className="view-stack">
      <Toolbar>
        <input value={query} placeholder="Buscar seleccion..." onChange={(event) => setQuery(event.target.value)} />
      </Toolbar>
      {GROUPS.map((group) => {
        const groupTeams = teams.filter((team) => team.group === group);
        if (!groupTeams.length) return null;
        return (
          <section className="group-section" key={group}>
            <h2>Grupo {group}</h2>
            <div className="album-team-grid">
              {groupTeams.map((team) => (
                <TeamAlbum key={team.id} team={team} state={state} patch={patch} />
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}

function TeamAlbum({ team, state, patch }) {
  return (
    <article className="team-album">
      <div className="team-title">
        <img src={team.flagUrl} alt="" />
        <div>
          <strong>{team.name}</strong>
          <span>{team.code}</span>
        </div>
      </div>
      <div className="sticker-tile-grid">
        {getTeamStickers(team.id).map((sticker) => (
          <StickerTile key={sticker.code} sticker={sticker} state={state} patch={patch} />
        ))}
      </div>
    </article>
  );
}

function Specials({ state, patch, albumStats }) {
  return (
    <section className="view-stack">
      <ProgressHero title="Figuritas Especiales" summary={albumStats.specials} helper="00 + FWC1 a FWC19" />
      <div className="sticker-tile-grid wide">
        {catalog.specials.map((sticker) => (
          <StickerTile key={sticker.code} sticker={sticker} state={state} patch={patch} />
        ))}
      </div>
    </section>
  );
}

function Cracks({ state, patch }) {
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({ player: '', teamId: catalog.teams[0].id, number: 10 });
  const cracks = getCracks(state);
  const normalized = query.trim().toLowerCase();
  const visible = cracks.filter((crack) => {
    const team = teamById[crack.teamId];
    return !normalized || crack.player.toLowerCase().includes(normalized) || team?.name.toLowerCase().includes(normalized) || crack.stickerCode.toLowerCase().includes(normalized);
  });

  function addCrack(event) {
    event.preventDefault();
    const number = Number(form.number);
    const stickerCode = `${form.teamId}${number}`;
    if (!form.player.trim() || number < 1 || number > 20 || !stickerByCode[stickerCode]) return;
    if (cracks.some((crack) => crack.stickerCode === stickerCode)) return;
    patch((current) => ({
      ...current,
      customCracks: [
        ...current.customCracks,
        {
          id: crypto.randomUUID(),
          player: form.player.trim(),
          teamId: form.teamId,
          stickerCode,
          official: false
        }
      ]
    }), 'Crack personalizado agregado.');
    setForm({ player: '', teamId: form.teamId, number: 10 });
  }

  return (
    <section className="view-stack">
      <Toolbar>
        <input value={query} placeholder="Buscar por nombre, seleccion o codigo..." onChange={(event) => setQuery(event.target.value)} />
      </Toolbar>
      <form className="inline-form" onSubmit={addCrack}>
        <input value={form.player} placeholder="Nombre del jugador" onChange={(event) => setForm({ ...form, player: event.target.value })} />
        <select value={form.teamId} onChange={(event) => setForm({ ...form, teamId: event.target.value })}>
          {catalog.teams.map((team) => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
        <input min="1" max="20" type="number" value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} />
        <button type="submit">Agregar crack</button>
      </form>
      <div className="crack-grid">
        {visible.map((crack) => {
          const sticker = stickerByCode[crack.stickerCode];
          const found = sticker && copiesFor(state, sticker) > 0;
          return (
            <article className={`crack-card ${found ? 'found' : ''}`} key={crack.id}>
              <div>
                <strong>{crack.player}</strong>
                <span>{teamById[crack.teamId]?.name} - {crack.stickerCode}</span>
              </div>
              <small>{crack.official ? 'Crack oficial' : 'Personalizado'}</small>
              <b>{found ? 'Encontrado' : 'Pendiente'}</b>
              {!crack.official && (
                <button
                  type="button"
                  className="ghost danger"
                  onClick={() => patch((current) => ({ ...current, customCracks: current.customCracks.filter((item) => item.id !== crack.id) }), 'Crack eliminado.')}
                >
                  Eliminar
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CocaCola({ state, patch, albumStats }) {
  return (
    <section className="view-stack">
      <article className="switch-panel">
        <div>
          <h2>Coca-Cola</h2>
          <p>Seccion opcional. Si la activas, suma {catalog.addons.cocaCola.stickers.length} figuritas al total del album.</p>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={state.cocaColaEnabled}
            onChange={(event) => patch((current) => ({ ...current, cocaColaEnabled: event.target.checked }), event.target.checked ? 'Coca-Cola activada.' : 'Coca-Cola desactivada.')}
          />
          <span />
        </label>
      </article>
      <ProgressHero title="Progreso Coca-Cola" summary={albumStats.cocaCola} helper={state.cocaColaEnabled ? 'Activa' : 'Desactivada'} />
      {state.cocaColaEnabled ? (
        <div className="sticker-tile-grid wide">
          {catalog.addons.cocaCola.stickers.map((sticker) => (
            <StickerTile key={sticker.code} sticker={sticker} state={state} patch={patch} />
          ))}
        </div>
      ) : (
        <EmptyState text="Activa la seccion para empezar a registrar CC1, CC2 y el resto del set." />
      )}
    </section>
  );
}

function Costs({ state, patch, costStats, albumStats }) {
  const [form, setForm] = useState({
    type: 'box',
    date: new Date().toISOString().slice(0, 10),
    quantity: 1,
    price: 0,
    packsPerBox: 50,
    stickersPerPack: 7,
    notes: ''
  });

  function addPurchase(event) {
    event.preventDefault();
    patch((current) => ({
      ...current,
      purchases: [
        {
          ...form,
          id: crypto.randomUUID(),
          quantity: Number(form.quantity) || 1,
          price: Number(form.price) || 0,
          packsPerBox: Number(form.packsPerBox) || 0,
          stickersPerPack: Number(form.stickersPerPack) || 7
        },
        ...current.purchases
      ]
    }), form.type === 'income' ? 'Ingreso registrado.' : 'Gasto registrado.');
  }

  return (
    <section className="view-stack">
      <div className="metric-grid">
        <Stat label="Gasto bruto" value={money(costStats.spent)} helper="compras y envios" />
        <Stat label="Ingresos" value={money(costStats.income)} helper="ventas/reembolsos" />
        <Stat label="Gasto neto" value={money(costStats.net)} helper="balance real" />
        <Stat label="Costo por sobre" value={money(costStats.avgPerPack)} helper={`${costStats.packs} sobres`} />
        <Stat label="Costo por nueva" value={money(costStats.avgPerNew)} helper={`${albumStats.owned} unicas`} />
        <Stat label="Eficiencia" value={pct(costStats.openingEfficiency)} helper="unicas vs estimadas" />
      </div>

      <form className="cost-form" onSubmit={addPurchase}>
        <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
          <option value="box">Caja de sobres</option>
          <option value="pack">Sobres individuales</option>
          <option value="single">Figuritas sueltas</option>
          <option value="exchange">Intercambio pagado</option>
          <option value="shipping">Envio</option>
          <option value="income">Ingreso a favor</option>
        </select>
        <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
        <input type="number" min="0" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} placeholder="Cantidad" />
        <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="Monto total" />
        <input type="number" min="0" value={form.packsPerBox} onChange={(event) => setForm({ ...form, packsPerBox: event.target.value })} placeholder="Sobres por caja" />
        <input type="number" min="1" value={form.stickersPerPack} onChange={(event) => setForm({ ...form, stickersPerPack: event.target.value })} placeholder="Figuras por sobre" />
        <input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Notas" />
        <button type="submit">Registrar movimiento</button>
      </form>

      <div className="history-list">
        {state.purchases.length === 0 && <EmptyState text="Aun no registraste movimientos." />}
        {state.purchases.map((purchase) => (
          <article className="history-item" key={purchase.id}>
            <div>
              <strong>{purchaseLabel(purchase.type)}</strong>
              <span>{purchase.date} - {purchase.quantity} unidad(es) {purchase.notes ? `- ${purchase.notes}` : ''}</span>
            </div>
            <b>{purchase.type === 'income' ? '+' : '-'}{money(purchase.price)}</b>
            <button type="button" className="ghost danger" onClick={() => patch((current) => ({ ...current, purchases: current.purchases.filter((item) => item.id !== purchase.id) }), 'Movimiento eliminado.')}>
              Eliminar
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function Stats({ albumStats, countryStats, costStats }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const normalized = query.trim().toLowerCase();
  const countries = countryStats
    .filter((team) => !normalized || team.name.toLowerCase().includes(normalized) || team.code.toLowerCase().includes(normalized))
    .filter((team) => filter === 'all' || (filter === 'completed' && team.complete) || (filter === 'missing' && team.missing > 0) || (filter === 'repeated' && team.hasRepeated))
    .sort((a, b) => b.percent - a.percent);

  return (
    <section className="view-stack">
      <div className="metric-grid">
        <Stat label="Total registradas" value={albumStats.owned + albumStats.repeated} helper="incluye repetidas" />
        <Stat label="Completado" value={pct(albumStats.percent)} helper={`${albumStats.owned}/${albumStats.activeTotal}`} />
        <Stat label="Faltantes" value={albumStats.missing} helper="pendientes" />
        <Stat label="Repetidas" value={albumStats.repeated} helper="copias extra" />
        <Stat label="Promedio repetidas" value={albumStats.owned ? (albumStats.repeated / albumStats.owned).toFixed(2) : '0.00'} helper="por unica" />
        <Stat label="Eficiencia" value={pct(costStats.openingEfficiency)} helper="apertura estimada" />
      </div>
      <Toolbar>
        <input value={query} placeholder="Buscar..." onChange={(event) => setQuery(event.target.value)} />
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">Todos</option>
          <option value="completed">Completos</option>
          <option value="missing">Faltantes</option>
          <option value="repeated">Repetidas</option>
        </select>
      </Toolbar>
      <div className="table-list">
        {countries.map((team) => (
          <CountryRow key={team.id} team={team} />
        ))}
      </div>
    </section>
  );
}

function Settings({ state, update }) {
  const inputRef = useRef(null);
  const [message, setMessage] = useState('');

  function exportJson() {
    const payload = JSON.stringify({ app: 'panini-world-cup-2026-mx', version: 2, exportedAt: new Date().toISOString(), state }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `album-mundial-2026-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Progreso exportado.');
  }

  function importJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const imported = sanitizeState(parsed.state || parsed);
        update(imported, 'Progreso importado.');
        setMessage('Progreso importado.');
      } catch {
        setMessage('No pude importar ese JSON.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function reset() {
    if (!window.confirm('¿Resetear todo el album? Se borraran figuritas, cracks personalizados y compras.')) return;
    update(emptyState(), 'Album reiniciado.');
    setMessage('Album reiniciado.');
  }

  return (
    <section className="view-stack narrow">
      <article className="settings-card">
        <h2>Cuenta y respaldos</h2>
        <p>Esta version es local-first. Tus datos viven en este navegador hasta que exportes o importes un respaldo.</p>
        <div className="settings-actions">
          <button type="button" onClick={exportJson}>Exportar JSON</button>
          <button type="button" className="secondary" onClick={() => inputRef.current?.click()}>Importar JSON</button>
          <input ref={inputRef} type="file" accept="application/json" onChange={importJson} hidden />
        </div>
        {message && <p className="notice">{message}</p>}
      </article>
      <article className="settings-card danger-zone">
        <h2>Zona peligrosa</h2>
        <p>Se borraran las {catalog.baseTotal} figuritas base, Coca-Cola, cracks personalizados y compras.</p>
        <button type="button" className="danger" onClick={reset}>Resetear album</button>
      </article>
    </section>
  );
}

function StickerTile({ sticker, state, patch }) {
  const copies = copiesFor(state, sticker);
  const crack = getCracks(state).find((item) => item.stickerCode === sticker.code);
  const className = copies > 2 ? 'many' : copies > 1 ? 'duplicate' : copies > 0 ? 'owned' : 'missing';

  function change(delta) {
    patch((current) => setStickerCopies(current, sticker, Math.max(0, copiesFor(current, sticker) + delta)));
  }

  return (
    <button
      type="button"
      className={`sticker-tile ${className} ${crack ? 'crack-border' : ''}`}
      onClick={() => change(1)}
      onContextMenu={(event) => {
        event.preventDefault();
        change(-1);
      }}
      title={`${sticker.title} - ${copies} copia(s)`}
    >
      <strong>{sticker.code}</strong>
      <span>{copies > 1 ? `${copies}x` : copies === 1 ? 'OK' : 'Falta'}</span>
      {crack && <small>{crack.player}</small>}
      <i
        role="button"
        tabIndex={0}
        aria-label={`Restar ${sticker.code}`}
        onClick={(event) => {
          event.stopPropagation();
          change(-1);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            change(-1);
          }
        }}
      >
        -
      </i>
    </button>
  );
}

function CountryCard({ team }) {
  return (
    <article className="country-card">
      <div className="team-title">
        <img src={team.flagUrl} alt="" />
        <div>
          <strong>{team.name}</strong>
          <span>Grupo {team.group} - {team.code}</span>
        </div>
      </div>
      <ProgressBar percent={team.percent} />
      <div className="mini-stats">
        <span>{team.owned}/{team.total}</span>
        <span>{team.repeated} rep.</span>
        {team.withoutShield && <span>sin escudo</span>}
        {team.withoutTeamPhoto && <span>sin equipo</span>}
      </div>
    </article>
  );
}

function CountryRow({ team }) {
  return (
    <article className="country-row">
      <img src={team.flagUrl} alt="" />
      <strong>{team.name}</strong>
      <ProgressBar percent={team.percent} />
      <span>{team.owned}/{team.total}</span>
      <span>{team.missing} faltan</span>
      <span>{team.repeated} rep.</span>
    </article>
  );
}

function Ranking({ title, teams }) {
  return (
    <article className="panel">
      <h2>{title}</h2>
      <div className="ranking-list">
        {teams.map((team) => (
          <CountryRow key={team.id} team={team} />
        ))}
      </div>
    </article>
  );
}

function ProgressHero({ title, summary, helper }) {
  return (
    <article className="progress-hero">
      <div>
        <h2>{title}</h2>
        <p>{helper}</p>
      </div>
      <strong>{pct(summary.percent)}</strong>
      <span>{summary.owned} obtenidas - {summary.repeated} repetidas - {summary.missing} faltantes</span>
    </article>
  );
}

function ProgressCard({ title, summary, disabled = false }) {
  return (
    <article className={`progress-card ${disabled ? 'disabled' : ''}`}>
      <span>{title}</span>
      <strong>{disabled ? 'Off' : pct(summary.percent)}</strong>
      <ProgressBar percent={disabled ? 0 : summary.percent} />
      <small>{summary.owned}/{summary.total} obtenidas</small>
    </article>
  );
}

function ProgressBar({ percent }) {
  return (
    <div className="progress-bar">
      <span style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
    </div>
  );
}

function Stat({ label, value, helper }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </div>
  );
}

function Toolbar({ children }) {
  return <section className="toolbar">{children}</section>;
}

function EmptyState({ text }) {
  return <div className="empty-state">{text}</div>;
}

function purchaseLabel(type) {
  return {
    box: 'Caja de sobres',
    pack: 'Sobres individuales',
    single: 'Figuritas sueltas',
    exchange: 'Intercambio pagado',
    shipping: 'Envio',
    income: 'Ingreso a favor'
  }[type] || type;
}

createRoot(document.getElementById('root')).render(<App />);
