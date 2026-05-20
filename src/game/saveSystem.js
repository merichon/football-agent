export const SAVE_SCHEMA_VERSION = 4;
export const SAVE_ENVELOPE_TYPE = "football-agent-save";

const SAFE_SETTINGS_KEYS = new Set(["lang", "soundOn", "reducedMotion", "analyticsConsent", "adConsent"]);

function nowIso() {
  return new Date().toISOString();
}

function sanitizeSettings(settings = {}) {
  return Object.fromEntries(
    Object.entries(settings || {}).filter(([key, value]) => SAFE_SETTINGS_KEYS.has(key) && ["string", "boolean", "number"].includes(typeof value))
  );
}

function sanitizeEntitlements(entitlements = {}) {
  const owned = Array.isArray(entitlements.owned) ? entitlements.owned.filter((item) => typeof item === "string") : [];
  return {
    source: entitlements.source || "local-placeholder",
    owned: [...new Set(owned)],
    checkedAt: entitlements.checkedAt || nowIso()
  };
}

function sanitizeContentPacks(contentPacks = []) {
  return (contentPacks || [])
    .filter(Boolean)
    .map((pack) => ({
      id: String(pack.id || pack.name || "unknown-pack"),
      name: String(pack.name || pack.id || "Unknown Pack"),
      version: String(pack.version || "0.0.0"),
      license: String(pack.license || "fictional"),
      sourceCount: Number(pack.sourceCount || 0)
    }))
    .slice(0, 12);
}

export function buildContentPackRefs(career) {
  const meta = career?.db?.meta || {};
  const sources = meta.dataSources || meta.sources || [];
  return [
    {
      id: meta.id || "fictional-core",
      name: meta.name || "Fictional Core",
      version: meta.version || "0.1.0",
      license: meta.license || (sources.length ? "mixed-open-license" : "fictional"),
      sourceCount: sources.length
    }
  ];
}

export function createSaveEnvelope(career, meta = {}) {
  return {
    type: SAVE_ENVELOPE_TYPE,
    schemaVersion: SAVE_SCHEMA_VERSION,
    savedAt: nowIso(),
    career,
    settings: sanitizeSettings(meta.settings),
    entitlements: sanitizeEntitlements(meta.entitlements),
    contentPacks: sanitizeContentPacks(meta.contentPacks),
    privacy: {
      analyticsConsent: Boolean(meta.privacy?.analyticsConsent),
      adConsent: Boolean(meta.privacy?.adConsent)
    }
  };
}

export function readCareerSave(raw) {
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!parsed) return { career: null, envelope: null, migrated: false, warnings: ["empty-save"] };

  if (parsed.type === SAVE_ENVELOPE_TYPE && parsed.career) {
    const migrated = Number(parsed.schemaVersion || 0) !== SAVE_SCHEMA_VERSION;
    return {
      career: parsed.career,
      envelope: {
        ...parsed,
        schemaVersion: SAVE_SCHEMA_VERSION,
        settings: sanitizeSettings(parsed.settings),
        entitlements: sanitizeEntitlements(parsed.entitlements),
        contentPacks: sanitizeContentPacks(parsed.contentPacks)
      },
      migrated,
      warnings: migrated ? ["schema-version-upgraded"] : []
    };
  }

  return {
    career: parsed,
    envelope: createSaveEnvelope(parsed, { settings: { legacy: true } }),
    migrated: true,
    warnings: ["legacy-career-json"]
  };
}

export function tryReadCareerSave(raw) {
  try {
    return readCareerSave(raw);
  } catch (error) {
    return {
      career: null,
      envelope: null,
      migrated: false,
      warnings: [],
      errors: [`save_parse_failed:${error?.message || "unknown"}`]
    };
  }
}

export function serializeCareerSave(career, meta = {}) {
  return JSON.stringify(createSaveEnvelope(career, meta));
}

export function validateCareerSavePayload(payload) {
  const errors = [];
  if (!payload || payload.type !== SAVE_ENVELOPE_TYPE) errors.push("Save envelope type is invalid.");
  if (payload?.schemaVersion && Number(payload.schemaVersion) > SAVE_SCHEMA_VERSION) errors.push("Save schema is newer than this app.");
  if (!payload?.career?.db?.players || !payload?.career?.db?.clubs) errors.push("Career database is missing players or clubs.");
  if (payload?.entitlements?.owned && !Array.isArray(payload.entitlements.owned)) errors.push("Entitlements must be an array.");
  return { ok: errors.length === 0, errors };
}
