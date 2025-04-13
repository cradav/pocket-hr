import { CareerStage } from "./types";

const currentDate = new Date().toISOString();

// Define career stages and their assistants
export const careerStages: CareerStage[] = [
  {
    id: "125494e5-ca0f-471d-943c-17cc49c4105d",
    name: "Landing the Role",
    description: "Get help with job applications, interviews, and negotiations",
    isActive: true,
    created_at: currentDate,
    updated_at: currentDate,
    assistants: [
      {
        id: "1e9ff56e-55ae-44d8-ad96-fdefa622b170",
        name: "Resume Coach",
        description: "Get expert help optimizing your resume for job applications and ATS systems",
        mode: "resume-coach",
        conversations: [],
        isActive: true,
        created_at: currentDate,
        updated_at: currentDate
      },
      {
        id: "91d4aa3f-194d-4ee8-934a-1f049c816155",
        name: "Negotiation Advisor",
        description: "Get strategic advice on negotiating job offers and compensation packages",
        mode: "negotiation-advisor",
        conversations: [],
        isActive: true,
        created_at: currentDate,
        updated_at: currentDate
      },
      {
        id: "39a02807-9afd-474e-8515-8b5c77feb51e",
        name: "Interview Practice Partner",
        description: "Practice for job interviews with customized questions and detailed feedback",
        mode: "interview-practice",
        conversations: [],
        isActive: true,
        created_at: currentDate,
        updated_at: currentDate
      },
    ],
  },
  {
    id: "b1f69a3d-fdb9-4906-b8fd-968e5bfab44a",
    name: "Excel at Work",
    description: "Improve your performance and navigate workplace challenges",
    isActive: true,
    created_at: currentDate,
    updated_at: currentDate,
    assistants: [
      {
        id: "5a75e688-504a-450e-8d8a-b5152afa8bbb",
        name: "Performance Improvement Advisor",
        description: "Get personalized guidance on improving your workplace performance",
        mode: "performance-advisor",
        conversations: [],
        isActive: true,
        created_at: currentDate,
        updated_at: currentDate
      },
      {
        id: "521fdfdf-80fb-40a3-88fc-2379aedef181",
        name: "Onboarding Assistant",
        description: "Navigate your first days and weeks at a new job with confidence",
        mode: "onboarding",
        conversations: [],
        isActive: true,
        created_at: currentDate,
        updated_at: currentDate
      },
      {
        id: "48ad2846-deac-4a38-a81d-4eb030c2a0fa",
        name: "Benefits Advisor",
        description: "Understand and optimize your employee benefits package",
        mode: "benefits-advisor",
        conversations: [],
        isActive: true,
        created_at: currentDate,
        updated_at: currentDate
      },
    ],
  },
  {
    id: "34e9996e-9166-41cd-8c53-49c2bae449a0",
    name: "Moving On",
    description: "Plan your next career move and manage transitions",
    isActive: true,
    created_at: currentDate,
    updated_at: currentDate,
    assistants: [
      {
        id: "a8c9439d-0a70-4cd6-8404-f2182bca7c77",
        name: "Transition Coach",
        description: "Get guidance on smoothly transitioning to your next opportunity",
        mode: "transition-coach",
        conversations: [],
        isActive: true,
        created_at: currentDate,
        updated_at: currentDate
      },
      {
        id: "6b76e4e2-a95a-4c9e-89d7-cf756d091767",
        name: "Reference Builder",
        description: "Create effective professional references and recommendations",
        mode: "reference-builder",
        conversations: [],
        isActive: true,
        created_at: currentDate,
        updated_at: currentDate
      },
      {
        id: "ace9392f-68be-4296-a543-9c3f45f1b078",
        name: "Exit Strategy Planner",
        description: "Plan a professional and strategic departure from your current role",
        mode: "exit-strategy",
        conversations: [],
        isActive: true,
        created_at: currentDate,
        updated_at: currentDate
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
