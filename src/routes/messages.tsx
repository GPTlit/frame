import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MessageSquare,
  Users,
  Search,
  Plus,
  Send,
  Paperclip,
  Mic,
  MoreVertical,
  Reply,
  Trash2,
  ShieldAlert,
  UserX,
  ArrowLeft,
  CheckCheck,
  FileText,
  Copy,
  ExternalLink,
  X,
  Volume2,
  User,
} from "lucide-react";
import { AuthModal } from "@/components/frame/AuthGate";
import { useAuth } from "@/hooks/use-auth";
import { useLang, t } from "@/hooks/use-lang";
import { supabase } from "@/integrations/supabase/client";
import {
  signedUrl,
  uploadChatFile,
  uploadGroupPicture,
  createGroup,
  startDirect,
  setBlock,
  report,
  kindForFile,
  validateUpload,
  type Conversation,
  type Message,
  type FullProfile,
} from "@/lib/social";
import { listProfiles, displayName, type Profile } from "@/lib/profiles";
import { MemberAvatar } from "@/components/frame/MemberAvatar";
import { MemberProfileModal } from "@/components/frame/MemberProfileModal";

export const Route = createFileRoute("/messages")({
  validateSearch: (search: Record<string, unknown>): { user?: string | undefined } => ({
    user: typeof search["user"] === "string" ? (search["user"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Messages & Community — FRAME Mauritania" },
      {
        name: "description",
        content: "Connect, direct message and join community groups with FRAME Mauritania members.",
      },
      { property: "og:title", content: "Messages & Community — FRAME Mauritania" },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <main className="grid min-h-[60vh] place-items-center pt-[92px]">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-maroon-accent border-t-transparent" />
      </main>
    );
  }
  if (!user) {
    return <VisitorCommunityScreen />;
  }
  return <ChatInterface />;
}

function VisitorCommunityScreen() {
  const { lang } = useLang();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<FullProfile | null>(null);

  useEffect(() => {
    listProfiles()
      .then(setProfiles)
      .catch(() => setProfiles([]));
  }, []);

  const channels = [
    {
      title: t(lang, {
        en: "Strategy & Chess Lounge",
        fr: "Stratégie & Échecs",
        ar: "استراتيجية وشطرنج",
      }),
      desc: t(lang, {
        en: "Tactics, game challenges, and mind sport analysis.",
        fr: "Tactiques, défis et analyse des sports cérébraux.",
        ar: "تكتيكات وتحليل ألعاب التفكير والمنافسات.",
      }),
      members: "124",
      tag: "Strategy",
    },
    {
      title: t(lang, {
        en: "Tech, Code & AI Labs",
        fr: "Tech, Code & IA",
        ar: "التكنولوجيا والبرمجة والذكاء الاصطناعي",
      }),
      desc: t(lang, {
        en: "Software engineers, builders, and designers building for Mauritania.",
        fr: "Développeurs et créateurs bâtissant pour la Mauritanie.",
        ar: "مهندسون ومطورون يبنون حلولاً تقنية لموريتانيا.",
      }),
      members: "98",
      tag: "Engineering",
    },
    {
      title: t(lang, {
        en: "Arts, Media & Poetry",
        fr: "Arts, Médias & Poésie",
        ar: "الفنون والإعلام والأدب",
      }),
      desc: t(lang, {
        en: "Photographers, writers, poets, and filmmakers.",
        fr: "Photographes, écrivains, poètes et cinéastes.",
        ar: "مصورون، كتاب، شعراء وصناع محتوى مرئي.",
      }),
      members: "86",
      tag: "Arts",
    },
    {
      title: t(lang, {
        en: "National Impact & Debates",
        fr: "Impact & Débats",
        ar: "الأثر المجتمعي والمناظرات",
      }),
      desc: t(lang, {
        en: "Civic initiatives, public speaking, and youth programs.",
        fr: "Initiatives citoyennes, prise de parole et projets jeunesse.",
        ar: "مبادرات مجتمعية، فن الخطابة ومشاريع شبابية.",
      }),
      members: "142",
      tag: "Impact",
    },
  ];

  return (
    <main className="pt-[92px]">
      <section className="wrap py-12">
        <div className="max-w-3xl">
          <p className="text-[12px] font-semibold tracking-[0.28em] text-maroon-accent uppercase">
            {t(lang, {
              en: "Community & Network",
              fr: "Communauté & Réseau",
              ar: "المجتمع والتواصل",
            })}
          </p>
          <h1 className="mt-3 font-display text-[clamp(32px,5vw,56px)] leading-[1.05]">
            {t(lang, {
              en: "Connect with Mauritania's talent arena",
              fr: "Rejoignez l'arène des talents mauritaniens",
              ar: "تواصل مع نخبة المواهب الموريتانية",
            })}
          </h1>
          <p className="mt-4 text-[15.5px] text-muted-foreground leading-relaxed">
            {t(lang, {
              en: "Direct messaging, strategic group channels, and collaborative arena discussions for registered FRAME members.",
              fr: "Messagerie directe, canaux de discussion stratégiques et collaborations pour les membres FRAME.",
              ar: "مراسلة مباشرة، مجموعات نقاش استراتيجية، وتعاون مستمر بين أعضاء منصة إطار المسجلين.",
            })}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="rounded-md bg-[image:var(--gradient-ember)] px-6 py-2.5 text-sm font-semibold text-paper shadow-md transition hover:opacity-95"
            >
              {t(lang, {
                en: "Sign In to Join Chat",
                fr: "Se connecter pour discuter",
                ar: "سجّل الدخول للمشاركة",
              })}
            </button>
          </div>
        </div>

        {/* Featured Channels */}
        <div className="mt-12">
          <h2 className="font-display text-xl font-bold mb-4">
            {t(lang, {
              en: "Active Discussion Arenas",
              fr: "Canaux de discussion actifs",
              ar: "أروقة النقاش النشطة",
            })}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {channels.map((ch) => (
              <div
                key={ch.title}
                className="rounded-xl border border-border bg-card p-5 hover:border-maroon-accent/50 transition cursor-pointer"
                onClick={() => setAuthModalOpen(true)}
              >
                <div className="flex items-center justify-between">
                  <span className="pc-tag text-xs">{ch.tag}</span>
                  <span className="text-xs text-muted-foreground">{ch.members} members</span>
                </div>
                <h3 className="mt-3 font-display text-lg font-bold">{ch.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{ch.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Members Spotlight */}
        {profiles.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-xl font-bold mb-4">
              {t(lang, {
                en: "Discover Members",
                fr: "Découvrir les membres",
                ar: "استكشف الأعضاء",
              })}
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
              {profiles.slice(0, 10).map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProfile({
                      id: p.id,
                      username: p.username,
                      full_name: p.full_name,
                      avatar_url: p.avatar_url,
                      cover_url: p.cover_url ?? null,
                      bio: p.bio ?? null,
                      location: p.location ?? null,
                      talents: p.talents ?? [],
                      interests: p.interests ?? [],
                      social_links: p.social_links ?? {},
                      show_online: p.show_online ?? false,
                      last_seen: p.last_seen ?? null,
                      points: p.points ?? 0,
                      contributions: p.contributions ?? 0,
                    });
                  }}
                  className="w-44 shrink-0 rounded-xl border border-border bg-card p-4 text-center cursor-pointer hover:border-maroon-accent transition"
                >
                  <MemberAvatar
                    avatarUrl={p.avatar_url}
                    name={p.full_name}
                    username={p.username}
                    size="xl"
                    className="mx-auto"
                  />
                  <div className="mt-3 truncate font-semibold text-sm">{displayName(p)}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    @{p.username || "frame"}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-maroon-accent">
                    {p.points} pts
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <MemberProfileModal
        member={selectedProfile}
        open={Boolean(selectedProfile)}
        onOpenChange={(isOpen) => !isOpen && setSelectedProfile(null)}
        onMessage={() => setAuthModalOpen(true)}
      />
    </main>
  );
}

const EMOJIS = ["👍", "❤️", "🔥", "🏆", "👏", "⚡"];

function ChatInterface() {
  const { user } = useAuth();
  const { lang } = useLang();
  const { user: targetUserId } = Route.useSearch();

  // Navigation / state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, Profile>>({});
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "direct" | "members" | "groups">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Profile modal state
  const [inspectedMember, setInspectedMember] = useState<FullProfile | null>(null);

  // Messages state
  const [messages, setMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<Record<string, Record<string, string[]>>>({});
  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [mediaSignedUrls, setMediaSignedUrls] = useState<Record<string, string>>({});
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);

  // Modals
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // New Group Form
  const [groupTitle, setGroupTitle] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [groupCat, setGroupCat] = useState("General");
  const [groupIsPublic, setGroupIsPublic] = useState(true);
  const [groupFile, setGroupFile] = useState<File | null>(null);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Join by code form
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);

  // All profiles list
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);

  // References
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load user's conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const { data: memberRows } = await supabase
        .from("conversation_members")
        .select("conversation_id, role, pinned, archived, last_read_at")
        .eq("user_id", user.id);

      if (!memberRows || memberRows.length === 0) {
        setConversations([]);
        return;
      }

      const convIds = memberRows.map((r) => r.conversation_id);
      const { data: convData } = await supabase
        .from("conversations")
        .select("*")
        .in("id", convIds)
        .order("last_message_at", { ascending: false });

      if (convData) {
        setConversations(convData as Conversation[]);
      }
    } catch {
      /* ignore */
    }
  }, [user]);

  // Load all profiles
  useEffect(() => {
    let alive = true;
    listProfiles().then((list) => {
      if (!alive) return;
      setAllProfiles(list);
      const map: Record<string, Profile> = {};
      list.forEach((p) => {
        map[p.id] = p;
      });
      setProfilesMap(map);
    });
    void loadConversations();
    return () => {
      alive = false;
    };
  }, [user, loadConversations]);

  // Active conversation object
  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeConvId) ?? null,
    [conversations, activeConvId],
  );

  // Direct chat other member
  const [directPartner, setDirectPartner] = useState<Profile | null>(null);

  useEffect(() => {
    if (!activeConv || activeConv.is_group || !user) {
      setDirectPartner(null);
      return;
    }
    let alive = true;
    supabase
      .from("conversation_members")
      .select("user_id")
      .eq("conversation_id", activeConv.id)
      .neq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive || !data) return;
        const p = profilesMap[data.user_id];
        if (p) setDirectPartner(p);
      });
    return () => {
      alive = false;
    };
  }, [activeConv, user, profilesMap]);

  // Handle target user from URL query param (?user=xyz)
  useEffect(() => {
    if (!targetUserId || !user) return;
    let alive = true;

    async function openUserChat() {
      try {
        const convId = await startDirect(targetUserId!);
        if (alive) {
          await loadConversations();
          setActiveConvId(convId);
          setMobileShowChat(true);
        }
      } catch {
        /* ignore */
      }
    }
    void openUserChat();
    return () => {
      alive = false;
    };
  }, [targetUserId, user, loadConversations]);

  // Load messages & subscribe to realtime
  useEffect(() => {
    if (!activeConvId || !user) {
      setMessages([]);
      return;
    }

    let alive = true;

    async function fetchMessages() {
      const { data: msgs, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeConvId!)
        .order("created_at", { ascending: true })
        .limit(150);

      if (!error && msgs && alive) {
        setMessages(msgs as Message[]);

        const urls: Record<string, string> = {};
        for (const m of msgs) {
          if (m.media_path) {
            const url = await signedUrl("chat-media", m.media_path);
            if (url) urls[m.id] = url;
          }
        }
        if (alive) setMediaSignedUrls(urls);
      }
    }

    async function fetchReactions() {
      const { data: rData } = await supabase
        .from("message_reactions")
        .select("message_id, user_id, emoji")
        .eq("conversation_id", activeConvId!);

      if (rData && alive) {
        const grouped: Record<string, Record<string, string[]>> = {};
        for (const r of rData) {
          if (!grouped[r.message_id]) grouped[r.message_id] = {};
          const emojiGroup = grouped[r.message_id]!;
          if (!emojiGroup[r.emoji]) emojiGroup[r.emoji] = [];
          emojiGroup[r.emoji]!.push(r.user_id);
        }
        setReactions(grouped);
      }
    }

    void fetchMessages();
    void fetchReactions();

    void supabase
      .from("conversation_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", activeConvId)
      .eq("user_id", user.id);

    const msgChannel = supabase
      .channel(`chat_${activeConvId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConvId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (newMsg.media_path) {
            const signed = await signedUrl("chat-media", newMsg.media_path);
            if (signed) {
              setMediaSignedUrls((p) => ({ ...p, [newMsg.id]: signed }));
            }
          }
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
          filter: `conversation_id=eq.${activeConvId}`,
        },
        () => {
          void fetchReactions();
        },
      )
      .subscribe();

    return () => {
      alive = false;
      void supabase.removeChannel(msgChannel);
    };
  }, [activeConvId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!inputText.trim() || !activeConvId || !user || isSending) return;
    setIsSending(true);
    const body = inputText.trim();
    const replyId = replyingTo?.id ?? null;
    setInputText("");
    setReplyingTo(null);

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: activeConvId,
        sender_id: user.id,
        body,
        kind: "text",
        reply_to: replyId,
      });
      if (error) throw error;
      void loadConversations();
    } catch (e) {
      console.error("Failed to send message:", e);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!activeConvId || !user) return;
    const err = validateUpload(file);
    if (err) {
      alert(err);
      return;
    }

    setIsSending(true);
    try {
      const kind = kindForFile(file);
      const storagePath = await uploadChatFile(activeConvId, user.id, file, file.name);

      await supabase.from("messages").insert({
        conversation_id: activeConvId,
        sender_id: user.id,
        body: file.name,
        kind,
        media_path: storagePath,
        media_name: file.name,
        reply_to: replyingTo?.id ?? null,
      });
      setReplyingTo(null);
      void loadConversations();
    } catch (e) {
      console.error("Upload error:", e);
      alert("Failed to upload file");
    } finally {
      setIsSending(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (audioBlob.size > 1000 && activeConvId && user) {
          setIsSending(true);
          try {
            const path = await uploadChatFile(
              activeConvId,
              user.id,
              audioBlob,
              `voice-${Date.now()}.webm`,
            );
            await supabase.from("messages").insert({
              conversation_id: activeConvId,
              sender_id: user.id,
              body: "Voice message",
              kind: "audio",
              media_path: path,
              media_name: "voice.webm",
            });
            void loadConversations();
          } catch (e) {
            console.error("Failed to send voice message:", e);
          } finally {
            setIsSending(false);
          }
        }
      };

      recorder.start(200);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordDuration(0);

      recordTimerRef.current = window.setInterval(() => {
        setRecordDuration((d) => d + 1);
      }, 1000);
    } catch {
      alert("Microphone access is required to record audio.");
    }
  };

  const stopRecording = (cancel = false) => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setIsRecording(false);
    if (cancel) {
      audioChunksRef.current = [];
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user || !activeConvId) return;
    const currentUsers = reactions[messageId]?.[emoji] ?? [];
    const hasReacted = currentUsers.includes(user.id);

    try {
      if (hasReacted) {
        await supabase
          .from("message_reactions")
          .delete()
          .eq("message_id", messageId)
          .eq("user_id", user.id)
          .eq("emoji", emoji);
      } else {
        await supabase.from("message_reactions").insert({
          message_id: messageId,
          user_id: user.id,
          emoji,
          conversation_id: activeConvId,
        });
      }
    } catch {
      /* ignore */
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm("Delete message?")) return;
    try {
      await supabase.from("messages").delete().eq("id", msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch {
      /* ignore */
    }
  };

  const handleStartDirect = async (otherUserId: string) => {
    try {
      const convId = await startDirect(otherUserId);
      await loadConversations();
      setActiveConvId(convId);
      setMobileShowChat(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not start chat");
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupTitle.trim()) return;
    setCreatingGroup(true);
    try {
      let avatarUrl: string | null = null;
      if (groupFile) {
        avatarUrl = await uploadGroupPicture(groupFile);
      }
      const newId = await createGroup({
        title: groupTitle.trim(),
        description: groupDesc.trim(),
        avatar: avatarUrl,
        category: groupCat,
        isPublic: groupIsPublic,
        members: [],
      });
      setShowNewGroupModal(false);
      setGroupTitle("");
      setGroupDesc("");
      setGroupFile(null);
      await loadConversations();
      setActiveConvId(newId);
      setMobileShowChat(true);
    } catch (err) {
      setStatusToast(err instanceof Error ? err.message : "Error creating group");
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleJoinInvite = async () => {
    if (!inviteCodeInput.trim()) return;
    setInviteError(null);
    try {
      const { data, error } = await supabase.rpc("join_by_invite", {
        _code: inviteCodeInput.trim().toLowerCase(),
      });
      if (error) throw error;
      setShowInviteModal(false);
      setInviteCodeInput("");
      await loadConversations();
      if (data) {
        setActiveConvId(data as string);
        setMobileShowChat(true);
      }
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Invalid invite code");
    }
  };

  const handleBlock = async () => {
    if (!directPartner || !user) return;
    try {
      await setBlock(user.id, directPartner.id, true);
      setStatusToast(`Blocked @${directPartner.username || "member"}`);
      setActiveConvId(null);
      void loadConversations();
    } catch {
      setStatusToast("Failed to block member");
    }
  };

  const handleReport = async () => {
    if (!user || !reportReason.trim()) return;
    try {
      await report(user.id, reportReason.trim(), directPartner?.id);
      setShowReportModal(false);
      setReportReason("");
      setStatusToast("Report submitted to administrators.");
    } catch {
      setStatusToast("Failed to submit report");
    }
  };

  const filteredConvs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return conversations.filter((c) => {
      if (activeTab === "direct" && c.is_group) return false;
      if (activeTab === "groups" && !c.is_group) return false;
      if (!q) return true;
      if (c.title?.toLowerCase().includes(q)) return true;
      if (c.category?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [conversations, activeTab, searchQuery]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allProfiles.filter((p) => {
      if (p.id === user?.id) return false;
      if (!q) return true;
      return (
        p.full_name?.toLowerCase().includes(q) ||
        p.username?.toLowerCase().includes(q) ||
        p.talents?.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [allProfiles, user, searchQuery]);

  const openProfileModalFor = (p: Profile) => {
    setInspectedMember({
      id: p.id,
      username: p.username,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      cover_url: p.cover_url ?? null,
      bio: p.bio ?? null,
      location: p.location ?? null,
      talents: p.talents ?? [],
      interests: p.interests ?? [],
      social_links: p.social_links ?? {},
      show_online: p.show_online ?? false,
      last_seen: p.last_seen ?? null,
      points: p.points ?? 0,
      contributions: p.contributions ?? 0,
    });
  };

  return (
    <main className="pt-[76px] h-screen w-full flex flex-col overflow-hidden bg-background">
      {statusToast && (
        <div className="fixed top-24 right-6 z-100 flex items-center gap-2 rounded-xl border border-maroon-accent/40 bg-background/95 px-4 py-2.5 text-xs font-semibold text-foreground shadow-xl backdrop-blur animate-fade-in">
          <span>{statusToast}</span>
          <button
            type="button"
            onClick={() => setStatusToast(null)}
            className="text-muted-foreground hover:text-foreground ml-2 text-base leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* FULL PAGE EDGE-TO-EDGE CHAT CONTAINER */}
      <div className="flex-1 flex overflow-hidden w-full h-[calc(100vh-76px)]">
        {/* ================= LEFT SIDEBAR ================= */}
        <div
          className={`w-full md:w-[320px] lg:w-[360px] shrink-0 border-r border-border bg-card/60 flex flex-col h-full overflow-hidden ${
            mobileShowChat ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Header */}
          <div className="border-b border-border p-4 shrink-0 bg-background/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <h1 className="font-display text-[20px] font-bold text-foreground">
                {t(lang, { en: "Messages", fr: "Messages", ar: "الرسائل" })}
              </h1>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Join by Code"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewGroupModal(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-[image:var(--gradient-ember)] text-paper shadow-sm transition-opacity hover:opacity-90"
                  title="Create Group"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(lang, {
                  en: "Search chats & members...",
                  fr: "Rechercher...",
                  ar: "بحث في المحادثات...",
                })}
                className="w-full rounded-xl border border-input bg-background/80 py-2 pr-3 pl-9 text-[13px] outline-none focus:border-maroon-accent transition-colors"
              />
            </div>

            {/* Tabs */}
            <div className="mt-3 flex gap-1 rounded-xl bg-muted/70 p-1 text-[11.5px] font-medium">
              {(["all", "direct", "members", "groups"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 rounded-lg py-1.5 text-center transition-all ${
                    activeTab === tab
                      ? "bg-background font-bold text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "all"
                    ? t(lang, { en: "Chats", fr: "Chats", ar: "الكل" })
                    : tab === "direct"
                      ? t(lang, { en: "Direct", fr: "Direct", ar: "خاص" })
                      : tab === "members"
                        ? t(lang, { en: "Members", fr: "Membres", ar: "الأعضاء" })
                        : t(lang, { en: "Groups", fr: "Groupes", ar: "مجموعات" })}
                </button>
              ))}
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {activeTab === "members" ? (
              /* Members directory tab */
              filteredMembers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <User className="mx-auto h-8 w-8 opacity-40" />
                  <p className="mt-2 text-xs">No members found</p>
                </div>
              ) : (
                filteredMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3.5 hover:bg-muted/50 transition-colors group"
                  >
                    <button
                      type="button"
                      onClick={() => void handleStartDirect(m.id)}
                      className="flex items-center gap-3 min-w-0 flex-1 text-left"
                    >
                      <MemberAvatar
                        avatarUrl={m.avatar_url}
                        name={m.full_name}
                        username={m.username}
                        size="md"
                        showStatus={m.show_online}
                        isOnline={m.show_online}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-sm text-foreground group-hover:text-maroon-700 transition-colors">
                          {displayName(m)}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          @{m.username || "member"} · {m.points} pts
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => openProfileModalFor(m)}
                      className="p-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted ml-2"
                      title="View Profile"
                    >
                      <User className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )
            ) : filteredConvs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="mx-auto h-8 w-8 opacity-40" />
                <p className="mt-2 text-sm font-medium">
                  {t(lang, {
                    en: "No conversations yet.",
                    fr: "Aucune conversation.",
                    ar: "لا توجد محادثات بعد.",
                  })}
                </p>
                <p className="mt-1 text-xs">
                  {t(lang, {
                    en: "Start a chat with any member below.",
                    fr: "Démarrez une discussion avec un membre ci-dessous.",
                    ar: "ابدأ محادثة مع أي عضو أدناه.",
                  })}
                </p>
              </div>
            ) : (
              filteredConvs.map((conv) => {
                const isSelected = conv.id === activeConvId;
                const isGroup = conv.is_group;

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => {
                      setActiveConvId(conv.id);
                      setMobileShowChat(true);
                    }}
                    className={`flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-muted/50 cursor-pointer ${
                      isSelected ? "bg-muted/80 border-l-3 border-maroon-700" : ""
                    }`}
                  >
                    <div className="relative flex shrink-0 items-center justify-center">
                      {isGroup ? (
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-bold text-maroon-accent">
                          {conv.avatar_url ? (
                            <img
                              src={conv.avatar_url}
                              alt=""
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            <Users className="h-5 w-5" />
                          )}
                        </div>
                      ) : (
                        <MemberAvatar
                          avatarUrl={conv.avatar_url}
                          name={conv.title}
                          size="md"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate font-display text-[14.5px] font-semibold text-foreground">
                          {conv.title || (isGroup ? "Group Chat" : "Direct Message")}
                        </span>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {new Date(conv.last_message_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between text-[12px] text-muted-foreground">
                        <span className="truncate">
                          {conv.description || (isGroup ? conv.category || "General" : "Click to chat")}
                        </span>
                        {isGroup && (
                          <span className="ml-1 inline-flex items-center rounded-xs bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-maroon-accent uppercase">
                            {conv.is_public ? "Public" : "Private"}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}

            {/* Quick Members Discovery Bar (Always at bottom of sidebar) */}
            {allProfiles.length > 0 && activeTab !== "members" && (
              <div className="p-3 bg-muted/30 border-t border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Direct with Members
                  </span>
                  <button
                    onClick={() => setActiveTab("members")}
                    className="text-[11px] font-semibold text-maroon-accent hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {allProfiles
                    .filter((p) => p.id !== user?.id)
                    .slice(0, 8)
                    .map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => void handleStartDirect(p.id)}
                        className="group flex flex-col items-center gap-1 rounded-lg p-1 hover:bg-muted/80 shrink-0 cursor-pointer"
                        title={`Chat with ${displayName(p)}`}
                      >
                        <MemberAvatar
                          avatarUrl={p.avatar_url}
                          name={p.full_name}
                          username={p.username}
                          size="sm"
                          showStatus={p.show_online}
                          isOnline={p.show_online}
                        />
                        <span className="max-w-[54px] truncate text-[10px] text-muted-foreground group-hover:text-foreground">
                          {p.username || "user"}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT PANEL: DEDICATED FULL-VIEW CHAT ================= */}
        <div
          className={`flex-1 flex flex-col h-full bg-background/50 relative overflow-hidden ${
            !mobileShowChat ? "hidden md:flex" : "flex"
          }`}
        >
          {activeConv ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border bg-card/90 px-4 py-3 shrink-0 backdrop-blur-md">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileShowChat(false)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted md:hidden"
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  {/* Header Avatar */}
                  <div
                    onClick={() => {
                      if (directPartner) openProfileModalFor(directPartner);
                    }}
                    className={directPartner ? "cursor-pointer" : ""}
                  >
                    {activeConv.is_group ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary font-bold text-maroon-accent">
                        {activeConv.avatar_url ? (
                          <img
                            src={activeConv.avatar_url}
                            alt=""
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <Users className="h-5 w-5" />
                        )}
                      </div>
                    ) : (
                      <MemberAvatar
                        avatarUrl={directPartner?.avatar_url}
                        name={directPartner?.full_name}
                        username={directPartner?.username}
                        size="md"
                        showStatus={directPartner?.show_online}
                        isOnline={directPartner?.show_online}
                      />
                    )}
                  </div>

                  {/* Header Title & Details */}
                  <div
                    onClick={() => {
                      if (directPartner) openProfileModalFor(directPartner);
                    }}
                    className={`min-w-0 ${directPartner ? "cursor-pointer" : ""}`}
                  >
                    <h2 className="font-display text-[16px] font-bold text-foreground truncate hover:text-maroon-700 transition-colors">
                      {activeConv.is_group
                        ? activeConv.title
                        : directPartner
                          ? displayName(directPartner)
                          : "Direct Chat"}
                    </h2>
                    <p className="text-[12px] text-muted-foreground truncate">
                      {activeConv.is_group ? (
                        <span>
                          {activeConv.category} · {activeConv.is_public ? "Public Group" : "Private"}
                        </span>
                      ) : directPartner ? (
                        <span className="flex items-center gap-1.5">
                          <span>@{directPartner.username || "member"}</span>
                          {directPartner.show_online && (
                            <span className="text-emerald-500 font-semibold">• Online</span>
                          )}
                        </span>
                      ) : (
                        "Direct message"
                      )}
                    </p>
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-2">
                  {!activeConv.is_group && directPartner && (
                    <button
                      type="button"
                      onClick={() => openProfileModalFor(directPartner)}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted hover:border-maroon-accent transition-colors"
                    >
                      <User className="h-3.5 w-3.5 text-maroon-accent" />
                      <span className="hidden sm:inline">View Profile</span>
                    </button>
                  )}

                  {activeConv.is_group && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(activeConv.invite_code);
                        setStatusToast(`Invite code copied: ${activeConv.invite_code}`);
                      }}
                      className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[12px] font-medium text-muted-foreground hover:bg-muted"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Code: {activeConv.invite_code}</span>
                    </button>
                  )}

                  {!activeConv.is_group && directPartner && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowReportModal(true)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                        title="Report User"
                      >
                        <ShieldAlert className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleBlock()}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                        title="Block User"
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 text-maroon-accent/40" />
                    <p className="mt-3 font-display text-lg font-bold text-foreground">
                      No messages yet
                    </p>
                    <p className="mt-1 text-sm max-w-xs">
                      Say hello to {activeConv.is_group ? activeConv.title : directPartner?.full_name || "member"}!
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id === user?.id;
                    const sender = profilesMap[m.sender_id];
                    const mediaUrl = mediaSignedUrls[m.id];
                    const msgReactions = reactions[m.id] || {};

                    return (
                      <div
                        key={m.id}
                        className={`group flex items-end gap-2.5 ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        {/* Sender Avatar */}
                        {!isMe && (
                          <div
                            onClick={() => sender && openProfileModalFor(sender)}
                            className="cursor-pointer mb-1 shrink-0"
                          >
                            <MemberAvatar
                              avatarUrl={sender?.avatar_url}
                              name={sender?.full_name}
                              username={sender?.username}
                              size="sm"
                            />
                          </div>
                        )}

                        {/* Bubble */}
                        <div
                          className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-[14px] shadow-sm ${
                            isMe
                              ? "bg-[image:var(--gradient-ember)] text-paper rounded-br-xs"
                              : "bg-card border border-border text-foreground rounded-bl-xs"
                          }`}
                        >
                          {!isMe && activeConv.is_group && (
                            <p
                              onClick={() => sender && openProfileModalFor(sender)}
                              className="mb-1 text-[11px] font-bold text-maroon-accent cursor-pointer hover:underline"
                            >
                              {sender ? displayName(sender) : "Member"}
                            </p>
                          )}

                          {m.reply_to && (
                            <div className="mb-2 rounded-md border-l-2 border-primary/50 bg-black/10 p-1.5 text-[11.5px] opacity-80">
                              <span>Replied message</span>
                            </div>
                          )}

                          {m.kind === "text" && (
                            <p className="whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>
                          )}

                          {m.kind === "image" && mediaUrl && (
                            <div className="overflow-hidden rounded-lg mt-1">
                              <img
                                src={mediaUrl}
                                alt={m.media_name || "Photo"}
                                className="max-h-72 w-auto cursor-pointer rounded-lg object-contain hover:opacity-95"
                                onClick={() => setLightboxImage(mediaUrl)}
                              />
                            </div>
                          )}

                          {m.kind === "video" && mediaUrl && (
                            <div className="overflow-hidden rounded-lg mt-1">
                              <video
                                src={mediaUrl}
                                controls
                                playsInline
                                className="max-h-72 w-full rounded-lg"
                              />
                            </div>
                          )}

                          {m.kind === "audio" && mediaUrl && (
                            <div className="flex items-center gap-2 py-1">
                              <Volume2 className="h-5 w-5 shrink-0 opacity-80" />
                              <audio src={mediaUrl} controls className="h-8 max-w-[220px]" />
                            </div>
                          )}

                          {m.kind === "file" && mediaUrl && (
                            <a
                              href={mediaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 rounded-lg bg-black/10 p-2 font-medium underline underline-offset-2 hover:bg-black/20"
                            >
                              <FileText className="h-5 w-5 shrink-0" />
                              <span className="truncate">{m.media_name || "Document"}</span>
                            </a>
                          )}

                          {/* Time & Read receipts */}
                          <div className="mt-1 flex items-center justify-end gap-1.5 text-[10.5px] opacity-75">
                            <span>
                              {new Date(m.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isMe && <CheckCheck className="h-3.5 w-3.5" />}
                          </div>

                          {/* Reactions */}
                          {Object.keys(msgReactions).length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {Object.entries(msgReactions).map(([emoji, uids]) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => void toggleReaction(m.id, emoji)}
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                                    uids.includes(user?.id || "")
                                      ? "bg-maroon-accent/30 ring-1 ring-maroon-accent"
                                      : "bg-black/10 hover:bg-black/20"
                                  }`}
                                >
                                  <span>{emoji}</span>
                                  <span>{uids.length}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Action buttons on hover */}
                        <div className="opacity-0 transition-opacity group-hover:opacity-100 flex items-center gap-1">
                          <div className="flex rounded-full bg-card border border-border p-0.5 shadow-xs">
                            {EMOJIS.slice(0, 3).map((em) => (
                              <button
                                key={em}
                                type="button"
                                onClick={() => void toggleReaction(m.id, em)}
                                className="px-1 text-[13px] hover:scale-120 transition-transform"
                              >
                                {em}
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => setReplyingTo(m)}
                            className="rounded-full bg-card border border-border p-1 text-muted-foreground hover:text-foreground"
                            title="Reply"
                          >
                            <Reply className="h-3.5 w-3.5" />
                          </button>
                          {isMe && (
                            <button
                              type="button"
                              onClick={() => void handleDeleteMessage(m.id)}
                              className="rounded-full bg-card border border-border p-1 text-muted-foreground hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Preview Bar */}
              {replyingTo && (
                <div className="flex items-center justify-between border-t border-border bg-muted/50 px-4 py-2 text-xs shrink-0">
                  <div className="flex items-center gap-2 truncate">
                    <Reply className="h-3.5 w-3.5 text-maroon-accent" />
                    <span className="truncate text-muted-foreground">
                      Replying to: <b>{replyingTo.body?.slice(0, 50) || "Attachment"}</b>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Sticky Chat Input Bar */}
              <div className="border-t border-border bg-card/95 p-3 sm:p-4 shrink-0 backdrop-blur-md">
                {isRecording ? (
                  <div className="flex items-center justify-between rounded-xl bg-destructive/10 px-4 py-2.5">
                    <div className="flex items-center gap-2 text-destructive font-medium text-sm">
                      <span className="h-3 w-3 rounded-full bg-destructive animate-ping" />
                      <span>Recording: {recordDuration}s</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => stopRecording(true)}
                        className="rounded-lg border border-destructive/30 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => stopRecording(false)}
                        className="flex items-center gap-1.5 rounded-lg bg-destructive px-3.5 py-1 text-xs font-semibold text-white shadow-xs"
                      >
                        <Send className="h-3.5 w-3.5" /> Send
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 max-w-4xl mx-auto">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleFileUpload(file);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSending}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-input text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      title="Attach file/photo"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>

                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void handleSend();
                        }
                      }}
                      placeholder={t(lang, {
                        en: "Type your message...",
                        fr: "Écrivez votre message...",
                        ar: "اكتب رسالتك...",
                      })}
                      className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-[14px] outline-none focus:border-maroon-accent transition-colors"
                    />

                    <button
                      type="button"
                      onClick={() => void startRecording()}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-input text-muted-foreground hover:bg-muted hover:text-maroon-accent transition-colors"
                      title="Record audio"
                    >
                      <Mic className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleSend()}
                      disabled={!inputText.trim() || isSending}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[image:var(--gradient-ember)] text-paper shadow-sm disabled:opacity-40 transition-transform active:scale-95"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Empty State when no conversation selected */
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 text-maroon-accent">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="mt-4 font-display text-[22px] font-bold text-foreground">
                FRAME Direct & Community Chat
              </h3>
              <p className="mt-1.5 max-w-sm text-sm">
                Select a conversation on the left, or click on any member to start a private conversation.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("members")}
                  className="rounded-xl bg-[image:var(--gradient-ember)] px-5 py-2.5 text-xs font-semibold text-paper shadow-sm"
                >
                  Browse Members Directory
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewGroupModal(true)}
                  className="rounded-xl border border-border px-5 py-2.5 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  + Create Group
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Member Profile Modal */}
      <MemberProfileModal
        member={inspectedMember}
        open={Boolean(inspectedMember)}
        onOpenChange={(isOpen) => !isOpen && setInspectedMember(null)}
        onMessage={(memberId) => {
          setInspectedMember(null);
          void handleStartDirect(memberId);
        }}
      />

      {/* MODAL: CREATE GROUP */}
      {showNewGroupModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[20px] font-bold">Create Group Chat</h3>
              <button
                type="button"
                onClick={() => setShowNewGroupModal(false)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Group Title *
                </label>
                <input
                  type="text"
                  required
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  placeholder="e.g. Mauritanian Tech Innovators"
                  className="mt-1 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon-accent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="What is this group about?"
                  className="mt-1 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Category
                  </label>
                  <select
                    value={groupCat}
                    onChange={(e) => setGroupCat(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon-accent"
                  >
                    <option value="General">General</option>
                    <option value="Academic">Academic</option>
                    <option value="Strategy">Strategy & Chess</option>
                    <option value="Sports">Sports</option>
                    <option value="Arts">Culture & Arts</option>
                    <option value="Impact">National Impact</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Access
                  </label>
                  <select
                    value={groupIsPublic ? "public" : "private"}
                    onChange={(e) => setGroupIsPublic(e.target.value === "public")}
                    className="mt-1 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-maroon-accent"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private (Code only)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Picture (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setGroupFile(f);
                  }}
                  className="mt-1 block w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewGroupModal(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup || !groupTitle.trim()}
                  className="rounded-xl bg-[image:var(--gradient-ember)] px-5 py-2 text-xs font-semibold text-paper disabled:opacity-50"
                >
                  {creatingGroup ? "Creating..." : "Create Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: JOIN BY INVITE */}
      {showInviteModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold">Join via Invite Code</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Enter the code provided by the group creator.
            </p>

            <input
              type="text"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value)}
              placeholder="e.g. 7ad010"
              className="mt-4 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-center font-mono text-base uppercase tracking-widest outline-none focus:border-maroon-accent"
            />
            {inviteError && <p className="mt-2 text-xs text-destructive">{inviteError}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="rounded-xl border border-border px-3.5 py-1.5 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleJoinInvite()}
                className="rounded-xl bg-[image:var(--gradient-ember)] px-4 py-1.5 text-xs font-semibold text-paper"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REPORT */}
      {showReportModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-destructive">Report User / Chat</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Provide a brief description of the policy violation.
            </p>

            <textarea
              rows={3}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Harassment, inappropriate content, spam..."
              className="mt-3 w-full rounded-xl border border-input bg-transparent p-2.5 text-xs outline-none focus:border-destructive"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="rounded-xl border border-border px-3.5 py-1.5 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reportReason.trim()}
                onClick={() => void handleReport()}
                className="rounded-xl bg-destructive px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LIGHTBOX */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white hover:opacity-80"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={lightboxImage}
              alt="Preview"
              className="max-h-[85vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </main>
  );
}
export default MessagesPage;
