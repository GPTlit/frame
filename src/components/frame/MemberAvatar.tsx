import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MemberAvatarProps {
  avatarUrl?: string | null | undefined;
  name?: string | null | undefined;
  username?: string | null | undefined;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | undefined;
  className?: string | undefined;
  showStatus?: boolean | undefined;
  isOnline?: boolean | undefined;
}

const SIZE_MAP = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
  "2xl": "w-24 h-24 text-2xl",
};

const STATUS_SIZE_MAP = {
  xs: "w-1.5 h-1.5 right-0 bottom-0",
  sm: "w-2 h-2 right-0 bottom-0 ring-1",
  md: "w-2.5 h-2.5 right-0.5 bottom-0.5 ring-2",
  lg: "w-3 h-3 right-0.5 bottom-0.5 ring-2",
  xl: "w-3.5 h-3.5 right-1 bottom-1 ring-2",
  "2xl": "w-4 h-4 right-1.5 bottom-1.5 ring-2",
};

const GRADIENTS = [
  "from-maroon-700 to-amber-600",
  "from-emerald-700 to-teal-500",
  "from-indigo-700 to-purple-600",
  "from-amber-700 to-orange-500",
  "from-rose-700 to-pink-600",
  "from-cyan-700 to-blue-600",
];

export function resolveAvatarUrl(url?: string | null): string | null {
  if (!url || typeof url !== "string" || !url.trim()) return null;
  const trimmed = url.trim();

  // If already absolute or data URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
    return trimmed;
  }

  // If relative path within storage bucket "avatars"
  const cleanPath = trimmed.replace(/^avatars\//, "").replace(/^\/+/, "");
  try {
    const { data } = supabase.storage.from("avatars").getPublicUrl(cleanPath);
    if (data?.publicUrl) return data.publicUrl;
  } catch {
    // fallback to static domain construction
  }
  return `https://c--7ad0105f-6669-4938-be38-c15c5f274fa4-prod.lovable.cloud/storage/v1/object/public/avatars/${cleanPath}`;
}

export function MemberAvatar({
  avatarUrl,
  name,
  username,
  size = "md",
  className = "",
  showStatus = false,
  isOnline = false,
}: MemberAvatarProps) {
  const [hasError, setHasError] = useState(false);

  const resolvedUrl = useMemo(() => resolveAvatarUrl(avatarUrl), [avatarUrl]);

  const initials = useMemo(() => {
    const displayName = (name || username || "Member").trim();
    const parts = displayName.split(/\s+/).filter(Boolean);
    const p0 = parts[0];
    const p1 = parts[1];
    if (p0 && p1) {
      return (p0[0] + p1[0]).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }, [name, username]);

  const gradientClass = useMemo(() => {
    const str = name || username || "user";
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % GRADIENTS.length;
    return GRADIENTS[idx];
  }, [name, username]);

  const dimensionClasses = SIZE_MAP[size] || SIZE_MAP.md;
  const statusClasses = STATUS_SIZE_MAP[size] || STATUS_SIZE_MAP.md;

  const showImage = resolvedUrl && !hasError;

  return (
    <div className={`relative inline-flex shrink-0 items-center justify-center rounded-full ${className}`}>
      {showImage ? (
        <img
          src={resolvedUrl}
          alt={name || username || "Member"}
          onError={() => setHasError(true)}
          className={`rounded-full object-cover select-none ${dimensionClasses}`}
          loading="lazy"
        />
      ) : (
        <div
          className={`flex items-center justify-center rounded-full bg-gradient-to-br ${gradientClass} text-white font-bold tracking-wider select-none shadow-sm ${dimensionClasses}`}
        >
          {initials}
        </div>
      )}

      {showStatus && (
        <span
          className={`absolute rounded-full ring-background ${statusClasses} ${
            isOnline ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"
          }`}
          title={isOnline ? "Online" : "Offline"}
        />
      )}
    </div>
  );
}
