import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, ArrowLeft, MessageCircle } from "lucide-react";
import { useSpaceMembers } from "@/hooks/useSpaces";
import { useLang } from "@/contexts/LangContext";
import { useSpaceChannels, useCreateChannel } from "@/hooks/useChatQueries";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { cn } from "@/lib/utils";

interface Props {
  spaceId: string;
  isAdmin: boolean;
  userId: string;
  initialChannelId?: string;
}

export function SpaceChatTab({ spaceId, isAdmin, userId, initialChannelId }: Props) {
  const { t } = useLang();
  const { data: spaceMembers = [] } = useSpaceMembers(spaceId);
  const { data: spaceChannels = [], isLoading: channelsLoading } = useSpaceChannels(spaceId);
  const createChannel = useCreateChannel();

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");

  useEffect(() => {
    if (channelsLoading) return;
    if (spaceChannels.length === 0) {
      createChannel.mutate(
        { name: "general", description: "Space discussion", spaceId, isPrivate: false, memberIds: [] },
        { onSuccess: (ch) => setSelectedChannelId(ch.id) },
      );
    } else if (initialChannelId && spaceChannels.some((c) => c.id === initialChannelId)) {
      setSelectedChannelId(initialChannelId);
    } else if (!selectedChannelId) {
      setSelectedChannelId(spaceChannels[0].id);
    }
  }, [spaceChannels, channelsLoading, initialChannelId]);

  const handleCreateChannel = () => {
    if (!newChannelName.trim()) return;
    createChannel.mutate(
      {
        name: newChannelName.trim().toLowerCase().replace(/\s+/g, "-"),
        description: "",
        spaceId,
        isPrivate: false,
        memberIds: [],
      },
      {
        onSuccess: (ch) => {
          setSelectedChannelId(ch.id);
          setNewChannelName("");
          setShowCreateChannel(false);
        },
      },
    );
  };

  return (
    <motion.div
      key="chat"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex min-h-0 overflow-hidden"
    >
      <div className={cn(
        "shrink-0 border-r border-border flex flex-col bg-muted/20",
        "w-full md:w-44 md:flex",
        selectedChannelId ? "hidden md:flex" : "flex",
      )}>
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Channels</span>
          {isAdmin && (
            <button
              onClick={() => setShowCreateChannel((v) => !v)}
              className="text-muted-foreground hover:text-primary transition-colors"
              title="Add channel"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {showCreateChannel && (
          <div className="px-2 py-2 border-b border-border space-y-1.5">
            <input
              autoFocus
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateChannel();
                if (e.key === "Escape") setShowCreateChannel(false);
              }}
              placeholder="channel-name"
              className="w-full px-2 py-1 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <button
              onClick={handleCreateChannel}
              disabled={createChannel.isPending || !newChannelName.trim()}
              className="w-full py-1 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {createChannel.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto py-1">
          {spaceChannels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setSelectedChannelId(ch.id)}
              className={cn(
                "w-full text-start px-3 py-2 text-sm md:text-xs transition-colors rounded-md mx-1 my-0.5",
                selectedChannelId === ch.id
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              # {ch.name}
            </button>
          ))}
          {spaceChannels.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">No channels yet</p>
          )}
        </div>
      </div>

      <div className={cn("flex-1 min-w-0 flex flex-col", selectedChannelId ? "flex" : "hidden md:flex")}>
        {selectedChannelId ? (
          <>
            <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
              <button
                onClick={() => setSelectedChannelId(null)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-foreground">
                # {spaceChannels.find((c) => c.id === selectedChannelId)?.name}
              </span>
            </div>
            <ChatPanel
              channelId={selectedChannelId}
              channelName={spaceChannels.find((c) => c.id === selectedChannelId)?.name}
              spaceId={spaceId}
              spaceMembers={spaceMembers.map((m) => ({ id: m.id, displayName: m.displayName, email: m.email }))}
              className="flex-1 min-h-0"
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground">
            <MessageCircle className="w-8 h-8 opacity-20 mb-2" />
            <p className="text-sm">Select a channel to start chatting</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
