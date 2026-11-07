import { useEffect, useState } from "react";
import { Play, Maximize2, X, ExternalLink, Image as ImageIcon, Video, Film } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl, youtubeId } from "@/lib/social";
import { t, useLang } from "@/hooks/use-lang";

export type FeaturedMediaItem = {
  id: string;
  title: string | null;
  kind: "image" | "video" | "youtube" | string;
  url: string;
  placement: "home" | "events" | "news" | string;
  created_at: string;
};

export function FeaturedMediaSpotlight({
  placement = "home",
  className = "",
}: {
  placement?: "home" | "events" | "news";
  className?: string;
}) {
  const { lang } = useLang();
  const [items, setItems] = useState<FeaturedMediaItem[]>([]);
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const [activeMedia, setActiveMedia] = useState<FeaturedMediaItem | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      const { data, error } = await supabase
        .from("featured_media")
        .select("id, title, kind, url, placement, created_at")
        .eq("placement", placement)
        .order("created_at", { ascending: false })
        .limit(6);

      if (!error && data && alive) {
        setItems(data as FeaturedMediaItem[]);

        // Resolve storage URLs for image / video
        const urls: Record<string, string> = {};
        for (const it of data) {
          if (it.kind === "image" || it.kind === "video") {
            const signed = await signedUrl("media", it.url);
            urls[it.id] = signed || it.url;
          } else {
            urls[it.id] = it.url;
          }
        }
        if (alive) setResolvedUrls(urls);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [placement]);

  if (items.length === 0) return null;

  return (
    <div className={`mt-14 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] font-semibold tracking-[0.24em] text-maroon-accent uppercase">
            {t(lang, { en: "Spotlight", fr: "En vedette", ar: "أضواء" })}
          </p>
          <h2 className="mt-1 font-display text-[26px]">
            {t(lang, {
              en: "Moments & Media",
              fr: "Galerie & Médias",
              ar: "معرض الوسائط واللحظات",
            })}
          </h2>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const mediaUrl = resolvedUrls[item.id] || item.url;
          const yId = item.kind === "youtube" ? youtubeId(item.url) : null;

          return (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-xl border border-border bg-card/60 transition-all duration-300 hover:border-maroon-accent/50 hover:shadow-lg"
            >
              {/* Media Preview Box */}
              <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                {item.kind === "youtube" && yId ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${yId}?rel=0&modestbranding=1`}
                    title={item.title || "YouTube video"}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : item.kind === "video" ? (
                  <div
                    className="relative flex h-full w-full cursor-pointer items-center justify-center"
                    onClick={() => setActiveMedia(item)}
                  >
                    <video
                      src={mediaUrl}
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/10">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-maroon-accent/90 text-paper shadow-md transition-transform group-hover:scale-110">
                        <Play className="ml-0.5 h-6 w-6 fill-current" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden"
                    onClick={() => setActiveMedia(item)}
                  >
                    <img
                      src={mediaUrl}
                      alt={item.title || "Featured"}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 right-2.5 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <Maximize2 className="h-4 w-4" />
                    </div>
                  </div>
                )}
              </div>

              {/* Title / Badge */}
              <div className="p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate font-display text-[15px] font-medium text-foreground">
                    {item.title ||
                      t(lang, { en: "Featured item", fr: "Élément en vedette", ar: "عنصر مميز" })}
                  </h3>
                  <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-muted-foreground uppercase">
                    {item.kind === "youtube" ? (
                      <>
                        <Film className="h-3 w-3 text-red-500" /> YouTube
                      </>
                    ) : item.kind === "video" ? (
                      <>
                        <Video className="h-3 w-3 text-maroon-accent" /> Video
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-3 w-3 text-blue-400" /> Photo
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox / Fullscreen Modal */}
      {activeMedia && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={() => setActiveMedia(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-xl border border-border bg-card p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveMedia(null)}
              className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {activeMedia.kind === "video" ? (
              <video
                src={resolvedUrls[activeMedia.id] || activeMedia.url}
                controls
                autoPlay
                playsInline
                className="max-h-[80vh] w-full rounded-lg"
              />
            ) : (
              <img
                src={resolvedUrls[activeMedia.id] || activeMedia.url}
                alt={activeMedia.title || "Full preview"}
                className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain"
              />
            )}

            {activeMedia.title && (
              <div className="p-3 text-center">
                <p className="font-display text-[17px] font-medium">{activeMedia.title}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
