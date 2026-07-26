"use client";

import {
  BadgeDollarSign,
  Banknote,
  BellRing,
  BookOpenText,
  Check,
  ChevronLeft,
  CircleDollarSign,
  Clock3,
  Coins,
  Fingerprint,
  HandCoins,
  Hammer,
  History,
  MessageCircleQuestion,
  PackageOpen,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Star,
  Store,
  Tag,
  TrendingUp,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type View = "shop" | "stock" | "workshop" | "story" | "ledger";
type MobilePanel = "talk" | "inspect" | "deal";
type CheckType = "auth" | "serial" | "value";
type QuestionType = "origin" | "documents" | "urgency";
type ToastTone = "good" | "bad" | "neutral";

type Customer = {
  id: string;
  name: string;
  role: string;
  character: string;
  patience: number;
};

type Item = {
  id: string;
  name: string;
  category: string;
  image: string;
  market: number;
  repairCost: number;
};

type Scenario = {
  customer: string;
  item: string;
  ask: number;
  min: number;
  condition: number;
  authentic: boolean;
  stolen: boolean;
  story: string;
};

type OwnedItem = {
  uid: string;
  itemId: string;
  buyPrice: number;
  condition: number;
  authentic: boolean;
  repaired: boolean;
};

type SaveState = {
  cash: number;
  reputation: number;
  day: number;
  servedToday: number;
  caseIndex: number;
  inventory: OwnedItem[];
  totalProfit: number;
  deals: number;
  policeWins: number;
  storyCompleted: boolean;
};

const CUSTOMERS: Customer[] = [
  { id: "max", name: "Макс", role: "нервный продавец", character: "characters/max.webp", patience: 62 },
  { id: "sofia", name: "София", role: "уверенная покупательница", character: "characters/sofia.webp", patience: 74 },
  { id: "viktor", name: "Виктор Львович", role: "старый коллекционер", character: "characters/viktor.webp", patience: 86 },
  { id: "roman", name: "Роман", role: "не любит вопросы", character: "characters/roman.webp", patience: 48 },
  { id: "dima", name: "Дима", role: "студент", character: "characters/dima.webp", patience: 78 },
];

const ITEMS: Item[] = [
  { id: "watch", name: "Золотые часы", category: "Часы", image: "items/watch.webp", market: 1240, repairCost: 115 },
  { id: "camera", name: "Беззеркальная камера", category: "Техника", image: "items/camera.webp", market: 860, repairCost: 95 },
  { id: "guitar", name: "Винтажная гитара", category: "Музыка", image: "items/guitar.webp", market: 980, repairCost: 130 },
  { id: "handbag", name: "Кожаная сумка", category: "Аксессуары", image: "items/handbag.webp", market: 720, repairCost: 80 },
  { id: "laptop", name: "Игровой ноутбук", category: "Техника", image: "items/laptop.webp", market: 1350, repairCost: 170 },
  { id: "coin", name: "Серебряный доллар", category: "Коллекционное", image: "items/coin.webp", market: 590, repairCost: 40 },
  { id: "drill", name: "Аккумуляторная дрель", category: "Инструменты", image: "items/drill.webp", market: 330, repairCost: 55 },
  { id: "ring", name: "Кольцо с сапфиром", category: "Украшения", image: "items/ring.webp", market: 1660, repairCost: 145 },
  { id: "headphones", name: "Студийные наушники", category: "Техника", image: "items/headphones.webp", market: 410, repairCost: 50 },
  { id: "statuette", name: "Бронзовая статуэтка", category: "Антиквариат", image: "items/statuette.webp", market: 810, repairCost: 75 },
  { id: "phone", name: "Флагманский смартфон", category: "Техника", image: "items/phone.webp", market: 920, repairCost: 120 },
  { id: "vinyl", name: "Редкая пластинка", category: "Коллекционное", image: "items/vinyl.webp", market: 470, repairCost: 35 },
];

const SCENARIOS: Scenario[] = [
  { customer: "max", item: "camera", ask: 610, min: 470, condition: 78, authentic: true, stolen: false, story: "Камера брата. Он уехал и разрешил продать. Деньги нужны сегодня." },
  { customer: "sofia", item: "handbag", ask: 630, min: 450, condition: 91, authentic: false, stolen: false, story: "Подарок из бутика. Почти не носила — просто не мой цвет." },
  { customer: "viktor", item: "watch", ask: 940, min: 760, condition: 67, authentic: true, stolen: false, story: "Часы из семейной коллекции. Механизм давно просит мастера." },
  { customer: "roman", item: "phone", ask: 590, min: 460, condition: 84, authentic: true, stolen: true, story: "Телефон знакомого. Коробку и чек потом занесу, сейчас тороплюсь." },
  { customer: "dima", item: "headphones", ask: 290, min: 210, condition: 73, authentic: true, stolen: false, story: "Перехожу на другую модель. Амбушюры уставшие, но звук чистый." },
  { customer: "sofia", item: "ring", ask: 1350, min: 1050, condition: 96, authentic: true, stolen: false, story: "Помолвка отменилась. Не хочу больше видеть это кольцо." },
  { customer: "max", item: "coin", ask: 440, min: 310, condition: 88, authentic: false, stolen: false, story: "Нашёл у дедушки в шкатулке. В интернете такие стоят состояние." },
  { customer: "roman", item: "drill", ask: 230, min: 160, condition: 59, authentic: true, stolen: true, story: "Закрыл бригаду, распродаю инструмент. Документов на него не было." },
  { customer: "viktor", item: "statuette", ask: 590, min: 430, condition: 82, authentic: true, stolen: false, story: "Покупал на блошином рынке двадцать лет назад. Хорошая бронза." },
  { customer: "dima", item: "laptop", ask: 990, min: 810, condition: 64, authentic: true, stolen: false, story: "Нужны деньги на учёбу. Батарея слабая, остальное работает." },
  { customer: "sofia", item: "vinyl", ask: 360, min: 240, condition: 93, authentic: true, stolen: false, story: "Досталась вместе с квартирой. Проигрывателя у меня всё равно нет." },
  { customer: "roman", item: "guitar", ask: 720, min: 560, condition: 71, authentic: false, stolen: false, story: "Настоящий винтаж. Название мастерской стёрлось от времени." },
];

const INITIAL_STATE: SaveState = {
  cash: 2500,
  reputation: 50,
  day: 1,
  servedToday: 0,
  caseIndex: 0,
  inventory: [],
  totalProfit: 0,
  deals: 0,
  policeWins: 0,
  storyCompleted: false,
};

const SAVE_KEY = "pawn-shop-save-v2";
const CASES_PER_DAY = 6;
const STORY_PROFIT_GOAL = 900;
const money = (value: number) => `$${Math.max(0, Math.round(value)).toLocaleString("en-US")}`;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export default function PawnShopGame() {
  const [view, setView] = useState<View>("shop");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("talk");
  const [state, setState] = useState<SaveState>(INITIAL_STATE);
  const [offer, setOffer] = useState(450);
  const [checks, setChecks] = useState<CheckType[]>([]);
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [sellerMessage, setSellerMessage] = useState("");
  const [negotiationRound, setNegotiationRound] = useState(0);
  const [patience, setPatience] = useState(60);
  const [inspecting, setInspecting] = useState<CheckType | null>(null);
  const [itemZoom, setItemZoom] = useState(false);
  const [toast, setToast] = useState<{ text: string; tone: ToastTone } | null>(null);
  const [loaded, setLoaded] = useState(false);

  const scenario = SCENARIOS[state.caseIndex % SCENARIOS.length];
  const customer = CUSTOMERS.find((entry) => entry.id === scenario.customer) ?? CUSTOMERS[0];
  const item = ITEMS.find((entry) => entry.id === scenario.item) ?? ITEMS[0];
  const floorOffer = Math.max(25, Math.round(scenario.ask * 0.42 / 10) * 10);
  const ceilingOffer = Math.round(scenario.ask * 1.08 / 10) * 10;
  const dayProgress = state.servedToday / CASES_PER_DAY;
  const storyProfit = Math.max(0, state.totalProfit);
  const storyProgress = clamp(storyProfit / STORY_PROFIT_GOAL * 100, 0, 100);
  const storyReady = storyProfit >= STORY_PROFIT_GOAL && state.reputation >= 55;

  const ownedWithData = useMemo(
    () =>
      state.inventory.map((owned) => ({
        ...owned,
        item: ITEMS.find((entry) => entry.id === owned.itemId) ?? ITEMS[0],
      })),
    [state.inventory],
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<SaveState>;
        setState({ ...INITIAL_STATE, ...parsed, inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [] });
      }
    } catch {
      // A broken save never blocks a shift.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }, [loaded, state]);

  useEffect(() => {
    setOffer(Math.round(scenario.ask * 0.72 / 10) * 10);
    setChecks([]);
    setQuestions([]);
    setNegotiationRound(0);
    setPatience(customer.patience);
    setSellerMessage(scenario.story);
    setInspecting(null);
    setItemZoom(false);
    setMobilePanel("talk");
  }, [state.caseIndex, scenario.ask, scenario.story, customer.patience]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const notify = useCallback((text: string, tone: ToastTone = "neutral") => {
    setToast({ text, tone });
  }, []);

  const playBell = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const audio = new AudioContextClass();
      [0, 0.09].forEach((delay, index) => {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = index ? 940 : 760;
        gain.gain.setValueAtTime(0.0001, audio.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.12, audio.currentTime + delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + delay + 0.17);
        oscillator.connect(gain).connect(audio.destination);
        oscillator.start(audio.currentTime + delay);
        oscillator.stop(audio.currentTime + delay + 0.19);
      });
      window.setTimeout(() => void audio.close(), 500);
    } catch {
      // Sound is cosmetic.
    }
  };

  const finishCase = useCallback((patch: Partial<SaveState> = {}) => {
    setState((current) => {
      const served = current.servedToday + 1;
      const closesDay = served >= CASES_PER_DAY;
      return {
        ...current,
        ...patch,
        cash: (patch.cash ?? current.cash) - (closesDay ? 180 : 0),
        day: current.day + (closesDay ? 1 : 0),
        servedToday: closesDay ? 0 : served,
        caseIndex: current.caseIndex + 1,
      };
    });
    window.setTimeout(playBell, 180);
  }, []);

  const askQuestion = (type: QuestionType) => {
    if (questions.includes(type)) return;
    const nextPatience = clamp(patience - 4, 0, 100);
    setPatience(nextPatience);
    setQuestions((current) => [...current, type]);
    if (type === "origin") {
      setSellerMessage(
        scenario.stolen
          ? "Взял у знакомого пару дней назад. Его номер сейчас не отвечает."
          : scenario.authentic
            ? "Вещь моя. Пользовался ей давно, просто сейчас нужны деньги."
            : "Это подарок. Где именно покупали — уже не помню.",
      );
    } else if (type === "documents") {
      setSellerMessage(
        scenario.stolen
          ? "Коробки и чека нет. Давайте без лишней бюрократии."
          : scenario.authentic
            ? "Чека уже нет, но серийник и переписку о покупке могу показать."
            : "Документов не сохранилось, зато вещь выглядит как новая.",
      );
    } else {
      setSellerMessage(
        scenario.stolen
          ? "Мне нужно уйти в ближайшие пять минут. Берёте или нет?"
          : scenario.ask > item.market * 0.75
            ? "Спешки нет. За бесценок точно не отдам."
            : "Деньги нужны сегодня, поэтому готов немного уступить.",
      );
    }
  };

  const runCheck = (type: CheckType) => {
    if (checks.includes(type) || inspecting) return;
    const costs: Record<CheckType, number> = { auth: 18, serial: 24, value: 12 };
    if (state.cash < costs[type]) {
      notify("В кассе не хватает денег на проверку", "bad");
      return;
    }
    setState((current) => ({ ...current, cash: current.cash - costs[type] }));
    setInspecting(type);
    window.setTimeout(() => {
      setChecks((current) => [...current, type]);
      setInspecting(null);
      notify(type === "auth" ? "Экспертиза завершена" : type === "serial" ? "База ответила" : "Рыночная цена рассчитана", "good");
    }, 780);
  };

  const buyItem = () => {
    if (offer > state.cash) {
      notify("В кассе недостаточно денег", "bad");
      return;
    }
    if (offer < scenario.min) {
      const gap = (scenario.min - offer) / scenario.min;
      const patienceLoss = Math.round(9 + gap * 24);
      const nextPatience = patience - patienceLoss;
      if (nextPatience <= 8 || negotiationRound >= 2) {
        notify(`${customer.name} отказался и забрал вещь`, "bad");
        finishCase({ reputation: clamp(state.reputation - 1, 0, 100) });
        return;
      }
      const counter = Math.round((scenario.min + Math.max(0, offer - floorOffer) * 0.14) / 10) * 10;
      setPatience(nextPatience);
      setNegotiationRound((round) => round + 1);
      setOffer(counter);
      setSellerMessage(`Нет. Моя минимальная цена — ${money(counter)}. Ниже уже не опущусь.`);
      notify(`Раунд торга ${negotiationRound + 1}/3`, "neutral");
      return;
    }
    const owned: OwnedItem = {
      uid: `${Date.now()}-${scenario.item}`,
      itemId: scenario.item,
      buyPrice: offer,
      condition: scenario.condition,
      authentic: scenario.authentic,
      repaired: false,
    };
    notify(`Куплено: ${item.name} за ${money(offer)}`, scenario.authentic && !scenario.stolen ? "good" : "neutral");
    finishCase({
      cash: state.cash - offer,
      inventory: [...state.inventory, owned],
      deals: state.deals + 1,
    });
  };

  const callPolice = () => {
    if (scenario.stolen) {
      notify("Кража подтверждена. Полиция выписала награду", "good");
      finishCase({
        cash: state.cash + 120,
        reputation: clamp(state.reputation + 7, 0, 100),
        policeWins: state.policeWins + 1,
      });
    } else {
      notify("Вещь чистая. Клиент требует компенсацию $90", "bad");
      finishCase({
        cash: state.cash - 90,
        reputation: clamp(state.reputation - 6, 0, 100),
      });
    }
  };

  const refuse = () => {
    notify("Вы отказались от сделки", "neutral");
    finishCase();
  };

  const salePrice = (owned: OwnedItem, market: number) => {
    if (!owned.authentic) return Math.round(market * 0.06);
    return Math.round(market * (owned.repaired ? 1.05 : 0.58 + owned.condition / 240));
  };

  const repair = (owned: OwnedItem, cost: number) => {
    if (owned.repaired || state.cash < cost) {
      if (state.cash < cost) notify("Не хватает денег на ремонт", "bad");
      return;
    }
    setState((current) => ({
      ...current,
      cash: current.cash - cost,
      inventory: current.inventory.map((entry) =>
        entry.uid === owned.uid ? { ...entry, repaired: true, condition: 100 } : entry,
      ),
    }));
    notify("Мастер восстановил предмет", "good");
  };

  const sell = (owned: OwnedItem, market: number) => {
    const price = salePrice(owned, market);
    const profit = price - owned.buyPrice;
    setState((current) => ({
      ...current,
      cash: current.cash + price,
      totalProfit: current.totalProfit + profit,
      reputation: clamp(current.reputation + (profit > 0 ? 1 : -2), 0, 100),
      inventory: current.inventory.filter((entry) => entry.uid !== owned.uid),
    }));
    notify(profit >= 0 ? `Продано. Прибыль ${money(profit)}` : `Убыток ${money(Math.abs(profit))}`, profit >= 0 ? "good" : "bad");
  };

  const resetGame = () => {
    if (!window.confirm("Начать новую игру и удалить текущий прогресс?")) return;
    setState(INITIAL_STATE);
    setView("shop");
  };

  const completeStory = () => {
    if (!storyReady || state.storyCompleted) return;
    setState((current) => ({
      ...current,
      storyCompleted: true,
      cash: current.cash + 250,
      reputation: clamp(current.reputation + 5, 0, 100),
    }));
    notify("Ломбард спасён! Дядя Борис оставил вам премию $250", "good");
  };

  const authResult = scenario.authentic ? "Подлинная вещь" : "Обнаружена подделка";
  const serialResult = scenario.stolen ? "Есть в базе розыска" : "Серийник чистый";
  const valueResult = `${money(item.market * 0.82)}–${money(item.market * 1.08)}`;

  return (
    <main className="pawn-world">
      <section className="shop-scene">
        <img className="scene-background" src="scenes/pawnshop.webp" alt="" />

        <header className="scene-hud">
          <button className="hud-brand" onClick={() => setView("shop")} aria-label="Вернуться в ломбард">
            <BadgeDollarSign size={23} />
            <span><strong>GOLDEN CORNER</strong><small>PAWN SHOP</small></span>
          </button>
          <div className="shift-progress">
            <span>День {state.day}</span>
            <div><i style={{ width: `${dayProgress * 100}%` }} /></div>
            <small>{state.servedToday}/{CASES_PER_DAY}</small>
          </div>
          <div className="hud-stats">
            <span><Banknote size={17} /><small>Касса</small><strong>{money(state.cash)}</strong></span>
            <span><Star size={16} fill="currentColor" /><small>Репутация</small><strong>{state.reputation}</strong></span>
          </div>
          <nav className="scene-nav" aria-label="Разделы ломбарда">
            <button className={view === "stock" ? "active" : ""} onClick={() => setView("stock")}><PackageOpen size={19} /><small>Витрина</small><i>{state.inventory.length}</i></button>
            <button className={view === "workshop" ? "active" : ""} onClick={() => setView("workshop")}><Wrench size={19} /><small>Ремонт</small></button>
            <button className={view === "story" ? "active" : ""} onClick={() => setView("story")}><CircleDollarSign size={19} /><small>История</small>{!state.storyCompleted && <i>{Math.round(storyProgress)}%</i>}</button>
            <button className={view === "ledger" ? "active" : ""} onClick={() => setView("ledger")}><BookOpenText size={19} /><small>Отчёт</small></button>
          </nav>
        </header>

        <div className="customer-arrival" key={`arrival-${state.caseIndex}`}>
          <div className="door-cover">
            <span className="door-left"><i /></span>
            <span className="door-right"><i /></span>
          </div>
          <div className="bell-flash"><BellRing size={22} /></div>
          <div
            className="standing-customer"
            role="img"
            aria-label={customer.name}
            style={{ backgroundImage: `url("${customer.character}")` }}
          />
        </div>

        <div className="customer-nameplate" key={`name-${state.caseIndex}`}>
          <span>КЛИЕНТ #{state.servedToday + 1}</span>
          <strong>{customer.name}</strong>
          <small>{customer.role}</small>
        </div>

        <div className={`inspection-effect ${inspecting ? "active" : ""}`}>
          <span />
          <p>{inspecting === "auth" ? "Проверяем материалы…" : inspecting === "serial" ? "Ищем серийный номер…" : "Сравниваем рынок…"}</p>
        </div>

        <button
          type="button"
          className="desk-item"
          key={`item-${state.caseIndex}`}
          onClick={() => setItemZoom(true)}
          aria-label={`Осмотреть ${item.name}`}
        >
          <span className="item-shadow" />
          <img src={item.image} alt={item.name} />
          <div className="item-label"><small>{item.category}</small><strong>{item.name}</strong><span>{scenario.condition}% состояние · нажмите</span></div>
        </button>

        <section className="desk-interface">
          <div className="seller-dialogue" key={`dialogue-${sellerMessage}`}>
            <UserRound size={19} />
            <p>«{sellerMessage}»</p>
            <div className="patience-meter">
              <span>Терпение</span>
              <i><b style={{ width: `${patience}%` }} /></i>
            </div>
          </div>

          <div className="interaction-board" data-mobile-panel={mobilePanel}>
            <div className="mobile-mode-tabs" role="tablist" aria-label="Действия с клиентом">
              <button className={mobilePanel === "talk" ? "active" : ""} onClick={() => setMobilePanel("talk")}><MessageCircleQuestion size={16} /><span>Спросить</span></button>
              <button className={mobilePanel === "inspect" ? "active" : ""} onClick={() => setMobilePanel("inspect")}><ScanLine size={16} /><span>Проверить</span><i>{checks.length}/3</i></button>
              <button className={mobilePanel === "deal" ? "active" : ""} onClick={() => setMobilePanel("deal")}><HandCoins size={16} /><span>Сделка</span></button>
            </div>
            <div className="question-rack">
              <div className="board-title"><MessageCircleQuestion size={16} /><span>Спросить</span></div>
              <button className={questions.includes("origin") ? "done" : ""} onClick={() => askQuestion("origin")}><span>Откуда вещь?</span>{questions.includes("origin") && <Check size={15} />}</button>
              <button className={questions.includes("documents") ? "done" : ""} onClick={() => askQuestion("documents")}><span>Есть документы?</span>{questions.includes("documents") && <Check size={15} />}</button>
              <button className={questions.includes("urgency") ? "done" : ""} onClick={() => askQuestion("urgency")}><span>Почему продаёте?</span>{questions.includes("urgency") && <Check size={15} />}</button>
            </div>

            <div className="tool-rack">
              <div className="board-title"><ScanLine size={16} /><span>Инструменты</span></div>
              <ToolButton icon={ScanLine} label="Экспертиза" cost="$18" result={authResult} active={checks.includes("auth")} busy={inspecting === "auth"} onClick={() => runCheck("auth")} />
              <ToolButton icon={Fingerprint} label="Серийник" cost="$24" result={serialResult} active={checks.includes("serial")} busy={inspecting === "serial"} onClick={() => runCheck("serial")} />
              <ToolButton icon={TrendingUp} label="Оценка" cost="$12" result={valueResult} active={checks.includes("value")} busy={inspecting === "value"} onClick={() => runCheck("value")} />
            </div>

            <div className="negotiation-rack">
              <div className="offer-summary">
                <span>Клиент просит <strong>{money(scenario.ask)}</strong></span>
                <span>Ваше предложение <b>{money(offer)}</b></span>
              </div>
              <input
                aria-label="Сумма предложения"
                type="range"
                min={floorOffer}
                max={ceilingOffer}
                step={10}
                value={offer}
                onChange={(event) => setOffer(Number(event.target.value))}
              />
              <div className="offer-scale"><span>{money(floorOffer)}</span><span>Торг {negotiationRound}/3</span><span>{money(ceilingOffer)}</span></div>
              <div className="counter-actions">
                <button className="police-action" onClick={callPolice}><ShieldAlert size={18} /><span>Полиция</span></button>
                <button className="refuse-action" onClick={refuse}><X size={18} /><span>Отказать</span></button>
                <button className="deal-action" onClick={buyItem}><HandCoins size={19} /><span>Предложить {money(offer)}</span></button>
              </div>
            </div>
          </div>
        </section>

        {itemZoom && (
          <div className="item-focus" role="dialog" aria-modal="true" aria-label={`Осмотр: ${item.name}`}>
            <button className="item-focus-close" type="button" onClick={() => setItemZoom(false)} aria-label="Закрыть осмотр"><X size={21} /></button>
            <div className="item-focus-card">
              <div className="item-focus-visual">
                <span />
                <img src={item.image} alt={item.name} />
              </div>
              <div className="item-focus-copy">
                <small>{item.category}</small>
                <h2>{item.name}</h2>
                <p>Состояние <strong>{scenario.condition}%</strong></p>
                <p>Клиент просит <strong>{money(scenario.ask)}</strong></p>
                <button type="button" onClick={() => { setItemZoom(false); setMobilePanel("inspect"); }}>
                  <ScanLine size={17} /> Перейти к проверкам
                </button>
              </div>
            </div>
          </div>
        )}

        {view !== "shop" && (
          <div className="room-drawer">
            <button className="drawer-back" onClick={() => setView("shop")}><ChevronLeft size={19} /> К клиенту</button>
            {view === "stock" && (
              <Drawer title="Витрина" subtitle="Продайте купленные вещи посетителям магазина." icon={Store}>
                {ownedWithData.length === 0 ? (
                  <EmptyDrawer icon={PackageOpen} text="Витрина пуста. Сначала договоритесь с клиентом у стойки." />
                ) : (
                  <div className="stock-shelf">
                    {ownedWithData.map((owned) => {
                      const price = salePrice(owned, owned.item.market);
                      const profit = price - owned.buyPrice;
                      return (
                        <article key={owned.uid}>
                          <img src={owned.item.image} alt={owned.item.name} />
                          <div><small>{owned.item.category}</small><strong>{owned.item.name}</strong><span>Куплено за {money(owned.buyPrice)}</span></div>
                          <button onClick={() => sell(owned, owned.item.market)}><Tag size={17} /> Продать {money(price)} <b className={profit >= 0 ? "positive" : "negative"}>{profit >= 0 ? "+" : "−"}{money(Math.abs(profit))}</b></button>
                        </article>
                      );
                    })}
                  </div>
                )}
              </Drawer>
            )}
            {view === "workshop" && (
              <Drawer title="Мастерская" subtitle="Восстановление повышает цену настоящих вещей." icon={Hammer}>
                {ownedWithData.length === 0 ? (
                  <EmptyDrawer icon={Wrench} text="Мастеру пока нечего ремонтировать." />
                ) : (
                  <div className="stock-shelf repair-shelf">
                    {ownedWithData.map((owned) => (
                      <article key={owned.uid}>
                        <img src={owned.item.image} alt={owned.item.name} />
                        <div><small>Состояние {owned.condition}%</small><strong>{owned.item.name}</strong><span>{owned.repaired ? "Полностью восстановлено" : `Ремонт стоит ${money(owned.item.repairCost)}`}</span></div>
                        <button disabled={owned.repaired} onClick={() => repair(owned, owned.item.repairCost)}>{owned.repaired ? <><Check size={17} /> Готово</> : <><Wrench size={17} /> Ремонт</>}</button>
                      </article>
                    ))}
                  </div>
                )}
              </Drawer>
            )}
            {view === "story" && (
              <Drawer title="История Golden Corner" subtitle="Простая цель, которая выполняется вместе с обычной игрой." icon={CircleDollarSign}>
                <div className="case-summary">
                  <span><Store size={21} /></span>
                  <div>
                    <small>ГЛАВА 1 · ПЕРВАЯ НЕДЕЛЯ</small>
                    <strong>{state.storyCompleted ? "Ломбард спасён" : `${money(storyProfit)} из ${money(STORY_PROFIT_GOAL)} прибыли`}</strong>
                    <p>Дядя Борис уехал и оставил вам старый ломбард с долгами. Докажите, что Golden Corner может приносить прибыль, и сохраните репутацию не ниже 55.</p>
                    <div className="story-progress"><i style={{ width: `${state.storyCompleted ? 100 : storyProgress}%` }} /></div>
                  </div>
                </div>

                <div className="story-timeline">
                  <article className="story-entry">
                    <span>01</span>
                    <div><small>НАЧАЛО</small><strong>Ключи на стойке</strong><p>Дядя Борис оставил записку: «Продержись первую неделю — ломбард твой».</p></div>
                  </article>
                  <article className={`story-entry ${state.reputation < 55 ? "locked" : ""}`}>
                    <span>02</span>
                    <div><small>РЕПУТАЦИЯ</small><strong>{state.reputation >= 55 ? "Клиенты начали доверять вам" : `Нужно 55 · сейчас ${state.reputation}`}</strong><p>Не покупайте подделки и не вызывайте полицию без причины.</p></div>
                  </article>
                  <article className={`story-entry ${storyProfit < STORY_PROFIT_GOAL ? "locked" : ""}`}>
                    <span>03</span>
                    <div><small>ПРИБЫЛЬ</small><strong>{storyProfit >= STORY_PROFIT_GOAL ? "Долги закрыты" : `Заработайте ещё ${money(STORY_PROFIT_GOAL - storyProfit)}`}</strong><p>Покупайте дешевле, ремонтируйте хорошие вещи и продавайте их с наценкой.</p></div>
                  </article>
                </div>

                {storyReady && !state.storyCompleted && (
                  <button className="story-complete" onClick={completeStory}>
                    <Check size={19} /><span><strong>Оставить ломбард себе</strong><small>Завершить главу и получить $250</small></span>
                  </button>
                )}

                {!storyReady && !state.storyCompleted && (
                  <div className="story-tip"><BellRing size={18} /><p>Просто продолжайте обслуживать клиентов. Сюжетный прогресс идёт автоматически.</p></div>
                )}

                {state.storyCompleted && (
                  <div className="story-ending">
                    <strong>Golden Corner остаётся вашим</strong>
                    <p>Дядя Борис подписал бумаги и оставил вам премию. Теперь можно спокойно развивать витрину и ставить новые рекорды прибыли.</p>
                  </div>
                )}
              </Drawer>
            )}
            {view === "ledger" && (
              <Drawer title="Книга учёта" subtitle="Итоги работы ломбарда." icon={BookOpenText}>
                <div className="ledger-grid">
                  <Stat icon={Banknote} label="Касса" value={money(state.cash)} />
                  <Stat icon={CircleDollarSign} label="Прибыль" value={money(state.totalProfit)} />
                  <Stat icon={HandCoins} label="Сделки" value={String(state.deals)} />
                  <Stat icon={ShieldCheck} label="Краденое" value={String(state.policeWins)} />
                  <Stat icon={Star} label="Репутация" value={`${state.reputation}/100`} />
                  <Stat icon={Clock3} label="День" value={String(state.day)} />
                </div>
                <div className="shift-note"><BellRing size={19} /><p>После каждых {CASES_PER_DAY} клиентов закрывается смена и списывается аренда $180.</p></div>
                <button className="new-game" onClick={resetGame}><History size={17} /> Начать заново</button>
              </Drawer>
            )}
          </div>
        )}
      </section>

      {toast && <div className={`toast ${toast.tone}`}><span>{toast.tone === "good" ? <Check size={18} /> : toast.tone === "bad" ? <ShieldAlert size={18} /> : <Coins size={18} />}</span>{toast.text}</div>}
    </main>
  );
}

function ToolButton({
  icon: Icon,
  label,
  cost,
  result,
  active,
  busy,
  onClick,
}: {
  icon: typeof Store;
  label: string;
  cost: string;
  result: string;
  active: boolean;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`tool-button ${active ? "done" : ""} ${busy ? "busy" : ""}`} onClick={onClick}>
      <Icon size={18} />
      <span><strong>{active ? result : label}</strong><small>{active ? "проверено" : cost}</small></span>
      {active && <Check size={15} />}
    </button>
  );
}

function Drawer({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: typeof Store;
  children: React.ReactNode;
}) {
  return (
    <section className="drawer-panel">
      <header><span><Icon size={25} /></span><div><h2>{title}</h2><p>{subtitle}</p></div></header>
      {children}
    </section>
  );
}

function EmptyDrawer({ icon: Icon, text }: { icon: typeof Store; text: string }) {
  return <div className="empty-drawer"><span><Icon size={34} /></span><p>{text}</p></div>;
}

function Stat({ icon: Icon, label, value }: { icon: typeof Store; label: string; value: string }) {
  return <article className="ledger-stat"><Icon size={20} /><span>{label}</span><strong>{value}</strong></article>;
}
