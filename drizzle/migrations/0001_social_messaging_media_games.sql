
-- Profile extensions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS show_online boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_seen timestamptz;

CREATE OR REPLACE FUNCTION public.guard_profile_scores()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_setting('frame.trusted', true) = '1' THEN RETURN NEW; END IF;
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.points := 0; NEW.contributions := 0;
    ELSE
      NEW.points := OLD.points; NEW.contributions := OLD.contributions;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

-- Connections / follows / blocks / reports
CREATE TABLE public.connections (
  requester uuid NOT NULL, addressee uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (requester, addressee),
  CHECK (requester <> addressee), CHECK (status IN ('pending','accepted'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connections TO authenticated;
GRANT ALL ON public.connections TO service_role;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conn read" ON public.connections FOR SELECT TO authenticated USING (true);
CREATE POLICY "conn insert" ON public.connections FOR INSERT TO authenticated WITH CHECK (requester = auth.uid() AND status = 'pending');
CREATE POLICY "conn accept" ON public.connections FOR UPDATE TO authenticated USING (addressee = auth.uid()) WITH CHECK (addressee = auth.uid());
CREATE POLICY "conn delete" ON public.connections FOR DELETE TO authenticated USING (requester = auth.uid() OR addressee = auth.uid());

CREATE TABLE public.follows (
  follower uuid NOT NULL, following uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower, following), CHECK (follower <> following)
);
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follow read" ON public.follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "follow insert" ON public.follows FOR INSERT TO authenticated WITH CHECK (follower = auth.uid());
CREATE POLICY "follow delete" ON public.follows FOR DELETE TO authenticated USING (follower = auth.uid());

CREATE TABLE public.blocks (
  blocker uuid NOT NULL, blocked uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker, blocked)
);
GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "block read" ON public.blocks FOR SELECT TO authenticated USING (blocker = auth.uid() OR blocked = auth.uid());
CREATE POLICY "block insert" ON public.blocks FOR INSERT TO authenticated WITH CHECK (blocker = auth.uid());
CREATE POLICY "block delete" ON public.blocks FOR DELETE TO authenticated USING (blocker = auth.uid());

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter uuid NOT NULL, target_user uuid, message_id uuid,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "report insert" ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter = auth.uid());
CREATE POLICY "report admin read" ON public.reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "report admin delete" ON public.reports FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Conversations
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group boolean NOT NULL DEFAULT false,
  title text, description text, avatar_url text, category text,
  is_public boolean NOT NULL DEFAULT false,
  invite_code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6),'hex'),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.conversation_members (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  last_read_at timestamptz NOT NULL DEFAULT now(),
  pinned boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX ON public.conversation_members(user_id);

CREATE OR REPLACE FUNCTION public.is_conv_member(_conv uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id=_conv AND user_id=_uid) $$;
CREATE OR REPLACE FUNCTION public.is_conv_admin(_conv uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id=_conv AND user_id=_uid AND role='admin') $$;

GRANT SELECT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conv read" ON public.conversations FOR SELECT TO authenticated
  USING (public.is_conv_member(id, auth.uid()) OR is_group);
CREATE POLICY "conv admin update" ON public.conversations FOR UPDATE TO authenticated
  USING (public.is_conv_admin(id, auth.uid())) WITH CHECK (public.is_conv_admin(id, auth.uid()));
CREATE POLICY "conv admin delete" ON public.conversations FOR DELETE TO authenticated
  USING (public.is_conv_admin(id, auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_members TO authenticated;
GRANT ALL ON public.conversation_members TO service_role;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cm read" ON public.conversation_members FOR SELECT TO authenticated
  USING (public.is_conv_member(conversation_id, auth.uid()));
CREATE POLICY "cm admin add" ON public.conversation_members FOR INSERT TO authenticated
  WITH CHECK (public.is_conv_admin(conversation_id, auth.uid()));
CREATE POLICY "cm update" ON public.conversation_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_conv_admin(conversation_id, auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_conv_admin(conversation_id, auth.uid()));
CREATE POLICY "cm leave or remove" ON public.conversation_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_conv_admin(conversation_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.guard_member_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role <> OLD.role AND NOT public.is_conv_admin(NEW.conversation_id, auth.uid()) THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER cm_guard_role BEFORE UPDATE ON public.conversation_members
FOR EACH ROW EXECUTE FUNCTION public.guard_member_role();

CREATE TABLE public.join_requests (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.join_requests TO authenticated;
GRANT ALL ON public.join_requests TO service_role;
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jr read" ON public.join_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_conv_admin(conversation_id, auth.uid()));
CREATE POLICY "jr insert" ON public.join_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "jr delete" ON public.join_requests FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_conv_admin(conversation_id, auth.uid()));

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text,
  kind text NOT NULL DEFAULT 'text' CHECK (kind IN ('text','image','video','audio','file','share')),
  media_path text, media_name text,
  shared jsonb,
  reply_to uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  pinned boolean NOT NULL DEFAULT false,
  edited_at timestamptz, deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.messages(conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg read" ON public.messages FOR SELECT TO authenticated
  USING (public.is_conv_member(conversation_id, auth.uid()));
CREATE POLICY "msg send" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_conv_member(conversation_id, auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM public.conversation_members m JOIN public.blocks b
        ON (b.blocker = m.user_id AND b.blocked = auth.uid())
      WHERE m.conversation_id = messages.conversation_id
        AND NOT (SELECT is_group FROM public.conversations c WHERE c.id = messages.conversation_id)));
CREATE POLICY "msg edit" ON public.messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() OR public.is_conv_admin(conversation_id, auth.uid()))
  WITH CHECK (sender_id = auth.uid() OR public.is_conv_admin(conversation_id, auth.uid()));
CREATE POLICY "msg delete" ON public.messages FOR DELETE TO authenticated USING (sender_id = auth.uid());

CREATE OR REPLACE FUNCTION public.bump_conversation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  UPDATE public.conversation_members SET archived = false
    WHERE conversation_id = NEW.conversation_id AND user_id <> NEW.sender_id AND archived;
  RETURN NEW;
END; $$;
CREATE TRIGGER messages_bump AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.bump_conversation();

CREATE TABLE public.message_reactions (
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  conversation_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);
GRANT SELECT, INSERT, DELETE ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "react read" ON public.message_reactions FOR SELECT TO authenticated
  USING (public.is_conv_member(conversation_id, auth.uid()));
CREATE POLICY "react add" ON public.message_reactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_conv_member(conversation_id, auth.uid())
    AND EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND m.conversation_id = message_reactions.conversation_id));
CREATE POLICY "react remove" ON public.message_reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- RPCs for conversations
CREATE OR REPLACE FUNCTION public.start_direct(_other uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; me uuid := auth.uid();
BEGIN
  IF me IS NULL OR _other IS NULL OR _other = me THEN RAISE EXCEPTION 'invalid'; END IF;
  IF EXISTS (SELECT 1 FROM public.blocks WHERE (blocker=_other AND blocked=me) OR (blocker=me AND blocked=_other)) THEN
    RAISE EXCEPTION 'blocked'; END IF;
  SELECT c.id INTO v_id FROM public.conversations c
    JOIN public.conversation_members a ON a.conversation_id=c.id AND a.user_id=me
    JOIN public.conversation_members b ON b.conversation_id=c.id AND b.user_id=_other
    WHERE NOT c.is_group LIMIT 1;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  INSERT INTO public.conversations (is_group, created_by) VALUES (false, me) RETURNING id INTO v_id;
  INSERT INTO public.conversation_members (conversation_id, user_id, role) VALUES (v_id, me, 'member'), (v_id, _other, 'member');
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.create_group(_title text, _description text, _avatar text, _category text, _is_public boolean, _members uuid[])
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; me uuid := auth.uid();
BEGIN
  IF me IS NULL OR coalesce(trim(_title),'') = '' THEN RAISE EXCEPTION 'invalid'; END IF;
  INSERT INTO public.conversations (is_group, title, description, avatar_url, category, is_public, created_by)
    VALUES (true, left(trim(_title),80), left(_description,500), _avatar, left(_category,40), coalesce(_is_public,false), me) RETURNING id INTO v_id;
  INSERT INTO public.conversation_members (conversation_id, user_id, role) VALUES (v_id, me, 'admin');
  INSERT INTO public.conversation_members (conversation_id, user_id, role)
    SELECT v_id, u, 'member' FROM unnest(coalesce(_members,'{}')) u
    WHERE u <> me AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=u)
    ON CONFLICT DO NOTHING;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.join_group(_conv uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := auth.uid(); v_public boolean;
BEGIN
  SELECT is_public INTO v_public FROM public.conversations WHERE id=_conv AND is_group;
  IF v_public IS NULL THEN RAISE EXCEPTION 'not found'; END IF;
  IF v_public THEN
    INSERT INTO public.conversation_members (conversation_id, user_id) VALUES (_conv, me) ON CONFLICT DO NOTHING;
    RETURN 'joined';
  END IF;
  INSERT INTO public.join_requests (conversation_id, user_id) VALUES (_conv, me) ON CONFLICT DO NOTHING;
  RETURN 'requested';
END; $$;

CREATE OR REPLACE FUNCTION public.join_by_invite(_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM public.conversations WHERE invite_code=_code AND is_group;
  IF v_id IS NULL THEN RAISE EXCEPTION 'invalid invite'; END IF;
  INSERT INTO public.conversation_members (conversation_id, user_id) VALUES (v_id, auth.uid()) ON CONFLICT DO NOTHING;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.approve_join(_conv uuid, _user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_conv_admin(_conv, auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  DELETE FROM public.join_requests WHERE conversation_id=_conv AND user_id=_user;
  INSERT INTO public.conversation_members (conversation_id, user_id) VALUES (_conv, _user) ON CONFLICT DO NOTHING;
END; $$;

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'info',
  title text NOT NULL, body text, link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif own read" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif own update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notif own delete" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.notify_points()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.points <> OLD.points THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link)
    VALUES (NEW.id, 'leaderboard', 'Leaderboard update',
      'Your points changed from ' || OLD.points || ' to ' || NEW.points, '/games');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER profiles_notify_points AFTER UPDATE OF points ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_points();

CREATE OR REPLACE FUNCTION public.notify_connection()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, kind, title, link)
    VALUES (NEW.addressee, 'connection', 'New connection request', '/profile');
  ELSIF NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
    INSERT INTO public.notifications (user_id, kind, title, link)
    VALUES (NEW.requester, 'connection', 'Your connection request was accepted', '/profile');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER connections_notify AFTER INSERT OR UPDATE ON public.connections
FOR EACH ROW EXECUTE FUNCTION public.notify_connection();

-- Featured media
CREATE TABLE public.featured_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  kind text NOT NULL CHECK (kind IN ('image','video','youtube')),
  url text NOT NULL,
  placement text NOT NULL DEFAULT 'home' CHECK (placement IN ('home','events','news')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.featured_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.featured_media TO authenticated;
GRANT ALL ON public.featured_media TO service_role;
ALTER TABLE public.featured_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media public" ON public.featured_media FOR SELECT USING (true);
CREATE POLICY "media admin ins" ON public.featured_media FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "media admin upd" ON public.featured_media FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "media admin del" ON public.featured_media FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Games plugin
CREATE TABLE public.game_plugins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, description text, thumbnail_url text,
  kind text NOT NULL DEFAULT 'builtin' CHECK (kind IN ('builtin','embed')),
  builtin_key text, embed_url text,
  points_reward integer NOT NULL DEFAULT 10 CHECK (points_reward BETWEEN 0 AND 1000),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','hidden','soon')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.game_plugins TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_plugins TO authenticated;
GRANT ALL ON public.game_plugins TO service_role;
ALTER TABLE public.game_plugins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "games read" ON public.game_plugins FOR SELECT USING (status <> 'hidden' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "games admin ins" ON public.game_plugins FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "games admin upd" ON public.game_plugins FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "games admin del" ON public.game_plugins FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.game_plugins(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.game_scores TO authenticated;
GRANT ALL ON public.game_scores TO service_role;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scores read" ON public.game_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "scores insert" ON public.game_scores FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Reward: once per game per member per day
CREATE OR REPLACE FUNCTION public.reward_game()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_reward int;
BEGIN
  IF EXISTS (SELECT 1 FROM public.game_scores WHERE game_id=NEW.game_id AND user_id=NEW.user_id
             AND id <> NEW.id AND created_at > now() - interval '1 day') THEN RETURN NEW; END IF;
  SELECT points_reward INTO v_reward FROM public.game_plugins WHERE id=NEW.game_id AND status='active';
  IF coalesce(v_reward,0) > 0 THEN
    PERFORM set_config('frame.trusted','1',true);
    UPDATE public.profiles SET points = points + v_reward, contributions = contributions + 1 WHERE id = NEW.user_id;
    PERFORM set_config('frame.trusted','0',true);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER game_scores_reward AFTER INSERT ON public.game_scores
FOR EACH ROW EXECUTE FUNCTION public.reward_game();

INSERT INTO public.game_plugins (title, description, kind, builtin_key, points_reward) VALUES
 ('Reaction Rush', 'Tap as soon as the screen turns red. Faster reactions, better score.', 'builtin', 'reaction', 15),
 ('Memory Grid', 'Flip cards and match all the pairs in as few moves as possible.', 'builtin', 'memory', 20);

-- Account deletion
CREATE OR REPLACE FUNCTION public.delete_own_account(_phone text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE me uuid := auth.uid(); v_phone text;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  SELECT phone INTO v_phone FROM public.member_contacts WHERE user_id = me;
  IF v_phone IS NULL OR regexp_replace(v_phone,'\D','','g') <> regexp_replace(coalesce(_phone,''),'\D','','g') THEN
    RAISE EXCEPTION 'phone does not match';
  END IF;
  PERFORM public._purge_user(me);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_delete_user(_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _user = auth.uid() THEN RAISE EXCEPTION 'use delete my account'; END IF;
  PERFORM public._purge_user(_user);
END; $$;

CREATE OR REPLACE FUNCTION public._purge_user(_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  DELETE FROM public.message_reactions WHERE user_id=_user;
  DELETE FROM public.messages WHERE sender_id=_user;
  DELETE FROM public.conversation_members WHERE user_id=_user;
  DELETE FROM public.conversations c WHERE NOT c.is_group AND NOT EXISTS (SELECT 1 FROM public.conversation_members m WHERE m.conversation_id=c.id AND m.user_id<>_user AND false)
    AND (SELECT count(*) FROM public.conversation_members m WHERE m.conversation_id=c.id) < 2;
  DELETE FROM public.join_requests WHERE user_id=_user;
  DELETE FROM public.connections WHERE requester=_user OR addressee=_user;
  DELETE FROM public.follows WHERE follower=_user OR following=_user;
  DELETE FROM public.blocks WHERE blocker=_user OR blocked=_user;
  DELETE FROM public.notifications WHERE user_id=_user;
  DELETE FROM public.game_scores WHERE user_id=_user;
  DELETE FROM public.member_contacts WHERE user_id=_user;
  DELETE FROM public.user_roles WHERE user_id=_user;
  DELETE FROM public.profiles WHERE id=_user;
  DELETE FROM auth.users WHERE id=_user;
END; $$;
REVOKE EXECUTE ON FUNCTION public._purge_user(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_member_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_conversation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_points() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_connection() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reward_game() FROM PUBLIC, anon, authenticated;

-- Realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
