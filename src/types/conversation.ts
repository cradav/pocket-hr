import { Message, MessageDisplay } from './message';

export interface Conversation {
  id: string;
  user_id: string;
  assistant_id: string;
  title: string;
  created_at: string;
  last_updated: string;
}

// For internal use after fetching from DB
export interface ConversationWithDate {
  id: string;
  user_id: string;
  assistant_id: string;
  title: string;
  created_at: Date;
  last_updated: Date;
}

// For display in the UI
export interface DisplayConversation {
  id: string;
  user_id: string;
  assistant_id: string;
  title: string;
  created_at: Date;
  last_updated: Date;
  messages: MessageDisplay[];
  isActive?: boolean;
}

// Helper function to convert string dates to Date objects
export const toConversationWithDate = (conversation: Conversation): ConversationWithDate => ({
  ...conversation,
  created_at: new Date(conversation.created_at),
  last_updated: new Date(conversation.last_updated)
});

// Helper function to convert to display format
export const toDisplayConversation = (conversation: Conversation | ConversationWithDate, messages: MessageDisplay[] = [], isActive: boolean = false): DisplayConversation => ({
  ...conversation,
  created_at: conversation.created_at instanceof Date ? conversation.created_at : new Date(conversation.created_at),
  last_updated: conversation.last_updated instanceof Date ? conversation.last_updated : new Date(conversation.last_updated),
  messages,
  isActive
});

export interface DBConversation extends Conversation {
  messages?: Message[];
} 