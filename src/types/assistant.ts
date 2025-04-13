// Database types
export interface DBConversation {
  id: string;
  user_id: string;
  assistant_id: string;
  title: string;
  created_at: string;
  last_updated: string;
  messages?: DBMessage[];
}

export interface DBMessage {
  id: string;
  conversation_id: string;
  content: string;
  sender: string;
  created_at: string;
  isVoice?: boolean;
  audio_url?: string;
  token_count?: number;
  moderation?: {
    flagged: boolean;
    categories?: string[];
    score?: number;
  };
}

// Display types (for UI)
export interface DisplayConversation {
  id: string;
  title: string;
  lastUpdated: Date;
  messages: {
    id: string;
    content: string;
    sender: string;
    timestamp: Date;
  }[];
}

export interface MessageDisplay {
  id: string;
  content: string;
  sender: string;
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

export interface ConversationDisplay {
  id: string;
  title: string;
  lastUpdated: Date;
  messages: Array<{
    id: string;
    content: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
    is_voice?: boolean;
    audio_url?: string;
    token_count?: number;
  }>;
}

// Conversion functions
export const toConversationDisplay = (conversation: DBConversation): ConversationDisplay => ({
  id: conversation.id,
  title: conversation.title,
  lastUpdated: new Date(conversation.last_updated),
  messages: conversation.messages?.map(msg => ({
    id: msg.id,
    content: msg.content,
    sender: msg.sender === 'ai' ? 'assistant' : 'user',
    timestamp: new Date(msg.created_at),
    is_voice: msg.isVoice,
    audio_url: msg.audio_url,
    token_count: msg.token_count
  })) || []
});

export const toMessageDisplay = (message: DBMessage): MessageDisplay => ({
  id: message.id,
  content: message.content,
  sender: message.sender,
  timestamp: message.timestamp || new Date(message.created_at),
  isVoice: message.isVoice,
  audio_url: message.audio_url,
  token_count: message.token_count,
  moderation: message.moderation
});

// Assistant types
export interface Assistant {
  id: string;
  name: string;
  description: string;
  mode: string;
  conversations: Array<{
    id: string;
    title: string;
    lastUpdated: Date;
    messages: Array<{
      id: string;
      content: string;
      sender: 'user' | 'assistant';
      timestamp: Date;
    }>;
  }>;
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssistantWithActive extends Assistant {
  isActive: boolean;
}

export interface Conversation {
  id: string;
  user_id: string;
  assistant_id: string;
  title: string;
  created_at: Date;
  last_updated: Date;
}

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  sender: string;
  created_at: string;
  timestamp?: Date;
  isVoice?: boolean;
  audio_url?: string;
  token_count?: number;
  moderation?: {
    flagged: boolean;
    categories?: string[];
    score?: number;
  };
} 