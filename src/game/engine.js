import { demoDb, empireUpgrades, eventDeck, lifeActivities, sponsorDeals, staffCandidates } from "./demoData.js";
import { marketValueFromAI, negotiationAIAdvice, playerImpactScore, scoutAIScore } from "./aiModels.js";
import { isRedistributableLicense } from "./licensePolicy.js";
import { enhanceFixture2D } from "./match2d.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const roundMoney = (value) => Math.round(value / 1000) * 1000;
const seeded = (seed) => {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
};

const nameParts = {
  tr: {
    first: [["ar", "da"], ["em", "re"], ["ka", "an"], ["de", "niz"], ["u", "mut"], ["ba", "ran"], ["ke", "rem"], ["ça", "ğrı"], ["ö", "mer"], ["ya", "ğız"]],
    last: [["ko", "ral"], ["ay", "dın"], ["şa", "hin"], ["tu", "ran"], ["po", "lat"], ["de", "mir"], ["ak", "soy"], ["var", "ol"], ["gü", "neş"], ["öz", "türk"]]
  },
  en: {
    first: [["li", "am"], ["no", "ah"], ["jo", "el"], ["e", "than"], ["ow", "en"], ["har", "ry"], ["cal", "lum"], ["ja", "mie"]],
    last: [["war", "ren"], ["bell"], ["sto", "ne"], ["gray"], ["par", "ker"], ["brooks"], ["tur", "ner"], ["cole"]]
  },
  es: {
    first: [["ni", "co"], ["ma", "teo"], ["to", "mas"], ["lu", "ca"], ["i", "ker"], ["mar", "co"], ["da", "rio"], ["sa", "ul"]],
    last: [["sa", "las"], ["ve", "ga"], ["li", "ra"], ["cos", "ta"], ["mo", "ra"], ["sol", "er"], ["ru", "iz"], ["na", "vas"]]
  }
};

function titleName(parts) {
  return parts.join("").replace(/^./, (char) => char.toUpperCase());
}

export function generatePlayerName(countryId = "tr", seed = 1) {
  const pool = nameParts[countryId] || nameParts.tr;
  const first = pool.first[Math.floor(seeded(seed + 11) * pool.first.length)] || pool.first[0];
  const last = pool.last[Math.floor(seeded(seed + 37) * pool.last.length)] || pool.last[0];
  return `${titleName(first)} ${titleName(last)}`;
}

export function hydrateGeneratedNames(db, seed = 1, force = false) {
  return {
    ...db,
    players: (db.players || []).map((player, index) => {
      if (!force && player.name) return player;
      return {
        ...player,
        name: generatePlayerName(player.countryId, seed + index * 17 + String(player.id || index).length),
        generatedName: true
      };
    })
  };
}

function personalityProfile(type = "professional") {
  const profiles = {
    loyal: { label: "Sadık", negotiation: 5, wageDemand: -0.03, commissionTaste: -0.004, playerTrust: 10 },
    money: { label: "Para Odaklı", negotiation: -4, wageDemand: 0.08, commissionTaste: 0.006, playerTrust: -3 },
    ambitious: { label: "Hırslı", negotiation: 1, wageDemand: 0.03, commissionTaste: 0.002, playerTrust: 2 },
    media: { label: "Medyatik", negotiation: -2, wageDemand: 0.05, commissionTaste: 0.004, playerTrust: -1 },
    troubled: { label: "Sorunlu", negotiation: -8, wageDemand: 0.02, commissionTaste: 0.006, playerTrust: -8 },
    professional: { label: "Profesyonel", negotiation: 3, wageDemand: 0, commissionTaste: 0, playerTrust: 5 }
  };
  return profiles[type] || profiles.professional;
}

function normalizePlayer(player, seed = 1) {
  if (!player) return player;
  const base = player.overall || 60;
  const potential = player.potential || base + 8;
  const goal = player.careerGoal || inferCareerGoal(player);
  return {
    personality: "professional",
    hiddenPotential: potential,
    ego: 45 + Math.round(seeded(seed + base) * 30),
    loyalty: 45 + Math.round(seeded(seed + base + 8) * 35),
    happiness: player.morale ?? 60,
    injuryRisk: 12 + Math.round(seeded(seed + base + 18) * 18),
    growthRate: 45 + Math.round(seeded(seed + potential + 25) * 35),
    story: "Kariyeri henüz netleşmemiş oyuncu.",
    careerGoal: goal,
    goalProgress: player.goalProgress ?? goal.start,
    impactScore: player.impactScore ?? 45,
    scoutAIScore: player.scoutAIScore ?? 40,
    aiTags: player.aiTags || [],
    agentBrain: player.agentBrain || buildAgentBrain(player, seed),
    ...player
  };
}

function inferCareerGoal(player) {
  if (player.age <= 20 && player.potential >= 84) return { id: "breakout", label: "Patlama sezonu", target: 100, start: 34 };
  if ((player.ego || 50) >= 68 || player.personality === "money") return { id: "big_contract", label: "Büyük kontrat", target: 100, start: 42 };
  if ((player.injuryRisk || 15) >= 24) return { id: "stability", label: "İstikrar kazan", target: 100, start: 46 };
  if (player.personality === "media") return { id: "brand", label: "Marka olmak", target: 100, start: 44 };
  return { id: "develop", label: "Gelişimi sürdür", target: 100, start: 40 };
}

function buildAgentBrain(player = {}, seed = 1) {
  const position = player.position || "CM";
  const personality = player.personality || "professional";
  const style = position === "ST"
    ? "finisher"
    : ["AM", "CM", "LW", "RW"].includes(position)
      ? "creator"
      : ["CB", "DM", "GK"].includes(position)
        ? "secure"
        : "runner";
  const personalityAggression = personality === "ambitious" ? 9 : personality === "troubled" ? 12 : personality === "loyal" ? -4 : 0;
  const creativityBoost = ["AM", "CM", "LW", "RW"].includes(position) ? 14 : position === "ST" ? 6 : -2;
  const disciplineBoost = personality === "professional" ? 12 : personality === "loyal" ? 8 : personality === "troubled" ? -10 : 0;
  return {
    style,
    aggression: clamp(42 + Math.round(seeded(seed + 13) * 26) + personalityAggression + (position === "ST" ? 7 : 0), 10, 95),
    creativity: clamp(38 + Math.round(seeded(seed + 23) * 30) + creativityBoost, 10, 96),
    discipline: clamp(44 + Math.round(seeded(seed + 31) * 28) + disciplineBoost, 8, 98),
    learning: clamp(34 + Math.round((player.growthRate || 48) / 2) + Math.round(seeded(seed + 41) * 12), 10, 99),
    preferredActions: preferredActionsFor(style, position),
    evolved: 0,
    lastLesson: "Yeni profil"
  };
}

function preferredActionsFor(style, position) {
  if (style === "finisher") return ["finish", "shot", "cutback_finish", "header"];
  if (style === "creator") return ["through_ball", "key_pass", "short_pass", "switch", "carry"];
  if (style === "secure") return position === "GK" ? ["long_ball", "short_pass", "interception"] : ["interception", "tackle", "long_ball", "press"];
  return ["carry", "overlap", "cross", "press"];
}

function normalizeClub(club) {
  if (!club) return club;
  return {
    negotiationHardness: 55,
    transferPolicy: "balanced",
    ...club
  };
}

export function formatMoney(value) {
  const abs = Math.abs(value);
  if (abs >= 1000000) return `€${(value / 1000000).toFixed(abs >= 10000000 ? 0 : 1)}M`;
  if (abs >= 1000) return `€${Math.round(value / 1000)}K`;
  return `€${value}`;
}

export function createInitialCareer(agentName = "Kasey Sung", db = demoDb, lang = "tr") {
  const seed = Date.now();
  const preparedDb = hydrateGeneratedNames(db, seed, db.meta?.id === "fictional-core" || db.meta?.generateNames);
  const cleanPlayers = preparedDb.players.map((player) => ({
    ...player,
    represented: false,
    agencyCommissionRate: undefined,
    agencySignedWeek: undefined,
    agencyContractUntil: undefined,
    agencyTrust: undefined
  }));
  return {
    id: `career-${seed}`,
    nameSeed: seed,
    agentName,
    lang,
    db: { ...preparedDb, players: cleanPlayers },
    week: 1,
    season: preparedDb.meta.season,
    seasonStartMonth: "Haziran",
    seasonMonth: "Haziran",
    seasonYear: preparedDb.meta.season,
    annualReport: null,
    money: 325000,
    reputation: 18,
    negotiation: 0,
    scoutBoost: 0,
    relationBoost: 0,
    mediaPower: 0,
    ethics: 72,
    weeklyFocus: "balanced",
    transferSeason: true,
    objectives: createObjectives(),
    achievements: createAchievements(),
    stats: { cardsResolved: 0, dealsAccepted: 0 },
    pendingCards: [],
    incomingOffers: [],
    marketIntel: ["Küçük kulüpler uygun maliyetli genç forvetleri izliyor."],
    story: initialCareerStory(agentName),
    empire: {
      level: "Agent",
      upgrades: [],
      staff: [],
      sponsors: [],
      predictions: { correct: 0, total: 0, streak: 0 }
    },
    rivals: [
      { id: "rival-prime", name: "Prime Eleven", reputation: 48, aggression: 68, focus: "stars" },
      { id: "rival-nova", name: "Nova Talent", reputation: 36, aggression: 52, focus: "youth" }
    ],
    rivalPressure: [],
    scoutJobs: [],
    news: ["news_start"],
    standings: buildStandings({ ...preparedDb, players: cleanPlayers }),
    lastOffer: null
  };
}

function initialCareerStory(agentName = "Ajans") {
  return {
    chapter: "zero-agency",
    title: "Kiralık ofis, tek telefon",
    beat: `${agentName} piyasaya yeni girdi. Büyük oyuncular telefonu açmaz; ilk hedef alt ligde bir yeteneği ikna etmek.`,
    objective: "Yetenekler ekranından ilk oyuncuyla temsil sözleşmesi imzala.",
    tension: 18,
    log: [
      {
        week: 1,
        title: "Kapılar kapalı",
        body: "Ajansın henüz vitrini yok. Scout raporu ve doğru yaklaşım ilk kapıyı açar."
      }
    ]
  };
}

const objectiveTemplates = [
  {
    id: "portfolio-3",
    title: "3 oyuncu temsil et",
    description: "Ajans vitrinin dolmaya başlasın.",
    metric: "represented",
    target: 3,
    reward: { money: 75000, reputation: 2 }
  },
  {
    id: "rep-55",
    title: "Saygınlığı 55 yap",
    description: "Kulüp masalarında adın duyulsun.",
    metric: "reputation",
    target: 55,
    reward: { money: 50000, negotiation: 1 }
  },
  {
    id: "portfolio-value-5m",
    title: "Portföy değeri 5M",
    description: "Ucuz yetenekleri parlayan varlığa çevir.",
    metric: "portfolioValue",
    target: 5000000,
    reward: { money: 120000, reputation: 2 }
  },
  {
    id: "first-sponsor",
    title: "İlk sponsor anlaşması",
    description: "Ajansı sadece transferden kazanan yer olmaktan çıkar.",
    metric: "sponsors",
    target: 1,
    reward: { money: 90000, mediaPower: 2 }
  },
  {
    id: "hire-staff",
    title: "İlk uzmanı işe al",
    description: "Tek kişilik ajans olmaktan çık.",
    metric: "staff",
    target: 1,
    reward: { reputation: 1, scoutBoost: 1 }
  }
];

const achievementTemplates = [
  {
    id: "first-signature",
    title: "İlk İmza",
    description: "İlk futbolcuyu ajansa kat.",
    metric: "represented",
    target: 1,
    reward: { money: 30000, reputation: 1 }
  },
  {
    id: "first-card",
    title: "Masaya Oturdun",
    description: "İlk etkinlik kartını çöz.",
    metric: "cardsResolved",
    target: 1,
    reward: { reputation: 1, mediaPower: 1 }
  },
  {
    id: "portfolio-builder",
    title: "Küçük Portföy",
    description: "3 oyunculuk ajans vitrini kur.",
    metric: "represented",
    target: 3,
    reward: { money: 85000, reputation: 2 }
  },
  {
    id: "first-deal",
    title: "İlk Büyük Komisyon",
    description: "İlk transfer pazarlığını başarıyla bitir.",
    metric: "dealsAccepted",
    target: 1,
    reward: { money: 100000, negotiation: 1 }
  },
  {
    id: "rep-40",
    title: "Piyasada Adın Var",
    description: "Saygınlığı 40 seviyesine çıkar.",
    metric: "reputation",
    target: 40,
    reward: { scoutBoost: 2, mediaPower: 1 }
  },
  {
    id: "client-goals-5",
    title: "Saha Konuşuyor",
    description: "Temsil ettiğin oyuncularla toplam 5 gol bul.",
    metric: "totalGoals",
    target: 5,
    reward: { reputation: 2, mediaPower: 2 }
  },
  {
    id: "sponsor-table",
    title: "Marka Masası",
    description: "İlk sponsor anlaşmasını imzala.",
    metric: "sponsors",
    target: 1,
    reward: { money: 70000, reputation: 1 }
  },
  {
    id: "portfolio-value-10m",
    title: "Değer Üreten Ajans",
    description: "Portföy değerini 10M seviyesine taşı.",
    metric: "portfolioValue",
    target: 10000000,
    reward: { money: 180000, reputation: 3 }
  }
];

export function createObjectives() {
  return objectiveTemplates.map((template) => ({
    ...template,
    progress: 0,
    completed: false
  }));
}

export function createAchievements() {
  return achievementTemplates.map((template) => ({
    ...template,
    progress: 0,
    completed: false
  }));
}

export function buildStandings(db) {
  return db.clubs.map((club, index) => ({
    clubId: club.id,
    played: 0,
    win: 0,
    draw: 0,
    loss: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0
  }));
}

export function buildSeasonAgenda(career) {
  const week = career.week || 1;
  const month = seasonMonthFromWeek(week);
  const transferOpen = isTransferWindowWeek(week);
  const weeksToWindowChange = weeksUntilTransferChange(week);
  const scoutDue = (career.scoutJobs || [])
    .map((job) => ({ label: `${job.countryId.toUpperCase()} scout raporu`, dueWeek: job.dueWeek, type: "scout" }))
    .filter((item) => item.dueWeek >= week)
    .sort((a, b) => a.dueWeek - b.dueWeek)[0];
  const contractRisk = getRepresentedPlayers(career)
    .map((player) => ({
      label: `${player.name} temsil sözleşmesi`,
      dueWeek: player.agencyContractUntil || week + 52,
      type: "contract"
    }))
    .filter((item) => item.dueWeek - week <= 10)
    .sort((a, b) => a.dueWeek - b.dueWeek)[0];
  const cardsDue = (career.pendingCards || [])
    .map((card) => ({ label: card.titleKey || "Ajans karti", dueWeek: card.expiresWeek || week + 2, type: "card" }))
    .filter((item) => item.dueWeek >= week)
    .sort((a, b) => a.dueWeek - b.dueWeek)[0];
  const rhythm = [
    {
      label: transferOpen ? "Transfer dönemi açık" : "Transfer dönemi kapalı",
      dueWeek: week + weeksToWindowChange,
      type: transferOpen ? "market-open" : "market-closed"
    },
    scoutDue,
    contractRisk,
    cardsDue,
    {
      label: week % 4 === 0 ? "Medya haftası yaklaşıyor" : "Lig vitrin haftası",
      dueWeek: week + (4 - (week % 4 || 4)),
      type: "media"
    }
  ].filter(Boolean);
  return rhythm
    .sort((a, b) => a.dueWeek - b.dueWeek)
    .slice(0, 4)
    .map((item) => ({
      ...item,
      weeksLeft: Math.max(0, item.dueWeek - week)
    }));
}

export function seasonMonthFromWeek(week = 1) {
  const months = ["Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs"];
  return months[Math.min(months.length - 1, Math.floor((Math.max(1, week) - 1) / 4))];
}

function isTransferWindowWeek(week = 1) {
  return week <= 9 || (week >= 29 && week <= 32);
}

function weeksUntilTransferChange(week = 1) {
  if (week <= 9) return 10 - week;
  if (week < 29) return 29 - week;
  if (week <= 32) return 33 - week;
  return 53 - week + 1;
}

export function getRepresentedPlayers(career) {
  return career.db.players.filter((player) => player.represented);
}

export function getAgencyCapacity(career) {
  const officeBonus = (career.empire?.upgrades || []).includes("office-network") ? 2 : 0;
  const staffBonus = Math.floor((career.empire?.staff?.length || 0) / 2);
  return clamp(2 + Math.floor((career.reputation || 0) / 18) + officeBonus + staffBonus, 2, 18);
}

function representationGate(career, player) {
  const representedCount = getRepresentedPlayers(career).length;
  const capacity = getAgencyCapacity(career);
  if (representedCount >= capacity) {
    return { eligible: false, reason: `Kapasite dolu (${representedCount}/${capacity})` };
  }

  const reputation = career.reputation || 0;
  const knownPlayerIds = career.knownPlayerIds || [];
  const strictStarterMarket = knownPlayerIds.length > 0 && reputation < 30 && representedCount < 3;
  const value = player.value || 0;
  const overall = player.overall || 55;
  const potential = player.potential || overall + 8;
  const scouted = player.scouted || player.scoutConfidence;
  const maxValue = 350000 + reputation * 42000 + (career.scoutBoost || 0) * 9000;
  const maxOverall = 58 + Math.floor(reputation / 4) + Math.floor((career.scoutBoost || 0) / 10);
  const maxPotential = 84 + Math.floor(reputation / 4) + Math.floor((career.scoutBoost || 0) / 12);
  const club = career.db.clubs.find((item) => item.id === player.clubId);

  if (strictStarterMarket && !knownPlayerIds.includes(player.id) && !player.discoveredByScout) {
    return { eligible: false, reason: "Henüz radarında değil" };
  }
  if (!scouted && reputation < 35) {
    return { eligible: false, reason: "Scout raporu lazım" };
  }
  if (career.selectedLeagueId && club?.leagueId !== career.selectedLeagueId && reputation < 28) {
    return { eligible: false, reason: "Yerel pazar dışında" };
  }
  if (value > maxValue || overall > maxOverall || potential > maxPotential) {
    return { eligible: false, reason: "Daha büyük ajans bekliyor" };
  }
  return { eligible: true, reason: null };
}

export function startScout(career, countryId) {
  const cost = 35000;
  if (career.money < cost) return { career, ok: false };
  const country = career.db.countries.find((item) => item.id === countryId) || career.db.countries[0];
  const job = {
    id: `scout-${career.week}-${country.id}`,
    countryId: country.id,
    dueWeek: career.week + 2,
    quality: clamp(54 + Math.round(career.reputation / 3) + career.scoutBoost, 55, 95)
  };
  return {
    career: applyAchievementProgress({
      ...career,
      money: career.money - cost,
      scoutJobs: [...career.scoutJobs, job],
      news: ["news_scout_sent", ...career.news]
    }),
    ok: true
  };
}

export function buyLifeActivity(career, activityId) {
  const activity = lifeActivities.find((item) => item.id === activityId);
  if (!activity || career.money < activity.cost) return { career, ok: false };
  return {
    career: applyAchievementProgress({
      ...career,
      money: career.money - activity.cost,
      reputation: clamp(career.reputation + (activity.reputation || 0), 0, 100),
      negotiation: career.negotiation + (activity.negotiation || 0),
      scoutBoost: career.scoutBoost + (activity.scoutBoost || 0),
      relationBoost: career.relationBoost + (activity.relation || 0),
      db: {
        ...career.db,
        players: career.db.players.map((player) =>
          player.represented ? { ...player, morale: clamp(player.morale + (activity.morale || 0), 0, 100) } : player
        )
      },
      news: ["news_life", ...career.news]
    }),
    ok: true
  };
}

export function buyEmpireUpgrade(career, upgradeId) {
  const upgrade = empireUpgrades.find((item) => item.id === upgradeId);
  if (!upgrade || career.money < upgrade.cost || career.empire?.upgrades?.includes(upgradeId)) return { career, ok: false };
  return {
    career: refreshEmpireLevel({
      ...career,
      money: career.money - upgrade.cost,
      reputation: clamp(career.reputation + (upgrade.reputation || 0), 0, 100),
      scoutBoost: career.scoutBoost + (upgrade.scoutBoost || 0),
      relationBoost: career.relationBoost + (upgrade.relation || 0),
      empire: {
        ...career.empire,
        upgrades: [...(career.empire?.upgrades || []), upgradeId]
      },
      news: [`${upgrade.title} satin alindi.`, ...career.news]
    }),
    ok: true
  };
}

export function hireStaff(career, staffId) {
  const staff = staffCandidates.find((item) => item.id === staffId);
  if (!staff || career.money < staff.cost || career.empire?.staff?.includes(staffId)) return { career, ok: false };
  return {
    career: refreshEmpireLevel({
      ...career,
      money: career.money - staff.cost,
      reputation: clamp(career.reputation + (staff.reputation || 0), 0, 100),
      scoutBoost: career.scoutBoost + (staff.scoutBoost || 0),
      negotiation: career.negotiation + (staff.negotiation || 0),
      empire: {
        ...career.empire,
        staff: [...(career.empire?.staff || []), staffId]
      },
      news: [`${staff.name} ekibe katildi.`, ...career.news]
    }),
    ok: true
  };
}

export function signSponsor(career, sponsorId) {
  const sponsor = sponsorDeals.find((item) => item.id === sponsorId);
  if (!sponsor || career.money < 0 || career.reputation < sponsor.minReputation || career.empire?.sponsors?.includes(sponsorId)) return { career, ok: false };
  return {
    career: refreshEmpireLevel({
      ...career,
      money: career.money + sponsor.advance,
      reputation: clamp(career.reputation + 2, 0, 100),
      empire: {
        ...career.empire,
        sponsors: [...(career.empire?.sponsors || []), sponsorId]
      },
      news: [`${sponsor.name} sponsorluk anlasmasi imzalandi.`, ...career.news]
    }),
    ok: true
  };
}

export function predictFeaturedMatch(career, pick = "home") {
  const preview = simulateWeekPreview(career);
  const fixture = preview.featured;
  if (!fixture) return { career, ok: false };
  const homeWin = fixture.homeGoals > fixture.awayGoals;
  const awayWin = fixture.awayGoals > fixture.homeGoals;
  const correct = (pick === "home" && homeWin) || (pick === "away" && awayWin) || (pick === "draw" && !homeWin && !awayWin);
  const reward = correct ? 45000 + career.reputation * 1200 : -25000;
  const predictions = career.empire?.predictions || { correct: 0, total: 0, streak: 0 };
  return {
    career: {
      ...career,
      money: career.money + reward,
      reputation: clamp(career.reputation + (correct ? 2 : -1), 0, 100),
      empire: {
        ...career.empire,
        predictions: {
          correct: predictions.correct + (correct ? 1 : 0),
          total: predictions.total + 1,
          streak: correct ? predictions.streak + 1 : 0
        }
      },
      news: [correct ? "Maç tahmini tuttu, kasaya ödül girdi." : "Maç tahmini tutmadı, prestij biraz düştü.", ...career.news]
    },
    ok: correct
  };
}

export function buildOffer(career, playerId, clubId) {
  const player = normalizePlayer(career.db.players.find((item) => item.id === playerId), career.week);
  const club = normalizeClub(career.db.clubs.find((item) => item.id === clubId));
  if (!player || !club) return null;
  const needBonus = club.need === player.position ? 12 : 0;
  const relationship = club.relation + career.relationBoost;
  const personality = personalityProfile(player.personality);
  const happinessBonus = Math.round((player.happiness - 55) / 6);
  const trustBonus = player.represented ? Math.round(((player.agencyTrust ?? 52) - 50) / 8) : 0;
  const egoPenalty = Math.round((player.ego - 50) / 7);
  const clubHardnessPenalty = Math.round((club.negotiationHardness - 50) / 4);
  const chance = clamp(
    24 + Math.round(career.reputation * 0.28) + Math.round(relationship * 0.19) + needBonus + career.negotiation + personality.negotiation + happinessBonus + trustBonus - egoPenalty - clubHardnessPenalty,
    5,
    92
  );
  const fee = roundMoney(player.value * (0.82 + chance / 175 + (club.transferPolicy === "star" || club.transferPolicy === "galactic" ? 0.12 : 0)));
  const wage = roundMoney(player.wage * (1.08 + career.reputation / 300 + player.ego / 420 + personality.wageDemand));
  const signingBonus = roundMoney(wage * (player.ego > 65 ? 18 : 10));
  const commission = roundMoney(fee * (0.055 + career.reputation / 2600 + personality.commissionTaste));
  const contractYears = player.age <= 21 ? 5 : 3;
  const bonuses = roundMoney(wage * (club.need === player.position ? 7 : 4));
  const releaseClause = roundMoney(fee * (player.personality === "ambitious" || player.personality === "media" ? 1.65 : 2.2));
  const aiAdvice = negotiationAIAdvice(career, { fee, wage, signingBonus, commission, releaseClause, chance }, player, club);
  return {
    id: `offer-${Date.now()}`,
    playerId,
    clubId,
    fee,
    wage,
    signingBonus,
    commission,
    contractYears,
    bonuses,
    releaseClause,
    ethicsRisk: 0,
    chance,
    aiAdvice,
    playerFit: clamp(50 + player.happiness - player.ego / 3 + personality.playerTrust + trustBonus * 2, 1, 100),
    clubFit: clamp(relationship + needBonus - clubHardnessPenalty, 1, 100)
  };
}

export function buildRepresentationPitch(career, playerId) {
  const player = normalizePlayer(career.db.players.find((item) => item.id === playerId), career.week);
  if (!player || player.represented) return null;
  const gate = representationGate(career, player);
  const personality = personalityProfile(player.personality);
  const rival = (career.rivalPressure || []).find((item) => item.playerId === playerId);
  const rivalPenalty = rival ? Math.round(rival.heat / 7) : 0;
  const trust = (player.loyalty || 55) * 0.22 + (player.happiness || 60) * 0.16 - (player.ego || 50) * 0.12;
  const representedCount = getRepresentedPlayers(career).length;
  const emptyAgencyBonus = representedCount === 0 ? 2 : 0;
  const smallAgencyPenalty = representedCount > 0 ? representedCount * 4 : 0;
  const levelPenalty = player.value > 3000000 && career.reputation < 35 ? 24 : player.value > 1000000 && career.reputation < 25 ? 14 : 0;
  const reputationDrag = career.reputation < 25 ? 6 : career.reputation < 40 ? 3 : 0;
  const chance = gate.eligible
    ? clamp(Math.round(8 + emptyAgencyBonus + career.reputation * 0.24 + career.negotiation * 0.55 + personality.playerTrust + trust - rivalPenalty - levelPenalty - smallAgencyPenalty - reputationDrag), 2, 74)
    : 0;
  const signingFee = roundMoney(Math.max(15000, player.value * (0.012 + player.ego / 9000 + (rival ? 0.01 : 0))));
  const approachCost = roundMoney(Math.max(3000, Math.min(25000, signingFee * 0.18)));
  const commissionRate = clamp(3 + Math.floor(career.reputation / 28) + Math.floor((career.empire?.staff?.length || 0) / 2) + (player.personality === "money" ? -1 : 0), 3, 14);
  const aiScoutScore = scoutAIScore(career, player);
  const adjustedChance = gate.eligible ? clamp(chance + Math.round((aiScoutScore - 50) / 8), 2, 88) : 0;
  return {
    id: `rep-${career.week}-${player.id}`,
    playerId,
    signingFee,
    approachCost,
    commissionRate,
    chance: adjustedChance,
    baseChance: chance,
    aiScoutScore,
    aiRecommendation: aiScoutScore >= 72 ? "AI scout: öncelikli hedef" : aiScoutScore >= 55 ? "AI scout: izlenebilir" : "AI scout: riskli",
    eligible: gate.eligible,
    reason: gate.reason,
    capacity: getAgencyCapacity(career),
    representedCount,
    rivalName: rival?.rivalName || null,
    rivalHeat: rival?.heat || 0
  };
}

export function signPlayerToAgency(career, playerId, approach = "balanced") {
  const pitch = buildRepresentationPitch(career, playerId);
  if (!pitch || !pitch.eligible || career.money < pitch.signingFee) return { career, ok: false, pitch };
  const player = normalizePlayer(career.db.players.find((item) => item.id === playerId), career.week);
  const approachProfiles = {
    balanced: { chance: 0, fee: 1, trust: 0, commission: 0, news: "Dengeli temsil görüşmesi yapıldı." },
    career: { chance: 7, fee: 1.05, trust: 7, commission: -1, news: "Kariyer planı oyuncu tarafında güven yarattı." },
    money: { chance: 12, fee: 1.35, trust: -5, commission: 0, news: "Yüksek imza desteği oyuncunun ilgisini artırdı." },
    commission: { chance: -5, fee: 0.92, trust: -6, commission: 1, news: "Yüksek komisyon pazarlığı masayı gerdi." }
  };
  const profile = approachProfiles[approach] || approachProfiles.balanced;
  const effectiveChance = clamp(pitch.chance + profile.chance, 2, 88);
  const signingFee = roundMoney(pitch.signingFee * profile.fee);
  if (career.money < signingFee) return { career, ok: false, pitch: { ...pitch, signingFee, chance: effectiveChance, approach } };
  const roll = seeded(career.week + player.value / 100000 + career.reputation + player.ego);
  const accepted = roll * 100 < effectiveChance;
  const spent = accepted ? signingFee : pitch.approachCost;
  const nextPlayers = career.db.players.map((item) =>
    item.id === playerId
      ? {
          ...item,
          represented: accepted ? true : item.represented,
          agencyCommissionRate: accepted ? clamp(pitch.commissionRate + profile.commission, 3, 14) : item.agencyCommissionRate,
          agencySignedWeek: accepted ? career.week : item.agencySignedWeek,
          agencyContractUntil: accepted ? career.week + 52 : item.agencyContractUntil,
          agencyTrust: accepted ? clamp(48 + Math.round((item.loyalty ?? 55) / 3) + Math.round(career.reputation / 6) + profile.trust, 1, 100) : item.agencyTrust,
          morale: clamp((item.morale ?? 60) + (accepted ? 5 : -2), 0, 100),
          happiness: clamp((item.happiness ?? item.morale ?? 60) + (accepted ? 6 : -3), 0, 100),
          loyalty: clamp((item.loyalty ?? 55) + (accepted ? 4 : -1), 0, 100)
        }
      : item
  );
  const nextCareer = {
    ...career,
    money: career.money - spent,
    reputation: clamp(career.reputation + (accepted ? 2 : -1), 0, 100),
    db: { ...career.db, players: nextPlayers },
    rivalPressure: (career.rivalPressure || []).filter((item) => item.playerId !== playerId || !accepted),
    news: [accepted ? `${player.name} temsil sözleşmesi imzaladı. ${profile.news}` : `${player.name} ajans teklifini reddetti.`, ...career.news].slice(0, 20)
  };
  return {
    career: accepted ? updateCareerStory(nextCareer) : nextCareer,
    ok: accepted,
    pitch: { ...pitch, signingFee, chance: effectiveChance, approach }
  };
}

export function holdPlayerTalk(career, playerId) {
  const player = normalizePlayer(career.db.players.find((item) => item.id === playerId), career.week);
  const cost = 10000;
  if (!player?.represented || career.money < cost) return { career, ok: false };
  const personality = personalityProfile(player.personality);
  const trustGain = clamp(4 + Math.round(career.reputation / 24) + (player.personality === "troubled" ? 3 : 0) + (player.personality === "loyal" ? 1 : 0), 3, 11);
  const moraleGain = clamp(3 + Math.round((100 - (player.happiness ?? player.morale ?? 60)) / 22) + Math.max(0, personality.playerTrust / 8), 2, 10);
  return {
    career: {
      ...career,
      money: career.money - cost,
      db: {
        ...career.db,
        players: career.db.players.map((item) =>
          item.id === playerId
            ? {
                ...item,
                agencyTrust: clamp((item.agencyTrust ?? 52) + trustGain, 0, 100),
                morale: clamp((item.morale ?? 60) + moraleGain, 0, 100),
                happiness: clamp((item.happiness ?? item.morale ?? 60) + moraleGain, 0, 100),
                loyalty: clamp((item.loyalty ?? 55) + 1, 0, 100)
              }
            : item
        )
      },
      news: [`${player.name} ile bire bir görüşme yapıldı. Güven +${trustGain}.`, ...career.news].slice(0, 20)
    },
    ok: true,
    trustGain,
    moraleGain
  };
}

export function sendPlayerGift(career, playerId, giftId = "watch") {
  const player = normalizePlayer(career.db.players.find((item) => item.id === playerId), career.week);
  const gifts = {
    watch: { label: "Saat", cost: 60000, trust: 4, morale: 3, loyalty: 1, reputation: 0 },
    motorbike: { label: "Motor", cost: 107000, trust: 7, morale: 6, loyalty: 2, reputation: 1 },
    car: { label: "Araba", cost: 182000, trust: 11, morale: 9, loyalty: 3, reputation: 2 }
  };
  const gift = gifts[giftId] || gifts.watch;
  if (!player?.represented || career.money < gift.cost) return { career, ok: false, gift };
  const egoBonus = player.ego >= 65 ? 2 : 0;
  const loyaltyBonus = player.personality === "loyal" ? 1 : 0;
  return {
    career: {
      ...career,
      money: career.money - gift.cost,
      reputation: clamp((career.reputation || 0) + gift.reputation, 0, 100),
      db: {
        ...career.db,
        players: career.db.players.map((item) =>
          item.id === playerId
            ? {
                ...item,
                agencyTrust: clamp((item.agencyTrust ?? 52) + gift.trust + egoBonus, 0, 100),
                morale: clamp((item.morale ?? 60) + gift.morale, 0, 100),
                happiness: clamp((item.happiness ?? item.morale ?? 60) + gift.morale, 0, 100),
                loyalty: clamp((item.loyalty ?? 55) + gift.loyalty + loyaltyBonus, 0, 100)
              }
            : item
        )
      },
      news: [`${player.name} için ${gift.label.toLowerCase()} hediyesi ajans ilişkisini güçlendirdi.`, ...career.news].slice(0, 20)
    },
    ok: true,
    gift
  };
}

export function resolvePlayerTalkChoice(career, playerId, choiceId = "calm") {
  const player = normalizePlayer(career.db.players.find((item) => item.id === playerId), career.week);
  if (!player?.represented) return { career, ok: false };
  const choices = {
    language: {
      label: "Dil Kursu",
      cost: 22000,
      trust: 3,
      morale: 2,
      marketHeat: 4,
      goal: 4,
      news: `${player.name} yeni lige uyum için dil kursuna gönderildi.`
    },
    transferList: {
      label: "Kulüplere Öner",
      cost: 15000,
      trust: player.personality === "ambitious" ? 4 : 1,
      morale: player.personality === "loyal" ? -1 : 2,
      marketHeat: 16,
      goal: 5,
      news: `${player.name} için kulüplere transfer uygunluk mesajı gönderildi.`
    },
    calm: {
      label: "Bire Bir Konuş",
      cost: 10000,
      trust: 5,
      morale: 4,
      marketHeat: 1,
      goal: 2,
      news: `${player.name} ile bire bir görüşme yapıldı.`
    },
    nickname: {
      label: "Lakabını Sahiplen",
      cost: 7000,
      trust: 2,
      morale: 3,
      marketHeat: 6,
      goal: 1,
      reputation: 1,
      news: `${player.name} için medya lakabı ajans hikayesine eklendi.`
    },
    release: {
      label: "Serbest Bırak",
      cost: 0,
      trust: -100,
      morale: -6,
      reputation: -2,
      release: true,
      news: `${player.name} ile temsil sözleşmesi feshedildi.`
    }
  };
  const choice = choices[choiceId] || choices.calm;
  if (career.money < choice.cost) return { career, ok: false, choice };
  const nextPlayers = career.db.players.map((item) => {
    if (item.id !== playerId) return item;
    const released = !!choice.release;
    return {
      ...item,
      represented: released ? false : item.represented,
      agencyTrust: released ? undefined : clamp((item.agencyTrust ?? 52) + choice.trust, 0, 100),
      morale: clamp((item.morale ?? 60) + choice.morale, 0, 100),
      happiness: clamp((item.happiness ?? item.morale ?? 60) + choice.morale, 0, 100),
      marketHeat: released ? Math.max(0, (item.marketHeat || 0) - 12) : clamp((item.marketHeat || 0) + (choice.marketHeat || 0), 0, 100),
      goalProgress: clamp((item.goalProgress ?? 40) + (choice.goal || 0), 0, 100),
      activeCareerPlan: released ? undefined : (choiceId === "transferList" ? "showcase" : item.activeCareerPlan),
      transferListed: released ? false : choiceId === "transferList" ? true : item.transferListed,
      agencyContractUntil: released ? undefined : item.agencyContractUntil,
      agencyCommissionRate: released ? undefined : item.agencyCommissionRate
    };
  });
  return {
    career: {
      ...career,
      money: career.money - choice.cost,
      reputation: clamp((career.reputation || 0) + (choice.reputation || 0), 0, 100),
      db: { ...career.db, players: nextPlayers },
      news: [choice.news, ...career.news].slice(0, 20)
    },
    ok: true,
    choice
  };
}

export function runPlayerCareerPlan(career, playerId, planId = "showcase") {
  const player = normalizePlayer(career.db.players.find((item) => item.id === playerId), career.week);
  if (!player?.represented) return { career, ok: false };
  const plans = {
    showcase: {
      label: "Vitrine çıkar",
      cost: 18000,
      marketHeat: 18,
      goal: 4,
      form: 1,
      trust: 1,
      news: `${player.name} için kulüplere özel vitrin dosyası gönderildi.`
    },
    training: {
      label: "Özel antrenman",
      cost: 14000,
      marketHeat: 6,
      goal: 7,
      form: 2,
      trust: 2,
      growth: 3,
      injuryRisk: 1,
      news: `${player.name} özel gelişim programına alındı.`
    },
    care: {
      label: "Oyuncu bakımı",
      cost: 12000,
      marketHeat: 3,
      goal: 3,
      form: 0,
      trust: 6,
      morale: 7,
      injuryRisk: -2,
      news: `${player.name} ile oyuncu bakım haftası planlandı.`
    },
    pr: {
      label: "PR vitrini",
      cost: 22000,
      marketHeat: 14,
      goal: 4,
      form: 0,
      trust: player.personality === "media" ? 3 : 0,
      reputation: 1,
      ego: 2,
      news: `${player.name} için medya görünürlüğü artırıldı.`
    }
  };
  const plan = plans[planId] || plans.showcase;
  if (career.money < plan.cost) return { career, ok: false, plan };
  const nextCareer = {
    ...career,
    money: career.money - plan.cost,
    reputation: clamp((career.reputation || 0) + (plan.reputation || 0), 0, 100),
    db: {
      ...career.db,
      players: career.db.players.map((item) => {
        if (item.id !== playerId) return item;
        return {
          ...item,
          activeCareerPlan: planId,
          planWeek: career.week,
          marketHeat: clamp((item.marketHeat || 0) + plan.marketHeat, 0, 100),
          goalProgress: clamp((item.goalProgress ?? item.careerGoal?.start ?? 40) + plan.goal, 0, 100),
          form: clamp((item.form || 60) + plan.form, 25, 99),
          agencyTrust: clamp((item.agencyTrust ?? 52) + plan.trust, 0, 100),
          morale: clamp((item.morale ?? 60) + (plan.morale || 0), 0, 100),
          happiness: clamp((item.happiness ?? item.morale ?? 60) + (plan.morale || Math.max(0, plan.trust)), 0, 100),
          growthRate: clamp((item.growthRate || 45) + (plan.growth || 0), 1, 100),
          injuryRisk: clamp((item.injuryRisk || 15) + (plan.injuryRisk || 0), 1, 60),
          ego: clamp((item.ego || 50) + (plan.ego || 0), 0, 100),
          agentBrain: tuneAgentBrainForPlan(item.agentBrain || buildAgentBrain(item, career.week), planId)
        };
      })
    },
    news: [plan.news, ...career.news].slice(0, 20)
  };
  return { career: updateCareerStory(nextCareer), ok: true, plan };
}

function tuneAgentBrainForPlan(brain, planId) {
  const next = { ...(brain || {}) };
  if (planId === "showcase") {
    next.creativity = clamp((next.creativity || 45) + 2, 10, 96);
    next.aggression = clamp((next.aggression || 45) + 1, 10, 95);
    next.lastLesson = "Vitrin planinda daha cesur karar";
  } else if (planId === "training") {
    next.learning = clamp((next.learning || 45) + 4, 10, 99);
    next.discipline = clamp((next.discipline || 45) + 1, 8, 98);
    next.lastLesson = "Antrenmanda karar seti genisledi";
  } else if (planId === "care") {
    next.discipline = clamp((next.discipline || 45) + 3, 8, 98);
    next.aggression = clamp((next.aggression || 45) - 1, 10, 95);
    next.lastLesson = "Bakim haftasi riskleri azaltti";
  } else if (planId === "pr") {
    next.creativity = clamp((next.creativity || 45) + 1, 10, 96);
    next.lastLesson = "PR haftasi ozguven verdi";
  }
  return next;
}

export function renewAgencyContract(career, playerId) {
  const player = normalizePlayer(career.db.players.find((item) => item.id === playerId), career.week);
  if (!player?.represented) return { career, ok: false };
  const renewalFee = roundMoney(Math.max(25000, player.value * (0.007 + Math.max(0, (player.ego ?? 50) - 45) / 12000)));
  if (career.money < renewalFee) return { career, ok: false, renewalFee };
  const trustGain = clamp(10 + Math.round((player.loyalty ?? 55) / 18) - Math.round((player.ego ?? 50) / 28), 6, 16);
  return {
    career: {
      ...career,
      money: career.money - renewalFee,
      reputation: clamp(career.reputation + 1, 0, 100),
      db: {
        ...career.db,
        players: career.db.players.map((item) =>
          item.id === playerId
            ? {
                ...item,
                agencyContractUntil: career.week + 52,
                agencyTrust: clamp((item.agencyTrust ?? 52) + trustGain, 0, 100),
                happiness: clamp((item.happiness ?? item.morale ?? 60) + 5, 0, 100),
                morale: clamp((item.morale ?? 60) + 4, 0, 100)
              }
            : item
        )
      },
      pendingCards: (career.pendingCards || []).filter((card) => !(card.templateId === "contract-renewal" && card.playerId === playerId)),
      news: [`${player.name} ile temsil sözleşmesi W${career.week + 52}'ye kadar yenilendi.`, ...career.news].slice(0, 20)
    },
    ok: true,
    renewalFee,
    trustGain
  };
}

export function buildPlayerSponsorship(career, playerId) {
  const player = normalizePlayer(career.db.players.find((item) => item.id === playerId), career.week);
  if (!player?.represented) return null;
  const activeEndorsements = player.endorsements || [];
  const personality = personalityProfile(player.personality);
  const trustBonus = Math.round(((player.agencyTrust ?? 52) - 50) / 6);
  const brandFit = clamp(Math.round(player.form * 0.28 + player.overall * 0.24 + career.reputation * 0.22 + trustBonus + (player.personality === "media" ? 14 : 0) - activeEndorsements.length * 12), 1, 100);
  const chance = clamp(24 + brandFit + Math.round(career.mediaPower || 0) + personality.negotiation + trustBonus - Math.round(player.ego / 12), 8, 94);
  const advance = roundMoney(Math.max(20000, player.value * (0.009 + brandFit / 9000)));
  const weeklyIncome = roundMoney(Math.max(3000, advance / 10));
  const reputation = brandFit >= 70 ? 3 : brandFit >= 52 ? 2 : 1;
  return {
    id: `endorsement-${career.week}-${player.id}`,
    playerId,
    brandName: pickBrandName(player, career.week),
    advance,
    weeklyIncome,
    chance,
    reputation,
    durationWeeks: 8,
    brandFit
  };
}

export function signPlayerSponsorship(career, playerId) {
  const deal = buildPlayerSponsorship(career, playerId);
  if (!deal) return { career, ok: false, deal };
  const player = normalizePlayer(career.db.players.find((item) => item.id === playerId), career.week);
  const roll = seeded(career.week + player.value / 90000 + career.reputation + (career.mediaPower || 0));
  const accepted = roll * 100 < deal.chance;
  const nextPlayers = career.db.players.map((item) => {
    if (item.id !== playerId) return item;
    const endorsements = item.endorsements || [];
    return {
      ...item,
      endorsements: accepted ? [...endorsements, { ...deal, signedWeek: career.week, expiresWeek: career.week + deal.durationWeeks }] : endorsements,
      morale: clamp((item.morale ?? 60) + (accepted ? 3 : -1), 0, 100),
      happiness: clamp((item.happiness ?? item.morale ?? 60) + (accepted ? 4 : -2), 0, 100),
      ego: clamp((item.ego ?? 50) + (accepted ? 2 : 0), 0, 100)
    };
  });
  return {
    career: {
      ...career,
      money: career.money + (accepted ? deal.advance : 0),
      reputation: clamp(career.reputation + (accepted ? deal.reputation : -1), 0, 100),
      mediaPower: clamp((career.mediaPower || 0) + (accepted ? 1 : 0), 0, 100),
      db: { ...career.db, players: nextPlayers },
      news: [accepted ? `${player.name}, ${deal.brandName} sponsorluğunu imzaladı.` : `${player.name} için sponsor görüşmesi sonuçsuz kaldı.`, ...career.news].slice(0, 20)
    },
    ok: accepted,
    deal
  };
}

export function acceptIncomingOffer(career, offerId) {
  const incoming = (career.incomingOffers || []).find((item) => item.id === offerId);
  if (!incoming) return { career, ok: false };
  const result = negotiate(career, incoming, "balanced");
  return {
    ...result,
    career: {
      ...result.career,
      incomingOffers: (career.incomingOffers || []).filter((item) => item.id !== offerId)
    }
  };
}

export function negotiate(career, offer, stance = "balanced") {
  if (!offer) return { career, ok: false };
  const player = normalizePlayer(career.db.players.find((item) => item.id === offer.playerId), career.week);
  const club = normalizeClub(career.db.clubs.find((item) => item.id === offer.clubId));
  const tactic = typeof stance === "string" ? stance : stance?.tactic || "balanced";
  const risk = tactic === "hard" ? 15 : tactic === "soft" ? -7 : tactic === "dark" ? 24 : 0;
  const reward = tactic === "hard" ? 1.22 : tactic === "soft" ? 0.9 : tactic === "dark" ? 1.38 : 1;
  const greed = clamp((offer.commission || 0) / Math.max(1, offer.fee) * 100 - 7, -4, 18);
  const wageComfort = clamp(((offer.wage || 0) - player.wage) / Math.max(1, player.wage) * 18, -12, 16);
  const releasePenalty = offer.releaseClause && offer.releaseClause < offer.fee * 1.7 ? 5 : 0;
  const roll = seeded(career.week + offer.fee / 100000 + career.reputation + (offer.signingBonus || 0) / 50000);
  const accepted = roll * 100 < clamp(offer.chance - risk - greed - releasePenalty + wageComfort, 3, 95);
  if (!accepted) {
    return {
      career: {
        ...career,
        reputation: clamp(career.reputation - (tactic === "dark" ? 4 : tactic === "hard" ? 2 : 1), 0, 100),
        ethics: clamp((career.ethics ?? 72) - (tactic === "dark" ? 6 : 1), 0, 100),
        lastOffer: offer,
        incomingOffers: (career.incomingOffers || []).filter((item) => item.id !== offer.id),
        news: [tactic === "dark" ? "Riskli hamle ters tepti, medya kokuyu aldı." : "news_deal_fail", ...career.news]
      },
      ok: false
    };
  }
  const nextPlayers = career.db.players.map((player) =>
    player.id === offer.playerId
      ? {
          ...player,
          clubId: offer.clubId,
          wage: offer.wage,
          value: roundMoney(offer.fee * 0.9),
          morale: clamp(player.morale + (tactic === "soft" ? 10 : 7), 0, 100),
          happiness: clamp((player.happiness ?? player.morale ?? 60) + wageComfort / 2 + (offer.signingBonus ? 3 : 0), 0, 100),
          loyalty: clamp((player.loyalty ?? 55) + (tactic === "dark" ? -8 : tactic === "soft" ? 4 : 1), 0, 100),
          represented: true
        }
      : player
  );
  const nextClubs = career.db.clubs.map((club) =>
    club.id === offer.clubId
      ? { ...club, relation: clamp(club.relation + (tactic === "dark" ? -7 : tactic === "soft" ? 5 : 3), 0, 100), budget: Math.max(0, club.budget - offer.fee - (offer.signingBonus || 0)) }
      : club
  );
  return {
    career: applyAchievementProgress({
      ...career,
      money: career.money + Math.round(offer.commission * reward),
      reputation: clamp(career.reputation + (tactic === "dark" ? 1 : 3), 0, 100),
      ethics: clamp((career.ethics ?? 72) - (tactic === "dark" ? 7 : 0), 0, 100),
      db: { ...career.db, players: nextPlayers, clubs: nextClubs },
      lastOffer: null,
      stats: { ...(career.stats || {}), dealsAccepted: (career.stats?.dealsAccepted || 0) + 1 },
      incomingOffers: (career.incomingOffers || []).filter((item) => item.id !== offer.id),
      news: [tactic === "dark" ? "Karanlık pazarlık para getirdi ama itibar riski büyüdü." : "news_deal", ...career.news]
    }),
    ok: true
  };
}

export function resolveEventCard(career, cardId, decision) {
  const card = career.pendingCards.find((item) => item.id === cardId);
  if (!card) return career;
  const effect = decision === "accept" ? card.accept : card.decline;
  const clearedCareer = {
    ...career,
    stats: { ...(career.stats || {}), cardsResolved: (career.stats?.cardsResolved || 0) + 1 },
    pendingCards: career.pendingCards.filter((item) => item.id !== cardId)
  };
  if (card.templateId === "contract-renewal" && card.playerId) {
    return applyEffect({
      ...clearedCareer,
      db: {
        ...clearedCareer.db,
        players: clearedCareer.db.players.map((player) => {
          if (player.id !== card.playerId) return player;
          if (decision === "accept") {
            return {
              ...player,
              agencyContractUntil: clearedCareer.week + 52,
              agencyTrust: clamp((player.agencyTrust ?? 52) + 12, 0, 100),
              happiness: clamp((player.happiness ?? player.morale ?? 60) + 6, 0, 100)
            };
          }
          return {
            ...player,
            agencyTrust: clamp((player.agencyTrust ?? 52) - (decision === "decline" ? 10 : 4), 0, 100),
            happiness: clamp((player.happiness ?? player.morale ?? 60) - (decision === "decline" ? 5 : 2), 0, 100)
          };
        })
      }
    }, effect);
  }
  if (card.templateId === "goal-breakthrough" && card.playerId) {
    return applyEffect({
      ...clearedCareer,
      db: {
        ...clearedCareer.db,
        players: clearedCareer.db.players.map((player) => {
          if (player.id !== card.playerId) return player;
          if (decision === "accept") {
            return {
              ...player,
              goalProgress: clamp((player.goalProgress ?? 90) + 8, 0, 100),
              value: roundMoney((player.value || 1000000) * 1.08),
              agencyTrust: clamp((player.agencyTrust ?? 52) + 5, 0, 100),
              happiness: clamp((player.happiness ?? player.morale ?? 60) + 5, 0, 100)
            };
          }
          return {
            ...player,
            goalProgress: clamp((player.goalProgress ?? 90) - 4, 0, 100),
            agencyTrust: clamp((player.agencyTrust ?? 52) - 3, 0, 100)
          };
        })
      }
    }, effect);
  }
  return applyEffect(clearedCareer, effect);
}

function applyEffect(career, effect) {
  return applyAchievementProgress(updateCareerStory({
    ...career,
    money: career.money + (effect.money || 0),
    reputation: clamp(career.reputation + (effect.reputation || 0), 0, 100),
    ethics: clamp((career.ethics ?? 72) + (effect.ethics || 0), 0, 100),
    relationBoost: career.relationBoost + (effect.relation || 0),
    scoutBoost: career.scoutBoost + (effect.scoutBoost || 0),
    db: {
      ...career.db,
      players: career.db.players.map((player) =>
        player.represented ? { ...player, morale: clamp(player.morale + (effect.morale || 0), 0, 100) } : player
      )
    },
    news: effect.newsKey ? [effect.newsKey, ...career.news] : career.news
  }));
}

function buildEventCard(template, week, index = 0) {
  return {
    ...template,
    id: `${template.id}-${week}-${index}`,
    templateId: template.id,
    weekCreated: week,
    expiresWeek: week + (template.severity === "urgent" ? 1 : template.severity === "rare" ? 3 : 2)
  };
}

export function simulateWeekPreview(career) {
  const week = career.week + 1;
  const clubs = career.selectedLeagueId
    ? career.db.clubs.filter((club) => club.leagueId === career.selectedLeagueId)
    : career.db.clubs;
  const scheduled = fixturePairsForWeek(career, clubs, week);
  const pairs = scheduled.length ? scheduled : buildFallbackPairs(clubs);
  const fixtures = pairs.map(({ home, away, sourceFixture }, index) => buildFixturePreview(career, home, away, week, index, sourceFixture));
  const featuredBase = pickFeaturedFixture(career, fixtures, week);
  const watchPlan = featuredBase ? buildFixtureWatchPlan(career, featuredBase, week) : { clientIds: [], totalClients: 0, portfolioIds: [], portfolioTotal: 0, reason: "Lig fikstüründe temsilci maçı yok." };
  const featured = featuredBase ? {
    ...featuredBase,
    watchClientIds: watchPlan.clientIds,
    watchTotalClients: watchPlan.totalClients,
    watchPortfolioIds: watchPlan.portfolioIds,
    watchPortfolioTotal: watchPlan.portfolioTotal,
    watchReason: watchPlan.reason
  } : null;
  const events = fixtures.length
    ? fixtures
      .flatMap((fixture) => (fixture.events || []).map((event) => ({
        ...event,
        fixtureId: fixture.id,
        fixtureLabel: `${fixture.homeName} - ${fixture.awayName}`,
        homeId: fixture.homeId,
        awayId: fixture.awayId
      })))
      .sort((a, b) => a.minute - b.minute || String(a.fixtureId).localeCompare(String(b.fixtureId)))
    : [{ minute: 90, type: "info", text: "Lig raporlari hazirlaniyor.", side: "neutral" }];
  return {
    week,
    featured,
    fixtures,
    events
  };
}

function pickFeaturedFixture(career, fixtures, week) {
  if (!fixtures.length) return null;
  const represented = getRepresentedPlayers(career);
  if (!represented.length) return fixtures[0];
  const offers = career.incomingOffers || [];
  const scored = fixtures.map((fixture, index) => {
    const clients = represented.filter((player) => player.clubId === fixture.homeId || player.clubId === fixture.awayId);
    const clientScore = clients.reduce((sum, player) => sum + playerMatchWatchScore(player, offers, week), 0);
    const offerScore = clients.some((player) => offers.some((offer) => offer.playerId === player.id)) ? 55 : 0;
    const marketScore = clients.reduce((sum, player) => sum + Math.round((player.marketHeat || 0) / 3), 0);
    return { fixture, score: clients.length * 75 + clientScore + offerScore + marketScore - index };
  }).sort((a, b) => b.score - a.score);
  return scored[0]?.score > 0 ? scored[0].fixture : fixtures[0];
}

function buildFixtureWatchPlan(career, fixture, week) {
  const offers = career.incomingOffers || [];
  const portfolio = getRepresentedPlayers(career)
    .map((player) => ({
      player,
      score: playerMatchWatchScore(player, offers, week)
    }))
    .sort((a, b) => b.score - a.score);
  const clients = getRepresentedPlayers(career)
    .filter((player) => player.clubId === fixture.homeId || player.clubId === fixture.awayId)
    .map((player) => ({
      player,
      score: playerMatchWatchScore(player, offers, week)
    }))
    .sort((a, b) => b.score - a.score);
  const top = clients.slice(0, 3).map((item) => item.player.id);
  const reason = !clients.length
    ? "Bu hafta portföy oyuncusu olmayan ana fikstür gösteriliyor."
    : clients.length > 3
      ? `Bu maçta ${clients.length} müşterin var; değer, form, piyasa ısısı ve teklif riskiyle ilk 3 öne alındı.`
      : `${clients.length} müşterinin oynadığı en kritik maç seçildi.`;
  return {
    clientIds: top,
    totalClients: clients.length,
    portfolioIds: portfolio.slice(0, 3).map((item) => item.player.id),
    portfolioTotal: portfolio.length,
    reason
  };
}

function playerMatchWatchScore(player, offers = [], week = 1) {
  const hasOffer = offers.some((offer) => offer.playerId === player.id);
  const contractRisk = player.agencyContractUntil ? Math.max(0, 12 - (player.agencyContractUntil - week)) * 4 : 0;
  return Math.round(
    (player.form || 60)
    + (player.marketHeat || 0) * 1.1
    + Math.log10(Math.max(1, player.value || 1)) * 7
    + (player.goalProgress || 0) * 0.35
    + ((player.agencyTrust ?? 55) < 45 ? 18 : 0)
    + contractRisk
    + (hasOffer ? 48 : 0)
  );
}

function buildFallbackPairs(clubs) {
  const pairs = [];
  for (let index = 0; index < clubs.length; index += 2) {
    if (clubs[index] && clubs[index + 1]) pairs.push({ home: clubs[index], away: clubs[index + 1], sourceFixture: null });
  }
  return pairs;
}

function fixturePairsForWeek(career, clubs, week) {
  const leagueId = career.selectedLeagueId;
  const fixtures = (career.db.fixtures || []).filter((fixture) => fixture.leagueId === leagueId);
  if (!fixtures.length) return [];
  const maxWeek = Math.max(1, ...fixtures.map((fixture) => fixture.week || 1));
  const targetWeek = ((week - 2) % maxWeek) + 1;
  const roundFixtures = fixtures.filter((fixture) => (fixture.week || 1) === targetWeek);
  const byId = new Map(clubs.map((club) => [club.id, club]));
  return roundFixtures
    .map((fixture) => ({
      home: byId.get(fixture.homeClubId),
      away: byId.get(fixture.awayClubId),
      sourceFixture: fixture
    }))
    .filter((item) => item.home && item.away);
}

function buildFixturePreview(career, home, away, week, index, sourceFixture = null) {
  const fixtureId = sourceFixture?.id || `${home.id}-${away.id}-${week}`;
  const homePlayers = career.db.players.filter((player) => player.clubId === home.id);
  const awayPlayers = career.db.players.filter((player) => player.clubId === away.id);
  const homeProfile = clubMatchProfile(home, homePlayers, week, 7);
  const awayProfile = clubMatchProfile(away, awayPlayers, week, 31);
  const profileGap = homeProfile.power - awayProfile.power;
  const homeXg = clamp(1.05 + profileGap / 52 + homeProfile.attack / 190 + 0.18, 0.25, 3.8);
  const awayXg = clamp(1.02 - profileGap / 58 + awayProfile.attack / 205, 0.2, 3.6);
  const historicalHome = Number.isFinite(sourceFixture?.homeGoals) ? sourceFixture.homeGoals : null;
  const historicalAway = Number.isFinite(sourceFixture?.awayGoals) ? sourceFixture.awayGoals : null;
  const homeGoals = blendFixtureGoals(goalsFromXg(homeXg, week + index + homeProfile.power), historicalHome, week + index + 301);
  const awayGoals = blendFixtureGoals(goalsFromXg(awayXg, week + index + awayProfile.power + 29), historicalAway, week + index + 337);
  const homePressure = clamp(Math.round(50 + profileGap * 0.72 + (homeXg - awayXg) * 9), 18, 82);
  const awayPressure = 100 - homePressure;
  const possessionHome = clamp(Math.round(50 + profileGap * 0.45 + homeProfile.midfield / 9 - awayProfile.midfield / 11), 36, 64);
  const homeShots = clamp(Math.round(homeXg * 4.6 + homeProfile.attack / 24 + seeded(week + index + 70) * 3), 2, 18);
  const awayShots = clamp(Math.round(awayXg * 4.6 + awayProfile.attack / 24 + seeded(week + index + 83) * 3), 2, 18);
  const moments = buildMatchMoments({ week, index, homePressure, homeShots, awayShots, homeGoals, awayGoals, analytics: career.db.analytics });
  const baseEvents = moments
    .sort((a, b) => a.minute - b.minute)
    .map((event) => {
      const keyPlayer = pickKeyPlayer(event.side === "home" ? homePlayers : awayPlayers, week + index + event.minute);
      const sideProfile = event.side === "home" ? homeProfile : awayProfile;
      const sidePressure = event.side === "home" ? homePressure : awayPressure;
      const agentDecision = decideMatchAgentAction(event, sideProfile, keyPlayer, sidePressure, week + index + event.minute);
      return {
        ...event,
        playerId: keyPlayer?.id || null,
        actionType: agentDecision.type,
        agentDecision,
        lane: pickLane(week + index + event.minute),
        threat: event.type === "goal" ? 96 : event.type === "shot" ? 64 + Math.round((event.side === "home" ? homeXg : awayXg) * 7) : 38 + Math.round(sidePressure / 5),
        x: event.side === "home" ? 28 + Math.floor(seeded(week + index + event.minute + 9) * 38) : 34 + Math.floor(seeded(week + index + event.minute + 9) * 38),
        y: 18 + Math.floor(seeded(week + index + event.minute + 17) * 64),
        text: buildMatchText(event, event.side === "home" ? home.name : away.name, keyPlayer, career.db.analytics, week + index + event.minute, agentDecision)
      };
    });
  const model2d = enhanceFixture2D({
    events: baseEvents,
    homeProfile,
    awayProfile,
    homePressure,
    awayPressure,
    seed: week * 100 + index
  });
  const events = model2d.events.map((event) => ({
    ...event,
    fixtureId,
    fixtureLabel: `${home.name} - ${away.name}`,
    homeId: home.id,
    awayId: away.id
  }));
  events.push({
    minute: 90,
    side: "neutral",
    type: "fulltime",
    fixtureId,
    fixtureLabel: `${home.name} - ${away.name}`,
    homeId: home.id,
    awayId: away.id,
    lane: "center",
    threat: 0,
    x: 50,
    y: 50,
    text: `Maç bitti: ${home.name} ${homeGoals}-${awayGoals} ${away.name}`
  });
  return {
    id: fixtureId,
    homeId: home.id,
    awayId: away.id,
    homeName: home.name,
    awayName: away.name,
    homeGoals,
    awayGoals,
    homeXg: Number(homeXg.toFixed(2)),
    awayXg: Number(awayXg.toFixed(2)),
    homeShots,
    awayShots,
    possessionHome,
    possessionAway: 100 - possessionHome,
    homePressure,
    awayPressure,
    homePower: Math.round(homeProfile.power),
    awayPower: Math.round(awayProfile.power),
    sourceFixture: sourceFixture ? {
      source: sourceFixture.source,
      license: sourceFixture.license,
      round: sourceFixture.round,
      date: sourceFixture.date,
      historicalScore: historicalHome !== null && historicalAway !== null ? `${historicalHome}-${historicalAway}` : null
    } : null,
    model2d,
    tacticalNote: buildTacticalNote(home, away, homeProfile, awayProfile, homePressure, career.db.analytics),
    events
  };
}

function blendFixtureGoals(simulated, historical, seed) {
  if (!Number.isFinite(historical)) return simulated;
  if (seeded(seed) < 0.58) return clamp(historical, 0, 6);
  return clamp(Math.round(simulated * 0.65 + historical * 0.35), 0, 6);
}

function clubMatchProfile(club, players, week, salt) {
  const squad = players.length ? players.map((raw, index) => normalizePlayer(raw, week + salt + index)) : [];
  const top = [...squad].sort((a, b) => (b.overall + b.form / 5) - (a.overall + a.form / 5)).slice(0, 11);
  const average = top.length ? top.reduce((sum, player) => sum + player.overall, 0) / top.length : club.reputation;
  const form = top.length ? top.reduce((sum, player) => sum + player.form, 0) / top.length : 62;
  const morale = top.length ? top.reduce((sum, player) => sum + (player.happiness ?? player.morale ?? 55), 0) / top.length : 56;
  const attackers = top.filter((player) => ["ST", "AM", "RW", "LW"].includes(player.position));
  const mids = top.filter((player) => ["CM", "DM", "AM"].includes(player.position));
  const defenders = top.filter((player) => ["CB", "LB", "RB", "GK"].includes(player.position));
  const attack = averageRole(attackers, average) + (club.need === "ST" ? -3 : 0);
  const midfield = averageRole(mids, average);
  const defense = averageRole(defenders, average) + (club.need === "GK" || club.need === "CB" ? -3 : 0);
  const budgetWeight = Math.log10(Math.max(100000, club.budget || 100000)) * 2.4;
  const policy = club.transferPolicy === "youth" ? 1.5 : club.transferPolicy === "stars" ? 2.5 : 0;
  const power = average * 0.54 + form * 0.2 + morale * 0.08 + club.reputation * 0.18 + budgetWeight + policy;
  return { power, attack, midfield, defense, form, morale };
}

function averageRole(players, fallback) {
  if (!players.length) return fallback;
  return players.reduce((sum, player) => sum + player.overall + player.form / 8, 0) / players.length;
}

function goalsFromXg(xg, seed) {
  const base = Math.floor(xg);
  const fraction = xg - base;
  let goals = base;
  if (seeded(seed + 3) < fraction) goals += 1;
  if (xg > 1.15 && seeded(seed + 17) < xg / 9) goals += 1;
  if (xg < 0.7 && seeded(seed + 29) < 0.28) goals = 0;
  return clamp(goals, 0, 5);
}

function buildMatchMoments({ week, index, homePressure, homeShots, awayShots, homeGoals, awayGoals, analytics }) {
  const moments = [];
  const homeDanger = Math.max(2, Math.round(homeShots / 3));
  const awayDanger = Math.max(2, Math.round(awayShots / 3));
  const pressureBias = analytics?.pressureShare ? Math.min(2, Math.round(analytics.pressureShare * 12)) : 0;
  for (let i = 0; i < homeDanger; i += 1) {
    moments.push({
      minute: 5 + Math.floor(((i + 1) * 83) / (homeDanger + 1)) + Math.floor(seeded(week + index + i + 4) * 5),
      side: "home",
      type: i < homeGoals ? "goal" : seeded(week + index + i + 18) < 0.55 + analyticsShotBias(analytics) ? "shot" : "attack"
    });
  }
  for (let i = 0; i < awayDanger; i += 1) {
    moments.push({
      minute: 6 + Math.floor(((i + 1) * 82) / (awayDanger + 1)) + Math.floor(seeded(week + index + i + 34) * 5),
      side: "away",
      type: i < awayGoals ? "goal" : seeded(week + index + i + 48) < 0.55 + analyticsShotBias(analytics) ? "shot" : "attack"
    });
  }
  moments.push({ minute: 24 + Math.floor(seeded(week + index + 91) * 12), side: homePressure >= 50 ? "home" : "away", type: "attack" });
  moments.push({ minute: 60 + Math.floor(seeded(week + index + 97) * 14), side: homePressure >= 55 ? "home" : "away", type: "shot" });
  if (seeded(week + index + 121) < 0.62) {
    moments.push({ minute: 18 + Math.floor(seeded(week + index + 122) * 58), side: homePressure >= 50 ? "away" : "home", type: "foul" });
  }
  if (seeded(week + index + 141) < 0.28) {
    moments.push({ minute: 52 + Math.floor(seeded(week + index + 142) * 30), side: homePressure >= 56 ? "home" : "away", type: "foul" });
  }
  for (let i = 0; i < pressureBias; i += 1) {
    moments.push({ minute: 34 + i * 18 + Math.floor(seeded(week + index + i + 150) * 6), side: homePressure >= 50 ? "home" : "away", type: "pressure" });
  }
  return moments;
}

function analyticsShotBias(analytics) {
  return analytics?.shotShare ? Math.min(0.08, analytics.shotShare * 0.8) : 0;
}

function buildTacticalNote(home, away, homeProfile, awayProfile, homePressure, analytics) {
  if (analytics?.source && analytics.passShare > 0.45) return `StatsBomb modeli pas ritmini izliyor; ${homePressure >= 50 ? home.name : away.name} topu daha sabirli dolastiriyor.`;
  if (analytics?.source && analytics.pressureShare > 0.06) return `StatsBomb modeli baskı tetiklerini öne çıkarıyor; orta saha top kayıpları kritik.`;
  if (homeProfile.attack - awayProfile.defense > 7) return `${home.name} önde baskıyı forvet hattından kuruyor.`;
  if (awayProfile.attack - homeProfile.defense > 7) return `${away.name} geçişlerde daha tehlikeli görünüyor.`;
  if (homePressure > 60) return `${home.name} topu daha cok ikinci bolgede kazaniyor.`;
  if (homePressure < 40) return `${away.name} merkezi kapatip oyunu kanada itiyor.`;
  return "Maç dengeli; detayları oyuncu formu ve bitiricilik belirliyor.";
}

function pickLane(seed) {
  const lanes = ["left", "center", "right"];
  return lanes[Math.floor(seeded(seed) * lanes.length)];
}

function pickKeyPlayer(players, seed) {
  if (!players.length) return null;
  const represented = players.filter((player) => player.represented);
  if (represented.length && seeded(seed + 77) < 0.58) {
    const clientPool = [...represented].sort((a, b) => b.form + b.overall - (a.form + a.overall));
    return clientPool[Math.floor(seeded(seed + 31) * Math.min(2, clientPool.length))];
  }
  const sorted = [...players].sort((a, b) => b.form + b.overall - (a.form + a.overall));
  return sorted[Math.floor(seeded(seed) * Math.min(3, sorted.length))];
}

const MATCH_ACTION_POOL = {
  goal: [
    ["finish", "bitiricilik", "kalecinin tersine vur", 1.2],
    ["header", "kafa vuruşu", "arka direğe saldır", 0.75],
    ["rebound", "seken top", "ikinci topu takip et", 0.55],
    ["cutback_finish", "yerden bitiriş", "penaltı noktasına koş", 0.7]
  ],
  shot: [
    ["shot", "şut", "boşluğu görür görmez vur", 1],
    ["long_shot", "uzak şut", "savunma yerleşmeden dene", 0.55],
    ["header", "kafa vuruşu", "orta kaliteyse ön direğe koş", 0.48],
    ["free_kick", "duran top", "baraj üstünü hedefle", 0.32]
  ],
  pressure: [
    ["press", "pres", "pas kanalını kapat", 1.1],
    ["counter_press", "karşı pres", "top kaybından sonra 5 saniye bas", 0.95],
    ["tackle", "müdahale", "riskli temasa gir", 0.52],
    ["interception", "araya girme", "pas gölgesinde bekle", 0.72]
  ],
  foul: [
    ["tackle", "sert mudahale", "temasi kesip atagi durdur", 0.75],
    ["press", "gec baski", "rakibi cizgiye sikistir", 0.58],
    ["interception", "riskli hamle", "pas arasina agresif gir", 0.42]
  ],
  attack: [
    ["carry", "top taşıma", "boş koridora sür", 0.9],
    ["short_pass", "kısa pas", "tempo kaybetmeden duvar yap", 0.82],
    ["through_ball", "ara pas", "savunma arkasını dene", 0.7],
    ["cross", "orta", "çizgiye inip ceza sahasını hedefle", 0.62],
    ["switch", "oyun yönü değiştirme", "zayıf kanada çevir", 0.48],
    ["dribble", "top sürme", "bire biri zorla", 0.55],
    ["overlap", "bindirme", "kanat desteğini kullan", 0.5],
    ["set_piece", "duran top organizasyonu", "blok perdeleme yap", 0.34],
    ["corner", "korner planı", "ön direğe koşu at", 0.26],
    ["long_ball", "uzun pas", "savunma arkasına erken oyna", 0.38],
    ["key_pass", "kilit pas", "son pası geciktirme", 0.5]
  ]
};

const GRF_ACTION_MAP = {
  finish: "shot",
  shot: "shot",
  long_shot: "shot",
  header: "shot",
  rebound: "shot",
  cutback_finish: "shot",
  free_kick: "shot",
  short_pass: "short_pass",
  key_pass: "short_pass",
  through_ball: "long_pass",
  switch: "long_pass",
  long_ball: "long_pass",
  cross: "high_pass",
  corner: "high_pass",
  set_piece: "high_pass",
  carry: "sprint",
  dribble: "dribble",
  overlap: "sprint",
  press: "pressure",
  counter_press: "team_pressure",
  tackle: "slide",
  interception: "pressure"
};

const GRF_ACTION_LABELS = {
  short_pass: "S kısa pas",
  high_pass: "A yüksek pas",
  shot: "D şut",
  long_pass: "W uzun pas",
  pressure: "S pres",
  team_pressure: "D takım presi",
  slide: "A kayarak müdahale",
  dribble: "C top sürme",
  sprint: "E sprint",
  switch_player: "Q oyuncu değiştir"
};

function decideMatchAgentAction(event, profile, player, pressure, seed = 1) {
  const pool = MATCH_ACTION_POOL[event.type] || MATCH_ACTION_POOL.attack;
  const brain = player?.agentBrain || buildAgentBrain(player || {}, seed);
  const playerRead = player
    ? (player.overall || 55) * 0.36 + (player.form || 60) * 0.22 + (player.ego || 45) * 0.06 + (player.happiness ?? player.morale ?? 55) * 0.08 + (brain.learning || 45) * 0.14 + (player.position === "ST" || player.position === "AM" ? 5 : 0)
    : 52;
  const teamRead = (profile.attack || 55) * 0.34 + (profile.midfield || 55) * 0.22 + pressure * 0.22 + (profile.form || 60) * 0.12;
  const confidence = clamp(Math.round((playerRead + teamRead + (brain.discipline || 45) * 0.18) / 1.52), 18, 96);
  const bravery = clamp(Math.round((player?.ego ?? 45) * 0.28 + pressure * 0.28 + (profile.attack || 55) * 0.2 + (brain.aggression || 45) * 0.34), 10, 96);
  const chosen = weightedPick(pool.map((item, index) => {
    let weight = item[3] || 0.5;
    if ((brain.preferredActions || []).includes(item[0])) weight += 0.46;
    if (["through_ball", "key_pass", "switch"].includes(item[0])) weight += (brain.creativity || 45) / 185;
    if (["press", "counter_press", "tackle"].includes(item[0])) weight += (brain.aggression || 45) / 210;
    if (["through_ball", "dribble", "long_shot", "tackle"].includes(item[0])) weight += bravery / 180;
    if (["short_pass", "switch", "interception", "counter_press"].includes(item[0])) weight += confidence / 210;
    if (player?.position === "ST" && ["finish", "shot", "header"].includes(item[0])) weight += 0.42;
    if (player?.position === "CM" && ["key_pass", "short_pass", "switch"].includes(item[0])) weight += 0.38;
    if (player?.position === "CB" && ["interception", "long_ball", "header"].includes(item[0])) weight += 0.36;
    return { item, weight: Math.max(0.05, weight), seed: seed + index * 17 };
  }), seed + confidence + bravery);
  const [type, label, intent] = chosen.item;
  const grfAction = GRF_ACTION_MAP[type] || (event.type === "pressure" ? "pressure" : "short_pass");
  const risk = clamp(Math.round(100 - confidence + bravery / 4 + (["tackle", "dribble", "through_ball", "long_shot"].includes(type) ? 14 : 0)), 5, 92);
  const actionTick = {
    stepMs: 100,
    actionSet: "grf-lite",
    action: grfAction,
    label: GRF_ACTION_LABELS[grfAction] || grfAction,
    sticky: ["sprint", "dribble", "pressure", "team_pressure"].includes(grfAction)
  };
  return {
    type,
    label,
    intent,
    grfAction,
    actionTick,
    confidence,
    risk,
    brainStyle: brain.style,
    model: "local-agent",
    version: "grf-agentpitch-lite-v3"
  };
}

function weightedPick(items, seed = 1) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = seeded(seed) * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items.at(-1);
}

function buildMatchText(event, clubName, player, analytics, seed = 1, agentDecision = null) {
  const name = player?.name;
  const decision = agentDecision?.label ? `(${agentDecision.label}) ` : "";
  if (analytics?.templates?.length && (event.type === "pressure" || seeded(seed) > 0.72)) {
    return analytics.templates[Math.floor(seeded(seed + 12) * analytics.templates.length)];
  }
  if (event.type === "goal") return name ? `${name} ${decision}kararıyla pozisyonu golle bitirdi.` : `${clubName} baskıyı gole çevirdi.`;
  if (event.type === "shot") return name ? `${name} ${decision}boşluğu buldu ve denedi.` : `${clubName} ceza sahası çevresinden şut denedi.`;
  if (event.type === "pressure") return name ? `${name} ${decision}ile topu geri kazanmayı deniyor.` : `${clubName} top kaybı sonrası baskıyı arttırdı.`;
  if (event.type === "foul") return name ? `${name} ${decision}sonrasi faul yapti; hakem oyunu durdurdu.` : `${clubName} baskida faul yapti.`;
  if (event.type === "attack") return name ? `${name} ${decision}seçip takımı ileri taşıyor.` : `${clubName} kanattan atak hazırlıyor.`;
  return `${clubName} oyunun temposunu kontrol ediyor.`;
}

function collectMatchContributions(preview) {
  const contributions = new Map();
  for (const fixture of preview.fixtures || []) {
    const playedIds = new Set();
    for (const event of fixture.events || []) {
      if (!event.playerId) continue;
      playedIds.add(event.playerId);
      const current = contributions.get(event.playerId) || { played: 0, goals: 0, shots: 0, fouls: 0, highlights: 0, agentActions: 0, decisionConfidence: 0, decisionRisk: 0, actionTypes: {}, lastDecision: null };
      if (event.type === "goal") current.goals += 1;
      if (event.type === "shot" || event.type === "goal") current.shots += 1;
      if (event.type === "foul") current.fouls += 1;
      if (event.type === "goal" || event.type === "shot" || event.type === "attack" || event.type === "pressure" || event.type === "foul") current.highlights += 1;
      if (event.agentDecision) {
        current.agentActions += 1;
        current.decisionConfidence += event.agentDecision.confidence || 0;
        current.decisionRisk += event.agentDecision.risk || 0;
        current.lastDecision = event.agentDecision;
        current.actionTypes[event.actionType || event.agentDecision.type] = (current.actionTypes[event.actionType || event.agentDecision.type] || 0) + 1;
        if (event.agentDecision.grfAction) {
          current.grfActions = current.grfActions || {};
          current.grfActions[event.agentDecision.grfAction] = (current.grfActions[event.agentDecision.grfAction] || 0) + 1;
        }
      }
      contributions.set(event.playerId, current);
    }
    for (const playerId of playedIds) {
      const current = contributions.get(playerId);
      if (current) current.played = 1;
    }
  }
  return contributions;
}

function updateSeasonStats(stats = {}, contribution = {}) {
  const agentActions = contribution.agentActions || 0;
  const avgConfidence = agentActions ? Math.round((contribution.decisionConfidence || 0) / agentActions) : 0;
  const avgRisk = agentActions ? Math.round((contribution.decisionRisk || 0) / agentActions) : 0;
  return {
    played: (stats.played || 0) + (contribution.played || 0),
    goals: (stats.goals || 0) + (contribution.goals || 0),
    shots: (stats.shots || 0) + (contribution.shots || 0),
    highlights: (stats.highlights || 0) + (contribution.highlights || 0),
    agentActions: (stats.agentActions || 0) + agentActions,
    avgDecisionConfidence: avgConfidence || stats.avgDecisionConfidence || 0,
    avgDecisionRisk: avgRisk || stats.avgDecisionRisk || 0,
    grfActionMix: mergeActionMix(stats.grfActionMix, contribution.grfActions)
  };
}

function mergeActionMix(existing = {}, incoming = {}) {
  const next = { ...existing };
  for (const [key, value] of Object.entries(incoming || {})) {
    next[key] = (next[key] || 0) + value;
  }
  return next;
}

function evolveAgentBrain(brain, contribution = {}, player = {}) {
  const base = brain || buildAgentBrain(player, 1);
  const actions = contribution.agentActions || 0;
  if (!actions) return base;
  const avgConfidence = Math.round((contribution.decisionConfidence || 0) / actions);
  const avgRisk = Math.round((contribution.decisionRisk || 0) / actions);
  const output = (contribution.goals || 0) * 14 + (contribution.shots || 0) * 4 + (contribution.highlights || 0) * 2;
  const lesson = output >= 12
    ? "Karar modeli ise yaradi"
    : avgRisk > 62
      ? "Riskli kararlar filtrelenecek"
      : avgConfidence < 48
        ? "Daha basit karar seti"
        : "Ritim korunacak";
  const topAction = Object.entries(contribution.actionTypes || {}).sort((a, b) => b[1] - a[1])[0]?.[0];
  const preferredActions = topAction && !(base.preferredActions || []).includes(topAction)
    ? [topAction, ...(base.preferredActions || [])].slice(0, 5)
    : base.preferredActions || [];
  return {
    ...base,
    aggression: clamp((base.aggression || 45) + (avgRisk > 68 ? -1 : output >= 10 ? 1 : 0), 10, 95),
    creativity: clamp((base.creativity || 45) + (["through_ball", "key_pass", "switch", "dribble"].includes(topAction) ? 1 : 0), 10, 96),
    discipline: clamp((base.discipline || 45) + (avgRisk > 70 ? 2 : avgConfidence >= 64 ? 1 : 0), 8, 98),
    learning: clamp((base.learning || 45) + Math.max(1, Math.round(actions / 2)), 10, 99),
    preferredActions,
    evolved: (base.evolved || 0) + 1,
    lastLesson: lesson,
    lastConfidence: avgConfidence,
    lastRisk: avgRisk
  };
}

export function advanceWeek(career, preparedPreview = null) {
  const week = career.week + 1;
  const requestedFocus = weeklyFocusProfile(career.weeklyFocus);
  const focusLockedByCash = (requestedFocus.cost || 0) > Math.max(0, career.money || 0);
  const focus = focusLockedByCash ? weeklyFocusProfile("balanced") : requestedFocus;
  const preview = preparedPreview || simulateWeekPreview(career);
  const resultsByClub = new Map();
  for (const fixture of preview.fixtures) {
    resultsByClub.set(fixture.homeId, { goalsFor: fixture.homeGoals, goalsAgainst: fixture.awayGoals });
    resultsByClub.set(fixture.awayId, { goalsFor: fixture.awayGoals, goalsAgainst: fixture.homeGoals });
  }
  const standings = career.standings.map((row) => {
    const result = resultsByClub.get(row.clubId);
    if (!result) return row;
    const win = result.goalsFor > result.goalsAgainst ? 1 : 0;
    const draw = result.goalsFor === result.goalsAgainst ? 1 : 0;
    const loss = result.goalsFor < result.goalsAgainst ? 1 : 0;
    return {
      ...row,
      played: row.played + 1,
      win: row.win + win,
      draw: row.draw + draw,
      loss: row.loss + loss,
      goalsFor: row.goalsFor + result.goalsFor,
      goalsAgainst: row.goalsAgainst + result.goalsAgainst,
      points: row.points + win * 3 + draw
    };
  });
  const contributions = collectMatchContributions(preview);
  const players = career.db.players.map((rawPlayer, index) => {
    const player = normalizePlayer(rawPlayer, week + index);
    const contribution = contributions.get(player.id) || { played: 0, goals: 0, shots: 0, highlights: 0, agentActions: 0, decisionConfidence: 0, decisionRisk: 0, actionTypes: {}, lastDecision: null };
    const impactScore = playerImpactScore(player, contribution);
    const delta = Math.round(seeded(week + index) * 8 - 3);
    const actualCeiling = player.hiddenPotential || player.potential;
    const growthChance = player.growthRate / 120 + (player.happiness - 50) / 240 - player.injuryRisk / 260;
    const growth = player.age <= 22 && player.overall < actualCeiling && delta > 1 && seeded(week + index + player.growthRate) < growthChance ? 1 : 0;
    const injuryHit = seeded(week + index + player.injuryRisk + 41) * 100 < player.injuryRisk ? -5 : 0;
    const form = clamp(player.form + delta, 35, 99);
    const moraleImpact = player.represented ? Math.round((career.reputation - 45) / 18) + (focus.playerCare || 0) : 0;
    const trustDrift = player.represented ? Math.round((player.happiness - 58) / 24) - (player.agencyContractUntil && player.agencyContractUntil - week <= 8 ? 1 : 0) : 0;
    const trustMood = player.represented ? Math.round(((player.agencyTrust ?? 52) - 50) / 18) : 0;
    const goalDelta = calculateGoalDelta(player, { form, growth, injuryHit, moraleImpact, trustMood });
    const club = career.db.clubs.find((item) => item.id === player.clubId);
    const aiValue = marketValueFromAI(player, impactScore, { clubReputation: club?.reputation || 45 });
    const valueFactor = 1 + (form - 70) / 260 + growth / 60 + Math.max(0, actualCeiling - player.potential) / 1200;
    const blendedValue = player.value * valueFactor * 0.55 + aiValue * 0.45;
    const scoutScore = scoutAIScore(career, { ...player, impactScore });
    const aiTags = [
      impactScore >= 72 ? "impact" : null,
      scoutScore >= 72 ? "undervalued" : null,
      player.injuryRisk >= 25 ? "injury-risk" : null,
      (player.hiddenPotential || player.potential) - player.overall >= 10 ? "upside" : null
    ].filter(Boolean);
    return {
      ...player,
      form: clamp(form + injuryHit, 25, 99),
      morale: clamp(player.morale + moraleImpact, 0, 100),
      happiness: clamp(player.happiness + moraleImpact + trustMood + (injuryHit ? -6 : 0), 0, 100),
      agencyTrust: player.represented ? clamp((player.agencyTrust ?? 52) + trustDrift + (injuryHit ? -2 : 0), 0, 100) : player.agencyTrust,
      goalProgress: clamp((player.goalProgress ?? player.careerGoal?.start ?? 40) + goalDelta, 0, 100),
      lastGoalDelta: goalDelta,
      seasonStats: updateSeasonStats(player.seasonStats, contribution),
      overall: clamp(player.overall + growth, 1, actualCeiling),
      impactScore,
      scoutAIScore: scoutScore,
      marketHeat: clamp(Math.round((player.marketHeat || 0) * 0.72) + (contribution.goals || 0) * 12 + (contribution.highlights || 0) * 2, 0, 100),
      activeCareerPlan: player.activeCareerPlan,
      planWeek: player.planWeek,
      agentBrain: evolveAgentBrain(player.agentBrain, contribution, player),
      lastAgentDecision: contribution.lastDecision,
      aiTags,
      value: roundMoney(Math.max(50000, blendedValue))
    };
  });
  const completedJobs = career.scoutJobs.filter((job) => job.dueWeek <= week);
  const activeJobs = career.scoutJobs.filter((job) => job.dueWeek > week);
  const discovered = completedJobs.map((job, index) => createProspect(job, career.db.players.length + index, week));
  const expiredCardItems = (career.pendingCards || []).filter((card) => card.expiresWeek && card.expiresWeek < week);
  const activePendingCards = dedupeCards((career.pendingCards || []).filter((card) => !card.expiresWeek || card.expiresWeek >= week));
  const expiredCards = expiredCardItems.length;
  const newCards = [...generateEthicsScandalCards(career, week, activePendingCards), ...generateGoalMilestoneCards(players, week, activePendingCards), ...generateWeeklyCards(career, week, activePendingCards)].slice(0, 4);
  const expiredPressure = expiredCards;
  const pressuredPlayers = expiredPressure
    ? players.map((player) => player.represented
      ? {
          ...player,
          agencyTrust: clamp((player.agencyTrust ?? 52) - expiredPressure * 2, 0, 100),
          happiness: clamp((player.happiness ?? player.morale ?? 60) - expiredPressure * 2, 0, 100),
          morale: clamp((player.morale ?? 60) - expiredPressure * 2, 0, 100)
        }
      : player)
    : players;
  const nextDb = { ...career.db, players: [...pressuredPlayers, ...discovered], clubs: updateClubNeeds(career.db.clubs, week) };
  const nextCareerBase = {
    ...career,
    week,
    money: career.money - (focus.cost || 0),
    scoutBoost: career.scoutBoost + (focus.scoutBoost || 0),
    negotiation: career.negotiation + (focus.negotiation || 0),
    mediaPower: clamp((career.mediaPower || 0) + (focus.media || 0), 0, 100),
    transferSeason: isTransferWindowWeek(week),
    seasonMonth: seasonMonthFromWeek(week),
    reputation: clamp(career.reputation + (getRepresentedPlayers(career).length > 2 ? 1 : 0) + (focus.reputation || 0) - expiredPressure, 0, 100),
    scoutJobs: activeJobs,
    pendingCards: [...activePendingCards, ...newCards].slice(-7),
    standings: standings.sort((a, b) => b.points - a.points || b.goalsFor - a.goalsFor),
    db: nextDb
  };
  const objectiveCareer = applyObjectiveProgress(nextCareerBase);
  const incomingOffers = generateIncomingOffers(objectiveCareer, week);
  const rivalPressure = generateRivalPressure(objectiveCareer, week);
  const rivalCareer = applyRivalPressure(objectiveCareer, rivalPressure, week);
  const marketIntel = generateMarketIntel(rivalCareer, incomingOffers, completedJobs.length, rivalPressure);
  const empireIncome = calculateEmpireIncome(rivalCareer);
  const performanceNews = buildPerformanceNews(rivalCareer);
  const annualReport = week > 52 ? buildAnnualReport(rivalCareer, empireIncome) : null;
  const weekNews = [
    focusLockedByCash ? `Kasa yetersiz kaldı; ${requestedFocus.label} planı iptal edilip dengeli hafta oynandı.` : null,
    focus.news,
    performanceNews,
    expiredCards ? `${expiredCards} kart süresi doldu; saygınlık ve güven baskı yedi.` : null,
    rivalPressure.length ? `${rivalPressure[0].rivalName}, ${rivalPressure[0].targetName || "bir yetenek"} için baskıyı artırdı.` : null,
    newCards.length ? `${newCards.length} yeni ajans kartı masaya geldi.` : null,
    empireIncome ? `Ajans imparatorluğu bu hafta ${formatMoney(empireIncome)} gelir getirdi.` : null,
    incomingOffers.length ? "Yeni kulüpler masaya ciddi teklifler getirdi." : null,
    completedJobs.length ? "news_scout_done" : null,
    !newCards.length && !expiredCards && !incomingOffers.length && !completedJobs.length ? "news_week" : null
  ].filter(Boolean);
  const finalCareer = {
    ...rivalCareer,
    annualReport,
    money: rivalCareer.money + empireIncome,
    empire: refreshEmpireLevel(rivalCareer).empire,
    incomingOffers,
    rivalPressure,
    marketIntel,
    news: [...weekNews, ...rivalCareer.news].filter(Boolean).slice(0, 20)
  };
  return updateCareerStory(finalCareer);
}

function buildFirstClientStory(career, player) {
  const weeksTogether = Math.max(0, (career.week || 1) - (player.agencySignedWeek || career.week || 1));
  const stats = player.seasonStats || {};
  const heat = player.marketHeat || 0;
  const trust = player.agencyTrust ?? 55;
  const goal = player.goalProgress ?? player.careerGoal?.start ?? 40;
  const plan = player.activeCareerPlan;
  const planLabels = {
    showcase: "vitrin dosyası",
    training: "özel antrenman",
    care: "oyuncu bakımı",
    pr: "PR vitrini"
  };

  if (heat >= 70) {
    return {
      chapter: "first-client-hot-market",
      title: "Telefon ilk kez ısınıyor",
      beat: `${player.name} artık sadece senin umudun değil, kulüplerin de radarında. Piyasa ısısı ${heat}/100; yanlış pazarlık ilk büyük fırsatı yakabilir.`,
      objective: "Kulüp ihtiyacı doğru olan masayı seç ve ilk ciddi pazarlığı hazırla.",
      tension: 63
    };
  }
  if ((stats.goals || 0) > 0 || (player.lastGoalDelta || 0) >= 6) {
    return {
      chapter: "first-client-on-pitch",
      title: "Saha ilk cevabı verdi",
      beat: `${player.name} maçlarda görünür olmaya başladı. Gol ${stats.goals || 0}, aksiyon ${stats.highlights || 0}; artık hikayeyi kulüplere satacak malzemen var.`,
      objective: "Vitrin planı veya PR hamlesiyle bu performansı teklife çevir.",
      tension: 52
    };
  }
  if (heat >= 35) {
    return {
      chapter: "first-client-rumour",
      title: "İlk fısıltılar başladı",
      beat: `${player.name} için piyasa ısısı ${heat}/100. Henüz resmi teklif yok ama scout masalarında adı geçmeye başladı.`,
      objective: "Formu koru, güveni düşürme ve doğru kulüp ihtiyacını takip et.",
      tension: 46
    };
  }
  if (trust < 45) {
    return {
      chapter: "first-client-trust-risk",
      title: "İlk çatlak güven tarafında",
      beat: `${player.name} ajansa tam bağlanmış değil. Güven ${trust}/100; hızlı para kovalamadan önce oyuncuyu kaybetmemek gerekiyor.`,
      objective: "Oyuncu bakımı veya bire bir görüşmeyle güveni toparla.",
      tension: 58
    };
  }
  if (weeksTogether <= 1) {
    return {
      chapter: "first-client-week-one",
      title: "İlk hafta, ilk sorumluluk",
      beat: `${player.name} imzayı attı ama piyasa henüz seni ciddiye almıyor. İlk haftanın işi transfer değil, güven ve görünürlük kurmak.`,
      objective: "Haftalık plan seç: vitrin, antrenman, bakım veya PR.",
      tension: 36
    };
  }
  if (weeksTogether <= 4) {
    return {
      chapter: `first-client-build-${weeksTogether}`,
      title: `${weeksTogether}. hafta: sabır testi`,
      beat: `${player.name} ile proje ilerliyor. Hedef ${goal}/100, piyasa ısısı ${heat}/100${plan ? `, aktif plan ${planLabels[plan] || "kariyer planı"}` : ""}. Büyük kapı hâlâ açılmadı.`,
      objective: "Bir planı üst üste uygulayıp oyuncunun hikayesini kulüplere okunur hale getir.",
      tension: 40 + weeksTogether * 3
    };
  }
  return {
    chapter: "first-client-long-build",
    title: "Proje artık bahanesiz",
    beat: `${player.name} ile birkaç hafta geride kaldı. Piyasa ısısı ${heat}/100; ya daha agresif vitrin yapmalı ya da doğru kulüple pazarlığı sen başlatmalısın.`,
    objective: "Oyuncunun kulüp ihtiyacını bul ve manuel pazarlık masasına gir.",
    tension: 55
  };
}

function updateCareerStory(career) {
  const represented = getRepresentedPlayers(career);
  const offers = career.incomingOffers || [];
  const urgentCards = (career.pendingCards || []).filter((card) => card.severity === "urgent");
  let stage = {
    chapter: "zero-agency",
    title: "Kiralık ofis, tek telefon",
    beat: `${career.agentName || "Ajans"} hâlâ ilk büyük güven anını arıyor. Piyasa seni izlemiyor; sen piyasayı izliyorsun.`,
    objective: "İlk temsil sözleşmesini kapat.",
    tension: 22
  };
  if (career.annualReport) {
    stage = {
      chapter: "season-review",
      title: "Sezon defteri kapanıyor",
      beat: "Ajans yıl sonu bilançosuna geldi. Artık sadece hayatta kalmak değil, gelecek sezonun hikayesini seçmek önemli.",
      objective: "Yıllık bilançoyu incele ve yeni sezona gir.",
      tension: 58
    };
  } else if (urgentCards.length) {
    stage = {
      chapter: "pressure-room",
      title: "Kapıda kriz var",
    beat: "Oyuncu, kulüp veya medya tarafından bekleyen kararlar masayı ısıtıyor. Masada kaçış yok; kabul ya da red seçilecek.",
      objective: "Gündemdeki acil kartı çöz.",
      tension: 76
    };
  } else if (career.reputation >= 55) {
    stage = {
      chapter: "known-agent",
      title: "Telefonlar artık çalıyor",
      beat: "Alt liglerin dışına taşan bir ismin var. Daha büyük oyuncular için etik, medya ve kulüp ilişkisi daha kritik.",
      objective: "Portföyü büyütürken ilişkileri yakma.",
      tension: 64
    };
  } else if (represented.length >= 3) {
    stage = {
      chapter: "small-stable",
      title: "Küçük bir ahır kuruldu",
      beat: "Artık sadece oyuncu aramıyorsun; portföy yönetiyorsun. Her mutsuz oyuncu rakip ajana açık kapı.",
      objective: "3 oyuncunun güvenini koru ve ilk ciddi teklifi kovala.",
      tension: 51
    };
  } else if (offers.length) {
    stage = {
      chapter: "first-table",
      title: "Masada ilk ciddi teklif",
      beat: "Bir kulüp artık seni muhatap alıyor. Komisyon için fazla zorlarsan oyuncu kariyeri ve kulüp ilişkisi hasar alır.",
      objective: "Pazarlıkta doğru taktiği seç.",
      tension: 67
    };
  } else if (represented.length >= 1) {
    stage = buildFirstClientStory(career, represented[0]);
  }
  const previous = career.story || initialCareerStory(career.agentName);
  const changed = previous.chapter !== stage.chapter || previous.title !== stage.title || previous.beat !== stage.beat || previous.objective !== stage.objective;
  const logEntry = {
    week: career.week || 1,
    title: stage.title,
    body: stage.beat
  };
  const lastLog = (previous.log || [])[0];
  const shouldLog = changed && !(lastLog?.week === logEntry.week && lastLog?.title === logEntry.title);
  return {
    ...career,
    story: {
      ...stage,
      log: shouldLog ? [logEntry, ...(previous.log || [])].slice(0, 8) : previous.log || [logEntry]
    }
  };
}

export function buildAnnualReport(career, pendingIncome = 0) {
  const represented = getRepresentedPlayers(career);
  const portfolioValue = represented.reduce((sum, player) => sum + (player.value || 0), 0);
  const commissions = Math.max(0, (career.money || 0) - 325000);
  const bestPlayer = represented.sort((a, b) => (b.value || 0) - (a.value || 0))[0];
  const totalGoals = represented.reduce((sum, player) => sum + (player.seasonStats?.goals || 0), 0);
  const totalHighlights = represented.reduce((sum, player) => sum + (player.seasonStats?.highlights || 0), 0);
  const avgTrust = represented.length
    ? Math.round(represented.reduce((sum, player) => sum + (player.agencyTrust ?? 50), 0) / represented.length)
    : 0;
  const completedObjectives = (career.objectives || []).filter((item) => item.completed).length;
  const agencyScore = (career.reputation || 0) + represented.length * 8 + Math.round(portfolioValue / 1000000) + completedObjectives * 5;
  const grade = agencyScore >= 95 ? "A" : agencyScore >= 72 ? "B" : agencyScore >= 50 ? "C" : represented.length ? "D" : "E";
  return {
    season: career.season,
    year: career.seasonYear || career.season,
    represented: represented.length,
    portfolioValue,
    money: career.money + pendingIncome,
    reputation: career.reputation,
    commissions,
    sponsors: career.empire?.sponsors?.length || 0,
    staff: career.empire?.staff?.length || 0,
    bestPlayerName: bestPlayer?.name || null,
    totalGoals,
    totalHighlights,
    avgTrust,
    completedObjectives,
    grade,
    summary: represented.length
      ? `${represented.length} oyunculuk portföy ${formatMoney(portfolioValue)} değere ulaştı.`
      : "Ajans bu sezon oyuncu imzalamadan kapattı; yeni sezonda scout ve ikna öncelikli olmalı."
  };
}

export function startNextSeason(career) {
  const nextSeason = (career.season || 2026) + 1;
  return {
    ...career,
    week: 1,
    season: nextSeason,
    seasonYear: nextSeason,
    seasonMonth: "Haziran",
    transferSeason: true,
    annualReport: null,
    pendingCards: [],
    incomingOffers: [],
    scoutJobs: [],
    standings: buildStandings(career.db).filter((row) => {
      const leagueId = career.selectedLeagueId;
      if (!leagueId) return true;
      return career.db.clubs.some((club) => club.id === row.clubId && club.leagueId === leagueId);
    }),
    db: {
      ...career.db,
      players: career.db.players.map((player) => ({
        ...player,
        seasonStats: { played: 0, goals: 0, shots: 0, highlights: 0 },
        lastGoalDelta: 0,
        form: clamp((player.form || 65) + Math.round(seeded(nextSeason + (player.value || 0) / 100000) * 8 - 3), 35, 95)
      }))
    },
    news: [`${nextSeason} sezonu Haziran kampıyla başladı. Transfer dönemi açık.`, ...career.news].slice(0, 20)
  };
}

function applyObjectiveProgress(career) {
  const represented = getRepresentedPlayers(career);
  const portfolioValue = represented.reduce((sum, player) => sum + (player.value || 0), 0);
  const sponsorCount = (career.empire?.sponsors?.length || 0)
    + represented.reduce((sum, player) => sum + (player.endorsements?.length || 0), 0);
  const metrics = {
    represented: represented.length,
    reputation: career.reputation || 0,
    portfolioValue,
    sponsors: sponsorCount,
    staff: career.empire?.staff?.length || 0
  };
  const existing = career.objectives?.length ? career.objectives : createObjectives();
  let money = career.money;
  let reputation = career.reputation;
  let negotiation = career.negotiation || 0;
  let scoutBoost = career.scoutBoost || 0;
  let mediaPower = career.mediaPower || 0;
  const rewardNews = [];
  const objectives = existing.map((objective) => {
    const template = objectiveTemplates.find((item) => item.id === objective.id) || objective;
    const progress = Math.min(template.target || 1, metrics[template.metric] || objective.progress || 0);
    if (objective.completed || progress < (template.target || 1)) {
      return { ...template, ...objective, progress };
    }
    const reward = template.reward || {};
    money += reward.money || 0;
    reputation = clamp(reputation + (reward.reputation || 0), 0, 100);
    negotiation += reward.negotiation || 0;
    scoutBoost += reward.scoutBoost || 0;
    mediaPower = clamp(mediaPower + (reward.mediaPower || 0), 0, 100);
    rewardNews.push(`Hedef tamamlandı: ${template.title}. Ödül kasaya yazıldı.`);
    return { ...template, ...objective, progress, completed: true, completedWeek: career.week };
  });
  return applyAchievementProgress({
    ...career,
    money,
    reputation,
    negotiation,
    scoutBoost,
    mediaPower,
    objectives,
    news: [...rewardNews, ...career.news]
  });
}

export function applyAchievementProgress(career) {
  const represented = getRepresentedPlayers(career);
  const portfolioValue = represented.reduce((sum, player) => sum + (player.value || 0), 0);
  const sponsorCount = (career.empire?.sponsors?.length || 0)
    + represented.reduce((sum, player) => sum + (player.endorsements?.length || 0), 0);
  const totalGoals = represented.reduce((sum, player) => sum + (player.seasonStats?.goals || 0), 0);
  const metrics = {
    represented: represented.length,
    reputation: career.reputation || 0,
    portfolioValue,
    sponsors: sponsorCount,
    staff: career.empire?.staff?.length || 0,
    cardsResolved: career.stats?.cardsResolved || 0,
    dealsAccepted: career.stats?.dealsAccepted || 0,
    totalGoals,
    money: career.money || 0
  };
  const existing = career.achievements?.length ? career.achievements : createAchievements();
  let money = career.money;
  let reputation = career.reputation;
  let negotiation = career.negotiation || 0;
  let scoutBoost = career.scoutBoost || 0;
  let mediaPower = career.mediaPower || 0;
  const rewardNews = [];
  const achievements = existing.map((achievement) => {
    const template = achievementTemplates.find((item) => item.id === achievement.id) || achievement;
    const progress = Math.min(template.target || 1, metrics[template.metric] || achievement.progress || 0);
    if (achievement.completed || progress < (template.target || 1)) {
      return { ...template, ...achievement, progress };
    }
    const reward = template.reward || {};
    money += reward.money || 0;
    reputation = clamp(reputation + (reward.reputation || 0), 0, 100);
    negotiation += reward.negotiation || 0;
    scoutBoost += reward.scoutBoost || 0;
    mediaPower = clamp(mediaPower + (reward.mediaPower || 0), 0, 100);
    rewardNews.push(`Başarım açıldı: ${template.title}.`);
    return { ...template, ...achievement, progress, completed: true, completedWeek: career.week };
  });
  return {
    ...career,
    money,
    reputation,
    negotiation,
    scoutBoost,
    mediaPower,
    achievements,
    news: [...rewardNews, ...career.news].slice(0, 20)
  };
}

function weeklyFocusProfile(focus = "balanced") {
  const profiles = {
    balanced: { label: "Dengeli", news: "Ajans haftayı dengeli planla geçirdi." },
    scout: { label: "Scout", cost: 12000, scoutBoost: 1, news: "Scout haftası: rapor ağı ve yetenek havuzu güçlendi." },
    negotiation: { label: "Pazarlık", cost: 15000, negotiation: 1, news: "Pazarlık haftası: kulüp masalarına hazırlık yapıldı." },
    pr: { label: "PR", cost: 18000, media: 1, reputation: 1, news: "PR haftası: ajans görünürlüğü arttırıldı." },
    care: { label: "Oyuncu Bakımı", cost: 10000, playerCare: 2, news: "Oyuncu bakımı haftası: portföy morali desteklendi." }
  };
  return profiles[focus] || profiles.balanced;
}

function dedupeCards(cards) {
  const seen = new Set();
  return cards.filter((card) => {
    const key = card.templateId || `${card.source}-${card.titleKey}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function generateWeeklyCards(career, week, activeCards = []) {
  const eventRoll = seeded(week + career.reputation + getRepresentedPlayers(career).length * 13);
  const focusEventBonus = career.weeklyFocus === "pr" || career.weeklyFocus === "care" ? 1 : 0;
  const baseDesired = eventRoll > 0.88 ? 3 : eventRoll > 0.58 ? 2 : 1;
  const desired = Math.min(3, Math.max(1, baseDesired + focusEventBonus));
  const ownedSponsors = career.empire?.sponsors?.length || 0;
  const staffCount = career.empire?.staff?.length || 0;
  const activeTemplateIds = new Set(activeCards.map((card) => card.templateId || card.id));
  const activeTitleKeys = new Set(activeCards.map((card) => card.titleKey));
  const weighted = eventDeck
    .filter((template) => !activeTemplateIds.has(template.id) && !activeTitleKeys.has(template.titleKey))
    .map((template, index) => {
      let weight = seeded(week + index + career.reputation / 8);
      if (template.source === "sponsor") weight += ownedSponsors ? 0.18 : 0.04;
      if (template.source === "tournament") weight += career.scoutBoost / 120;
      if (career.weeklyFocus === "scout" && (template.source === "tournament" || template.source === "player")) weight += 0.18;
      if (career.weeklyFocus === "negotiation" && template.source === "club") weight += 0.2;
      if (career.weeklyFocus === "pr" && (template.source === "media" || template.source === "sponsor")) weight += 0.2;
      if (career.weeklyFocus === "care" && (template.source === "player" || template.source === "talk")) weight += 0.22;
      if (template.source === "legend") weight += career.reputation > 55 ? 0.22 : -0.1;
      if (template.source === "finance") weight += career.empire?.upgrades?.includes("club-shares") ? 0.24 : 0.03;
      if (template.source === "talk") weight += getRepresentedPlayers(career).length / 20;
      if (template.source === "media") weight += staffCount ? 0.1 : 0;
      return { template, weight, index };
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, desired);
  const regularCards = weighted.map(({ template, index }) => buildEventCard(template, week, index));
  const contractCards = generateContractCards(career, week, activeCards);
  return [...contractCards, ...regularCards].slice(0, Math.max(desired, contractCards.length));
}

function generateContractCards(career, week, activeCards = []) {
  const activePlayerCards = new Set(activeCards.filter((card) => card.playerId).map((card) => `${card.templateId}-${card.playerId}`));
  return getRepresentedPlayers(career)
    .filter((player) => {
      const weeksLeft = (player.agencyContractUntil || 999) - week;
      return weeksLeft <= 8 || (player.agencyTrust ?? 55) < 38;
    })
    .sort((a, b) => (a.agencyContractUntil || 999) - (b.agencyContractUntil || 999) || (a.agencyTrust ?? 55) - (b.agencyTrust ?? 55))
    .slice(0, 1)
    .map((player, index) => {
      const weeksLeft = Math.max(0, (player.agencyContractUntil || week) - week);
      const templateId = "contract-renewal";
      if (activePlayerCards.has(`${templateId}-${player.id}`)) return null;
      return {
        id: `${templateId}-${player.id}-${week}-${index}`,
        templateId,
        playerId: player.id,
        source: "talk",
        severity: weeksLeft <= 2 || (player.agencyTrust ?? 55) < 30 ? "urgent" : "risk",
        titleKey: `${player.name} sözleşme masası`,
        bodyKey: weeksLeft <= 8
          ? `${player.name} ile temsil sözleşmesinin bitmesine ${weeksLeft} hafta kaldı. Yenileme primi isterse ajans güveni artar.`
          : `${player.name} ajansa güvenini kaybediyor. Konuşma ve garanti isteyebilir.`,
        accept: { money: -roundMoney(Math.max(20000, player.value * 0.006)), reputation: 1, morale: 5, newsKey: `${player.name} ile temsil sözleşmesi yenilendi.` },
        decline: { reputation: -2, morale: -5, newsKey: `${player.name} sözleşme görüşmesinden memnun ayrılmadı.` },
        weekCreated: week,
        expiresWeek: week + 2
      };
    })
    .filter(Boolean);
}

function generateEthicsScandalCards(career, week, activeCards = []) {
  const ethics = career.ethics ?? 72;
  if (ethics >= 56) return [];
  const activeTemplateIds = new Set(activeCards.map((card) => card.templateId || card.id));
  const templateId = "ethics-scandal";
  if (activeTemplateIds.has(templateId)) return [];
  const risk = clamp(62 - ethics, 8, 42);
  if (seeded(week + ethics + (career.reputation || 0)) * 100 > risk) return [];
  return [{
    id: `${templateId}-${week}`,
    templateId,
    source: "media",
    severity: ethics < 36 ? "urgent" : "risk",
    titleKey: "Etik Soruşturma",
    bodyKey: "Son pazarlık hamlelerin basında soru işareti yarattı. Avukat ve PR ekibiyle dosyayı kapatabilirsin, yoksa itibar daha sert düşer.",
    accept: { money: -55000, reputation: 1, ethics: 7, newsKey: "Etik soruşturma büyümeden kapatıldı." },
    decline: { reputation: -5, ethics: -6, morale: -2, newsKey: "Etik kriz ajansın üzerine yapıştı." },
    weekCreated: week,
    expiresWeek: week + 1
  }];
}

function generateGoalMilestoneCards(players, week, activeCards = []) {
  const activePlayerCards = new Set(activeCards.filter((card) => card.playerId).map((card) => `${card.templateId}-${card.playerId}`));
  return players
    .filter((player) => player.represented && (player.goalProgress || 0) >= 92 && (player.lastGoalDelta || 0) > 0)
    .sort((a, b) => (b.goalProgress || 0) - (a.goalProgress || 0))
    .slice(0, 1)
    .map((player, index) => {
      const templateId = "goal-breakthrough";
      if (activePlayerCards.has(`${templateId}-${player.id}`)) return null;
      const investment = roundMoney(Math.max(35000, (player.value || 1000000) * 0.004));
      return {
        id: `${templateId}-${player.id}-${week}-${index}`,
        templateId,
        playerId: player.id,
        source: "player",
        severity: "opportunity",
        titleKey: `${player.name} için kariyer sıçraması`,
        bodyKey: `${player.name}, "${player.careerGoal?.label || "kariyer hedefi"}" hedefinde son düzlüğe girdi. Doğru PR ve kulüp teması oyuncunun değerini zıplatabilir.`,
        accept: { money: -investment, reputation: 3, morale: 5, newsKey: `${player.name} kariyer hedefinde vitrine çıkarıldı.` },
        decline: { reputation: -1, morale: -3, newsKey: `${player.name} için kariyer fırsatı beklemeye alındı.` },
        weekCreated: week,
        expiresWeek: week + 2
      };
    })
    .filter(Boolean);
}

function buildPerformanceNews(career) {
  const best = getRepresentedPlayers(career)
    .filter((player) => player.lastGoalDelta || player.seasonStats?.goals || player.seasonStats?.highlights)
    .sort((a, b) => ((b.lastGoalDelta || 0) * 3 + (b.seasonStats?.goals || 0) * 2 + (b.form || 0) / 20) - ((a.lastGoalDelta || 0) * 3 + (a.seasonStats?.goals || 0) * 2 + (a.form || 0) / 20))[0];
  if (!best) return null;
  if ((best.lastGoalDelta || 0) >= 5) return `${best.name} kariyer hedefinde büyük ilerleme kaydetti.`;
  if ((best.seasonStats?.goals || 0) > 0) return `${best.name} sezon vitrininin en sıcak ismi oldu: ${best.seasonStats.goals} gol.`;
  return `${best.name} bu hafta ajans portföyünde öne çıktı.`;
}

function calculateGoalDelta(player, context) {
  const goalId = player.careerGoal?.id || inferCareerGoal(player).id;
  const formDelta = Math.round((context.form - 66) / 9);
  const trustDelta = player.represented ? Math.round(((player.agencyTrust ?? 52) - 50) / 22) : 0;
  const injuryPenalty = context.injuryHit ? -5 : 0;
  const base = context.growth ? 5 : 0;
  if (goalId === "breakout") return base + formDelta + trustDelta + injuryPenalty + (player.age <= 21 ? 1 : 0);
  if (goalId === "big_contract") return Math.round((player.value || 0) / 8000000) + formDelta + trustDelta + injuryPenalty;
  if (goalId === "stability") return (context.form >= 64 ? 3 : -1) + Math.round((player.happiness - 55) / 18) + injuryPenalty;
  if (goalId === "brand") return formDelta + Math.round((player.endorsements?.length || 0) * 3) + Math.round((player.ego - 45) / 20) + trustDelta;
  return base + formDelta + Math.round((player.happiness - 55) / 20) + injuryPenalty;
}

function calculateEmpireIncome(career) {
  const upgrades = empireUpgrades.filter((item) => career.empire?.upgrades?.includes(item.id)).reduce((sum, item) => sum + (item.income || 0), 0);
  const sponsors = sponsorDeals.filter((item) => career.empire?.sponsors?.includes(item.id)).reduce((sum, item) => sum + (item.weeklyIncome || 0), 0);
  const staffCost = staffCandidates.filter((item) => career.empire?.staff?.includes(item.id)).reduce((sum, item) => sum + (item.weeklyCost || 0), 0);
  const playerSponsors = career.db.players.reduce((sum, player) => {
    return sum + (player.endorsements || []).filter((deal) => !deal.expiresWeek || deal.expiresWeek >= career.week).reduce((total, deal) => total + (deal.weeklyIncome || 0), 0);
  }, 0);
  return upgrades + sponsors + playerSponsors - staffCost;
}

function pickBrandName(player, week) {
  const brands = {
    ST: ["Striker Boots", "GoalRush", "Nine Sport"],
    GK: ["SafeHands", "Wall Gloves", "CleanSheet"],
    LW: ["FlashWing", "StreetSkill", "Velocity"],
    CM: ["TempoWear", "Midfield Lab", "Passline"],
    AM: ["Vision Play", "CreatorX", "Final Pass"],
    CB: ["IronBack", "BlockPro", "Aerial"]
  };
  const list = brands[player.position] || ["Elite Sport", "Prime Wear", "NextGen"];
  return list[Math.floor(seeded(week + player.value / 100000) * list.length)];
}

function refreshEmpireLevel(career) {
  const score = career.reputation + (career.empire?.upgrades?.length || 0) * 8 + (career.empire?.sponsors?.length || 0) * 6 + (career.empire?.staff?.length || 0) * 4;
  const level = score >= 105 ? "Federation Candidate" : score >= 80 ? "Club President Path" : score >= 58 ? "Agency Owner" : "Agent";
  return { ...career, empire: { ...career.empire, level } };
}

function updateClubNeeds(clubs, week) {
  const needs = ["ST", "CM", "AM", "CB", "GK", "LW"];
  return clubs.map((club, index) => {
    if (seeded(week + index + club.reputation) < 0.38) return club;
    return {
      ...club,
      need: needs[Math.floor(seeded(week + index + 90) * needs.length)],
      relation: clamp(club.relation + Math.round(seeded(week + index + 140) * 6 - 2), 0, 100)
    };
  });
}

function generateIncomingOffers(career, week) {
  if (!career.transferSeason) return [];
  const represented = getRepresentedPlayers(career).map((player) => normalizePlayer(player, week));
  const offers = [];
  for (const player of represented) {
    const justSigned = player.agencySignedWeek && week - player.agencySignedWeek < 3;
    if (justSigned && career.reputation < 30 && (player.form || 60) < 82 && (player.marketHeat || 0) < 24) continue;
    const candidates = career.db.clubs
      .filter((club) => club.id !== player.clubId && club.budget > player.value * 0.55)
      .map((club) => {
        const normalizedClub = normalizeClub(club);
        const fit = (normalizedClub.need === player.position ? 28 : 0) + normalizedClub.reputation * 0.28 + normalizedClub.relation * 0.18 + career.reputation * 0.24 + player.form * 0.12 + (player.marketHeat || 0) * 0.32 + (player.personality === "money" ? normalizedClub.budget / 12000000 : 0);
        return { club, fit };
      })
      .sort((a, b) => b.fit - a.fit);
    const best = candidates[0];
    if (!best) continue;
    const interestRoll = seeded(week + player.value / 100000 + best.club.reputation);
    const focusOfferBoost = career.weeklyFocus === "negotiation" ? 0.12 : 0;
    const heatBoost = Math.min(0.22, (player.marketHeat || 0) / 320);
    if (interestRoll < 0.46 - focusOfferBoost - heatBoost) continue;
    const offer = buildOffer(career, player.id, best.club.id);
    offers.push({
      ...offer,
      id: `incoming-${week}-${player.id}-${best.club.id}`,
      fitScore: clamp(Math.round(best.fit), 1, 100),
      urgency: best.club.need === player.position ? "high" : "normal",
      expiresWeek: week + 2
    });
  }
  return offers.slice(0, 4);
}

function generateRivalPressure(career, week) {
  const targets = career.db.players
    .map((player) => normalizePlayer(player, week))
    .filter((player) => !player.represented && player.potential >= 80)
    .sort((a, b) => b.potential + b.form - (a.potential + a.form))
    .slice(0, 3);
  return targets
    .map((player, index) => {
      const rival = (career.rivals || [])[index % Math.max(1, (career.rivals || []).length)];
      const heat = clamp(Math.round((rival?.reputation || 35) * 0.4 + (rival?.aggression || 50) * 0.35 + player.ego * 0.18 + seeded(week + index) * 20), 1, 100);
      const styles = ["para vaadi", "kulüp bağlantısı", "medya vitrini", "aile teması"];
      return {
        playerId: player.id,
        targetName: player.name,
        rivalName: rival?.name || "Rakip Ajan",
        heat,
        style: styles[Math.floor(seeded(week + index + heat) * styles.length)],
        expiresWeek: week + 2
      };
    })
    .filter((item) => item.heat > 48);
}

function applyRivalPressure(career, pressure, week) {
  if (!pressure.length) return career;
  const pressureByPlayer = new Map(pressure.map((item) => [item.playerId, item]));
  return {
    ...career,
    db: {
      ...career.db,
      players: career.db.players.map((player) => {
        const hit = pressureByPlayer.get(player.id);
        if (!hit || player.represented) return player;
        return {
          ...player,
          rivalInterest: {
            rivalName: hit.rivalName,
            heat: hit.heat,
            style: hit.style,
            week
          },
          loyalty: clamp((player.loyalty ?? 55) - Math.round(hit.heat / 45), 0, 100),
          happiness: clamp((player.happiness ?? player.morale ?? 60) + (player.personality === "media" ? 1 : 0), 0, 100)
        };
      })
    }
  };
}

export function buildAgencyRankings(career) {
  const represented = getRepresentedPlayers(career);
  const portfolioValue = represented.reduce((sum, player) => sum + (player.value || 0), 0);
  const userScore = Math.round((career.reputation || 0) * 1.25 + represented.length * 7 + Math.log10(Math.max(1, portfolioValue)) * 8 + (career.empire?.staff?.length || 0) * 3);
  const rivals = (career.rivals || []).map((rival, index) => ({
    id: rival.id,
    name: rival.name,
    score: Math.round((rival.reputation || 35) * 1.15 + (rival.aggression || 45) * 0.28 + index * 3),
    heat: rival.aggression || 50,
    isUser: false
  }));
  return [
    { id: "user-agency", name: career.agentName || "Ajans", score: userScore, heat: Math.max(0, ...(career.rivalPressure || []).map((item) => item.heat || 0)), isUser: true },
    ...rivals
  ].sort((a, b) => b.score - a.score);
}

function generateMarketIntel(career, offers, scoutDone, rivalPressure = []) {
  const hotNeed = career.db.clubs.reduce((acc, club) => {
    acc[club.need] = (acc[club.need] || 0) + 1;
    return acc;
  }, {});
  const topNeed = Object.entries(hotNeed).sort((a, b) => b[1] - a[1])[0]?.[0] || "ST";
  const bestPlayer = getRepresentedPlayers(career).sort((a, b) => b.form + b.potential - (a.form + a.potential))[0];
  return [
    `${topNeed} pazarı hareketli: birden fazla kulüp bu mevkiyi öncelik yapıyor.`,
    offers.length ? `${offers.length} kulüp ciddi görüşme için masaya geldi.` : "Bu hafta ciddi teklif yok; saygınlık veya oyuncu-kulüp uyumunu artır.",
    bestPlayer ? `${bestPlayer.name} form ve potansiyel olarak en dikkat çeken oyuncun.` : "Daha iyi piyasa bilgisi için temsil ettiğin oyuncu sayısını artır.",
    rivalPressure.length ? `${rivalPressure[0].rivalName}, bir yetenek için bastırıyor. Geç kalırsan oyuncu kapılabilir.` : "Rakip ajan baskısı düşük, scout raporlarını fırsata çevir.",
    scoutDone ? "Yeni scout raporları veritabanına oyuncu ekledi." : "Scout ağı bu hafta sessiz."
  ];
}

function createProspect(job, index, week) {
  const positions = ["ST", "CM", "AM", "CB", "GK", "LW"];
  const base = 55 + Math.round(seeded(week + index) * 17);
  const potential = clamp(base + 8 + Math.round(job.quality / 5), base + 1, 92);
  const hiddenPotential = clamp(potential + Math.round(seeded(week + index + 99) * 12 - 5), base + 1, 96);
  const injuryRisk = 10 + Math.round(seeded(week + index + 17) * 24);
  const personalities = ["loyal", "money", "ambitious", "media", "troubled", "professional"];
  return {
    id: `scouted-${week}-${index}`,
    name: generatePlayerName(job.countryId, week * 31 + index * 13),
    generatedName: true,
    countryId: job.countryId,
    clubId: null,
    position: positions[index % positions.length],
    age: 17 + Math.floor(seeded(index + week) * 5),
    overall: base,
    potential,
    hiddenPotential,
    scoutConfidence: job.quality,
    value: roundMoney(650000 + base * 45000),
    wage: roundMoney(5000 + base * 180),
    form: 65,
    morale: 62,
    happiness: 60 + Math.round(seeded(week + index + 5) * 18),
    ego: 35 + Math.round(seeded(week + index + 7) * 45),
    loyalty: 35 + Math.round(seeded(week + index + 13) * 50),
    injuryRisk,
    growthRate: 42 + Math.round(seeded(week + index + 21) * 48),
    personality: personalities[index % personalities.length],
    story: hiddenPotential > potential + 4 ? "Düşük profilli ama gizli tavanı yüksek." : "Scout raporlarında dikkat çeken genç yetenek.",
    represented: false,
    scouted: true,
    discoveredByScout: true,
    impactScore: 38 + Math.round(seeded(week + index + 66) * 28),
    scoutAIScore: clamp(Math.round((hiddenPotential - base) * 2.4 + job.quality * 0.55 - injuryRisk * 0.4), 1, 99),
    aiTags: hiddenPotential > potential + 4 ? ["hidden-upside"] : ["scout-watch"]
  };
}

export function validateDataPackManifest(manifest, database) {
  const errors = [];
  if (!manifest || typeof manifest !== "object") errors.push("manifest_missing");
  if (!manifest?.name) errors.push("manifest_name_missing");
  if (!manifest?.version) errors.push("manifest_version_missing");
  const sources = [
    ...(Array.isArray(manifest?.sources) ? manifest.sources : []),
    ...(Array.isArray(database?.meta?.sources) ? database.meta.sources : []),
    ...(Array.isArray(database?.meta?.dataSources) ? database.meta.dataSources : [])
  ];
  for (const source of sources) {
    const license = source?.license || source?.licenses?.[0]?.name;
    if (!isRedistributableLicense(license)) {
      errors.push(`source_license_blocked:${source?.name || source?.url || "unknown"}`);
    }
  }
  if (!database?.countries?.length) errors.push("countries_missing");
  if (!database?.leagues?.length) errors.push("leagues_missing");
  if (!database?.clubs?.length) errors.push("clubs_missing");
  if (!database?.players?.length) errors.push("players_missing");
  return { ok: errors.length === 0, errors };
}
