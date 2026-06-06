import { useState, useRef, useEffect } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Users,
  LayoutDashboard,
  Calendar,
  FolderOpen,
  Kanban,
  Layers,
  Bug,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { useTasksBySpace } from "@/hooks/useTaskQueries";
import type { TaskType } from "@/types";
import {
  useSpaceQuery,
  useDeleteSpace,
  useSpaceMembers,
} from "@/hooks/useSpaces";
import { SpaceGoalsTab } from "@/components/spaces/SpaceGoalsTab";
import { SpaceSprintsTab } from "@/components/spaces/SpaceSprintsTab";
import { SpaceOverviewTab } from "@/components/spaces/SpaceOverviewTab";
import { SpaceTasksTab } from "@/components/spaces/SpaceTasksTab";
import { SpaceBugsTab } from "@/components/spaces/SpaceBugsTab";
import { SpaceTimelineTab } from "@/components/spaces/SpaceTimelineTab";
import { SpaceMembersTab } from "@/components/spaces/SpaceMembersTab";
import { SpaceDataTab } from "@/components/spaces/SpaceDataTab";
import { SpaceSubspacesTab } from "@/components/spaces/SpaceSubspacesTab";
import { SpaceChatTab } from "@/components/spaces/SpaceChatTab";
import { SpaceCalendarTab } from "@/components/spaces/SpaceCalendarTab";
import { SpaceTableTab } from "@/components/spaces/SpaceTableTab";
import { SpaceGanttTab } from "@/components/spaces/SpaceGanttTab";
import { SpaceWorkloadTab } from "@/components/spaces/SpaceWorkloadTab";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { useMembers } from "@/hooks/useMembers";
import { cn } from "@/lib/utils";

type Tab =
  | "overview"
  | "tasks"
  | "bugs"
  | "kanban"
  | "timeline"
  | "members"
  | "data"
  | "subspaces"
  | "calendar"
  | "workload"
  | "table"
  | "gantt"
  | "chat"
  | "goals"
  | "sprints";

export default function SpaceDetail() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("tasks");
  const [showCreate, setShowCreate] = useState(false);
  const [createTaskType, setCreateTaskType] = useState<TaskType>("task");
  const [initialChatChannelId, setInitialChatChannelId] = useState<
    string | undefined
  >();
  const search = useSearch();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const tab = params.get("tab") as Tab | null;
    const channel = params.get("channel") ?? undefined;
    if (tab) setActiveTab(tab);
    if (channel) setInitialChatChannelId(channel);
  }, [search]);

  const { userDoc, isAdmin } = useAuth();
  const { t, isRTL } = useLang();
  const [, navigate] = useLocation();

  const { data: space, isLoading: spaceLoading } = useSpaceQuery(spaceId);
  const { data: spaceMembers = [] } = useSpaceMembers(spaceId);
  const { data: tasks = [] } = useTasksBySpace(spaceId ?? "");
  const { members } = useMembers();
  const deleteSpace = useDeleteSpace();

  const isInSpace =
    isAdmin || (userDoc != null && space?.memberIds?.includes(userDoc.id));

  const tabNavRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (dir: "left" | "right") => {
    const delta = dir === "left" ? -160 : 160;
    tabNavRef.current?.scrollBy({
      left: isRTL ? delta : -delta,
      behavior: "smooth",
    });
  };

  const handleDeleteSpace = () => {
    if (!spaceId || !space) return;
    if (!confirm(t.deleteSpace + "?")) return;
    deleteSpace.mutate(spaceId, { onSuccess: () => navigate("/spaces") });
  };

  const handleReportBug = () => {
    setCreateTaskType("bug");
    setShowCreate(true);
    setActiveTab("tasks");
  };

  if (spaceLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded-lg w-48" />
          <div className="h-4 bg-muted rounded w-64" />
        </div>
      </div>
    );
  }

  const tabs: {
    id: Tab;
    label: string;
    icon: typeof LayoutDashboard;
    adminOnly?: boolean;
  }[] = [
    { id: "overview", label: t.overview, icon: LayoutDashboard },
    { id: "tasks", label: t.tasksTab, icon: CheckCircle2 },
    { id: "bugs", label: t.bugTab, icon: Bug },
    { id: "kanban", label: t.kanbanView, icon: Kanban },
    { id: "calendar", label: t.calendarView, icon: Calendar },
    { id: "table", label: t.tableView, icon: LayoutDashboard },
    { id: "gantt", label: t.ganttView, icon: Layers },
    { id: "workload", label: t.workloadView, icon: Users },
    { id: "timeline", label: t.timelineTab, icon: Calendar },
    { id: "goals", label: t.goals, icon: ChevronRight },
    { id: "sprints", label: t.sprints, icon: ChevronRight },
    { id: "members", label: t.membersTab, icon: Users },
    { id: "data", label: t.data, icon: FolderOpen },
    { id: "subspaces", label: t.subspacesTab, icon: Layers },
    { id: "chat", label: "Chat", icon: MessageCircle },
  ];

  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || isAdmin);

  return (
    <div className="flex flex-col h-full">
      {/* Space header */}
      <div className="px-3 sm:px-6 pt-4 sm:pt-5 pb-0 border-b border-border bg-background">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
          <button
            onClick={() => navigate("/spaces")}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          {space && (
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${space.color || "#6366f1"}20` }}
              >
                <div
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full"
                  style={{ backgroundColor: space.color || "#6366f1" }}
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-foreground truncate">
                  {space.name}
                </h1>
                {space.description && (
                  <p className="text-xs text-muted-foreground truncate hidden sm:block">
                    {space.description}
                  </p>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
            <div className="hidden sm:flex -space-x-2">
              {spaceMembers.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  className="w-7 h-7 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-bold text-primary shadow-sm"
                  title={m.displayName}
                >
                  {(m.displayName || m.email || "?")[0].toUpperCase()}
                </div>
              ))}
              {spaceMembers.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs text-muted-foreground">
                  +{spaceMembers.length - 4}
                </div>
              )}
            </div>
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDeleteSpace}
                disabled={deleteSpace.isPending}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 border border-destructive/30 text-destructive text-xs sm:text-sm font-semibold rounded-xl hover:bg-destructive/10 transition-colors shadow-sm disabled:opacity-60"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{t.deleteSpace}</span>
              </motion.button>
            )}
            {isInSpace && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setCreateTaskType("task");
                  setActiveTab("tasks");
                  setShowCreate(true);
                }}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-primary-foreground text-xs sm:text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{t.newTask}</span>
                <span className="sm:hidden">Task</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex items-center">
          <button
            onClick={() => scrollTabs("right")}
            className="flex items-center justify-center shrink-0 px-1 pb-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isRTL ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          <div
            ref={tabNavRef}
            className="flex gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide"
          >
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-150",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                )}
              >
                <tab.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                {tab.id === "tasks" && tasks.length > 0 && (
                  <span className="text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 leading-none hidden sm:inline">
                    {tasks.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => scrollTabs("left")}
            className="flex items-center justify-center shrink-0 px-1 pb-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isRTL ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <SpaceOverviewTab
              key="overview"
              spaceId={spaceId!}
              onManageMembers={() => setActiveTab("members")}
            />
          )}

          {activeTab === "tasks" && (
            <SpaceTasksTab
              key="tasks"
              spaceId={spaceId!}
              isInSpace={!!isInSpace}
              showCreate={showCreate}
              onShowCreateChange={setShowCreate}
              createTaskType={createTaskType}
            />
          )}

          {activeTab === "bugs" && (
            <SpaceBugsTab
              key="bugs"
              spaceId={spaceId!}
              isInSpace={!!isInSpace}
              onReportBug={handleReportBug}
            />
          )}

          {activeTab === "kanban" && (
            <motion.div
              key="kanban"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 pb-0 sm:p-6 sm:pb-0"
            >
              <KanbanBoard tasks={tasks} members={members} spaceId={spaceId} totalTasks={tasks.length} />
            </motion.div>
          )}

          {activeTab === "calendar" && (
            <SpaceCalendarTab key="calendar" spaceId={spaceId!} />
          )}
          {activeTab === "table" && (
            <SpaceTableTab key="table" spaceId={spaceId!} />
          )}
          {activeTab === "gantt" && (
            <SpaceGanttTab key="gantt" spaceId={spaceId!} />
          )}
          {activeTab === "workload" && (
            <SpaceWorkloadTab key="workload" spaceId={spaceId!} />
          )}
          {activeTab === "timeline" && (
            <SpaceTimelineTab key="timeline" spaceId={spaceId!} />
          )}
          {activeTab === "members" && (
            <SpaceMembersTab
              key="members"
              spaceId={spaceId!}
              isAdmin={isAdmin}
            />
          )}
          {activeTab === "data" && (
            <SpaceDataTab key="data" spaceId={spaceId!} isAdmin={isAdmin} />
          )}
          {activeTab === "subspaces" && (
            <SpaceSubspacesTab
              key="subspaces"
              spaceId={spaceId!}
              isAdmin={isAdmin}
            />
          )}

          {activeTab === "chat" && (
            <SpaceChatTab
              key="chat"
              spaceId={spaceId!}
              isAdmin={isAdmin}
              userId={userDoc?.id || ""}
              initialChannelId={initialChatChannelId}
            />
          )}

          {activeTab === "goals" && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <SpaceGoalsTab spaceId={spaceId!} />
            </motion.div>
          )}

          {activeTab === "sprints" && (
            <motion.div
              key="sprints"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <SpaceSprintsTab spaceId={spaceId!} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
