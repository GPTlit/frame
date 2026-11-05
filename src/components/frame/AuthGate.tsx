import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { t, useLang } from "@/hooks/use-lang";
import { FrameMark } from "@/components/frame/SiteChrome";
import { normalizePhone, phoneLoginEmail } from "@/lib/phone-auth";

/** Everybody signs in before the app opens. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-maroon-accent border-t-transparent" />
      </div>
    );
  }

  if (!session) return <SignInScreen />;
  return <>{children}</>;
}

function SignInScreen() {
  const { lang } = useLang();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const field =
    "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 text-[15px] outline-none focus:border-maroon-accent";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const digits = normalizePhone(phone);
    if (digits.length < 6) {
      setError(t(lang, { en: "Enter a valid phone number.", fr: "Entrez un numéro valide.", ar: "أدخل رقم هاتف صحيحًا." }));
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const handle = username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, "");
        if (handle.length < 3) {
          throw new Error(t(lang, { en: "Username needs at least 3 letters or numbers.", fr: "Le pseudo doit contenir au moins 3 caractères.", ar: "اسم المستخدم يحتاج 3 أحرف على الأقل." }));
        }
        const { error: err } = await supabase.auth.signUp({
          email: phoneLoginEmail(digits),
          password,
          options: { data: { username: handle, contact_email: email.trim().toLowerCase(), phone: digits } },
        });
        if (err) {
          if (/registered|exists/i.test(err.message)) {
            throw new Error(t(lang, { en: "This number is already registered. Sign in instead.", fr: "Ce numéro est déjà inscrit. Connectez-vous.", ar: "هذا الرقم مسجل بالفعل. سجّل الدخول." }));
          }
          if (/database error/i.test(err.message)) {
            throw new Error(t(lang, { en: "That username or email is already taken.", fr: "Ce pseudo ou e-mail est déjà pris.", ar: "اسم المستخدم أو البريد مستخدم بالفعل." }));
          }
          throw err;
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: phoneLoginEmail(digits),
          password,
        });
        if (err) {
          throw new Error(t(lang, { en: "Wrong phone number or password.", fr: "Numéro ou mot de passe incorrect.", ar: "رقم الهاتف أو كلمة السر غير صحيحة." }));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center px-5 py-16">
      <div className="w-full max-w-[430px]">
        <div className="flex items-center gap-3">
          <FrameMark className="h-[77px] w-[70px] text-maroon-700" />
          <span className="font-display text-[22px] font-semibold tracking-[0.14em]">FRAME</span>
        </div>

        <h1 className="mt-7 font-display text-[clamp(30px,6vw,44px)] leading-[1.05]">
          {mode === "signin"
            ? t(lang, { en: "Welcome back", fr: "Bon retour", ar: "مرحبًا بعودتك" })
            : t(lang, { en: "Join FRAME", fr: "Rejoindre FRAME", ar: "انضم إلى إطار" })}
        </h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          {mode === "signin"
            ? t(lang, { en: "Sign in with your phone number and password.", fr: "Connectez-vous avec votre numéro et mot de passe.", ar: "سجّل الدخول برقم هاتفك وكلمة السر." })
            : t(lang, { en: "Create your account in seconds — no email confirmation needed.", fr: "Créez votre compte en quelques secondes, sans confirmation par e-mail.", ar: "أنشئ حسابك في ثوانٍ بدون تأكيد البريد." })}
        </p>

        <form onSubmit={submit} className="mt-8 grid gap-4">
          {mode === "signup" && (
            <>
              <input className={field} required value={username} onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder={t(lang, { en: "Username", fr: "Pseudo", ar: "اسم المستخدم" })} />
              <input className={field} type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder={t(lang, { en: "Email", fr: "E-mail", ar: "البريد الإلكتروني" })} />
            </>
          )}
          <input className={field} type="tel" required inputMode="tel" autoComplete="tel" value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t(lang, { en: "Phone number (e.g. +222 …)", fr: "Numéro de téléphone (ex. +222 …)", ar: "رقم الهاتف (مثال +222 …)" })} />
          <input className={field} type="password" required minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder={t(lang, { en: "Password", fr: "Mot de passe", ar: "كلمة السر" })} />
          <button type="submit" disabled={busy}
            className="rounded-md bg-[image:var(--gradient-ember)] px-5 py-3 text-[15px] font-semibold text-paper disabled:opacity-60">
            {mode === "signin"
              ? t(lang, { en: "Sign in", fr: "Se connecter", ar: "تسجيل الدخول" })
              : t(lang, { en: "Create account", fr: "Créer un compte", ar: "إنشاء حساب" })}
          </button>
        </form>

        {error && <p className="mt-4 text-[13.5px] text-maroon-accent">{error}</p>}

        <button type="button"
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
          className="mt-6 text-[13.5px] font-semibold text-maroon-accent underline-offset-4 hover:underline">
          {mode === "signin"
            ? t(lang, { en: "New here? Create an account", fr: "Nouveau ? Créez un compte", ar: "جديد؟ أنشئ حسابًا" })
            : t(lang, { en: "Already a member? Sign in", fr: "Déjà membre ? Connectez-vous", ar: "عضو بالفعل؟ سجّل الدخول" })}
        </button>
      </div>
    </main>
  );
}
