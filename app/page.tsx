"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Rarity = "Обычный" | "Редкий" | "Эпический" | "Легендарный" | "Секретный";
type Family = "speed" | "support" | "power";

type Creature = {
  id: string;
  name: string;
  family: Family;
  tier: number;
  rarity: Rarity;
  emoji: string;
  object: string;
  attack: number;
  income: number;
  color: string;
  phrase: string;
  ability: string;
};

type OwnedCreature = {
  uid: string;
  creatureId: string;
};

type GameSave = {
  coins: number;
  essence: number;
  wave: number;
  inventory: OwnedCreature[];
  team: string[];
  unlocked: string[];
  lastSeen: number;
  dailyClaim: string;
};

type Battle = {
  hp: number;
  maxHp: number;
  time: number;
  boss: boolean;
};

type YandexPlayer = {
  getData: (keys?: string[]) => Promise<Record<string, unknown>>;
  setData: (data: Record<string, unknown>, flush?: boolean) => Promise<void>;
};

type YandexSDK = {
  getPlayer?: () => Promise<YandexPlayer>;
  features?: {
    LoadingAPI?: { ready: () => void };
    GameplayAPI?: { start: () => void; stop: () => void };
  };
  adv?: {
    showRewardedVideo: (callbacks: {
      onOpen?: () => void;
      onRewarded?: () => void;
      onClose?: (wasShown: boolean) => void;
      onError?: (error: object) => void;
    }) => void;
  };
};

declare global {
  interface Window {
    YaGames?: { init: () => Promise<YandexSDK> };
    ysdk?: YandexSDK;
    yandexPlayer?: YandexPlayer;
  }
}

const creatures: Creature[] = [
  {
    id: "gattino",
    name: "Gattino Spaghettino",
    family: "speed",
    tier: 0,
    rarity: "Обычный",
    emoji: "🐱",
    object: "🍝",
    attack: 7,
    income: 1,
    color: "#ffb347",
    phrase: "Miao-miao, pasta al volo!",
    ability: "Быстрые лапки",
  },
  {
    id: "lupo",
    name: "Lupo Motorino",
    family: "speed",
    tier: 1,
    rarity: "Редкий",
    emoji: "🐺",
    object: "🛵",
    attack: 18,
    income: 3,
    color: "#77a7ff",
    phrase: "Turbo turbo, peperino!",
    ability: "Турбо-рывок",
  },
  {
    id: "pavone",
    name: "Pavone Cannone",
    family: "speed",
    tier: 2,
    rarity: "Эпический",
    emoji: "🦚",
    object: "💥",
    attack: 42,
    income: 7,
    color: "#b67cff",
    phrase: "Piuma, boom, confusione!",
    ability: "Взрывные перья",
  },
  {
    id: "toro",
    name: "Toro Meteoro",
    family: "speed",
    tier: 3,
    rarity: "Легендарный",
    emoji: "🐂",
    object: "☄️",
    attack: 95,
    income: 17,
    color: "#ff6b57",
    phrase: "Toro Meteoro, cielo intero!",
    ability: "Метеорный таран",
  },
  {
    id: "dragone",
    name: "Dragone Maccherone",
    family: "speed",
    tier: 4,
    rarity: "Секретный",
    emoji: "🐉",
    object: "🍜",
    attack: 210,
    income: 42,
    color: "#ffcf3f",
    phrase: "Fuoco, pasta, esplosione!",
    ability: "Макаронное пламя",
  },
  {
    id: "pinguino",
    name: "Pinguino Cuscino",
    family: "support",
    tier: 0,
    rarity: "Обычный",
    emoji: "🐧",
    object: "🛏️",
    attack: 5,
    income: 2,
    color: "#68d9ff",
    phrase: "Morbido, freddo, dormiglione!",
    ability: "Мягкая защита",
  },
  {
    id: "orsetto",
    name: "Orsetto Rubinetto",
    family: "support",
    tier: 1,
    rarity: "Редкий",
    emoji: "🐻",
    object: "🚰",
    attack: 13,
    income: 5,
    color: "#4ae3be",
    phrase: "Acqua fresca, orso in festa!",
    ability: "Лечебные капли",
  },
  {
    id: "capibara",
    name: "Capibara Lampadara",
    family: "support",
    tier: 2,
    rarity: "Эпический",
    emoji: "🦫",
    object: "💡",
    attack: 31,
    income: 12,
    color: "#e9ff61",
    phrase: "Brilla, balla, Capibara!",
    ability: "Сияющий бонус",
  },
  {
    id: "gorilla",
    name: "Gorilla Gondolilla",
    family: "support",
    tier: 3,
    rarity: "Легендарный",
    emoji: "🦍",
    object: "🚣",
    attack: 72,
    income: 28,
    color: "#f58cff",
    phrase: "Voga forte, chiudi le porte!",
    ability: "Гондольный щит",
  },
  {
    id: "gufo",
    name: "Gufo Temporale",
    family: "support",
    tier: 4,
    rarity: "Секретный",
    emoji: "🦉",
    object: "⚡",
    attack: 165,
    income: 66,
    color: "#6d8dff",
    phrase: "Tuono totale, Gufo Temporale!",
    ability: "Цепная молния",
  },
  {
    id: "criceto",
    name: "Criceto Calzinetto",
    family: "power",
    tier: 0,
    rarity: "Обычный",
    emoji: "🐹",
    object: "🧦",
    attack: 6,
    income: 2,
    color: "#ff8a73",
    phrase: "Calza veloce, ruota feroce!",
    ability: "Монетное колесо",
  },
  {
    id: "talpa",
    name: "Talpa Polpetta",
    family: "power",
    tier: 1,
    rarity: "Редкий",
    emoji: "🦔",
    object: "🧆",
    attack: 16,
    income: 4,
    color: "#e4a96f",
    phrase: "Scava, trova, polpetta nuova!",
    ability: "Подземный клад",
  },
  {
    id: "giraffa",
    name: "Giraffa Caraffa",
    family: "power",
    tier: 2,
    rarity: "Эпический",
    emoji: "🦒",
    object: "🏺",
    attack: 38,
    income: 10,
    color: "#ffd85a",
    phrase: "Collo lungo, succo nel mondo!",
    ability: "Высокий доход",
  },
  {
    id: "leone",
    name: "Leone Ciclone",
    family: "power",
    tier: 3,
    rarity: "Легендарный",
    emoji: "🦁",
    object: "🌪️",
    attack: 88,
    income: 23,
    color: "#ff8c32",
    phrase: "Gira tutta la stazione!",
    ability: "Циклонный рык",
  },
  {
    id: "imperatore",
    name: "Imperatore Mozzarellatore",
    family: "power",
    tier: 4,
    rarity: "Секретный",
    emoji: "👑",
    object: "🧀",
    attack: 195,
    income: 58,
    color: "#fff095",
    phrase: "Mozzarella, regno, tarantella!",
    ability: "Королевский указ",
  },
];

const creatureById = new Map(creatures.map((creature) => [creature.id, creature]));
const baseCreatureIds = ["gattino", "pinguino", "criceto"];
const SAVE_KEY = "memobeasts-lab-v1";

const starterInventory: OwnedCreature[] = [
  { uid: "starter-1", creatureId: "gattino" },
  { uid: "starter-2", creatureId: "gattino" },
  { uid: "starter-3", creatureId: "pinguino" },
  { uid: "starter-4", creatureId: "criceto" },
];

const initialSave: GameSave = {
  coins: 240,
  essence: 0,
  wave: 1,
  inventory: starterInventory,
  team: ["starter-3", "starter-4"],
  unlocked: ["gattino", "pinguino", "criceto"],
  lastSeen: Date.now(),
  dailyClaim: "",
};

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `${(value / 1_000).toFixed(1)}K`;
  return Math.floor(value).toLocaleString("ru-RU");
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function Home() {
  const [game, setGame] = useState<GameSave>(initialSave);
  const [selected, setSelected] = useState<string[]>([]);
  const [battle, setBattle] = useState<Battle | null>(null);
  const [capsuleOpen, setCapsuleOpen] = useState(false);
  const [lastDrop, setLastDrop] = useState<Creature | null>(null);
  const [toast, setToast] = useState("Лаборатория готова. Создай первого мемозверя!");
  const [activePanel, setActivePanel] = useState<"lab" | "collection">("lab");
  const [soundOn, setSoundOn] = useState(true);
  const [offlineReward, setOfflineReward] = useState(0);
  const hydrated = useRef(false);
  const audioContext = useRef<AudioContext | null>(null);

  const getCreature = useCallback(
    (owned: OwnedCreature) => creatureById.get(owned.creatureId) ?? creatures[0],
    [],
  );

  const teamCreatures = useMemo(
    () =>
      game.team
        .map((teamUid) => game.inventory.find((item) => item.uid === teamUid))
        .filter((item): item is OwnedCreature => Boolean(item))
        .map(getCreature),
    [game.inventory, game.team, getCreature],
  );

  const teamPower = useMemo(
    () => teamCreatures.reduce((total, creature) => total + creature.attack, 0),
    [teamCreatures],
  );

  const passiveIncome = useMemo(
    () =>
      game.inventory.reduce(
        (total, owned) => total + getCreature(owned).income,
        0,
      ),
    [game.inventory, getCreature],
  );

  const capsuleCost = 65 + Math.floor(game.wave * 4.5);
  const selectedOwned = selected
    .map((selectedUid) => game.inventory.find((item) => item.uid === selectedUid))
    .filter((item): item is OwnedCreature => Boolean(item));
  const canMerge =
    selectedOwned.length === 2 &&
    selectedOwned[0].creatureId === selectedOwned[1].creatureId &&
    getCreature(selectedOwned[0]).tier < 4;

  const playTone = useCallback(
    (frequency = 440, duration = 0.08) => {
      if (!soundOn || typeof window === "undefined") return;
      const AudioContextClass = window.AudioContext;
      if (!AudioContextClass) return;
      const context = audioContext.current ?? new AudioContextClass();
      audioContext.current = context;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      oscillator.type = "sine";
      gain.gain.setValueAtTime(0.055, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + duration);
    },
    [soundOn],
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as GameSave;
        const elapsedSeconds = Math.min(
          4 * 60 * 60,
          Math.max(0, (Date.now() - (parsed.lastSeen || Date.now())) / 1000),
        );
        const storedIncome = parsed.inventory.reduce(
          (total, owned) => total + (creatureById.get(owned.creatureId)?.income ?? 0),
          0,
        );
        const reward = Math.floor((elapsedSeconds / 8) * storedIncome);
        setOfflineReward(reward);
        setGame({
          ...initialSave,
          ...parsed,
          coins: parsed.coins + reward,
          lastSeen: Date.now(),
        });
      }
    } catch {
      setToast("Начинаем новую лабораторию — старое сохранение повреждено.");
    } finally {
      hydrated.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const save = { ...game, lastSeen: Date.now() };
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    const cloudTimer = window.setTimeout(() => {
      window.yandexPlayer?.setData({ memobeastsSave: save }, false).catch(() => undefined);
    }, 1800);
    return () => window.clearTimeout(cloudTimer);
  }, [game]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setGame((previous) => ({
        ...previous,
        coins: previous.coins + Math.max(1, previous.inventory.reduce(
          (total, owned) => total + (creatureById.get(owned.creatureId)?.income ?? 0),
          0,
        )),
      }));
    }, 8000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.games.s3.yandex.net/sdk.js";
    script.async = true;
    script.onload = async () => {
      try {
        if (window.YaGames) {
          window.ysdk = await window.YaGames.init();
          try {
            window.yandexPlayer = await window.ysdk.getPlayer?.();
            const cloudData = await window.yandexPlayer?.getData(["memobeastsSave"]);
            const cloudSave = cloudData?.memobeastsSave as GameSave | undefined;
            if (cloudSave?.inventory?.length) {
              setGame((localSave) =>
                (cloudSave.lastSeen ?? 0) > (localSave.lastSeen ?? 0)
                  ? { ...initialSave, ...cloudSave }
                  : localSave,
              );
            }
          } catch {
            // Anonymous and offline players continue with local progress.
          }
          window.ysdk.features?.LoadingAPI?.ready();
        }
      } catch {
        // The game remains fully playable outside Yandex Games.
      }
    };
    document.head.appendChild(script);
    return () => script.remove();
  }, []);

  useEffect(() => {
    if (!battle) return;
    const tick = window.setInterval(() => {
      setBattle((previous) => {
        if (!previous) return null;
        return {
          ...previous,
          hp: Math.max(0, previous.hp - Math.max(1, teamPower / 4)),
          time: Math.max(0, previous.time - 0.25),
        };
      });
    }, 250);
    return () => window.clearInterval(tick);
  }, [battle?.boss, teamPower]);

  useEffect(() => {
    if (!battle || battle.hp > 0) return;
    const reward = Math.floor((70 + game.wave * 22) * (battle.boss ? 2.2 : 1));
    const essenceReward = battle.boss ? 3 : game.wave % 3 === 0 ? 1 : 0;
    setGame((previous) => ({
      ...previous,
      coins: previous.coins + reward,
      essence: previous.essence + essenceReward,
      wave: previous.wave + 1,
    }));
    window.ysdk?.features?.GameplayAPI?.stop();
    setBattle(null);
    setToast(
      battle.boss
        ? `БОСС ПОВЕРЖЕН! +${reward} монет и +${essenceReward} ДНК`
        : `Волна очищена! +${reward} монет`,
    );
    playTone(battle.boss ? 880 : 660, 0.18);
  }, [battle, game.wave, playTone]);

  useEffect(() => {
    if (!battle || battle.time > 0 || battle.hp <= 0) return;
    setBattle(null);
    window.ysdk?.features?.GameplayAPI?.stop();
    setToast("Время вышло. Усиль команду слиянием и попробуй снова!");
    playTone(180, 0.2);
  }, [battle, playTone]);

  const selectCreature = (selectedUid: string) => {
    if (battle) return;
    playTone(420);
    setSelected((previous) => {
      if (previous.includes(selectedUid)) {
        return previous.filter((value) => value !== selectedUid);
      }
      return [...previous.slice(-1), selectedUid];
    });
  };

  const mergeCreatures = () => {
    if (!canMerge) {
      setToast("Для слияния выбери двух одинаковых мемозверей.");
      playTone(170);
      return;
    }
    const source = getCreature(selectedOwned[0]);
    const evolved = creatures.find(
      (creature) => creature.family === source.family && creature.tier === source.tier + 1,
    );
    if (!evolved) return;
    const mergedUid = uid();
    const selectedWasInTeam = selected.some((selectedUid) =>
      game.team.includes(selectedUid),
    );
    setGame((previous) => {
      const remainingInventory = previous.inventory.filter(
        (item) => !selected.includes(item.uid),
      );
      const remainingTeam = previous.team.filter(
        (teamUid) => !selected.includes(teamUid),
      );
      return {
        ...previous,
        inventory: [...remainingInventory, { uid: mergedUid, creatureId: evolved.id }],
        team:
          selectedWasInTeam && remainingTeam.length < 3
            ? [...remainingTeam, mergedUid]
            : remainingTeam,
        unlocked: previous.unlocked.includes(evolved.id)
          ? previous.unlocked
          : [...previous.unlocked, evolved.id],
      };
    });
    setSelected([mergedUid]);
    setLastDrop(evolved);
    setToast(`ЭВОЛЮЦИЯ! Открыт ${evolved.name}`);
    playTone(740, 0.22);
  };

  const openCapsule = () => {
    if (capsuleOpen || battle) return;
    if (game.coins < capsuleCost) {
      setToast(`Нужно ещё ${capsuleCost - game.coins} монет.`);
      playTone(170);
      return;
    }
    setGame((previous) => ({ ...previous, coins: previous.coins - capsuleCost }));
    setCapsuleOpen(true);
    setLastDrop(null);
    playTone(330, 0.12);
    window.setTimeout(() => {
      const lucky = game.wave >= 5 && Math.random() < Math.min(0.18, game.wave / 120);
      const pool = lucky
        ? creatures.filter((creature) => creature.tier === 1)
        : baseCreatureIds.map((id) => creatureById.get(id) as Creature);
      const dropped = pool[Math.floor(Math.random() * pool.length)];
      const newOwned = { uid: uid(), creatureId: dropped.id };
      setGame((previous) => ({
        ...previous,
        inventory: [...previous.inventory, newOwned],
        unlocked: previous.unlocked.includes(dropped.id)
          ? previous.unlocked
          : [...previous.unlocked, dropped.id],
      }));
      setLastDrop(dropped);
      setSelected([newOwned.uid]);
      setCapsuleOpen(false);
      setToast(`${dropped.name}: «${dropped.phrase}»`);
      playTone(lucky ? 920 : 560, 0.2);
    }, 850);
  };

  const toggleTeam = () => {
    if (selectedOwned.length !== 1) {
      setToast("Выбери одного мемозверя для команды.");
      return;
    }
    const selectedUid = selectedOwned[0].uid;
    setGame((previous) => {
      if (previous.team.includes(selectedUid)) {
        return {
          ...previous,
          team: previous.team.filter((teamUid) => teamUid !== selectedUid),
        };
      }
      if (previous.team.length >= 3) {
        setToast("В команде только 3 места. Сначала убери одного бойца.");
        return previous;
      }
      return { ...previous, team: [...previous.team, selectedUid] };
    });
    playTone(510);
  };

  const startBattle = () => {
    if (battle || teamCreatures.length === 0) {
      if (teamCreatures.length === 0) setToast("Собери хотя бы одного бойца.");
      return;
    }
    const boss = game.wave % 5 === 0;
    const maxHp = Math.floor((75 + Math.pow(game.wave, 1.48) * 28) * (boss ? 2.15 : 1));
    setSelected([]);
    setBattle({ hp: maxHp, maxHp, time: boss ? 22 : 16, boss });
    window.ysdk?.features?.GameplayAPI?.start();
    setToast(boss ? "ВНИМАНИЕ: нестабильная мутация!" : `Волна ${game.wave} началась!`);
    playTone(boss ? 120 : 260, 0.18);
  };

  const tapEnemy = () => {
    if (!battle) return;
    setBattle((previous) =>
      previous
        ? { ...previous, hp: Math.max(0, previous.hp - Math.max(3, 5 + teamPower * 0.12)) }
        : null,
    );
    playTone(250 + Math.random() * 80, 0.04);
  };

  const claimDaily = () => {
    if (game.dailyClaim === todayKey()) {
      setToast("Сегодняшний контейнер уже получен. Возвращайся завтра!");
      return;
    }
    const reward = 260 + game.wave * 20;
    setGame((previous) => ({
      ...previous,
      coins: previous.coins + reward,
      dailyClaim: todayKey(),
    }));
    setToast(`Ежедневный контейнер: +${reward} монет`);
    playTone(800, 0.2);
  };

  const rewardedBonus = async () => {
    const grant = () => {
      const reward = Math.max(180, passiveIncome * 25);
      setGame((previous) => ({ ...previous, coins: previous.coins + reward }));
      setToast(`Ускоритель лаборатории: +${reward} монет`);
      playTone(840, 0.2);
    };
    if (window.ysdk?.adv) {
      window.ysdk.adv.showRewardedVideo({
        onRewarded: grant,
        onClose: () => undefined,
        onError: () => setToast("Реклама сейчас недоступна. Попробуй чуть позже."),
      });
    } else {
      grant();
    }
  };

  return (
    <main className="game-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">🧬</div>
          <div>
            <span className="eyebrow">MEMOBEASTS LAB</span>
            <h1>Лаборатория мутаций</h1>
          </div>
        </div>
        <div className="resources">
          <div className="resource-pill">
            <span>🪙</span>
            <strong>{formatNumber(game.coins)}</strong>
          </div>
          <div className="resource-pill dna">
            <span>🧬</span>
            <strong>{formatNumber(game.essence)}</strong>
          </div>
          <button
            className="icon-button"
            onClick={() => setSoundOn((value) => !value)}
            aria-label={soundOn ? "Выключить звук" : "Включить звук"}
          >
            {soundOn ? "🔊" : "🔇"}
          </button>
        </div>
      </header>

      <section className="mission-strip">
        <div>
          <span className="status-dot" />
          <strong>Сектор {Math.ceil(game.wave / 5)}</strong>
          <span>Волна {game.wave}</span>
        </div>
        <div className="power-readout">
          Сила команды <strong>{formatNumber(teamPower)}</strong>
        </div>
      </section>

      <div className="game-grid">
        <section className="arena-panel panel">
          <div className="arena-heading">
            <div>
              <span className="panel-kicker">ИСПЫТАТЕЛЬНАЯ КАМЕРА</span>
              <h2>{battle?.boss ? "Босс-мутация" : `Волна ${game.wave}`}</h2>
            </div>
            <span className={`wave-badge ${game.wave % 5 === 0 ? "boss" : ""}`}>
              {game.wave % 5 === 0 ? "BOSS" : `${game.wave}/∞`}
            </span>
          </div>

          <div className={`arena ${battle ? "is-fighting" : ""}`}>
            <div className="scan-lines" />
            <div className="team-stage">
              {[0, 1, 2].map((index) => {
                const creature = teamCreatures[index];
                return (
                  <div className={`team-slot ${creature ? "filled" : ""}`} key={index}>
                    {creature ? (
                      <>
                        <div
                          className="mini-creature"
                          style={{ "--creature-color": creature.color } as React.CSSProperties}
                        >
                          <span>{creature.emoji}</span>
                          <small>{creature.object}</small>
                        </div>
                        <b>{creature.name.split(" ")[0]}</b>
                      </>
                    ) : (
                      <span className="empty-slot">+</span>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              className={`enemy-core ${battle?.boss ? "boss-core" : ""}`}
              onClick={tapEnemy}
              disabled={!battle}
              aria-label="Атаковать мутацию"
            >
              <span className="enemy-aura" />
              <span className="enemy-face">{battle?.boss ? "👾" : "🦠"}</span>
              {battle && <span className="tap-hint">ЖМИ!</span>}
            </button>

            <div className="arena-floor" />
          </div>

          {battle ? (
            <div className="battle-ui">
              <div className="health-copy">
                <span>{battle.boss ? "КРИТИЧЕСКАЯ МУТАЦИЯ" : "НЕСТАБИЛЬНАЯ КЛЕТКА"}</span>
                <strong>{Math.ceil(battle.time)} сек</strong>
              </div>
              <div className="health-track">
                <div
                  className="health-fill"
                  style={{ width: `${(battle.hp / battle.maxHp) * 100}%` }}
                />
              </div>
              <small>{Math.ceil(battle.hp)} / {battle.maxHp} HP</small>
            </div>
          ) : (
            <button className="primary-action battle-button" onClick={startBattle}>
              <span>{game.wave % 5 === 0 ? "⚠️ НАЧАТЬ БИТВУ С БОССОМ" : "⚔️ НАЧАТЬ ВОЛНУ"}</span>
              <small>награда {formatNumber(Math.floor((70 + game.wave * 22) * (game.wave % 5 === 0 ? 2.2 : 1)))} 🪙</small>
            </button>
          )}
        </section>

        <aside className="lab-panel panel">
          <div className="tabs" role="tablist" aria-label="Разделы лаборатории">
            <button
              className={activePanel === "lab" ? "active" : ""}
              onClick={() => setActivePanel("lab")}
              role="tab"
            >
              Лаборатория
            </button>
            <button
              className={activePanel === "collection" ? "active" : ""}
              onClick={() => setActivePanel("collection")}
              role="tab"
            >
              Коллекция <span>{game.unlocked.length}/15</span>
            </button>
          </div>

          {activePanel === "lab" ? (
            <>
              <div className="capsule-zone">
                <div className={`capsule-machine ${capsuleOpen ? "opening" : ""}`}>
                  <div className="machine-glow" />
                  <div className="capsule-top" />
                  <div className="capsule-window">
                    {lastDrop ? (
                      <div
                        className="drop-creature"
                        style={{ "--creature-color": lastDrop.color } as React.CSSProperties}
                      >
                        <span>{lastDrop.emoji}</span>
                        <small>{lastDrop.object}</small>
                      </div>
                    ) : (
                      <span className="question-mark">?</span>
                    )}
                  </div>
                  <div className="capsule-base">MUTA • 01</div>
                </div>
                <div className="capsule-copy">
                  <span className="panel-kicker">СИНТЕЗАТОР</span>
                  <h3>{lastDrop?.name ?? "Капсула мутации"}</h3>
                  <p>
                    {lastDrop
                      ? `${lastDrop.rarity} · ${lastDrop.ability}`
                      : "Создаёт одного базового мемозверя. После 5-й волны может выпасть редкий."}
                  </p>
                  <button
                    className="primary-action capsule-button"
                    onClick={openCapsule}
                    disabled={capsuleOpen || Boolean(battle)}
                  >
                    {capsuleOpen ? "СИНТЕЗ..." : `ОТКРЫТЬ · ${capsuleCost} 🪙`}
                  </button>
                </div>
              </div>

              <div className="inventory-heading">
                <div>
                  <span className="panel-kicker">ХРАНИЛИЩЕ</span>
                  <h3>Мемозвери <small>{game.inventory.length}</small></h3>
                </div>
                <span className="income-badge">+{passiveIncome} / 8 сек</span>
              </div>

              <div className="inventory-grid">
                {game.inventory.map((owned) => {
                  const creature = getCreature(owned);
                  const isSelected = selected.includes(owned.uid);
                  const isInTeam = game.team.includes(owned.uid);
                  return (
                    <button
                      className={`creature-card tier-${creature.tier} ${isSelected ? "selected" : ""}`}
                      onClick={() => selectCreature(owned.uid)}
                      key={owned.uid}
                      style={{ "--creature-color": creature.color } as React.CSSProperties}
                    >
                      {isInTeam && <span className="team-tag">TEAM</span>}
                      <div className="card-avatar">
                        <span>{creature.emoji}</span>
                        <small>{creature.object}</small>
                      </div>
                      <b>{creature.name}</b>
                      <span>{creature.rarity}</span>
                      <div className="card-stats">
                        <small>⚔ {creature.attack}</small>
                        <small>🪙 {creature.income}</small>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="selection-actions">
                <button className="secondary-action" onClick={toggleTeam}>
                  {selectedOwned.length === 1 && game.team.includes(selectedOwned[0].uid)
                    ? "УБРАТЬ ИЗ КОМАНДЫ"
                    : "В КОМАНДУ"}
                </button>
                <button
                  className={`merge-action ${canMerge ? "ready" : ""}`}
                  onClick={mergeCreatures}
                >
                  <span>🧬 СЛИТЬ</span>
                  <small>{selected.length}/2 выбрано</small>
                </button>
              </div>
            </>
          ) : (
            <div className="collection-view">
              <div className="collection-intro">
                <span className="panel-kicker">АРХИВ ДНК</span>
                <h3>Открыто {game.unlocked.length} из 15</h3>
                <p>Сливай двух одинаковых существ, чтобы открыть следующую мутацию семьи.</p>
              </div>
              <div className="collection-grid">
                {creatures.map((creature) => {
                  const unlocked = game.unlocked.includes(creature.id);
                  return (
                    <div
                      className={`collection-card ${unlocked ? "unlocked" : "locked"}`}
                      key={creature.id}
                      style={{ "--creature-color": creature.color } as React.CSSProperties}
                    >
                      <div className="collection-avatar">
                        {unlocked ? (
                          <>
                            <span>{creature.emoji}</span>
                            <small>{creature.object}</small>
                          </>
                        ) : (
                          "?"
                        )}
                      </div>
                      <div>
                        <b>{unlocked ? creature.name : "НЕИЗВЕСТНАЯ ДНК"}</b>
                        <span>{creature.rarity} · T{creature.tier + 1}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>

      <section className="boost-bar">
        <div className="toast-message" aria-live="polite">
          <span>●</span>
          {toast}
        </div>
        <div className="boost-actions">
          <button onClick={claimDaily} disabled={game.dailyClaim === todayKey()}>
            🎁 {game.dailyClaim === todayKey() ? "Получено" : "Ежедневный контейнер"}
          </button>
          <button onClick={rewardedBonus}>▶ Ускоритель ×25</button>
        </div>
      </section>

      {offlineReward > 0 && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Офлайн-доход">
          <div className="reward-modal">
            <div className="reward-icon">🧪</div>
            <span className="panel-kicker">ЛАБОРАТОРИЯ РАБОТАЛА</span>
            <h2>С возвращением!</h2>
            <p>Мемозвери добывали ресурсы, пока тебя не было.</p>
            <strong>+{formatNumber(offlineReward)} 🪙</strong>
            <button className="primary-action" onClick={() => setOfflineReward(0)}>
              ЗАБРАТЬ
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
