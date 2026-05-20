import assert from "node:assert/strict";
import {
  buyEmpireUpgrade,
  advanceWeek,
  buildAgencyRankings,
  buildOffer,
  buildPlayerSponsorship,
  buildRepresentationPitch,
  buildAnnualReport,
  buildSeasonAgenda,
  buyLifeActivity,
  createInitialCareer,
  createObjectives,
  generatePlayerName,
  getAgencyCapacity,
  hireStaff,
  holdPlayerTalk,
  negotiate,
  predictFeaturedMatch,
  renewAgencyContract,
  runPlayerCareerPlan,
  resolveEventCard,
  signSponsor,
  signPlayerToAgency,
  signPlayerSponsorship,
  simulateWeekPreview,
  startNextSeason,
  startScout,
  validateDataPackManifest
} from "../src/game/engine.js";
import { FAN_DATA_SOURCE_LEDGER, attachReepIdentitiesToDatabase, buildIdentityIndex, buildStatsBombInsights, parseOpenFootballFixtureJson, parseOpenFootballPlayers, parseReepCsv } from "../src/game/fanData.js";
import { filterRedistributableSources, isRedistributableLicense } from "../src/game/licensePolicy.js";

const career = createInitialCareer("Test Agent");
assert.equal(career.story.chapter, "zero-agency");
assert.equal(career.week, 1);
assert.equal(career.reputation, 18);
assert.equal(career.weeklyFocus, "balanced");
assert.ok(createObjectives().length >= 3);
assert.ok(career.objectives?.length >= 3);
assert.ok(career.achievements?.length >= 6);
assert.ok(buildAgencyRankings(career)[0].score > 0);
assert.ok(buildSeasonAgenda(career).length >= 2);
assert.ok(career.db.players.every((player) => player.name));
assert.ok(career.db.players.every((player) => player.generatedName));
assert.equal(career.db.players.filter((player) => player.represented).length, 0);
assert.equal(generatePlayerName("tr", 42), generatePlayerName("tr", 42));

const parsedFanPlayers = parseOpenFootballPlayers(`
=  Turkey
Emir Daduk,                   G,  1.91 m,  b. 13 Feb 2008 @ Hatay
Ozan Demirbag,                F,  1.78 m,  b. 12 Feb 2008 @ Tokat
`, "tr");
assert.equal(parsedFanPlayers.length, 2);
assert.equal(parsedFanPlayers[0].position, "GK");
assert.equal(parsedFanPlayers[1].position, "ST");
assert.ok(FAN_DATA_SOURCE_LEDGER.every((source) => isRedistributableLicense(source.license)));
const reepPeople = parseReepCsv(`reep_id,type,name,full_name,date_of_birth,nationality,position,key_transfermarkt,key_fbref
reep_p12345678,player,Emir Daduk,Emir Daduk,2008-02-13,Turkey,goalkeeper,111,abc123
`, "people");
const reepTeams = parseReepCsv(`reep_id,name,country,key_transfermarkt,key_clubelo
reep_t12345678,Alpha FC,Testland,222,alpha-fc
`, "teams");
assert.equal(reepPeople[0].providerKeys.transfermarkt, "111");
const identityDb = attachReepIdentitiesToDatabase({
  ...career.db,
  players: [{ ...career.db.players[0], id: "local-player", name: "Emir Daduk", sourceRefs: { providerKeys: { transfermarkt: "111" } } }],
  clubs: [{ ...career.db.clubs[0], id: "local-club", name: "Alpha FC" }]
}, [...reepPeople, ...reepTeams]);
assert.equal(identityDb.players[0].id, "reep_p12345678");
assert.equal(identityDb.clubs[0].id, "reep_t12345678");
const identityIndex = buildIdentityIndex({ players: identityDb.players, clubs: identityDb.clubs });
assert.equal(identityIndex.byProvider["transfermarkt:111"], "reep_p12345678");
const fixturePack = parseOpenFootballFixtureJson({
  name: "Test League 2025/26",
  matches: [
    { round: "Matchday 1", date: "2025-08-15", team1: "Alpha FC", team2: "Beta FC", score: { ft: [2, 1] } },
    { round: "Matchday 2", date: "2025-08-22", team1: "Beta FC", team2: "Alpha FC", score: { ft: [0, 0] } }
  ]
}, { code: "xx.1", countryId: "xx", countryName: "Testland", tier: 1, reputation: 60 });
assert.equal(fixturePack.clubs.length, 2);
assert.equal(fixturePack.fixtures[0].week, 1);
assert.equal(fixturePack.fixtures[0].homeGoals, 2);
assert.equal(fixturePack.league.fixtureSource, "openfootball/football.json");
const statsBombInsights = buildStatsBombInsights([
  { minute: 1, type: { name: "Pass" } },
  { minute: 2, type: { name: "Shot" } },
  { minute: 3, type: { name: "Pressure" } }
]);
assert.ok(statsBombInsights.passShare > 0);
assert.ok(statsBombInsights.templates.length);
assert.equal(isRedistributableLicense("CC0-1.0"), true);
assert.equal(isRedistributableLicense("CC-BY-4.0"), true);
assert.equal(isRedistributableLicense("ODbL-1.0"), true);
assert.equal(isRedistributableLicense("PDDL"), true);
assert.equal(isRedistributableLicense("unknown"), false);
assert.equal(isRedistributableLicense("other"), false);
assert.equal(isRedistributableLicense("copyright-authors"), false);
assert.deepEqual(
  filterRedistributableSources([{ license: "CC0-1.0" }, { license: "other" }, { licenses: [{ name: "CC-BY-3.0" }] }]).map((item) => item.license || item.licenses[0].name),
  ["CC0-1.0", "CC-BY-3.0"]
);

const representedCareer = {
  ...career,
  reputation: 42,
  db: {
    ...career.db,
    players: career.db.players.map((player) => player.id === "p1"
      ? { ...player, represented: true, agencyTrust: 62, agencySignedWeek: career.week, agencyContractUntil: career.week + 52, agencyCommissionRate: 5 }
      : player)
  }
};

const scouted = startScout(career, "tr").career;
assert.equal(scouted.scoutJobs.length, 1);
assert.ok(scouted.money < career.money);
assert.ok(buildSeasonAgenda(scouted).some((item) => item.type === "scout"));

const lived = buyLifeActivity(career, "pr").career;
assert.ok(lived.reputation > career.reputation);

const upgraded = buyEmpireUpgrade(career, "media-office").career;
assert.ok(upgraded.empire.upgrades.includes("media-office"));

const staffed = hireStaff(career, "lawyer").career;
assert.ok(staffed.empire.staff.includes("lawyer"));

const sponsored = signSponsor({ ...career, reputation: 65 }, "airline").career;
assert.ok(sponsored.empire.sponsors.includes("airline"));

const predicted = predictFeaturedMatch(career, "home").career;
assert.equal(predicted.empire.predictions.total, 1);

const offer = buildOffer(career, "p1", career.db.clubs[0].id);
assert.ok(offer.chance > 0);
assert.ok(offer.commission > 0);
assert.ok(offer.signingBonus >= 0);
assert.ok(offer.contractYears >= 1);
const lowTrustCareer = {
  ...representedCareer,
  db: { ...representedCareer.db, players: representedCareer.db.players.map((player) => player.id === "p1" ? { ...player, agencyTrust: 20 } : player) }
};
const highTrustCareer = {
  ...representedCareer,
  db: { ...representedCareer.db, players: representedCareer.db.players.map((player) => player.id === "p1" ? { ...player, agencyTrust: 88 } : player) }
};
assert.ok(buildOffer(highTrustCareer, "p1", career.db.clubs[0].id).chance > buildOffer(lowTrustCareer, "p1", career.db.clubs[0].id).chance);

const negotiated = negotiate(career, offer, "soft");
assert.ok(typeof negotiated.ok === "boolean");

const playerSponsor = buildPlayerSponsorship(representedCareer, "p1");
assert.ok(playerSponsor.advance > 0);
const sponsoredPlayer = signPlayerSponsorship(representedCareer, "p1");
assert.ok(typeof sponsoredPlayer.ok === "boolean");
assert.ok(sponsoredPlayer.career.money >= representedCareer.money || sponsoredPlayer.ok === false);

const talkedCareer = holdPlayerTalk(representedCareer, "p1");
assert.equal(talkedCareer.ok, true);
assert.ok(talkedCareer.career.money < representedCareer.money);
assert.ok(talkedCareer.career.db.players.find((player) => player.id === "p1").agencyTrust >= 0);

const plannedCareer = runPlayerCareerPlan(representedCareer, "p1", "showcase");
assert.equal(plannedCareer.ok, true);
assert.ok(plannedCareer.career.money < representedCareer.money);
assert.ok(plannedCareer.career.db.players.find((player) => player.id === "p1").marketHeat > 0);
assert.ok(plannedCareer.career.db.players.find((player) => player.id === "p1").agentBrain?.lastLesson);
const storyProgressWeek = advanceWeek(plannedCareer.career, simulateWeekPreview(plannedCareer.career));
assert.notEqual(storyProgressWeek.story.chapter, "first-client");
assert.ok(storyProgressWeek.story.log.length >= representedCareer.story.log.length);

const renewedManual = renewAgencyContract({
  ...representedCareer,
  db: { ...representedCareer.db, players: representedCareer.db.players.map((player) => player.id === "p1" ? { ...player, agencyContractUntil: career.week + 3, agencyTrust: 35 } : player) }
}, "p1");
assert.equal(renewedManual.ok, true);
assert.ok(renewedManual.career.db.players.find((player) => player.id === "p1").agencyContractUntil > career.week + 20);

const repPitch = buildRepresentationPitch(career, "p3");
assert.ok(repPitch.chance > 0);
assert.equal(repPitch.eligible, true);
assert.ok(repPitch.signingFee > 0);
assert.ok(repPitch.approachCost > 0);
assert.ok(getAgencyCapacity(career) >= 2);
const signedAttempt = signPlayerToAgency(career, "p3");
assert.ok(typeof signedAttempt.ok === "boolean");
assert.ok(signedAttempt.career.money < career.money);
if (signedAttempt.ok) {
  const signedPlayer = signedAttempt.career.db.players.find((player) => player.id === "p3");
  assert.ok(signedPlayer.agencyContractUntil > signedAttempt.career.week);
assert.ok(signedPlayer.agencyTrust > 0);
assert.equal(signedAttempt.career.story.chapter, "first-client");
}

const cappedCareer = {
  ...career,
  db: {
    ...career.db,
    players: career.db.players.map((player, index) => index < getAgencyCapacity(career) ? { ...player, represented: true } : player)
  }
};
const lockedPitch = buildRepresentationPitch(cappedCareer, cappedCareer.db.players.find((player) => !player.represented).id);
assert.equal(lockedPitch.eligible, false);

const preview = simulateWeekPreview(career);
assert.equal(preview.week, 2);
assert.ok(preview.events.length >= 3);
assert.ok(preview.featured.homeName);
assert.ok(preview.featured.homeXg >= 0);
assert.ok(preview.featured.awayXg >= 0);
assert.ok(preview.featured.homeShots >= 2);
assert.ok(preview.featured.awayShots >= 2);
assert.ok(preview.featured.tacticalNote.length > 10);
assert.ok(preview.featured.model2d.homePlayers.length >= 10);
assert.ok(preview.featured.events.some((event) => Array.isArray(event.path) && event.path.length >= 2));
assert.ok(preview.featured.events.some((event) => event.agentDecision?.model === "local-agent"));
assert.ok(preview.featured.events.some((event) => event.agentDecision?.version === "grf-agentpitch-lite-v3"));
assert.ok(preview.featured.events.some((event) => event.agentDecision?.brainStyle));
assert.ok(preview.featured.events.some((event) => event.agentDecision?.actionTick?.stepMs === 100));
assert.ok(preview.featured.events.some((event) => Array.isArray(event.tickFrames) && event.tickFrames.length >= 4));
assert.ok(preview.featured.events.some((event) => event.actionType));
const fixtureCareer = createInitialCareer("Fixture Agent", {
  ...career.db,
  countries: [{ id: "xx", name: "Testland" }],
  leagues: [fixturePack.league],
  clubs: fixturePack.clubs,
  players: career.db.players.slice(0, 4).map((player, index) => ({ ...player, clubId: fixturePack.clubs[index % 2].id })),
  fixtures: fixturePack.fixtures
});
const fixturePreview = simulateWeekPreview({ ...fixtureCareer, selectedLeagueId: fixturePack.league.id });
assert.equal(fixturePreview.featured.sourceFixture.source, "openfootball/football.json");
assert.ok(fixturePreview.featured.sourceFixture.historicalScore);

const next = advanceWeek({ ...scouted, standings: scouted.standings.slice(0, 4) });
assert.equal(next.week, 2);
assert.ok(next.standings[0].points >= next.standings.at(-1).points);
assert.ok(Array.isArray(next.rivalPressure));
assert.ok(buildAgencyRankings(next).length >= 2);
const advancedPlayer = next.db.players.find((player) => player.id === "p1");
assert.ok(advancedPlayer.careerGoal?.label);
assert.ok(advancedPlayer.goalProgress >= 0);
assert.ok(advancedPlayer.seasonStats);
assert.ok(advancedPlayer.seasonStats.played >= 0);
assert.ok(advancedPlayer.agentBrain?.style);
assert.ok(typeof advancedPlayer.seasonStats.agentActions === "number");
assert.ok(advancedPlayer.seasonStats.grfActionMix && typeof advancedPlayer.seasonStats.grfActionMix === "object");
assert.ok(typeof advancedPlayer.impactScore === "number");
assert.ok(typeof advancedPlayer.scoutAIScore === "number");

const scoutDoneWeek = advanceWeek(next);
assert.ok(scoutDoneWeek.db.players.some((player) => player.scouted && player.scoutConfidence));

const prWeek = advanceWeek({ ...career, weeklyFocus: "pr" });
assert.ok(prWeek.reputation >= career.reputation);
assert.ok(prWeek.mediaPower >= career.mediaPower);

const objectiveWeek = advanceWeek({ ...career, reputation: 56 });
const repObjective = objectiveWeek.objectives.find((item) => item.id === "rep-55");
assert.equal(repObjective.completed, true);
assert.ok(objectiveWeek.news.some((line) => String(line).includes("Hedef tamamlandı")));

const repAchievement = objectiveWeek.achievements.find((item) => item.id === "rep-40");
assert.equal(repAchievement.completed, true);

const guaranteedCardWeek = advanceWeek({ ...career, pendingCards: [] });
assert.ok(guaranteedCardWeek.pendingCards.length >= 1);

const contractRiskCareer = {
  ...representedCareer,
  pendingCards: [],
  db: {
    ...representedCareer.db,
    players: representedCareer.db.players.map((player) => player.id === "p1" ? { ...player, agencyContractUntil: career.week + 1, agencyTrust: 24 } : player)
  }
};
const contractWeek = advanceWeek(contractRiskCareer);
const contractCard = contractWeek.pendingCards.find((card) => card.templateId === "contract-renewal");
assert.ok(contractCard);
const renewed = resolveEventCard(contractWeek, contractCard.id, "accept");
assert.ok(renewed.db.players.find((player) => player.id === "p1").agencyContractUntil > contractWeek.week + 10);

const milestoneCareer = {
  ...representedCareer,
  pendingCards: [],
  db: {
    ...representedCareer.db,
    players: representedCareer.db.players.map((player) => player.id === "p1" ? { ...player, goalProgress: 96, form: 90, agencyTrust: 80 } : player)
  }
};
const milestoneWeek = advanceWeek(milestoneCareer);
const milestoneCard = milestoneWeek.pendingCards.find((card) => card.templateId === "goal-breakthrough");
assert.ok(milestoneCard);
const milestoneResolved = resolveEventCard(milestoneWeek, milestoneCard.id, "accept");
assert.ok(milestoneResolved.db.players.find((player) => player.id === "p1").value >= milestoneWeek.db.players.find((player) => player.id === "p1").value);

assert.equal(
  validateDataPackManifest({ name: "Pack", version: "1" }, career.db).ok,
  true
);
assert.equal(validateDataPackManifest({}, {}).ok, false);
assert.equal(
  validateDataPackManifest({ name: "Bad", version: "1", sources: [{ name: "Nope", license: "unknown" }] }, career.db).ok,
  false
);

const report = buildAnnualReport({ ...representedCareer, week: 53 });
assert.equal(report.represented, 1);
const nextSeason = startNextSeason({ ...representedCareer, annualReport: report, week: 53 });
assert.equal(nextSeason.week, 1);
assert.equal(nextSeason.annualReport, null);

console.log("engine tests passed");
