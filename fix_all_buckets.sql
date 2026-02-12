-- ==========================================
-- 1. PLANNING TEMPLATES BUCKET
-- ==========================================
insert into storage.buckets (id, name, public)
values ('planning-templates', 'planning-templates', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload planning templates"
  on storage.objects for insert to authenticated
  with check ( bucket_id = 'planning-templates' );

create policy "Public can view planning templates"
  on storage.objects for select to public
  using ( bucket_id = 'planning-templates' );

create policy "Users can update their own planning templates"
  on storage.objects for update to authenticated
  using ( bucket_id = 'planning-templates' );

create policy "Users can delete their own planning templates"
  on storage.objects for delete to authenticated
  using ( bucket_id = 'planning-templates' );


-- ==========================================
-- 2. ATTENDANCE PHOTOS BUCKET
-- ==========================================
insert into storage.buckets (id, name, public)
values ('attendance-photos', 'attendance-photos', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload attendance photos"
  on storage.objects for insert to authenticated
  with check ( bucket_id = 'attendance-photos' );

create policy "Public can view attendance photos"
  on storage.objects for select to public
  using ( bucket_id = 'attendance-photos' );


-- ==========================================
-- 3. AVATARS BUCKET
-- ==========================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload avatars"
  on storage.objects for insert to authenticated
  with check ( bucket_id = 'avatars' );

create policy "Public can view avatars"
  on storage.objects for select to public
  using ( bucket_id = 'avatars' );

create policy "Users can update their own avatars"
  on storage.objects for update to authenticated
  using ( bucket_id = 'avatars' );


-- ==========================================
-- 4. PLANNING ATTACHMENTS BUCKET
-- ==========================================
insert into storage.buckets (id, name, public)
values ('planning-attachments', 'planning-attachments', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload planning attachments"
  on storage.objects for insert to authenticated
  with check ( bucket_id = 'planning-attachments' );

create policy "Public can view planning attachments"
  on storage.objects for select to public
  using ( bucket_id = 'planning-attachments' );

create policy "Users can delete their own planning attachments"
  on storage.objects for delete to authenticated
  using ( bucket_id = 'planning-attachments' );
