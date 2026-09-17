import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { t, useLang } from "@/hooks/use-lang";
import { FrameMark } from "@/components/frame/SiteChrome";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const field =
    "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 text-[15px] outline-none focus:border-maroon-accent";

  const google = async () => {
    setError(null);
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(
        t(lang, {
          en: "Google sign-in failed. Try again.",
          fr: "La connexion Google a échoué. Réessayez.",
          ar: "فشل تسجيل الدخول عبر جوجل. حاول مرة أخرى.",
        }),
      );
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNote(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (err) throw err;
        if (!data.session) {
          setNote(
            t(lang, {
              en: "Check your email to confirm your account, then sign in.",
              fr: "Vérifiez votre e-mail pour confirmer votre compte, puis connectez-vous.",
              ar: "تحقق من بريدك لتأكيد الحساب ثم سجّل الدخول.",
            }),
          );
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
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
          <FrameMark className="h-8 w-7 text-maroon-700" />
          <span className="font-display text-[22px] font-semibold tracking-[0.14em]">FRAME</span>
        </div>

        <h1 className="mt-7 font-display text-[clamp(30px,6vw,44px)] leading-[1.05]">
          {mode === "signin"
            ? t(lang, { en: "Welcome back", fr: "Bon retour", ar: "مرحبًا بعودتك" })
            : t(lang, { en: "Join FRAME", fr: "Rejoindre FRAME", ar: "انضم إلى إطار" })}
        </h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          {t(lang, {
            en: "Sign in to see events, ranks and real member profiles.",
            fr: "Connectez-vous pour voir les événements, les classements et les profils réels.",
            ar: "سجّل الدخول لرؤية الأحداث والترتيب وملفات الأعضاء الحقيقية.",
          })}
        </p>

        <button
          type="button"
          onClick={google}
          disabled={busy}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-md border border-border bg-card px-4 py-3 text-[15px] font-semibold transition-colors hover:border-maroon-accent disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.2-4 1.2a7 7 0 0 1-6.6-4.8H1.4v3.1A12 12 0 0 0 12 24Z"
            />
            <path fill="#FBBC05" d="M5.4 14.5a7.2 7.2 0 0 1 0-4.6V6.8H1.4a12 12 0 0 0 0 10.4l4-2.7Z" />
            <path
              fill="#EA4335"
              d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.8l4 3.1A7 7 0 0 1 12 4.8Z"
            />
          </svg>
          {t(lang, {
            en: "Continue with Google",
            fr: "Continuer avec Google",
            ar: "المتابعة عبر جوجل",
          })}
        </button>

        <div className="my-6 flex items-center gap-3 text-[12px] tracking-[0.2em] text-muted-foreground uppercase">
          <span className="h-px flex-1 bg-border" />
          {t(lang, { en: "or", fr: "ou", ar: "أو" })}
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="grid gap-4">
          <input
            className={field}
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t(lang, { en: "Email", fr: "E-mail", ar: "البريد الإلكتروني" })}
          />
          <input
            className={field}
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t(lang, { en: "Password", fr: "Mot de passe", ar: "كلمة السر" })}
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-[image:var(--gradient-ember)] px-5 py-3 text-[15px] font-semibold text-paper disabled:opacity-60"
          >
            {mode === "signin"
              ? t(lang, { en: "Sign in", fr: "Se connecter", ar: "تسجيل الدخول" })
              : t(lang, { en: "Create account", fr: "Créer un compte", ar: "إنشاء حساب" })}
          </button>
        </form>

        {error && <p className="mt-4 text-[13.5px] text-maroon-accent">{error}</p>}
        {note && <p className="mt-4 text-[13.5px] text-muted-foreground">{note}</p>}

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setNote(null);
          }}
          className="mt-6 text-[13.5px] font-semibold text-maroon-accent underline-offset-4 hover:underline"
        >
          {mode === "signin"
            ? t(lang, {
                en: "New here? Create an account",
                fr: "Nouveau ? Créez un compte",
                ar: "جديد؟ أنشئ حسابًا",
              })
            : t(lang, {
                en: "Already a member? Sign in",
                fr: "Déjà membre ? Connectez-vous",
                ar: "عضو بالفعل؟ سجّل الدخول",
              })}
        </button>
      </div>
    </main>
  );
}
