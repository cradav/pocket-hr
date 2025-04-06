// OpenAI service for generating AI responses

export interface OpenAIResponse {
  content: string;
  tokenCount: number;
}

export interface OpenAIConfig {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  voice?: string;
  response_format?: string;
}

export async function generateOpenAIResponse(
  query: string,
  assistantMode: string,
  systemPrompt?: string,
  config?: OpenAIConfig,
  userName?: string,
): Promise<OpenAIResponse> {
  try {
    // Check if we have an OpenAI API key
    const apiKey =
      import.meta.env.VITE_OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      console.error(
        "OpenAI API key is not set. Please add it to your environment variables.",
      );
      return {
        content:
          "OpenAI API key is not set. Please add it to your environment variables.",
        tokenCount: 20, // Approximate token count for this message
      };
    }

    // If we're in development mode and no API key is available, return mock data
    if (
      (import.meta.env.DEV || process.env.NODE_ENV === "development") &&
      !apiKey
    ) {
      console.log("Using mock data for OpenAI response (no API key available)");

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return getMockResponse(query, assistantMode);
    }

    // Prepare the system prompt based on the assistant mode
    let finalSystemPrompt =
      systemPrompt || getSystemPromptForMode(assistantMode);

    // Add user's name to the system prompt if available
    if (userName) {
      finalSystemPrompt = `${finalSystemPrompt} Address the user as ${userName} when it feels natural in conversation. Make the conversation feel personalized.`;
    }

    // Make the API call to OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config?.model || "gpt-3.5-turbo", // You can change this to other models as needed
        messages: [
          {
            role: "system",
            content: finalSystemPrompt,
          },
          {
            role: "user",
            content: query,
          },
        ],
        temperature: config?.temperature || 0.7,
        max_tokens: config?.max_tokens || 500,
        ...(config?.response_format && {
          response_format: { type: config.response_format },
        }),
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Extract the response content and token usage
    const content = data.choices[0].message.content;
    const tokenCount = data.usage.total_tokens;

    return {
      content,
      tokenCount,
    };
  } catch (error) {
    console.error("Error generating OpenAI response:", error);
    return {
      content:
        "Sorry, I encountered an error while generating a response. Please try again later.",
      tokenCount: 20, // Approximate token count for this message
    };
  }
}

// Helper function to get a system prompt based on the assistant mode
export function getSystemPromptForMode(mode: string): string {
  switch (mode) {
    case "resume-coach":
      return "You are an expert resume coach. Help the user create or optimize their resume for job applications and ATS systems. Provide specific, actionable advice tailored to their industry and experience level.";
    case "negotiation-advisor":
      return "You are an expert negotiation advisor. Provide strategic guidance on negotiating job offers, compensation packages, and benefits. Help the user understand their leverage points and how to professionally advocate for themselves.";
    case "interview-practice":
      return "You are an expert interview coach. Help the user prepare for job interviews with practice questions, feedback, and strategies tailored to their industry and the specific role they're applying for.";
    case "performance-advisor":
      return "You are a performance improvement advisor. Help the user enhance their workplace performance and prepare for reviews. Provide actionable strategies for professional development and career advancement.";
    case "benefits-advisor":
      return "You are a benefits advisor. Help the user understand and optimize their employee benefits package. Provide guidance on health insurance, retirement plans, and other workplace benefits.";
    default:
      return "You are an AI HR assistant. Provide helpful, professional advice on career and workplace topics. Be concise, specific, and actionable in your responses.";
  }
}

// Mock response function for development without an API key
function getMockResponse(query: string, mode: string): OpenAIResponse {
  let content = "";
  const tokenCount = 50; // Approximate token count for mock responses

  switch (mode) {
    case "resume-coach":
      if (query.includes("format")) {
        content =
          "I recommend using a clean, ATS-friendly format with clear section headings and bullet points for achievements. This ensures your resume is both human-readable and can pass through automated screening systems.";
      } else if (query.includes("skills") || query.includes("abilities")) {
        content =
          "When listing skills, prioritize those mentioned in the job description. Use a mix of hard skills (technical abilities) and soft skills (communication, leadership) that are relevant to the position you're applying for.";
      } else {
        content =
          "I can help optimize your resume for job applications. Could you share a specific section you'd like feedback on, such as your summary, skills, experience, or education?";
      }
      break;

    case "negotiation-advisor":
      content =
        "When negotiating a job offer, always research market rates for your position and location first. Be prepared to justify your ask with specific achievements and value you bring. Remember that compensation includes more than just salary - consider benefits, work-life balance, and growth opportunities.";
      break;

    default:
      content =
        "I'm here to help with your HR and career questions. Could you provide more details about what you're looking for assistance with?";
  }

  return {
    content,
    tokenCount,
  };
}
