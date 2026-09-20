"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { OWNER_SEATS, SEAT_COLUMN_ACCENT, SEAT_META } from "@/lib/constants";
import { COLUMNS, COLUMN_META } from "@/lib/types";
import type { ColumnId, OwnerSeat, Risk } from "@/lib/types";
import { useRiskStore } from "@/lib/store";
import { RiskCard, SortableRiskCard } from "./RiskCard";
import { NewRiskButton } from "./NewRiskModal";

const STATUS_ACCENT: Record<ColumnId, string> = {
  todo: "from-stone-500/30",
  investigating: "from-blue-400/30",
  watch: "from-amber-400/40",
  blocked: "from-red-500/40",
  closed: "from-emerald-400/30",
};

type BoardColumn = {
  id: string;
  label: string;
  hint: string;
  accent: string;
  items: Risk[];
  showAdd?: boolean;
};

const collisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  const containerById = (id: string | number) =>
    args.droppableContainers.find((container) => container.id === id);
  const typed = (type: string) =>
    pointerHits.find((hit) => containerById(hit.id)?.data.current?.type === type);
  const cardHit = typed("card");
  if (cardHit) return [cardHit];
  const columnHit = typed("column");
  if (columnHit) return [columnHit];
  if (pointerHits.length > 0) return pointerHits;
  return closestCorners(args);
};

export function KanbanBoard() {
  const { filtered, ready, moveRisk, moveRiskSeat, boardView, mySeat } = useRiskStore();
  const [active, setActive] = useState<Risk | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const columns = useMemo<BoardColumn[]>(() => {
    if (boardView === "seat") {
      return OWNER_SEATS.map((seat) => ({
        id: `seat:${seat}`,
        label: seat,
        hint: SEAT_META[seat].duty,
        accent: SEAT_COLUMN_ACCENT[seat],
        items: filtered.filter((risk) => risk.ownerSeat === seat),
        showAdd: seat === mySeat,
      }));
    }
    return COLUMNS.map((id) => ({
      id,
      label: COLUMN_META[id].label,
      hint: COLUMN_META[id].hint,
      accent: STATUS_ACCENT[id],
      items: filtered.filter((risk) => risk.status === id),
      showAdd: id === "todo",
    }));
  }, [boardView, filtered, mySeat]);

  const handleDragStart = (event: DragStartEvent) => {
    const risk = filtered.find((item) => item.id === String(event.active.id));
    setActive(risk ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActive(null);
    const { active: drag, over } = event;
    if (!over) return;
    const overId = String(over.id);
    const overData = over.data.current as
      | { type?: string; column?: string; risk?: Risk }
      | undefined;
    let target = overData?.type === "column" ? overData.column : undefined;
    let beforeId: string | null = null;
    if (overData?.type === "card" && overData.risk) {
      target =
        boardView === "seat" ? `seat:${overData.risk.ownerSeat}` : overData.risk.status;
      beforeId = overData.risk.id === String(drag.id) ? null : overData.risk.id;
    } else if (!target) {
      target = overId;
    }
    const dragged = filtered.find((item) => item.id === String(drag.id));
    if (!target || !dragged) return;

    if (boardView === "seat") {
      const seat = target.replace(/^seat:/, "") as OwnerSeat;
      if (!OWNER_SEATS.includes(seat)) return;
      if (seat === dragged.ownerSeat && !beforeId) return;
      void moveRiskSeat(String(drag.id), seat, beforeId);
      return;
    }
    if (!COLUMNS.includes(target as ColumnId)) return;
    if (target === dragged.status && !beforeId) return;
    void moveRisk(String(drag.id), target as ColumnId, beforeId);
  };

  if (!ready) {
    return (
      <div className="grid grid-cols-6 gap-3">
        {Array.from({ length: boardView === "seat" ? 6 : 5 }).map((_, i) => (
          <div key={i} className="h-[70vh] animate-pulse rounded-2xl bg-panel" />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActive(null)}
    >
      <div className="kanban-scroll flex min-h-[calc(100vh-260px)] gap-3 overflow-x-auto pb-6">
        {columns.map((column) => (
          <Column key={column.id} column={column} />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {active ? <RiskCard risk={active} overlay hideOwner={boardView === "seat"} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({ column }: { column: BoardColumn }) {
  const { boardView } = useRiskStore();
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", column: column.id },
  });

  return (
    <section
      ref={setNodeRef}
      className={`flex w-[260px] shrink-0 flex-col rounded-2xl border border-line bg-panel/80 lg:min-w-0 lg:flex-1 ${
        isOver ? "ring-1 ring-gold/40" : ""
      }`}
    >
      <header className={`rounded-t-2xl bg-gradient-to-r ${column.accent} to-transparent px-3 py-3`}>
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">{column.label}</h2>
          <span className="font-mono text-xs text-mute">{column.items.length}</span>
        </div>
        <p className="text-[11px] text-mute">{column.hint}</p>
      </header>
      <SortableContext items={column.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
          {column.items.map((item) => (
            <SortableRiskCard key={item.id} risk={item} hideOwner={boardView === "seat"} />
          ))}
          {column.items.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-line px-3 py-10 text-center text-xs text-mute">
              {boardView === "seat" ? "拖入改主责席" : "拖入卡片，或保持空列"}
            </div>
          ) : null}
        </div>
      </SortableContext>
      {column.showAdd ? (
        <div className="p-2 pt-0">
          <NewRiskButton />
        </div>
      ) : null}
    </section>
  );
}
