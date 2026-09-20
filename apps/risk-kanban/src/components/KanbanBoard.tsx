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
import {
  LIGHT_META,
  LIGHT_SWATCH,
  OWNER_SEATS,
  SEAT_SWATCH,
  lightBand,
  seatBand,
} from "@/lib/constants";
import { COLUMNS, COLUMN_META, LIGHTS } from "@/lib/types";
import type { ColumnId, Light, OwnerSeat, Risk } from "@/lib/types";
import { useRiskStore } from "@/lib/store";
import { cn, isLight } from "@/lib/utils";
import { SeatSwatch } from "./Badges";
import { RiskCard, SortableRiskCard } from "./RiskCard";
import { NewRiskButton } from "./NewRiskModal";

type BoardColumn = {
  id: string;
  label: string;
  hint?: string;
  items: Risk[];
  showAdd?: boolean;
  seat?: OwnerSeat;
  light?: Light;
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
  const { filtered, ready, moveRisk, moveRiskSeat, moveRiskLight, boardView, mySeat } = useRiskStore();
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
    if (boardView === "status") {
      return COLUMNS.map((id) => ({
        id,
        label: COLUMN_META[id].label,
        items: filtered.filter((risk) => risk.status === id),
        showAdd: id === "todo",
      }));
    }
    return LIGHTS.map((light) => ({
      id: `light:${light}`,
      label: LIGHT_META[light].label,
      hint: LIGHT_META[light].hint,
      light,
      items: filtered.filter((risk) => risk.light === light),
      showAdd: true,
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
        boardView === "seat"
          ? `seat:${overData.risk.ownerSeat}`
          : boardView === "light"
            ? `light:${overData.risk.light}`
            : overData.risk.status;
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
    if (boardView === "light") {
      const light = target.replace(/^light:/, "") as Light;
      if (!isLight(light)) return;
      if (light === dragged.light && !beforeId) return;
      void moveRiskLight(String(drag.id), light, beforeId);
      return;
    }
    if (!COLUMNS.includes(target as ColumnId)) return;
    if (target === dragged.status && !beforeId) return;
    void moveRisk(String(drag.id), target as ColumnId, beforeId);
  };

  const skeletonCount = boardView === "seat" ? 8 : boardView === "light" ? 4 : 5;

  if (!ready) {
    return (
      <div
        className={`grid gap-0 border border-line ${
          boardView === "seat" ? "grid-cols-8" : boardView === "light" ? "grid-cols-4" : "grid-cols-5"
        }`}
      >
        {Array.from({ length: skeletonCount }).map((_, i) => (
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

  const headerStyle = column.seat
    ? { background: seatBand(column.seat), borderLeft: `5px solid ${SEAT_SWATCH[column.seat]}` }
    : column.light
      ? { background: lightBand(column.light), borderLeft: `5px solid ${LIGHT_SWATCH[column.light]}` }
      : undefined;

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex w-[220px] shrink-0 flex-col bg-bg xl:min-w-0 xl:flex-1",
        !first ? "border-l border-line" : "",
        isOver ? "bg-surface" : "",
      )}
    >
      <header className="border-b border-line px-3 py-2.5" style={headerStyle}>
        <div className="flex items-center justify-between gap-2">
          <h2
            className={cn(
              "flex items-center gap-2 leading-none text-ink",
              column.seat || column.light ? "text-[19px] font-medium" : "text-[14px] font-medium",
            )}
          >
            {column.seat ? <SeatSwatch seat={column.seat} size="md" /> : null}
            {column.light ? (
              <span
                className="inline-block h-3.5 w-3.5 shrink-0"
                style={{ background: LIGHT_SWATCH[column.light] }}
                aria-hidden
              />
            ) : null}
            {column.label}
          </h2>
          <span className="font-mono text-[12px] text-mute">{column.items.length}</span>
        </div>
        {column.hint ? <p className="mt-1.5 text-[12px] text-mute">{column.hint}</p> : null}
      </header>
      <SortableContext items={column.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
          {column.items.map((item) => (
            <SortableRiskCard key={item.id} risk={item} hideOwner={boardView === "seat"} />
          ))}
          {column.items.length === 0 ? (
            <div className="flex flex-1 items-center justify-center px-2 py-10 text-center text-[12px] text-mute">
              {boardView === "seat"
                ? "拖入改主责席"
                : boardView === "light"
                  ? "拖入改灯性"
                  : "空列"}
            </div>
          ) : null}
        </div>
      </SortableContext>
      {column.showAdd ? (
        <div className="border-t border-line p-2">
          <NewRiskButton defaultLight={column.light} />
        </div>
      ) : null}
    </section>
  );
}
