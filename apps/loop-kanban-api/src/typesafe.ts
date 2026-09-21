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

export type Category = (typeof CATEGORIES)[number];
export type Severity = (typeof SEVERITIES)[number];
export type Light = (typeof LIGHTS)[number];

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

export type SuggestField<T extends string> = {
  value: T;
  confidence: number;
  probabilities: Record<string, number>;
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

export async function suggestEventFields(input: {
  title: string;
  description?: string;
}): Promise<SuggestResult> {
  const title = input.title.trim();
  if (!title) throw new Error("title required");
  if (!typesafeConfigured()) {
    throw new Error("TYPESAFE_API_KEY not configured");
  }

  const client = new TypeSafeClient({ apiKey: env("TYPESAFE_API_KEY") });
  const floor = confidenceFloor();
  const reviewCut = reviewFloor();

  const response = await client.systemOne({
    model: "jev-latest",
    state: {
      event: {
        title,
        description: (input.description ?? "").trim() || "（无补充描述）",
      },
      loop_park: {
        product: "LOOP PARK 事件看板",
        seats: SEAT_CRITERIA,
        red_line_summary:
          "九条红线含：不海选招摊不发现金；不讲未分层 ROI/稳赚；不抄 CAD 办公当业态；不做自营网咖；不与市集联赛共标题招商；1F 不招重油；无保单押金开业条件不齐不交铺；4# 不拆零与价外私允无效；公域条件红只做私域。",
      },
    },
    questions: {
      category: choice(
        {
          question: "根据 `event.title` 与 `event.description`，该事件最贴近哪一类运营风险？",
          context: "选项覆盖 LOOP PARK 千门八将运营台常用分类。",
        },
        CATEGORY_CRITERIA,
      ),
      severity: choice(
        {
          question: "按对开业、红线与招商节奏的冲击，该事件优先等级应是？",
          note: "P0 当天必处理；P1 本周跟进；P2 登记即可。",
        },
        SEVERITY_CRITERIA,
      ),
      ownerSeat: choice(
        {
          question: "按 `loop_park.seats` 职责，该事件应由哪一席主责跟进？",
          note: "只选一个主责席；协作席可之后再补。",
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
          reasons: "标题含糊、多席可能主责、或可能触红线但证据不足。",
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
    category: asField<Category>(
      answers.category,
      answers.category.confidence >= floor && !needsHumanReview,
    ),
    severity: asField<Severity>(
      answers.severity,
      answers.severity.confidence >= floor && !needsHumanReview,
    ),
    ownerSeat: asField<SeatName>(
      answers.ownerSeat,
      answers.ownerSeat.confidence >= floor && !needsHumanReview,
    ),
    light: asField<Light>(
      answers.light,
      answers.light.confidence >= floor && !needsHumanReview,
    ),
    needsHumanReview,
    reviewProbability: answers.needs_human_review.noul,
  };
}
