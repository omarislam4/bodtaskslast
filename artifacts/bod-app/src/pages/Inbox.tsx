import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, CheckCheck, AtSign, UserCheck, MessageSquare, Info, ChevronRight } from "lucide-react";
import { doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { useNotifications, Notification, NotificationType } from "@/hooks/useNotifications";
import { useLocation } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type InboxTab = "all" | "unread" | "mentions" | "assignments";

const TYPE_CONFIG: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  assignment:    { icon: UserCheck,      color: "text-blue-400" },
  mention:       { icon: AtSign,         color: "text-purple-400" },
  comment:       { icon: MessageSquare,  color: "text-green-400" },
  status_change: { icon: CheckCheck,     color: "text-yellow-400" },
  reminder:      { icon: Bell,           color: "text-orange-400" },
  system:        { icon: Info,           color: "text-muted-foreground" },
};

export default function Inbox() {
  const { userDoc } = useAuth();
  const { t } = useLang();
  const { notifications, loading, unreadCount } = useNotifications(userDoc?.id);
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<InboxTab>("all");

  const getTabItems = () => {
    switch (activeTab) {
      case "unread":      return notifications.filter(n => !n.read);
      case "mentions":    return notifications.filter(n => n.type === "mention");
      case "assignments": return notifications.filter(n => n.type === "assignment");
      default:            return notifications;
    }
  };

  const markRead = async (notif: Notification) => {
    if (notif.read) return;
    try { await updateDoc(doc(db, "notifications", notif.id), { read: true }); }
    catch {}
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach(n => batch.update(doc(db, "notifications", n.id), { read: true }));
    try { await batch.commit(); }
    catch {}
  };

  const tabs: { id: InboxTab; label: string; count?: number }[] = [
    { id: "all",         label: t.allFilter },
    { id: "unread",      label: t.unreadLabel,      count: unreadCount },
    { id: "mentions",    label: t.mentionsLabel },
    { id: "assignments", label: t.assignmentsLabel },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center relative">
            <Bell className="w-5 h-5 text-primary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t.inbox}</h1>
            <p className="text-sm text-muted-foreground">{unreadCount} {t.unreadLabel}</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground border border-border rounded-xl hover:bg-muted transition-all">
            <CheckCheck className="w-4 h-4" /> {t.markAllRead}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className={cn("text-xs rounded-full px-1.5 py-0.5 font-bold",
                activeTab === tab.id ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground")}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications */}
      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : getTabItems().length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Bell className="w-12 h-12 opacity-20 mb-3" />
          <p className="font-semibold">{t.noNotificationsYet}</p>
          <p className="text-sm">{t.noNotificationsDesc}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {getTabItems().map(notif => {
            const cfg = TYPE_CONFIG[notif.type];
            const Icon = cfg.icon;
            return (
              <motion.div key={notif.id} layout
                onClick={() => {
                  markRead(notif);
                  if (notif.taskId && notif.spaceId) navigate(`/spaces/${notif.spaceId}/tasks/${notif.taskId}`);
                }}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all border",
                  notif.read
                    ? "bg-card border-border hover:bg-muted/50"
                    : "bg-primary/5 border-primary/20 hover:bg-primary/10"
                )}>
                <div className={cn("w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5")}>
                  <Icon className={cn("w-4 h-4", cfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", notif.read ? "text-muted-foreground" : "text-foreground")}>{notif.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{notif.body}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {formatDistanceToNow(notif.createdAt, { addSuffix: true })}
                  </p>
                </div>
                {!notif.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
                {(notif.taskId) && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
