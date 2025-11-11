import { useState, useEffect } from 'react';
import { ArrowLeft, Timer, Send, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type Props = {
  onBack: () => void;
};

export default function MicroTherapyBot({ onBack }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<'input' | 'processing' | 'result'>('input');
  const [concern, setConcern] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [response, setResponse] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (step === 'processing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, timeLeft]);

  const handleSubmit = async () => {
    if (!user || !concern.trim()) return;

    setStep('processing');

    try {
      const { data: conversation } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          bot_type: 'micro_therapy',
          title: concern.slice(0, 50),
        })
        .select()
        .single();

      if (conversation) {
        setConversationId(conversation.id);

        await supabase.from('messages').insert({
          conversation_id: conversation.id,
          role: 'user',
          content: concern,
        });

        const quickResponses: Record<string, string> = {
          anxious:
            "I hear that you're feeling anxious. Remember: anxiety often makes things seem bigger than they are. Try this: Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. This grounds you in the present moment.",
          stressed:
            "Stress is your body's way of saying it needs support. Take a deep breath. Ask yourself: What's ONE thing I can do right now? Start there. You don't need to solve everything at once.",
          sad: "It's okay to feel sad. These emotions are valid and temporary. Be gentle with yourself today. Do something small that brings you comfort - a warm drink, a favorite song, or reaching out to someone you trust.",
          overwhelmed:
            "When everything feels like too much, pause. Write down what's overwhelming you. Then circle just ONE thing you can address today. Progress, not perfection.",
          lonely:
            "Loneliness can feel heavy. Remember that reaching out is a sign of strength. Consider: Who could you text right now? What activity could connect you with others? You deserve connection.",
          default:
            "Thank you for sharing. Remember: You're doing better than you think. Every challenge you face is shaping you into someone stronger. What's one small act of self-care you can do in the next hour?",
        };

        let aiResponse = quickResponses.default;
        const concernLower = concern.toLowerCase();

        for (const [key, value] of Object.entries(quickResponses)) {
          if (key !== 'default' && concernLower.includes(key)) {
            aiResponse = value;
            break;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 3000));

        await supabase.from('messages').insert({
          conversation_id: conversation.id,
          role: 'assistant',
          content: aiResponse,
        });

        setResponse(aiResponse);
        setStep('result');
      }
    } catch (error) {
      console.error('Error in micro-therapy session:', error);
      setStep('input');
    }
  };

  const reset = () => {
    setStep('input');
    setConcern('');
    setTimeLeft(60);
    setResponse('');
    setConversationId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
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
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <Timer className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Micro-Therapy</h2>
              <p className="text-gray-600">Quick support in 60 seconds</p>
            </div>
          </div>

          {step === 'input' && (
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  What's on your mind?
                </label>
                <textarea
                  value={concern}
                  onChange={(e) => setConcern(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  rows={6}
                  placeholder="Share what's bothering you... I'm here to help in just 60 seconds."
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!concern.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Send className="w-5 h-5 mr-2" />
                Get Quick Support
              </button>
            </div>
          )}

          {step === 'processing' && (
            <div className="space-y-6 text-center py-12">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-32 h-32 border-8 border-blue-100 rounded-full" />
                  <div
                    className="absolute top-0 left-0 w-32 h-32 border-8 border-blue-500 rounded-full transition-all duration-1000"
                    style={{
                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin((timeLeft / 60) * 2 * Math.PI)}% ${50 - 50 * Math.cos((timeLeft / 60) * 2 * Math.PI)}%, 50% 50%)`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-blue-600">{timeLeft}s</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <p className="text-gray-600">Processing your thoughts...</p>
              </div>
            </div>
          )}

          {step === 'result' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Timer className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-2">Quick Insight</h3>
                    <p className="text-blue-800 leading-relaxed whitespace-pre-line">{response}</p>
                  </div>
                </div>
              </div>

              <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                <p className="text-sm text-cyan-800">
                  <span className="font-semibold">Remember:</span> If you need more support,
                  consider reaching out to a mental health professional. You deserve comprehensive
                  care.
                </p>
              </div>

              <button
                onClick={reset}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-700 transition"
              >
                Start Another Session
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
