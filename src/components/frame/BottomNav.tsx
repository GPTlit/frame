import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, CalendarDays, MessageSquare, User, Gamepad2 } from "lucide-react";
import Dock from "@/components/Dock";
import { t, useLang } from "@/hooks/use-lang";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const ITEMS = [
  { to: "/", copy: { en: "Home", fr: "Accueil", ar: "الرئيسية" }, Icon: Home },
  { to: "/events", copy: { en: "Events", fr: "Événements", ar: "الأحداث" }, Icon: CalendarDays },
  { to: "/messages", copy: { en: "Chat", fr: "Messages", ar: "الرسائل" }, Icon: MessageSquare },
  { to: "/profile", copy: { en: "Profile", fr: "Profil", ar: "الملف" }, Icon: User },
  { to: "/games", copy: { en: "Games", fr: "Jeux", ar: "الألعاب" }, Icon: Gamepad2 },
] as const;

export function BottomNav() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    let active = true;

    // Check unread count from notifications or unread conversation messages
    const checkUnread = async () => {
      try {
        const { count, error } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("read", false);
        if (!error && count !== null && active) {
          setUnreadCount(count);
        }
      } catch {
        /* ignore */
      }
    };

    void checkUnread();

    const channel = supabase
      .channel("bottom_nav_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          if (payload.new && (payload.new as { sender_id?: string }).sender_id !== user.id) {
            setUnreadCount((c) => c + 1);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          setUnreadCount((c) => c + 1);
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [user]);

  // When visiting /messages, clear the unread badge
  useEffect(() => {
    if (pathname === "/messages") {
      setUnreadCount(0);
    }
  }, [pathname]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-75 flex justify-center">
      <Dock
        items={ITEMS.map(({ to, copy, Icon }) => {
          const hasUnread = to === "/messages" && unreadCount > 0;
          return {
            label: t(lang, copy),
            active: pathname === to,
            icon: (
              <div className="relative flex items-center justify-center">
                <Icon className="h-5 w-5" />
                {hasUnread && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background animate-pulse" />
                )}
              </div>
            ),
            onClick: () => navigate({ to }),
          };
        })}
        panelHeight={64}
        baseItemSize={44}
        magnification={62}
      />
    </div>
  );
}
