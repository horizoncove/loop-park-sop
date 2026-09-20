#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const seed = JSON.parse(readFileSync(path.join(root, "data/seed.json"), "utf8"));
const risks = seed.risks ?? [];

const STATUS = {
  todo: "待排查",
  investigating: "排查中",
  watch: "黄灯观察",
  blocked: "红灯阻断",
  closed: "已关闭/绿",
};

function sqlStr(value) {
  return `'${String(value ?? "").replace(/'/g, "''")}'`;
}

function sqlTs(value) {
  return `${sqlStr(value)}::timestamptz`;
}

function sqlJsonb(value) {
  return `${sqlStr(JSON.stringify(value ?? []))}::jsonb`;
}

const values = risks.map((risk, index) => {
  const status = STATUS[risk.status] ?? risk.status ?? "待排查";
  return `(
    ${sqlStr(risk.id)},
    ${sqlStr(risk.title)},
    ${sqlStr(risk.description)},
    ${sqlStr(risk.category)},
    ${sqlStr(risk.severity)},
    ${sqlStr(risk.light)},
    ${sqlStr(status)},
    ${sqlStr(risk.ownerSeat)},
    ${sqlJsonb(risk.collabSeats)},
    ${sqlStr(JSON.stringify(risk.triggers ?? []))},
    ${sqlStr(risk.residualRisk)},
    ${sqlJsonb(risk.redLineGates)},
    ${sqlStr(JSON.stringify(risk.notes ?? []))},
    ${sqlTs(risk.updatedAt)},
    ${sqlTs(risk.updatedAt)},
    ${index}
  )`;
});

const sql = `-- Generated from apps/loop-kanban-api/data/seed.json
-- ${risks.length} events

INSERT INTO events (
  id, title, description, category, severity, light, status, owner_seat,
  collab_seats, triggers, residual_risk, red_line_gates, notes,
  updated_at, created_at, sort_order
) VALUES
${values.join(",\n")}
ON CONFLICT (id) DO NOTHING;
`;

const out = path.resolve(root, "../../deploy/loop-kanban/seed.sql");
writeFileSync(out, sql);
console.log(`wrote ${out} (${risks.length} rows)`);
