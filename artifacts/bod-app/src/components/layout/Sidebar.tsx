import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Layers, Calendar, Users, Send,
  History, Settings, ChevronRight, Sun,
  Moon, LogOut, ChevronDown, Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLang } from "@/contexts/LangContext";
import { useSpaces } from "@/hooks/useSpaces";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";
import bodLogo from "@assets/bod-logo.png";

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [spacesOpen, setSpacesOpen] = useState(true);
  const [location] = useLocation();
  const { userDoc, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLang();
  const { spaces } = useSpaces();

  const handleLogout = () => signOut(auth);

  const navItems = [
    { icon: LayoutDashboard, label: t.dashboard, href: "/", adminOnly: true },
    { icon: Layers, label: t.spaces, href: "/spaces" },
    { icon: Calendar, label: t.timeline, href: "/timeline", adminOnly: true },
    { icon: History, label: t.history, href: "/history", adminOnly: true },
    { icon: Users, label: t.members, href: "/members", adminOnly: true },
    { icon: Send, label: t.senders, href: "/senders", adminOnly: true },
    { icon: Settings, label: t.settings, href: "/settings" },
  ];

  const visibleNav = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative flex flex-col h-full bg-sidebar border-r border-sidebar-border shrink-0 overflow-hidden"
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
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/10 transition-all duration-150 ml-auto"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Logo + app name */}
      <div className="flex items-center h-14 px-3 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#1a1a3e] flex items-center justify-center shrink-0 shadow-sm">
            <img src={bodLogo} alt="BOD" className="w-6 h-6 object-contain" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="min-w-0"
              >
                <span className="text-sm font-bold text-sidebar-foreground block truncate">Birth Of Dream</span>
                <span className="text-xs text-sidebar-foreground/50 block truncate">{t.workspace}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleNav.map((item, i) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
            >
              <Link href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 group",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-sidebar-foreground hover:bg-white/10 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-sidebar-foreground/70")} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="text-sm font-medium truncate"
                      >
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
              {item.href === "/spaces" && !collapsed && spaces.length > 0 && (
                <div className="mt-0.5">
                  <button
                    onClick={() => setSpacesOpen((v) => !v)}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs text-sidebar-foreground/50 w-full hover:text-sidebar-foreground transition-colors"
                  >
                    <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", !spacesOpen && "-rotate-90")} />
                    <span>{t.mySpaces}</span>
                  </button>
                  <AnimatePresence>
                    {spacesOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden pl-3"
                      >
                        {spaces.slice(0, 8).map((space) => (
                          <Link key={space.id} href={`/spaces/${space.id}`}>
                            <div
                              className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs cursor-pointer transition-all duration-150",
                                location === `/spaces/${space.id}`
                                  ? "bg-primary/15 text-primary"
                                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/10"
                              )}
                            >
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: space.color || "#6366f1" }} />
                              <span className="truncate">{space.name}</span>
                            </div>
                          </Link>
                        ))}
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
        {/* Language switcher */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg"
            >
              <span className="text-xs text-sidebar-foreground/40 mr-1 shrink-0">🌐</span>
              <button
                onClick={() => setLang("en")}
                className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded transition-all",
                  lang === "en" ? "bg-primary/20 text-primary" : "text-sidebar-foreground/40 hover:text-sidebar-foreground"
                )}
              >
                EN
              </button>
              <span className="text-sidebar-foreground/20 text-xs">|</span>
              <button
                onClick={() => setLang("ar")}
                className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded transition-all",
                  lang === "ar" ? "bg-primary/20 text-primary" : "text-sidebar-foreground/40 hover:text-sidebar-foreground"
                )}
              >
                AR
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2 rounded-lg w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/10 transition-all duration-150"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium">
                {theme === "dark" ? t.lightMode : t.darkMode}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User info */}
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
  );
};
