import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, Bell, X, Command, Menu, AtSign, UserCheck, MessageSquare, CheckCheck, Info, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAllTasksQuery } from "@/hooks/useTaskQueries";
import { useSpaces } from "@/hooks/useSpaces";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { format } from "date-fns";
import { useNotifications, useMarkNotificationRead, type NotificationType } from "@/hooks/useNotifications";

interface TopbarProps {
  onMenuClick?: () => void;
}

export const Topbar = ({ onMenuClick }: TopbarProps) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [location, navigate] = useLocation();
  const { data: tasks = [] } = useAllTasksQuery();
  const { spaces } = useSpaces();
  const { userDoc } = useAuth();
  const { t, isRTL } = useLang();
  const { notifications, unreadCount, hasNew, clearNew } = useNotifications(userDoc?.id);
  const markRead = useMarkNotificationRead();

  const NOTIF_ICON: Record<NotificationType, { icon: typeof Bell; color: string }> = {
    assignment:    { icon: UserCheck,     color: "text-blue-400" },
    mention:       { icon: AtSign,        color: "text-purple-400" },
    comment:       { icon: MessageSquare, color: "text-green-400" },
    status_change: { icon: CheckCheck,    color: "text-yellow-400" },
    reminder:      { icon: Bell,          color: "text-orange-400" },
    system:        { icon: Info,          color: "text-muted-foreground" },
  };

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
    <header className="h-14 flex items-center gap-2 sm:gap-4 px-3 sm:px-6 border-b border-border bg-background/80 backdrop-blur-sm shrink-0 relative shadow-sm">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Menu className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-foreground truncate">{currentLabel}</span>
      </div>

      <button
        onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 100); }}
        className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 text-sm text-muted-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors duration-150"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:block text-xs">{t.search}</span>
        <kbd className="hidden sm:flex items-center gap-0.5 text-xs bg-background border border-border rounded px-1 py-0.5 font-mono">
          <Command className="w-2.5 h-2.5" />K
        </kbd>
      </button>

      <div className="relative" ref={notifRef}>
        <button
          onClick={() => { setNotifOpen((v) => !v); clearNew(); }}
          className="relative w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
        >
          {hasNew && (
            <span className="absolute inset-0 rounded-lg animate-ping bg-red-400/30 pointer-events-none" />
          )}
          <Bell className={cn("w-4 h-4", hasNew && "text-red-500")} />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
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
                  {unreadCount > 0 && (
                    <span className="text-xs bg-red-500/10 text-red-500 font-medium px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                  )}
                  <button onClick={() => setNotifOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                    <Bell className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">{t.noNotificationsYet}</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">{t.noNotificationsDesc}</p>
                  </div>
                ) : (
                  <div className="py-1">
                    {notifications.slice(0, 8).map((n) => {
                      const { icon: Icon, color } = NOTIF_ICON[n.type] ?? NOTIF_ICON.system;
                      return (
                        <button
                          key={n.id}
                          className={cn(
                            "flex items-start gap-3 w-full px-4 py-2.5 hover:bg-muted/50 transition-colors text-start",
                            !n.read && "bg-primary/5"
                          )}
                          onClick={() => {
                            markRead.mutate(n.id);
                            if (n.taskId && n.spaceId) {
                              navigate(`/spaces/${n.spaceId}/tasks/${n.taskId}`);
                              setNotifOpen(false);
                            }
                          }}
                        >
                          <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", color)} />
                          <div className="min-w-0 flex-1">
                            <p className={cn("text-xs font-medium truncate", n.read ? "text-muted-foreground" : "text-foreground")}>{n.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{n.body}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">{format(new Date(n.createdAt), "MMM d, HH:mm")}</p>
                          </div>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />}
                          {n.taskId && n.spaceId && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-border px-4 py-2.5">
                <button
                  onClick={() => { navigate("/inbox"); setNotifOpen(false); }}
                  className="text-xs text-primary hover:underline w-full text-center"
                >
                  {t.viewAllTasks}
                </button>
              </div>
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
              className="fixed top-16 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-xl bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
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
