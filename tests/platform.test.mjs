import assert from "node:assert/strict";
import {
  AD_PLACEMENTS,
  buildAiNarratorProxyPayload,
  buildGoogleCloudReadinessPlan,
  buildProfessionalReadinessReport,
  canShowAd,
  createCloudSyncAdapter,
  evaluateEconomyGuardrails,
  getEntitlementSnapshot,
  PRODUCT_CATALOG,
  validateGoogleBackendConfig,
  validateRemoteConfig
} from "../src/game/platformServices.js";
import { createInitialCareer } from "../src/game/engine.js";
import { demoDb } from "../src/game/demoData.js";
import { SAVE_SCHEMA_VERSION } from "../src/game/saveSystem.js";

const career = createInitialCareer("Test Agent", demoDb, "tr");

assert.ok(PRODUCT_CATALOG.some((item) => item.id === "remove_ads"));
assert.equal(PRODUCT_CATALOG.filter((item) => item.type === "entitlement").length, 1);

const entitlement = getEntitlementSnapshot({ owned: ["remove_ads", "remove_ads"] });
assert.deepEqual(entitlement.owned, ["remove_ads"]);
assert.equal(canShowAd({ placement: AD_PLACEMENTS.MATCH_DAY_COMPLETE, entitlements: entitlement }).ok, false);

const adHistory = [{ placement: AD_PLACEMENTS.MATCH_DAY_COMPLETE, at: Date.now() }];
assert.equal(canShowAd({ placement: AD_PLACEMENTS.MATCH_DAY_COMPLETE, history: adHistory }).reason, "frequency-cap");

const economy = evaluateEconomyGuardrails(career);
assert.equal(economy.represented, 0);
assert.equal(economy.ok, true);

const readiness = buildProfessionalReadinessReport(career, { saveSchemaVersion: SAVE_SCHEMA_VERSION });
assert.ok(readiness.score >= 80);
assert.equal(readiness.monetization.payToWinProducts, 0);

assert.equal(createCloudSyncAdapter().resolveConflict({ savedAt: "a" }, { savedAt: "b" }).status, "needs-user-choice");
assert.equal(validateRemoteConfig({ adsEnabled: true }).ok, true);
assert.equal(validateRemoteConfig({ unsafeKey: true }).ok, false);

const googlePlan = buildGoogleCloudReadinessPlan({ enabled: true, aiProvider: "gemini" });
assert.equal(googlePlan.backend.runtime, "cloud-run");
assert.equal(googlePlan.cloudSave.silentOverwrite, false);
assert.ok(googlePlan.analytics.allowedEvents.includes("first_client_selected"));
assert.equal(validateGoogleBackendConfig({ enabled: true, backendBaseUrl: "https://api.example.com", analyticsEnabled: false }).ok, true);
assert.equal(validateGoogleBackendConfig({ enabled: true, backendBaseUrl: "http://api.example.com" }).ok, false);
assert.equal(validateGoogleBackendConfig({ enabled: false, apiKeyInClient: true }).ok, false);

const aiPayload = buildAiNarratorProxyPayload({ career, player: career.db.players[0], type: "season_recap" });
assert.equal(aiPayload.outputRules.noOutcomeDecisions, true);
assert.equal(aiPayload.providerHint, "gemini-or-openai-backend");

console.log("platform service tests passed");
