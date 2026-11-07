import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  memberStatus: "pending" | "approved" | "denied" | null;
  refreshStatus: () => void;
};

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  loading: true,
  memberStatus: null,
  refreshStatus: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const uid = session?.user?.id ?? null;
  const [memberStatus, setMemberStatus] = useState<AuthCtx["memberStatus"]>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!uid) {
      setMemberStatus(null);
      return;
    }
    let alive = true;
    void (async () => {
      const [{ data: prof }, { data: admin }] = await Promise.all([
        supabase.from("profiles").select("member_status").eq("id", uid).maybeSingle(),
        supabase.rpc("has_role", { _user_id: uid, _role: "admin" }),
      ]);
      if (!alive) return;
      if (admin) setMemberStatus("approved");
      else setMemberStatus(((prof?.member_status as AuthCtx["memberStatus"]) ?? "pending"));
    })();
    return () => {
      alive = false;
    };
  }, [uid, tick]);

  return (
    <Ctx.Provider value={{
        session,
        user: session?.user ?? null,
        loading,
        memberStatus,
        refreshStatus: () => setTick((n) => n + 1),
      }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
