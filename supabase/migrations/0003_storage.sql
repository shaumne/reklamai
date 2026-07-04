-- Private buckets: user uploads and generated outputs.
-- Uploads go direct from browser via signed upload URLs; reads via signed URLs.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('uploads', 'uploads', false, 52428800, array[
    'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'
  ]),
  ('outputs', 'outputs', false, null, null)
on conflict (id) do nothing;

-- users may upload only into their own folder in 'uploads'
create policy "uploads_insert_own_folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "uploads_select_own_folder" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "outputs_select_own_folder" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'outputs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
-- writes to 'outputs' happen with the service role only (fal webhook handler)
