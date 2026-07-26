"use client";

import {
  BadgeDollarSign,
  Banknote,
  BellRing,
  BookOpenText,
  Check,
  ChevronLeft,
  CircleAlert,
  Clock3,
  Eye,
  Fingerprint,
  HandCoins,
  HeartPulse,
  History,
  LockKeyhole,
  MessageCircleQuestion,
  PackageOpen,
  Radio,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Star,
  Store,
  Tag,
  Thermometer,
  UserRound,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type View = "shop" | "stock" | "archive" | "ledger";
type Panel = "questions" | "checks" | "verdict";
type QuestionKey = "origin" | "memory" | "item";
type CheckKey = "pulse" | "document" | "object";
type ActionKey = QuestionKey | CheckKey;
type GameStatus = "playing" | "won" | "lost";

type Item = {
  id: string;
  name: string;
  category: string;
  image: string;
  market: number;
  repairCost: number;
};

type Visitor = {
  customer: string;
  role: string;
  character: string;
  item: string;
  ask: number;
  min: number;
  condition: number;
  human: boolean;
  intro: string;
  answers: Record<ActionKey, { text: string; suspicious: boolean }>;
};

type OwnedItem = {
  uid: string;
  itemId: string;
  buyPrice: number;
  condition: number;
  repaired: boolean;
  contaminated: boolean;
};

type SaveState = {
  cash: number;
  reputation: number;
  night: number;
  servedTonight: number;
  caseIndex: number;
  intrudersTonight: number;
  falseAlarmsTonight: number;
  totalCaught: number;
  totalMissed: number;
  deals: number;
  profit: number;
  inventory: OwnedItem[];
  status: GameStatus;
};

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

const VISITORS: Visitor[] = [
  {
    customer: "Макс", role: "нервный курьер", character: "characters/max.webp", item: "camera", ask: 610, min: 470, condition: 78, human: true,
    intro: "Камера брата. Он уехал утром, деньги нужны до полуночи.",
    answers: {
      origin: { text: "Брат прислал голосовое и код от шкафа. Могу включить запись.", suspicious: false },
      memory: { text: "Мы снимали ею мой выпускной. Я тогда разбил объектив и месяц отрабатывал.", suspicious: false },
      item: { text: "Слева царапина, батарея держит плохо. Больше сюрпризов нет.", suspicious: false },
      pulse: { text: "112 ударов. Сильно нервничает, но ритм живой и неровный.", suspicious: true },
      document: { text: "Фото и подпись совпадают. Адрес находится в этом районе.", suspicious: false },
      object: { text: "На карте памяти семейные фотографии за последние четыре года.", suspicious: false },
    },
  },
  {
    customer: "София", role: "говорит слишком спокойно", character: "characters/sofia.webp", item: "ring", ask: 1280, min: 990, condition: 96, human: false,
    intro: "Помолвка закончилась. Кольцо больше ничего для меня не значит.",
    answers: {
      origin: { text: "Подарил Артём после ужина в «Маяке». Коробку выбросила при переезде.", suspicious: false },
      memory: { text: "Это произошло летом. Или зимой. Погода для памяти не важна.", suspicious: true },
      item: { text: "Размер семнадцатый, застёжек нет. Камень немного царапает соседние пальцы.", suspicious: false },
      pulse: { text: "31 удар. Между импульсами одинаковые паузы до миллисекунды.", suspicious: true },
      document: { text: "Документ проходит базу. Фото старое, но основные признаки совпадают.", suspicious: false },
      object: { text: "Гравировка датирована завтрашним числом.", suspicious: true },
    },
  },
  {
    customer: "Виктор Львович", role: "старый коллекционер", character: "characters/viktor.webp", item: "watch", ask: 940, min: 760, condition: 67, human: true,
    intro: "Часы моего отца. Неловко продавать, но ремонт квартиры важнее.",
    answers: {
      origin: { text: "Отец получил их за тридцать лет на заводе. На крышке его инициалы.", suspicious: false },
      memory: { text: "В детстве я слушал их тиканье, когда он возвращался с ночной смены.", suspicious: false },
      item: { text: "Спешат на семь минут в сутки. Борис когда-то уже менял пружину.", suspicious: false },
      pulse: { text: "44 удара. Ритм медленный, но врачебный браслет подтверждает норму.", suspicious: true },
      document: { text: "Паспорт просрочен месяц назад. Архивная фотография совпадает.", suspicious: true },
      object: { text: "Под крышкой инициалы и след ремонта с клеймом Бориса.", suspicious: false },
    },
  },
  {
    customer: "Роман", role: "не смотрит в зеркало", character: "characters/roman.webp", item: "phone", ask: 590, min: 455, condition: 84, human: false,
    intro: "Телефон знакомого. Он разрешил. Коробку потом принесу.",
    answers: {
      origin: { text: "Знакомого зовут... знакомый. Мы давно знакомы.", suspicious: true },
      memory: { text: "Вчера смотрели футбол и спорили из-за пенальти. Он ушёл после полуночи.", suspicious: false },
      item: { text: "Экран целый, батарея 84%. В левом углу небольшая вмятина.", suspicious: false },
      pulse: { text: "72 удара. Слишком ровный ритм не меняется даже после испуга.", suspicious: true },
      document: { text: "Документ чистый. Адрес и фотография совпадают с городской базой.", suspicious: false },
      object: { text: "Фронтальная камера показывает пустой стул перед стойкой.", suspicious: true },
    },
  },
  {
    customer: "Дима", role: "уставший студент", character: "characters/dima.webp", item: "headphones", ask: 290, min: 210, condition: 73, human: true,
    intro: "Нужны деньги за общежитие. Наушники старые, но звучат честно.",
    answers: {
      origin: { text: "Купил на первом курсе у звукаря из клуба «Маяк».", suspicious: false },
      memory: { text: "В них сводил первую песню. Бас ужасный, зато мама сохранила запись.", suspicious: false },
      item: { text: "Правое ухо тише, амбушюры менял сам. Кабель родной.", suspicious: false },
      pulse: { text: "88 ударов. Нормальная реакция на кофе и недосып.", suspicious: false },
      document: { text: "Студенческий, пропуск и банковская карта принадлежат одному человеку.", suspicious: false },
      object: { text: "Серийный номер и следы ремонта соответствуют рассказу.", suspicious: false },
    },
  },
  {
    customer: "София", role: "раздражённая покупательница", character: "characters/sofia.webp", item: "handbag", ask: 630, min: 450, condition: 91, human: true,
    intro: "Подарок из бутика. Если это подделка — претензии не ко мне.",
    answers: {
      origin: { text: "Подарил бывший. После него я уже ничему дорогому не доверяю.", suspicious: false },
      memory: { text: "Увидела сумку на заднем сиденье после нашего последнего ужина.", suspicious: false },
      item: { text: "Носила дважды. Замок заедает, внутри пятно от помады.", suspicious: false },
      pulse: { text: "79 ударов. Реагирует на вопросы раздражением и ускорением пульса.", suspicious: false },
      document: { text: "Личность подтверждена. Чек магазина поддельный.", suspicious: true },
      object: { text: "Сумка — качественная реплика, но на ней обычные человеческие следы.", suspicious: true },
    },
  },
  {
    customer: "Макс", role: "улыбается без причины", character: "characters/max.webp", item: "coin", ask: 440, min: 310, condition: 88, human: false,
    intro: "Монета деда. Дед был старый. Теперь он больше не старый.",
    answers: {
      origin: { text: "Нашёл в дедовой шкатулке под письмами. Мама разрешила продать.", suspicious: false },
      memory: { text: "Дед рассказывал мне детство после того, как перестал дышать.", suspicious: true },
      item: { text: "Серебряный доллар 1923 года. На ребре есть небольшая вмятина.", suspicious: false },
      pulse: { text: "Прибор не находит пульс. Клиент продолжает улыбаться.", suspicious: true },
      document: { text: "Документ настоящий. Штампы, фотография и подпись соответствуют базе.", suspicious: false },
      object: { text: "Монета охлаждается на два градуса каждый раз, когда клиент говорит.", suspicious: true },
    },
  },
  {
    customer: "Роман", role: "бывший строитель", character: "characters/roman.webp", item: "drill", ask: 230, min: 160, condition: 59, human: true,
    intro: "Закрыл бригаду. Инструмент не мой, но я его честно забрал за долг.",
    answers: {
      origin: { text: "Со склада на Северной. Хозяин не заплатил за два месяца.", suspicious: true },
      memory: { text: "Этой дрелью собирали сцену у городского театра. Я сорвал там спину.", suspicious: false },
      item: { text: "Аккумулятор почти мёртвый. На корпусе номер фирмы.", suspicious: false },
      pulse: { text: "96 ударов. Резко ускоряется при упоминании полиции.", suspicious: true },
      document: { text: "Личность подтверждена. Разрешения на продажу инструмента нет.", suspicious: true },
      object: { text: "Серийный номер числится украденным, но предмет физически обычный.", suspicious: true },
    },
  },
  {
    customer: "Виктор Львович", role: "не узнаёт старую фотографию", character: "characters/viktor.webp", item: "statuette", ask: 590, min: 430, condition: 82, human: false,
    intro: "Бронза. Куплена давно. Старые вещи не задают вопросов.",
    answers: {
      origin: { text: "Купил на старом блошином рынке у речного вокзала около двадцати лет назад.", suspicious: false },
      memory: { text: "Я был там с Борисом. Борис выглядел именно так, как сейчас.", suspicious: true },
      item: { text: "Бронзовый сокол, французская работа. На основании клеймо литейщика.", suspicious: false },
      pulse: { text: "45 ударов. Ритм совпадает со звуком часов на стене.", suspicious: true },
      document: { text: "Паспорт подлинный. Архивная фотография и адрес совпадают.", suspicious: false },
      object: { text: "У статуэтки две тени при одном источнике света.", suspicious: true },
    },
  },
  {
    customer: "Дима", role: "спешит на экзамен", character: "characters/dima.webp", item: "laptop", ask: 990, min: 805, condition: 64, human: true,
    intro: "Ноутбук мой. Батарея умерла, зато проекты и документы на месте.",
    answers: {
      origin: { text: "Покупал с отцом. Половину суммы заработал разгрузкой аппаратуры.", suspicious: false },
      memory: { text: "Первый файл — фото чека и дурацкое селфи из магазина.", suspicious: false },
      item: { text: "Перегревается, клавиша R залипает. Пароль назову при покупке.", suspicious: false },
      pulse: { text: "91 удар. Нормальный стресс перед экзаменом.", suspicious: false },
      document: { text: "Чек, гарантия и аккаунт зарегистрированы на Диму.", suspicious: false },
      object: { text: "Веб-камера и микрофон записывают клиента без искажений.", suspicious: false },
    },
  },
  {
    customer: "София", role: "говорит чужим голосом", character: "characters/sofia.webp", item: "vinyl", ask: 360, min: 240, condition: 93, human: false,
    intro: "Пластинка досталась вместе с квартирой. Музыка внутри мешает спать.",
    answers: {
      origin: { text: "Квартира находилась на шестом этаже пятиэтажного дома.", suspicious: true },
      memory: { text: "Квартира была пустая, пахла сыростью. Пластинка лежала рядом с книгами.", suspicious: false },
      item: { text: "Запись лучше слушать от конца к началу. Тогда слова становятся тише.", suspicious: true },
      pulse: { text: "83 удара. Пульс ровный и естественно ускоряется во время разговора.", suspicious: false },
      document: { text: "Документы чистые. Фотография, подпись и адрес совпадают.", suspicious: false },
      object: { text: "Пластинка вращается против мотора проигрывателя.", suspicious: true },
    },
  },
  {
    customer: "Макс", role: "неудачливый продавец", character: "characters/max.webp", item: "guitar", ask: 720, min: 550, condition: 71, human: true,
    intro: "Думал, винтаж. Оказалась копия. Просто верните хоть часть денег.",
    answers: {
      origin: { text: "Купил по объявлению у вокзала. Продавец сразу удалил аккаунт.", suspicious: true },
      memory: { text: "Хотел научиться ради девушки. Девушка ушла раньше, чем я выучил аккорд.", suspicious: false },
      item: { text: "Лады звенят, дерево дешёвое. Я уже знаю, что меня обманули.", suspicious: false },
      pulse: { text: "104 удара. Боится отказа, но физиология нормальная.", suspicious: true },
      document: { text: "Документы клиента настоящие. Документов на гитару нет.", suspicious: true },
      object: { text: "Современная фабричная копия, безопасная и вполне материальная.", suspicious: true },
    },
  },
  {
    customer: "София", role: "хозяйка ателье", character: "characters/sofia.webp", item: "vinyl", ask: 330, min: 235, condition: 86, human: true,
    intro: "Нашла пластинку за старым шкафом в мастерской. Проверьте, вдруг редкая.",
    answers: {
      origin: { text: "Дом на улице Мира, бывшее фотоателье. Арендодатель разрешил забрать.", suspicious: false },
      memory: { text: "Пыль была везде. Я чихнула и порвала новые шторы — прекрасный день.", suspicious: false },
      item: { text: "Конверт сырой, дорожки целые. Проигрывателя нет.", suspicious: false },
      pulse: { text: "76 ударов. Нормальная реакция на свет и вопросы.", suspicious: false },
      document: { text: "Договор аренды и адрес мастерской подтверждаются.", suspicious: false },
      object: { text: "Обычная редкая пластинка 1987 года. Никаких аномалий.", suspicious: false },
    },
  },
  {
    customer: "Дима", role: "слишком неподвижный студент", character: "characters/dima.webp", item: "laptop", ask: 920, min: 730, condition: 81, human: false,
    intro: "Мне больше не нужен компьютер. Я уже загрузил всё необходимое.",
    answers: {
      origin: { text: "Купил на втором курсе вместе с отцом. Чек должен быть в облаке.", suspicious: false },
      memory: { text: "На нём сохранены воспоминания Димы. Они открываются без пароля.", suspicious: true },
      item: { text: "Батарея держит около часа, клавиатура и экран без серьёзных дефектов.", suspicious: false },
      pulse: { text: "60 ударов. Пульс прекращается, когда на клиента не смотрят.", suspicious: true },
      document: { text: "Все документы настоящие, но оригинальный Дима отмечен пропавшим.", suspicious: true },
      object: { text: "Веб-камера показывает другого Диму, сидящего в тёмной комнате.", suspicious: true },
    },
  },
  {
    customer: "Макс", role: "пришёл второй раз за ночь", character: "characters/max.webp", item: "camera", ask: 540, min: 400, condition: 89, human: false,
    intro: "Мы уже встречались. Вы купили эту камеру завтра утром.",
    answers: {
      origin: { text: "Брат оставил её перед отъездом. Я уже приносил похожую модель.", suspicious: false },
      memory: { text: "Помню ваш ответ на вопрос, который вы ещё не задали.", suspicious: true },
      item: { text: "Объектив чистый, батарея новая. Внутри карта на шестьдесят четыре гигабайта.", suspicious: false },
      pulse: { text: "Пульс идёт назад: интервалы появляются на экране до удара.", suspicious: true },
      document: { text: "Документ проходит проверку. Адрес и фотография совпадают.", suspicious: false },
      object: { text: "На последнем кадре вы стоите за клиентом, хотя снимок сделан сейчас.", suspicious: true },
    },
  },
];

const NIGHT_DATA = [
  { title: "Первая смена", rule: "Подмены плохо удерживают личные воспоминания.", radio: "После чёрного дождя введён ночной режим. Не открывайте двери незнакомцам после рассвета.", note: "Слушай не голос, а историю вещи. Чужое лицо выучить легче, чем чужую жизнь." },
  { title: "Холодные руки", rule: "Проверка пульса полезна, но страх и возраст дают ложные признаки.", radio: "В северном квартале пропали три человека. Их документы всё ещё используются.", note: "Настоящий человек тоже может врать. Вор — не обязательно чудовище, а чудовище — не обязательно плохой продавец." },
  { title: "Чистые документы", rule: "Подмены научились проходить базу. Сравнивайте документы с рассказом.", radio: "Отдел №7 просит сохранять спокойствие. Сообщения о двойниках официально не подтверждены.", note: "Если бумага говорит одно, вещь второе, а глаза третье — верь тому, что труднее подделать." },
  { title: "Знакомые лица", rule: "Сегодня Подмена может выглядеть как уже знакомый клиент.", radio: "Не сообщайте по телефону имена близких. Некоторые звонки поступают из отключённых квартир.", note: "Я однажды выгнал Виктора Львовича по ошибке. Он до сих пор напоминает мне об этом каждую среду." },
  { title: "Тихая база", rule: "Архив работает с перебоями. Не тратьте все действия на один тип проверки.", radio: "Из-за аварии городская сеть отключена до утра. Бумажные документы временно считаются основными.", note: "Техника помогает, пока не решит помочь кому-то другому. Держи голову холодной." },
  { title: "Выгодные предложения", rule: "Опасные клиенты приносят лучшие вещи и почти не торгуются.", radio: "Жителей просят не принимать подарки и не поднимать предметы, оставленные у дверей.", note: "Самая дорогая вещь в магазине иногда обходится дороже своей цены." },
  { title: "До рассвета", rule: "Последняя ночь. Подмены знают все прежние правила.", radio: "Эвакуационный поезд отправится в 06:10. После сигнала городские двери будут запечатаны.", note: "Если читаешь это — я не успел вернуться. Доживи до утра и сохрани нашу вывеску." },
];

const INITIAL_STATE: SaveState = {
  cash: 2500,
  reputation: 60,
  night: 1,
  servedTonight: 0,
  caseIndex: 0,
  intrudersTonight: 0,
  falseAlarmsTonight: 0,
  totalCaught: 0,
  totalMissed: 0,
  deals: 0,
  profit: 0,
  inventory: [],
  status: "playing",
};

const SAVE_KEY = "pawn-after-midnight-v1";
const CASES_PER_NIGHT = 5;
const MAX_ACTIONS = 3;
const money = (value: number) => `$${Math.max(0, Math.round(value)).toLocaleString("en-US")}`;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export default function PawnAfterMidnight() {
  const [state, setState] = useState<SaveState>(INITIAL_STATE);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<View>("shop");
  const [panel, setPanel] = useState<Panel>("questions");
  const [usedActions, setUsedActions] = useState<ActionKey[]>([]);
  const [markedActions, setMarkedActions] = useState<ActionKey[]>([]);
  const [message, setMessage] = useState("");
  const [offer, setOffer] = useState(450);
  const [itemZoom, setItemZoom] = useState(false);
  const [briefing, setBriefing] = useState(true);
  const [nightReport, setNightReport] = useState(false);
  const [alarmPhase, setAlarmPhase] = useState<null | "closing" | "result">(null);
  const [alarmCorrect, setAlarmCorrect] = useState(false);
  const [toast, setToast] = useState<{ text: string; tone: "good" | "bad" | "neutral" } | null>(null);

  const visitor = VISITORS[state.caseIndex % VISITORS.length];
  const item = ITEMS.find((entry) => entry.id === visitor.item) ?? ITEMS[0];
  const nightInfo = NIGHT_DATA[Math.min(state.night - 1, NIGHT_DATA.length - 1)];
  const actionsLeft = MAX_ACTIONS - usedActions.length;
  const alarmLocked = state.falseAlarmsTonight >= 3;
  const ownedItems = useMemo(
    () => state.inventory.map((owned) => ({ ...owned, item: ITEMS.find((entry) => entry.id === owned.itemId) ?? ITEMS[0] })),
    [state.inventory],
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<SaveState>;
        setState({ ...INITIAL_STATE, ...saved, inventory: Array.isArray(saved.inventory) ? saved.inventory : [] });
      }
    } catch {
      // A damaged local save should never block the game.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }, [loaded, state]);

  useEffect(() => {
    setPanel("questions");
    setUsedActions([]);
    setMarkedActions([]);
    setMessage(visitor.intro);
    setOffer(Math.round(visitor.ask * 0.78 / 10) * 10);
    setItemZoom(false);
  }, [state.caseIndex, visitor.ask, visitor.intro]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const notify = (text: string, tone: "good" | "bad" | "neutral" = "neutral") => setToast({ text, tone });

  const useAction = (key: ActionKey) => {
    if (alarmPhase) return;
    if (usedActions.includes(key)) {
      setMarkedActions((current) => current.includes(key) ? current.filter((entry) => entry !== key) : [...current, key]);
      return;
    }
    if (actionsLeft <= 0) return;
    const result = visitor.answers[key];
    const nextActions = [...usedActions, key];
    setUsedActions(nextActions);
    setMessage(result.text);
    if (nextActions.length >= MAX_ACTIONS) window.setTimeout(() => setPanel("verdict"), 700);
  };

  const finishVisitor = (patch: Partial<SaveState>) => {
    const nextIntruders = patch.intrudersTonight ?? state.intrudersTonight;
    const losing = nextIntruders >= 3;
    const closesNight = state.servedTonight + 1 >= CASES_PER_NIGHT;
    setState((current) => ({
      ...current,
      ...patch,
      servedTonight: current.servedTonight + 1,
      caseIndex: current.caseIndex + 1,
      status: losing ? "lost" : current.status,
    }));
    setAlarmPhase(null);
    setItemZoom(false);
    if (!losing && closesNight) window.setTimeout(() => setNightReport(true), 260);
  };

  const acceptDeal = () => {
    if (offer > state.cash) {
      notify("В кассе недостаточно денег", "bad");
      return;
    }
    if (offer < visitor.min) {
      setOffer(visitor.min);
      setMessage(`Нет. Меньше ${money(visitor.min)} не отдам.`);
      notify("Клиент назвал минимальную цену", "neutral");
      return;
    }
    const owned: OwnedItem = {
      uid: `${Date.now()}-${visitor.item}`,
      itemId: visitor.item,
      buyPrice: offer,
      condition: visitor.condition,
      repaired: false,
      contaminated: !visitor.human,
    };
    const intruders = state.intrudersTonight + (visitor.human ? 0 : 1);
    notify(visitor.human ? `Сделка заключена: ${item.name}` : "Датчик склада зарегистрировал неизвестный сигнал", visitor.human ? "good" : "bad");
    finishVisitor({
      cash: state.cash - offer,
      deals: state.deals + 1,
      inventory: [...state.inventory, owned],
      intrudersTonight: intruders,
      totalMissed: state.totalMissed + (visitor.human ? 0 : 1),
      reputation: clamp(state.reputation + (visitor.human ? 1 : -3), 0, 100),
    });
  };

  const refuseVisitor = () => {
    notify(visitor.human ? "Обычный клиент ушёл без сделки" : "Посетитель покинул магазин", visitor.human ? "neutral" : "good");
    finishVisitor({ reputation: clamp(state.reputation + (visitor.human ? -1 : 1), 0, 100) });
  };

  const playAlarm = () => {
    try {
      const Context = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Context) return;
      const audio = new Context();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(220, audio.currentTime);
      oscillator.frequency.linearRampToValueAtTime(620, audio.currentTime + 0.6);
      gain.gain.setValueAtTime(0.08, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 1.1);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + 1.1);
      window.setTimeout(() => void audio.close(), 1400);
    } catch {
      // Audio is atmospheric only.
    }
  };

  const triggerAlarm = () => {
    if (alarmLocked || alarmPhase) {
      notify("После трёх ложных вызовов тревога заблокирована до рассвета", "bad");
      return;
    }
    playAlarm();
    setAlarmCorrect(!visitor.human);
    setAlarmPhase("closing");
    window.setTimeout(() => setAlarmPhase("result"), 1050);
  };

  const resolveAlarm = () => {
    if (alarmCorrect) {
      notify("Подмена задержана. Отдел №7 перечислил награду", "good");
      finishVisitor({
        cash: state.cash + 180,
        reputation: clamp(state.reputation + 4, 0, 100),
        totalCaught: state.totalCaught + 1,
      });
    } else {
      notify("Это был человек. Выплачена компенсация $120", "bad");
      finishVisitor({
        cash: state.cash - 120,
        reputation: clamp(state.reputation - 7, 0, 100),
        falseAlarmsTonight: state.falseAlarmsTonight + 1,
      });
    }
  };

  const salePrice = (owned: OwnedItem, market: number) =>
    Math.round(market * (owned.repaired ? 1.06 : 0.57 + owned.condition / 240));

  const repairItem = (owned: OwnedItem, cost: number) => {
    if (owned.repaired || owned.contaminated || state.cash < cost) {
      if (state.cash < cost) notify("Недостаточно денег на ремонт", "bad");
      return;
    }
    setState((current) => ({
      ...current,
      cash: current.cash - cost,
      inventory: current.inventory.map((entry) => entry.uid === owned.uid ? { ...entry, repaired: true, condition: 100 } : entry),
    }));
    notify("Предмет восстановлен", "good");
  };

  const sellItem = (owned: OwnedItem, market: number) => {
    if (owned.contaminated) {
      notify("От предмета идёт помеха. Дождитесь утренней зачистки", "bad");
      return;
    }
    const price = salePrice(owned, market);
    const profit = price - owned.buyPrice;
    setState((current) => ({
      ...current,
      cash: current.cash + price,
      profit: current.profit + profit,
      reputation: clamp(current.reputation + (profit >= 0 ? 1 : -1), 0, 100),
      inventory: current.inventory.filter((entry) => entry.uid !== owned.uid),
    }));
    notify(profit >= 0 ? `Продано. Прибыль ${money(profit)}` : `Продано с убытком ${money(Math.abs(profit))}`, profit >= 0 ? "good" : "bad");
  };

  const continueAfterNight = () => {
    setNightReport(false);
    if (state.night >= 7) {
      setState((current) => ({ ...current, status: "won" }));
      return;
    }
    const seized = state.inventory.filter((entry) => entry.contaminated).length;
    setState((current) => ({
      ...current,
      night: current.night + 1,
      servedTonight: 0,
      intrudersTonight: 0,
      falseAlarmsTonight: 0,
      cash: current.cash - 120,
      inventory: current.inventory.filter((entry) => !entry.contaminated),
    }));
    if (seized) notify(`Утренняя группа изъяла заражённые предметы: ${seized}`, "neutral");
    setBriefing(true);
    setView("shop");
  };

  const resetGame = () => {
    if (!window.confirm("Начать новую ночную смену и удалить сохранение?")) return;
    setState(INITIAL_STATE);
    setView("shop");
    setBriefing(true);
    setNightReport(false);
  };

  return (
    <main className="night-world">
      <section className={`night-shop ${state.intrudersTonight > 0 ? "danger-present" : ""}`}>
        <img className="night-background" src="scenes/pawnshop.webp" alt="" />
        <div className="rain-window" aria-hidden="true" />

        <header className="night-hud">
          <button className="night-brand" onClick={() => setView("shop")} aria-label="Вернуться за стойку">
            <BadgeDollarSign size={22} /><span><strong>GOLDEN CORNER</strong><small>НОЧНАЯ СМЕНА</small></span>
          </button>
          <div className="night-progress">
            <span>НОЧЬ {state.night}/7</span><i><b style={{ width: `${state.servedTonight / CASES_PER_NIGHT * 100}%` }} /></i><small>{state.servedTonight}/{CASES_PER_NIGHT}</small>
          </div>
          <div className="night-money"><Banknote size={17} /><span><small>КАССА</small><strong>{money(state.cash)}</strong></span></div>
          <div className="breach-meter" aria-label={`Проникшие Подмены: ${state.intrudersTonight} из 3`}>
            <ShieldAlert size={17} /><span><small>СКЛАД</small><b>{[0, 1, 2].map((slot) => <i key={slot} className={slot < state.intrudersTonight ? "filled" : ""} />)}</b></span>
          </div>
        </header>

        <nav className="night-nav" aria-label="Разделы">
          <button className={view === "stock" ? "active" : ""} onClick={() => setView("stock")}><PackageOpen size={20} /><small>Склад</small><i>{state.inventory.length}</i></button>
          <button className={view === "archive" ? "active" : ""} onClick={() => setView("archive")}><Radio size={20} /><small>Архив</small></button>
          <button className={view === "ledger" ? "active" : ""} onClick={() => setView("ledger")}><BookOpenText size={20} /><small>Отчёт</small></button>
        </nav>

        <div className="visitor-stage" key={`visitor-${state.caseIndex}`}>
          <div className="night-doors"><span /><span /></div>
          <div className="door-bell"><BellRing size={21} /></div>
          <div className="night-customer" style={{ backgroundImage: `url("${visitor.character}")` }} role="img" aria-label={visitor.customer} />
        </div>

        <div className="visitor-card">
          <small>ПОСЕТИТЕЛЬ #{state.servedTonight + 1}</small>
          <strong>{visitor.customer}</strong>
          <span>{visitor.role}</span>
        </div>

        <div className="rule-chip">
          <Radio size={14} />
          <span><small>ПРАВИЛО НОЧИ</small><strong>{nightInfo.rule}</strong></span>
        </div>

        <button className="night-item" onClick={() => setItemZoom(true)} aria-label={`Рассмотреть ${item.name}`}>
          <img src={item.image} alt={item.name} />
          <span><small>{item.category}</small><strong>{item.name}</strong><i>{visitor.condition}% · открыть</i></span>
        </button>

        <section className="night-console">
          <div className="visitor-speech">
            <UserRound size={20} />
            <p>«{message}»</p>
            <div className="action-budget"><small>ДЕЙСТВИЯ</small>{[0, 1, 2].map((slot) => <i key={slot} className={slot < actionsLeft ? "available" : ""} />)}</div>
          </div>

          <div className="decision-board" data-panel={panel}>
            <div className="decision-tabs">
              <button className={panel === "questions" ? "active" : ""} onClick={() => setPanel("questions")}><b>1</b><MessageCircleQuestion size={15} /><span>Вопросы</span></button>
              <button className={panel === "checks" ? "active" : ""} onClick={() => setPanel("checks")}><b>2</b><ScanLine size={15} /><span>Проверки</span></button>
              <button className={panel === "verdict" ? "active" : ""} onClick={() => setPanel("verdict")}><b>3</b><ShieldCheck size={15} /><span>Решение</span><i>{markedActions.length}</i></button>
            </div>

            <div className="panel-content question-panel">
              <ActionButton icon={MessageCircleQuestion} label="Откуда вещь?" actionKey="origin" usedActions={usedActions} markedActions={markedActions} result={visitor.answers.origin} onClick={useAction} />
              <ActionButton icon={Eye} label="Что вы помните?" actionKey="memory" usedActions={usedActions} markedActions={markedActions} result={visitor.answers.memory} onClick={useAction} />
              <ActionButton icon={Tag} label="Что с предметом?" actionKey="item" usedActions={usedActions} markedActions={markedActions} result={visitor.answers.item} onClick={useAction} />
            </div>

            <div className="panel-content check-panel">
              <ActionButton icon={HeartPulse} label="Пульс" actionKey="pulse" usedActions={usedActions} markedActions={markedActions} result={visitor.answers.pulse} onClick={useAction} />
              <ActionButton icon={Fingerprint} label="Документы" actionKey="document" usedActions={usedActions} markedActions={markedActions} result={visitor.answers.document} onClick={useAction} />
              <ActionButton icon={Thermometer} label="Сканер вещи" actionKey="object" usedActions={usedActions} markedActions={markedActions} result={visitor.answers.object} onClick={useAction} />
            </div>

            <div className="panel-content verdict-panel">
              <div className="offer-box">
                <span>Просит <strong>{money(visitor.ask)}</strong><small>{markedActions.length ? `Вы отметили фактов: ${markedActions.length}` : "Подозрительных фактов не отмечено"}</small></span>
                <b>{money(offer)}</b>
                <input type="range" aria-label="Сумма предложения" min={Math.round(visitor.ask * .45 / 10) * 10} max={visitor.ask} step={10} value={offer} onChange={(event) => setOffer(Number(event.target.value))} />
              </div>
              <div className="verdict-actions">
                <button className="refuse-button" onClick={refuseVisitor}><X size={18} /><span>Отказать</span></button>
                <button className={`alarm-button ${alarmLocked ? "locked" : ""}`} onClick={triggerAlarm}><Siren size={21} /><span>{alarmLocked ? "Заблокировано" : "ТРЕВОГА"}</span></button>
                <button className="accept-button" onClick={acceptDeal}><HandCoins size={19} /><span>Принять {money(offer)}</span></button>
              </div>
            </div>
          </div>
        </section>

        {itemZoom && (
          <div className="item-inspection" role="dialog" aria-modal="true" aria-label={`Осмотр: ${item.name}`}>
            <button className="modal-close" onClick={() => setItemZoom(false)} aria-label="Закрыть"><X size={21} /></button>
            <div className="inspection-card">
              <div className="inspection-visual"><img src={item.image} alt={item.name} /></div>
              <div>
                <small>{item.category}</small><h2>{item.name}</h2>
                <p>Состояние <strong>{visitor.condition}%</strong></p>
                <p>Обычная цена <strong>{money(item.market)}</strong></p>
                <p>Рассмотреть предмет можно бесплатно, но сканер аномалий расходует одно действие.</p>
                <button onClick={() => { setItemZoom(false); setPanel("checks"); }}><ScanLine size={17} /> Перейти к проверкам</button>
              </div>
            </div>
          </div>
        )}

        {briefing && state.status === "playing" && (
          <div className="briefing-overlay">
            <div className="briefing-card">
              <span className="briefing-number">0{state.night}</span>
              <small>23:47 · ДО РАССВЕТА 6 ЧАСОВ</small>
              <h1>{nightInfo.title}</h1>
              <p>{nightInfo.radio}</p>
              <div className="night-rule"><CircleAlert size={19} /><span><small>ПРАВИЛО НОЧИ</small><strong>{nightInfo.rule}</strong></span></div>
              <div className="briefing-guide">
                <span><b>1</b><small>Выберите любые три вопроса или проверки</small></span>
                <span><b>2</b><small>Повторный тап отмечает факт как подозрительный</small></span>
                <span><b>3</b><small>Система не знает ответа — решение принимаете вы</small></span>
              </div>
              <blockquote>«{nightInfo.note}»<small>— записка дяди Бориса</small></blockquote>
              <button onClick={() => setBriefing(false)}><LockKeyhole size={18} /> Открыть ночную смену</button>
            </div>
          </div>
        )}

        {alarmPhase && (
          <div className={`alarm-sequence ${alarmPhase}`}>
            <div className="alarm-red-light" />
            <div className="detained-figure">
              <img src={alarmCorrect ? "anomaly-reveal.png" : visitor.character} alt="" />
            </div>
            <div className="security-shutter"><span /><span /><span /><span /><span /><span /></div>
            <div className="alarm-copy">
              {alarmPhase === "closing" ? (
                <><Siren size={32} /><strong>ТРЕВОГА</strong><span>Защитная штора закрывается</span></>
              ) : (
                <>
                  {alarmCorrect ? <ShieldCheck size={34} /> : <CircleAlert size={34} />}
                  <strong>{alarmCorrect ? "ПОДМЕНА" : "ЧЕЛОВЕК"}</strong>
                  <span>{alarmCorrect ? "Отдел №7 подтвердил аномалию" : "Признаков аномалии не обнаружено"}</span>
                  <button onClick={resolveAlarm}>{alarmCorrect ? "Передать Отделу №7" : "Выплатить компенсацию"}</button>
                </>
              )}
            </div>
          </div>
        )}

        {nightReport && (
          <div className="report-overlay">
            <div className="report-card">
              <small>06:00 · СМЕНА ЗАКРЫТА</small>
              <h2>Отчёт за ночь {state.night}</h2>
              <div className="report-stats">
                <span><ShieldCheck size={19} /><small>ЗАДЕРЖАНО</small><strong>{state.totalCaught}</strong></span>
                <span className={state.intrudersTonight ? "danger" : ""}><ShieldAlert size={19} /><small>ПРОНИКЛО</small><strong>{state.intrudersTonight}/3</strong></span>
                <span><Star size={19} /><small>РЕПУТАЦИЯ</small><strong>{state.reputation}</strong></span>
              </div>
              <p>{state.intrudersTonight ? "Утренняя группа зачистит склад и изымет заражённые предметы. Их стоимость не возвращается." : "Склад чист. Ни одного неизвестного сигнала до рассвета."}</p>
              <button onClick={continueAfterNight}>{state.night >= 7 ? "Увидеть финал" : "Перейти к следующей ночи"}</button>
            </div>
          </div>
        )}

        {state.status !== "playing" && (
          <div className={`ending-overlay ${state.status}`}>
            <div>
              {state.status === "won" ? <ShieldCheck size={46} /> : <Zap size={46} />}
              <small>{state.status === "won" ? "06:10 · ЭВАКУАЦИЯ" : "СВЯЗЬ ПОТЕРЯНА"}</small>
              <h1>{state.status === "won" ? "Вы дожили до рассвета" : "Склад открыт изнутри"}</h1>
              <p>{state.status === "won" ? `Golden Corner выстоял семь ночей. Задержано Подмен: ${state.totalCaught}. Репутация: ${state.reputation}.` : "Три Подмены оказались внутри одновременно. Защитная система больше не отвечает."}</p>
              <button onClick={resetGame}><History size={18} /> Начать заново</button>
            </div>
          </div>
        )}

        {view !== "shop" && (
          <div className="night-drawer">
            <button className="drawer-back" onClick={() => setView("shop")}><ChevronLeft size={19} /> К посетителю</button>
            {view === "stock" && (
              <Drawer title="Склад и мастерская" subtitle="Ремонтируйте чистые вещи и продавайте их днём." icon={PackageOpen}>
                {ownedItems.length === 0 ? <EmptyState icon={PackageOpen} text="Склад пуст. Принятые вещи появятся здесь." /> : (
                  <div className="stock-list">
                    {ownedItems.map((owned) => {
                      const price = salePrice(owned, owned.item.market);
                      return (
                        <article key={owned.uid} className={owned.contaminated ? "contaminated" : ""}>
                          <img src={owned.item.image} alt={owned.item.name} />
                          <div><small>{owned.contaminated ? "НЕИЗВЕСТНЫЙ СИГНАЛ" : `${owned.condition}% СОСТОЯНИЕ`}</small><strong>{owned.item.name}</strong><span>Куплено за {money(owned.buyPrice)}</span></div>
                          <div className="stock-actions">
                            <button disabled={owned.repaired || owned.contaminated} onClick={() => repairItem(owned, owned.item.repairCost)}><Wrench size={16} />{owned.repaired ? "Готово" : money(owned.item.repairCost)}</button>
                            <button disabled={owned.contaminated} onClick={() => sellItem(owned, owned.item.market)}><Tag size={16} />Продать {money(price)}</button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </Drawer>
            )}
            {view === "archive" && (
              <Drawer title="Архив ночных сообщений" subtitle="Сводки города и записки дяди Бориса." icon={Radio}>
                <div className="archive-list">
                  {NIGHT_DATA.map((entry, index) => {
                    const unlocked = index < state.night;
                    return (
                      <article key={entry.title} className={unlocked ? "" : "locked"}>
                        <span>0{index + 1}</span>
                        <div><small>{unlocked ? "РАДИОСВОДКА СОХРАНЕНА" : "ЗАПИСЬ ЗАШИФРОВАНА"}</small><strong>{unlocked ? entry.title : "Следующая ночь"}</strong><p>{unlocked ? entry.radio : "Откроется после завершения текущей смены."}</p>{unlocked && <blockquote>«{entry.note}»</blockquote>}</div>
                      </article>
                    );
                  })}
                </div>
              </Drawer>
            )}
            {view === "ledger" && (
              <Drawer title="Журнал смены" subtitle="Финансы, безопасность и результаты решений." icon={BookOpenText}>
                <div className="ledger-grid">
                  <Stat icon={Banknote} label="Касса" value={money(state.cash)} />
                  <Stat icon={HandCoins} label="Сделки" value={String(state.deals)} />
                  <Stat icon={ShieldCheck} label="Задержано" value={String(state.totalCaught)} />
                  <Stat icon={ShieldAlert} label="Пропущено" value={String(state.totalMissed)} />
                  <Stat icon={Star} label="Репутация" value={`${state.reputation}/100`} />
                  <Stat icon={Clock3} label="Ночь" value={`${state.night}/7`} />
                </div>
                <div className="shift-note"><Radio size={19} /><p>Три пропущенные Подмены за одну ночь заканчивают игру. Три ложные тревоги блокируют кнопку до рассвета.</p></div>
                <button className="new-game" onClick={resetGame}><History size={17} /> Начать заново</button>
              </Drawer>
            )}
          </div>
        )}
      </section>

      {toast && <div className={`night-toast ${toast.tone}`}><span>{toast.tone === "good" ? <Check size={18} /> : toast.tone === "bad" ? <ShieldAlert size={18} /> : <CircleAlert size={18} />}</span>{toast.text}</div>}
    </main>
  );
}

function ActionButton({
  icon: Icon,
  label,
  actionKey,
  usedActions,
  markedActions,
  result,
  onClick,
}: {
  icon: typeof Store;
  label: string;
  actionKey: ActionKey;
  usedActions: ActionKey[];
  markedActions: ActionKey[];
  result: { text: string; suspicious: boolean };
  onClick: (key: ActionKey) => void;
}) {
  const used = usedActions.includes(actionKey);
  const marked = markedActions.includes(actionKey);
  return (
    <button
      className={`${used ? "used" : ""} ${marked ? "marked" : ""}`}
      onClick={() => onClick(actionKey)}
      aria-label={used ? `${result.text}. ${marked ? "Снять отметку" : "Отметить как подозрительное"}` : label}
    >
      <Icon size={18} />
      <span><strong>{label}</strong><small>{used ? result.text : "1 действие"}</small></span>
      {used && (marked ? <CircleAlert size={16} /> : <Eye size={16} />)}
    </button>
  );
}

function Drawer({ title, subtitle, icon: Icon, children }: { title: string; subtitle: string; icon: typeof Store; children: React.ReactNode }) {
  return (
    <section className="drawer-panel">
      <header><span><Icon size={24} /></span><div><h2>{title}</h2><p>{subtitle}</p></div></header>
      {children}
    </section>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Store; text: string }) {
  return <div className="empty-state"><span><Icon size={30} /></span><p>{text}</p></div>;
}

function Stat({ icon: Icon, label, value }: { icon: typeof Store; label: string; value: string }) {
  return <article className="ledger-stat"><Icon size={20} /><span>{label}</span><strong>{value}</strong></article>;
}
