/*
  # Create messages table

  1. New Tables
    - `messages`
      - `id` (integer, primary key, auto-increment)
      - `conversation_id` (integer, foreign key to conversations)
      - `sender_id` (integer, foreign key to users)
      - `content` (text)
      - `media_url` (text, nullable)
      - `media_type` (text, nullable)
      - `transcription` (text, nullable)
      - `is_transcribed` (boolean, default false)
      - `is_liked` (boolean, default false)
      - `is_saved` (boolean, default false)
      - `timestamp` (timestamp, default now)

  2. Security
    - Enable RLS on `messages` table
    - Add policies for conversation participants to read/write messages
*/

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  transcription TEXT,
  is_transcribed BOOLEAN DEFAULT false,
  is_liked BOOLEAN DEFAULT false,
  is_saved BOOLEAN DEFAULT false,
  timestamp TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read messages in conversations they participate in"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      JOIN users u ON u.id = cp.user_id
      WHERE cp.conversation_id = messages.conversation_id
      AND u.email = auth.email()
    )
  );

CREATE POLICY "Users can send messages to conversations they participate in"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      JOIN users u ON u.id = cp.user_id
      WHERE cp.conversation_id = messages.conversation_id
      AND u.email = auth.email()
      AND u.id = messages.sender_id
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = messages.sender_id
      AND u.email = auth.email()
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);