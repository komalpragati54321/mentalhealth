import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, botType } = await req.json();

    if (!message || !botType) {
      return new Response(
        JSON.stringify({ error: "Message and botType are required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const responses: Record<string, string> = {
      triple_m: generateTripleMResponse(message),
      micro_therapy: generateMicroTherapyResponse(message),
      cognitive_distortion: generateCognitiveResponse(message),
      sleep_guardian: generateSleepResponse(message),
      gratitude: generateGratitudeResponse(message),
    };

    const response = responses[botType] || "I'm here to support you. Tell me more about what's on your mind.";

    return new Response(
      JSON.stringify({ response }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in chat-ai function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

function generateTripleMResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("sad") || lower.includes("down")) {
    return "I hear that you're feeling sad. Music can be a powerful mood lifter. Try listening to something soothing or uplifting. Would you like me to recommend some calming exercises?";
  }
  if (lower.includes("anxious") || lower.includes("nervous")) {
    return "Anxiety can feel overwhelming. Let's ground you with the 4-7-8 breathing: Breathe in for 4, hold for 7, out for 8. Pair this with some calming ambient music.";
  }
  return "Music and mindfulness work together beautifully. What mood are you in right now? I can help you find the right combination.";
}

function generateMicroTherapyResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("overwhelmed")) {
    return "When everything feels too much, remember: you don't have to solve it all at once. Pick ONE small thing you can do right now. What would that be?";
  }
  if (lower.includes("tired") || lower.includes("exhausted")) {
    return "Emotional exhaustion is real. Your feelings are valid. What's one small act of self-care you could do in the next 10 minutes? Even washing your face or drinking water counts.";
  }
  return "I'm here with you. Whatever you're feeling right now is valid. Take a deep breath. What do you need most in this moment?";
}

function generateCognitiveResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("always") || lower.includes("never")) {
    return "I notice absolute words like 'always' or 'never'. These can be signs of all-or-nothing thinking. What if we looked for exceptions? Has there ever been a time when this wasn't true?";
  }
  if (lower.includes("everyone") || lower.includes("no one")) {
    return "When we say 'everyone' or 'no one', we might be overgeneralizing. Let's check: is this really true for everyone, or does it feel that way right now?";
  }
  return "Let's examine this thought together. What evidence supports it? What evidence might challenge it? Sometimes our thoughts aren't the full picture.";
}

function generateSleepResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("scared") || lower.includes("afraid")) {
    return "You're safe right now. Take a moment to ground yourself: feel the surface beneath you, notice the air on your skin. You're here, you're safe. I'm here with you.";
  }
  if (lower.includes("worry") || lower.includes("anxious")) {
    return "Night worries can feel so big. Remember: thoughts at night aren't facts. Try this - imagine placing each worry in a bubble and watching it float away. We can address them tomorrow.";
  }
  return "The night can feel long, but you're not alone. I'm here. Would you like to talk about what's keeping you awake, or would you prefer a calming exercise?";
}

function generateGratitudeResponse(message: string): string {
  return "That's wonderful to hear. Gratitude practices have been shown to improve mental well-being. What else are you grateful for today?";
}
