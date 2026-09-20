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
export const APP_SUBTITLE = "LOOP PARK · 红线闸运营台";
export const STORAGE_KEY = "loop-park-risk-kanban-v1";

export const GLOBAL_GATES: GlobalGate[] = [
  {
    id: "G1",
    index: 1,
    title: "不海选招摊、不发现金、不口报死价",
    detail: "招商只走书面条件与分层方案。现场口头报价、现金激励、海选摊位一律视为越闸。",
  },
  {
    id: "G2",
    index: 2,
    title: "不讲未分层带动营业额/ROI，不讲稳赚/保值升值",
    detail: "对外口径禁止未分层 ROI、带动营业额承诺，以及任何稳赚/保值/升值表述。",
  },
  {
    id: "G3",
    index: 3,
    title: "不抄 CAD「办公」当业态；业态以 V3.0+ 铺位建议为准",
    detail: "CAD 图层标注不得直接对外。业态、铺号、面积以货盘 V3.0 及以上铺位建议为准。",
  },
  {
    id: "G4",
    index: 4,
    title: "不做自营网咖；3#4F 只做娱/造场；体育奥莱不当赛场",
    detail: "自营网咖永久禁止。3 号楼 4F 仅娱乐/造场。体育奥莱定位零售，不得按专业赛场招商。",
  },
  {
    id: "G5",
    index: 5,
    title: "不与市集/联赛共标题招商",
    detail: "市集、联赛可作内容与造场，但不得与招商标题捆绑，避免客群与合同预期错位。",
  },
  {
    id: "G6",
    index: 6,
    title: "1F 不招重油正餐；2–3F 排烟井未核前不承诺重油",
    detail: "一层禁止重油正餐。二、三层在排烟井、油烟净化与物业核验完成前，不得口头或书面承诺重油。",
  },
  {
    id: "G7",
    index: 7,
    title: "无保单/无押金条款/开业条件未齐 → 不交铺、不进场装修",
    detail: "保单、押金条款、开业条件三件套未齐套，禁止交铺钥匙与进场装修。",
  },
  {
    id: "G8",
    index: 8,
    title: "4# 不拆零；9#/价外让利/超货盘私允无效（归正将闸）",
    detail: "4 号楼不得拆零。9 号铺、价外让利、超出货盘的私下承诺一律无效，须正将书面闸口。",
  },
  {
    id: "G9",
    index: 9,
    title: "公域短稿条件红未撤前，只做私域邀约",
    detail: "公域投放素材若条件灯为红，立即停投。仅允许私域邀约与一对一沟通，不得放量。",
  },
];

export const SEAT_META: Record<
  OwnerSeat,
  { role: string; tone: string }
> = {
  正将: { role: "总闸 / 拍板", tone: "gold" },
  提将: { role: "招商转化", tone: "blue" },
  风谣: { role: "口径舆情", tone: "violet" },
  反将: { role: "合同合规", tone: "rose" },
  火脱: { role: "安全现场", tone: "orange" },
  除将: { role: "活动造场", tone: "teal" },
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
