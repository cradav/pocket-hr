import { supabase } from "@/lib/supabase";
import {
  CareerStage,
  Assistant,
  Conversation,
  Message,
} from "@/components/AIAssistant/types";

// User related functions
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    console.error("Error getting current user:", error);
    return null;
  }
  return user;
}

export async function getUserProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return data;
}

// Career stages and assistants functions
export async function getCareerStages(): Promise<CareerStage[]> {
  const { data, error } = await supabase
    .from("career_stages")
    .select(
      `
      id,
      name,
      description,
      is_active,
      created_at,
      updated_at,
      assistants:assistants(id, name, description, mode, is_active, created_at, updated_at)
    `,
    )
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Error fetching career stages:", error);
    return [];
  }

  // Transform the data to match the expected format
  return data.map((stage) => ({
    id: stage.id,
    name: stage.name,
    description: stage.description || "",
    assistants: stage.assistants.map((assistant) => ({
      id: assistant.id,
      name: assistant.name,
      description: assistant.description,
      mode: assistant.mode,
      isActive: assistant.is_active,
      createdAt: new Date(assistant.created_at),
      lastUpdated: new Date(assistant.updated_at),
      conversations: [],
    })),
    isActive: stage.is_active,
    createdAt: new Date(stage.created_at),
    lastUpdated: new Date(stage.updated_at),
  }));
}

export async function getAssistantSystemPrompt(assistantId: string) {
  const { data, error } = await supabase
    .from("system_prompts")
    .select("content")
    .eq("assistant_id", assistantId)
    .single();

  if (error) {
    console.error("Error fetching system prompt:", error);
    return null;
  }

  return data.content;
}

// Conversations and messages functions
export async function getConversations(
  assistantId: string,
): Promise<Conversation[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("conversations")
    .select(
      `
      id,
      title,
      updated_at,
      messages:messages(id, content, sender, created_at)
    `,
    )
    .eq("user_id", user.id)
    .eq("assistant_id", assistantId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }

  return data.map((conv) => ({
    id: conv.id,
    title: conv.title,
    lastUpdated: new Date(conv.updated_at),
    messages: conv.messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      sender: msg.sender as "user" | "ai",
      timestamp: new Date(msg.created_at),
    })),
  }));
}

export async function createConversation(
  assistantId: string,
  title: string,
  initialMessage: string,
): Promise<Conversation | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Start a transaction
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert({
      user_id: user.id,
      assistant_id: assistantId,
      title: title,
    })
    .select()
    .single();

  if (convError) {
    console.error("Error creating conversation:", convError);
    return null;
  }

  // Add the initial AI message
  const { data: message, error: msgError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversation.id,
      content: initialMessage,
      sender: "ai",
    })
    .select()
    .single();

  if (msgError) {
    console.error("Error adding initial message:", msgError);
    return null;
  }

  return {
    id: conversation.id,
    title: conversation.title,
    lastUpdated: new Date(conversation.updated_at),
    messages: [
      {
        id: message.id,
        content: message.content,
        sender: "ai",
        timestamp: new Date(message.created_at),
      },
    ],
  };
}

export async function addMessageToConversation(
  conversationId: string,
  content: string,
  sender: "user" | "ai",
): Promise<Message | null> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      content: content,
      sender: sender,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding message:", error);
    return null;
  }

  // Update the conversation's updated_at timestamp
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return {
    id: data.id,
    content: data.content,
    sender: data.sender as "user" | "ai",
    timestamp: new Date(data.created_at),
  };
}

// Plan features functions
export async function getPlanFeatures(planId: string) {
  const { data, error } = await supabase
    .from("plan_features")
    .select("name, included, feature_limit")
    .eq("plan_id", planId);

  if (error) {
    console.error("Error fetching plan features:", error);
    return [];
  }

  return data;
}

// Word credits functions
export async function updateWordCredits(wordsUsed: number) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  // Get current word credits
  const { data: userData, error: fetchError } = await supabase
    .from("users")
    .select("word_credits_remaining")
    .eq("id", user.id)
    .single();

  if (fetchError) {
    console.error("Error fetching word credits:", fetchError);
    return false;
  }

  // Calculate new remaining credits
  const newRemaining = Math.max(0, userData.word_credits_remaining - wordsUsed);

  // Update the user's word credits
  const { error: updateError } = await supabase
    .from("users")
    .update({ word_credits_remaining: newRemaining })
    .eq("id", user.id);

  if (updateError) {
    console.error("Error updating word credits:", updateError);
    return false;
  }

  return true;
}

export async function getWordCredits() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { remaining: 0, total: 0 };

  const { data, error } = await supabase
    .from("users")
    .select("word_credits_remaining, word_credits_total")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching word credits:", error);
    return { remaining: 0, total: 0 };
  }

  return {
    remaining: data.word_credits_remaining,
    total: data.word_credits_total,
  };
}

// Document management functions
export async function uploadDocument(
  file: File,
  name: string,
  description: string,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Upload file to storage
  const filePath = `documents/${user.id}/${Date.now()}_${file.name}`;
  const { data: fileData, error: uploadError } = await supabase.storage
    .from("user-documents")
    .upload(filePath, file);

  if (uploadError) {
    console.error("Error uploading document:", uploadError);
    return null;
  }

  // Get the public URL
  const { data: urlData } = await supabase.storage
    .from("user-documents")
    .getPublicUrl(filePath);

  // Create document record in the database
  const { data, error } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      name: name,
      description: description,
      file_url: urlData.publicUrl,
      file_type: file.type,
      size: file.size,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating document record:", error);
    return null;
  }

  return data;
}

export async function getUserDocuments() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching documents:", error);
    return [];
  }

  return data;
}

// Support session functions
export async function scheduleSupportSession(
  type: string,
  scheduledAt: Date,
  notes: string,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("support_sessions")
    .insert({
      user_id: user.id,
      type: type,
      scheduled_at: scheduledAt.toISOString(),
      notes: notes,
    })
    .select()
    .single();

  if (error) {
    console.error("Error scheduling support session:", error);
    return null;
  }

  return data;
}

export async function getUserSupportSessions() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("support_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error("Error fetching support sessions:", error);
    return [];
  }

  return data;
}
