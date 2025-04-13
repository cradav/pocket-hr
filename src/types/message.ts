export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  sender: 'user' | 'assistant';
  created_at: string;
  token_count?: number;
  is_voice?: boolean;
  audio_url?: string;
  moderation?: {
    flagged: boolean;
    categories: Record<string, boolean>;
    scores: Record<string, number>;
  };
}

// For internal use after fetching from DB
export interface MessageWithDate {
  id: string;
  conversation_id: string;
  content: string;
  sender: 'user' | 'assistant';
  created_at: Date;
  token_count?: number;
  is_voice?: boolean;
  audio_url?: string;
  moderation?: {
    flagged: boolean;
    categories: Record<string, boolean>;
    scores: Record<string, number>;
  };
}

// Simplified version for display purposes
export interface MessageDisplay {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp?: Date;  // Added for backward compatibility
  created_at: Date;
  is_voice?: boolean;
  audio_url?: string;
  token_count?: number;  // Added for existing usage
}

// Helper functions to convert between types
export const toMessageWithDate = (message: Message): MessageWithDate => ({
  ...message,
  created_at: new Date(message.created_at)
});

export const toMessageDisplay = (message: Message | MessageWithDate): MessageDisplay => ({
  id: message.id,
  content: message.content,
  sender: message.sender,
  created_at: message.created_at instanceof Date ? message.created_at : new Date(message.created_at),
  is_voice: message.is_voice,
  audio_url: message.audio_url
}); 