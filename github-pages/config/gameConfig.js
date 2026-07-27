export const GAME = Object.freeze({
  width: 420,
  columns: 8,
  blockSize: 52,
  chunkRows: 14,
  generateAhead: 34,
  removeBehind: 18,
  gravity: 720,
  maxFallSpeed: 500,
  collisionRadius: 13,
  casesForInterstitial: 3,
});

export const PICKAXES = Object.freeze([
  { id: "wood", name: "Деревянная", hp: 50, multiplier: 1, color: "#a96f3d", glow: "#e4ad69" },
  { id: "stone", name: "Каменная", hp: 90, multiplier: 1.25, color: "#8a929d", glow: "#cbd2db" },
  { id: "iron", name: "Железная", hp: 150, multiplier: 1.6, color: "#c9d4df", glow: "#f4f8ff" },
  { id: "gold", name: "Золотая", hp: 220, multiplier: 2, color: "#f0b52e", glow: "#fff09a" },
  { id: "diamond", name: "Алмазная", hp: 320, multiplier: 3, color: "#38d9e6", glow: "#a8fbff" },
]);

export const BLOCKS = Object.freeze({
  dirt: { name: "Земля", damage: 2, color: "#8f5a3a", edge: "#c17c4e" },
  stone: { name: "Камень", damage: 4, color: "#566879", edge: "#8194a7" },
  hard: { name: "Твёрдый камень", damage: 7, color: "#35424f", edge: "#5d7183" },
  obsidian: { name: "Обсидиан", damage: 12, color: "#29203d", edge: "#7a4fa1" },
});

export const ORES = Object.freeze({
  coal: { name: "Уголь", reward: 1, color: "#242a31", glow: "#65707a" },
  copper: { name: "Медь", reward: 3, color: "#c56f3f", glow: "#ffb279" },
  ironOre: { name: "Железо", reward: 7, color: "#b7c5cf", glow: "#eff8ff" },
  goldOre: { name: "Золото", reward: 15, color: "#efb629", glow: "#fff08b" },
  crystal: { name: "Кристалл", reward: 35, color: "#9b62ef", glow: "#d9a9ff" },
  rainbow: { name: "Радужный кристалл", reward: 100, color: "#4ee6d1", glow: "#fff6a4" },
});

export const GENERATION = Object.freeze({
  base: { normal: 0.64, ore: 0.23, dynamite: 0.06, forge: 0.03, slime: 0.04 },
  forgeUpgradeStep: 0.0025,
  forgeMax: 0.045,
  depthScale: 280,
});

export const SLIME = Object.freeze({
  startDepth: 6,
  restitution: 1.42,
  minimumBounce: 390,
  horizontalKick: 125,
  cooldown: 0.16,
  color: "#35e698",
  glow: "#8dffd0",
});

export const CRITICAL = Object.freeze({
  chance: 0.006,
  duration: 1.18,
  blastAt: 0.72,
});

export const BIOMES = Object.freeze([
  { id: "earth", name: "Земляные пещеры", start: 0, background: ["#3a241f", "#161526"], dust: "#d08b55" },
  { id: "stone", name: "Каменные глубины", start: 65, background: ["#21364b", "#101827"], dust: "#8aa7bd" },
  { id: "crystal", name: "Кристальные пещеры", start: 145, background: ["#332050", "#120f26"], dust: "#b883ff" },
  { id: "fire", name: "Огненная глубина", start: 235, background: ["#5b201d", "#170c16"], dust: "#ff8052" },
]);

export const UPGRADES = Object.freeze({
  durability: { name: "Стартовая прочность", description: "+5 HP в начале", baseCost: 55, growth: 1.55, max: 20 },
  handle: { name: "Усиленная рукоять", description: "−2% урона за уровень", baseCost: 80, growth: 1.65, max: 15 },
  oreValue: { name: "Ценность руды", description: "+10% дохода", baseCost: 70, growth: 1.62, max: 20 },
  dynamite: { name: "Улучшенный динамит", description: "Радиус 3×3 → 5×5 → 7×7", baseCost: 220, growth: 2.1, max: 3 },
  forgeChance: { name: "Шанс кузницы", description: "+0.25% к появлению", baseCost: 140, growth: 1.8, max: 6 },
  luckyStart: { name: "Удачный старт", description: "До 15% начать с каменной", baseCost: 180, growth: 1.75, max: 5 },
  secondWind: { name: "Дополнительный рывок", description: "До 15% восстановить 10% HP", baseCost: 160, growth: 1.72, max: 5 },
});

export const DAILY_MISSIONS = Object.freeze([
  { id: "blocks", label: "Разрушить 100 блоков", metric: "blocks", target: 100, reward: 120 },
  { id: "ores", label: "Добыть 25 руд", metric: "ores", target: 25, reward: 140 },
  { id: "gold", label: "Добыть 12 золотых руд", metric: "gold", target: 12, reward: 180 },
  { id: "dynamite", label: "Активировать 5 динамитов", metric: "dynamites", target: 5, reward: 150 },
  { id: "chain", label: "Запустить цепную реакцию", metric: "chains", target: 1, reward: 220 },
  { id: "iron", label: "Улучшить кирку до железной", metric: "ironTier", target: 1, reward: 170 },
  { id: "diamond", label: "Достичь алмазной кирки", metric: "diamondTier", target: 1, reward: 350 },
  { id: "depth", label: "Опуститься на глубину 200 м", metric: "depth200", target: 1, reward: 250 },
  { id: "runCoins", label: "Заработать 1000 монет за запуск", metric: "runCoins1000", target: 1, reward: 300 },
]);

export function upgradeCost(id, level) {
  const config = UPGRADES[id];
  return Math.round(config.baseCost * Math.pow(config.growth, level));
}

export function dynamiteRadius(level) {
  return Math.max(1, Math.min(3, level));
}

export function biomeAtDepth(depth) {
  let result = BIOMES[0];
  for (const biome of BIOMES) if (depth >= biome.start) result = biome;
  return result;
}
