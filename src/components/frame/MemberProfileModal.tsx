import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MemberAvatar, resolveAvatarUrl } from "@/components/frame/MemberAvatar";
import type { FullProfile } from "@/lib/social";
import {
  MessageSquare,
  MapPin,
  Calendar,
  Sparkles,
  Trophy,
  ExternalLink,
  Globe,
  Instagram,
  Twitter,
  Linkedin,
  Github,
  Youtube,
  Share2,
  Check,
} from "lucide-react";

interface MemberProfileModalProps {
  member: FullProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMessage?: (memberId: string) => void;
}

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  x: Twitter,
  twitter: Twitter,
  linkedin: Linkedin,
  github: Github,
  youtube: Youtube,
  website: Globe,
  portfolio: Globe,
};

export function MemberProfileModal({
  member,
  open,
  onOpenChange,
  onMessage,
}: MemberProfileModalProps) {
  const [copied, setCopied] = useState(false);

  if (!member) return null;

  const resolvedCover = resolveAvatarUrl(member.cover_url);
  const socials = Object.entries(member.social_links || {}).filter(([_, url]) => Boolean(url));

  const handleMessage = () => {
    onOpenChange(false);
    if (onMessage) {
      onMessage(member.id);
    } else {
      window.location.href = `/messages?user=${member.id}`;
    }
  };

  const handleCopyProfile = () => {
    const url = `${window.location.origin}/profile?u=${member.username || member.id}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg p-0 overflow-hidden border-border/60 bg-background/95 backdrop-blur-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{member.full_name || member.username || "Member Profile"}</DialogTitle>
        </DialogHeader>

        {/* Cover Banner */}
        <div className="relative h-36 sm:h-44 w-full bg-gradient-to-r from-maroon-900 via-stone-900 to-amber-950 overflow-hidden">
          {resolvedCover && (
            <img
              src={resolvedCover}
              alt="Cover"
              className="w-full h-full object-cover opacity-80"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          <button
            onClick={handleCopyProfile}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
            title="Share profile link"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 pb-6 pt-0 relative -mt-16">
          {/* Avatar and Top Actions */}
          <div className="flex items-end justify-between gap-4">
            <div className="ring-4 ring-background rounded-full bg-background shadow-xl">
              <MemberAvatar
                avatarUrl={member.avatar_url}
                name={member.full_name}
                username={member.username}
                size="2xl"
                showStatus={member.show_online}
                isOnline={member.show_online}
                className="w-24 h-24 sm:w-28 sm:h-28"
              />
            </div>

            <Button
              onClick={handleMessage}
              className="bg-maroon-700 hover:bg-maroon-800 text-white gap-2 shadow-lg shadow-maroon-900/30 font-semibold px-5"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Message</span>
            </Button>
          </div>

          {/* Names & Handle */}
          <div className="mt-4">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {member.full_name || member.username || "Anonymous Member"}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
              <span>@{member.username || "member"}</span>
              {member.location && (
                <span className="flex items-center gap-1">
                  • <MapPin className="w-3.5 h-3.5" /> {member.location}
                </span>
              )}
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5" />
              <span>{member.points || 0} pts</span>
            </div>
            {member.contributions ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-maroon-500/10 text-maroon-600 dark:text-maroon-400 border border-maroon-500/20 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{member.contributions} contributions</span>
              </div>
            ) : null}
            {member.created_at && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {new Date(member.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</span>
              </div>
            )}
          </div>

          {/* Bio */}
          {member.bio && (
            <p className="mt-4 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed bg-muted/30 p-3.5 rounded-xl border border-border/40">
              {member.bio}
            </p>
          )}

          {/* Talents */}
          {member.talents && member.talents.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Talents & Skills
              </div>
              <div className="flex flex-wrap gap-1.5">
                {member.talents.map((t, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="bg-maroon-500/10 hover:bg-maroon-500/20 text-maroon-700 dark:text-maroon-300 border-maroon-500/20 font-medium text-xs px-2.5 py-0.5"
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {member.interests && member.interests.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Interests
              </div>
              <div className="flex flex-wrap gap-1.5">
                {member.interests.map((item, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="border-border text-foreground/80 font-normal text-xs px-2.5 py-0.5"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {socials.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/50">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Connected Links
              </div>
              <div className="flex flex-wrap gap-2">
                {socials.map(([key, url]) => {
                  const Icon = SOCIAL_ICONS[key.toLowerCase()] || ExternalLink;
                  const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
                  return (
                    <a
                      key={key}
                      href={formattedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 hover:bg-muted text-foreground text-xs font-medium border border-border transition-colors group"
                    >
                      <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="capitalize">{key}</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-60" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
