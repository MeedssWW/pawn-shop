import { AudioManager } from "./systems/AudioManager.js";
import { SaveManager } from "./systems/SaveManager.js";
import { YandexSDK } from "./systems/YandexSDK.js";
import { AssetManager } from "./systems/AssetManager.js";
import { GameEngine } from "./core/GameEngine.js";
import { UIManager } from "./ui/UIManager.js";
import { PICKAXES } from "./config/gameConfig.js";

const launchParams = new URLSearchParams(location.search);
if (launchParams.get("capture") === "mobile") document.documentElement.classList.add("capture-mobile");

const save = new SaveManager();
const audio = new AudioManager(save.data.settings);
const sdk = new YandexSDK();
const assets = await new AssetManager().load();
document.documentElement.style.setProperty("--pickaxe-sprites", `url("${assets.urls.pickaxes}")`);
document.documentElement.style.setProperty("--mine-atlas", `url("${assets.urls.mine}")`);
document.documentElement.style.setProperty("--ui-icons", `url("${assets.urls.ui}")`);
const loadingScreen = document.querySelector("#loading-screen");
loadingScreen.classList.add("ready");
setTimeout(() => loadingScreen.classList.add("hidden"), 280);
const ui = new UIManager(save, audio);
const engine = new GameEngine(document.querySelector("#game-canvas"), save, audio, ui, assets);
let lastInterstitialRun = 0;

const showAdWithAudioPaused = async (showAd) => {
  audio.pause();
  try {
    return await showAd();
  } finally {
    audio.resume();
  }
};

ui.on("start", async () => {
  const runs = save.data.stats.runs;
  if (runs > 0 && runs % 3 === 0 && runs !== lastInterstitialRun) {
    lastInterstitialRun = runs;
    await showAdWithAudioPaused(() => sdk.showFullscreen());
  }
  engine.start();
  sdk.startGameplay();
});
ui.on("pause", () => { engine.pause(); sdk.stopGameplay(); });
ui.on("resume", () => { engine.resume(); sdk.startGameplay(); });
ui.on("end", () => { engine.end(); sdk.stopGameplay(); });
ui.on("speed", () => engine.toggleSpeed());
ui.on("menu", () => { engine.goMenu(); sdk.stopGameplay(); });
ui.on("revive", async () => {
  const revived = await engine.revive(() => showAdWithAudioPaused(() => sdk.showRewarded("revive")));
  if (revived) sdk.startGameplay();
});
ui.on("double", () => engine.doubleReward(
  () => showAdWithAudioPaused(() => sdk.showRewarded("double-reward")),
));
ui.on("runStopped", () => sdk.stopGameplay());

let platformPaused = false;
const pauseFromPlatform = () => {
  platformPaused = engine.state === "playing";
  if (platformPaused) engine.pause();
  audio.pause();
};
const resumeFromPlatform = () => {
  audio.resume();
  if (platformPaused && engine.state === "paused") engine.resume();
  platformPaused = false;
};

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pauseFromPlatform();
  } else {
    resumeFromPlatform();
  }
});

globalThis.addEventListener("pagehide", () => save.save());
globalThis.addEventListener("pointerdown", () => audio.ensureContext(), { once: true });

await sdk.init();
sdk.bindLifecycle({ pause: pauseFromPlatform, resume: resumeFromPlatform });

const debugParams = launchParams;
if (debugParams.has("debug")) {
  globalThis.__pickaxeDebug = {
    snapshot: () => engine.debugSnapshot(),
    startRun: () => engine.start(),
    forceForge: () => engine.debugForceForge(),
    forceDynamiteChain: () => engine.debugForceDynamiteChain(),
    forceSlime: () => engine.debugForceSlime(),
    forceCritical: () => engine.debugForceCritical(),
    forceBreak: () => engine.debugForceBreak(),
    setDepth: (meters) => engine.debugSetDepth(meters),
    setTier: (tier) => {
      if (!engine.pickaxe || !engine.run) return false;
      const safeTier = Math.max(0, Math.min(4, Number(tier) || 0));
      engine.pickaxe.tier = safeTier;
      engine.pickaxe.maxHp = PICKAXES[safeTier].hp + save.data.upgrades.durability * 5;
      engine.pickaxe.hp = engine.pickaxe.maxHp;
      engine.run.tier = safeTier;
      engine.run.maxHp = engine.pickaxe.maxHp;
      engine.run.hp = engine.pickaxe.hp;
      engine.run.maxTier = Math.max(engine.run.maxTier, safeTier);
      return true;
    },
    grantCoins: (amount = 10000) => {
      save.addCoins(Number(amount) || 0);
      ui.updateMenu();
      return save.data.coins;
    },
    clearSave: () => {
      save.reset();
      ui.updateMenu();
      return true;
    },
  };
  if (debugParams.has("coins")) {
    save.addCoins(Math.max(0, Number(debugParams.get("coins")) || 0));
    ui.updateMenu();
  }
  if (debugParams.get("autostart") === "1") {
    engine.start();
    const tier = debugParams.get("tier");
    if (tier !== null) globalThis.__pickaxeDebug.setTier(tier);
    const event = debugParams.get("event");
    const depth = debugParams.get("depth");
    if (depth !== null) engine.debugSetDepth(depth);
    if (event === "forge") setTimeout(() => engine.debugForceForge(), 120);
    if (event === "chain") setTimeout(() => engine.debugForceDynamiteChain(), 120);
    if (event === "slime") setTimeout(() => engine.debugForceSlime(), 120);
    if (event === "critical") setTimeout(() => engine.debugForceCritical(), 260);
    if (event === "break") setTimeout(() => engine.debugForceBreak(), 350);
  }
}
