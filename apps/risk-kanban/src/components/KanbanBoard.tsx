"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { COLUMNS, COLUMN_META } from "@/lib/types";
import type { ColumnId, Risk } from "@/lib/types";
import { useRiskStore } from "@/lib/store";
import { RiskCard, SortableRiskCard } from "./RiskCard";
import { NewRiskButton } from "./NewRiskModal";

const COLUMN_ACCENT: Record<ColumnId, string> = {
  todo: "from-stone-500/30",
  investigating: "from-blue-400/30",
  watch: "from-amber-400/40",
  blocked: "from-red-500/40",
  closed: "from-emerald-400/30",
};

export function KanbanBoard() {
  const { filtered, ready, moveRisk } = useRiskStore();
  const [active, setActive] = useState<Risk | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const grouped = useMemo(() => {
    const map = Object.fromEntries(COLUMNS.map((id) => [id, [] as Risk[]])) as Record<
      ColumnId,
      Risk[]
    >;
    for (const risk of filtered) {
      map[risk.status].push(risk);
    }
    return map;
  }, [filtered]);

  const handleDragStart = (event: DragStartEvent) => {
    const risk = filtered.find((item) => item.id === String(event.active.id));
    setActive(risk ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActive(null);
    const { active: drag, over } = event;
    if (!over) return;
    const overId = String(over.id);
    const overData = over.data.current as { type?: string; column?: ColumnId; risk?: Risk } | undefined;
    let nextColumn: ColumnId | undefined;
    let beforeId: string | null = null;
    if (overData?.type === "column" && overData.column) {
      nextColumn = overData.column;
    } else if (overData?.type === "card" && overData.risk) {
      nextColumn = overData.risk.status;
      beforeId = overData.risk.id === String(drag.id) ? null : overData.risk.id;
    } else if (COLUMNS.includes(overId as ColumnId)) {
      nextColumn = overId as ColumnId;
    }
    if (!nextColumn) return;
    void moveRisk(String(drag.id), nextColumn, beforeId);
  };

  if (!ready) {
    return (
      <div className="grid grid-cols-5 gap-3">
        {COLUMNS.map((id) => (
          <div key={id} className="h-[70vh] animate-pulse rounded-2xl bg-panel" />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActive(null)}
    >
      <div className="kanban-scroll flex min-h-[calc(100vh-220px)] gap-3 overflow-x-auto pb-6">
        {COLUMNS.map((column) => (
          <Column key={column} id={column} items={grouped[column]} />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {active ? <RiskCard risk={active} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({ id, items }: { id: ColumnId; items: Risk[] }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: "column", column: id },
  });
  const meta = COLUMN_META[id];

  return (
    <section className="flex w-[280px] shrink-0 flex-col rounded-2xl border border-line bg-panel/80 lg:min-w-0 lg:flex-1">
      <header className={`rounded-t-2xl bg-gradient-to-r ${COLUMN_ACCENT[id]} to-transparent px-3 py-3`}>
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">{meta.label}</h2>
          <span className="font-mono text-xs text-mute">{items.length}</span>
        </div>
        <p className="text-[11px] text-mute">{meta.hint}</p>
      </header>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex flex-1 flex-col gap-2 overflow-y-auto p-2 ${isOver ? "bg-gold/5" : ""}`}
        >
          {items.map((item) => (
            <SortableRiskCard key={item.id} risk={item} />
          ))}
          {items.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-line px-3 py-10 text-center text-xs text-mute">
              拖入卡片，或保持空列
            </div>
          ) : null}
        </div>
      </SortableContext>
      {id === "todo" ? (
        <div className="p-2 pt-0">
          <NewRiskButton />
        </div>
      ) : null}
    </section>
  );
}
