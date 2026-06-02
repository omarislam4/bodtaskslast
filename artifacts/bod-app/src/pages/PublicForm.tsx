import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { formsService } from "@/services/forms";
import { ClipboardList, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import bodLogo from "@assets/bod-logo.png";

import type { FormField, Form } from "@/hooks/useForms";

export default function PublicForm() {
  const { formId } = useParams<{ formId: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!formId) return;
    formsService.getPublic(formId)
      .then(data => {
        setForm(data);
        const initial: Record<string, string | boolean> = {};
        data.fields.forEach(f => {
          initial[f.id] = f.type === "checkbox" ? false : "";
        });
        setValues(initial);
        setLoading(false);
      })
      .catch(() => { setError("Form not found"); setLoading(false); });
  }, [formId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    for (const field of form.fields) {
      if (field.required && !values[field.id]) {
        setError(`"${field.label}" is required`);
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      await formsService.submit(form.id, values);
      setSubmitted(true);
    } catch {
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-foreground font-semibold">{error}</p>
        <p className="text-sm text-muted-foreground mt-1">The form may have been removed or the link is incorrect.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Submitted!</h2>
          <p className="text-muted-foreground">Thank you for filling out this form.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#1a1a3e] flex items-center justify-center">
            <img src={bodLogo} alt="BOD" className="w-5 h-5 object-contain" />
          </div>
          <span className="text-sm font-semibold text-foreground">Birth Of Dream</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">{form?.title}</h1>
              {form?.description && <p className="text-sm text-muted-foreground">{form.description}</p>}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {form?.fields.map(field => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.type === "text" && (
                  <input
                    type="text"
                    value={values[field.id] as string || ""}
                    onChange={e => setValues(p => ({ ...p, [field.id]: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                )}
                {field.type === "email" && (
                  <input
                    type="email"
                    value={values[field.id] as string || ""}
                    onChange={e => setValues(p => ({ ...p, [field.id]: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                )}
                {field.type === "number" && (
                  <input
                    type="number"
                    value={values[field.id] as string || ""}
                    onChange={e => setValues(p => ({ ...p, [field.id]: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                )}
                {field.type === "date" && (
                  <input
                    type="date"
                    value={values[field.id] as string || ""}
                    onChange={e => setValues(p => ({ ...p, [field.id]: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                )}
                {field.type === "dropdown" && (
                  <select
                    value={values[field.id] as string || ""}
                    onChange={e => setValues(p => ({ ...p, [field.id]: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Select...</option>
                    {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                )}
                {field.type === "checkbox" && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!values[field.id]}
                      onChange={e => setValues(p => ({ ...p, [field.id]: e.target.checked }))}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm text-muted-foreground">Yes</span>
                  </label>
                )}
              </div>
            ))}

            {error && (
              <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-all"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
