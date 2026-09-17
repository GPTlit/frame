import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, CalendarDays, User, Gamepad2 } from "lucide-react";
import Dock from "@/components/Dock";
import { t, useLang } from "@/hooks/use-lang";

const ITEMS = [
  { to: "/", copy: { en: "Home", fr: "Accueil", ar: "الرئيسية" }, Icon: Home },
  { to: "/events", copy: { en: "Events", fr: "Événements", ar: "الأحداث" }, Icon: CalendarDays },
  { to: "/profile", copy: { en: "Profile", fr: "Profil", ar: "الملف" }, Icon: User },
  { to: "/games", copy: { en: "Games", fr: "Jeux", ar: "الألعاب" }, Icon: Gamepad2 },
] as const;

export function BottomNav() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-75 flex justify-center">
      <Dock
        items={ITEMS.map(({ to, copy, Icon }) => ({
          label: t(lang, copy),
          active: pathname === to,
          icon: <Icon className="h-5 w-5" />,
          onClick: () => navigate({ to }),
        }))}
        panelHeight={64}
        baseItemSize={44}
        magnification={62}
      />
    </div>
  );
}
