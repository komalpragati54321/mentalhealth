import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Music,
  Timer,
  Trash2,
  Brain,
  Moon,
  Heart,
  LogOut,
  Menu,
  X,
  Video,
} from 'lucide-react';
import { BotType } from '../lib/supabase';
import TripleMBot from './bots/TripleMBot';
import MicroTherapyBot from './bots/MicroTherapyBot';
import VentingShredder from './bots/VentingShredder';
import CognitiveDistortionBot from './bots/CognitiveDistortionBot';
import SleepGuardianBot from './bots/SleepGuardianBot';
import GratitudeTracker from './bots/GratitudeTracker';
import FaceDetectionBot from './bots/FaceDetectionBot';

type BotConfig = {
  type: BotType;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
};

const bots: BotConfig[] = [
  {
    type: 'triple_m',
    name: 'Triple-M Bot',
    description: 'Mood, Music & Mindfulness',
    icon: <Music className="w-6 h-6" />,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
  {
    type: 'micro_therapy',
    name: 'Micro-Therapy',
    description: '60-second quick therapy',
    icon: <Timer className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    type: 'venting_shredder',
    name: 'Venting Shredder',
    description: 'Write it out, shred it away',
    icon: <Trash2 className="w-6 h-6" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    type: 'cognitive_distortion',
    name: 'Distortion Spotter',
    description: 'Detect thinking patterns',
    icon: <Brain className="w-6 h-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    type: 'sleep_guardian',
    name: 'Sleep Guardian',
    description: 'Night conversation mode',
    icon: <Moon className="w-6 h-6" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    type: 'gratitude',
    name: 'Gratitude Tracker',
    description: 'Daily gratitude & challenges',
    icon: <Heart className="w-6 h-6" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  {
    type: 'face_detection',
    name: 'Face Detection Bot',
    description: 'Emotion-aware smart chatbot',
    icon: <Video className="w-6 h-6" />,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
];

export default function Dashboard() {
  const { signOut } = useAuth();
  const [selectedBot, setSelectedBot] = useState<BotType | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderBotComponent = () => {
    switch (selectedBot) {
      case 'triple_m':
        return <TripleMBot onBack={() => setSelectedBot(null)} />;
      case 'micro_therapy':
        return <MicroTherapyBot onBack={() => setSelectedBot(null)} />;
      case 'venting_shredder':
        return <VentingShredder onBack={() => setSelectedBot(null)} />;
      case 'cognitive_distortion':
        return <CognitiveDistortionBot onBack={() => setSelectedBot(null)} />;
      case 'sleep_guardian':
        return <SleepGuardianBot onBack={() => setSelectedBot(null)} />;
      case 'gratitude':
        return <GratitudeTracker onBack={() => setSelectedBot(null)} />;
      case 'face_detection':
        return <FaceDetectionBot onBack={() => setSelectedBot(null)} />;
      default:
        return null;
    }
  };

  if (selectedBot) {
    return renderBotComponent();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50">
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MindCare</span>
            </div>

            <div className="hidden md:block">
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-600"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100">
            <div className="px-4 py-3">
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition w-full"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Your Wellness Hub
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose a mental wellness tool to begin your journey. Each bot is designed to help you
            in unique ways.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot) => (
            <button
              key={bot.type}
              onClick={() => setSelectedBot(bot.type)}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left group"
            >
              <div
                className={`w-14 h-14 ${bot.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${bot.color}`}
              >
                {bot.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{bot.name}</h3>
              <p className="text-gray-600">{bot.description}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
