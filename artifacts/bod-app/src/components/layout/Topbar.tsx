import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, Bell, X, Command, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAllTasks } from "@/hooks/useTasks";
import { useSpaces } from "@/hooks/useSpaces";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { format, differenceInDays, isWithinInterval, addDays } from "date-fns";

export const Topbar = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [location, navigate] = useLocation();
  const { tasks } = useAllTasks();
  const { spaces } = useSpaces();
  const { userDoc } = useAuth();
  const { t, isRTL } = useLang();

  const breadcrumbLabels: Record<string, string> = {
    "/": t.dashboard,
    "/spaces": t.spaces,
    "/timeline": t.timeline,
    "/members": t.members,
    "/senders": t.senders,
    "/history": t.history,
    "/settings": t.settings,
  };

  const currentLabel = Object.entries(breadcrumbLabels).find(([path]) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  })?.[1] || "";

  const myTasks = userDoc
    ? tasks.filter((tk) => tk.assigneeIds?.includes(userDoc.id) && tk.status !== "done")
    : [];

  const overdueTasks = myTasks.filter((tk) => tk.deadline && tk.deadline < new Date());
  const dueSoonTasks = myTasks.filter(
    (tk) => tk.deadline && !overdueTasks.includes(tk) && isWithinInterval(tk.deadline, { start: new Date(), end: addDays(new Date(), 3) })
  );
  const inProgressTasks = myTasks.filter((tk) => tk.status === "in-progress" && !overdueTasks.includes(tk) && !dueSoonTasks.includes(tk));
  const notifCount = overdueTasks.length + dueSoonTasks.length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 100);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
        setNotifOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const searchResults = searchQuery.length > 1
    ? [
        ...tasks
          .filter((tk) => tk.title.toLowerCase().includes(searchQuery.toLowerCase()))
          .slice(0, 4)
          .map((tk) => ({ type: "task" as const, id: tk.id, label: tk.title, sub: tk.status, spaceId: tk.spaceId })),
        ...spaces
          .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .slice(0, 3)
          .map((s) => ({ type: "space" as const, id: s.id, label: s.name, sub: "space", spaceId: s.id })),
      ]
    : [];

  return (
    <header className="h-14 flex items-center gap-4 px-6 border-b border-border bg-background/80 backdrop-blur-sm shrink-0 relative">
      <div className="flex-1">
        <span className="text-sm font-semibold text-foreground">{currentLabel}</span>
      </div>

      <button
        onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 100); }}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors duration-150"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:block text-xs">{t.search}</span>
        <kbd className="hidden sm:flex items-center gap-0.5 text-xs bg-background border border-border rounded px-1 py-0.5 font-mono">
          <Command className="w-2.5 h-2.5" />K
        </kbd>
      </button>

      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setNotifOpen((v) => !v)}
          className="relative w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
        >
          <Bell className="w-4 h-4" />
          {notifCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none"
            >
              {notifCount > 9 ? "9+" : notifCount}
            </motion.span>
          )}
        </button>

        <AnimatePresence>
          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={cn(
                "absolute top-10 w-72 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden",
                isRTL ? "left-0" : "right-0"
              )}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">{t.notifications}</h3>
                <div className="flex items-center gap-2">
                  {notifCount > 0 && (
                    <span className="text-xs bg-red-500/10 text-red-500 font-medium px-1.5 py-0.5 rounded-full">{notifCount}</span>
                  )}
                  <button onClick={() => setNotifOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {overdueTasks.length === 0 && dueSoonTasks.length === 0 && inProgressTasks.length === 0 && myTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                    <Bell className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">{t.allCaughtUp}</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">{t.noPendingTasks}</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {overdueTasks.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-red-500 uppercase tracking-wide px-4 py-1.5">{t.overdue}</p>
                        {overdueTasks.map((tk) => (
                          <button
                            key={tk.id}
                            className="flex items-start gap-3 w-full px-4 py-2.5 hover:bg-muted/50 transition-colors text-start"
                            onClick={() => { navigate(`/spaces/${tk.spaceId}/tasks/${tk.id}`); setNotifOpen(false); }}
                          >
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-foreground truncate">{tk.title}</p>
                              <p className="text-xs text-red-500">
                                {tk.deadline ? `${Math.abs(differenceInDays(tk.deadline, new Date()))} ${t.daysOverdue}` : t.noDeadline}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {dueSoonTasks.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide px-4 py-1.5">{t.dueSoon}</p>
                        {dueSoonTasks.map((tk) => {
                          const days = tk.deadline ? differenceInDays(tk.deadline, new Date()) : 0;
                          return (
                            <button
                              key={tk.id}
                              className="flex items-start gap-3 w-full px-4 py-2.5 hover:bg-muted/50 transition-colors text-start"
                              onClick={() => { navigate(`/spaces/${tk.spaceId}/tasks/${tk.id}`); setNotifOpen(false); }}
                            >
                              <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-foreground truncate">{tk.title}</p>
                                <p className="text-xs text-amber-500">
                                  {days === 0 ? t.dueToday : days === 1 ? t.dueTomorrow : `${t.dueInDays} ${days} ${t.days}`}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {inProgressTasks.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide px-4 py-1.5">{t.inProgress}</p>
                        {inProgressTasks.slice(0, 4).map((tk) => (
                          <button
                            key={tk.id}
                            className="flex items-start gap-3 w-full px-4 py-2.5 hover:bg-muted/50 transition-colors text-start"
                            onClick={() => { navigate(`/spaces/${tk.spaceId}/tasks/${tk.id}`); setNotifOpen(false); }}
                          >
                            <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-foreground truncate">{tk.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {tk.deadline ? format(tk.deadline, "MMM d") : t.noDeadline}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {myTasks.length > 0 && (
                <div className="border-t border-border px-4 py-2.5">
                  <button
                    onClick={() => { navigate("/spaces"); setNotifOpen(false); }}
                    className="text-xs text-primary hover:underline w-full text-center"
                  >
                    {t.viewAllTasks}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="fixed top-16 left-1/2 -translate-x-1/2 w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchTasksSpaces}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
              {searchQuery.length > 1 && (
                <div className="py-2 max-h-64 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    searchResults.map((r) => (
                      <button
                        key={`${r.type}-${r.id}`}
                        className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-muted/50 transition-colors text-start"
                        onClick={() => {
                          if (r.type === "task") navigate(`/spaces/${r.spaceId}/tasks/${r.id}`);
                          else navigate(`/spaces/${r.id}`);
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", r.type === "task" ? "bg-primary/10 text-primary" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400")}>
                          {r.type}
                        </span>
                        <span className="text-sm text-foreground flex-1 truncate">{r.label}</span>
                        <span className="text-xs text-muted-foreground capitalize">{r.sub}</span>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground px-4 py-3">{t.noResultsFor} "{searchQuery}"</p>
                  )}
                </div>
              )}
              {searchQuery.length <= 1 && (
                <div className="px-4 py-3 text-xs text-muted-foreground">{t.typeToSearch}</div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};
