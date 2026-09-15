import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, CalendarDays, User, Gamepad2 } from "lucide-react";
import Dock from "@/components/Dock";

const ITEMS = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/events", label: "Events", Icon: CalendarDays },
  { to: "/profile", label: "Profile", Icon: User },
  { to: "/games", label: "Games", Icon: Gamepad2 },
] as const;

export function BottomNav() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-75 flex justify-center">
      <Dock
        items={ITEMS.map(({ to, label, Icon }) => ({
          label,
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
