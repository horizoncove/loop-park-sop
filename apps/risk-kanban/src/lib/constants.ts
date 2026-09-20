import type { GlobalGate, OwnerSeat } from "./types";

export {
  CATEGORIES,
  COLUMNS,
  COLUMN_META,
  LIGHTS,
  OWNER_SEATS,
  SEVERITIES,
} from "./types";

export const APP_NAME = "LOOP 风险看板";
export const APP_SUBTITLE = "LOOP PARK · 千门八将";
export const STORAGE_KEY = "loop-park-risk-kanban-v3";
export const LEGACY_STORAGE_KEYS = [
  "loop-park-risk-kanban-v2",
  "loop-park-risk-kanban-v1",
];
export const BOARD_VIEW_KEY = "loop-park-board-view-v1";
export const MY_SEAT_KEY = "loop-park-my-seat-v2";
export const MINE_ONLY_KEY = "loop-park-mine-only-v1";
export const STORE_VERSION = 3;

export const GLOBAL_GATES: GlobalGate[] = [
  {
    id: "G1",
    index: 1,
    title: "不海选招摊、不发现金、不口报死价",
    detail: "招商只走书面条件与分层方案。现场口头报价、现金激励、海选摊位一律视为越闸。",
    enforcingSeats: ["反将", "提将"],
  },
  {
    id: "G2",
    index: 2,
    title: "不讲未分层带动营业额/ROI，不讲稳赚/保值升值",
    detail: "对外口径禁止未分层 ROI、带动营业额承诺，以及任何稳赚/保值/升值表述。",
    enforcingSeats: ["谣将"],
  },
  {
    id: "G3",
    index: 3,
    title: "不抄 CAD「办公」当业态；业态以 V3.0+ 铺位建议为准",
    detail: "CAD 图层标注不得直接对外。业态、铺号、面积以货盘 V3.0 及以上铺位建议为准。",
    enforcingSeats: ["提将"],
  },
  {
    id: "G4",
    index: 4,
    title: "不做自营网咖；3#4F 只做娱/造场；体育奥莱不当赛场",
    detail: "自营网咖永久禁止。3 号楼 4F 仅娱乐/造场。体育奥莱定位零售，不得按专业赛场招商。",
    enforcingSeats: ["正将"],
  },
  {
    id: "G5",
    index: 5,
    title: "不与市集/联赛共标题招商",
    detail: "市集、联赛可作内容与造场，但不得与招商标题捆绑，避免客群与合同预期错位。",
    enforcingSeats: ["谣将", "提将"],
  },
  {
    id: "G6",
    index: 6,
    title: "1F 不招重油正餐；2–3F 排烟井未核前不承诺重油",
    detail: "一层禁止重油正餐。二、三层在排烟井、油烟净化与物业核验完成前，不得口头或书面承诺重油。",
    enforcingSeats: ["提将", "火将"],
  },
  {
    id: "G7",
    index: 7,
    title: "无保单/无押金条款/开业条件未齐 → 不交铺、不进场装修",
    detail: "保单、押金条款、开业条件三件套未齐套，禁止交铺钥匙与进场装修。",
    enforcingSeats: ["除将", "火将", "脱将"],
  },
  {
    id: "G8",
    index: 8,
    title: "4# 不拆零；9#/价外让利/超货盘私允无效（归正将闸）",
    detail: "4 号楼不得拆零。9 号铺、价外让利、超出货盘的私下承诺一律无效，须正将书面闸口。",
    enforcingSeats: ["正将"],
  },
  {
    id: "G9",
    index: 9,
    title: "公域短稿条件红未撤前，只做私域邀约",
    detail: "公域投放素材若条件灯为红，立即停投。仅允许私域邀约与一对一沟通，不得放量。",
    enforcingSeats: ["谣将", "反将"],
  },
];

export const SEAT_META: Record<
  OwnerSeat,
  { role: string; duty: string; tone: string }
> = {
  正将: { role: "总闸 / 拍板", duty: "拍板；超货盘 · 价外 · 9# 闸", tone: "gold" },
  提将: { role: "母表 / Brief", duty: "母表、Brief、挂周入库", tone: "blue" },
  风将: {
    role: "情报报知",
    duty: "情报 / 客流竞品 / 舆情 / 高校日历报知",
    tone: "sky",
  },
  谣将: {
    role: "口径与发行",
    duty: "口径、公域危机话术、禁语",
    tone: "violet",
  },
  反将: { role: "人货养成", duty: "Scout → 邀约 → 养成 / A 池", tone: "rose" },
  火将: {
    role: "物业安全闸",
    duty: "物业安全 / 消防通道 / 开业条件否决",
    tone: "orange",
  },
  脱将: {
    role: "商管变现",
    duty: "租户经营 / 交铺商管 / 市集动线",
    tone: "lime",
  },
  除将: { role: "钱合同闸", duty: "财务合同合规、保单押金、未批不上账", tone: "teal" },
};

export const LIGHT_META: Record<
  "红" | "黄" | "绿" | "灰",
  { label: string; className: string; dot: string; glow: string }
> = {
  红: {
    label: "红灯阻断",
    className: "text-red-300 bg-red-500/15 border-red-500/30",
    dot: "bg-red-500",
    glow: "shadow-[0_0_12px_rgba(239,68,68,0.55)]",
  },
  黄: {
    label: "黄灯观察",
    className: "text-amber-200 bg-amber-400/15 border-amber-400/30",
    dot: "bg-amber-400",
    glow: "shadow-[0_0_12px_rgba(251,191,36,0.45)]",
  },
  绿: {
    label: "绿灯闭环",
    className: "text-emerald-200 bg-emerald-400/15 border-emerald-400/30",
    dot: "bg-emerald-400",
    glow: "shadow-[0_0_12px_rgba(52,211,153,0.4)]",
  },
  灰: {
    label: "灰色待核",
    className: "text-stone-300 bg-stone-400/10 border-stone-500/30",
    dot: "bg-stone-400",
    glow: "",
  },
};

export const SEAT_COLUMN_ACCENT: Record<OwnerSeat, string> = {
  正将: "from-amber-400/40",
  提将: "from-blue-400/30",
  风将: "from-sky-400/35",
  谣将: "from-violet-400/35",
  反将: "from-rose-400/35",
  火将: "from-orange-500/40",
  脱将: "from-lime-400/30",
  除将: "from-teal-400/35",
};
