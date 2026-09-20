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
import { OWNER_SEATS, SEAT_SWATCH, seatBand } from "@/lib/constants";
import { COLUMNS, COLUMN_META } from "@/lib/types";
import type { ColumnId, OwnerSeat, Risk } from "@/lib/types";
import { useRiskStore } from "@/lib/store";
import { SeatSwatch } from "./Badges";
import { RiskCard, SortableRiskCard } from "./RiskCard";
import { NewRiskButton } from "./NewRiskModal";
import { cn } from "@/lib/utils";

type BoardColumn = {
  id: string;
  label: string;
  items: Risk[];
  showAdd?: boolean;
  seat?: OwnerSeat;
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
        seat,
        items: filtered.filter((risk) => risk.ownerSeat === seat),
        showAdd: seat === mySeat,
      }));
    }
    return COLUMNS.map((id) => ({
      id,
      label: COLUMN_META[id].label,
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
      <div className={`grid gap-0 border border-line ${boardView === "seat" ? "grid-cols-8" : "grid-cols-5"}`}>
        {Array.from({ length: boardView === "seat" ? 8 : 5 }).map((_, i) => (
          <div key={i} className="h-[70vh] animate-pulse bg-surface" />
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
      <div className="kanban-scroll flex min-h-[calc(100vh-176px)] overflow-x-auto border border-line">
        {columns.map((column, index) => (
          <Column key={column.id} column={column} first={index === 0} />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {active ? <RiskCard risk={active} overlay hideOwner={boardView === "seat"} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({ column, first }: { column: BoardColumn; first: boolean }) {
  const { boardView } = useRiskStore();
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", column: column.id },
  });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex w-[196px] shrink-0 flex-col bg-bg xl:min-w-0 xl:flex-1",
        !first ? "border-l border-line" : "",
        isOver ? "bg-surface" : "",
      )}
    >
      <header
        className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5"
        style={
          column.seat
            ? {
                background: seatBand(column.seat),
                borderLeft: `5px solid ${SEAT_SWATCH[column.seat]}`,
              }
            : undefined
        }
      >
        <h2
          className={cn(
            "flex items-center gap-2 leading-none text-ink",
            column.seat ? "text-[19px] font-medium" : "text-[14px] font-medium",
          )}
        >
          {column.seat ? <SeatSwatch seat={column.seat} size="md" /> : null}
          {column.label}
        </h2>
        <span className="font-mono text-[12px] text-mute">{column.items.length}</span>
      </header>
      <SortableContext items={column.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
          {column.items.map((item) => (
            <SortableRiskCard key={item.id} risk={item} hideOwner={boardView === "seat"} />
          ))}
          {column.items.length === 0 ? (
            <div className="flex flex-1 items-center justify-center px-2 py-10 text-center text-[12px] text-mute">
              {boardView === "seat" ? "拖入改主责席" : "空列"}
            </div>
          ) : null}
        </div>
      </SortableContext>
      {column.showAdd ? (
        <div className="border-t border-line p-2">
          <NewRiskButton />
        </div>
      ) : null}
    </section>
  );
}
