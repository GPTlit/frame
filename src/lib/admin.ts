import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type EventRow = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  category: string | null;
  starts_at: string | null;
  status: string;
};

export type NewsRow = {
  id: string;
  title: string;
  body: string | null;
  kind: string;
  created_at: string;
};

/** True when the signed-in member holds the admin role (checked by the database). */
export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!user) return setIsAdmin(false);
    let alive = true;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      if (alive) setIsAdmin(data === true);
    });
    return () => {
      alive = false;
    };
  }, [user]);
  return isAdmin;
}

export async function listEvents(): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from("events")
    .select("id, title, description, location, category, starts_at, status")
    .order("starts_at", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function listNews(): Promise<NewsRow[]> {
  const { data, error } = await supabase
    .from("news")
    .select("id, title, body, kind, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}
