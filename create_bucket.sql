-- Create the storage bucket
insert into storage.buckets (id, name, public)
values ('planning-templates', 'planning-templates', true);

-- Enable RLS
alter table storage.objects enable row level security;

-- Policy: Allow authenticated users to upload files
create policy "Authenticated users can upload planning templates"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'planning-templates' );

-- Policy: Allow public access to view files (needed for previews)
create policy "Public can view planning templates"
  on storage.objects for select
  to public
  using ( bucket_id = 'planning-templates' );

-- Policy: Allow users to update their own files (optional, but good practice)
create policy "Users can update their own planning templates"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'planning-templates' );

-- Policy: Allow users to delete their own planning templates
create policy "Users can delete their own planning templates"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'planning-templates' );
