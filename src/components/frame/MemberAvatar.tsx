import { useState, useMemo, useEffect } from "react";
import { signedUrl } from "@/lib/social";

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

/** Cleans a stored avatar value into a storage path (or returns an absolute URL). */
function avatarPath(url?: string | null): string | null {
  if (!url || typeof url !== "string" || !url.trim()) return null;
  const trimmed = url.trim();
  const m = trimmed.match(/\/storage\/v1\/object\/(?:public|sign)\/avatars\/([^?]+)/);
  if (m?.[1]) return decodeURIComponent(m[1]);
  if (/^(https?:|data:|blob:)/.test(trimmed)) return trimmed;
  return trimmed.replace(/^avatars\//, "").replace(/^\/+/, "");
}

/** Returns a viewable URL for a stored avatar/cover; works on any host. */
export function useAvatarUrl(url?: string | null): string | null {
  const path = avatarPath(url);
  const [resolved, setResolved] = useState<string | null>(
    path && /^(https?:|data:|blob:)/.test(path) ? path : null,
  );
  useEffect(() => {
    let alive = true;
    if (!path) {
      setResolved(null);
      return;
    }
    if (/^(https?:|data:|blob:)/.test(path)) {
      setResolved(path);
      return;
    }
    void signedUrl("avatars", path).then((u) => alive && setResolved(u));
    return () => {
      alive = false;
    };
  }, [path]);
  return resolved;
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

  const resolvedUrl = useAvatarUrl(avatarUrl);

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
