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
