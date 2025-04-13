export interface MessageModeration {
  flagged: boolean;
  categories: Record<string, boolean>;
  scores: Record<string, number>;
}

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  sender: "assistant" | "user";
  created_at: string;
  timestamp: string;
  is_voice?: boolean;
  audio_url?: string;
  token_count?: number;
  moderation?: MessageModeration;
}

// For internal use after fetching from DB
export interface MessageWithDate {
  id: string;
  conversation_id: string;
  content: string;
  sender: "assistant" | "user";
  created_at: Date;
  timestamp: Date;
  is_voice?: boolean;
  audio_url?: string;
  token_count?: number;
  moderation?: MessageModeration;
}

// For display in the UI
export interface MessageDisplay {
  id: string;
  content: string;
  sender: "assistant" | "user";
  timestamp: Date;
  is_voice?: boolean;
  audio_url?: string;
  token_count?: number;
  moderation?: MessageModeration;
}

// Database message type
export interface DBMessage extends Message {
  // Inherits all fields from Message
  // Can add DB-specific fields here if needed
}

// Helper functions
export function toMessageWithDate(msg: Message): MessageWithDate {
  return {
    ...msg,
    created_at: new Date(msg.created_at),
    timestamp: new Date(msg.timestamp)
  };
}

export function toMessageDisplay(msg: Message | MessageWithDate): MessageDisplay {
  return {
    id: msg.id,
    content: msg.content,
    sender: msg.sender,
    timestamp: 'timestamp' in msg && msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
    is_voice: msg.is_voice,
    audio_url: msg.audio_url,
    token_count: msg.token_count,
    moderation: msg.moderation
  };
}

export interface VoiceResponse {
  text: string;
  audio_url: string;
  token_count: number;
  moderation?: MessageModeration;
} 