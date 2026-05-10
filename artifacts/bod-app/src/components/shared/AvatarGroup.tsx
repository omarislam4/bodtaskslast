import { UserDoc } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AvatarGroupProps {
  memberIds: string[];
  members: UserDoc[];
  max?: number;
  size?: "sm" | "md";
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const colors = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-teal-500",
];

export const AvatarGroup = ({ memberIds, members, max = 3, size = "sm" }: AvatarGroupProps) => {
  const assigned = memberIds
    .map((id) => members.find((m) => m.id === id))
    .filter(Boolean) as UserDoc[];

  const visible = assigned.slice(0, max);
  const rest = assigned.length - max;

  const sizeClass = size === "sm" ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm";

  return (
    <div className="flex -space-x-1.5">
      {visible.map((member, i) => (
        <Tooltip key={member.id}>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "rounded-full border-2 border-background flex items-center justify-center font-semibold text-white",
                sizeClass,
                colors[i % colors.length]
              )}
              data-testid={`avatar-${member.id}`}
            >
              {getInitials(member.displayName || member.email)}
            </div>
          </TooltipTrigger>
          <TooltipContent>{member.displayName || member.email}</TooltipContent>
        </Tooltip>
      ))}
      {rest > 0 && (
        <div
          className={cn(
            "rounded-full border-2 border-background bg-muted text-muted-foreground flex items-center justify-center font-medium",
            sizeClass
          )}
        >
          +{rest}
        </div>
      )}
    </div>
  );
};
