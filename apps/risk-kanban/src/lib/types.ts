export const COLUMNS = [
  "todo",
  "investigating",
  "watch",
  "blocked",
  "closed",
] as const;

export type ColumnId = (typeof COLUMNS)[number];

export const COLUMN_META: Record<
  ColumnId,
  { label: string; hint: string; accent: string }
> = {
  todo: { label: "待排查", hint: "尚未核实", accent: "gray" },
  investigating: { label: "排查中", hint: "正在取证", accent: "blue" },
  watch: { label: "黄灯观察", hint: "可观察但须盯", accent: "amber" },
  blocked: { label: "红灯阻断", hint: "红线闸已落下", accent: "red" },
  closed: { label: "已关闭/绿", hint: "闸口已闭环", accent: "green" },
};

export const CATEGORIES = [
  "战略定位",
  "货盘业态",
  "招商转化",
  "安全消防物业",
  "财务合同合规",
  "口径舆情",
  "建设工期开业",
  "活动造场与联赛",
  "竞品客流",
  "组织协作",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const SEVERITIES = ["P0", "P1", "P2"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const LIGHTS = ["红", "黄", "绿", "灰"] as const;
export type Light = (typeof LIGHTS)[number];

export const OWNER_SEATS = [
  "正将",
  "提将",
  "风谣",
  "反将",
  "火脱",
  "除将",
] as const;
export type OwnerSeat = (typeof OWNER_SEATS)[number];

export type BoardView = "status" | "seat";

export type GateId = "G1" | "G2" | "G3" | "G4" | "G5" | "G6" | "G7" | "G8" | "G9";

export interface GlobalGate {
  id: GateId;
  index: number;
  title: string;
  detail: string;
  enforcingSeats: OwnerSeat[];
}

export interface CardGate {
  id: GateId;
  checked: boolean;
}

export interface RiskNote {
  id: string;
  body: string;
  authorSeat: OwnerSeat | "系统";
  createdAt: string;
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  category: Category;
  severity: Severity;
  light: Light;
  ownerSeat: OwnerSeat;
  collabSeats: OwnerSeat[];
  triggers: string[];
  residualRisk: string;
  redLineGates: CardGate[];
  status: ColumnId;
  notes: RiskNote[];
  updatedAt: string;
}

export interface StorePayload {
  version: number;
  updatedAt: string;
  risks: Risk[];
}
