import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Video, Send, Loader2, StopCircle } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  detectedEmotion?: string;
};

type Props = {
  onBack: () => void;
};

const emotionResponses: Record<string, string[]> = {
  sad: [
    "I can see you might be feeling down right now. That's okay - difficult emotions are part of being human. Would you like to talk about what's bothering you?",
    "It's clear something heavy is on your mind. Remember, you don't have to carry this alone. I'm here to listen.",
    "I notice you seem sad. Sometimes just expressing what we feel can help lighten the load. What's going on?",
  ],
  happy: [
    "I can see you're smiling! That's wonderful. What's brought this joy into your day? I'd love to hear about it.",
    "Your positivity is beautiful! What are you grateful for right now?",
    "You seem to be in a great mood! This is a perfect time to reflect on what makes you happy.",
  ],
  angry: [
    "I sense some intensity in your expression. It's natural to feel angry sometimes. Let's talk about what's frustrating you.",
    "Anger is valid emotion. Take a deep breath with me. What's happened that's upset you?",
    "I can tell something has angered you. Let's work through this together.",
  ],
  fearful: [
    "You seem anxious or worried. That's understandable - we all have fears. What's making you feel unsafe right now?",
    "I can sense some fear or worry. Remember, you're safe here. What are you concerned about?",
    "It looks like something is worrying you. Let's talk about what's causing this anxiety.",
  ],
  neutral: [
    "You seem calm and composed. That's a good place to be. How are you feeling today?",
    "You have a peaceful expression. Is there anything on your mind you'd like to share?",
    "You seem thoughtful. What would you like to talk about?",
  ],
  surprised: [
    "Something seems to have caught your attention! What's surprised you?",
    "You look intrigued! Share what's caught your interest.",
    "I can see something has sparked your curiosity. Tell me more!",
  ],
};

export default function FaceDetectionBot({ onBack }: Props) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hello! I can see your face and detect your emotions. This helps me respond to you more compassionately. Please allow camera access to get started.",
      timestamp: new Date(),
    },
  ]);
  const [currentEmotion, setCurrentEmotion] = useState('');
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const detectionIntervalRef = useRef<NodeJS.Timeout>();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadModels();
    startSession();
  }, []);

  const startSession = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          bot_type: 'face_detection',
          title: 'Face Detection Chat',
        })
        .select()
        .single();

      if (data) {
        setSessionId(data.id);
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const loadModels = async () => {
    try {
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      setModelsLoaded(true);
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsRunning(true);
        startEmotionDetection();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Please allow camera access to use face detection.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    setIsRunning(false);
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
  };

  const startEmotionDetection = () => {
    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;

      try {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();

        const displaySize = {
          width: videoRef.current.width,
          height: videoRef.current.height,
        };

        faceapi.matchDimensions(canvasRef.current, displaySize);
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        const context = canvasRef.current.getContext('2d');
        if (context) {
          context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        }

        if (detections.length > 0 && detections[0].expressions) {
          const expressions = detections[0].expressions;
          const emotion = (Object.entries(expressions).sort(([, a], [, b]) => b - a)[0]?.[0] ||
            'neutral') as string;
          setCurrentEmotion(emotion);
        }
      } catch (error) {
        console.error('Error during detection:', error);
      }
    }, 300);
  };

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: 'bg-yellow-100 border-yellow-300',
      sad: 'bg-blue-100 border-blue-300',
      angry: 'bg-red-100 border-red-300',
      fearful: 'bg-purple-100 border-purple-300',
      neutral: 'bg-gray-100 border-gray-300',
      surprised: 'bg-green-100 border-green-300',
    };
    return colors[emotion] || 'bg-gray-100 border-gray-300';
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || !sessionId) return;

    setLoading(true);
    const userMessage: Message = {
      role: 'user',
      content: userInput,
      timestamp: new Date(),
      detectedEmotion: currentEmotion,
    };

    setMessages((prev) => [...prev, userMessage]);
    setUserInput('');

    try {
      await supabase.from('messages').insert({
        conversation_id: sessionId,
        role: 'user',
        content: userInput,
        metadata: { detected_emotion: currentEmotion },
      });

      const emotionArray = emotionResponses[currentEmotion] || emotionResponses.neutral;
      const response =
        emotionArray[Math.floor(Math.random() * emotionArray.length)];

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      await supabase.from('messages').insert({
        conversation_id: sessionId,
        role: 'assistant',
        content: response,
        metadata: { analyzed_emotion: currentEmotion },
      });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Video className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Face Detection Bot</h2>
                <p className="text-gray-600">Smart emotion-aware chatbot</p>
              </div>
            </div>

            <div className="space-y-6">
              {!modelsLoaded ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-3" />
                  <p className="text-gray-600">Loading AI models...</p>
                </div>
              ) : (
                <>
                  <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                    <video
                      ref={videoRef}
                      autoPlay
                      width={640}
                      height={480}
                      className="w-full h-full object-cover"
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full"
                    />
                    {!isRunning && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <button
                          onClick={startCamera}
                          disabled={!modelsLoaded}
                          className="flex items-center space-x-2 bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 transition"
                        >
                          <Video className="w-5 h-5" />
                          <span>Start Camera</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {isRunning && (
                    <div className="flex items-center justify-between">
                      <div
                        className={`px-4 py-2 rounded-lg border-2 font-semibold capitalize ${getEmotionColor(currentEmotion)}`}
                      >
                        Detected: {currentEmotion || 'Analyzing...'}
                      </div>
                      <button
                        onClick={stopCamera}
                        className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition"
                      >
                        <StopCircle className="w-5 h-5" />
                        <span>Stop Camera</span>
                      </button>
                    </div>
                  )}

                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                    <p className="text-sm text-teal-800">
                      <span className="font-semibold">Privacy:</span> Your camera feed is processed
                      locally. We only store the emotion analysis, not the video.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col h-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Chat</h3>

            <div className="flex-1 space-y-4 mb-4 h-96 overflow-y-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    {message.detectedEmotion && (
                      <p className="text-xs mt-2 opacity-75">
                        ({message.detectedEmotion})
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                placeholder="Say something..."
                disabled={!isRunning}
              />
              <button
                onClick={handleSendMessage}
                disabled={!userInput.trim() || loading || !isRunning}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
