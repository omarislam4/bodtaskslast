import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Layers, Calendar, Users, Send,
  History, Settings, ChevronRight, Sun,
  Moon, LogOut, ChevronDown, Menu, X, CornerDownRight,
  ClipboardCheck, FileText, Bug, CheckSquare,
  BarChart2, MessageCircle, SlidersHorizontal, Eye, EyeOff, Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLang } from "@/contexts/LangContext";
import { useSpaces, useSubSpaces } from "@/hooks/useSpaces";
import { useSpaceFilter } from "@/hooks/useSpaceFilter";
import bodLogo from "@assets/bod-logo.png";

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar = ({ onClose }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [spacesOpen, setSpacesOpen] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const [location] = useLocation();
  const { userDoc, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLang();
  const { data: spaces = [] } = useSpaces();
  const { hiddenSpaceIds, toggleSpaceVisibility, filterSpaces } = useSpaceFilter();

  const handleLogout = () => logout();

  const spaceMatch = location.match(/^\/spaces\/([^/]+)/);
  const currentSpaceId = spaceMatch ? spaceMatch[1] : null;

  const { data: currentSubSpaces = [] } = useSubSpaces(currentSpaceId ?? undefined);

  const topSpaces = spaces.filter((s) => !s.parentSpaceId);
  const visibleTopSpaces = isAdmin ? filterSpaces(topSpaces) : topSpaces;

  const openFilter = useCallback(() => {
    if (filterBtnRef.current) {
      const rect = filterBtnRef.current.getBoundingClientRect();
      const dropdownWidth = 240;
      // Align right edge of dropdown with right edge of button, clamped to screen
      const left = Math.max(8, Math.min(rect.right - dropdownWidth, window.innerWidth - dropdownWidth - 8));
      setDropdownPos({ top: rect.bottom + 6, left });
    }
    setFilterOpen(true);
  }, []);

  // Close filter dropdown on outside click
  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        filterRef.current && !filterRef.current.contains(e.target as Node) &&
        filterBtnRef.current && !filterBtnRef.current.contains(e.target as Node)
      ) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterOpen]);

  const navItems = [
    { icon: LayoutDashboard, label: t.dashboard,    href: "/" },
    { icon: Layers,          label: t.spaces,       href: "/spaces" },
    { icon: CheckSquare,     label: t.myTasks,      href: "/my-tasks" },
    { icon: BarChart2,       label: t.portfolio,    href: "/portfolio" },
    { icon: MessageCircle,   label: t.chat,         href: "/chat" },
    { icon: Bug,             label: t.bugTracker,   href: "/bugs",           adminOnly: true },
    { icon: Bot,             label: t.automations,  href: "/automations",    adminOnly: true },
    { icon: ClipboardCheck,  label: "Attendance",   href: "/attendance" },
    { icon: FileText,        label: "Weekly Report", href: "/weekly-report" },
    { icon: Calendar,        label: t.timeline,     href: "/timeline",       adminOnly: true },
    { icon: History,         label: t.history,      href: "/history",        adminOnly: true },
    { icon: Users,           label: t.members,      href: "/members",        adminOnly: true },
    { icon: Send,            label: t.senders,      href: "/senders",        adminOnly: true },
    { icon: Settings,        label: t.settings,     href: "/settings" },
  ];

  const visibleNav = navItems.filter((item) => !item.adminOnly || isAdmin);

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative flex flex-col h-full bg-sidebar border-r border-sidebar-border shrink-0 overflow-hidden shadow-lg lg:shadow-none"
    >
      {/* Toggle row */}
      <div className="flex items-center justify-between h-10 px-3 border-b border-sidebar-border/50 shrink-0">
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 select-none"
            >
              {t.menu}
            </motion.span>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-1 ml-auto">
          {onClose && (
            <button onClick={onClose}
              className="lg:hidden flex items-center justify-center w-7 h-7 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/10 transition-all duration-150">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setCollapsed((v) => !v)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/10 transition-all duration-150">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Logo + app name */}
      <div className="flex items-center h-14 px-3 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#1a1a3e] flex items-center justify-center shrink-0 shadow-sm">
            <img src={bodLogo} alt="BOD" className="w-6 h-6 object-contain" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }} className="min-w-0">
                <span className="text-sm font-bold text-sidebar-foreground block truncate">Birth Of Dream</span>
                <span className="text-xs text-sidebar-foreground/50 block truncate">{t.workspace}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-hide">
        {visibleNav.map((item, i) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <motion.div key={item.href} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: i * 0.04 }}>
              <Link href={item.href}>
                <div onClick={handleNavClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 group",
                    isActive ? "bg-primary/15 text-primary" : "text-sidebar-foreground hover:bg-white/10 hover:text-sidebar-foreground"
                  )}>
                  <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-sidebar-foreground/70")} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                        className="text-sm font-medium truncate">
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && !collapsed && (
                    <motion.div layoutId="activeIndicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </div>
              </Link>

              {/* Spaces submenu */}
              {item.href === "/spaces" && !collapsed && topSpaces.length > 0 && (
                <div className="mt-0.5">
                  <div className="flex items-center gap-1 px-3 py-1">
                    <button onClick={() => setSpacesOpen((v) => !v)}
                      className="flex items-center gap-1.5 text-xs text-sidebar-foreground/50 flex-1 hover:text-sidebar-foreground transition-colors">
                      <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", !spacesOpen && "-rotate-90")} />
                      <span>{t.mySpaces}</span>
                      {isAdmin && hiddenSpaceIds.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded-full font-semibold">
                          {topSpaces.length - visibleTopSpaces.length} hidden
                        </span>
                      )}
                    </button>
                    {/* Admin space filter button */}
                    {isAdmin && (
                      <button
                        ref={filterBtnRef}
                        onClick={() => filterOpen ? setFilterOpen(false) : openFilter()}
                        className={cn(
                          "p-1 rounded transition-colors shrink-0",
                          filterOpen ? "text-primary bg-primary/10" : "text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-white/10"
                        )}
                        title="Filter visible spaces"
                      >
                        <SlidersHorizontal className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <AnimatePresence>
                    {spacesOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden pl-3"
                      >
                        {visibleTopSpaces.map((space) => {
                          const isSpaceActive = location.startsWith(`/spaces/${space.id}`);
                          const spaceSubs = space.id === currentSpaceId ? currentSubSpaces : [];
                          const showSubs = isSpaceActive && spaceSubs.length > 0 && currentSpaceId === space.id;

                          return (
                            <div key={space.id}>
                              <Link href={`/spaces/${space.id}`}>
                                <div onClick={handleNavClick}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs cursor-pointer transition-all duration-150",
                                    isSpaceActive ? "bg-primary/15 text-primary" : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/10"
                                  )}>
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: space.color || "#6366f1" }} />
                                  <span className="truncate flex-1">{space.name}</span>
                                </div>
                              </Link>
                              <AnimatePresence>
                                {showSubs && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.18 }}
                                    className="overflow-hidden pl-3 mt-0.5 mb-0.5"
                                  >
                                    {spaceSubs.map((sub) => (
                                      <Link key={sub.id} href={`/spaces/${sub.id}`}>
                                        <div onClick={handleNavClick}
                                          className={cn(
                                            "flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] cursor-pointer transition-all duration-150",
                                            location === `/spaces/${sub.id}` || location.startsWith(`/spaces/${sub.id}/`)
                                              ? "bg-primary/10 text-primary"
                                              : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-white/8"
                                          )}>
                                          <CornerDownRight className="w-3 h-3 shrink-0 opacity-50" />
                                          <span className="w-1.5 h-1.5 rounded-full shrink-0 opacity-70" style={{ backgroundColor: sub.color || "#6366f1" }} />
                                          <span className="truncate">{sub.name}</span>
                                        </div>
                                      </Link>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-2 py-3 space-y-1">
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg">
              <span className="text-xs text-sidebar-foreground/40 mr-1 shrink-0">🌐</span>
              <button onClick={() => setLang("en")}
                className={cn("text-xs font-semibold px-2 py-0.5 rounded transition-all",
                  lang === "en" ? "bg-primary/20 text-primary" : "text-sidebar-foreground/40 hover:text-sidebar-foreground")}>EN</button>
              <span className="text-sidebar-foreground/20 text-xs">|</span>
              <button onClick={() => setLang("ar")}
                className={cn("text-xs font-semibold px-2 py-0.5 rounded transition-all",
                  lang === "ar" ? "bg-primary/20 text-primary" : "text-sidebar-foreground/40 hover:text-sidebar-foreground")}>AR</button>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2 rounded-lg w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/10 transition-all duration-150">
          {theme === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium">
                {theme === "dark" ? t.lightMode : t.darkMode}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {userDoc && (
          <div className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg", collapsed && "justify-center")}>
            <div className="w-7 h-7 rounded-full bg-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {(userDoc.displayName || userDoc.email || "U")[0].toUpperCase()}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-w-0 flex-1 flex items-center gap-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-sidebar-foreground truncate">{userDoc.displayName || "User"}</p>
                    <p className="text-xs text-sidebar-foreground/50 truncate">{userDoc.email}</p>
                  </div>
                  <button onClick={handleLogout} className="text-sidebar-foreground/40 hover:text-destructive transition-colors shrink-0">
                    <LogOut className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.aside>

    {/* Fixed-position dropdown portal — outside overflow-hidden aside */}
    {isAdmin && filterOpen && dropdownPos && createPortal(
      <AnimatePresence>
        <motion.div
          ref={filterRef}
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.15 }}
          style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
          className="w-60 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="px-3 py-2.5 border-b border-border">
            <p className="text-xs font-semibold text-foreground">Visible Spaces</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Choose which spaces to show in your dashboard</p>
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {topSpaces.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-2">No spaces yet</p>
            ) : (
              topSpaces.map(space => {
                const visible = !hiddenSpaceIds.includes(space.id);
                return (
                  <button key={space.id}
                    onClick={() => toggleSpaceVisibility(space.id)}
                    className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-muted/50 transition-colors text-left">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: space.color || "#6366f1" }} />
                    <span className={cn("text-xs flex-1 truncate", visible ? "text-foreground" : "text-muted-foreground line-through")}>
                      {space.name}
                    </span>
                    {visible
                      ? <Eye className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      : <EyeOff className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    }
                  </button>
                );
              })
            )}
          </div>
          {hiddenSpaceIds.length > 0 && (
            <div className="border-t border-border px-3 py-2">
              <button
                onClick={() => {
                  if (userDoc?.id) {
                    try { localStorage.removeItem(`spaceFilter_hidden_${userDoc.id}`); } catch {}
                  }
                  setFilterOpen(false);
                  window.location.reload();
                }}
                className="text-[11px] text-primary hover:underline font-medium">
                Show all spaces
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>,
      document.body
    )}
    </>
  );
};
