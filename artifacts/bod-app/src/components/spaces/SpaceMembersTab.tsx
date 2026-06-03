import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, UserMinus, Users } from "lucide-react";
import { useSpaceMembers, useAddSpaceMember, useRemoveSpaceMember } from "@/hooks/useSpaces";
import { useMembers } from "@/hooks/useMembers";
import { useTasksBySpace } from "@/hooks/useTaskQueries";
import { useLang } from "@/contexts/LangContext";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  spaceId: string;
  isAdmin: boolean;
}

export function SpaceMembersTab({ spaceId, isAdmin }: Props) {
  const { t } = useLang();
  const { data: tasks = [] } = useTasksBySpace(spaceId);
  const { members } = useMembers();
  const { data: spaceMembers = [], isLoading: membersLoading } = useSpaceMembers(spaceId);
  const addSpaceMember = useAddSpaceMember();
  const removeSpaceMember = useRemoveSpaceMember();

  const [selectedNewMember, setSelectedNewMember] = useState("");

  const nonSpaceMembers = members.filter((m) => !spaceMembers.find((sm) => sm.id === m.id));

  const handleAddMember = () => {
    if (!selectedNewMember) return;
    addSpaceMember.mutate(
      { spaceId, userId: selectedNewMember },
      { onSuccess: () => setSelectedNewMember("") },
    );
  };

  const handleRemoveMember = (memberId: string) => {
    removeSpaceMember.mutate({ spaceId, memberId });
  };

  return (
    <motion.div
      key="members"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-4 sm:p-6 max-w-3xl mx-auto"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-foreground">
          Space Members ({spaceMembers.length})
        </h2>
      </div>

      {isAdmin && nonSpaceMembers.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 mb-5 shadow-sm">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Add Member
          </h3>
          <div className="flex gap-2">
            <Select value={selectedNewMember} onValueChange={setSelectedNewMember}>
              <SelectTrigger className="flex-1 text-sm min-w-0">
                <SelectValue placeholder={t.selectMember} />
              </SelectTrigger>
              <SelectContent>
                {nonSpaceMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.displayName || m.email} ({m.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={handleAddMember}
              disabled={!selectedNewMember || addSpaceMember.isPending}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-colors shrink-0 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>
      )}

      {membersLoading ? (
        <div className="space-y-2">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : spaceMembers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members yet"
          description={isAdmin ? "Add members from the section above." : "No members have been added to this space."}
        />
      ) : (
        <div className="space-y-2">
          {spaceMembers.map((m) => {
            const memberTasks = tasks.filter((tk) => tk.assigneeIds.includes(m.id));
            const doneTasks = memberTasks.filter((tk) => tk.status === "done").length;
            return (
              <div
                key={m.id}
                className="bg-card border border-border rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 shadow-sm"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {(m.displayName || m.email || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{m.displayName || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-xs text-muted-foreground">{memberTasks.length} tasks</p>
                  <p className="text-xs text-emerald-500 font-medium">{doneTasks} done</p>
                </div>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                  m.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                )}>
                  {m.role}
                </span>
                {isAdmin && m.role !== "admin" && (
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    disabled={removeSpaceMember.isPending && removeSpaceMember.variables?.memberId === m.id}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0 disabled:opacity-60"
                    title="Remove from space"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
