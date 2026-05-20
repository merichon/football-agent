const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const roundMoney = (value) => Math.round(value / 1000) * 1000;

export function playerImpactScore(player = {}, contribution = {}) {
  const stats = player.seasonStats || {};
  const played = Math.max(1, (stats.played || 0) + (contribution.played || 0));
  const goals = (stats.goals || 0) + (contribution.goals || 0);
  const shots = (stats.shots || 0) + (contribution.shots || 0);
  const highlights = (stats.highlights || 0) + (contribution.highlights || 0);
  const shotValue = shots * 1.8;
  const goalValue = goals * 9;
  const highlightValue = highlights * 3.2;
  const formValue = ((player.form || 60) - 55) * 0.65;
  const roleValue = roleImpactBias(player.position);
  return clamp(Math.round(42 + goalValue / played + shotValue / played + highlightValue / played + formValue + roleValue), 1, 99);
}

export function marketValueFromAI(player = {}, impact = 50, context = {}) {
  const ageCurve = player.age <= 19 ? 1.18 : player.age <= 22 ? 1.12 : player.age <= 27 ? 1.04 : player.age <= 31 ? 0.96 : 0.84;
  const potentialGap = Math.max(0, (player.hiddenPotential || player.potential || 60) - (player.overall || 55));
  const impactCurve = 0.82 + impact / 155;
  const formCurve = 0.9 + ((player.form || 60) - 55) / 180;
  const leagueCurve = 0.95 + ((context.clubReputation || 45) - 45) / 260;
  const riskCurve = 1 - Math.max(0, (player.injuryRisk || 12) - 18) / 220;
  const base = Math.max(50000, player.value || 120000);
  const prospectPremium = 1 + potentialGap / 240;
  return roundMoney(Math.max(50000, base * ageCurve * impactCurve * formCurve * leagueCurve * riskCurve * prospectPremium));
}

export function scoutAIScore(career = {}, player = {}) {
  const reputationGap = Math.max(0, (player.value || 0) / 65000 - (career.reputation || 0));
  const upside = Math.max(0, (player.hiddenPotential || player.potential || 60) - (player.overall || 55));
  const confidence = player.scoutConfidence || (player.scouted ? 62 : 38);
  const personalityRisk = player.personality === "troubled" ? 14 : player.personality === "money" ? 8 : 0;
  const injuryRisk = Math.max(0, (player.injuryRisk || 12) - 16);
  const priceFit = clamp(70 - reputationGap, 8, 88);
  const score = priceFit * 0.24 + upside * 1.35 + confidence * 0.22 + (player.form || 60) * 0.18 - personalityRisk - injuryRisk * 0.65;
  return clamp(Math.round(score), 1, 99);
}

export function negotiationAIAdvice(career = {}, offer = {}, player = {}, club = {}) {
  const relation = (club.relation || 45) + (career.relationBoost || 0);
  const trust = player.agencyTrust ?? 52;
  const feeRatio = (offer.fee || 1) / Math.max(1, player.value || offer.fee || 1);
  const commissionRatio = (offer.commission || 0) / Math.max(1, offer.fee || 1);
  const leverage = clamp(Math.round((career.reputation || 0) * 0.35 + relation * 0.22 + trust * 0.18 + (player.form || 60) * 0.16 + (feeRatio - 1) * 24), 1, 99);
  let tactic = "balanced";
  if (leverage > 68 && relation > 45 && commissionRatio < 0.09) tactic = "hard";
  if (trust < 45 || relation < 35) tactic = "soft";
  if ((career.ethics || 70) > 64 && leverage < 42 && feeRatio > 1.15) tactic = "dark";
  const note = tactic === "hard"
    ? "Leverage yuksek: komisyon ve bonusu yukari cek."
    : tactic === "soft"
      ? "İlişki kırılgan: oyuncu güvenini ve kulüp ilişkisini koru."
      : tactic === "dark"
        ? "Riskli baskı para getirebilir ama etik ve itibar kaybettirir."
        : "Dengeli ilerle: maaş iyi, komisyonu abartma.";
  return { leverage, tactic, note };
}

function roleImpactBias(position) {
  if (["ST", "AM", "RW", "LW"].includes(position)) return 7;
  if (["CM", "DM"].includes(position)) return 4;
  if (["CB", "LB", "RB"].includes(position)) return 2;
  if (position === "GK") return 3;
  return 0;
}
