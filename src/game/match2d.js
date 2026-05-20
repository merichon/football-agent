const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const seeded = (seed) => {
  const x = Math.sin(seed * 991) * 10000;
  return x - Math.floor(x);
};

const laneY = {
  left: 24,
  center: 50,
  right: 76
};

export function enhanceFixture2D({ events = [], homeProfile, awayProfile, homePressure, awayPressure, seed = 1 }) {
  const homeShape = pickShape(homeProfile, seed + 10);
  const awayShape = pickShape(awayProfile, seed + 20);
  const homePlayers = buildShapeDots(homeShape, "home", homePressure);
  const awayPlayers = buildShapeDots(awayShape, "away", awayPressure);

  const enhancedEvents = events.map((event, index) => {
    const sideProfile = event.side === "home" ? homeProfile : awayProfile;
    const pressure = event.side === "home" ? homePressure : awayPressure;
    const lane = event.lane || pickLane(seed + index * 7);
    const path = buildBallPath(event, lane, sideProfile, pressure, seed + event.minute + index * 13);
    const tickFrames = buildActionTicks(event, path);
    return {
      ...event,
      lane,
      path,
      tickFrames,
      phase: phaseFor(event.type, path.length, event.actionType),
      passCount: Math.max(0, path.length - 2),
      pressIntensity: clamp(Math.round(pressure + (event.type === "pressure" ? 16 : 0) + seeded(seed + index) * 12), 18, 96),
      ballSpeed: clamp(Math.round(42 + sideProfile.attack / 2 + (event.type === "shot" || event.type === "goal" ? 24 : 0)), 35, 98)
    };
  });

  return {
    homeShape,
    awayShape,
    homePlayers,
    awayPlayers,
    events: enhancedEvents,
    modelLabel: "GRF-lite 2D action model"
  };
}

function pickShape(profile, seed) {
  if ((profile.attack || 60) - (profile.defense || 60) > 6) return "4-3-3";
  if ((profile.midfield || 60) > (profile.attack || 60) + 4) return "4-2-3-1";
  if ((profile.defense || 60) > (profile.attack || 60) + 5) return "5-3-2";
  return seeded(seed) > 0.58 ? "4-4-2" : "4-2-3-1";
}

function buildShapeDots(shape, side, pressure) {
  const lines = {
    "4-4-2": [1, 4, 4, 2],
    "4-3-3": [1, 4, 3, 3],
    "4-2-3-1": [1, 4, 2, 3, 1],
    "5-3-2": [1, 5, 3, 2]
  }[shape] || [1, 4, 4, 2];
  const homeX = [10, 25, 44, 64, 78];
  const awayX = [90, 75, 56, 36, 22];
  const push = (pressure - 50) * 0.16;
  return lines.flatMap((count, lineIndex) => {
    const xBase = (side === "home" ? homeX[lineIndex] : awayX[lineIndex]) + (side === "home" ? push : -push);
    return Array.from({ length: count }).map((_, index) => {
      const gap = 64 / Math.max(1, count);
      return {
        id: `${side}-${lineIndex}-${index}`,
        x: clamp(xBase, 6, 94),
        y: clamp(18 + gap * index + gap / 2, 12, 88)
      };
    });
  });
}

function buildBallPath(event, lane, profile, pressure, seed) {
  const attackingHome = event.side !== "away";
  const y = laneY[lane] || 50;
  const wobble = () => (seeded(seed += 3) - 0.5) * 11;
  const startX = attackingHome ? clamp(18 + pressure * 0.18, 16, 38) : clamp(82 - pressure * 0.18, 62, 84);
  const finalX = attackingHome ? (event.type === "goal" ? 96 : 86) : (event.type === "goal" ? 4 : 14);
  const middleBias = attackingHome ? 1 : -1;

  if (event.type === "pressure") {
    return [
      { x: startX - middleBias * 8, y: clamp(y + wobble(), 12, 88) },
      { x: startX + middleBias * 2, y: clamp(y - 8 + wobble(), 12, 88) },
      { x: startX + middleBias * 12, y: clamp(y + wobble(), 12, 88) }
    ];
  }

  const passSteps = event.type === "attack" ? 4 : 3;
  const directness = clamp((profile.attack || 60) / 100 + (event.type === "goal" ? 0.18 : 0), 0.45, 0.95);
  const path = [{ x: startX, y: clamp(y + wobble(), 12, 88) }];
  for (let i = 1; i <= passSteps; i += 1) {
    const t = i / (passSteps + 1);
    const x = startX + (finalX - startX) * t * directness;
    path.push({ x: clamp(x, 4, 96), y: clamp(y + wobble(), 12, 88) });
  }
  path.push({ x: finalX, y: event.type === "goal" ? 50 : clamp(y + wobble(), 12, 88) });
  return path;
}

function phaseFor(type, pathLength, actionType) {
  if (type === "goal") return "bitirici koşu";
  if (type === "shot") return "şut koridoru";
  if (type === "pressure") return actionType === "interception" ? "pas golgesi" : "pres tuzagi";
  if (actionType === "through_ball") return "savunma arkasi";
  if (actionType === "cross" || actionType === "overlap") return "kanat hucumu";
  if (actionType === "switch") return "yon degistirme";
  return pathLength > 4 ? "pas sekansı" : "geçiş oyunu";
}

function buildActionTicks(event, path) {
  const action = event.agentDecision?.actionTick?.action || event.agentDecision?.grfAction || (event.type === "pressure" ? "pressure" : "short_pass");
  const stepMs = event.agentDecision?.actionTick?.stepMs || 100;
  const totalTicks = Math.max(4, Math.min(12, path.length * (event.type === "goal" ? 3 : 2)));
  return Array.from({ length: totalTicks }).map((_, index) => {
    const point = path[Math.min(path.length - 1, Math.floor((index / Math.max(1, totalTicks - 1)) * path.length))] || { x: 50, y: 50 };
    return {
      t: index * stepMs,
      action,
      x: point.x,
      y: point.y,
      sticky: !!event.agentDecision?.actionTick?.sticky
    };
  });
}

function pickLane(seed) {
  const lanes = ["left", "center", "right"];
  return lanes[Math.floor(seeded(seed) * lanes.length)];
}
