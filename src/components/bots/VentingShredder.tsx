import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type Props = {
  onBack: () => void;
};

export default function VentingShredder({ onBack }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<'write' | 'confirm' | 'shredding' | 'complete'>('write');
  const [ventText, setVentText] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [shredProgress, setShredProgress] = useState(0);

  useEffect(() => {
    if (step === 'shredding' && shredProgress < 100) {
      const timer = setTimeout(() => {
        setShredProgress((prev) => Math.min(prev + 2, 100));
      }, 30);
      return () => clearTimeout(timer);
    } else if (step === 'shredding' && shredProgress >= 100) {
      setTimeout(() => setStep('complete'), 500);
    }
  }, [step, shredProgress]);

  const handleWrite = async () => {
    if (!user || !ventText.trim()) return;

    try {
      const { data } = await supabase
        .from('venting_sessions')
        .insert({
          user_id: user.id,
          content: ventText,
          is_shredded: false,
        })
        .select()
        .single();

      if (data) {
        setSessionId(data.id);
        setStep('confirm');
      }
    } catch (error) {
      console.error('Error saving venting session:', error);
    }
  };

  const handleShred = async () => {
    if (!sessionId) return;

    setStep('shredding');

    setTimeout(async () => {
      try {
        await supabase
          .from('venting_sessions')
          .update({
            is_shredded: true,
            shredded_at: new Date().toISOString(),
            content: '[SHREDDED]',
          })
          .eq('id', sessionId);
      } catch (error) {
        console.error('Error shredding session:', error);
      }
    }, 1500);
  };

  const reset = () => {
    setStep('write');
    setVentText('');
    setSessionId(null);
    setShredProgress(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
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
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
              <Trash2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Venting Shredder</h2>
              <p className="text-gray-600">Write it out, let it go</p>
            </div>
          </div>

          {step === 'write' && (
            <div className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <p className="text-sm text-orange-800">
                  <span className="font-semibold">Safe space:</span> Write whatever you need to
                  get off your chest. Once you shred it, it's permanently deleted. No judgment, no
                  storage.
                </p>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  Let it all out...
                </label>
                <textarea
                  value={ventText}
                  onChange={(e) => setVentText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
                  rows={10}
                  placeholder="Type everything you're feeling... anger, frustration, sadness, whatever it is. This is your space."
                />
                <p className="text-sm text-gray-500 mt-2">{ventText.length} characters</p>
              </div>

              <button
                onClick={handleWrite}
                disabled={!ventText.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Send className="w-5 h-5 mr-2" />
                Continue to Shred
              </button>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 max-h-64 overflow-y-auto">
                <p className="text-gray-700 whitespace-pre-wrap">{ventText}</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">Warning:</span> Once you shred this, it will be
                  permanently deleted. Are you ready to let it go?
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('write')}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Go Back
                </button>
                <button
                  onClick={handleShred}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-700 transition flex items-center justify-center"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Shred It
                </button>
              </div>
            </div>
          )}

          {step === 'shredding' && (
            <div className="space-y-6 text-center py-12">
              <div className="flex justify-center mb-6">
                <Trash2 className="w-24 h-24 text-orange-500 animate-pulse" />
              </div>

              <div>
                <p className="text-2xl font-bold text-gray-900 mb-4">Shredding...</p>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-red-600 h-3 transition-all duration-300"
                    style={{ width: `${shredProgress}%` }}
                  />
                </div>
                <p className="text-gray-600 mt-2">{shredProgress}%</p>
              </div>

              <div className="bg-orange-50 rounded-xl p-6 mt-8">
                <p className="text-orange-800 italic">
                  "Letting go gives us freedom, and freedom is the only condition for happiness."
                  <br />
                  <span className="text-sm">- Thich Nhat Hanh</span>
                </p>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-6 text-center py-12">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Shredded Successfully</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Your thoughts have been released. Take a deep breath. You've taken an important
                  step in processing your emotions.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6 max-w-md mx-auto">
                <p className="text-sm text-green-800">
                  <span className="font-semibold">Self-care tip:</span> Now that you've released
                  these feelings, do something kind for yourself. Take a walk, drink water, or
                  connect with someone you trust.
                </p>
              </div>

              <button
                onClick={reset}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-700 transition"
              >
                Vent Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
