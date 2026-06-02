import type { AuthKeys } from "../en/auth";
import type { TranslationValue } from "..";

const auth: Record<AuthKeys, TranslationValue> = {
  welcomeBack: "مرحباً بك",
  signInSubtitle: "سجّل دخولك لحساب مساحة العمل",
  email: "البريد الإلكتروني",
  password: "كلمة المرور",
  signIn: "تسجيل الدخول",
  signingIn: "جاري الدخول...",
  noAccount: "ليس لديك حساب؟",
  signUp: "إنشاء حساب",
  createAccount: "إنشاء حساب",
  alreadyHaveAccount: "لديك حساب بالفعل؟",
  fullName: "الاسم الكامل",
  yourFullName: "اسمك الكامل",
  confirmPassword: "تأكيد كلمة المرور",
  minChars: "٦ أحرف على الأقل",
  signingUp: "جاري إنشاء الحساب...",
  joinWorkspace: "سجّل للانضمام لمساحة عمل فريقك",
  adminRequired: "يلزم صلاحية المسؤول",
};

export default auth;
