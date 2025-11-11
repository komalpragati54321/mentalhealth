import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  full_name: string | null;
  preferred_language: string;
  theme_preference: string;
  created_at: string;
  updated_at: string;
};

export type BotType =
  | 'triple_m'
  | 'micro_therapy'
  | 'venting_shredder'
  | 'cognitive_distortion'
  | 'sleep_guardian'
  | 'gratitude';

export type Conversation = {
  id: string;
  user_id: string;
  bot_type: BotType;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type MoodEntry = {
  id: string;
  user_id: string;
  mood: string;
  intensity: number;
  music_recommendation: Record<string, unknown>;
  mindfulness_exercise: string | null;
  notes: string | null;
  created_at: string;
};

export type GratitudeEntry = {
  id: string;
  user_id: string;
  gratitude_text: string;
  challenge_completed: boolean;
  challenge_description: string | null;
  created_at: string;
};
