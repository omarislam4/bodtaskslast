import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Plus, Send, Hash, X, ChevronRight } from "lucide-react";
import { collection, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { useChannels, useMessages } from "@/hooks/useChat";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Chat() {
  const { userDoc } = useAuth();
  const { t } = useLang();
  const { channels, loading: channelsLoading } = useChannels();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const { messages, loading: messagesLoading } = useMessages(selectedChannelId || undefined);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedChannel = channels.find(c => c.id === selectedChannelId);

  useEffect(() => {
    if (channels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChannelId || !userDoc) return;
    setSending(true);
    try {
      await addDoc(collection(db, "chatMessages"), {
        channelId: selectedChannelId,
        senderId: userDoc.id || "",
        senderName: userDoc.displayName || userDoc.email || "Unknown",
        text: messageText.trim(),
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "chatChannels", selectedChannelId), {
        lastMessage: messageText.trim().slice(0, 80),
        lastMessageAt: serverTimestamp(),
      });
      setMessageText("");
    } catch { toast.error("Failed to send message"); }
    finally { setSending(false); }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    setCreating(true);
    try {
      const ref = await addDoc(collection(db, "chatChannels"), {
        name: newChannelName.toLowerCase().replace(/\s+/g, "-"),
        description: newChannelDesc,
        isPrivate: false,
        memberIds: [],
        createdBy: userDoc?.id || "",
        createdAt: serverTimestamp(),
      });
      setSelectedChannelId(ref.id);
      setShowNewChannel(false);
      setNewChannelName(""); setNewChannelDesc("");
    } catch { toast.error("Failed to create channel"); }
    finally { setCreating(false); }
  };

  // Ensure a #general channel exists
  useEffect(() => {
    if (!channelsLoading && channels.length === 0 && userDoc) {
      addDoc(collection(db, "chatChannels"), {
        name: "general", description: "General discussions",
        isPrivate: false, memberIds: [],
        createdBy: userDoc.id || "", createdAt: serverTimestamp(),
      });
    }
  }, [channelsLoading, channels.length, userDoc]);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Sidebar */}
      <div className="w-56 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        <div className="flex items-center justify-between p-3 border-b border-sidebar-border/50">
          <span className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60">{t.channels}</span>
          <button onClick={() => setShowNewChannel(true)} className="p-1 text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {channelsLoading ? (
            <div className="space-y-2 p-2">{[1,2,3].map(i => <div key={i} className="h-7 bg-white/10 rounded animate-pulse" />)}</div>
          ) : (
            channels.map(ch => (
              <button key={ch.id} onClick={() => setSelectedChannelId(ch.id)}
                className={cn("flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-sm transition-all text-start",
                  selectedChannelId === ch.id ? "bg-primary/20 text-primary" : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/10")}>
                <Hash className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{ch.name}</span>
              </button>
            ))
          )}
        </nav>
        <AnimatePresence>
          {showNewChannel && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="border-t border-sidebar-border overflow-hidden">
              <form onSubmit={handleCreateChannel} className="p-3 space-y-2">
                <input required value={newChannelName} onChange={e => setNewChannelName(e.target.value)}
                  placeholder={t.channelNamePlaceholder}
                  className="w-full px-2 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowNewChannel(false)} className="flex-1 py-1 text-xs text-sidebar-foreground/40 border border-white/10 rounded-lg">Cancel</button>
                  <button type="submit" disabled={creating} className="flex-1 py-1 text-xs bg-primary text-primary-foreground rounded-lg disabled:opacity-60">Create</button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedChannel ? (
          <>
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border shrink-0">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">{selectedChannel.name}</h2>
              {selectedChannel.description && <span className="text-sm text-muted-foreground">— {selectedChannel.description}</span>}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messagesLoading ? (
                <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="flex gap-3"><div className="w-8 h-8 rounded-full bg-muted shrink-0" /><div className="space-y-1 flex-1"><div className="h-3 bg-muted rounded w-24" /><div className="h-8 bg-muted rounded" /></div></div>)}</div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageCircle className="w-12 h-12 opacity-20 mb-3" />
                  <p className="font-semibold">{t.noMessages}</p>
                  <p className="text-sm">{t.noMessagesDesc}</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.senderId === userDoc?.id;
                  const prevMsg = i > 0 ? messages[i - 1] : null;
                  const showHeader = !prevMsg || prevMsg.senderId !== msg.senderId || (msg.createdAt.getTime() - prevMsg.createdAt.getTime()) > 300000;
                  return (
                    <div key={msg.id} className={cn("flex gap-3", isMe && "flex-row-reverse")}>
                      {showHeader && (
                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0", isMe ? "bg-primary/30 text-primary" : "bg-muted text-muted-foreground")}>
                          {(msg.senderName || "U")[0].toUpperCase()}
                        </div>
                      )}
                      {!showHeader && <div className="w-7 shrink-0" />}
                      <div className={cn("max-w-[70%]", isMe && "items-end flex flex-col")}>
                        {showHeader && (
                          <div className={cn("flex items-center gap-2 mb-1", isMe && "flex-row-reverse")}>
                            <span className="text-xs font-semibold text-foreground">{isMe ? "You" : msg.senderName}</span>
                            <span className="text-xs text-muted-foreground/60">{format(msg.createdAt, "HH:mm")}</span>
                          </div>
                        )}
                        <div className={cn("px-3 py-2 rounded-2xl text-sm break-words", isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border text-foreground rounded-tl-sm")}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="flex items-center gap-3 px-5 py-3 border-t border-border shrink-0">
              <input value={messageText} onChange={e => setMessageText(e.target.value)}
                placeholder={t.typeMessage}
                className="flex-1 px-4 py-2.5 text-sm bg-card border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              <button type="submit" disabled={sending || !messageText.trim()}
                className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shrink-0">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="w-12 h-12 opacity-20 mb-3" />
            <p className="font-semibold">{t.channels}</p>
          </div>
        )}
      </div>
    </div>
  );
}
