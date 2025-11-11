import { useState, useEffect } from 'react';
import { ArrowLeft, Moon, Send, Star, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

type Props = {
  onBack: () => void;
};

const sleepResponses = [
  {
    keywords: ['sleep', "can't sleep", 'insomnia', 'awake'],
    response:
      "I understand it's hard when sleep won't come. Let's try the 4-7-8 breathing technique: Breathe in quietly through your nose for 4 counts, hold for 7, then exhale completely through your mouth for 8. Repeat 3-4 times. Would you like to try this together?",
  },
  {
    keywords: ['worried', 'anxious', 'stress', 'thinking'],
    response:
      "Night worries can feel overwhelming. Remember: 3 AM thoughts are not facts. Try this - imagine placing each worry in a bubble and watching it float away. What's one thing you can do about this tomorrow? For now, you need rest.",
  },
  {
    keywords: ['nightmare', 'bad dream', 'scared'],
    response:
      "Dreams can be unsettling, but you're safe now. Try this grounding technique: Name 5 things you can see in your room, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste. You're here, you're safe.",
  },
  {
    keywords: ['alone', 'lonely'],
    response:
      "You're not alone, even in the quiet of night. Many people are awake right now, feeling similar things. I'm here with you. Would you like to talk about what's making you feel lonely, or would you prefer a calming story?",
  },
  {
    keywords: ['relax', 'calm', 'peaceful'],
    response:
      "Let's create calm together. Close your eyes and imagine a peaceful place - maybe a quiet beach, a forest, or a cozy room. Notice the details: what do you see, hear, feel? Let yourself sink deeper into this peaceful space.",
  },
];

export default function SleepGuardianBot({ onBack }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Good evening. I'm here to keep you company through the night. Whether you're having trouble sleeping, feeling anxious, or just need someone to talk to - I'm here. What's on your mind?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    startSession();
  }, []);

  const startSession = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('sleep_sessions')
        .insert({
          user_id: user.id,
          start_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (data) {
        setSessionId(data.id);
      }
    } catch (error) {
      console.error('Error starting sleep session:', error);
    }
  };

  const findResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    for (const responseData of sleepResponses) {
      if (responseData.keywords.some((keyword) => lowerMessage.includes(keyword))) {
        return responseData.response;
      }
    }

    return "I hear you. Sometimes it helps just to express what we're feeling. Take a slow, deep breath with me. In... and out. How are you feeling right now?";
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    if (user && sessionId) {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id)
        .eq('bot_type', 'sleep_guardian')
        .maybeSingle();

      let conversationId = conversation?.id;

      if (!conversationId) {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            bot_type: 'sleep_guardian',
            title: 'Sleep Guardian Session',
          })
          .select()
          .single();

        conversationId = newConv?.id;
      }

      if (conversationId) {
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'user',
          content: input,
        });
      }
    }

    setTimeout(() => {
      const botResponse = findResponse(input);
      const assistantMessage: Message = {
        role: 'assistant',
        content: botResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    }, 1500);
  };

  const bgClass = isDarkMode
    ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900'
    : 'bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50';

  const cardClass = isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900';
  const inputClass = isDarkMode
    ? 'bg-slate-700 text-white border-slate-600'
    : 'bg-white text-gray-900 border-gray-300';

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-500`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={onBack}
            className={`flex items-center space-x-2 transition ${
              isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition ${
                isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-white hover:bg-gray-100'
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg transition ${
                isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-white hover:bg-gray-100'
              }`}
            >
              {isDarkMode ? <Moon className="w-5 h-5" /> : <Star className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className={`${cardClass} rounded-2xl shadow-xl p-8`}>
          <div className="flex items-center space-x-3 mb-6">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDarkMode ? 'bg-indigo-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'
              }`}
            >
              <Moon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Sleep Guardian</h2>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                Your nighttime companion
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-6 h-96 overflow-y-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? isDarkMode
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-500 text-white'
                      : isDarkMode
                        ? 'bg-slate-700 text-gray-100'
                        : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                  <p
                    className={`text-xs mt-2 ${
                      message.role === 'user'
                        ? 'text-indigo-200'
                        : isDarkMode
                          ? 'text-gray-400'
                          : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition ${inputClass}`}
              placeholder="Share what's on your mind..."
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={`px-6 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
                isDarkMode
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          className={`mt-6 rounded-xl p-4 ${
            isDarkMode ? 'bg-slate-800/50 text-gray-300' : 'bg-white/50 text-gray-700'
          }`}
        >
          <p className="text-sm text-center">
            <span className="font-semibold">Remember:</span> If you're in crisis or need immediate
            help, please contact a crisis helpline or emergency services.
          </p>
        </div>
      </div>
    </div>
  );
}
