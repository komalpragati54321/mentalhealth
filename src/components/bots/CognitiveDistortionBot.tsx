import { useState } from 'react';
import { ArrowLeft, Brain, Send, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type Distortion = {
  type: string;
  name: string;
  description: string;
  example: string;
  color: string;
};

const distortions: Distortion[] = [
  {
    type: 'all_or_nothing',
    name: 'All-or-Nothing Thinking',
    description: 'Seeing things in black and white categories',
    example: '"If I\'m not perfect, I\'m a total failure"',
    color: 'bg-red-100 border-red-300 text-red-800',
  },
  {
    type: 'overgeneralization',
    name: 'Overgeneralization',
    description: 'Seeing a single negative event as a never-ending pattern',
    example: '"Nothing ever works out for me"',
    color: 'bg-orange-100 border-orange-300 text-orange-800',
  },
  {
    type: 'mental_filter',
    name: 'Mental Filter',
    description: 'Focusing only on negatives while ignoring positives',
    example: 'Dwelling on one criticism despite multiple compliments',
    color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  },
  {
    type: 'jumping_to_conclusions',
    name: 'Jumping to Conclusions',
    description: 'Making negative interpretations without evidence',
    example: '"They didn\'t reply, they must hate me"',
    color: 'bg-green-100 border-green-300 text-green-800',
  },
  {
    type: 'catastrophizing',
    name: 'Catastrophizing',
    description: 'Expecting the worst possible outcome',
    example: '"If I fail this test, my life is ruined"',
    color: 'bg-blue-100 border-blue-300 text-blue-800',
  },
  {
    type: 'emotional_reasoning',
    name: 'Emotional Reasoning',
    description: 'Believing feelings reflect reality',
    example: '"I feel like a failure, so I must be one"',
    color: 'bg-purple-100 border-purple-300 text-purple-800',
  },
  {
    type: 'should_statements',
    name: 'Should Statements',
    description: 'Rigid rules about how you or others should behave',
    example: '"I should be able to handle this perfectly"',
    color: 'bg-pink-100 border-pink-300 text-pink-800',
  },
];

type Props = {
  onBack: () => void;
};

export default function CognitiveDistortionBot({ onBack }: Props) {
  const { user } = useAuth();
  const [thought, setThought] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedDistortions, setDetectedDistortions] = useState<Distortion[]>([]);
  const [reframedThought, setReframedThought] = useState('');
  const [showResult, setShowResult] = useState(false);

  const detectDistortions = (text: string): Distortion[] => {
    const detected: Distortion[] = [];
    const lowerText = text.toLowerCase();

    if (
      lowerText.includes('always') ||
      lowerText.includes('never') ||
      lowerText.includes('everything') ||
      lowerText.includes('nothing') ||
      /\b(perfect|total|complete)\s+(failure|disaster)\b/.test(lowerText)
    ) {
      detected.push(distortions[0]);
    }

    if (
      lowerText.includes('nothing ever') ||
      lowerText.includes('always happens') ||
      lowerText.includes('everyone') ||
      lowerText.includes('no one')
    ) {
      detected.push(distortions[1]);
    }

    if (
      lowerText.includes('must hate') ||
      lowerText.includes('probably thinks') ||
      lowerText.includes("doesn't like") ||
      lowerText.includes('will fail')
    ) {
      detected.push(distortions[3]);
    }

    if (
      lowerText.includes('worst') ||
      lowerText.includes('terrible') ||
      lowerText.includes('disaster') ||
      lowerText.includes('ruined') ||
      lowerText.includes('catastrophe')
    ) {
      detected.push(distortions[4]);
    }

    if (lowerText.includes('i feel') && (lowerText.includes('so i') || lowerText.includes('must be'))) {
      detected.push(distortions[5]);
    }

    if (lowerText.includes('should') || lowerText.includes('must') || lowerText.includes('ought to')) {
      detected.push(distortions[6]);
    }

    if (detected.length === 0) {
      detected.push(distortions[2]);
    }

    return detected;
  };

  const generateReframe = (originalThought: string, distortionsFound: Distortion[]): string => {
    const reframes: Record<string, string> = {
      all_or_nothing:
        "Let's find the middle ground. Instead of 'perfect or failure', what would 'good enough' look like? Progress isn't all-or-nothing.",
      overgeneralization:
        'This is one situation, not a permanent pattern. What are some times when things did work out for you?',
      mental_filter:
        "What else happened today? Let's balance this by acknowledging both the negative and positive aspects.",
      jumping_to_conclusions:
        "What evidence do you have for this conclusion? What are other possible explanations that might be equally or more likely?",
      catastrophizing:
        "What's the most likely outcome, realistically? Even if something bad happens, how might you cope with it?",
      emotional_reasoning:
        'Feelings are real, but they aren\'t always facts. What would you tell a friend feeling this way? What\'s the objective evidence?',
      should_statements:
        "Replace 'should' with 'prefer' or 'would like to'. This removes harsh judgment and creates space for self-compassion.",
    };

    if (distortionsFound.length > 0) {
      return reframes[distortionsFound[0].type] || reframes.mental_filter;
    }

    return "Try looking at this situation from a friend's perspective. What would you tell someone you care about if they had this thought?";
  };

  const handleAnalyze = async () => {
    if (!user || !thought.trim()) return;

    setLoading(true);

    try {
      const detected = detectDistortions(thought);
      const reframe = generateReframe(thought, detected);

      await supabase.from('cognitive_distortions').insert(
        detected.map((d) => ({
          user_id: user.id,
          distortion_type: d.type,
          original_thought: thought,
          reframed_thought: reframe,
        }))
      );

      setDetectedDistortions(detected);
      setReframedThought(reframe);
      setShowResult(true);
    } catch (error) {
      console.error('Error analyzing thought:', error);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setThought('');
    setDetectedDistortions([]);
    setReframedThought('');
    setShowResult(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
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
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Cognitive Distortion Spotter</h2>
              <p className="text-gray-600">Identify and reframe thinking patterns</p>
            </div>
          </div>

          {!showResult ? (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-purple-800">
                    Cognitive distortions are patterns of thinking that can make us feel worse. This
                    tool helps you identify them and see things more clearly.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  What thought is bothering you?
                </label>
                <textarea
                  value={thought}
                  onChange={(e) => setThought(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                  rows={6}
                  placeholder="Example: 'I made one mistake, so I'm a complete failure at my job'"
                />
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!thought.trim() || loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Brain className="w-5 h-5 mr-2" />
                    Analyze Thought
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Your Original Thought:</h3>
                <p className="text-gray-700 italic">"{thought}"</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Detected Distortions:</h3>
                <div className="space-y-3">
                  {detectedDistortions.map((distortion, index) => (
                    <div
                      key={index}
                      className={`border-2 rounded-xl p-4 ${distortion.color}`}
                    >
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold mb-1">{distortion.name}</h4>
                          <p className="text-sm mb-2">{distortion.description}</p>
                          <p className="text-xs italic">Example: {distortion.example}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900 mb-2">Reframed Perspective:</h3>
                    <p className="text-green-800 leading-relaxed">{reframedThought}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={reset}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-700 transition"
              >
                Analyze Another Thought
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
