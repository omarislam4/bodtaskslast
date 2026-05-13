import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Plus, X, Trash2, Zap, ChevronRight } from "lucide-react";
import { collection, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";
import { useEffect } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AutomationRule {
  id: string;
  name: string;
  triggerType: string;
  triggerValue: string;
  conditionType?: string;
  conditionValue?: string;
  actionType: string;
  actionValue: string;
  enabled: boolean;
  runCount: number;
  createdBy: string;
  createdAt: Date;
  lastRunAt?: Date;
}

const TRIGGER_TYPES = [
  { value: "status_changes",    label: "Status changes to" },
  { value: "priority_changes",  label: "Priority changes to" },
  { value: "assignee_added",    label: "Assignee is added" },
  { value: "task_created",      label: "Task is created" },
  { value: "due_date_reaches",  label: "Due date reaches" },
];

const ACTION_TYPES = [
  { value: "change_status",    label: "Change status to" },
  { value: "change_priority",  label: "Change priority to" },
  { value: "send_notification", label: "Send notification" },
  { value: "create_task",       label: "Create a task" },
  { value: "webhook",           label: "Call webhook" },
];

const STATUS_VALUES = ["todo","in-progress","review","done","blocked"];
const PRIORITY_VALUES = ["low","medium","high","urgent"];

export default function Automations() {
  const { userDoc } = useAuth();
  const { t } = useLang();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "", triggerType: "status_changes", triggerValue: "done",
    conditionType: "", conditionValue: "", actionType: "send_notification", actionValue: "Task completed!",
  });

  useEffect(() => {
    const q = query(collection(db, "automations"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      setRules(snap.docs.map(d => {
        const data = d.data();
        return { ...data, id: d.id, createdAt: data.createdAt?.toDate?.() ?? new Date(), lastRunAt: data.lastRunAt?.toDate?.() ?? undefined } as AutomationRule;
      }));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      await addDoc(collection(db, "automations"), {
        name: form.name, triggerType: form.triggerType, triggerValue: form.triggerValue,
        conditionType: form.conditionType || null, conditionValue: form.conditionValue || null,
        actionType: form.actionType, actionValue: form.actionValue,
        enabled: true, runCount: 0,
        createdBy: userDoc?.id || "", createdAt: serverTimestamp(),
      });
      toast.success("Automation created!");
      setShowCreate(false);
      setForm({ name: "", triggerType: "status_changes", triggerValue: "done", conditionType: "", conditionValue: "", actionType: "send_notification", actionValue: "Task completed!" });
    } catch { toast.error("Failed to create automation"); }
    finally { setCreating(false); }
  };

  const toggleEnabled = async (rule: AutomationRule) => {
    try { await updateDoc(doc(db, "automations", rule.id), { enabled: !rule.enabled }); }
    catch { toast.error("Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this automation?")) return;
    try { await deleteDoc(doc(db, "automations", id)); toast.success("Deleted"); }
    catch { toast.error("Failed"); }
  };

  const getTriggerLabel = (rule: AutomationRule) => TRIGGER_TYPES.find(t => t.value === rule.triggerType)?.label || rule.triggerType;
  const getActionLabel = (rule: AutomationRule) => ACTION_TYPES.find(a => a.value === rule.actionType)?.label || rule.actionType;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t.automations}</h1>
            <p className="text-sm text-muted-foreground">{rules.length} rules · {rules.filter(r => r.enabled).length} active</p>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all">
          <Plus className="w-4 h-4" /> {t.newAutomation}
        </motion.button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
        <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">Automations are stored and can be executed via n8n or a Cloud Function. Rules trigger on matching task updates within the app.</p>
      </div>

      {/* Rules list */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Bot className="w-12 h-12 opacity-20 mb-3" />
          <p className="font-semibold">{t.noAutomations}</p>
          <p className="text-sm">{t.noAutomationsDesc}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <motion.div key={rule.id} layout className={cn("bg-card border rounded-xl p-4 transition-all", rule.enabled ? "border-border" : "border-border/50 opacity-60")}>
              <div className="flex items-start gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", rule.enabled ? "bg-primary/10" : "bg-muted")}>
                  <Bot className={cn("w-4 h-4", rule.enabled ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground">{rule.name}</h3>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", rule.enabled ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground")}>
                      {rule.enabled ? "Active" : "Inactive"}
                    </span>
                    <span className="text-xs text-muted-foreground ms-auto">{rule.runCount} runs</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-lg">
                      WHEN: {getTriggerLabel(rule)} <strong className="text-foreground">{rule.triggerValue}</strong>
                    </span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="bg-purple-500/10 text-purple-400 px-2 py-1 rounded-lg">
                      THEN: {getActionLabel(rule)} <strong className="text-foreground">{rule.actionValue}</strong>
                    </span>
                  </div>
                  {rule.lastRunAt && (
                    <p className="text-xs text-muted-foreground/60 mt-1">Last run: {format(rule.lastRunAt, "MMM d, HH:mm")}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleEnabled(rule)}
                    className={cn("w-10 h-5 rounded-full transition-all relative", rule.enabled ? "bg-primary" : "bg-muted")}>
                    <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm", rule.enabled ? "translate-x-5" : "translate-x-0.5")} />
                  </button>
                  <button onClick={() => handleDelete(rule.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
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
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-foreground">{t.createAutomation}</h2>
                <button onClick={() => setShowCreate(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder={t.automationName}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" />

                <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-3">
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide">{t.triggerLabel}</p>
                  <select value={form.triggerType} onChange={e => setForm(p => ({ ...p, triggerType: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {TRIGGER_TYPES.map(tt => <option key={tt.value} value={tt.value}>{tt.label}</option>)}
                  </select>
                  {(form.triggerType === "status_changes") && (
                    <select value={form.triggerValue} onChange={e => setForm(p => ({ ...p, triggerValue: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30">
                      {STATUS_VALUES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                  {(form.triggerType === "priority_changes") && (
                    <select value={form.triggerValue} onChange={e => setForm(p => ({ ...p, triggerValue: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30">
                      {PRIORITY_VALUES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  )}
                  {(form.triggerType !== "status_changes" && form.triggerType !== "priority_changes") && (
                    <input value={form.triggerValue} onChange={e => setForm(p => ({ ...p, triggerValue: e.target.value }))}
                      placeholder="Value..."
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  )}
                </div>

                <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-3">
                  <p className="text-xs font-semibold text-purple-400 uppercase tracking-wide">{t.actionLabel}</p>
                  <select value={form.actionType} onChange={e => setForm(p => ({ ...p, actionType: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {ACTION_TYPES.map(at => <option key={at.value} value={at.value}>{at.label}</option>)}
                  </select>
                  <input value={form.actionValue} onChange={e => setForm(p => ({ ...p, actionValue: e.target.value }))}
                    placeholder="Action value..."
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)}
                    className="flex-1 px-4 py-2 text-sm font-semibold border border-border rounded-xl text-muted-foreground hover:bg-muted transition-all">{t.cancel}</button>
                  <button type="submit" disabled={creating}
                    className="flex-1 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-all">
                    {creating ? t.creating : t.createAutomation}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
