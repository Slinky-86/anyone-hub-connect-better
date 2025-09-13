/*
  # Create conversation participants table

  1. New Tables
    - `conversation_participants`
      - `id` (integer, primary key, auto-increment)
      - `conversation_id` (integer, foreign key to conversations)
      - `user_id` (integer, foreign key to users)
      - `joined_at` (timestamp, default now)

  2. Security
    - Enable RLS on `conversation_participants` table
    - Add policies for participants to manage their participation
*/

CREATE TABLE IF NOT EXISTS conversation_participants (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read conversation participants for conversations they're in"
  ON conversation_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = conversation_participants.user_id
      AND u.email = auth.email()
    )
    OR
    EXISTS (
      SELECT 1 FROM conversation_participants cp2
      JOIN users u ON u.id = cp2.user_id
      WHERE cp2.conversation_id = conversation_participants.conversation_id
      AND u.email = auth.email()
    )
  );

CREATE POLICY "Users can add themselves to conversations"
  ON conversation_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = conversation_participants.user_id
      AND u.email = auth.email()
    )
  );

CREATE POLICY "Users can remove themselves from conversations"
  ON conversation_participants
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = conversation_participants.user_id
      AND u.email = auth.email()
    )
  );