import { BIOMES, BLOCKS, CRITICAL, GAME, ORES, PICKAXES, SLIME, biomeAtDepth, dynamiteRadius } from "../config/gameConfig.js";
import { MineGenerator } from "../systems/MineGenerator.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (from, to, amount) => from + (to - from) * amount;
const wrap = (value, size) => ((value % size) + size) % size;
const TILE_ATLAS = Object.freeze({
  dirt: [0, 0],
  stone: [1, 0],
  hard: [2, 0],
  obsidian: [3, 0],
  coal: [0, 1],
  copper: [1, 1],
  ironOre: [2, 1],
  goldOre: [3, 1],
  crystal: [0, 2],
  rainbow: [1, 2],
  dynamite: [2, 2],
  forge: [3, 2],
  fire: [0, 3],
  blueRock: [1, 3],
  ember: [2, 3],
  masonry: [3, 3],
});

function hexToRgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function mixColor(first, second, amount) {
  const a = hexToRgb(first);
  const b = hexToRgb(second);
  const color = a.map((value, index) => Math.round(lerp(value, b[index], amount)));
  return `rgb(${color[0]},${color[1]},${color[2]})`;
}

export class GameEngine {
  constructor(canvas, save, audio, ui, assets) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d", { alpha: false });
    this.save = save;
    this.audio = audio;
    this.ui = ui;
    this.assets = assets;
    this.state = "menu";
    this.speed = 1;
    this.lastTime = performance.now();
    this.time = 0;
    this.particles = [];
    this.particlePool = [];
    this.floaters = [];
    this.shockwaves = [];
    this.pendingExplosions = [];
    this.criticalEvent = null;
    this.shake = 0;
    this.flash = 0;
    this.slowMotion = 0;
    this.lastBiome = BIOMES[0].id;
    this.result = null;
    this.resize();
    globalThis.addEventListener("resize", () => this.resize());
    requestAnimationFrame((time) => this.frame(time));
  }

  resize() {
    const shell = this.canvas.parentElement;
    const ratio = Math.min(2, globalThis.devicePixelRatio || 1);
    const cssWidth = shell.clientWidth || GAME.width;
    const cssHeight = shell.clientHeight || 760;
    this.viewportHeight = GAME.width * cssHeight / cssWidth;
    this.canvas.width = GAME.width * ratio;
    this.canvas.height = this.viewportHeight * ratio;
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  start() {
    const upgrades = this.save.data.upgrades;
    const luckyChance = upgrades.luckyStart * 0.03;
    const tier = Math.random() < luckyChance ? 1 : 0;
    const baseHp = PICKAXES[tier].hp + upgrades.durability * 5;
    this.generator = new MineGenerator({ forgeUpgrade: upgrades.forgeChance });
    this.generator.generateUntil(GAME.generateAhead);
    this.pickaxe = {
      x: GAME.width / 2,
      y: GAME.blockSize * 0.9,
      vx: (Math.random() - 0.5) * 110,
      vy: 80,
      previousX: GAME.width / 2,
      previousY: GAME.blockSize * 0.9,
      rotation: 0,
      spin: (Math.random() - 0.5) * 0.7,
      tier,
      hp: baseHp,
      maxHp: baseHp,
      alive: true,
      slimeCooldown: 0,
    };
    this.run = {
      tier,
      hp: baseHp,
      maxHp: baseHp,
      coins: 0,
      depth: 0,
      blocks: 0,
      ores: 0,
      gold: 0,
      forges: 0,
      dynamites: 0,
      chains: 0,
      criticals: 0,
      maxTier: tier,
      revived: false,
      doubled: false,
    };
    this.cameraY = 0;
    this.state = "playing";
    this.speed = 1;
    this.lastBiome = BIOMES[0].id;
    this.result = null;
    this.pendingExplosions.length = 0;
    this.criticalEvent = null;
    this.particles.length = 0;
    this.floaters.length = 0;
    this.shockwaves.length = 0;
    this.ui.setSpeed(1);
    this.ui.hideCritical();
    this.ui.showGame();
    this.ui.updateHud(this.run);
    this.audio.startMusic();
  }

  frame(timestamp) {
    const rawDelta = clamp((timestamp - this.lastTime) / 1000, 0, 0.035);
    this.lastTime = timestamp;
    this.time += rawDelta;
    let delta = rawDelta * (this.state === "playing" ? this.speed : 1);
    if (this.slowMotion > 0) {
      this.slowMotion -= rawDelta;
      delta *= 0.28;
    }
    if (this.state === "playing") this.update(delta);
    else if (this.state === "critical") this.updateCritical(rawDelta);
    else this.updateAmbient(rawDelta);
    this.render();
    requestAnimationFrame((time) => this.frame(time));
  }

  update(delta) {
    const pickaxe = this.pickaxe;
    if (!pickaxe?.alive) return;
    pickaxe.slimeCooldown = Math.max(0, pickaxe.slimeCooldown - delta);
    pickaxe.vy = Math.min(GAME.maxFallSpeed, pickaxe.vy + GAME.gravity * delta);
    pickaxe.previousX = pickaxe.x;
    pickaxe.previousY = pickaxe.y;
    pickaxe.x += pickaxe.vx * delta;
    pickaxe.y += pickaxe.vy * delta;
    pickaxe.rotation += pickaxe.spin * delta;
    if (pickaxe.rotation > Math.PI) pickaxe.rotation -= Math.PI * 2;
    if (pickaxe.rotation < -Math.PI) pickaxe.rotation += Math.PI * 2;
    pickaxe.spin *= Math.pow(0.48, delta);
    const margin = GAME.collisionRadius + 7;
    if (pickaxe.x < margin || pickaxe.x > GAME.width - margin) {
      pickaxe.x = clamp(pickaxe.x, margin, GAME.width - margin);
      pickaxe.vx *= -0.78;
      pickaxe.spin = clamp(pickaxe.spin + Math.sign(pickaxe.vx) * 1.15, -4.8, 4.8);
      this.shake = Math.max(this.shake, 1.4);
    }
    const targetCamera = Math.max(0, pickaxe.y - this.viewportHeight * 0.38);
    this.cameraY = lerp(this.cameraY, targetCamera, Math.min(1, delta * 5.4));
    const currentRow = Math.floor(pickaxe.y / GAME.blockSize);
    this.generator.generateUntil(currentRow + GAME.generateAhead);
    this.generator.cleanup(this.cameraY);
    this.checkCollision(currentRow);
    this.updateExplosions(delta);
    this.updateEffects(delta);
    this.run.depth = Math.max(this.run.depth, Math.max(0, currentRow - 1) * GAME.metersPerRow);
    const biome = biomeAtDepth(this.run.depth);
    if (biome.id !== this.lastBiome) {
      this.lastBiome = biome.id;
      if (this.save.unlockBiome(biome.id)) {
        this.slowMotion = Math.max(this.slowMotion, 0.95);
        this.ui.showBiomeUnlock(biome);
        this.audio.play("biome");
      }
    }
    this.run.hp = pickaxe.hp;
    this.run.maxHp = pickaxe.maxHp;
    this.run.tier = pickaxe.tier;
    this.ui.updateHud(this.run);
  }

  checkCollision(row) {
    const pickaxe = this.pickaxe;
    const column = clamp(Math.floor(pickaxe.x / GAME.blockSize), 0, GAME.columns - 1);
    const candidates = [];
    for (let y = row - 1; y <= row + 1; y += 1) {
      for (let x = column - 1; x <= column + 1; x += 1) {
        const block = this.generator.get(y, x);
        if (block) candidates.push(block);
      }
    }
    candidates.sort((a, b) => a.y - b.y);
    for (const block of candidates) {
      const collision = this.blockCollision(block);
      if (!collision) continue;
      this.hitBlock(block, collision);
      break;
    }
  }

  blockCollision(block) {
    const pickaxe = this.pickaxe;
    const radius = GAME.collisionRadius;
    const left = block.x;
    const right = block.x + GAME.blockSize;
    const top = block.y;
    const bottom = block.y + GAME.blockSize;
    const closestX = clamp(pickaxe.x, left, right);
    const closestY = clamp(pickaxe.y, top, bottom);
    const offsetX = pickaxe.x - closestX;
    const offsetY = pickaxe.y - closestY;
    const distanceSquared = offsetX * offsetX + offsetY * offsetY;
    if (distanceSquared > radius * radius) return null;
    if (distanceSquared > 0.0001) {
      const distance = Math.sqrt(distanceSquared);
      return { normalX: offsetX / distance, normalY: offsetY / distance };
    }
    if (pickaxe.previousY + radius <= top) return { normalX: 0, normalY: -1 };
    if (pickaxe.previousY - radius >= bottom) return { normalX: 0, normalY: 1 };
    if (pickaxe.previousX + radius <= left) return { normalX: -1, normalY: 0 };
    if (pickaxe.previousX - radius >= right) return { normalX: 1, normalY: 0 };
    const faces = [
      { distance: Math.abs(pickaxe.x - left), normalX: -1, normalY: 0 },
      { distance: Math.abs(right - pickaxe.x), normalX: 1, normalY: 0 },
      { distance: Math.abs(pickaxe.y - top), normalX: 0, normalY: -1 },
      { distance: Math.abs(bottom - pickaxe.y), normalX: 0, normalY: 1 },
    ];
    faces.sort((first, second) => first.distance - second.distance);
    return { normalX: faces[0].normalX, normalY: faces[0].normalY };
  }

  hitBlock(block, collision) {
    if (block.kind === "slime" && this.pickaxe.slimeCooldown > 0) return;
    if (Math.random() < CRITICAL.chance) {
      this.startCritical(block);
      return;
    }
    if (block.kind === "slime") {
      this.bounceOffSlime(block, collision);
      return;
    }
    if (!this.generator.removeBlock(block)) return;
    const pickaxe = this.pickaxe;
    this.run.blocks += 1;
    const { normalX, normalY } = collision;
    const incomingSpeed = Math.hypot(pickaxe.vx, pickaxe.vy);
    const normalSpeed = pickaxe.vx * normalX + pickaxe.vy * normalY;
    if (normalSpeed < 0) {
      const restitution = Math.abs(normalY) > 0.62 ? 0.66 : 0.74;
      pickaxe.vx -= (1 + restitution) * normalSpeed * normalX;
      pickaxe.vy -= (1 + restitution) * normalSpeed * normalY;
    }
    const tangentX = -normalY;
    const tangentY = normalX;
    const blockCenterX = block.x + GAME.blockSize / 2;
    const blockCenterY = block.y + GAME.blockSize / 2;
    const contactOffset = clamp(
      ((pickaxe.x - blockCenterX) * tangentX + (pickaxe.y - blockCenterY) * tangentY)
        / (GAME.blockSize / 2),
      -1,
      1,
    );
    const tangentKick = contactOffset * 28 + (Math.random() - 0.5) * 22;
    pickaxe.vx += tangentX * tangentKick;
    pickaxe.vy += tangentY * tangentKick;
    if (normalY < -0.62 && Math.abs(pickaxe.vx) < 72) {
      const fallbackDirection = contactOffset || Math.sign(pickaxe.previousX - blockCenterX)
        || (Math.random() < 0.5 ? -1 : 1);
      pickaxe.vx = Math.sign(fallbackDirection) * (72 + Math.random() * 48);
    }
    pickaxe.vx = clamp(pickaxe.vx, -250, 250);
    pickaxe.vy = clamp(pickaxe.vy, -300, GAME.maxFallSpeed);
    pickaxe.x = clamp(
      pickaxe.x + normalX * 2.2,
      GAME.collisionRadius + 7,
      GAME.width - GAME.collisionRadius - 7,
    );
    pickaxe.y = Math.max(GAME.collisionRadius, pickaxe.y + normalY * 2.2);
    const tangentialSpeed = pickaxe.vx * tangentX + pickaxe.vy * tangentY;
    const impactTorque = -contactOffset * 2.6 + tangentialSpeed * 0.008;
    pickaxe.spin = clamp(pickaxe.spin * 0.38 + impactTorque, -4.8, 4.8);
    this.shake = Math.max(this.shake, block.damage >= 7 ? 4 : 1.8);
    this.spawnDebris(block, incomingSpeed > 360 ? 10 : 7);
    if (block.kind === "dynamite") {
      this.run.dynamites += 1;
      this.primeExplosion(block, false);
      return;
    }
    if (block.kind === "forge") {
      this.run.forges += 1;
      this.activateForge(block);
      this.generator.release(block);
      return;
    }
    this.audio.play(block.kind === "ore" ? "ore" : "hit");
    if (block.kind === "ore") this.collectOre(block);
    this.damagePickaxe(block.damage);
    this.generator.release(block);
  }

  bounceOffSlime(block, collision) {
    const pickaxe = this.pickaxe;
    if (pickaxe.slimeCooldown > 0) return;
    const { normalX, normalY } = collision;
    const normalSpeed = pickaxe.vx * normalX + pickaxe.vy * normalY;
    if (normalSpeed < 0) {
      pickaxe.vx -= (1 + SLIME.restitution) * normalSpeed * normalX;
      pickaxe.vy -= (1 + SLIME.restitution) * normalSpeed * normalY;
    }
    if (normalY < -0.45) {
      pickaxe.vy = Math.min(pickaxe.vy, -SLIME.minimumBounce);
      const direction = Math.sign(pickaxe.x - (block.x + GAME.blockSize / 2))
        || (Math.random() < 0.5 ? -1 : 1);
      pickaxe.vx += direction * (SLIME.horizontalKick * (0.7 + Math.random() * 0.6));
    } else {
      pickaxe.vx += normalX * SLIME.horizontalKick;
      pickaxe.vy = Math.min(pickaxe.vy, -SLIME.minimumBounce * 0.42);
    }
    pickaxe.vx = clamp(pickaxe.vx, -310, 310);
    pickaxe.vy = clamp(pickaxe.vy, -540, GAME.maxFallSpeed);
    pickaxe.x = clamp(
      pickaxe.x + normalX * 6,
      GAME.collisionRadius + 7,
      GAME.width - GAME.collisionRadius - 7,
    );
    pickaxe.y = Math.max(GAME.collisionRadius, pickaxe.y + normalY * 6);
    pickaxe.spin = clamp(pickaxe.spin + (Math.random() - 0.5) * 4.2, -5.2, 5.2);
    pickaxe.slimeCooldown = SLIME.cooldown;
    block.bounceAt = this.time;
    const x = block.x + GAME.blockSize / 2;
    const y = block.y + GAME.blockSize / 2;
    this.shockwaves.push({ x, y, life: 0.38, maxLife: 0.38, radius: 7, color: SLIME.glow });
    this.spawnBurst(x, y, SLIME.glow, 12);
    this.shake = Math.max(this.shake, 3.5);
    this.audio.play("slime");
  }

  startCritical(sourceBlock) {
    if (this.state !== "playing" || this.criticalEvent) return;
    const pickaxe = this.pickaxe;
    this.state = "critical";
    this.criticalEvent = {
      timer: CRITICAL.duration,
      resolved: false,
      sourceBlockId: sourceBlock.id,
      vx: pickaxe.vx,
      vy: pickaxe.vy,
    };
    pickaxe.vx = 0;
    pickaxe.vy = 0;
    this.run.criticals += 1;
    this.flash = Math.max(this.flash, 1);
    this.shake = Math.max(this.shake, 8);
    this.spawnBurst(pickaxe.x, pickaxe.y, "#fff0a3", 26);
    this.audio.play("critical");
    this.ui.showCritical();
  }

  updateCritical(delta) {
    if (!this.criticalEvent) {
      this.state = "playing";
      return;
    }
    this.updateEffects(delta);
    this.criticalEvent.timer -= delta;
    if (!this.criticalEvent.resolved && this.criticalEvent.timer <= CRITICAL.blastAt) {
      this.criticalEvent.resolved = true;
      this.resolveCritical();
    }
    if (this.criticalEvent.timer > 0) return;
    const event = this.criticalEvent;
    this.criticalEvent = null;
    this.pickaxe.vx = clamp(event.vx * 0.55 + (Math.random() - 0.5) * 70, -230, 230);
    this.pickaxe.vy = clamp(Math.max(120, event.vy * 0.55), 120, 310);
    this.pickaxe.spin = clamp(this.pickaxe.spin + (Math.random() - 0.5) * 2.8, -4.8, 4.8);
    this.state = "playing";
    this.ui.hideCritical();
  }

  resolveCritical() {
    const minY = this.cameraY;
    const maxY = this.cameraY + this.viewportHeight;
    const visible = this.generator.visibleBlocks(this.cameraY, this.viewportHeight)
      .filter((block) => block.y + GAME.blockSize >= minY && block.y <= maxY)
      .sort((first, second) => first.row - second.row || first.column - second.column);
    let destroyed = 0;
    let reward = 0;
    let dynamites = 0;
    for (const block of visible) {
      if (!this.generator.removeBlock(block)) continue;
      destroyed += 1;
      this.run.blocks += 1;
      const before = this.run.coins;
      if (block.kind === "ore") this.collectOre(block, true);
      if (block.kind === "forge") {
        this.run.forges += 1;
        this.activateForge(block);
      }
      if (block.kind === "dynamite") {
        this.run.dynamites += 1;
        dynamites += 1;
      }
      reward += this.run.coins - before;
      this.spawnDebris(block, block.kind === "slime" ? 9 : 4);
      this.generator.release(block);
    }
    const x = this.pickaxe.x;
    const y = this.pickaxe.y;
    this.shockwaves.push({ x, y, life: 0.85, maxLife: 0.85, radius: 10, color: "#fff29a" });
    this.shockwaves.push({ x, y, life: 0.7, maxLife: 0.7, radius: 30, color: "#ff785e" });
    this.spawnBurst(x, y, "#fff5b8", 54);
    this.flash = Math.max(this.flash, 1.35);
    this.shake = Math.max(this.shake, 20);
    this.audio.play("criticalBlast");
    if (dynamites > 0) this.audio.play("explosion");
    this.addFloater(x, y - 26, reward ? `×${destroyed}  +${reward}` : `×${destroyed}`, "#fff29a");
  }

  damagePickaxe(baseDamage) {
    const reduction = Math.min(0.3, this.save.data.upgrades.handle * 0.02);
    const damage = Math.max(1, baseDamage * (1 - reduction));
    this.pickaxe.hp = Math.max(0, this.pickaxe.hp - damage);
    if (this.pickaxe.hp <= 0) this.breakPickaxe();
  }

  collectOre(block, fromExplosion = false) {
    const tier = PICKAXES[this.pickaxe.tier];
    const valueBonus = 1 + this.save.data.upgrades.oreValue * 0.1;
    const reward = Math.max(1, Math.round(block.reward * tier.multiplier * valueBonus));
    this.run.coins += reward;
    this.run.ores += 1;
    if (block.type === "goldOre") this.run.gold += 1;
    const multiplier = tier.multiplier * valueBonus;
    this.addFloater(block.x + GAME.blockSize / 2, block.y, `+${reward}${multiplier > 1.01 ? ` ×${multiplier.toFixed(1)}` : ""}`, ORES[block.type].glow);
    if (fromExplosion) this.spawnDebris(block, 4);
  }

  activateForge(block) {
    const pickaxe = this.pickaxe;
    const previous = PICKAXES[pickaxe.tier];
    const maxed = pickaxe.tier >= PICKAXES.length - 1;
    if (!maxed) pickaxe.tier += 1;
    const current = PICKAXES[pickaxe.tier];
    pickaxe.maxHp = current.hp + this.save.data.upgrades.durability * 5;
    pickaxe.hp = pickaxe.maxHp;
    if (maxed) {
      const bonus = 150;
      this.run.coins += bonus;
      this.addFloater(block.x + 20, block.y - 6, `+${bonus}`, "#8ffcff");
    }
    this.run.maxTier = Math.max(this.run.maxTier, pickaxe.tier);
    this.flash = 0.75;
    this.shake = 8;
    this.slowMotion = 0.38;
    this.spawnBurst(block.x + GAME.blockSize / 2, block.y + GAME.blockSize / 2, current.glow, 28);
    this.audio.play("upgrade");
    this.ui.showUpgrade(previous.name, current.name, maxed);
  }

  primeExplosion(block, chained) {
    if (block.primed) return;
    block.primed = true;
    this.pendingExplosions.push({ block, timer: chained ? 0.22 : 0.16, chained });
  }

  updateExplosions(delta) {
    for (let index = this.pendingExplosions.length - 1; index >= 0; index -= 1) {
      const entry = this.pendingExplosions[index];
      entry.timer -= delta;
      if (entry.timer <= 0) {
        this.pendingExplosions.splice(index, 1);
        this.explode(entry.block, entry.chained);
      }
    }
  }

  explode(origin, chained) {
    const radius = dynamiteRadius(this.save.data.upgrades.dynamite);
    const blocks = this.generator.blocksAround(origin.row, origin.column, radius);
    let reward = 0;
    let destroyed = 0;
    for (const block of blocks) {
      if (block.id === origin.id) continue;
      if (block.kind === "slime") continue;
      if (block.kind === "dynamite" && !block.primed) {
        this.generator.removeBlock(block);
        this.run.dynamites += 1;
        this.run.chains += 1;
        this.primeExplosion(block, true);
        continue;
      }
      if (!this.generator.removeBlock(block)) continue;
      destroyed += 1;
      this.run.blocks += 1;
      const before = this.run.coins;
      if (block.kind === "ore") this.collectOre(block, true);
      reward += this.run.coins - before;
      this.spawnDebris(block, 3);
      this.generator.release(block);
    }
    const x = origin.x + GAME.blockSize / 2;
    const y = origin.y + GAME.blockSize / 2;
    this.shockwaves.push({ x, y, life: 0.55, maxLife: 0.55, radius: 8 });
    this.spawnBurst(x, y, chained ? "#ffeb7a" : "#ff8b3d", 34);
    this.flash = Math.max(this.flash, 0.58);
    this.shake = Math.max(this.shake, chained ? 15 : 11);
    this.audio.play(chained ? "chain" : "explosion");
    this.addFloater(x, y - 15, reward ? `ВЗРЫВ +${reward}` : `ВЗРЫВ ×${destroyed}`, "#ffd86b");
    this.generator.release(origin);
  }

  breakPickaxe(forceFinal = false) {
    if (!this.pickaxe.alive) return;
    const chance = Math.min(0.15, this.save.data.upgrades.secondWind * 0.03);
    if (!forceFinal && Math.random() < chance) {
      this.pickaxe.hp = Math.max(1, Math.ceil(this.pickaxe.maxHp * 0.1));
      this.flash = 0.45;
      this.spawnBurst(this.pickaxe.x, this.pickaxe.y, "#7effbd", 18);
      this.ui.toast("ВТОРОЕ ДЫХАНИЕ! +10% HP");
      this.audio.play("upgrade");
      return;
    }
    this.pickaxe.alive = false;
    this.run.hp = 0;
    this.ui.updateHud(this.run);
    this.spawnBrokenPickaxe();
    this.audio.play("snap");
    this.shake = 13;
    this.state = "breaking";
    setTimeout(() => {
      if (!this.run.revived) this.ui.showRevive();
      else this.finishRun();
    }, 650);
  }

  async revive(showRewarded) {
    const rewarded = await showRewarded();
    if (!rewarded || !this.run || this.run.revived) return false;
    this.run.revived = true;
    this.pickaxe.alive = true;
    this.pickaxe.hp = Math.max(1, Math.ceil(this.pickaxe.maxHp * 0.2));
    this.pickaxe.vy = 80;
    this.state = "playing";
    this.flash = 0.5;
    this.spawnBurst(this.pickaxe.x, this.pickaxe.y, "#70f0ff", 24);
    this.ui.showGame();
    this.ui.toast("Кирка восстановлена: 20% HP");
    return true;
  }

  finishRun() {
    if (!this.run || this.state === "result") return;
    this.ui.hideCritical();
    const depth = Math.round(this.run.depth);
    const newRecord = depth > this.save.data.bestDepth;
    this.save.data.bestDepth = Math.max(this.save.data.bestDepth, depth);
    this.save.data.stats.runs += 1;
    for (const key of ["blocks", "ores", "gold", "dynamites", "chains", "forges"]) {
      this.save.data.stats[key] += this.run[key];
      this.save.updateMission(key, this.run[key]);
    }
    this.save.data.stats.bestTier = Math.max(this.save.data.stats.bestTier, this.run.maxTier);
    this.save.data.stats.totalCoins += this.run.coins;
    if (this.run.maxTier >= 2) this.save.updateMission("ironTier", 1);
    if (this.run.maxTier >= 4) this.save.updateMission("diamondTier", 1);
    if (depth >= 200) this.save.updateMission("depth200", 1);
    if (this.run.coins >= 1000) this.save.updateMission("runCoins1000", 1);
    this.save.addCoins(this.run.coins);
    this.result = { ...this.run, depth, newRecord };
    this.state = "result";
    if (newRecord) this.audio.play("record");
    else this.audio.play("reward");
    this.ui.showResult(this.result);
  }

  async doubleReward(showRewarded) {
    if (!this.result || this.result.doubled) return false;
    const rewarded = await showRewarded();
    if (!rewarded) return false;
    this.result.doubled = true;
    this.run.doubled = true;
    this.save.addCoins(this.result.coins);
    this.ui.showResult(this.result);
    this.ui.toast(`Дополнительно +${this.result.coins} монет`);
    this.audio.play("reward");
    return true;
  }

  pause() {
    if (this.state !== "playing") return;
    this.state = "paused";
    this.ui.showPause();
    this.audio.pause();
  }

  resume() {
    if (this.state !== "paused") return;
    this.state = "playing";
    this.ui.showGame();
    this.audio.resume();
  }

  end() {
    if (this.run && !["menu", "result"].includes(this.state)) this.finishRun();
  }

  goMenu() {
    this.state = "menu";
    this.ui.hideCritical();
    this.run = null;
    this.generator = null;
    this.audio.stopMusic();
  }

  toggleSpeed() {
    this.speed = this.speed === 1 ? 2 : 1;
    this.ui.setSpeed(this.speed);
  }

  updateEffects(delta) {
    for (const particle of this.particles) {
      particle.life -= delta;
      particle.vy += 420 * delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.rotation += particle.spin * delta;
    }
    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      if (this.particles[index].life > 0) continue;
      this.particlePool.push(this.particles[index]);
      this.particles.splice(index, 1);
    }
    for (const floater of this.floaters) {
      floater.life -= delta;
      floater.y -= 32 * delta;
    }
    this.floaters = this.floaters.filter((floater) => floater.life > 0).slice(-30);
    for (const wave of this.shockwaves) {
      wave.life -= delta;
      wave.radius += 190 * delta;
    }
    this.shockwaves = this.shockwaves.filter((wave) => wave.life > 0);
    this.flash = Math.max(0, this.flash - delta * 2.2);
    this.shake = Math.max(0, this.shake - delta * 22);
  }

  updateAmbient(delta) {
    this.updateEffects(delta);
  }

  spawnDebris(block, count) {
    const source = block.kind === "ore" ? ORES[block.type]
      : block.kind === "slime" ? SLIME
        : BLOCKS[block.type];
    this.spawnBurst(block.x + GAME.blockSize / 2, block.y + GAME.blockSize / 2, source?.edge || source?.color || "#b8a28c", count);
  }

  spawnBurst(x, y, color, count) {
    for (let index = 0; index < count && this.particles.length < 160; index += 1) {
      const particle = this.particlePool.pop() || {};
      Object.assign(particle, {
        x, y,
        vx: (Math.random() - 0.5) * 260,
        vy: -50 - Math.random() * 220,
        size: 2 + Math.random() * 6,
        color,
        life: 0.35 + Math.random() * 0.65,
        maxLife: 1,
        rotation: Math.random() * 6,
        spin: (Math.random() - 0.5) * 10,
      });
      this.particles.push(particle);
    }
  }

  spawnBrokenPickaxe() {
    const color = PICKAXES[this.pickaxe.tier].color;
    this.spawnBurst(this.pickaxe.x, this.pickaxe.y, color, 32);
  }

  addFloater(x, y, text, color) {
    this.floaters.push({ x, y, text, color, life: 1.05, maxLife: 1.05 });
  }

  render() {
    const context = this.context;
    context.save();
    const shakeX = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    const shakeY = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    context.translate(shakeX, shakeY);
    if (this.state === "menu") {
      this.renderMenuBackground();
      this.renderMenuBackdrop();
    } else {
      this.renderBackground();
      if (this.generator) this.renderMine();
    }
    if (this.pickaxe && this.state !== "menu") this.renderPickaxe();
    this.renderEffects();
    context.restore();
    if (this.flash > 0) {
      context.fillStyle = `rgba(255,247,196,${this.flash * 0.34})`;
      context.fillRect(0, 0, GAME.width, this.viewportHeight);
    }
  }

  renderBackground() {
    const depth = this.run?.depth || 0;
    const currentIndex = BIOMES.findLastIndex((biome) => depth >= biome.start);
    const current = BIOMES[Math.max(0, currentIndex)];
    const next = BIOMES[Math.min(BIOMES.length - 1, currentIndex + 1)];
    const previous = BIOMES[Math.max(0, currentIndex - 1)];
    let from = current;
    let to = current;
    let blend = 0;

    if (currentIndex > 0) {
      const width = Math.min(260, Math.max(100, (current.start - previous.start) * 0.4));
      if (depth < current.start + width / 2) {
        from = previous;
        to = current;
        blend = clamp((depth - (current.start - width / 2)) / width, 0, 1);
      }
    }
    if (from === current && next !== current) {
      const width = Math.min(260, Math.max(100, (next.start - current.start) * 0.4));
      if (depth > next.start - width / 2) {
        from = current;
        to = next;
        blend = clamp((depth - (next.start - width / 2)) / width, 0, 1);
      }
    }

    const smoothBlend = blend * blend * (3 - 2 * blend);
    const gradient = this.context.createLinearGradient(0, 0, 0, this.viewportHeight);
    gradient.addColorStop(0, mixColor(from.background[0], to.background[0], smoothBlend));
    gradient.addColorStop(1, mixColor(from.background[1], to.background[1], smoothBlend));
    this.context.fillStyle = gradient;
    this.context.fillRect(-20, -20, GAME.width + 40, this.viewportHeight + 40);
    this.drawBiomeArtwork(from, 1);
    if (to !== from && smoothBlend > 0) this.drawBiomeArtwork(to, smoothBlend);
    this.context.fillStyle = "rgba(5,7,15,.22)";
    this.context.fillRect(-20, -20, GAME.width + 40, this.viewportHeight + 40);
    this.context.globalAlpha = 0.13;
    const dustTravel = this.cameraY * 0.31;
    for (let index = 0; index < 18; index += 1) {
      const x = (index * 91) % GAME.width;
      const y = wrap(index * 137 - dustTravel * (0.7 + index % 3 * 0.16), this.viewportHeight + 80) - 40;
      this.context.fillStyle = mixColor(from.dust, to.dust, smoothBlend);
      this.context.fillRect(x, y, index % 4 === 0 ? 2.5 : 1.25, index % 5 === 0 ? 2.5 : 1.25);
    }
    this.context.globalAlpha = 1;
  }

  drawBiomeArtwork(biome, alpha) {
    const image = this.assets?.get(biome.art);
    if (!image) return;
    const context = this.context;
    const sourceRatio = image.width / image.height;
    const segmentHeight = GAME.width / sourceRatio;
    const travel = this.cameraY * 0.22;
    const firstSegment = Math.floor(travel / segmentHeight) - 1;
    const lastSegment = firstSegment + Math.ceil(this.viewportHeight / segmentHeight) + 3;
    context.save();
    context.globalAlpha = alpha;
    context.imageSmoothingEnabled = true;
    for (let segment = firstSegment; segment <= lastSegment; segment += 1) {
      const y = segment * segmentHeight - travel;
      context.save();
      if (Math.abs(segment) % 2 === 1) {
        context.translate(0, y + segmentHeight);
        context.scale(1, -1);
        context.drawImage(image, 0, 0, GAME.width, segmentHeight);
      } else {
        context.drawImage(image, 0, y, GAME.width, segmentHeight);
      }
      context.restore();
    }
    context.restore();
  }

  renderMenuBackground() {
    const gradient = this.context.createLinearGradient(0, 0, 0, this.viewportHeight);
    gradient.addColorStop(0, "#24202a");
    gradient.addColorStop(1, "#090b14");
    this.context.fillStyle = gradient;
    this.context.fillRect(-20, -20, GAME.width + 40, this.viewportHeight + 40);
  }

  renderMenuBackdrop() {
    const context = this.context;
    context.save();
    context.globalAlpha = 0.68;
    const offset = 0;
    for (let row = -1; row < Math.ceil(this.viewportHeight / GAME.blockSize) + 1; row += 1) {
      for (let column = 0; column < GAME.columns; column += 1) {
        const y = row * GAME.blockSize + offset;
        const index = Math.abs(row * 3 + column * 5) % 7;
        const tile = index < 3 ? TILE_ATLAS.dirt : index < 6 ? TILE_ATLAS.stone : TILE_ATLAS.coal;
        this.drawAtlasTile(column * GAME.blockSize, y, tile);
      }
    }
    context.globalAlpha = 1;
    context.restore();
  }

  renderMine() {
    const context = this.context;
    context.save();
    context.translate((GAME.width - GAME.columns * GAME.blockSize) / 2, -this.cameraY);
    const blocks = this.generator.visibleBlocks(this.cameraY, this.viewportHeight);
    for (const block of blocks) this.renderBlock(block);
    context.restore();
  }

  renderBlock(block) {
    const context = this.context;
    const x = block.x;
    const y = block.y;
    if (block.kind === "normal") {
      let tile = TILE_ATLAS[block.type];
      const blockBiome = biomeAtDepth(block.row * GAME.metersPerRow);
      if (blockBiome.id === "fire" || blockBiome.id === "core") {
        tile = block.type === "obsidian" ? TILE_ATLAS.fire : block.type === "hard" ? TILE_ATLAS.ember : TILE_ATLAS.masonry;
      } else if (blockBiome.id === "crystal") {
        tile = block.type === "stone" ? TILE_ATLAS.blueRock : block.type === "hard" ? TILE_ATLAS.obsidian : tile;
      }
      this.drawAtlasTile(x, y, tile);
      return;
    }
    if (block.kind === "ore") {
      this.drawAtlasTile(x, y, TILE_ATLAS[block.type]);
      return;
    }
    if (block.kind === "dynamite") {
      this.drawAtlasTile(x, y, TILE_ATLAS.dynamite);
      context.save();
      context.fillStyle = `rgba(255,221,100,${0.6 + Math.sin(this.time * 10) * 0.3})`;
      context.shadowColor = "#ffb33d";
      context.shadowBlur = 8;
      context.beginPath();
      context.arc(x + GAME.blockSize * 0.58, y + GAME.blockSize * 0.16, 2.1, 0, Math.PI * 2);
      context.fill();
      context.restore();
      return;
    }
    if (block.kind === "slime") {
      this.drawSlimeBlock(block);
      return;
    }
    this.drawAtlasTile(x, y, TILE_ATLAS.forge);
    context.save();
    context.shadowColor = "#6ffff0";
    context.shadowBlur = 15 + Math.sin(this.time * 6) * 4;
    context.strokeStyle = `rgba(113,255,238,${0.45 + Math.sin(this.time * 6) * 0.18})`;
    context.lineWidth = 2;
    context.strokeRect(x + 2, y + 2, GAME.blockSize - 4, GAME.blockSize - 4);
    context.restore();
  }

  drawSlimeBlock(block) {
    const context = this.context;
    const size = GAME.blockSize;
    const age = this.time - (block.bounceAt || -10);
    const impact = age >= 0 && age < 0.36 ? Math.sin(age / 0.36 * Math.PI) : 0;
    const idle = Math.sin(this.time * 3.1 + block.id * 0.73) * 0.025;
    const squash = idle + impact * 0.14;
    context.save();
    const border = context.createLinearGradient(block.x, block.y, block.x, block.y + size);
    border.addColorStop(0, "#24986e");
    border.addColorStop(1, "#075344");
    context.fillStyle = border;
    context.fillRect(block.x, block.y, size, size);
    context.fillStyle = "rgba(139,255,211,.2)";
    context.fillRect(block.x, block.y, size, 2);
    context.fillStyle = "rgba(0,29,28,.42)";
    context.fillRect(block.x, block.y + size - 2, size, 2);
    context.translate(block.x + size / 2, block.y + size / 2);
    context.scale(1 + squash * 0.5, 1 - squash);
    context.translate(-size / 2, -size / 2);
    const gel = context.createLinearGradient(0, 3, 0, size - 3);
    gel.addColorStop(0, "#8affc6");
    gel.addColorStop(0.25, "#37e99a");
    gel.addColorStop(0.72, "#16a774");
    gel.addColorStop(1, "#08705c");
    context.fillStyle = gel;
    context.fillRect(2, 2, size - 4, size - 4);
    context.fillStyle = "rgba(213,255,234,.78)";
    context.fillRect(8, 8, 18, 5);
    context.fillRect(8, 13, 7, 5);
    context.fillStyle = "rgba(2,74,62,.65)";
    context.fillRect(7, size - 12, size - 14, 5);
    context.fillStyle = "rgba(220,255,240,.66)";
    const bubbleA = 10 + (block.id * 7) % 21;
    const bubbleB = 16 + (block.id * 11) % 19;
    context.fillRect(bubbleA, 24, 5, 5);
    context.fillRect(bubbleB, 34, 3, 3);
    context.strokeStyle = `rgba(139,255,211,${0.55 + impact * 0.35})`;
    context.lineWidth = 2;
    context.strokeRect(2, 2, size - 4, size - 4);
    context.restore();
  }

  drawAtlasTile(x, y, tile) {
    const image = this.assets?.get("mine");
    if (!image || !tile) {
      this.drawBlockShape(x, y, "#45505e", "#718092");
      return;
    }
    const sourceWidth = image.width / 4;
    const sourceHeight = image.height / 4;
    this.context.imageSmoothingEnabled = false;
    this.context.drawImage(
      image,
      tile[0] * sourceWidth,
      tile[1] * sourceHeight,
      sourceWidth,
      sourceHeight,
      x,
      y,
      GAME.blockSize,
      GAME.blockSize,
    );
  }

  drawBlockShape(x, y, color, edge) {
    const context = this.context;
    const size = GAME.blockSize;
    context.fillStyle = color;
    context.fillRect(x + 1, y + 1, size - 2, size - 2);
    context.fillStyle = edge;
    context.globalAlpha = 0.42;
    context.fillRect(x + 3, y + 3, size - 6, 5);
    context.fillRect(x + 3, y + 3, 5, size - 6);
    context.globalAlpha = 0.16;
    context.fillStyle = "#000";
    context.fillRect(x + 4, y + size - 8, size - 8, 5);
    context.fillRect(x + size - 8, y + 4, 5, size - 8);
    context.globalAlpha = 1;
  }

  renderPickaxe() {
    const pickaxe = this.pickaxe;
    const context = this.context;
    const screenY = pickaxe.y - this.cameraY;
    const tier = PICKAXES[pickaxe.tier];
    if (pickaxe.alive && pickaxe.vy > 350) {
      context.strokeStyle = `${tier.glow}66`;
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(pickaxe.x, screenY - 22);
      context.lineTo(pickaxe.x - pickaxe.vx * 0.05, screenY - 62);
      context.stroke();
    }
    if (!pickaxe.alive) return;
    context.save();
    context.translate(pickaxe.x, screenY);
    context.rotate(pickaxe.rotation);
    context.shadowColor = tier.glow;
    context.shadowBlur = 10;
    const image = this.assets?.get("pickaxes");
    if (image) {
      const sourceWidth = image.width / PICKAXES.length;
      context.imageSmoothingEnabled = false;
      context.drawImage(
        image,
        pickaxe.tier * sourceWidth,
        0,
        sourceWidth,
        image.height,
        -31,
        -43,
        62,
        86,
      );
    } else {
      context.strokeStyle = tier.color;
      context.lineWidth = 8;
      context.beginPath();
      context.moveTo(-18, -15);
      context.quadraticCurveTo(0, -27, 22, -11);
      context.stroke();
    }
    context.restore();
  }

  renderEffects() {
    const context = this.context;
    context.save();
    context.translate((GAME.width - GAME.columns * GAME.blockSize) / 2, -this.cameraY);
    for (const wave of this.shockwaves) {
      context.globalAlpha = clamp(wave.life / wave.maxLife, 0, 1);
      context.strokeStyle = wave.color || "#ffe275";
      context.lineWidth = 6 * wave.life / wave.maxLife;
      context.beginPath();
      context.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
      context.stroke();
    }
    context.globalAlpha = 1;
    for (const particle of this.particles) {
      context.save();
      context.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.fillStyle = particle.color;
      context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      context.restore();
    }
    for (const floater of this.floaters) {
      const progress = 1 - floater.life / floater.maxLife;
      context.globalAlpha = clamp(floater.life * 2, 0, 1);
      context.font = "800 15px system-ui";
      context.textAlign = "center";
      context.lineWidth = 4;
      context.strokeStyle = "rgba(10,12,20,.8)";
      context.strokeText(floater.text, floater.x, floater.y - progress * 8);
      context.fillStyle = floater.color;
      context.fillText(floater.text, floater.x, floater.y - progress * 8);
    }
    context.restore();
    context.globalAlpha = 1;
  }

  debugSnapshot() {
    return {
      state: this.state,
      pickaxe: this.pickaxe ? {
        tier: this.pickaxe.tier,
        hp: this.pickaxe.hp,
        maxHp: this.pickaxe.maxHp,
        x: Math.round(this.pickaxe.x * 10) / 10,
        y: Math.round(this.pickaxe.y * 10) / 10,
        vx: Math.round(this.pickaxe.vx * 10) / 10,
        vy: Math.round(this.pickaxe.vy * 10) / 10,
        rotation: Math.round(this.pickaxe.rotation * 100) / 100,
        spin: Math.round(this.pickaxe.spin * 100) / 100,
      } : null,
      run: this.run ? { ...this.run } : null,
      pendingExplosions: this.pendingExplosions.length,
      critical: this.criticalEvent ? {
        timer: Math.round(this.criticalEvent.timer * 100) / 100,
        resolved: this.criticalEvent.resolved,
      } : null,
      blocks: this.generator?.blocks.size || 0,
    };
  }

  debugInject(kind, offset = 2, columnOffset = 0, type = kind) {
    if (!this.generator || !this.pickaxe) return null;
    const row = Math.floor(this.pickaxe.y / GAME.blockSize) + offset;
    const column = clamp(Math.floor(this.pickaxe.x / GAME.blockSize) + columnOffset, 0, GAME.columns - 1);
    return this.generator.injectBlock(row, column, kind, type);
  }

  debugForceForge() {
    return this.debugInject("forge", 1);
  }

  debugForceDynamiteChain() {
    const first = this.debugInject("dynamite", 1);
    this.debugInject("dynamite", 1, 1);
    this.debugInject("ore", 2, 0, "goldOre");
    return first;
  }

  debugForceSlime() {
    return this.debugInject("slime", 1);
  }

  debugForceCritical() {
    if (!this.generator || !this.pickaxe || this.state !== "playing") return null;
    const block = this.debugInject("ore", 1, 0, "goldOre");
    this.startCritical(block);
    return block;
  }

  debugSetDepth(meters) {
    if (!this.generator || !this.pickaxe || !this.run) return false;
    const safeDepth = Math.max(0, Number(meters) || 0);
    const row = Math.floor(safeDepth / GAME.metersPerRow) + 1;
    this.generator.generateUntil(row + GAME.generateAhead);
    this.pickaxe.y = row * GAME.blockSize;
    this.pickaxe.previousY = this.pickaxe.y;
    this.pickaxe.vy = 80;
    this.cameraY = Math.max(0, this.pickaxe.y - this.viewportHeight * 0.38);
    this.run.depth = safeDepth;
    return true;
  }

  debugForceBreak() {
    if (!this.pickaxe) return;
    this.pickaxe.hp = 1;
    this.breakPickaxe(true);
  }
}
