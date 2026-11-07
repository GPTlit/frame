import { useEffect, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Clock, MessageSquare } from "lucide-react";
import { SiteChrome } from "@/components/frame/SiteChrome";
import { BottomNav } from "@/components/frame/BottomNav";
import GlowCursor from "@/components/fx/GlowCursor";
import ScrollLight from "@/components/fx/ScrollLight";
import { useAuth } from "@/hooks/use-auth";
import { t, useLang } from "@/hooks/use-lang";
import { createApprovalWhatsAppUrl } from "@/lib/admin-whatsapp";

/** Shared chrome: header, language + theme controls, glow cursor and bottom dock. */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fullScreen = pathname.startsWith("/messages");
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    setFinePointer(window.matchMedia("(pointer: fine) and (min-width: 768px)").matches);
  }, []);

  if (fullScreen) {
    return (
      <div className="relative min-h-screen bg-background">
        <PendingBanner />
        {children}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      {finePointer && <ScrollLight />}
      {finePointer && <GlowCursor />}
      <div className="relative z-10">
        <SiteChrome />
        <PendingBanner />
        {children}
        <BottomNav />
      </div>
    </div>
  );
}

/** Shown to signed-in people whose membership hasn't been approved yet. */
function PendingBanner() {
  const { user, memberStatus } = useAuth();
  const { lang } = useLang();
  if (!user || !memberStatus || memberStatus === "approved") return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const url = createApprovalWhatsAppUrl({
    username: typeof meta["username"] === "string" ? meta["username"] : "",
    phone: typeof meta["phone"] === "string" ? meta["phone"] : "",
    email: typeof meta["contact_email"] === "string" ? meta["contact_email"] : "",
    userId: user.id,
  });
  const denied = memberStatus === "denied";
  return (
    <div className="fixed inset-x-3 bottom-24 z-90 mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-maroon-accent/40 bg-background/95 p-3 shadow-xl backdrop-blur">
      <Clock className="h-5 w-5 shrink-0 text-maroon-accent" />
      <p className="flex-1 text-[12.5px] leading-snug">
        {denied
          ? t(lang, {
              en: "Your membership request was declined. You can still browse.",
              fr: "Votre demande d'adhésion a été refusée. Vous pouvez toujours naviguer.",
              ar: "تم رفض طلب العضوية. لا يزال بإمكانك التصفح.",
            })
          : t(lang, {
              en: "Waiting for admin approval — you can browse, but chatting and games unlock once you're approved.",
              fr: "En attente d'approbation — vous pouvez naviguer, la messagerie et les jeux s'ouvrent après validation.",
              ar: "في انتظار موافقة المشرف — يمكنك التصفح، والدردشة والألعاب تُفتح بعد الموافقة.",
            })}
      </p>
      {!denied && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[image:var(--gradient-ember)] px-3 py-1.5 text-[12px] font-semibold text-paper"
        >
          <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
        </a>
      )}
    </div>
  );
}
