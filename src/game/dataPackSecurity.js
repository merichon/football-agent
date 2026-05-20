import { isRedistributableLicense } from "./licensePolicy.js";

export const DATA_PACK_LIMITS = {
  manifestBytes: 120_000,
  databaseBytes: 9_000_000,
  countries: 260,
  leagues: 700,
  clubs: 4_000,
  players: 18_000,
  maxStringLength: 160
};

const requiredArrays = ["countries", "leagues", "clubs", "players"];
const blockedAssetFlags = [
  "containsOfficialLogos",
  "containsRealPlayerPhotos",
  "containsOfficialKits",
  "containsTrademarkedBadges",
  "officialLogos",
  "realPlayerPhotos"
];

function fileNameOf(entry) {
  return entry?.name || entry?.unsafeOriginalName || "";
}

function hasPathTraversal(name = "") {
  return name.includes("..") || name.startsWith("/") || name.startsWith("\\") || /^[A-Za-z]:/.test(name) || name.includes("\\");
}

function getZipFile(zip, name) {
  return zip?.file?.(name) || null;
}

async function readLimitedJson(zip, name, maxBytes) {
  const file = getZipFile(zip, name);
  if (!file) throw new Error(`${name}_missing`);
  const text = await file.async("string");
  if (text.length > maxBytes) throw new Error(`${name}_too_large`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${name}_invalid_json`);
  }
}

function findDuplicateIds(items = []) {
  const seen = new Set();
  const duplicates = new Set();
  for (const item of items || []) {
    if (!item?.id) continue;
    if (seen.has(item.id)) duplicates.add(item.id);
    seen.add(item.id);
  }
  return [...duplicates];
}

function hasLongString(value, max = DATA_PACK_LIMITS.maxStringLength) {
  if (typeof value === "string") return value.length > max;
  if (Array.isArray(value)) return value.some((item) => hasLongString(item, max));
  if (value && typeof value === "object") return Object.values(value).some((item) => hasLongString(item, max));
  return false;
}

function validateSources(manifest = {}, database = {}) {
  const sources = [
    ...(Array.isArray(manifest.sources) ? manifest.sources : []),
    ...(Array.isArray(database.meta?.sources) ? database.meta.sources : []),
    ...(Array.isArray(database.meta?.dataSources) ? database.meta.dataSources : [])
  ];
  const errors = [];
  for (const source of sources) {
    const license = source?.license || source?.licenses?.[0]?.name;
    if (!isRedistributableLicense(license)) {
      errors.push(`source_license_blocked:${source?.name || source?.url || "unknown"}`);
    }
  }
  return errors;
}

export function inspectDataPackZip(zip) {
  const entries = Object.values(zip?.files || {});
  const errors = [];
  for (const entry of entries) {
    const name = fileNameOf(entry);
    if (hasPathTraversal(name)) errors.push(`unsafe_zip_path:${name}`);
  }
  if (!getZipFile(zip, "manifest.json")) errors.push("manifest.json_missing");
  if (!getZipFile(zip, "database.json")) errors.push("database.json_missing");
  return {
    ok: errors.length === 0,
    errors,
    entryCount: entries.length
  };
}

export function validateDataPackPayload(manifest, database) {
  const errors = [];
  const warnings = [];

  if (!manifest || typeof manifest !== "object") errors.push("manifest_missing");
  if (!database || typeof database !== "object") errors.push("database_missing");
  if (!manifest?.name) errors.push("manifest_name_missing");
  if (!manifest?.version) errors.push("manifest_version_missing");

  for (const flag of blockedAssetFlags) {
    if (manifest?.[flag] === true || database?.meta?.[flag] === true) {
      errors.push(`blocked_asset_flag:${flag}`);
    }
  }

  for (const arrayName of requiredArrays) {
    if (!Array.isArray(database?.[arrayName]) || !database[arrayName].length) errors.push(`${arrayName}_missing`);
  }

  if ((database?.countries || []).length > DATA_PACK_LIMITS.countries) errors.push("countries_too_many");
  if ((database?.leagues || []).length > DATA_PACK_LIMITS.leagues) errors.push("leagues_too_many");
  if ((database?.clubs || []).length > DATA_PACK_LIMITS.clubs) errors.push("clubs_too_many");
  if ((database?.players || []).length > DATA_PACK_LIMITS.players) errors.push("players_too_many");

  for (const arrayName of requiredArrays) {
    const duplicates = findDuplicateIds(database?.[arrayName] || []);
    if (duplicates.length) errors.push(`${arrayName}_duplicate_ids:${duplicates.slice(0, 5).join("|")}`);
  }

  if (hasLongString(manifest) || hasLongString(database?.meta || {})) warnings.push("metadata_long_strings_trim_recommended");

  const countryIds = new Set((database?.countries || []).map((item) => item.id));
  const leagueIds = new Set((database?.leagues || []).map((item) => item.id));
  const clubIds = new Set((database?.clubs || []).map((item) => item.id));

  for (const league of database?.leagues || []) {
    if (league.countryId && !countryIds.has(league.countryId) && league.countryId !== "intl") errors.push(`league_country_missing:${league.id}`);
  }
  for (const club of database?.clubs || []) {
    if (!club.leagueId || !leagueIds.has(club.leagueId)) errors.push(`club_league_missing:${club.id}`);
  }
  for (const player of database?.players || []) {
    if (!player.id) errors.push("player_id_missing");
    if (!player.name) errors.push(`player_name_missing:${player.id || "unknown"}`);
    if (player.clubId && !clubIds.has(player.clubId)) warnings.push(`player_club_missing:${player.id}`);
  }

  errors.push(...validateSources(manifest, database));

  return {
    ok: errors.length === 0,
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)]
  };
}

export async function readDataPackFromZip(zip) {
  const archive = inspectDataPackZip(zip);
  if (!archive.ok) return { ok: false, errors: archive.errors, warnings: [] };
  const manifest = await readLimitedJson(zip, "manifest.json", DATA_PACK_LIMITS.manifestBytes);
  const database = await readLimitedJson(zip, "database.json", DATA_PACK_LIMITS.databaseBytes);
  const validation = validateDataPackPayload(manifest, database);
  return {
    ok: validation.ok,
    manifest,
    database,
    errors: validation.errors,
    warnings: validation.warnings,
    archive
  };
}
