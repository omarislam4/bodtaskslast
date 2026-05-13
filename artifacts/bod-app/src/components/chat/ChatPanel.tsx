import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Reply, Pencil, Trash2, X, Smile, Check } from "lucide-react";
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, query, where, writeBatch } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/hooks/useChat";
import type { ChatMessage } from "@/hooks/useChat";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Member { id: string; displayName?: string; email?: string; }

interface ChatPanelProps {
  channelId: string;
  channelName?: string;
  spaceId?: string;
  spaceMembers?: Member[];
  className?: string;
  onClearChat?: () => void;
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

export function ChatPanel({ channelId, channelName, spaceId, spaceMembers = [], className, onClearChat }: ChatPanelProps) {
  const { userDoc, isAdmin } = useAuth();
  const { messages, loading } = useMessages(channelId);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [emojiPickerId, setEmojiPickerId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredMembers = mentionQuery !== null
    ? spaceMembers.filter(m =>
        (m.displayName || m.email || "").toLowerCase().includes(mentionQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleTextChange = (val: string) => {
    setText(val);
    const words = val.split(/\s/);
    const last = words[words.length - 1];
    if (last.startsWith("@") && last.length >= 1) {
      setMentionQuery(last.slice(1));
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (m: Member) => {
    const name = m.displayName || m.email || "User";
    const parts = text.split(/(\s+)/);
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i].startsWith("@")) { parts[i] = `@${name}`; break; }
    }
    setText(parts.join("") + " ");
    setMentionQuery(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const parseMentionIds = (txt: string): string[] => {
    const regex = /@(\S+)/g;
    const ids: string[] = [];
    let m;
    while ((m = regex.exec(txt)) !== null) {
      const q = m[1].toLowerCase().replace(/[.,!?]+$/, "");
      const found = spaceMembers.find(mb =>
        (mb.displayName || mb.email || "").toLowerCase().startsWith(q)
      );
      if (found && found.id !== (userDoc?.id || "")) ids.push(found.id);
    }
    return [...new Set(ids)];
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !userDoc) return;
    setSending(true);
    const mentions = parseMentionIds(text);
    try {
      await addDoc(collection(db, "chatMessages"), {
        channelId,
        spaceId: spaceId || null,
        senderId: userDoc.id || "",
        senderName: userDoc.displayName || userDoc.email || "Unknown",
        text: text.trim(),
        mentions,
        replyTo: replyingTo ? {
          id: replyingTo.id,
          text: replyingTo.deleted ? "[deleted]" : replyingTo.text.slice(0, 80),
          senderName: replyingTo.senderName,
        } : null,
        reactions: {},
        deleted: false,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "chatChannels", channelId), {
        lastMessage: text.trim().slice(0, 80),
        lastMessageAt: serverTimestamp(),
      });
      for (const uid of mentions) {
        addDoc(collection(db, "notifications"), {
          userId: uid,
          type: "mention",
          title: `${userDoc.displayName || "Someone"} mentioned you in chat`,
          body: text.trim().slice(0, 100),
          spaceId: spaceId || null,
          read: false,
          createdAt: serverTimestamp(),
        }).catch(() => {});
      }
      setText("");
      setReplyingTo(null);
    } catch { toast.error("Failed to send message"); }
    finally { setSending(false); }
  };

  const handleEdit = async (msgId: string) => {
    if (!editText.trim()) return;
    try {
      await updateDoc(doc(db, "chatMessages", msgId), { text: editText.trim(), edited: true });
      setEditingId(null);
    } catch { toast.error("Failed to edit"); }
  };

  const handleDelete = async (msgId: string) => {
    try {
      await deleteDoc(doc(db, "chatMessages", msgId));
    } catch { toast.error("Failed to delete"); }
  };

  const handleClearChat = async () => {
    if (!confirm("Clear all messages in this channel?")) return;
    try {
      const q = query(collection(db, "chatMessages"), where("channelId", "==", channelId));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      toast.success("Chat cleared");
    } catch { toast.error("Failed to clear chat"); }
  };

  const handleReact = async (msgId: string, emoji: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || !userDoc) return;
    const uid = userDoc.id || "";
    const current = ((msg.reactions || {}) as Record<string, string[]>)[emoji] || [];
    const updated = current.includes(uid) ? current.filter(id => id !== uid) : [...current, uid];
    const reactions = { ...((msg.reactions || {}) as Record<string, string[]>), [emoji]: updated };
    try { await updateDoc(doc(db, "chatMessages", msgId), { reactions }); } catch {}
  };

  const clearChat = onClearChat || handleClearChat;

  return (
    <div className={cn("flex flex-col h-full", className)} onClick={() => setEmojiPickerId(null)}>
      {/* Channel header */}
      {(channelName || isAdmin) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50">
          {channelName && <span className="text-sm font-semibold text-foreground truncate"># {channelName}</span>}
          {isAdmin && (
            <button onClick={clearChat} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors ml-auto">
              <Trash2 className="w-3 h-3" /> Clear chat
            </button>
          )}
        </div>
      )}
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-0.5 min-h-0">
        {loading ? (
          <div className="space-y-4 pt-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-muted shrink-0 animate-pulse" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-muted rounded w-24 animate-pulse" />
                  <div className="h-10 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
            <MessageCircle className="w-10 h-10 opacity-20 mb-2" />
            <p className="font-semibold text-sm">No messages yet</p>
            <p className="text-xs">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === userDoc?.id;
            const prev = i > 0 ? messages[i - 1] : null;
            const showHeader = !prev || prev.senderId !== msg.senderId
              || (msg.createdAt.getTime() - prev.createdAt.getTime()) > 300000;
            const canEdit = isMe && !msg.deleted;
            const canDelete = (isMe || isAdmin) && !msg.deleted;
            const msgReactions = (msg.reactions || {}) as Record<string, string[]>;
            const hasReactions = Object.values(msgReactions).some(arr => arr.length > 0);

            return (
              <div key={msg.id} className="group relative"
                onMouseEnter={() => setHoveredId(msg.id)}
                onMouseLeave={() => setHoveredId(null)}>
                {showHeader && (
                  <div className={cn("flex items-center gap-2 mt-3 mb-0.5", isMe && "flex-row-reverse")}>
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      isMe ? "bg-primary/30 text-primary" : "bg-muted text-muted-foreground")}>
                      {(msg.senderName || "U")[0].toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-foreground">{isMe ? "You" : msg.senderName}</span>
                    <span className="text-xs text-muted-foreground/50">{format(msg.createdAt, "HH:mm")}</span>
                  </div>
                )}

                <div className={cn("flex gap-2 items-end", isMe && "flex-row-reverse",
                  !showHeader && (isMe ? "pr-9" : "pl-9"))}>
                  {!showHeader && <div className="w-7 shrink-0" />}
                  <div className={cn("flex flex-col max-w-[75%]", isMe && "items-end")}>
                    {/* Reply quote */}
                    {msg.replyTo && (
                      <div className={cn("flex items-start gap-1.5 px-2 py-1 mb-1 bg-muted/50 border-l-2 border-primary/50 rounded-r text-xs text-muted-foreground max-w-full overflow-hidden",
                        isMe && "border-l-0 border-r-2 rounded-r-none rounded-l text-right")}>
                        <Reply className="w-3 h-3 shrink-0 mt-0.5" />
                        <span className="truncate"><strong>{msg.replyTo.senderName}:</strong> {msg.replyTo.text}</span>
                      </div>
                    )}

                    {/* Message bubble or edit input */}
                    {editingId === msg.id ? (
                      <div className="flex items-center gap-2 min-w-[200px]">
                        <input autoFocus value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") handleEdit(msg.id); if (e.key === "Escape") setEditingId(null); }}
                          className="flex-1 px-3 py-2 text-sm bg-background border border-primary/40 rounded-xl focus:outline-none" />
                        <button onClick={() => handleEdit(msg.id)} className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className={cn("px-3 py-2 rounded-2xl text-sm break-words leading-relaxed",
                        msg.deleted
                          ? "italic text-muted-foreground bg-muted/30 border border-border"
                          : isMe
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-card border border-border text-foreground rounded-tl-sm"
                      )}>
                        {msg.deleted ? "This message was deleted" : (
                          <span dangerouslySetInnerHTML={{
                            __html: msg.text.replace(/@(\S+)/g, '<strong class="opacity-80">@$1</strong>')
                          }} />
                        )}
                        {msg.edited && !msg.deleted && <span className="ml-1 text-[10px] opacity-50">(edited)</span>}
                      </div>
                    )}

                    {/* Reactions */}
                    {hasReactions && !msg.deleted && (
                      <div className={cn("flex flex-wrap gap-1 mt-1", isMe && "justify-end")}>
                        {Object.entries(msgReactions).filter(([, arr]) => arr.length > 0).map(([emoji, users]) => (
                          <button key={emoji}
                            onClick={e => { e.stopPropagation(); handleReact(msg.id, emoji); }}
                            className={cn("flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-all",
                              users.includes(userDoc?.id || "")
                                ? "bg-primary/10 border-primary/30 text-primary"
                                : "bg-card border-border text-muted-foreground hover:bg-muted"
                            )}>
                            {emoji} <span>{users.length}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action bar on hover */}
                  {hoveredId === msg.id && !msg.deleted && editingId !== msg.id && (
                    <div className={cn("flex items-center gap-0.5 shrink-0 mb-1",
                      isMe ? "mr-1 order-first" : "ml-1")}>
                      <div className="flex items-center gap-0.5 bg-card border border-border rounded-xl shadow-md px-1 py-0.5">
                        {/* Emoji */}
                        <div className="relative">
                          <button
                            onClick={e => { e.stopPropagation(); setEmojiPickerId(emojiPickerId === msg.id ? null : msg.id); }}
                            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors">
                            <Smile className="w-3.5 h-3.5" />
                          </button>
                          {emojiPickerId === msg.id && (
                            <div onClick={e => e.stopPropagation()}
                              className={cn("absolute bottom-full mb-1 bg-card border border-border rounded-2xl shadow-xl p-2 flex gap-1.5 z-50",
                                isMe ? "right-0" : "left-0")}>
                              {QUICK_EMOJIS.map(em => (
                                <button key={em} onClick={() => { handleReact(msg.id, em); setEmojiPickerId(null); }}
                                  className="text-base hover:scale-125 transition-transform p-0.5">
                                  {em}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button onClick={() => { setReplyingTo(msg); inputRef.current?.focus(); }}
                          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors">
                          <Reply className="w-3.5 h-3.5" />
                        </button>
                        {canEdit && (
                          <button onClick={() => { setEditingId(msg.id); setEditText(msg.text); }}
                            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(msg.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply strip */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-t border-primary/20 overflow-hidden">
            <Reply className="w-3.5 h-3.5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-primary">{replyingTo.senderName}</span>
              <p className="text-xs text-muted-foreground truncate">{replyingTo.text.slice(0, 60)}</p>
            </div>
            <button onClick={() => setReplyingTo(null)} className="p-1 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <form onSubmit={handleSend} className="relative p-3 border-t border-border">
        {/* Mention dropdown */}
        <AnimatePresence>
          {mentionQuery !== null && filteredMembers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
              className="absolute bottom-full left-3 right-3 mb-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
              {filteredMembers.map(m => (
                <button key={m.id} type="button" onClick={() => insertMention(m)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left border-b border-border/50 last:border-0">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {(m.displayName || m.email || "U")[0].toUpperCase()}
                  </div>
                  <span className="font-medium">{m.displayName || m.email}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          <input ref={inputRef} value={text}
            onChange={e => handleTextChange(e.target.value)}
            onKeyDown={e => { if (e.key === "Escape" && mentionQuery !== null) setMentionQuery(null); }}
            placeholder="Message... use @ to mention someone"
            className="flex-1 px-4 py-2.5 text-sm bg-card border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
          <button type="submit" disabled={sending || !text.trim()}
            className="flex items-center justify-center w-9 h-9 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
