import { useRef, useState } from "react";
import { Paperclip, UploadCloud, X } from "lucide-react";
import { useLang } from "@/contexts/LangContext";

type Props = {
  value: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  accentColor?: string;
};

export default function FileDropZone({ value, onChange, accept, accentColor = "primary" }: Props) {
  const { t } = useLang();
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const clear = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onChange(file);
  };

  if (value) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 bg-background border border-input rounded-xl text-sm">
        <Paperclip className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="truncate text-foreground flex-1">{value.name}</span>
        <button
          type="button"
          onClick={clear}
          className="text-muted-foreground hover:text-destructive transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        data-dragging={isDragging}
        data-accent={accentColor}
        className={`flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed cursor-pointer transition-all select-none
          ${isDragging
            ? `border-${accentColor}-500 bg-${accentColor}-500/5 text-${accentColor}-500`
            : `border-input text-muted-foreground hover:border-${accentColor}-500/50 hover:text-foreground`
          }`}
      >
        <UploadCloud className={`w-6 h-6 transition-transform ${isDragging ? "scale-110" : ""}`} />
        <p className="text-sm font-medium">
          {isDragging ? t.attachmentDropActive : t.attachmentFile}
        </p>
        <p className="text-xs opacity-60">{t.attachmentDropHint}</p>
      </div>
    </>
  );
}
