import type { OwnerSeat } from "./types";

export type SopSectionId = "daily" | "weekly" | "milestone" | "promo";

export type SopCadence = SopSectionId | "none";

export const SOP_CADENCE_LABEL: Record<SopCadence, string> = {
  daily: "每日",
  weekly: "每周一节奏",
  milestone: "开业里程碑闸口",
  promo: "宣发倒排（活动 T-7）",
  none: "仅看板跟踪",
};

export type SopSection = {
  id: SopSectionId;
  title: string;
  source: string;
  seats: OwnerSeat[];
  items: string[];
};

/** Checklist copy for the SOP page — mirrors docs, does not edit Markdown SOP files. */
export const SOP_SECTIONS: SopSection[] = [
  {
    id: "daily",
    title: "每日",
    source: "工作SOP / 舆情监测",
    seats: ["风将", "谣将", "火将"],
    items: [
      "舆情蓝级自行处理并归档，不打扰",
      "黄色以上舆情 4 小时内上报，附建议方案",
      "红灯阻断项若有新增，同步看板并点名席位",
      "现场通道、占道、动火作业巡一眼",
    ],
  },
  {
    id: "weekly",
    title: "每周一节奏",
    source: "05-协作与汇报SOP",
    seats: ["提将", "正将", "谣将"],
    items: [
      "上周完成事项归档到知识库",
      "本周计划与需要拍板的事项列出",
      "红线闸九条巡检：哪些仍红/黄",
      "口径抽检：公域短稿、招商话术、T 码是否双轨",
      "舆情周报：蓝/黄/橙/红计数",
      "开业条件 / 保单 / 交铺清单进度",
    ],
  },
  {
    id: "milestone",
    title: "开业里程碑闸口",
    source: "风险种子 + 红线",
    seats: ["除将", "火将", "脱将", "正将"],
    items: [
      "开业条件三件套齐套前不交铺",
      "保单与押金条款齐套前进场装修",
      "消防通道与疏散净宽验收",
      "公域短稿条件红撤销前只做私域",
      "货盘 V3.0+ 锁定，废止旧 T 码",
      "4# 不拆零、9# 私允归正将",
      "收款对公账户开立完成",
      "1F 重油正餐清零，2–3F 排烟井未核不承诺",
      "活动借场书面同意 + 医疗点 + 保单",
    ],
  },
  {
    id: "promo",
    title: "宣发倒排（活动 T-7）",
    source: "03-宣传推广SOP",
    seats: ["谣将", "反将", "提将"],
    items: [
      "T-7 方案定稿，核对是否共标题招商",
      "T-5 主视觉不含未分层 ROI / 稳赚",
      "T-3 第一轮宣发（条件灯非红）",
      "T-1 倒计时物料与现场动线再核",
      "T+1 复盘内容归档",
      "T+3 数据与舆情一并进周报",
    ],
  },
];

export function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}
