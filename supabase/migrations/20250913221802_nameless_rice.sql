/*
  # Create message reactions table

  1. New Tables
    - `message_reactions`
      - `id` (integer, primary key, auto-increment)
      - `message_id` (integer, foreign key to messages)
      - `user_id` (integer, foreign key to users)
      - `emoji` (text)
      - `created_at` (timestamp, default now)

  2. Security
    - Enable RLS on `message_reactions` table
    - Add policies for conversation participants to read/write reactions
*/

CREATE TABLE IF NOT EXISTS message_reactions (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read reactions for messages in conversations they participate in"
  ON message_reactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      JOIN users u ON u.id = cp.user_id
      WHERE m.id = message_reactions.message_id
      AND u.email = auth.email()
    )
  );

CREATE POLICY "Users can add reactions to messages in conversations they participate in"
  ON message_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      JOIN users u ON u.id = cp.user_id
      WHERE m.id = message_reactions.message_id
      AND u.email = auth.email()
      AND u.id = message_reactions.user_id
    )
  );

CREATE POLICY "Users can remove their own reactions"
  ON message_reactions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = message_reactions.user_id
      AND u.email = auth.email()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);