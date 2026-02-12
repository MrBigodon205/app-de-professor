-- Enable RLS on objects if not already enabled (idempotent-ish, usually safe)
alter table storage.objects enable row level security;

-- ==========================================
-- 1. PLANNING TEMPLATES POLICIES
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload planning templates') THEN
        CREATE POLICY "Authenticated users can upload planning templates" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'planning-templates' );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view planning templates') THEN
        CREATE POLICY "Public can view planning templates" ON storage.objects FOR SELECT TO public USING ( bucket_id = 'planning-templates' );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own planning templates') THEN
        CREATE POLICY "Users can update their own planning templates" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'planning-templates' );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own planning templates') THEN
        CREATE POLICY "Users can delete their own planning templates" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'planning-templates' );
    END IF;
END $$;

-- ==========================================
-- 2. ATTENDANCE PHOTOS POLICIES
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload attendance photos') THEN
        CREATE POLICY "Authenticated users can upload attendance photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'attendance-photos' );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view attendance photos') THEN
        CREATE POLICY "Public can view attendance photos" ON storage.objects FOR SELECT TO public USING ( bucket_id = 'attendance-photos' );
    END IF;
END $$;

-- ==========================================
-- 3. AVATARS POLICIES
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload avatars') THEN
        CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'avatars' );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view avatars') THEN
        CREATE POLICY "Public can view avatars" ON storage.objects FOR SELECT TO public USING ( bucket_id = 'avatars' );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own avatars') THEN
        CREATE POLICY "Users can update their own avatars" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'avatars' );
    END IF;
END $$;

-- ==========================================
-- 4. PLANNING ATTACHMENTS POLICIES
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload planning attachments') THEN
        CREATE POLICY "Authenticated users can upload planning attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'planning-attachments' );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view planning attachments') THEN
        CREATE POLICY "Public can view planning attachments" ON storage.objects FOR SELECT TO public USING ( bucket_id = 'planning-attachments' );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own planning attachments') THEN
        CREATE POLICY "Users can delete their own planning attachments" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'planning-attachments' );
    END IF;
END $$;
