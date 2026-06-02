import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Plus, Hash, X, Trash2, AlertCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { useSpaceChannels, useCreateChannel, useDeleteChannel } from "@/hooks/useChatQueries";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useMembers } from "@/hooks/useMembers";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Chat() {
  const { isAdmin } = useAuth();
  const { t, isRTL } = useLang();
  const { data: channels = [], isLoading: channelsLoading } = useSpaceChannels();
  const { members } = useMembers();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const createChannel = useCreateChannel();
  const deleteChannel = useDeleteChannel();

  const search = useSearch();
  const [, navigate] = useLocation();
  const globalChannels = channels.filter(c => !c.spaceId);
  const selectedChannel = globalChannels.find(c => c.id === selectedChannelId);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const channelFromUrl = params.get("channel");
    if (channelFromUrl && globalChannels.some((c) => c.id === channelFromUrl)) {
      setSelectedChannelId(channelFromUrl);
      navigate("/chat", { replace: true });
    } else if (globalChannels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(globalChannels[0].id);
    }
  }, [search, globalChannels]);

  useEffect(() => {
    if (!channelsLoading && globalChannels.length === 0) {
      createChannel.mutate({
        name: "general",
        description: "General discussions",
        spaceId: undefined,
        isPrivate: false,
        memberIds: [],
      }, {
        onSuccess: (ch) => setSelectedChannelId(ch.id),
      });
    }
  }, [channelsLoading, globalChannels.length]);

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    createChannel.mutate({
      name: newChannelName.toLowerCase().replace(/\s+/g, "-"),
      description: newChannelDesc,
      spaceId: undefined,
      isPrivate: false,
      memberIds: [],
    }, {
      onSuccess: (ch) => {
        setSelectedChannelId(ch.id);
        setShowNewChannel(false);
        setNewChannelName("");
        setNewChannelDesc("");
      },
      onError: () => toast.error("Failed to create channel"),
    });
  };

  const handleDeleteChannel = (channelId: string) => {
    deleteChannel.mutate(channelId, {
      onSuccess: () => {
        if (selectedChannelId === channelId) {
          const remaining = globalChannels.filter(c => c.id !== channelId);
          setSelectedChannelId(remaining.length > 0 ? remaining[0].id : null);
        }
        setShowDeleteConfirm(null);
        toast.success("Channel deleted");
      },
      onError: () => toast.error("Failed to delete channel"),
    });
  };

  const mobileShowChat = !!selectedChannelId;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden">
      {/* Channel sidebar */}
      <div className={cn(
        "bg-sidebar border-border flex flex-col shrink-0",
        "w-full md:w-56 md:border-r md:flex",
        mobileShowChat ? "hidden md:flex" : "flex border-r"
      )}>
        <div className="flex items-center justify-between p-3 border-b border-sidebar-border/50">
          <span className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60">{t.channels}</span>
          <button onClick={() => setShowNewChannel(v => !v)} className="p-1 text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {channelsLoading ? (
            <div className="space-y-2 p-2">{[1, 2, 3].map(i => <div key={i} className="h-7 bg-white/10 rounded animate-pulse" />)}</div>
          ) : (
            globalChannels.map(ch => (
              <div key={ch.id} className="group relative flex items-center">
                <button onClick={() => setSelectedChannelId(ch.id)}
                  className={cn("flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-lg text-sm transition-all text-start",
                    selectedChannelId === ch.id ? "bg-primary/20 text-primary" : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/10")}>
                  <Hash className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{ch.name}</span>
                </button>
                {isAdmin && (
                  <button onClick={() => setShowDeleteConfirm(ch.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 me-1 text-sidebar-foreground/40 hover:text-red-400 transition-all shrink-0">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </nav>

        {/* New channel form */}
        <AnimatePresence>
          {showNewChannel && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="border-t border-sidebar-border overflow-hidden">
              <form onSubmit={handleCreateChannel} className="p-3 space-y-2">
                <input required value={newChannelName} onChange={e => setNewChannelName(e.target.value)}
                  placeholder={t.channelNamePlaceholder}
                  className="w-full px-2 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none" />
                <input value={newChannelDesc} onChange={e => setNewChannelDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full px-2 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowNewChannel(false)} className="flex-1 py-1.5 text-xs text-sidebar-foreground/40 border border-white/10 rounded-lg">Cancel</button>
                  <button type="submit" disabled={createChannel.isPending} className="flex-1 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg disabled:opacity-60">
                    {createChannel.isPending ? "..." : "Create"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main chat area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        mobileShowChat ? "flex" : "hidden md:flex"
      )}>
        {selectedChannel ? (
          <>
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => setSelectedChannelId(null)}
                  className="md:hidden p-1.5 -ms-1 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
                >
                  <ArrowLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
                </button>
                <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
                <h2 className="font-semibold text-foreground truncate">{selectedChannel.name}</h2>
                {selectedChannel.description && (
                  <span className="text-sm text-muted-foreground truncate hidden sm:inline">— {selectedChannel.description}</span>
                )}
              </div>
              {isAdmin && (
                <button onClick={() => setShowDeleteConfirm(selectedChannel.id)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0 px-2 py-1 rounded-lg hover:bg-destructive/10">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete channel</span>
                </button>
              )}
            </div>

            <ChatPanel
              channelId={selectedChannel.id}
              spaceMembers={members.map(m => ({ id: m.id, displayName: m.displayName, email: m.email }))}
              className="flex-1 min-h-0"
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="w-12 h-12 opacity-20 mb-3" />
            <p className="font-semibold">{t.channels}</p>
            <p className="text-sm">Select a channel to start chatting</p>
          </div>
        )}
      </div>

      {/* Delete channel confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Delete Channel</h3>
                  <p className="text-xs text-muted-foreground">This will delete all messages permanently</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 text-sm border border-border rounded-xl text-muted-foreground hover:bg-muted">
                  Cancel
                </button>
                <button onClick={() => handleDeleteChannel(showDeleteConfirm)} disabled={deleteChannel.isPending}
                  className="flex-1 px-4 py-2 text-sm font-semibold bg-destructive text-destructive-foreground rounded-xl hover:bg-destructive/90 disabled:opacity-60">
                  {deleteChannel.isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
