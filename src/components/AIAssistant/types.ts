import { DisplayConversation } from '../../types/conversation';

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  sender: 'assistant' | 'user';
  token_count?: number;
  audio_url?: string;
  created_at: string;
  timestamp?: Date;
  isVoice?: boolean;
}

export interface MessageDisplay {
  id: string;
  content: string;
  sender: 'assistant' | 'user';
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
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssistantWithConversations extends Assistant {
  conversations: DisplayConversation[];
}

export interface CareerStage {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  created_at: string;
  updated_at: string;
  assistants: Assistant[];
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

export interface DBMessage {
  id: string;
  conversation_id: string;
  content: string;
  sender: "assistant" | "user";
  created_at: string;
  isVoice?: boolean;
  audio_url?: string;
  token_count?: number;
  moderation?: {
    flagged: boolean;
    categories: Record<string, boolean>;
    scores: Record<string, number>;
  };
}
