import type { ReactNode } from "react";
import { SiteChrome } from "@/components/frame/SiteChrome";
import { BottomNav } from "@/components/frame/BottomNav";
import { AuthGate } from "@/components/frame/AuthGate";
import GlowCursor from "@/components/fx/GlowCursor";
import ScrollLight from "@/components/fx/ScrollLight";

/** Shared chrome: header, language + theme controls, glow cursor and bottom dock. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      <ScrollLight />
      <GlowCursor />
      <AuthGate>
        <div className="relative z-10">
          <SiteChrome />
          {children}
          <BottomNav />
        </div>
      </AuthGate>
    </div>
  );
}
