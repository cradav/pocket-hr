export interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  token_count?: number;
  audioUrl?: string;
  isVoice?: boolean;
  moderation?: {
    flagged: boolean;
    categories?: string[];
    score?: number;
  };
  created_at?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}

export interface TrainingDocument {
  id: string;
  name: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  uploadDate: Date;
  size: number; // in bytes
}

export interface SystemPrompt {
  id: string;
  name: string;
  content: string;
  lastUpdated: Date;
}

export interface Assistant {
  id: string;
  name: string;
  description: string;
  mode: string;
  conversations: Conversation[];
  systemPrompt?: SystemPrompt;
  trainingDocuments?: TrainingDocument[];
  isActive: boolean;
  createdAt: Date;
  lastUpdated: Date;
  userDataAccess?: {
    documents: boolean;
    profileInfo: boolean;
    companyData: boolean;
  };
}

export interface CareerStage {
  id: string;
  name: string;
  description?: string;
  assistants: Assistant[];
  isActive: boolean;
  createdAt: Date;
  lastUpdated: Date;
}

export interface AIAssistantProps {
  onRequestHumanSupport?: () => void;
  wordCredits?: {
    remaining: number;
    total: number;
  };
  onWordUsage?: (wordsUsed: number) => void;
  selectedCareerStage?: string;
  selectedAssistant?: string;
  setSelectedAssistant?: (assistantId: string) => void;
}

export interface AssistantFormData {
  name: string;
  description: string;
  mode: string;
  systemPromptContent: string;
  isActive: boolean;
  careerStageId?: string;
  userDataAccess?: {
    documents: boolean;
    profileInfo: boolean;
    companyData: boolean;
  };
}

export interface CareerStageFormData {
  name: string;
  description: string;
  isActive: boolean;
}
