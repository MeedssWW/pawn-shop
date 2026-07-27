export class YandexSDK {
  constructor() {
    this.ysdk = null;
    this.available = false;
  }

  async init() {
    try {
      if (!globalThis.YaGames?.init && this.shouldLoadSDK()) await this.loadScript();
      if (!globalThis.YaGames?.init) return null;
      this.ysdk = await globalThis.YaGames.init();
      this.available = true;
      this.ysdk.features?.LoadingAPI?.ready?.();
      return this.ysdk;
    } catch {
      this.available = false;
      return null;
    }
  }

  shouldLoadSDK() {
    return globalThis.top !== globalThis.self || /(^|\.)yandex\./i.test(globalThis.location?.hostname || "");
  }

  loadScript() {
    return new Promise((resolve) => {
      const existing = document.querySelector('script[data-yandex-games-sdk]');
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", resolve, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://sdk.games.s3.yandex.net/sdk.js";
      script.dataset.yandexGamesSdk = "true";
      script.onload = resolve;
      script.onerror = resolve;
      document.head.append(script);
    });
  }

  ready() {
    try {
      this.ysdk?.features?.LoadingAPI?.ready?.();
    } catch {}
  }

  startGameplay() {
    try { this.ysdk?.features?.GameplayAPI?.start?.(); } catch {}
  }

  stopGameplay() {
    try { this.ysdk?.features?.GameplayAPI?.stop?.(); } catch {}
  }

  bindLifecycle({ pause, resume }) {
    try {
      this.ysdk?.on?.("game_api_pause", pause);
      this.ysdk?.on?.("game_api_resume", resume);
    } catch {}
  }

  showFullscreen() {
    return new Promise((resolve) => {
      if (!this.available || !this.ysdk?.adv) {
        resolve({ shown: false, local: true });
        return;
      }
      this.stopGameplay();
      this.ysdk.adv.showFullscreenAdv({
        callbacks: {
          onClose: (wasShown) => resolve({ shown: Boolean(wasShown) }),
          onError: () => resolve({ shown: false }),
        },
      });
    });
  }

  showRewarded() {
    return new Promise((resolve) => {
      if (!this.available || !this.ysdk?.adv) {
        window.setTimeout(() => resolve(true), 350);
        return;
      }
      let rewarded = false;
      this.stopGameplay();
      this.ysdk.adv.showRewardedVideo({
        callbacks: {
          onRewarded: () => { rewarded = true; },
          onClose: () => resolve(rewarded),
          onError: () => resolve(false),
        },
      });
    });
  }
}
