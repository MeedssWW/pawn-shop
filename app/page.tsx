"use client";

import {
  BadgeDollarSign,
  Banknote,
  BookOpenText,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Coins,
  Fingerprint,
  Hammer,
  HandCoins,
  History,
  PackageOpen,
  ScanLine,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Tag,
  TrendingUp,
  UserRound,
  UsersRound,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type View = "counter" | "stock" | "workshop" | "ledger";
type CheckType = "auth" | "serial" | "value";
type ToastTone = "good" | "bad" | "neutral";

type Customer = {
  id: string;
  name: string;
  role: string;
  image: string;
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
};

const CUSTOMERS: Customer[] = [
  { id: "max", name: "Макс", role: "спешит и нервничает", image: "customers/max.webp", patience: 62 },
  { id: "sofia", name: "София", role: "знает цену красивым вещам", image: "customers/sofia.webp", patience: 74 },
  { id: "viktor", name: "Виктор Львович", role: "коллекционер старой школы", image: "customers/viktor.webp", patience: 86 },
  { id: "roman", name: "Роман", role: "не любит лишних вопросов", image: "customers/roman.webp", patience: 48 },
  { id: "dima", name: "Дима", role: "студент и техноэнтузиаст", image: "customers/dima.webp", patience: 78 },
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
};

const SAVE_KEY = "pawn-shop-save-v1";
const CASES_PER_DAY = 6;

const money = (value: number) => `$${Math.max(0, Math.round(value)).toLocaleString("en-US")}`;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export default function PawnShopGame() {
  const [view, setView] = useState<View>("counter");
  const [state, setState] = useState<SaveState>(INITIAL_STATE);
  const [offer, setOffer] = useState(450);
  const [checks, setChecks] = useState<CheckType[]>([]);
  const [counterOffer, setCounterOffer] = useState<number | null>(null);
  const [toast, setToast] = useState<{ text: string; tone: ToastTone } | null>(null);
  const [loaded, setLoaded] = useState(false);

  const scenario = SCENARIOS[state.caseIndex % SCENARIOS.length];
  const customer = CUSTOMERS.find((entry) => entry.id === scenario.customer) ?? CUSTOMERS[0];
  const item = ITEMS.find((entry) => entry.id === scenario.item) ?? ITEMS[0];
  const floorOffer = Math.max(25, Math.round(scenario.ask * 0.45 / 10) * 10);
  const ceilingOffer = Math.round(scenario.ask * 1.1 / 10) * 10;
  const dayProgress = (state.servedToday / CASES_PER_DAY) * 100;

  const ownedWithData = useMemo(
    () =>
      state.inventory.map((owned) => ({
        ...owned,
        item: ITEMS.find((entry) => entry.id === owned.itemId) ?? ITEMS[0],
      })),
    [state.inventory],
  );

  const stockValue = useMemo(
    () =>
      ownedWithData.reduce((sum, owned) => {
        const authenticity = owned.authentic ? 1 : 0.08;
        const condition = owned.repaired ? 1.04 : 0.58 + owned.condition / 250;
        return sum + owned.item.market * authenticity * condition;
      }, 0),
    [ownedWithData],
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<SaveState>;
        setState({ ...INITIAL_STATE, ...parsed, inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [] });
      }
    } catch {
      // A damaged save should never block the game.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }, [loaded, state]);

  useEffect(() => {
    setOffer(Math.round(scenario.ask * 0.72 / 10) * 10);
    setChecks([]);
    setCounterOffer(null);
  }, [state.caseIndex, scenario.ask]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const notify = useCallback((text: string, tone: ToastTone = "neutral") => {
    setToast({ text, tone });
  }, []);

  const finishCase = useCallback(
    (patch: Partial<SaveState> = {}) => {
      setState((current) => {
        const nextServed = current.servedToday + 1;
        const closesDay = nextServed >= CASES_PER_DAY;
        const rent = closesDay ? 180 : 0;
        return {
          ...current,
          ...patch,
          cash: (patch.cash ?? current.cash) - rent,
          day: current.day + (closesDay ? 1 : 0),
          servedToday: closesDay ? 0 : nextServed,
          caseIndex: current.caseIndex + 1,
        };
      });
    },
    [],
  );

  const runCheck = (type: CheckType) => {
    if (checks.includes(type)) return;
    const costs: Record<CheckType, number> = { auth: 18, serial: 24, value: 12 };
    if (state.cash < costs[type]) {
      notify("Не хватает денег на проверку", "bad");
      return;
    }
    setState((current) => ({ ...current, cash: current.cash - costs[type] }));
    setChecks((current) => [...current, type]);
    notify(type === "auth" ? "Эксперт закончил осмотр" : type === "serial" ? "База серийных номеров ответила" : "Рынок проанализирован", "good");
  };

  const buyItem = () => {
    if (offer > state.cash) {
      notify("В кассе недостаточно денег", "bad");
      return;
    }
    if (offer < scenario.min && counterOffer === null) {
      const nextCounter = Math.round((scenario.min + offer * 0.18) / 10) * 10;
      setCounterOffer(nextCounter);
      setOffer(nextCounter);
      notify(`${customer.name}: меньше ${money(nextCounter)} не отдам`, "neutral");
      return;
    }
    if (offer < scenario.min) {
      notify("Клиент забрал вещь и ушёл", "bad");
      finishCase({ reputation: clamp(state.reputation - 1, 0, 100) });
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
    notify(`Сделка закрыта: ${item.name} за ${money(offer)}`, scenario.authentic && !scenario.stolen ? "good" : "neutral");
    finishCase({
      cash: state.cash - offer,
      inventory: [...state.inventory, owned],
      deals: state.deals + 1,
    });
  };

  const callPolice = () => {
    if (scenario.stolen) {
      notify("Полиция подтвердила кражу. Репутация выросла!", "good");
      finishCase({
        cash: state.cash + 120,
        reputation: clamp(state.reputation + 7, 0, 100),
        policeWins: state.policeWins + 1,
      });
    } else {
      notify("Ошибка: вещь чистая. Компенсация клиенту — $90", "bad");
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

  const repair = (owned: OwnedItem, repairCost: number) => {
    if (owned.repaired) return;
    if (state.cash < repairCost) {
      notify("Не хватает денег на ремонт", "bad");
      return;
    }
    setState((current) => ({
      ...current,
      cash: current.cash - repairCost,
      inventory: current.inventory.map((entry) =>
        entry.uid === owned.uid ? { ...entry, repaired: true, condition: 100 } : entry,
      ),
    }));
    notify("Предмет восстановлен и готов к витрине", "good");
  };

  const salePrice = (owned: OwnedItem, market: number) => {
    if (!owned.authentic) return Math.round(market * 0.06);
    const multiplier = owned.repaired ? 1.05 : 0.58 + owned.condition / 240;
    return Math.round(market * multiplier);
  };

  const sell = (owned: OwnedItem, market: number) => {
    const price = salePrice(owned, market);
    const profit = price - owned.buyPrice;
    setState((current) => ({
      ...current,
      cash: current.cash + price,
      totalProfit: current.totalProfit + profit,
      reputation: clamp(current.reputation + (profit > 0 ? 1 : -1), 0, 100),
      inventory: current.inventory.filter((entry) => entry.uid !== owned.uid),
    }));
    notify(profit >= 0 ? `Продано. Прибыль ${money(profit)}` : `Продано с убытком ${money(Math.abs(profit))}`, profit >= 0 ? "good" : "bad");
  };

  const resetGame = () => {
    if (!window.confirm("Начать новую игру? Текущий прогресс будет удалён.")) return;
    setState(INITIAL_STATE);
    setView("counter");
    notify("Новая смена началась", "neutral");
  };

  const checkCards = [
    {
      type: "auth" as const,
      icon: ScanLine,
      label: "Экспертиза",
      sub: "$18",
      result: scenario.authentic ? "Материалы и маркировка подлинные" : "Найдены признаки подделки",
    },
    {
      type: "serial" as const,
      icon: Fingerprint,
      label: "Серийный номер",
      sub: "$24",
      result: scenario.stolen ? "Совпадение с базой украденных вещей" : "Совпадений в базе нет",
    },
    {
      type: "value" as const,
      icon: TrendingUp,
      label: "Оценка рынка",
      sub: "$12",
      result: `Цена продажи: ${money(item.market * 0.82)}–${money(item.market * 1.08)}`,
    },
  ];

  return (
    <main className="app-shell">
      <aside className="side-rail">
        <div className="brand-mark" aria-label="Pawn Shop">
          <span><BadgeDollarSign size={27} /></span>
          <strong>PAWN</strong>
        </div>
        <nav aria-label="Разделы игры">
          <NavButton view="counter" current={view} onClick={setView} icon={HandCoins} label="Приёмка" />
          <NavButton view="stock" current={view} onClick={setView} icon={ShoppingBag} label="Витрина" badge={state.inventory.length} />
          <NavButton view="workshop" current={view} onClick={setView} icon={Wrench} label="Мастерская" />
          <NavButton view="ledger" current={view} onClick={setView} icon={BookOpenText} label="Отчёт" />
        </nav>
        <div className="rail-footer">
          <span>Репутация</span>
          <strong><Star size={15} fill="currentColor" /> {state.reputation}</strong>
        </div>
      </aside>

      <section className="game-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">ЛОМБАРД «ЗОЛОТОЙ УГОЛ»</p>
            <h1>{view === "counter" ? "Приёмка" : view === "stock" ? "Витрина" : view === "workshop" ? "Мастерская" : "Книга учёта"}</h1>
          </div>
          <div className="top-resources">
            <div className="resource-pill"><Banknote size={19} /><span>Касса</span><strong>{money(state.cash)}</strong></div>
            <div className="resource-pill day-pill"><Clock3 size={18} /><span>День</span><strong>{state.day}</strong></div>
          </div>
        </header>

        <div className="day-strip">
          <span style={{ width: `${dayProgress}%` }} />
          <p>{state.servedToday}/{CASES_PER_DAY} клиентов · в конце дня аренда $180</p>
        </div>

        {view === "counter" && (
          <section className="counter-screen">
            <div className="customer-stage">
              <div className="scene-glow" />
              <div className="customer-copy">
                <span className="queue-label"><UsersRound size={15} /> Клиент #{state.servedToday + 1}</span>
                <h2>{customer.name}</h2>
                <p>{customer.role}</p>
              </div>
              <img className="customer-portrait" src={customer.image} alt={customer.name} />
              <div className="dialogue">
                <UserRound size={20} />
                <p>«{scenario.story}»</p>
              </div>
              <div className="patience">
                <span>Терпение</span>
                <div><i style={{ width: `${customer.patience}%` }} /></div>
              </div>
            </div>

            <div className="deal-desk">
              <article className="item-hero">
                <div className="item-visual">
                  <img src={item.image} alt={item.name} />
                  <span className="condition-chip">{scenario.condition}% состояние</span>
                </div>
                <div className="item-title">
                  <span>{item.category}</span>
                  <h2>{item.name}</h2>
                  <div className="ask-row">
                    <p>Цена клиента</p>
                    <strong>{money(scenario.ask)}</strong>
                  </div>
                </div>
              </article>

              <section className="inspection-panel">
                <div className="section-heading">
                  <div><Search size={18} /><span>Проверка предмета</span></div>
                  <small>Проверки платные, но снижают риск</small>
                </div>
                <div className="check-grid">
                  {checkCards.map((check) => {
                    const checked = checks.includes(check.type);
                    const Icon = check.icon;
                    return (
                      <button className={`check-card ${checked ? "checked" : ""}`} key={check.type} onClick={() => runCheck(check.type)}>
                        <span className="check-icon">{checked ? <Check size={18} /> : <Icon size={19} />}</span>
                        <span><strong>{check.label}</strong><small>{checked ? check.result : check.sub}</small></span>
                        {!checked && <ChevronRight size={17} />}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="offer-panel">
                <div className="offer-head">
                  <div>
                    <span>Ваше предложение</span>
                    <strong>{money(offer)}</strong>
                  </div>
                  {counterOffer && <span className="counter-badge">Встречная цена</span>}
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
                <div className="range-labels"><span>{money(floorOffer)}</span><span>{money(ceilingOffer)}</span></div>
                <div className="deal-actions">
                  <button className="secondary-action danger" onClick={callPolice}><ShieldAlert size={19} /><span>Полиция</span></button>
                  <button className="secondary-action" onClick={refuse}><X size={19} /><span>Отказать</span></button>
                  <button className="primary-action" onClick={buyItem}><HandCoins size={20} /><span>Предложить {money(offer)}</span></button>
                </div>
              </section>
            </div>
          </section>
        )}

        {view === "stock" && (
          <section className="content-screen">
            <div className="screen-intro">
              <div><span className="icon-box"><Store size={24} /></span><div><h2>Витрина магазина</h2><p>Выставляйте купленные вещи и фиксируйте прибыль.</p></div></div>
              <div className="summary-value"><span>Оценка запасов</span><strong>{money(stockValue)}</strong></div>
            </div>
            {ownedWithData.length === 0 ? (
              <EmptyState icon={PackageOpen} title="Витрина пока пустая" text="Заключите первую сделку на приёмке — товар появится здесь." action={() => setView("counter")} actionText="Перейти к клиенту" />
            ) : (
              <div className="inventory-grid">
                {ownedWithData.map((owned) => {
                  const price = salePrice(owned, owned.item.market);
                  const profit = price - owned.buyPrice;
                  return (
                    <article className="inventory-card" key={owned.uid}>
                      <div className="inventory-image"><img src={owned.item.image} alt={owned.item.name} />{!owned.authentic && <span className="fake-label">ПОДДЕЛКА</span>}</div>
                      <div className="inventory-body">
                        <span>{owned.item.category}</span>
                        <h3>{owned.item.name}</h3>
                        <div className="item-numbers">
                          <p><span>Закупка</span><strong>{money(owned.buyPrice)}</strong></p>
                          <p><span>Продажа</span><strong>{money(price)}</strong></p>
                        </div>
                        <button className="sell-button" onClick={() => sell(owned, owned.item.market)}>
                          <Tag size={18} /><span>Продать</span><strong className={profit >= 0 ? "profit" : "loss"}>{profit >= 0 ? "+" : "−"}{money(Math.abs(profit))}</strong>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {view === "workshop" && (
          <section className="content-screen">
            <div className="screen-intro">
              <div><span className="icon-box"><Hammer size={24} /></span><div><h2>Мастерская</h2><p>Ремонт повышает цену, но не спасает подделки.</p></div></div>
              <div className="summary-value"><span>Мастер</span><strong>ур. 1</strong></div>
            </div>
            {ownedWithData.length === 0 ? (
              <EmptyState icon={Wrench} title="Ремонтировать пока нечего" text="Купите предмет на приёмке, затем оцените выгоду ремонта." action={() => setView("counter")} actionText="Открыть приёмку" />
            ) : (
              <div className="repair-list">
                {ownedWithData.map((owned) => {
                  const before = salePrice(owned, owned.item.market);
                  const after = owned.authentic ? Math.round(owned.item.market * 1.05) : Math.round(owned.item.market * 0.06);
                  return (
                    <article className="repair-row" key={owned.uid}>
                      <img src={owned.item.image} alt={owned.item.name} />
                      <div className="repair-info">
                        <span>{owned.item.category}</span>
                        <h3>{owned.item.name}</h3>
                        <div className="condition-bar"><i style={{ width: `${owned.condition}%` }} /></div>
                        <small>{owned.repaired ? "Полностью восстановлен" : `Состояние ${owned.condition}%`}</small>
                      </div>
                      <div className="repair-value">
                        <span>После ремонта</span>
                        <strong>{money(after)}</strong>
                        <small>сейчас {money(before)}</small>
                      </div>
                      <button disabled={owned.repaired} onClick={() => repair(owned, owned.item.repairCost)}>
                        {owned.repaired ? <><Check size={18} /> Готово</> : <><Wrench size={18} /> Ремонт {money(owned.item.repairCost)}</>}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {view === "ledger" && (
          <section className="content-screen ledger-screen">
            <div className="screen-intro">
              <div><span className="icon-box"><BookOpenText size={24} /></span><div><h2>Книга учёта</h2><p>Главные результаты вашего ломбарда.</p></div></div>
              <button className="reset-button" onClick={resetGame}><History size={17} /> Новая игра</button>
            </div>
            <div className="stats-grid">
              <StatCard icon={CircleDollarSign} label="Чистая прибыль" value={money(state.totalProfit)} note="с проданных товаров" tone="green" />
              <StatCard icon={ShoppingBag} label="Успешных сделок" value={String(state.deals)} note={`${state.inventory.length} предметов в запасе`} tone="gold" />
              <StatCard icon={ShieldCheck} label="Краденых найдено" value={String(state.policeWins)} note="передано полиции" tone="blue" />
              <StatCard icon={Star} label="Репутация" value={`${state.reputation}/100`} note={state.reputation >= 70 ? "вам доверяет город" : "ещё есть куда расти"} tone="purple" />
            </div>
            <article className="daily-card">
              <div>
                <span className="icon-box"><Zap size={24} /></span>
                <div><span>Текущая смена</span><h3>День {state.day}</h3><p>Обслужите ещё {CASES_PER_DAY - state.servedToday} клиентов, чтобы закрыть день.</p></div>
              </div>
              <div className="daily-progress"><i style={{ width: `${dayProgress}%` }} /></div>
              <strong>{state.servedToday}/{CASES_PER_DAY}</strong>
            </article>
            <article className="rules-card">
              <div className="rules-head"><Sparkles size={20} /><h3>Как растёт бизнес</h3></div>
              <div className="rules-grid">
                <p><span>01</span><strong>Проверяйте</strong><small>Подделка почти ничего не стоит при продаже.</small></p>
                <p><span>02</span><strong>Торгуйтесь</strong><small>Чем ниже закупка, тем выше ваша маржа.</small></p>
                <p><span>03</span><strong>Ремонтируйте</strong><small>Сравнивайте прирост цены со стоимостью работ.</small></p>
                <p><span>04</span><strong>Не рискуйте</strong><small>Краденые вещи бьют по кассе и репутации.</small></p>
              </div>
            </article>
          </section>
        )}
      </section>

      <nav className="mobile-nav" aria-label="Разделы игры">
        <NavButton view="counter" current={view} onClick={setView} icon={HandCoins} label="Приёмка" />
        <NavButton view="stock" current={view} onClick={setView} icon={ShoppingBag} label="Витрина" badge={state.inventory.length} />
        <NavButton view="workshop" current={view} onClick={setView} icon={Wrench} label="Ремонт" />
        <NavButton view="ledger" current={view} onClick={setView} icon={BookOpenText} label="Отчёт" />
      </nav>

      {toast && <div className={`toast ${toast.tone}`}><span>{toast.tone === "good" ? <Check size={19} /> : toast.tone === "bad" ? <ShieldAlert size={19} /> : <Coins size={19} />}</span>{toast.text}</div>}
    </main>
  );
}

function NavButton({
  view,
  current,
  onClick,
  icon: Icon,
  label,
  badge,
}: {
  view: View;
  current: View;
  onClick: (view: View) => void;
  icon: typeof Store;
  label: string;
  badge?: number;
}) {
  return (
    <button className={current === view ? "active" : ""} onClick={() => onClick(view)}>
      <span><Icon size={22} />{Boolean(badge) && <i>{badge}</i>}</span>
      <small>{label}</small>
    </button>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
  action,
  actionText,
}: {
  icon: typeof Store;
  title: string;
  text: string;
  action: () => void;
  actionText: string;
}) {
  return (
    <div className="empty-state">
      <span><Icon size={34} /></span>
      <h3>{title}</h3>
      <p>{text}</p>
      <button onClick={action}>{actionText}<ChevronRight size={18} /></button>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  note,
  tone,
}: {
  icon: typeof Store;
  label: string;
  value: string;
  note: string;
  tone: string;
}) {
  return (
    <article className={`stat-card ${tone}`}>
      <span><Icon size={22} /></span>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}
