import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => (
  <div className={cn("animate-pulse rounded-md bg-muted", className)} />
);

export const TaskCardSkeleton = () => (
  <div className="bg-card border border-border rounded-xl p-4 space-y-3">
    <div className="flex items-start justify-between">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    <Skeleton className="h-3 w-1/2" />
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex -space-x-1">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    </div>
    <Skeleton className="h-1.5 w-full rounded-full" />
  </div>
);

export const SpaceCardSkeleton = () => (
  <div className="bg-card border border-border rounded-xl p-5 space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <Skeleton className="h-1.5 w-full rounded-full" />
  </div>
);

export const MemberRowSkeleton = () => (
  <div className="flex items-center gap-4 p-4 border-b border-border">
    <Skeleton className="h-9 w-9 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-48" />
    </div>
    <Skeleton className="h-6 w-16 rounded-full" />
    <Skeleton className="h-8 w-8 rounded-md" />
  </div>
);

export const DashboardStatSkeleton = () => (
  <div className="bg-card border border-border rounded-xl p-5 space-y-3">
    <Skeleton className="h-3 w-24" />
    <Skeleton className="h-8 w-16" />
    <Skeleton className="h-1.5 w-full rounded-full" />
  </div>
);

export const TaskRowSkeleton = () => (
  <div className="flex items-center gap-4 bg-card border border-border rounded-xl px-4 py-3">
    <div className="flex-1 min-w-0 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
    <Skeleton className="h-6 w-14 rounded-full shrink-0" />
  </div>
);

export const KanbanColumnSkeleton = () => (
  <div className="shrink-0 w-84 rounded-2xl border border-border bg-muted/40">
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
      <Skeleton className="h-2 w-2 rounded-full" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-5 w-6 rounded-full ml-auto" />
    </div>
    <div className="p-3 space-y-3">
      {[1, 2, 3].map((i) => (
        <TaskCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export const GoalCardSkeleton = () => (
  <div className="bg-card border border-border rounded-xl p-5 space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-56" />
      </div>
    </div>
    <Skeleton className="h-2 w-full rounded-full" />
    <div className="flex items-center gap-3">
      <Skeleton className="h-7 w-24 rounded-lg" />
      <Skeleton className="h-7 w-28 rounded-lg ml-auto" />
    </div>
  </div>
);

export const TableRowSkeleton = () => (
  <tr>
    <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
    <td className="px-3 py-3 hidden sm:table-cell"><Skeleton className="h-5 w-20 rounded-full" /></td>
    <td className="px-3 py-3 hidden md:table-cell"><Skeleton className="h-5 w-16 rounded-full" /></td>
    <td className="px-3 py-3 hidden md:table-cell"><Skeleton className="h-4 w-20" /></td>
    <td className="px-3 py-3 hidden lg:table-cell">
      <div className="flex -space-x-1.5">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
    </td>
    <td className="px-3 py-3 hidden lg:table-cell"><Skeleton className="h-1.5 w-16 rounded-full" /></td>
  </tr>
);

export const GanttRowSkeleton = () => (
  <div className="flex items-center gap-3 mb-2">
    <Skeleton className="w-40 h-4 shrink-0" />
    <Skeleton className="flex-1 h-7 rounded-lg" />
    <Skeleton className="w-16 h-4 shrink-0" />
  </div>
);
