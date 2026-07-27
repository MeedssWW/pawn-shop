import { BIOMES, BLOCKS, GAME, GENERATION, ORES, SLIME, biomeAtDepth } from "../config/gameConfig.js";

class SeededRandom {
  constructor(seed = Date.now()) {
    this.seed = seed >>> 0 || 1;
  }

  next() {
    let value = this.seed;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.seed = value >>> 0;
    return this.seed / 4294967296;
  }
}

export class MineGenerator {
  constructor({ seed, forgeUpgrade = 0 } = {}) {
    this.random = new SeededRandom(seed);
    this.forgeUpgrade = forgeUpgrade;
    this.blocks = new Map();
    this.blockPool = [];
    this.generatedChunks = new Set();
    this.nextId = 1;
  }

  key(row, column) {
    return `${row}:${column}`;
  }

  generateUntil(targetRow) {
    const targetChunk = Math.ceil(targetRow / GAME.chunkRows);
    for (let chunk = 0; chunk <= targetChunk; chunk += 1) {
      if (!this.generatedChunks.has(chunk)) this.generateChunk(chunk);
    }
  }

  generateChunk(chunkIndex) {
    this.generatedChunks.add(chunkIndex);
    const start = chunkIndex * GAME.chunkRows;
    const end = start + GAME.chunkRows;
    for (let row = start; row < end; row += 1) {
      if (row < 2) continue;
      for (let column = 0; column < GAME.columns; column += 1) {
        const block = this.createBlock(row, column);
        this.blocks.set(this.key(row, column), block);
      }
    }
  }

  createBlock(row, column) {
    const depth = row;
    const progress = Math.min(1, depth / GENERATION.depthScale);
    const forgeChance = Math.min(GENERATION.forgeMax, GENERATION.base.forge + this.forgeUpgrade * GENERATION.forgeUpgradeStep);
    const dynamiteChance = GENERATION.base.dynamite + progress * GENERATION.dynamiteDepthBonus;
    const slimeChance = GENERATION.base.slime;
    const oreChance = GENERATION.base.ore + progress * GENERATION.oreDepthBonus;
    const roll = this.random.next();
    let kind = "normal";
    let type = this.pickTerrain(depth);
    if (roll < forgeChance && row >= GENERATION.forgeStartDepth) {
      kind = "forge";
      type = "forge";
    } else if (roll < forgeChance + dynamiteChance && row >= GENERATION.dynamiteStartDepth) {
      kind = "dynamite";
      type = "dynamite";
    } else if (roll < forgeChance + dynamiteChance + slimeChance && row >= SLIME.startDepth) {
      kind = "slime";
      type = "slime";
    } else if (roll < forgeChance + dynamiteChance + slimeChance + oreChance) {
      kind = "ore";
      type = this.pickOre(depth);
    }
    const terrain = BLOCKS[this.pickTerrain(depth)];
    return this.acquire({
      id: this.nextId++,
      row,
      column,
      x: column * GAME.blockSize,
      y: row * GAME.blockSize,
      kind,
      type,
      damage: kind === "normal" ? BLOCKS[type].damage : kind === "ore" ? terrain.damage : 0,
      reward: kind === "ore" ? ORES[type].reward : 0,
      active: true,
      primed: false,
    });
  }

  pickTerrain(depth) {
    const roll = this.random.next();
    if (depth < 55) return roll < 0.78 ? "dirt" : "stone";
    if (depth < 135) return roll < 0.15 ? "dirt" : roll < 0.82 ? "stone" : "hard";
    if (depth < 225) return roll < 0.48 ? "stone" : roll < 0.9 ? "hard" : "obsidian";
    return roll < 0.17 ? "stone" : roll < 0.63 ? "hard" : "obsidian";
  }

  pickOre(depth) {
    const roll = this.random.next();
    if (depth < 45) return roll < 0.58 ? "coal" : "copper";
    if (depth < 120) return roll < 0.27 ? "coal" : roll < 0.57 ? "copper" : roll < 0.88 ? "ironOre" : "goldOre";
    if (depth < 220) return roll < 0.2 ? "copper" : roll < 0.5 ? "ironOre" : roll < 0.78 ? "goldOre" : "crystal";
    return roll < 0.23 ? "ironOre" : roll < 0.51 ? "goldOre" : roll < 0.9 ? "crystal" : "rainbow";
  }

  get(row, column) {
    return this.blocks.get(this.key(row, column));
  }

  remove(row, column) {
    const key = this.key(row, column);
    const block = this.blocks.get(key);
    if (!block) return null;
    this.blocks.delete(key);
    block.active = false;
    return block;
  }

  removeBlock(block) {
    return this.remove(block.row, block.column);
  }

  blocksAround(row, column, radius) {
    const result = [];
    for (let y = row - radius; y <= row + radius; y += 1) {
      for (let x = column - radius; x <= column + radius; x += 1) {
        const block = this.get(y, x);
        if (block) result.push(block);
      }
    }
    return result;
  }

  visibleBlocks(cameraY, viewportHeight) {
    const minRow = Math.max(0, Math.floor(cameraY / GAME.blockSize) - 2);
    const maxRow = Math.ceil((cameraY + viewportHeight) / GAME.blockSize) + 2;
    const result = [];
    for (let row = minRow; row <= maxRow; row += 1) {
      for (let column = 0; column < GAME.columns; column += 1) {
        const block = this.get(row, column);
        if (block) result.push(block);
      }
    }
    return result;
  }

  cleanup(cameraY) {
    const cutoff = Math.floor(cameraY / GAME.blockSize) - GAME.removeBehind;
    for (const [key, block] of this.blocks) {
      if (block.row >= cutoff) continue;
      this.blocks.delete(key);
      this.release(block);
    }
  }

  biome(depth) {
    return biomeAtDepth(depth);
  }

  injectBlock(row, column, kind, type = kind) {
    const terrain = BLOCKS[this.pickTerrain(row)];
    const block = this.acquire({
      id: this.nextId++,
      row,
      column,
      x: column * GAME.blockSize,
      y: row * GAME.blockSize,
      kind,
      type,
      damage: kind === "normal" ? BLOCKS[type].damage : kind === "ore" ? terrain.damage : 0,
      reward: kind === "ore" ? ORES[type].reward : 0,
      active: true,
      primed: false,
    });
    this.blocks.set(this.key(row, column), block);
    return block;
  }

  acquire(values) {
    return Object.assign(this.blockPool.pop() || {}, values);
  }

  release(block) {
    if (!block || this.blockPool.length >= GAME.columns * GAME.chunkRows * 4) return;
    block.active = false;
    this.blockPool.push(block);
  }
}

export { SeededRandom, BIOMES };
