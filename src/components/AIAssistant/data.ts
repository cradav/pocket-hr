import { CareerStage } from "./types";

// Define career stages and their assistants
export const careerStages: CareerStage[] = [
  {
    id: "landing",
    name: "Landing the Role",
    assistants: [
      {
        id: "resume-coach",
        name: "Resume Coach",
        description:
          "Get expert help optimizing your resume for job applications and ATS systems",
        mode: "resume-coach",
        conversations: [],
      },
      {
        id: "negotiation-advisor",
        name: "Negotiation Advisor",
        description:
          "Get strategic advice on negotiating job offers and compensation packages",
        mode: "negotiation-advisor",
        conversations: [],
      },
      {
        id: "interview-practice",
        name: "Interview Practice Partner",
        description:
          "Practice for job interviews with customized questions and detailed feedback",
        mode: "interview-practice",
        conversations: [],
      },
    ],
  },
  {
    id: "excelling",
    name: "Excel at Work",
    assistants: [
      {
        id: "performance-advisor",
        name: "Performance Improvement Advisor",
        description:
          "Get personalized guidance on improving your workplace performance",
        mode: "performance-advisor",
        conversations: [],
      },
      {
        id: "onboarding",
        name: "Onboarding Assistant",
        description:
          "Navigate your first days and weeks at a new job with confidence",
        mode: "onboarding",
        conversations: [],
      },
      {
        id: "benefits-advisor",
        name: "Benefits Advisor",
        description: "Understand and optimize your employee benefits package",
        mode: "benefits-advisor",
        conversations: [],
      },
    ],
  },
  {
    id: "moving-on",
    name: "Moving On",
    assistants: [
      {
        id: "transition-coach",
        name: "Transition Coach",
        description:
          "Get guidance on smoothly transitioning to your next opportunity",
        mode: "transition-coach",
        conversations: [],
      },
      {
        id: "reference-builder",
        name: "Reference Builder",
        description:
          "Create effective professional references and recommendations",
        mode: "reference-builder",
        conversations: [],
      },
      {
        id: "exit-strategy",
        name: "Exit Strategy Planner",
        description:
          "Plan a professional and strategic departure from your current role",
        mode: "exit-strategy",
        conversations: [],
      },
    ],
  },
];

// Initialize career stages with sample conversations
export const initializeCareerStages = () => {
  return careerStages.map((stage) => ({
    ...stage,
    assistants: stage.assistants.map((assistant) => ({
      ...assistant,
      conversations: [
        {
          id: `${assistant.id}-conv1`,
          title: `Conversation 1`,
          lastUpdated: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
          ),
          messages: [
            {
              id: "1",
              content: `Hello! I'm your ${assistant.name}. How can I help you today?`,
              sender: "ai",
              timestamp: new Date(
                Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
              ),
            },
          ],
        },
        {
          id: `${assistant.id}-conv2`,
          title: `Conversation 2`,
          lastUpdated: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
          ),
          messages: [
            {
              id: "1",
              content: `Welcome back! I'm your ${assistant.name}. How can I assist you today?`,
              sender: "ai",
              timestamp: new Date(
                Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
              ),
            },
          ],
        },
      ],
    })),
  }));
};
