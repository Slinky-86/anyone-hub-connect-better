/*
  # Create storage buckets

  1. Storage Buckets
    - `avatars` (public bucket for user avatars)
    - `voice-messages` (private bucket for voice messages)
    - `media` (private bucket for media attachments)

  2. Security
    - Set up RLS policies for each bucket
    - Allow authenticated users to upload/download their own files
*/

-- Create avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create voice-messages bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-messages',
  'voice-messages',
  false,
  10485760, -- 10MB
  ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4']
) ON CONFLICT (id) DO NOTHING;

-- Create media bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  false,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
) ON CONFLICT (id) DO NOTHING;

-- RLS policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS policies for voice-messages bucket
CREATE POLICY "Users can view voice messages in their conversations"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'voice-messages'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN conversation_participants cp ON cp.user_id = u.id
      WHERE u.email = auth.email()
      AND (storage.foldername(name))[2]::integer = cp.conversation_id
    )
  );

CREATE POLICY "Users can upload voice messages to their conversations"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'voice-messages'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.email = auth.email()
      AND (storage.foldername(name))[1]::integer = u.id
    )
  );

-- RLS policies for media bucket
CREATE POLICY "Users can view media in their conversations"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN conversation_participants cp ON cp.user_id = u.id
      WHERE u.email = auth.email()
      AND (storage.foldername(name))[2]::integer = cp.conversation_id
    )
  );

CREATE POLICY "Users can upload media to their conversations"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.email = auth.email()
      AND (storage.foldername(name))[1]::integer = u.id
    )
  );