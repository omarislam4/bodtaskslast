import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  Reply,
  Pencil,
  Trash2,
  X,
  Smile,
  Check,
  Clock,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useChannelMessagesInfiniteQuery,
  useSendMessage,
  useEditMessage,
  useDeleteMessage,
  useToggleReaction,
} from "@/hooks/useChatQueries";
import { useChatRealtime } from "@/hooks/useChatRealtime";
import type { ChatMessage } from "@/types";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLang } from "@/contexts/LangContext";

interface Member {
  id: string;
  displayName?: string;
  email?: string;
}

interface ChatPanelProps {
  channelId: string;
  channelName?: string;
  spaceId?: string;
  spaceMembers?: Member[];
  className?: string;
  onClearChat?: () => void;
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

export function ChatPanel({
  channelId,
  channelName,
  spaceId,
  spaceMembers = [],
  className,
  onClearChat,
}: ChatPanelProps) {
  const { userDoc, isAdmin } = useAuth();
  const { t } = useLang();

  const {
    data,
    isLoading: loading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useChannelMessagesInfiniteQuery(channelId);

  // pages[0] = newest batch, pages[N] = oldest batch.
  // Reverse so display is chronological (oldest → newest).
  const messages = data?.pages.slice().reverse().flatMap((p) => p.data) ?? [];

  const sendMessage = useSendMessage(channelId);
  const editMessage = useEditMessage();
  const deleteMessage = useDeleteMessage(channelId);
  const toggleReaction = useToggleReaction(channelId);

  useChatRealtime(channelId);

  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [emojiPickerId, setEmojiPickerId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tracks whether we've done the initial instant scroll-to-bottom.
  const didInitialScroll = useRef(false);
  // Saved scrollHeight before fetchNextPage so we can anchor after prepend.
  const prevScrollHeight = useRef(0);
  // Track pages length to detect when a history page finishes loading.
  const prevPagesLen = useRef(0);
  // Track last message id to detect new messages (not history).
  const lastMsgIdRef = useRef<string | undefined>(undefined);

  // ─── Initial scroll: instant to bottom before first paint ───────────────────
  useLayoutEffect(() => {
    if (loading || didInitialScroll.current || messages.length === 0) return;
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
      didInitialScroll.current = true;
      lastMsgIdRef.current = messages[messages.length - 1]?.id;
    }
  }, [loading, messages.length]);

  // ─── Anchor scroll when older messages are prepended ────────────────────────
  useLayoutEffect(() => {
    const pagesLen = data?.pages.length ?? 0;
    if (pagesLen > prevPagesLen.current && prevScrollHeight.current > 0) {
      const el = containerRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight - prevScrollHeight.current;
      }
      prevScrollHeight.current = 0;
    }
    prevPagesLen.current = pagesLen;
  }, [data?.pages.length]);

  // ─── Smooth scroll on new messages (not history) ────────────────────────────
  useEffect(() => {
    if (!didInitialScroll.current) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.id === lastMsgIdRef.current) return;
    lastMsgIdRef.current = lastMsg.id;
    // Only auto-scroll if the user is near the bottom
    const el = containerRef.current;
    if (el) {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distFromBottom < 120) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages]);

  // ─── Load older messages when user scrolls near top ─────────────────────────
  const handleLoadOlder = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    prevScrollHeight.current = containerRef.current?.scrollHeight ?? 0;
    fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop < 60) handleLoadOlder();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [handleLoadOlder]);

  // Reset state when channel changes
  useEffect(() => {
    didInitialScroll.current = false;
    prevScrollHeight.current = 0;
    prevPagesLen.current = 0;
    lastMsgIdRef.current = undefined;
  }, [channelId]);

  // ─── Mention handling ────────────────────────────────────────────────────────

  const filteredMembers =
    mentionQuery !== null
      ? spaceMembers
          .filter((m) =>
            (m.displayName || m.email || "")
              .toLowerCase()
              .includes(mentionQuery.toLowerCase()),
          )
          .slice(0, 6)
      : [];

  const handleTextChange = (val: string) => {
    setText(val);
    const bracketMatch = val.match(/@\[([^\]]*)$/);
    const wordMatch = val.match(/@(\S*)$/);
    if (bracketMatch) setMentionQuery(bracketMatch[1]);
    else if (wordMatch) setMentionQuery(wordMatch[1]);
    else setMentionQuery(null);
  };

  const insertMention = (m: Member) => {
    const name = m.displayName || m.email || "User";
    const token = name.includes(" ") ? `@[${name}]` : `@${name}`;
    const newText = text.replace(/@\[?[^\]]*$/, token + " ");
    setText(newText);
    setMentionQuery(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const renderMessageText = (msg: ChatMessage, isMe: boolean) => {
    const mentionedMembers = (msg.mentions || [])
      .map((id) => spaceMembers.find((m) => m.id === id))
      .filter(Boolean) as Member[];
    const parts = msg.text.split(/((?:@\[[^\]]+\])|(?:@\S+))/g);
    return parts.map((part, idx) => {
      if (!part.startsWith("@")) return <span key={idx}>{part}</span>;
      let display: string;
      let lookup: string;
      if (part.startsWith("@[") && part.endsWith("]")) {
        lookup = part.slice(2, -1);
        display = "@" + lookup;
      } else {
        lookup = part.slice(1).replace(/[.,!?]+$/, "");
        display = part;
      }
      const matched = mentionedMembers.find(
        (m) => (m.displayName || m.email || "").toLowerCase() === lookup.toLowerCase(),
      );
      if (!matched)
        return <span key={idx} className="font-semibold opacity-80">{display}</span>;
      const isSelf = matched.id === userDoc?.id;
      return (
        <span
          key={idx}
          className={cn(
            "rounded px-0.5 font-semibold",
            isSelf
              ? isMe ? "bg-white/25 text-white" : "bg-primary/20 text-primary"
              : isMe ? "bg-white/15 text-white/90" : "bg-muted text-foreground",
          )}
        >
          {display}
        </span>
      );
    });
  };

  const parseMentionIds = (txt: string): string[] => {
    const regex = /@\[([^\]]+)\]|@(\S+)/g;
    const ids: string[] = [];
    let m;
    while ((m = regex.exec(txt)) !== null) {
      const q = (m[1] || m[2]).toLowerCase().replace(/[.,!?]+$/, "");
      const found = spaceMembers.find(
        (mb) =>
          (mb.displayName || mb.email || "").toLowerCase() === q ||
          (mb.displayName || mb.email || "").toLowerCase().startsWith(q),
      );
      if (found && found.id !== (userDoc?.id || "")) ids.push(found.id);
    }
    return [...new Set(ids)];
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !userDoc) return;
    const mentions = parseMentionIds(text);
    const payload = {
      text: text.trim(),
      mentions,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            text: replyingTo.deleted ? "[deleted]" : replyingTo.text.slice(0, 80),
            senderName: replyingTo.senderName,
          }
        : null,
    };
    setText("");
    setReplyingTo(null);
    sendMessage.mutate(payload);
  };

  const handleEdit = (msgId: string) => {
    if (!editText.trim()) return;
    editMessage.mutate({ msgId, text: editText.trim() }, { onSuccess: () => setEditingId(null) });
  };

  const handleDelete = (msgId: string) => {
    deleteMessage.mutate(msgId);
  };

  const handleReact = (msgId: string, emoji: string) => {
    toggleReaction.mutate({ msgId, emoji });
  };

  return (
    <div className={cn("flex flex-col h-full", className)} onClick={() => setEmojiPickerId(null)}>
      {/* Channel header */}
      {(channelName || (isAdmin && onClearChat)) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50 shrink-0">
          {channelName && (
            <span className="text-sm font-semibold text-foreground truncate">
              # {channelName}
            </span>
          )}
          {isAdmin && onClearChat && (
            <button
              onClick={onClearChat}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors ml-auto"
            >
              <Trash2 className="w-3 h-3" /> Clear chat
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-0.5 min-h-0"
      >
        {/* Load older indicator at the very top */}
        <div className="flex justify-center py-2 min-h-[24px]">
          {isFetchingNextPage ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : hasNextPage ? (
            <button
              onClick={handleLoadOlder}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Load older messages
            </button>
          ) : messages.length > 0 ? (
            <span className="text-xs text-muted-foreground/40">Beginning of conversation</span>
          ) : null}
        </div>

        {loading ? (
          <div className="space-y-4 pt-2">
            {[1, 2, 3].map((i) => (
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
            const showHeader =
              !prev ||
              prev.senderId !== msg.senderId ||
              new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() > 300000;
            const canEdit = isMe && !msg.deleted && !msg.pending;
            const canDelete = (isMe || isAdmin) && !msg.deleted && !msg.pending;
            const msgReactions = (msg.reactions || {}) as Record<string, string[]>;
            const hasReactions = Object.values(msgReactions).some((arr) => arr.length > 0);

            return (
              <div
                key={msg.id}
                className="group relative"
                onMouseEnter={() => setHoveredId(msg.id)}
                onMouseLeave={() => setHoveredId(null)}
                dir="rtl"
              >
                {showHeader && (
                  <div className={cn("flex items-center gap-2 mt-3 mb-0.5", isMe && "flex-row-reverse")}>
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        isMe ? "bg-primary/30 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {(msg.senderName || "U")[0].toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      {isMe ? "You" : msg.senderName}
                    </span>
                    <span className="text-xs text-muted-foreground/50">
                      {format(new Date(msg.createdAt), "HH:mm")}
                    </span>
                  </div>
                )}

                <div className={cn("flex gap-2 items-end", isMe && "flex-row-reverse")}>
                  <div className={cn("flex flex-col max-w-[75%]", isMe && "items-end")}>
                    {msg.replyTo && (
                      <div
                        className={cn(
                          "flex items-start gap-1.5 px-2 py-1 mb-1 bg-muted/50 border-primary/50 text-xs text-muted-foreground max-w-full overflow-hidden",
                          isMe ? "border-e-2 rounded-s text-end" : "border-s-2 rounded-e",
                        )}
                      >
                        <Reply className="w-3 h-3 shrink-0 mt-0.5 rtl:scale-x-[-1]" />
                        <span className="truncate">
                          <strong>{msg.replyTo.senderName}:</strong> {msg.replyTo.text}
                        </span>
                      </div>
                    )}

                    {editingId === msg.id ? (
                      <div className="flex items-center gap-2 min-w-50">
                        <input
                          autoFocus
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleEdit(msg.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="flex-1 px-3 py-2 text-sm bg-background border border-primary/40 rounded-xl focus:outline-none"
                        />
                        <button onClick={() => handleEdit(msg.id)} className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        dir="auto"
                        className={cn(
                          "px-3 py-2 rounded-2xl text-sm wrap-break-word leading-relaxed",
                          msg.pending && "opacity-60",
                          msg.deleted
                            ? "italic text-muted-foreground bg-muted/30 border border-border"
                            : isMe
                              ? "bg-primary text-primary-foreground rounded-tl-sm"
                              : "bg-card border border-border text-foreground rounded-tr-sm",
                        )}
                      >
                        {msg.deleted ? t.deletedMessage : renderMessageText(msg, isMe)}
                        {msg.pending && <Clock className="inline-block w-3 h-3 ml-1 opacity-60 align-middle" />}
                        {msg.edited && !msg.deleted && (
                          <span className="ml-1 text-[10px] opacity-50">({t.edited})</span>
                        )}
                      </div>
                    )}

                    {hasReactions && !msg.deleted && (
                      <div className={cn("flex flex-wrap gap-1 mt-1", isMe && "justify-end")}>
                        {Object.entries(msgReactions)
                          .filter(([, arr]) => arr.length > 0)
                          .map(([emoji, users]) => (
                            <button
                              key={emoji}
                              onClick={(e) => { e.stopPropagation(); handleReact(msg.id, emoji); }}
                              className={cn(
                                "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-all",
                                users.includes(userDoc?.id || "")
                                  ? "bg-primary/10 border-primary/30 text-primary"
                                  : "bg-card border-border text-muted-foreground hover:bg-muted",
                              )}
                            >
                              {emoji} <span>{users.length}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  {hoveredId === msg.id && !msg.deleted && !msg.pending && editingId !== msg.id && (
                    <div className={cn("flex items-center gap-0.5 shrink-0 mb-1", isMe ? "me-1" : "ms-1")}>
                      <div className="flex items-center gap-0.5 bg-card border border-border rounded-xl shadow-md px-1 py-0.5">
                        <div className="relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEmojiPickerId(emojiPickerId === msg.id ? null : msg.id); }}
                            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                          >
                            <Smile className="w-3.5 h-3.5" />
                          </button>
                          {emojiPickerId === msg.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className={cn(
                                "absolute bottom-full mb-1 bg-card border border-border rounded-2xl shadow-xl p-2 flex gap-1.5 z-50",
                                isMe ? "end-0" : "start-0",
                              )}
                            >
                              {QUICK_EMOJIS.map((em) => (
                                <button
                                  key={em}
                                  onClick={() => { handleReact(msg.id, em); setEmojiPickerId(null); }}
                                  className="text-base hover:scale-125 transition-transform p-0.5"
                                >
                                  {em}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => { setReplyingTo(msg); inputRef.current?.focus(); }}
                          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                        >
                          <Reply className="w-3.5 h-3.5" />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => { setEditingId(msg.id); setEditText(msg.text); }}
                            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                          >
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
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-t border-primary/20 overflow-hidden shrink-0"
          >
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
      <form onSubmit={handleSend} className="relative p-3 border-t border-border shrink-0">
        <AnimatePresence>
          {mentionQuery !== null && filteredMembers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute bottom-full left-3 right-3 mb-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
            >
              {filteredMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => insertMention(m)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left border-b border-border/50 last:border-0"
                >
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
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && mentionQuery !== null) setMentionQuery(null);
            }}
            placeholder="Message... use @ to mention someone"
            dir="auto"
            className="flex-1 px-4 py-2.5 text-sm bg-card border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="flex items-center justify-center w-9 h-9 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
