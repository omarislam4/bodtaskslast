import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Plus, X, Copy, Trash2, ExternalLink, ChevronUp, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { useForms, Form, FormField, FormFieldType, useCreateForm, useDeleteForm } from "@/hooks/useForms";
import { useSpaces } from "@/hooks/useSpaces";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const FIELD_TYPE_CONFIG: Record<FormFieldType, { label: string; color: string }> = {
  text:     { label: "Text",     color: "text-blue-400" },
  number:   { label: "Number",   color: "text-purple-400" },
  date:     { label: "Date",     color: "text-orange-400" },
  dropdown: { label: "Dropdown", color: "text-green-400" },
  checkbox: { label: "Checkbox", color: "text-yellow-400" },
  email:    { label: "Email",    color: "text-red-400" },
};

export default function Forms() {
  const { userDoc } = useAuth();
  const { t } = useLang();
  const { forms, loading } = useForms();
  const createForm = useCreateForm();
  const deleteForm = useDeleteForm();
  const { spaces } = useSpaces();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", spaceId: "" });
  const [fields, setFields] = useState<FormField[]>([
    { id: "f1", type: "text", label: "Name", required: true },
    { id: "f2", type: "text", label: "Description", required: false },
  ]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addField = () => {
    const newField: FormField = { id: `f${Date.now()}`, type: "text", label: "New Field", required: false };
    setFields(prev => [...prev, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => setFields(prev => prev.filter(f => f.id !== id));

  const moveField = (id: string, dir: "up" | "down") => {
    const idx = fields.findIndex(f => f.id === id);
    if (dir === "up" && idx === 0) return;
    if (dir === "down" && idx === fields.length - 1) return;
    const newFields = [...fields];
    const swap = dir === "up" ? idx - 1 : idx + 1;
    [newFields[idx], newFields[swap]] = [newFields[swap], newFields[idx]];
    setFields(newFields);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      await createForm.mutateAsync({
        ...form, fields, isPublic: true, createdBy: userDoc?.id || "",
      });
      setShowCreate(false);
      setForm({ title: "", description: "", spaceId: "" });
      setFields([{ id: "f1", type: "text", label: "Name", required: true }, { id: "f2", type: "text", label: "Description", required: false }]);
    } catch { /* handled by hook */ }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this form?")) return;
    deleteForm.mutate(id);
  };

  const getPublicLink = (id: string) => {
    const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
    return `${window.location.origin}${base}/form/${id}`;
  };

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(getPublicLink(id));
    toast.success("Link copied!");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t.forms}</h1>
            <p className="text-sm text-muted-foreground">{forms.length} forms</p>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all">
          <Plus className="w-4 h-4" /> {t.newForm}
        </motion.button>
      </div>

      {/* Forms list */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ClipboardList className="w-12 h-12 opacity-20 mb-3" />
          <p className="font-semibold">{t.noForms}</p>
          <p className="text-sm">{t.noFormsDesc}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {forms.map(form => {
            const space = spaces.find(s => s.id === form.spaceId);
            const isExpanded = expandedId === form.id;
            return (
              <motion.div key={form.id} layout className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : form.id)}>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{form.title}</h3>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{form.fields.length} fields</span>
                      {space && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: space.color }} />{space.name}
                        </span>
                      )}
                    </div>
                    {form.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{form.description}</p>}
                    <p className="text-xs text-muted-foreground/60 mt-0.5">{form.submissionCount} submissions · Created {format(form.createdAt, "MMM d, yyyy")}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={e => { e.stopPropagation(); copyLink(form.id); }}
                      className="flex items-center gap-1 text-xs px-2 py-1 bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all">
                      <Copy className="w-3 h-3" /> {t.copyLink}
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(form.id); }}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden">
                      <div className="px-4 pb-4 border-t border-border pt-3 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Form Fields</p>
                        {form.fields.map(field => (
                          <div key={field.id} className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                            <span className={cn("text-xs font-medium", FIELD_TYPE_CONFIG[field.type]?.color)}>{FIELD_TYPE_CONFIG[field.type]?.label}</span>
                            <span className="text-sm text-foreground flex-1">{field.label}</span>
                            {field.required && <span className="text-xs text-red-500">Required</span>}
                          </div>
                        ))}
                        <div className="flex items-center gap-2 pt-2">
                          <p className="text-xs text-muted-foreground">{t.publicFormLink}:</p>
                          <code className="text-xs bg-muted px-2 py-1 rounded text-primary truncate flex-1">{getPublicLink(form.id)}</code>
                          <button onClick={() => window.open(getPublicLink(form.id), "_blank")}
                            className="p-1 text-muted-foreground hover:text-foreground">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-foreground">{t.createForm}</h2>
                <button onClick={() => setShowCreate(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder={t.formTitleLabel}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder={t.description} rows={2}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                <select value={form.spaceId} onChange={e => setForm(p => ({ ...p, spaceId: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">{t.formLinkedSpace} (optional)</option>
                  {spaces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                {/* Fields builder */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-foreground">{t.formField}</p>
                    <button type="button" onClick={addField} className="text-xs text-primary hover:text-primary/80 font-medium">{t.addFormField}</button>
                  </div>
                  <div className="space-y-2">
                    {fields.map((field, i) => (
                      <div key={field.id} className="flex items-center gap-2 p-3 bg-muted/50 border border-border rounded-xl">
                        <div className="flex flex-col gap-0.5">
                          <button type="button" onClick={() => moveField(field.id, "up")} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button type="button" onClick={() => moveField(field.id, "down")} disabled={i === fields.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                        <select value={field.type} onChange={e => updateField(field.id, { type: e.target.value as FormFieldType })}
                          className="text-xs px-2 py-1.5 bg-background border border-input rounded-lg focus:outline-none w-24">
                          {Object.entries(FIELD_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <input value={field.label} onChange={e => updateField(field.id, { label: e.target.value })}
                          placeholder="Field label" className="flex-1 text-xs px-2 py-1.5 bg-background border border-input rounded-lg focus:outline-none" />
                        <label className="flex items-center gap-1 text-xs text-muted-foreground">
                          <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })} className="accent-primary" />
                          Req
                        </label>
                        <button type="button" onClick={() => removeField(field.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)}
                    className="flex-1 px-4 py-2 text-sm font-semibold border border-border rounded-xl text-muted-foreground hover:bg-muted transition-all">{t.cancel}</button>
                  <button type="submit" disabled={creating}
                    className="flex-1 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-all">
                    {creating ? t.creating : t.createForm}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
