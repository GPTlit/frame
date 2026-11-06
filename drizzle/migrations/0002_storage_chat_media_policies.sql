
CREATE POLICY "chat media read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'chat-media' AND public.is_conv_member(((storage.foldername(name))[1])::uuid, auth.uid()));
CREATE POLICY "chat media upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-media' AND (storage.foldername(name))[2] = auth.uid()::text
    AND public.is_conv_member(((storage.foldername(name))[1])::uuid, auth.uid()));
CREATE POLICY "chat media delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chat-media' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "media read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'media');
CREATE POLICY "media admin write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND (public.has_role(auth.uid(),'admin') OR (storage.foldername(name))[1] = 'groups'));
CREATE POLICY "media admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'));
