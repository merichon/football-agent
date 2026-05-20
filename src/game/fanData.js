import { demoDb } from "./demoData.js";
import { assertRedistributableSource, isRedistributableLicense } from "./licensePolicy.js";

const OPENFOOTBALL_COUNTRIES = [
  { countryId: "tr", folder: "europe/turkey", label: "Turkey" },
  { countryId: "en", folder: "europe/england", label: "England" },
  { countryId: "fr", folder: "europe/france", label: "France" },
  { countryId: "es", folder: "europe/spain", label: "Spain" },
  { countryId: "de", folder: "europe/germany", label: "Germany" },
  { countryId: "it", folder: "europe/italy", label: "Italy" },
  { countryId: "pt", folder: "europe/portugal", label: "Portugal" },
  { countryId: "nl", folder: "europe/netherlands", label: "Netherlands" },
  { countryId: "br", folder: "south-america/brazil", label: "Brazil" },
  { countryId: "ar", folder: "south-america/argentina", label: "Argentina" }
];

const API_ROOT = "https://api.github.com/repos/openfootball/players/contents";
const OPENFOOTBALL_SOURCE = {
  name: "OpenFootball Players",
  url: "https://github.com/openfootball/players",
  license: "CC0-1.0"
};
const OPENFOOTBALL_FIXTURES_SOURCE = {
  name: "openfootball/football.json",
  url: "https://github.com/openfootball/football.json",
  license: "CC0-1.0",
  use: "fixture-history-schema"
};
const OPENFOOTBALL_FIXTURE_ROOT = "https://raw.githubusercontent.com/openfootball/football.json/master";
const OPENFOOTBALL_FIXTURE_DATASETS = [
  { code: "en.1", countryId: "en", countryName: "England", tier: 1, path: "2025-26/en.1.json", reputation: 88 },
  { code: "en.2", countryId: "en", countryName: "England", tier: 2, path: "2025-26/en.2.json", reputation: 72 },
  { code: "en.3", countryId: "en", countryName: "England", tier: 3, path: "2025-26/en.3.json", reputation: 58 },
  { code: "en.4", countryId: "en", countryName: "England", tier: 4, path: "2025-26/en.4.json", reputation: 44 },
  { code: "de.1", countryId: "de", countryName: "Germany", tier: 1, path: "2025-26/de.1.json", reputation: 86 },
  { code: "de.2", countryId: "de", countryName: "Germany", tier: 2, path: "2025-26/de.2.json", reputation: 68 },
  { code: "es.1", countryId: "es", countryName: "Spain", tier: 1, path: "2025-26/es.1.json", reputation: 87 },
  { code: "es.2", countryId: "es", countryName: "Spain", tier: 2, path: "2025-26/es.2.json", reputation: 66 },
  { code: "it.1", countryId: "it", countryName: "Italy", tier: 1, path: "2025-26/it.1.json", reputation: 85 },
  { code: "it.2", countryId: "it", countryName: "Italy", tier: 2, path: "2025-26/it.2.json", reputation: 65 },
  { code: "fr.1", countryId: "fr", countryName: "France", tier: 1, path: "2025-26/fr.1.json", reputation: 82 },
  { code: "fr.2", countryId: "fr", countryName: "France", tier: 2, path: "2025-26/fr.2.json", reputation: 63 }
];
const REEP_REGISTER_SOURCE = {
  name: "Reep Entity Register",
  url: "https://github.com/withqwerty/reep",
  license: "CC0-1.0",
  use: "canonical-entity-id-schema"
};
const REEP_PROVIDER_KEYS = [
  "key_wikidata",
  "key_transfermarkt",
  "key_transfermarkt_manager",
  "key_fbref",
  "key_soccerway",
  "key_sofascore",
  "key_flashscore",
  "key_opta",
  "key_premier_league",
  "key_uefa",
  "key_understat",
  "key_whoscored",
  "key_fotmob",
  "key_api_football",
  "key_clubelo"
];
const STATSBOMB_SOURCE = {
  name: "StatsBomb Open Data",
  url: "https://github.com/statsbomb/open-data",
  license: "other"
};

export const FAN_DATA_SOURCE_LEDGER = [
  OPENFOOTBALL_SOURCE,
  OPENFOOTBALL_FIXTURES_SOURCE,
  REEP_REGISTER_SOURCE
];

export async function buildOpenFootballDataPack(onProgress = () => {}) {
  assertRedistributableSource(OPENFOOTBALL_SOURCE);
  assertRedistributableSource(OPENFOOTBALL_FIXTURES_SOURCE);
  const loaded = [];
  for (let index = 0; index < OPENFOOTBALL_COUNTRIES.length; index += 1) {
    const country = OPENFOOTBALL_COUNTRIES[index];
    onProgress({ step: `${country.label} oyunculari araniyor`, current: index + 1, total: OPENFOOTBALL_COUNTRIES.length });
    try {
      const fileUrl = await findPlayersFile(country.folder);
      if (!fileUrl) continue;
      const response = await fetch(fileUrl);
      if (!response.ok) continue;
      const text = await response.text();
      loaded.push(...parseOpenFootballPlayers(text, country.countryId));
    } catch (error) {
      // Some country folders may move over time; keep the pack usable with the countries that load.
    }
  }
  const fixtureDb = await loadOpenFootballFixtures(onProgress);
  const baseClubs = fixtureDb?.clubs?.length ? fixtureDb.clubs : demoDb.clubs;
  const players = assignPlayersToFixtureClubs(loaded.slice(0, 260).map((player, index) => toGamePlayer(player, index, baseClubs)), baseClubs);
  if (players.length < 20) throw new Error("OpenFootball oyuncu verisi yuklenemedi.");
  const statsBomb = await loadStatsBombInsights(onProgress);
  return {
    ...demoDb,
    meta: {
      ...demoDb.meta,
      id: "openfootball-fan-pack",
      name: "OpenFootball Fan Data Pack",
      source: OPENFOOTBALL_SOURCE.url,
      license: OPENFOOTBALL_SOURCE.license,
      dataSources: FAN_DATA_SOURCE_LEDGER,
      identitySchema: "reep-compatible-local-v1",
      identityProviderKeys: REEP_PROVIDER_KEYS,
      fixtureSchema: "openfootball-football-json-compatible",
      blockedSources: statsBomb?.blocked ? [statsBomb] : undefined
    },
    countries: fixtureDb?.countries?.length ? mergeById(demoDb.countries, fixtureDb.countries) : demoDb.countries,
    leagues: fixtureDb?.leagues?.length ? [...fixtureDb.leagues, ...demoDb.leagues.filter((league) => league.tournament)] : demoDb.leagues,
    clubs: fixtureDb?.clubs?.length ? [...fixtureDb.clubs, ...demoDb.clubs.filter((club) => club.leagueId?.startsWith("eu-"))] : demoDb.clubs,
    players,
    fixtures: fixtureDb?.fixtures || [],
    identityIndex: buildIdentityIndex({ players, clubs: fixtureDb?.clubs || [] }),
    analytics: statsBomb?.blocked ? undefined : statsBomb || undefined
  };
}

export function buildIdentityIndex({ players = [], clubs = [], coaches = [], competitions = [] } = {}) {
  const entities = [
    ...players.map((entity) => ({ type: "player", entity })),
    ...clubs.map((entity) => ({ type: "team", entity })),
    ...coaches.map((entity) => ({ type: "coach", entity })),
    ...competitions.map((entity) => ({ type: "competition", entity }))
  ];
  const byReepId = {};
  const byProvider = {};
  const aliases = {};
  for (const { type, entity } of entities) {
    const reepId = entity.sourceRefs?.reepId || entity.sourceRefs?.canonicalId || entity.id;
    if (!reepId) continue;
    byReepId[reepId] = {
      id: entity.id,
      reepId,
      type,
      name: entity.name,
      providerKeys: entity.sourceRefs?.providerKeys || {}
    };
    for (const [provider, providerId] of Object.entries(byReepId[reepId].providerKeys || {})) {
      if (!providerId) continue;
      byProvider[`${provider}:${providerId}`] = reepId;
    }
    aliases[normalizeIdentityName(entity.name)] = reepId;
  }
  return {
    schema: "reep-compatible-local-v1",
    source: REEP_REGISTER_SOURCE.name,
    license: REEP_REGISTER_SOURCE.license,
    byReepId,
    byProvider,
    aliases
  };
}

export function parseReepCsv(text, type = "people") {
  const rows = parseCsvRows(text);
  return rows.map((row) => normalizeReepRow(row, type)).filter(Boolean);
}

export function normalizeReepRow(row, type = "people") {
  const reepId = row.reep_id || row.id;
  if (!reepId) return null;
  const entityType = row.type || (type === "teams" ? "team" : type === "competitions" ? "competition" : type === "seasons" ? "season" : "player");
  const providerKeys = {};
  for (const [key, value] of Object.entries(row)) {
    if (key.startsWith("key_") && value) providerKeys[key.replace(/^key_/, "")] = value;
  }
  return {
    reepId,
    type: entityType,
    name: row.name || row.full_name || row.competition || row.team || "",
    fullName: row.full_name || "",
    dateOfBirth: row.date_of_birth || "",
    nationality: row.nationality || row.country || "",
    providerKeys
  };
}

export function attachReepIdentitiesToDatabase(database, reepRows = []) {
  if (!database || !reepRows.length) return database;
  assertRedistributableSource(REEP_REGISTER_SOURCE);
  const matchedPlayers = (database.players || []).map((player) => attachReepIdentity(player, "player", reepRows));
  const matchedClubs = (database.clubs || []).map((club) => attachReepIdentity(club, "team", reepRows));
  return {
    ...database,
    meta: {
      ...database.meta,
      identitySchema: "reep-compatible-local-v1",
      identityProviderKeys: REEP_PROVIDER_KEYS,
      dataSources: mergeSources(database.meta?.dataSources, [REEP_REGISTER_SOURCE])
    },
    players: matchedPlayers,
    clubs: matchedClubs,
    identityIndex: buildIdentityIndex({ players: matchedPlayers, clubs: matchedClubs })
  };
}

function attachReepIdentity(entity, type, rows) {
  const normalized = normalizeIdentityName(entity.name);
  const providerKeys = entity.sourceRefs?.providerKeys || {};
  const byProvider = rows.find((row) => {
    if (row.type !== type && !(type === "team" && row.type === "club")) return false;
    return Object.entries(providerKeys).some(([provider, id]) => row.providerKeys?.[provider] && row.providerKeys[provider] === id);
  });
  const byName = rows.find((row) => {
    if (row.type !== type && !(type === "team" && row.type === "club")) return false;
    return normalizeIdentityName(row.name) === normalized;
  });
  const match = byProvider || byName;
  if (!match) return entity;
  return {
    ...entity,
    id: match.reepId,
    sourceRefs: {
      ...(entity.sourceRefs || {}),
      reepId: match.reepId,
      providerKeys: { ...(entity.sourceRefs?.providerKeys || {}), ...(match.providerKeys || {}) }
    }
  };
}

export async function loadOpenFootballFixtures(onProgress = () => {}) {
  assertRedistributableSource(OPENFOOTBALL_FIXTURES_SOURCE);
  const packs = [];
  for (let index = 0; index < OPENFOOTBALL_FIXTURE_DATASETS.length; index += 1) {
    const dataset = OPENFOOTBALL_FIXTURE_DATASETS[index];
    onProgress({ step: `${dataset.code} fiksturleri yukleniyor`, current: index + 1, total: OPENFOOTBALL_FIXTURE_DATASETS.length });
    try {
      const response = await fetch(`${OPENFOOTBALL_FIXTURE_ROOT}/${dataset.path}`);
      if (!response.ok) continue;
      const json = await response.json();
      packs.push(parseOpenFootballFixtureJson(json, dataset));
    } catch (error) {
      // Missing league files should not block the whole fan pack.
    }
  }
  const countries = mergeById(...packs.map((pack) => pack.countries));
  const leagues = packs.map((pack) => pack.league);
  const clubs = mergeById(...packs.map((pack) => pack.clubs));
  const fixtures = packs.flatMap((pack) => pack.fixtures);
  return { countries, leagues, clubs, fixtures };
}

export function parseOpenFootballFixtureJson(json, dataset = {}) {
  const leagueId = `of-${dataset.code || slugify(json?.name || "league")}`;
  const countryId = dataset.countryId || "intl";
  const countryName = dataset.countryName || countryId.toUpperCase();
  const matches = Array.isArray(json?.matches) ? json.matches : [];
  const clubNames = [...new Set(matches.flatMap((match) => [match.team1, match.team2]).filter(Boolean))];
  const clubs = clubNames.map((name, index) => {
    const clubId = entityIdFor("club", `${countryId}:${name}`);
    const tier = dataset.tier || 1;
    const reputation = Math.max(22, (dataset.reputation || 55) - index % 7 - (tier - 1) * 5);
    return {
      id: clubId,
      leagueId,
      name,
      countryId,
      budget: Math.round((tier === 1 ? 85000000 : tier === 2 ? 24000000 : tier === 3 ? 8000000 : 4200000) * (1 - (index % 8) * 0.045)),
      reputation,
      need: ["ST", "CM", "GK", "CB", "LW", "DM"][index % 6],
      relation: 24 + (index % 20),
      negotiationHardness: Math.max(24, reputation - 8 + (index % 5)),
      transferPolicy: tier === 1 ? "star" : tier === 2 ? "develop" : "value",
      fanData: true,
      sourceRefs: {
        reepId: clubId,
        canonicalId: clubId,
        openfootball: `football.json:${dataset.code}:${name}`,
        providerKeys: {
          openfootball: `${dataset.code}:${name}`
        }
      }
    };
  });
  const clubsByName = new Map(clubs.map((club) => [club.name, club]));
  const fixtures = matches.map((match, index) => {
    const home = clubsByName.get(match.team1);
    const away = clubsByName.get(match.team2);
    const ft = Array.isArray(match.score?.ft) ? match.score.ft : null;
    return {
      id: `${leagueId}-m${index + 1}`,
      leagueId,
      source: OPENFOOTBALL_FIXTURES_SOURCE.name,
      license: OPENFOOTBALL_FIXTURES_SOURCE.license,
      round: match.round || `Round ${index + 1}`,
      week: roundToWeek(match.round, index),
      date: match.date || null,
      time: match.time || null,
      homeClubId: home?.id,
      awayClubId: away?.id,
      homeName: match.team1,
      awayName: match.team2,
      homeGoals: ft ? Number(ft[0]) : null,
      awayGoals: ft ? Number(ft[1]) : null,
      played: !!ft
    };
  }).filter((fixture) => fixture.homeClubId && fixture.awayClubId);
  return {
    countries: [{ id: countryId, name: countryName }],
    league: {
      id: leagueId,
      countryId,
      name: json?.name || `${countryName} ${dataset.code}`,
      reputation: dataset.reputation || 55,
      tier: dataset.tier || 1,
      fanData: true,
      fixtureSource: OPENFOOTBALL_FIXTURES_SOURCE.name,
      sourceRefs: {
        reepId: entityIdFor("competition", `${countryId}:${json?.name || dataset.code}`),
        openfootball: `football.json:${dataset.path || dataset.code}`,
        providerKeys: {
          openfootball: dataset.path || dataset.code
        }
      }
    },
    clubs,
    fixtures
  };
}

export async function loadStatsBombInsights(onProgress = () => {}) {
  if (!isRedistributableLicense(STATSBOMB_SOURCE.license)) {
    return { ...STATSBOMB_SOURCE, blocked: true, reason: "license-not-allowlisted" };
  }
  try {
    onProgress({ step: "StatsBomb mac olaylari okunuyor", current: 9, total: 10 });
    const response = await fetch("https://raw.githubusercontent.com/statsbomb/open-data/master/data/events/15946.json");
    if (!response.ok) return null;
    const events = await response.json();
    return buildStatsBombInsights(events);
  } catch (error) {
    return null;
  }
}

export function buildStatsBombInsights(events = []) {
  const usable = events.filter((event) => event?.type?.name && event.minute > 0);
  const counts = usable.reduce((acc, event) => {
    const key = event.type.name;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const shots = usable.filter((event) => event.type.name === "Shot");
  const passes = usable.filter((event) => event.type.name === "Pass");
  const pressures = usable.filter((event) => event.type.name === "Pressure");
  return {
    source: STATSBOMB_SOURCE.name,
    license: STATSBOMB_SOURCE.license,
    eventCounts: counts,
    shotShare: usable.length ? shots.length / usable.length : 0,
    passShare: usable.length ? passes.length / usable.length : 0,
    pressureShare: usable.length ? pressures.length / usable.length : 0,
    templates: [
      "StatsBomb referansi: pas zinciri ceza sahasi cevresinde olgunlasti.",
      "StatsBomb referansı: baskı tetiği top kaybından hemen sonra geldi.",
      "StatsBomb referansı: şut açısı düşük ama ikinci top tehlikesi yüksek.",
      "StatsBomb referansı: geçiş hücumu kanattan hız kazandı."
    ]
  };
}

async function findPlayersFile(folder) {
  const response = await fetch(`${API_ROOT}/${folder}?ref=master`);
  if (!response.ok) return null;
  const entries = await response.json();
  const file = Array.isArray(entries) ? entries.find((entry) => entry.type === "file" && entry.name.endsWith(".players.txt")) : null;
  return file?.download_url || null;
}

export function parseOpenFootballPlayers(text, countryId = "tr") {
  const currentYear = 2026;
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("=") && line.includes(","))
    .map((line) => {
      const match = line.match(/^(.+?),\s+([GDMF])\s*,.*?b\.\s+(\d{1,2}\s+\w+\s+(\d{4}))/);
      if (!match) return null;
      const name = match[1].trim();
      const rawPosition = match[2];
      const birthYear = Number(match[4]);
      const age = birthYear ? Math.max(16, currentYear - birthYear) : 21;
      return {
        name,
        countryId,
        age,
        position: positionFromOpenFootball(rawPosition),
        birthText: match[3]
      };
    })
    .filter(Boolean);
}

function positionFromOpenFootball(position) {
  if (position === "G") return "GK";
  if (position === "D") return "CB";
  if (position === "M") return "CM";
  if (position === "F") return "ST";
  return "CM";
}

function toGamePlayer(player, index, availableClubs = demoDb.clubs) {
  const clubs = availableClubs.filter((club) => club.countryId === player.countryId || club.leagueId?.includes(player.countryId));
  const lowerClubs = clubs.filter((club) => {
    const league = [...demoDb.leagues, ...(availableClubs.leagues || [])].find((item) => item.id === club.leagueId);
    return !league || league.tier >= 2;
  });
  const pool = lowerClubs.length ? lowerClubs : clubs.length ? clubs : availableClubs;
  const club = pool[index % Math.max(1, pool.length)] || demoDb.clubs[index % demoDb.clubs.length];
  const ageBoost = player.age <= 20 ? 9 : player.age <= 24 ? 5 : 0;
  const base = Math.max(48, Math.min(72, 56 + (index % 13) + (player.position === "GK" ? 1 : 0)));
  const potential = Math.max(base + 3, Math.min(91, base + ageBoost + 9 + (index % 7)));
  const hiddenPotential = Math.max(base + 2, Math.min(95, potential + ((index % 5) - 2)));
  const canonicalId = entityIdFor("player", `${player.countryId}:${player.name}:${player.birthText || player.age}`);
  return {
    id: canonicalId,
    name: player.name,
    generatedName: false,
    fanData: true,
    sourceRefs: {
      reepId: canonicalId,
      canonicalId,
      openfootballPlayers: `openfootball.players:${player.countryId}:${index + 1}`,
      reepCompatible: canonicalId,
      providerKeys: {
        openfootball_players: `${player.countryId}:${index + 1}`
      }
    },
    countryId: player.countryId,
    clubId: club?.id || null,
    position: player.position,
    age: player.age,
    overall: base,
    potential,
    hiddenPotential,
    value: Math.round((180000 + base * 9000 + potential * 6500) / 1000) * 1000,
    wage: Math.round((1200 + base * 45) / 100) * 100,
    form: 58 + (index % 22),
    morale: 55 + (index % 18),
    happiness: 55 + ((index * 3) % 24),
    ego: 35 + ((index * 7) % 45),
    loyalty: 40 + ((index * 11) % 50),
    injuryRisk: 8 + (index % 22),
    growthRate: 38 + ((index * 5) % 52),
    personality: ["ambitious", "loyal", "professional", "media", "money"][index % 5],
    story: `OpenFootball oyuncu havuzundan gelen ${player.position} profili.`,
    represented: false,
    scouted: index < 8,
    scoutConfidence: index < 8 ? 54 + (index % 20) : undefined
  };
}

function entityIdFor(type, value) {
  const prefix = type === "club" || type === "team" ? "reep_t" : type === "competition" ? "reep_l" : type === "season" ? "reep_s" : type === "coach" ? "reep_c" : "reep_p";
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}${(hash >>> 0).toString(16).padStart(8, "0").slice(0, 8)}`;
}

function parseCsvRows(text = "") {
  const rows = [];
  const records = [];
  let field = "";
  let row = [];
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted && char === "\"" && next === "\"") {
      field += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      field = "";
      if (row.some((cell) => cell.length)) records.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    records.push(row);
  }
  const headers = records.shift() || [];
  for (const record of records) {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = record[index] || "";
    });
    rows.push(item);
  }
  return rows;
}

function normalizeIdentityName(name = "") {
  return String(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function mergeSources(existing = [], additions = []) {
  const byName = new Map();
  for (const source of [...existing, ...additions]) {
    if (source?.name) byName.set(source.name, source);
  }
  return [...byName.values()];
}

function assignPlayersToFixtureClubs(players, clubs = []) {
  if (!clubs.length) return players;
  const clubsByCountry = clubs.reduce((acc, club) => {
    const key = club.countryId || String(club.leagueId || "").slice(3, 5) || "intl";
    acc[key] = acc[key] || [];
    acc[key].push(club);
    return acc;
  }, {});
  return players.map((player, index) => {
    const pool = clubsByCountry[player.countryId] || clubs;
    const club = pool[index % Math.max(1, pool.length)];
    return { ...player, clubId: club?.id || player.clubId };
  });
}

function mergeById(...groups) {
  const map = new Map();
  for (const group of groups.flat()) {
    if (group?.id && !map.has(group.id)) map.set(group.id, group);
  }
  return [...map.values()];
}

function roundToWeek(round, index) {
  const number = String(round || "").match(/(\d+)/)?.[1];
  return number ? Number(number) : Math.floor(index / 10) + 1;
}

function slugify(value) {
  return String(value || "league").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
