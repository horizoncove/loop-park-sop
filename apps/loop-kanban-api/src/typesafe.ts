import { TypeSafeClient, choice, noul, type ChoiceResponse } from "@typesafe-ai/sdk";
import { SEATS, type SeatName } from "./auth.js";

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

export const SEVERITIES = ["P0", "P1", "P2"] as const;
export const LIGHTS = ["红", "黄", "绿", "灰"] as const;
export const GATE_IDS = ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9"] as const;
export const SOP_CADENCES = ["daily", "weekly", "milestone", "promo", "none"] as const;
export const SENTIMENT_LEVELS = ["蓝", "黄", "橙", "红", "不适用"] as const;
export const REPORT_SLAS = ["立即", "1小时", "4小时", "24小时", "无需上报"] as const;

export type Category = (typeof CATEGORIES)[number];
export type Severity = (typeof SEVERITIES)[number];
export type Light = (typeof LIGHTS)[number];
export type GateId = (typeof GATE_IDS)[number];
export type SopCadence = (typeof SOP_CADENCES)[number];
export type SentimentLevel = (typeof SENTIMENT_LEVELS)[number];
export type ReportSla = (typeof REPORT_SLAS)[number];

const SEAT_CRITERIA: Record<SeatName, string> = {
  正将: "总闸拍板；超货盘、价外让利、9# 等须正将书面闸口",
  提将: "母表、Brief、挂周入库；业态与招商条件母表",
  风将: "情报报知；客流竞品、舆情、高校日历",
  谣将: "口径与发行；公域危机话术、禁语、对外表述",
  反将: "人货养成；Scout → 邀约 → 养成 / A 池",
  火将: "物业安全闸；消防通道、开业条件否决",
  脱将: "商管变现；租户经营、交铺商管、市集动线",
  除将: "钱合同闸；财务合同合规、保单押金、未批不上账",
};

const CATEGORY_CRITERIA: Record<Category, string> = {
  战略定位: "项目定位、赛道、与竞品差异、是否偏离 LOOP PARK 战略",
  货盘业态: "铺位业态、货盘版本、CAD 标注误用、业态冲突",
  招商转化: "招商话术、转化漏斗、邀约与成交条件",
  安全消防物业: "消防、物业、通道、进场装修安全",
  财务合同合规: "合同、保单、押金、账务、合规审批",
  口径舆情: "对外口径、公域投放、禁语、舆情危机",
  建设工期开业: "工期、开业节点、交铺条件齐套",
  活动造场与联赛: "市集、联赛、造场活动与招商标题捆绑风险",
  竞品客流: "竞品动态、客流、高校与周边情报",
  组织协作: "八将协作、职责不清、内部推进阻滞",
};

const LIGHT_CRITERIA: Record<Light, string> = {
  红: "须立即阻断或已触红线闸；不可继续推进",
  黄: "可观察但须限期整改；风险可见仍可控",
  绿: "已闭环或风险可控，可继续",
  灰: "信息不足、尚未定性，需先排查再定灯",
};

const SEVERITY_CRITERIA: Record<Severity, string> = {
  P0: "开业/红线/资金或安全立刻受影响，必须当天处理",
  P1: "本周内会影响招商、口径或开业节奏，需明确责任席跟进",
  P2: "需登记跟踪，短期不阻断主线",
};

export const GATE_CRITERIA: Record<GateId, string> = {
  G1: "不海选招摊、不发现金、不口报死价",
  G2: "不讲未分层带动营业额/ROI，不讲稳赚/保值升值",
  G3: "不抄 CAD「办公」当业态；业态以 V3.0+ 铺位建议为准",
  G4: "不做自营网咖；3#4F 只做娱/造场；体育奥莱不当赛场",
  G5: "不与市集/联赛共标题招商",
  G6: "1F 不招重油正餐；2–3F 排烟井未核前不承诺重油",
  G7: "无保单/无押金条款/开业条件未齐 → 不交铺、不进场装修",
  G8: "4# 不拆零；9#/价外让利/超货盘私允无效（归正将闸）",
  G9: "公域短稿条件红未撤前，只做私域邀约",
};

const CADENCE_CRITERIA: Record<SopCadence, string> = {
  daily: "每日节奏：舆情处理、红灯同步、现场巡查等当天要做的事",
  weekly: "每周一节奏：周报、红线巡检、口径抽检、开业条件进度",
  milestone: "开业里程碑闸口：交铺、保单、消防、货盘锁定等开业硬条件",
  promo: "宣发倒排（活动 T-7）：方案、主视觉、公域宣发与复盘",
  none: "不直接挂到 SOP 节奏清单，只在看板跟踪即可",
};

const SENTIMENT_CRITERIA: Record<SentimentLevel, string> = {
  蓝: "一般：零星负面、无扩散，可自行处理归档",
  黄: "重要：多条负面或小范围讨论，4 小时内上报",
  橙: "紧急：大V/热搜/大群讨论，1 小时内上报并统一口径",
  红: "重大：安全/法律/省级媒体/全网传播，立即上报",
  不适用: "不是舆情/口径事件，或信息不足以分级",
};

const SLA_CRITERIA: Record<ReportSla, string> = {
  立即: "立刻上报负责人/八将，不得拖延",
  "1小时": "一小时内上报并准备统一口径",
  "4小时": "四小时内上报并附建议方案",
  "24小时": "二十四小时内处理并归档即可",
  无需上报: "无需上报，自行处理归档",
};

export type SuggestField<T extends string> = {
  value: T;
  confidence: number;
  probabilities: Record<string, number>;
  apply: boolean;
};

export type GateAdvice = {
  id: GateId;
  title: string;
  probability: number;
  apply: boolean;
};

export type SuggestResult = {
  enabled: boolean;
  model?: string;
  category: SuggestField<Category>;
  severity: SuggestField<Severity>;
  ownerSeat: SuggestField<SeatName>;
  light: SuggestField<Light>;
  needsHumanReview: boolean;
  reviewProbability: number;
};

export type SopAdviseResult = {
  enabled: boolean;
  model?: string;
  cadence: SuggestField<SopCadence>;
  gates: GateAdvice[];
  sentiment: SuggestField<SentimentLevel>;
  reportSla: SuggestField<ReportSla>;
  escalateBajiang: { probability: number; apply: boolean };
  needsHumanReview: boolean;
  reviewProbability: number;
};

export type ReconcileSectionId = "daily" | "weekly" | "milestone" | "promo";

export type ReconcileSectionAdvice = {
  id: ReconcileSectionId;
  coverage: number;
  backlogPressure: number;
  priorityEventIds: string[];
};

export type SopReconcileResult = {
  enabled: boolean;
  model?: string;
  focus: SuggestField<ReconcileSectionId>;
  sections: ReconcileSectionAdvice[];
  needsHumanReview: boolean;
};

function env(name: string) {
  return (process.env[name] ?? "").trim();
}

export function typesafeConfigured() {
  return Boolean(env("TYPESAFE_API_KEY"));
}

function confidenceFloor() {
  const n = Number(env("TYPESAFE_CONFIDENCE_FLOOR") || 0.55);
  return Number.isFinite(n) && n > 0 && n < 1 ? n : 0.55;
}

function reviewFloor() {
  const n = Number(env("TYPESAFE_REVIEW_NOUL") || 0.55);
  return Number.isFinite(n) && n > 0 && n < 1 ? n : 0.55;
}

function gateFloor() {
  const n = Number(env("TYPESAFE_GATE_NOUL") || 0.6);
  return Number.isFinite(n) && n > 0 && n < 1 ? n : 0.6;
}

function client() {
  return new TypeSafeClient({ apiKey: env("TYPESAFE_API_KEY") });
}

function asField<T extends string>(
  answer: ChoiceResponse<Record<string, string | null>>,
  apply: boolean,
): SuggestField<T> {
  return {
    value: answer.choice as T,
    confidence: answer.confidence,
    probabilities: answer.probabilities,
    apply,
  };
}

function eventState(input: {
  title: string;
  description?: string;
  category?: string;
  light?: string;
  ownerSeat?: string;
  severity?: string;
}) {
  return {
    event: {
      title: input.title.trim(),
      description: (input.description ?? "").trim() || "（无补充描述）",
      category: input.category ?? null,
      light: input.light ?? null,
      ownerSeat: input.ownerSeat ?? null,
      severity: input.severity ?? null,
    },
    loop_park: {
      product: "LOOP PARK 事件看板 / 千门八将红线闸运营台",
      seats: SEAT_CRITERIA,
      gates: GATE_CRITERIA,
      sop_cadence: CADENCE_CRITERIA,
      sentiment_sop: "舆情监测/02-分级响应SOP：蓝自行处理；黄 4h 上报；橙 1h + 八将口径；红立即上报+法律",
      red_line_summary:
        "九条红线：不海选招摊不发现金；不讲未分层 ROI/稳赚；不抄 CAD 办公当业态；不做自营网咖；不与市集联赛共标题招商；1F 不招重油；无保单押金开业条件不齐不交铺；4# 不拆零与价外私允无效；公域条件红只做私域。",
    },
  };
}

function gateQuestions() {
  const questions: Record<string, ReturnType<typeof noul>> = {};
  for (const id of GATE_IDS) {
    questions[`gate_${id}`] = noul(
      {
        question: `该事件是否应挂接红线闸 \`${id}\`（${GATE_CRITERIA[id]}）？`,
        note: "挂接表示本卡要盯这条闸；证据不足但高度相关也可为是。",
      },
      {
        true: `事件内容触及或可能违反 ${id}`,
        false: `与 ${id} 无明显关系`,
      },
    );
  }
  return questions;
}

export async function suggestEventFields(input: {
  title: string;
  description?: string;
}): Promise<SuggestResult> {
  const title = input.title.trim();
  if (!title) throw new Error("title required");
  if (!typesafeConfigured()) throw new Error("TYPESAFE_API_KEY not configured");

  const floor = confidenceFloor();
  const reviewCut = reviewFloor();
  const response = await client().systemOne({
    model: "jev-latest",
    state: eventState(input),
    questions: {
      category: choice(
        {
          question: "根据 `event.title` 与 `event.description`，该事件最贴近哪一类运营风险？",
        },
        CATEGORY_CRITERIA,
      ),
      severity: choice(
        {
          question: "按对开业、红线与招商节奏的冲击，该事件优先等级应是？",
        },
        SEVERITY_CRITERIA,
      ),
      ownerSeat: choice(
        {
          question: "按 `loop_park.seats` 职责，该事件应由哪一席主责跟进？",
        },
        SEAT_CRITERIA,
      ),
      light: choice(
        {
          question: "按灯性分级，该事件当前应挂哪盏灯？",
          note: "参考 `loop_park.red_line_summary`；信息不足选灰。",
        },
        LIGHT_CRITERIA,
      ),
      needs_human_review: noul(
        {
          question: "是否应先由人核对再自动写入字段？",
        },
        {
          true: "描述模糊、可能触红线但证据不足，或主责席不明显，应人工确认",
          false: "标题与描述足够清楚，建议可直接预填供人一键采用",
        },
      ),
    },
  });

  const { answers } = response;
  const needsHumanReview = answers.needs_human_review.noul >= reviewCut;

  return {
    enabled: true,
    model: response.model,
    category: asField<Category>(answers.category, answers.category.confidence >= floor && !needsHumanReview),
    severity: asField<Severity>(answers.severity, answers.severity.confidence >= floor && !needsHumanReview),
    ownerSeat: asField<SeatName>(
      answers.ownerSeat,
      answers.ownerSeat.confidence >= floor && !needsHumanReview,
    ),
    light: asField<Light>(answers.light, answers.light.confidence >= floor && !needsHumanReview),
    needsHumanReview,
    reviewProbability: answers.needs_human_review.noul,
  };
}

export async function adviseEventSop(input: {
  title: string;
  description?: string;
  category?: string;
  light?: string;
  ownerSeat?: string;
  severity?: string;
}): Promise<SopAdviseResult> {
  const title = input.title.trim();
  if (!title) throw new Error("title required");
  if (!typesafeConfigured()) throw new Error("TYPESAFE_API_KEY not configured");

  const floor = confidenceFloor();
  const reviewCut = reviewFloor();
  const gFloor = gateFloor();

  const response = await client().systemOne({
    model: "jev-latest",
    state: eventState(input),
    questions: {
      cadence: choice(
        {
          question: "该事件最应挂到哪一段 SOP 节奏？",
          note: "对照 `loop_park.sop_cadence`；不确定选 none。",
        },
        CADENCE_CRITERIA,
      ),
      sentiment: choice(
        {
          question: "若涉及舆情/口径，按 `loop_park.sentiment_sop` 应定哪一级？",
          note: "非舆情事件选「不适用」。",
        },
        SENTIMENT_CRITERIA,
      ),
      report_sla: choice(
        {
          question: "按分级响应，上报时限应是？",
          note: "非舆情或蓝色可选无需上报/24小时。",
        },
        SLA_CRITERIA,
      ),
      escalate_bajiang: noul(
        {
          question: "是否需要八将议事或统一口径后再对外？",
        },
        {
          true: "橙色以上舆情、重大危机、法律安全或跨席拍板",
          false: "单席可推进或仅需日常同步",
        },
      ),
      needs_human_review: noul(
        {
          question: "闸口挂接与 SOP 归属是否应先由人核对？",
        },
        {
          true: "证据不足、多闸可能相关、或分级临界",
          false: "关联清晰，可预填挂接供人确认",
        },
      ),
      ...gateQuestions(),
    },
  });

  const { answers } = response;
  const needsHumanReview = answers.needs_human_review.noul >= reviewCut;
  const answerMap = answers as Record<string, { noul?: number }>;
  const gates: GateAdvice[] = GATE_IDS.map((id) => {
    const probability = Number(answerMap[`gate_${id}`]?.noul ?? 0);
    return {
      id,
      title: GATE_CRITERIA[id],
      probability,
      apply: probability >= gFloor && !needsHumanReview,
    };
  }).sort((a, b) => b.probability - a.probability);

  return {
    enabled: true,
    model: response.model,
    cadence: asField<SopCadence>(answers.cadence, answers.cadence.confidence >= floor && !needsHumanReview),
    gates,
    sentiment: asField<SentimentLevel>(
      answers.sentiment,
      answers.sentiment.confidence >= floor && answers.sentiment.choice !== "不适用",
    ),
    reportSla: asField<ReportSla>(
      answers.report_sla,
      answers.report_sla.confidence >= floor && answers.report_sla.choice !== "无需上报",
    ),
    escalateBajiang: {
      probability: answers.escalate_bajiang.noul,
      apply: answers.escalate_bajiang.noul >= reviewCut,
    },
    needsHumanReview,
    reviewProbability: answers.needs_human_review.noul,
  };
}

export async function reconcileSopBoard(input: {
  events: Array<{
    id: string;
    title: string;
    category?: string;
    light?: string;
    severity?: string;
    ownerSeat?: string;
    status?: string;
  }>;
}): Promise<SopReconcileResult> {
  if (!typesafeConfigured()) throw new Error("TYPESAFE_API_KEY not configured");
  const events = input.events.slice(0, 24);
  if (events.length === 0) {
    return {
      enabled: true,
      focus: {
        value: "weekly",
        confidence: 1,
        probabilities: { weekly: 1 },
        apply: false,
      },
      sections: [
        { id: "daily", coverage: 1, backlogPressure: 0, priorityEventIds: [] },
        { id: "weekly", coverage: 1, backlogPressure: 0, priorityEventIds: [] },
        { id: "milestone", coverage: 1, backlogPressure: 0, priorityEventIds: [] },
        { id: "promo", coverage: 1, backlogPressure: 0, priorityEventIds: [] },
      ],
      needsHumanReview: false,
    };
  }

  const floor = confidenceFloor();
  const ids = events.map((e) => e.id);

  const idCriteria: Record<string, string> = {};
  for (const e of events) {
    idCriteria[e.id] = `${e.light ?? "?"} · ${e.category ?? "?"} · ${e.title}`;
  }
  idCriteria.none = "没有需要优先点名的单条事件";

  const response = await client().systemOne({
    model: "jev-latest",
    state: {
      open_events: events,
      event_ids: ids,
      sop_sections: {
        daily: "每日：舆情黄以上上报、红灯同步席位、现场通道/动火巡查",
        weekly: "每周一：周报、红线九条巡检、口径抽检、开业条件进度、舆情计数",
        milestone: "开业里程碑：交铺三件套、保单、消防、货盘锁定、收款账户等",
        promo: "宣发倒排 T-7：方案/主视觉/公域条件灯/复盘",
      },
    },
    questions: {
      focus: choice(
        {
          question: "本周 SOP 节奏应优先盯哪一段？",
          note: "看 `open_events` 的灯性、分类与标题。",
        },
        {
          daily: "当日必须处理的舆情/红灯/现场安全",
          weekly: "周度巡检与汇报缺口最大",
          milestone: "开业硬闸与交铺条件压力最大",
          promo: "活动宣发倒排压力最大",
        },
      ),
      daily_coverage: noul("对照 `sop_sections.daily`，当前开放事件是否已被日节奏覆盖？", {
        true: "日节奏清单能覆盖这些开放项",
        false: "有开放项落在日节奏外或清单未盯到",
      }),
      weekly_coverage: noul("对照 `sop_sections.weekly`，当前开放事件是否已被周节奏覆盖？", {
        true: "周节奏清单能覆盖",
        false: "周节奏有明显缺口",
      }),
      milestone_coverage: noul("对照 `sop_sections.milestone`，开业里程碑是否被盯住？", {
        true: "里程碑相关开放项已挂上",
        false: "开业硬闸相关开放项对账不足",
      }),
      promo_coverage: noul("对照 `sop_sections.promo`，宣发倒排是否被盯住？", {
        true: "宣发相关开放项已覆盖",
        false: "宣发倒排有缺口",
      }),
      daily_pressure: noul("日节奏积压是否偏高（红灯/舆情黄以上未闭环）？", {
        true: "当日积压高，需立刻清",
        false: "日节奏压力可控",
      }),
      weekly_pressure: noul("周节奏积压是否偏高？", {
        true: "周巡检/周报压力高",
        false: "周节奏压力可控",
      }),
      milestone_pressure: noul("开业里程碑积压是否偏高？", {
        true: "交铺/保单/消防等硬闸积压高",
        false: "里程碑压力可控",
      }),
      promo_pressure: noul("宣发倒排积压是否偏高？", {
        true: "活动宣发窗口紧张",
        false: "宣发压力可控",
      }),
      daily_top: choice({ question: "日节奏应优先点名哪条开放事件？" }, idCriteria),
      weekly_top: choice({ question: "周节奏应优先点名哪条开放事件？" }, idCriteria),
      milestone_top: choice({ question: "开业里程碑应优先点名哪条开放事件？" }, idCriteria),
      promo_top: choice({ question: "宣发倒排应优先点名哪条开放事件？" }, idCriteria),
      needs_human_review: noul("这份对账是否应先由人扫一眼再执行？", {
        true: "开放事件含糊或多段同时高压",
        false: "焦点清晰，可按建议推进",
      }),
    },
  });

  const { answers } = response;
  const needsHumanReview = answers.needs_human_review.noul >= reviewFloor();

  const topOf = (key: "daily_top" | "weekly_top" | "milestone_top" | "promo_top") => {
    const v = answers[key].choice;
    return v && v !== "none" ? [v] : [];
  };

  return {
    enabled: true,
    model: response.model,
    focus: asField<ReconcileSectionId>(
      answers.focus,
      answers.focus.confidence >= floor && !needsHumanReview,
    ),
    sections: [
      {
        id: "daily",
        coverage: answers.daily_coverage.noul,
        backlogPressure: answers.daily_pressure.noul,
        priorityEventIds: topOf("daily_top"),
      },
      {
        id: "weekly",
        coverage: answers.weekly_coverage.noul,
        backlogPressure: answers.weekly_pressure.noul,
        priorityEventIds: topOf("weekly_top"),
      },
      {
        id: "milestone",
        coverage: answers.milestone_coverage.noul,
        backlogPressure: answers.milestone_pressure.noul,
        priorityEventIds: topOf("milestone_top"),
      },
      {
        id: "promo",
        coverage: answers.promo_coverage.noul,
        backlogPressure: answers.promo_pressure.noul,
        priorityEventIds: topOf("promo_top"),
      },
    ],
    needsHumanReview,
  };
}
