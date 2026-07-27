import {
  BIOMES,
  CORE_DEPTH,
  COSMETIC_MILESTONES,
  DAILY_MISSIONS,
  PICKAXES,
  UPGRADES,
  accountProgress,
  coreProgress,
  cosmeticRewardForLevel,
  nextBiomeAtDepth,
  rankForLevel,
  upgradeCost,
} from "../config/gameConfig.js";

const $ = (selector) => document.querySelector(selector);

export class UIManager {
  constructor(save, audio) {
    this.save = save;
    this.audio = audio;
    this.callbacks = {};
    this.previousScreen = "menu";
    this.screens = {
      menu: $("#menu-screen"),
      result: $("#result-screen"),
      revive: $("#revive-screen"),
      pause: $("#pause-screen"),
      modal: $("#modal-screen"),
    };
    this.bind();
    this.updateMenu();
  }

  on(name, callback) {
    this.callbacks[name] = callback;
  }

  emit(name, payload) {
    this.audio.play("click");
    this.callbacks[name]?.(payload);
  }

  bind() {
    $("#start-btn").addEventListener("click", () => this.emit("start"));
    $("#again-btn").addEventListener("click", () => this.emit("start"));
    $("#result-menu-btn").addEventListener("click", () => this.showMenu());
    $("#pause-menu-btn").addEventListener("click", () => this.emit("end"));
    $("#end-run-btn").addEventListener("click", () => this.emit("end"));
    $("#revive-btn").addEventListener("click", () => this.emit("revive"));
    $("#double-btn").addEventListener("click", () => this.emit("double"));
    $("#pause-btn").addEventListener("click", () => this.emit("pause"));
    $("#resume-btn").addEventListener("click", () => this.emit("resume"));
    $("#speed-btn").addEventListener("click", () => this.emit("speed"));
    $("#sound-btn").addEventListener("click", () => this.toggleMute());
    $("#modal-back").addEventListener("click", () => this.closeModal());
    document.querySelectorAll("[data-open]").forEach((button) => {
      button.addEventListener("click", () => this.openModal(button.dataset.open));
    });
  }

  setScreen(name) {
    Object.values(this.screens).forEach((screen) => screen.classList.remove("active"));
    if (name) this.screens[name]?.classList.add("active");
  }

  showMenu() {
    this.setScreen("menu");
    $("#game-hud").classList.add("hidden");
    $("#game-controls").classList.add("hidden");
    this.updateMenu();
    this.callbacks.menu?.();
  }

  showGame() {
    this.setScreen(null);
    $("#game-hud").classList.remove("hidden");
    $("#game-controls").classList.remove("hidden");
  }

  showPause() {
    this.setScreen("pause");
  }

  showRevive() {
    this.setScreen("revive");
    this.callbacks.runStopped?.();
  }

  showResult(result) {
    $("#result-depth").textContent = `${result.depth} м`;
    $("#result-blocks").textContent = result.blocks;
    $("#result-ores").textContent = result.ores;
    $("#result-forges").textContent = result.forges;
    $("#result-dynamites").textContent = result.dynamites;
    $("#result-tier").textContent = PICKAXES[result.maxTier].name;
    $("#result-coins").textContent = result.coins.toLocaleString("ru-RU");
    const progress = accountProgress(this.save.data.accountXp);
    const rank = rankForLevel(progress.level);
    $("#result-rank-emblem").textContent = rank.emblem;
    $("#result-rank-emblem").style.setProperty("--rank-color", rank.color);
    $("#result-rank").textContent = `${rank.name.toUpperCase()} · УРОВЕНЬ ${progress.level}`;
    $("#result-xp").textContent = result.account?.leveledUp
      ? `+${result.xp || 0} XP · НОВЫЙ УРОВЕНЬ!`
      : `+${result.xp || 0} XP`;
    $(".xp-result").classList.toggle("leveled", Boolean(result.account?.leveledUp));
    $("#result-xp-fill").style.width = `${progress.ratio * 100}%`;
    $("#record-label").classList.toggle("hidden", !result.newRecord);
    $("#double-btn").disabled = Boolean(result.doubled);
    $("#double-btn small").textContent = result.doubled ? "получено" : "добровольная реклама";
    this.setScreen("result");
    $("#game-hud").classList.add("hidden");
    $("#game-controls").classList.add("hidden");
    this.updateMenu();
    this.callbacks.runStopped?.();
  }

  updateHud(run) {
    const tier = PICKAXES[run.tier];
    const ratio = Math.max(0, run.hp / run.maxHp);
    $("#hud-pickaxe-tier").textContent = tier.name.toUpperCase();
    $("#hud-pickaxe-icon").className = `sprite-tier-${run.tier}`;
    $("#hud-pickaxe-icon").textContent = "";
    $("#hp-fill").style.width = `${ratio * 100}%`;
    $("#hp-fill").dataset.state = ratio > 0.55 ? "high" : ratio > 0.25 ? "medium" : "low";
    $("#hp-text").textContent = `${Math.ceil(run.hp)} / ${run.maxHp} HP`;
    $("#run-coins").textContent = Math.round(run.coins).toLocaleString("ru-RU");
    $("#depth-value").textContent = `${run.depth} м`;
    const best = Math.max(this.save.data.bestDepth, run.depth);
    const next = nextBiomeAtDepth(run.depth);
    const percent = coreProgress(run.depth);
    $("#hud-best").textContent = `${best} м`;
    $("#hud-next-biome").textContent = next
      ? `ДО ${this.save.data.unlockedBiomes.includes(next.id) ? next.name.toUpperCase() : "???"} · ${Math.max(0, next.start - run.depth)} М`
      : "ЯДРО ДОСТИГНУТО";
    $("#hud-core-fill").style.width = `${percent}%`;
    $("#hud-core-percent").textContent = `${percent < 1 && percent > 0 ? percent.toFixed(1) : Math.round(percent)}%`;
  }

  updateMenu() {
    const data = this.save.data;
    $("#menu-coins").textContent = data.coins.toLocaleString("ru-RU");
    $("#menu-best").textContent = `${data.bestDepth} м`;
    $("#modal-coins").textContent = data.coins.toLocaleString("ru-RU");
    const progress = accountProgress(data.accountXp);
    const rank = rankForLevel(progress.level);
    const percent = coreProgress(data.bestDepth);
    $("#menu-rank-emblem").textContent = rank.emblem;
    $("#menu-rank-emblem").style.setProperty("--rank-color", rank.color);
    $("#menu-rank").textContent = `${rank.name.toUpperCase()} · УРОВЕНЬ ${progress.level}`;
    $("#menu-xp-fill").style.width = `${progress.ratio * 100}%`;
    $("#menu-xp").textContent = progress.level >= 50 ? "МАКСИМАЛЬНЫЙ УРОВЕНЬ" : `${progress.current.toLocaleString("ru-RU")} / ${progress.needed.toLocaleString("ru-RU")} XP`;
    $("#menu-core-fill").style.width = `${percent}%`;
    $("#menu-core-percent").textContent = `${percent < 1 && percent > 0 ? percent.toFixed(1) : Math.round(percent)}%`;
    $("#menu-core-left").textContent = data.bestDepth >= CORE_DEPTH
      ? "ЯДРО ДОСТИГНУТО"
      : `ОСТАЛОСЬ ${(CORE_DEPTH - data.bestDepth).toLocaleString("ru-RU")} М`;
    this.applyCosmetics(progress.level);
    const claimable = data.daily.missions.some((entry) => {
      const config = DAILY_MISSIONS.find((mission) => mission.id === entry.id);
      return config && !entry.claimed && entry.progress >= config.target;
    });
    $("#mission-badge").classList.toggle("hidden", !claimable);
    this.updateSoundButton();
  }

  openModal(type) {
    this.previousScreen = this.screens.result.classList.contains("active") ? "result" : "menu";
    $("#modal-kicker").textContent = type === "upgrades" ? "МАСТЕРСКАЯ" : type === "missions" ? "КАЖДЫЙ ДЕНЬ" : type === "progress" ? "ГЛОБАЛЬНАЯ ЦЕЛЬ" : "ПАРАМЕТРЫ";
    $("#modal-title").textContent = type === "upgrades" ? "Улучшения" : type === "missions" ? "Задания" : type === "progress" ? "Путь к ядру" : "Настройки";
    if (type === "upgrades") this.renderUpgrades();
    if (type === "missions") this.renderMissions();
    if (type === "progress") this.renderProgress();
    if (type === "settings") this.renderSettings();
    this.setScreen("modal");
  }

  closeModal() {
    this.setScreen(this.previousScreen);
    this.updateMenu();
  }

  renderUpgrades() {
    const groups = [
      { title: "ОСНОВА КИРКИ", subtitle: "Прочность и заработок", ids: ["durability", "handle", "oreValue"] },
      { title: "УДАЧНЫЙ ЗАБЕГ", subtitle: "Редкие спасения", ids: ["forgeChance", "luckyStart", "secondWind"] },
      { title: "ВЗРЫВНОЕ ДЕЛО", subtitle: "Больше блоков за один взрыв", ids: ["dynamite"] },
    ];
    const upgrades = this.save.data.upgrades;
    const bestTier = Math.max(0, Math.min(4, this.save.data.stats.bestTier || 0));
    const startHp = 50 + upgrades.durability * 5;
    const reduction = Math.min(30, upgrades.handle * 2);
    const income = upgrades.oreValue * 10;
    const content = $("#modal-content");
    content.innerHTML = `
      <section class="workshop-hero">
        <div class="workshop-pickaxe sprite-tier-${bestTier}"><i></i></div>
        <div class="workshop-copy">
          <small>ЛУЧШИЙ НАЙДЕННЫЙ УРОВЕНЬ</small>
          <strong>${PICKAXES[bestTier].name}</strong>
          <p>Каждое улучшение остаётся навсегда.</p>
        </div>
        <div class="workshop-stats">
          <span><b>${startHp}</b><small>СТАРТОВОЕ HP</small></span>
          <span><b>−${reduction}%</b><small>УРОН</small></span>
          <span><b>+${income}%</b><small>РУДА</small></span>
        </div>
      </section>
      <div class="tier-road" aria-label="Уровни кирки">
        ${PICKAXES.map((tier, index) => `<span class="tier-sprite sprite-tier-${index} ${index <= bestTier ? "reached" : ""}" title="${tier.name}"></span>`).join("")}
      </div>
      <div class="upgrade-groups"></div>`;
    const groupRoot = content.querySelector(".upgrade-groups");
    for (const group of groups) {
      const section = document.createElement("section");
      section.className = "upgrade-group";
      section.innerHTML = `<header><div><strong>${group.title}</strong><small>${group.subtitle}</small></div><i>${group.ids.length}</i></header><div class="upgrade-list"></div>`;
      const list = section.querySelector(".upgrade-list");
      for (const id of group.ids) {
        const config = UPGRADES[id];
        const level = upgrades[id];
        const maxed = level >= config.max;
        const cost = maxed ? 0 : upgradeCost(id, level);
        const affordable = this.save.data.coins >= cost;
        const progress = Math.max(3, level / config.max * 100);
        const item = document.createElement("article");
        item.className = `upgrade-item upgrade-${id} ${affordable && !maxed ? "affordable" : ""}`;
        item.innerHTML = `
          <span class="upgrade-icon" aria-hidden="true"></span>
          <div class="upgrade-copy">
            <strong>${config.name}</strong>
            <small>${config.description}</small>
            <span class="upgrade-progress"><i style="width:${progress}%"></i></span>
            <em>УРОВЕНЬ ${level} / ${config.max}</em>
          </div>
          <button ${maxed || !affordable ? "disabled" : ""} data-buy="${id}">
            ${maxed ? `<b>МАКС.</b>` : `<small>УЛУЧШИТЬ</small><b>${cost.toLocaleString("ru-RU")} <i class="ui-icon icon-coin"></i></b>`}
          </button>`;
        list.append(item);
      }
      groupRoot.append(section);
    }
    groupRoot.querySelectorAll("[data-buy]").forEach((button) => {
      button.addEventListener("click", () => this.buyUpgrade(button.dataset.buy));
    });
  }

  buyUpgrade(id) {
    const config = UPGRADES[id];
    const level = this.save.data.upgrades[id];
    if (!config || level >= config.max) return;
    const cost = upgradeCost(id, level);
    if (!this.save.spendCoins(cost)) return;
    this.save.data.upgrades[id] += 1;
    this.save.save();
    this.audio.play("upgrade");
    this.renderUpgrades();
    this.updateMenu();
    this.toast(`${config.name}: уровень ${level + 1}`);
  }

  renderMissions() {
    const content = $("#modal-content");
    content.innerHTML = `<p class="modal-intro">Новые задания появятся завтра по времени устройства.</p><div class="mission-list"></div>`;
    const list = content.querySelector(".mission-list");
    for (const entry of this.save.data.daily.missions) {
      const config = DAILY_MISSIONS.find((mission) => mission.id === entry.id);
      if (!config) continue;
      const ready = entry.progress >= config.target;
      const item = document.createElement("article");
      item.className = `mission-item ${ready ? "ready" : ""} ${entry.claimed ? "claimed" : ""}`;
      const progress = Math.min(100, entry.progress / config.target * 100);
      item.innerHTML = `
        <div><strong>${config.label}</strong><small>${entry.progress} / ${config.target}</small>
          <span class="mission-progress"><i style="width:${progress}%"></i></span></div>
        <button data-claim="${entry.id}" ${!ready || entry.claimed ? "disabled" : ""}>
          ${entry.claimed ? "ПОЛУЧЕНО" : `+${config.reward} <i class="ui-icon icon-coin"></i>`}
        </button>`;
      list.append(item);
    }
    list.querySelectorAll("[data-claim]").forEach((button) => {
      button.addEventListener("click", () => {
        const reward = this.save.claimMission(button.dataset.claim);
        if (reward) {
          this.audio.play("reward");
          this.toast(`Награда: +${reward} монет`);
          this.renderMissions();
          this.updateMenu();
        }
      });
    });
  }

  renderProgress() {
    const data = this.save.data;
    const progress = accountProgress(data.accountXp);
    const rank = rankForLevel(progress.level);
    const percent = coreProgress(data.bestDepth);
    const nextBiome = nextBiomeAtDepth(data.bestDepth);
    const nextReward = cosmeticRewardForLevel(Math.min(50, progress.level + 1));
    const content = $("#modal-content");
    content.innerHTML = `
      <section class="expedition-profile" style="--rank-color:${rank.color};--level-hue:${(progress.level * 23) % 360}">
        <span class="rank-emblem">${rank.emblem}</span>
        <div>
          <small>ЗВАНИЕ</small>
          <strong>${rank.name}</strong>
          <p>Уровень аккаунта ${progress.level}</p>
          <i class="account-progress"><b style="width:${progress.ratio * 100}%"></b></i>
          <em>${progress.level >= 50 ? "МАКСИМАЛЬНЫЙ УРОВЕНЬ" : `${progress.current.toLocaleString("ru-RU")} / ${progress.needed.toLocaleString("ru-RU")} XP`}</em>
        </div>
      </section>
      <section class="core-map-summary">
        <div><small>ЭКСПЕДИЦИЯ К ЯДРУ</small><strong>${percent < 1 && percent > 0 ? percent.toFixed(1) : Math.round(percent)}%</strong></div>
        <i><b style="width:${percent}%"></b><span style="left:${percent}%"></span></i>
        <p><span>РЕКОРД <b>${data.bestDepth.toLocaleString("ru-RU")} М</b></span><span>${nextBiome ? `ДО ${data.unlockedBiomes.includes(nextBiome.id) ? nextBiome.name.toUpperCase() : "???"} <b>${Math.max(0, nextBiome.start - data.bestDepth).toLocaleString("ru-RU")} М</b>` : "<b>ЯДРО ДОСТИГНУТО</b>"}</span></p>
      </section>
      <section class="depth-map">
        ${BIOMES.map((biome, index) => {
          const unlocked = data.unlockedBiomes.includes(biome.id);
          const reached = data.bestDepth >= biome.start;
          const artUrl = unlocked ? `url("${this.biomeArtUrl(biome)}")` : "none";
          return `<article class="${unlocked ? "unlocked" : "locked"} ${reached ? "reached" : ""}" style="--biome-art:${artUrl};--biome-color:${biome.dust}">
            <span class="map-node">${unlocked ? (index === BIOMES.length - 1 ? "●" : "◆") : "?"}</span>
            <div><small>${biome.start.toLocaleString("ru-RU")} М</small><strong>${unlocked ? biome.name : "???"}</strong><p>${unlocked ? biome.description : "Продолжай спуск, чтобы открыть эту область"}</p></div>
            <i>${reached ? "ОТКРЫТО" : `${Math.max(0, biome.start - data.bestDepth).toLocaleString("ru-RU")} М`}</i>
          </article>`;
        }).join("")}
      </section>
      <section class="cosmetic-road">
        <header><div><strong>НАГРАДЫ ЭКСПЕДИЦИИ</strong><small>Только косметика — никакого преимущества</small></div><i>50</i></header>
        <div class="next-cosmetic"><span>${nextReward.icon}</span><div><small>СЛЕДУЮЩЕЕ ОТКРЫТИЕ · УР. ${nextReward.level}</small><strong>${nextReward.name}</strong><p>${nextReward.detail}</p></div></div>
        <div class="cosmetic-grid">
          ${COSMETIC_MILESTONES.map((reward) => `<article class="${progress.level >= reward.level ? "unlocked" : "locked"}">
            <span>${reward.icon}</span><small>УРОВЕНЬ ${reward.level}</small><strong>${reward.name}</strong><p>${reward.detail}</p>
          </article>`).join("")}
        </div>
      </section>`;
  }

  biomeArtUrl(biome) {
    const map = {
      biomeSurface: "assets/biomes/surface.jpg",
      biomeSoil: "assets/biomes/soil.jpg",
      biomeStone: "assets/biomes/stone.jpg",
      biomeCrystal: "assets/biomes/crystal.jpg",
      biomeLava: "assets/biomes/lava.jpg",
      biomeCore: "assets/biomes/core.jpg",
    };
    return new URL(map[biome.art], document.baseURI).href;
  }

  applyCosmetics(level) {
    const shell = $("#game-shell");
    shell.dataset.accountLevel = level;
    shell.style.setProperty("--level-hue", (level * 23) % 360);
    shell.classList.toggle("cosmetic-frame", level >= 5);
    shell.classList.toggle("cosmetic-menu", level >= 10);
    shell.classList.toggle("critical-v2", level >= 25);
    shell.classList.toggle("ui-aurora", level >= 30);
    shell.classList.toggle("legendary-frame", level >= 50);
  }

  renderSettings() {
    const settings = this.save.data.settings;
    $("#modal-content").innerHTML = `
      <div class="settings-list">
        <label><span><strong>Музыка</strong><small>Фоновая атмосфера шахты</small></span>
          <input id="music-range" type="range" min="0" max="1" step="0.05" value="${settings.music}"></label>
        <label><span><strong>Звуки</strong><small>Удары, руда и взрывы</small></span>
          <input id="sound-range" type="range" min="0" max="1" step="0.05" value="${settings.sound}"></label>
        <button id="mute-toggle" class="settings-button">${settings.muted ? "ВКЛЮЧИТЬ ЗВУК" : "ОТКЛЮЧИТЬ ЗВУК"}</button>
        <button id="reset-save" class="settings-button danger">СБРОСИТЬ ПРОГРЕСС</button>
      </div>`;
    const update = () => {
      settings.music = Number($("#music-range").value);
      settings.sound = Number($("#sound-range").value);
      this.save.save();
      this.audio.updateSettings(settings);
    };
    $("#music-range").addEventListener("input", update);
    $("#sound-range").addEventListener("input", update);
    $("#mute-toggle").addEventListener("click", () => {
      settings.muted = !settings.muted;
      this.save.save();
      this.audio.updateSettings(settings);
      this.renderSettings();
      this.updateSoundButton();
    });
    $("#reset-save").addEventListener("click", () => {
      if (!globalThis.confirm("Сбросить монеты, рекорды и все улучшения?")) return;
      this.save.reset();
      this.audio.updateSettings(this.save.data.settings);
      this.renderSettings();
      this.updateMenu();
      this.toast("Прогресс сброшен");
    });
  }

  toggleMute() {
    this.save.data.settings.muted = !this.save.data.settings.muted;
    this.save.save();
    this.audio.updateSettings(this.save.data.settings);
    this.updateSoundButton();
  }

  updateSoundButton() {
    const icon = $("#sound-btn .ui-icon");
    icon.className = `ui-icon ${this.save.data.settings.muted ? "icon-muted" : "icon-sound"}`;
  }

  setSpeed(speed) {
    $("#speed-btn b").textContent = `×${speed}`;
  }

  showUpgrade(from, to, maxed = false) {
    const element = $("#upgrade-flash");
    element.querySelector("small").textContent = maxed ? "МАКСИМАЛЬНЫЙ УРОВЕНЬ!" : "УЛУЧШЕНИЕ!";
    $("#upgrade-text").textContent = maxed ? `${to} · HP восстановлено` : `${from} → ${to}`;
    element.classList.remove("hidden");
    clearTimeout(this.upgradeTimer);
    this.upgradeTimer = setTimeout(() => element.classList.add("hidden"), 1600);
  }

  showCritical() {
    const element = $("#critical-flash");
    element.classList.add("hidden");
    void element.offsetWidth;
    element.classList.remove("hidden");
    $("#game-shell").classList.add("critical-active");
  }

  hideCritical() {
    $("#critical-flash").classList.add("hidden");
    $("#game-shell").classList.remove("critical-active");
  }

  showBiome(name) {
    const element = $("#biome-label");
    element.querySelector("strong").textContent = name;
    element.classList.remove("hidden");
    clearTimeout(this.biomeTimer);
    this.biomeTimer = setTimeout(() => element.classList.add("hidden"), 1800);
  }

  showBiomeUnlock(biome) {
    const element = $("#biome-unlock");
    element.style.setProperty("--biome-unlock-art", `url("${this.biomeArtUrl(biome)}")`);
    $("#biome-unlock-name").textContent = biome.name;
    $("#biome-unlock-description").textContent = biome.description;
    $("#biome-unlock-depth").textContent = `ГЛУБИНА ${biome.start.toLocaleString("ru-RU")} М`;
    element.classList.add("hidden");
    void element.offsetWidth;
    element.classList.remove("hidden");
    clearTimeout(this.biomeUnlockTimer);
    this.biomeUnlockTimer = setTimeout(() => element.classList.add("hidden"), 2700);
  }

  toast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.remove("hidden");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast.classList.add("hidden"), 1700);
  }
}
