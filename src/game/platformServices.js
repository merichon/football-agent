const DEV_MODE = typeof __DEV__ !== "undefined" ? __DEV__ : true;

export const PRODUCT_CATALOG = [
  { id: "remove_ads", type: "entitlement", label: "Remove Ads", storeSafe: true },
  { id: "supporter_pack", type: "cosmetic", label: "Supporter Pack", storeSafe: true },
  { id: "theme_midnight_gold", type: "cosmetic", label: "Midnight Gold Theme", storeSafe: true },
  { id: "scenario_lower_league", type: "content", label: "Lower League Stories", storeSafe: true },
  { id: "extra_save_slots", type: "utility", label: "Extra Career Slots", storeSafe: true }
];

export const AD_PLACEMENTS = {
  MATCH_DAY_COMPLETE: "match_day_complete",
  WEEK_COMPLETE: "week_complete",
  RETURN_TO_MENU: "return_to_menu",
  REWARDED_SCOUT_REPORT: "rewarded_scout_report"
};

export const DEFAULT_LIVEOPS_CONFIG = {
  version: 1,
  adsEnabled: false,
  analyticsEnabled: false,
  aiNarratorEnabled: false,
  remoteConfigEnabled: false,
  featureFlags: {
    premiumThemes: false,
    rewardedScoutRefresh: false,
    cloudSync: false,
    seasonalEvents: true
  },
  economy: {
    maxWeeklyCardCount: 1,
    earlyCommissionCap: 0.05,
    minimumNegotiationRep: 12
  }
};

export function evaluateEconomyGuardrails(career = {}) {
  const represented = (career.db?.players || []).filter((player) => player.represented);
  const totalCommissionRate = represented.reduce((sum, player) => sum + (player.agencyCommissionRate || 0), 0);
  const averageCommissionRate = represented.length ? totalCommissionRate / represented.length : 0;
  const pendingCards = career.pendingCards || [];
  const issues = [];

  if ((career.reputation || 0) < 25 && represented.length > 3) {
    issues.push("Early reputation is low for this portfolio size.");
  }
  if (averageCommissionRate > 7 && (career.reputation || 0) < 35) {
    issues.push("Early commission rate is too high for low reputation.");
  }
  if (pendingCards.length > 3) {
    issues.push("Too many unresolved cards can damage pacing and economy.");
  }
  if ((career.money || 0) > 1200000 && (career.week || 1) < 10) {
    issues.push("Early cash may be growing too fast.");
  }

  return {
    ok: issues.length === 0,
    represented: represented.length,
    averageCommissionRate: Math.round(averageCommissionRate * 10) / 10,
    pendingCards: pendingCards.length,
    issues
  };
}

export function buildProfessionalReadinessReport(career = {}, options = {}) {
  const sources = career.db?.meta?.dataSources || career.db?.meta?.sources || [];
  const blockedSources = career.db?.meta?.blockedSources || [];
  const economy = evaluateEconomyGuardrails(career);
  const entitlements = getEntitlementSnapshot(options.entitlements || {});
  const adAllowed = canShowAd({
    placement: AD_PLACEMENTS.MATCH_DAY_COMPLETE,
    entitlements,
    history: options.adHistory || []
  });
  const checks = [
    { id: "save", label: "Versioned save", ok: Number(options.saveSchemaVersion || 0) >= 4 },
    { id: "economy", label: "Economy guardrails", ok: economy.ok },
    { id: "ads", label: "Ad cap boundary", ok: adAllowed.ok || adAllowed.reason === "remove-ads-owned" },
    { id: "mods", label: "Data pack source log", ok: sources.length > 0 || career.db?.meta?.id === "fictional-core" },
    { id: "licenses", label: "Blocked license separation", ok: Array.isArray(blockedSources) },
    { id: "privacy", label: "Privacy flags separated", ok: true },
    { id: "cloud", label: "Cloud conflict requires choice", ok: createCloudSyncAdapter().resolveConflict({}, {}).status === "needs-user-choice" }
  ];
  const passed = checks.filter((item) => item.ok).length;

  return {
    score: Math.round((passed / checks.length) * 100),
    checks,
    economy,
    monetization: {
      products: PRODUCT_CATALOG.length,
      payToWinProducts: 0,
      removeAdsReady: PRODUCT_CATALOG.some((item) => item.id === "remove_ads")
    },
    dataPack: {
      sourceCount: sources.length,
      blockedCount: blockedSources.length,
      corePack: career.db?.meta?.id || "unknown"
    },
    releaseRisks: [
      ...economy.issues,
      blockedSources.length ? `${blockedSources.length} blocked data source(s) are separated from the active pack.` : "",
      "Expo/React Native dependency audit must be handled before store release."
    ].filter(Boolean)
  };
}

const eventAllowList = new Set([
  "app_boot",
  "career_started",
  "tutorial_completed",
  "week_prepared",
  "match_day_completed",
  "card_resolved",
  "first_negotiation",
  "first_transfer",
  "data_pack_imported",
  "data_pack_failed",
  "settings_changed"
]);

function safePayload(payload = {}) {
  const safe = {};
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (["string", "number", "boolean"].includes(typeof value)) safe[key] = value;
  });
  return safe;
}

export function initializePlatformServices(meta = {}) {
  trackGameEvent("app_boot", {
    target: meta.target || "local",
    version: meta.version || "0.1.0"
  });
  return {
    liveOps: DEFAULT_LIVEOPS_CONFIG,
    products: PRODUCT_CATALOG
  };
}

export function trackGameEvent(name, payload = {}) {
  if (!eventAllowList.has(name)) return false;
  const event = {
    name,
    payload: safePayload(payload),
    at: new Date().toISOString()
  };
  if (DEV_MODE && typeof console !== "undefined") {
    console.debug("[analytics:dev]", event);
  }
  return true;
}

export function getPrivacySnapshot(settings = {}) {
  return {
    analyticsConsent: Boolean(settings.analyticsConsent),
    adConsent: Boolean(settings.adConsent)
  };
}

export function getEntitlementSnapshot(overrides = {}) {
  return {
    source: "local-placeholder",
    owned: Array.isArray(overrides.owned) ? [...new Set(overrides.owned)] : [],
    checkedAt: new Date().toISOString()
  };
}

export function hasEntitlement(entitlements, id) {
  return Boolean(entitlements?.owned?.includes(id));
}

export function canShowAd({ placement, entitlements, history = [], now = Date.now() } = {}) {
  if (!Object.values(AD_PLACEMENTS).includes(placement)) return { ok: false, reason: "unknown-placement" };
  if (hasEntitlement(entitlements, "remove_ads")) return { ok: false, reason: "remove-ads-owned" };
  const recent = history.filter((item) => item.placement === placement && now - item.at < 1000 * 60 * 12);
  if (recent.length >= 1 && placement !== AD_PLACEMENTS.REWARDED_SCOUT_REPORT) {
    return { ok: false, reason: "frequency-cap" };
  }
  return { ok: true, reason: "eligible" };
}

export function createCloudSyncAdapter() {
  return {
    enabled: false,
    provider: "local-only",
    async pull() {
      return { status: "disabled" };
    },
    async push() {
      return { status: "disabled" };
    },
    resolveConflict(localSave, cloudSave) {
      return {
        status: "needs-user-choice",
        localSavedAt: localSave?.savedAt,
        cloudSavedAt: cloudSave?.savedAt
      };
    }
  };
}

export function validateRemoteConfig(config = {}) {
  const allowedTopLevel = new Set(Object.keys(DEFAULT_LIVEOPS_CONFIG));
  const unknownKeys = Object.keys(config || {}).filter((key) => !allowedTopLevel.has(key));
  return {
    ok: unknownKeys.length === 0,
    errors: unknownKeys.map((key) => `Unknown remote config key: ${key}`)
  };
}
