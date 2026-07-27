import { BIOMES, DAILY_MISSIONS, UPGRADES } from "../config/gameConfig.js";

const SAVE_KEY = "pickaxe-drop-save-v1";

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function hashText(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function dailySelection(date) {
  const pool = [...DAILY_MISSIONS];
  let seed = hashText(date);
  const selected = [];
  while (selected.length < 3 && pool.length) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    selected.push(pool.splice(seed % pool.length, 1)[0]);
  }
  return selected.map((mission) => ({ id: mission.id, progress: 0, claimed: false }));
}

export function createDefaultSave() {
  const upgrades = {};
  for (const id of Object.keys(UPGRADES)) upgrades[id] = 0;
  upgrades.dynamite = 1;
  const date = todayKey();
  return {
    version: 2,
    coins: 0,
    bestDepth: 0,
    unlockedBiomes: ["surface"],
    upgrades,
    settings: { music: 0.35, sound: 0.65, muted: false },
    stats: {
      runs: 0,
      blocks: 0,
      ores: 0,
      gold: 0,
      dynamites: 0,
      chains: 0,
      forges: 0,
      bestTier: 0,
      totalCoins: 0,
    },
    daily: { date, missions: dailySelection(date) },
  };
}

export class SaveManager {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
    this.data = this.load();
  }

  load() {
    const fallback = createDefaultSave();
    try {
      const raw = this.storage?.getItem(SAVE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      const data = {
        ...fallback,
        ...parsed,
        upgrades: { ...fallback.upgrades, ...(parsed.upgrades || {}) },
        settings: { ...fallback.settings, ...(parsed.settings || {}) },
        stats: { ...fallback.stats, ...(parsed.stats || {}) },
      };
      for (const [id, config] of Object.entries(UPGRADES)) {
        data.upgrades[id] = Math.max(0, Math.min(config.max, Number(data.upgrades[id]) || 0));
      }
      data.coins = Math.max(0, Number(data.coins) || 0);
      data.bestDepth = Math.max(0, Number(data.bestDepth) || 0);
      delete data.accountXp;
      const unlocked = new Set(Array.isArray(data.unlockedBiomes) ? data.unlockedBiomes : []);
      unlocked.add("surface");
      for (const biome of BIOMES) if (data.bestDepth >= biome.start) unlocked.add(biome.id);
      data.unlockedBiomes = BIOMES.map((biome) => biome.id).filter((id) => unlocked.has(id));
      data.version = 2;
      return this.refreshDaily(data);
    } catch {
      return fallback;
    }
  }

  refreshDaily(data = this.data) {
    const date = todayKey();
    if (!data.daily || data.daily.date !== date || !Array.isArray(data.daily.missions)) {
      data.daily = { date, missions: dailySelection(date) };
    }
    return data;
  }

  save() {
    try {
      this.refreshDaily();
      this.storage?.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch {
      // Storage may be unavailable in privacy mode; the game remains playable.
    }
  }

  addCoins(amount) {
    this.data.coins = Math.max(0, Math.round(this.data.coins + amount));
    this.save();
  }

  unlockBiome(id) {
    if (!BIOMES.some((biome) => biome.id === id)) return false;
    if (this.data.unlockedBiomes.includes(id)) return false;
    this.data.unlockedBiomes.push(id);
    this.save();
    return true;
  }

  spendCoins(amount) {
    if (this.data.coins < amount) return false;
    this.data.coins -= amount;
    this.save();
    return true;
  }

  updateMission(metric, amount = 1) {
    this.refreshDaily();
    for (const entry of this.data.daily.missions) {
      const config = DAILY_MISSIONS.find((mission) => mission.id === entry.id);
      if (!config || config.metric !== metric || entry.claimed) continue;
      entry.progress = Math.min(config.target, entry.progress + amount);
    }
  }

  claimMission(id) {
    const entry = this.data.daily.missions.find((mission) => mission.id === id);
    const config = DAILY_MISSIONS.find((mission) => mission.id === id);
    if (!entry || !config || entry.claimed || entry.progress < config.target) return 0;
    entry.claimed = true;
    this.data.coins += config.reward;
    this.save();
    return config.reward;
  }

  reset() {
    this.data = createDefaultSave();
    this.save();
  }
}

export { SAVE_KEY, todayKey };
