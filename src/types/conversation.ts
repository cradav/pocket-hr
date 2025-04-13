import { MessageDisplay, Message, toMessageDisplay } from './message';

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

// Helper function to convert string dates to Date objects
export const toConversationWithDate = (conversation: Conversation): ConversationWithDate => ({
  ...conversation,
  created_at: new Date(conversation.created_at),
  last_updated: new Date(conversation.last_updated)
});

export interface DisplayConversation extends Conversation {
  isActive: boolean;
  messages: MessageDisplay[];
}

export interface DBConversation extends Conversation {
  messages?: Message[];
}

export function toDisplayConversation(conversation: DBConversation, isActive: boolean = false): DisplayConversation {
  return {
    ...conversation,
    isActive,
    messages: conversation.messages?.map(toMessageDisplay) || []
  };
} 