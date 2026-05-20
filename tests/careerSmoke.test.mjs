import assert from "node:assert/strict";
import {
  advanceWeek,
  buildAgencyRankings,
  createInitialCareer,
  getRepresentedPlayers,
  resolveEventCard,
  simulateWeekPreview
} from "../src/game/engine.js";
import { buildProfessionalReadinessReport } from "../src/game/platformServices.js";
import { serializeCareerSave, tryReadCareerSave, SAVE_SCHEMA_VERSION } from "../src/game/saveSystem.js";

function signFirstClient(career) {
  const first = career.db.players
    .filter((player) => !player.represented)
    .sort((a, b) => (b.scoutAIScore || b.potential || 0) - (a.scoutAIScore || a.potential || 0))[0];
  return {
    ...career,
    setupComplete: true,
    selectedLeagueId: career.db.clubs.find((club) => club.id === first.clubId)?.leagueId || career.db.leagues[0].id,
    db: {
      ...career.db,
      players: career.db.players.map((player) => player.id === first.id ? {
        ...player,
        represented: true,
        scouted: true,
        agencyCommissionRate: 3,
        agencySignedWeek: career.week,
        agencyContractUntil: career.week + 52,
        agencyTrust: 62
      } : player)
    },
    knownPlayerIds: [first.id]
  };
}

function assertCareerHealthy(career) {
  assert.ok(Number.isFinite(career.money));
  assert.ok(Number.isFinite(career.reputation));
  assert.ok(career.reputation >= 0 && career.reputation <= 100);
  assert.ok(career.week >= 1 && career.week <= 53);
  assert.ok((career.pendingCards || []).length <= 7);
  assert.ok(getRepresentedPlayers(career).length >= 1);
  assert.ok(buildAgencyRankings(career).length >= 2);
  assert.ok(buildProfessionalReadinessReport(career, { saveSchemaVersion: SAVE_SCHEMA_VERSION }).score >= 70);
}

let career = signFirstClient(createInitialCareer("Smoke Agent"));

for (let i = 0; i < 20; i += 1) {
  if ((career.pendingCards || []).length) {
    const card = career.pendingCards[0];
    const decision = card.accept?.money && career.money + card.accept.money < 0 ? "decline" : "accept";
    career = resolveEventCard(career, card.id, decision);
  }
  const preview = simulateWeekPreview(career);
  assert.ok(preview.events.length >= 1);
  career = advanceWeek(career, preview);
  assertCareerHealthy(career);
}

const raw = serializeCareerSave(career);
const restored = tryReadCareerSave(raw);
assert.equal(restored.career.week, career.week);
assert.equal(restored.errors, undefined);

console.log("career smoke tests passed");
