// Voice service for handling real-time voice conversations
import { generateOpenAIResponse } from "./openaiService";

interface VoiceSessionConfig {
  conversationId: string;
  userId: string;
  systemPrompt?: string;
  voice?: string;
}

interface VoiceResponse {
  audioUrl: string;
  text: string;
  tokenCount: number;
  moderation?: {
    flagged: boolean;
    categories?: string[];
    score?: number;
  };
  error?: string; // Error type for fallback handling
}

interface EmotionalAnnotation {
  text: string;
  tone?: string;
}

// Process audio chunks and convert to text using Whisper
export async function processAudioChunk(
  audioChunk: Blob,
  sessionConfig: VoiceSessionConfig,
  userToken?: string,
): Promise<EmotionalAnnotation> {
  try {
    // Check if we have an OpenAI API key
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      console.error(
        "OpenAI API key is not set. Please add it to your environment variables.",
      );
      return { text: "Error: OpenAI API key is not set." };
    }

    // If we're in development mode and no API key is available, return mock data
    if (import.meta.env.DEV && !apiKey) {
      console.log(
        "Using mock data for voice processing (no API key available)",
      );
      return getMockSpeechToText();
    }

    // Make the API call to OpenAI Whisper API
    const formData = new FormData();
    formData.append("file", audioChunk);
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");

    // Add user token if available for authentication
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
    };

    if (userToken) {
      headers["X-Tempo-User-Token"] = userToken;
    }

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers,
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error(
        `Whisper API request failed with status ${response.status}`,
      );
    }

    const data = await response.json();

    // Extract text and detect emotional tone (this is a simplified version)
    // In a real implementation, you would use more sophisticated tone detection
    const text = data.text;
    let tone = undefined;

    // Simple tone detection based on keywords and punctuation
    if (
      text.includes("!") &&
      (text.includes("great") || text.includes("amazing"))
    ) {
      tone = "excited";
    } else if (text.includes("?")) {
      tone = "questioning";
    } else if (text.includes("not working") || text.includes("won't")) {
      tone = "frustrated";
    }

    return { text, tone };
  } catch (error) {
    console.error("Error processing audio chunk:", error);
    return {
      text: "Sorry, I encountered an error while processing your voice. Please try again.",
    };
  }
}

// Cache for preloaded common phrases
const preloadedAudioCache = new Map<string, string>();
const COMMON_PHRASES = [
  "I'm sorry, I didn't catch that.",
  "Could you please repeat that?",
  "Let me think about that for a moment.",
  "I'm processing your request.",
  "Is there anything else I can help you with?",
];

// Generate voice response using OpenAI TTS
export async function generateVoiceResponse(
  text: string,
  sessionConfig: VoiceSessionConfig,
): Promise<VoiceResponse> {
  try {
    // Check if we have an OpenAI API key
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      console.error(
        "OpenAI API key is not set. Please add it to your environment variables.",
      );
      return {
        audioUrl: "",
        text: "OpenAI API key is not set. Please add it to your environment variables.",
        tokenCount: 20,
        error: "missing_api_key",
      };
    }

    // If we're in development mode and no API key is available, return mock data
    if (import.meta.env.DEV && !apiKey) {
      console.log("Using mock data for voice response (no API key available)");
      return getMockVoiceResponse(text);
    }

    // Check if this is a common phrase we've preloaded
    if (preloadedAudioCache.has(text)) {
      const audioUrl = preloadedAudioCache.get(text);
      console.log("Using preloaded audio for common phrase");
      return {
        audioUrl: audioUrl || "",
        text,
        tokenCount: Math.ceil(text.split(" ").length * 1.3),
      };
    }

    // Make the API call to OpenAI TTS API
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: sessionConfig.voice || "alloy",
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS API request failed with status ${response.status}`);
    }

    // Convert the response to a blob and create a URL
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // Estimate token count (very rough estimate)
    const tokenCount = Math.ceil(text.split(" ").length * 1.3);

    return {
      audioUrl,
      text,
      tokenCount,
    };
  } catch (error) {
    console.error("Error generating voice response:", error);
    return {
      audioUrl: "",
      text: "Sorry, I encountered an error while generating a voice response. Please try again later.",
      tokenCount: 20,
      error: "tts_generation_failed",
    };
  }
}

// Preload common phrases during idle time
export async function preloadCommonPhrases(
  voice: string = "alloy",
): Promise<void> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) return;

  // Don't preload in development mode without API key
  if (import.meta.env.DEV && !apiKey) return;

  // Only preload phrases that aren't already cached
  const phrasesToLoad = COMMON_PHRASES.filter(
    (phrase) => !preloadedAudioCache.has(phrase),
  );
  if (phrasesToLoad.length === 0) return;

  console.log(`Preloading ${phrasesToLoad.length} common audio phrases...`);

  for (const phrase of phrasesToLoad) {
    try {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "tts-1",
          voice: voice,
          input: phrase,
        }),
      });

      if (!response.ok) continue;

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      preloadedAudioCache.set(phrase, audioUrl);

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Failed to preload phrase: ${phrase}`, error);
    }
  }

  console.log(`Preloaded ${preloadedAudioCache.size} common audio phrases`);
}

// Check content for moderation violations
async function moderateContent(
  text: string,
  apiKey: string,
): Promise<{
  flagged: boolean;
  categories?: string[];
  score?: number;
}> {
  try {
    // If no API key, skip moderation
    if (!apiKey) {
      return { flagged: false };
    }

    // Call OpenAI moderation API
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: text,
      }),
    });

    if (!response.ok) {
      console.error(
        `Moderation API request failed with status ${response.status}`,
      );
      return { flagged: false }; // Default to not flagged on error
    }

    const data = await response.json();
    const result = data.results[0];

    // Extract flagged categories
    const flaggedCategories = Object.entries(result.categories)
      .filter(([_, value]) => value === true)
      .map(([key]) => key);

    return {
      flagged: result.flagged,
      categories: flaggedCategories,
      score: result.category_scores
        ? Math.max(...Object.values(result.category_scores))
        : undefined,
    };
  } catch (error) {
    console.error("Error in content moderation:", error);
    return { flagged: false }; // Default to not flagged on error
  }
}

// Simple in-memory cache for voice responses
const voiceResponseCache = new Map<
  string,
  { response: VoiceResponse; timestamp: number }
>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes cache TTL
const MAX_CACHE_SIZE = 100; // Maximum number of cached responses

// Rate limiting for voice processing
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // Maximum requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window

// Process voice input and generate voice response
export async function processVoiceInput(
  audioChunk: Blob,
  sessionConfig: VoiceSessionConfig,
  assistantMode: string,
  userToken?: string,
): Promise<VoiceResponse> {
  try {
    // Apply rate limiting
    const userId = sessionConfig.userId || "anonymous";
    if (!checkRateLimit(userId)) {
      return {
        audioUrl: "",
        text: "You've reached the rate limit for voice processing. Please try again in a minute.",
        tokenCount: 20,
      };
    }

    // Step 1: Convert speech to text
    let textResult;
    try {
      textResult = await processAudioChunk(
        audioChunk,
        sessionConfig,
        userToken,
      );
    } catch (sttError) {
      console.error("Speech-to-text error:", sttError);
      return {
        audioUrl: "",
        text: "I couldn't understand that. Let's continue by text. Could you type your message instead?",
        tokenCount: 20,
        error: "speech_to_text_failed",
      };
    }

    const { text, tone } = textResult;

    if (!text || text.trim() === "") {
      return {
        audioUrl: "",
        text: "I didn't catch that. Could you please speak more clearly or try typing your message?",
        tokenCount: 20,
        error: "empty_transcription",
      };
    }

    // Step 1.5: Check content moderation
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const moderationResult = await moderateContent(text, apiKey);

    // Step 2: Add tone information if available and handle moderation
    if (moderationResult.flagged) {
      return {
        audioUrl: "",
        text: "I'm sorry, but I detected content that violates our usage policies. Please try again with different wording.",
        tokenCount: 20,
        moderation: moderationResult,
      };
    }

    const processedText = tone ? `${text} (tone: ${tone})` : text;

    // Check cache for this exact query
    const cacheKey = `${assistantMode}:${processedText}`;
    const cachedResponse = voiceResponseCache.get(cacheKey);

    if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
      console.log("Using cached voice response");
      // Return a clone of the cached response to avoid mutation issues
      return { ...cachedResponse.response };
    }

    // Step 3: Generate AI response using existing OpenAI service
    // Enhance system prompt with voice adaptation rules
    const voiceSystemPrompt = sessionConfig.systemPrompt
      ? `${sessionConfig.systemPrompt} + When responding, be conversational and natural as this will be converted to speech. Keep responses concise and clear.`
      : undefined;

    let aiResponse;
    try {
      aiResponse = await generateOpenAIResponse(
        processedText,
        assistantMode,
        voiceSystemPrompt,
      );
    } catch (textProcessingError) {
      console.error("Text processing error:", textProcessingError);
      return {
        audioUrl: "",
        text: `I understood you said: "${text}", but I'm having trouble processing it. Let's continue by text.`,
        tokenCount: 20,
        error: "text_processing_failed",
      };
    }

    // Step 4: Convert text response to speech
    let voiceResponse;
    try {
      voiceResponse = await generateVoiceResponse(
        aiResponse.content,
        sessionConfig,
      );
    } catch (ttsError) {
      console.error("Text-to-speech error:", ttsError);
      // Fallback to text-only response
      return {
        audioUrl: "",
        text:
          aiResponse.content +
          " (Note: Audio generation failed. Let's continue by text.)",
        tokenCount: aiResponse.tokenCount,
        error: "text_to_speech_failed",
      };
    }

    // Cache the successful response
    if (voiceResponseCache.size >= MAX_CACHE_SIZE) {
      // Remove the oldest entry if cache is full
      const oldestKey = [...voiceResponseCache.entries()].sort(
        (a, b) => a[1].timestamp - b[1].timestamp,
      )[0][0];
      voiceResponseCache.delete(oldestKey);
    }

    voiceResponseCache.set(cacheKey, {
      response: voiceResponse,
      timestamp: Date.now(),
    });

    return voiceResponse;
  } catch (error) {
    console.error("Error in voice processing pipeline:", error);
    // Log the error for monitoring
    logVoiceError(sessionConfig.conversationId, error);

    return {
      audioUrl: "",
      text: "Sorry, I encountered an error in the voice processing pipeline. Let's continue by text.",
      tokenCount: 20,
      error: "general_voice_processing_error",
    };
  }
}

// Check if the user has exceeded rate limits
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRateLimit = rateLimitMap.get(userId);

  if (!userRateLimit) {
    // First request from this user
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (now > userRateLimit.resetTime) {
    // Reset rate limit window
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (userRateLimit.count >= RATE_LIMIT) {
    // Rate limit exceeded
    return false;
  }

  // Increment count and allow request
  userRateLimit.count += 1;
  rateLimitMap.set(userId, userRateLimit);
  return true;
}

// Log voice processing errors for monitoring
function logVoiceError(conversationId: string, error: any): void {
  const errorLog = {
    timestamp: new Date().toISOString(),
    conversationId,
    errorMessage: error.message || "Unknown error",
    errorStack: error.stack,
    errorType: error.name || "Error",
  };

  console.error("VOICE_ERROR_LOG:", JSON.stringify(errorLog));

  // In a production environment, you would send this to a logging service
  // or database for monitoring and analysis
}

// Mock functions for development without API keys
function getMockSpeechToText(): EmotionalAnnotation {
  const mockResponses = [
    {
      text: "How can I prepare for my upcoming performance review?",
      tone: "questioning",
    },
    {
      text: "I'm not sure how to approach my manager about a raise.",
      tone: "uncertain",
    },
    { text: "This is amazing! I got the promotion!", tone: "excited" },
    {
      text: "Why won't this system recognize my achievements?",
      tone: "frustrated",
    },
  ];

  return mockResponses[Math.floor(Math.random() * mockResponses.length)];
}

function getMockVoiceResponse(text: string): VoiceResponse {
  // In a real implementation, you would generate actual audio
  // For now, we'll just return a mock URL and the text
  return {
    audioUrl: "https://example.com/mock-audio.mp3",
    text,
    tokenCount: Math.ceil(text.split(" ").length * 1.3),
  };
}
