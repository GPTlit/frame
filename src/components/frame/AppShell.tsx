import type { ReactNode } from "react";
import { SiteChrome } from "@/components/frame/SiteChrome";
import { BottomNav } from "@/components/frame/BottomNav";
import GlowCursor from "@/components/fx/GlowCursor";

/** Shared chrome: header, language + theme controls, glow cursor and bottom dock. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <GlowCursor />
      <SiteChrome />
      {children}
      <BottomNav />
    </div>
  );
}
