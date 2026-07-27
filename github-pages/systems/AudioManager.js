export class AudioManager {
  constructor(settings) {
    this.settings = settings;
    this.context = null;
    this.musicNodes = [];
    this.musicStarted = false;
    this.accountLevel = 1;
  }

  ensureContext() {
    if (!this.context) {
      const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (AudioContextClass) this.context = new AudioContextClass();
    }
    if (this.context?.state === "suspended") void this.context.resume();
    return this.context;
  }

  tone(frequency, duration = 0.08, type = "triangle", volume = 0.12, glide = 0) {
    if (this.settings.muted || !this.settings.sound) return;
    const context = this.ensureContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    if (glide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, frequency + glide), context.currentTime + duration);
    const level = Math.max(0.0001, volume * this.settings.sound);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(level, context.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration + 0.02);
  }

  noise(duration = 0.18, volume = 0.12) {
    if (this.settings.muted || !this.settings.sound) return;
    const context = this.ensureContext();
    if (!context) return;
    const length = Math.floor(context.sampleRate * duration);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) data[index] = Math.random() * 2 - 1;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    gain.gain.setValueAtTime(volume * this.settings.sound, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
  }

  play(name) {
    const sounds = {
      click: () => this.tone(420, 0.05, "square", 0.05, 80),
      hit: () => this.tone(130, 0.07, "triangle", 0.08, -35),
      break: () => { this.tone(190, 0.08, "square", 0.06, -90); this.noise(0.07, 0.035); },
      ore: () => { this.tone(660, 0.1, "sine", 0.09, 260); this.tone(920, 0.12, "sine", 0.05, 180); },
      explosion: () => { this.noise(0.38, 0.18); this.tone(85, 0.32, "sawtooth", 0.13, -40); },
      chain: () => { this.tone(260, 0.16, "square", 0.1, 280); this.noise(0.25, 0.12); },
      slime: () => {
        this.tone(145, 0.22, "sine", 0.13, 420);
        this.tone(260, 0.12, "triangle", 0.06, 190);
      },
      critical: () => {
        this.tone(95, 0.42, "sawtooth", 0.12, 260);
        [440, 660, 880].forEach((frequency, index) => {
          setTimeout(() => this.tone(frequency, 0.2, "square", 0.08, 120), 55 + index * 55);
        });
      },
      criticalBlast: () => {
        this.noise(0.46, 0.2);
        this.tone(72, 0.42, "sawtooth", 0.15, -30);
        [760, 940, 1180].forEach((frequency, index) => {
          setTimeout(() => this.tone(frequency, 0.28, "sine", 0.08), index * 42);
        });
      },
      upgrade: () => [420, 590, 820].forEach((frequency, index) => setTimeout(() => this.tone(frequency, 0.22, "sine", 0.11, 100), index * 80)),
      snap: () => { this.noise(0.2, 0.13); this.tone(180, 0.3, "square", 0.11, -120); },
      reward: () => [720, 880, 1080].forEach((frequency, index) => setTimeout(() => this.tone(frequency, 0.16, "sine", 0.08), index * 55)),
      record: () => [520, 650, 780, 1040].forEach((frequency, index) => setTimeout(() => this.tone(frequency, 0.24, "triangle", 0.1), index * 75)),
      biome: () => [220, 330, 494, 660].forEach((frequency, index) => setTimeout(() => this.tone(frequency, 0.34, "sine", 0.085, 90), index * 95)),
    };
    sounds[name]?.();
  }

  startMusic() {
    if (this.musicStarted || this.settings.muted || !this.settings.music) return;
    const context = this.ensureContext();
    if (!context) return;
    this.musicStarted = true;
    const master = context.createGain();
    master.gain.value = 0.025 * this.settings.music;
    master.connect(context.destination);
    const voices = [[55, "sine"], [82.4, "triangle"]];
    if (this.accountLevel >= 20) voices.push([110, "sine"], [164.8, "triangle"]);
    for (const [frequency, type] of voices) {
      const oscillator = context.createOscillator();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      oscillator.connect(master);
      oscillator.start();
      this.musicNodes.push(oscillator);
    }
    this.musicNodes.push(master);
  }

  stopMusic() {
    for (const node of this.musicNodes) {
      try { node.stop?.(); } catch {}
      try { node.disconnect?.(); } catch {}
    }
    this.musicNodes = [];
    this.musicStarted = false;
  }

  updateSettings(settings) {
    this.settings = settings;
    this.stopMusic();
    if (!settings.muted && settings.music) this.startMusic();
  }

  setAccountLevel(level) {
    this.accountLevel = Math.max(1, Number(level) || 1);
  }

  pause() {
    if (this.context?.state === "running") void this.context.suspend();
  }

  resume() {
    if (!this.settings.muted && this.context?.state === "suspended") void this.context.resume();
  }
}
