export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  sender: 'ai' | 'user';
  token_count?: number;
  audio_url?: string;
  created_at: string;
  timestamp?: Date;
  isVoice?: boolean;
}

export interface MessageDisplay {
  id: string;
  content: string;
  sender: 'ai' | 'user';
  timestamp: Date;
  isVoice?: boolean;
  audio_url?: string;
  token_count?: number;
  moderation?: {
    flagged: boolean;
    categories?: string[];
    score?: number;
  };
}

export interface Conversation {
  id: string;
  title: string;
  user_id: string;
  assistant_id: string;
  last_updated: string;
  created_at: string;
  messages?: Message[];
}

export interface ConversationDisplay {
  id: string;
  title: string;
  last_updated: Date;
  messages: MessageDisplay[];
}

export interface SystemPrompt {
  id: string;
  name: string;
  content: string;
  updated_at: string;
}

export interface TrainingDocument {
  id: string;
  name: string;
  content: string;
  type: string;
  updated_at: string;
}

export interface Assistant {
  id: string;
  name: string;
  description: string;
  mode: string;
  conversations: ConversationDisplay[];
  systemPrompt?: SystemPrompt;
  trainingDocuments?: TrainingDocument[];
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

export interface CareerStage {
  id: string;
  name: string;
  description: string;
  assistants: Assistant[];
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIAssistantProps {
  userId: string;
  initialStages?: CareerStage[];
  onStageChange?: (stage: CareerStage) => void;
  onAssistantChange?: (assistant: Assistant) => void;
  onConversationChange?: (conversation: Conversation) => void;
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
