import { DAILY_MISSIONS, PICKAXES, UPGRADES, upgradeCost } from "../config/gameConfig.js";

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
    $("#hud-pickaxe-icon").style.color = tier.glow;
    $("#hp-fill").style.width = `${ratio * 100}%`;
    $("#hp-fill").dataset.state = ratio > 0.55 ? "high" : ratio > 0.25 ? "medium" : "low";
    $("#hp-text").textContent = `${Math.ceil(run.hp)} / ${run.maxHp} HP`;
    $("#run-coins").textContent = Math.round(run.coins).toLocaleString("ru-RU");
    $("#depth-value").textContent = `${run.depth} м`;
  }

  updateMenu() {
    const data = this.save.data;
    $("#menu-coins").textContent = data.coins.toLocaleString("ru-RU");
    $("#menu-best").textContent = `${data.bestDepth} м`;
    $("#modal-coins").textContent = data.coins.toLocaleString("ru-RU");
    const claimable = data.daily.missions.some((entry) => {
      const config = DAILY_MISSIONS.find((mission) => mission.id === entry.id);
      return config && !entry.claimed && entry.progress >= config.target;
    });
    $("#mission-badge").classList.toggle("hidden", !claimable);
    this.updateSoundButton();
  }

  openModal(type) {
    this.previousScreen = this.screens.result.classList.contains("active") ? "result" : "menu";
    $("#modal-kicker").textContent = type === "upgrades" ? "МАСТЕРСКАЯ" : type === "missions" ? "КАЖДЫЙ ДЕНЬ" : "ПАРАМЕТРЫ";
    $("#modal-title").textContent = type === "upgrades" ? "Улучшения" : type === "missions" ? "Задания" : "Настройки";
    if (type === "upgrades") this.renderUpgrades();
    if (type === "missions") this.renderMissions();
    if (type === "settings") this.renderSettings();
    this.setScreen("modal");
  }

  closeModal() {
    this.setScreen(this.previousScreen);
    this.updateMenu();
  }

  renderUpgrades() {
    const icons = {
      durability: "♥", handle: "◒", oreValue: "◆", dynamite: "✹",
      forgeChance: "⚒", luckyStart: "★", secondWind: "↻",
    };
    const content = $("#modal-content");
    content.innerHTML = `<p class="modal-intro">Улучшения действуют во всех следующих запусках.</p><div class="upgrade-list"></div>`;
    const list = content.querySelector(".upgrade-list");
    for (const [id, config] of Object.entries(UPGRADES)) {
      const level = this.save.data.upgrades[id];
      const maxed = level >= config.max;
      const cost = maxed ? 0 : upgradeCost(id, level);
      const item = document.createElement("article");
      item.className = "upgrade-item";
      item.innerHTML = `
        <span class="upgrade-icon">${icons[id]}</span>
        <div><strong>${config.name}</strong><small>${config.description}</small><i>Уровень ${level}/${config.max}</i></div>
        <button ${maxed || this.save.data.coins < cost ? "disabled" : ""} data-buy="${id}">
          ${maxed ? "МАКС." : `${cost.toLocaleString("ru-RU")} ◆`}
        </button>`;
      list.append(item);
    }
    list.querySelectorAll("[data-buy]").forEach((button) => {
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
          ${entry.claimed ? "ПОЛУЧЕНО" : `+${config.reward} ◆`}
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
    $("#sound-btn").textContent = this.save.data.settings.muted ? "♩̸" : "♫";
  }

  setSpeed(speed) {
    $("#speed-btn").textContent = `×${speed}`;
  }

  showUpgrade(from, to, maxed = false) {
    const element = $("#upgrade-flash");
    element.querySelector("small").textContent = maxed ? "МАКСИМАЛЬНЫЙ УРОВЕНЬ!" : "УЛУЧШЕНИЕ!";
    $("#upgrade-text").textContent = maxed ? `${to} · HP восстановлено` : `${from} → ${to}`;
    element.classList.remove("hidden");
    clearTimeout(this.upgradeTimer);
    this.upgradeTimer = setTimeout(() => element.classList.add("hidden"), 1600);
  }

  showBiome(name) {
    const element = $("#biome-label");
    element.querySelector("strong").textContent = name;
    element.classList.remove("hidden");
    clearTimeout(this.biomeTimer);
    this.biomeTimer = setTimeout(() => element.classList.add("hidden"), 1800);
  }

  toast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.remove("hidden");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast.classList.add("hidden"), 1700);
  }
}
