/*
  # Mental Health Chatbot Database Schema

  ## Overview
  Complete database schema for a mental health chatbot with unique features including mood tracking,
  gratitude journaling, cognitive distortion detection, and conversation history.

  ## New Tables

  ### 1. `profiles`
  User profiles extending Supabase auth.users
  - `id` (uuid, primary key, references auth.users)
  - `full_name` (text)
  - `preferred_language` (text) - Hindi, English, Hinglish
  - `theme_preference` (text) - light, dark, auto
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `conversations`
  Chat conversations with different bot types
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `bot_type` (text) - triple_m, micro_therapy, venting_shredder, cognitive_distortion, sleep_guardian, gratitude
  - `title` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `messages`
  Individual messages in conversations
  - `id` (uuid, primary key)
  - `conversation_id` (uuid, references conversations)
  - `role` (text) - user, assistant, system
  - `content` (text)
  - `metadata` (jsonb) - Additional data like sentiment, distortions detected
  - `created_at` (timestamptz)

  ### 4. `mood_entries`
  Mood tracking for Triple-M Bot
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `mood` (text) - happy, sad, anxious, stressed, calm, energetic
  - `intensity` (integer) - 1-10 scale
  - `music_recommendation` (jsonb) - Recommended music/playlist
  - `mindfulness_exercise` (text)
  - `notes` (text)
  - `created_at` (timestamptz)

  ### 5. `gratitude_entries`
  Gratitude journal entries
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `gratitude_text` (text)
  - `challenge_completed` (boolean)
  - `challenge_description` (text)
  - `created_at` (timestamptz)

  ### 6. `cognitive_distortions`
  Detected cognitive distortions
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `message_id` (uuid, references messages)
  - `distortion_type` (text) - all_or_nothing, overgeneralization, mental_filter, etc.
  - `original_thought` (text)
  - `reframed_thought` (text)
  - `created_at` (timestamptz)

  ### 7. `venting_sessions`
  Venting Shredder sessions
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `content` (text) - Encrypted or deleted after session
  - `is_shredded` (boolean)
  - `shredded_at` (timestamptz)
  - `created_at` (timestamptz)

  ### 8. `sleep_sessions`
  Sleep Guardian Bot sessions
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `start_time` (timestamptz)
  - `end_time` (timestamptz)
  - `sleep_quality` (integer) - 1-10 scale
  - `notes` (text)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Authenticated users only

  ## Indexes
  - User-based queries optimized
  - Timestamp-based queries for history
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  preferred_language text DEFAULT 'en',
  theme_preference text DEFAULT 'light',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  bot_type text NOT NULL,
  title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Create mood_entries table
CREATE TABLE IF NOT EXISTS mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  mood text NOT NULL,
  intensity integer NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
  music_recommendation jsonb DEFAULT '{}'::jsonb,
  mindfulness_exercise text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mood entries"
  ON mood_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood entries"
  ON mood_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood entries"
  ON mood_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create gratitude_entries table
CREATE TABLE IF NOT EXISTS gratitude_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  gratitude_text text NOT NULL,
  challenge_completed boolean DEFAULT false,
  challenge_description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gratitude_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gratitude entries"
  ON gratitude_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gratitude entries"
  ON gratitude_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gratitude entries"
  ON gratitude_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create cognitive_distortions table
CREATE TABLE IF NOT EXISTS cognitive_distortions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  distortion_type text NOT NULL,
  original_thought text NOT NULL,
  reframed_thought text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cognitive_distortions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cognitive distortions"
  ON cognitive_distortions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cognitive distortions"
  ON cognitive_distortions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create venting_sessions table
CREATE TABLE IF NOT EXISTS venting_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_shredded boolean DEFAULT false,
  shredded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE venting_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own venting sessions"
  ON venting_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own venting sessions"
  ON venting_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own venting sessions"
  ON venting_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create sleep_sessions table
CREATE TABLE IF NOT EXISTS sleep_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  sleep_quality integer CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sleep_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sleep sessions"
  ON sleep_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sleep sessions"
  ON sleep_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sleep sessions"
  ON sleep_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_entries_created_at ON mood_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gratitude_entries_user_id ON gratitude_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_gratitude_entries_created_at ON gratitude_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cognitive_distortions_user_id ON cognitive_distortions(user_id);
CREATE INDEX IF NOT EXISTS idx_venting_sessions_user_id ON venting_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_sessions_user_id ON sleep_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_sessions_created_at ON sleep_sessions(created_at DESC);