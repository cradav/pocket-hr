import { Assistant, CareerStage } from "./types";

// Get appropriate message when assistant mode changes
export const getModeChangeMessage = (mode: string): string => {
  switch (mode) {
    case "resume-coach":
      return "I'm now in Resume Coach mode. I can help you create or optimize your resume for job applications and ATS systems.";
    case "negotiation-advisor":
      return "I'm now in Negotiation Advisor mode. I can provide strategic guidance on negotiating job offers, compensation packages, and benefits.";
    case "interview-practice":
      return "I'm now in Interview Practice Partner mode. I can help you prepare for interviews with practice questions, mock interviews, and feedback.";
    case "performance-advisor":
      return "I'm now in Performance Improvement Advisor mode. I can help you enhance your workplace performance and prepare for reviews.";
    case "onboarding":
      return "I'm now in Onboarding Assistant mode. I can help you navigate your first days and weeks at a new job.";
    case "benefits-advisor":
      return "I'm now in Benefits Advisor mode. I can help you understand and optimize your employee benefits package.";
    case "transition-coach":
      return "I'm now in Transition Coach mode. I can help you smoothly transition to your next opportunity.";
    case "reference-builder":
      return "I'm now in Reference Builder mode. I can help you create effective professional references and recommendations.";
    case "exit-strategy":
      return "I'm now in Exit Strategy Planner mode. I can help you plan a professional and strategic departure from your current role.";
    default:
      return "How can I assist you today?";
  }
};

import { generateOpenAIResponse } from "@/services/openaiService";

// Generate AI response based on assistant mode and user query
export const getAIResponse = async (
  query: string,
  assistantId: string,
  stagesWithConversations: CareerStage[],
  wordCredits: { remaining: number; total: number },
  onWordUsage: (wordsUsed: number) => void,
): Promise<string> => {
  // Find the selected assistant's mode
  let mode = "";
  for (const stage of stagesWithConversations) {
    const assistant = stage.assistants.find((a) => a.id === assistantId);
    if (assistant) {
      mode = assistant.mode;
      break;
    }
  }

  // Check if user has enough word credits
  if (wordCredits.remaining <= 0) {
    return "You've reached your monthly word limit. Please upgrade your plan for more AI-generated words or wait until your credits reset next month.";
  }

  try {
    // Generate response using OpenAI
    const openAIResponse = await generateOpenAIResponse(query, mode);

    // Estimate word count (tokens are roughly 0.75 words)
    const estimatedWordCount = Math.ceil(openAIResponse.tokenCount * 0.75);

    // Check if user has enough word credits for this response
    if (wordCredits.remaining < estimatedWordCount) {
      return "You don't have enough word credits for this response. Please try a shorter query or upgrade your plan for more AI-generated words.";
    }

    // Count words for the actual displayed response
    const wordCount = openAIResponse.content.split(/\s+/).length;
    onWordUsage(wordCount);

    return openAIResponse.content;
  } catch (error) {
    console.error("Error getting AI response:", error);
    return "Sorry, I encountered an error while generating a response. Please try again later.";
  }
};
