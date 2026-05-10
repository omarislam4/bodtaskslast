import { useState } from "react";
import { motion } from "framer-motion";
import { User, Moon, Sun, Save, LogOut, Phone, Clock, Webhook, Bell } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useWebhookSettings } from "@/hooks/useWebhook";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";

const COUNTRY_CODES = [
  { code: "+1", label: "🇺🇸 +1 (US/CA)" },
  { code: "+20", label: "🇪🇬 +20 (Egypt)" },
  { code: "+44", label: "🇬🇧 +44 (UK)" },
  { code: "+49", label: "🇩🇪 +49 (Germany)" },
  { code: "+33", label: "🇫🇷 +33 (France)" },
  { code: "+966", label: "🇸🇦 +966 (Saudi)" },
  { code: "+971", label: "🇦🇪 +971 (UAE)" },
  { code: "+962", label: "🇯🇴 +962 (Jordan)" },
  { code: "+965", label: "🇰🇼 +965 (Kuwait)" },
  { code: "+974", label: "🇶🇦 +974 (Qatar)" },
  { code: "+973", label: "🇧🇭 +973 (Bahrain)" },
  { code: "+968", label: "🇴🇲 +968 (Oman)" },
  { code: "+90", label: "🇹🇷 +90 (Turkey)" },
  { code: "+91", label: "🇮🇳 +91 (India)" },
  { code: "+86", label: "🇨🇳 +86 (China)" },
  { code: "+81", label: "🇯🇵 +81 (Japan)" },
  { code: "+55", label: "🇧🇷 +55 (Brazil)" },
  { code: "+7", label: "🇷🇺 +7 (Russia)" },
];

export default function Settings() {
  const { userDoc, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { settings: webhookSettings, saveSettings } = useWebhookSettings();
  const { t, lang, setLang } = useLang();

  const [displayName, setDisplayName] = useState(userDoc?.displayName || "");
  const [phone, setPhone] = useState(userDoc?.phone || "");
  const [countryCode, setCountryCode] = useState(userDoc?.countryCode || "+20");
  const [shiftEnd, setShiftEnd] = useState(userDoc?.shiftEnd || "");
  const [saving, setSaving] = useState(false);

  const [webhookUrl, setWebhookUrl] = useState(webhookSettings.webhookUrl || "https://n8n.bodhosting.com/webhook/manual-send-notification");
  const [reminderMinutes, setReminderMinutes] = useState(webhookSettings.reminderMinutes || 30);
  const [savingWebhook, setSavingWebhook] = useState(false);

  const handleSaveProfile = async () => {
    if (!userDoc) return;
    setSaving(true);
    try {
      const profileData = {
        displayName,
        phone,
        countryCode,
        shiftEnd,
        shiftReminderSent: false,
      };
      await updateDoc(doc(db, "users", userDoc.id), profileData);
      const { setDoc, doc: fsDoc } = await import("firebase/firestore");
      await setDoc(fsDoc(db, "members", userDoc.id), {
        ...profileData,
        email: userDoc.email,
        id: userDoc.id,
        fullPhone: `${countryCode}${phone}`.replace(/\s/g, ""),
      }, { merge: true });
      toast.success(t.saveChanges);
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWebhook = async () => {
    setSavingWebhook(true);
    try {
      await saveSettings({ webhookUrl, reminderMinutes });
      const { setDoc, doc: fsDoc } = await import("firebase/firestore");
      await setDoc(fsDoc(db, "config", "app"), {
        webhookUrl,
        remindMinutes: reminderMinutes,
        reminderMinutes,
      }, { merge: true });
      toast.success(t.webhookSettings);
    } catch {
      toast.error("Failed to save webhook settings");
    } finally {
      setSavingWebhook(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t.settings}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t.profileSettings}</p>
      </div>

      <div className="space-y-5">
        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">{t.profileSettings}</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">{t.fullName}</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t.fullName}
                className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">{t.email}</label>
              <input
                value={userDoc?.email || ""}
                disabled
                className="w-full px-3 py-2.5 text-sm bg-muted border border-input rounded-xl text-muted-foreground cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Role</label>
              <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${userDoc?.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {userDoc?.role || "member"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Phone */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Phone className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">{lang === "ar" ? "رقم الهاتف" : "Phone Number"}</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {lang === "ar" ? "يُستخدم لإرسال تذكيرات واتساب عند انتهاء وردية العمل." : "Used for WhatsApp reminders via n8n when your shift is ending."}
          </p>
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 shrink-0"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={lang === "ar" ? "رقم الهاتف" : "Your phone number"}
              type="tel"
              className="flex-1 px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        </motion.div>

        {/* Shift */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">{lang === "ar" ? "وقت انتهاء الوردية" : "Shift End Time"}</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {lang === "ar" ? "حدّد وقت انتهاء وردية عملك. ستصلك تذكير إذا كانت لديك مهام قيد التنفيذ." : "Set when your shift ends. You'll receive a reminder if you have in-progress tasks."}
          </p>
          <input
            type="time"
            value={shiftEnd}
            onChange={(e) => setShiftEnd(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={handleSaveProfile}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? t.saving : t.saveChanges}
        </motion.button>

        {/* Language */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">{lang === "ar" ? "اللغة" : "Language"}</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setLang("en")}
              className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all ${lang === "en" ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/40"}`}
            >
              English
            </button>
            <button
              onClick={() => setLang("ar")}
              className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all ${lang === "ar" ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/40"}`}
            >
              العربية
            </button>
          </div>
        </motion.div>

        {/* Webhook — admin only */}
        {isAdmin && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-1">
              <Webhook className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{t.webhookSettings}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Admin only</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {lang === "ar" ? "اضبط رابط webhook الخاص بـ n8n وعدد الدقائق قبل انتهاء الوردية لإرسال التذكيرات التلقائية." : "Configure the n8n webhook URL and how many minutes before shift end to trigger automatic reminders."}
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Webhook URL</label>
                <input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://n8n.example.com/webhook/..."
                  className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                  <span className="flex items-center gap-1.5"><Bell className="w-3 h-3" /> {lang === "ar" ? "نافذة التذكير (دقائق قبل انتهاء الوردية)" : "Reminder Window (minutes before shift end)"}</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={reminderMinutes}
                    onChange={(e) => setReminderMinutes(Number(e.target.value))}
                    min={1}
                    max={120}
                    className="w-24 px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-xs text-muted-foreground">{lang === "ar" ? "دقيقة قبل انتهاء الوردية" : "minutes before shift ends"}</span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={handleSaveWebhook}
                disabled={savingWebhook}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {savingWebhook ? t.saving : t.saveChanges}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Appearance */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">{lang === "ar" ? "المظهر" : "Appearance"}</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{lang === "ar" ? "السمة" : "Theme"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{lang === "ar" ? "تبديل بين الوضع الفاتح والداكن" : "Toggle between light and dark mode"}</p>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground text-sm font-medium rounded-xl hover:bg-muted/80 transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === "dark" ? t.lightMode : t.darkMode}
            </button>
          </div>
        </motion.div>

        {/* Sign out */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">{lang === "ar" ? "الجلسة" : "Session"}</h3>
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive text-sm font-medium rounded-xl hover:bg-destructive/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {lang === "ar" ? "تسجيل الخروج" : "Sign Out"}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
