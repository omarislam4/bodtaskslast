import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Files, Paperclip, Plus, Trash2 } from "lucide-react";
import { useSpaceAttachments, useAddSpaceAttachment, useDeleteSpaceAttachment } from "@/hooks/useSpaces";
import { useLang } from "@/contexts/LangContext";
import { EmptyState } from "@/components/shared/EmptyState";
import FileDropZone from "@/components/ui/file-drop-zone";
import { cn } from "@/lib/utils";

interface Props {
  spaceId: string;
  isAdmin: boolean;
}

export function SpaceAttachmentsTab({ spaceId, isAdmin }: Props) {
  const { t } = useLang();
  const { data: attachments = [], isLoading } = useSpaceAttachments(spaceId);
  const addAttachment = useAddSpaceAttachment();
  const deleteAttachment = useDeleteSpaceAttachment();

  const [showInput, setShowInput] = useState(false);
  const [attachmentType, setAttachmentType] = useState<"file" | "link">("file");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const resetForm = () => {
    setShowInput(false);
    setTitle("");
    setUrl("");
    setFile(null);
    setAttachmentType("file");
  };

  const handleAdd = () => {
    if (attachmentType === "link") {
      if (!url.trim()) return;
      addAttachment.mutate(
        { spaceId, payload: { type: "link", title: title.trim() || undefined, url: url.trim() } },
        { onSuccess: resetForm },
      );
      return;
    }
    if (!file) return;
    addAttachment.mutate(
      { spaceId, payload: { type: "file", title: title.trim() || undefined, file } },
      { onSuccess: resetForm },
    );
  };

  const handleDelete = (attachmentId: string) => {
    if (!window.confirm(`${t.delete} ${t.taskAttachments}?`)) return;
    deleteAttachment.mutate({ spaceId, attachmentId });
  };

  return (
    <motion.div
      key="attachments"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-4 sm:p-6 max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Files className="w-4 h-4 text-muted-foreground" /> {t.taskAttachments}
        </h2>
        <button
          onClick={() => setShowInput(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> {t.add}
        </button>
      </div>

      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card border border-border rounded-xl p-4 sm:p-5 mb-5 overflow-hidden shadow-md space-y-3"
          >
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAttachmentType("file")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-all",
                  attachmentType === "file"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {t.attachmentTypeFile}
              </button>
              <button
                type="button"
                onClick={() => setAttachmentType("link")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-all",
                  attachmentType === "link"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {t.attachmentTypeLink}
              </button>
            </div>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.attachmentTitlePlaceholder}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />

            {attachmentType === "link" ? (
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t.attachmentLinkPlaceholder}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            ) : (
              <FileDropZone value={file} onChange={setFile} />
            )}

            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleAdd}
                disabled={
                  addAttachment.isPending ||
                  (attachmentType === "link" ? !url.trim() : !file)
                }
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {addAttachment.isPending ? t.adding : t.add}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="space-y-2">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : attachments.length === 0 ? (
        !showInput && (
          <EmptyState icon={Files} title={t.noAttachmentsYet} description="" />
        )
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {attachment.title || attachment.fileName || attachment.url || t.taskAttachments}
                  </p>
                  {attachment.url && (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-xs text-primary hover:underline"
                    >
                      {attachment.url}
                    </a>
                  )}
                </div>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleDelete(attachment.id)}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive shrink-0"
                  aria-label={t.delete}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
