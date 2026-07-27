import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { BIOMES, BLOCKS, CORE_DEPTH, CRITICAL, GAME, GENERATION, ORES, PICKAXES, SLIME, accountLevelFromXp, biomeAtDepth, coreProgress, dynamiteRadius, rankForLevel, upgradeCost } from "../github-pages/config/gameConfig.js";
import { GameEngine } from "../github-pages/core/GameEngine.js";
import { MineGenerator } from "../github-pages/systems/MineGenerator.js";
import { SaveManager, SAVE_KEY } from "../github-pages/systems/SaveManager.js";

class MemoryStorage {
  constructor(value) { this.value = value; }
  getItem(key) { return key === SAVE_KEY ? this.value : null; }
  setItem(key, value) { if (key === SAVE_KEY) this.value = value; }
}

test("ships the five configured pickaxes and complete resource balance", () => {
  assert.deepEqual(PICKAXES.map(({ hp }) => hp), [50, 90, 150, 220, 320]);
  assert.deepEqual(PICKAXES.map(({ multiplier }) => multiplier), [1, 1.25, 1.6, 2, 3]);
  assert.deepEqual(Object.values(BLOCKS).map(({ damage }) => damage), [2, 4, 7, 12]);
  assert.deepEqual(Object.values(ORES).map(({ reward }) => reward), [1, 3, 7, 15, 35, 100]);
  assert.equal(dynamiteRadius(1), 1);
  assert.equal(dynamiteRadius(2), 2);
  assert.equal(dynamiteRadius(3), 3);
  assert.ok(upgradeCost("durability", 1) > upgradeCost("durability", 0));
  assert.equal(CRITICAL.chance, 0.006);
  assert.equal(GENERATION.base.forge, 0.006);
  assert.equal(GENERATION.base.dynamite, 0.025);
  assert.equal(GENERATION.base.slime, 0.015);
  assert.ok(SLIME.minimumBounce > 300);
});

test("generates mine sections on demand with specials and deeper materials", () => {
  const mine = new MineGenerator({ seed: 123456, forgeUpgrade: 6 });
  mine.generateUntil(300);
  assert.ok(mine.blocks.size > 1500);
  const kinds = new Set([...mine.blocks.values()].map(({ kind }) => kind));
  assert.deepEqual(kinds, new Set(["normal", "ore", "dynamite", "forge", "slime"]));
  const baselineMine = new MineGenerator({ seed: 123456, forgeUpgrade: 0 });
  baselineMine.generateUntil(500);
  const generated = [...baselineMine.blocks.values()];
  const ratio = (kind) => generated.filter((block) => block.kind === kind).length / generated.length;
  assert.ok(ratio("forge") < 0.012);
  assert.ok(ratio("dynamite") < 0.045);
  assert.ok(ratio("slime") < 0.025);
  const deepTypes = new Set([...mine.blocks.values()].filter(({ row }) => row > 250).map(({ type }) => type));
  assert.ok(deepTypes.has("obsidian"));
  assert.ok(deepTypes.has("crystal") || deepTypes.has("rainbow"));
  assert.equal(biomeAtDepth(0).id, "surface");
  assert.equal(biomeAtDepth(100).id, "earth");
  assert.equal(biomeAtDepth(450).id, "stone");
  assert.equal(biomeAtDepth(1000).id, "crystal");
  assert.equal(biomeAtDepth(1800).id, "fire");
  assert.equal(biomeAtDepth(3000).id, "core");
});

test("supports deterministic chain-reaction neighborhoods", () => {
  const mine = new MineGenerator({ seed: 9 });
  mine.generateUntil(20);
  const first = mine.injectBlock(10, 3, "dynamite");
  const second = mine.injectBlock(10, 4, "dynamite");
  const ore = mine.injectBlock(11, 3, "ore", "goldOre");
  const neighborhood = mine.blocksAround(first.row, first.column, 1);
  assert.ok(neighborhood.includes(second));
  assert.ok(neighborhood.includes(ore));
  assert.equal(ore.reward, 15);
  const slime = mine.injectBlock(12, 5, "slime");
  assert.equal(slime.damage, 0);
  assert.equal(slime.kind, "slime");
});

test("recovers safely from corrupt saves and persists upgrades", () => {
  const storage = new MemoryStorage("{broken-json");
  const save = new SaveManager(storage);
  assert.equal(save.data.coins, 0);
  assert.equal(save.data.upgrades.dynamite, 1);
  save.addCoins(500);
  save.data.upgrades.durability = 3;
  save.save();
  const reloaded = new SaveManager(storage);
  assert.equal(reloaded.data.coins, 500);
  assert.equal(reloaded.data.upgrades.durability, 3);
  assert.equal(reloaded.data.daily.missions.length, 3);
  assert.equal(reloaded.data.accountXp, 0);
  assert.deepEqual(reloaded.data.unlockedBiomes, ["surface"]);
});

test("tracks the permanent expedition to the core, account levels and ranks", () => {
  assert.equal(CORE_DEPTH, 3000);
  assert.equal(GAME.metersPerRow, 10);
  assert.equal(BIOMES.length, 6);
  assert.equal(coreProgress(1500), 50);
  assert.equal(coreProgress(3000), 100);
  assert.equal(accountLevelFromXp(0), 1);
  assert.ok(accountLevelFromXp(1000) > 1);
  assert.equal(rankForLevel(1).name, "Новичок");
  assert.equal(rankForLevel(50).name, "Легенда шахты");
});

test("production HTML contains the canvas, mobile controls, Yandex SDK and modular entry", async () => {
  const html = await readFile(new URL("../github-pages/index.html", import.meta.url), "utf8");
  const sdkSource = await readFile(new URL("../github-pages/systems/YandexSDK.js", import.meta.url), "utf8");
  assert.match(html, /id="game-canvas"/);
  assert.match(html, /id="speed-btn"/);
  assert.match(html, /id="pause-btn"/);
  assert.match(sdkSource, /yandex\.ru\/games\/sdk\/v2/);
  assert.match(sdkSource, /LoadingAPI/);
  assert.match(html, /type="module" src="\/main\.js"/);
  assert.doesNotMatch(html, /Ломбард|Minecraft/);
  await access(new URL("../github-pages/public/assets/mine-texture-atlas.png", import.meta.url));
  await access(new URL("../github-pages/public/assets/pickaxe-sprites.png", import.meta.url));
  await access(new URL("../github-pages/public/assets/ui-icon-atlas.png", import.meta.url));
  await access(new URL("../github-pages/public/assets/biomes/surface.jpg", import.meta.url));
  await access(new URL("../github-pages/public/assets/biomes/core.jpg", import.meta.url));
});

test("uses collision normals for physical ricochets without position teleports", async () => {
  const engineSource = await readFile(new URL("../github-pages/core/GameEngine.js", import.meta.url), "utf8");
  assert.doesNotMatch(engineSource, /pickaxe\.y = block\.y - 1/);
  assert.doesNotMatch(engineSource, /bounceDirection \* bounceImpulse/);
  assert.match(engineSource, /blockCollision\(block\)/);
  assert.match(engineSource, /normalSpeed \* normalX/);
  assert.match(engineSource, /normalSpeed \* normalY/);
  assert.match(engineSource, /const restitution =/);
  assert.match(engineSource, /pickaxe\.vy = clamp\(pickaxe\.vy, -300/);
  assert.match(engineSource, /const impactTorque =/);
});

test("uses semantic icons for every permanent upgrade", async () => {
  const css = await readFile(new URL("../github-pages/styles.css", import.meta.url), "utf8");
  assert.match(css, /\.upgrade-icon\s*\{[^}]*background-image:var\(--ui-icons\)/s);
  assert.match(css, /\.upgrade-icon\s*\{[^}]*background-size:224px 224px/s);
  assert.match(css, /\.upgrade-durability \.upgrade-icon \{ background-position:-56\.9px -162\.9px; \}/);
  assert.match(css, /\.upgrade-handle \.upgrade-icon \{ background-position:-57\.5px -3\.5px; \}/);
  assert.match(css, /\.upgrade-oreValue \.upgrade-icon \{ background-position:-3\.2px -5\.3px; \}/);
  assert.match(css, /\.upgrade-dynamite \.upgrade-icon \{ background-position:-163\.8px -161\.1px; \}/);
  assert.match(css, /\.upgrade-luckyStart \.upgrade-icon \{ background-position:-2\.6px -162\.4px; \}/);
  assert.match(css, /\.upgrade-secondWind \.upgrade-icon \{ background-position:-58\.6px -109\.2px; \}/);
});

test("implements indestructible slime rebounds and the full-screen critical event", async () => {
  const engineSource = await readFile(new URL("../github-pages/core/GameEngine.js", import.meta.url), "utf8");
  const audioSource = await readFile(new URL("../github-pages/systems/AudioManager.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../github-pages/index.html", import.meta.url), "utf8");
  assert.match(engineSource, /block\.kind === "slime"/);
  assert.match(engineSource, /bounceOffSlime\(block, collision\)/);
  assert.match(engineSource, /if \(block\.kind === "slime"\) continue;/);
  assert.match(engineSource, /Math\.random\(\) < CRITICAL\.chance/);
  assert.match(engineSource, /visibleBlocks\(this\.cameraY, this\.viewportHeight\)/);
  assert.match(engineSource, /this\.collectOre\(block, true\)/);
  assert.match(engineSource, /this\.activateForge\(block\)/);
  assert.match(engineSource, /this\.state = "critical"/);
  assert.match(audioSource, /slime:/);
  assert.match(audioSource, /criticalBlast:/);
  assert.match(html, /id="critical-flash"/);
  assert.match(html, />CRITICAL</);
});

test("critical blast collects ores, activates forges and removes every visible block", () => {
  const generator = new MineGenerator({ seed: 7 });
  generator.injectBlock(2, 0, "normal", "dirt");
  generator.injectBlock(2, 1, "ore", "goldOre");
  generator.injectBlock(2, 2, "forge");
  generator.injectBlock(2, 3, "dynamite");
  generator.injectBlock(2, 4, "slime");
  const played = [];
  const engine = Object.assign(Object.create(GameEngine.prototype), {
    generator,
    cameraY: 0,
    viewportHeight: 300,
    pickaxe: { x: 210, y: 90, tier: 0, hp: 50, maxHp: 50 },
    run: { coins: 0, blocks: 0, ores: 0, gold: 0, forges: 0, dynamites: 0, maxTier: 0 },
    save: { data: { upgrades: { durability: 0, oreValue: 0, dynamite: 1 } } },
    ui: { showUpgrade() {} },
    audio: { play(name) { played.push(name); } },
    particles: [],
    particlePool: [],
    floaters: [],
    shockwaves: [],
    flash: 0,
    shake: 0,
    slowMotion: 0,
  });
  engine.resolveCritical();
  assert.equal(generator.blocks.size, 0);
  assert.equal(engine.run.blocks, 5);
  assert.equal(engine.run.ores, 1);
  assert.equal(engine.run.gold, 1);
  assert.equal(engine.run.forges, 1);
  assert.equal(engine.run.dynamites, 1);
  assert.equal(engine.run.coins, 15);
  assert.equal(engine.pickaxe.tier, 1);
  assert.ok(played.includes("criticalBlast"));
});

test("slime launches the pickaxe upward without removing or damaging the block", () => {
  const generator = new MineGenerator({ seed: 8 });
  const slime = generator.injectBlock(3, 4, "slime");
  const engine = Object.assign(Object.create(GameEngine.prototype), {
    generator,
    time: 4,
    pickaxe: {
      x: slime.x + 18,
      y: slime.y - 8,
      vx: 20,
      vy: 420,
      spin: 0,
      slimeCooldown: 0,
    },
    audio: { play() {} },
    shockwaves: [],
    particles: [],
    particlePool: [],
    shake: 0,
  });
  engine.bounceOffSlime(slime, { normalX: 0, normalY: -1 });
  assert.ok(engine.pickaxe.vy <= -SLIME.minimumBounce);
  assert.ok(Math.abs(engine.pickaxe.vx) >= 55);
  assert.equal(generator.get(3, 4), slime);
  assert.equal(slime.damage, 0);
});

test("desktop typography, seamless slime tiles and cave backdrop remain enabled", async () => {
  const engineSource = await readFile(new URL("../github-pages/core/GameEngine.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../github-pages/styles.css", import.meta.url), "utf8");
  assert.match(engineSource, /renderCaveBackdrop\(current, next, blend\)/);
  assert.match(engineSource, /fillRect\(block\.x, block\.y, size, size\)/);
  assert.match(css, /\.mission-item strong \{ display:block;/);
  assert.match(css, /@media \(min-width: 700px\)/);
  assert.match(css, /\.upgrade-copy > strong \{ font-size:11\.5px;/);
});
