import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import bodLogo from "@assets/bod-logo.png";
import { useLang } from "@/contexts/LangContext";

function getAuthError(msg: string, lang: string): string {
  if (msg.includes("invalid-credential") || msg.includes("user-not-found") || msg.includes("wrong-password")) {
    return lang === "ar"
      ? "البريد الإلكتروني أو كلمة المرور غلط"
      : "Invalid email or password";
  }
  if (msg.includes("too-many-requests")) {
    return lang === "ar"
      ? "الحساب متوقف مؤقتاً بسبب كثرة المحاولات — انتظر قليلاً"
      : "Too many attempts, try again later";
  }
  if (msg.includes("network-request-failed")) {
    return lang === "ar" ? "مشكلة في الإنترنت" : "Network error";
  }
  return lang === "ar" ? `خطأ: ${msg}` : `Error: ${msg}`;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [, navigate] = useLocation();
  const { t, lang } = useLang();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/spaces");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(getAuthError(msg, lang));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden flex-col items-center justify-center gap-6 p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center gap-5"
        >
          <div className="w-28 h-28 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-2xl ring-1 ring-white/20">
            <img src={bodLogo} alt="BOD" className="w-20 h-20 object-contain" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white tracking-tight">Birth Of Dream</h1>
            <p className="text-white/60 text-sm mt-1 tracking-widest uppercase">Workspace Management</p>
          </div>
        </motion.div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80 pointer-events-none" style={{ zIndex: -1 }} />
      </div>

      {/* Right: login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img src={bodLogo} alt="BOD" className="w-9 h-9 rounded-xl object-contain bg-primary/10 p-1" />
            <span className="font-bold text-lg text-foreground">Birth Of Dream</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-1.5">{t.welcomeBack}</h1>
          <p className="text-sm text-muted-foreground mb-8">{t.signInSubtitle}</p>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-sm leading-snug">{error}</p>
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide" htmlFor="email">
                {t.email}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-card border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide" htmlFor="password">
                {t.password}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 text-sm bg-card border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="w-full py-2.5 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  {t.signingIn}
                </span>
              ) : t.signIn}
            </motion.button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            {t.noAccount}{" "}
            <button onClick={() => navigate("/signup")} className="text-primary hover:underline font-medium">
              {t.signUp}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
