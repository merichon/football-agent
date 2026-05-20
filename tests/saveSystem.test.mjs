import assert from "node:assert/strict";
import { createInitialCareer } from "../src/game/engine.js";
import {
  buildContentPackRefs,
  createSaveEnvelope,
  readCareerSave,
  serializeCareerSave,
  tryReadCareerSave,
  validateCareerSavePayload,
  SAVE_SCHEMA_VERSION
} from "../src/game/saveSystem.js";

const career = createInitialCareer("Save Agent");
const raw = serializeCareerSave(career, {
  settings: { lang: "tr", soundOn: true, ignored: "nope" },
  entitlements: { owned: ["remove_ads", "remove_ads"] },
  contentPacks: buildContentPackRefs(career),
  privacy: { analyticsConsent: false, adConsent: false }
});

const loaded = readCareerSave(raw);
assert.equal(loaded.career.agentName, "Save Agent");
assert.equal(loaded.envelope.schemaVersion, SAVE_SCHEMA_VERSION);
assert.equal(loaded.envelope.settings.ignored, undefined);
assert.deepEqual(loaded.envelope.entitlements.owned, ["remove_ads"]);
assert.equal(validateCareerSavePayload(loaded.envelope).ok, true);

const legacy = readCareerSave(JSON.stringify(career));
assert.equal(legacy.migrated, true);
assert.equal(legacy.warnings.includes("legacy-career-json"), true);
assert.equal(legacy.career.agentName, "Save Agent");

const corrupted = tryReadCareerSave("{bad json");
assert.equal(corrupted.career, null);
assert.ok(corrupted.errors[0].startsWith("save_parse_failed"));

const future = createSaveEnvelope(career);
future.schemaVersion = SAVE_SCHEMA_VERSION + 99;
assert.equal(validateCareerSavePayload(future).ok, false);

console.log("save system tests passed");
