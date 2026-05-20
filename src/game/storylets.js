const cardRank = (severity) => severity === "urgent" ? 5 : severity === "rare" ? 4 : severity === "risk" ? 3 : severity === "opportunity" ? 2 : 1;

export const repoInfluences = [
  {
    id: "moti",
    name: "nandorojo/moti",
    role: "Expo uyumlu mikro animasyonlar, giriş/çıkış ve loop hareketleri"
  },
  {
    id: "rnrc",
    name: "dohooo/react-native-reanimated-carousel",
    role: "Kart destesi, parallax ve stack carousel davranışı için referans"
  },
  {
    id: "inkjs",
    name: "y-lohse/inkjs",
    role: "Dallanan hikaye mantığı için hafif storylet yaklaşımı"
  },
  {
    id: "xstate",
    name: "statelyai/xstate",
    role: "Kariyer durumlarını makine gibi düşünmek için referans"
  }
];

function representedPlayers(career) {
  return (career.db?.players || []).filter((player) => player.represented);
}

function bestClient(career) {
  return [...representedPlayers(career)].sort((a, b) => (b.value || 0) + (b.form || 0) * 35000 - ((a.value || 0) + (a.form || 0) * 35000))[0];
}

function bestOffer(career) {
  return [...(career.incomingOffers || [])].sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0))[0];
}

function urgentCard(career) {
  return [...(career.pendingCards || [])].sort((a, b) => cardRank(b.severity) - cardRank(a.severity))[0];
}

function topRival(career) {
  return [...(career.rivalPressure || [])].sort((a, b) => (b.heat || 0) - (a.heat || 0))[0];
}

export function buildStorylets(career) {
  const represented = representedPlayers(career);
  const spotlight = bestClient(career);
  const offer = bestOffer(career);
  const crisis = urgentCard(career);
  const rival = topRival(career);
  const story = career.story || {};
  const storylets = [
    {
      id: "main-story",
      tone: "gold",
      kicker: "Ana Hikaye",
      title: story.title || "Kiralık ofis, tek telefon",
      body: story.beat || "Ajans piyasaya yeni girdi. İlk hedef alt ligde bir yeteneği ikna etmek.",
      progress: story.tension || 18,
      target: crisis ? "agenda" : represented.length ? "players" : "scout",
      cta: crisis ? "Krizi çöz" : represented.length ? "Oyuncuyu yönet" : "İlk oyuncuyu bul"
    }
  ];

  if (!represented.length) {
    storylets.push({
      id: "empty-portfolio",
      tone: "green",
      kicker: "Başlangıç",
      title: "Vitrin boş",
      body: "Büyük oyuncular seni dinlemez. Önce üçüncü ligde güven kazanacak bir kariyer hikayesi yarat.",
      progress: 24,
      target: "scout",
      cta: "Yetenek ara"
    });
  } else if (spotlight) {
    storylets.push({
      id: "client-arc",
      tone: "blue",
      kicker: "Oyuncu Arkı",
      title: spotlight.name,
      body: `${spotlight.careerGoal?.label || "Kariyer hedefi"} ${spotlight.goalProgress || 40}%. Güven ${spotlight.agencyTrust ?? 55}, mutluluk ${spotlight.happiness ?? spotlight.morale ?? 60}.`,
      progress: spotlight.goalProgress || 40,
      target: "players",
      cta: "Kariyeri yönet"
    });
  }

  if (offer) {
    storylets.push({
      id: "offer-story",
      tone: "red",
      kicker: "Pazarlık",
      title: "Masada fırsat var",
      body: `Fit ${offer.fitScore || offer.chance}/100. Komisyon ve oyuncu mutluluğu aynı anda korunmalı.`,
      progress: offer.fitScore || offer.chance || 45,
      target: "players",
      cta: "Teklifi aç"
    });
  }

  if (rival) {
    storylets.push({
      id: "rival-story",
      tone: "pink",
      kicker: "Rakip Ajan",
      title: rival.rivalName,
      body: `${rival.targetName || "Bir yetenek"} için ${rival.style || "temas"} kuruyor. Baskı ${rival.heat}/100.`,
      progress: rival.heat || 55,
      target: "scout",
      cta: "Karşı hamle"
    });
  }

  if (crisis) {
    storylets.push({
      id: "crisis-story",
      tone: "orange",
      kicker: "Gündem",
      title: crisis.titleKey,
      body: `Kart bekliyor. Hafta akışı için kabul veya red seçmen gerekir.`,
      progress: 82,
      target: "agenda",
      cta: "Kartı aç"
    });
  }

  return storylets.slice(0, 5);
}

export function buildCinematicDeck(career, translate = (value) => value) {
  const story = career.story || {};
  const represented = representedPlayers(career);
  const spotlight = bestClient(career);
  const offer = bestOffer(career);
  const rival = topRival(career);
  const pending = [...(career.pendingCards || [])]
    .sort((a, b) => cardRank(b.severity) - cardRank(a.severity))
    .slice(0, 3)
    .map((card, index) => ({
      id: `card-${card.id}`,
      source: card.source || "event",
      tone: card.severity || "normal",
      title: translate(card.titleKey),
      body: translate(card.bodyKey),
      meta: `${cardRank(card.severity)} baskı · ${Math.max(0, (card.expiresWeek || career.week + 1) - career.week)} hf`,
      target: "agenda",
      weight: 100 - index * 4
    }));

  const deck = [
    ...pending,
    {
      id: "story-deck",
      source: "story",
      tone: "story",
      title: story.title || "Kariyer hikayesi",
      body: story.objective || "Bir sonraki hamleyi seç.",
      meta: `${story.tension || 18}% baskı`,
      target: pending.length ? "agenda" : represented.length ? "players" : "scout",
      weight: 72
    }
  ];

  if (spotlight) {
    deck.push({
      id: "client-deck",
      source: "player",
      tone: "client",
      title: spotlight.name,
      body: `${spotlight.position} · Form ${spotlight.form} · hedef ${spotlight.goalProgress || 40}%`,
      meta: `Güven ${spotlight.agencyTrust ?? 55}`,
      target: "players",
      weight: 66
    });
  }

  if (offer) {
    deck.push({
      id: "offer-deck",
      source: "club",
      tone: "offer",
      title: "Teklif masası",
      body: `Kulüp ilgisi ${offer.fitScore || offer.chance}/100. Komisyonu zorlamak ilişkiyi yakabilir.`,
      meta: `W${offer.expiresWeek || career.week + 1} son`,
      target: "players",
      weight: 70
    });
  }

  if (rival) {
    deck.push({
      id: "rival-deck",
      source: "rival",
      tone: "rival",
      title: "Rakip baskısı",
      body: `${rival.rivalName} ${rival.targetName || "bir oyuncu"} için devrede.`,
      meta: `${rival.heat}/100 ısı`,
      target: "scout",
      weight: 62
    });
  }

  return deck.sort((a, b) => b.weight - a.weight).slice(0, 4);
}
