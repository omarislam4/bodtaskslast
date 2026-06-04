import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksService } from "@/services/tasks";
import { toast } from "sonner";
import type { Task, TaskStatus } from "@/types";
import { UserDoc } from "@/contexts/AuthContext";
import { TaskCard } from "./TaskCard";
import { useLang } from "@/contexts/LangContext";

// ─── Draggable Task Card ───────────────────────────────────────────────────────

interface DraggableTaskCardProps {
  task: Task;
  members: UserDoc[];
  index: number;
  onClick: () => void;
}

function DraggableTaskCard({
  task,
  members,
  index,
  onClick,
}: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TaskCard task={task} members={members} index={index} onClick={onClick} />
    </div>
  );
}

// ─── Droppable Column ─────────────────────────────────────────────────────────

interface DroppableColumnProps {
  col: { id: TaskStatus; label: string; color: string };
  colTasks: Task[];
  members: UserDoc[];
  isOver: boolean;
  onNavigate: (task: Task) => void;
}

function DroppableColumn({
  col,
  colTasks,
  members,
  isOver,
  onNavigate,
}: DroppableColumnProps) {
  const { t } = useLang();
  const { setNodeRef } = useDroppable({ id: col.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col shrink-0 w-72 rounded-2xl border shadow-sm transition-colors ${
        isOver ? "bg-primary/10 border-primary/40" : "bg-muted/40 border-border"
      }`}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <div className={`w-2 h-2 rounded-full ${col.color}`} />
        <span className="text-xs font-semibold text-foreground">
          {col.label}
        </span>
        <span className="ml-auto text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-medium">
          {colTasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] overflow-hidden">
        {colTasks.length === 0 ? (
          <div
            className={`flex items-center justify-center h-24 rounded-xl border-2 border-dashed transition-colors ${
              isOver ? "border-primary/50 bg-primary/5" : "border-border"
            }`}
          >
            <p className="text-xs text-muted-foreground">
              {isOver ? t.dropHere : t.noTasks}
            </p>
          </div>
        ) : (
          colTasks.map((task, i) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              members={members}
              index={i}
              onClick={() => onNavigate(task)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Kanban Board ─────────────────────────────────────────────────────────────

interface KanbanBoardProps {
  tasks: Task[];
  members: UserDoc[];
  spaceId?: string;
}

export function KanbanBoard({ tasks, members, spaceId }: KanbanBoardProps) {
  const [, navigate] = useLocation();
  const { t } = useLang();
  const qc = useQueryClient();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overId, setOverId] = useState<TaskStatus | null>(null);
  const [optimistic, setOptimistic] = useState<Record<string, TaskStatus>>({});

  const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
    { id: "todo", label: t.todo, color: "bg-slate-400" },
    { id: "in-progress", label: t.inProgress, color: "bg-blue-500" },
    { id: "review", label: t.review, color: "bg-amber-500" },
    { id: "done", label: t.done, color: "bg-emerald-500" },
    { id: "blocked", label: t.blocked, color: "bg-red-500" },
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      tasksService.update(id, { status }),
    onSuccess: (task) => {
      qc.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (old) =>
        old?.map((t) => (t.id === task.id ? task : t)),
      );
      setOptimistic((prev) => {
        const next = { ...prev };
        delete next[task.id];
        return next;
      });
      // Background sync — cache is already correct so this causes no flicker.
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
    },
    onError: (_err, vars) => {
      setOptimistic((prev) => {
        const next = { ...prev };
        delete next[vars.id];
        return next;
      });
      toast.error(t.errUpdateTask);
    },
  });

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) setActiveTask(task);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId((event.over?.id as TaskStatus) ?? null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);
      setOverId(null);

      if (!over) return;

      const task = active.data.current?.task as Task | undefined;
      const newStatus = over.id as TaskStatus;
      if (!task || task.status === newStatus) return;

      // Optimistic update
      setOptimistic((prev) => ({ ...prev, [task.id]: newStatus }));
      updateStatus({ id: task.id, status: newStatus });
    },
    [updateStatus],
  );

  // Merge optimistic overrides into tasks
  const resolvedTasks = tasks.map((task) =>
    optimistic[task.id] ? { ...task, status: optimistic[task.id] } : task,
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-100">
        {COLUMNS.map((col) => {
          const colTasks = resolvedTasks.filter(
            (task) => task.status === col.id,
          );
          return (
            <DroppableColumn
              key={col.id}
              col={col}
              colTasks={colTasks}
              members={members}
              isOver={overId === col.id}
              onNavigate={(task) =>
                navigate(`/spaces/${task.spaceId}/tasks/${task.id}`)
              }
            />
          );
        })}
      </div>

      {/* Drag overlay – ghost card following the cursor */}
      <DragOverlay>
        {activeTask && (
          <div className="rotate-2 opacity-95 shadow-2xl">
            <TaskCard
              task={activeTask}
              members={members}
              index={0}
              onClick={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
