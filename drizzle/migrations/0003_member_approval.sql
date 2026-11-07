ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS member_status text NOT NULL DEFAULT 'pending';
UPDATE public.profiles SET member_status = 'approved';
ALTER TABLE public.profiles ADD CONSTRAINT profiles_member_status_check CHECK (member_status IN ('pending','approved','denied'));

CREATE OR REPLACE FUNCTION public.is_member(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND member_status = 'approved')
      OR public.has_role(_user_id, 'admin')
$$;

CREATE OR REPLACE FUNCTION public.guard_member_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
      NEW.member_status := 'pending';
    END IF;
  ELSIF NEW.member_status IS DISTINCT FROM OLD.member_status THEN
    IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
      NEW.member_status := OLD.member_status;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_guard_member_status ON public.profiles;
CREATE TRIGGER profiles_guard_member_status BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_member_status();

CREATE POLICY "only approved members send" ON public.messages AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (public.is_member(auth.uid()));
CREATE POLICY "only approved members score" ON public.game_scores AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (public.is_member(auth.uid()));