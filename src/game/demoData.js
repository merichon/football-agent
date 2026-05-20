const countrySeeds = [
  { id: "tr", name: "Turkiye", prefix: "Anatolia" },
  { id: "en", name: "England", prefix: "Island" },
  { id: "es", name: "Spain", prefix: "Iberia" },
  { id: "de", name: "Germany", prefix: "Rhine" },
  { id: "it", name: "Italy", prefix: "Calcio" },
  { id: "fr", name: "France", prefix: "Hexa" },
  { id: "nl", name: "Netherlands", prefix: "Orange" },
  { id: "pt", name: "Portugal", prefix: "Atlantic" },
  { id: "br", name: "Brazil", prefix: "Samba" },
  { id: "ar", name: "Argentina", prefix: "Pampa" }
];

const leagueSeeds = countrySeeds.flatMap((country) => [1, 2, 3].map((tier) => ({
  id: `${country.id}-${tier}`,
  countryId: country.id,
  name: `${country.prefix} ${tier === 1 ? "Premier" : tier === 2 ? "Second" : "Third"}`,
  reputation: tier === 1 ? 72 : tier === 2 ? 55 : 38,
  tier
})));

const tournamentLeagues = [
  { id: "eu-cl", countryId: "intl", name: "Continental Champions League", reputation: 96, tier: 0, tournament: true },
  { id: "eu-youth", countryId: "intl", name: "Youth Champions Cup", reputation: 70, tier: 0, tournament: true }
];

const clubNames = ["Eagles", "Lions", "Port", "Rovers"];
const generatedClubs = leagueSeeds.flatMap((league, leagueIndex) => clubNames.map((name, clubIndex) => {
  const country = countrySeeds.find((item) => item.id === league.countryId);
  const rep = Math.max(25, league.reputation + 5 - clubIndex * 4);
  return {
    id: `${league.id}-${clubIndex + 1}`,
    leagueId: league.id,
    name: `${country.prefix} ${name} ${league.tier}`,
    budget: Math.round((league.tier === 1 ? 52000000 : league.tier === 2 ? 16000000 : 4200000) * (1 - clubIndex * 0.13)),
    reputation: rep,
    need: ["ST", "CM", "GK", "CB"][clubIndex % 4],
    relation: 35 + ((leagueIndex + clubIndex) % 18),
    negotiationHardness: Math.max(25, rep - 12 + clubIndex * 3),
    transferPolicy: league.tier === 1 ? "star" : league.tier === 2 ? "develop" : "value"
  };
}));

const tournamentClubs = [
  { id: "champions-north", leagueId: "eu-cl", name: "Northern Champions", budget: 220000000, reputation: 94, need: "AM", relation: 25, negotiationHardness: 86, transferPolicy: "galactic" },
  { id: "champions-south", leagueId: "eu-cl", name: "Southern Crown", budget: 190000000, reputation: 91, need: "ST", relation: 26, negotiationHardness: 82, transferPolicy: "star" },
  { id: "champions-east", leagueId: "eu-cl", name: "Eastern Royals", budget: 160000000, reputation: 88, need: "CB", relation: 28, negotiationHardness: 78, transferPolicy: "technical" },
  { id: "champions-west", leagueId: "eu-cl", name: "Western Union", budget: 150000000, reputation: 87, need: "CM", relation: 29, negotiationHardness: 76, transferPolicy: "pressing" },
  { id: "youth-stars", leagueId: "eu-youth", name: "Youth Stars XI", budget: 24000000, reputation: 68, need: "LW", relation: 42, negotiationHardness: 48, transferPolicy: "academy" },
  { id: "future-elite", leagueId: "eu-youth", name: "Future Elite", budget: 28000000, reputation: 70, need: "ST", relation: 40, negotiationHardness: 52, transferPolicy: "academy" }
];

const corePlayers = [
  { id: "p1", countryId: "tr", clubId: "tr-3-1", position: "ST", age: 18, overall: 58, potential: 84, hiddenPotential: 89, value: 420000, wage: 1800, form: 68, morale: 62, happiness: 66, ego: 54, loyalty: 72, injuryRisk: 18, growthRate: 78, personality: "ambitious", story: "Küçük şehirden çıkan hızlı forvet.", represented: false, scouted: true, scoutConfidence: 62 },
  { id: "p2", countryId: "tr", clubId: "tr-2-2", position: "GK", age: 22, overall: 63, potential: 79, hiddenPotential: 81, value: 760000, wage: 3200, form: 71, morale: 66, happiness: 70, ego: 38, loyalty: 81, injuryRisk: 12, growthRate: 48, personality: "loyal", story: "Sakin karakterli, güvenilir kaleci.", represented: false, scouted: true, scoutConfidence: 70 },
  { id: "p3", countryId: "en", clubId: "en-3-2", position: "LW", age: 20, overall: 61, potential: 87, hiddenPotential: 84, value: 620000, wage: 2900, form: 74, morale: 60, happiness: 58, ego: 76, loyalty: 43, injuryRisk: 22, growthRate: 67, personality: "media", story: "Sosyal medyada büyük ilgi gören kanat.", represented: false, scouted: true, scoutConfidence: 55 },
  { id: "p4", countryId: "es", clubId: "es-3-3", position: "CM", age: 19, overall: 60, potential: 88, hiddenPotential: 92, value: 580000, wage: 2600, form: 69, morale: 72, happiness: 74, ego: 62, loyalty: 56, injuryRisk: 16, growthRate: 82, personality: "ambitious", story: "Geç parlayabilecek teknik orta saha.", represented: false, scouted: true, scoutConfidence: 58 },
  { id: "p5", countryId: "en", clubId: "en-2-1", position: "CB", age: 25, overall: 69, potential: 82, hiddenPotential: 80, value: 1800000, wage: 7800, form: 76, morale: 64, happiness: 60, ego: 58, loyalty: 49, injuryRisk: 26, growthRate: 34, personality: "professional", story: "Pahalı ama istikrarlı savunmacı.", represented: false },
  { id: "p6", countryId: "tr", clubId: "tr-2-1", position: "AM", age: 21, overall: 67, potential: 86, hiddenPotential: 90, value: 1600000, wage: 6500, form: 79, morale: 75, happiness: 78, ego: 69, loyalty: 45, injuryRisk: 20, growthRate: 71, personality: "money", story: "Büyük kontrat isteyen yaratıcı 10 numara.", represented: false }
];

const positions = ["ST", "LW", "RW", "AM", "CM", "DM", "CB", "GK"];
const personalities = ["professional", "loyal", "ambitious", "money", "media", "troubled"];
const generatedPlayers = generatedClubs.flatMap((club, clubIndex) => {
  const league = leagueSeeds.find((item) => item.id === club.leagueId);
  const tier = league?.tier || 3;
  return [0, 1, 2, 3].map((slot) => {
    const seed = clubIndex * 17 + slot * 11 + tier * 5;
    const age = 17 + ((seed + slot) % 12);
    const overall = Math.max(48, (tier === 1 ? 67 : tier === 2 ? 60 : 53) + (seed % 8));
    const potential = Math.min(94, overall + 7 + ((seed + slot * 3) % 18));
    const value = Math.round((tier === 1 ? 2800000 : tier === 2 ? 850000 : 190000) * (1 + (overall - 55) / 26 + slot * 0.08) / 10000) * 10000;
    return {
      id: `g-${club.id}-${slot + 1}`,
      countryId: league?.countryId || "tr",
      clubId: club.id,
      position: positions[(seed + slot) % positions.length],
      age,
      overall,
      potential,
      hiddenPotential: Math.min(96, potential + ((seed % 5) - 1)),
      value,
      wage: Math.round((tier === 1 ? 16000 : tier === 2 ? 6200 : 1700) * (1 + slot * 0.12)),
      form: 55 + (seed % 28),
      morale: 50 + ((seed + 9) % 30),
      happiness: 50 + ((seed + 13) % 30),
      ego: 35 + ((seed + 19) % 45),
      loyalty: 35 + ((seed + 23) % 50),
      injuryRisk: 8 + ((seed + 29) % 24),
      growthRate: 35 + ((seed + 31) % 55),
      personality: personalities[(seed + slot) % personalities.length],
      story: tier === 3 ? "Alt ligde dikkat çeken ucuz fırsat." : tier === 2 ? "Bir üst seviyeye çıkmaya hazır aday." : "Büyük lig vitrininde zor ikna edilen profil.",
      represented: false,
      scouted: tier === 3 && slot < 2,
      scoutConfidence: tier === 3 && slot < 2 ? 48 + (seed % 24) : undefined
    };
  });
});

export const demoDb = {
  meta: {
    id: "fictional-core",
    name: "Fictional Core Database",
    season: 2026,
    currency: "EUR"
  },
  countries: [{ id: "intl", name: "International" }, ...countrySeeds.map(({ id, name }) => ({ id, name }))],
  leagues: [...leagueSeeds, ...tournamentLeagues],
  clubs: [...generatedClubs, ...tournamentClubs],
  players: [...corePlayers, ...generatedPlayers]
};

export const lifeActivities = [
  { id: "pr", titleKey: "life_pr", cost: 90000, reputation: 4, morale: 1, descriptionKey: "life_pr_desc" },
  { id: "education", titleKey: "life_education", cost: 60000, reputation: 2, negotiation: 4, descriptionKey: "life_education_desc" },
  { id: "health", titleKey: "life_health", cost: 45000, reputation: 1, morale: 4, descriptionKey: "life_health_desc" },
  { id: "office", titleKey: "life_office", cost: 160000, reputation: 5, scoutBoost: 6, descriptionKey: "life_office_desc" },
  { id: "car", titleKey: "life_car", cost: 120000, reputation: 3, relation: 3, descriptionKey: "life_car_desc" }
];

export const eventDeck = [
  {
    id: "media-interview",
    source: "media",
    severity: "normal",
    titleKey: "card_media_title",
    bodyKey: "card_media_body",
    accept: { money: -15000, reputation: 4, morale: 1, newsKey: "news_media_good" },
    decline: { reputation: -2, newsKey: "news_media_bad" }
  },
  {
    id: "player-holiday",
    source: "player",
    severity: "normal",
    titleKey: "card_holiday_title",
    bodyKey: "card_holiday_body",
    accept: { money: -55000, reputation: 2, morale: 8, newsKey: "news_holiday_good" },
    decline: { reputation: -1, morale: -6, newsKey: "news_holiday_bad" }
  },
  {
    id: "club-secret",
    source: "club",
    severity: "risk",
    titleKey: "card_secret_title",
    bodyKey: "card_secret_body",
    accept: { reputation: -3, relation: 8, newsKey: "news_secret_risky" },
    decline: { reputation: 2, relation: -3, newsKey: "news_secret_clean" }
  },
  {
    id: "family-support",
    source: "player",
    severity: "normal",
    titleKey: "card_family_title",
    bodyKey: "card_family_body",
    accept: { money: -35000, reputation: 3, morale: 5, newsKey: "news_family_good" },
    decline: { morale: -4, newsKey: "news_family_bad" }
  },
  {
    id: "sponsor-pitch",
    source: "sponsor",
    severity: "opportunity",
    titleKey: "Sponsor Sunumu",
    bodyKey: "Yerel bir marka, en formda oyuncunla reklam kampanyası yapmak istiyor.",
    accept: { money: 85000, reputation: 2, morale: 2, newsKey: "Sponsor kampanyası kasaya para ve görünürlük getirdi." },
    decline: { reputation: -1, newsKey: "Sponsor fırsatı pas geçildi." }
  },
  {
    id: "talent-tournament",
    source: "tournament",
    severity: "opportunity",
    titleKey: "Genç Yetenek Turnuvası",
    bodyKey: "Scout ekibin bir turnuvaya davet aldı. Katılım maliyetli ama gizli potansiyel yakalanabilir.",
    accept: { money: -70000, reputation: 3, morale: 2, scoutBoost: 4, newsKey: "Turnuva ziyareti ajansın scout ağını güçlendirdi." },
    decline: { scoutBoost: -1, newsKey: "Turnuva fırsatı kaçırıldı." }
  },
  {
    id: "legend-meeting",
    source: "legend",
    severity: "rare",
    titleKey: "Efsane Futbolcuyla Buluşma",
    bodyKey: "Emekli bir yıldız ajansına danışmanlık teklif ediyor. Doğru hamle büyük saygınlık getirebilir.",
    accept: { money: -120000, reputation: 7, relation: 5, newsKey: "Efsane isim ajansına prestij kattı." },
    decline: { reputation: -2, newsKey: "Efsane isimle görüşme sonuçsuz kaldı." }
  },
  {
    id: "stock-rumor",
    source: "finance",
    severity: "risk",
    titleKey: "Kulüp Hissesi Söylentisi",
    bodyKey: "Bir kulübün hisselerinde hareketlilik var. Erken girmek kazandırabilir, ama riskli.",
    accept: { money: 65000, reputation: -1, relation: 3, newsKey: "Riskli hisse hamlesi kısa vadede kazandırdı." },
    decline: { reputation: 1, newsKey: "Finans riskinden uzak durdun." }
  },
  {
    id: "player-talk",
    source: "talk",
    severity: "urgent",
    titleKey: "Oyuncu Görüşmesi",
    bodyKey: "Temsil ettiğin oyuncu daha büyük hedefler istiyor. Onu ikna etmezsen moral kaybedebilir.",
    accept: { money: -25000, morale: 7, reputation: 2, newsKey: "Oyuncuyla yapılan görüşme güven tazeledi." },
    decline: { morale: -7, reputation: -1, newsKey: "Oyuncu görüşmesi reddedildi, moral düştü." }
  },
  {
    id: "luxury-car-request",
    source: "player",
    severity: "risk",
    titleKey: "Lüks Araba Talebi",
    bodyKey: "Genç yıldızın imaj için yeni araba istiyor. Kabul edersen sadakat artar, reddedersen soyunma odası morali düşer.",
    accept: { money: -95000, morale: 6, reputation: 2, relation: 2, newsKey: "Oyuncunun imaj isteği karşılandı, ajans vitrini güçlendi." },
    decline: { morale: -6, reputation: -1, newsKey: "Araba talebi reddedildi, oyuncu cephesinde huzursuzluk var." }
  },
  {
    id: "family-home-request",
    source: "player",
    severity: "normal",
    titleKey: "Aile Evi Yardımı",
    bodyKey: "Bir oyuncunun ailesi taşınma desteği istiyor. Bu hamle pahalı ama oyuncuyla bağını güçlendirebilir.",
    accept: { money: -80000, morale: 9, reputation: 3, newsKey: "Aile desteği oyuncu tarafında büyük güven yarattı." },
    decline: { morale: -5, newsKey: "Aile desteği reddedildi, oyuncu kafası dağınık." }
  },
  {
    id: "press-crisis",
    source: "media",
    severity: "urgent",
    titleKey: "Basında Kriz",
    bodyKey: "Bir gazeteci temsil ettiğin oyuncu hakkında sert bir haber hazırlıyor. PR hamlesiyle yangını söndürebilirsin.",
    accept: { money: -65000, reputation: 4, morale: 3, newsKey: "PR ekibi krizi büyümeden kontrol altına aldı." },
    decline: { reputation: -4, morale: -3, newsKey: "Basındaki kriz ajansın saygınlığını zedeledi." }
  },
  {
    id: "club-pressure",
    source: "club",
    severity: "risk",
    titleKey: "Kulüp Baskısı",
    bodyKey: "Bir kulüp oyuncunu düşük maaşla hızlı imzaya zorlamak istiyor. İlişkiyi korumakla oyuncuyu korumak arasında kaldı.",
    accept: { relation: 7, reputation: -2, morale: -4, newsKey: "Kulüp ilişkisi güçlendi ama oyuncu tarafında soru işaretleri var." },
    decline: { relation: -4, reputation: 3, morale: 3, newsKey: "Oyuncunu korudun, soyunma odasi bunu duydu." }
  },
  {
    id: "streaming-show",
    source: "sponsor",
    severity: "opportunity",
    titleKey: "Canlı Yayın Programı",
    bodyKey: "Bir spor platformu ajansına haftalık program teklif ediyor. Zaman alır ama para ve görünürlük getirir.",
    accept: { money: 120000, reputation: 3, morale: 1, newsKey: "Canlı yayın programı ajansa yeni gelir kapısı açtı." },
    decline: { reputation: -1, newsKey: "Yayın fırsatı rafa kalktı." }
  },
  {
    id: "data-pack-rumor",
    source: "media",
    severity: "rare",
    titleKey: "Fan Data Pack Dedikodusu",
    bodyKey: "Topluluk, gerçekçi lig verisi için fan paketi hazırlıyor. Resmi destek vermeden altyapıyı test edebilirsin.",
    accept: { money: -30000, reputation: 5, scoutBoost: 3, newsKey: "Fan data pack altyapısı toplulukta heyecan yarattı." },
    decline: { reputation: -1, newsKey: "Topluluk paketi desteksiz kaldı." }
  }
];

export const empireUpgrades = [
  {
    id: "scout-department",
    title: "Scout Departmani",
    cost: 220000,
    reputation: 3,
    scoutBoost: 10,
    income: 9000,
    description: "Geniş scout ağı daha kaliteli rapor ve haftalık ek gelir sağlar."
  },
  {
    id: "media-office",
    title: "Medya Ofisi",
    cost: 180000,
    reputation: 6,
    relation: 2,
    income: 6000,
    description: "Oyuncu imajını ve ajans saygınlığını büyütür."
  },
  {
    id: "youth-network",
    title: "Genç Yetenek Ağı",
    cost: 260000,
    reputation: 4,
    scoutBoost: 14,
    income: 7000,
    description: "Gizli potansiyelli oyunculari daha erken yakalamaya yardim eder."
  },
  {
    id: "club-shares",
    title: "Kulüp Hisseleri",
    cost: 320000,
    reputation: 2,
    relation: 8,
    income: 18000,
    description: "Kulüp çevresinde söz sahibi olmanı ve pasif gelir kazanmanı sağlar."
  }
];

export const staffCandidates = [
  { id: "chief-scout", name: "Chief Scout", cost: 85000, weeklyCost: 6000, scoutBoost: 12, description: "Scout rapor kalitesini belirgin artirir." },
  { id: "lawyer", name: "Contract Lawyer", cost: 70000, weeklyCost: 5000, negotiation: 9, description: "Pazarlık ve sözleşme görüşmelerinde avantaj sağlar." },
  { id: "pr-manager", name: "PR Manager", cost: 65000, weeklyCost: 4500, reputation: 5, description: "Medya krizlerini ve sponsor görüşmelerini güçlendirir." }
];

export const sponsorDeals = [
  { id: "boots", name: "Boots Partner", advance: 120000, weeklyIncome: 14000, minReputation: 35, description: "Oyuncu portföyüne krampon sponsorluğu." },
  { id: "stream", name: "Match Stream Brand", advance: 210000, weeklyIncome: 22000, minReputation: 48, description: "Maç tahmini ve medya görünürlüğü odaklı sponsor." },
  { id: "airline", name: "Travel Sponsor", advance: 320000, weeklyIncome: 36000, minReputation: 62, description: "Uluslararası ajans imajı için büyük sponsor." }
];
