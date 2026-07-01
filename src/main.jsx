import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const ALBUM_TOTAL = 980;
const STORAGE_KEY = 'panini-world-cup-2026-mx-v1';

const TEAMS = [
  'Canada',
  'Mexico',
  'Estados Unidos',
  'Japon',
  'Nueva Zelanda',
  'Iran',
  'Argentina',
  'Uzbekistan',
  'Corea del Sur',
  'Jordania',
  'Australia',
  'Brasil',
  'Ecuador',
  'Uruguay',
  'Colombia',
  'Paraguay',
  'Marruecos',
  'Tunez',
  'Egipto',
  'Argelia',
  'Ghana',
  'Cabo Verde',
  'Sudafrica',
  'Senegal',
  'Costa de Marfil',
  'Nigeria',
  'Qatar',
  'Arabia Saudita',
  'Irak',
  'Francia',
  'Alemania',
  'Espana',
  'Inglaterra',
  'Portugal',
  'Paises Bajos',
  'Belgica',
  'Croacia',
  'Suiza',
  'Austria',
  'Noruega',
  'Escocia',
  'Turquia',
  'Republica Checa',
  'Dinamarca',
  'Suecia',
  'Serbia',
  'Haiti',
  'Curazao'
];

const INTRO_ITEMS = [
  'Emblema FIFA World Cup 26',
  'Trofeo FIFA',
  'Balon oficial Trionda',
  'Poster oficial del torneo',
  'Mascota Canada',
  'Mascota Mexico',
  'Mascota Estados Unidos',
  'Mapa de sedes',
  'Estadio Azteca',
  'Guadalajara',
  'Monterrey',
  'Toronto',
  'Vancouver',
  'Nueva York/Nueva Jersey',
  'Los Angeles',
  'Dallas',
  'Kansas City',
  'Houston',
  'Atlanta',
  'Boston',
  'Filadelfia',
  'Miami',
  'Seattle',
  'San Francisco Bay Area',
  'Campeon 2022',
  'Balon de Oro historico',
  'Maximos goleadores',
  'Calendario',
  'Formato 48 equipos',
  'Grupos',
  'Ronda de 32',
  'Cuartos de final',
  'Semifinales',
  'Final',
  'Mexico anfitrion',
  'Panini 1970-2026'
];

const STAR_NAMES = [
  'Lionel Messi',
  'Cristiano Ronaldo',
  'Lamine Yamal',
  'Lautaro Martinez',
  'Harry Kane',
  'Joshua Kimmich',
  'Kylian Mbappe',
  'Vinicius Junior',
  'Jude Bellingham',
  'Erling Haaland',
  'Neymar',
  'Mohamed Salah'
];

function buildCatalog() {
  const stickers = [];

  INTRO_ITEMS.forEach((name, index) => {
    stickers.push({
      id: index + 1,
      code: String(index + 1),
      title: name,
      section: 'Apertura Mexico 2026',
      kind: index < 24 ? 'sede' : 'torneo',
      team: '',
      rarity: index < 7 ? 'especial' : 'base'
    });
  });

  TEAMS.forEach((team, teamIndex) => {
    const start = 37 + teamIndex * 18;
    for (let slot = 0; slot < 18; slot += 1) {
      const isShield = slot === 0;
      const isTeamPhoto = slot === 1;
      stickers.push({
        id: start + slot,
        code: String(start + slot),
        title: isShield ? `Escudo ${team}` : isTeamPhoto ? `Foto de equipo ${team}` : `${team} - Jugador ${String(slot - 1).padStart(2, '0')}`,
        section: `Seleccion ${team}`,
        kind: isShield ? 'escudo' : isTeamPhoto ? 'equipo' : 'jugador',
        team,
        rarity: isShield ? 'especial' : 'base'
      });
    }
  });

  for (let number = 901; number <= 968; number += 1) {
    const star = STAR_NAMES[(number - 901) % STAR_NAMES.length];
    stickers.push({
      id: number,
      code: String(number),
      title: `Estrella metalizada ${star}`,
      section: 'Estrellas del Mundial',
      kind: 'estrella',
      team: '',
      rarity: 'especial'
    });
  }

  for (let number = 969; number <= ALBUM_TOTAL; number += 1) {
    stickers.push({
      id: number,
      code: String(number),
      title: `Coca-Cola ${String(number - 968).padStart(2, '0')}`,
      section: 'Coca-Cola',
      kind: 'coca-cola',
      team: '',
      rarity: 'promo'
    });
  }

  return stickers;
}

const CATALOG = buildCatalog();

function loadCollection() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return typeof stored === 'object' && stored !== null ? stored : {};
  } catch {
    return {};
  }
}

function parseNumbers(value) {
  return value
    .split(/[\s,;.-]+/)
    .map((item) => Number.parseInt(item, 10))
    .filter((number) => Number.isInteger(number) && number >= 1 && number <= ALBUM_TOTAL);
}

function App() {
  const [collection, setCollection] = useState(loadCollection);
  const [entry, setEntry] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [notice, setNotice] = useState('Lista versionable: estructura 980 validada; nombres/orden exacto pendiente de checklist mexicano oficial.');

  const stats = useMemo(() => {
    const owned = CATALOG.filter((sticker) => (collection[sticker.id] || 0) > 0);
    const duplicateUnits = Object.values(collection).reduce((sum, copies) => sum + Math.max(0, copies - 1), 0);
    const missing = ALBUM_TOTAL - owned.length;
    const stars = CATALOG.filter((sticker) => sticker.kind === 'estrella' && (collection[sticker.id] || 0) > 0).length;
    const coke = CATALOG.filter((sticker) => sticker.kind === 'coca-cola' && (collection[sticker.id] || 0) > 0).length;

    return {
      owned: owned.length,
      missing,
      duplicateUnits,
      percent: Math.round((owned.length / ALBUM_TOTAL) * 1000) / 10,
      stars,
      coke
    };
  }, [collection]);

  const visibleStickers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return CATALOG.filter((sticker) => {
      const copies = collection[sticker.id] || 0;
      const textMatch =
        !normalizedQuery ||
        sticker.code.includes(normalizedQuery) ||
        sticker.title.toLowerCase().includes(normalizedQuery) ||
        sticker.section.toLowerCase().includes(normalizedQuery);
      const teamMatch = selectedTeam === 'all' || sticker.team === selectedTeam;
      const filterMatch =
        filter === 'all' ||
        (filter === 'owned' && copies > 0) ||
        (filter === 'missing' && copies === 0) ||
        (filter === 'duplicates' && copies > 1) ||
        (filter === 'stars' && sticker.kind === 'estrella') ||
        (filter === 'coke' && sticker.kind === 'coca-cola') ||
        (filter === 'specials' && sticker.rarity !== 'base');

      return textMatch && teamMatch && filterMatch;
    });
  }, [collection, filter, query, selectedTeam]);

  function persist(nextCollection) {
    setCollection(nextCollection);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCollection));
  }

  function addNumbers(numbers) {
    if (numbers.length === 0) {
      setNotice('Escribe uno o varios numeros entre 1 y 980.');
      return;
    }

    const next = { ...collection };
    numbers.forEach((number) => {
      next[number] = (next[number] || 0) + 1;
    });
    persist(next);
    setEntry('');
    setNotice(`${numbers.length} registro(s) agregado(s). Si ya existian, quedaron como repetidas.`);
  }

  function setCopies(id, copies) {
    const next = { ...collection };
    if (copies <= 0) {
      delete next[id];
    } else {
      next[id] = copies;
    }
    persist(next);
  }

  function exportCollection() {
    const payload = {
      app: 'panini-world-cup-2026-mx',
      exportedAt: new Date().toISOString(),
      collection
    };
    navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
    setNotice('Progreso copiado al portapapeles como JSON.');
  }

  function importCollection(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const imported = parsed.collection || parsed;
        const next = {};
        Object.entries(imported).forEach(([key, value]) => {
          const id = Number.parseInt(key, 10);
          const copies = Number.parseInt(value, 10);
          if (id >= 1 && id <= ALBUM_TOTAL && copies > 0) next[id] = copies;
        });
        persist(next);
        setNotice('Progreso importado correctamente.');
      } catch {
        setNotice('No pude importar ese archivo. Debe ser un JSON exportado por esta app.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Album Panini Mundial 2026 - Mexico</p>
          <h1>Control de calcomanias, repetidas y faltantes</h1>
        </div>
        <div className="progress-ring" aria-label={`Progreso ${stats.percent}%`}>
          <span>{stats.percent}%</span>
        </div>
      </section>

      <section className="entry-panel">
        <form
          className="quick-entry"
          onSubmit={(event) => {
            event.preventDefault();
            addNumbers(parseNumbers(entry));
          }}
        >
          <label htmlFor="entry">Registrar numeros</label>
          <div className="entry-row">
            <input
              id="entry"
              value={entry}
              inputMode="numeric"
              placeholder="Ej. 7, 18, 18, 969"
              onChange={(event) => setEntry(event.target.value)}
            />
            <button type="submit">Agregar</button>
          </div>
          <p>{notice}</p>
        </form>

        <div className="stats-grid">
          <Stat label="Pegadas" value={stats.owned} helper={`de ${ALBUM_TOTAL}`} />
          <Stat label="Faltan" value={stats.missing} helper="sin registrar" />
          <Stat label="Repetidas" value={stats.duplicateUnits} helper="copias extra" />
          <Stat label="Estrellas" value={stats.stars} helper="de 68" />
          <Stat label="Coca-Cola" value={stats.coke} helper="de 12" />
        </div>
      </section>

      <section className="toolbar">
        <input
          aria-label="Buscar calcomania"
          value={query}
          placeholder="Buscar por numero, seccion o nombre"
          onChange={(event) => setQuery(event.target.value)}
        />
        <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filtro">
          <option value="all">Todas</option>
          <option value="owned">Ya tengo</option>
          <option value="missing">Me faltan</option>
          <option value="duplicates">Repetidas</option>
          <option value="stars">Estrellas</option>
          <option value="coke">Coca-Cola</option>
          <option value="specials">Especiales</option>
        </select>
        <select value={selectedTeam} onChange={(event) => setSelectedTeam(event.target.value)} aria-label="Equipo">
          <option value="all">Todos los equipos</option>
          {TEAMS.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>
        <button type="button" onClick={exportCollection}>Exportar</button>
        <label className="file-button">
          Importar
          <input type="file" accept="application/json" onChange={importCollection} />
        </label>
      </section>

      <section className="album-grid" aria-live="polite">
        {visibleStickers.map((sticker) => {
          const copies = collection[sticker.id] || 0;
          return (
            <article className={`sticker-card ${copies > 0 ? 'owned' : ''}`} key={sticker.id}>
              <div className="sticker-topline">
                <strong>{sticker.code}</strong>
                <span>{copies > 1 ? `${copies} copias` : copies === 1 ? '1 copia' : 'falta'}</span>
              </div>
              <h2>{sticker.title}</h2>
              <p>{sticker.section}</p>
              <div className="tags">
                <span>{sticker.kind}</span>
                <span>{sticker.rarity}</span>
              </div>
              <div className="stepper" aria-label={`Copias de ${sticker.title}`}>
                <button type="button" onClick={() => setCopies(sticker.id, copies - 1)}>-</button>
                <output>{copies}</output>
                <button type="button" onClick={() => setCopies(sticker.id, copies + 1)}>+</button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
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

createRoot(document.getElementById('root')).render(<App />);
