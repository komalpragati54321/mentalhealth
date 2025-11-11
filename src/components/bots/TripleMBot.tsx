import { useState } from 'react';
import { ArrowLeft, Music, Send, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type Mood = {
  emoji: string;
  label: string;
  value: string;
  color: string;
};

const moods: Mood[] = [
  { emoji: '😊', label: 'Happy', value: 'happy', color: 'bg-yellow-100 hover:bg-yellow-200' },
  { emoji: '😢', label: 'Sad', value: 'sad', color: 'bg-blue-100 hover:bg-blue-200' },
  { emoji: '😰', label: 'Anxious', value: 'anxious', color: 'bg-purple-100 hover:bg-purple-200' },
  { emoji: '😤', label: 'Stressed', value: 'stressed', color: 'bg-red-100 hover:bg-red-200' },
  { emoji: '😌', label: 'Calm', value: 'calm', color: 'bg-green-100 hover:bg-green-200' },
  { emoji: '⚡', label: 'Energetic', value: 'energetic', color: 'bg-orange-100 hover:bg-orange-200' },
];

type Props = {
  onBack: () => void;
};

export default function TripleMBot({ onBack }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<'mood' | 'intensity' | 'result'>('mood');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [intensity, setIntensity] = useState(5);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<{
    music: string[];
    mindfulness: string;
  } | null>(null);

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    setStep('intensity');
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const musicRecommendations: Record<string, string[]> = {
        happy: ['Upbeat Pop Playlist', 'Feel Good Indie', 'Energetic Dance'],
        sad: ['Emotional Ballads', 'Soothing Piano', 'Healing Melodies'],
        anxious: ['Calming Nature Sounds', 'Ambient Relaxation', 'Peaceful Instrumental'],
        stressed: ['Stress Relief Meditation', 'Gentle Classical', 'Ocean Waves'],
        calm: ['Mindful Meditation', 'Soft Jazz', 'Peaceful Guitar'],
        energetic: ['Workout Beats', 'Motivational Mix', 'High Energy Playlist'],
      };

      const mindfulnessExercises: Record<string, string> = {
        happy:
          'Gratitude Meditation: Take 5 minutes to reflect on three things that make you happy right now.',
        sad: 'Self-Compassion Exercise: Place your hand on your heart and speak kindly to yourself, acknowledging your feelings.',
        anxious:
          '4-7-8 Breathing: Breathe in for 4 counts, hold for 7, exhale for 8. Repeat 4 times.',
        stressed:
          'Body Scan: Close your eyes and mentally scan from head to toe, releasing tension in each area.',
        calm: 'Mindful Walking: Take a slow 10-minute walk, focusing on each step and your surroundings.',
        energetic:
          'Movement Meditation: Dance freely for 5 minutes, expressing your energy through movement.',
      };

      const musicRecs = musicRecommendations[selectedMood] || [];
      const mindfulness = mindfulnessExercises[selectedMood] || '';

      await supabase.from('mood_entries').insert({
        user_id: user.id,
        mood: selectedMood,
        intensity,
        music_recommendation: { playlists: musicRecs },
        mindfulness_exercise: mindfulness,
        notes: notes || null,
      });

      setRecommendation({
        music: musicRecs,
        mindfulness,
      });
      setStep('result');
    } catch (error) {
      console.error('Error saving mood entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('mood');
    setSelectedMood('');
    setIntensity(5);
    setNotes('');
    setRecommendation(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Music className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Triple-M Bot</h2>
              <p className="text-gray-600">Mood → Music → Mindfulness</p>
            </div>
          </div>

          {step === 'mood' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">How are you feeling?</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {moods.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => handleMoodSelect(mood.value)}
                      className={`${mood.color} p-6 rounded-xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-gray-300`}
                    >
                      <div className="text-4xl mb-2">{mood.emoji}</div>
                      <div className="text-gray-900 font-medium">{mood.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'intensity' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  How intense is this feeling?
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Mild</span>
                    <span className="font-semibold text-teal-600">{intensity}</span>
                    <span>Intense</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none"
                  rows={3}
                  placeholder="What's on your mind?"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('mood')}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-lg font-medium hover:from-teal-600 hover:to-blue-700 transition disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Get Recommendations
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'result' && recommendation && (
            <div className="space-y-6">
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-teal-900 mb-4 flex items-center">
                  <Music className="w-5 h-5 mr-2" />
                  Music Recommendations
                </h3>
                <ul className="space-y-2">
                  {recommendation.music.map((playlist, index) => (
                    <li key={index} className="flex items-center text-teal-800">
                      <span className="w-2 h-2 bg-teal-500 rounded-full mr-3" />
                      {playlist}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  Mindfulness Exercise
                </h3>
                <p className="text-blue-800 leading-relaxed">{recommendation.mindfulness}</p>
              </div>

              <button
                onClick={reset}
                className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-lg font-medium hover:from-teal-600 hover:to-blue-700 transition"
              >
                Track Another Mood
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
