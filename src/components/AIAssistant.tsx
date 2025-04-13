import React, { useState, useEffect, useRef, FC, FormEvent, KeyboardEvent, MouseEvent } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Mic,
  MicOff,
  User,
  Bot,
  Volume2,
  VolumeX,
  HelpCircle,
  BookOpen,
  BriefcaseBusiness,
  ArrowRight,
  PanelRightClose,
  PanelRightOpen,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Plus,
  AlertTriangle,
  Search,
  X,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import types from the correct location
import {
  DBMessage,
  DBConversation,
  ConversationDisplay,
  toConversationDisplay,
  Assistant,
  AssistantWithActive
} from '../types/assistant';
import { careerStages, initializeCareerStages } from "./AIAssistant/data";
import { getModeChangeMessage } from "./AIAssistant/utils";
import { generateOpenAIResponse } from "../services/openaiService";
import { processVoiceInput } from "../services/voiceService";
import MessageFormatter from "./AIAssistant/MessageFormatter";
import { ChatHistory } from './AIAssistant/ChatHistory';
import { v4 as uuidv4 } from 'uuid';
import { Message, MessageDisplay, MessageWithDate, toMessageDisplay, toMessageWithDate } from '../types/message';
import { Conversation, ConversationWithDate, toConversationWithDate } from '../types/conversation';
import { Assistant as NewAssistant } from '../types/assistant';

interface VoiceResponse {
  audioUrl: string;
  text: string;
  tokenCount: number;
  moderation?: {
    flagged: boolean;
    categories?: string[];
    score?: number;
  };
}

import { supabase } from "@/lib/supabaseClient";

interface AIAssistantProps {
  userId: string;
  initialStages: any[];
  onStageChange?: (stage: any) => void;
  onAssistantChange?: (assistant: any) => void;
  onConversationChange?: (conversation: DBConversation) => void;
}

interface ExtendedAIAssistantProps extends AIAssistantProps {
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

interface LocalConversation {
  id: string;
  title: string;
  lastUpdated: Date;
  messages: MessageDisplay[];
}

// Define interfaces locally to avoid conflicts
interface Message {
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

const AIAssistant: FC<ExtendedAIAssistantProps> = ({
  userId,
  initialStages,
  onStageChange,
  onAssistantChange,
  onConversationChange,
  onRequestHumanSupport,
  wordCredits,
  onWordUsage,
  selectedCareerStage,
  selectedAssistant,
  setSelectedAssistant,
}) => {
  const [stagesWithConversations, setStagesWithConversations] = useState(
    initializeCareerStages,
  );
  const [user, setUser] = useState<any>(null);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      }
    };

    getCurrentUser();
  }, []);
  const [activeConversation, setActiveConversation] = useState<DBConversation | null>(null);
  const [displayConversation, setDisplayConversation] = useState<ConversationDisplay | null>(null);
  const [messages, setMessages] = useState<DBMessage[]>([
    {
      id: "1",
      conversation_id: "",
      content: "Hello! I'm your AI HR assistant. How can I help you today?",
      sender: "assistant",
      created_at: new Date().toISOString()
    }
  ]);
  const [displayMessages, setDisplayMessages] = useState<MessageDisplay[]>([
    {
      id: "1",
      content: "Hello! I'm your AI HR assistant. How can I help you today?",
      sender: "assistant",
      created_at: new Date(),
      is_voice: false
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<
    {
      conversation: DBConversation;
      messages: DBMessage[];
      assistant: Assistant;
    }[]
  >([]);
  const [isRenaming, setIsRenaming] = useState(false);
  const [conversationToRename, setConversationToRename] =
    useState<DBConversation | null>(null);
  const [newConversationName, setNewConversationName] = useState("");
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);
  const chatMainAreaRef = useRef<HTMLDivElement>(null);

  // Update display messages whenever messages change
  useEffect(() => {
    setDisplayMessages(messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      sender: msg.sender === 'ai' ? 'assistant' : 'user',
      created_at: new Date(msg.created_at),
      timestamp: new Date(msg.created_at),
      is_voice: msg.isVoice || false,
      audio_url: msg.audio_url,
      token_count: msg.token_count
    })));
  }, [messages]);

  // Update display conversation whenever active conversation changes
  useEffect(() => {
    if (activeConversation) {
      const displayConv: ConversationDisplay = {
        id: activeConversation.id,
        title: activeConversation.title,
        lastUpdated: new Date(activeConversation.last_updated),
        last_updated: activeConversation.last_updated,
        messages: activeConversation.messages?.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender as "ai" | "user",
          timestamp: new Date(msg.created_at),
          is_voice: msg.isVoice,
          audio_url: msg.audio_url,
          token_count: msg.token_count
        })) || []
      };
      setDisplayConversation(displayConv);
    } else {
      setDisplayConversation(null);
    }
  }, [activeConversation]);

  // Update conversation loading effect
  useEffect(() => {
    const fetchConversations = async () => {
      // Só busca conversas se tiver um usuário E um assistente selecionado
      if (!userId || !selectedAssistant) {
        // Limpa as conversas se não tiver assistente selecionado
        setStagesWithConversations(prev => {
          const updated = [...prev];
          updated.forEach(stage => {
            stage.assistants.forEach(assistant => {
              assistant.conversations = [];
            });
          });
          return updated;
        });
        return;
      }

      try {
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select(`
            *,
            messages (
              id,
              content,
              sender,
              created_at,
              is_voice,
              audio_url,
              token_count,
              moderation
            )
          `)
          .eq('user_id', userId)
          .eq('assistant_id', selectedAssistant)
          .order('last_updated', { ascending: false });

        if (conversationsError) throw conversationsError;

        // Update the conversations in the UI
        const updatedStages = [...stagesWithConversations];
        for (const stage of updatedStages) {
          for (const assistant of stage.assistants) {
            if (assistant.id === selectedAssistant) {
              assistant.conversations = conversationsData?.map(conv => ({
                id: conv.id,
                title: conv.title,
                lastUpdated: new Date(conv.last_updated),
                messages: conv.messages?.map(msg => ({
                  id: msg.id,
                  content: msg.content,
                  sender: msg.sender,
                  timestamp: new Date(msg.created_at),
                  is_voice: msg.is_voice || false,
                  audio_url: msg.audio_url,
                  token_count: msg.token_count
                })) || []
              })) || [];
            } else {
              // Limpa as conversas dos outros assistentes
              assistant.conversations = [];
            }
          }
        }

        setStagesWithConversations(updatedStages);

      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    fetchConversations();
  }, [userId, selectedAssistant]);

  // Update handleConversationSelect to properly load messages
  const handleConversationSelect = async (conversationId: string) => {
    try {
      // Fetch the selected conversation and its messages
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (conversationError) throw conversationError;

      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      if (conversationData && messagesData) {
        const conversation: DBConversation = {
          ...conversationData,
          messages: messagesData
        };

        setActiveConversation(conversation);
        setMessages(messagesData);
        
        // Update display messages
        setDisplayMessages(messagesData.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender === 'ai' ? 'assistant' : 'user',
          created_at: new Date(msg.created_at),
          timestamp: new Date(msg.created_at),
          is_voice: msg.is_voice || false,
          audio_url: msg.audio_url,
          token_count: msg.token_count
        })));

        onConversationChange?.(conversation);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const updateConversationInList = (
    conversations: DisplayConversation[],
    updatedConv: DBConversation
  ): DisplayConversation[] => {
    const displayConv = toConversationDisplay(updatedConv);
    const index = conversations.findIndex(c => c.id === displayConv.id);
    
    if (index >= 0) {
      return [
        ...conversations.slice(0, index),
        displayConv,
        ...conversations.slice(index + 1)
      ];
    }
    return [displayConv, ...conversations];
  };

  const handleSendMessage = async (e: FormEvent | KeyboardEvent | MouseEvent) => {
    e.preventDefault();
    if (!userId || !selectedAssistant || !inputValue.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      let currentConversation = activeConversation;

      // Create new conversation if needed
      if (!currentConversation) {
        const newConversation: Conversation = {
          id: uuidv4(), // Generate UUID for new conversation
          user_id: userId,
          assistant_id: selectedAssistant,
          title: inputValue.substring(0, 50), // Use first 50 chars as title
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        };

        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert(newConversation)
          .select()
          .single();

        if (convError) throw convError;
        currentConversation = newConv;
        setActiveConversation(newConv);
      }

      // Store user message
      const userMessage = {
        conversation_id: currentConversation.id,
        content: inputValue,
        sender: 'user',
        created_at: new Date().toISOString()
      };

      const { data: userMsg, error: msgError } = await supabase
        .from('messages')
        .insert(userMessage)
        .select()
        .single();

      if (msgError) throw msgError;

      // Update UI state
      const updatedMessages = [...(messages || []), userMsg];
      setMessages(updatedMessages);
      setDisplayMessages(updatedMessages.map(toMessageDisplay));
      setInputValue('');

      // Generate AI response
      const response = await generateOpenAIResponse(inputValue, findAssistantById(selectedAssistant)?.mode || 'default');
      
      // Store AI message
      const aiMessage = {
        conversation_id: currentConversation.id,
        content: response.content,
        sender: 'ai',
        created_at: new Date().toISOString()
      };

      const { data: aiMsg, error: aiError } = await supabase
        .from('messages')
        .insert(aiMessage)
        .select()
        .single();

      if (aiError) throw aiError;

      // Update conversation last_updated
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ last_updated: new Date().toISOString() })
        .eq('id', currentConversation.id);

      if (updateError) throw updateError;

      // Final UI update with AI response
      const finalMessages = [...updatedMessages, aiMsg];
      setMessages(finalMessages);
      setDisplayMessages(finalMessages.map(toMessageDisplay));

      // Update conversations list
      const updatedStages = [...stagesWithConversations];
      for (const stage of updatedStages) {
        for (const assistant of stage.assistants) {
          if (assistant.id === selectedAssistant) {
            const existingConvIndex = assistant.conversations.findIndex(c => c.id === currentConversation.id);
            const updatedConv = {
              id: currentConversation.id,
              title: currentConversation.title,
              lastUpdated: new Date(),
              messages: finalMessages.map(msg => ({
                id: msg.id,
                content: msg.content,
                sender: msg.sender,
                timestamp: new Date(msg.created_at)
              }))
            };

            if (existingConvIndex >= 0) {
              assistant.conversations[existingConvIndex] = updatedConv;
            } else {
              assistant.conversations.unshift(updatedConv);
            }
          }
        }
      }
      setStagesWithConversations(updatedStages);

      // Calculate words used and update credits if callback provided
      if (onWordUsage) {
        const wordsUsed = Math.ceil(response.tokenCount * 0.75);
        onWordUsage(wordsUsed);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage(e);
    }
  };

  const startRecording = async () => {
    // Don't start recording if already typing or sending a message
    if (isTyping || inputValue.trim().length > 0) {
      alert(
        "Please finish typing your message before starting voice recording.",
      );
      return;
    }

    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        processVoiceMessage(audioBlob);
      };

      mediaRecorder.start(500); // Collect data in 500ms chunks
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // Stop all tracks on the stream
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      // Only allow starting recording if not currently typing or processing
      if (
        !isLoading &&
        !isProcessingVoice &&
        !isTyping &&
        inputValue.trim().length === 0
      ) {
        startRecording();
      } else if (inputValue.trim().length > 0) {
        alert("Please clear the text input before starting voice recording.");
      }
    }
  };

  const processVoiceMessage = async (audioBlob: Blob) => {
    // Clear any text in the input field when starting voice processing
    setInputValue("");

    // Add a user message placeholder
    const userMessage: DBMessage = {
      id: Date.now().toString(),
      conversation_id: activeConversation?.id || '',
      content: "Processing voice message...",
      sender: "user",
      created_at: new Date().toISOString(),
      isVoice: true
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessingVoice(true);

    try {
      // If no active conversation, create one
      if (!activeConversation) {
        createNewConversation(selectedAssistant);
      }

      // Find the selected assistant to get the mode
      let assistantMode = "default";
      let selectedAssistantObj: any = null;

      for (const stage of stagesWithConversations) {
        const assistant = stage.assistants.find(
          (a) => a.id === selectedAssistant,
        );
        if (assistant) {
          assistantMode = assistant.mode;
          selectedAssistantObj = assistant;
          break;
        }
      }

      // Process voice input
      const sessionConfig = {
        conversationId: activeConversation?.id || `temp-${Date.now()}`,
        userId: "current-user", // This should be replaced with actual user ID
        voice: "alloy", // Default voice
        systemPrompt:
          getSystemPromptForMode(assistantMode) +
          " Respond conversationally as this will be spoken aloud.",
      };

      // Get user token from session if available
      const userToken = localStorage.getItem("userToken") || undefined;

      const response = await processVoiceInput(
        audioBlob,
        sessionConfig,
        assistantMode,
        userToken,
      );

      // Update the user message with transcribed text
      const updatedMessages = [...messages];
      const userMessageIndex = updatedMessages.findIndex(
        (m) => m.id === userMessage.id,
      );

      if (userMessageIndex >= 0) {
        updatedMessages[userMessageIndex].content = response.text
          .split("(tone:")[0]
          .trim(); // Remove tone annotation
      }

      // Add AI response
      const aiResponse: DBMessage = {
        id: (Date.now() + 1).toString(),
        conversation_id: activeConversation?.id || '',
        content: response.text,
        sender: "ai",
        created_at: new Date().toISOString(),
        audio_url: response.audioUrl,
        moderation: response.moderation,
      };

      const finalMessages = [...updatedMessages, aiResponse];
      setMessages(finalMessages);
      setAudioUrl(response.audioUrl);

      // Calculate words used and update credits if callback provided
      if (onWordUsage) {
        const wordsUsed = Math.ceil(response.tokenCount * 0.75);
        onWordUsage(wordsUsed);
      }

      // Update conversation in state
      if (activeConversation) {
        const updatedStages = [...stagesWithConversations];
        for (const stage of updatedStages) {
          for (const assistant of stage.assistants) {
            if (assistant.id === selectedAssistant) {
              const convIndex = assistant.conversations.findIndex(
                (conv) => conv.id === activeConversation.id,
              );

              if (convIndex >= 0) {
                assistant.conversations[convIndex].messages = finalMessages;
                assistant.conversations[convIndex].last_updated = new Date().toISOString();
                setStagesWithConversations(updatedStages);
              }
            }
          }
        }
      }

      // Auto-play the response
      if (audioRef.current && response.audioUrl) {
        audioRef.current.src = response.audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error processing voice message:", error);

      // Add error message
      const errorMessage: DBMessage = {
        id: (Date.now() + 1).toString(),
        conversation_id: activeConversation?.id || '',
        content: "Sorry, I encountered an error processing your voice message. Let's continue by text.",
        sender: "ai",
        created_at: new Date().toISOString()
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const toggleAudioPlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Get filtered stages and assistants based on user preferences
  const getFilteredStages = () => {
    // Get visibility preferences from localStorage
    let visibilityPreferences: Record<string, boolean> = {};
    try {
      const storedPreferences = localStorage.getItem("aiCategoryVisibility");
      if (storedPreferences) {
        visibilityPreferences = JSON.parse(storedPreferences);
      }
    } catch (error) {
      console.error("Error parsing visibility preferences:", error);
    }

    // If no preferences are set, return all stages
    if (Object.keys(visibilityPreferences).length === 0) {
      return stagesWithConversations;
    }

    // Filter stages based on visibility preferences
    return stagesWithConversations.filter((stage) => {
      // Check if stage is visible
      const stageKey = `stage-${stage.id}`;
      if (visibilityPreferences[stageKey] === false) {
        return false;
      }

      // Filter assistants within the stage
      const filteredAssistants = stage.assistants.filter((assistant) => {
        const assistantKey = `assistant-${assistant.id}`;
        return visibilityPreferences[assistantKey] !== false;
      });

      // Update stage with filtered assistants
      stage.assistants = filteredAssistants;

      // Only include stages that have at least one visible assistant
      return filteredAssistants.length > 0;
    });
  };

  // Career stage changes are now handled by the Sidebar component
  // This effect handles updates when the selectedCareerStage prop changes
  useEffect(() => {
    // Find the selected stage
    const filteredStages = getFilteredStages();
    const stage = filteredStages.find((stage) => stage.id === selectedCareerStage);

    if (stage) {

      const stageChangeMessage: DBMessage = {
        id: Date.now().toString(),
        content: `I'm now focusing on "${stage.name}" stage. You can select a specific assistant for more targeted help.`,
        sender: "ai",
        created_at: new Date().toISOString(),
      };

      // Replace all messages with just the stage change message
      setMessages([stageChangeMessage]);

      // Reset the selected assistant to collapse all conversations
      setSelectedAssistant("");
      setActiveConversation(null);
    }
  }, [selectedCareerStage]);

  // Find the assistant object to get the mode for the welcome message
  const findAssistantById = (assistantId: string) => {
    for (const stage of careerStages) {
      const assistant = stage.assistants.find(a => a.id === assistantId);
      if (assistant) return assistant;
    }
    return null;
  };

  const handleAssistantChange = async (assistantId: string) => {
    // If clicking the same assistant that's already selected, deselect it
    if (selectedAssistant === assistantId) {
      setSelectedAssistant("");
      setActiveConversation(null);
      setMessages([]);
      return;
    }

    // Set the selected assistant ID
    setSelectedAssistant(assistantId);
    setActiveConversation(null);

    try {
      // Fetch conversations for this assistant using the UUID
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (
            id,
            content,
            sender,
            created_at,
            is_voice,
            audio_url,
            token_count,
            moderation
          )
        `)
        .eq('user_id', userId)
        .eq('assistant_id', assistantId)
        .order('last_updated', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Update the conversations in the UI
      const updatedStages = [...stagesWithConversations];
      for (const stage of updatedStages) {
        for (const assistant of stage.assistants) {
          if (assistant.id === assistantId) {
            assistant.conversations = conversationsData?.map(conv => ({
              id: conv.id,
              title: conv.title,
              lastUpdated: new Date(conv.last_updated),
              messages: conv.messages?.map(msg => ({
                id: msg.id,
                content: msg.content,
                sender: msg.sender,
                timestamp: new Date(msg.created_at),
                is_voice: msg.is_voice || false,
                audio_url: msg.audio_url,
                token_count: msg.token_count
              })) || []
            })) || [];
          }
        }
      }

      setStagesWithConversations(updatedStages);

      // Find the assistant object to get the mode for the welcome message
      const assistantObj = findAssistantById(assistantId);
      const mode = assistantObj?.mode || 'default';

      // Show welcome message for the selected assistant
      const welcomeMessage: DBMessage = {
        id: uuidv4(),
        conversation_id: "",
        content: getModeChangeMessage(mode),
        sender: "ai",
        created_at: new Date().toISOString()
      };

      setMessages([welcomeMessage]);
      setDisplayMessages([toMessageDisplay(welcomeMessage)]);

    } catch (error) {
      console.error('Error loading conversations:', error);
      // Show error message but keep the assistant selected
      const errorMessage: DBMessage = {
        id: uuidv4(),
        conversation_id: "",
        content: "Sorry, I encountered an error loading the conversations. You can still start a new chat.",
        sender: "ai",
        created_at: new Date().toISOString()
      };
      setMessages([errorMessage]);
      setDisplayMessages([toMessageDisplay(errorMessage)]);
    }
  };

  const createNewConversation = (assistantId: string) => {
    const timestamp = new Date();
    const conversationId = uuidv4();
    
    // Find the assistant mode
    const assistantObj = findAssistantById(assistantId);
    const mode = assistantObj?.mode || 'default';
    
    const newMessage: DBMessage = {
      id: uuidv4(),
      conversation_id: conversationId,
      content: getModeChangeMessage(mode),
      sender: "ai",
      created_at: timestamp.toISOString()
    };

    const newConversation: Conversation = {
      id: uuidv4(),
      user_id: userId,
      assistant_id: assistantId,
      title: 'New Conversation',
      created_at: new Date(),
      last_updated: new Date()
    };

    // Update state
    setActiveConversation(newConversation);
    setMessages([newMessage]);
    
    // Update display messages
    setDisplayMessages([{
      id: newMessage.id,
      content: newMessage.content,
      sender: newMessage.sender,
      timestamp: new Date(newMessage.created_at)
    }]);
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const results: {
      conversation: DBConversation;
      messages: DBMessage[];
      assistant: Assistant;
    }[] = [];

    // Search through all conversations and messages
    stagesWithConversations.forEach((stage) => {
      stage.assistants.forEach((assistant) => {
        assistant.conversations.forEach((conversation) => {
          // Find messages that match the search query
          const matchingMessages = conversation.messages.filter((message) =>
            message.content.toLowerCase().includes(searchQuery.toLowerCase()),
          );

          if (matchingMessages.length > 0) {
            results.push({
              conversation,
              messages: matchingMessages,
              assistant,
            });
          }
        });
      });
    });

    setSearchResults(results);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setSearchResults([]);
  };

  const handleRenameConversation = async () => {
    if (!conversationToRename || !newConversationName.trim()) return;

    const updatedStages = [...stagesWithConversations];
    for (const stage of updatedStages) {
      for (const assistant of stage.assistants) {
        const conversationIndex = assistant.conversations.findIndex(
          (conv) => conv.id === conversationToRename.id,
        );

        if (conversationIndex >= 0) {
          assistant.conversations[conversationIndex].title =
            newConversationName.trim();
          setStagesWithConversations(updatedStages);

          // If this was the active conversation, update it
          if (activeConversation?.id === conversationToRename.id) {
            const updatedConversation = {
              ...activeConversation,
              title: newConversationName.trim(),
            };
            setActiveConversation(updatedConversation);
          }

          // Update conversation title in database if it's a persisted conversation
          if (!conversationToRename.id.includes("temp-")) {
            try {
              await supabase
                .from("conversations")
                .update({ title: newConversationName.trim() })
                .eq("id", conversationToRename.id);
            } catch (error) {
              console.error("Error updating conversation title:", error);
            }
          }

          break;
        }
      }
    }

    // Reset renaming state
    setIsRenaming(false);
    setConversationToRename(null);
    setNewConversationName("");
  };

  const handleDeleteConversation = async (
    assistantId: string,
    conversationId: string,
  ) => {
    const updatedStages = [...stagesWithConversations];
    let deletedActiveConversation = false;

    // Find and remove the conversation
    for (const stage of updatedStages) {
      for (const assistant of stage.assistants) {
        if (assistant.id === assistantId) {
          const conversationIndex = assistant.conversations.findIndex(
            (conv) => conv.id === conversationId,
          );

          if (conversationIndex >= 0) {
            // Check if we're deleting the active conversation
            if (activeConversation?.id === conversationId) {
              deletedActiveConversation = true;
            }

            // Delete conversation from database if it's a persisted conversation
            if (!conversationId.includes("temp-")) {
              try {
                // First delete all messages associated with this conversation
                await supabase
                  .from("messages")
                  .delete()
                  .eq("conversation_id", conversationId);

                // Then delete the conversation itself
                await supabase
                  .from("conversations")
                  .delete()
                  .eq("id", conversationId);
              } catch (error) {
                console.error("Error deleting conversation:", error);
              }
            }

            // Remove the conversation from state
            assistant.conversations.splice(conversationIndex, 1);
            break;
          }
        }
      }
    }

    setStagesWithConversations(updatedStages);

    // If we deleted the active conversation, select another one or clear
    if (deletedActiveConversation) {
      // Find the assistant that had the deleted conversation
      for (const stage of updatedStages) {
        for (const assistant of stage.assistants) {
          if (assistant.id === assistantId) {
            if (assistant.conversations.length > 0) {
              // Select the first available conversation
              handleConversationSelect(assistant.conversations[0].id);
            } else {
              // No conversations left, clear the active conversation
              setActiveConversation(null);
              setMessages([
                {
                  id: "1",
                  conversation_id: "",
                  content: "Hello! I'm your AI HR assistant. How can I help you today?",
                  sender: "ai",
                  created_at: new Date().toISOString(),
                  timestamp: new Date(),
                },
              ]);
            }
            break;
          }
        }
      }
    }
  };

  // Function to enable mobile fullscreen mode
  const enableMobileFullscreen = () => {
    if (window.innerWidth < 768) {
      setIsMobileFullscreen(true);
      if (chatMainAreaRef.current) {
        chatMainAreaRef.current.style.position = "fixed";
        chatMainAreaRef.current.style.top = "0";
        chatMainAreaRef.current.style.left = "0";
        chatMainAreaRef.current.style.right = "0";
        chatMainAreaRef.current.style.bottom = "0";
        chatMainAreaRef.current.style.zIndex = "1000";
        chatMainAreaRef.current.style.backgroundColor = "var(--background)";
        chatMainAreaRef.current.style.width = "100%";
      }
      // Prevent scrolling on the body when in fullscreen mode
      document.body.style.overflow = "hidden";
    }
  };

  // Function to disable mobile fullscreen mode
  const disableMobileFullscreen = () => {
    setIsMobileFullscreen(false);
    if (chatMainAreaRef.current) {
      chatMainAreaRef.current.style.position = "";
      chatMainAreaRef.current.style.top = "";
      chatMainAreaRef.current.style.left = "";
      chatMainAreaRef.current.style.right = "";
      chatMainAreaRef.current.style.bottom = "";
      chatMainAreaRef.current.style.zIndex = "";
      chatMainAreaRef.current.style.width = "";
      chatMainAreaRef.current.style.backgroundColor = "";

      // Blur any active element to ensure keyboard is dismissed on mobile
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
    // Restore scrolling on the body
    document.body.style.overflow = "";
  };

  // Clean up body overflow style when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Update message mapping to ensure all required fields
  const mapMessageToDisplay = (message: DBMessage): MessageDisplay => ({
    id: message.id,
    content: message.content,
    sender: message.sender === 'ai' ? 'assistant' : 'user',
    created_at: new Date(message.created_at),
    is_voice: message.isVoice || false,
    audio_url: message.audio_url
  });

  const mapDisplayToMessage = (message: MessageDisplay, conversationId: string): DBMessage => ({
    id: message.id,
    conversation_id: conversationId,
    content: message.content,
    sender: message.sender,
    created_at: message.timestamp.toISOString(),
    timestamp: message.timestamp,
    isVoice: message.is_voice,
    audio_url: message.audio_url,
    token_count: message.token_count,
    moderation: message.moderation
  });

  // Update conversation state
  const updateConversationState = (conversation: ConversationDisplay) => {
    setDisplayConversation({
      ...conversation,
      lastUpdated: new Date(),
      last_updated: new Date().toISOString(),
      messages: conversation.messages.map(msg => mapMessageToDisplay({
        ...msg,
        conversation_id: conversation.id,
        created_at: msg.timestamp.toISOString()
      } as DBMessage))
    });
  };

  // Helper function for system prompt
  const getSystemPromptForMode = (mode: string) => {
    // Add your system prompt logic here
    return `You are now in ${mode} mode. How can I help you?`;
  };

  const handleVoiceResponse = (response: VoiceResponse) => {
    const moderation = response.moderation ? {
      flagged: response.moderation.flagged,
      categories: response.moderation.categories || [],
      score: response.moderation.score
    } : undefined;

    const message: DBMessage = {
      id: uuidv4(),
      conversation_id: activeConversation.id,
      content: response.text,
      sender: 'user',
      created_at: new Date().toISOString(),
      timestamp: new Date(),
      isVoice: true,
      audio_url: response.audioUrl,
      token_count: response.tokenCount,
      moderation
    };

    // ... existing code ...
  };

  const getModeChangeMessage = (mode: string) => {
    switch (mode) {
      // Landing the role
      case 'resume':
        return "I'm now in Resume Coach mode. I can help you create, optimize, and tailor your resume for specific job applications and ATS systems.";
      case 'negotiation':
        return "I'm now in Negotiation Advisor mode. I can help you prepare for salary discussions, benefits negotiations, and develop effective negotiation strategies.";
      case 'interview':
        return "I'm now in Interview Practice mode. I can help you prepare for interviews with practice questions, feedback, and strategies for different interview types.";
      
      // Excel at work
      case 'performance':
        return "I'm now in Performance Improvement mode. I can help you enhance your work performance, set goals, and develop strategies for career growth.";
      case 'onboarding':
        return "I'm now in Onboarding Assistant mode. I can help you navigate your new role, understand company policies, and integrate effectively into your workplace.";
      case 'benefits':
        return "I'm now in Benefits Advisor mode. I can help you understand your workplace benefits, make informed decisions, and optimize your benefits package.";
      
      // Moving On
      case 'transition':
        return "I'm now in Transition Coach mode. I can help you plan your career transition, identify new opportunities, and develop strategies for professional growth.";
      case 'reference':
        return "I'm now in Reference Builder mode. I can help you identify and approach potential references, prepare reference documentation, and manage professional relationships.";
      case 'exit':
        return "I'm now in Exit Strategy mode. I can help you plan a professional departure, prepare handover documentation, and maintain positive relationships.";
      
      default:
        return "How can I help you today?";
    }
  };

  return (
    <div className="flex h-full w-full bg-background flex-col md:flex-row relative">
      {/* Rename Dialog */}
      {isRenaming && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-4 w-80 shadow-lg">
            <h3 className="text-lg font-medium mb-4">Rename Conversation</h3>
            <Input
              value={newConversationName}
              onChange={(e) => setNewConversationName(e.target.value)}
              placeholder="Enter new name"
              className="mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRenameConversation();
                } else if (e.key === "Escape") {
                  setIsRenaming(false);
                  setConversationToRename(null);
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRenaming(false);
                  setConversationToRename(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleRenameConversation}>Save</Button>
            </div>
          </div>
        </div>
      )}
      {/* Assistants & Conversations Panel */}
      {showSidebar && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "100%", maxWidth: "350px", opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          className="border-r border-border h-full md:h-full w-full md:w-[350px] max-h-[300px] md:max-h-full overflow-auto md:overflow-visible"
        >
          <Card className="h-full rounded-none border-0">
            <CardHeader className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base md:text-lg">
                    AI HR Assistants
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Select an assistant to chat with
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={toggleSidebar}
                >
                  <PanelRightClose className="h-5 w-5" />
                </Button>
              </div>
              <div className="relative mt-2">
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    } else if (e.key === "Escape") {
                      clearSearch();
                    }
                  }}
                  className="pr-8 text-sm"
                />
                {searchQuery ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={clearSearch}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={handleSearch}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-2 md:p-4">
              <ScrollArea className="h-[calc(100vh-250px)] md:h-[calc(100vh-250px)]">
                {isSearching ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">
                      Search Results ({searchResults.length})
                    </h3>
                    {searchResults.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No results found for "{searchQuery}"
                      </p>
                    ) : (
                      searchResults.map((result, index) => (
                        <div
                          key={index}
                          className="space-y-2 border-b pb-4 mb-4"
                        >
                          <div
                            className="flex items-center p-2 rounded-md cursor-pointer bg-accent"
                            onClick={() =>
                              handleConversationSelect(result.conversation.id)
                            }
                          >
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage
                                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${result.assistant.id}`}
                              />
                              <AvatarFallback>
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-medium text-sm">
                                {result.assistant.name}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                {result.conversation.title} -{" "}
                                {result.messages.length} matches
                              </p>
                            </div>
                          </div>
                          <div className="pl-8 space-y-2 max-h-32 overflow-y-auto">
                            {result.messages.slice(0, 2).map((message) => (
                              <div
                                key={message.id}
                                className="text-xs p-2 bg-muted rounded-md"
                              >
                                <p className="font-medium">
                                  {message.sender === "user" ? "You" : "AI"}:
                                </p>
                                <p className="truncate">
                                  {message.content.length > 100
                                    ? `${message.content.substring(0, 100)}...`
                                    : message.content}
                                </p>
                              </div>
                            ))}
                            {result.messages.length > 2 && (
                              <p className="text-xs text-muted-foreground">
                                + {result.messages.length - 2} more matches
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSearch}
                      className="w-full mt-2"
                    >
                      Clear Search
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Display only the assistants for the selected career stage */}
                    {getFilteredStages()
                      .filter((stage) => stage.id === selectedCareerStage)
                      .map((stage) => (
                        <div key={stage.id} className="space-y-4">
                          <h3 className="text-sm font-medium">
                            {stage.name} Assistants
                          </h3>
                          <div className="pl-2 space-y-4">
                            {stage.assistants.map((assistant) => (
                              <div key={assistant.id} className="space-y-2">
                                <div
                                  className={`flex items-center p-2 rounded-md cursor-pointer ${
                                    selectedAssistant === assistant.id ? "bg-accent" : "hover:bg-muted"
                                  }`}
                                  onClick={() => handleAssistantChange(assistant.id)}
                                >
                                  <Avatar className="h-6 w-6 mr-2">
                                    <AvatarImage
                                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=${assistant.id}`}
                                    />
                                    <AvatarFallback>
                                      <Bot className="h-4 w-4" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <span className="font-medium text-sm">
                                      {assistant.name}
                                    </span>
                                    <p className="text-xs text-muted-foreground">
                                      {assistant.description}
                                    </p>
                                  </div>
                                  {selectedAssistant === assistant.id && (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </div>

                                {selectedAssistant === assistant.id && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="pl-8 space-y-2"
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start text-xs gap-1 h-8 px-2"
                                      onClick={() => createNewConversation(assistant.id)}
                                    >
                                      <Plus className="h-3 w-3" />
                                      New Conversation
                                    </Button>

                                    <Separator className="my-2" />

                                    {assistant.conversations.length > 0 ? (
                                      assistant.conversations.map((conversation) => (
                                        <div
                                          key={conversation.id}
                                          className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer"
                                          onClick={() => handleConversationSelect(conversation.id)}
                                        >
                                          <div className="flex-1">
                                            <p className="text-sm font-medium">{conversation.title}</p>
                                            <p className="text-xs text-gray-500">
                                              {new Date(conversation.lastUpdated).toLocaleDateString()}
                                            </p>
                                          </div>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 p-0 ml-1"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <MoreVertical className="h-3 w-3" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                              <DropdownMenuItem
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setConversationToRename(conversation);
                                                  setNewConversationName(conversation.title);
                                                  setIsRenaming(true);
                                                }}
                                              >
                                                <Edit className="h-3 w-3 mr-2" />
                                                Rename
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteConversation(
                                                    assistant.id,
                                                    conversation.id
                                                  );
                                                }}
                                              >
                                                <Trash2 className="h-3 w-3 mr-2" />
                                                Delete
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-xs text-muted-foreground text-center py-2">
                                        No conversations yet
                                      </p>
                                    )}
                                  </motion.div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Chat Area */}
      <div
        ref={chatMainAreaRef}
        className="flex-1 flex flex-col h-full overflow-hidden"
        id="chat-main-area"
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleSidebar}
            >
              {showSidebar ? (
                <PanelRightClose className="h-5 w-5" />
              ) : (
                <PanelRightOpen className="h-5 w-5" />
              )}
            </Button>
            <h2 className="text-xl font-semibold">
              {selectedAssistant ? findAssistantById(selectedAssistant)?.name : 'AI HR Assistant'}
            </h2>
          </div>
          {selectedAssistant && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{findAssistantById(selectedAssistant)?.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {displayMessages.map((message) => (
              <div key={message.id} className="flex items-start gap-3">
                {message.sender === "ai" && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${selectedAssistant}`} />
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`rounded-lg p-4 ${
                  message.sender === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
                }`}>
                  <MessageFormatter content={message.content} />
                  {message.token_count && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Words used: {Math.ceil(message.token_count * 0.75)}
                    </div>
                  )}
                </div>
                {message.sender === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Input Area with Word Credits */}
        <div className="p-4 border-t">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
              >
                Send
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleRecording}
                disabled={isLoading || isProcessingVoice}
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4 text-red-500" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Word Credits Display */}
            {wordCredits && (
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <div>
                  Word Credits: {wordCredits.remaining}/{wordCredits.total} remaining this month
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRequestHumanSupport}
                  className="text-xs"
                >
                  Need human support? →
                </Button>
              </div>
            )}
          </div>
          <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
