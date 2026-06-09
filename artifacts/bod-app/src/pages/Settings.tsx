import { useState } from "react";
import { motion } from "framer-motion";
import { User, Moon, Sun, Save, LogOut, Phone, Clock, Webhook, Bell, KeyRound, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useUpdateProfile } from "@/hooks/useUserQueries";
import { useAppSettings, useUpdateAppSettings } from "@/hooks/useSettingsQueries";
import { useLang } from "@/contexts/LangContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const { userDoc, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, lang, setLang } = useLang();

  const [displayName, setDisplayName] = useState(userDoc?.displayName || "");
  const [phone, setPhone] = useState(userDoc?.phone || "");
  const [countryCode, setCountryCode] = useState(userDoc?.countryCode || "+20");
  const [shiftEnd, setShiftEnd] = useState(userDoc?.shiftEnd || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const updateProfile = useUpdateProfile(userDoc?.id || "");

  const { data: appSettings } = useAppSettings(isAdmin);
  const updateAppSettings = useUpdateAppSettings();
  const [webhookUrl, setWebhookUrl] = useState(appSettings?.webhookUrl || "https://n8n.athar-riyada.com/webhook/manual-send-notification");
  const [reminderMinutes, setReminderMinutes] = useState(appSettings?.reminderMinutes || 30);

  const handleSaveProfile = () => {
    if (!userDoc) return;
    updateProfile.mutate({ displayName, phone, countryCode, shiftEnd });
  };

  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const passwordTooShort = newPassword.length > 0 && newPassword.length < 6;

  const handleSavePassword = () => {
    if (!userDoc || !currentPassword || !newPassword || passwordMismatch || passwordTooShort) return;
    setCurrentPasswordError("");
    updateProfile.mutate({ currentPassword, password: newPassword }, {
      onSuccess: () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { errors?: { currentPassword?: string[] } } } })
          ?.response?.data?.errors?.currentPassword?.[0];
        if (msg) setCurrentPasswordError(msg);
      },
    });
  };

  const handleSaveWebhook = () => {
    updateAppSettings.mutate({ webhookUrl, reminderMinutes });
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
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger className="w-40 text-sm shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_CODES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          disabled={updateProfile.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold border border-transparent rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {updateProfile.isPending ? t.saving : t.saveChanges}
        </motion.button>

        {/* Change Password */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <KeyRound className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">{lang === "ar" ? "تغيير كلمة المرور" : "Change Password"}</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">{lang === "ar" ? "كلمة المرور الحالية" : "Current Password"}</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setCurrentPasswordError(""); }}
                  placeholder={lang === "ar" ? "كلمة المرور الحالية" : "Your current password"}
                  className={`w-full px-3 py-2.5 pr-10 text-sm bg-background border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${currentPasswordError ? "border-destructive" : "border-input"}`}
                />
                <button type="button" onClick={() => setShowCurrentPassword((v) => !v)} className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground">
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {currentPasswordError && <p className="text-xs text-destructive mt-1">{lang === "ar" ? "كلمة المرور الحالية غير صحيحة" : currentPasswordError}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">{lang === "ar" ? "كلمة المرور الجديدة" : "New Password"}</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={lang === "ar" ? "٦ أحرف على الأقل" : "Min. 6 characters"}
                  className="w-full px-3 py-2.5 pr-10 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <button type="button" onClick={() => setShowNewPassword((v) => !v)} className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground">
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordTooShort && <p className="text-xs text-destructive mt-1">{lang === "ar" ? "كلمة المرور قصيرة جداً" : "Password must be at least 6 characters"}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">{t.confirmPassword}</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={lang === "ar" ? "أعد كتابة كلمة المرور الجديدة" : "Re-enter new password"}
                  className={`w-full px-3 py-2.5 pr-10 text-sm bg-background border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${passwordMismatch ? "border-destructive" : "border-input"}`}
                />
                <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordMismatch && <p className="text-xs text-destructive mt-1">{lang === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords do not match"}</p>}
            </div>
            <motion.button
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              onClick={handleSavePassword}
              disabled={updateProfile.isPending || !currentPassword || !newPassword || !!passwordMismatch || !!passwordTooShort}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold border border-transparent rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {updateProfile.isPending ? t.saving : (lang === "ar" ? "تغيير كلمة المرور" : "Change Password")}
            </motion.button>
          </div>
        </motion.div>

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
                disabled={updateAppSettings.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {updateAppSettings.isPending ? t.saving : t.saveChanges}
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
            onClick={logout}
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
