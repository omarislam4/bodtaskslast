import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Plus, Trash2, Edit2, Check, X, Shield, Mail, Phone, Building2 } from "lucide-react";
import { doc, updateDoc, deleteDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { useSenders, Sender } from "@/hooks/useSenders";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/shared/EmptyState";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";

export default function Senders() {
  const { senders, loading } = useSenders();
  const { isAdmin } = useAuth();
  const { t } = useLang();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });
  const [editForm, setEditForm] = useState<Partial<Sender>>({});

  if (!isAdmin) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full">
        <Shield className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-foreground font-semibold">{t.adminRequired}</p>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      await addDoc(collection(db, "senders"), {
        ...form,
        createdAt: serverTimestamp(),
      });
      toast.success(t.addSenderTitle);
      setShowCreate(false);
      setForm({ name: "", email: "", phone: "", company: "" });
    } catch {
      toast.error("Failed to add sender");
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateDoc(doc(db, "senders", id), editForm);
      toast.success(t.save);
      setEditing(null);
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "senders", id));
      toast.success(t.delete);
    } catch {
      toast.error("Failed to delete");
    }
  };

  const fields: { key: "name" | "company" | "email" | "phone"; label: string; placeholder: string; required?: boolean; type?: string }[] = [
    { key: "name", label: t.name, placeholder: "John Smith", required: true },
    { key: "company", label: t.company, placeholder: "Company Inc." },
    { key: "email", label: t.email, placeholder: "john@company.com", type: "email" },
    { key: "phone", label: t.phone, placeholder: "+1 234 567 890" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.senders}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t.sendersDesc}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> {t.addSenderTitle}
        </motion.button>
      </div>

      {showCreate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="bg-card border border-border rounded-xl p-5 mb-6 overflow-hidden"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">{t.addSenderTitle}</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {fields.map(({ key, label, placeholder, required, type }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">{label}</label>
                  <input
                    type={type || "text"}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    required={required}
                    className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-muted-foreground">{t.cancel}</button>
              <button type="submit" className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors">{t.addSenderTitle}</button>
            </div>
          </form>
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : senders.length === 0 ? (
        <EmptyState icon={Send} title={t.noSendersYet} description={t.sendersDesc} action={{ label: t.addSenderTitle, onClick: () => setShowCreate(true) }} />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {senders.map((sender, i) => (
            <motion.div
              key={sender.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-4 p-4 border-b border-border last:border-0"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {sender.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                {editing === sender.id ? (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {["name", "company", "email", "phone"].map((key) => (
                      <input
                        key={key}
                        value={(editForm[key as keyof Sender] as string) ?? (sender[key as keyof Sender] as string) ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                        placeholder={key}
                        className="text-xs bg-background border border-input rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-foreground">{sender.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {sender.company && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3" />{sender.company}
                        </span>
                      )}
                      {sender.email && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />{sender.email}
                        </span>
                      )}
                      {sender.phone && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />{sender.phone}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                {editing === sender.id ? (
                  <>
                    <button onClick={() => handleUpdate(sender.id)} className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditing(sender.id); setEditForm({}); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(sender.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
