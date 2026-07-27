export const GAME = Object.freeze({
  width: 420,
  columns: 8,
  blockSize: 52,
  metersPerRow: 10,
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
  base: { normal: 0.724, ore: 0.23, dynamite: 0.025, forge: 0.006, slime: 0.015 },
  dynamiteDepthBonus: 0.01,
  oreDepthBonus: 0.04,
  forgeStartDepth: 10,
  dynamiteStartDepth: 7,
  forgeUpgradeStep: 0.0025,
  forgeMax: 0.021,
  depthScale: 280,
});

export const SLIME = Object.freeze({
  startDepth: 10,
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

export const CORE_DEPTH = 3000;

export const BIOMES = Object.freeze([
  {
    id: "surface",
    name: "Поверхность",
    start: 0,
    art: "biomeSurface",
    background: ["#24475b", "#121727"],
    dust: "#d7c39d",
    description: "Последний свет над шахтой",
  },
  {
    id: "earth",
    name: "Почвенные тоннели",
    start: 100,
    art: "biomeSoil",
    background: ["#493024", "#17131c"],
    dust: "#d08b55",
    description: "Корни, окаменелости и старые крепления",
  },
  {
    id: "stone",
    name: "Каменные пещеры",
    start: 450,
    art: "biomeStone",
    background: ["#21364b", "#101827"],
    dust: "#8aa7bd",
    description: "Холодные залы под толщей породы",
  },
  {
    id: "crystal",
    name: "Кристальные шахты",
    start: 1000,
    art: "biomeCrystal",
    background: ["#332050", "#120f26"],
    dust: "#b883ff",
    description: "Светящиеся жилы неизвестных минералов",
  },
  {
    id: "fire",
    name: "Лавовые глубины",
    start: 1800,
    art: "biomeLava",
    background: ["#5b201d", "#170c16"],
    dust: "#ff8052",
    description: "Базальт, жар и реки расплавленной породы",
  },
  {
    id: "core",
    name: "Ядро планеты",
    start: CORE_DEPTH,
    art: "biomeCore",
    background: ["#4b1820", "#0c1021"],
    dust: "#ffe58a",
    description: "Главная цель экспедиции",
  },
]);

export const ACCOUNT = Object.freeze({
  maxLevel: 50,
  xpBase: 90,
  xpPower: 1.55,
});

export const RANKS = Object.freeze([
  { minLevel: 1, name: "Новичок", emblem: "✦", color: "#a9b6c8" },
  { minLevel: 4, name: "Любитель", emblem: "◆", color: "#78d7c6" },
  { minLevel: 8, name: "Шахтёр", emblem: "⛏", color: "#e7b95f" },
  { minLevel: 14, name: "Проходчик", emblem: "⚒", color: "#f08b54" },
  { minLevel: 21, name: "Исследователь глубин", emblem: "◈", color: "#af82ff" },
  { minLevel: 29, name: "Мастер бурения", emblem: "✹", color: "#5ce5e5" },
  { minLevel: 38, name: "Покоритель недр", emblem: "♛", color: "#ffcb57" },
  { minLevel: 48, name: "Легенда шахты", emblem: "★", color: "#ffef9a" },
]);

export const COSMETIC_MILESTONES = Object.freeze([
  { level: 5, name: "Рамка старателя", detail: "Новая рамка профиля", icon: "◇" },
  { level: 10, name: "Рассвет экспедиции", detail: "Живой фон главного меню", icon: "▧" },
  { level: 15, name: "След кометы", detail: "Новый след кирки", icon: "⌁" },
  { level: 20, name: "Гимн глубины", detail: "Новая музыкальная партия", icon: "♫" },
  { level: 25, name: "Разлом реальности", detail: "Новая анимация CRITICAL", icon: "✷" },
  { level: 30, name: "Интерфейс глубин", detail: "Новая визуальная тема UI", icon: "◫" },
  { level: 40, name: "Живая шахта", detail: "Усиленное оформление биомов", icon: "◉" },
  { level: 50, name: "Легендарная рамка", detail: "Рамка покорителя ядра", icon: "♛" },
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

export function nextBiomeAtDepth(depth) {
  return BIOMES.find((biome) => biome.start > depth) || null;
}

export function coreProgress(depth) {
  return Math.max(0, Math.min(100, depth / CORE_DEPTH * 100));
}

export function totalXpForLevel(level) {
  const safeLevel = Math.max(1, Math.min(ACCOUNT.maxLevel, Math.floor(level)));
  return Math.round(ACCOUNT.xpBase * Math.pow(safeLevel - 1, ACCOUNT.xpPower));
}

export function accountLevelFromXp(xp) {
  const safeXp = Math.max(0, Number(xp) || 0);
  let level = 1;
  while (level < ACCOUNT.maxLevel && safeXp >= totalXpForLevel(level + 1)) level += 1;
  return level;
}

export function accountProgress(xp) {
  const level = accountLevelFromXp(xp);
  if (level >= ACCOUNT.maxLevel) return { level, current: 1, needed: 1, ratio: 1 };
  const start = totalXpForLevel(level);
  const end = totalXpForLevel(level + 1);
  return {
    level,
    current: Math.max(0, xp - start),
    needed: Math.max(1, end - start),
    ratio: Math.max(0, Math.min(1, (xp - start) / (end - start))),
  };
}

export function rankForLevel(level) {
  let rank = RANKS[0];
  for (const candidate of RANKS) if (level >= candidate.minLevel) rank = candidate;
  return rank;
}

export function cosmeticRewardForLevel(level) {
  const milestone = COSMETIC_MILESTONES.find((reward) => reward.level === level);
  if (milestone) return milestone;
  const variants = [
    ["Эмблема глубины", "Новый знак профиля", "✦"],
    ["Грань рамки", "Новый оттенок рамки", "◇"],
    ["Искра экспедиции", "Новый эффект эмблемы", "·"],
    ["Знак маршрута", "Новая метка на карте", "⌄"],
  ];
  const variant = variants[(Math.max(1, level) - 1) % variants.length];
  return { level, name: `${variant[0]} ${level}`, detail: variant[1], icon: variant[2] };
}
