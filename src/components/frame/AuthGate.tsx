import { useState, type ReactNode } from "react";
import { MessageSquare, ExternalLink, ShieldCheck, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { t, useLang } from "@/hooks/use-lang";
import { FrameMark } from "@/components/frame/SiteChrome";
import { normalizePhone, phoneLoginEmail } from "@/lib/phone-auth";
import { createApprovalWhatsAppUrl, ADMIN_PHONE_RAW } from "@/lib/admin-whatsapp";

/** Optional gate component when a route specifically requires authentication. */
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

export function SignInScreen({
  onSuccess,
  inModal = false,
}: {
  onSuccess?: () => void;
  inModal?: boolean;
}) {
  const { lang } = useLang();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whatsAppSuccessUrl, setWhatsAppSuccessUrl] = useState<string | null>(null);

  const field =
    "w-full rounded-md border border-input bg-card px-3.5 py-2.5 text-[15px] outline-none transition focus:border-maroon-accent";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const digits = normalizePhone(phone);
    if (digits.length < 6) {
      setError(
        t(lang, {
          en: "Enter a valid phone number.",
          fr: "Entrez un numéro valide.",
          ar: "أدخل رقم هاتف صحيحًا.",
        }),
      );
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const handle = username
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_.]/g, "");
        if (handle.length < 3) {
          throw new Error(
            t(lang, {
              en: "Username needs at least 3 letters or numbers.",
              fr: "Le pseudo doit contenir au moins 3 caractères.",
              ar: "اسم المستخدم يحتاج 3 أحرف على الأقل.",
            }),
          );
        }
        const { data: signUpData, error: err } = await supabase.auth.signUp({
          email: phoneLoginEmail(digits),
          password,
          options: {
            data: { username: handle, contact_email: email.trim().toLowerCase(), phone: digits },
          },
        });
        if (err) {
          if (/registered|exists/i.test(err.message)) {
            throw new Error(
              t(lang, {
                en: "This number is already registered. Sign in instead.",
                fr: "Ce numéro est déjà inscrit. Connectez-vous.",
                ar: "هذا الرقم مسجل بالفعل. سجّل الدخول.",
              }),
            );
          }
          if (/database error/i.test(err.message)) {
            throw new Error(
              t(lang, {
                en: "That username or email is already taken.",
                fr: "Ce pseudo ou e-mail est déjà pris.",
                ar: "اسم المستخدم أو البريد مستخدم بالفعل.",
              }),
            );
          }
          throw err;
        }

        const newUserId = signUpData.user?.id;
        const waUrl = createApprovalWhatsAppUrl({
          username: handle,
          phone: digits,
          email: email.trim().toLowerCase(),
          userId: newUserId,
        });

        // Trigger WhatsApp in new window
        if (typeof window !== "undefined") {
          window.open(waUrl, "_blank");
        }
        setWhatsAppSuccessUrl(waUrl);

        if (newUserId) {
          try {
            await supabase.from("notifications").insert({
              user_id: newUserId,
              title: `New Member Request: @${handle}`,
              body: `Phone: ${digits} | Email: ${email.trim()}`,
              kind: "notification",
            });
          } catch {
            // ignore
          }
        }
      } else {
        const { data: signInData, error: err } = await supabase.auth.signInWithPassword({
          email: phoneLoginEmail(digits),
          password,
        });
        if (err) {
          throw new Error(
            t(lang, {
              en: "Wrong phone number or password.",
              fr: "Numéro ou mot de passe incorrect.",
              ar: "رقم الهاتف أو كلمة السر غير صحيحة.",
            }),
          );
        }

        const signedInUser = signInData.user;
        const userMeta = (signedInUser?.user_metadata ?? {}) as Record<string, unknown>;
        const currentHandle = typeof userMeta["username"] === "string" ? userMeta["username"] : "";
        const currentEmail =
          typeof userMeta["contact_email"] === "string" ? userMeta["contact_email"] : "";

        const waUrl = createApprovalWhatsAppUrl({
          username: currentHandle,
          phone: digits,
          email: currentEmail,
          userId: signedInUser?.id,
        });

        // Direct WhatsApp dispatch to admin
        if (typeof window !== "undefined") {
          window.open(waUrl, "_blank");
        }
        setWhatsAppSuccessUrl(waUrl);

        if (signedInUser?.id) {
          try {
            await supabase.from("notifications").insert({
              user_id: signedInUser.id,
              title: `Sign-in Notification: @${currentHandle || "member"}`,
              body: `Phone: ${digits} | Email: ${currentEmail}`,
              kind: "notification",
            });
          } catch {
            // ignore
          }
        }
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const containerClasses = inModal
    ? "w-full max-w-md p-6"
    : "grid min-h-screen place-items-center px-5 py-16";

  const content = (
    <div className="w-full max-w-[430px]">
      <div className="flex items-center gap-3">
        <FrameMark className="h-12 w-10 text-maroon-700" />
        <span className="font-display text-[22px] font-semibold tracking-[0.14em]">FRAME</span>
      </div>

      <h1 className="mt-7 font-display text-[clamp(28px,5vw,40px)] leading-[1.05]">
        {mode === "signin"
          ? t(lang, { en: "Welcome back", fr: "Bon retour", ar: "مرحبًا بعودتك" })
          : t(lang, { en: "Join FRAME", fr: "Rejoindre FRAME", ar: "انضم إلى إطار" })}
      </h1>
      <p className="mt-2 text-[14.5px] text-muted-foreground">
        {mode === "signin"
          ? t(lang, {
              en: "Sign in with your phone number and password.",
              fr: "Connectez-vous avec votre numéro et mot de passe.",
              ar: "سجّل الدخول برقم هاتفك وكلمة السر.",
            })
          : t(lang, {
              en: "Create your account in seconds — no email verification required.",
              fr: "Créez votre compte en quelques secondes sans confirmation par e-mail.",
              ar: "أنشئ حسابك في ثوانٍ بدون تأكيد البريد.",
            })}
      </p>

      {/* Admin WhatsApp notification badge after signin/up */}
      {whatsAppSuccessUrl && (
        <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
            <ShieldCheck className="h-5 w-5" />
            {t(lang, {
              en: "Sign-in Notification Sent to Admin",
              fr: "Notification envoyée à l'administrateur",
              ar: "تم إرسال إشعار الدخول إلى المشرف",
            })}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t(lang, {
              en: `Approval request dispatched to Admin WhatsApp (${ADMIN_PHONE_RAW}).`,
              fr: `Demande d'approbation envoyée sur WhatsApp (${ADMIN_PHONE_RAW}).`,
              ar: `تم إرسال طلب الموافقة إلى واتساب المشرف (${ADMIN_PHONE_RAW}).`,
            })}
          </p>
          <a
            href={whatsAppSuccessUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm transition"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {t(lang, {
              en: "Open WhatsApp with Admin",
              fr: "Ouvrir WhatsApp avec l'admin",
              ar: "فتح واتساب مع المشرف",
            })}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      <form onSubmit={submit} className="mt-6 grid gap-4">
        {mode === "signup" && (
          <>
            <div>
              <label className="mb-1 block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {t(lang, { en: "Username", fr: "Pseudo", ar: "اسم المستخدم" })}
              </label>
              <input
                className={field}
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="aminetou"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {t(lang, { en: "Email", fr: "E-mail", ar: "البريد الإلكتروني" })}
              </label>
              <input
                className={field}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="aminetou@example.com"
              />
            </div>
          </>
        )}
        <div>
          <label className="mb-1 block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {t(lang, { en: "Phone Number", fr: "Numéro de téléphone", ar: "رقم الهاتف" })}
          </label>
          <input
            className={field}
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+222 45 00 00 00"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {t(lang, { en: "Password", fr: "Mot de passe", ar: "كلمة السر" })}
          </label>
          <input
            className={field}
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-[image:var(--gradient-ember)] px-5 py-3 text-[15px] font-semibold text-paper disabled:opacity-60 shadow-md transition-transform active:scale-98"
        >
          {busy
            ? "..."
            : mode === "signin"
              ? t(lang, { en: "Sign in", fr: "Se connecter", ar: "تسجيل الدخول" })
              : t(lang, { en: "Create account", fr: "Créer un compte", ar: "إنشاء حساب" })}
        </button>
      </form>

      {error && <p className="mt-4 text-[13.5px] text-destructive">{error}</p>}

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
        }}
        className="mt-6 text-[13.5px] font-semibold text-maroon-accent underline-offset-4 hover:underline"
      >
        {mode === "signin"
          ? t(lang, {
              en: "New to FRAME? Create an account",
              fr: "Nouveau sur FRAME ? Créez un compte",
              ar: "جديد في FRAME؟ أنشئ حسابًا",
            })
          : t(lang, {
              en: "Already a member? Sign in",
              fr: "Déjà membre ? Connectez-vous",
              ar: "عضو بالفعل؟ سجّل الدخول",
            })}
      </button>
    </div>
  );

  if (inModal) return content;
  return <main className={containerClasses}>{content}</main>;
}

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <SignInScreen inModal onSuccess={onClose} />
      </div>
    </div>
  );
}
