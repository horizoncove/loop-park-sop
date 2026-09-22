import type { GlobalGate, Light, OwnerSeat } from "./types";

export {
  CATEGORIES,
  COLUMNS,
  COLUMN_META,
  LIGHTS,
  OWNER_SEATS,
  SEVERITIES,
} from "./types";

export const APP_NAME = "LOOP 事件看板";
export const APP_SUBTITLE = "LOOP PARK · 千门八将";
export const STORAGE_KEY = "loop-park-risk-kanban-v3";
export const LEGACY_STORAGE_KEYS = [
  "loop-park-risk-kanban-v2",
  "loop-park-risk-kanban-v1",
];
export const BOARD_VIEW_KEY = "loop-park-board-view-v2";
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

export const SEAT_META: Record<OwnerSeat, { role: string; duty: string }> = {
  正将: { role: "总闸 / 拍板", duty: "拍板；超货盘 · 价外 · 9# 闸" },
  提将: { role: "母表 / Brief", duty: "母表、Brief、挂周入库" },
  风将: { role: "情报报知", duty: "情报 / 客流竞品 / 舆情 / 高校日历报知" },
  谣将: { role: "口径与发行", duty: "口径、公域危机话术、禁语" },
  反将: { role: "人货养成", duty: "Scout → 邀约 → 养成 / A 池" },
  火将: { role: "物业安全闸", duty: "物业安全 / 消防通道 / 开业条件否决" },
  脱将: { role: "商管变现", duty: "租户经营 / 交铺商管 / 市集动线" },
  除将: { role: "钱合同闸", duty: "财务合同合规、保单押金、未批不上账" },
};

/** Restrained hues on paper #f6f5f2 — eight seats, clearly distinct, not neon. */
export const SEAT_SWATCH: Record<OwnerSeat, string> = {
  正将: "#b08a2e",
  提将: "#3f6f8f",
  风将: "#2f8aa3",
  谣将: "#6d5b93",
  反将: "#a24b5a",
  火将: "#c0562a",
  脱将: "#5f8a3a",
  除将: "#2d7a68",
};

export function seatBand(seat: OwnerSeat, amount = 16) {
  return `color-mix(in oklab, ${SEAT_SWATCH[seat]} ${amount}%, #ffffff)`;
}

export const LIGHT_META: Record<
  Light,
  { label: string; hint: string; className: string; dot: string }
> = {
  红: {
    label: "红灯",
    hint: "阻断 / 立即处理",
    className: "text-signal-red border-signal-red/30",
    dot: "bg-signal-red",
  },
  黄: {
    label: "黄灯",
    hint: "观察 / 限期整改",
    className: "text-signal-amber border-signal-amber/30",
    dot: "bg-signal-amber",
  },
  绿: {
    label: "绿灯",
    hint: "可控 / 已闭环",
    className: "text-signal-green border-signal-green/30",
    dot: "bg-signal-green",
  },
  灰: {
    label: "灰灯",
    hint: "未定性 / 待分级",
    className: "text-mute border-line",
    dot: "bg-mute",
  },
};

export const LIGHT_SWATCH: Record<Light, string> = {
  红: "#c23b3b",
  黄: "#c4922a",
  绿: "#2f7d4a",
  灰: "#6b7280",
};

export function lightBand(light: Light, amount = 14) {
  return `color-mix(in oklab, ${LIGHT_SWATCH[light]} ${amount}%, #ffffff)`;
}
