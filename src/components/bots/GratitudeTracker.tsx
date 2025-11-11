import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Plus, Trophy, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { GratitudeEntry } from '../../lib/supabase';

type Props = {
  onBack: () => void;
};

const dailyChallenges = [
  'Compliment someone genuinely today',
  'Help someone without being asked',
  'Try something new that scares you a little',
  'Spend 10 minutes in nature',
  'Write a thank you note to someone',
  'Practice saying no to something that drains you',
  'Share your knowledge with someone',
  'Do something creative for 15 minutes',
  'Have a meaningful conversation',
  'Practice forgiveness toward yourself or others',
];

export default function GratitudeTracker({ onBack }: Props) {
  const { user } = useAuth();
  const [view, setView] = useState<'add' | 'history'>('add');
  const [gratitudeText, setGratitudeText] = useState('');
  const [dailyChallenge, setDailyChallenge] = useState('');
  const [challengeAccepted, setChallengeAccepted] = useState(false);
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const randomChallenge = dailyChallenges[Math.floor(Math.random() * dailyChallenges.length)];
    setDailyChallenge(randomChallenge);
    loadEntries();
  }, []);

  const loadEntries = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('gratitude_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setEntries(data);
      }
    } catch (error) {
      console.error('Error loading gratitude entries:', error);
    }
  };

  const handleSubmit = async () => {
    if (!user || !gratitudeText.trim()) return;

    setLoading(true);
    try {
      await supabase.from('gratitude_entries').insert({
        user_id: user.id,
        gratitude_text: gratitudeText,
        challenge_completed: challengeAccepted,
        challenge_description: challengeAccepted ? dailyChallenge : null,
      });

      setGratitudeText('');
      setChallengeAccepted(false);
      const randomChallenge = dailyChallenges[Math.floor(Math.random() * dailyChallenges.length)];
      setDailyChallenge(randomChallenge);
      await loadEntries();
      setView('history');
    } catch (error) {
      console.error('Error saving gratitude entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-red-50">
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
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-600 rounded-xl flex items-center justify-center">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Gratitude Tracker</h2>
              <p className="text-gray-600">Daily gratitude & challenges</p>
            </div>
          </div>

          <div className="flex space-x-2 mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('add')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition ${
                view === 'add'
                  ? 'bg-white text-pink-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Add Entry
            </button>
            <button
              onClick={() => setView('history')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition ${
                view === 'history'
                  ? 'bg-white text-pink-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              History ({entries.length})
            </button>
          </div>

          {view === 'add' ? (
            <div className="space-y-6">
              <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
                <p className="text-sm text-pink-800">
                  <span className="font-semibold">Daily practice:</span> Take a moment to reflect on
                  what you're grateful for today. Research shows gratitude improves mental health
                  and well-being.
                </p>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  What are you grateful for today?
                </label>
                <textarea
                  value={gratitudeText}
                  onChange={(e) => setGratitudeText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none"
                  rows={5}
                  placeholder="I'm grateful for..."
                />
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <Trophy className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 mb-2">Today's Challenge</h3>
                    <p className="text-amber-800 mb-4">{dailyChallenge}</p>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={challengeAccepted}
                        onChange={(e) => setChallengeAccepted(e.target.checked)}
                        className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
                      />
                      <span className="text-sm text-amber-900 font-medium">
                        I accept this challenge!
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!gratitudeText.trim() || loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-red-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Heart className="w-5 h-5 mr-2" />
                Save Entry
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No gratitude entries yet.</p>
                  <button
                    onClick={() => setView('add')}
                    className="mt-4 text-pink-600 hover:text-pink-700 font-medium"
                  >
                    Start your gratitude journey
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Entries</p>
                        <p className="text-2xl font-bold text-pink-600">{entries.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Challenges Completed</p>
                        <p className="text-2xl font-bold text-amber-600">
                          {entries.filter((e) => e.challenge_completed).length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Heart className="w-5 h-5 text-pink-500" />
                          <span className="text-sm text-gray-600">{formatDate(entry.created_at)}</span>
                        </div>
                        {entry.challenge_completed && (
                          <div className="flex items-center space-x-1 bg-amber-100 px-2 py-1 rounded-full">
                            <Trophy className="w-4 h-4 text-amber-600" />
                            <span className="text-xs text-amber-800 font-medium">Challenge</span>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-800 mb-2">{entry.gratitude_text}</p>
                      {entry.challenge_completed && entry.challenge_description && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                          <p className="text-sm text-amber-800">
                            <span className="font-semibold">Challenge:</span>{' '}
                            {entry.challenge_description}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
