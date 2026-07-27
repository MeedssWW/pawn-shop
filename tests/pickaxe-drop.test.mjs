import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { BLOCKS, ORES, PICKAXES, biomeAtDepth, dynamiteRadius, upgradeCost } from "../github-pages/config/gameConfig.js";
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
});

test("generates mine sections on demand with specials and deeper materials", () => {
  const mine = new MineGenerator({ seed: 123456, forgeUpgrade: 6 });
  mine.generateUntil(300);
  assert.ok(mine.blocks.size > 1500);
  const kinds = new Set([...mine.blocks.values()].map(({ kind }) => kind));
  assert.deepEqual(kinds, new Set(["normal", "ore", "dynamite", "forge"]));
  const deepTypes = new Set([...mine.blocks.values()].filter(({ row }) => row > 250).map(({ type }) => type));
  assert.ok(deepTypes.has("obsidian"));
  assert.ok(deepTypes.has("crystal") || deepTypes.has("rainbow"));
  assert.equal(biomeAtDepth(0).id, "earth");
  assert.equal(biomeAtDepth(80).id, "stone");
  assert.equal(biomeAtDepth(170).id, "crystal");
  assert.equal(biomeAtDepth(260).id, "fire");
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
