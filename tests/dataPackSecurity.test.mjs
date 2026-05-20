import assert from "node:assert/strict";
import JSZip from "jszip";
import {
  inspectDataPackZip,
  readDataPackFromZip,
  validateDataPackPayload
} from "../src/game/dataPackSecurity.js";

function validPayload() {
  const manifest = {
    name: "Community Test Pack",
    version: "1.0.0",
    license: "CC0-1.0",
    sources: [{ name: "Fixture Lab", license: "CC0-1.0", url: "https://example.test/source" }],
    containsOfficialLogos: false,
    containsRealPlayerPhotos: false
  };
  const database = {
    meta: { id: "community-test", season: 2026, dataSources: manifest.sources },
    countries: [{ id: "xx", name: "Testland" }],
    leagues: [{ id: "xx-3", countryId: "xx", name: "Test Third", tier: 3, reputation: 35 }],
    clubs: [{ id: "iron-town", leagueId: "xx-3", name: "Iron Town", budget: 350000, reputation: 28, need: "ST", relation: 35 }],
    players: [{ id: "p-test", clubId: "iron-town", countryId: "xx", name: "Ada Koral", position: "ST", age: 19, overall: 57, potential: 78, value: 120000, wage: 9000, form: 62 }]
  };
  return { manifest, database };
}

async function zipPayload(payload, extra = {}) {
  const zip = new JSZip();
  zip.file("manifest.json", JSON.stringify(payload.manifest));
  zip.file("database.json", JSON.stringify(payload.database));
  for (const [name, value] of Object.entries(extra)) zip.file(name, value);
  return zip;
}

const payload = validPayload();
assert.equal(validateDataPackPayload(payload.manifest, payload.database).ok, true);

const zip = await zipPayload(payload);
assert.equal(inspectDataPackZip(zip).ok, true);
assert.equal((await readDataPackFromZip(zip)).ok, true);

const unsafeZip = await zipPayload(payload, { "../evil.json": "{}" });
assert.equal(inspectDataPackZip(unsafeZip).ok, false);

const blocked = validPayload();
blocked.manifest.sources = [{ name: "Unknown Set", license: "unknown" }];
assert.equal(validateDataPackPayload(blocked.manifest, blocked.database).ok, false);

const officialAssets = validPayload();
officialAssets.manifest.containsOfficialLogos = true;
assert.equal(validateDataPackPayload(officialAssets.manifest, officialAssets.database).ok, false);

const duplicateClub = validPayload();
duplicateClub.database.clubs.push({ ...duplicateClub.database.clubs[0] });
assert.equal(validateDataPackPayload(duplicateClub.manifest, duplicateClub.database).ok, false);

console.log("data pack security tests passed");
