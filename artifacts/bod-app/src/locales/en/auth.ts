const auth = {
  welcomeBack: "Welcome back",
  signInSubtitle: "Sign in to your workspace account",
  email: "Email",
  password: "Password",
  signIn: "Sign in",
  signingIn: "Signing in...",
  noAccount: "Don't have an account?",
  signUp: "Sign up",
  createAccount: "Create Account",
  alreadyHaveAccount: "Already have an account?",
  fullName: "Full Name",
  yourFullName: "Your full name",
  confirmPassword: "Confirm Password",
  minChars: "Min. 6 characters",
  signingUp: "Creating account...",
  joinWorkspace: "Sign up to join your team workspace",
  adminRequired: "Admin access required",
} as const;

export type AuthKeys = keyof typeof auth;
export default auth;
