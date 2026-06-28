import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, FolderPlus, Link2, ExternalLink, Trash2, ChevronRight, ChevronDown, Plus } from "lucide-react";
import { useSpaceDataItems, useCreateSpaceDataItem, useDeleteSpaceDataItem } from "@/hooks/useSpaces";
import { useLang } from "@/contexts/LangContext";
import { EmptyState } from "@/components/shared/EmptyState";
import type { SpaceDataItem } from "@/types";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  spaceId: string;
  isAdmin: boolean;
}

export function SpaceDataTab({ spaceId, isAdmin }: Props) {
  const { t } = useLang();
  const { data: dataItems = [], isLoading: dataLoading } = useSpaceDataItems(spaceId);
  const createDataItem = useCreateSpaceDataItem();
  const deleteDataItem = useDeleteSpaceDataItem();

  const [showAddData, setShowAddData] = useState(false);
  const [dataType, setDataType] = useState<"folder" | "link">("link");
  const [dataName, setDataName] = useState("");
  const [dataUrl, setDataUrl] = useState("");
  const [dataNotes, setDataNotes] = useState("");
  const [dataParentId, setDataParentId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddData = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataName.trim()) return;
    createDataItem.mutate(
      {
        spaceId,
        payload: {
          type: dataType,
          name: dataName.trim(),
          url: dataType === "link" ? dataUrl.trim() : undefined,
          notes: dataNotes.trim() || undefined,
          parentId: dataParentId,
        },
      },
      {
        onSuccess: () => {
          setShowAddData(false);
          setDataName("");
          setDataUrl("");
          setDataNotes("");
          setDataParentId(null);
        },
      },
    );
  };

  const handleDeleteData = (itemId: string) => {
    deleteDataItem.mutate({ spaceId, itemId });
  };

  return (
    <motion.div
      key="data"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-4 sm:p-6 max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-foreground">{t.filesLinks}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => { setDataType("folder"); setDataParentId(null); setShowAddData(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" /> {t.newFolder}
          </button>
          <button
            onClick={() => { setDataType("link"); setDataParentId(null); setShowAddData(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Link2 className="w-3.5 h-3.5" /> {t.addLink}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAddData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card border border-border rounded-xl p-4 sm:p-5 mb-5 overflow-hidden shadow-md"
          >
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {dataType === "folder" ? t.createFolder : t.addLink}
            </h3>
            <form onSubmit={handleAddData} className="space-y-3">
              <input
                value={dataName}
                onChange={(e) => setDataName(e.target.value)}
                placeholder={dataType === "folder" ? "Folder name..." : "Link title..."}
                className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
                autoFocus
              />
              {dataType === "link" && (
                <input
                  value={dataUrl}
                  onChange={(e) => setDataUrl(e.target.value)}
                  placeholder="https://... (optional)"
                  type="url"
                  className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              )}
              <textarea
                value={dataNotes}
                onChange={(e) => setDataNotes(e.target.value)}
                placeholder="Add a note or description..."
                rows={2}
                className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
              {dataType === "link" && dataItems.filter((i) => i.type === "folder").length > 0 && (
                <Select value={dataParentId ?? "__root__"} onValueChange={(v) => setDataParentId(v === "__root__" ? null : v)}>
                  <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__root__">{t.rootFolder}</SelectItem>
                    {dataItems.filter((i) => i.type === "folder").map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowAddData(false); setDataName(""); setDataUrl(""); setDataNotes(""); }}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={createDataItem.isPending}
                  className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60"
                >
                  {createDataItem.isPending ? t.adding : dataType === "folder" ? t.createFolder : t.addLink}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {dataLoading ? (
        <div className="space-y-2">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : dataItems.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={t.noFilesYet}
          description={isAdmin ? t.noFilesDesc : t.noFilesAdded}
        />
      ) : (
        <DataTree
          items={dataItems}
          parentId={null}
          expandedFolders={expandedFolders}
          onToggleFolder={toggleFolder}
          isAdmin={isAdmin}
          onDelete={handleDeleteData}
          onAddToFolder={(folderId) => {
            setDataType("link");
            setDataParentId(folderId);
            setShowAddData(true);
          }}
        />
      )}
    </motion.div>
  );
}

function DataTree({
  items,
  parentId,
  expandedFolders,
  onToggleFolder,
  isAdmin,
  onDelete,
  onAddToFolder,
  depth = 0,
}: {
  items: SpaceDataItem[];
  parentId: string | null;
  expandedFolders: Set<string>;
  onToggleFolder: (id: string) => void;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onAddToFolder: (folderId: string) => void;
  depth?: number;
}) {
  const children = items.filter((i) => i.parentId === parentId);
  if (children.length === 0 && depth > 0) {
    return <p className="text-xs text-muted-foreground pl-2 py-1">Empty folder</p>;
  }

  return (
    <div className={cn("space-y-2", depth > 0 && "pl-5 border-l border-border ml-3 mt-2")}>
      {children.map((item) => {
        const isOpen = expandedFolders.has(item.id);
        const hasChildren = items.some((i) => i.parentId === item.id);
        return (
          <div key={item.id}>
            {item.type === "folder" ? (
              <div className="bg-muted/50 hover:bg-muted rounded-xl transition-all group">
                <button
                  onClick={() => onToggleFolder(item.id)}
                  className="flex items-center gap-2 w-full p-3 text-left"
                >
                  {isOpen
                    ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  }
                  <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate flex-1">{item.name}</span>
                  {hasChildren && (
                    <span className="text-xs text-muted-foreground">
                      ({items.filter((i) => i.parentId === item.id).length})
                    </span>
                  )}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onAddToFolder(item.id); }}
                      className="p-1 text-muted-foreground hover:text-primary transition-colors"
                      title="Add link to folder"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </button>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl hover:border-primary/30 transition-all group p-3 shadow-sm">
                <div className="flex items-start gap-2">
                  <Link2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate block"
                    >
                      {item.name}
                      <ExternalLink className="w-3 h-3 inline ml-1 opacity-0 group-hover:opacity-70 transition-opacity" />
                    </a>
                    {item.url && (
                      <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-1 bg-muted rounded-lg px-2 py-1">{item.notes}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
            {item.type === "folder" && isOpen && (
              <DataTree
                items={items}
                parentId={item.id}
                expandedFolders={expandedFolders}
                onToggleFolder={onToggleFolder}
                isAdmin={isAdmin}
                onDelete={onDelete}
                onAddToFolder={onAddToFolder}
                depth={depth + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
