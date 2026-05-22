// @ts-nocheck
import "./global.css";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import JSZip from "jszip";
import { BriefcaseBusiness, Building2, Search, Users } from "lucide-react-native";
import { MotiView } from "moti";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  SafeAreaView,
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity as NativeTouchableOpacity,
  View
} from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";
import { demoDb, empireUpgrades, lifeActivities, sponsorDeals, staffCandidates } from "./src/game/demoData.js";
import { readDataPackFromZip } from "./src/game/dataPackSecurity.js";
import { buildOpenFootballDataPack } from "./src/game/fanData.js";
import { buildCinematicDeck, buildStorylets, repoInfluences } from "./src/game/storylets.js";
import {
  buildContentPackRefs,
  serializeCareerSave,
  SAVE_SCHEMA_VERSION,
  tryReadCareerSave
} from "./src/game/saveSystem.js";
import {
  buildProfessionalReadinessReport,
  getEntitlementSnapshot,
  getPrivacySnapshot,
  initializePlatformServices,
  trackGameEvent
} from "./src/game/platformServices.js";
import {
  acceptIncomingOffer,
  applyAchievementProgress,
  advanceWeek,
  buildOffer,
  buildAgencyRankings,
  buildPlayerSponsorship,
  buildRepresentationPitch,
  buildSeasonAgenda,
  buildStandings,
  buyEmpireUpgrade,
  buyLifeActivity,
  createObjectives,
  createAchievements,
  createInitialCareer,
  formatMoney,
  getAgencyCapacity,
  getRepresentedPlayers,
  hydrateGeneratedNames,
  hireStaff,
  negotiate,
  renewAgencyContract,
  resolvePlayerTalkChoice,
  runPlayerCareerPlan,
  sendPlayerGift,
  predictFeaturedMatch,
  resolveEventCard,
  signSponsor,
  signPlayerToAgency,
  signPlayerSponsorship,
  simulateWeekPreview,
  startNextSeason,
  startScout,
  validateDataPackManifest
} from "./src/game/engine.js";
import { t } from "./src/game/i18n.js";

const SAVE_KEY = "agent-kariyeri-save-v3";
const screens = ["dashboard", "inbox", "players", "clubs", "scout", "empire", "life", "settings"];
const navScreens = ["dashboard", "inbox", "players", "clubs", "scout"];
const stadiumImage = require("./assets/backgrounds/stadium-night.png");
const matchPitchImage = require("./assets/art/backgrounds/match-night-pixel.png");
const storySceneImages = [
  require("./assets/art/story/story-lobby.jpg"),
  require("./assets/art/story/story-office-rejection.jpg"),
  require("./assets/art/story/story-third-league-prospects.jpg")
];
const portraitLibrary = [
  require("./assets/art/ai-portraits/agent-portrait-01.png"),
  require("./assets/art/ai-portraits/agent-portrait-02.png"),
  require("./assets/art/ai-portraits/agent-portrait-03.png"),
  require("./assets/art/ai-portraits/agent-portrait-04.png"),
  require("./assets/art/ai-portraits/agent-portrait-05.png"),
  require("./assets/art/ai-portraits/agent-portrait-06.png"),
  require("./assets/art/ai-portraits/agent-portrait-07.png"),
  require("./assets/art/ai-portraits/agent-portrait-08.png"),
  require("./assets/art/ai-portraits/agent-portrait-09.png"),
  require("./assets/art/ai-portraits/agent-portrait-10.png"),
  require("./assets/art/ai-portraits/agent-portrait-11.png"),
  require("./assets/art/ai-portraits/agent-portrait-12.png"),
  require("./assets/art/players/portrait-01.png"),
  require("./assets/art/players/portrait-02.png"),
  require("./assets/art/players/portrait-03.png"),
  require("./assets/art/players/portrait-04.png"),
  require("./assets/art/players/portrait-05.png"),
  require("./assets/art/players/portrait-06.png"),
  require("./assets/art/players/portrait-07.png"),
  require("./assets/art/players/portrait-08.png"),
  require("./assets/art/players/portrait-09.png"),
  require("./assets/art/players/portrait-10.png"),
  require("./assets/art/players/portrait-11.png"),
  require("./assets/art/players/portrait-12.png")
];
const crestLibrary = [
  require("./assets/art/clubs/crest-01.png"),
  require("./assets/art/clubs/crest-02.png"),
  require("./assets/art/clubs/crest-03.png"),
  require("./assets/art/clubs/crest-04.png"),
  require("./assets/art/clubs/crest-05.png"),
  require("./assets/art/clubs/crest-06.png"),
  require("./assets/art/clubs/crest-07.png"),
  require("./assets/art/clubs/crest-08.png"),
  require("./assets/art/clubs/crest-09.png"),
  require("./assets/art/clubs/crest-10.png")
];
const cardArtworkImages = {
  media: require("./assets/art/cards/card-media.png"),
  holiday: require("./assets/art/cards/card-holiday.png"),
  secret: require("./assets/art/cards/card-secret.png"),
  family: require("./assets/art/cards/card-family.png"),
  sponsor: require("./assets/art/cards/card-sponsor.png"),
  tournament: require("./assets/art/cards/card-tournament.png"),
  legend: require("./assets/art/cards/card-legend.png"),
  finance: require("./assets/art/cards/card-finance.png"),
  car: require("./assets/art/cards/card-car.png"),
  crisis: require("./assets/art/cards/card-crisis.png"),
  data: require("./assets/art/cards/card-data.png"),
  agent: require("./assets/art/cards/card-agent.png")
};
const playerImages = {
  p1: portraitLibrary[0],
  p2: portraitLibrary[1],
  p3: portraitLibrary[2],
  p4: portraitLibrary[3],
  p5: portraitLibrary[4],
  p6: portraitLibrary[5]
};
const clubImages = {
  "ist-eagles": require("./assets/clubs/ist-eagles.png"),
  "ank-lions": require("./assets/clubs/ank-lions.png"),
  "izm-port": require("./assets/clubs/izm-port.png"),
  "lon-reds": require("./assets/clubs/lon-reds.png"),
  "man-blues": require("./assets/clubs/man-blues.png"),
  "liv-docks": require("./assets/clubs/liv-docks.png"),
  "mad-whites": require("./assets/clubs/mad-whites.png"),
  "bar-marina": require("./assets/clubs/bar-marina.png")
};

const agentAvatarOptions = {
  skin: [
    { id: "warm", label: "Buğday", color: "#d8a47f", shadow: "#b36a4c" },
    { id: "deep", label: "Koyu", color: "#8d5524", shadow: "#6f3f1f" },
    { id: "light", label: "Açık", color: "#f1c27d", shadow: "#c68662" },
    { id: "olive", label: "Zeytin", color: "#c68662", shadow: "#8d5524" }
  ],
  hair: [
    { id: "messy", label: "Dağınık", shape: "messy" },
    { id: "fade", label: "Fade", shape: "fade" },
    { id: "curly", label: "Kıvırcık", shape: "curly" },
    { id: "side", label: "Yana", shape: "side" }
  ],
  hairColor: [
    { id: "black", label: "Siyah", color: "#111827" },
    { id: "brown", label: "Kahve", color: "#5b3218" },
    { id: "blond", label: "Sarı", color: "#d8b55d" },
    { id: "copper", label: "Bakır", color: "#9a3412" }
  ],
  outfit: [
    { id: "green", label: "Saha Yeşili", jacket: "#0f6d38", shirt: "#d9f99d" },
    { id: "navy", label: "Gece Mavisi", jacket: "#1d4ed8", shirt: "#dbeafe" },
    { id: "black", label: "Siyah Takım", jacket: "#111827", shirt: "#f8fafc" },
    { id: "wine", label: "Bordo", jacket: "#7f1d1d", shirt: "#fee2e2" }
  ],
  accent: [
    { id: "gold", label: "Altın", color: "#fbbf24" },
    { id: "blue", label: "Mavi", color: "#7dd3fc" },
    { id: "green", label: "Mint", color: "#86efac" },
    { id: "rose", label: "Kriz", color: "#fb7185" }
  ]
};

const defaultAgentAvatar = {
  skin: 0,
  hair: 0,
  hairColor: 1,
  outfit: 0,
  accent: 0
};

let playInteractionSound = () => {};

function TouchableOpacity({ onPress, disabled, sound = true, ...props }) {
  const handlePress = (...args) => {
    if (!disabled && sound !== false) playInteractionSound();
    return onPress?.(...args);
  };
  return <NativeTouchableOpacity {...props} disabled={disabled} onPress={handlePress} />;
}

function migrateCareerSave(saved) {
  if (!saved?.db) return saved;
  const forceGeneratedNames = saved.db.meta?.id === "fictional-core";
  const demoPlayersById = new Map((demoDb.players || []).map((player) => [player.id, player]));
  const demoClubsById = new Map((demoDb.clubs || []).map((club) => [club.id, club]));
  const db = {
    ...saved.db,
    players: (saved.db.players || []).map((player) => ({
      ...(demoPlayersById.get(player.id) || {}),
      ...player,
      hiddenPotential: player.hiddenPotential ?? demoPlayersById.get(player.id)?.hiddenPotential ?? player.potential,
      happiness: player.happiness ?? player.morale ?? demoPlayersById.get(player.id)?.happiness ?? 60,
      ego: player.ego ?? demoPlayersById.get(player.id)?.ego ?? 50,
      loyalty: player.loyalty ?? demoPlayersById.get(player.id)?.loyalty ?? 55,
      injuryRisk: player.injuryRisk ?? demoPlayersById.get(player.id)?.injuryRisk ?? 15,
      growthRate: player.growthRate ?? demoPlayersById.get(player.id)?.growthRate ?? 55,
      personality: player.personality ?? demoPlayersById.get(player.id)?.personality ?? "professional",
      marketHeat: player.marketHeat ?? 0,
      activeCareerPlan: player.activeCareerPlan ?? null,
      planWeek: player.planWeek ?? null,
      story: player.story ?? demoPlayersById.get(player.id)?.story ?? "Kariyer hikayesi scout raporlarında netleşecek."
    })),
    clubs: (saved.db.clubs || []).map((club) => ({
      ...(demoClubsById.get(club.id) || {}),
      ...club,
      negotiationHardness: club.negotiationHardness ?? demoClubsById.get(club.id)?.negotiationHardness ?? 55,
      transferPolicy: club.transferPolicy ?? demoClubsById.get(club.id)?.transferPolicy ?? "balanced"
    }))
  };
  const dbWithNames = hydrateGeneratedNames(db, numericSeed(saved.nameSeed || saved.id || "career"), forceGeneratedNames);
  const representedIds = (dbWithNames.players || []).filter((player) => player.represented).map((player) => player.id);
  const starterRadarIds = (saved.knownPlayerIds?.length ? saved.knownPlayerIds : (dbWithNames.players || [])
    .filter((player) => {
      if (!saved.setupComplete || !saved.selectedLeagueId) return false;
      const club = (dbWithNames.clubs || []).find((item) => item.id === player.clubId);
      return club?.leagueId === saved.selectedLeagueId && !player.represented;
    })
    .sort((a, b) => (b.scoutAIScore || b.potential || 0) - (a.scoutAIScore || a.potential || 0))
    .slice(0, 2)
    .map((player) => player.id));
  const enriched = {
    ...saved,
    db: dbWithNames,
    seasonMonth: normalizeMonthName(saved.seasonMonth),
    seasonStartMonth: normalizeMonthName(saved.seasonStartMonth),
    nameSeed: saved.nameSeed || numericSeed(saved.id || "career"),
    ethics: saved.ethics ?? 72,
    mediaPower: saved.mediaPower ?? 0,
    rivals: saved.rivals || [
      { id: "rival-prime", name: "Prime Eleven", reputation: 48, aggression: 68, focus: "stars" },
      { id: "rival-nova", name: "Nova Talent", reputation: 36, aggression: 52, focus: "youth" }
    ],
    rivalPressure: saved.rivalPressure || [],
    knownPlayerIds: [...new Set([...(saved.knownPlayerIds || []), ...representedIds, ...starterRadarIds].filter(Boolean))],
    weeklyFocus: saved.weeklyFocus || "balanced",
    objectives: saved.objectives?.length ? saved.objectives : createObjectives(),
    achievements: saved.achievements?.length ? saved.achievements : createAchievements(),
    stats: { cardsResolved: 0, dealsAccepted: 0, ...(saved.stats || {}) },
    story: saved.story || {
      chapter: "zero-agency",
      title: "Kiralık ofis, tek telefon",
      beat: "Ajansın piyasaya yeni girdi. İlk hedef alt ligde bir yeteneği ikna etmek.",
      objective: "Yetenekler ekranından ilk oyuncuyla temsil sözleşmesi imzala.",
      tension: 18,
      log: []
    }
  };
  const unplayedButSeeded = saved.standings?.length && saved.standings.every((row) => !row.played) && saved.standings.some((row) => row.points);
  if (!unplayedButSeeded) return enriched;
  const leagueId = enriched.selectedLeagueId;
  const leagueClubIds = new Set(enriched.db.clubs.filter((club) => !leagueId || club.leagueId === leagueId).map((club) => club.id));
  return {
    ...enriched,
    standings: buildStandings(enriched.db).filter((row) => leagueClubIds.has(row.clubId))
  };
}

function normalizeMonthName(month) {
  const names = {
    Agustos: "Ağustos",
    Eylul: "Eylül",
    Kasim: "Kasım",
    Aralik: "Aralık",
    Subat: "Şubat",
    Mayis: "Mayıs"
  };
  return names[month] || month;
}

function numericSeed(value) {
  return String(value).split("").reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1), 0);
}

function createWebGameAudio() {
  if (typeof window === "undefined") return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  let context = null;
  let master = null;
  let loopTimer = null;
  let step = 0;
  let tapStep = 0;
  const ensure = async () => {
    if (!context) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.16;
      master.connect(context.destination);
    }
    if (context.state === "suspended") {
      await context.resume().catch(() => {});
    }
    return context;
  };
  const tone = async (freq, duration = 0.2, volume = 0.14, type = "triangle", delay = 0) => {
    const ctx = await ensure();
    if (!ctx || !master) return;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + duration + 0.04);
  };
  const tick = async () => {
    const bass = [146.83, 164.81, 196, 174.61][step % 4];
    const lead = [392, 440, 493.88, 440, 349.23, 392, 440, 329.63][step % 8];
    step += 1;
    tone(bass, 0.55, 0.055, "sine");
    tone(lead, 0.16, 0.035, "triangle", 0.24);
    tone(lead * 1.5, 0.12, 0.022, "sine", 0.54);
  };
  return {
    tap: async () => {
      const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 739.99, 622.25];
      const freq = notes[tapStep % notes.length];
      const variant = tapStep % 4;
      tapStep += 1;
      await ensure();
      tone(freq, 0.055 + variant * 0.008, 0.055, variant % 2 ? "triangle" : "sine");
      tone(freq * (variant === 3 ? 1.25 : 1.5), 0.04, 0.026, "triangle", 0.025);
    },
    startLoop: async () => {
      await ensure();
      if (loopTimer) return;
      tick();
      loopTimer = setInterval(tick, 1320);
    },
    stopLoop: () => {
      if (loopTimer) clearInterval(loopTimer);
      loopTimer = null;
    },
    goal: async () => {
      await ensure();
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => tone(freq, 0.22, 0.13 - index * 0.014, "square", index * 0.11));
      tone(261.63, 0.5, 0.08, "sawtooth", 0.38);
    },
    achievement: async () => {
      await ensure();
      [659.25, 783.99, 987.77, 1318.51].forEach((freq, index) => tone(freq, 0.18, 0.12 - index * 0.012, "triangle", index * 0.09));
      [329.63, 493.88, 659.25].forEach((freq, index) => tone(freq, 0.34, 0.06, "sine", 0.24 + index * 0.08));
      tone(1567.98, 0.2, 0.08, "square", 0.48);
    },
    card: async (source = "player", severity = "normal") => {
      await ensure();
      const base = severity === "urgent" || severity === "risk" ? 220 : source === "sponsor" ? 493.88 : source === "media" ? 739.99 : 392;
      tone(base, 0.12, 0.055, "triangle");
      tone(base * 1.5, 0.11, 0.035, "sine", 0.08);
      tone(base * 2, 0.16, 0.025, "triangle", 0.18);
    }
  };
}

function MainMenu({ agentName, setAgentName, agentAvatar, setAgentAvatar, savedCareer, menuPanel, setMenuPanel, onNewCareer, onContinue, onDeleteSave, soundOn, onToggleSound }) {
  const hasSave = !!savedCareer;
  const represented = savedCareer ? getRepresentedPlayers(savedCareer).length : 0;
  const panels = [
    { id: "play", label: "Oyuna Başla" },
    { id: "save", label: "Kayıt Yönet" },
    { id: "settings", label: "Ayarlar" }
  ];
  return (
    <ScrollView style={styles.menuScroll} contentContainerStyle={styles.menuContent}>
      <ImageBackground source={matchPitchImage} style={styles.menuHero} imageStyle={styles.menuHeroImage}>
        <View style={styles.menuHeroWash} />
        <AtmosphereDashes count={18} tone="blue" />
        <AnimatedEdgeLines tone="blue" />
        <PremiumSheen delay={180} color="rgba(125,211,252,0.18)" />
        <View style={styles.menuGlow} />
        <View style={styles.menuGlowGold} />
        <View style={styles.menuGrid} />
        <View style={styles.menuTopLine}>
          <Text style={styles.menuKicker}>Football Agent Sim</Text>
          <View style={styles.menuTopActions}>
            <TouchableOpacity style={styles.soundToggle} onPress={onToggleSound}>
              <Text style={styles.soundToggleText}>{soundOn ? "Ses açık" : "Ses kapalı"}</Text>
            </TouchableOpacity>
            <Text style={styles.menuSaveBadge}>{hasSave ? `W${savedCareer.week}` : "Yeni"}</Text>
          </View>
        </View>
        <View style={styles.menuHeroBody}>
          <View style={styles.menuCopy}>
            <RevealWords text="Agent Kariyeri" textStyle={styles.brand} />
            <Text style={styles.subtitle}>Scout, pazarlık, saygınlık ve yaşam kararlarının olduğu futbol ajansı.</Text>
            <View style={styles.menuSignalRow}>
              <SignalEqualizer tone="gold" />
              <Text style={styles.menuSignalText}>canlı piyasa · ajans hikayesi · maç günü</Text>
            </View>
          </View>
          <MotiView from={{ translateY: 7 }} animate={{ translateY: -5 }} transition={{ type: "timing", duration: 1200, loop: true }}>
            <AgentAvatarPreview avatar={agentAvatar} size={128} juggling />
          </MotiView>
        </View>
        <View style={styles.menuTabs}>
          {panels.map((item) => (
            <TouchableOpacity key={item.id} style={[styles.menuTab, menuPanel === item.id && styles.menuTabActive]} onPress={() => setMenuPanel(item.id)}>
              <Text style={[styles.menuTabText, menuPanel === item.id && styles.menuTabTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ImageBackground>

      {menuPanel === "play" && (
        <View style={styles.menuPanel}>
          <AnimatedEdgeLines tone="green" delay={300} />
          <Text style={styles.menuPanelTitle}>Ajans Masası</Text>
          <TextInput value={agentName} onChangeText={setAgentName} placeholder="Ajan Adı" placeholderTextColor="#78917f" style={styles.input} />
          <AgentCreator avatar={agentAvatar} setAvatar={setAgentAvatar} />
          <View style={styles.menuActionGrid}>
            <TouchableOpacity style={[styles.menuActionButton, !hasSave && styles.disabledButton]} disabled={!hasSave} onPress={onContinue}>
              <LinearGradient colors={hasSave ? ["#fbbf24", "#f97316"] : ["#475569", "#334155"]} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>{hasSave ? "Devam Et" : "Kayıt Yok"}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuDarkButton} onPress={onNewCareer}>
              <Text style={styles.menuDarkButtonText}>Yeni Kariyer</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.menuStatsRow}>
            <View style={styles.menuStatCard}><Text style={styles.menuStatValue}>{hasSave ? formatMoney(savedCareer.money) : "-"}</Text><Text style={styles.menuStatLabel}>Para</Text></View>
            <View style={styles.menuStatCard}><Text style={styles.menuStatValue}>{hasSave ? savedCareer.reputation : "-"}</Text><Text style={styles.menuStatLabel}>Saygınlık</Text></View>
            <View style={styles.menuStatCard}><Text style={styles.menuStatValue}>{hasSave ? represented : "-"}</Text><Text style={styles.menuStatLabel}>Oyuncu</Text></View>
          </View>
        </View>
      )}

      {menuPanel === "save" && (
        <View style={styles.menuPanel}>
          <AnimatedEdgeLines tone="blue" delay={200} />
          <Text style={styles.menuPanelTitle}>Kayıt Yönet</Text>
          {hasSave ? (
            <View style={styles.saveCard}>
              <Text style={styles.saveTitle}>{savedCareer.agentName}</Text>
              <Text style={styles.saveText}>Hafta {savedCareer.week} / {savedCareer.season} · {represented} oyuncu · {formatMoney(savedCareer.money)}</Text>
              <Text style={styles.saveText}>Lig: {savedCareer.db?.leagues?.find((league) => league.id === savedCareer.selectedLeagueId)?.name || "Seçim bekliyor"}</Text>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.goodButton} onPress={onContinue}><Text style={styles.actionText}>Yükle</Text></TouchableOpacity>
                <TouchableOpacity style={styles.dangerMini} onPress={onDeleteSave}><Text style={styles.actionText}>Sil</Text></TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.menuEmpty}>Henüz kayıt yok. Yeni kariyer başlatınca burada görünecek.</Text>
          )}
        </View>
      )}

      {menuPanel === "settings" && (
        <View style={styles.menuPanel}>
          <AnimatedEdgeLines tone="gold" delay={200} />
          <Text style={styles.menuPanelTitle}>Ayarlar</Text>
          <Text style={styles.menuSettingLine}>Dil: TR varsayılan. Oyun içinde TR/EN değiştirilebilir.</Text>
          <Text style={styles.menuSettingLine}>Fan Data Pack: Ayarlar sekmesinden zip olarak yüklenir.</Text>
          <Text style={styles.menuSettingLine}>Shadcn/Tailwind: Bu Expo React Native projesinde aktif değil; web portu istenirse /components/ui klasörüyle ayrı Next kurulumu gerekir.</Text>
        </View>
      )}
    </ScrollView>
  );
}

function PixelFootballer({ juggling = false, kit = "green", badge = "", elite = false }) {
  const kitStyle = kit === "white" ? styles.pixelBodyWhite : styles.pixelBodyGreen;
  const stripeStyle = kit === "white" ? styles.pixelStripeGold : styles.pixelStripeGreen;
  return (
    <View style={styles.pixelStage}>
      {elite && (
        <MotiView
          from={{ opacity: 0.18, scale: 0.86 }}
          animate={{ opacity: 0.42, scale: 1.12 }}
          transition={{ type: "timing", duration: 900, loop: true }}
          style={styles.pixelAura}
        />
      )}
      <View style={styles.pixelShadow} />
      <MotiView
        from={{ translateY: 1 }}
        animate={{ translateY: elite ? -4 : juggling ? -2 : 0 }}
        transition={{ type: "timing", duration: elite ? 780 : 980, loop: true }}
        style={styles.pixelPlayer}
      >
        <View style={styles.pixelHair} />
        <View style={styles.pixelHead} />
        <View style={styles.pixelNeck} />
        <View style={[styles.pixelBody, kitStyle]}>
          <View style={[styles.pixelStripe, stripeStyle]} />
          {!!(badge || kit === "white") && <Text style={[styles.pixelNumber, kit === "white" && styles.pixelNumberGold]}>{badge || "7"}</Text>}
        </View>
        <MotiView
          from={{ rotate: "-6deg" }}
          animate={{ rotate: juggling ? "14deg" : elite ? "8deg" : "-2deg" }}
          transition={{ type: "timing", duration: 620, loop: true }}
          style={styles.pixelArmLeft}
        />
        <MotiView
          from={{ rotate: "8deg" }}
          animate={{ rotate: juggling ? "-16deg" : elite ? "-8deg" : "3deg" }}
          transition={{ type: "timing", duration: 620, loop: true }}
          style={styles.pixelArmRight}
        />
        <View style={styles.pixelShorts} />
        <MotiView
          from={{ rotate: "0deg", translateY: 0 }}
          animate={{ rotate: juggling ? "-10deg" : "0deg", translateY: juggling ? -2 : 0 }}
          transition={{ type: "timing", duration: 520, loop: true }}
          style={styles.pixelLegLeft}
        />
        <MotiView
          from={{ rotate: "0deg", translateY: 0 }}
          animate={{ rotate: juggling ? "16deg" : elite ? "-4deg" : "0deg", translateY: juggling ? -4 : 0 }}
          transition={{ type: "timing", duration: 520, loop: true }}
          style={styles.pixelLegRight}
        />
        <MotiView
          from={{ translateX: 0 }}
          animate={{ translateX: juggling ? -4 : 0 }}
          transition={{ type: "timing", duration: 520, loop: true }}
          style={styles.pixelBootLeft}
        />
        <MotiView
          from={{ translateX: 0, translateY: 0 }}
          animate={{ translateX: juggling ? 8 : elite ? 3 : 0, translateY: juggling ? -4 : 0 }}
          transition={{ type: "timing", duration: 520, loop: true }}
          style={styles.pixelBootRight}
        />
      </MotiView>
      {juggling ? (
        <>
          <MotiView from={{ translateY: 2, translateX: 0, scale: 0.86 }} animate={{ translateY: -44, translateX: -8, scale: 1.04 }} transition={{ type: "timing", duration: 520, loop: true }} style={styles.pixelJuggleBall}>
            <View style={styles.pixelBallPatch} />
          </MotiView>
          <MotiView from={{ opacity: 0.18, scaleX: 0.6 }} animate={{ opacity: 0.8, scaleX: 1.25 }} transition={{ type: "timing", duration: 520, loop: true }} style={styles.pixelKneeSpark} />
        </>
      ) : (
        <View style={styles.pixelBall}>
          <View style={styles.pixelBallPatch} />
        </View>
      )}
    </View>
  );
}

function getAvatarPart(group, avatar = defaultAgentAvatar) {
  const options = agentAvatarOptions[group] || [];
  const index = Math.max(0, Math.min(options.length - 1, avatar[group] ?? 0));
  return options[index] || options[0];
}

function shiftAvatarPart(avatar, group, direction) {
  const options = agentAvatarOptions[group] || [];
  const current = avatar[group] ?? 0;
  return {
    ...avatar,
    [group]: (current + direction + options.length) % options.length
  };
}

function AgentAvatarPreview({ avatar = defaultAgentAvatar, size = 128, juggling = false }) {
  const skin = getAvatarPart("skin", avatar);
  const hair = getAvatarPart("hair", avatar);
  const hairColor = getAvatarPart("hairColor", avatar);
  const outfit = getAvatarPart("outfit", avatar);
  const accent = getAvatarPart("accent", avatar);
  const scale = size / 128;
  const px = (value) => Math.round(value * scale);
  return (
    <View style={[styles.agentAvatarStage, { width: px(128), height: px(168) }]}>
      <View style={[styles.agentAvatarGlow, { width: px(104), height: px(126), borderRadius: px(28), backgroundColor: `${accent.color}33` }]} />
      <View style={[styles.agentAvatarShadow, { width: px(88), height: px(12), borderRadius: px(8), bottom: px(7) }]} />
      <View style={[styles.agentAvatarBody, { width: px(86), height: px(144) }]}>
        <View style={[styles.agentAvatarNeck, { top: px(53), left: px(35), width: px(18), height: px(14), backgroundColor: skin.shadow }]} />
        <View style={[styles.agentAvatarJacket, { top: px(66), left: px(8), width: px(72), height: px(66), backgroundColor: outfit.jacket, borderColor: accent.color }]} />
        <View style={[styles.agentAvatarShirt, { top: px(70), left: px(32), width: px(24), height: px(62), backgroundColor: outfit.shirt }]} />
        <View style={[styles.agentAvatarPocket, { top: px(76), left: px(13), width: px(18), height: px(6), backgroundColor: accent.color }]} />
        <View style={[styles.agentAvatarHead, { top: px(16), left: px(20), width: px(48), height: px(48), borderRadius: px(12), backgroundColor: skin.color }]}>
          <View style={[styles.agentAvatarFaceShade, { backgroundColor: skin.shadow }]} />
          <View style={[styles.agentAvatarEye, { left: px(13), top: px(22), width: px(5), height: px(5) }]} />
          <View style={[styles.agentAvatarEye, { right: px(13), top: px(22), width: px(5), height: px(5) }]} />
          <View style={[styles.agentAvatarNose, { top: px(28), left: px(22), width: px(5), height: px(9), backgroundColor: skin.shadow }]} />
          <View style={[styles.agentAvatarMouth, { top: px(39), left: px(16), width: px(18), height: px(3) }]} />
        </View>
        <AvatarHair shape={hair.shape} color={hairColor.color} px={px} />
        <View style={[styles.agentAvatarLegs, { top: px(130), left: px(22), width: px(44), height: px(12) }]} />
      </View>
      {juggling && (
        <MotiView from={{ translateY: px(4), translateX: 0 }} animate={{ translateY: -px(34), translateX: -px(7) }} transition={{ type: "timing", duration: 560, loop: true }} style={[styles.agentAvatarBall, { width: px(20), height: px(20), borderRadius: px(20), right: px(10), bottom: px(42) }]}>
          <View style={[styles.agentAvatarBallPatch, { width: px(7), height: px(7), borderRadius: px(2), left: px(6), top: px(6) }]} />
        </MotiView>
      )}
    </View>
  );
}

function AvatarHair({ shape, color, px }) {
  const base = { backgroundColor: color };
  if (shape === "fade") {
    return (
      <>
        <View style={[styles.agentHairBlock, base, { top: px(9), left: px(20), width: px(48), height: px(14), borderRadius: px(6) }]} />
        <View style={[styles.agentHairBlock, base, { top: px(18), left: px(17), width: px(10), height: px(28), borderRadius: px(4) }]} />
      </>
    );
  }
  if (shape === "curly") {
    return (
      <>
        {[0, 1, 2, 3, 4].map((item) => (
          <View key={item} style={[styles.agentHairBlock, base, { top: px(7 + (item % 2) * 3), left: px(18 + item * 10), width: px(14), height: px(14), borderRadius: px(7) }]} />
        ))}
      </>
    );
  }
  if (shape === "side") {
    return (
      <>
        <View style={[styles.agentHairBlock, base, { top: px(7), left: px(18), width: px(54), height: px(16), borderRadius: px(5) }]} />
        <View style={[styles.agentHairBlock, base, { top: px(17), left: px(50), width: px(18), height: px(26), borderRadius: px(5) }]} />
      </>
    );
  }
  return (
    <>
      <View style={[styles.agentHairBlock, base, { top: px(6), left: px(19), width: px(54), height: px(17), borderRadius: px(5) }]} />
      <View style={[styles.agentHairBlock, base, { top: px(16), left: px(14), width: px(20), height: px(26), borderRadius: px(5) }]} />
      <View style={[styles.agentHairBlock, base, { top: px(15), left: px(57), width: px(16), height: px(22), borderRadius: px(5) }]} />
    </>
  );
}

function AgentCreator({ avatar, setAvatar }) {
  const rows = [
    ["skin", "Ten"],
    ["hair", "Saç"],
    ["hairColor", "Saç Rengi"],
    ["outfit", "Kıyafet"],
    ["accent", "Vurgu"]
  ];
  return (
    <View style={styles.agentCreator}>
      <View style={styles.agentCreatorPreview}>
        <AgentAvatarPreview avatar={avatar} size={116} />
        <View style={styles.agentCreatorCopy}>
          <Text style={styles.agentCreatorTitle}>Menajerini oluştur</Text>
          <Text style={styles.agentCreatorText}>Seçenekler kayar, karakter anında değişir. Bu görünüm kariyer kaydına yazılır.</Text>
        </View>
      </View>
      <View style={styles.agentCreatorRows}>
        {rows.map(([group, label]) => {
          const active = getAvatarPart(group, avatar);
          const activeIndex = avatar[group] ?? 0;
          const options = agentAvatarOptions[group] || [];
          return (
            <View key={group} style={styles.agentOptionRow}>
              <TouchableOpacity style={styles.agentOptionArrow} onPress={() => setAvatar(shiftAvatarPart(avatar, group, -1))}>
                <Text style={styles.agentOptionArrowText}>‹</Text>
              </TouchableOpacity>
              <View style={styles.agentOptionMain}>
                <View style={styles.agentOptionHeader}>
                  <Text style={styles.agentOptionLabel}>{label}</Text>
                  <Text style={styles.agentOptionValueText}>{active.label}</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.agentOptionStrip}>
                  {options.map((option, index) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.agentOptionChip, index === activeIndex && styles.agentOptionChipActive]}
                      onPress={() => setAvatar({ ...avatar, [group]: index })}
                    >
                      <View style={[styles.agentOptionSwatch, { backgroundColor: option.color || option.jacket || "#94a3b8" }]} />
                      <Text style={[styles.agentOptionChipText, index === activeIndex && styles.agentOptionChipTextActive]}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <TouchableOpacity style={styles.agentOptionArrow} onPress={() => setAvatar(shiftAvatarPart(avatar, group, 1))}>
                <Text style={styles.agentOptionArrowText}>›</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function LoadingCareerScreen({ load }) {
  const progress = Math.max(4, Math.min(100, load.progress || 10));
  return (
    <View style={styles.bootScreen}>
      <View style={styles.bootCard}>
        <PixelFootballer />
        <Text style={styles.bootTitle}>{load.message}</Text>
        <Text style={styles.bootText}>{load.detail}</Text>
        <View style={styles.bootTrack}>
          <View style={[styles.bootFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.bootPercent}>{progress}%</Text>
        <Text style={styles.bootSource}>Kaynak filtresi: CC0 / CC-BY / ODbL / PDDL. Unknown/other/copyright-authors bloklanir.</Text>
      </View>
    </View>
  );
}

export default function App() {
  const [career, setCareer] = useState(null);
  const [savedCareer, setSavedCareer] = useState(null);
  const [agentName, setAgentName] = useState("Kasey Sung");
  const [agentAvatar, setAgentAvatar] = useState(defaultAgentAvatar);
  const [menuPanel, setMenuPanel] = useState("play");
  const [bootLoad, setBootLoad] = useState(null);
  const [screen, setScreen] = useState("dashboard");
  const [selectedPlayerId, setSelectedPlayerId] = useState("p1");
  const [selectedClubId, setSelectedClubId] = useState("ist-eagles");
  const [offer, setOffer] = useState(null);
  const [loadState, setLoadState] = useState("loading");
  const [simState, setSimState] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [cardQueue, setCardQueue] = useState([]);
  const [decisionFlash, setDecisionFlash] = useState(null);
  const [weekReport, setWeekReport] = useState(null);
  const [soundOn, setSoundOn] = useState(true);
  const audioRef = useRef(null);
  const goalCountRef = useRef(0);
  const achievementIdsRef = useRef(null);

  useEffect(() => {
    initializePlatformServices({ target: "expo-local", version: "0.1.0" });
    AsyncStorage.getItem(SAVE_KEY)
      .then((raw) => {
        if (!raw) return;
        const loaded = tryReadCareerSave(raw);
        if (loaded.errors?.length && typeof console !== "undefined") {
          console.warn("Save could not be restored", loaded.errors.join(", "));
        }
        if (!loaded.career) return;
        const migrated = migrateCareerSave(loaded.career);
        setSavedCareer(migrated);
        if (migrated.agentAvatar) setAgentAvatar(migrated.agentAvatar);
        if (loaded.migrated) {
          AsyncStorage.setItem(SAVE_KEY, serializeCareerSave(migrated, {
            settings: { soundOn: true, lang: migrated.lang || "tr" },
            entitlements: getEntitlementSnapshot(),
            contentPacks: buildContentPackRefs(migrated),
            privacy: getPrivacySnapshot()
          }));
        }
      })
      .finally(() => setLoadState("ready"));
  }, []);

  useEffect(() => {
    if (career) {
      setSavedCareer(career);
      AsyncStorage.setItem(SAVE_KEY, serializeCareerSave(career, {
        settings: { soundOn, lang: career.lang || "tr", saveSchemaVersion: SAVE_SCHEMA_VERSION },
        entitlements: getEntitlementSnapshot(),
        contentPacks: buildContentPackRefs(career),
        privacy: getPrivacySnapshot()
      }));
    }
  }, [career, soundOn]);

  useEffect(() => {
    if (!simState?.running) return;
    if (simState.halfPaused || simState.finalizing) return;
    const currentMinute = simState.minute || 0;
    if (currentMinute >= 45 && !simState.secondHalfStarted) {
      setSimState((current) => current ? { ...current, minute: 45, halfPaused: true, shown: countEventsUntil(current.preview.events, 45) } : current);
      return;
    }
    if (currentMinute >= 90) {
      const done = { ...simState, minute: 90, finalizing: true, shown: simState.preview.events.length };
      setSimState(done);
      setTimeout(() => finishWeekSimulation(done), 1500);
      return;
    }
    const cap = simState.secondHalfStarted ? 90 : 45;
    const timer = setTimeout(() => {
      setSimState((current) => {
        if (!current || current.halfPaused || current.finalizing) return current;
        const nextMinute = Math.min(cap, (current.minute || 0) + 1);
        return {
          ...current,
          minute: nextMinute,
          shown: countEventsUntil(current.preview.events, nextMinute)
        };
      });
    }, 140);
    return () => clearTimeout(timer);
  }, [simState]);

  useEffect(() => () => {
    audioRef.current?.stopLoop?.();
  }, []);

  useEffect(() => {
    if (!simState) {
      goalCountRef.current = 0;
      return;
    }
    const representedIds = new Set(getRepresentedPlayers(career).map((player) => player.id));
    const visibleGoals = simState.preview.events
      .slice(0, simState.shown)
      .filter((event) => event.type === "goal" && representedIds.has(event.playerId)).length;
    if (simState.running && soundOn && visibleGoals > goalCountRef.current) {
      playGoalSound();
    }
    goalCountRef.current = visibleGoals;
  }, [simState?.shown, simState?.running, soundOn, career]);

  function getAudioEngine() {
    if (!audioRef.current) audioRef.current = createWebGameAudio();
    return audioRef.current;
  }

  function startAudioLoop() {
    if (!soundOn) return;
    getAudioEngine()?.startLoop?.();
  }

  function playGoalSound() {
    if (!soundOn) return;
    getAudioEngine()?.goal?.();
  }

  function playAchievementSound() {
    if (!soundOn) return;
    getAudioEngine()?.achievement?.();
  }

  function playCardSound(card) {
    if (!soundOn || !card) return;
    getAudioEngine()?.card?.(card.source, card.severity);
  }

  function playTapSound() {
    if (!soundOn) return;
    getAudioEngine()?.tap?.();
  }

  function toggleSound() {
    setSoundOn((current) => {
      const next = !current;
      const engine = getAudioEngine();
      if (next) {
        setTimeout(() => engine?.startLoop?.(), 0);
      } else {
        engine?.stopLoop?.();
      }
      return next;
    });
  }

  useEffect(() => {
    playInteractionSound = playTapSound;
    return () => {
      playInteractionSound = () => {};
    };
  }, [soundOn]);

  useEffect(() => {
    if (!career) {
      achievementIdsRef.current = null;
      return;
    }
    const unlocked = (career.achievements || []).filter((item) => item.completed);
    const currentIds = new Set(unlocked.map((item) => item.id));
    if (!achievementIdsRef.current) {
      achievementIdsRef.current = currentIds;
      return;
    }
    const gained = unlocked.filter((item) => !achievementIdsRef.current.has(item.id));
    achievementIdsRef.current = currentIds;
    if (!gained.length) return;
    playAchievementSound();
    setDecisionFlash({
      title: "Başarım açıldı",
      summary: gained.map((item) => item.title).slice(0, 2).join(" · "),
      tone: "accept"
    });
  }, [career?.achievements, soundOn]);

  function finishWeekSimulation(state = simState) {
    if (!state) return;
    setWeekReport(buildWeekReport(career, state.finalCareer, state.preview, state.popupCards || []));
    setCareer(state.finalCareer);
    trackGameEvent("match_day_completed", {
      week: state.finalCareer?.week || career?.week || 0,
      represented: getRepresentedPlayers(state.finalCareer || career).length,
      cards: (state.popupCards || []).length
    });
    setScreen(state.finalCareer.annualReport ? "annualReport" : "dashboard");
    setSimState(null);
  }

  function closeWeekReport() {
    const cards = weekReport?.popupCards || [];
    setWeekReport(null);
    if (cards.length) {
      openCardAgenda(cards);
    }
  }

  function continueSecondHalf() {
    startAudioLoop();
    setSimState((current) => current ? {
      ...current,
      halfPaused: false,
      secondHalfStarted: true,
      minute: 46,
      shown: countEventsUntil(current.preview.events, 46)
    } : current);
  }

  function startMatchSimulation() {
    startAudioLoop();
    goalCountRef.current = 0;
    setSimState((current) => current ? {
      ...current,
      running: true,
      minute: 1,
      shown: countEventsUntil(current.preview.events, 1)
    } : current);
  }

  function skipMatchToEnd() {
    startAudioLoop();
    setSimState((current) => {
      if (!current) return current;
      if (current.finalizing) {
        setTimeout(() => finishWeekSimulation(current), 0);
        return current;
      }
      const done = { ...current, minute: 90, shown: current.preview.events.length, halfPaused: false, secondHalfStarted: true, finalizing: true };
      setTimeout(() => finishWeekSimulation(done), 250);
      return done;
    });
  }

  function countEventsUntil(events, minute) {
    return events.filter((event) => event.minute <= minute).length;
  }

  useEffect(() => {
    if (!decisionFlash) return;
    const timer = setTimeout(() => setDecisionFlash(null), 2400);
    return () => clearTimeout(timer);
  }, [decisionFlash]);

  useEffect(() => {
    if (activeCard) playCardSound(activeCard);
  }, [activeCard?.id, soundOn]);

  const lang = career?.lang || "tr";
  const tr = (key) => t(lang, key);
  const players = career?.db.players || [];
  const clubs = career?.db.clubs || [];
  const selectedPlayer = players.find((player) => player.id === selectedPlayerId) || players[0];
  const selectedClub = clubs.find((club) => club.id === selectedClubId) || clubs[0];
  const offerClub = offer ? clubs.find((club) => club.id === offer.clubId) || selectedClub : selectedClub;
  const myPlayers = useMemo(() => (career ? getRepresentedPlayers(career) : []), [career]);
  const finalizeCareerProgress = (nextCareer) => nextCareer ? applyAchievementProgress(nextCareer) : nextCareer;
  const setCareerAndClearOffer = (nextCareer) => {
    setCareer(finalizeCareerProgress(nextCareer));
    setOffer(null);
  };

  async function beginCareer() {
    startAudioLoop();
    setBootLoad({ message: "OpenFootball Fan Data Pack yükleniyor", detail: "Oyuncu listesi hazırlanıyor", progress: 5 });
    let db = demoDb;
    try {
      db = await buildOpenFootballDataPack(({ step, current, total }) => {
        setBootLoad({
          message: "Lisans kontrollü fan data yükleniyor",
          detail: step,
          progress: Math.round((current / Math.max(1, total)) * 82) + 8
        });
      });
    } catch (error) {
      setBootLoad({ message: "Fan data yüklenemedi", detail: "Kurgu demo verisiyle başlatılıyor", progress: 92 });
    }
    const next = createInitialCareer(agentName.trim() || "Kasey Sung", db, "tr");
  const freshCareer = {
      ...next,
      agentAvatar,
      setupComplete: false,
      prologueStep: 0,
      selectedLeagueId: null,
      focusClubId: null,
      standings: [],
      pendingCards: [],
      incomingOffers: [],
      marketIntel: [],
      news: [db.meta?.id === "openfootball-fan-pack" ? `OpenFootball Fan Data Pack yüklendi. ${db.meta?.blockedSources?.length ? "İzinli olmayan kaynaklar fan pack'e gömülmedi." : "Tüm kaynaklar lisans filtresinden geçti."}` : "Önce lig ve ajans odağını seç."]
    };
    setSavedCareer(freshCareer);
    setCareer(freshCareer);
    trackGameEvent("career_started", {
      source: db.meta?.id || "fictional-core",
      schema: SAVE_SCHEMA_VERSION
    });
    setScreen("dashboard");
    setBootLoad(null);
  }

  function continueSavedCareer() {
    if (!savedCareer) return;
    startAudioLoop();
    if (savedCareer.agentAvatar) setAgentAvatar(savedCareer.agentAvatar);
    setCareer(savedCareer);
    setScreen("dashboard");
  }

  function deleteSavedCareer() {
    AsyncStorage.removeItem(SAVE_KEY).then(() => {
      setSavedCareer(null);
      setCareer(null);
      setMenuPanel("play");
    });
  }

  function updateCareer(nextCareer) {
    setCareer(finalizeCareerProgress(nextCareer));
  }

  function completeCareerSetup(leagueId, firstPlayerId = null) {
    const league = career.db.leagues.find((item) => item.id === leagueId) || career.db.leagues[0];
    const clubsInLeague = career.db.clubs.filter((club) => club.leagueId === league.id);
    const pickedPlayer = career.db.players.find((player) => player.id === firstPlayerId);
    const pickedPlayerId = pickedPlayer?.id;
    const starterRadarIds = career.db.players
      .filter((player) => clubsInLeague.some((club) => club.id === player.clubId) && !player.represented)
      .sort((a, b) => (b.scoutAIScore || b.potential || 0) - (a.scoutAIScore || a.potential || 0))
      .slice(0, 3)
      .map((player) => player.id);
    const knownPlayerIds = [...new Set([pickedPlayerId, ...starterRadarIds].filter(Boolean))];
    setSelectedClubId(clubsInLeague[0]?.id || selectedClubId);
    updateCareer({
      ...career,
      setupComplete: true,
      prologueStep: 4,
      selectedLeagueId: league.id,
      focusClubId: null,
      knownPlayerIds,
      money: pickedPlayerId ? Math.max(85000, career.money - 55000) : career.money,
      reputation: pickedPlayerId ? Math.max(5, career.reputation - 2) : career.reputation,
      db: {
        ...career.db,
        players: career.db.players.map((player) => player.id === pickedPlayerId ? {
          ...player,
          represented: true,
          scouted: true,
          starterCandidate: true,
          scoutConfidence: Math.max(player.scoutConfidence || 0, 58),
          agencyCommissionRate: 3,
          agencySignedWeek: career.week,
          agencyContractUntil: career.week + 52,
          agencyTrust: 61,
          happiness: Math.min(100, (player.happiness ?? player.morale ?? 60) + 5),
          story: `${player.story || "Alt lig oyuncusu."} Senin ajansının ilk gerçek şansı.`
        } : knownPlayerIds.includes(player.id) ? {
          ...player,
          scouted: true,
          starterCandidate: true,
          scoutConfidence: Math.max(player.scoutConfidence || 0, 52)
        } : player)
      },
      standings: buildStandings(career.db).filter((row) => clubsInLeague.some((club) => club.id === row.clubId)),
      pendingCards: career.pendingCards?.length ? career.pendingCards : [],
      story: pickedPlayerId ? {
        chapter: "first-client",
        title: "Kapı kapandı, telefon açıldı",
        beat: `${pickedPlayer.name} imzayı attı. Yıldız kapısından dönen ajans artık alt ligde gerçek bir kariyer inşa etmek zorunda.`,
        objective: "İlk oyuncunun güvenini koru, değerini yükselt ve ilk kulüp teklifini getir.",
        tension: 36,
        log: [{ week: career.week, title: "İlk imza", body: `${pickedPlayer.name} ajansa katıldı. Artık vitrin de risk de onun üzerinden yazılacak.` }, ...(career.story?.log || [])].slice(0, 8)
      } : career.story,
      news: [pickedPlayerId ? `${pickedPlayer.name} ajansın ilk oyuncusu oldu.` : `${league.name} liginde ajans pazarı açıldı.`, ...career.news].slice(0, 20)
    });
    trackGameEvent("tutorial_completed", {
      leagueTier: league.tier || 0,
      starterSigned: Boolean(pickedPlayerId)
    });
  }

  function openCardAgenda(cards = []) {
    const agenda = cards.filter(Boolean);
    setActiveCard(agenda[0] || null);
    setCardQueue(agenda.slice(1));
  }

function resolveActiveCard(decision) {
    if (!career || !activeCard) return;
    const effect = decision === "accept" ? activeCard.accept : activeCard.decline;
    setDecisionFlash({
      title: decision === "accept" ? "Karar kabul edildi" : "Teklif reddedildi",
      summary: effectSummary(effect),
      tone: decision
    });
    updateCareer(resolveEventCard(career, activeCard.id, decision));
    trackGameEvent("card_resolved", {
      decision,
      severity: activeCard.severity || "normal"
    });
    const [nextCard, ...rest] = cardQueue;
    setActiveCard(nextCard || null);
    setCardQueue(rest);
  }

  function moveCardsToAgenda() {
    setActiveCard(null);
    setCardQueue([]);
    setScreen("dashboard");
  }

  function startWeekSimulation() {
    if (!career || simState || career.annualReport) return;
    if ((career.pendingCards || []).length) {
      const priorityCards = [...(career.pendingCards || [])].sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
      setDecisionFlash({
        title: "Karar bekliyor",
        summary: "Hafta ilerlemeden önce masadaki kartı kabul veya red ile çözmen gerekiyor.",
        tone: "decline"
      });
      openCardAgenda(priorityCards.slice(0, 1));
      return;
    }
    setScreen("match");
    const preview = simulateWeekPreview(career);
    const finalCareer = advanceWeek(career, preview);
    const previousCardIds = new Set((career.pendingCards || []).map((card) => card.id));
    const newCards = (finalCareer.pendingCards || [])
      .filter((card) => !previousCardIds.has(card.id))
      .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
    const popupCards = (newCards.length ? newCards : (finalCareer.pendingCards || []).slice(0, 1)).slice(0, 1);
    setSimState({
      preview,
      finalCareer,
      popupCards,
      minute: 0,
      shown: 0,
      running: false,
      halfPaused: false,
      secondHalfStarted: false,
      finalizing: false
    });
    trackGameEvent("week_prepared", {
      week: career.week,
      represented: myPlayers.length,
      popupCards: popupCards.length
    });
  }

  async function importDataPack() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/zip", copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
      const zip = await JSZip.loadAsync(base64, { base64: true });
      const securePack = await readDataPackFromZip(zip);
      if (!securePack.ok) throw new Error(securePack.errors.join(", "));
      const { manifest, database } = securePack;
      const validation = validateDataPackManifest(manifest, database);
      if (!validation.ok) throw new Error(validation.errors.join(", "));
      const dataSources = database.meta?.dataSources || database.meta?.sources || manifest.sources || [];
      updateCareer({
        ...career,
        db: {
          ...database,
          meta: {
            ...database.meta,
            name: manifest.name,
            dataSources,
            importWarnings: securePack.warnings || [],
            communityPack: true
          }
        },
        news: ["dataPackReady", ...career.news]
      });
      trackGameEvent("data_pack_imported", {
        sourceCount: dataSources.length,
        clubs: database.clubs?.length || 0,
        players: database.players?.length || 0
      });
      Alert.alert(tr("dataPackReady"), manifest.name);
    } catch (error) {
      trackGameEvent("data_pack_failed", { reason: "validation-or-read-error" });
      Alert.alert(tr("dataPackError"), String(error?.message || error));
    }
  }

  if (loadState === "loading") {
    return (
      <Shell>
        <Text style={styles.loading}>Agent Kariyeri</Text>
      </Shell>
    );
  }

  if (bootLoad) {
    return (
      <Shell>
        <LoadingCareerScreen load={bootLoad} />
      </Shell>
    );
  }

  if (!career) {
    return (
      <Shell>
        <MainMenu
          agentName={agentName}
          setAgentName={setAgentName}
          agentAvatar={agentAvatar}
          setAgentAvatar={setAgentAvatar}
          savedCareer={savedCareer}
          menuPanel={menuPanel}
          setMenuPanel={setMenuPanel}
          onNewCareer={beginCareer}
          onContinue={continueSavedCareer}
          onDeleteSave={deleteSavedCareer}
          soundOn={soundOn}
          onToggleSound={toggleSound}
        />
      </Shell>
    );
  }

  if (!career.setupComplete) {
    return (
      <Shell>
        <SetupCareer career={career} tr={tr} onComplete={completeCareerSetup} />
      </Shell>
    );
  }

  return (
    <Shell>
      {screen !== "dashboard" && screen !== "match" && (
      <View style={styles.topBar}>
        <View>
          <Text style={styles.agent}>{career.agentName}</Text>
          <Text style={styles.muted}>
            {career.seasonMonth || "Haziran"} · Hafta {career.week} / {career.season}
          </Text>
        </View>
        <View style={styles.topStats}>
          <Stat label="Para" value={formatMoney(career.money)} />
          <Stat label="Saygınlık" value={career.reputation} />
        </View>
      </View>
      )}

      {screen === "dashboard" ? (
        <View style={styles.dashboardScreen}>
          <HomeCommandCenter
            career={career}
            tr={tr}
            myPlayers={myPlayers}
            simState={simState}
            onNextWeek={startWeekSimulation}
            updateCareer={setCareerAndClearOffer}
            setScreen={setScreen}
            setSelectedPlayerId={setSelectedPlayerId}
            setOffer={setOffer}
            openCardAgenda={openCardAgenda}
            setDecisionFlash={setDecisionFlash}
            soundOn={soundOn}
            onToggleSound={toggleSound}
          />
        </View>
      ) : screen === "match" && simState ? (
        <View style={styles.matchScreen}>
          <MatchLiveCenter simState={simState} career={career} onStart={startMatchSimulation} onContinue={continueSecondHalf} onSkip={skipMatchToEnd} soundOn={soundOn} onToggleSound={toggleSound} />
        </View>
      ) : (
      <ScrollView style={styles.content} contentContainerStyle={styles.contentPad}>
        {screen === "annualReport" && (
          <AnnualReport career={career} onNextSeason={() => setCareerAndClearOffer(startNextSeason(career))} />
        )}
        {screen === "players" && (
          <Players
            career={career}
            tr={tr}
            selectedPlayerId={selectedPlayerId}
            setSelectedPlayerId={setSelectedPlayerId}
            selectedClubId={selectedClubId}
            setOffer={setOffer}
            setScreen={setScreen}
            updateCareer={updateCareer}
            setDecisionFlash={setDecisionFlash}
          />
        )}
        {screen === "clubs" && (
          <Clubs career={career} tr={tr} selectedClubId={selectedClubId} setSelectedClubId={setSelectedClubId} />
        )}
        {screen === "scout" && (
          <Scout career={career} tr={tr} updateCareer={updateCareer} setDecisionFlash={setDecisionFlash} />
        )}
        {screen === "inbox" && (
          <Inbox career={career} tr={tr} openCardAgenda={openCardAgenda} setScreen={setScreen} setOffer={setOffer} setSelectedPlayerId={setSelectedPlayerId} />
        )}
        {screen === "empire" && (
          <Empire career={career} updateCareer={updateCareer} setDecisionFlash={setDecisionFlash} />
        )}
        {screen === "life" && (
          <Life career={career} tr={tr} updateCareer={updateCareer} setDecisionFlash={setDecisionFlash} />
        )}
        {screen === "settings" && (
          <Settings career={career} tr={tr} setCareer={setCareer} importDataPack={importDataPack} />
        )}
        {offer && screen === "negotiate" && (
          <Negotiation career={career} tr={tr} offer={offer} player={selectedPlayer} club={offerClub} updateCareer={updateCareer} setOffer={setOffer} setScreen={setScreen} setDecisionFlash={setDecisionFlash} />
        )}
      </ScrollView>
      )}

      <CardPopup
        card={activeCard}
        career={career}
        tr={tr}
        remaining={cardQueue.length}
        onDecision={resolveActiveCard}
        onAgenda={moveCardsToAgenda}
      />

      <WeekReportModal report={weekReport} onClose={closeWeekReport} />

      <DecisionFlash flash={decisionFlash} />

      {screen !== "match" && screen !== "dashboard" && (
        <View style={styles.nav}>
          {navScreens.map((item) => (
            <TouchableOpacity key={item} style={[styles.navItem, screen === item && styles.navItemActive]} onPress={() => setScreen(item)}>
              <Text style={[styles.navText, screen === item && styles.navTextActive]}>{tr(item)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      {children}
    </SafeAreaView>
  );
}

function PremiumSheen({ delay = 0, color = "rgba(255,255,255,0.28)" }) {
  return (
    <MotiView
      pointerEvents="none"
      from={{ translateX: -180, opacity: 0, rotate: "18deg" }}
      animate={{ translateX: 460, opacity: [0, 0.9, 0], rotate: "18deg" }}
      transition={{ type: "timing", duration: 2600, delay, loop: true }}
      style={[styles.premiumSheen, { backgroundColor: color }]}
    />
  );
}

function AtmosphereDashes({ count = 16, tone = "gold" }) {
  const color = tone === "pitch" ? "rgba(187,247,208,0.34)" : tone === "blue" ? "rgba(125,211,252,0.30)" : "rgba(251,191,36,0.30)";
  return (
    <View pointerEvents="none" style={styles.atmosphereLayer}>
      {Array.from({ length: count }).map((_, index) => {
        const left = `${(index * 37) % 100}%`;
        const top = `${10 + ((index * 23) % 78)}%`;
        const width = 16 + (index % 4) * 8;
        return (
          <MotiView
            key={`dash-${index}`}
            from={{ opacity: 0.08, translateY: 0, scaleX: 0.7 }}
            animate={{ opacity: [0.08, 0.38, 0.08], translateY: index % 2 ? -10 : 10, scaleX: [0.7, 1.15, 0.7] }}
            transition={{ type: "timing", duration: 2200 + index * 90, delay: index * 70, loop: true }}
            style={[styles.atmosphereDash, { left, top, width, backgroundColor: color }]}
          />
        );
      })}
    </View>
  );
}

function RevealWords({ text, textStyle, style, delay = 0 }) {
  return (
    <View style={[styles.revealWords, style]}>
      <MotiView
        from={{ opacity: 0, translateY: 7 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 260, delay }}
        style={styles.revealLine}
      >
        <Text style={textStyle}>{String(text || "")}</Text>
      </MotiView>
    </View>
  );
}

function AnimatedEdgeLines({ tone = "gold", delay = 0 }) {
  const color = tone === "blue" ? "#7dd3fc" : tone === "green" ? "#86efac" : "#fbbf24";
  return (
    <View pointerEvents="none" style={styles.edgeLayer}>
      <MotiView from={{ translateX: -150, opacity: 0.08 }} animate={{ translateX: 430, opacity: [0.08, 0.9, 0.08] }} transition={{ type: "timing", duration: 3100, delay, loop: true }} style={[styles.edgeBeam, styles.edgeBeamTop, { backgroundColor: color }]} />
      <MotiView from={{ translateX: 160, opacity: 0.04 }} animate={{ translateX: -420, opacity: [0.04, 0.62, 0.04] }} transition={{ type: "timing", duration: 3600, delay: delay + 600, loop: true }} style={[styles.edgeBeam, styles.edgeBeamBottom, { backgroundColor: color }]} />
      <MotiView from={{ translateY: -160, opacity: 0.04 }} animate={{ translateY: 680, opacity: [0.04, 0.62, 0.04] }} transition={{ type: "timing", duration: 3900, delay: delay + 250, loop: true }} style={[styles.edgeBeamSide, styles.edgeBeamLeft, { backgroundColor: color }]} />
      <MotiView from={{ translateY: 220, opacity: 0.04 }} animate={{ translateY: -680, opacity: [0.04, 0.52, 0.04] }} transition={{ type: "timing", duration: 4200, delay: delay + 900, loop: true }} style={[styles.edgeBeamSide, styles.edgeBeamRight, { backgroundColor: color }]} />
    </View>
  );
}

function SignalEqualizer({ bars = 5, tone = "green" }) {
  const color = tone === "gold" ? "#fbbf24" : tone === "blue" ? "#7dd3fc" : "#86efac";
  return (
    <View style={styles.equalizer}>
      {Array.from({ length: bars }).map((_, index) => (
        <MotiView
          key={`eq-${index}`}
          from={{ height: 8 + (index % 2) * 4, opacity: 0.35 }}
          animate={{ height: [8 + (index % 2) * 4, 22 - (index % 3) * 3, 10 + (index % 2) * 5], opacity: [0.35, 0.95, 0.45] }}
          transition={{ type: "timing", duration: 740 + index * 120, delay: index * 60, loop: true }}
          style={[styles.equalizerBar, { backgroundColor: color }]}
        />
      ))}
    </View>
  );
}

function PixelStoryCast({ scene = "door", agentName = "Agent" }) {
  const legendX = scene === "office" ? 20 : scene === "street" ? 72 : 66;
  const agentX = scene === "office" ? 66 : scene === "street" ? 22 : 24;
  const assistantX = scene === "office" ? 46 : 86;
  return (
    <View pointerEvents="none" style={styles.pixelCastLayer}>
      <MotiView
        from={{ translateY: 0, scale: 1 }}
        animate={{ translateY: [0, -3, 0], scale: [1, 1.015, 1] }}
        transition={{ type: "timing", duration: 1200, loop: true }}
        style={[styles.pixelActor, styles.pixelAgent, { left: `${agentX}%` }]}
      >
        <View style={styles.pixelHead} />
        <View style={styles.pixelHair} />
        <View style={styles.pixelSuit} />
        <View style={styles.pixelTie} />
        <Text style={styles.pixelActorTag} numberOfLines={1}>{agentName.slice(0, 8)}</Text>
      </MotiView>
      <MotiView
        from={{ translateY: 1 }}
        animate={{ translateY: [1, -2, 1] }}
        transition={{ type: "timing", duration: 1500, loop: true, delay: 180 }}
        style={[styles.pixelActor, styles.pixelLegend, { left: `${legendX}%` }]}
      >
        <View style={[styles.pixelHead, styles.pixelLegendHead]} />
        <View style={styles.pixelLegendHair} />
        <View style={styles.pixelLegendKit} />
        <View style={styles.pixelGoldBoot} />
        <Text style={styles.pixelActorTag}>C.R.7</Text>
      </MotiView>
      {scene !== "door" && (
        <MotiView
          from={{ opacity: 0.82, translateX: 0 }}
          animate={{ opacity: [0.82, 1, 0.82], translateX: [0, 2, 0] }}
          transition={{ type: "timing", duration: 900, loop: true }}
          style={[styles.pixelActor, styles.pixelAssistant, { left: `${assistantX}%` }]}
        >
          <View style={[styles.pixelHead, styles.pixelAssistantHead]} />
          <View style={styles.pixelAssistantSuit} />
        </MotiView>
      )}
      {scene === "street" && (
        <MotiView
          from={{ opacity: 0.65, translateY: 4 }}
          animate={{ opacity: [0.65, 1, 0.65], translateY: [4, -2, 4] }}
          transition={{ type: "timing", duration: 760, loop: true }}
          style={styles.pixelPhonePing}
        >
          <Text style={styles.pixelPhoneText}>1 mesaj</Text>
        </MotiView>
      )}
    </View>
  );
}

function CardStoryCast({ source = "player", severity = "normal" }) {
  const danger = severity === "urgent" || severity === "risk";
  const rightRole = source === "media" ? "PRESS" : source === "club" ? "CLUB" : source === "sponsor" ? "SPON" : source === "finance" ? "€" : "AGT";
  return (
    <View pointerEvents="none" style={styles.cardCastLayer}>
      <MotiView
        from={{ translateY: 1, opacity: 0.92 }}
        animate={{ translateY: [1, -2, 1], opacity: [0.92, 1, 0.92] }}
        transition={{ type: "timing", duration: 980, loop: true }}
        style={[styles.cardMiniActor, styles.cardMiniAgent]}
      >
        <View style={styles.cardMiniHead} />
        <View style={styles.cardMiniSuit} />
      </MotiView>
      <MotiView
        from={{ translateX: 0, scale: 1 }}
        animate={{ translateX: danger ? [0, -2, 2, 0] : [0, 2, 0], scale: [1, 1.03, 1] }}
        transition={{ type: "timing", duration: danger ? 520 : 1180, loop: true }}
        style={[styles.cardMiniActor, styles.cardMiniCounter, danger && styles.cardMiniCounterDanger]}
      >
        <View style={[styles.cardMiniHead, styles.cardMiniCounterHead]} />
        <View style={styles.cardMiniDesk} />
        <Text style={styles.cardMiniTag}>{rightRole}</Text>
      </MotiView>
      <MotiView
        from={{ opacity: 0.45, translateY: 0 }}
        animate={{ opacity: [0.45, 1, 0.45], translateY: [0, -5, 0] }}
        transition={{ type: "timing", duration: 720, loop: true }}
        style={[styles.cardMiniSignal, danger && styles.cardMiniSignalDanger]}
      />
    </View>
  );
}

function SetupCareer({ career, tr, onComplete }) {
  const [step, setStep] = useState(career.prologueStep || 0);
  const [prologueChoice, setPrologueChoice] = useState(null);
  const defaultLeague = career.db.leagues?.find((league) => league.tier === 3)?.id || career.db.leagues?.[0]?.id;
  const [leagueId, setLeagueId] = useState(career.selectedLeagueId || defaultLeague);
  const selectedInitial = career.db.leagues.find((league) => league.id === (career.selectedLeagueId || defaultLeague));
  const [countryId, setCountryId] = useState(selectedInitial?.countryId === "intl" ? "tr" : selectedInitial?.countryId || "tr");
  const [tier, setTier] = useState(selectedInitial?.tier ?? 3);
  const clubs = career.db.clubs.filter((club) => club.leagueId === leagueId);
  const selectedLeague = career.db.leagues.find((league) => league.id === leagueId);
  const marketPlayers = career.db.players.filter((player) => clubs.some((club) => club.id === player.clubId));
  const hotProspects = marketPlayers.filter((player) => !player.represented && player.potential >= 82).length;
  const countries = career.db.countries.filter((country) => country.id !== "intl");
  const visibleLeagues = career.db.leagues.filter((league) => tier === 0 ? league.tournament : league.countryId === countryId && league.tier === tier);
  const thirdLeaguePool = career.db.players
    .filter((player) => {
      const club = career.db.clubs.find((item) => item.id === player.clubId);
      const league = career.db.leagues.find((item) => item.id === club?.leagueId);
      return league?.tier === 3 && !league.tournament && !player.represented;
    })
    .sort((a, b) => (b.scoutAIScore || b.potential || 0) - (a.scoutAIScore || a.potential || 0));
  const fallbackProspects = career.db.players
    .filter((player) => !player.represented)
    .sort((a, b) => (b.scoutAIScore || b.potential || 0) - (a.scoutAIScore || a.potential || 0));
  const thirdLeagueCandidates = [...thirdLeaguePool, ...fallbackProspects.filter((player) => !thirdLeaguePool.some((item) => item.id === player.id))]
    .slice(0, 3);
  const prologueCards = [
    {
      kicker: "Kart 1 / 3",
      art: storySceneImages[0],
      scene: "door",
      title: "Kapının önünde son para",
      text: `${career.agentName}, cebindeki son parayı yol ve takım elbiseye gömer. Hedef büyük: C.R.7 lakaplı kurgusal efsanenin ajansı olmak. Sorun şu: randevu yok, portföy yok, sadece ince bir dosya var.`,
      action: "Kapıyı zorla",
      choices: [
        { label: "Sakin gir", hint: "Dosyayı düzgün sun" },
        { label: "Parayı göster", hint: "Her şeyi masaya koy" }
      ]
    },
    {
      kicker: "Kart 2 / 3",
      art: storySceneImages[1],
      scene: "office",
      title: "Oda soğuk, cevap kısa",
      text: "Dosyaya bakarlar: temsil edilen oyuncu yok, kulüp referansı yok, kasada güç yok. Efsane gülmez bile. En ağır taraf bu olur. Asistan sadece şunu der: 'Yıldız isteme. Önce bir kariyer kurtar.'",
      action: "Dersi yut",
      choices: [
        { label: "İtiraz et", hint: "Bir şans daha iste" },
        { label: "Sus ve dinle", hint: "Gerçeği kabul et" }
      ]
    },
    {
      kicker: "Kart 3 / 3",
      art: storySceneImages[2],
      scene: "street",
      title: "Asansör sessiz iner",
      text: "Kovulmazsın; daha kötüsü olur, kibarca yok sayılırsın. Dışarı çıkınca telefon titrer: 'Üç 3. lig oyuncusu görüşmeye razı. Birini büyüt, sonra kapıları tekrar zorlarsın.'",
      action: "Mesajı aç",
      choices: [
        { label: "Mesaja dön", hint: "İlk müşteriyi bul" },
        { label: "Tekrar ara", hint: "Telefon yine kapanır" }
      ]
    }
  ];

  if (step < prologueCards.length) {
    const card = prologueCards[step];
    const advanceStory = (choice) => {
      setPrologueChoice(choice);
      setStep(step + 1);
    };
    return (
      <ScrollView style={styles.content} contentContainerStyle={styles.contentPad}>
        <LinearGradient colors={["#111827", "#1f2937", "#07120d"]} style={styles.prologueScreen}>
          <View style={styles.prologueGlow} />
          <AtmosphereDashes count={16} tone={step === 1 ? "gold" : "blue"} />
          <AnimatedEdgeLines tone={step === 2 ? "green" : "gold"} />
          <Text style={styles.prologueKicker}>{card.kicker}</Text>
          <View style={styles.prologueFilmDots}>
            {prologueCards.map((_, index) => <View key={index} style={[styles.prologueFilmDot, index === step && styles.prologueFilmDotActive]} />)}
          </View>
          <ImageBackground source={card.art} style={styles.prologueArt} imageStyle={styles.prologueArtImage}>
            <View style={styles.prologueArtShade} />
            <View style={styles.prologueLetterboxTop} />
            <View style={styles.prologueLetterboxBottom} />
            <PixelStoryCast scene={card.scene} agentName={career.agentName} />
            <MotiView from={{ translateY: 0 }} animate={{ translateY: [-2, 4, -2] }} transition={{ type: "timing", duration: 1300, loop: true }} style={styles.prologueArtBadge}>
              <Text style={styles.prologueArtBadgeText}>{step === 0 ? "Kapı" : step === 1 ? "Red" : "3 Aday"}</Text>
            </MotiView>
          </ImageBackground>
          <MotiView key={step} from={{ opacity: 0, translateY: 18, scale: 0.96 }} animate={{ opacity: 1, translateY: 0, scale: 1 }} transition={{ type: "timing", duration: 320 }} style={styles.prologueCard}>
            <PremiumSheen delay={step * 180} color="rgba(255,255,255,0.14)" />
            <RevealWords text={card.title} textStyle={styles.prologueTitle} />
            <Text style={styles.prologueText}>{card.text}</Text>
            <Text style={styles.prologueStakes}>{step === 0 ? "Hedef: imkânsız kapıdan içeri girmek" : step === 1 ? "Ders: portföy olmadan itibar yok" : "Yeni rota: alt ligden yukarı çıkmak"}</Text>
            {prologueChoice && <Text style={styles.prologueEcho}>Önceki karar: {prologueChoice}. Sonuç değişmedi; kapı hâlâ kapalı.</Text>}
            <View style={styles.prologueChoiceRow}>
              {card.choices.map((choice) => (
                <TouchableOpacity key={choice.label} style={styles.prologueChoiceButton} onPress={() => advanceStory(choice.label)}>
                  <Text style={styles.prologueChoiceText}>{choice.label}</Text>
                  <Text style={styles.prologueChoiceHint}>{choice.hint}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.prologueButton} onPress={() => advanceStory(card.action)}>
              <Text style={styles.prologueButtonText}>{card.action}</Text>
            </TouchableOpacity>
          </MotiView>
        </LinearGradient>
      </ScrollView>
    );
  }

  if (step === prologueCards.length) {
    return (
      <ScrollView style={styles.content} contentContainerStyle={styles.contentPad}>
        <View style={styles.prospectIntro}>
          <Image source={storySceneImages[2]} style={styles.prospectIntroArt} />
          <AnimatedEdgeLines tone="gold" />
          <PremiumSheen delay={200} color="rgba(251,191,36,0.16)" />
          <Text style={styles.setupKicker}>Kırılmadan sonraki ilk hamle</Text>
          <RevealWords text="İlk kaderini seç" textStyle={styles.setupTitle} />
          <Text style={styles.setupCopy}>C.R.7 kapısı kapandı. Bu üç oyuncudan biri ilk referansın olacak. Yanlış seçim aylar kaybettirir; doğru seçim ajansının adını ilk kez duyurur.</Text>
        </View>
        {thirdLeagueCandidates.map((player, index) => {
          const club = career.db.clubs.find((item) => item.id === player.clubId);
          const league = career.db.leagues.find((item) => item.id === club?.leagueId);
          const hook = prologuePlayerHook(player, index);
          return (
            <MotiView key={player.id} from={{ opacity: 0, translateY: 18 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 280, delay: index * 80 }}>
              <View style={styles.prospectChoice}>
                <PremiumSheen delay={index * 220} color="rgba(125,211,252,0.12)" />
                <PlayerPortrait player={player} size={58} />
                <View style={styles.listMain}>
                  <Text style={styles.prospectHook}>{hook.title}</Text>
                  <Text style={styles.cardTitle}>{player.name}</Text>
                  <Text style={styles.muted}>{player.position} · {club?.name || "Serbest"} · Pot {playerPotentialLabel(player)}</Text>
                  <Text style={styles.aiModelText}>AI Scout {player.scoutAIScore ?? 40} · Etki {player.impactScore ?? 45} · Komisyon %3</Text>
                  <Text style={styles.storyText}>{hook.text}</Text>
                  <Text style={styles.prospectRisk}>{hook.risk}</Text>
                </View>
                <TouchableOpacity style={styles.prospectPickButton} onPress={() => onComplete(league?.id || defaultLeague, player.id)}>
                  <Text style={styles.prospectPick}>Seç</Text>
                </TouchableOpacity>
              </View>
            </MotiView>
          );
        })}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.contentPad}>
      <View style={styles.setupHero}>
        <AnimatedEdgeLines tone="blue" />
        <AtmosphereDashes count={10} tone="blue" />
        <Text style={styles.setupKicker}>Haziran 2026</Text>
        <RevealWords text="Sıfır portföyle başla" textStyle={styles.setupTitle} />
        <Text style={styles.setupCopy}>Kulüp seçmiyorsun. Önce bir pazar seç, sonra Yetenekler/Scout ekranından ilk oyuncuyla temsil sözleşmesi imzala. Başlangıç komisyonun düşük; seviye ve saygınlık arttıkça oran büyür.</Text>
      </View>

      <SectionTitle text="Ülke" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.setupFilterScroll}>
        {countries.map((country) => (
          <TouchableOpacity key={country.id} style={[styles.setupFilterChip, countryId === country.id && tier !== 0 && styles.setupFilterChipActive]} onPress={() => {
            setCountryId(country.id);
            setTier(3);
            const next = career.db.leagues.find((league) => league.countryId === country.id && league.tier === 3) || career.db.leagues.find((league) => league.countryId === country.id);
            if (next) setLeagueId(next.id);
          }}>
            <Text style={[styles.setupFilterText, countryId === country.id && tier !== 0 && styles.setupFilterTextActive]}>{country.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <SectionTitle text="Seviye" />
      <View style={styles.setupTierRow}>
        {[3, 2, 1, 0].map((item) => (
          <TouchableOpacity key={item} style={[styles.setupTierChip, tier === item && styles.setupTierChipActive]} onPress={() => {
            setTier(item);
            const next = career.db.leagues.find((league) => item === 0 ? league.tournament : league.countryId === countryId && league.tier === item);
            if (next) setLeagueId(next.id);
          }}>
            <Text style={[styles.setupTierText, tier === item && styles.setupTierTextActive]}>{item === 0 ? "Kupa" : `${item}. Lig`}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionTitle text="Başlangıç Pazarı" />
      {visibleLeagues.map((league) => {
        const country = career.db.countries.find((item) => item.id === league.countryId);
        const selected = league.id === leagueId;
        const leagueClubs = career.db.clubs.filter((club) => club.leagueId === league.id);
        const leaguePlayers = career.db.players.filter((player) => leagueClubs.some((club) => club.id === player.clubId));
        const prospects = leaguePlayers.filter((player) => !player.represented && player.potential >= 82).length;
        return (
          <TouchableOpacity
            key={league.id}
            style={[styles.setupChoice, selected && styles.setupChoiceActive]}
            onPress={() => setLeagueId(league.id)}
          >
            <CountryBadge countryId={league.countryId} />
            <View style={styles.listMain}>
              <Text style={styles.cardTitle}>{league.name}</Text>
              <Text style={styles.muted}>{country?.name || league.countryId} - {league.tournament ? "Şampiyona" : `${league.tier}. seviye`} - {leagueClubs.length} kulüp - {prospects} yetenek{league.fixtureSource ? " - fikstürlü" : ""}</Text>
            </View>
            <Text style={styles.valueText}>Rep {league.reputation}</Text>
          </TouchableOpacity>
        );
      })}

      <View style={styles.setupMarketPanel}>
        <PremiumSheen delay={260} color="rgba(134,239,172,0.14)" />
        <View style={styles.setupMarketHeader}>
          <Text style={styles.setupMarketTitle}>{selectedLeague?.name || "Pazar"} ajans raporu</Text>
          <SignalEqualizer tone="green" bars={4} />
        </View>
        <View style={styles.setupMarketGrid}>
          <View style={styles.setupMarketStat}>
            <Text style={styles.setupMarketValue}>{clubs.length}</Text>
            <Text style={styles.setupMarketLabel}>kulüp</Text>
          </View>
          <View style={styles.setupMarketStat}>
            <Text style={styles.setupMarketValue}>{marketPlayers.length}</Text>
            <Text style={styles.setupMarketLabel}>oyuncu</Text>
          </View>
          <View style={styles.setupMarketStat}>
            <Text style={styles.setupMarketValue}>{hotProspects}</Text>
            <Text style={styles.setupMarketLabel}>hedef</Text>
          </View>
          <View style={styles.setupMarketStat}>
            <Text style={styles.setupMarketValue}>{(career.db.fixtures || []).filter((fixture) => fixture.leagueId === selectedLeague?.id).length}</Text>
            <Text style={styles.setupMarketLabel}>fikstür</Text>
          </View>
        </View>
        <Text style={styles.setupCopy}>İlk hedef: listedeki oyunculardan biriyle anlaş. Kendi oyuncun yoksa transfer teklifleri de gelmez; oyun scout ve ikna döngüsüyle başlar.</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={() => onComplete(selectedLeague?.id || leagueId)}>
        <Text style={styles.primaryButtonText}>Kariyeri Başlat</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function prologuePlayerHook(player, index) {
  const personality = player.personality || "professional";
  if (personality === "troubled") {
    return {
      title: "Sorunlu ama yetenekli",
      text: "Soyunma odasında herkes onun adını bilir; teknik ekip ise sabrını kaybetmek üzere. Onu toparlarsan büyük vitrin, batırırsan ilk krizin olur.",
      risk: "Risk: medya ve disiplin kartları daha erken gelebilir."
    };
  }
  if (personality === "money") {
    return {
      title: "Kontrat peşindeki oyuncu",
      text: "Ailesi ve çevresi hemen para istiyor. Doğru transferi bulursan hızlı komisyon yazarsın; yanlış söz verirsen güven bir haftada erir.",
      risk: "Risk: maaş ve imza parası baskısı yüksek."
    };
  }
  if ((player.hiddenPotential || player.potential || 0) - (player.overall || 0) >= 12) {
    return {
      title: "Kimsenin görmediği tavan",
      text: "Scout notları kararsız ama içgüdü bir şey söylüyor: bu oyuncu doğru planla patlayabilir. Sabır ister, vitrini geç gelir.",
      risk: "Risk: gelişim garanti değil, ilk aylar sessiz geçebilir."
    };
  }
  if (player.position === "GK" || player.position === "CB") {
    return {
      title: "Güvenli ama yavaş başlangıç",
      text: "Hücum oyuncusu kadar parlak değil, ama istikrar getirir. Kulüp ilişkisi kurmak ve ilk ciddi pazarlık için temiz bir yol.",
      risk: "Risk: piyasa ilgisi daha yavaş büyür."
    };
  }
  if (index === 0) {
    return {
      title: "Vitrin adayı",
      text: "Kısa vadede en çok dikkat çekecek isim bu. Formu tutarsa ilk teklif erken gelir, tutmazsa ajansın bütün hikayesi bekler.",
      risk: "Risk: beklenti yüksek, hata payı düşük."
    };
  }
  return {
    title: "Sessiz fırsat",
    text: "Büyük vaat satmıyor; çalışırsa değeri adım adım artar. Yeni bir ajans için daha az gürültülü, daha sağlam bir başlangıç.",
    risk: "Risk: hızlı para değil, sabır ister."
  };
}

function Dashboard({ career, tr, myPlayers, simState, onNextWeek, updateCareer, setScreen, openCardAgenda }) {
  const guide = dashboardGuide(career, myPlayers);
  const agenda = buildSeasonAgenda(career).slice(0, 2);
  const objective = (career.objectives || []).find((item) => !item.completed);
  const offers = (career.incomingOffers || []).slice(0, 2);
  const opportunities = career.db.players
    .filter((player) => {
      const pitch = buildRepresentationPitch(career, player.id);
      return !player.represented && pitch?.eligible;
    })
    .sort((a, b) => (b.scouted ? 1 : 0) - (a.scouted ? 1 : 0) || (b.potential || 0) - (a.potential || 0))
    .slice(0, 3);
  const priorityCards = [...(career.pendingCards || [])].sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  const story = career.story || {
    title: "Kiralık ofis, tek telefon",
    beat: "Ajansın piyasaya yeni girdi. İlk hedef alt ligde bir yeteneği ikna etmek.",
    objective: "İlk temsil sözleşmesini imzala.",
    tension: 18
  };
  const openTarget = (target) => {
    if (target === "agenda") {
      openCardAgenda(priorityCards.slice(0, 1));
      return;
    }
    setScreen(target);
  };
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 420 }}
      style={styles.dashWrap}
    >
      <LinearGradient colors={["#142033", "#0d3423", "#07120d"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dashHero}>
        <View style={styles.dashHeroGlow} />
        <View>
          <Text style={styles.dashKicker}>{career.seasonMonth || "Haziran"} · Hafta {career.week}</Text>
          <Text style={styles.dashTitle}>{career.agentName}</Text>
          <Text style={styles.dashSub}>{guide.copy}</Text>
        </View>
        <View style={styles.dashScore}>
          <Text style={styles.dashScoreValue}>{career.reputation}</Text>
          <Text style={styles.dashScoreLabel}>Saygınlık</Text>
        </View>
      </LinearGradient>

      <DashboardTicker career={career} />

      {priorityCards.length > 0 && (
        <TouchableOpacity style={styles.dashboardDecisionAlert} onPress={() => openTarget("agenda")}>
          <View style={styles.decisionAlertCount}><Text style={styles.decisionAlertCountText}>{priorityCards.length}</Text></View>
          <View style={styles.listMain}>
            <Text style={styles.decisionAlertTitle}>Karar bekliyor</Text>
            <Text style={styles.decisionAlertText}>Oyuncu, kulüp veya medya kartlarını çözmeden haftalar riskli geçer.</Text>
          </View>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => openTarget(guide.target)}>
        <LinearGradient colors={["#123524", "#0d2a1d"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.nextStepCard}>
          <Text style={styles.nextStepKicker}>Sıradaki hamle</Text>
          <Text style={styles.nextStepTitle}>{guide.title}</Text>
          <Text style={styles.nextStepText}>{guide.action}</Text>
        </LinearGradient>
      </TouchableOpacity>

      <FocusPlan career={career} updateCareer={updateCareer} disabled={!!simState} />

      <View style={styles.dashMetrics}>
        <MetricTile label="Kasa" value={formatMoney(career.money)} />
        <MetricTile label="Portföy" value={myPlayers.length} />
        <MetricTile label="Teklif" value={offers.length} />
      </View>

      <GameFlowChecklist career={career} myPlayers={myPlayers} setScreen={setScreen} />

      <View style={styles.dashActions}>
        <DashboardAction label="Oyuncu Bul" meta={`${opportunities.length} uygun`} tone="green" onPress={() => setScreen("scout")} />
        <DashboardAction label="Oyuncularım" meta={`${myPlayers.length} temsil`} tone="blue" onPress={() => setScreen("players")} />
        <DashboardAction label="Kulüpler" meta={career.transferSeason ? "pazar açık" : "pazar kapalı"} tone="gold" onPress={() => setScreen("clubs")} />
        <DashboardAction label="Ajans" meta={`etik ${career.ethics ?? 72}`} tone="dark" onPress={() => setScreen("empire")} />
      </View>

      {objective && <CompactObjective objective={objective} />}

      {offers.length > 0 && (
        <CompactPanel title="Masadaki Teklifler" badge={`${offers.length}`}>
          {offers.map((offer) => {
            const player = career.db.players.find((item) => item.id === offer.playerId);
            const club = career.db.clubs.find((item) => item.id === offer.clubId);
            return <Text key={offer.id} style={styles.compactLine}>{player?.name} › {club?.name} · Komisyon {formatMoney(offer.commission)}</Text>;
          })}
        </CompactPanel>
      )}

      <CompactPanel title={myPlayers.length ? "Portföy nabzı" : "Portföy boş"} badge={`${myPlayers.length}`}>
        {myPlayers.length ? myPlayers.slice(0, 3).map((player) => (
          <Text key={player.id} style={styles.compactLine}>{player.name} · Güven {player.agencyTrust ?? 50} · Komisyon %{player.agencyCommissionRate || 4}</Text>
        )) : (
          <Text style={styles.compactLine}>Henüz temsil ettiğin oyuncu yok. Önce genç bir yetenekle düşük komisyonlu sözleşme imzala.</Text>
        )}
      </CompactPanel>

      <CompactPanel title="Takip listesi" badge={`${opportunities.length}`}>
        {opportunities.map((player) => (
          <Text key={player.id} style={styles.compactLine}>{player.name} · {player.position} · Pot {playerPotentialLabel(player)}</Text>
        ))}
      </CompactPanel>

      <View style={styles.dashBottomRow}>
        <CompactPanel title="Ajanda" badge={career.transferSeason ? "Açık" : "Kapalı"} half>
          {agenda.map((item, index) => <Text key={`${item.type}-${index}`} style={styles.compactLine}>{item.label} · {item.weeksLeft ? `${item.weeksLeft} hf` : "şimdi"}</Text>)}
        </CompactPanel>
        <CompactPanel title="Gündem" badge={`${career.pendingCards.length}`} half onPress={() => openTarget("agenda")}>
          <Text style={styles.compactLine}>{career.pendingCards.length ? `${career.pendingCards.length} karar bekliyor` : "Bekleyen kart yok"}</Text>
        </CompactPanel>
      </View>

      <TouchableOpacity style={simState && styles.weekAdvanceDisabled} onPress={onNextWeek} disabled={!!simState || !!career.annualReport}>
        <LinearGradient colors={["#fbbf24", "#f97316"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.weekAdvanceButton}>
          <Text style={styles.weekAdvanceTextDark}>{simState ? "Maç hazırlanıyor..." : "Haftayı Hazırla"}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </MotiView>
  );
}

function DashboardTicker({ career }) {
  const lines = (career.news || []).slice(0, 2);
  if (!lines.length) return null;
  return (
    <View style={styles.dashboardTicker}>
      <View style={styles.liveStatusDot} />
      <View style={styles.listMain}>
        {lines.map((line, index) => (
          <Text key={`${line}-${index}`} style={styles.dashboardTickerText} numberOfLines={1}>{displayLine(null, line)}</Text>
        ))}
      </View>
    </View>
  );
}

function DashboardAction({ label, meta, tone, onPress }) {
  const icons = {
    green: Search,
    blue: Users,
    gold: Building2,
    dark: BriefcaseBusiness
  };
  const Icon = icons[tone] || Search;
  const gradients = {
    green: ["#14532d", "#0d3b25"],
    blue: ["#12385a", "#0f253f"],
    gold: ["#4a3413", "#2f2516"],
    dark: ["#243246", "#111827"]
  };
  return (
    <TouchableOpacity style={styles.dashActionButton} onPress={onPress}>
      <LinearGradient colors={gradients[tone]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dashActionGradient}>
        <View style={styles.dashActionIcon}>
          <Icon size={17} color="#f8fafc" strokeWidth={2.4} />
        </View>
        <Text style={styles.dashActionText}>{label}</Text>
        <Text style={styles.dashActionMeta}>{meta}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function GameFlowChecklist({ career, myPlayers, setScreen }) {
  const signable = career.db.players.some((player) => !player.represented && buildRepresentationPitch(career, player.id)?.eligible);
  const steps = [
    { label: "Aday bul", done: signable || myPlayers.length > 0, target: "scout" },
    { label: "Temsil imzala", done: myPlayers.length > 0, target: "scout" },
    { label: "Oyuncuyu yönet", done: myPlayers.some((player) => (player.agencyTrust || 0) >= 60), target: "players" },
    { label: "Teklif yarat", done: (career.incomingOffers || []).length > 0 || career.lastOffer, target: "players" },
    { label: "Ajansı büyüt", done: (career.empire?.staff?.length || 0) > 0 || (career.empire?.upgrades?.length || 0) > 0, target: "empire" }
  ];
  const completed = steps.filter((step) => step.done).length;
  return (
    <View style={styles.flowCard}>
      <View style={styles.flowHeader}>
        <Text style={styles.flowTitle}>Kariyer akışı</Text>
        <Text style={styles.flowBadge}>{completed}/{steps.length}</Text>
      </View>
      <View style={styles.flowRail}>
        {steps.map((step, index) => (
          <TouchableOpacity key={step.label} style={styles.flowStep} onPress={() => setScreen(step.target)}>
            <View style={[styles.flowDot, step.done && styles.flowDotDone]}>
              <Text style={[styles.flowDotText, step.done && styles.flowDotTextDone]}>{step.done ? "?" : index + 1}</Text>
            </View>
            <Text style={[styles.flowStepText, step.done && styles.flowStepTextDone]}>{step.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function usePulse(duration = 1350) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: Math.round(duration * 0.72), useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [duration, pulse]);
  return pulse;
}

function LivePulse() {
  const pulse = usePulse(900);
  return (
    <Animated.View
      style={[
        styles.liveStatusDot,
        {
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.35] }) }]
        }
      ]}
    />
  );
}

function FocusPlan({ career, updateCareer, disabled }) {
  const focusOptions = [
    { id: "balanced", label: "Denge", hint: "Bedava, risksiz hafta" },
    { id: "scout", label: "Scout", hint: "+rapor kalitesi, -€12K" },
    { id: "negotiation", label: "Pazarlık", hint: "+teklif şansı, -€15K" },
    { id: "pr", label: "PR", hint: "+saygınlık, -€18K" },
    { id: "care", label: "Bakım", hint: "+moral, -€10K" }
  ];
  const active = focusOptions.find((item) => item.id === (career.weeklyFocus || "balanced")) || focusOptions[0];
  return (
    <View style={styles.focusPlanCard}>
      <View style={styles.focusPlanHeader}>
        <View style={styles.focusPlanTitleRow}>
          <LivePulse />
          <Text style={styles.focusPlanTitle}>Haftalık plan</Text>
        </View>
        <Text style={styles.focusPlanActive}>{active.label}</Text>
      </View>
      <View style={styles.focusPlanRow}>
        {focusOptions.map((item) => {
          const selected = (career.weeklyFocus || "balanced") === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.focusPlanChip, selected && styles.focusPlanChipActive]}
              disabled={disabled}
              onPress={() => updateCareer({ ...career, weeklyFocus: item.id })}
            >
              <Text style={[styles.focusPlanChipText, selected && styles.focusPlanChipTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.focusPlanHint}>{active.hint}</Text>
    </View>
  );
}

function dashboardGuide(career, myPlayers) {
  if (!myPlayers.length) {
    return {
      title: "İlk oyuncunu bul",
      copy: "Ajansın boş. Para, önce temsil sözleşmesiyle başlar; büyük transfer sonra gelir.",
      action: "Oyuncu Bul ekranına git, düşük komisyonla genç bir yeteneği ikna et.",
      target: "scout"
    };
  }
  if ((career.pendingCards || []).length) {
    return {
      title: "Bekleyen kararı çöz",
      copy: "Kartları ertelemek güveni ve saygınlığı düşürür.",
      action: "Gündemi aç, oyuncu veya kulüp isteğine cevap ver.",
      target: "agenda"
    };
  }
  if ((career.incomingOffers || []).length) {
    return {
      title: "Teklif masada",
      copy: "Komisyon, oyuncu mutluluğu ve kulüp ilişkisini aynı anda tart.",
      action: "Piyasa tekliflerini incele.",
      target: "players"
    };
  }
  return {
    title: "Haftayı planla",
    copy: "Scout, PR ve oyuncu bakımı kararları gelecek haftayı değiştirir.",
    action: "Hazırsan haftayı ilerlet.",
    target: "dashboard"
  };
}

function MetricTile({ label, value }) {
  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function CompactObjective({ objective }) {
  const progress = Math.min(100, Math.round(((objective.progress || 0) / Math.max(1, objective.target || 1)) * 100));
  return (
    <View style={styles.compactPanel}>
      <View style={styles.compactHeader}>
        <Text style={styles.compactTitle}>Hedef</Text>
        <Text style={styles.compactBadge}>{progress}%</Text>
      </View>
      <Text style={styles.compactStrong}>{objective.title}</Text>
      <View style={styles.compactTrack}><View style={[styles.compactFill, { width: `${Math.max(4, progress)}%` }]} /></View>
    </View>
  );
}

function CompactPanel({ title, badge, children, half = false, onPress }) {
  const body = (
    <>
      <View style={styles.compactHeader}>
        <Text style={styles.compactTitle}>{title}</Text>
        {badge !== undefined && <Text style={styles.compactBadge}>{badge}</Text>}
      </View>
      {children}
    </>
  );
  if (onPress) {
    return (
      <TouchableOpacity style={[styles.compactPanel, half && styles.compactPanelHalf]} onPress={onPress}>
        {body}
      </TouchableOpacity>
    );
  }
  return (
    <View style={[styles.compactPanel, half && styles.compactPanelHalf]}>
      {body}
    </View>
  );
}

function buildWeekReport(previousCareer, nextCareer, preview, popupCards = []) {
  if (!previousCareer || !nextCareer) return null;
  const previousPlayers = getRepresentedPlayers(previousCareer);
  const nextPlayers = getRepresentedPlayers(nextCareer);
  const featured = preview?.featured;
  const fixture = featured
    ? (preview.fixtures || []).find((item) => item.id === featured.id)
    : (preview?.fixtures || [])[0];
  const score = fixture ? `${fixture.homeName || "Ev"} ${fixture.homeGoals}-${fixture.awayGoals} ${fixture.awayName || "Dep"}` : "Maç yok";
  const newOffers = Math.max(0, (nextCareer.incomingOffers || []).length - (previousCareer.incomingOffers || []).length);
  const discovered = Math.max(0, (nextCareer.db.players || []).length - (previousCareer.db.players || []).length);
  const representedDelta = nextPlayers.length - previousPlayers.length;
  const previousObjectiveMap = new Map((previousCareer.objectives || []).map((objective) => [objective.id, objective]));
  const completedObjectives = (nextCareer.objectives || [])
    .filter((objective) => objective.completed && !previousObjectiveMap.get(objective.id)?.completed)
    .map((objective) => ({
      id: objective.id,
      title: objectiveTitle(objective),
      reward: objective.reward || {}
    }));
  const previousAchievementMap = new Map((previousCareer.achievements || []).map((achievement) => [achievement.id, achievement]));
  const completedAchievements = (nextCareer.achievements || [])
    .filter((achievement) => achievement.completed && !previousAchievementMap.get(achievement.id)?.completed)
    .map((achievement) => ({
      id: achievement.id,
      title: achievement.title,
      reward: achievement.reward || {}
    }));
  const bestPlayer = nextPlayers
    .map((player) => {
      const before = previousCareer.db.players.find((item) => item.id === player.id);
      return { player, valueDelta: (player.value || 0) - (before?.value || player.value || 0), goalDelta: player.lastGoalDelta || 0 };
    })
    .sort((a, b) => b.valueDelta - a.valueDelta || b.goalDelta - a.goalDelta)[0];
  const playerChanges = nextPlayers
    .map((player) => {
      const before = previousCareer.db.players.find((item) => item.id === player.id) || {};
      const statsBefore = before.seasonStats || {};
      const statsAfter = player.seasonStats || {};
      return {
        id: player.id,
        player,
        name: player.name,
        position: player.position,
        valueDelta: (player.value || 0) - (before.value || player.value || 0),
        formDelta: (player.form || 0) - (before.form || player.form || 0),
        trustDelta: (player.agencyTrust || 0) - (before.agencyTrust || player.agencyTrust || 0),
        goalDelta: player.lastGoalDelta || 0,
        goalProgress: player.goalProgress ?? player.careerGoal?.start ?? 40,
        marketHeat: player.marketHeat || 0,
        marketHeatDelta: (player.marketHeat || 0) - (before.marketHeat || 0),
        activeCareerPlan: player.activeCareerPlan || null,
        goalsDelta: (statsAfter.goals || 0) - (statsBefore.goals || 0),
        shotsDelta: (statsAfter.shots || 0) - (statsBefore.shots || 0),
        highlightsDelta: (statsAfter.highlights || 0) - (statsBefore.highlights || 0),
        impactLabel: playerWeekImpactLabel({
          goalsDelta: (statsAfter.goals || 0) - (statsBefore.goals || 0),
          highlightsDelta: (statsAfter.highlights || 0) - (statsBefore.highlights || 0),
          marketHeatDelta: (player.marketHeat || 0) - (before.marketHeat || 0),
          trustDelta: (player.agencyTrust || 0) - (before.agencyTrust || player.agencyTrust || 0),
          valueDelta: (player.value || 0) - (before.value || player.value || 0)
        })
      };
    })
    .sort((a, b) => Math.abs(b.goalDelta) + Math.abs(b.valueDelta / 50000) + b.highlightsDelta - (Math.abs(a.goalDelta) + Math.abs(a.valueDelta / 50000) + a.highlightsDelta))
    .slice(0, 3);
  const representedIds = new Set(nextPlayers.map((player) => player.id));
  const clientHighlights = (preview?.events || [])
    .filter((event) => representedIds.has(event.playerId) && (event.type === "goal" || event.type === "shot" || event.type === "attack"))
    .slice(-4)
    .map((event) => ({ minute: event.minute, type: event.type, text: event.text }));
  const matchHighlights = clientHighlights.map((event) => ({ minute: event.minute, type: event.type, text: event.text }));
  const noOfferReason = newOffers > 0
    ? null
    : nextPlayers.length === 0
      ? "Teklif gelmez; önce temsil sözleşmesi imzalaman gerekiyor."
      : !nextCareer.transferSeason
        ? "Transfer dönemi kapalı. Şimdilik form, güven ve PR biriktir."
        : nextCareer.reputation < 30
          ? "Kulüpler yeni ajansı hemen aramaz. Birkaç hafta performans, güven ve ilişki biriktir."
          : "Oyuncu-kulüp ihtiyacı eşleşmedi. Kulüpler ekranından doğru ihtiyacı seçip pazarlığı sen başlat.";
  const nextAction = popupCards.length
    ? "Önce kartları çöz; karar verilmeden hafta akışı ilerlemez."
    : newOffers > 0
      ? "Teklifleri aç, komisyon ile oyuncu kariyeri arasında denge kur."
      : nextPlayers.length
        ? "Oyuncunu yönet: konuşma, bakım veya PR haftasıyla teklif ihtimalini büyüt."
        : "Scout ekranına gir ve ilk düşük komisyonlu oyuncuyu ikna et.";
  const focusImpact = buildWeeklyFocusImpact(previousCareer, nextCareer, {
    discovered,
    newOffers,
    reputationDelta: nextCareer.reputation - previousCareer.reputation,
    playerChanges,
    cardCount: popupCards.length
  });
  return {
    week: nextCareer.week,
    month: nextCareer.seasonMonth,
    score,
    moneyDelta: nextCareer.money - previousCareer.money,
    reputationDelta: nextCareer.reputation - previousCareer.reputation,
    representedDelta,
    newOffers,
    discovered,
    cards: popupCards.length,
    focus: nextCareer.weeklyFocus || "balanced",
    focusImpact,
    headline: (nextCareer.news || [])[0] || "Hafta tamamlandı.",
    bestPlayerName: bestPlayer?.player?.name || null,
    bestPlayerValueDelta: bestPlayer?.valueDelta || 0,
    completedObjectives,
    completedAchievements,
    playerChanges,
    matchHighlights,
    clientMatchFocus: true,
    noOfferReason,
    nextAction,
    popupCards
  };
}

function playerWeekImpactLabel(change = {}) {
  if ((change.goalsDelta || 0) > 0) return "Gol vitrini";
  if ((change.highlightsDelta || 0) >= 2) return "Maçta görünür";
  if ((change.marketHeatDelta || 0) > 8) return "Piyasa ısındı";
  if ((change.valueDelta || 0) > 50000) return "Değer arttı";
  if ((change.trustDelta || 0) > 3) return "Güven kazandı";
  if ((change.trustDelta || 0) < -3) return "Güven riski";
  return "Takipte";
}

function WeekReportModal({ report, onClose }) {
  if (!report) return null;
  const focusLabel = weeklyFocusLabel(report.focus);
  const actionLabel = report.cards ? `Kartları Aç (${report.cards})` : "Merkeze Dön";
  const unlockedItems = [
    ...(report.completedAchievements || []).map((item) => ({ ...item, kind: "Başarım" })),
    ...(report.completedObjectives || []).map((item) => ({ ...item, kind: "Hedef" }))
  ].slice(0, 2);
  const reportPlayers = (report.playerChanges || []).slice(0, 2);
  const planResults = (report.playerChanges || []).filter((item) => item.activeCareerPlan).slice(0, 1);
  const matchNotes = (report.matchHighlights || []).slice(-1);
  const compactNotes = [
    `Scout +${report.discovered}`,
    `Kart ${report.cards}`,
    report.bestPlayerName ? `${report.bestPlayerName}: ${formatSignedMoney(report.bestPlayerValueDelta)}` : null,
    report.noOfferReason ? report.noOfferReason : null
  ].filter(Boolean).slice(0, 2);
  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.reportOverlay}>
      <MotiView from={{ opacity: 0, scale: 0.96, translateY: 16 }} animate={{ opacity: 1, scale: 1, translateY: 0 }} transition={{ type: "timing", duration: 320 }} style={styles.weekReportShell}>
        <LinearGradient colors={["#142033", "#0f2b23", "#101827"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.weekReportCard}>
          <AtmosphereDashes count={10} tone="pitch" />
          <PremiumSheen delay={200} color="rgba(134,239,172,0.20)" />
          <View style={styles.weekReportGlow} />
          <View style={styles.weekReportHeader}>
            <View style={styles.focusPlanTitleRow}>
              <LivePulse />
              <Text style={styles.weekReportKicker}>{report.month} · Hafta {report.week}</Text>
            </View>
            <Text style={styles.weekReportBadge}>{focusLabel}</Text>
          </View>
          <Text style={styles.weekReportTitle}>Haftalık Ajans Raporu</Text>
          <Text style={styles.weekReportHeadline} numberOfLines={2}>{report.headline}</Text>

          <View style={styles.weekReportScore}>
            <Text style={styles.weekReportScoreText} numberOfLines={1}>{report.score}</Text>
          </View>

          <View style={styles.weekReportGrid}>
            <ReportDelta label="Kasa" value={formatSignedMoney(report.moneyDelta)} good={report.moneyDelta >= 0} />
            <ReportDelta label="Saygınlık" value={formatSignedNumber(report.reputationDelta)} good={report.reputationDelta >= 0} />
            <ReportDelta label="Portföy" value={formatSignedNumber(report.representedDelta)} good={report.representedDelta >= 0} />
            <ReportDelta label="Teklif" value={`+${report.newOffers}`} good={report.newOffers > 0} />
          </View>

          {report.focusImpact && (
            <View style={styles.weekReportFocusImpact}>
              <View style={styles.weekReportFocusTop}>
                <Text style={styles.weekReportFocusKicker}>Strateji etkisi</Text>
                <Text style={styles.weekReportFocusBadge}>{report.focusImpact.cost}</Text>
              </View>
              <Text style={styles.weekReportFocusTitle} numberOfLines={1}>{report.focusImpact.title}</Text>
              <Text style={styles.weekReportFocusText} numberOfLines={2}>{report.focusImpact.summary}</Text>
            </View>
          )}

          <View style={styles.weekReportNotes}>
            {compactNotes.map((note, index) => (
              <Text key={`${note}-${index}`} style={styles.weekReportNote} numberOfLines={1}>{note}</Text>
            ))}
          </View>

          {unlockedItems.length > 0 && (
            <View style={[styles.weekReportSection, styles.weekReportAchievementSection]}>
              <Text style={styles.weekReportSectionTitle}>Açılanlar</Text>
              {unlockedItems.map((item) => (
                <View key={item.id} style={styles.weekReportAchievementRow}>
                  <Text style={styles.weekReportAchievementTitle} numberOfLines={1}>{item.kind}: {item.title}</Text>
                  <Text style={styles.weekReportAchievementReward} numberOfLines={1}>Ödül: {rewardSummary(item.reward)}</Text>
                </View>
              ))}
            </View>
          )}

          {reportPlayers.length > 0 && (
            <View style={styles.weekReportSection}>
              <Text style={styles.weekReportSectionTitle}>Oyuncu Etkisi</Text>
              <View style={styles.weekReportPlayerGrid}>
                {reportPlayers.map((item) => (
                  <View key={item.id} style={styles.weekReportPlayerRow}>
                    <PlayerPortrait player={item.player} size={36} />
                    <View style={styles.weekReportPlayerText}>
                      <View style={styles.weekReportPlayerTop}>
                        <Text style={styles.weekReportPlayerName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.weekReportPlayerTag} numberOfLines={1}>{item.impactLabel}</Text>
                      </View>
                      <Text style={styles.weekReportPlayerMeta} numberOfLines={1}>
                        {formatSignedMoney(item.valueDelta)} · Gol +{item.goalsDelta} · Aks +{item.highlightsDelta}
                      </Text>
                      <Text style={styles.weekReportPlayerMeta} numberOfLines={1}>
                        Form {formatSignedNumber(item.formDelta)} · Güven {formatSignedNumber(item.trustDelta)} · Hedef {formatSignedNumber(item.goalDelta)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {planResults.length > 0 && (
            <View style={[styles.weekReportSection, styles.weekReportPlanSection]}>
              <Text style={styles.weekReportSectionTitle}>Plan Sonucu</Text>
              {planResults.map((item) => (
                <View key={`${item.id}-plan`} style={styles.weekReportPlanRow}>
                  <Text style={styles.weekReportPlanName} numberOfLines={1}>{item.name} · {careerPlanLabel(item.activeCareerPlan)}</Text>
                  <Text style={styles.weekReportPlanMeta} numberOfLines={1}>
                    Piyasa {formatSignedNumber(item.marketHeatDelta)} → {item.marketHeat}/100 · Hedef {item.goalProgress}/100
                  </Text>
                </View>
              ))}
            </View>
          )}

          {matchNotes.length > 0 && (
            <View style={styles.weekReportSection}>
              <Text style={styles.weekReportSectionTitle}>{report.clientMatchFocus ? "Temsilcinin Maç Notları" : "Maç Notları"}</Text>
              {matchNotes.map((item, index) => (
                <Text key={`${item.minute}-${item.type}-${index}`} style={styles.weekReportEvent} numberOfLines={1}>{item.minute}' · {item.text}</Text>
              ))}
            </View>
          )}

          <View style={styles.weekReportNext}>
            <Text style={styles.weekReportNextKicker}>Sıradaki hamle</Text>
            <Text style={styles.weekReportNextText}>{report.nextAction}</Text>
          </View>

          <View style={styles.weekReportFooter}>
            <TouchableOpacity style={styles.weekReportActionButton} onPress={onClose}>
              <Text style={styles.weekReportActionText}>{actionLabel}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
        </MotiView>
      </View>
    </Modal>
  );
}

function ReportDelta({ label, value, good }) {
  return (
    <View style={styles.weekReportMetric}>
      <Text style={[styles.weekReportMetricValue, good ? styles.weekReportGood : styles.weekReportBad]}>{value}</Text>
      <Text style={styles.weekReportMetricLabel}>{label}</Text>
    </View>
  );
}

function formatSignedMoney(value = 0) {
  if (!value) return "€0";
  return `${value > 0 ? "+" : "-"}${formatMoney(Math.abs(value))}`;
}

function formatSignedNumber(value = 0) {
  if (!value) return "0";
  return `${value > 0 ? "+" : ""}${value}`;
}

function weeklyFocusLabel(focus = "balanced") {
  const labels = {
    balanced: "Denge",
    scout: "Scout",
    negotiation: "Pazarlık",
    pr: "PR",
    care: "Bakım"
  };
  return labels[focus] || "Denge";
}

function buildWeeklyFocusImpact(previousCareer, nextCareer, stats = {}) {
  const focus = previousCareer?.weeklyFocus || "balanced";
  const label = weeklyFocusLabel(focus);
  const costs = { balanced: 0, scout: 12000, negotiation: 15000, pr: 18000, care: 10000 };
  const locked = (costs[focus] || 0) > Math.max(0, previousCareer?.money || 0);
  const avg = (items, field) => {
    if (!items?.length) return 0;
    return Math.round(items.reduce((sum, item) => sum + (item[field] || 0), 0) / items.length);
  };
  const marketGain = avg(stats.playerChanges, "marketHeatDelta");
  const trustGain = avg(stats.playerChanges, "trustDelta");
  const formGain = avg(stats.playerChanges, "formDelta");
  const lines = {
    balanced: {
      title: "Denge haftası",
      summary: `Risk almadın. Form ${formatSignedNumber(formGain)}, güven ${formatSignedNumber(trustGain)}; kasa baskısı düşük kaldı.`
    },
    scout: {
      title: "Scout ağı zorlandı",
      summary: `${stats.discovered || 0} yeni dosya ve ${stats.cardCount || 0} kart baskısı. Scout haftaları daha çok yetenek ve turnuva fırsatı doğurur.`
    },
    negotiation: {
      title: "Kulüp telefonları ısındı",
      summary: `${stats.newOffers || 0} yeni teklif. Pazarlık haftası kulüp ilgisini artırır ama sonuç için oyuncu vitrini de gerekir.`
    },
    pr: {
      title: "Medya görünürlüğü arttı",
      summary: `Saygınlık ${formatSignedNumber(stats.reputationDelta || 0)}, piyasa ${formatSignedNumber(marketGain)}. PR haftası sponsor ve medya kartlarını öne iter.`
    },
    care: {
      title: "Oyuncu tarafı sakinleşti",
      summary: `Güven ${formatSignedNumber(trustGain)}, form ${formatSignedNumber(formGain)}. Bakım haftası oyuncu moralini ve bağlılığını güçlendirir.`
    }
  };
  if (locked) {
    return {
      title: `${label} iptal edildi`,
      summary: "Kasa yetmediği için plan dengeli haftaya döndü. Büyük plan için önce gelir üretmen gerekiyor.",
      cost: "€0"
    };
  }
  return {
    title: lines[focus]?.title || `${label} haftası`,
    summary: lines[focus]?.summary || "Hafta stratejisi ajans akışına işlendi.",
    cost: (costs[focus] || 0) ? `-${formatMoney(costs[focus])}` : "€0"
  };
}

function objectiveTitle(objective = {}) {
  const labels = {
    "portfolio-3": "3 oyuncu temsil et",
    "rep-55": "Saygınlığı 55 yap",
    "portfolio-value-5m": "Portföy değeri 5M",
    "first-sponsor": "İlk sponsor anlaşması",
    "hire-staff": "İlk uzmanı işe al"
  };
  return labels[objective.id] || objective.title || "Ajans hedefi";
}

function cleanGameText(text = "") {
  return String(text)
    .replace(/\bmaas\b/g, "maaş")
    .replace(/\bsans\b/g, "şans")
    .replace(/\bacik\b/g, "açık")
    .replace(/\bkapali\b/g, "kapalı")
    .replace(/\bgecis\b/g, "geçiş")
    .replace(/\bhucumu\b/g, "hücumu")
    .replace(/\bhiz\b/g, "hız");
}

function AnnualReport({ career, onNextSeason }) {
  const report = career.annualReport;
  if (!report) return null;
  return (
    <View>
      <View style={styles.reportHero}>
        <Text style={styles.reportKicker}>{report.year} sezon sonu</Text>
        <Text style={styles.reportTitle}>Yıllık Bilanço</Text>
        <Text style={styles.reportCopy}>{report.summary}</Text>
        <View style={styles.reportGrade}>
          <Text style={styles.reportGradeValue}>{report.grade || "E"}</Text>
          <Text style={styles.reportGradeLabel}>Sezon notu</Text>
        </View>
      </View>
      <View style={styles.reportGrid}>
        <View style={styles.reportCard}><Text style={styles.reportValue}>{report.represented}</Text><Text style={styles.reportLabel}>Oyuncu</Text></View>
        <View style={styles.reportCard}><Text style={styles.reportValue}>{formatMoney(report.portfolioValue)}</Text><Text style={styles.reportLabel}>Portföy</Text></View>
        <View style={styles.reportCard}><Text style={styles.reportValue}>{formatMoney(report.money)}</Text><Text style={styles.reportLabel}>Kasa</Text></View>
        <View style={styles.reportCard}><Text style={styles.reportValue}>{report.reputation}</Text><Text style={styles.reportLabel}>Saygınlık</Text></View>
        <View style={styles.reportCard}><Text style={styles.reportValue}>{report.totalGoals || 0}</Text><Text style={styles.reportLabel}>Gol</Text></View>
        <View style={styles.reportCard}><Text style={styles.reportValue}>{report.avgTrust || 0}</Text><Text style={styles.reportLabel}>Ort. Güven</Text></View>
      </View>
      <View style={styles.reportPanel}>
        <Row left="Sponsor" right={`${report.sponsors}`} />
        <Row left="Personel" right={`${report.staff}`} />
        <Row left="En değerli oyuncu" right={report.bestPlayerName || "Yok"} />
        <Row left="Sezon aksiyonu" right={`${report.totalHighlights || 0}`} />
        <Row left="Tamamlanan hedef" right={`${report.completedObjectives || 0}`} />
        <Row left="Sezon başlangıcı" right="Haziran" />
      </View>
      <TouchableOpacity style={styles.primaryButton} onPress={onNextSeason}>
        <Text style={styles.primaryButtonText}>Yeni Sezona Geç</Text>
      </TouchableOpacity>
    </View>
  );
}

function MatchLiveCenter({ simState, career, onStart, onContinue, onSkip, soundOn, onToggleSound }) {
  const shownEvents = simState.preview.events.slice(0, simState.shown);
  const minute = Math.min(90, simState.minute || 0);
  const progress = Math.round((minute / 90) * 100);
  const fixtures = simState.preview.fixtures || [];
  const represented = getRepresentedPlayers(career);
  const representedIds = new Set(represented.map((player) => player.id));
  const representedClubIds = new Set(represented.map((player) => player.clubId).filter(Boolean));
  const goalCount = shownEvents.filter((event) => event.type === "goal" && representedIds.has(event.playerId)).length;
  const foulCount = shownEvents.filter((event) => event.type === "foul" && representedIds.has(event.playerId)).length;
  const statusText = !simState.running ? "Maç öncesi" : simState.halfPaused ? "Devre arası" : simState.finalizing ? "Maç bitti" : "Canlı simülasyon";
  return (
    <View style={styles.matchLiveShell}>
      <ImageBackground source={matchPitchImage} style={styles.matchDayHero} imageStyle={styles.matchDayHeroImage}>
        <View style={styles.matchDayHeroShade} />
        <View style={styles.matchDayTopLine}>
          <View style={styles.listMain}>
            <Text style={styles.matchDayKicker}>Haziran · Hafta {simState.preview.week}</Text>
            <Text style={styles.matchDayTitle}>Canlı Lig Merkezi</Text>
          </View>
          <Text style={[styles.matchDayStatusPill, simState.running && styles.matchDayStatusLive]}>
            {simState.finalizing ? "FT" : simState.halfPaused ? "Devre" : simState.running ? `${minute}'` : "Hazır"}
          </Text>
        </View>
        <View style={styles.matchLiveStats}>
          <View style={styles.matchLiveStatBox}>
            <Text style={styles.matchLiveStatValue}>{fixtures.length}</Text>
            <Text style={styles.matchLiveStatLabel}>Maç</Text>
          </View>
          <View style={styles.matchLiveStatBox}>
            <Text style={styles.matchLiveStatValue}>{represented.length}</Text>
            <Text style={styles.matchLiveStatLabel}>Oyuncun</Text>
          </View>
          <View style={styles.matchLiveStatBox}>
            <Text style={styles.matchLiveStatValue}>{goalCount}</Text>
            <Text style={styles.matchLiveStatLabel}>Gol</Text>
          </View>
          <View style={styles.matchLiveStatBox}>
            <Text style={styles.matchLiveStatValue}>{foulCount}</Text>
            <Text style={styles.matchLiveStatLabel}>Faul</Text>
          </View>
        </View>
        <View style={styles.matchProgressTrack}>
          <View style={[styles.matchProgressFill, { width: `${progress}%` }]} />
        </View>
        <View style={styles.matchControls}>
          {!simState.running && (
            <TouchableOpacity style={styles.matchControlPrimary} onPress={onStart}>
              <Text style={styles.matchControlText}>Maça Başla</Text>
            </TouchableOpacity>
          )}
          {simState.halfPaused && (
            <TouchableOpacity style={styles.matchControlPrimary} onPress={onContinue}>
              <Text style={styles.matchControlText}>2. Yarıyı Başlat</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.matchControlButton, !simState.running && styles.weekAdvanceDisabled]} onPress={onSkip} disabled={!simState.running}>
            <Text style={styles.matchControlText}>{simState.finalizing ? "Hafta Raporu" : "Sonuca Atla"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.matchSoundButton} onPress={onToggleSound}>
            <Text style={styles.matchSoundText}>{soundOn ? "Ses" : "Sessiz"}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.matchStatusLine}>{statusText} · Sadece ajans oyuncularının olayları detaylanır.</Text>
      </ImageBackground>
      <View style={styles.matchLiveGrid}>
        <LeagueFixtureBoard simState={simState} career={career} representedClubIds={representedClubIds} />
        <AgencyEventBoard simState={simState} career={career} fixtures={fixtures} />
      </View>
    </View>
  );
}

function LeagueFixtureBoard({ simState, career, representedClubIds: providedRepresentedClubIds }) {
  const fixtures = simState.preview.fixtures || [];
  if (!fixtures.length) return null;
  const minute = Math.min(90, simState.minute || 0);
  const shownEvents = simState.preview.events.slice(0, simState.shown);
  const representedClubIds = providedRepresentedClubIds || new Set(getRepresentedPlayers(career).map((player) => player.clubId).filter(Boolean));
  const clientFixtureCount = fixtures.filter((fixture) => representedClubIds.has(fixture.homeId) || representedClubIds.has(fixture.awayId)).length;
  const visibleFixtures = [...fixtures]
    .sort((a, b) => {
      const aClient = representedClubIds.has(a.homeId) || representedClubIds.has(a.awayId) ? 1 : 0;
      const bClient = representedClubIds.has(b.homeId) || representedClubIds.has(b.awayId) ? 1 : 0;
      return bClient - aClient;
    })
    .slice(0, 5);
  return (
    <View style={styles.leagueMatchTicker}>
      <View style={styles.leagueMatchTickerTop}>
        <View style={styles.leagueMatchTickerTitleBlock}>
          <Text style={styles.leagueMatchTickerTitle}>Fikstür</Text>
          <Text style={styles.leagueMatchTickerHint}>{clientFixtureCount ? "Oyuncularının maçları üstte" : "Tüm skorlar canlı güncellenir"}</Text>
        </View>
        <Text style={styles.leagueMatchTickerBadge}>{clientFixtureCount ? `${clientFixtureCount} ajans` : `${fixtures.length} maç`}</Text>
      </View>
      {visibleFixtures.map((fixture, index) => {
        const clientMatch = representedClubIds.has(fixture.homeId) || representedClubIds.has(fixture.awayId);
        const revealMinute = 8 + index * 4;
        const started = simState.running && minute >= revealMinute;
        const finished = minute >= 90 || simState.finalizing;
        const fixtureEvents = shownEvents.filter((event) => event.fixtureId === fixture.id);
        const liveHomeGoals = fixtureEvents.filter((event) => event.type === "goal" && event.side === "home").length;
        const liveAwayGoals = fixtureEvents.filter((event) => event.type === "goal" && event.side === "away").length;
        const scoreText = finished ? `${fixture.homeGoals}-${fixture.awayGoals}` : started ? `${liveHomeGoals}-${liveAwayGoals}` : "-";
        const stateText = finished ? "FT" : simState.halfPaused && started ? "DEVRE" : started ? "CANLI" : "BEK.";
        return (
          <View key={fixture.id || `${fixture.homeId}-${fixture.awayId}-${index}`} style={[styles.leagueMatchRow, clientMatch && styles.leagueMatchRowClient]}>
            <Text style={styles.leagueMatchTeam} numberOfLines={1}>{fixture.homeName}</Text>
            <Text style={[styles.leagueMatchScore, started && styles.leagueMatchScoreLive]}>{scoreText}</Text>
            <Text style={styles.leagueMatchTeamRight} numberOfLines={1}>{fixture.awayName}</Text>
            <Text style={[styles.leagueMatchState, finished && styles.leagueMatchStateDone, started && !finished && styles.leagueMatchStateLive]}>{stateText}</Text>
          </View>
        );
      })}
      {fixtures.length > visibleFixtures.length && <Text style={styles.leagueMatchMore}>+{fixtures.length - visibleFixtures.length} maç hafta raporunda</Text>}
    </View>
  );
}

function AgencyEventBoard({ simState, career, fixtures = [] }) {
  const shownEvents = simState.preview.events.slice(0, simState.shown);
  const minute = Math.min(90, simState.minute || 0);
  const represented = getRepresentedPlayers(career);
  const representedIds = new Set(represented.map((player) => player.id));
  const fixtureClubIds = new Set(fixtures.flatMap((fixture) => [fixture.homeId, fixture.awayId]));
  const clients = represented
    .map((player) => {
      const events = shownEvents.filter((event) => event.playerId === player.id);
      return {
        player,
        goals: events.filter((event) => event.type === "goal").length,
        shots: events.filter((event) => event.type === "shot" || event.type === "goal").length,
        fouls: events.filter((event) => event.type === "foul").length,
        last: events.at(-1),
        inFixture: fixtureClubIds.has(player.clubId)
      };
    })
    .sort((a, b) =>
      (b.inFixture ? 3 : 0) - (a.inFixture ? 3 : 0) ||
      (b.goals * 5 + b.shots * 2 + b.fouls + (b.last?.minute || 0) / 100) -
      (a.goals * 5 + a.shots * 2 + a.fouls + (a.last?.minute || 0) / 100)
    );
  const visibleClients = clients.slice(0, represented.length <= 2 ? 2 : 3);
  const hiddenClientCount = Math.max(0, represented.length - visibleClients.length);
  const latestEvents = shownEvents
    .filter((event) => representedIds.has(event.playerId) && event.type !== "fulltime")
    .slice(-2)
    .reverse();
  const emptyText = simState.running
    ? "Maçlar oynanıyor. Sadece senin oyuncularının gol, şut ve faul olayları burada görünür."
    : "Maçı başlatınca anlık akış sadece portföy oyuncularından gelir.";
  return (
    <View style={styles.compactMatchFeed}>
      <View style={styles.compactFeedTop}>
        <Text style={styles.compactFeedTitle}>Ajans Oyuncuları</Text>
        <Text style={styles.compactFeedBadge}>{represented.length ? `${visibleClients.length}/${represented.length}` : "0"}</Text>
      </View>
      <View style={styles.compactClientGrid}>
        {visibleClients.length ? visibleClients.map(({ player, goals, shots, fouls, inFixture }) => (
          <View key={player.id} style={[styles.compactClientPill, !inFixture && styles.compactClientPillIdle]}>
            <PlayerPortrait player={player} size={44} />
            <View style={styles.listMain}>
              <Text style={styles.compactClientName} numberOfLines={1}>{player.name}</Text>
              <Text style={styles.compactClientMeta}>{inFixture ? `G ${goals} · Ş ${shots} · F ${fouls}` : "Bu hafta fikstürde değil"}</Text>
            </View>
          </View>
        )) : (
          <View style={styles.compactEmptyClient}>
            <Text style={styles.compactEmptyClientText}>Portföy boş. Maç olayları için önce bir oyuncuyla anlaş.</Text>
          </View>
        )}
      </View>
      {hiddenClientCount > 0 && (
        <Text style={styles.compactClientSummary}>+{hiddenClientCount} oyuncu saklandı; maçtaki ve olay üretenler otomatik üste çıkar.</Text>
      )}
      <Text style={styles.compactFeedTitle}>Anlık Olaylar</Text>
      {(latestEvents.length ? latestEvents : [{ minute, text: emptyText, type: "idle", fixtureLabel: "" }]).map((event, index) => (
        <View key={`${event.minute}-${event.text}-${index}`} style={[styles.compactFeedLine, event.type === "goal" && styles.compactFeedGoal, event.type === "foul" && styles.compactFeedFoul]}>
          <Text style={styles.compactFeedMinute}>{event.minute}'</Text>
          <View style={styles.listMain}>
            {!!event.fixtureLabel && <Text style={styles.compactFeedFixture} numberOfLines={1}>{event.fixtureLabel}</Text>}
            <Text style={styles.compactFeedText} numberOfLines={2}>{event.text}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function MatchDayScreen({ simState, career, onStart, onContinue, onSkip }) {
  const featured = simState.preview.featured;
  const latest = simState.preview.events[Math.max(0, simState.shown - 1)];
  const shownEvents = simState.preview.events.slice(0, simState.shown);
  const liveHomeGoals = shownEvents.filter((event) => event.type === "goal" && event.side === "home").length;
  const liveAwayGoals = shownEvents.filter((event) => event.type === "goal" && event.side === "away").length;
  const homeClub = featured ? career.db.clubs.find((club) => club.id === featured.homeId) : null;
  const awayClub = featured ? career.db.clubs.find((club) => club.id === featured.awayId) : null;
  const minute = Math.min(90, simState.minute || 0);
  const progress = Math.round((minute / 90) * 100);
  const statusText = !simState.running ? "Maç öncesi" : simState.halfPaused ? "Devre arası" : simState.finalizing ? "Maç bitti" : "Canlı simülasyon";
  const watchTotal = featured?.watchTotalClients || 0;
  const watchReason = featured?.watchReason || (watchTotal ? "Portföy oyuncularının maçı öne alındı." : "Bu hafta ana lig fikstürü gösteriliyor.");
  return (
    <View>
      <View style={styles.matchDayHero}>
        <View style={styles.matchDayTopLine}>
          <Text style={styles.matchDayKicker}>Hafta {simState.preview.week}</Text>
          <Text style={[styles.matchDayStatusPill, simState.running && styles.matchDayStatusLive]}>
            {simState.finalizing ? "FT" : simState.halfPaused ? "Devre" : simState.running ? "Playing Matches..." : "Hazır"}
          </Text>
        </View>
        <View style={styles.matchScoreBoardCompact}>
          <View style={styles.matchTeamCompact}>
            <ClubCrest club={homeClub} size={38} />
            <Text style={styles.matchTeamCompactName} numberOfLines={1}>{featured?.homeName || "Ev"}</Text>
          </View>
          <View style={styles.matchCenterScoreBox}>
            <Text style={styles.matchMinuteBubble}>{minute}'</Text>
            <Text style={styles.matchScoreBig}>{liveHomeGoals}<Text style={styles.matchScoreDash}> - </Text>{liveAwayGoals}</Text>
            <Text style={styles.matchStatusTiny}>{statusText}</Text>
          </View>
          <View style={styles.matchTeamCompact}>
            <ClubCrest club={awayClub} size={38} />
            <Text style={styles.matchTeamCompactName} numberOfLines={1}>{featured?.awayName || "Dep"}</Text>
          </View>
        </View>
        <View style={styles.matchProgressTrack}>
          <View style={[styles.matchProgressFill, { width: `${progress}%` }]} />
        </View>
        <View style={styles.matchQuickStats}>
          <Text style={styles.matchQuickStat}>xG {featured?.homeXg ?? "-"}-{featured?.awayXg ?? "-"}</Text>
          <Text style={styles.matchQuickStat}>Şut {featured?.homeShots ?? "-"}-{featured?.awayShots ?? "-"}</Text>
          <Text style={styles.matchQuickStat}>Top {featured?.possessionHome ?? 50}%</Text>
        </View>
        <View style={styles.matchWatchReason}>
          <Text style={styles.matchWatchReasonKicker}>Ajans kamerası</Text>
          <Text style={styles.matchWatchReasonText} numberOfLines={2}>
            {watchTotal ? `${watchTotal} müşterili maç · ${watchReason}` : watchReason}
          </Text>
        </View>
        <View style={styles.matchControls}>
          {!simState.running && (
            <TouchableOpacity style={styles.matchControlPrimary} onPress={onStart}>
              <Text style={styles.matchControlText}>Maça Başla</Text>
            </TouchableOpacity>
          )}
          {simState.halfPaused && (
            <TouchableOpacity style={styles.matchControlPrimary} onPress={onContinue}>
              <Text style={styles.matchControlText}>2. Yarıyı Başlat</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.matchControlButton, !simState.running && styles.weekAdvanceDisabled]} onPress={onSkip} disabled={!simState.running}>
            <Text style={styles.matchControlText}>{simState.finalizing ? "Hafta Raporu" : "Sonuca Atla"}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <LeagueMatchTicker simState={simState} career={career} />
      <CompactMatchFeed simState={simState} career={career} />
    </View>
  );
}

function LeagueMatchTicker({ simState, career }) {
  const fixtures = simState.preview.fixtures || [];
  if (!fixtures.length) return null;
  const minute = Math.min(90, simState.minute || 0);
  const shownEvents = simState.preview.events.slice(0, simState.shown);
  const featuredId = simState.preview.featured?.id;
  const liveFeaturedHomeGoals = shownEvents.filter((event) => event.type === "goal" && event.side === "home").length;
  const liveFeaturedAwayGoals = shownEvents.filter((event) => event.type === "goal" && event.side === "away").length;
  const representedClubIds = new Set(getRepresentedPlayers(career).map((player) => player.clubId).filter(Boolean));
  const clientFixtureCount = fixtures.filter((fixture) => representedClubIds.has(fixture.homeId) || representedClubIds.has(fixture.awayId)).length;
  const visibleFixtures = [...fixtures]
    .sort((a, b) => {
      const aClient = representedClubIds.has(a.homeId) || representedClubIds.has(a.awayId) ? 1 : 0;
      const bClient = representedClubIds.has(b.homeId) || representedClubIds.has(b.awayId) ? 1 : 0;
      return bClient - aClient;
    })
    .slice(0, 4);
  return (
    <View style={styles.leagueMatchTicker}>
      <View style={styles.leagueMatchTickerTop}>
        <View style={styles.leagueMatchTickerTitleBlock}>
          <Text style={styles.leagueMatchTickerTitle}>Haftanın Maç Akışı</Text>
          <Text style={styles.leagueMatchTickerHint}>{clientFixtureCount ? "Ajans oyuncularının maçları üstte" : "Lig maçları sıra sıra simüle edilir"}</Text>
        </View>
        <Text style={styles.leagueMatchTickerBadge}>{clientFixtureCount ? `${clientFixtureCount} ajans` : `${fixtures.length} maç`}</Text>
      </View>
      {visibleFixtures.map((fixture, index) => {
        const clientMatch = representedClubIds.has(fixture.homeId) || representedClubIds.has(fixture.awayId);
        const revealMinute = 12 + index * 7;
        const started = simState.running && minute >= revealMinute;
        const finished = minute >= 90 || simState.finalizing;
        const isFeatured = fixture.id === featuredId;
        const scoreText = finished
          ? `${fixture.homeGoals}-${fixture.awayGoals}`
          : started && isFeatured
            ? `${liveFeaturedHomeGoals}-${liveFeaturedAwayGoals}`
            : started
              ? "canlı"
              : "-";
        const stateText = finished ? "FT" : simState.halftime && started ? "DEVRE" : started ? "CANLI" : "BEK.";
        return (
          <View key={fixture.id || `${fixture.homeId}-${fixture.awayId}-${index}`} style={[styles.leagueMatchRow, clientMatch && styles.leagueMatchRowClient]}>
            <Text style={styles.leagueMatchTeam} numberOfLines={1}>{fixture.homeName}</Text>
            <Text style={[styles.leagueMatchScore, started && styles.leagueMatchScoreLive]}>{scoreText}</Text>
            <Text style={styles.leagueMatchTeamRight} numberOfLines={1}>{fixture.awayName}</Text>
            <Text style={[styles.leagueMatchState, finished && styles.leagueMatchStateDone, started && !finished && styles.leagueMatchStateLive]}>{stateText}</Text>
          </View>
        );
      })}
    </View>
  );
}

function CompactMatchFeed({ simState, career }) {
  const featured = simState.preview.featured;
  const shownEvents = simState.preview.events.slice(0, simState.shown);
  const latestEvents = shownEvents.slice(-3);
  const clients = getRepresentedPlayers(career)
    .filter((player) => featured && (player.clubId === featured.homeId || player.clubId === featured.awayId))
    .slice(0, 2);
  const minute = Math.min(90, simState.minute || 0);
  const emptyText = simState.running
    ? "Maçlar oynanıyor. Önemli aksiyonlar burada düşer."
    : "Maçı başlatınca hafta fikstürü tek ekranda akar.";
  return (
    <View style={styles.compactMatchFeed}>
      {clients.length > 0 && (
        <View style={styles.compactClientRail}>
          {clients.map((player) => {
            const playerEvents = shownEvents.filter((event) => event.playerId === player.id);
            const goals = playerEvents.filter((event) => event.type === "goal").length;
            return (
              <View key={player.id} style={styles.compactClientPill}>
                <PlayerPortrait player={player} size={38} />
                <View style={styles.listMain}>
                  <Text style={styles.compactClientName} numberOfLines={1}>{player.name}</Text>
                  <Text style={styles.compactClientMeta}>Gol {goals} · Piyasa {player.marketHeat || 0}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
      <View style={styles.compactFeedTop}>
        <Text style={styles.compactFeedTitle}>Canlı Olaylar</Text>
        <Text style={styles.compactFeedBadge}>{minute}'</Text>
      </View>
      {(latestEvents.length ? latestEvents : [{ minute, text: emptyText, type: "idle" }]).map((event, index) => (
        <View key={`${event.minute}-${event.text}-${index}`} style={[styles.compactFeedLine, event.type === "goal" && styles.compactFeedGoal]}>
          <Text style={styles.compactFeedMinute}>{event.minute}'</Text>
          <Text style={styles.compactFeedText} numberOfLines={2}>{event.text}</Text>
        </View>
      ))}
    </View>
  );
}

function StoryletRail({ storylets, onOpen }) {
  if (!storylets?.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storyletScroll} contentContainerStyle={styles.storyletRail}>
      {storylets.map((item, index) => (
        <MotiView
          key={item.id}
          from={{ opacity: 0, translateY: 12, scale: 0.96 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: "timing", duration: 280, delay: index * 55 }}
        >
          <TouchableOpacity style={[styles.storyletCard, styles[`storylet_${item.tone}`]]} onPress={() => onOpen(item.target)}>
            <View style={styles.storyletTop}>
              <Text style={styles.storyletKicker}>{item.kicker}</Text>
              <Text style={styles.storyletProgress}>{Math.round(item.progress || 0)}%</Text>
            </View>
            <Text style={styles.storyletTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.storyletBody} numberOfLines={2}>{item.body}</Text>
            <View style={styles.storyletTrack}>
              <View style={[styles.storyletFill, { width: `${Math.max(8, Math.min(100, item.progress || 0))}%` }]} />
            </View>
            <Text style={styles.storyletCta}>{item.cta}</Text>
          </TouchableOpacity>
        </MotiView>
      ))}
    </ScrollView>
  );
}

function AnimatedDecisionDeck({ cards, onOpen }) {
  if (!cards?.length) return null;
  return (
    <View style={styles.cinemaDeck}>
      <View style={styles.cinemaHeader}>
        <Text style={styles.cinemaTitle}>Canlı Kart Destesi</Text>
        <Text style={styles.cinemaBadge}>{cards.length}</Text>
      </View>
      <View style={styles.deckStage}>
        {cards.slice(0, 4).map((card, index) => {
          const top = index === 0;
          const offset = index * 9;
          return (
            <MotiView
              key={card.id}
              from={{ opacity: 0, translateY: 26, scale: 0.92, rotate: `${index % 2 ? -4 : 4}deg` }}
              animate={{ opacity: top ? 1 : 0.72 - index * 0.08, translateY: top ? 0 : offset, scale: 1 - index * 0.045, rotate: `${top ? -1 : index % 2 ? -5 : 5}deg` }}
              transition={{ type: "timing", duration: 360, delay: index * 70 }}
              style={[styles.deckCardLayer, { zIndex: 10 - index }]}
            >
              <TouchableOpacity disabled={!top} activeOpacity={0.86} onPress={() => onOpen(card.target)} style={[styles.deckCard, styles[`deck_${card.tone}`]]}>
                <View style={styles.deckCardGlow} />
                <View style={styles.deckCardTop}>
                  <Text style={styles.deckSource}>{card.source}</Text>
                  <Text style={styles.deckMeta}>{card.meta}</Text>
                </View>
                <Text style={styles.deckTitle} numberOfLines={1}>{card.title}</Text>
                <Text style={styles.deckBody} numberOfLines={2}>{card.body}</Text>
                <View style={styles.deckBottom}>
                  <View style={styles.deckDots}>
                    {cards.slice(0, 4).map((dot) => <View key={dot.id} style={[styles.deckDot, dot.id === card.id && styles.deckDotActive]} />)}
                  </View>
                  <Text style={styles.deckCta}>{top ? "Aç" : "Sırada"}</Text>
                </View>
              </TouchableOpacity>
            </MotiView>
          );
        })}
      </View>
    </View>
  );
}

function StoryHistoryStrip({ story }) {
  const log = (story?.log || []).slice(0, 3);
  if (!log.length) return null;
  return (
    <View style={styles.storyHistoryBox}>
      <View style={styles.storyHistoryHeader}>
        <Text style={styles.storyHistoryKicker}>Hikaye Günlüğü</Text>
        <Text style={styles.storyHistoryCount}>{log.length}</Text>
      </View>
      {log.map((item, index) => (
        <View key={`${item.week}-${item.title}-${index}`} style={styles.storyHistoryLine}>
          <Text style={styles.storyHistoryWeek}>H{item.week}</Text>
          <View style={styles.listMain}>
            <Text style={styles.storyHistoryTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.storyHistoryBody} numberOfLines={2}>{item.body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function SeasonPressurePanel({ career }) {
  const agenda = buildSeasonAgenda(career).slice(0, 3);
  const progress = Math.min(100, Math.round(((career.week || 1) / 52) * 100));
  const cards = career.pendingCards?.length || 0;
  const offers = career.incomingOffers?.length || 0;
  return (
    <View style={styles.seasonPressureBox}>
      <View style={styles.seasonPressureHeader}>
        <Text style={styles.seasonPressureKicker}>Sezon Baskısı</Text>
        <Text style={[styles.seasonPressureWindow, career.transferSeason ? styles.seasonWindowOpen : styles.seasonWindowClosed]}>
          {career.transferSeason ? "Transfer açık" : "Transfer kapalı"}
        </Text>
      </View>
      <View style={styles.seasonTrack}>
        <View style={[styles.seasonTrackFill, { width: `${progress}%` }]} />
      </View>
      <View style={styles.seasonPressureStats}>
        <Text style={styles.seasonPressureStat}>Hafta {career.week}/52</Text>
        <Text style={styles.seasonPressureStat}>{offers} teklif</Text>
        <Text style={styles.seasonPressureStat}>{cards} kart</Text>
      </View>
      {agenda.length > 0 && (
        <View style={styles.seasonAgendaMini}>
          {agenda.map((item, index) => (
            <Text key={`${item.type}-${index}`} style={styles.seasonAgendaLine} numberOfLines={1}>
              {item.weeksLeft === 0 ? "Şimdi" : `${item.weeksLeft} hf`} · {item.label}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

function HomeCommandCenter({ career, tr, myPlayers, onNextWeek, updateCareer, setScreen, setSelectedPlayerId, setOffer, simState, openCardAgenda, setDecisionFlash, soundOn, onToggleSound }) {
  const pendingCards = career.pendingCards || [];
  const story = career.story || {
    title: "Kiralık ofis, tek telefon",
    beat: "Ajans piyasaya yeni girdi. İlk hedef alt ligde bir yeteneği ikna etmek.",
    objective: "İlk temsil sözleşmesini kapat.",
    tension: 18
  };
  const representedCount = getRepresentedPlayers(career).length;
  const agencyCapacity = getAgencyCapacity(career);
  const completedObjectives = (career.objectives || []).filter((objective) => objective.completed);
  const completedAchievements = (career.achievements || []).filter((achievement) => achievement.completed);
  const lastCompletedObjective = completedObjectives[completedObjectives.length - 1];
  const inDebt = career.money < 0;
  const talents = (career.db?.players || []).filter((player) => !player.represented && buildRepresentationPitch(career, player.id)?.eligible).length;
  const priorityCards = [...pendingCards].sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  const openTarget = (target) => {
    if (target === "nextWeek") {
      if (!simState && !pendingCards.length) onNextWeek();
      return;
    }
    if (target === "agenda") {
      openCardAgenda(priorityCards.slice(0, 1));
      return;
    }
    if (target === "offer") {
      const nextOffer = (career.incomingOffers || [])[0];
      if (nextOffer) {
        setSelectedPlayerId?.(nextOffer.playerId);
        setOffer?.(nextOffer);
        setScreen("negotiate");
        return;
      }
      setScreen("players");
      return;
    }
    setScreen(target);
  };
  const focusOptions = [
    { id: "balanced", label: "Denge", hint: "risksiz hafta", cost: 0 },
    { id: "scout", label: "Scout", hint: "+scout, -€12K", cost: 12000 },
    { id: "negotiation", label: "Paz.", hint: "+teklif, -€15K", cost: 15000 },
    { id: "pr", label: "PR", hint: "+rep, -€18K", cost: 18000 },
    { id: "care", label: "Bakım", hint: "+moral, -€10K", cost: 10000 }
  ];
  const activeFocus = focusOptions.find((item) => item.id === (career.weeklyFocus || "balanced")) || focusOptions[0];
  const activeFocusLocked = activeFocus.cost > 0 && career.money < activeFocus.cost;
  const chooseFocus = (item) => {
    if (simState) {
      setDecisionFlash?.({ title: "Maç haftası başladı", summary: "Planı değiştirmek için maç haftasının bitmesini bekle.", tone: "delay" });
      return;
    }
    if (item.cost > 0 && career.money < item.cost) {
      setDecisionFlash?.({ title: "Bütçe yetmiyor", summary: `${item.label} planı için ${formatMoney(item.cost)} gerekiyor.`, tone: "decline" });
      return;
    }
    updateCareer({ ...career, weeklyFocus: item.id });
    setDecisionFlash?.({
      title: "Hafta planı seçildi",
      summary: `${item.label}: ${item.hint}. Sonraki hafta simülasyonunda etkisi görünür.`,
      tone: "accept"
    });
  };
  const coachNote = buildHomeCoachNote(career, myPlayers, pendingCards, talents);
  const leadClient = [...myPlayers].sort((a, b) =>
    (b.marketHeat || 0) + (b.agencyTrust || 0) + (b.goalProgress || 0) -
    ((a.marketHeat || 0) + (a.agencyTrust || 0) + (a.goalProgress || 0))
  )[0];
  const leadPlanDone = !!leadClient && leadClient.planWeek === career.week;
  const advanceLabel = pendingCards.length ? `>> Kartları Çöz (${pendingCards.length})` : simState ? ">> Maç oynanıyor..." : ">> Sonraki Hafta";
  const mission = pendingCards.length
    ? { title: "Karar bekliyor", copy: "Hafta ilerlemeden önce kartları çöz. Her kartta kabul veya red seçmek zorundasın.", target: "agenda", cta: "Kartları Aç" }
    : inDebt
      ? { title: "Kasayı kurtar", copy: "Ajans eksi bakiyede. Harcamayı kes, sponsor/teklif kovala ve riskli kartlardan uzak dur.", target: "empire", cta: "Finansa Git" }
    : representedCount === 0
      ? { title: "İlk oyuncuyu bul", copy: "Radarında az aday var. Scout raporuna gir, düşük komisyonla ilk temsil sözleşmesini kovala.", target: "scout", cta: "Yeteneklere Git" }
      : (career.incomingOffers || []).length
        ? { title: "Masada teklif var", copy: "Komisyon, maaş ve kulüp ilişkisini aynı anda tart. Açgözlü hamle uzun vadeyi yakar.", target: "offer", cta: "Pazarlığa Gir" }
        : leadPlanDone
          ? { title: "Plan hazır", copy: `${leadClient.name} için haftalık plan seçildi. Şimdi maç haftasına geç ve sonuçları gör.`, target: "nextWeek", cta: "Haftayı Oynat" }
          : { title: "Oyuncunu vitrine çıkar", copy: "İlk haftalarda büyük teklif bekleme. Form, güven ve medya görünürlüğü teklif ihtimalini artırır.", target: "players", cta: "Portföyü Yönet" };
  const missionSignals = buildMissionSignals({ mission, career, pendingCards, representedCount, agencyCapacity, talents, leadClient, leadPlanDone, activeFocus });
  const commandActions = [
    { label: "Portföy", value: `${representedCount}/${agencyCapacity}`, icon: "P", target: "players" },
    { label: "Scout", value: `${talents}`, icon: "S", target: "scout" },
    { label: "Teklif", value: career.incomingOffers?.length || 0, icon: "T", target: (career.incomingOffers?.length || 0) ? "offer" : "players" },
    { label: "Kulüpler", value: "Pazar", icon: "K", target: "clubs" },
    { label: "Ajans", value: career.reputation, icon: "A", target: "empire" },
    { label: pendingCards.length ? "Kart" : "Gündem", value: pendingCards.length || career.news?.length || 0, icon: "!", target: pendingCards.length ? "agenda" : "inbox" }
  ];
  return (
    <ImageBackground source={stadiumImage} style={styles.homeBoard} imageStyle={styles.homeBoardImage}>
      <View style={styles.homeShade} />
      <AtmosphereDashes count={10} tone="pitch" />
      <View style={styles.homePitchLine} />
      <View style={styles.homePitchCircle} />
      <View style={styles.homeCleanTop}>
        <View style={styles.homeIdentityBlock}>
          <Text style={styles.homeAgentName} numberOfLines={1}>{career.agentName}</Text>
          <Text style={styles.homeSeasonLine}>{career.seasonMonth || "Haziran"} · Hafta {career.week} · {career.transferSeason ? "Transfer açık" : "Transfer kapalı"}</Text>
        </View>
        <View style={styles.homeWalletBlock}>
          <Text style={[styles.homeWalletValue, inDebt && styles.homeTopTextDanger]}>{formatMoney(career.money)}</Text>
          <Text style={styles.homeWalletLabel}>Kasa</Text>
        </View>
        <TouchableOpacity style={styles.homeSoundPill} onPress={onToggleSound}>
          <Text style={styles.homeSoundText}>{soundOn ? "Ses açık" : "Ses kapalı"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.homeProgressPanel}>
        <View style={styles.homeProgressTop}>
          <Text style={styles.homeProgressTitle} numberOfLines={1}>{story.title}</Text>
          <Text style={styles.homeProgressBadge}>{story.tension || 20}%</Text>
        </View>
        <Text style={styles.homeProgressCopy} numberOfLines={2}>{story.objective}</Text>
        <View style={styles.homeProgressTrack}>
          <View style={[styles.homeProgressFill, { width: `${Math.max(5, Math.min(100, story.tension || 20))}%` }]} />
        </View>
      </View>

      <TouchableOpacity style={[styles.homeMissionPanel, styles.homeMissionPanelClean]} onPress={() => openTarget(mission.target)}>
        <PremiumSheen delay={120} color="rgba(255,255,255,0.12)" />
        <View style={styles.homeMissionTop}>
          <Text style={styles.homeMissionKicker}>Sıradaki gerçek hamle</Text>
          <Text style={styles.homeMissionCta}>{mission.cta}</Text>
        </View>
        <Text style={styles.homeMissionTitle} numberOfLines={1}>{mission.title}</Text>
        <Text style={styles.homeMissionCopy} numberOfLines={2}>{mission.copy}</Text>
        <View style={styles.homeMissionSignalRow}>
          {missionSignals.map((signal, index) => (
            <Text key={`${signal}-${index}`} style={[styles.homeMissionSignal, index === 0 && styles.homeMissionSignalPrimary]} numberOfLines={1}>
              {signal}
            </Text>
          ))}
        </View>
        <Text style={styles.homeCoachInline} numberOfLines={2}>Koç: {coachNote}</Text>
      </TouchableOpacity>

      {myPlayers.length > 0 && (
        <FirstClientPlan
          career={career}
          players={myPlayers}
          updateCareer={updateCareer}
          setDecisionFlash={setDecisionFlash}
          onOpenPlayer={(playerId) => {
            setSelectedPlayerId?.(playerId);
            setScreen("players");
          }}
        />
      )}

      {inDebt && (
        <TouchableOpacity style={[styles.cashPressureBar, inDebt && styles.cashPressureBarDebt]} onPress={() => openTarget("empire")}>
          <Text style={styles.cashPressureKicker}>{inDebt ? "Kasa alarmı" : "Kasa zayıf"}</Text>
          <Text style={styles.cashPressureText} numberOfLines={1}>
            {inDebt ? "Paralı planlar kilitlendi; gelir bulman gerekiyor." : "Harcamalı plan seçerken dikkatli ol."}
          </Text>
        </TouchableOpacity>
      )}

      {lastCompletedObjective && (
        <View style={styles.homeAchievementBar}>
          <Text style={styles.homeAchievementKicker}>Son başarı</Text>
          <Text style={styles.homeAchievementText} numberOfLines={1}>{objectiveTitle(lastCompletedObjective)}</Text>
        </View>
      )}

      <View style={styles.homeCommandGrid}>
        {commandActions.map((item) => (
          <TouchableOpacity key={item.label} style={[styles.homeCommandButton, item.target === "agenda" && styles.homeCommandButtonAlert]} onPress={() => openTarget(item.target)}>
            <Text style={styles.homeCommandIcon}>{item.icon}</Text>
            <View style={styles.homeCommandTextBlock}>
              <Text style={styles.homeCommandLabel} numberOfLines={1}>{item.label}</Text>
              <Text style={styles.homeCommandValue} numberOfLines={1}>{item.value}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.homeWeekPlanPanel}>
        <View style={styles.homeWeekPlanTop}>
          <Text style={styles.homeWeekPlanTitle}>Hafta stratejisi</Text>
          <Text style={styles.homeWeekPlanBadge}>{activeFocus.label}</Text>
        </View>
        <View style={styles.homeWeekPlanRow}>
          {focusOptions.map((item) => {
            const selected = item.id === activeFocus.id;
            const locked = item.cost > 0 && career.money < item.cost;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.homeWeekPlanChip, selected && styles.homeWeekPlanChipActive, locked && styles.homeWeekPlanChipLocked]}
                onPress={() => chooseFocus(item)}
              >
                <Text style={[styles.homeWeekPlanChipText, selected && styles.homeWeekPlanChipTextActive, locked && styles.homeWeekPlanChipTextLocked]} numberOfLines={1}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.homeFocusCompact}>
        <Text style={[styles.focusHint, styles.focusHintClean, activeFocusLocked && styles.focusHintDanger]}>
          Hafta planı: {activeFocusLocked ? `${activeFocus.label} kilitli` : `${activeFocus.label} · ${activeFocus.hint}`}
        </Text>
      </View>
      <MotiView from={{ scale: 1 }} animate={{ scale: simState ? 1 : 1.025 }} transition={{ type: "timing", duration: 850, loop: true }}>
        <TouchableOpacity
          style={[styles.weekAdvanceButton, pendingCards.length && styles.weekAdvanceAttention, simState && styles.weekAdvanceDisabled]}
          onPress={() => pendingCards.length ? openCardAgenda(priorityCards.slice(0, 1)) : onNextWeek()}
          disabled={!!simState}
        >
          <Text style={styles.weekAdvanceText}>{advanceLabel}</Text>
        </TouchableOpacity>
      </MotiView>
    </ImageBackground>
  );
}

function FirstClientPlan({ career, players = [], onOpenPlayer, updateCareer, setDecisionFlash }) {
  const lead = [...players].sort((a, b) =>
    (b.marketHeat || 0) + (b.agencyTrust || 0) + (b.goalProgress || 0) -
    ((a.marketHeat || 0) + (a.agencyTrust || 0) + (a.goalProgress || 0))
  )[0];
  if (!lead) return null;
  const trust = lead.agencyTrust ?? 55;
  const heat = lead.marketHeat || 0;
  const goal = lead.goalProgress || Math.round(((lead.seasonStats?.goals || 0) * 12) + ((lead.seasonStats?.highlights || 0) * 8));
  const steps = [
    { label: "Güven", value: trust, target: 70, tone: trust >= 70 ? "good" : "warn" },
    { label: "Piyasa", value: heat, target: 45, tone: heat >= 45 ? "good" : "warn" },
    { label: "Vitrin", value: goal, target: 60, tone: goal >= 60 ? "good" : "warn" }
  ];
  const next = steps.find((item) => item.value < item.target) || { label: "Teklif", value: 100, target: 100 };
  const upside = (lead.hiddenPotential || lead.potential || 0) - (lead.overall || 0);
  const riskLabel = (lead.injuryRisk || 0) >= 24
    ? "Sakatlık riski"
    : (lead.ego || 0) >= 68
      ? "Ego baskısı"
      : (lead.loyalty || 55) < 45
        ? "Sadakat düşük"
        : "Kontrollü risk";
  const upsideLabel = upside >= 14
    ? "Gizli tavan"
    : (lead.growthRate || 0) >= 68
      ? "Hızlı gelişir"
      : "Sabır ister";
  const quickPlans = [
    { id: "care", label: "Güven", cost: 12000, effect: "+6 güven" },
    { id: "showcase", label: "Vitrin", cost: 18000, effect: "+18 piyasa" },
    { id: "training", label: "Gelişim", cost: 14000, effect: "+7 hedef" }
  ];
  const planAlreadyRun = lead.planWeek === career.week;
  return (
    <View style={styles.clientPlanPanel}>
      <View style={styles.clientPlanTop}>
        <Text style={styles.clientPlanKicker}>İlk müşteri planı</Text>
        <Text style={styles.clientPlanBadge}>W{career.week}</Text>
      </View>
      <View style={styles.clientPlanMain}>
        <PlayerPortrait player={lead} size={54} />
        <View style={styles.listMain}>
          <View style={styles.clientPlanNameRow}>
            <Text style={styles.clientPlanTitle} numberOfLines={1}>{lead.name}</Text>
            <Text style={styles.clientPlanValue} numberOfLines={1}>{formatMoney(lead.value || 0)}</Text>
          </View>
          <Text style={styles.clientPlanText} numberOfLines={1}>
            {lead.age} yaş · {personalityLabel(lead.personality)} · Sıradaki eşik: {next.label}
          </Text>
          <View style={styles.clientPlanChipRow}>
            <Text style={[styles.clientPlanMiniChip, styles.clientPlanMiniChipGold]} numberOfLines={1}>{upsideLabel}</Text>
            <Text style={styles.clientPlanMiniChip} numberOfLines={1}>{riskLabel}</Text>
            <Text style={styles.clientPlanMiniChip} numberOfLines={1}>Kom. %{lead.agencyCommissionRate || 4}</Text>
          </View>
        </View>
      </View>
      {planAlreadyRun && (
        <View style={styles.clientPlanStatus}>
          <Text style={styles.clientPlanStatusText} numberOfLines={1}>
            Aktif plan: {careerPlanLabel(lead.activeCareerPlan || "balanced")} · haftayı oynatınca maç etkisi gelir.
          </Text>
        </View>
      )}
      <View style={styles.clientQuickPlanRow}>
        {quickPlans.map((plan) => {
          const locked = career.money < plan.cost || planAlreadyRun;
          const recommended = (next.label === "Güven" && plan.id === "care") || (next.label === "Piyasa" && plan.id === "showcase") || (next.label === "Vitrin" && plan.id === "training");
          return (
            <TouchableOpacity
              key={plan.id}
              style={[styles.clientQuickPlanButton, recommended && styles.clientQuickPlanRecommended, locked && styles.disabledButton]}
              onPress={() => {
                if (planAlreadyRun) {
                  setDecisionFlash?.({
                    title: "Bu hafta plan yapıldı",
                    summary: `${lead.name} için haftalık plan zaten seçildi. Maç haftasını geçirince tekrar karar ver.`,
                    tone: "delay"
                  });
                  return;
                }
                const result = runPlayerCareerPlan(career, lead.id, plan.id);
                updateCareer?.(result.career);
                setDecisionFlash?.({
                  title: result.ok ? "Oyuncu planı uygulandı" : "Plan bütçesi yetmedi",
                  summary: result.ok ? `${lead.name}: ${plan.label} planı başladı. ${plan.effect}.` : `${plan.label} için ${formatMoney(plan.cost)} gerekiyor.`,
                  tone: result.ok ? "accept" : "decline"
                });
              }}
            >
              <Text style={styles.clientQuickPlanText}>{plan.label}</Text>
              <Text style={styles.clientQuickPlanCost}>{planAlreadyRun ? "Bu hafta" : formatMoney(plan.cost)}</Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity style={styles.clientDetailButton} onPress={() => onOpenPlayer?.(lead.id)}>
          <Text style={styles.clientDetailText}>Detay</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.clientPlanSteps}>
        {steps.map((step) => {
          const width = `${Math.max(6, Math.min(100, Math.round((step.value / step.target) * 100)))}%`;
          return (
            <View key={step.label} style={styles.clientPlanStep}>
              <View style={styles.clientPlanStepTop}>
                <Text style={styles.clientPlanStepLabel}>{step.label}</Text>
                <Text style={[styles.clientPlanStepValue, step.tone === "good" && styles.clientPlanStepValueGood]}>{step.value}/{step.target}</Text>
              </View>
              <View style={styles.clientPlanTrack}>
                <View style={[styles.clientPlanFill, step.tone === "good" && styles.clientPlanFillGood, { width }]} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function buildMissionSignals({ mission, career, pendingCards = [], representedCount = 0, agencyCapacity = 1, talents = 0, leadClient, leadPlanDone, activeFocus }) {
  if (mission?.target === "agenda") return ["Zorunlu karar", `${pendingCards.length} kart`, "Hafta kilitli"];
  if (mission?.target === "offer") return ["Komisyon", "Maaş", "Kulüp ilişkisi"];
  if (mission?.target === "scout") return [`${talents} uygun aday`, "Düşük komisyon", "İlk sözleşme"];
  if (mission?.target === "empire") return [formatMoney(career.money), `Rep ${career.reputation}`, "Harcamayı kes"];
  if (mission?.target === "nextWeek") return [activeFocus?.label || "Denge", leadClient?.name || "Plan hazır", "Maç raporu"];
  return [`${representedCount}/${agencyCapacity} portföy`, leadPlanDone ? "Plan hazır" : "Plan seç", "Teklif ihtimali"];
}

function buildHomeStoryContinue(career, myPlayers = [], translate = (key) => key) {
  const story = career.story || {};
  const pending = [...(career.pendingCards || [])].sort((a, b) => severityRank(b.severity) - severityRank(a.severity))[0];
  const offer = (career.incomingOffers || [])[0];
  const offerPlayer = offer ? career.db.players.find((player) => player.id === offer.playerId) : null;
  const offerClub = offer ? career.db.clubs.find((club) => club.id === offer.clubId) : null;
  const spotlight = [...myPlayers].sort((a, b) =>
    (b.marketHeat || 0) + (b.goalProgress || 0) + (b.agencyTrust || 0) -
    ((a.marketHeat || 0) + (a.goalProgress || 0) + (a.agencyTrust || 0))
  )[0];

  if (pending) {
    return {
      kind: "card",
      badge: "Acil",
      title: "Kapıda kriz var",
      body: `${translate(pending.titleKey)}. Bu karar ajansın itibarını ve oyuncu güvenini değiştirecek.`,
      target: "agenda",
      choices: [
        { id: "face", label: "Masaya koy", tone: "gold", focus: "balanced" },
        { id: "protect", label: "Oyuncuyu koru", focus: "care" }
      ]
    };
  }

  if (offer) {
    return {
      kind: "offer",
      badge: `${offer.chance || offer.fitScore || 45}%`,
      title: "İlk ciddi masa açıldı",
      body: `${offerPlayer?.name || "Oyuncun"} için ${offerClub?.name || "bir kulüp"} masada. Komisyonla kariyer planı aynı anda tartılacak.`,
      target: "offer",
      offer,
      choices: [
        { id: "calm", label: "Sakin pazarlık", focus: "negotiation" },
        { id: "hard", label: "Komisyonu zorla", tone: "gold", focus: "negotiation" }
      ]
    };
  }

  if (!myPlayers.length) {
    return {
      kind: "scout",
      badge: "Başlangıç",
      title: "Telefon hâlâ sessiz",
      body: "Yıldız kapısı kapandı. Alt ligde bir oyuncunun kariyerini kurtarmadan kimse ajansı ciddiye almayacak.",
      target: "scout",
      choices: [
        { id: "local", label: "Yerel pazara in", tone: "gold", focus: "scout" },
        { id: "patient", label: "Dosya hazırla", focus: "balanced" }
      ]
    };
  }

  return {
    kind: "client",
    badge: `${story.tension || 20}%`,
    title: spotlight ? `${spotlight.name} hikayesi` : story.title || "Ajans hikayesi",
    body: spotlight
      ? `Güven ${spotlight.agencyTrust ?? 55}, hedef ${spotlight.goalProgress || 40}%. Bir sonraki sahne onun piyasada nasıl konuşulacağını belirler.`
      : story.objective || "Bir sonraki hamle ajansın yönünü belirler.",
    target: "players",
    player: spotlight,
    choices: [
      { id: "call", label: "Oyuncuyu ara", focus: "care" },
      { id: "market", label: "Kulüpleri yokla", tone: "gold", focus: "negotiation" }
    ]
  };
}

function buildHomeCoachNote(career, myPlayers = [], pendingCards = [], talents = 0) {
  if (pendingCards.length) {
    const urgent = pendingCards.some((card) => card.severity === "urgent" || card.severity === "risk");
    return urgent
      ? "Önce kartı çöz. Erteleme yok; karar oyuncu güvenini, para akışını veya saygınlığı doğrudan değiştirir."
      : "Masada kart var. Haftayı başlatmadan önce kabul veya red seç, sonra maç haftasına geç.";
  }
  if (!myPlayers.length) {
    return talents
      ? "İlk hedef yıldız değil. Alınabilir bir alt lig oyuncusuna düşük komisyonla güven ver."
      : "Scout havuzunu aç. Saygınlık düşükken oyuncular seni ancak rapor ve doğru vaatle dinler.";
  }
  if ((career.incomingOffers || []).length) {
    return "Teklif masasında kısa para ile uzun kariyer çatışır. Oyuncu güvenini yakmadan komisyonu büyüt.";
  }
  const lead = [...myPlayers].sort((a, b) => (b.goalProgress || 0) - (a.goalProgress || 0))[0];
  if (lead && (lead.marketHeat || 0) < 30) {
    return `${lead.name} henüz piyasada sıcak değil. Vitrin, PR veya bakım planıyla formu ve güveni büyüt.`;
  }
  return "Haftayı planla: Scout daha fazla aday, PR daha fazla saygınlık, bakım oyuncu güveni getirir.";
}

function advanceHomeStory(career, storyContinue, choice) {
  const week = career.week || 1;
  const focusCosts = { scout: 12000, negotiation: 15000, pr: 18000, care: 10000 };
  const affordableFocus = !choice.focus || !focusCosts[choice.focus] || career.money >= focusCosts[choice.focus]
    ? choice.focus || career.weeklyFocus || "balanced"
    : "balanced";
  const titles = {
    card: "Kriz masaya geldi",
    offer: "Pazarlık odası açıldı",
    scout: "Alt lig defteri açıldı",
    client: "Oyuncu hikayesi ilerledi"
  };
  const bodies = {
    face: "Kararı saklamadan masaya koydun. Ajans kısa vadede baskı yese de hikaye netleşti.",
    protect: "Önce oyuncunun yanında durdun. Piyasa biraz bekler, güven daha uzun yaşar.",
    calm: "Masaya sakin oturmayı seçtin. Kulüp ilişkisi ve oyuncu beklentisi aynı deftere yazıldı.",
    hard: "Komisyonu büyütmeyi düşündün. Para kokusu güçlü ama itibar riski de yanında yürür.",
    local: "Yerel pazarın kapısını çaldın. Büyük isim yok, ama ilk gerçek hikaye burada başlayacak.",
    patient: "Dosyaları toparladın. Daha az gürültü, daha temiz ikna cümlesi.",
    call: "Oyuncuyu doğrudan aradın. Sayılar değil, güven konuştu.",
    market: "Kulüplerin ihtiyacını yokladın. Oyuncunun adı ilk kez doğru masalara düştü."
  };
  const nextTitle = titles[storyContinue.kind] || "Hikaye devam ediyor";
  const nextBeat = bodies[choice.id] || storyContinue.body;
  const nextObjective = storyContinue.kind === "offer"
    ? "Pazarlıkta oyuncu kariyerini ve ajans komisyonunu dengele."
    : storyContinue.kind === "card"
      ? "Gündemdeki kararı çöz ve ajans baskısını düşür."
      : storyContinue.kind === "scout"
        ? "İlk güvenilir oyuncu havuzunu oluştur."
        : "Oyuncunun değerini artıracak haftalık planı seç.";
  const nextStory = {
    ...(career.story || {}),
    title: nextTitle,
    beat: nextBeat,
    objective: nextObjective,
    tension: Math.max(12, Math.min(92, (career.story?.tension || 20) + (choice.tone === "gold" ? 5 : 2))),
    log: [
      { week, title: nextTitle, body: nextBeat },
      ...((career.story || {}).log || [])
    ].slice(0, 8)
  };
  return {
    career: {
      ...career,
      weeklyFocus: affordableFocus,
      story: nextStory,
      news: [`Hikaye: ${nextBeat}`, ...(career.news || [])].slice(0, 20)
    },
    target: storyContinue.target,
    offer: storyContinue.kind === "offer" ? storyContinue.offer : null,
    flash: `${choice.label}: ${nextObjective}`
  };
}

function representationApproachPreview(pitch, approachId) {
  const profiles = {
    career: { chance: 7, fee: 1.05, trust: "+güven", commission: "-%1 kom.", risk: "düşük" },
    money: { chance: 12, fee: 1.35, trust: "-güven", commission: "aynı kom.", risk: "orta" },
    commission: { chance: -5, fee: 0.92, trust: "-güven", commission: "+%1 kom.", risk: "yüksek" }
  };
  const profile = profiles[approachId] || { chance: 0, fee: 1, trust: "denge", commission: "aynı kom.", risk: "düşük" };
  return {
    chance: Math.max(2, Math.min(88, (pitch?.chance || 0) + profile.chance)),
    signingFee: Math.round(((pitch?.signingFee || 0) * profile.fee) / 1000) * 1000,
    trust: profile.trust,
    commission: profile.commission,
    risk: profile.risk
  };
}

function scoutCandidateSummary(player = {}, pitch = {}) {
  const upside = (player.hiddenPotential || player.potential || 0) - (player.overall || 0);
  if ((pitch.chance || 0) >= 62 && upside >= 12) return { label: "Sıcak dosya", tone: "hot" };
  if ((pitch.chance || 0) >= 60) return { label: "Masaya yakın", tone: "normal" };
  if ((player.injuryRisk || 0) >= 24) return { label: "Sağlık riski", tone: "risk" };
  if ((player.ego || 0) >= 68) return { label: "Ego dikkat", tone: "risk" };
  if (upside >= 14) return { label: "Gizli tavan", tone: "hot" };
  return { label: "Takip listesi", tone: "normal" };
}

function Players({ career, tr, selectedPlayerId, setSelectedPlayerId, selectedClubId, setOffer, setScreen, updateCareer, setDecisionFlash }) {
  const [marketView, setMarketView] = useState(() => getRepresentedPlayers(career).length ? "mine" : "available");
  const players = [...career.db.players].sort((a, b) => {
    const aRisk = playerPortfolioRisk(a, career.week);
    const bRisk = playerPortfolioRisk(b, career.week);
    const aPitch = buildRepresentationPitch(career, a.id);
    const bPitch = buildRepresentationPitch(career, b.id);
    const aOpen = a.represented || aPitch?.eligible ? 1 : 0;
    const bOpen = b.represented || bPitch?.eligible ? 1 : 0;
    return bRisk - aRisk || bOpen - aOpen || (b.represented ? 1 : 0) - (a.represented ? 1 : 0) || (b.potential || 0) - (a.potential || 0);
  });
  const alerts = players.filter((player) => player.represented && playerPortfolioRisk(player, career.week) >= 40).slice(0, 3);
  const representedCount = getRepresentedPlayers(career).length;
  const agencyCapacity = getAgencyCapacity(career);
  const availableCount = players.filter((player) => !player.represented && buildRepresentationPitch(career, player.id)?.eligible).length;
  const filteredPlayers = players.filter((player) => {
    const pitch = !player.represented ? buildRepresentationPitch(career, player.id) : null;
    if (marketView === "mine") return player.represented;
    if (marketView === "available") return !player.represented && pitch?.eligible;
    if (marketView === "locked") return !player.represented && !pitch?.eligible;
    if (marketView === "risk") return player.represented && playerPortfolioRisk(player, career.week) >= 25;
    return true;
  }).slice(0, marketView === "all" ? 90 : 40);
  const leaders = [...career.db.players]
    .filter((player) => player.represented)
    .sort((a, b) => ((b.seasonStats?.goals || 0) * 4 + (b.seasonStats?.highlights || 0)) - ((a.seasonStats?.goals || 0) * 4 + (a.seasonStats?.highlights || 0)))
    .slice(0, 3);
  return (
    <View>
      <SectionTitle text={tr("players")} />
      <View style={styles.portfolioAlert}>
        <Text style={styles.portfolioAlertTitle}>Portföy Kontrolü</Text>
        <Text style={styles.portfolioAlertText}>Ajans kapasitesi: {representedCount}/{agencyCapacity}. Şu an ikna edilebilir aday: {availableCount}. Diğerleri saygınlık, scout veya kapasite bekler.</Text>
        {alerts.length === 0 ? (
          <Text style={styles.portfolioAlertText}>Kritik sözleşme veya güven krizi yok.</Text>
        ) : alerts.map((player) => (
          <Text key={player.id} style={styles.portfolioAlertText}>{player.name}: {contractStatusText(player, career.week)}</Text>
        ))}
      </View>
      <View style={styles.leaderPanel}>
        <Text style={styles.portfolioAlertTitle}>Sezon Vitrini</Text>
        {leaders.length === 0 ? (
          <Text style={styles.portfolioAlertText}>Temsil edilen oyuncular mac istatistigi toplamaya baslayacak.</Text>
        ) : leaders.map((player, index) => (
          <Text key={player.id} style={styles.portfolioAlertText}>{index + 1}. {player.name} · {player.seasonStats?.goals || 0} gol · {player.seasonStats?.highlights || 0} aksiyon</Text>
        ))}
      </View>
      <View style={styles.marketFilterRow}>
        {[
          ["available", `Alınabilir ${availableCount}`],
          ["mine", `Portföy ${representedCount}`],
          ["risk", "Risk"],
          ["locked", "Kilitli"],
          ["all", "Piyasa"]
        ].map(([id, label]) => (
          <TouchableOpacity key={id} style={[styles.marketFilterChip, marketView === id && styles.marketFilterChipActive]} onPress={() => setMarketView(id)}>
            <Text style={[styles.marketFilterText, marketView === id && styles.marketFilterTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {filteredPlayers.length === 0 && (
        <View style={styles.scoutActionPanel}>
          <Text style={styles.scoutEmptyText}>Bu filtrede oyuncu yok. Scout gönder, haftalık planı değiştir veya başka filtre seç.</Text>
        </View>
      )}
      {filteredPlayers.map((player) => (
        <PlayerRow
          key={player.id}
          career={career}
          player={player}
          tr={tr}
          selected={selectedPlayerId === player.id}
          selectedClubId={selectedClubId}
          setSelectedPlayerId={setSelectedPlayerId}
          setOffer={setOffer}
          setScreen={setScreen}
          updateCareer={updateCareer}
          setDecisionFlash={setDecisionFlash}
        />
      ))}
    </View>
  );
}

function PlayerRow({ career, player, tr, selected, selectedClubId, setSelectedPlayerId, setOffer, setScreen, updateCareer, setDecisionFlash }) {
  const pitch = !player.represented ? buildRepresentationPitch(career, player.id) : null;
  const playerDetails = (
    <>
      <PlayerPortrait player={player} size={64} />
      <View style={styles.listMain}>
        <Text style={styles.cardTitle}>{player.name}</Text>
            <Text style={styles.muted}>
              {player.age} • {tr("overall")} {player.overall} • Pot {playerPotentialLabel(player)}
            </Text>
            <Text style={styles.valueText}>{formatMoney(player.value)} · {tr("form")} {player.form} · Mutluluk {player.happiness ?? player.morale}</Text>
            <Text style={styles.statsText}>Sezon: {player.seasonStats?.played || 0} maç · {player.seasonStats?.goals || 0} gol · {player.seasonStats?.shots || 0} şut · {player.seasonStats?.highlights || 0} aksiyon</Text>
            <Text style={styles.aiModelText}>AI Etki {player.impactScore ?? 45} · Scout skoru {pitch?.aiScoutScore ?? player.scoutAIScore ?? 40} {pitch?.aiRecommendation ? `· ${pitch.aiRecommendation}` : ""}</Text>
            {selected && <Text style={styles.agentBrainText}>Saha AI: {agentBrainLabel(player.agentBrain)} · öğrenme {player.agentBrain?.learning ?? "-"} · {player.agentBrain?.lastLesson || "profil bekliyor"}</Text>}
            {selected && <View style={styles.traitRow}>
              <Text style={styles.traitChip}>{personalityLabel(player.personality)}</Text>
              <Text style={styles.traitChip}>{scoutConfidenceLabel(player)}</Text>
              <Text style={styles.traitChip}>Ego {player.ego ?? 50}</Text>
              <Text style={styles.traitChip}>Sadakat {player.loyalty ?? 55}</Text>
              <Text style={styles.traitChip}>Risk {player.injuryRisk ?? 15}</Text>
            </View>}
            {selected && <View style={styles.goalBox}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>{player.careerGoal?.label || "Kariyer hedefi"}</Text>
                <Text style={styles.goalDelta}>{(player.lastGoalDelta || 0) >= 0 ? "+" : ""}{player.lastGoalDelta || 0}</Text>
              </View>
              <View style={styles.goalTrack}>
                <View style={[styles.goalFill, { width: `${Math.max(4, player.goalProgress ?? 40)}%` }]} />
              </View>
            </View>}
            {selected && player.represented && (
              <View style={styles.playerTabs}>
                <View style={[styles.playerTab, styles.playerTabInfo]}>
                  <Text style={styles.playerTabText}>Bilgi</Text>
                </View>
                <View style={[styles.playerTab, (player.marketHeat || 0) >= 35 && styles.playerTabHot]}>
                  <Text style={styles.playerTabText}>Pazarlık</Text>
                  <Text style={styles.playerTabMeta}>{player.marketHeat || 0}</Text>
                </View>
                <View style={[styles.playerTab, playerPortfolioRisk(player, career.week) >= 25 && styles.playerTabWarn]}>
                  <Text style={styles.playerTabText}>Konuş</Text>
                  <Text style={styles.playerTabMeta}>{player.agencyTrust ?? 55}</Text>
                </View>
              </View>
            )}
            {selected && player.represented && (
              <View style={styles.contractBox}>
                <Text style={styles.contractText}>Sözleşme W{player.agencySignedWeek || "?"}-W{player.agencyContractUntil || "?"}</Text>
                <Text style={styles.contractText}>Güven {player.agencyTrust ?? 55} · Komisyon %{player.agencyCommissionRate || 8}</Text>
                <Text style={styles.contractText}>Piyasa ısısı {player.marketHeat || 0}/100{player.activeCareerPlan ? ` · Plan ${careerPlanLabel(player.activeCareerPlan)}` : ""}</Text>
                <Text style={[styles.contractText, playerPortfolioRisk(player, career.week) >= 40 && styles.contractWarning]}>{contractStatusText(player, career.week)}</Text>
              </View>
            )}
            {selected && !player.represented && pitch && (
              <View style={[styles.interestBox, !pitch.eligible && styles.interestBoxLocked]}>
                <View style={styles.interestTop}>
                  <Text style={styles.interestTitle}>{pitch.eligible ? "Temsil ilgisi" : "Şimdilik uzak"}</Text>
                  <Text style={[styles.interestBadge, !pitch.eligible && styles.interestBadgeLocked]}>{pitch.eligible ? `%${pitch.chance}` : "Kilitli"}</Text>
                </View>
                <View style={styles.interestTrack}>
                  <View style={[styles.interestFill, !pitch.eligible && styles.interestFillLocked, { width: `${Math.max(4, pitch.chance)}%` }]} />
                </View>
                <Text style={styles.interestText}>{pitch.eligible ? `İmza bonusu ${formatMoney(pitch.signingFee)} · Ret olursa temas masrafı ${formatMoney(pitch.approachCost)}` : pitchReasonText(pitch)}</Text>
                <Text style={styles.interestText}>AI okuma: {pitch.aiRecommendation} · baz %{pitch.baseChance}</Text>
              </View>
            )}
            {selected && <Text style={styles.storyText}>{player.story || "Kariyer hikayesi scout raporlarinda netlesecek."}</Text>}
            {selected && player.rivalInterest && !player.represented && (
              <View style={styles.rivalInterestBox}>
                <Text style={styles.rivalInterestTitle}>{player.rivalInterest.rivalName} temas kurdu</Text>
                <Text style={styles.rivalInterestText}>
                  Baskı {player.rivalInterest.heat}/100 · {player.rivalInterest.style || "temas"} · temsil şansını düşürür
                </Text>
              </View>
            )}
      </View>
    </>
  );
  return (
    <View style={[styles.listCard, styles.playerListCard, selected && styles.selected]}>
      {selected ? (
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 240 }}
          style={styles.playerCardHeader}
        >
          {playerDetails}
        </MotiView>
      ) : (
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Oyuncu seç ${player.name}`} style={styles.playerCardHeader} onPress={() => setSelectedPlayerId(player.id)}>
          {playerDetails}
        </TouchableOpacity>
      )}
      {selected ? (
        <>
        <PlayerActionButton
          career={career}
          player={player}
          tr={tr}
          selectedClubId={selectedClubId}
          setSelectedPlayerId={setSelectedPlayerId}
          setOffer={setOffer}
          setScreen={setScreen}
          updateCareer={updateCareer}
          setDecisionFlash={setDecisionFlash}
        />
        </>
      ) : (
        <View style={styles.playerCollapsedHint}>
          <Text style={styles.playerCollapsedText}>Detay ve aksiyon için dokun</Text>
        </View>
      )}
    </View>
  );
}

function pitchReasonText(pitch) {
  if (!pitch) return "Rapor yok";
  if (pitch.eligible) return `İlgi ${pitch.chance}%`;
  if ((pitch.reason || "").includes("Kapasite")) return "Ajans kapasitesi dolu. Ofis, personel veya saygınlık arttır.";
  if ((pitch.reason || "").includes("Scout")) return "Önce scout raporu çıkar; tanımadığı ajansla masaya oturmuyor.";
  if ((pitch.reason || "").includes("radar")) return "Henüz radarında değil. Scout gönder veya mevcut oyuncunu vitrine çıkar.";
  if ((pitch.reason || "").includes("Yerel")) return "Başlangıçta yerel pazara odaklan. Saygınlık artınca dış ligler açılır.";
  if ((pitch.reason || "").includes("buyuk")) return "Bu profil daha saygın ajans bekliyor. Önce küçük oyuncularla vitrin yap.";
  return pitch.reason || "Şimdilik ilgilenmiyor.";
}

function careerPlanLabel(planId) {
  const labels = {
    showcase: "Vitrin",
    training: "Antrenman",
    care: "Bakım",
    pr: "PR"
  };
  return labels[planId] || "Plan";
}

function agentBrainLabel(brain = {}) {
  const labels = {
    finisher: "Bitirici",
    creator: "Oyun kurucu",
    secure: "Güvenli",
    runner: "Koşucu"
  };
  const style = labels[brain.style] || "Yerel ajan";
  const evolved = brain.evolved ? ` v${brain.evolved}` : "";
  return `${style}${evolved}`;
}

function recommendedCareerPlan(player) {
  const trust = player.agencyTrust ?? 55;
  const heat = player.marketHeat || 0;
  const goal = player.goalProgress ?? player.careerGoal?.start ?? 40;
  if (trust < 58 || (player.happiness ?? player.morale ?? 60) < 48) return "care";
  if (heat < 32) return "showcase";
  if (goal < 58) return "training";
  if ((player.personality === "media" || heat >= 45) && goal < 78) return "pr";
  return "showcase";
}

function bestNegotiationClubId(career, player, preferredClubId) {
  const preferred = career.db.clubs.find((club) => club.id === preferredClubId && club.id !== player.clubId && club.budget > (player.value || 0) * 0.5);
  if (preferred) return preferred.id;
  const scored = career.db.clubs
    .filter((club) => club.id !== player.clubId && club.budget > (player.value || 0) * 0.5)
    .map((club) => ({
      club,
      score: (club.need === player.position ? 30 : 0) + (club.relation || 35) * 0.4 + (club.reputation || 40) * 0.25 + Math.log10(Math.max(100000, club.budget || 100000)) * 3
    }))
    .sort((a, b) => b.score - a.score);
  return scored[0]?.club?.id || career.db.clubs.find((club) => club.id !== player.clubId)?.id || career.db.clubs[0]?.id;
}

function PlayerActionButton({ career, player, tr, selectedClubId, setSelectedPlayerId, setOffer, setScreen, updateCareer, setDecisionFlash }) {
  const [actionMode, setActionMode] = useState(player.represented ? "transfer" : "sign");
  if (!player.represented) {
    const pitch = buildRepresentationPitch(career, player.id);
    const locked = !pitch?.eligible || career.money < (pitch?.signingFee || 0);
    return (
      <TouchableOpacity
        style={[styles.smallButton, locked && styles.disabledButton]}
        onPress={() => {
          if (locked) {
            setDecisionFlash?.({
              title: pitch?.eligible ? "Para yetmiyor" : "Oyuncu hazır değil",
              summary: pitch?.eligible ? `${player.name} için ${formatMoney(pitch.signingFee)} temas bütçesi gerekiyor.` : pitchReasonText(pitch),
              tone: "decline"
            });
            return;
          }
          const result = signPlayerToAgency(career, player.id);
          updateCareer(result.career);
          setDecisionFlash?.({
            title: result.ok ? "Temsil imzalandı" : "Oyuncu reddetti",
            summary: result.ok ? `${player.name} artık ajansında.` : `${player.name} için temas masrafı ödendi.`,
            tone: result.ok ? "accept" : "decline"
          });
        }}
      >
        <Text style={styles.smallButtonText}>{pitch?.eligible ? "Ajansa Kat" : "İlgilenmiyor"}</Text>
        {pitch && <Text style={styles.buttonSubText}>{pitch.eligible ? `${pitch.chance}% · ${formatMoney(pitch.signingFee)}` : pitchReasonText(pitch)}</Text>}
      </TouchableOpacity>
    );
  }
  const sponsorDeal = buildPlayerSponsorship(career, player.id);
  const targetClubId = bestNegotiationClubId(career, player, selectedClubId);
  const targetClub = career.db.clubs.find((club) => club.id === targetClubId);
  const targetOffer = buildOffer(career, player.id, targetClubId);
  const renewalCost = Math.round(Math.max(25000, player.value * (0.007 + Math.max(0, (player.ego ?? 50) - 45) / 12000)) / 1000) * 1000;
  const renewalUseful = playerPortfolioRisk(player, career.week) >= 25;
  const careerPlans = [
    { id: "showcase", label: "Vitrin", cost: 18000, heat: 18, goal: 4, trust: 1, hint: "kulüp ilgisi" },
    { id: "training", label: "Antrenman", cost: 14000, heat: 6, goal: 7, trust: 2, hint: "gelişim" },
    { id: "care", label: "Bakım", cost: 12000, heat: 3, goal: 3, trust: 6, hint: "güven" },
    { id: "pr", label: "PR", cost: 22000, heat: 14, goal: 4, trust: player.personality === "media" ? 3 : 0, hint: "saygınlık" }
  ];
  const recommendedPlan = recommendedCareerPlan(player);
  const giftPlans = [
    { id: "watch", label: "Saat", cost: 60000 },
    { id: "motorbike", label: "Motor", cost: 107000 },
    { id: "car", label: "Araba", cost: 182000 }
  ];
  const talkChoices = [
    { id: "calm", label: "Konuş", hint: "güven", cost: 10000 },
    { id: "language", label: "Dil Kursu", hint: "uyum", cost: 22000 },
    { id: "transferList", label: "Kulüplere Öner", hint: "piyasa", cost: 15000 },
    { id: "nickname", label: "Lakap", hint: "PR", cost: 7000 }
  ];
  return (
    <View style={styles.playerActionStack}>
      <View style={styles.playerActionModeTabs}>
        {[
          ["info", "Bilgi"],
          ["transfer", "Transfer"],
          ["talk", "Konuş"]
        ].map(([id, label]) => (
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Oyuncu aksiyon sekmesi ${label}`} key={id} style={[styles.playerActionModeTab, actionMode === id && styles.playerActionModeTabActive]} onPress={() => setActionMode(id)}>
            <Text style={[styles.playerActionModeText, actionMode === id && styles.playerActionModeTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {actionMode === "info" && <View style={styles.careerPlanBox}>
        <View style={styles.careerPlanHeader}>
          <Text style={styles.careerPlanTitle}>Haftalık Plan</Text>
          <Text style={styles.careerPlanAdvice}>Öneri: {careerPlanLabel(recommendedPlan)}</Text>
        </View>
        <View style={styles.careerPlanRow}>
          {careerPlans.map((plan) => {
            const lockedPlan = career.money < plan.cost;
            const recommended = plan.id === recommendedPlan;
            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Haftalık plan ${plan.label}`}
                key={plan.id}
                style={[styles.careerPlanButton, recommended && styles.careerPlanButtonRecommended, lockedPlan && styles.disabledButton]}
                disabled={lockedPlan}
                onPress={() => {
                  const result = runPlayerCareerPlan(career, player.id, plan.id);
                  updateCareer(result.career);
                  setDecisionFlash?.({
                    title: result.ok ? "Kariyer planı uygulandı" : "Plan uygulanamadı",
                    summary: result.ok ? `${player.name}: ${careerPlanLabel(plan.id)} planı aktif.` : "Kasada yeterli para yok.",
                    tone: result.ok ? "accept" : "decline"
                  });
                }}
              >
                {recommended && <Text style={styles.careerPlanRecommended}>Önerilen</Text>}
                <Text style={styles.careerPlanText}>{plan.label}</Text>
                <Text style={styles.careerPlanImpact}>Piy +{plan.heat} · Hdf +{plan.goal} · Güv +{plan.trust}</Text>
                <Text style={styles.careerPlanCost}>{formatMoney(plan.cost)}</Text>
                <Text style={styles.careerPlanHint}>{plan.hint}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>}
      {actionMode === "talk" && <View style={styles.giftBox}>
        <Text style={styles.careerPlanTitle}>İlişki Hediyesi</Text>
        <View style={styles.careerPlanRow}>
          {giftPlans.map((gift) => {
            const lockedGift = career.money < gift.cost;
            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Hediye ${gift.label}`}
                key={gift.id}
                style={[styles.giftButton, lockedGift && styles.disabledButton]}
                disabled={lockedGift}
                onPress={() => {
                  const result = sendPlayerGift(career, player.id, gift.id);
                  updateCareer(result.career);
                  setDecisionFlash?.({
                    title: result.ok ? "Hediye gönderildi" : "Hediye alınamadı",
                    summary: result.ok ? `${player.name}: ${gift.label} ilişkiyi güçlendirdi.` : "Kasada yeterli para yok.",
                    tone: result.ok ? "accept" : "decline"
                  });
                }}
              >
                <Text style={styles.careerPlanText}>{gift.label}</Text>
                <Text style={styles.careerPlanCost}>{formatMoney(gift.cost)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>}
      {actionMode === "talk" && <View style={styles.talkChoiceBox}>
        <View style={styles.talkChoiceHeader}>
          <Text style={styles.careerPlanTitle}>Oyuncu Görüşmesi</Text>
          <Text style={styles.talkChoiceMeta}>Güven {player.agencyTrust ?? 55}</Text>
        </View>
        <View style={styles.talkChoiceGrid}>
          {talkChoices.map((choice) => {
            const lockedChoice = career.money < choice.cost;
            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Oyuncu görüşmesi ${choice.label}`}
                key={choice.id}
                style={[styles.talkChoiceButton, lockedChoice && styles.disabledButton]}
                disabled={lockedChoice}
                onPress={() => {
                  const result = resolvePlayerTalkChoice(career, player.id, choice.id);
                  updateCareer(result.career);
                  setDecisionFlash?.({
                    title: result.ok ? result.choice.label : "Görüşme yapılamadı",
                    summary: result.ok ? `${player.name}: ${choice.hint} etkisi işlendi.` : "Kasada yeterli para yok.",
                    tone: result.ok ? "accept" : "decline"
                  });
                }}
              >
                <Text style={styles.talkChoiceText}>{choice.label}</Text>
                <Text style={styles.talkChoiceHint}>{choice.hint} · {formatMoney(choice.cost)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>}
      {actionMode === "transfer" && (
      <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Pazarlık başlat"
        style={[styles.smallButton, !targetOffer && styles.disabledButton]}
        disabled={!targetOffer}
        onPress={() => {
          setSelectedPlayerId(player.id);
          setOffer(targetOffer);
          setScreen("negotiate");
        }}
      >
        <Text style={styles.smallButtonText}>{tr("negotiate")}</Text>
        {targetOffer && <Text style={styles.buttonSubText}>{targetClub?.name || "Kulüp"} · %{targetOffer.chance}</Text>}
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Sözleşme yenile"
        style={[styles.smallButton, !renewalUseful && styles.secondaryButton, career.money < renewalCost && styles.disabledButton]}
        disabled={career.money < renewalCost}
        onPress={() => updateCareer(renewAgencyContract(career, player.id).career)}
      >
        <Text style={styles.smallButtonText}>Yenile</Text>
        <Text style={styles.buttonSubText}>{formatMoney(renewalCost)}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Sponsor imzala"
        style={[styles.smallButton, styles.sponsorButton]}
        onPress={() => updateCareer(signPlayerSponsorship(career, player.id).career)}
      >
        <Text style={styles.smallButtonText}>Sponsor</Text>
        {sponsorDeal && <Text style={styles.buttonSubText}>{sponsorDeal.chance}% · {formatMoney(sponsorDeal.advance)}</Text>}
      </TouchableOpacity>
      </>
      )}
    </View>
  );
}

function playerPortfolioRisk(player, week) {
  if (!player.represented) return 0;
  const weeksLeft = (player.agencyContractUntil || week + 52) - week;
  const contractRisk = weeksLeft <= 0 ? 70 : weeksLeft <= 4 ? 52 : weeksLeft <= 8 ? 34 : 0;
  const trustRisk = Math.max(0, 50 - (player.agencyTrust ?? 55));
  const moraleRisk = Math.max(0, 45 - (player.happiness ?? player.morale ?? 60));
  return contractRisk + trustRisk + Math.round(moraleRisk / 2);
}

function contractStatusText(player, week) {
  const weeksLeft = (player.agencyContractUntil || week + 52) - week;
  if (weeksLeft <= 0) return "Sözleşme bitti";
  if (weeksLeft <= 8) return `${weeksLeft} hafta kaldı`;
  if ((player.agencyTrust ?? 55) < 38) return "Güven düşük";
  if ((player.happiness ?? player.morale ?? 60) < 45) return "Moral düşük";
  return "Durum stabil";
}

function Clubs({ career, tr, selectedClubId, setSelectedClubId }) {
  const leagueId = career.selectedLeagueId;
  const standingsByClub = new Map((career.standings || []).map((row) => [row.clubId, row]));
  const sortedClubs = [...career.db.clubs].sort((a, b) => {
    const aRow = standingsByClub.get(a.id);
    const bRow = standingsByClub.get(b.id);
    const leagueBoost = (b.leagueId === leagueId ? 1 : 0) - (a.leagueId === leagueId ? 1 : 0);
    return leagueBoost || (bRow?.points || 0) - (aRow?.points || 0) || (b.relation || 0) - (a.relation || 0);
  });
  const leagueName = career.db.leagues?.find((league) => league.id === leagueId)?.name || "Lig";
  return (
    <View>
      <SectionTitle text={tr("clubs")} />
      <View style={styles.leagueTablePanel}>
        <View style={styles.leagueTableTop}>
          <Text style={styles.leagueTableTitle}>{leagueName}</Text>
          <Text style={styles.leagueTableBadge}>{sortedClubs.filter((club) => club.leagueId === leagueId).length} kulüp</Text>
        </View>
        <View style={styles.leagueTableHeader}>
          <Text style={[styles.leagueColClub, styles.leagueHeaderText]}>Kulüp</Text>
          <Text style={styles.leagueColTiny}>O</Text>
          <Text style={styles.leagueColTiny}>G</Text>
          <Text style={styles.leagueColTiny}>A</Text>
          <Text style={styles.leagueColTiny}>P</Text>
          <Text style={styles.leagueColNeed}>İht.</Text>
        </View>
        {sortedClubs.map((club, index) => {
          const row = standingsByClub.get(club.id) || {};
          const selected = selectedClubId === club.id;
          const outOfLeague = club.leagueId !== leagueId;
          return (
            <TouchableOpacity key={club.id} style={[styles.leagueTableRow, selected && styles.leagueTableRowSelected, outOfLeague && styles.leagueTableRowDim]} onPress={() => setSelectedClubId(club.id)}>
              <View style={styles.leagueColClub}>
                <View style={styles.leagueClubNameRow}>
                  <Text style={styles.leagueRank}>{index + 1}.</Text>
                  <ClubCrest club={club} size={22} />
                  <Text style={styles.leagueClubName} numberOfLines={1}>{club.name}</Text>
                </View>
                <Text style={styles.leagueClubMeta} numberOfLines={1}>İlişki {club.relation} · Sertlik {club.negotiationHardness ?? 55} · {formatMoney(club.budget)}</Text>
              </View>
              <Text style={styles.leagueColTiny}>{row.played || 0}</Text>
              <Text style={styles.leagueColTiny}>{row.won || 0}</Text>
              <Text style={styles.leagueColTiny}>{(row.goalsFor || 0) - (row.goalsAgainst || 0)}</Text>
              <Text style={[styles.leagueColTiny, styles.leaguePoints]}>{row.points || 0}</Text>
              <Text style={styles.leagueColNeed}>{club.need}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function Scout({ career, tr, updateCareer, setDecisionFlash }) {
  const approachOptions = [
    { id: "career", label: "Kariyer", hint: "güvenli başlangıç" },
    { id: "money", label: "Para", hint: "daha pahalı ikna" },
    { id: "commission", label: "Komisyon", hint: "riskli oran" }
  ];
  const signable = career.db.players
    .filter((player) => !player.represented)
    .map((player) => ({ player, pitch: buildRepresentationPitch(career, player.id) }))
    .filter((item) => item.pitch?.eligible)
    .sort((a, b) => b.pitch.chance - a.pitch.chance || (b.player.potential || 0) - (a.player.potential || 0))
    .slice(0, 4);
  return (
    <View>
      <SectionTitle text={tr("scout")} />
      <View style={styles.scoutActionPanel}>
        <View style={styles.scoutPanelHeader}>
          <View style={styles.focusPlanTitleRow}>
            <LivePulse />
            <Text style={styles.scoutPanelTitle}>Ajansa alınabilir adaylar</Text>
          </View>
          <Text style={styles.scoutPanelBadge}>{signable.length}</Text>
        </View>
        <Text style={styles.scoutPanelExplain}>Başlangıçta ajans kapasitesi {getRepresentedPlayers(career).length}/{getAgencyCapacity(career)}. Her oyuncu gelmez; saygınlık düşükken sadece radarındaki düşük profilli adaylar masaya oturur.</Text>
        {signable.length ? signable.map(({ player, pitch }) => {
          const club = career.db.clubs.find((item) => item.id === player.clubId);
          const summary = scoutCandidateSummary(player, pitch);
          return (
          <View key={player.id} style={[styles.scoutCandidateCard, summary.tone === "hot" && styles.scoutCandidateCardHot]}>
            <View style={styles.scoutCandidateRow}>
              <PlayerPortrait player={player} size={50} />
              <View style={styles.listMain}>
                <View style={styles.scoutCandidateTop}>
                  <Text style={styles.scoutCandidateName} numberOfLines={1}>{player.name}</Text>
                  <Text style={[styles.scoutCandidateTag, summary.tone === "hot" && styles.scoutCandidateTagHot]} numberOfLines={1}>{summary.label}</Text>
                </View>
                <Text style={styles.scoutCandidateMeta} numberOfLines={1}>{player.age} yaş · {player.position} · {club?.name || "Serbest"} · Pot {playerPotentialLabel(player)}</Text>
                <View style={styles.scoutSignalRow}>
                  <Text style={styles.scoutSignalChip} numberOfLines={1}>İlgi %{pitch.chance}</Text>
                  <Text style={styles.scoutSignalChip} numberOfLines={1}>Kom. %{pitch.commissionRate}</Text>
                  <Text style={styles.scoutSignalChip} numberOfLines={1}>Güven {player.loyalty ?? 55}</Text>
                </View>
                <Text style={styles.scoutCandidateMeta} numberOfLines={1}>Temas: {formatMoney(pitch.signingFee)} · Ret masrafı {formatMoney(pitch.approachCost)}</Text>
              </View>
            </View>
            <View style={styles.pitchChoiceRow}>
              {approachOptions.map((option) => {
                const preview = representationApproachPreview(pitch, option.id);
                return (
                  <TouchableOpacity
                    key={`${player.id}-${option.id}`}
                    style={[styles.pitchChoiceButton, option.id === "commission" && styles.pitchChoiceRisk]}
                    onPress={() => {
                      const result = signPlayerToAgency(career, player.id, option.id);
                      updateCareer(result.career);
                      setDecisionFlash?.({
                        title: result.ok ? "Temsil imzalandı" : "Oyuncu reddetti",
                        summary: result.ok ? `${player.name} ajansa katıldı. Yaklaşım: ${option.label}.` : `${player.name} beklemeyi seçti. Yaklaşım: ${option.label}.`,
                        tone: result.ok ? "accept" : "decline"
                      });
                    }}
                  >
                    <Text style={styles.pitchChoiceText}>{option.label}</Text>
                    <Text style={styles.pitchChoiceChance}>%{preview.chance}</Text>
                    <Text style={styles.pitchChoiceHint}>{formatMoney(preview.signingFee)} · {preview.trust}</Text>
                    <Text style={styles.pitchChoiceFine}>{preview.commission} · risk {preview.risk}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
        }) : (
          <Text style={styles.scoutEmptyText}>Şu an ajansa gelmek isteyen uygun aday yok. Scout gönder, haftalık planı Scout yap veya saygınlığı yükselt.</Text>
        )}
      </View>

      {(career.scoutJobs || []).length > 0 && (
        <View style={styles.scoutActionPanel}>
          <View style={styles.scoutPanelHeader}>
            <Text style={styles.scoutPanelTitle}>Devam eden raporlar</Text>
            <Text style={styles.scoutPanelBadge}>{career.scoutJobs.length}</Text>
          </View>
          {career.scoutJobs.map((job) => {
            const left = Math.max(0, job.dueWeek - career.week);
            const progress = Math.max(8, Math.min(100, Math.round(((2 - left) / 2) * 100)));
            return (
              <View key={job.id} style={styles.scoutJobRow}>
                <Text style={styles.scoutCandidateName}>{String(job.countryId).toUpperCase()} raporu</Text>
                <Text style={styles.scoutCandidateMeta}>{left} hafta kaldı · kalite {job.quality}</Text>
                <View style={styles.interestTrack}><View style={[styles.interestFill, { width: `${progress}%` }]} /></View>
              </View>
            );
          })}
        </View>
      )}

      {career.db.countries.map((country) => (
        <View key={country.id} style={styles.listCard}>
          <CountryBadge countryId={country.id} />
          <View style={styles.listMain}>
            <Text style={styles.cardTitle}>{country.name}</Text>
            <Text style={styles.muted}>€35K · 2 {tr("week")} · Kalite + saygınlık</Text>
          </View>
          <TouchableOpacity
            style={[styles.smallButton, career.money < 35000 && styles.disabledButton]}
            onPress={() => {
              if (career.money < 35000) {
                setDecisionFlash?.({
                  title: "Scout bütçesi yok",
                  summary: `${country.name} raporu için €35K gerekiyor. Önce kasa yarat veya daha ucuz kararlar al.`,
                  tone: "decline"
                });
                return;
              }
              updateCareer(startScout(career, country.id).career);
              setDecisionFlash?.({
                title: "Scout yola çıktı",
                summary: `${country.name} pazarı için 2 haftalık rapor hazırlanıyor.`,
                tone: "accept"
              });
            }}
          >
            <Text style={styles.smallButtonText}>{tr("sendScout")}</Text>
          </TouchableOpacity>
        </View>
      ))}
      <SectionTitle text="Aktif Raporlar" />
      {career.scoutJobs.length === 0 ? <Text style={styles.muted}>Scout beklemiyor.</Text> : career.scoutJobs.map((job) => <Row key={job.id} left={job.countryId} right={`${job.dueWeek}. hafta`} />)}
    </View>
  );
}

function Life({ career, tr, updateCareer, setDecisionFlash }) {
  return (
    <View>
      <SectionTitle text={tr("life")} />
      {lifeActivities.map((activity) => (
        <View key={activity.id} style={styles.listCard}>
          <LifeIcon activityId={activity.id} />
          <View style={styles.listMain}>
            <Text style={styles.cardTitle}>{tr(activity.titleKey)}</Text>
            <Text style={styles.muted}>{tr(activity.descriptionKey)}</Text>
            <Text style={styles.valueText}>{formatMoney(activity.cost)} · Rep +{activity.reputation || 0}</Text>
          </View>
          <TouchableOpacity style={[styles.smallButton, career.money < activity.cost && styles.disabledButton]} onPress={() => {
            if (career.money < activity.cost) {
              setDecisionFlash?.({
                title: "Bütçe yetmiyor",
                summary: `${tr(activity.titleKey)} için ${formatMoney(activity.cost)} gerekiyor.`,
                tone: "decline"
              });
              return;
            }
            updateCareer(buyLifeActivity(career, activity.id).career);
            setDecisionFlash?.({
              title: "Yaşam yatırımı alındı",
              summary: `${tr(activity.titleKey)} saygınlık ve ajans algısını etkiledi.`,
              tone: "accept"
            });
          }}>
            <Text style={styles.smallButtonText}>{tr("buy")}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const reputationActions = [
  {
    id: "street-reference",
    title: "Mahalle Referansı",
    description: "Eski bir antrenör ve iki yerel muhabirle konuş; ilk ajans ismini duyurur.",
    minReputation: 10,
    reputationCost: 1,
    moneyCost: 4000,
    relationBoost: 1,
    mediaPower: 1
  },
  {
    id: "local-credibility",
    title: "Yerel Güven Turu",
    description: "Alt lig kulüplerine kendini tanıt; küçük ama gerçek kapı açar.",
    minReputation: 16,
    reputationCost: 1,
    moneyCost: 8000,
    relationBoost: 1,
    scoutBoost: 1
  },
  {
    id: "trial-day",
    title: "Deneme Günü Ayarla",
    description: "Bir alt lig antrenman gününe gir; düşük profilli oyuncu dosyası açabilir.",
    minReputation: 20,
    reputationCost: 2,
    moneyCost: 10000,
    scoutBoost: 2,
    revealPlayers: 1
  },
  {
    id: "club-intro",
    title: "Kulüp Kapısı Aç",
    description: "Saygınlığını kullanıp bir yöneticiyle sıcak giriş al.",
    minReputation: 24,
    reputationCost: 3,
    moneyCost: 12000,
    relationBoost: 3,
    negotiation: 1
  },
  {
    id: "trusted-radar",
    title: "Güvenilir Radar",
    description: "Piyasadaki adını kullanıp iki yeni oyuncu dosyasını aç.",
    minReputation: 30,
    reputationCost: 4,
    moneyCost: 18000,
    scoutBoost: 3,
    revealPlayers: 2
  },
  {
    id: "media-shield",
    title: "Medya Kalkanı",
    description: "PR kredisi harca; etik krizi ve kötü haber riskini azalt.",
    minReputation: 36,
    reputationCost: 5,
    moneyCost: 22000,
    mediaPower: 2,
    ethics: 5
  },
  {
    id: "elite-room",
    title: "Özel Masa",
    description: "Daha büyük kulüplerle kapalı toplantı ayarla.",
    minReputation: 52,
    reputationCost: 7,
    moneyCost: 40000,
    negotiation: 2,
    relationBoost: 2,
    mediaPower: 1
  }
];

function ReputationMilestonePanel({ career }) {
  const reputation = career.reputation || 0;
  const represented = getRepresentedPlayers(career).length;
  const capacity = getAgencyCapacity(career);
  const nextCapacityRep = Math.min(100, Math.max(reputation + 1, Math.ceil((reputation + 1) / 18) * 18));
  const currentCommission = 3 + Math.floor(reputation / 28);
  const nextCommissionRep = Math.min(100, Math.max(reputation + 1, Math.ceil((reputation + 1) / 28) * 28));
  const milestones = [
    {
      id: "capacity",
      label: "Ajans kapasitesi",
      value: `${represented}/${capacity}`,
      next: nextCapacityRep,
      note: nextCapacityRep >= 100 ? "Üst seviye portföy" : `Yeni slot: Rep ${nextCapacityRep}`
    },
    {
      id: "commission",
      label: "Komisyon gücü",
      value: `%${currentCommission}`,
      next: nextCommissionRep,
      note: nextCommissionRep >= 100 ? "Elit pazarlık" : `Yeni oran: Rep ${nextCommissionRep}`
    },
    {
      id: "market",
      label: "Dış pazar",
      value: reputation >= 28 ? "Açık" : "Kilitli",
      next: 28,
      note: reputation >= 28 ? "Yerel dışı adaylar konuşur" : "Rep 28 ile açılır"
    },
    {
      id: "trust",
      label: "Scout güveni",
      value: `+${Math.floor(reputation / 6)}`,
      next: 35,
      note: reputation >= 35 ? "Rapor riski azaldı" : "Rep 35 raporları netleştirir"
    }
  ];
  const ladder = [
    { rep: 10, label: "Yerel ad", detail: "İlk network hamlesi" },
    { rep: 18, label: "Slot", detail: "+1 portföy yolu" },
    { rep: 28, label: "Pazar", detail: "Dış ligler açılır" },
    { rep: 35, label: "Sponsor", detail: "Raporlar netleşir" },
    { rep: 52, label: "Elit masa", detail: "Büyük kulüp kapısı" }
  ];
  const nextGate = ladder.find((item) => reputation < item.rep) || ladder[ladder.length - 1];
  return (
    <View style={styles.reputationMilestonePanel}>
      <View style={styles.reputationMilestoneTop}>
        <View style={styles.listMain}>
          <Text style={styles.reputationMilestoneTitle}>Saygınlık Ne Açıyor?</Text>
          <Text style={styles.reputationMilestoneCopy}>Her puan; kapasite, komisyon, scout güveni ve pazar erişimini büyütür.</Text>
        </View>
        <Text style={styles.reputationMilestoneBadge}>{reputation}</Text>
      </View>
      <View style={styles.reputationLadder}>
        <View style={styles.reputationLadderHeader}>
          <Text style={styles.reputationLadderTitle}>Yol Haritası</Text>
          <Text style={styles.reputationLadderNext}>Sıradaki: Rep {nextGate.rep} · {nextGate.label}</Text>
        </View>
        <View style={styles.reputationLadderTrack}>
          <View style={[styles.reputationLadderFill, { width: `${Math.min(100, Math.max(4, reputation))}%` }]} />
        </View>
        <View style={styles.reputationLadderSteps}>
          {ladder.map((item) => {
            const unlocked = reputation >= item.rep;
            return (
              <View key={item.rep} style={[styles.reputationLadderStep, unlocked && styles.reputationLadderStepOpen]}>
                <Text style={styles.reputationLadderRep}>{item.rep}</Text>
                <Text style={styles.reputationLadderLabel} numberOfLines={1}>{item.label}</Text>
                <Text style={styles.reputationLadderDetail} numberOfLines={1}>{item.detail}</Text>
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.reputationMilestoneGrid}>
        {milestones.map((item) => {
          const progress = Math.min(100, Math.round((reputation / Math.max(1, item.next)) * 100));
          const unlocked = reputation >= item.next;
          return (
            <View key={item.id} style={[styles.reputationMilestoneItem, unlocked && styles.reputationMilestoneItemUnlocked]}>
              <View style={styles.reputationMilestoneItemTop}>
                <Text style={styles.reputationMilestoneLabel}>{item.label}</Text>
                <Text style={styles.reputationMilestoneValue}>{item.value}</Text>
              </View>
              <View style={styles.reputationMilestoneTrack}>
                <View style={[styles.reputationMilestoneFill, { width: `${Math.max(5, progress)}%` }]} />
              </View>
              <Text style={styles.reputationMilestoneNote}>{item.note}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function AchievementsPanel({ career }) {
  const achievements = career.achievements?.length ? career.achievements : createAchievements();
  const completed = achievements.filter((item) => item.completed);
  const next = achievements
    .filter((item) => !item.completed)
    .sort((a, b) => ((b.progress || 0) / Math.max(1, b.target || 1)) - ((a.progress || 0) / Math.max(1, a.target || 1)))
    .slice(0, 3);
  return (
    <View style={styles.achievementPanel}>
      <View style={styles.objectiveHeader}>
        <View>
          <Text style={styles.objectiveTitle}>Başarımlar</Text>
          <Text style={styles.objectiveHint}>{completed.length}/{achievements.length} açıldı</Text>
        </View>
        <Text style={styles.achievementBadge}>Dı dırıırı</Text>
      </View>
      {next.map((item) => {
        const progress = Math.min(100, Math.round(((item.progress || 0) / Math.max(1, item.target || 1)) * 100));
        return (
          <View key={item.id} style={styles.achievementItem}>
            <View style={styles.objectiveItemTop}>
              <Text style={styles.objectiveName}>{item.title}</Text>
              <Text style={styles.objectivePercent}>{progress}%</Text>
            </View>
            <Text style={styles.objectiveCopy}>{item.description}</Text>
            <View style={styles.objectiveTrack}>
              <View style={[styles.achievementFill, { width: `${Math.max(4, progress)}%` }]} />
            </View>
            <Text style={styles.objectiveReward}>Ödül: {rewardSummary(item.reward)}</Text>
          </View>
        );
      })}
      {next.length === 0 && <Text style={styles.objectiveEmpty}>Bu sezonun görünen başarımları tamam. Yeni aşama için ajansı büyüt.</Text>}
    </View>
  );
}

function ReputationActionsPanel({ career, updateCareer, setDecisionFlash }) {
  const usedAnyThisWeek = (career.reputationSpendLog || []).some((log) => log.week === career.week);
  const nextUsable = reputationActions.find((item) =>
    career.reputation >= item.minReputation &&
    career.money >= item.moneyCost &&
    career.reputation >= item.reputationCost &&
    !(career.reputationSpendLog || []).some((log) => log.id === item.id && log.week === career.week)
  );
  return (
    <View style={styles.reputationPanel}>
      <View style={styles.objectiveHeader}>
        <View>
          <Text style={styles.objectiveTitle}>Saygınlık Hamleleri</Text>
          <Text style={styles.objectiveHint}>Haftada 1 hamle. Saygınlık kapı açar ama harcanınca baskı yaratır.</Text>
        </View>
        <Text style={styles.reputationBadge}>{career.reputation}</Text>
      </View>
      <View style={styles.reputationNextMove}>
        <Text style={styles.reputationNextKicker}>{usedAnyThisWeek ? "Bu hafta hamle yapıldı" : "Önerilen hamle"}</Text>
        <Text style={styles.reputationNextText} numberOfLines={2}>
          {usedAnyThisWeek
            ? "Yeni saygınlık hamlesi için haftayı ilerlet. Aynı hafta zincirleme harcama ekonomiyi bozmaz."
            : nextUsable
              ? `${nextUsable.title}: ${nextUsable.description}`
              : "Şimdilik para veya saygınlık yetmiyor. Oyuncu planı, kart kararı ve maç haftasıyla güç biriktir."}
        </Text>
      </View>
      {reputationActions.map((item) => {
        const locked = career.reputation < item.minReputation;
        const poor = career.money < item.moneyCost || career.reputation < item.reputationCost;
        const usedThisWeek = (career.reputationSpendLog || []).some((log) => log.id === item.id && log.week === career.week);
        const weekLocked = usedAnyThisWeek && !usedThisWeek;
        return (
          <View key={item.id} style={[styles.reputationActionRow, weekLocked && styles.reputationActionMuted]}>
            <View style={styles.listMain}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.muted}>{item.description}</Text>
              <Text style={styles.valueText}>Rep -{item.reputationCost} · {formatMoney(item.moneyCost)} · Kilit {item.minReputation}</Text>
            </View>
            <TouchableOpacity
              style={[styles.smallButton, (locked || poor || usedThisWeek || weekLocked) && styles.disabledButton]}
              onPress={() => {
                if (usedThisWeek) {
                  setDecisionFlash?.({ title: "Bu hafta kullanıldı", summary: `${item.title} etkisi bu hafta zaten masada. Haftayı ilerletince tekrar değerlendir.`, tone: "delay" });
                  return;
                }
                if (weekLocked) {
                  setDecisionFlash?.({ title: "Haftalık limit", summary: "Saygınlık hamleleri haftada bir kez yapılır. Önce haftanın sonucunu gör.", tone: "delay" });
                  return;
                }
                if (locked) {
                  setDecisionFlash?.({ title: "Saygınlık yetmiyor", summary: `${item.title} için saygınlık ${item.minReputation} gerekiyor.`, tone: "decline" });
                  return;
                }
                if (poor) {
                  setDecisionFlash?.({ title: "Güç yetmiyor", summary: `${item.title} için hem para hem saygınlık gerekir.`, tone: "decline" });
                  return;
                }
                updateCareer(applyReputationAction(career, item));
                setDecisionFlash?.({ title: "Saygınlık harcandı", summary: `${item.title} ajansa kalıcı avantaj verdi.`, tone: "accept" });
              }}
            >
              <Text style={styles.smallButtonText}>{usedThisWeek ? "Bu Hafta" : weekLocked ? "Hafta Sonu" : locked ? "Kilitli" : "Kullan"}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

function applyReputationAction(career, action) {
  const revealCount = action.revealPlayers || 0;
  const known = new Set(career.knownPlayerIds || []);
  const revealPlayers = revealCount
    ? (career.db.players || [])
        .filter((player) => !player.represented && !known.has(player.id))
        .sort((a, b) => (b.potential || 0) + (b.form || 0) - ((a.potential || 0) + (a.form || 0)))
        .slice(0, revealCount)
    : [];
  revealPlayers.forEach((player) => known.add(player.id));
  return applyAchievementProgress({
    ...career,
    money: career.money - action.moneyCost,
    reputation: Math.max(0, (career.reputation || 0) - action.reputationCost),
    negotiation: (career.negotiation || 0) + (action.negotiation || 0),
    scoutBoost: (career.scoutBoost || 0) + (action.scoutBoost || 0),
    relationBoost: (career.relationBoost || 0) + (action.relationBoost || 0),
    mediaPower: Math.min(100, (career.mediaPower || 0) + (action.mediaPower || 0)),
    ethics: Math.min(100, (career.ethics ?? 72) + (action.ethics || 0)),
    knownPlayerIds: [...known],
    db: {
      ...career.db,
      players: (career.db.players || []).map((player) => known.has(player.id)
        ? { ...player, scouted: true, scoutConfidence: Math.max(player.scoutConfidence || 0, action.revealPlayers ? 54 : player.scoutConfidence || 0) }
        : player)
    },
    reputationSpendLog: [
      { week: career.week, id: action.id, title: action.title },
      ...(career.reputationSpendLog || [])
    ].slice(0, 8),
    news: [`Saygınlık hamlesi: ${action.title}.`, ...(career.news || [])].slice(0, 20)
  });
}

function Empire({ career, updateCareer, setDecisionFlash }) {
  const predictions = career.empire?.predictions || { correct: 0, total: 0, streak: 0 };
  const preview = simulateWeekPreview(career).featured;
  const ethics = career.ethics ?? 72;
  const ethicsTone = ethics >= 70 ? "Temiz" : ethics >= 50 ? "Dikkat" : "Riskli";
  return (
    <View>
      <SectionTitle text="Futbol İmparatorluğu" />
      <View style={styles.empireHero}>
        <Text style={styles.empireLevel}>{career.empire?.level || "Agent"}</Text>
        <Text style={styles.empireCopy}>Saygınlık, sponsor, personel ve yatırımlarla kulüp başkanlığı yolunu aç.</Text>
        <View style={styles.empireStats}>
          <Stat label="Tahmin" value={`${predictions.correct}/${predictions.total}`} />
          <Stat label="Seri" value={predictions.streak} />
        </View>
      </View>

      <View style={styles.ethicsPanel}>
        <View style={styles.ethicsTop}>
          <Text style={styles.ethicsTitle}>Etik Risk</Text>
          <Text style={[styles.ethicsBadge, ethics < 50 && styles.ethicsBadgeRisk]}>{ethicsTone}</Text>
        </View>
        <View style={styles.ethicsTrack}>
          <View style={[styles.ethicsFill, ethics < 50 && styles.ethicsFillRisk, { width: `${Math.max(4, ethics)}%` }]} />
        </View>
        <Text style={styles.ethicsCopy}>Karanlık pazarlık kısa vadede para kazandırır; etik düştükçe medya ve soruşturma kartları çıkar.</Text>
      </View>

      <ReputationMilestonePanel career={career} />

      <AchievementsPanel career={career} />

      <ReputationActionsPanel career={career} updateCareer={updateCareer} setDecisionFlash={setDecisionFlash} />

      <SectionTitle text="Maç Tahmini" />
      {preview && (
        <View style={styles.predictionCard}>
          <Text style={styles.cardTitle}>{preview.homeName} - {preview.awayName}</Text>
          <Text style={styles.muted}>Doğru tahmin para ve saygınlık kazandırır. Yanlış tahmin prestij kaybettirir.</Text>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.primaryMini} onPress={() => updateCareer(predictFeaturedMatch(career, "home").career)}><Text style={styles.actionText}>Ev</Text></TouchableOpacity>
            <TouchableOpacity style={styles.primaryMini} onPress={() => updateCareer(predictFeaturedMatch(career, "draw").career)}><Text style={styles.actionText}>Beraberlik</Text></TouchableOpacity>
            <TouchableOpacity style={styles.primaryMini} onPress={() => updateCareer(predictFeaturedMatch(career, "away").career)}><Text style={styles.actionText}>Deplasman</Text></TouchableOpacity>
          </View>
        </View>
      )}

      <SectionTitle text="Yatırımlar" />
      {empireUpgrades.map((item) => {
        const owned = career.empire?.upgrades?.includes(item.id);
        return (
          <View key={item.id} style={styles.listCard}>
            <LifeIcon activityId={item.id} />
            <View style={styles.listMain}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.muted}>{item.description}</Text>
              <Text style={styles.valueText}>{formatMoney(item.cost)} · Haftalık {formatMoney(item.income)}</Text>
            </View>
            <TouchableOpacity style={[styles.smallButton, (owned || career.money < item.cost) && styles.disabledButton]} onPress={() => {
              if (owned) {
                setDecisionFlash?.({ title: "Zaten sende", summary: `${item.title} yatırımı daha önce alınmış.`, tone: "delay" });
                return;
              }
              if (career.money < item.cost) {
                setDecisionFlash?.({ title: "Yatırım bütçesi yok", summary: `${item.title} için ${formatMoney(item.cost)} gerekiyor.`, tone: "decline" });
                return;
              }
              updateCareer(buyEmpireUpgrade(career, item.id).career);
              setDecisionFlash?.({ title: "Yatırım alındı", summary: `${item.title} haftalık gelir ve marka etkisi üretmeye başladı.`, tone: "accept" });
            }}>
              <Text style={styles.smallButtonText}>{owned ? "Alındı" : "Al"}</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <SectionTitle text="Uzman Personel" />
      {staffCandidates.map((item) => {
        const hired = career.empire?.staff?.includes(item.id);
        return (
          <View key={item.id} style={styles.listCard}>
            <LifeIcon activityId={item.id} />
            <View style={styles.listMain}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.muted}>{item.description}</Text>
              <Text style={styles.valueText}>{formatMoney(item.cost)} · Maaş {formatMoney(item.weeklyCost)}/hafta</Text>
            </View>
            <TouchableOpacity style={[styles.smallButton, (hired || career.money < item.cost) && styles.disabledButton]} onPress={() => {
              if (hired) {
                setDecisionFlash?.({ title: "Personel ekipte", summary: `${item.name} zaten ajansta çalışıyor.`, tone: "delay" });
                return;
              }
              if (career.money < item.cost) {
                setDecisionFlash?.({ title: "Maaş bütçesi yok", summary: `${item.name} için ${formatMoney(item.cost)} ilk ödeme gerekiyor.`, tone: "decline" });
                return;
              }
              updateCareer(hireStaff(career, item.id).career);
              setDecisionFlash?.({ title: "Personel alındı", summary: `${item.name} ajans sistemine katıldı.`, tone: "accept" });
            }}>
              <Text style={styles.smallButtonText}>{hired ? "Ekipte" : "Tut"}</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <SectionTitle text="Sponsorlar" />
      {sponsorDeals.map((item) => {
        const signed = career.empire?.sponsors?.includes(item.id);
        const locked = career.reputation < item.minReputation;
        return (
          <View key={item.id} style={styles.listCard}>
            <LifeIcon activityId={item.id} />
            <View style={styles.listMain}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.muted}>{item.description}</Text>
              <Text style={styles.valueText}>Peşin {formatMoney(item.advance)} · Haftalık {formatMoney(item.weeklyIncome)} · Rep {item.minReputation}</Text>
            </View>
            <TouchableOpacity style={[styles.smallButton, (signed || locked) && styles.disabledButton]} onPress={() => {
              if (signed) {
                setDecisionFlash?.({ title: "Sponsor imzalı", summary: `${item.name} anlaşması zaten aktif.`, tone: "delay" });
                return;
              }
              if (locked) {
                setDecisionFlash?.({ title: "Saygınlık yetmiyor", summary: `${item.name} için saygınlık ${item.minReputation} gerekiyor.`, tone: "decline" });
                return;
              }
              updateCareer(signSponsor(career, item.id).career);
              setDecisionFlash?.({ title: "Sponsor imzalandı", summary: `${item.name} peşin ödeme ve haftalık gelir sağlayacak.`, tone: "accept" });
            }}>
              <Text style={styles.smallButtonText}>{signed ? "İmzalı" : locked ? "Kilitli" : "İmzala"}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

function CardPopup({ card, career, tr, remaining, onDecision, onAgenda }) {
  if (!card || !career) return null;
  const weeksLeft = Math.max(0, (card.expiresWeek || career.week + 1) - career.week);
  const artwork = cardArtworkFor(card);
  const beat = cardStoryBeat(card, tr);
  const acceptScore = cardDecisionScore(card.accept);
  const declineScore = cardDecisionScore(card.decline);
  const preferredDecision = acceptScore >= declineScore ? "accept" : "decline";
  const decisionOptions = [
    { id: "accept", label: tr("accept"), sub: "Fırsatı sahiplen", effect: card.accept, tone: "good" },
    { id: "decline", label: tr("decline"), sub: "Riski kapat", effect: card.decline, tone: "warn" }
  ];
  return (
    <Modal transparent visible={!!card} animationType="fade" onRequestClose={() => {}}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalStackGhostTwo} />
        <View style={styles.modalStackGhostOne} />
        <MotiView
          from={{ opacity: 0, translateY: 42, scale: 0.94, rotate: "-2deg" }}
          animate={{ opacity: 1, translateY: 0, scale: 1, rotate: "0deg" }}
          transition={{ type: "timing", duration: 280 }}
          style={[styles.cardModal, styles[`card_${card.severity || "normal"}`]]}
        >
          <View style={styles.modalShine} />
          <AtmosphereDashes count={8} tone={card.severity === "urgent" || card.severity === "risk" ? "gold" : "blue"} />
          <AnimatedEdgeLines tone={card.severity === "opportunity" ? "green" : card.severity === "rare" ? "blue" : "gold"} />
          <PremiumSheen delay={160} color="rgba(255,255,255,0.12)" />
          <View style={styles.modalTopLine}>
            <EventIcon source={card.source} />
            <View style={styles.listMain}>
              <Text style={styles.modalKicker}>{cardSourceLabel(card.source)} - {cardSeverityLabel(card.severity)}</Text>
              <Text style={styles.modalMeta}>
                Hafta {card.weekCreated || career.week} - {weeksLeft} hafta kaldı{remaining ? ` - sırada ${remaining}` : ""}
              </Text>
            </View>
          </View>

          <MotiView
            from={{ opacity: 0, translateY: 18, scale: 0.97 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ type: "timing", duration: 430, delay: 80 }}
            style={styles.cardStoryStage}
          >
            <ImageBackground source={artwork} style={styles.cardArtworkBanner} imageStyle={styles.cardArtworkImage}>
              <View style={styles.cardArtworkShade} />
              <CardStoryCast source={card.source} severity={card.severity} />
              <MotiView
                from={{ opacity: 0.72, translateX: -4 }}
                animate={{ opacity: 1, translateX: 5 }}
                transition={{ type: "timing", duration: 560, loop: true }}
                style={styles.cardArtworkDrift}
              />
              <Text style={styles.cardArtworkLabel}>{cardSourceLabel(card.source)}</Text>
            </ImageBackground>
            <View style={styles.cardStoryCaption}>
              <Text style={styles.cardStoryKicker}>{beat.kicker}</Text>
              <Text style={styles.cardStoryText} numberOfLines={2}>{beat.line}</Text>
            </View>
          </MotiView>

          <RevealWords text={tr(card.titleKey)} textStyle={styles.modalTitle} />
          <Text style={styles.modalBody}>{tr(card.bodyKey)}</Text>
          <View style={styles.cardClock}>
            {[0, 1, 2, 3].map((item) => (
              <MotiView
                key={item}
                from={{ opacity: 0.35, scaleX: 0.55 }}
                animate={{ opacity: item <= Math.min(3, weeksLeft) ? 1 : 0.25, scaleX: item <= Math.min(3, weeksLeft) ? 1 : 0.55 }}
                transition={{ type: "timing", duration: 420, delay: item * 80 }}
                style={styles.cardClockTick}
              />
            ))}
          </View>
          <View style={styles.modalContext}>
            <Text style={styles.modalContextText}>
              Anlık ajans kararı · {weeksLeft ? `${weeksLeft} hafta baskı süresi` : "son şans"} · Devam etmek için kabul veya red seçmelisin
            </Text>
          </View>

          <View style={styles.modalEffects}>
            <Text style={styles.cardDecisionHeader}>Karar etkisi</Text>
            <View style={styles.cardDecisionGrid}>
              {decisionOptions.map((item, index) => (
                <MotiView key={item.id} from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 220, delay: 120 + index * 70 }} style={styles.cardDecisionMotion}>
                  <TouchableOpacity
                    activeOpacity={0.86}
                    style={[styles.cardDecisionChoice, item.tone === "good" ? styles.cardDecisionGood : styles.cardDecisionWarn, preferredDecision === item.id && styles.cardDecisionPreferred]}
                    onPress={() => onDecision(item.id)}
                  >
                    <View style={styles.cardDecisionTop}>
                      <Text style={styles.cardDecisionLabel}>{item.label}</Text>
                      {preferredDecision === item.id && <Text style={styles.cardDecisionTag}>uzun vade</Text>}
                    </View>
                    <Text style={styles.cardDecisionSub}>{item.sub}</Text>
                    <View style={styles.cardDecisionPills}>
                      {effectPillItems(item.effect).map((pill) => (
                        <Text key={pill.label} style={[styles.cardDecisionPill, pill.tone === "good" && styles.cardDecisionPillGood, pill.tone === "bad" && styles.cardDecisionPillBad, pill.tone === "cost" && styles.cardDecisionPillCost]} numberOfLines={1}>
                          {pill.label}
                        </Text>
                      ))}
                    </View>
                  </TouchableOpacity>
                </MotiView>
              ))}
            </View>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
}

function cardStoryBeat(card = {}, tr = (key) => key) {
  const source = card.source || "player";
  const severity = card.severity || "normal";
  const title = tr(card.titleKey);
  if (source === "club") return { kicker: "Pazarlık odası", line: `${title} kapıyı araladı. Kulübü memnun etmekle oyuncuyu korumak aynı anda mümkün olmayabilir.` };
  if (source === "media") return { kicker: severity === "urgent" ? "Flaş gelişme" : "Medya koridoru", line: `${title} ajansın adını manşete taşıyabilir. Yanlış cümle saygınlığı yakar.` };
  if (source === "sponsor") return { kicker: "Marka masası", line: `${title} parayı ve görünürlüğü aynı anda getirir; ama oyuncu hikayesi ucuz reklam gibi görünmemeli.` };
  if (source === "tournament") return { kicker: "Scout yolu", line: `${title} yeni yetenek kapısı açar. Harcama bugünden, fırsat haftalar sonra gelir.` };
  if (source === "legend") return { kicker: "Prestij sahnesi", line: `${title} küçük ajansa büyük gölge düşürür. Doğru duruş saygınlık kazandırır.` };
  if (source === "finance") return { kicker: "Risk defteri", line: `${title} hızlı para kokusu taşır. Kasa büyürken itibar açıkta kalabilir.` };
  return { kicker: "Oyuncu hikayesi", line: `${title} artık kişisel bir dosya. Kabul veya red, oyuncunun sana bakışını değiştirecek.` };
}

function DecisionFlash({ flash }) {
  if (!flash) return null;
  return (
    <View style={[styles.decisionFlash, flash.tone === "decline" && styles.decisionFlashBad, flash.tone === "delay" && styles.decisionFlashNeutral]}>
      <Text style={styles.decisionFlashTitle}>{flash.title}</Text>
      <Text style={styles.decisionFlashText}>{flash.summary}</Text>
    </View>
  );
}

function severityRank(severity) {
  return severity === "urgent" ? 4 : severity === "rare" ? 3 : severity === "risk" ? 2 : severity === "opportunity" ? 1 : 0;
}

function cardArtworkFor(card = {}) {
  const id = `${card.id || ""} ${card.templateId || ""} ${card.titleKey || ""}`.toLowerCase();
  if (id.includes("holiday")) return cardArtworkImages.holiday;
  if (id.includes("secret") || id.includes("pressure")) return cardArtworkImages.secret;
  if (id.includes("family") || id.includes("home")) return cardArtworkImages.family;
  if (id.includes("sponsor") || card.source === "sponsor") return cardArtworkImages.sponsor;
  if (id.includes("tournament")) return cardArtworkImages.tournament;
  if (id.includes("legend")) return cardArtworkImages.legend;
  if (id.includes("stock") || card.source === "finance") return cardArtworkImages.finance;
  if (id.includes("car")) return cardArtworkImages.car;
  if (id.includes("crisis") || id.includes("scandal")) return cardArtworkImages.crisis;
  if (id.includes("data")) return cardArtworkImages.data;
  if (card.source === "media") return cardArtworkImages.media;
  if (card.source === "club") return cardArtworkImages.secret;
  if (card.source === "player" || card.source === "talk") return cardArtworkImages.agent;
  return cardArtworkImages.agent;
}

function cardSeverityLabel(severity) {
  if (severity === "urgent") return "Acil";
  if (severity === "rare") return "Nadir";
  if (severity === "risk") return "Riskli";
  if (severity === "opportunity") return "Fırsat";
  return "Normal";
}

function cardSourceLabel(source) {
  const labels = {
    media: "Medya",
    player: "Oyuncu",
    club: "Kulüp",
    sponsor: "Sponsor",
    tournament: "Turnuva",
    legend: "Efsane",
    finance: "Finans",
    talk: "Görüşme"
  };
  return labels[source] || source;
}

function personalityLabel(type) {
  const labels = {
    loyal: "Sadık",
    money: "Para odaklı",
    ambitious: "Hırslı",
    media: "Medyatik",
    troubled: "Sorunlu",
    professional: "Profesyonel"
  };
  return labels[type] || "Profesyonel";
}

function playerPotentialLabel(player) {
  if (player.represented) return String(player.potential);
  if (!player.scouted && !player.scoutConfidence) return "Rapor yok";
  const confidence = player.scoutConfidence || 58;
  const spread = confidence >= 82 ? 2 : confidence >= 68 ? 4 : 7;
  const low = Math.max(player.overall || 1, (player.potential || player.overall || 60) - spread);
  const high = Math.min(99, (player.potential || player.overall || 60) + spread);
  return `${low}-${high}`;
}

function scoutConfidenceLabel(player) {
  if (player.represented) return "Temsil";
  const confidence = player.scoutConfidence || (player.scouted ? 58 : 0);
  if (!confidence) return "Rapor yok";
  if (confidence >= 82) return "Rapor net";
  if (confidence >= 68) return "Rapor orta";
  return "Rapor sisli";
}

function transferPolicyLabel(policy) {
  const labels = {
    academy: "Altyapı",
    value: "Fırsat",
    develop: "Gelişim",
    star: "Yıldız",
    pressing: "Tempo",
    galactic: "Dev transfer",
    technical: "Teknik",
    balanced: "Dengeli"
  };
  return labels[policy] || "Dengeli";
}

function effectSummary(effect = {}) {
  const parts = [];
  if (effect.money) parts.push(`${effect.money > 0 ? "+" : ""}${formatMoney(effect.money)}`);
  if (effect.reputation) parts.push(`Rep ${effect.reputation > 0 ? "+" : ""}${effect.reputation}`);
  if (effect.morale) parts.push(`Moral ${effect.morale > 0 ? "+" : ""}${effect.morale}`);
  if (effect.relation) parts.push(`İlişki ${effect.relation > 0 ? "+" : ""}${effect.relation}`);
  if (effect.scoutBoost) parts.push(`Scout ${effect.scoutBoost > 0 ? "+" : ""}${effect.scoutBoost}`);
  return parts.length ? parts.join(" · ") : "Etki yok";
}

function cardDecisionScore(effect = {}) {
  const moneyScore = Math.max(-10, Math.min(10, (effect.money || 0) / 25000));
  return moneyScore
    + (effect.reputation || 0) * 5
    + (effect.morale || 0) * 2
    + (effect.relation || 0) * 2
    + (effect.scoutBoost || 0) * 3
    + (effect.ethics || 0) * 4;
}

function effectPillItems(effect = {}) {
  const items = [];
  if (effect.money) items.push({ label: `${effect.money > 0 ? "+" : "-"}${formatMoney(Math.abs(effect.money))}`, tone: effect.money > 0 ? "good" : "cost" });
  if (effect.reputation) items.push({ label: `Rep ${effect.reputation > 0 ? "+" : ""}${effect.reputation}`, tone: effect.reputation > 0 ? "good" : "bad" });
  if (effect.morale) items.push({ label: `Moral ${effect.morale > 0 ? "+" : ""}${effect.morale}`, tone: effect.morale > 0 ? "good" : "bad" });
  if (effect.relation) items.push({ label: `İlişki ${effect.relation > 0 ? "+" : ""}${effect.relation}`, tone: effect.relation > 0 ? "good" : "bad" });
  if (effect.scoutBoost) items.push({ label: `Scout ${effect.scoutBoost > 0 ? "+" : ""}${effect.scoutBoost}`, tone: effect.scoutBoost > 0 ? "good" : "bad" });
  if (effect.ethics) items.push({ label: `Etik ${effect.ethics > 0 ? "+" : ""}${effect.ethics}`, tone: effect.ethics > 0 ? "good" : "bad" });
  return items.length ? items : [{ label: "Net etki yok", tone: "neutral" }];
}

function negotiationPressureRead({ playerComfort = 50, clubPatience = 50, agencyHeat = 50, projectedChance = 50 }) {
  if (projectedChance >= 70 && playerComfort >= 58 && clubPatience >= 45) {
    return { label: "Temiz masa", tone: "good", copy: "Oyuncu şartları kabul edilebilir buluyor; kulüp de masadan kalkmaya yakın değil." };
  }
  if (agencyHeat >= 72 || clubPatience <= 28) {
    return { label: "Kopma riski", tone: "danger", copy: "Komisyon ve bonus baskısı kulübü zorluyor. Sert hamle parayı büyütür ama masayı devirebilir." };
  }
  if (playerComfort <= 38) {
    return { label: "Oyuncu soğuk", tone: "danger", copy: "Oyuncu tarafı maaş veya imza parasını zayıf görüyor. Güven düşmeden şartları yumuşat." };
  }
  return { label: "Gri alan", tone: "neutral", copy: "Anlaşma mümkün ama iki taraf da tam rahat değil. Taktik seçimi sonucu belirler." };
}

function Negotiation({ career, tr, offer, player, club, updateCareer, setOffer, setScreen, setDecisionFlash }) {
  const [terms, setTerms] = useState({
    wage: offer.wage,
    commission: offer.commission,
    signingBonus: offer.signingBonus || 0,
    contractYears: offer.contractYears || 3,
    bonuses: offer.bonuses || 0,
    releaseClause: offer.releaseClause || offer.fee * 2
  });
  const tunedOffer = { ...offer, ...terms };
  const playerDemand = Math.round(((terms.wage - player.wage) / Math.max(1, player.wage)) * 100);
  const commissionRate = Math.round((terms.commission / Math.max(1, offer.fee)) * 1000) / 10;
  const trustImpact = player?.represented ? Math.round(((player.agencyTrust ?? 52) - 50) / 8) : 0;
  const greedRisk = Math.max(0, Math.round(commissionRate - 7));
  const releaseRisk = terms.releaseClause < offer.fee * 1.7 ? 5 : 0;
  const wageComfort = Math.max(-12, Math.min(16, ((terms.wage || 0) - player.wage) / Math.max(1, player.wage) * 18));
  const engineGreed = Math.max(-4, Math.min(18, (terms.commission || 0) / Math.max(1, offer.fee) * 100 - 7));
  const projectedBaseChance = Math.max(3, Math.min(95, Math.round(offer.chance - engineGreed - releaseRisk + wageComfort)));
  const projectedChance = projectedBaseChance;
  const aiAdvice = offer.aiAdvice || { leverage: projectedChance, tactic: "balanced", note: "Dengeli ilerle: veriler yeterli." };
  const playerComfort = Math.max(0, Math.min(100, 52 + wageComfort + (terms.signingBonus || 0) / 15000 - Math.max(0, (player?.ego || 50) - 60) / 2));
  const clubPatience = Math.max(0, Math.min(100, 78 - greedRisk * 4 - releaseRisk - Math.max(0, (club?.negotiationHardness || 55) - 55) / 2));
  const agencyHeat = Math.max(0, Math.min(100, 32 + greedRisk * 7 + (terms.bonuses || 0) / 12000));
  const negotiationRead = negotiationPressureRead({ playerComfort, clubPatience, agencyHeat, projectedChance });

  function changeTerm(key, delta, min = 0, max = Infinity) {
    setTerms((current) => ({ ...current, [key]: Math.max(min, Math.min(max, current[key] + delta)) }));
  }

  const tacticOptions = [
    { id: "soft", label: "Yumuşak", chanceDelta: 7, reward: 0.9, ethics: 0, hint: "Oyuncu ve kulüp ilişkisi daha güvenli" },
    { id: "balanced", label: "Dengeli", chanceDelta: 0, reward: 1, ethics: 0, hint: "Standart komisyon, düşük risk" },
    { id: "hard", label: "Sert", chanceDelta: -15, reward: 1.22, ethics: -1, hint: "Daha çok para, ilişki riski" },
    { id: "dark", label: "Karanlık", chanceDelta: -24, reward: 1.38, ethics: -7, hint: "Kısa vadede para, uzun vadede itibar riski" }
  ];

  function close(stance) {
    const result = negotiate(career, tunedOffer, stance);
    updateCareer(result.career);
    setOffer(null);
    setDecisionFlash?.({
      title: result.ok ? "Anlaşma imzalandı" : "Pazarlık çöktü",
      summary: result.ok ? `${player?.name} için ${formatMoney(Math.round(terms.commission * (tacticOptions.find((item) => item.id === stance)?.reward || 1)))} komisyon yazıldı.` : `${club?.name} masadan kalktı.`,
      tone: result.ok ? "accept" : "decline"
    });
  }
  function closePanel() {
    setOffer(null);
    setScreen?.("players");
  }
  return (
    <View style={styles.dealModalShell}>
      <SectionTitle text={tr("negotiate")} />
      <View style={styles.dealBox}>
        <AnimatedEdgeLines tone="green" delay={200} />
        <PremiumSheen delay={260} color="rgba(134,239,172,0.12)" />
        <View style={styles.dealHeader}>
          <View style={styles.listMain}>
            <Text style={styles.dealKicker}>Transfer teklifi</Text>
            <Text style={styles.dealHeaderTitle} numberOfLines={1}>{player?.name} › {club?.name}</Text>
          </View>
          <TouchableOpacity style={styles.dealCloseButton} onPress={closePanel}>
            <Text style={styles.dealCloseText}>×</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.dealVisualRow}>
          <PlayerPortrait player={player} size={74} />
          <Text style={styles.dealArrow}>{"›"}</Text>
          <ClubCrest club={club} size={74} />
        </View>
        <View style={styles.dealChanceBand}>
          <Text style={styles.dealChanceText}>Tahmini kapanış</Text>
          <Text style={styles.dealChanceValue}>{projectedChance}%</Text>
        </View>
        <View style={styles.negotiationPressurePanel}>
          <View style={styles.negotiationPressureTop}>
            <Text style={styles.negotiationPressureTitle}>Masadaki baskı</Text>
            <Text style={[styles.negotiationPressureBadge, negotiationRead.tone === "danger" && styles.negotiationPressureBadgeDanger, negotiationRead.tone === "good" && styles.negotiationPressureBadgeGood]}>{negotiationRead.label}</Text>
          </View>
          {[
            { label: "Oyuncu konforu", value: playerComfort, tone: "player" },
            { label: "Kulüp sabrı", value: clubPatience, tone: "club" },
            { label: "Ajans iştahı", value: agencyHeat, tone: "agency" }
          ].map((item) => (
            <View key={item.label} style={styles.negotiationPressureRow}>
              <Text style={styles.negotiationPressureLabel}>{item.label}</Text>
              <View style={styles.negotiationPressureTrack}>
                <View style={[styles.negotiationPressureFill, styles[`negotiationPressure_${item.tone}`], { width: `${Math.round(item.value)}%` }]} />
              </View>
              <Text style={styles.negotiationPressureValue}>{Math.round(item.value)}</Text>
            </View>
          ))}
          <Text style={styles.negotiationPressureCopy} numberOfLines={2}>{negotiationRead.copy}</Text>
        </View>
        <View style={styles.dealPayoutStrip}>
          <View style={styles.dealPayoutCell}>
            <Text style={styles.dealPayoutLabel}>Ajans alır</Text>
            <Text style={styles.dealPayoutValue}>{formatMoney(terms.commission)}</Text>
          </View>
          <View style={styles.dealPayoutCell}>
            <Text style={styles.dealPayoutLabel}>Oyuncu maaşı</Text>
            <Text style={styles.dealPayoutValue}>{formatMoney(terms.wage)}</Text>
          </View>
          <View style={styles.dealPayoutCell}>
            <Text style={styles.dealPayoutLabel}>Süre</Text>
            <Text style={styles.dealPayoutValue}>{terms.contractYears} yıl</Text>
          </View>
        </View>
        <Text style={styles.muted}>{personalityLabel(player?.personality)} · Ego {player?.ego ?? 50} · Sadakat {player?.loyalty ?? 55} · Kulüp sertliği {club?.negotiationHardness ?? 55}</Text>
        <Row left={tr("value")} right={formatMoney(offer.fee)} />
        <DealTerm label="Maaş" value={formatMoney(terms.wage)} onMinus={() => changeTerm("wage", -5000, player.wage)} onPlus={() => changeTerm("wage", 5000)} />
        <DealTerm label="İmza parası" value={formatMoney(terms.signingBonus)} onMinus={() => changeTerm("signingBonus", -25000)} onPlus={() => changeTerm("signingBonus", 25000)} />
        <DealTerm label="Komisyon" value={`${formatMoney(terms.commission)} (${commissionRate}%)`} onMinus={() => changeTerm("commission", -25000, 0)} onPlus={() => changeTerm("commission", 25000)} />
        <DealTerm label="Sözleşme" value={`${terms.contractYears} yıl`} onMinus={() => changeTerm("contractYears", -1, 1, 6)} onPlus={() => changeTerm("contractYears", 1, 1, 6)} />
        <DealTerm label="Bonuslar" value={formatMoney(terms.bonuses)} onMinus={() => changeTerm("bonuses", -10000)} onPlus={() => changeTerm("bonuses", 10000)} />
        <DealTerm label="Serbest kalma" value={formatMoney(terms.releaseClause)} onMinus={() => changeTerm("releaseClause", -100000, offer.fee)} onPlus={() => changeTerm("releaseClause", 100000)} />
        <View style={styles.dealReadout}>
          <Text style={styles.dealReadoutText}>Oyuncu beklentisi: {playerDemand >= 0 ? "+" : ""}{playerDemand}%</Text>
          <Text style={styles.dealReadoutText}>Baz şans: {offer.chance}% · Oyuncu uyumu {offer.playerFit} · Kulüp uyumu {offer.clubFit}</Text>
        </View>
        <View style={styles.aiDealBox}>
          <Text style={styles.aiDealTitle}>AI pazarlık modeli · kaldıraç {aiAdvice.leverage}</Text>
          <Text style={styles.aiDealText}>{cleanGameText(aiAdvice.note)}</Text>
        </View>
        <View style={styles.dealSignalGrid}>
          <View style={styles.dealSignal}>
            <Text style={styles.dealSignalValue}>{projectedChance}%</Text>
            <Text style={styles.dealSignalLabel}>tahmini şans</Text>
          </View>
          <View style={styles.dealSignal}>
            <Text style={styles.dealSignalValue}>{trustImpact >= 0 ? "+" : ""}{trustImpact}</Text>
            <Text style={styles.dealSignalLabel}>güven etkisi</Text>
          </View>
          <View style={styles.dealSignal}>
            <Text style={styles.dealSignalValue}>{greedRisk}</Text>
            <Text style={styles.dealSignalLabel}>komisyon riski</Text>
          </View>
        </View>
      </View>
      <View style={styles.tacticGrid}>
        {tacticOptions.map((item, index) => (
          <MotiView key={item.id} from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 220, delay: index * 45 }} style={styles.tacticMotion}>
            <TouchableOpacity style={[styles.tacticCard, item.id === "dark" && styles.tacticCardDark, item.id === aiAdvice.tactic && styles.tacticCardRecommended]} onPress={() => close(item.id)}>
              <View style={styles.tacticTop}>
                <Text style={styles.tacticTitle}>{item.label}</Text>
                <Text style={styles.tacticChance}>{Math.max(3, Math.min(95, projectedBaseChance - (item.id === "hard" ? 15 : item.id === "soft" ? -7 : item.id === "dark" ? 24 : 0)))}%</Text>
              </View>
              {item.id === aiAdvice.tactic && <Text style={styles.aiRecommended}>AI önerisi</Text>}
              <Text style={styles.tacticMeta}>Komisyon x{item.reward} · Etik {item.ethics}</Text>
              <Text style={styles.tacticHint}>{item.hint}</Text>
            </TouchableOpacity>
          </MotiView>
        ))}
      </View>
    </View>
  );
}

function DealTerm({ label, value, onMinus, onPlus }) {
  return (
    <View style={styles.dealTerm}>
      <TouchableOpacity style={styles.termButton} onPress={onMinus}><Text style={styles.termButtonText}>-</Text></TouchableOpacity>
      <View style={styles.termMain}>
        <Text style={styles.termLabel}>{label}</Text>
        <Text style={styles.termValue}>{value}</Text>
      </View>
      <TouchableOpacity style={styles.termButton} onPress={onPlus}><Text style={styles.termButtonText}>+</Text></TouchableOpacity>
    </View>
  );
}

function Inbox({ career, tr, openCardAgenda, setScreen, setOffer, setSelectedPlayerId }) {
  const cards = [...(career.pendingCards || [])].sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  const offers = career.incomingOffers || [];
  const news = (career.news || []).slice(0, 10);
  const intel = (career.marketIntel || []).slice(0, 4);
  const storyLog = career.story?.log || [];
  const scoutJobs = career.scoutJobs || [];
  const represented = getRepresentedPlayers(career);
  const pressure = Math.min(99, Math.round((cards.length * 12) + (offers.length * 9) + Math.max(0, 42 - (career.reputation || 0)) / 2));
  const nextCard = cards[0];
  const nextOffer = offers[0];
  const openCards = () => {
    if (cards.length) openCardAgenda(cards.slice(0, 3));
  };
  return (
    <View>
      <SectionTitle text={tr("inbox")} />
      <LinearGradient colors={["#101827", "#10251b", "#272012"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.inboxHero}>
        <View style={styles.inboxHeroGlow} />
        <AtmosphereDashes count={12} tone="blue" />
        <PremiumSheen delay={120} color="rgba(125,211,252,0.20)" />
        <Text style={styles.inboxKicker}>{career.seasonMonth || "Haziran"} · Hafta {career.week}</Text>
        <RevealWords text="Ajans Masası" style={styles.inboxTitleWrap} textStyle={styles.inboxTitle} />
        <Text style={styles.inboxCopy}>Kararlar, haberler, scout dönüşleri ve kulüp teklifleri aynı yerde. Haftayı ilerletmeden önce burayı temizlemek saygınlığı korur.</Text>
        <View style={styles.inboxStatRow}>
          <InboxStat label="Kart" value={cards.length} tone={cards.length ? "gold" : "calm"} />
          <InboxStat label="Teklif" value={offers.length} tone={offers.length ? "green" : "calm"} />
          <InboxStat label="Baskı" value={`${pressure}%`} tone={pressure >= 50 ? "red" : "calm"} />
        </View>
      </LinearGradient>

      <View style={styles.inboxCommandGrid}>
        <TouchableOpacity style={[styles.inboxCommand, cards.length && styles.inboxCommandHot]} onPress={openCards} disabled={!cards.length}>
          <Text style={styles.inboxCommandLabel}>Karar Odası</Text>
          <Text style={styles.inboxCommandTitle}>{nextCard ? nextCard.title : "Masada kart yok"}</Text>
          <Text style={styles.inboxCommandMeta}>{nextCard ? `${cardSourceLabel(nextCard.source)} · ${cardSeverityLabel(nextCard.severity)} · W${nextCard.expiresWeek || career.week}` : "Hafta ilerleyince yeni olaylar gelebilir."}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.inboxCommand, offers.length && styles.inboxCommandOffer]} onPress={() => setScreen("players")}>
          <Text style={styles.inboxCommandLabel}>Transfer Masası</Text>
          <Text style={styles.inboxCommandTitle}>{nextOffer ? offerInboxTitle(career, nextOffer) : "Ciddi teklif yok"}</Text>
          <Text style={styles.inboxCommandMeta}>{nextOffer ? `Komisyon ${formatMoney(nextOffer.commission)} · şans ${nextOffer.chance}%` : "Oyuncu formu, piyasa ısısı ve rep teklif üretir."}</Text>
        </TouchableOpacity>
      </View>

      {offers.length > 0 && (
        <View style={styles.offerLedger}>
          <View style={styles.offerLedgerTop}>
            <Text style={styles.offerLedgerTitle}>Transfer Teklifleri</Text>
            <Text style={styles.offerLedgerBadge}>{offers.length}</Text>
          </View>
          <View style={styles.offerLedgerHead}>
            <Text style={styles.offerColPlayer}>Oyuncu</Text>
            <Text style={styles.offerColClub}>Kulüp</Text>
            <Text style={styles.offerColMoney}>Kom.</Text>
            <Text style={styles.offerColChance}>%</Text>
          </View>
          {offers.map((item) => {
            const itemPlayer = career.db.players.find((entry) => entry.id === item.playerId);
            const itemClub = career.db.clubs.find((entry) => entry.id === item.clubId);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.offerLedgerRow}
                onPress={() => {
                  setSelectedPlayerId?.(item.playerId);
                  setOffer?.(item);
                  setScreen("negotiate");
                }}
              >
                <View style={styles.offerColPlayer}>
                  <Text style={styles.offerPlayerName} numberOfLines={1}>{itemPlayer?.name || item.playerId}</Text>
                  <Text style={styles.offerPlayerMeta} numberOfLines={1}>{itemPlayer?.position || "-"} · değer {formatMoney(itemPlayer?.value || item.fee)}</Text>
                </View>
                <View style={styles.offerColClub}>
                  <Text style={styles.offerClubName} numberOfLines={1}>{itemClub?.name || item.clubId}</Text>
                  <Text style={styles.offerPlayerMeta} numberOfLines={1}>maaş {formatMoney(item.wage)} · {item.contractYears || 3} yıl</Text>
                </View>
                <Text style={styles.offerColMoney}>{formatMoney(item.commission)}</Text>
                <Text style={[styles.offerColChance, item.chance >= 60 && styles.offerChanceHot]}>{item.chance}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.inboxSectionHeader}>
        <Text style={styles.inboxSectionTitle}>Canlı Akış</Text>
        <Text style={styles.inboxSectionBadge}>{news.length + intel.length}</Text>
      </View>
      <View style={styles.inboxFeedPanel}>
        {[...intel, ...news].slice(0, 12).map((line, index) => (
          <MotiView
            key={`${line}-${index}`}
            from={{ opacity: 0, translateX: -8 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: "timing", duration: 240, delay: index * 25 }}
            style={styles.inboxFeedLine}
          >
            <View style={[styles.inboxFeedDot, index < intel.length && styles.inboxFeedDotIntel]} />
            <Text style={styles.inboxFeedText}>{displayLine(tr, line)}</Text>
          </MotiView>
        ))}
        {!news.length && !intel.length && (
          <Text style={styles.inboxEmpty}>Henüz haber yok. Scout gönder veya haftayı ilerlet.</Text>
        )}
      </View>

      <View style={styles.inboxSectionHeader}>
        <Text style={styles.inboxSectionTitle}>Operasyon</Text>
        <Text style={styles.inboxSectionBadge}>{represented.length}/{getAgencyCapacity(career)}</Text>
      </View>
      <View style={styles.inboxOpsGrid}>
        <TouchableOpacity style={styles.inboxOpsCard} onPress={() => setScreen("scout")}>
          <Text style={styles.inboxOpsValue}>{scoutJobs.length}</Text>
          <Text style={styles.inboxOpsLabel}>Aktif scout</Text>
          <Text style={styles.inboxOpsCopy}>{scoutJobs[0] ? `${String(scoutJobs[0].countryId || "int").toUpperCase()} · W${scoutJobs[0].dueWeek}` : "Yeni yetenek havuzu aç"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.inboxOpsCard} onPress={() => setScreen("players")}>
          <Text style={styles.inboxOpsValue}>{represented.length}</Text>
          <Text style={styles.inboxOpsLabel}>Portföy</Text>
          <Text style={styles.inboxOpsCopy}>{represented[0] ? `${represented[0].name} · güven ${represented[0].agencyTrust ?? 55}` : "Önce yetenekle anlaş"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.inboxOpsCard} onPress={() => setScreen("empire")}>
          <Text style={styles.inboxOpsValue}>{career.ethics ?? 72}</Text>
          <Text style={styles.inboxOpsLabel}>Etik</Text>
          <Text style={styles.inboxOpsCopy}>Karanlık hamleler kısa para, uzun risk getirir.</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inboxSectionHeader}>
        <Text style={styles.inboxSectionTitle}>Hikaye Kayıtları</Text>
        <Text style={styles.inboxSectionBadge}>{storyLog.length}</Text>
      </View>
      {storyLog.slice(0, 5).map((entry, index) => (
        <View key={`${entry.week}-${entry.title}-${index}`} style={styles.inboxStoryCard}>
          <Text style={styles.inboxStoryWeek}>W{entry.week}</Text>
          <View style={styles.listMain}>
            <Text style={styles.inboxStoryTitle}>{entry.title}</Text>
            <Text style={styles.inboxStoryBody}>{entry.body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function InboxStat({ label, value, tone }) {
  return (
    <View style={[styles.inboxStat, tone === "gold" && styles.inboxStatGold, tone === "green" && styles.inboxStatGreen, tone === "red" && styles.inboxStatRed]}>
      <Text style={styles.inboxStatValue}>{value}</Text>
      <Text style={styles.inboxStatLabel}>{label}</Text>
    </View>
  );
}

function offerInboxTitle(career, offer) {
  const player = career.db.players.find((item) => item.id === offer.playerId);
  const club = career.db.clubs.find((item) => item.id === offer.clubId);
  return `${player?.name || "Oyuncu"} › ${club?.name || "Kulüp"}`;
}

function Settings({ career, tr, setCareer, importDataPack }) {
  const readiness = buildProfessionalReadinessReport(career, { saveSchemaVersion: SAVE_SCHEMA_VERSION });
  return (
    <View>
      <SectionTitle text={tr("settings")} />
      <Row left={tr("language")} right={career.lang.toUpperCase()} />
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.primaryMini} onPress={() => setCareer({ ...career, lang: "tr" })}><Text style={styles.actionText}>TR</Text></TouchableOpacity>
        <TouchableOpacity style={styles.primaryMini} onPress={() => setCareer({ ...career, lang: "en" })}><Text style={styles.actionText}>EN</Text></TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.nextButton} onPress={importDataPack}>
        <Text style={styles.nextButtonText}>{tr("importPack")}</Text>
      </TouchableOpacity>
      <View style={styles.dataPackHelp}>
        <Text style={styles.dataPackTitle}>Fan Data Pack</Text>
        <Text style={styles.dataPackText}>Zip içinde `manifest.json` ve `database.json` olmalı. Gerçek kulüp, logo veya oyuncu verisi repo içine gömülmez; isteyen kullanıcı kendi paketini yükler.</Text>
        <Text style={styles.dataPackCode}>database: countries[], leagues[], clubs[], players[]</Text>
      </View>
      <View style={styles.dataPackHelp}>
        <Text style={styles.dataPackTitle}>Kaynak Defteri</Text>
        {(career.db.meta?.dataSources || []).length ? (career.db.meta.dataSources || []).map((source) => (
          <Text key={`${source.name}-${source.license}`} style={styles.dataPackText}>{source.name} · {source.license}</Text>
        )) : (
          <Text style={styles.dataPackText}>Varsayılan kurgu veri. Fan pack yüklenirse izinli kaynaklar burada görünür.</Text>
        )}
        {(career.db.meta?.blockedSources || []).map((source) => (
          <Text key={`${source.name}-blocked`} style={styles.dataPackCode}>Bloklandı: {source.name} · {source.license}</Text>
        ))}
        {(career.db.meta?.importWarnings || []).map((warning) => (
          <Text key={warning} style={styles.dataPackCode}>Uyarı: {warning}</Text>
        ))}
      </View>
      <View style={styles.dataPackHelp}>
        <Text style={styles.dataPackTitle}>Kimlik Register</Text>
        <Text style={styles.dataPackText}>Şema: {career.db.identityIndex?.schema || career.db.meta?.identitySchema || "local"}</Text>
        <Text style={styles.dataPackText}>Reep ID: {Object.keys(career.db.identityIndex?.byReepId || {}).length} · Provider eşleşmesi: {Object.keys(career.db.identityIndex?.byProvider || {}).length}</Text>
        <Text style={styles.dataPackCode}>Örnek: reep_p / reep_t / reep_l ana kimlik, provider key yan bilgi.</Text>
      </View>
      <View style={styles.dataPackHelp}>
        <Text style={styles.dataPackTitle}>Açık Kaynak Esin Defteri</Text>
        <Text style={styles.dataPackText}>Bu bölüm kod veya lisanslı veri gömmez; sadece güvenli tasarım referanslarını ve oyuna nasıl çevrildiğini gösterir.</Text>
        {repoInfluences.slice(0, 6).map((source) => (
          <Text key={source.id} style={styles.dataPackCode}>{source.name}: {source.role}</Text>
        ))}
      </View>
      <ProfessionalReadinessPanel report={readiness} />
      <TouchableOpacity style={styles.dangerButton} onPress={() => AsyncStorage.removeItem(SAVE_KEY).then(() => setCareer(null))}>
        <Text style={styles.actionText}>{tr("resetCareer")}</Text>
      </TouchableOpacity>
    </View>
  );
}

function ProfessionalReadinessPanel({ report }) {
  return (
    <View style={styles.dataPackHelp}>
      <View style={styles.readinessHeader}>
        <View>
          <Text style={styles.dataPackTitle}>Profesyonel Hazırlık</Text>
          <Text style={styles.dataPackText}>Save, ekonomi, reklam, data pack, privacy ve release sınırları.</Text>
        </View>
        <Text style={[styles.readinessScore, report.score >= 80 ? styles.readinessScoreGood : styles.readinessScoreWarn]}>{report.score}%</Text>
      </View>
      <View style={styles.readinessGrid}>
        {report.checks.map((check) => (
          <View key={check.id} style={[styles.readinessCheck, check.ok ? styles.readinessCheckOk : styles.readinessCheckWarn]}>
            <Text style={styles.readinessCheckMark}>{check.ok ? "OK" : "!"}</Text>
            <Text style={styles.readinessCheckText}>{check.label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.dataPackCode}>Ekonomi: {report.economy.represented} oyuncu · ort. komisyon %{report.economy.averageCommissionRate} · {report.economy.pendingCards} kart</Text>
      <Text style={styles.dataPackCode}>Monetization: {report.monetization.products} güvenli ürün · pay-to-win {report.monetization.payToWinProducts}</Text>
      <Text style={styles.dataPackCode}>Data pack: {report.dataPack.corePack} · kaynak {report.dataPack.sourceCount} · blok {report.dataPack.blockedCount}</Text>
      {report.releaseRisks.slice(0, 3).map((risk) => (
        <Text key={risk} style={styles.readinessRisk}>• {risk}</Text>
      ))}
    </View>
  );
}

function SeasonAgendaPanel({ career }) {
  const agenda = buildSeasonAgenda(career);
  if (!agenda.length) return null;
  return (
    <View style={styles.agendaPanel}>
      <View style={styles.agendaHeader}>
        <Text style={styles.agendaTitle}>Sezon Ajandası</Text>
        <Text style={[styles.agendaState, career.transferSeason ? styles.agendaOpen : styles.agendaClosed]}>
          {career.transferSeason ? "Transfer Açık" : "Transfer Kapalı"}
        </Text>
      </View>
      <View style={styles.agendaTimeline}>
        {agenda.map((item, index) => (
          <View key={`${item.type}-${item.dueWeek}-${index}`} style={styles.agendaItem}>
            <View style={[styles.agendaDot, agendaDotStyle(item.type)]} />
            <View style={styles.listMain}>
              <Text style={styles.agendaItemTitle}>{item.label}</Text>
              <Text style={styles.agendaItemMeta}>{item.weeksLeft === 0 ? "Bu hafta" : `${item.weeksLeft} hafta sonra`} · W{item.dueWeek}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function agendaDotStyle(type) {
  if (type === "market-open") return { backgroundColor: "#22c55e" };
  if (type === "market-closed") return { backgroundColor: "#64748b" };
  if (type === "contract") return { backgroundColor: "#f97316" };
  if (type === "card") return { backgroundColor: "#a855f7" };
  if (type === "scout") return { backgroundColor: "#38bdf8" };
  return { backgroundColor: "#fbbf24" };
}

function ObjectivesPanel({ career }) {
  const objectives = career.objectives || [];
  const active = objectives.filter((item) => !item.completed).slice(0, 3);
  const completed = objectives.filter((item) => item.completed).length;
  if (!objectives.length) return null;
  return (
    <View style={styles.objectivePanel}>
      <View style={styles.objectiveHeader}>
        <View>
          <Text style={styles.objectiveTitle}>Ajans Hedefleri</Text>
          <Text style={styles.objectiveHint}>{completed}/{objectives.length} tamamlandı</Text>
        </View>
        <Text style={styles.objectiveBadge}>Hafta {career.week}</Text>
      </View>
      {active.length === 0 ? (
        <Text style={styles.objectiveEmpty}>İlk hedef serisi tamam. Yeni ajans aşaması için zemin hazır.</Text>
      ) : active.map((objective) => {
        const progress = Math.min(100, Math.round(((objective.progress || 0) / Math.max(1, objective.target || 1)) * 100));
        return (
          <View key={objective.id} style={styles.objectiveItem}>
            <View style={styles.objectiveItemTop}>
              <Text style={styles.objectiveName}>{objective.title}</Text>
              <Text style={styles.objectivePercent}>{progress}%</Text>
            </View>
            <Text style={styles.objectiveCopy}>{objective.description}</Text>
            <View style={styles.objectiveTrack}>
              <View style={[styles.objectiveFill, { width: `${Math.max(4, progress)}%` }]} />
            </View>
            <Text style={styles.objectiveReward}>Ödül: {rewardSummary(objective.reward)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function rewardSummary(reward = {}) {
  const parts = [];
  if (reward.money) parts.push(formatMoney(reward.money));
  if (reward.reputation) parts.push(`Rep +${reward.reputation}`);
  if (reward.negotiation) parts.push(`Paz. +${reward.negotiation}`);
  if (reward.scoutBoost) parts.push(`Scout +${reward.scoutBoost}`);
  if (reward.mediaPower) parts.push(`Medya +${reward.mediaPower}`);
  return parts.join(" · ") || "Prestij";
}

function IntelligencePanel({ career, updateCareer }) {
  const offers = career.incomingOffers || [];
  const intel = career.marketIntel || [];
  const rivals = career.rivalPressure || [];
  const rankings = buildAgencyRankings(career).slice(0, 4);
  const opportunities = career.db.players
    .filter((player) => !player.represented)
    .sort((a, b) => (b.potential + b.form / 2) - (a.potential + a.form / 2))
    .slice(0, 3);
  return (
    <View style={styles.intelPanel}>
      <View style={styles.intelHeader}>
        <Text style={styles.intelTitle}>Piyasa Masası</Text>
        <Text style={styles.intelBadge}>{offers.length} teklif</Text>
      </View>
      {offers.length === 0 ? (
        <Text style={styles.intelEmpty}>Henüz ciddi teklif yok. Daha uygun oyuncu bul veya saygınlığını yükselt.</Text>
      ) : (
        offers.slice(0, 3).map((offer) => {
          const player = career.db.players.find((item) => item.id === offer.playerId);
          const club = career.db.clubs.find((item) => item.id === offer.clubId);
          return (
            <View key={offer.id} style={styles.offerCard}>
              <PlayerPortrait player={player} size={44} />
              <View style={styles.listMain}>
                <Text style={styles.cardTitle}>{player?.name} › {club?.name}</Text>
                <Text style={styles.muted}>Uyum {offer.fitScore}/100 · İhtiyaç {offer.urgency === "high" ? "yüksek" : "normal"} · W{offer.expiresWeek} son</Text>
                <Text style={styles.valueText}>{formatMoney(offer.fee)} · Komisyon {formatMoney(offer.commission)}</Text>
              </View>
              <TouchableOpacity style={styles.smallButton} onPress={() => updateCareer(acceptIncomingOffer(career, offer.id).career)}>
                <Text style={styles.smallButtonText}>Görüş</Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}
      {intel.slice(0, 3).map((line, index) => (
        <Text key={`${line}-${index}`} style={styles.intelLine}>{displayLine(null, line)}</Text>
      ))}
      <View style={styles.opportunityBox}>
        <Text style={styles.opportunityTitle}>Fırsat Radarı</Text>
        {opportunities.map((player) => {
          const club = career.db.clubs.find((item) => item.id === player.clubId);
          return (
            <View key={player.id} style={styles.opportunityRow}>
              <Text style={styles.opportunityName}>{player.name}</Text>
              <Text style={styles.opportunityMeta}>{player.position} · {club?.name || "Serbest"} · Pot {playerPotentialLabel(player)}</Text>
            </View>
          );
        })}
      </View>
      {rivals.slice(0, 2).map((rival) => {
        const target = career.db.players.find((player) => player.id === rival.playerId);
        return (
          <View key={`${rival.rivalName}-${rival.playerId}`} style={styles.rivalLine}>
            <Text style={styles.rivalTitle}>{rival.rivalName}</Text>
            <Text style={styles.rivalText}>{target?.name || "Yetenek"} için baskı {rival.heat}/100 · {rival.style || "temas"}</Text>
          </View>
        );
      })}
      <View style={styles.rankingBox}>
        <Text style={styles.rankingTitle}>Ajan Piyasası</Text>
        {rankings.map((agency, index) => (
          <View key={agency.id} style={[styles.rankingRow, agency.isUser && styles.rankingRowUser]}>
            <Text style={styles.rankingName}>{index + 1}. {agency.name}</Text>
            <Text style={styles.rankingScore}>{agency.score}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function displayLine(tr, line) {
  const translated = tr ? tr(line) : line;
  const replacements = [
    ["New clubs have made concrete approaches.", "Yeni kulüpler masaya ciddi teklifler getirdi."],
    ["incoming approaches reached your desk.", "kulüp ciddi görüşme için masaya geldi."],
    ["incoming approach reached your desk.", "kulüp ciddi görüşme için masaya geldi."],
    ["is your hottest client by form and potential.", "form ve potansiyel olarak en dikkat çeken oyuncun."],
    ["market is active: multiple clubs list it as a priority.", "pazarı hareketli: birden fazla kulüp bu mevkiyi öncelik yapıyor."],
    ["No concrete approach this week; improve reputation or scout fit.", "Bu hafta ciddi teklif yok; saygınlık veya oyuncu-kulüp uyumunu artır."]
  ];
  return replacements.reduce((text, [from, to]) => text.replace(from, to), translated);
}

function MatchCenter({ simState, career }) {
  const featured = simState.preview.featured;
  const shownEvents = simState.preview.events.slice(0, simState.shown);
  if (!featured) return null;
  const home = career.db.clubs.find((club) => club.id === featured.homeId);
  const away = career.db.clubs.find((club) => club.id === featured.awayId);
  const latest = shownEvents[shownEvents.length - 1];
  const liveMinute = Math.min(90, simState.minute || 0);
  const liveHomeGoals = shownEvents.filter((event) => event.type === "goal" && event.side === "home").length;
  const liveAwayGoals = shownEvents.filter((event) => event.type === "goal" && event.side === "away").length;
  return (
    <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 360 }} style={styles.matchCenter}>
      <View style={styles.magicTopGlow} />
      <AtmosphereDashes count={10} tone="blue" />
      <ClientMatchWatch simState={simState} career={career} featured={featured} />
      <InteractivePitch featured={featured} latest={latest} home={home} away={away} />
      <View style={styles.feedBox}>
        {shownEvents.length === 0 && (
          <View style={styles.feedLine}>
            <Text style={styles.feedMinute}>{liveMinute}'</Text>
            <Text style={styles.feedText}>{simState.running ? "Maç başladı, iki taraf da tempoyu tartıyor." : "Maç planı hazır. Başlatınca süre akacak, devrede duracak."}</Text>
          </View>
        )}
        {shownEvents.slice(-5).map((event, index) => (
          <MotiView key={`${event.minute}-${event.type}-${index}`} from={{ opacity: 0, translateX: 18 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: "timing", duration: 220, delay: index * 25 }} style={[styles.feedLine, event.type === "goal" && styles.goalLine]}>
            <Text style={styles.feedMinute}>{event.minute}'</Text>
            <View style={styles.listMain}>
              <Text style={styles.feedText}>{event.text}</Text>
              {event.agentDecision?.actionTick && <Text style={styles.feedActionText}>{event.agentDecision.actionTick.label} · {event.tickFrames?.length || 0} tick · {event.agentDecision.actionTick.stepMs}ms</Text>}
            </View>
          </MotiView>
        ))}
      </View>
    </MotiView>
  );
}

function ClientMatchWatch({ simState, career, featured }) {
  const allClients = getRepresentedPlayers(career)
    .filter((player) => player.clubId === featured.homeId || player.clubId === featured.awayId);
  const portfolioFallback = (featured.watchPortfolioIds || [])
    .map((id) => getRepresentedPlayers(career).find((player) => player.id === id))
    .filter(Boolean);
  if (!allClients.length && !portfolioFallback.length) return null;
  const showingFallback = allClients.length === 0;
  const watchIds = featured.watchClientIds?.length ? featured.watchClientIds : allClients.slice(0, 3).map((player) => player.id);
  const clients = (showingFallback ? (featured.watchPortfolioIds || []) : watchIds)
    .map((id) => (showingFallback ? portfolioFallback : allClients).find((player) => player.id === id))
    .filter(Boolean);
  const queuedClients = (showingFallback ? getRepresentedPlayers(career) : allClients)
    .filter((player) => !(showingFallback ? featured.watchPortfolioIds || [] : watchIds).includes(player.id))
    .slice(0, 4);
  const shownEvents = simState.preview.events.slice(0, simState.shown);
  return (
    <View style={styles.clientWatchBox}>
      <View style={styles.clientWatchHeader}>
        <Text style={styles.clientWatchTitle}>{showingFallback ? "Portföy Radarı" : "Müşteri Takibi"}</Text>
        <Text style={styles.clientWatchBadge}>{clients.length}/{showingFallback ? featured.watchPortfolioTotal || clients.length : allClients.length}</Text>
      </View>
      <Text style={styles.clientWatchReason}>
        {showingFallback ? "Bu maçta müşterin yok; değer, form, piyasa ısısı ve teklif riskiyle portföyden ilk 3 izleniyor." : featured.watchReason || "Bu maçtaki en kritik müşteriler canlı takipte."}
      </Text>
      {clients.map((player) => {
        const events = showingFallback ? [] : shownEvents.filter((event) => event.playerId === player.id);
        const goals = events.filter((event) => event.type === "goal").length;
        const shots = events.filter((event) => event.type === "shot" || event.type === "goal").length;
        const actions = events.filter((event) => ["goal", "shot", "attack", "pressure"].includes(event.type)).length;
        const lastDecision = events.at(-1)?.agentDecision;
        return (
          <View key={player.id} style={styles.clientWatchRow}>
            <PlayerPortrait player={player} size={44} />
            <View style={styles.listMain}>
              <Text style={styles.clientWatchName}>{player.name}</Text>
              <Text style={styles.clientWatchMeta}>
                {showingFallback ? `Hafta vitrini · Form ${player.form || 0} · Değer ${formatMoney(player.value || 0)} · Piyasa ${player.marketHeat || 0}/100` : `Gol ${goals} · Şut ${shots} · Aksiyon ${actions} · Piyasa ${player.marketHeat || 0}/100`}
              </Text>
              {lastDecision && <Text style={styles.clientWatchMeta}>Son karar: {lastDecision.label} · {lastDecision.actionTick?.label || lastDecision.grfAction} · güven {lastDecision.confidence} · risk {lastDecision.risk}</Text>}
            </View>
          </View>
        );
      })}
      {queuedClients.length > 0 && (
        <Text style={styles.clientWatchQueue} numberOfLines={2}>
          İzleme sırası: {queuedClients.map((player) => player.name).join(", ")}
        </Text>
      )}
    </View>
  );
}

function MatchMomentum({ featured, latest }) {
  const homePressure = featured.homePressure || 50;
  const awayPressure = featured.awayPressure || 100 - homePressure;
  const phase = latest?.agentDecision?.label || (latest?.type === "goal" ? "Gol" : latest?.type === "shot" ? "Şut" : latest?.type === "attack" ? "Atak" : "Tempo");
  const side = latest?.side === "away" ? featured.awayName : latest?.side === "home" ? featured.homeName : "Orta saha";
  return (
    <View style={styles.momentumBox}>
      <View style={styles.momentumHeader}>
        <Text style={styles.momentumLabel}>{phase}</Text>
        <Text style={styles.momentumSide}>{side}</Text>
      </View>
      <View style={styles.momentumTrack}>
        <View style={[styles.momentumHome, { width: `${homePressure}%` }]} />
        <View style={[styles.momentumAway, { width: `${awayPressure}%` }]} />
      </View>
      <View style={styles.momentumNumbers}>
        <Text style={styles.momentumNumber}>{homePressure}% baskı</Text>
        <Text style={styles.momentumNumber}>{awayPressure}% baskı</Text>
      </View>
    </View>
  );
}

function InteractivePitch({ featured, latest, home, away }) {
  const event = latest || { side: "neutral", type: "kickoff", lane: "center", threat: 0, x: 50, y: 50 };
  const path = event.path || [{ x: event.side === "away" ? 100 - event.x : event.x, y: event.y || 50 }];
  const firstPoint = path[0] || { x: 50, y: 50 };
  const ballPoint = path[path.length - 1] || { x: 50, y: 50 };
  const pathPoints = path.map((point) => `${point.x},${point.y}`).join(" ");
  const eventSide = event.side === "home" ? featured.homeName : event.side === "away" ? featured.awayName : "Orta saha";
  const zoneCopy = `${eventSide} ${event.type === "goal" ? "gol pozisyonunu bitirdi" : event.type === "shot" ? "şut tehdidi yarattı" : event.type === "attack" ? "atak hazırlıyor" : "oyun ritmini kuruyor"}.`;
  const decisionCopy = event.agentDecision?.label ? ` Karar: ${event.agentDecision.label} (${event.agentDecision.confidence}). ${event.agentDecision.actionTick?.label || ""}.` : "";
  const homeDots = featured.model2d?.homePlayers || buildDots("home");
  const awayDots = featured.model2d?.awayPlayers || buildDots("away");
  return (
    <View style={styles.livePitchWrap}>
      <View style={styles.pitchScoreStrip}>
        <Text style={styles.pitchStripText}>{home?.name || featured.homeName}</Text>
        <Text style={styles.pitchStripCenter}>{featured.model2d?.modelLabel || "Canlı saha"}</Text>
        <Text style={styles.pitchStripTextRight}>{away?.name || featured.awayName}</Text>
      </View>
      <View style={styles.livePitch}>
        <View style={styles.pitchAmbientGlow} />
        {Array.from({ length: 8 }).map((_, index) => (
          <View key={`stripe-${index}`} style={[styles.pitchStripe, { left: `${index * 12.5}%` }]} />
        ))}
        {Array.from({ length: 5 }).map((_, index) => (
          <View key={`pitch-line-${index}`} style={[styles.pitchHorizontalLine, { top: `${18 + index * 16}%` }]} />
        ))}
        <View style={styles.liveHalfLine} />
        <View style={styles.liveCircle} />
        <View style={styles.liveBoxLeft} />
        <View style={styles.liveBoxRight} />
        <MotiView
          key={`zone-${event.minute}-${event.type}-${event.side}`}
          from={{ opacity: 0.12, scale: 0.72 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 520 }}
          style={[styles.zoneGlow, zoneStyle(event.lane, event.side, event.threat)]}
        />
        <Svg viewBox="0 0 100 100" preserveAspectRatio="none" style={styles.pathSvg}>
          <Polyline points={pathPoints} fill="none" stroke={event.type === "goal" ? "#fbbf24" : "#e0f2fe"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.82" />
          {path.slice(0, -1).map((point, index) => <Circle key={`path-${index}`} cx={point.x} cy={point.y} r="1.3" fill="#e0f2fe" opacity="0.72" />)}
        </Svg>
        {homeDots.map((dot) => <View key={dot.id} style={[styles.playerDot, styles.homeDot, { left: `${dot.x}%`, top: `${dot.y}%` }]} />)}
        {awayDots.map((dot) => <View key={dot.id} style={[styles.playerDot, styles.awayDot, { left: `${dot.x}%`, top: `${dot.y}%` }]} />)}
        <MotiView
          key={`ball-${event.minute}-${event.type}-${event.side}`}
          from={{ left: `${firstPoint.x}%`, top: `${firstPoint.y}%`, scale: 0.78 }}
          animate={{ left: `${ballPoint.x}%`, top: `${ballPoint.y}%`, scale: event.type === "goal" ? 1.28 : 1 }}
          transition={{ type: "timing", duration: event.type === "goal" ? 720 : 560 }}
          style={[styles.ball, event.type === "goal" && styles.goalBall]}
        />
        <MotiView from={{ opacity: 0.65, scale: 0.94 }} animate={{ opacity: 1, scale: 1.08 }} transition={{ type: "timing", duration: 650, loop: true }} style={[styles.attackArrow, event.side === "away" && styles.attackArrowAway]}>
          <Text style={styles.attackArrowText}>{event.side === "away" ? "<" : ">"}</Text>
        </MotiView>
      </View>
      <View style={styles.pitchInfoRow}>
        <Text style={styles.pitchInfo}>{zoneCopy} {event.phase ? `Faz: ${event.phase}.` : ""}{decisionCopy}</Text>
        <Text style={styles.pitchInfoStrong}>Pres {event.pressIntensity || event.threat || 0}</Text>
      </View>
    </View>
  );
}

function MatchScoreboard({ featured, home, away, liveHomeGoals, liveAwayGoals, liveMinute, latest, week }) {
  const phase = liveMinute >= 90 ? "FT" : liveMinute > 45 ? "2Y" : "1Y";
  const eventTone = liveMinute >= 90 ? "Bitti" : latest?.type === "goal" ? "Gol" : latest?.type === "shot" ? "Şut" : latest?.type === "attack" ? "Atak" : "Canlı";
  const fixtureLabel = featured.sourceFixture?.round ? `${featured.sourceFixture.round}${featured.sourceFixture.historicalScore ? ` · geçmiş ${featured.sourceFixture.historicalScore}` : ""}` : `Hafta ${week}`;
  return (
    <LinearGradient colors={["rgba(15,23,42,0.98)", "rgba(8,19,31,0.96)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.scoreboardCard}>
      <View style={styles.scoreboardGrid} />
      <PremiumSheen delay={250} color="rgba(134,239,172,0.18)" />
      <View style={styles.scoreboardHeader}>
        <Text style={styles.scoreboardLeague}>{fixtureLabel}</Text>
        <Text style={styles.scoreboardStatus}>{phase} · {eventTone}</Text>
      </View>
      <View style={styles.scoreboardMain}>
        <View style={styles.scoreboardTeam}>
          <ClubCrest club={home} size={46} />
          <Text style={styles.scoreboardTeamName} numberOfLines={2}>{featured.homeName}</Text>
          <MatchStatPill label="Güç" value={featured.homePower} tone="home" />
        </View>
        <View style={styles.scoreboardScoreShell}>
          <View style={styles.scoreboardMinute}>
            <Text style={styles.scoreboardMinuteText}>{liveMinute}'</Text>
          </View>
          <Text style={styles.scoreboardScore}>{liveHomeGoals}</Text>
          <Text style={styles.scoreboardDash}>-</Text>
          <Text style={styles.scoreboardScore}>{liveAwayGoals}</Text>
        </View>
        <View style={styles.scoreboardTeamRight}>
          <ClubCrest club={away} size={46} />
          <Text style={styles.scoreboardTeamNameRight} numberOfLines={2}>{featured.awayName}</Text>
          <MatchStatPill label="Güç" value={featured.awayPower} tone="away" />
        </View>
      </View>
      <View style={styles.scoreboardStats}>
        <MatchStatPill label="Top" value={`${featured.possessionHome}%`} tone="home" />
        <MatchStatPill label="xG" value={`${featured.homeXg}-${featured.awayXg}`} tone="gold" />
        <MatchStatPill label="Şut" value={`${featured.homeShots}-${featured.awayShots}`} tone="away" />
      </View>
    </LinearGradient>
  );
}

function MatchStatPill({ label, value, tone = "gold" }) {
  return (
    <View style={[styles.matchStatPill, styles[`matchStatPill_${tone}`]]}>
      <Text style={styles.matchStatLabel}>{label}</Text>
      <Text style={styles.matchStatValue}>{value}</Text>
    </View>
  );
}

function AgencyPulse({ career, myPlayers, setScreen }) {
  const portfolioValue = myPlayers.reduce((sum, player) => sum + (player.value || 0), 0);
  const avgMorale = myPlayers.length
    ? Math.round(myPlayers.reduce((sum, player) => sum + (player.happiness ?? player.morale ?? 50), 0) / myPlayers.length)
    : 0;
  const bestClub = [...career.db.clubs].sort((a, b) => (b.relation || 0) - (a.relation || 0))[0];
  const rivalHeat = Math.max(0, ...(career.rivalPressure || []).map((item) => item.heat || 0));
  const spotlight = [...myPlayers].sort((a, b) => (b.goalProgress || 0) - (a.goalProgress || 0))[0];
  const pulse = [
    { label: "Portföy", value: formatMoney(portfolioValue), target: "players" },
    { label: "Moral", value: myPlayers.length ? `${avgMorale}%` : "-", target: "life" },
    { label: "İlişki", value: bestClub ? `${bestClub.relation}` : "-", target: "clubs" },
    { label: "Rakip", value: rivalHeat ? `${rivalHeat}` : "Düşük", target: "dashboard" }
  ];
  return (
    <View style={styles.pulsePanel}>
      <View style={styles.pulseHeader}>
        <Text style={styles.pulseTitle}>Ajans Nabzı</Text>
        <Text style={styles.pulseHint}>Saygınlık {career.reputation}</Text>
      </View>
      <View style={styles.pulseGrid}>
        {pulse.map((item) => (
          <TouchableOpacity key={item.label} style={styles.pulseCell} onPress={() => setScreen(item.target)}>
            <Text style={styles.pulseValue}>{item.value}</Text>
            <Text style={styles.pulseLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.pulseBarTrack}>
        <View style={[styles.pulseBarFill, { width: `${Math.min(100, career.reputation)}%` }]} />
      </View>
      {spotlight && (
        <TouchableOpacity style={styles.spotlightBox} onPress={() => setScreen("players")}>
          <PlayerPortrait player={spotlight} size={38} />
          <View style={styles.listMain}>
            <Text style={styles.spotlightTitle}>{spotlight.name}</Text>
            <Text style={styles.spotlightText}>{spotlight.careerGoal?.label || "Kariyer hedefi"} · {spotlight.goalProgress ?? 40}%</Text>
          </View>
          <Text style={styles.spotlightArrow}>›</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function buildDots(side) {
  const home = [
    [10, 50], [24, 24], [25, 50], [24, 76], [42, 34], [44, 66], [60, 50]
  ];
  const away = home.map(([x, y]) => [100 - x, y]);
  return (side === "home" ? home : away).map(([x, y], index) => ({ id: `${side}-${index}`, x, y }));
}

function zoneStyle(lane, side, threat) {
  const top = lane === "left" ? "4%" : lane === "right" ? "67%" : "34%";
  const left = side === "away" ? "8%" : "54%";
  const opacity = Math.max(0.18, Math.min(0.62, (threat || 30) / 140));
  return { left, top, opacity };
}

function FieldHero({ career, tr, myPlayers }) {
  return (
    <ImageBackground source={stadiumImage} style={styles.fieldHero} imageStyle={styles.fieldHeroImage}>
      <View style={styles.pitchLine} />
      <View style={styles.centerCircle} />
      <View style={styles.goalBoxLeft} />
      <View style={styles.goalBoxRight} />
      <View style={styles.heroShade} />
      <View style={styles.heroContent}>
        <View>
          <Text style={styles.heroKicker}>{career.db.meta.name}</Text>
          <Text style={styles.heroTitle}>{tr("appName")}</Text>
          <Text style={styles.heroCopyFresh}>
            Saygınlık {career.reputation} · {myPlayers.length} oyuncu · {career.pendingCards.length} bekleyen kart
          </Text>
          <Text style={styles.heroCopy}>
            Rep {career.reputation} · {myPlayers.length} player portfolio · {career.pendingCards.length} cards
          </Text>
        </View>
        <View style={styles.heroCrests}>
          {career.db.clubs.slice(0, 3).map((club) => (
            <ClubCrest key={club.id} club={club} size={42} />
          ))}
        </View>
      </View>
    </ImageBackground>
  );
}

function PlayerPortrait({ player, size = 48 }) {
  const palette = playerPalette(player?.id || player?.name || "player");
  const seed = Math.abs(hashCode(player?.id || player?.name || "player"));
  const image = playerImages[player?.id] || portraitLibrary[seed % portraitLibrary.length];
  const compact = size < 38;
  if (image) {
    return (
      <View style={[styles.portraitImageWrap, { width: size, height: size, borderRadius: Math.round(size * 0.18), borderColor: palette.accent }]}>
        <Image source={image} style={styles.portraitImage} />
        <View style={[styles.portraitImageGlow, { backgroundColor: palette.accent }]} />
        {!compact && <View style={styles.positionChip}>
          <Text style={styles.positionChipText}>{player?.position || "?"}</Text>
        </View>}
      </View>
    );
  }
  const initials = (player?.name || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const hairVariant = seed % 4;
  const faceTilt = (seed % 5) - 2;
  return (
    <View style={[styles.portraitFrame, { width: size, height: size, borderRadius: Math.round(size * 0.18), backgroundColor: palette.bg, borderColor: palette.accent }]}>
      <LinearGradient
        colors={[palette.bg, "#08111d"]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.portraitBackdrop}
      />
      <View style={[styles.portraitLight, { backgroundColor: palette.accent }]} />
      <View style={[styles.portraitShoulders, { width: size * 0.86, height: size * (compact ? 0.3 : 0.34), borderTopLeftRadius: size * 0.22, borderTopRightRadius: size * 0.22, backgroundColor: palette.kit }]}>
        <View style={[styles.portraitKitStripe, { backgroundColor: palette.kit2 }]} />
        <View style={[styles.portraitKitBadge, { backgroundColor: palette.accent }]} />
      </View>
      <View style={[styles.portraitNeck, { width: size * 0.16, height: size * 0.13, backgroundColor: palette.skin }]} />
      <View style={[styles.portraitHead, { top: compact ? "9%" : "18%", width: size * (compact ? 0.54 : 0.38), height: size * (compact ? 0.55 : 0.42), borderRadius: size * (compact ? 0.2 : 0.16), backgroundColor: palette.skin, transform: [{ rotate: `${faceTilt}deg` }] }]}>
        <View style={[styles.portraitHair, hairVariant === 1 && styles.portraitHairShort, hairVariant === 2 && styles.portraitHairSide, hairVariant === 3 && styles.portraitHairCrop, { backgroundColor: palette.hair }]} />
        <View style={styles.portraitEyes}>
          <View style={[styles.portraitEye, { backgroundColor: palette.eye }]} />
          <View style={[styles.portraitEye, { backgroundColor: palette.eye }]} />
        </View>
        <View style={[styles.portraitNose, { backgroundColor: palette.shadow }]} />
      </View>
      {!compact && <View style={[styles.portraitNamePlate, { borderColor: palette.accent }]}>
        <Text style={[styles.portraitInitials, { fontSize: Math.max(8, size * 0.15) }]}>{initials}</Text>
      </View>}
      {!compact && <View style={styles.positionChip}>
        <Text style={styles.positionChipText}>{player?.position || "?"}</Text>
      </View>}
    </View>
  );
}

function ClubCrest({ club, size = 48 }) {
  const seed = Math.abs(hashCode(club?.id || club?.name || "club"));
  const image = clubImages[club?.id] || crestLibrary[seed % crestLibrary.length];
  if (image) {
    return (
      <View style={[styles.crestImageWrap, { width: size, height: size, borderRadius: Math.round(size * 0.22) }]}>
        <Image source={image} style={styles.crestImage} />
      </View>
    );
  }
  const palette = clubPalette(club?.id || "club");
  const initials = (club?.name || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <View style={[styles.crestOuter, { width: size, height: size, borderRadius: Math.round(size * 0.24), backgroundColor: palette.primary }]}>
      <View style={[styles.crestStripe, { backgroundColor: palette.secondary }]} />
      <View style={[styles.crestInner, { borderColor: palette.secondary }]}>
        <Text style={[styles.crestText, { fontSize: Math.max(11, size * 0.24) }]}>{initials}</Text>
      </View>
    </View>
  );
}

function CountryBadge({ countryId }) {
  const labels = { tr: "TR", en: "EN", es: "ES" };
  const palette = countryId === "tr" ? ["#d62828", "#ffffff"] : countryId === "en" ? ["#ffffff", "#c8102e"] : ["#f6c343", "#b7182a"];
  return (
    <View style={[styles.countryBadge, { backgroundColor: palette[0] }]}>
      <Text style={[styles.countryBadgeText, { color: palette[1] }]}>{labels[countryId] || countryId.slice(0, 2).toUpperCase()}</Text>
    </View>
  );
}

function LifeIcon({ activityId }) {
  const map = {
    pr: ["PR", "#d64f78"],
    education: ["IQ", "#2d6cdf"],
    health: ["+", "#20a66a"],
    office: ["HQ", "#8b5cf6"],
    car: ["GT", "#d99b25"],
    players: ["P", "#16a34a"],
    talents: ["T", "#7c3aed"],
    news: ["N", "#0284c7"],
    finance: ["$", "#f59e0b"],
    private: ["H", "#334155"],
    invest: ["I", "#0f766e"],
    "scout-department": ["SC", "#16a34a"],
    "media-office": ["TV", "#2563eb"],
    "youth-network": ["U21", "#7c3aed"],
    "club-shares": ["$", "#f59e0b"],
    "chief-scout": ["CS", "#15803d"],
    lawyer: ["LW", "#475569"],
    "pr-manager": ["PR", "#db2777"],
    boots: ["BT", "#ea580c"],
    stream: ["ST", "#0284c7"],
    airline: ["AR", "#0891b2"]
  };
  const [label, color] = map[activityId] || ["*", "#4b8f58"];
  return (
    <View style={[styles.lifeIcon, { backgroundColor: color }]}>
      <Text style={styles.lifeIconText}>{label}</Text>
    </View>
  );
}

function EventIcon({ source }) {
  const iconMap = {
    media: ["TV", "#1d6ed0"],
    club: ["FC", "#7c3aed"],
    sponsor: ["SP", "#f59e0b"],
    tournament: ["TR", "#16a34a"],
    legend: ["LG", "#9333ea"],
    finance: ["$", "#0891b2"],
    talk: ["TL", "#db2777"],
    player: ["PL", "#2f9e44"]
  };
  const config = iconMap[source] || ["PL", "#2f9e44"];
  return (
    <View style={[styles.eventIcon, { backgroundColor: config[1] }]}>
      <Text style={styles.eventIconText}>{config[0]}</Text>
    </View>
  );
}

function playerPalette(id) {
  const palettes = [
    { bg: "#142f4f", skin: "#d8a47f", kit: "#0f8f4f", kit2: "#d9f99d", hair: "#27180f", eye: "#172554", accent: "#7dd3fc", shadow: "#b77955" },
    { bg: "#3b1728", skin: "#f0c7a7", kit: "#b91c1c", kit2: "#fde68a", hair: "#120b08", eye: "#1f2937", accent: "#fbbf24", shadow: "#d99b76" },
    { bg: "#143526", skin: "#8d5524", kit: "#1d4ed8", kit2: "#eff6ff", hair: "#0b0b0b", eye: "#111827", accent: "#86efac", shadow: "#6f401d" },
    { bg: "#3d3317", skin: "#c68642", kit: "#f08c00", kit2: "#111827", hair: "#3b2414", eye: "#172554", accent: "#fcd34d", shadow: "#9a5f2d" },
    { bg: "#1e1b3f", skin: "#e0ac69", kit: "#6d28d9", kit2: "#f5f3ff", hair: "#1c1917", eye: "#0f172a", accent: "#c4b5fd", shadow: "#b77a3d" },
    { bg: "#102a3a", skin: "#7c4a2d", kit: "#0f766e", kit2: "#ccfbf1", hair: "#21100a", eye: "#111827", accent: "#2dd4bf", shadow: "#59331f" }
  ];
  return palettes[Math.abs(hashCode(id)) % palettes.length];
}

function clubPalette(id) {
  const palettes = [
    { primary: "#c92a2a", secondary: "#ffd43b" },
    { primary: "#1864ab", secondary: "#d0ebff" },
    { primary: "#2b8a3e", secondary: "#b2f2bb" },
    { primary: "#5f3dc4", secondary: "#e5dbff" },
    { primary: "#e67700", secondary: "#fff3bf" }
  ];
  return palettes[Math.abs(hashCode(id)) % palettes.length];
}

function hashCode(value) {
  return String(value).split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

function SectionTitle({ text }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <View style={styles.sectionTitleRail} />
      <Text style={styles.sectionTitle}>{text}</Text>
    </View>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function Panel({ title, value }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelValue}>{value}</Text>
      <Text style={styles.panelTitle}>{title}</Text>
    </View>
  );
}

function Row({ left, right }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLeft}>{left}</Text>
      <Text style={styles.rowRight}>{right}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#05070c" },
  premiumSheen: { position: "absolute", top: -60, bottom: -60, width: 42, zIndex: 1 },
  atmosphereLayer: { ...StyleSheet.absoluteFillObject, zIndex: 1, overflow: "hidden" },
  atmosphereDash: { position: "absolute", height: 1, borderRadius: 4 },
  revealWords: { flexDirection: "row", alignItems: "baseline", width: "100%" },
  revealLine: { width: "100%" },
  edgeLayer: { ...StyleSheet.absoluteFillObject, zIndex: 1, overflow: "hidden", borderRadius: 8 },
  edgeBeam: { position: "absolute", width: 150, height: 2, borderRadius: 8, shadowColor: "#ffffff", shadowOpacity: 0.42, shadowRadius: 9, shadowOffset: { width: 0, height: 0 } },
  edgeBeamTop: { top: 0, left: 0 },
  edgeBeamBottom: { bottom: 0, right: 0 },
  edgeBeamSide: { position: "absolute", width: 2, height: 150, borderRadius: 8, shadowColor: "#ffffff", shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  edgeBeamLeft: { left: 0, top: 0 },
  edgeBeamRight: { right: 0, bottom: 0 },
  equalizer: { height: 26, flexDirection: "row", alignItems: "flex-end", gap: 3 },
  equalizerBar: { width: 4, borderRadius: 8 },
  loading: { color: "#f8fafc", fontSize: 24, fontWeight: "800", margin: 24 },
  menuScroll: { flex: 1, backgroundColor: "#05070c" },
  menuContent: { padding: 12, paddingBottom: 28 },
  menuHero: { minHeight: 360, backgroundColor: "#08131f", borderColor: "rgba(255,255,255,0.16)", borderWidth: 1, borderRadius: 14, padding: 14, overflow: "hidden", position: "relative", shadowColor: "#38bdf8", shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  menuHeroImage: { borderRadius: 18, opacity: 0.9 },
  menuHeroWash: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(2,6,23,0.58)" },
  menuGlow: { position: "absolute", left: -80, top: 20, width: 260, height: 260, borderRadius: 260, backgroundColor: "rgba(56,189,248,0.20)" },
  menuGlowGold: { position: "absolute", right: -70, bottom: -58, width: 240, height: 240, borderRadius: 240, backgroundColor: "rgba(251,191,36,0.22)" },
  menuGrid: { ...StyleSheet.absoluteFillObject, borderWidth: 1, borderColor: "rgba(255,255,255,0.10)" },
  menuTopLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, zIndex: 2 },
  menuKicker: { color: "#86efac", fontSize: 11, fontWeight: "900" },
  menuTopActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  soundToggle: { backgroundColor: "rgba(15,23,42,0.82)", borderColor: "rgba(125,211,252,0.34)", borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  soundToggleText: { color: "#dbeafe", fontSize: 10, fontWeight: "900" },
  menuSaveBadge: { color: "#052e16", backgroundColor: "#86efac", borderRadius: 8, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 4, fontSize: 11, fontWeight: "900" },
  menuHeroBody: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 30, zIndex: 2 },
  menuCopy: { flex: 1, minWidth: 0 },
  startHero: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#111827" },
  brand: { color: "#ffffff", fontSize: 36, lineHeight: 41, fontWeight: "900", letterSpacing: 0, textShadowColor: "rgba(0,0,0,0.52)", textShadowRadius: 8, textShadowOffset: { width: 0, height: 3 } },
  subtitle: { color: "#e0f2fe", fontSize: 13, lineHeight: 19, marginTop: 10, marginBottom: 22, fontWeight: "800" },
  input: { backgroundColor: "rgba(15,23,42,0.86)", color: "#f8fafc", borderColor: "rgba(125,211,252,0.28)", borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 14 },
  primaryButton: { borderRadius: 10, padding: 14, alignItems: "center", justifyContent: "center", minHeight: 50 },
  primaryButtonText: { color: "#111827", fontSize: 15, fontWeight: "900" },
  menuTabs: { flexDirection: "row", gap: 7, marginTop: 18, zIndex: 2 },
  menuTab: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: "rgba(15,23,42,0.72)", borderColor: "rgba(255,255,255,0.16)", borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  menuTabActive: { backgroundColor: "#e0f2fe", borderColor: "#7dd3fc" },
  menuTabText: { color: "#cbd5e1", fontSize: 10, fontWeight: "900", textAlign: "center" },
  menuTabTextActive: { color: "#052e16" },
  menuSignalRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: -14, marginBottom: 14 },
  menuSignalText: { color: "#dbeafe", fontSize: 10, lineHeight: 14, fontWeight: "900", flex: 1 },
  menuPanel: { position: "relative", overflow: "hidden", backgroundColor: "rgba(16,24,39,0.96)", borderColor: "rgba(125,211,252,0.24)", borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 12, shadowColor: "#38bdf8", shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  menuPanelTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900", marginBottom: 10 },
  menuActionGrid: { flexDirection: "row", gap: 8 },
  menuActionButton: { flex: 1 },
  menuDarkButton: { flex: 1, backgroundColor: "rgba(15,23,42,0.86)", borderColor: "rgba(148,163,184,0.35)", borderWidth: 1, borderRadius: 12, padding: 16, alignItems: "center", minHeight: 56, justifyContent: "center" },
  menuDarkButtonText: { color: "#f8fafc", fontSize: 15, fontWeight: "900" },
  menuStatsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  menuStatCard: { flex: 1, backgroundColor: "rgba(2,6,23,0.74)", borderColor: "rgba(251,191,36,0.22)", borderWidth: 1, borderRadius: 12, padding: 12, alignItems: "center" },
  menuStatValue: { color: "#fbbf24", fontSize: 14, fontWeight: "900", textAlign: "center" },
  menuStatLabel: { color: "#94a3b8", fontSize: 10, fontWeight: "900", marginTop: 3 },
  saveCard: { backgroundColor: "#0f172a", borderColor: "rgba(134,239,172,0.22)", borderWidth: 1, borderRadius: 8, padding: 12 },
  saveTitle: { color: "#f8fafc", fontSize: 16, fontWeight: "900" },
  saveText: { color: "#cbd5e1", fontSize: 12, lineHeight: 18, fontWeight: "800", marginTop: 4 },
  menuEmpty: { color: "#cbd5e1", backgroundColor: "#0f172a", borderRadius: 8, padding: 12, fontSize: 12, fontWeight: "800" },
  menuSettingLine: { color: "#dbeafe", backgroundColor: "#0f172a", borderRadius: 8, padding: 10, fontSize: 12, lineHeight: 18, fontWeight: "800", marginBottom: 8 },
  agentCreator: { backgroundColor: "rgba(2,6,23,0.74)", borderColor: "rgba(125,211,252,0.22)", borderWidth: 1, borderRadius: 14, padding: 10, marginBottom: 12, gap: 9 },
  agentCreatorPreview: { flexDirection: "row", alignItems: "center", gap: 10 },
  agentCreatorCopy: { flex: 1, minWidth: 0 },
  agentCreatorTitle: { color: "#f8fafc", fontSize: 14, fontWeight: "900" },
  agentCreatorText: { color: "#cbd5e1", fontSize: 10, lineHeight: 14, fontWeight: "800", marginTop: 4 },
  agentCreatorRows: { gap: 8 },
  agentOptionRow: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 54 },
  agentOptionMain: { flex: 1, minWidth: 0 },
  agentOptionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 4 },
  agentOptionLabel: { color: "#93c5fd", fontSize: 10, fontWeight: "900" },
  agentOptionArrow: { width: 31, height: 46, borderRadius: 8, backgroundColor: "#0f172a", borderWidth: 1, borderColor: "rgba(148,163,184,0.28)", alignItems: "center", justifyContent: "center" },
  agentOptionArrowText: { color: "#f8fafc", fontSize: 21, lineHeight: 23, fontWeight: "900" },
  agentOptionValueText: { color: "#f8fafc", fontSize: 10, fontWeight: "900" },
  agentOptionStrip: { gap: 6, paddingRight: 6 },
  agentOptionChip: { minHeight: 30, borderRadius: 8, backgroundColor: "rgba(15,23,42,0.82)", borderColor: "rgba(148,163,184,0.18)", borderWidth: 1, paddingHorizontal: 7, flexDirection: "row", alignItems: "center", gap: 5 },
  agentOptionChipActive: { backgroundColor: "#e0f2fe", borderColor: "#7dd3fc" },
  agentOptionChipText: { color: "#cbd5e1", fontSize: 9, fontWeight: "900" },
  agentOptionChipTextActive: { color: "#052e16" },
  agentOptionSwatch: { width: 18, height: 18, borderRadius: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.34)" },
  agentAvatarStage: { alignItems: "center", justifyContent: "flex-end", position: "relative" },
  agentAvatarGlow: { position: "absolute", bottom: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" },
  agentAvatarShadow: { position: "absolute", backgroundColor: "rgba(0,0,0,0.34)" },
  agentAvatarBody: { position: "relative" },
  agentAvatarNeck: { position: "absolute", zIndex: 1 },
  agentAvatarJacket: { position: "absolute", borderRadius: 8, borderWidth: 2, overflow: "hidden", zIndex: 2 },
  agentAvatarShirt: { position: "absolute", zIndex: 3 },
  agentAvatarPocket: { position: "absolute", zIndex: 4, borderRadius: 2 },
  agentAvatarHead: { position: "absolute", overflow: "hidden", zIndex: 5, borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" },
  agentAvatarFaceShade: { position: "absolute", left: 0, right: 0, bottom: 0, height: "28%", opacity: 0.42 },
  agentAvatarEye: { position: "absolute", backgroundColor: "#020617", borderRadius: 2 },
  agentAvatarNose: { position: "absolute", opacity: 0.58, borderRadius: 3 },
  agentAvatarMouth: { position: "absolute", backgroundColor: "#7f1d1d", borderRadius: 2 },
  agentHairBlock: { position: "absolute", zIndex: 8 },
  agentAvatarLegs: { position: "absolute", backgroundColor: "#0f172a", borderRadius: 4, zIndex: 1 },
  agentAvatarBall: { position: "absolute", backgroundColor: "#f8fafc", borderWidth: 2, borderColor: "#111827" },
  agentAvatarBallPatch: { position: "absolute", backgroundColor: "#111827" },
  pixelStage: { width: 118, height: 176, alignItems: "center", justifyContent: "flex-end", position: "relative" },
  pixelAura: { position: "absolute", bottom: 24, width: 104, height: 130, borderRadius: 28, backgroundColor: "rgba(251,191,36,0.28)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  pixelShadow: { position: "absolute", bottom: 10, width: 86, height: 12, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.32)" },
  pixelPlayer: { width: 82, height: 148, position: "relative" },
  pixelHair: { position: "absolute", top: 0, left: 23, width: 38, height: 14, backgroundColor: "#111827", borderRadius: 3, zIndex: 3 },
  pixelHead: { position: "absolute", top: 10, left: 26, width: 30, height: 28, backgroundColor: "#d8a47f", borderRadius: 4, zIndex: 2 },
  pixelNeck: { position: "absolute", top: 36, left: 34, width: 14, height: 10, backgroundColor: "#c68662" },
  pixelBody: { position: "absolute", top: 45, left: 20, width: 42, height: 46, borderRadius: 4, borderWidth: 3, overflow: "hidden" },
  pixelBodyGreen: { backgroundColor: "#22c55e", borderColor: "#bbf7d0" },
  pixelBodyWhite: { backgroundColor: "#f8fafc", borderColor: "#fbbf24" },
  pixelStripe: { position: "absolute", left: 17, top: 0, bottom: 0, width: 8 },
  pixelStripeGreen: { backgroundColor: "#052e16" },
  pixelStripeGold: { backgroundColor: "#fbbf24" },
  pixelNumber: { position: "absolute", top: 11, left: 0, right: 0, color: "#052e16", fontSize: 14, lineHeight: 16, fontWeight: "900", textAlign: "center" },
  pixelNumberGold: { color: "#111827" },
  pixelArmLeft: { position: "absolute", top: 50, left: 9, width: 12, height: 38, backgroundColor: "#d8a47f", borderRadius: 3 },
  pixelArmRight: { position: "absolute", top: 50, right: 9, width: 12, height: 38, backgroundColor: "#d8a47f", borderRadius: 3 },
  pixelShorts: { position: "absolute", top: 89, left: 22, width: 38, height: 24, backgroundColor: "#0f172a", borderRadius: 3 },
  pixelLegLeft: { position: "absolute", top: 112, left: 25, width: 12, height: 28, backgroundColor: "#d8a47f", borderRadius: 2 },
  pixelLegRight: { position: "absolute", top: 112, right: 25, width: 12, height: 28, backgroundColor: "#d8a47f", borderRadius: 2 },
  pixelBootLeft: { position: "absolute", top: 138, left: 18, width: 22, height: 8, backgroundColor: "#fbbf24", borderRadius: 2 },
  pixelBootRight: { position: "absolute", top: 138, right: 18, width: 22, height: 8, backgroundColor: "#fbbf24", borderRadius: 2 },
  pixelBall: { position: "absolute", right: 4, bottom: 20, width: 26, height: 26, borderRadius: 26, backgroundColor: "#f8fafc", borderWidth: 3, borderColor: "#111827" },
  pixelJuggleBall: { position: "absolute", right: 24, bottom: 48, width: 24, height: 24, borderRadius: 24, backgroundColor: "#f8fafc", borderWidth: 3, borderColor: "#111827" },
  pixelBallPatch: { position: "absolute", left: 8, top: 8, width: 8, height: 8, backgroundColor: "#111827", borderRadius: 2 },
  pixelKneeSpark: { position: "absolute", right: 40, bottom: 55, width: 18, height: 4, borderRadius: 4, backgroundColor: "#fbbf24" },
  bootScreen: { flex: 1, backgroundColor: "#07120d", padding: 18, alignItems: "center", justifyContent: "center" },
  bootCard: { width: "100%", maxWidth: 420, backgroundColor: "#101827", borderColor: "rgba(134,239,172,0.28)", borderWidth: 1, borderRadius: 8, padding: 18, alignItems: "center", shadowColor: "#22c55e", shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  bootTitle: { color: "#f8fafc", fontSize: 21, lineHeight: 27, fontWeight: "900", textAlign: "center", marginTop: 10 },
  bootText: { color: "#cbd5e1", fontSize: 13, lineHeight: 19, fontWeight: "800", textAlign: "center", marginTop: 6 },
  bootTrack: { width: "100%", height: 12, backgroundColor: "#0f172a", borderRadius: 8, overflow: "hidden", marginTop: 16, borderWidth: 1, borderColor: "rgba(148,163,184,0.18)" },
  bootFill: { height: "100%", backgroundColor: "#86efac" },
  bootPercent: { color: "#fbbf24", fontSize: 12, fontWeight: "900", marginTop: 8 },
  bootSource: { color: "#94a3b8", fontSize: 10, fontWeight: "800", marginTop: 10, textAlign: "center" },
  topBar: { paddingHorizontal: 14, paddingVertical: 9, backgroundColor: "#062b16", borderBottomColor: "#1d7a35", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", gap: 8 },
  agent: { color: "#f8fafc", fontWeight: "900", fontSize: 18 },
  muted: { color: "#a8b5c6", fontSize: 11, lineHeight: 16, fontWeight: "800" },
  topStats: { flexDirection: "row", gap: 8 },
  stat: { minWidth: 78, backgroundColor: "#1f2937", borderRadius: 8, padding: 8 },
  statLabel: { color: "#cbd5e1", fontSize: 10 },
  statValue: { color: "#f8fafc", fontWeight: "800", fontSize: 13 },
  content: { flex: 1 },
  contentPad: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 74, width: "100%", maxWidth: 430, alignSelf: "center" },
  dashboardScreen: { flex: 1, padding: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#05070c" },
  dashWrap: { width: "100%", maxWidth: 430, alignSelf: "center", gap: 10 },
  dashHero: { borderColor: "rgba(125,211,252,0.24)", borderWidth: 1, borderRadius: 8, padding: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, overflow: "hidden", shadowColor: "#38bdf8", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  dashHeroGlow: { position: "absolute", right: -36, top: -42, width: 150, height: 150, borderRadius: 150, backgroundColor: "rgba(251,191,36,0.18)" },
  dashKicker: { color: "#7dd3fc", fontSize: 10, fontWeight: "900" },
  dashTitle: { color: "#f8fafc", fontSize: 24, lineHeight: 29, fontWeight: "900", marginTop: 3 },
  dashSub: { color: "#cbd5e1", fontSize: 12, lineHeight: 17, fontWeight: "800", marginTop: 5, maxWidth: 270 },
  dashScore: { width: 74, minHeight: 74, borderRadius: 8, backgroundColor: "#eab308", alignItems: "center", justifyContent: "center", padding: 7 },
  dashScoreValue: { color: "#111827", fontSize: 25, fontWeight: "900" },
  dashScoreLabel: { color: "#111827", fontSize: 9, fontWeight: "900", marginTop: 1 },
  dashboardTicker: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#07120d", borderColor: "rgba(134,239,172,0.22)", borderWidth: 1, borderRadius: 8, padding: 9 },
  dashboardTickerText: { color: "#dbeafe", fontSize: 11, lineHeight: 15, fontWeight: "800" },
  dashboardDecisionAlert: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#3f2d12", borderColor: "rgba(251,191,36,0.35)", borderWidth: 1, borderRadius: 8, padding: 10 },
  decisionAlertCount: { width: 34, height: 34, borderRadius: 8, backgroundColor: "#fbbf24", alignItems: "center", justifyContent: "center" },
  decisionAlertCountText: { color: "#111827", fontSize: 16, fontWeight: "900" },
  decisionAlertTitle: { color: "#f8fafc", fontSize: 13, fontWeight: "900" },
  decisionAlertText: { color: "#fef3c7", fontSize: 11, lineHeight: 15, fontWeight: "800", marginTop: 2 },
  nextStepCard: { borderColor: "rgba(134,239,172,0.28)", borderWidth: 1, borderRadius: 8, padding: 13 },
  nextStepKicker: { color: "#86efac", fontSize: 10, fontWeight: "900" },
  nextStepTitle: { color: "#f8fafc", fontSize: 18, lineHeight: 22, fontWeight: "900", marginTop: 2 },
  nextStepText: { color: "#d9f99d", fontSize: 12, lineHeight: 17, fontWeight: "800", marginTop: 4 },
  focusPlanCard: { backgroundColor: "#111827", borderColor: "rgba(251,191,36,0.24)", borderWidth: 1, borderRadius: 8, padding: 11, gap: 8 },
  focusPlanHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  focusPlanTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  liveStatusDot: { width: 9, height: 9, borderRadius: 9, backgroundColor: "#fbbf24" },
  focusPlanTitle: { color: "#f8fafc", fontSize: 13, fontWeight: "900" },
  focusPlanActive: { color: "#111827", backgroundColor: "#fbbf24", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 3, fontSize: 10, fontWeight: "900" },
  focusPlanRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  focusPlanChip: { flexGrow: 1, minWidth: "30%", minHeight: 34, borderRadius: 8, backgroundColor: "#1f2937", borderColor: "#334155", borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  focusPlanChipActive: { backgroundColor: "#86efac", borderColor: "#bbf7d0" },
  focusPlanChipText: { color: "#cbd5e1", fontSize: 11, fontWeight: "900" },
  focusPlanChipTextActive: { color: "#052e16" },
  focusPlanHint: { color: "#fef3c7", fontSize: 11, lineHeight: 15, fontWeight: "800" },
  dashMetrics: { flexDirection: "row", gap: 8 },
  metricTile: { flex: 1, minHeight: 58, backgroundColor: "#111827", borderColor: "rgba(148,163,184,0.22)", borderWidth: 1, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  metricValue: { color: "#f8fafc", fontSize: 14, fontWeight: "900", textAlign: "center" },
  metricLabel: { color: "#94a3b8", fontSize: 10, fontWeight: "900", marginTop: 3 },
  flowCard: { backgroundColor: "#0f172a", borderColor: "rgba(134,239,172,0.2)", borderWidth: 1, borderRadius: 8, padding: 10, gap: 8 },
  flowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  flowTitle: { color: "#f8fafc", fontSize: 13, fontWeight: "900" },
  flowBadge: { color: "#052e16", backgroundColor: "#86efac", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 3, fontSize: 10, fontWeight: "900" },
  flowRail: { flexDirection: "row", gap: 6 },
  flowStep: { flex: 1, minWidth: 0, alignItems: "center", gap: 4 },
  flowDot: { width: 26, height: 26, borderRadius: 26, backgroundColor: "#1f2937", borderColor: "#475569", borderWidth: 1, alignItems: "center", justifyContent: "center" },
  flowDotDone: { backgroundColor: "#86efac", borderColor: "#bbf7d0" },
  flowDotText: { color: "#cbd5e1", fontSize: 11, fontWeight: "900" },
  flowDotTextDone: { color: "#052e16" },
  flowStepText: { color: "#94a3b8", fontSize: 9, lineHeight: 12, fontWeight: "900", textAlign: "center" },
  flowStepTextDone: { color: "#d9f99d" },
  dashActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dashActionButton: { width: "48.8%", borderRadius: 8, shadowColor: "#000000", shadowOpacity: 0.16, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  dashActionGradient: { minHeight: 70, borderRadius: 8, alignItems: "flex-start", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", paddingHorizontal: 12, paddingVertical: 9 },
  dashActionIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 6 },
  dashActionText: { color: "#f8fafc", fontSize: 13, fontWeight: "900" },
  dashActionMeta: { color: "#cbd5e1", fontSize: 10, fontWeight: "800", marginTop: 3 },
  compactPanel: { backgroundColor: "#101827", borderColor: "rgba(148,163,184,0.22)", borderWidth: 1, borderRadius: 8, padding: 11, gap: 7 },
  compactPanelHalf: { flex: 1 },
  compactHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  compactTitle: { color: "#f8fafc", fontSize: 13, fontWeight: "900", flex: 1 },
  compactBadge: { color: "#111827", backgroundColor: "#fbbf24", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 3, fontSize: 10, fontWeight: "900" },
  compactStrong: { color: "#e2e8f0", fontSize: 12, lineHeight: 17, fontWeight: "900" },
  compactTrack: { height: 7, backgroundColor: "#0f172a", borderRadius: 8, overflow: "hidden" },
  compactFill: { height: "100%", backgroundColor: "#38bdf8" },
  compactLine: { color: "#cbd5e1", fontSize: 11, lineHeight: 16, fontWeight: "800" },
  dashBottomRow: { flexDirection: "row", gap: 8, alignItems: "stretch" },
  setupHero: { position: "relative", overflow: "hidden", backgroundColor: "#172033", borderColor: "#475569", borderWidth: 1, borderRadius: 8, padding: 16, marginBottom: 4 },
  setupKicker: { color: "#fbbf24", fontSize: 11, fontWeight: "900" },
  setupTitle: { color: "#f8fafc", fontSize: 26, lineHeight: 32, fontWeight: "900", marginTop: 4 },
  setupCopy: { color: "#cbd5e1", fontSize: 13, lineHeight: 20, marginTop: 8 },
  setupChoice: { position: "relative", overflow: "hidden", flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#101827", borderColor: "rgba(148,163,184,0.24)", borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 8 },
  setupChoiceActive: { borderColor: "#f59e0b", backgroundColor: "#1f2d25", shadowColor: "#fbbf24", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  setupMarketPanel: { position: "relative", overflow: "hidden", backgroundColor: "#10251b", borderColor: "#235c38", borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 8, marginBottom: 12 },
  setupMarketHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  setupMarketTitle: { color: "#f8fafc", fontSize: 16, fontWeight: "900" },
  setupMarketGrid: { flexDirection: "row", gap: 8, marginTop: 10 },
  setupMarketStat: { flex: 1, backgroundColor: "rgba(34,197,94,0.13)", borderRadius: 8, paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: "rgba(187,247,208,0.16)" },
  setupMarketValue: { color: "#fbbf24", fontSize: 20, fontWeight: "900" },
  setupMarketLabel: { color: "#d9f99d", fontSize: 10, fontWeight: "900", marginTop: 2 },
  setupFilterScroll: { marginBottom: 4 },
  setupFilterChip: { minHeight: 36, backgroundColor: "#1f2937", borderColor: "#334155", borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", marginRight: 8 },
  setupFilterChipActive: { backgroundColor: "#86efac", borderColor: "#bbf7d0" },
  setupFilterText: { color: "#cbd5e1", fontSize: 12, fontWeight: "900" },
  setupFilterTextActive: { color: "#052e16" },
  setupTierRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  setupTierChip: { flex: 1, minHeight: 38, backgroundColor: "#1f2937", borderColor: "#334155", borderWidth: 1, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  setupTierChipActive: { backgroundColor: "#fbbf24", borderColor: "#fde68a" },
  setupTierText: { color: "#cbd5e1", fontSize: 12, fontWeight: "900" },
  setupTierTextActive: { color: "#111827" },
  prologueScreen: { minHeight: 600, borderRadius: 14, borderWidth: 1, borderColor: "rgba(251,191,36,0.28)", padding: 14, overflow: "hidden", justifyContent: "space-between" },
  prologueGlow: { position: "absolute", right: -70, top: -60, width: 230, height: 230, borderRadius: 230, backgroundColor: "rgba(251,191,36,0.18)" },
  prologueKicker: { color: "#fbbf24", fontSize: 11, fontWeight: "900", zIndex: 2 },
  prologueFilmDots: { flexDirection: "row", gap: 5, marginTop: 8, zIndex: 2 },
  prologueFilmDot: { flex: 1, height: 4, borderRadius: 6, backgroundColor: "rgba(148,163,184,0.28)" },
  prologueFilmDotActive: { backgroundColor: "#fbbf24" },
  prologueArt: { minHeight: 238, borderRadius: 14, overflow: "hidden", marginTop: 10, borderWidth: 1, borderColor: "rgba(251,191,36,0.24)", justifyContent: "flex-end", zIndex: 2 },
  prologueArtImage: { borderRadius: 14, resizeMode: "cover" },
  prologueArtShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(2,6,23,0.28)" },
  prologueLetterboxTop: { position: "absolute", left: 0, right: 0, top: 0, height: 22, backgroundColor: "rgba(2,6,23,0.72)", zIndex: 2 },
  prologueLetterboxBottom: { position: "absolute", left: 0, right: 0, bottom: 0, height: 24, backgroundColor: "rgba(2,6,23,0.72)", zIndex: 2 },
  prologueArtBadge: { alignSelf: "flex-start", margin: 10, borderRadius: 9, backgroundColor: "#fbbf24", paddingHorizontal: 10, paddingVertical: 5, zIndex: 5 },
  prologueArtBadgeText: { color: "#111827", fontSize: 11, fontWeight: "900" },
  prologueStage: { minHeight: 260, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", zIndex: 2 },
  ronaldoBadge: { position: "absolute", top: 52, alignSelf: "center", color: "#111827", fontSize: 11, fontWeight: "900" },
  pixelCastLayer: { ...StyleSheet.absoluteFillObject, zIndex: 3 },
  pixelActor: { position: "absolute", bottom: 24, width: 42, height: 88, alignItems: "center" },
  pixelAgent: { transform: [{ translateX: -18 }] },
  pixelLegend: { width: 52, height: 100, transform: [{ translateX: -20 }] },
  pixelAssistant: { bottom: 28, width: 34, height: 74, opacity: 0.95 },
  pixelHead: { width: 22, height: 24, borderRadius: 6, backgroundColor: "#d6a16f", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  pixelHair: { position: "absolute", top: 1, width: 24, height: 8, borderRadius: 3, backgroundColor: "#111827" },
  pixelSuit: { marginTop: -1, width: 34, height: 42, borderRadius: 5, backgroundColor: "#0f172a", borderWidth: 1, borderColor: "rgba(125,211,252,0.24)" },
  pixelTie: { position: "absolute", top: 27, width: 5, height: 20, backgroundColor: "#fbbf24", borderRadius: 2 },
  pixelLegendHead: { width: 26, height: 27, backgroundColor: "#e0b47a" },
  pixelLegendHair: { position: "absolute", top: 0, width: 28, height: 8, borderRadius: 3, backgroundColor: "#2b1708" },
  pixelLegendKit: { marginTop: -1, width: 42, height: 48, borderRadius: 6, backgroundColor: "#f8fafc", borderWidth: 2, borderColor: "#fbbf24" },
  pixelGoldBoot: { position: "absolute", bottom: 16, width: 34, height: 6, borderRadius: 6, backgroundColor: "#fbbf24" },
  pixelAssistantHead: { width: 19, height: 21, backgroundColor: "#c9895c" },
  pixelAssistantSuit: { marginTop: -1, width: 30, height: 38, borderRadius: 5, backgroundColor: "#1e293b", borderWidth: 1, borderColor: "rgba(148,163,184,0.34)" },
  pixelActorTag: { marginTop: 3, color: "#111827", backgroundColor: "rgba(251,191,36,0.92)", borderRadius: 5, overflow: "hidden", paddingHorizontal: 4, paddingVertical: 1, fontSize: 7, lineHeight: 9, fontWeight: "900", maxWidth: 54, textAlign: "center" },
  pixelPhonePing: { position: "absolute", right: 20, top: 38, borderRadius: 8, backgroundColor: "#fbbf24", paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: "#fde68a" },
  pixelPhoneText: { color: "#111827", fontSize: 9, fontWeight: "900" },
  prologueCard: { position: "relative", overflow: "hidden", backgroundColor: "rgba(8,17,29,0.94)", borderColor: "rgba(125,211,252,0.22)", borderWidth: 1, borderRadius: 16, padding: 14, zIndex: 2 },
  prologueTitle: { color: "#ffffff", fontSize: 22, lineHeight: 28, fontWeight: "900" },
  prologueText: { color: "#dbeafe", fontSize: 13, lineHeight: 19, fontWeight: "800", marginTop: 8 },
  prologueStakes: { color: "#fef3c7", backgroundColor: "rgba(251,191,36,0.10)", borderColor: "rgba(251,191,36,0.24)", borderWidth: 1, borderRadius: 10, overflow: "hidden", paddingHorizontal: 9, paddingVertical: 7, fontSize: 11, lineHeight: 15, fontWeight: "900", marginTop: 10 },
  prologueEcho: { color: "#fcd34d", fontSize: 10, lineHeight: 14, fontWeight: "900", marginTop: 10 },
  prologueChoiceRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  prologueChoiceButton: { flex: 1, minHeight: 54, backgroundColor: "#0f172a", borderColor: "rgba(125,211,252,0.28)", borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 8, justifyContent: "center" },
  prologueChoiceText: { color: "#f8fafc", fontSize: 12, lineHeight: 15, fontWeight: "900", textAlign: "center" },
  prologueChoiceHint: { color: "#9fb3c8", fontSize: 9, lineHeight: 12, fontWeight: "800", textAlign: "center", marginTop: 3 },
  prologueButton: { backgroundColor: "#fbbf24", borderRadius: 12, paddingVertical: 13, alignItems: "center", marginTop: 14 },
  prologueButtonText: { color: "#111827", fontSize: 14, fontWeight: "900" },
  prospectIntro: { position: "relative", overflow: "hidden", backgroundColor: "#101827", borderColor: "rgba(251,191,36,0.28)", borderWidth: 1, borderRadius: 16, padding: 16, paddingTop: 118, marginBottom: 12 },
  prospectIntroArt: { position: "absolute", left: 0, right: 0, top: 0, width: "100%", height: 118, opacity: 0.42 },
  prospectChoice: { position: "relative", overflow: "hidden", flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: "#111827", borderColor: "rgba(125,211,252,0.22)", borderWidth: 1, borderRadius: 14, padding: 10, marginBottom: 10 },
  prospectHook: { color: "#fbbf24", fontSize: 11, lineHeight: 15, fontWeight: "900", marginBottom: 2 },
  prospectRisk: { color: "#fed7aa", fontSize: 10, lineHeight: 14, fontWeight: "900", marginTop: 5 },
  prospectPickButton: { alignSelf: "stretch", minWidth: 48, borderRadius: 9, backgroundColor: "#86efac", alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  prospectPick: { color: "#111827", fontSize: 11, fontWeight: "900" },
  reportHero: { backgroundColor: "#101827", borderColor: "rgba(251,191,36,0.28)", borderWidth: 1, borderRadius: 8, padding: 16, marginBottom: 12 },
  reportKicker: { color: "#fbbf24", fontSize: 11, fontWeight: "900" },
  reportTitle: { color: "#f8fafc", fontSize: 30, lineHeight: 36, fontWeight: "900", marginTop: 4 },
  reportCopy: { color: "#dbeafe", fontSize: 13, lineHeight: 20, fontWeight: "800", marginTop: 8 },
  reportGrade: { position: "absolute", right: 14, top: 14, width: 58, height: 58, borderRadius: 8, backgroundColor: "#fbbf24", alignItems: "center", justifyContent: "center" },
  reportGradeValue: { color: "#111827", fontSize: 24, lineHeight: 28, fontWeight: "900" },
  reportGradeLabel: { color: "#111827", fontSize: 8, fontWeight: "900", marginTop: 1 },
  reportGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  reportCard: { width: "48.5%", backgroundColor: "#0f172a", borderColor: "rgba(134,239,172,0.18)", borderWidth: 1, borderRadius: 8, padding: 12, alignItems: "center" },
  reportValue: { color: "#fbbf24", fontSize: 18, fontWeight: "900", textAlign: "center" },
  reportLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "900", marginTop: 3 },
  reportPanel: { marginBottom: 10 },
  reportOverlay: { flex: 1, backgroundColor: "rgba(2,6,23,0.76)", alignItems: "center", justifyContent: "center", padding: 10 },
  weekReportShell: { width: "100%", maxWidth: 430 },
  weekReportCard: { position: "relative", width: "100%", borderColor: "rgba(134,239,172,0.28)", borderWidth: 1, borderRadius: 8, padding: 10, overflow: "hidden", shadowColor: "#22c55e", shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  weekReportScroll: { flexShrink: 1 },
  weekReportScrollPad: { paddingBottom: 12 },
  weekReportGlow: { position: "absolute", right: -44, top: -44, width: 170, height: 170, borderRadius: 170, backgroundColor: "rgba(125,211,252,0.13)" },
  weekReportHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  weekReportKicker: { color: "#86efac", fontSize: 10, fontWeight: "900" },
  weekReportBadge: { color: "#111827", backgroundColor: "#fbbf24", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2, fontSize: 9, fontWeight: "900" },
  weekReportTitle: { color: "#f8fafc", fontSize: 18, lineHeight: 22, fontWeight: "900", marginTop: 5 },
  weekReportHeadline: { color: "#cbd5e1", fontSize: 10, lineHeight: 14, fontWeight: "800", marginTop: 3 },
  weekReportScore: { backgroundColor: "#0d2a1d", borderColor: "rgba(134,239,172,0.22)", borderWidth: 1, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 8, alignItems: "center", marginTop: 7 },
  weekReportScoreText: { color: "#f8fafc", fontSize: 12, lineHeight: 15, fontWeight: "900", textAlign: "center" },
  weekReportGrid: { flexDirection: "row", gap: 5, marginTop: 7 },
  weekReportMetric: { flex: 1, minHeight: 43, backgroundColor: "#0f172a", borderColor: "rgba(148,163,184,0.18)", borderWidth: 1, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  weekReportMetricValue: { fontSize: 11, lineHeight: 14, fontWeight: "900", textAlign: "center" },
  weekReportMetricLabel: { color: "#94a3b8", fontSize: 8, lineHeight: 10, fontWeight: "900", marginTop: 1 },
  weekReportGood: { color: "#86efac" },
  weekReportBad: { color: "#fca5a5" },
  weekReportFocusImpact: { backgroundColor: "rgba(63,45,18,0.48)", borderColor: "rgba(251,191,36,0.32)", borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, marginTop: 7 },
  weekReportFocusTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  weekReportFocusKicker: { color: "#fbbf24", fontSize: 9, lineHeight: 12, fontWeight: "900" },
  weekReportFocusBadge: { color: "#111827", backgroundColor: "#fbbf24", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2, fontSize: 9, lineHeight: 11, fontWeight: "900" },
  weekReportFocusTitle: { color: "#f8fafc", fontSize: 11, lineHeight: 14, fontWeight: "900", marginTop: 3 },
  weekReportFocusText: { color: "#fde68a", fontSize: 9, lineHeight: 12, fontWeight: "800", marginTop: 2 },
  weekReportNotes: { backgroundColor: "#0f172a", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, gap: 2, marginTop: 7, marginBottom: 6 },
  weekReportNote: { color: "#dbeafe", fontSize: 9, lineHeight: 12, fontWeight: "800" },
  weekReportSection: { backgroundColor: "rgba(15,23,42,0.78)", borderRadius: 8, borderWidth: 1, borderColor: "rgba(148,163,184,0.15)", padding: 7, gap: 4, marginBottom: 6 },
  weekReportSectionTitle: { color: "#fbbf24", fontSize: 10, lineHeight: 13, fontWeight: "900" },
  weekReportAchievementSection: { borderColor: "rgba(251,191,36,0.34)", backgroundColor: "rgba(63,45,18,0.42)" },
  weekReportAchievementRow: { backgroundColor: "#111827", borderRadius: 7, paddingHorizontal: 7, paddingVertical: 5, borderWidth: 1, borderColor: "rgba(251,191,36,0.22)" },
  weekReportAchievementTitle: { color: "#f8fafc", fontSize: 10, lineHeight: 13, fontWeight: "900" },
  weekReportAchievementReward: { color: "#fbbf24", fontSize: 9, lineHeight: 12, fontWeight: "900", marginTop: 1 },
  weekReportPlayerGrid: { gap: 5 },
  weekReportPlayerRow: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#111827", borderRadius: 7, paddingHorizontal: 6, paddingVertical: 5, borderWidth: 1, borderColor: "rgba(134,239,172,0.12)" },
  weekReportPlayerText: { flex: 1, minWidth: 0 },
  weekReportPlayerTop: { flexDirection: "row", alignItems: "center", gap: 5 },
  weekReportPlayerName: { color: "#f8fafc", fontSize: 10, lineHeight: 13, fontWeight: "900" },
  weekReportPlayerTag: { color: "#111827", backgroundColor: "#86efac", borderRadius: 6, overflow: "hidden", paddingHorizontal: 5, paddingVertical: 1, fontSize: 8, lineHeight: 10, fontWeight: "900", marginLeft: "auto" },
  weekReportPlayerMeta: { color: "#cbd5e1", fontSize: 8, lineHeight: 11, fontWeight: "800", marginTop: 1 },
  weekReportPlanSection: { borderColor: "rgba(125,211,252,0.30)", backgroundColor: "rgba(8,47,73,0.34)" },
  weekReportPlanRow: { backgroundColor: "#101827", borderRadius: 7, paddingHorizontal: 7, paddingVertical: 5, borderWidth: 1, borderColor: "rgba(125,211,252,0.20)" },
  weekReportPlanName: { color: "#f8fafc", fontSize: 10, lineHeight: 13, fontWeight: "900" },
  weekReportPlanMeta: { color: "#bae6fd", fontSize: 9, lineHeight: 12, fontWeight: "800", marginTop: 1 },
  weekReportEvent: { color: "#dbeafe", fontSize: 9, lineHeight: 12, fontWeight: "800", backgroundColor: "#111827", borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4 },
  weekReportNext: { backgroundColor: "#0d2a1d", borderRadius: 8, borderWidth: 1, borderColor: "rgba(134,239,172,0.22)", paddingHorizontal: 8, paddingVertical: 7, marginBottom: 7 },
  weekReportNextKicker: { color: "#86efac", fontSize: 9, lineHeight: 12, fontWeight: "900" },
  weekReportNextText: { color: "#f8fafc", fontSize: 10, lineHeight: 14, fontWeight: "900", marginTop: 2 },
  weekReportFooter: { borderTopWidth: 1, borderTopColor: "rgba(134,239,172,0.18)", paddingTop: 7, marginTop: 0 },
  weekReportActionButton: { minHeight: 39, borderRadius: 8, backgroundColor: "#fbbf24", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#fde68a" },
  weekReportActionText: { color: "#111827", fontSize: 13, fontWeight: "900" },
  matchScreen: { flex: 1, paddingHorizontal: 7, paddingTop: 6, paddingBottom: 5, backgroundColor: "#05070c" },
  matchLiveShell: { flex: 1, width: "100%", maxWidth: 430, alignSelf: "center", gap: 5 },
  matchLiveGrid: { flex: 1, gap: 4 },
  matchDayHero: { backgroundColor: "#071a18", borderColor: "rgba(134,239,172,0.28)", borderWidth: 1, borderRadius: 8, padding: 6, marginBottom: 0, overflow: "hidden" },
  matchDayHeroImage: { borderRadius: 8, opacity: 0.72 },
  matchDayHeroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(2,6,23,0.54)" },
  matchDayTopLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 },
  matchDayKicker: { color: "#fbbf24", fontSize: 10, fontWeight: "900" },
  matchDayTitle: { color: "#f8fafc", fontSize: 17, lineHeight: 20, fontWeight: "900", marginTop: 0 },
  matchDayStatusPill: { color: "#052e16", backgroundColor: "#bbf7d0", borderRadius: 7, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontWeight: "900" },
  matchDayStatusLive: { color: "#111827", backgroundColor: "#fbbf24" },
  matchLiveStats: { flexDirection: "row", gap: 4, backgroundColor: "rgba(2,6,23,0.28)", borderRadius: 8, padding: 3, marginTop: 3 },
  matchLiveStatBox: { flex: 1, minHeight: 31, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(15,23,42,0.82)", borderColor: "rgba(125,211,252,0.16)", borderWidth: 1, borderRadius: 8 },
  matchLiveStatValue: { color: "#f8fafc", fontSize: 13, lineHeight: 16, fontWeight: "900" },
  matchLiveStatLabel: { color: "#9fb3c8", fontSize: 8, lineHeight: 10, fontWeight: "900" },
  matchScoreBoardCompact: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(15,23,42,0.76)", borderColor: "rgba(187,247,208,0.18)", borderWidth: 1, borderRadius: 8, padding: 7 },
  matchTeamCompact: { flex: 1, minWidth: 0, alignItems: "center", gap: 4 },
  matchTeamCompactName: { color: "#dff7dc", fontSize: 10, lineHeight: 13, fontWeight: "900", textAlign: "center" },
  matchCenterScoreBox: { minWidth: 104, alignItems: "center", justifyContent: "center" },
  matchMinuteBubble: { color: "#111827", backgroundColor: "#fbbf24", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2, fontSize: 10, fontWeight: "900" },
  matchScoreBig: { color: "#f8fafc", fontSize: 26, lineHeight: 31, fontWeight: "900", marginTop: 1 },
  matchScoreDash: { color: "#94a3b8" },
  matchStatusTiny: { color: "#94a3b8", fontSize: 9, fontWeight: "900" },
  matchProgressTrack: { height: 5, backgroundColor: "#0f172a", borderRadius: 8, overflow: "hidden", marginTop: 5 },
  matchProgressFill: { height: "100%", backgroundColor: "#f59e0b" },
  matchDayMeta: { color: "#94a3b8", fontSize: 11, fontWeight: "800", marginTop: 7 },
  matchQuickStats: { flexDirection: "row", gap: 5, marginTop: 6 },
  matchQuickStat: { flex: 1, color: "#dbeafe", backgroundColor: "rgba(15,23,42,0.72)", borderRadius: 7, overflow: "hidden", paddingVertical: 4, paddingHorizontal: 4, fontSize: 9, fontWeight: "900", textAlign: "center" },
  matchWatchReason: { backgroundColor: "rgba(15,23,42,0.76)", borderColor: "rgba(125,211,252,0.22)", borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 5, marginTop: 6 },
  matchWatchReasonKicker: { color: "#7dd3fc", fontSize: 9, fontWeight: "900" },
  matchWatchReasonText: { color: "#e0f2fe", fontSize: 9, lineHeight: 12, fontWeight: "800", marginTop: 1 },
  matchControls: { flexDirection: "row", gap: 6, marginTop: 5 },
  matchControlButton: { flex: 1, backgroundColor: "#0f172a", borderColor: "#475569", borderWidth: 1, borderRadius: 8, paddingVertical: 7, alignItems: "center" },
  matchControlPrimary: { flex: 1.2, backgroundColor: "#f59e0b", borderColor: "#fbbf24", borderWidth: 1, borderRadius: 8, paddingVertical: 7, alignItems: "center" },
  matchControlText: { color: "#f8fafc", fontSize: 11, fontWeight: "900" },
  matchSoundButton: { minWidth: 49, backgroundColor: "rgba(15,23,42,0.78)", borderColor: "rgba(125,211,252,0.28)", borderWidth: 1, borderRadius: 8, paddingVertical: 7, alignItems: "center", paddingHorizontal: 6 },
  matchSoundText: { color: "#dbeafe", fontSize: 11, fontWeight: "900" },
  matchStatusLine: { color: "#9fb3c8", fontSize: 8, lineHeight: 11, fontWeight: "800", marginTop: 4 },
  leagueMatchTicker: { width: "100%", maxWidth: 430, alignSelf: "center", backgroundColor: "#0b1827", borderColor: "rgba(125,211,252,0.22)", borderWidth: 1, borderRadius: 8, padding: 5, gap: 2, marginBottom: 0 },
  leagueMatchTickerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 2 },
  leagueMatchTickerTitleBlock: { flex: 1 },
  leagueMatchTickerTitle: { color: "#dbeafe", fontSize: 11, fontWeight: "900" },
  leagueMatchTickerHint: { color: "#94a3b8", fontSize: 9, lineHeight: 12, fontWeight: "800", marginTop: 1 },
  leagueMatchTickerBadge: { color: "#082f49", backgroundColor: "#7dd3fc", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2, fontSize: 9, fontWeight: "900" },
  leagueMatchRow: { minHeight: 19, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#101827", borderColor: "rgba(148,163,184,0.12)", borderWidth: 1, borderRadius: 7, paddingHorizontal: 6 },
  leagueMatchRowClient: { borderColor: "rgba(251,191,36,0.38)", backgroundColor: "#171b15" },
  leagueMatchTeam: { flex: 1, color: "#dbeafe", fontSize: 10, fontWeight: "800" },
  leagueMatchTeamRight: { flex: 1, color: "#dbeafe", fontSize: 10, fontWeight: "800", textAlign: "right" },
  leagueMatchScore: { minWidth: 42, color: "#94a3b8", fontSize: 12, fontWeight: "900", textAlign: "center" },
  leagueMatchScoreLive: { color: "#f8fafc" },
  leagueMatchState: { width: 38, color: "#94a3b8", fontSize: 9, fontWeight: "900", textAlign: "center" },
  leagueMatchStateLive: { color: "#22c55e" },
  leagueMatchStateDone: { color: "#fbbf24" },
  leagueMatchMore: { color: "#94a3b8", fontSize: 9, fontWeight: "800", textAlign: "center", paddingTop: 2 },
  compactMatchFeed: { width: "100%", maxWidth: 430, alignSelf: "center", backgroundColor: "#101827", borderColor: "rgba(134,239,172,0.20)", borderWidth: 1, borderRadius: 8, padding: 6, gap: 4 },
  compactClientRail: { flexDirection: "row", gap: 6 },
  compactClientGrid: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  compactClientPill: { flexGrow: 1, flexBasis: "48%", minHeight: 48, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#0d2a1d", borderColor: "rgba(134,239,172,0.24)", borderWidth: 1, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 4 },
  compactClientPillIdle: { opacity: 0.72, backgroundColor: "#111827", borderColor: "rgba(148,163,184,0.18)" },
  compactClientName: { color: "#f8fafc", fontSize: 11, lineHeight: 14, fontWeight: "900" },
  compactClientMeta: { color: "#bbf7d0", fontSize: 9, lineHeight: 12, fontWeight: "800", marginTop: 1 },
  compactClientSummary: { color: "#94a3b8", fontSize: 9, lineHeight: 12, fontWeight: "800", textAlign: "center", marginTop: -1 },
  compactEmptyClient: { flex: 1, minHeight: 42, borderRadius: 8, backgroundColor: "#111827", borderColor: "rgba(148,163,184,0.18)", borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  compactEmptyClientText: { color: "#cbd5e1", fontSize: 10, lineHeight: 13, fontWeight: "800", textAlign: "center" },
  compactFeedTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  compactFeedTitle: { color: "#f8fafc", fontSize: 12, fontWeight: "900" },
  compactFeedBadge: { color: "#111827", backgroundColor: "#fbbf24", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2, fontSize: 10, fontWeight: "900" },
  compactFeedLine: { minHeight: 28, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#0f172a", borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  compactFeedGoal: { backgroundColor: "#2a210f", borderWidth: 1, borderColor: "rgba(251,191,36,0.28)" },
  compactFeedFoul: { backgroundColor: "#24131b", borderWidth: 1, borderColor: "rgba(248,113,113,0.22)" },
  compactFeedMinute: { width: 31, color: "#fbbf24", fontSize: 11, fontWeight: "900", textAlign: "center" },
  compactFeedText: { flex: 1, color: "#e2e8f0", fontSize: 10, lineHeight: 13, fontWeight: "800" },
  compactFeedFixture: { color: "#7dd3fc", fontSize: 8, lineHeight: 10, fontWeight: "900" },
  fieldHero: { height: 172, backgroundColor: "#17613a", borderColor: "#475569", borderWidth: 1, borderRadius: 8, overflow: "hidden", marginBottom: 12, position: "relative" },
  fieldHeroImage: { borderRadius: 8 },
  pitchLine: { position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, backgroundColor: "rgba(222,255,223,0.45)" },
  centerCircle: { position: "absolute", left: "50%", top: "50%", width: 86, height: 86, marginLeft: -43, marginTop: -43, borderWidth: 2, borderColor: "rgba(222,255,223,0.45)", borderRadius: 86 },
  goalBoxLeft: { position: "absolute", left: -3, top: 46, width: 42, height: 80, borderWidth: 2, borderColor: "rgba(222,255,223,0.45)" },
  goalBoxRight: { position: "absolute", right: -3, top: 46, width: 42, height: 80, borderWidth: 2, borderColor: "rgba(222,255,223,0.45)" },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15,23,42,0.38)" },
  heroContent: { flex: 1, padding: 14, justifyContent: "space-between" },
  heroKicker: { color: "#fbbf24", fontSize: 11, fontWeight: "900" },
  heroTitle: { color: "#f8fafc", fontSize: 28, fontWeight: "900", marginTop: 3 },
  heroCopy: { display: "none" },
  heroCopyFresh: { color: "#e2e8f0", fontSize: 12, marginTop: 5 },
  heroCrests: { flexDirection: "row", gap: 8, alignSelf: "flex-end" },
  homeBoard: { position: "relative", flex: 1, alignSelf: "center", width: "100%", maxWidth: 430, backgroundColor: "#0a271b", borderColor: "rgba(134,239,172,0.28)", borderWidth: 1, borderRadius: 8, paddingTop: 54, paddingHorizontal: 9, paddingBottom: 7, overflow: "hidden" },
  homeBoardImage: { borderRadius: 8, opacity: 0.72 },
  homeShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(2,18,10,0.52)" },
  homePitchLine: { position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, marginLeft: -1, backgroundColor: "rgba(226,255,217,0.06)" },
  homePitchCircle: { position: "absolute", left: "50%", top: "64%", width: 154, height: 154, marginLeft: -77, marginTop: -77, borderRadius: 154, borderWidth: 2, borderColor: "rgba(226,255,217,0.06)" },
  homeCleanTop: { position: "absolute", left: 0, right: 0, top: 0, minHeight: 54, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "rgba(2,25,20,0.96)", borderBottomWidth: 1, borderBottomColor: "rgba(125,211,252,0.18)", flexDirection: "row", alignItems: "center", gap: 8, zIndex: 2 },
  homeIdentityBlock: { flex: 1, minWidth: 0 },
  homeAgentName: { color: "#f8fafc", fontSize: 16, lineHeight: 19, fontWeight: "900" },
  homeSeasonLine: { color: "#9bdcaa", fontSize: 9, lineHeight: 12, fontWeight: "900", marginTop: 1 },
  homeWalletBlock: { minWidth: 66, minHeight: 36, borderRadius: 8, backgroundColor: "rgba(15,23,42,0.9)", borderColor: "rgba(251,191,36,0.24)", borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  homeWalletValue: { color: "#fbbf24", fontSize: 11, lineHeight: 14, fontWeight: "900" },
  homeWalletLabel: { color: "#94a3b8", fontSize: 8, lineHeight: 10, fontWeight: "900" },
  homeProgressPanel: { backgroundColor: "rgba(8,17,29,0.86)", borderColor: "rgba(125,211,252,0.22)", borderWidth: 1, borderRadius: 8, padding: 9, marginBottom: 7, zIndex: 2 },
  homeProgressTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  homeProgressTitle: { flex: 1, color: "#f8fafc", fontSize: 12, lineHeight: 15, fontWeight: "900" },
  homeProgressBadge: { color: "#07111f", backgroundColor: "#fbbf24", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2, fontSize: 9, fontWeight: "900" },
  homeProgressCopy: { color: "#cbd5e1", fontSize: 10, lineHeight: 14, fontWeight: "800", marginTop: 4 },
  homeProgressTrack: { height: 5, backgroundColor: "#07120d", borderRadius: 8, overflow: "hidden", marginTop: 7 },
  homeProgressFill: { height: "100%", backgroundColor: "#38bdf8" },
  homeTopMini: { position: "absolute", left: 0, right: 0, top: 0, minHeight: 52, paddingHorizontal: 16, paddingVertical: 7, backgroundColor: "rgba(3,35,26,0.94)", borderBottomWidth: 1, borderBottomColor: "rgba(134,239,172,0.22)", flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignContent: "center", rowGap: 2, zIndex: 2 },
  homeTopText: { width: "23%", color: "#dff7dc", fontSize: 9, lineHeight: 13, fontWeight: "900" },
  homeTopTextDanger: { color: "#fecaca" },
  homeSoundPill: { minWidth: 72, borderRadius: 7, backgroundColor: "rgba(15,23,42,0.78)", borderColor: "rgba(125,211,252,0.28)", borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3, alignItems: "center" },
  homeSoundText: { color: "#dbeafe", fontSize: 9, lineHeight: 12, fontWeight: "900" },
  homeStoryLine: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(8,17,29,0.78)", borderColor: "rgba(251,191,36,0.22)", borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, marginBottom: 6, zIndex: 2 },
  homeStoryText: { flex: 1, color: "#dbeafe", fontSize: 10, lineHeight: 13, fontWeight: "800" },
  homeStoryBadge: { color: "#111827", backgroundColor: "#fbbf24", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2, fontSize: 9, fontWeight: "900" },
  homeSignalStrip: { flexDirection: "row", gap: 7, marginBottom: 6, zIndex: 2 },
  homeSignalCard: { flex: 1, minHeight: 46, borderRadius: 8, backgroundColor: "rgba(54,65,26,0.86)", borderWidth: 1, borderColor: "rgba(250,204,21,0.24)", paddingHorizontal: 8, paddingVertical: 6, justifyContent: "center", overflow: "hidden" },
  homeSignalCardWarm: { backgroundColor: "rgba(74,35,27,0.86)", borderColor: "rgba(251,146,60,0.28)" },
  homeSignalLabel: { color: "#fde68a", fontSize: 9, lineHeight: 12, fontWeight: "900" },
  homeSignalValue: { color: "#fff7ed", fontSize: 10, lineHeight: 13, fontWeight: "900", marginTop: 2 },
  homeCoachBar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(8,17,29,0.84)", borderColor: "rgba(125,211,252,0.24)", borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, marginBottom: 6, zIndex: 2 },
  homeCoachKicker: { color: "#07111f", backgroundColor: "#7dd3fc", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2, fontSize: 9, lineHeight: 12, fontWeight: "900" },
  homeCoachText: { flex: 1, color: "#dbeafe", fontSize: 10, lineHeight: 13, fontWeight: "900" },
  leagueStrip: { flexDirection: "row", gap: 8, marginBottom: 8, zIndex: 2 },
  miniTable: { flex: 1, minHeight: 58, borderRadius: 8, padding: 7, gap: 1, justifyContent: "center", borderWidth: 1, shadowColor: "#000000", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  miniTableLeft: { backgroundColor: "rgba(74,35,27,0.86)", borderColor: "rgba(251,146,60,0.28)" },
  miniTableRight: { backgroundColor: "rgba(54,65,26,0.86)", borderColor: "rgba(250,204,21,0.24)" },
  miniTableLine: { color: "#fff4df", fontSize: 9, lineHeight: 12, fontWeight: "900" },
  miniPoint: { color: "#ffffff", fontWeight: "900" },
  scoreChip: { position: "absolute", right: 7, bottom: 7, color: "#052e16", backgroundColor: "#86efac", borderRadius: 6, overflow: "hidden", paddingHorizontal: 6, paddingVertical: 2, fontSize: 10, fontWeight: "900" },
  storyPanel: { position: "relative", overflow: "hidden", backgroundColor: "#08111d", borderColor: "rgba(251,191,36,0.34)", borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 7, marginBottom: 7, zIndex: 2, shadowColor: "#fbbf24", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  storyTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  storyKicker: { color: "#fbbf24", fontSize: 9, fontWeight: "900" },
  storyTension: { color: "#07111f", backgroundColor: "#fbbf24", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2, fontSize: 9, fontWeight: "900" },
  storyTitleHomeWrap: { marginTop: 4 },
  storyTitleHome: { color: "#ffffff", fontSize: 13, lineHeight: 16, fontWeight: "900" },
  storyBeat: { color: "#e5efff", fontSize: 9, lineHeight: 13, fontWeight: "800", marginTop: 3 },
  storyTrack: { height: 6, backgroundColor: "rgba(15,23,42,0.9)", borderRadius: 8, overflow: "hidden", marginTop: 7 },
  storyFill: { height: "100%", backgroundColor: "#f97316" },
  storyObjective: { color: "#bbf7d0", fontSize: 10, lineHeight: 14, fontWeight: "900", marginTop: 5 },
  storyHistoryBox: { backgroundColor: "rgba(5,20,15,0.88)", borderColor: "rgba(134,239,172,0.26)", borderWidth: 1, borderRadius: 8, padding: 9, gap: 7, marginBottom: 10, zIndex: 2 },
  storyHistoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  storyHistoryKicker: { color: "#86efac", fontSize: 10, fontWeight: "900" },
  storyHistoryCount: { color: "#052e16", backgroundColor: "#86efac", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2, fontSize: 10, fontWeight: "900" },
  storyHistoryLine: { flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: "rgba(15,23,42,0.64)", borderRadius: 7, padding: 7 },
  storyHistoryWeek: { minWidth: 26, color: "#111827", backgroundColor: "#fbbf24", borderRadius: 6, overflow: "hidden", textAlign: "center", paddingVertical: 3, fontSize: 9, fontWeight: "900" },
  storyHistoryTitle: { color: "#f8fafc", fontSize: 11, lineHeight: 14, fontWeight: "900" },
  storyHistoryBody: { color: "#cbd5e1", fontSize: 9, lineHeight: 13, fontWeight: "800", marginTop: 2 },
  storyletScroll: { marginBottom: 10, zIndex: 2 },
  storyletRail: { gap: 8, paddingRight: 8 },
  storyletCard: { width: 188, minHeight: 118, backgroundColor: "rgba(15,23,42,0.92)", borderColor: "rgba(148,163,184,0.24)", borderWidth: 1, borderRadius: 8, padding: 10, overflow: "hidden" },
  storylet_gold: { borderColor: "rgba(251,191,36,0.42)", backgroundColor: "rgba(40,31,19,0.92)" },
  storylet_green: { borderColor: "rgba(134,239,172,0.34)" },
  storylet_blue: { borderColor: "rgba(125,211,252,0.34)" },
  storylet_red: { borderColor: "rgba(248,113,113,0.38)" },
  storylet_pink: { borderColor: "rgba(244,114,182,0.38)" },
  storylet_orange: { borderColor: "rgba(251,146,60,0.42)" },
  storyletTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  storyletKicker: { color: "#fbbf24", fontSize: 9, fontWeight: "900" },
  storyletProgress: { color: "#07111f", backgroundColor: "#fbbf24", borderRadius: 7, overflow: "hidden", paddingHorizontal: 6, paddingVertical: 2, fontSize: 9, fontWeight: "900" },
  storyletTitle: { color: "#f8fafc", fontSize: 13, lineHeight: 17, fontWeight: "900", marginTop: 6 },
  storyletBody: { color: "#cbd5e1", fontSize: 10, lineHeight: 14, fontWeight: "800", marginTop: 4 },
  storyletTrack: { height: 5, backgroundColor: "#07120d", borderRadius: 8, overflow: "hidden", marginTop: 8 },
  storyletFill: { height: "100%", backgroundColor: "#38bdf8" },
  storyletCta: { color: "#bbf7d0", fontSize: 10, fontWeight: "900", marginTop: 7 },
  cinemaDeck: { zIndex: 2, marginBottom: 12 },
  cinemaHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  cinemaTitle: { color: "#f8fafc", fontSize: 13, fontWeight: "900" },
  cinemaBadge: { color: "#111827", backgroundColor: "#86efac", borderRadius: 8, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontWeight: "900" },
  deckStage: { height: 154, position: "relative" },
  deckCardLayer: { position: "absolute", left: 0, right: 0, top: 0 },
  deckCard: { minHeight: 132, borderRadius: 9, padding: 12, backgroundColor: "#111827", borderColor: "rgba(125,211,252,0.28)", borderWidth: 1, overflow: "hidden", shadowColor: "#000000", shadowOpacity: 0.24, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
  deck_normal: { borderColor: "rgba(148,163,184,0.34)" },
  deck_urgent: { borderColor: "rgba(248,113,113,0.62)", backgroundColor: "#2b1620" },
  deck_risk: { borderColor: "rgba(251,146,60,0.56)", backgroundColor: "#2d2116" },
  deck_rare: { borderColor: "rgba(168,85,247,0.5)", backgroundColor: "#201631" },
  deck_opportunity: { borderColor: "rgba(134,239,172,0.52)", backgroundColor: "#10251b" },
  deck_story: { borderColor: "rgba(251,191,36,0.48)", backgroundColor: "#241d14" },
  deck_client: { borderColor: "rgba(125,211,252,0.46)" },
  deck_offer: { borderColor: "rgba(96,165,250,0.5)" },
  deck_rival: { borderColor: "rgba(244,114,182,0.52)" },
  deckCardGlow: { position: "absolute", right: -40, top: -50, width: 138, height: 138, borderRadius: 138, backgroundColor: "rgba(251,191,36,0.12)" },
  deckCardTop: { flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "center" },
  deckSource: { color: "#fbbf24", fontSize: 10, fontWeight: "900" },
  deckMeta: { color: "#cbd5e1", fontSize: 10, fontWeight: "900" },
  deckTitle: { color: "#ffffff", fontSize: 18, lineHeight: 23, fontWeight: "900", marginTop: 8 },
  deckBody: { color: "#dbeafe", fontSize: 11, lineHeight: 16, fontWeight: "800", marginTop: 5 },
  deckBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  deckDots: { flexDirection: "row", gap: 5 },
  deckDot: { width: 7, height: 7, borderRadius: 7, backgroundColor: "rgba(148,163,184,0.55)" },
  deckDotActive: { backgroundColor: "#fbbf24", width: 16 },
  deckCta: { color: "#07111f", backgroundColor: "#fbbf24", borderRadius: 7, overflow: "hidden", paddingHorizontal: 9, paddingVertical: 3, fontSize: 10, fontWeight: "900" },
  homeMissionPanel: { backgroundColor: "#07120d", borderColor: "rgba(134,239,172,0.38)", borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 7, marginBottom: 6, zIndex: 2, shadowColor: "#22c55e", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  homeMissionPanelClean: { minHeight: 94, backgroundColor: "rgba(7,18,13,0.94)", borderColor: "rgba(134,239,172,0.42)", paddingHorizontal: 11, paddingVertical: 10, marginBottom: 7 },
  homeMissionTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  homeMissionKicker: { color: "#86efac", fontSize: 10, fontWeight: "900" },
  homeMissionCta: { color: "#111827", backgroundColor: "#bbf7d0", borderRadius: 7, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontWeight: "900" },
  homeMissionTitle: { color: "#ffffff", fontSize: 13, lineHeight: 17, fontWeight: "900", marginTop: 3 },
  homeMissionCopy: { color: "#dbeafe", fontSize: 9, lineHeight: 13, fontWeight: "800", marginTop: 2 },
  homeMissionSignalRow: { flexDirection: "row", gap: 4, marginTop: 6 },
  homeMissionSignal: { flex: 1, color: "#c7d2fe", backgroundColor: "rgba(15,23,42,0.78)", borderColor: "rgba(125,211,252,0.18)", borderWidth: 1, borderRadius: 7, overflow: "hidden", paddingHorizontal: 5, paddingVertical: 3, fontSize: 8, lineHeight: 10, fontWeight: "900", textAlign: "center" },
  homeMissionSignalPrimary: { color: "#111827", backgroundColor: "#bbf7d0", borderColor: "rgba(187,247,208,0.54)" },
  homeCoachInline: { color: "#9bdcaa", fontSize: 9, lineHeight: 12, fontWeight: "900", marginTop: 7 },
  clientPlanPanel: { backgroundColor: "rgba(16,24,39,0.92)", borderColor: "rgba(125,211,252,0.30)", borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 6, zIndex: 2, shadowColor: "#38bdf8", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  clientPlanTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  clientPlanKicker: { color: "#7dd3fc", fontSize: 9, fontWeight: "900" },
  clientPlanBadge: { color: "#07111f", backgroundColor: "#7dd3fc", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2, fontSize: 9, fontWeight: "900" },
  clientPlanMain: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  clientPlanNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  clientPlanTitle: { color: "#f8fafc", fontSize: 12, fontWeight: "900" },
  clientPlanValue: { color: "#fbbf24", fontSize: 9, fontWeight: "900", marginLeft: "auto" },
  clientPlanText: { color: "#cbd5e1", fontSize: 9, lineHeight: 12, fontWeight: "800", marginTop: 2 },
  clientPlanChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  clientPlanMiniChip: { maxWidth: "34%", color: "#c7d2fe", backgroundColor: "rgba(30,41,59,0.92)", borderColor: "rgba(125,211,252,0.18)", borderWidth: 1, borderRadius: 7, overflow: "hidden", paddingHorizontal: 5, paddingVertical: 2, fontSize: 8, lineHeight: 10, fontWeight: "900" },
  clientPlanMiniChipGold: { color: "#111827", backgroundColor: "#fbbf24", borderColor: "rgba(254,243,199,0.6)" },
  clientPlanStatus: { marginTop: 6, backgroundColor: "rgba(34,197,94,0.14)", borderColor: "rgba(134,239,172,0.24)", borderWidth: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4 },
  clientPlanStatusText: { color: "#bbf7d0", fontSize: 9, lineHeight: 12, fontWeight: "900" },
  clientQuickPlanRow: { flexDirection: "row", gap: 5, marginTop: 7 },
  clientQuickPlanButton: { flex: 1, minHeight: 32, backgroundColor: "rgba(15,23,42,0.92)", borderColor: "rgba(125,211,252,0.20)", borderWidth: 1, borderRadius: 7, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  clientQuickPlanRecommended: { backgroundColor: "#1f2d12", borderColor: "rgba(251,191,36,0.46)" },
  clientQuickPlanText: { color: "#f8fafc", fontSize: 9, fontWeight: "900", textAlign: "center" },
  clientQuickPlanCost: { color: "#94a3b8", fontSize: 8, fontWeight: "900", marginTop: 1, textAlign: "center" },
  clientDetailButton: { width: 42, minHeight: 32, backgroundColor: "#7dd3fc", borderRadius: 7, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  clientDetailText: { color: "#07111f", fontSize: 9, fontWeight: "900", textAlign: "center" },
  clientPlanSteps: { flexDirection: "row", gap: 6, marginTop: 8 },
  clientPlanStep: { flex: 1, minWidth: 0 },
  clientPlanStepTop: { flexDirection: "row", justifyContent: "space-between", gap: 4, alignItems: "center" },
  clientPlanStepLabel: { color: "#dbeafe", fontSize: 8, fontWeight: "900" },
  clientPlanStepValue: { color: "#fbbf24", fontSize: 8, fontWeight: "900" },
  clientPlanStepValueGood: { color: "#86efac" },
  clientPlanTrack: { height: 5, backgroundColor: "#07120d", borderRadius: 8, overflow: "hidden", marginTop: 3 },
  clientPlanFill: { height: "100%", backgroundColor: "#fbbf24" },
  clientPlanFillGood: { backgroundColor: "#22c55e" },
  homeMetricRowClean: { flexDirection: "row", gap: 5, marginBottom: 6, zIndex: 2 },
  homeMetricCardClean: { flex: 1, minHeight: 48, borderRadius: 8, backgroundColor: "rgba(15,23,42,0.86)", borderColor: "rgba(125,211,252,0.16)", borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  homeMetricIcon: { color: "#7dd3fc", fontSize: 9, lineHeight: 11, fontWeight: "900" },
  homeMetricValue: { color: "#f8fafc", fontSize: 12, lineHeight: 15, fontWeight: "900", marginTop: 1, textAlign: "center" },
  homeMetricLabel: { color: "#9bdcaa", fontSize: 8, lineHeight: 10, fontWeight: "900", marginTop: 1, textAlign: "center" },
  homeCommandGrid: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 1, marginBottom: 6, zIndex: 2 },
  homeCommandButton: { flexGrow: 1, flexBasis: "31%", minHeight: 38, flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, backgroundColor: "rgba(15,23,42,0.88)", borderColor: "rgba(125,211,252,0.18)", borderWidth: 1, paddingHorizontal: 5, paddingVertical: 5 },
  homeCommandButtonAlert: { backgroundColor: "rgba(63,45,18,0.92)", borderColor: "rgba(251,191,36,0.48)" },
  homeCommandIcon: { width: 18, height: 18, borderRadius: 6, overflow: "hidden", backgroundColor: "rgba(125,211,252,0.18)", color: "#7dd3fc", fontSize: 9, lineHeight: 18, fontWeight: "900", textAlign: "center" },
  homeCommandTextBlock: { flex: 1, minWidth: 0 },
  homeCommandLabel: { color: "#f8fafc", fontSize: 9, lineHeight: 12, fontWeight: "900" },
  homeCommandValue: { color: "#9bdcaa", fontSize: 8, lineHeight: 10, fontWeight: "900", marginTop: 1 },
  homeWeekPlanPanel: { backgroundColor: "rgba(8,17,29,0.86)", borderColor: "rgba(251,191,36,0.24)", borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 6, marginBottom: 5, zIndex: 2 },
  homeWeekPlanTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 5 },
  homeWeekPlanTitle: { color: "#fbbf24", fontSize: 9, lineHeight: 12, fontWeight: "900" },
  homeWeekPlanBadge: { color: "#07111f", backgroundColor: "#fbbf24", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2, fontSize: 8, lineHeight: 10, fontWeight: "900" },
  homeWeekPlanRow: { flexDirection: "row", gap: 4 },
  homeWeekPlanChip: { flex: 1, minHeight: 25, borderRadius: 7, backgroundColor: "rgba(15,23,42,0.92)", borderColor: "rgba(125,211,252,0.18)", borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 2 },
  homeWeekPlanChipActive: { backgroundColor: "#f59e0b", borderColor: "#fbbf24" },
  homeWeekPlanChipLocked: { opacity: 0.45 },
  homeWeekPlanChipText: { color: "#dbeafe", fontSize: 8, lineHeight: 10, fontWeight: "900", textAlign: "center" },
  homeWeekPlanChipTextActive: { color: "#111827" },
  homeWeekPlanChipTextLocked: { color: "#94a3b8" },
  homeNavGridClean: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2, marginBottom: 6, zIndex: 2 },
  homeNavButtonClean: { width: "48.8%", minHeight: 38, borderRadius: 8, backgroundColor: "rgba(226,232,240,0.94)", borderColor: "rgba(15,23,42,0.18)", borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  homeNavLabelClean: { color: "#0f172a", fontSize: 11, lineHeight: 14, fontWeight: "900", textAlign: "center" },
  homeNavSubClean: { color: "#334155", fontSize: 8, lineHeight: 10, fontWeight: "900", marginTop: 1, textAlign: "center" },
  homeFocusCompact: { flexDirection: "row", alignItems: "center", gap: 6, zIndex: 2, marginBottom: 5 },
  focusHintClean: { flex: 1, marginTop: 0, textAlign: "left", backgroundColor: "rgba(15,23,42,0.70)", borderColor: "rgba(125,211,252,0.16)", borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5 },
  homeMiniAgendaButton: { minWidth: 62, minHeight: 26, borderRadius: 7, backgroundColor: "#fbbf24", alignItems: "center", justifyContent: "center", paddingHorizontal: 7 },
  homeMiniAgendaText: { color: "#111827", fontSize: 10, fontWeight: "900" },
  cashPressureBar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#152616", borderColor: "rgba(251,191,36,0.32)", borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 7, marginBottom: 8, zIndex: 2 },
  cashPressureBarDebt: { backgroundColor: "#2a1111", borderColor: "rgba(248,113,113,0.45)" },
  cashPressureKicker: { color: "#111827", backgroundColor: "#fbbf24", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2, fontSize: 9, fontWeight: "900" },
  cashPressureText: { flex: 1, color: "#fde68a", fontSize: 10, lineHeight: 13, fontWeight: "900" },
  homeStatusRow: { flexDirection: "row", gap: 7, marginBottom: 6, zIndex: 2 },
  homeStatusPill: { flex: 1, minHeight: 38, backgroundColor: "#0f172a", borderColor: "rgba(187,247,208,0.22)", borderWidth: 1, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  homeStatusValue: { color: "#f8fafc", fontSize: 13, fontWeight: "900", textAlign: "center" },
  homeStatusLabel: { color: "#9bdcaa", fontSize: 9, fontWeight: "900", marginTop: 1 },
  homeAchievementBar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(63,45,18,0.78)", borderColor: "rgba(251,191,36,0.34)", borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5, marginBottom: 6, zIndex: 2 },
  homeAchievementKicker: { color: "#111827", backgroundColor: "#fbbf24", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2, fontSize: 9, fontWeight: "900" },
  homeAchievementText: { flex: 1, color: "#fde68a", fontSize: 11, fontWeight: "900" },
  seasonPressureBox: { backgroundColor: "rgba(15,23,42,0.86)", borderColor: "rgba(251,191,36,0.24)", borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 12, zIndex: 2 },
  seasonPressureHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  seasonPressureKicker: { color: "#fbbf24", fontSize: 10, fontWeight: "900" },
  seasonPressureWindow: { borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 3, fontSize: 9, fontWeight: "900" },
  seasonWindowOpen: { color: "#052e16", backgroundColor: "#86efac" },
  seasonWindowClosed: { color: "#e2e8f0", backgroundColor: "#475569" },
  seasonTrack: { height: 7, backgroundColor: "#07120d", borderRadius: 8, overflow: "hidden", marginTop: 8 },
  seasonTrackFill: { height: "100%", backgroundColor: "#fbbf24" },
  seasonPressureStats: { flexDirection: "row", justifyContent: "space-between", gap: 7, marginTop: 7 },
  seasonPressureStat: { color: "#dbeafe", fontSize: 10, fontWeight: "900" },
  seasonAgendaMini: { gap: 4, marginTop: 8 },
  seasonAgendaLine: { color: "#cbd5e1", fontSize: 9, lineHeight: 13, fontWeight: "800" },
  weekCard: { width: 104, backgroundColor: "rgba(245,158,11,0.88)", borderRadius: 8, padding: 10, justifyContent: "center", alignItems: "center" },
  weekNumber: { color: "#111827", fontSize: 22, fontWeight: "900" },
  weekLabel: { color: "#111827", fontSize: 11, fontWeight: "800", textAlign: "center", marginTop: 2 },
  agendaAlert: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(15,23,42,0.82)", borderWidth: 1, borderColor: "#475569", borderRadius: 8, padding: 10, marginBottom: 10 },
  agendaAlertTitle: { color: "#fbbf24", fontSize: 11, fontWeight: "900" },
  agendaAlertText: { color: "#f8fafc", fontSize: 13, lineHeight: 17, fontWeight: "800" },
  agendaAlertCount: { color: "#111827", backgroundColor: "#fbbf24", minWidth: 26, textAlign: "center", borderRadius: 8, paddingVertical: 5, fontWeight: "900", overflow: "hidden" },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center", zIndex: 2 },
  actionTileMotion: { width: "48.7%" },
  actionTile: { position: "relative", overflow: "hidden", width: "100%", height: 54, backgroundColor: "#176d20", borderColor: "rgba(219,255,204,0.28)", borderWidth: 1, borderRadius: 7, padding: 7, alignItems: "center", justifyContent: "center", shadowColor: "#000000", shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  actionTileDanger: { backgroundColor: "#7f1d1d", borderColor: "rgba(252,165,165,0.42)" },
  homeTileIcon: { position: "absolute", top: 5, left: 6, width: 20, height: 20, borderRadius: 6, backgroundColor: "rgba(15,23,42,0.74)", borderWidth: 1, borderColor: "rgba(187,247,208,0.18)", alignItems: "center", justifyContent: "center" },
  homeTileIconText: { color: "#bbf7d0", fontSize: 10, fontWeight: "900" },
  homeTileText: { alignItems: "center", justifyContent: "center", paddingTop: 3, maxWidth: "100%" },
  actionTileValue: { color: "#f5ffef", fontSize: 15, lineHeight: 18, fontWeight: "900", textAlign: "center" },
  actionTileLabel: { color: "#dcf7cf", fontSize: 11, lineHeight: 14, fontWeight: "900", textAlign: "center", marginTop: 2 },
  homeStoryContinue: { position: "relative", overflow: "hidden", backgroundColor: "rgba(8,17,29,0.88)", borderColor: "rgba(125,211,252,0.26)", borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6, marginTop: 6, zIndex: 2, shadowColor: "#38bdf8", shadowOpacity: 0.09, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  homeStoryContinueTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  homeStoryContinueKicker: { color: "#7dd3fc", fontSize: 10, fontWeight: "900" },
  homeStoryContinueBadge: { color: "#07111f", backgroundColor: "#fbbf24", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2, fontSize: 9, fontWeight: "900" },
  homeStoryContinueTitle: { color: "#ffffff", fontSize: 13, lineHeight: 16, fontWeight: "900", marginTop: 4 },
  homeStoryContinueBody: { color: "#cbd5e1", fontSize: 9, lineHeight: 12, fontWeight: "800", marginTop: 2 },
  homeStoryChoiceRow: { flexDirection: "row", gap: 6, marginTop: 5 },
  homeStoryChoice: { flex: 1, minHeight: 26, borderRadius: 7, backgroundColor: "rgba(15,23,42,0.9)", borderColor: "rgba(148,163,184,0.25)", borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  homeStoryChoiceGold: { backgroundColor: "#f59e0b", borderColor: "#fbbf24" },
  homeStoryChoiceText: { color: "#f8fafc", fontSize: 10, fontWeight: "900", textAlign: "center" },
  homeUtilityRow: { flexDirection: "row", gap: 6, marginTop: 5, zIndex: 2 },
  homeUtilityButton: { flex: 1, minHeight: 27, borderRadius: 7, backgroundColor: "rgba(15,23,42,0.82)", borderColor: "rgba(187,247,208,0.18)", borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  homeUtilityText: { color: "#dbeafe", fontSize: 10, fontWeight: "900", textAlign: "center" },
  homeMiniFeed: { flexDirection: "row", gap: 6, marginTop: 6, zIndex: 2 },
  homeMiniFeedItem: { flex: 1, minHeight: 40, borderRadius: 8, backgroundColor: "rgba(8,17,29,0.8)", borderWidth: 1, borderColor: "rgba(125,211,252,0.18)", paddingHorizontal: 7, paddingVertical: 5, justifyContent: "center" },
  homeMiniFeedLabel: { color: "#7dd3fc", fontSize: 9, fontWeight: "900" },
  homeMiniFeedValue: { color: "#f8fafc", fontSize: 10, lineHeight: 13, fontWeight: "900", marginTop: 3 },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 16, zIndex: 2 },
  quickButton: { flexGrow: 1, minWidth: "45%", backgroundColor: "rgba(238,248,226,0.92)", borderRadius: 7, paddingVertical: 9, paddingHorizontal: 8, alignItems: "center", borderWidth: 1, borderColor: "rgba(27,94,32,0.25)" },
  quickButtonAccent: { backgroundColor: "#ef4444" },
  quickButtonText: { color: "#111827", fontSize: 12, fontWeight: "900", textAlign: "center" },
  quickButtonTextAccent: { color: "#ffffff" },
  focusStrip: { flexDirection: "row", gap: 5, marginTop: 6, zIndex: 2 },
  focusChip: { flex: 1, minHeight: 24, backgroundColor: "rgba(15,23,42,0.72)", borderColor: "rgba(187,247,208,0.14)", borderWidth: 1, borderRadius: 7, alignItems: "center", justifyContent: "center", paddingHorizontal: 2 },
  focusChipActive: { backgroundColor: "#f59e0b", borderColor: "#fbbf24" },
  focusChipLocked: { opacity: 0.42, backgroundColor: "rgba(15,23,42,0.9)" },
  focusChipText: { color: "#dbeafe", fontSize: 9, fontWeight: "900" },
  focusChipTextActive: { color: "#111827" },
  focusChipTextLocked: { color: "#94a3b8" },
  focusHint: { color: "#dff7dc", fontSize: 9, lineHeight: 12, fontWeight: "900", textAlign: "center", marginTop: 4, zIndex: 2 },
  focusHintDanger: { color: "#fecaca" },
  weekAdvanceButton: { backgroundColor: "#041c0c", borderRadius: 7, paddingVertical: 8, alignItems: "center", marginTop: 5, borderWidth: 1, borderColor: "rgba(187,247,208,0.32)", zIndex: 2 },
  weekAdvanceAttention: { backgroundColor: "#3f2d12", borderColor: "rgba(251,191,36,0.58)" },
  weekAdvanceDisabled: { opacity: 0.58 },
  weekAdvanceText: { color: "#f8fafc", fontSize: 15, fontWeight: "900" },
  weekAdvanceTextDark: { color: "#111827", fontSize: 15, fontWeight: "900" },
  homeDock: { flexDirection: "row", gap: 6, marginTop: 10, zIndex: 2 },
  homeDockButton: { flex: 1, minHeight: 34, borderRadius: 7, backgroundColor: "rgba(15,23,42,0.72)", borderWidth: 1, borderColor: "rgba(187,247,208,0.16)", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  homeDockText: { color: "#dff7dc", fontSize: 9, fontWeight: "900", textAlign: "center" },
  sideRailLeft: { position: "absolute", left: 8, bottom: 128, gap: 9, zIndex: 3 },
  sideRailRight: { position: "absolute", right: 8, top: 244, gap: 8, zIndex: 3 },
  railButton: { width: 32, height: 32, borderRadius: 7, backgroundColor: "rgba(116,121,29,0.84)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(244,255,211,0.24)", shadowColor: "#000000", shadowOpacity: 0.2, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  railText: { color: "#fff5b8", fontWeight: "900", fontSize: 10 },
  agendaPanel: { backgroundColor: "#101827", borderColor: "rgba(56,189,248,0.28)", borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, shadowColor: "#38bdf8", shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  agendaHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 },
  agendaTitle: { color: "#f8fafc", fontSize: 16, fontWeight: "900" },
  agendaState: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, fontSize: 10, fontWeight: "900", overflow: "hidden" },
  agendaOpen: { color: "#052e16", backgroundColor: "#86efac" },
  agendaClosed: { color: "#e2e8f0", backgroundColor: "#334155" },
  agendaTimeline: { gap: 7 },
  agendaItem: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#0f172a", borderRadius: 8, padding: 9, borderWidth: 1, borderColor: "rgba(148,163,184,0.15)" },
  agendaDot: { width: 12, height: 12, borderRadius: 12, borderWidth: 2, borderColor: "rgba(255,255,255,0.34)" },
  agendaItemTitle: { color: "#e2e8f0", fontSize: 12, fontWeight: "900" },
  agendaItemMeta: { color: "#94a3b8", fontSize: 10, fontWeight: "800", marginTop: 2 },
  pulsePanel: { backgroundColor: "#0d2119", borderColor: "rgba(134,239,172,0.28)", borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, shadowColor: "#22c55e", shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  pulseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 9 },
  pulseTitle: { color: "#f8fafc", fontSize: 16, fontWeight: "900" },
  pulseHint: { color: "#d9f99d", fontSize: 11, fontWeight: "900" },
  pulseGrid: { flexDirection: "row", gap: 7 },
  pulseCell: { flex: 1, minHeight: 58, backgroundColor: "rgba(15,23,42,0.72)", borderRadius: 8, borderWidth: 1, borderColor: "rgba(187,247,208,0.13)", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  pulseValue: { color: "#fbbf24", fontSize: 14, fontWeight: "900", textAlign: "center" },
  pulseLabel: { color: "#cbd5e1", fontSize: 10, fontWeight: "900", marginTop: 3, textAlign: "center" },
  pulseBarTrack: { height: 7, backgroundColor: "#07120d", borderRadius: 8, overflow: "hidden", marginTop: 10 },
  pulseBarFill: { height: "100%", backgroundColor: "#22c55e" },
  spotlightBox: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#07120d", borderRadius: 8, borderWidth: 1, borderColor: "rgba(187,247,208,0.14)", padding: 8, marginTop: 10 },
  spotlightTitle: { color: "#f8fafc", fontSize: 12, fontWeight: "900" },
  spotlightText: { color: "#94a3b8", fontSize: 10, fontWeight: "800", marginTop: 2 },
  spotlightArrow: { color: "#fbbf24", fontSize: 24, fontWeight: "900" },
  objectivePanel: { backgroundColor: "#121b2a", borderColor: "rgba(251,191,36,0.25)", borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, shadowColor: "#fbbf24", shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  objectiveHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 9 },
  objectiveTitle: { color: "#f8fafc", fontSize: 16, fontWeight: "900" },
  objectiveHint: { color: "#94a3b8", fontSize: 11, fontWeight: "800", marginTop: 2 },
  objectiveBadge: { color: "#111827", backgroundColor: "#fbbf24", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, fontSize: 11, fontWeight: "900", overflow: "hidden" },
  objectiveItem: { backgroundColor: "#0f172a", borderColor: "#334155", borderWidth: 1, borderRadius: 8, padding: 9, marginTop: 7 },
  objectiveItemTop: { flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "center" },
  objectiveName: { color: "#e2e8f0", fontSize: 12, fontWeight: "900", flex: 1 },
  objectivePercent: { color: "#fbbf24", fontSize: 12, fontWeight: "900" },
  objectiveCopy: { color: "#94a3b8", fontSize: 10, lineHeight: 14, fontWeight: "800", marginTop: 3 },
  objectiveTrack: { height: 7, backgroundColor: "#07120d", borderRadius: 8, overflow: "hidden", marginTop: 7 },
  objectiveFill: { height: "100%", backgroundColor: "#38bdf8" },
  objectiveReward: { color: "#bbf7d0", fontSize: 10, fontWeight: "900", marginTop: 6 },
  objectiveEmpty: { color: "#dbeafe", backgroundColor: "#0f172a", borderRadius: 8, padding: 10, fontSize: 12, fontWeight: "800" },
  achievementPanel: { backgroundColor: "#101827", borderColor: "rgba(251,191,36,0.28)", borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, shadowColor: "#fbbf24", shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  achievementBadge: { color: "#111827", backgroundColor: "#fbbf24", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, fontSize: 10, fontWeight: "900", overflow: "hidden" },
  achievementItem: { backgroundColor: "#0f172a", borderColor: "rgba(251,191,36,0.24)", borderWidth: 1, borderRadius: 8, padding: 9, marginTop: 7 },
  achievementFill: { height: "100%", backgroundColor: "#fbbf24" },
  reputationMilestonePanel: { backgroundColor: "#101827", borderColor: "rgba(125,211,252,0.24)", borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, shadowColor: "#38bdf8", shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  reputationMilestoneTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 9 },
  reputationMilestoneTitle: { color: "#f8fafc", fontSize: 16, fontWeight: "900" },
  reputationMilestoneCopy: { color: "#b6c6d8", fontSize: 11, lineHeight: 15, fontWeight: "800", marginTop: 2 },
  reputationMilestoneBadge: { minWidth: 38, textAlign: "center", color: "#06131f", backgroundColor: "#7dd3fc", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, fontSize: 13, fontWeight: "900", overflow: "hidden" },
  reputationLadder: { backgroundColor: "rgba(15,23,42,0.76)", borderColor: "rgba(251,191,36,0.26)", borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 9 },
  reputationLadderHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  reputationLadderTitle: { color: "#fbbf24", fontSize: 10, lineHeight: 13, fontWeight: "900" },
  reputationLadderNext: { flex: 1, color: "#dbeafe", fontSize: 9, lineHeight: 12, fontWeight: "900", textAlign: "right" },
  reputationLadderTrack: { height: 6, backgroundColor: "#07120d", borderRadius: 8, overflow: "hidden", marginTop: 7 },
  reputationLadderFill: { height: "100%", backgroundColor: "#fbbf24" },
  reputationLadderSteps: { flexDirection: "row", gap: 5, marginTop: 7 },
  reputationLadderStep: { flex: 1, minWidth: 0, borderRadius: 7, backgroundColor: "#111827", borderColor: "rgba(148,163,184,0.16)", borderWidth: 1, paddingHorizontal: 4, paddingVertical: 5, alignItems: "center" },
  reputationLadderStepOpen: { backgroundColor: "#12351f", borderColor: "rgba(134,239,172,0.34)" },
  reputationLadderRep: { color: "#fbbf24", fontSize: 10, lineHeight: 12, fontWeight: "900" },
  reputationLadderLabel: { color: "#f8fafc", fontSize: 8, lineHeight: 10, fontWeight: "900", marginTop: 2, textAlign: "center" },
  reputationLadderDetail: { color: "#94a3b8", fontSize: 7, lineHeight: 9, fontWeight: "800", marginTop: 1, textAlign: "center" },
  reputationMilestoneGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  reputationMilestoneItem: { width: "48.7%", minHeight: 73, backgroundColor: "#0f172a", borderColor: "rgba(125,211,252,0.16)", borderWidth: 1, borderRadius: 8, padding: 8, justifyContent: "space-between" },
  reputationMilestoneItemUnlocked: { backgroundColor: "#12351f", borderColor: "rgba(134,239,172,0.28)" },
  reputationMilestoneItemTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 5 },
  reputationMilestoneLabel: { color: "#dbeafe", fontSize: 10, lineHeight: 13, fontWeight: "900", flex: 1 },
  reputationMilestoneValue: { color: "#fbbf24", fontSize: 11, fontWeight: "900" },
  reputationMilestoneTrack: { height: 6, backgroundColor: "#07120d", borderRadius: 8, overflow: "hidden", marginTop: 6 },
  reputationMilestoneFill: { height: "100%", backgroundColor: "#38bdf8" },
  reputationMilestoneNote: { color: "#94a3b8", fontSize: 9, lineHeight: 12, fontWeight: "800", marginTop: 5 },
  reputationPanel: { backgroundColor: "#0d2119", borderColor: "rgba(134,239,172,0.28)", borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, shadowColor: "#22c55e", shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  reputationBadge: { minWidth: 36, textAlign: "center", color: "#052e16", backgroundColor: "#86efac", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, fontSize: 12, fontWeight: "900", overflow: "hidden" },
  reputationNextMove: { backgroundColor: "#101827", borderColor: "rgba(251,191,36,0.26)", borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 7, marginBottom: 8 },
  reputationNextKicker: { color: "#fbbf24", fontSize: 10, lineHeight: 13, fontWeight: "900" },
  reputationNextText: { color: "#dbeafe", fontSize: 10, lineHeight: 14, fontWeight: "800", marginTop: 2 },
  reputationActionRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#0f172a", borderColor: "rgba(134,239,172,0.18)", borderWidth: 1, borderRadius: 8, padding: 9, marginTop: 7 },
  reputationActionMuted: { opacity: 0.58 },
  intelPanel: { backgroundColor: "#151d2b", borderColor: "rgba(148,163,184,0.28)", borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, shadowColor: "#94a3b8", shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  intelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  intelTitle: { color: "#f8fafc", fontSize: 16, fontWeight: "900" },
  intelBadge: { color: "#111827", backgroundColor: "#f59e0b", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, fontSize: 11, fontWeight: "900" },
  intelEmpty: { color: "#cbd5e1", backgroundColor: "#111827", borderRadius: 8, padding: 10, fontSize: 12, marginBottom: 8 },
  offerCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#111827", borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: "#475569" },
  intelLine: { color: "#e2e8f0", fontSize: 12, lineHeight: 17, marginTop: 6, backgroundColor: "#0f172a", borderRadius: 8, padding: 8 },
  rivalLine: { backgroundColor: "#2b1620", borderColor: "#db2777", borderWidth: 1, borderRadius: 8, padding: 9, marginTop: 7 },
  rivalTitle: { color: "#f9a8d4", fontSize: 11, fontWeight: "900" },
  rivalText: { color: "#f8fafc", fontSize: 12, marginTop: 2, fontWeight: "800" },
  rankingBox: { marginTop: 8, backgroundColor: "#0f172a", borderRadius: 8, borderWidth: 1, borderColor: "#334155", padding: 10, gap: 6 },
  rankingTitle: { color: "#fbbf24", fontSize: 12, fontWeight: "900", marginBottom: 2 },
  rankingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, backgroundColor: "#111827", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 7 },
  rankingRowUser: { backgroundColor: "#14351f", borderColor: "#22c55e", borderWidth: 1 },
  rankingName: { color: "#e2e8f0", fontSize: 11, fontWeight: "900", flex: 1 },
  rankingScore: { color: "#f8fafc", fontSize: 12, fontWeight: "900" },
  opportunityBox: { marginTop: 8, backgroundColor: "#111827", borderRadius: 8, borderWidth: 1, borderColor: "#334155", padding: 10, gap: 7 },
  opportunityTitle: { color: "#fbbf24", fontSize: 12, fontWeight: "900" },
  opportunityRow: { flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "center" },
  opportunityName: { color: "#f8fafc", fontSize: 12, fontWeight: "900", flex: 1 },
  opportunityMeta: { color: "#94a3b8", fontSize: 10, fontWeight: "800", textAlign: "right", flex: 1 },
  empireHero: { backgroundColor: "#1f2937", borderWidth: 1, borderColor: "#475569", borderRadius: 8, padding: 14, marginBottom: 8 },
  empireLevel: { color: "#fbbf24", fontSize: 22, fontWeight: "900" },
  empireCopy: { color: "#cbd5e1", fontSize: 13, lineHeight: 19, marginTop: 6 },
  empireStats: { flexDirection: "row", gap: 8, marginTop: 12 },
  ethicsPanel: { backgroundColor: "#111827", borderColor: "rgba(251,191,36,0.24)", borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 10 },
  ethicsTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  ethicsTitle: { color: "#f8fafc", fontSize: 13, fontWeight: "900" },
  ethicsBadge: { color: "#052e16", backgroundColor: "#86efac", borderRadius: 8, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontWeight: "900" },
  ethicsBadgeRisk: { color: "#fff7ed", backgroundColor: "#b45309" },
  ethicsTrack: { height: 7, backgroundColor: "#0f172a", borderRadius: 8, overflow: "hidden", marginTop: 9 },
  ethicsFill: { height: "100%", backgroundColor: "#86efac" },
  ethicsFillRisk: { backgroundColor: "#fb923c" },
  ethicsCopy: { color: "#cbd5e1", fontSize: 11, lineHeight: 16, fontWeight: "800", marginTop: 8 },
  predictionCard: { backgroundColor: "#1f2937", borderColor: "#475569", borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(2,6,23,0.72)", justifyContent: "center", padding: 18 },
  modalStackGhostTwo: { position: "absolute", left: 34, right: 34, alignSelf: "center", height: 300, borderRadius: 10, backgroundColor: "rgba(15,23,42,0.54)", borderWidth: 1, borderColor: "rgba(148,163,184,0.12)", transform: [{ rotate: "4deg" }] },
  modalStackGhostOne: { position: "absolute", left: 26, right: 26, alignSelf: "center", height: 310, borderRadius: 10, backgroundColor: "rgba(15,23,42,0.72)", borderWidth: 1, borderColor: "rgba(251,191,36,0.12)", transform: [{ rotate: "-3deg" }] },
  cardModal: { position: "relative", overflow: "hidden", backgroundColor: "#172033", borderColor: "#475569", borderWidth: 1, borderRadius: 10, padding: 13, maxWidth: 430, width: "100%", alignSelf: "center", shadowColor: "#000000", shadowOpacity: 0.34, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  modalShine: { position: "absolute", right: -42, top: -46, width: 160, height: 160, borderRadius: 160, backgroundColor: "rgba(251,191,36,0.10)" },
  modalTopLine: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 9 },
  cardStoryStage: { borderRadius: 10, overflow: "hidden", marginBottom: 10, borderWidth: 1, borderColor: "rgba(251,191,36,0.20)", backgroundColor: "#07120d" },
  cardArtworkBanner: { height: 92, overflow: "hidden", justifyContent: "flex-end", backgroundColor: "#07120d" },
  cardArtworkImage: { borderRadius: 8, resizeMode: "contain" },
  cardArtworkShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(2,6,23,0.22)" },
  cardArtworkDrift: { position: "absolute", left: -36, top: 0, bottom: 0, width: 78, backgroundColor: "rgba(255,255,255,0.08)", transform: [{ skewX: "-18deg" }] },
  cardCastLayer: { ...StyleSheet.absoluteFillObject, zIndex: 2 },
  cardMiniActor: { position: "absolute", bottom: 8, alignItems: "center" },
  cardMiniAgent: { left: 26, width: 28, height: 52 },
  cardMiniCounter: { right: 30, width: 34, height: 58 },
  cardMiniCounterDanger: { right: 24 },
  cardMiniHead: { width: 16, height: 17, borderRadius: 5, backgroundColor: "#d6a16f", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  cardMiniCounterHead: { backgroundColor: "#c9895c" },
  cardMiniSuit: { marginTop: -1, width: 24, height: 27, borderRadius: 5, backgroundColor: "#0f172a", borderWidth: 1, borderColor: "rgba(125,211,252,0.28)" },
  cardMiniDesk: { marginTop: 2, width: 32, height: 22, borderRadius: 5, backgroundColor: "rgba(251,191,36,0.90)", borderWidth: 1, borderColor: "rgba(254,243,199,0.55)" },
  cardMiniTag: { marginTop: 2, color: "#111827", backgroundColor: "#fbbf24", borderRadius: 5, overflow: "hidden", paddingHorizontal: 4, paddingVertical: 1, fontSize: 7, lineHeight: 9, fontWeight: "900" },
  cardMiniSignal: { position: "absolute", right: 78, top: 18, width: 10, height: 10, borderRadius: 10, backgroundColor: "#7dd3fc", shadowColor: "#7dd3fc", shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  cardMiniSignalDanger: { backgroundColor: "#f97316", shadowColor: "#f97316" },
  cardArtworkLabel: { alignSelf: "flex-start", margin: 8, color: "#111827", backgroundColor: "#fbbf24", borderRadius: 7, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontWeight: "900" },
  cardStoryCaption: { paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: "rgba(251,191,36,0.16)", backgroundColor: "rgba(8,17,29,0.94)" },
  cardStoryKicker: { color: "#fbbf24", fontSize: 10, lineHeight: 13, fontWeight: "900" },
  cardStoryText: { color: "#dbeafe", fontSize: 11, lineHeight: 15, fontWeight: "800", marginTop: 2 },
  modalKicker: { color: "#fbbf24", fontSize: 11, fontWeight: "900" },
  modalMeta: { color: "#94a3b8", fontSize: 10, marginTop: 1 },
  modalTitle: { color: "#ffffff", fontSize: 19, lineHeight: 24, fontWeight: "900", marginBottom: 6 },
  modalBody: { color: "#dbeafe", fontSize: 13, lineHeight: 19 },
  modalContext: { backgroundColor: "#0f172a", borderColor: "#334155", borderWidth: 1, borderRadius: 8, padding: 8, marginTop: 8 },
  modalContextText: { color: "#cbd5e1", fontSize: 10, lineHeight: 14, fontWeight: "800" },
  cardClock: { flexDirection: "row", gap: 6, marginTop: 9 },
  cardClockTick: { flex: 1, height: 5, borderRadius: 8, backgroundColor: "#fbbf24" },
  modalEffects: { gap: 6, marginTop: 9 },
  cardDecisionHeader: { color: "#f8fafc", fontSize: 11, lineHeight: 14, fontWeight: "900" },
  cardDecisionGrid: { flexDirection: "row", gap: 7 },
  cardDecisionMotion: { flex: 1, minWidth: 0 },
  cardDecisionChoice: { minHeight: 88, borderRadius: 9, borderWidth: 1, padding: 8, justifyContent: "space-between" },
  cardDecisionGood: { backgroundColor: "rgba(20,83,45,0.82)", borderColor: "rgba(134,239,172,0.34)" },
  cardDecisionWarn: { backgroundColor: "rgba(63,45,18,0.86)", borderColor: "rgba(251,146,60,0.34)" },
  cardDecisionPreferred: { borderColor: "#fbbf24", shadowColor: "#fbbf24", shadowOpacity: 0.18, shadowRadius: 9, shadowOffset: { width: 0, height: 4 } },
  cardDecisionTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 },
  cardDecisionLabel: { color: "#ffffff", fontSize: 12, lineHeight: 15, fontWeight: "900" },
  cardDecisionTag: { color: "#111827", backgroundColor: "#fbbf24", borderRadius: 7, overflow: "hidden", paddingHorizontal: 5, paddingVertical: 2, fontSize: 8, lineHeight: 10, fontWeight: "900" },
  cardDecisionSub: { color: "#dbeafe", fontSize: 9, lineHeight: 12, fontWeight: "800", marginTop: 3 },
  cardDecisionPills: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 },
  cardDecisionPill: { color: "#cbd5e1", backgroundColor: "rgba(15,23,42,0.68)", borderRadius: 6, overflow: "hidden", paddingHorizontal: 5, paddingVertical: 2, fontSize: 8, lineHeight: 10, fontWeight: "900" },
  cardDecisionPillGood: { color: "#bbf7d0", backgroundColor: "rgba(20,83,45,0.72)" },
  cardDecisionPillBad: { color: "#fed7aa", backgroundColor: "rgba(124,45,18,0.72)" },
  cardDecisionPillCost: { color: "#fde68a", backgroundColor: "rgba(113,63,18,0.76)" },
  modalActions: { flexDirection: "row", gap: 8, marginTop: 11, flexWrap: "wrap" },
  modalActionMotion: { flexGrow: 1, minWidth: 96 },
  modalAgendaButton: { marginTop: 10, borderRadius: 8, borderWidth: 1, borderColor: "#64748b", paddingVertical: 10, alignItems: "center" },
  modalAgendaText: { color: "#cbd5e1", fontSize: 12, fontWeight: "900" },
  decisionFlash: { position: "absolute", left: 14, right: 14, bottom: 78, backgroundColor: "#14532d", borderColor: "#22c55e", borderWidth: 1, borderRadius: 8, padding: 12, zIndex: 20 },
  decisionFlashBad: { backgroundColor: "#4a2508", borderColor: "#f97316" },
  decisionFlashNeutral: { backgroundColor: "#1f2937", borderColor: "#64748b" },
  decisionFlashTitle: { color: "#ffffff", fontSize: 13, fontWeight: "900" },
  decisionFlashText: { color: "#dbeafe", fontSize: 12, marginTop: 3 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  panel: { width: "47.8%", backgroundColor: "#1f2937", borderColor: "#475569", borderWidth: 1, borderRadius: 8, padding: 14, minHeight: 82 },
  panelValue: { color: "#f8fafc", fontSize: 22, fontWeight: "900" },
  panelTitle: { color: "#cbd5e1", fontSize: 12, marginTop: 6 },
  nextButton: { backgroundColor: "#f59e0b", borderRadius: 8, padding: 15, alignItems: "center", marginVertical: 14 },
  disabledButton: { backgroundColor: "#64748b" },
  nextButtonText: { color: "#111827", fontWeight: "900", fontSize: 15 },
  matchCenter: { position: "relative", width: "100%", maxWidth: 420, alignSelf: "center", backgroundColor: "#08131f", borderColor: "#256f4b", borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 12, overflow: "hidden", shadowColor: "#22c55e", shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  magicTopGlow: { position: "absolute", left: 18, right: 18, top: 0, height: 2, backgroundColor: "#86efac", opacity: 0.9 },
  matchHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  matchTeam: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  matchTeamRight: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8 },
  matchTeamName: { color: "#f0fff2", fontSize: 12, fontWeight: "800", flexShrink: 1 },
  scoreBox: { minWidth: 70, alignItems: "center", backgroundColor: "#0f172a", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10 },
  scoreText: { color: "#ffffff", fontSize: 22, fontWeight: "900" },
  minuteText: { color: "#fbbf24", fontSize: 11, fontWeight: "900", marginTop: 2 },
  scoreboardCard: { position: "relative", backgroundColor: "rgba(15,23,42,0.94)", borderRadius: 8, borderWidth: 1, borderColor: "rgba(134,239,172,0.24)", padding: 10, overflow: "hidden" },
  scoreboardGrid: { ...StyleSheet.absoluteFillObject, opacity: 0.28, borderWidth: 1, borderColor: "rgba(148,163,184,0.12)" },
  scoreboardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 },
  scoreboardLeague: { color: "#94a3b8", fontSize: 10, fontWeight: "900" },
  scoreboardStatus: { color: "#052e16", backgroundColor: "#86efac", borderRadius: 8, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontWeight: "900" },
  scoreboardMain: { flexDirection: "row", alignItems: "center", gap: 8 },
  scoreboardTeam: { flex: 1, alignItems: "flex-start", gap: 6 },
  scoreboardTeamRight: { flex: 1, alignItems: "flex-end", gap: 6 },
  scoreboardTeamName: { color: "#f8fafc", fontSize: 12, lineHeight: 16, fontWeight: "900", minHeight: 32 },
  scoreboardTeamNameRight: { color: "#f8fafc", fontSize: 12, lineHeight: 16, fontWeight: "900", minHeight: 32, textAlign: "right" },
  scoreboardScoreShell: { minWidth: 112, minHeight: 82, borderRadius: 8, backgroundColor: "#020617", borderWidth: 1, borderColor: "rgba(251,191,36,0.32)", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingTop: 12, shadowColor: "#fbbf24", shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  scoreboardMinute: { position: "absolute", top: 7, alignSelf: "center", backgroundColor: "#172033", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: "rgba(148,163,184,0.2)" },
  scoreboardMinuteText: { color: "#fbbf24", fontSize: 10, fontWeight: "900" },
  scoreboardScore: { color: "#ffffff", fontSize: 32, lineHeight: 38, fontWeight: "900" },
  scoreboardDash: { color: "#64748b", fontSize: 22, fontWeight: "900", marginHorizontal: 6 },
  scoreboardStats: { flexDirection: "row", gap: 6, marginTop: 10 },
  matchStatPill: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5, minWidth: 48, alignItems: "center", backgroundColor: "rgba(15,23,42,0.82)" },
  matchStatPill_home: { borderColor: "rgba(239,68,68,0.42)" },
  matchStatPill_away: { borderColor: "rgba(37,99,235,0.46)" },
  matchStatPill_gold: { borderColor: "rgba(251,191,36,0.44)", flex: 1 },
  matchStatLabel: { color: "#94a3b8", fontSize: 9, fontWeight: "900" },
  matchStatValue: { color: "#f8fafc", fontSize: 12, fontWeight: "900", marginTop: 1 },
  momentumBox: { marginTop: 12, backgroundColor: "#0f172a", borderRadius: 8, borderWidth: 1, borderColor: "#334155", padding: 10 },
  momentumHeader: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginBottom: 8 },
  momentumLabel: { color: "#fbbf24", fontSize: 12, fontWeight: "900" },
  momentumSide: { color: "#e2e8f0", fontSize: 12, fontWeight: "800", flex: 1, textAlign: "right" },
  momentumTrack: { height: 12, borderRadius: 8, overflow: "hidden", flexDirection: "row", backgroundColor: "#111827" },
  momentumHome: { backgroundColor: "#ef4444", height: "100%" },
  momentumAway: { backgroundColor: "#2563eb", height: "100%" },
  momentumNumbers: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  momentumNumber: { color: "#94a3b8", fontSize: 11, fontWeight: "800" },
  clientWatchBox: { marginTop: 8, backgroundColor: "#101827", borderRadius: 8, borderWidth: 1, borderColor: "rgba(125,211,252,0.22)", padding: 10, gap: 7 },
  clientWatchHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  clientWatchTitle: { color: "#7dd3fc", fontSize: 12, fontWeight: "900" },
  clientWatchBadge: { color: "#082f49", backgroundColor: "#7dd3fc", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2, fontSize: 10, fontWeight: "900" },
  clientWatchReason: { color: "#bae6fd", fontSize: 10, lineHeight: 14, fontWeight: "800" },
  clientWatchRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0f172a", borderRadius: 7, padding: 7 },
  clientWatchName: { color: "#f8fafc", fontSize: 12, fontWeight: "900" },
  clientWatchMeta: { color: "#cbd5e1", fontSize: 10, lineHeight: 14, fontWeight: "800", marginTop: 2 },
  clientWatchQueue: { color: "#94a3b8", fontSize: 10, lineHeight: 14, fontWeight: "800", borderTopWidth: 1, borderTopColor: "rgba(125,211,252,0.16)", paddingTop: 6 },
  matchMathStrip: { flexDirection: "row", alignItems: "stretch", gap: 6, marginTop: 8 },
  matchMathCell: { width: 42, backgroundColor: "#07120d", borderRadius: 8, alignItems: "center", justifyContent: "center", paddingVertical: 7, borderWidth: 1, borderColor: "rgba(187,247,208,0.13)" },
  matchMathValue: { color: "#f8fafc", fontSize: 13, fontWeight: "900" },
  matchMathLabel: { color: "#86efac", fontSize: 9, fontWeight: "900", marginTop: 1 },
  matchMathNote: { flex: 1, backgroundColor: "rgba(15,23,42,0.72)", borderRadius: 8, padding: 8, justifyContent: "center", borderWidth: 1, borderColor: "rgba(148,163,184,0.16)" },
  matchMathNoteText: { color: "#e2e8f0", fontSize: 10, lineHeight: 14, fontWeight: "800", textAlign: "center" },
  attackPitch: { height: 44, backgroundColor: "#0b4d18", borderRadius: 8, overflow: "hidden", marginTop: 12, borderWidth: 1, borderColor: "rgba(222,255,223,0.18)" },
  attackMidline: { position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(222,255,223,0.45)", zIndex: 3 },
  attackPressureHome: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: "rgba(66,194,93,0.38)" },
  attackPressureAway: { position: "absolute", right: 0, top: 0, bottom: 0, backgroundColor: "rgba(45,108,223,0.34)" },
  attackLabel: { position: "absolute", alignSelf: "center", top: 13, color: "#eaffec", fontSize: 11, fontWeight: "900", zIndex: 4 },
  livePitchWrap: { marginTop: 12, backgroundColor: "#111827", borderRadius: 8, borderWidth: 1, borderColor: "rgba(134,239,172,0.24)", overflow: "hidden" },
  pitchScoreStrip: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10, paddingVertical: 8, backgroundColor: "#08111d", borderBottomWidth: 1, borderBottomColor: "rgba(134,239,172,0.14)" },
  pitchStripText: { color: "#d8f3dc", fontSize: 11, fontWeight: "800", flex: 1 },
  pitchStripTextRight: { color: "#d8f3dc", fontSize: 11, fontWeight: "800", flex: 1, textAlign: "right" },
  pitchStripCenter: { color: "#fbbf24", fontSize: 10, fontWeight: "900" },
  livePitch: { height: 188, backgroundColor: "#115e31", position: "relative", overflow: "hidden" },
  pitchAmbientGlow: { position: "absolute", left: "18%", right: "18%", top: "18%", height: "64%", borderRadius: 999, backgroundColor: "rgba(187,247,208,0.12)", zIndex: 0 },
  pitchStripe: { position: "absolute", top: 0, bottom: 0, width: "6.25%", backgroundColor: "rgba(255,255,255,0.055)" },
  pitchHorizontalLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,0.045)" },
  pathSvg: { ...StyleSheet.absoluteFillObject, zIndex: 2 },
  liveHalfLine: { position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, backgroundColor: "rgba(222,255,223,0.48)" },
  liveCircle: { position: "absolute", left: "50%", top: "50%", width: 62, height: 62, marginLeft: -31, marginTop: -31, borderRadius: 62, borderWidth: 2, borderColor: "rgba(222,255,223,0.42)" },
  liveBoxLeft: { position: "absolute", left: -2, top: 43, width: 42, height: 92, borderWidth: 2, borderColor: "rgba(222,255,223,0.42)" },
  liveBoxRight: { position: "absolute", right: -2, top: 43, width: 42, height: 92, borderWidth: 2, borderColor: "rgba(222,255,223,0.42)" },
  zoneGlow: { position: "absolute", width: "38%", height: "29%", borderRadius: 999, backgroundColor: "#fbbf24", zIndex: 1, shadowColor: "#fbbf24", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  playerDot: { position: "absolute", width: 13, height: 13, marginLeft: -6, marginTop: -6, borderRadius: 13, borderWidth: 2, borderColor: "#ffffff", zIndex: 3, shadowColor: "#000000", shadowOpacity: 0.35, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  homeDot: { backgroundColor: "#ef4444" },
  awayDot: { backgroundColor: "#2563eb" },
  ball: { position: "absolute", width: 15, height: 15, marginLeft: -7, marginTop: -7, borderRadius: 15, backgroundColor: "#ffffff", borderWidth: 2, borderColor: "#111111", zIndex: 6, shadowColor: "#ffffff", shadowOpacity: 0.8, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  goalBall: { backgroundColor: "#ffd43b", width: 19, height: 19, marginLeft: -9, marginTop: -9 },
  attackArrow: { position: "absolute", right: 12, top: 76, width: 30, height: 26, borderRadius: 8, backgroundColor: "rgba(15,23,42,0.78)", alignItems: "center", justifyContent: "center", zIndex: 7 },
  attackArrowAway: { left: 12, right: undefined },
  attackArrowText: { color: "#ffffff", fontWeight: "900", fontSize: 16 },
  pitchInfoRow: { flexDirection: "row", justifyContent: "space-between", gap: 8, padding: 10, backgroundColor: "#0f172a" },
  pitchInfo: { color: "#e2e8f0", fontSize: 12, flex: 1 },
  pitchInfoStrong: { color: "#fbbf24", fontSize: 12, fontWeight: "900" },
  feedBox: { marginTop: 10, gap: 6 },
  feedLine: { flexDirection: "row", gap: 8, backgroundColor: "#0f172a", borderRadius: 8, padding: 9, alignItems: "center" },
  goalLine: { backgroundColor: "#3f2d12", borderColor: "#f59e0b", borderWidth: 1 },
  feedMinute: { color: "#fbbf24", width: 34, fontWeight: "900", fontSize: 12 },
  feedText: { color: "#e2e8f0", flex: 1, fontSize: 12, lineHeight: 17 },
  feedActionText: { color: "#93c5fd", fontSize: 10, lineHeight: 14, fontWeight: "900", marginTop: 2 },
  dangerButton: { backgroundColor: "#b91c1c", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 12 },
  dataPackHelp: { backgroundColor: "#10251b", borderColor: "#235c38", borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 10 },
  dataPackTitle: { color: "#fbbf24", fontSize: 14, fontWeight: "900" },
  dataPackText: { color: "#dbeafe", fontSize: 12, lineHeight: 18, marginTop: 6, fontWeight: "800" },
  dataPackCode: { color: "#bbf7d0", backgroundColor: "#07120d", borderRadius: 8, padding: 8, marginTop: 8, fontSize: 11, fontWeight: "900" },
  readinessHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  readinessScore: { minWidth: 54, textAlign: "center", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 8, overflow: "hidden", fontSize: 15, fontWeight: "900" },
  readinessScoreGood: { color: "#052e16", backgroundColor: "#86efac" },
  readinessScoreWarn: { color: "#111827", backgroundColor: "#fbbf24" },
  readinessGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 10 },
  readinessCheck: { flexBasis: "48%", flexGrow: 1, minHeight: 46, borderRadius: 8, borderWidth: 1, padding: 8, flexDirection: "row", alignItems: "center", gap: 7 },
  readinessCheckOk: { backgroundColor: "rgba(20,83,45,0.72)", borderColor: "rgba(134,239,172,0.30)" },
  readinessCheckWarn: { backgroundColor: "rgba(113,63,18,0.72)", borderColor: "rgba(251,191,36,0.38)" },
  readinessCheckMark: { width: 24, textAlign: "center", color: "#f8fafc", fontSize: 10, fontWeight: "900" },
  readinessCheckText: { flex: 1, color: "#e5e7eb", fontSize: 11, lineHeight: 15, fontWeight: "900" },
  readinessRisk: { color: "#fed7aa", fontSize: 11, lineHeight: 16, fontWeight: "800", marginTop: 6 },
  inboxHero: { position: "relative", borderRadius: 8, borderWidth: 1, borderColor: "rgba(251,191,36,0.25)", padding: 13, overflow: "hidden", marginBottom: 10, shadowColor: "#fbbf24", shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  inboxHeroGlow: { position: "absolute", right: -42, top: -58, width: 180, height: 180, borderRadius: 180, backgroundColor: "rgba(251,191,36,0.18)" },
  inboxKicker: { color: "#7dd3fc", fontSize: 10, fontWeight: "900" },
  inboxTitleWrap: { marginTop: 3 },
  inboxTitle: { color: "#f8fafc", fontSize: 25, lineHeight: 30, fontWeight: "900" },
  inboxCopy: { color: "#dbeafe", fontSize: 12, lineHeight: 18, fontWeight: "800", marginTop: 7, maxWidth: 360 },
  inboxStatRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  inboxStat: { flex: 1, minHeight: 58, borderRadius: 8, backgroundColor: "rgba(15,23,42,0.82)", borderWidth: 1, borderColor: "rgba(148,163,184,0.20)", alignItems: "center", justifyContent: "center", padding: 8 },
  inboxStatGold: { borderColor: "rgba(251,191,36,0.42)", backgroundColor: "rgba(63,45,18,0.72)" },
  inboxStatGreen: { borderColor: "rgba(34,197,94,0.42)", backgroundColor: "rgba(20,83,45,0.55)" },
  inboxStatRed: { borderColor: "rgba(248,113,113,0.42)", backgroundColor: "rgba(69,10,10,0.58)" },
  inboxStatValue: { color: "#ffffff", fontSize: 18, fontWeight: "900" },
  inboxStatLabel: { color: "#cbd5e1", fontSize: 10, fontWeight: "900", marginTop: 2 },
  inboxCommandGrid: { flexDirection: "row", gap: 8, marginBottom: 12 },
  inboxCommand: { flex: 1, minHeight: 124, backgroundColor: "#101827", borderColor: "rgba(148,163,184,0.18)", borderWidth: 1, borderRadius: 8, padding: 10, justifyContent: "space-between" },
  inboxCommandHot: { borderColor: "rgba(251,191,36,0.45)", backgroundColor: "#261f12" },
  inboxCommandOffer: { borderColor: "rgba(34,197,94,0.40)", backgroundColor: "#10251b" },
  inboxCommandLabel: { color: "#93c5fd", fontSize: 10, fontWeight: "900" },
  inboxCommandTitle: { color: "#f8fafc", fontSize: 14, lineHeight: 18, fontWeight: "900", marginTop: 6 },
  inboxCommandMeta: { color: "#cbd5e1", fontSize: 10, lineHeight: 15, fontWeight: "800", marginTop: 8 },
  offerLedger: { backgroundColor: "#101827", borderColor: "rgba(34,197,94,0.28)", borderWidth: 1, borderRadius: 8, overflow: "hidden", marginBottom: 10 },
  offerLedgerTop: { minHeight: 42, backgroundColor: "#0d2a1d", borderBottomWidth: 1, borderBottomColor: "rgba(134,239,172,0.18)", paddingHorizontal: 10, paddingVertical: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  offerLedgerTitle: { color: "#f8fafc", fontSize: 14, fontWeight: "900" },
  offerLedgerBadge: { color: "#052e16", backgroundColor: "#86efac", borderRadius: 7, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 2, fontSize: 10, fontWeight: "900" },
  offerLedgerHead: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 28, paddingHorizontal: 8, backgroundColor: "#1f2937" },
  offerLedgerRow: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 52, paddingHorizontal: 8, paddingVertical: 7, borderTopWidth: 1, borderTopColor: "rgba(148,163,184,0.12)", backgroundColor: "#111827" },
  offerColPlayer: { flex: 1.05, minWidth: 0, color: "#cbd5e1", fontSize: 9, fontWeight: "900" },
  offerColClub: { flex: 0.95, minWidth: 0, color: "#cbd5e1", fontSize: 9, fontWeight: "900" },
  offerColMoney: { width: 58, color: "#fbbf24", fontSize: 10, fontWeight: "900", textAlign: "right" },
  offerColChance: { width: 30, color: "#dbeafe", fontSize: 11, fontWeight: "900", textAlign: "center" },
  offerChanceHot: { color: "#86efac" },
  offerPlayerName: { color: "#f8fafc", fontSize: 11, lineHeight: 14, fontWeight: "900", textTransform: "none" },
  offerClubName: { color: "#dbeafe", fontSize: 11, lineHeight: 14, fontWeight: "900", textTransform: "none" },
  offerPlayerMeta: { color: "#94a3b8", fontSize: 8, lineHeight: 11, fontWeight: "800", marginTop: 2, textTransform: "none" },
  inboxSectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 8, marginBottom: 8 },
  inboxSectionTitle: { color: "#f8fafc", fontSize: 15, fontWeight: "900" },
  inboxSectionBadge: { color: "#111827", backgroundColor: "#fbbf24", borderRadius: 7, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 2, fontSize: 11, fontWeight: "900" },
  inboxFeedPanel: { backgroundColor: "#101827", borderColor: "rgba(56,189,248,0.20)", borderWidth: 1, borderRadius: 8, padding: 9, gap: 7, marginBottom: 8 },
  inboxFeedLine: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#0f172a", borderRadius: 8, padding: 8 },
  inboxFeedDot: { width: 8, height: 8, borderRadius: 8, backgroundColor: "#fbbf24", marginTop: 5 },
  inboxFeedDotIntel: { backgroundColor: "#38bdf8" },
  inboxFeedText: { color: "#e2e8f0", flex: 1, fontSize: 12, lineHeight: 17, fontWeight: "800" },
  inboxEmpty: { color: "#94a3b8", fontSize: 12, lineHeight: 17, fontWeight: "800", padding: 8 },
  inboxOpsGrid: { flexDirection: "row", gap: 8, marginBottom: 8 },
  inboxOpsCard: { flex: 1, minHeight: 96, backgroundColor: "#101827", borderColor: "rgba(148,163,184,0.20)", borderWidth: 1, borderRadius: 8, padding: 9 },
  inboxOpsValue: { color: "#fbbf24", fontSize: 18, fontWeight: "900" },
  inboxOpsLabel: { color: "#f8fafc", fontSize: 11, fontWeight: "900", marginTop: 2 },
  inboxOpsCopy: { color: "#cbd5e1", fontSize: 10, lineHeight: 14, fontWeight: "800", marginTop: 5 },
  inboxStoryCard: { flexDirection: "row", gap: 9, backgroundColor: "#101827", borderColor: "rgba(148,163,184,0.18)", borderWidth: 1, borderRadius: 8, padding: 9, marginBottom: 7 },
  inboxStoryWeek: { color: "#111827", backgroundColor: "#7dd3fc", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 4, fontSize: 10, fontWeight: "900", alignSelf: "flex-start" },
  inboxStoryTitle: { color: "#f8fafc", fontSize: 12, fontWeight: "900" },
  inboxStoryBody: { color: "#cbd5e1", fontSize: 11, lineHeight: 16, fontWeight: "800", marginTop: 3 },
  sectionTitleWrap: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 14, marginBottom: 8 },
  sectionTitleRail: { width: 4, height: 17, borderRadius: 6, backgroundColor: "#fbbf24" },
  sectionTitle: { color: "#f8fafc", fontWeight: "900", fontSize: 15, lineHeight: 19 },
  newsLine: { color: "#e2e8f0", backgroundColor: "rgba(15,23,42,0.88)", borderColor: "rgba(125,211,252,0.14)", borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, marginBottom: 7, fontSize: 12, lineHeight: 16, fontWeight: "800" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(15,23,42,0.88)", borderColor: "rgba(148,163,184,0.14)", borderWidth: 1, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10, marginBottom: 6, gap: 8 },
  rowLeft: { color: "#e2e8f0", flex: 1, fontSize: 12, lineHeight: 15, fontWeight: "800" },
  rowRight: { color: "#fbbf24", fontWeight: "900", fontSize: 12 },
  listCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(15,23,42,0.92)", borderColor: "rgba(125,211,252,0.16)", borderWidth: 1, borderRadius: 12, padding: 11, marginBottom: 9, shadowColor: "#000000", shadowOpacity: 0.16, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  playerListCard: { flexDirection: "column", alignItems: "stretch" },
  playerCardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  selected: { borderColor: "rgba(251,191,36,0.72)", backgroundColor: "rgba(63,45,18,0.48)" },
  relationTrack: { height: 6, backgroundColor: "#0f172a", borderRadius: 8, overflow: "hidden", marginTop: 7 },
  relationFill: { height: "100%", backgroundColor: "#22c55e" },
  leagueTablePanel: { backgroundColor: "#111827", borderColor: "rgba(125,211,252,0.22)", borderWidth: 1, borderRadius: 8, overflow: "hidden", marginBottom: 12 },
  leagueTableTop: { minHeight: 44, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: "#062b16", borderBottomWidth: 1, borderBottomColor: "rgba(134,239,172,0.2)", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  leagueTableTitle: { color: "#f8fafc", fontSize: 15, fontWeight: "900", flex: 1 },
  leagueTableBadge: { color: "#052e16", backgroundColor: "#86efac", borderRadius: 7, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontWeight: "900" },
  leagueTableHeader: { flexDirection: "row", alignItems: "center", backgroundColor: "#1f2937", paddingHorizontal: 8, minHeight: 28, gap: 5 },
  leagueHeaderText: { color: "#cbd5e1", fontSize: 9, fontWeight: "900" },
  leagueTableRow: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 46, paddingHorizontal: 8, paddingVertical: 5, borderTopWidth: 1, borderTopColor: "rgba(148,163,184,0.12)", backgroundColor: "#101827" },
  leagueTableRowSelected: { backgroundColor: "#174b2a", borderTopColor: "rgba(134,239,172,0.38)" },
  leagueTableRowDim: { opacity: 0.72 },
  leagueColClub: { flex: 1, minWidth: 0 },
  leagueClubNameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  leagueRank: { width: 18, color: "#94a3b8", fontSize: 10, fontWeight: "900", textAlign: "right" },
  leagueClubName: { color: "#f8fafc", fontSize: 11, fontWeight: "900", flex: 1 },
  leagueClubMeta: { color: "#94a3b8", fontSize: 8, lineHeight: 11, fontWeight: "800", marginTop: 2, marginLeft: 23 },
  leagueColTiny: { width: 24, color: "#dbeafe", fontSize: 10, fontWeight: "900", textAlign: "center" },
  leaguePoints: { color: "#fbbf24" },
  leagueColNeed: { width: 34, color: "#bbf7d0", fontSize: 9, fontWeight: "900", textAlign: "center" },
  portfolioAlert: { backgroundColor: "rgba(13,42,29,0.9)", borderColor: "rgba(134,239,172,0.22)", borderWidth: 1, borderRadius: 12, padding: 11, marginBottom: 10 },
  leaderPanel: { backgroundColor: "rgba(15,23,42,0.9)", borderColor: "rgba(125,211,252,0.14)", borderWidth: 1, borderRadius: 12, padding: 11, marginBottom: 10 },
  portfolioAlertTitle: { color: "#fbbf24", fontSize: 12, lineHeight: 15, fontWeight: "900", marginBottom: 5 },
  portfolioAlertText: { color: "#dbeafe", fontSize: 10, lineHeight: 15, fontWeight: "800" },
  marketFilterRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  marketFilterChip: { flexGrow: 1, minHeight: 32, borderRadius: 9, backgroundColor: "rgba(15,23,42,0.9)", borderColor: "rgba(148,163,184,0.18)", borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  marketFilterChipActive: { backgroundColor: "#86efac", borderColor: "#bbf7d0" },
  marketFilterText: { color: "#cbd5e1", fontSize: 11, fontWeight: "900" },
  marketFilterTextActive: { color: "#052e16" },
  scoutActionPanel: { backgroundColor: "rgba(16,24,39,0.92)", borderColor: "rgba(56,189,248,0.22)", borderWidth: 1, borderRadius: 12, padding: 11, marginBottom: 10, gap: 8 },
  scoutPanelHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  scoutPanelTitle: { color: "#f8fafc", fontSize: 13, fontWeight: "900" },
  scoutPanelBadge: { color: "#052e16", backgroundColor: "#7dd3fc", borderRadius: 7, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontWeight: "900" },
  scoutPanelExplain: { color: "#bae6fd", fontSize: 10, lineHeight: 14, fontWeight: "800", backgroundColor: "rgba(15,23,42,0.72)", borderColor: "rgba(125,211,252,0.14)", borderWidth: 1, borderRadius: 8, padding: 8 },
  scoutCandidateCard: { backgroundColor: "rgba(15,23,42,0.92)", borderColor: "rgba(148,163,184,0.16)", borderWidth: 1, borderRadius: 12, padding: 9, gap: 8 },
  scoutCandidateCardHot: { borderColor: "rgba(251,191,36,0.34)", backgroundColor: "rgba(31,41,18,0.92)" },
  scoutCandidateRow: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "rgba(15,23,42,0.92)", borderColor: "rgba(148,163,184,0.16)", borderWidth: 1, borderRadius: 12, padding: 9 },
  scoutCandidateTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  pitchChoiceRow: { flexDirection: "row", gap: 7 },
  pitchChoiceButton: { flex: 1, minHeight: 74, borderRadius: 8, backgroundColor: "#10251b", borderWidth: 1, borderColor: "rgba(134,239,172,0.28)", alignItems: "center", justifyContent: "center", paddingHorizontal: 5, paddingVertical: 6 },
  pitchChoiceRisk: { backgroundColor: "#261f12", borderColor: "rgba(251,191,36,0.36)" },
  pitchChoiceText: { color: "#f8fafc", fontSize: 11, fontWeight: "900", textAlign: "center" },
  pitchChoiceChance: { color: "#fbbf24", fontSize: 13, lineHeight: 16, fontWeight: "900", textAlign: "center", marginTop: 2 },
  pitchChoiceHint: { color: "#bbf7d0", fontSize: 9, lineHeight: 12, fontWeight: "800", marginTop: 2, textAlign: "center" },
  pitchChoiceFine: { color: "#94a3b8", fontSize: 8, lineHeight: 11, fontWeight: "800", marginTop: 1, textAlign: "center" },
  scoutCandidateName: { color: "#f8fafc", fontSize: 12, fontWeight: "900" },
  scoutCandidateTag: { color: "#dbeafe", backgroundColor: "#334155", borderRadius: 7, overflow: "hidden", paddingHorizontal: 6, paddingVertical: 2, fontSize: 8, lineHeight: 10, fontWeight: "900", marginLeft: "auto" },
  scoutCandidateTagHot: { color: "#111827", backgroundColor: "#fbbf24" },
  scoutCandidateMeta: { color: "#94a3b8", fontSize: 10, lineHeight: 14, fontWeight: "800", marginTop: 2 },
  scoutSignalRow: { flexDirection: "row", gap: 4, marginTop: 4 },
  scoutSignalChip: { flex: 1, color: "#bae6fd", backgroundColor: "rgba(8,47,73,0.54)", borderColor: "rgba(125,211,252,0.16)", borderWidth: 1, borderRadius: 6, overflow: "hidden", paddingHorizontal: 4, paddingVertical: 2, fontSize: 8, lineHeight: 10, fontWeight: "900", textAlign: "center" },
  scoutEmptyText: { color: "#cbd5e1", backgroundColor: "#0f172a", borderRadius: 8, padding: 10, fontSize: 11, lineHeight: 16, fontWeight: "800" },
  scoutJobRow: { backgroundColor: "#0f172a", borderColor: "rgba(148,163,184,0.18)", borderWidth: 1, borderRadius: 8, padding: 9, gap: 5 },
  portraitImageWrap: { overflow: "hidden", borderWidth: 1, borderColor: "rgba(125,211,252,0.24)", backgroundColor: "#0f172a", position: "relative" },
  portraitImage: { width: "100%", height: "100%", resizeMode: "cover" },
  portraitImageGlow: { position: "absolute", left: -12, right: -12, bottom: -18, height: 24, opacity: 0.32, borderRadius: 18 },
  portraitFrame: { alignItems: "center", justifyContent: "flex-end", overflow: "hidden", borderColor: "#475569", borderWidth: 1, position: "relative" },
  portraitBackdrop: { ...StyleSheet.absoluteFillObject },
  portraitLight: { position: "absolute", top: -10, left: -10, width: 34, height: 34, borderRadius: 34, opacity: 0.32 },
  portraitHead: { position: "absolute", top: "18%", alignItems: "center", overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" },
  portraitHair: { position: "absolute", top: -1, left: -1, right: -1, height: "30%", borderBottomLeftRadius: 10, borderBottomRightRadius: 7 },
  portraitHairShort: { height: "22%", borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  portraitHairSide: { height: "34%", left: -4, right: "35%", borderBottomRightRadius: 12 },
  portraitHairCrop: { height: "16%", borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  portraitEyes: { position: "absolute", left: "22%", right: "22%", top: "48%", flexDirection: "row", justifyContent: "space-between" },
  portraitEye: { width: 3, height: 3, borderRadius: 3 },
  portraitNose: { position: "absolute", top: "58%", width: 3, height: 6, borderRadius: 4, opacity: 0.52 },
  portraitNeck: { position: "absolute", bottom: "28%", borderRadius: 4 },
  portraitShoulders: { position: "absolute", bottom: 0, overflow: "hidden", alignItems: "center" },
  portraitKitStripe: { position: "absolute", top: 0, bottom: 0, width: "18%", opacity: 0.82 },
  portraitKitBadge: { position: "absolute", top: "20%", right: "18%", width: 5, height: 5, borderRadius: 5 },
  portraitNamePlate: { position: "absolute", left: 3, bottom: 3, minWidth: 20, minHeight: 14, borderRadius: 5, borderWidth: 1, backgroundColor: "rgba(2,6,23,0.72)", alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  portraitInitials: { color: "#ffffff", fontWeight: "900" },
  positionChip: { position: "absolute", top: 3, right: 3, backgroundColor: "rgba(0,0,0,0.48)", borderRadius: 5, paddingHorizontal: 4, paddingVertical: 1, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  positionChipText: { color: "#ffffff", fontSize: 8, fontWeight: "900" },
  crestOuter: { alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.22)" },
  crestImageWrap: { overflow: "hidden", backgroundColor: "#0f172a", borderWidth: 1, borderColor: "rgba(255,255,255,0.22)" },
  crestImage: { width: "100%", height: "100%" },
  crestStripe: { position: "absolute", width: "34%", height: "130%", transform: [{ rotate: "24deg" }] },
  crestInner: { width: "66%", height: "66%", borderWidth: 2, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.18)" },
  crestText: { color: "#ffffff", fontWeight: "900" },
  countryBadge: { width: 48, height: 48, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.24)" },
  countryBadgeText: { fontWeight: "900", fontSize: 13 },
  lifeIcon: { width: 38, height: 38, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  lifeIconText: { color: "#ffffff", fontWeight: "900", fontSize: 12 },
  avatar: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#224f2a", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#dfffdf", fontWeight: "900", fontSize: 12 },
  clubBadge: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#153b64", alignItems: "center", justifyContent: "center" },
  clubBadgeText: { color: "#d8edff", fontWeight: "900", fontSize: 12 },
  listMain: { flex: 1, minWidth: 0 },
  cardTitle: { color: "#f8fafc", fontWeight: "900", fontSize: 13, lineHeight: 17 },
  valueText: { color: "#fbbf24", fontSize: 11, lineHeight: 14, fontWeight: "900", marginTop: 3 },
  traitRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 6 },
  traitChip: { color: "#dbeafe", backgroundColor: "#111827", borderColor: "#334155", borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, fontSize: 10, fontWeight: "800", overflow: "hidden" },
  statsText: { color: "#bbf7d0", fontSize: 10, lineHeight: 15, fontWeight: "800", marginTop: 4 },
  aiModelText: { color: "#7dd3fc", backgroundColor: "rgba(14,116,144,0.12)", borderColor: "rgba(125,211,252,0.22)", borderWidth: 1, borderRadius: 8, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 5, fontSize: 10, lineHeight: 14, fontWeight: "900", marginTop: 5 },
  agentBrainText: { color: "#fde68a", backgroundColor: "rgba(63,45,18,0.34)", borderColor: "rgba(251,191,36,0.22)", borderWidth: 1, borderRadius: 8, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 5, fontSize: 10, lineHeight: 14, fontWeight: "900", marginTop: 5 },
  goalBox: { backgroundColor: "#111827", borderRadius: 8, borderWidth: 1, borderColor: "#334155", padding: 8, marginTop: 7 },
  goalHeader: { flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "center" },
  goalTitle: { color: "#e2e8f0", fontSize: 11, fontWeight: "900", flex: 1 },
  goalDelta: { color: "#fbbf24", fontSize: 11, fontWeight: "900" },
  goalTrack: { height: 6, backgroundColor: "#0f172a", borderRadius: 8, overflow: "hidden", marginTop: 6 },
  goalFill: { height: "100%", backgroundColor: "#38bdf8" },
  playerTabs: { flexDirection: "row", gap: 5, marginTop: 7 },
  playerTab: { flex: 1, minHeight: 30, borderRadius: 7, backgroundColor: "#132034", borderWidth: 1, borderColor: "rgba(148,163,184,0.2)", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  playerTabInfo: { borderColor: "rgba(125,211,252,0.28)" },
  playerTabHot: { backgroundColor: "#2a210f", borderColor: "rgba(251,191,36,0.34)" },
  playerTabWarn: { backgroundColor: "#2a1111", borderColor: "rgba(248,113,113,0.34)" },
  playerTabText: { color: "#f8fafc", fontSize: 9, fontWeight: "900" },
  playerTabMeta: { color: "#93c5fd", fontSize: 9, fontWeight: "900", marginTop: 1 },
  contractBox: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 7 },
  contractText: { color: "#bbf7d0", backgroundColor: "#14351f", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, fontSize: 10, fontWeight: "900", overflow: "hidden" },
  contractWarning: { color: "#fed7aa", backgroundColor: "#3f2d12" },
  interestBox: { backgroundColor: "#0d2a1d", borderColor: "rgba(134,239,172,0.24)", borderWidth: 1, borderRadius: 8, padding: 8, marginTop: 8, gap: 5 },
  interestBoxLocked: { backgroundColor: "#1e293b", borderColor: "rgba(148,163,184,0.24)" },
  interestTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  interestTitle: { color: "#f8fafc", fontSize: 11, fontWeight: "900" },
  interestBadge: { color: "#052e16", backgroundColor: "#86efac", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2, fontSize: 10, fontWeight: "900" },
  interestBadgeLocked: { color: "#e2e8f0", backgroundColor: "#475569" },
  interestTrack: { height: 6, backgroundColor: "#07120d", borderRadius: 8, overflow: "hidden" },
  interestFill: { height: "100%", backgroundColor: "#86efac" },
  interestFillLocked: { backgroundColor: "#64748b" },
  interestText: { color: "#cbd5e1", fontSize: 10, lineHeight: 14, fontWeight: "800" },
  storyText: { color: "#94a3b8", fontSize: 11, lineHeight: 16, marginTop: 5 },
  rivalInterestBox: { backgroundColor: "#2b1620", borderColor: "#db2777", borderWidth: 1, borderRadius: 8, padding: 8, marginTop: 7 },
  rivalInterestTitle: { color: "#f9a8d4", fontSize: 11, fontWeight: "900" },
  rivalInterestText: { color: "#f8fafc", fontSize: 10, lineHeight: 14, fontWeight: "800", marginTop: 2 },
  playerCollapsedHint: { alignSelf: "stretch", backgroundColor: "#0f172a", borderColor: "rgba(125,211,252,0.18)", borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 9, alignItems: "center" },
  playerCollapsedText: { color: "#bae6fd", fontSize: 10, fontWeight: "900", textAlign: "center" },
  playerActionStack: { gap: 6, alignItems: "stretch" },
  playerActionModeTabs: { flexDirection: "row", gap: 5, backgroundColor: "rgba(2,6,23,0.78)", borderRadius: 10, padding: 4, borderWidth: 1, borderColor: "rgba(148,163,184,0.14)" },
  playerActionModeTab: { flex: 1, minHeight: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "transparent" },
  playerActionModeTabActive: { backgroundColor: "#86efac" },
  playerActionModeText: { color: "#cbd5e1", fontSize: 10, fontWeight: "900" },
  playerActionModeTextActive: { color: "#052e16" },
  careerPlanBox: { backgroundColor: "rgba(16,24,39,0.94)", borderColor: "rgba(125,211,252,0.16)", borderWidth: 1, borderRadius: 12, padding: 8, gap: 6 },
  careerPlanHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  giftBox: { backgroundColor: "#161f12", borderColor: "rgba(251,191,36,0.22)", borderWidth: 1, borderRadius: 8, padding: 7, gap: 6 },
  talkChoiceBox: { backgroundColor: "rgba(8,17,29,0.88)", borderColor: "rgba(125,211,252,0.24)", borderWidth: 1, borderRadius: 8, padding: 7, gap: 6 },
  talkChoiceHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  talkChoiceMeta: { color: "#082f49", backgroundColor: "#7dd3fc", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2, fontSize: 9, fontWeight: "900" },
  talkChoiceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  talkChoiceButton: { width: "48.5%", minHeight: 42, borderRadius: 7, backgroundColor: "#0f2235", borderColor: "rgba(125,211,252,0.26)", borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  talkChoiceText: { color: "#f8fafc", fontSize: 10, fontWeight: "900", textAlign: "center" },
  talkChoiceHint: { color: "#bae6fd", fontSize: 8, lineHeight: 11, fontWeight: "800", textAlign: "center", marginTop: 2 },
  careerPlanTitle: { color: "#7dd3fc", fontSize: 10, fontWeight: "900", textAlign: "center" },
  careerPlanAdvice: { color: "#07111f", backgroundColor: "#7dd3fc", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2, fontSize: 8, fontWeight: "900" },
  careerPlanRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, justifyContent: "center" },
  careerPlanButton: { minWidth: 86, flexGrow: 1, flexBasis: "47%", borderRadius: 9, backgroundColor: "#17233a", borderWidth: 1, borderColor: "rgba(148,163,184,0.18)", paddingHorizontal: 5, paddingVertical: 7, alignItems: "center" },
  careerPlanButtonRecommended: { backgroundColor: "#10251b", borderColor: "rgba(134,239,172,0.42)" },
  careerPlanRecommended: { color: "#052e16", backgroundColor: "#86efac", borderRadius: 6, overflow: "hidden", paddingHorizontal: 6, paddingVertical: 1, fontSize: 7, fontWeight: "900", marginBottom: 3 },
  giftButton: { minWidth: 82, flexGrow: 1, borderRadius: 7, backgroundColor: "#2a210f", borderWidth: 1, borderColor: "rgba(251,191,36,0.24)", paddingHorizontal: 5, paddingVertical: 6, alignItems: "center" },
  careerPlanText: { color: "#f8fafc", fontSize: 10, fontWeight: "900", textAlign: "center" },
  careerPlanImpact: { color: "#bbf7d0", fontSize: 8, lineHeight: 11, fontWeight: "800", marginTop: 2, textAlign: "center" },
  careerPlanCost: { color: "#93c5fd", fontSize: 8, fontWeight: "800", marginTop: 1, textAlign: "center" },
  careerPlanHint: { color: "#94a3b8", fontSize: 8, lineHeight: 11, fontWeight: "800", marginTop: 1, textAlign: "center" },
  smallButton: { backgroundColor: "#1d4ed8", borderColor: "rgba(125,211,252,0.24)", borderWidth: 1, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 10, minWidth: 76, alignItems: "center", justifyContent: "center" },
  secondaryButton: { backgroundColor: "rgba(15,23,42,0.88)", borderColor: "rgba(148,163,184,0.22)", borderWidth: 1 },
  sponsorButton: { backgroundColor: "#0f766e" },
  smallButtonText: { color: "#f8fafc", fontSize: 11, fontWeight: "900" },
  buttonSubText: { color: "#dbeafe", fontSize: 8, fontWeight: "800", marginTop: 2 },
  eventCard: { backgroundColor: "rgba(15,23,42,0.94)", borderColor: "rgba(125,211,252,0.18)", borderWidth: 1, borderRadius: 12, padding: 13, marginBottom: 10 },
  eventHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  eventIcon: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  eventIconText: { color: "#ffffff", fontSize: 11, fontWeight: "900" },
  eventSource: { color: "#fbbf24", fontSize: 11, fontWeight: "900" },
  cardMeta: { color: "#94a3b8", fontSize: 11, marginTop: 2 },
  eventTitle: { color: "#f8fafc", fontSize: 17, fontWeight: "900", marginBottom: 6 },
  eventBody: { color: "#cbd5e1", fontSize: 13, lineHeight: 19 },
  effectGrid: { gap: 6, marginTop: 10 },
  effectGood: { color: "#bbf7d0", backgroundColor: "#14351f", borderRadius: 8, padding: 8, fontSize: 12 },
  effectBad: { color: "#fed7aa", backgroundColor: "#3f2d12", borderRadius: 8, padding: 8, fontSize: 12 },
  card_urgent: { borderColor: "#ef4444" },
  card_rare: { borderColor: "#a855f7" },
  card_risk: { borderColor: "#f97316" },
  card_opportunity: { borderColor: "#22c55e" },
  card_normal: { borderColor: "#475569" },
  cardActions: { flexDirection: "row", gap: 7, marginTop: 11, flexWrap: "wrap" },
  goodButton: { backgroundColor: "#166534", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, minWidth: 82, alignItems: "center" },
  warnButton: { backgroundColor: "#b45309", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, minWidth: 82, alignItems: "center" },
  ghostButton: { borderColor: "rgba(148,163,184,0.28)", backgroundColor: "rgba(15,23,42,0.72)", borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, minWidth: 82, alignItems: "center" },
  primaryMini: { backgroundColor: "#1d4ed8", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, minWidth: 82, alignItems: "center" },
  dangerMini: { backgroundColor: "#991b1b", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, minWidth: 82, alignItems: "center" },
  actionText: { color: "#ffffff", fontWeight: "900", fontSize: 12 },
  ghostText: { color: "#e2e8f0", fontWeight: "900", fontSize: 12 },
  dealModalShell: { width: "100%", maxWidth: 430, alignSelf: "center" },
  dealBox: { position: "relative", overflow: "hidden", backgroundColor: "#101827", borderRadius: 8, borderWidth: 1, borderColor: "rgba(134,239,172,0.22)", padding: 12 },
  dealHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  dealKicker: { color: "#86efac", fontSize: 10, fontWeight: "900" },
  dealHeaderTitle: { color: "#f8fafc", fontSize: 16, lineHeight: 20, fontWeight: "900", marginTop: 2 },
  dealCloseButton: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: "rgba(148,163,184,0.24)", backgroundColor: "#0f172a", alignItems: "center", justifyContent: "center" },
  dealCloseText: { color: "#cbd5e1", fontSize: 18, lineHeight: 20, fontWeight: "900" },
  dealVisualRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 10 },
  dealChanceBand: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#0d2a1d", borderColor: "rgba(134,239,172,0.24)", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8 },
  dealChanceText: { color: "#bbf7d0", fontSize: 11, fontWeight: "900" },
  dealChanceValue: { color: "#fbbf24", fontSize: 18, fontWeight: "900" },
  negotiationPressurePanel: { backgroundColor: "rgba(15,23,42,0.88)", borderColor: "rgba(125,211,252,0.18)", borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 7, marginBottom: 8 },
  negotiationPressureTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 5 },
  negotiationPressureTitle: { color: "#e0f2fe", fontSize: 10, lineHeight: 13, fontWeight: "900" },
  negotiationPressureBadge: { color: "#dbeafe", backgroundColor: "#334155", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2, fontSize: 8, lineHeight: 10, fontWeight: "900" },
  negotiationPressureBadgeDanger: { color: "#fff7ed", backgroundColor: "#9a3412" },
  negotiationPressureBadgeGood: { color: "#052e16", backgroundColor: "#86efac" },
  negotiationPressureRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  negotiationPressureLabel: { width: 82, color: "#cbd5e1", fontSize: 8, lineHeight: 10, fontWeight: "900" },
  negotiationPressureTrack: { flex: 1, height: 6, borderRadius: 8, overflow: "hidden", backgroundColor: "#07111f" },
  negotiationPressureFill: { height: "100%", borderRadius: 8 },
  negotiationPressure_player: { backgroundColor: "#38bdf8" },
  negotiationPressure_club: { backgroundColor: "#86efac" },
  negotiationPressure_agency: { backgroundColor: "#fbbf24" },
  negotiationPressureValue: { width: 24, color: "#f8fafc", fontSize: 8, lineHeight: 10, fontWeight: "900", textAlign: "right" },
  negotiationPressureCopy: { color: "#bae6fd", fontSize: 9, lineHeight: 12, fontWeight: "800", marginTop: 6 },
  dealPayoutStrip: { flexDirection: "row", gap: 7, marginBottom: 8 },
  dealPayoutCell: { flex: 1, minHeight: 52, borderRadius: 8, backgroundColor: "#172033", borderColor: "rgba(251,191,36,0.18)", borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  dealPayoutLabel: { color: "#94a3b8", fontSize: 9, fontWeight: "900", textAlign: "center" },
  dealPayoutValue: { color: "#f8fafc", fontSize: 12, lineHeight: 15, fontWeight: "900", marginTop: 2, textAlign: "center" },
  dealArrow: { color: "#fbbf24", fontSize: 18, fontWeight: "900" },
  dealTerm: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0f172a", borderRadius: 8, padding: 7, marginTop: 6, borderWidth: 1, borderColor: "rgba(148,163,184,0.12)" },
  termButton: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#243449", alignItems: "center", justifyContent: "center" },
  termButtonText: { color: "#ffffff", fontWeight: "900", fontSize: 16 },
  termMain: { flex: 1, minWidth: 0 },
  termLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "800" },
  termValue: { color: "#f8fafc", fontSize: 13, fontWeight: "900", marginTop: 2 },
  dealReadout: { backgroundColor: "#111827", borderRadius: 8, padding: 10, marginTop: 8, gap: 4 },
  dealReadoutText: { color: "#dbeafe", fontSize: 12, fontWeight: "800" },
  aiDealBox: { backgroundColor: "#082f49", borderColor: "rgba(125,211,252,0.28)", borderWidth: 1, borderRadius: 8, padding: 10, gap: 4, marginTop: 8 },
  aiDealTitle: { color: "#e0f2fe", fontSize: 12, fontWeight: "900" },
  aiDealText: { color: "#bae6fd", fontSize: 11, lineHeight: 15, fontWeight: "800" },
  dealSignalGrid: { flexDirection: "row", gap: 7, marginTop: 8 },
  dealSignal: { flex: 1, backgroundColor: "#10251b", borderRadius: 8, borderWidth: 1, borderColor: "#235c38", padding: 8, alignItems: "center" },
  dealSignalValue: { color: "#fbbf24", fontSize: 16, fontWeight: "900" },
  dealSignalLabel: { color: "#cbd5e1", fontSize: 9, fontWeight: "900", textAlign: "center", marginTop: 2 },
  tacticGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  tacticMotion: { width: "48.7%" },
  tacticCard: { width: "100%", minHeight: 104, backgroundColor: "#10251b", borderColor: "rgba(134,239,172,0.24)", borderWidth: 1, borderRadius: 8, padding: 10, gap: 5 },
  tacticCardDark: { backgroundColor: "#2b1620", borderColor: "rgba(244,114,182,0.32)" },
  tacticCardRecommended: { borderColor: "#7dd3fc", shadowColor: "#38bdf8", shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  tacticTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  tacticTitle: { color: "#f8fafc", fontSize: 13, fontWeight: "900" },
  tacticChance: { color: "#111827", backgroundColor: "#fbbf24", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2, fontSize: 10, fontWeight: "900" },
  aiRecommended: { alignSelf: "flex-start", color: "#07111f", backgroundColor: "#7dd3fc", borderRadius: 7, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2, fontSize: 9, fontWeight: "900" },
  tacticMeta: { color: "#bbf7d0", fontSize: 10, fontWeight: "900" },
  tacticHint: { color: "#cbd5e1", fontSize: 10, lineHeight: 14, fontWeight: "800" },
  nav: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#0f172a", borderTopColor: "#334155", borderTopWidth: 1, flexDirection: "row", padding: 6, gap: 5 },
  navItem: { flex: 1, minHeight: 42, paddingVertical: 7, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  navItemActive: { backgroundColor: "#334155" },
  navText: { color: "#94a3b8", fontSize: 10, fontWeight: "800", textAlign: "center" },
  navTextActive: { color: "#f8fafc" }
});
