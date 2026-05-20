import assert from "node:assert/strict";
import {
  AD_PLACEMENTS,
  buildProfessionalReadinessReport,
  canShowAd,
  createCloudSyncAdapter,
  evaluateEconomyGuardrails,
  getEntitlementSnapshot,
  PRODUCT_CATALOG,
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

console.log("platform service tests passed");
