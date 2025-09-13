/*
  # Create user settings table

  1. New Tables
    - `user_settings`
      - `id` (integer, primary key, auto-increment)
      - `user_id` (integer, foreign key to users, unique)
      - `theme` (text, default 'light')
      - `accent_color` (text, default 'teal')
      - `background_color` (text, default 'white')
      - `chat_background` (text, default 'solid')
      - `chat_background_color` (text, default 'white')
      - `show_online_status` (boolean, default true)
      - `send_read_receipts` (boolean, default true)
      - `auto_save_messages` (boolean, default false)
      - `created_at` (timestamp, default now)
      - `updated_at` (timestamp, default now)

  2. Security
    - Enable RLS on `user_settings` table
    - Add policy for users to read/write their own settings
*/

CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  accent_color TEXT DEFAULT 'teal',
  background_color TEXT DEFAULT 'white',
  chat_background TEXT DEFAULT 'solid',
  chat_background_color TEXT DEFAULT 'white',
  show_online_status BOOLEAN DEFAULT true,
  send_read_receipts BOOLEAN DEFAULT true,
  auto_save_messages BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_settings.user_id
      AND u.email = auth.email()
    )
  );

CREATE POLICY "Users can update their own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_settings.user_id
      AND u.email = auth.email()
    )
  );

CREATE POLICY "Users can insert their own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_settings.user_id
      AND u.email = auth.email()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();