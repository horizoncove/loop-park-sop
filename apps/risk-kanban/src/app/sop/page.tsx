"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const SOP_KEY = "loop-park-sop-checks-v1";
const EMPTY = "{}";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("loop-sop-checks", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("loop-sop-checks", callback);
  };
}

function getSnapshot() {
  try {
    return localStorage.getItem(SOP_KEY) ?? EMPTY;
  } catch {
    return EMPTY;
  }
}

function getServerSnapshot() {
  return EMPTY;
}

const SECTIONS = [
  {
    id: "daily",
    title: "每日",
    source: "工作SOP / 舆情监测",
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

type Checks = Record<string, boolean>;

function itemKey(sectionId: string, index: number) {
  return `${sectionId}-${index}`;
}

export default function SopPage() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const checks = useMemo(() => {
    try {
      return JSON.parse(raw) as Checks;
    } catch {
      return {} as Checks;
    }
  }, [raw]);

  const toggle = useCallback(
    (key: string) => {
      const next = { ...checks, [key]: !checks[key] };
      localStorage.setItem(SOP_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("loop-sop-checks"));
    },
    [checks],
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-6">
      <h1 className="text-[16px] font-medium">SOP 节奏清单</h1>
      <p className="mt-2 text-[13px] text-mute">
        静态周节奏与开业里程碑，勾选保存在本机。正文仍以仓库里的
        <code className="mx-1 border border-line bg-surface px-1 text-[12px]">工作SOP/</code>
        与
        <code className="mx-1 border border-line bg-surface px-1 text-[12px]">舆情监测/</code>
        为准。
      </p>

      <div className="mt-8 space-y-0 border border-line bg-surface">
        {SECTIONS.map((section, index) => {
          const done = section.items.filter((_, i) => checks[itemKey(section.id, i)]).length;
          return (
            <section key={section.id} className={cn("p-5", index > 0 ? "border-t border-line" : "")}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-[16px] font-medium">{section.title}</h2>
                <span className="font-mono text-[12px] text-mute">
                  {done}/{section.items.length}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-mute">来源：{section.source}</p>
              <ul className="mt-4 space-y-1">
                {section.items.map((item, itemIndex) => {
                  const key = itemKey(section.id, itemIndex);
                  const on = Boolean(checks[key]);
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => toggle(key)}
                        className={cn(
                          "flex w-full items-start gap-3 px-0 py-2 text-left text-[14px]",
                          on ? "text-mute" : "text-ink",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border",
                            on ? "border-signal-green bg-signal-green text-bg" : "border-line",
                          )}
                        >
                          {on ? <Check className="h-3 w-3" /> : null}
                        </span>
                        <span className={on ? "line-through" : ""}>{item}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
