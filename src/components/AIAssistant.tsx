import React, { useState, useEffect, useRef } from "react";
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

// Import types, data, and utilities from modular files
import {
  Message,
  Conversation,
  Assistant,
  CareerStage,
  AIAssistantProps,
} from "./AIAssistant/types";
import { careerStages, initializeCareerStages } from "./AIAssistant/data";
import { getModeChangeMessage } from "./AIAssistant/utils";
import { generateOpenAIResponse } from "../services/openaiService";
import { processVoiceInput } from "../services/voiceService";
import MessageFormatter from "./AIAssistant/MessageFormatter";

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

import { supabase } from "@/lib/supabase";

const AIAssistant: React.FC<AIAssistantProps> = ({
  onRequestHumanSupport = () => { },
  wordCredits = { remaining: 1000, total: 1000 },
  onWordUsage = () => { },
  selectedCareerStage = "excelling",
  selectedAssistant = "performance-advisor",
  setSelectedAssistant = () => { },
}) => {
  const [stagesWithConversations, setStagesWithConversations] = useState(
    initializeCareerStages,
  );
  const [user, setUser] = useState<any>(null);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    getCurrentUser();
  }, []);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your AI HR assistant. How can I help you today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

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
      conversation: Conversation;
      messages: Message[];
      assistant: Assistant;
    }[]
  >([]);
  const [isRenaming, setIsRenaming] = useState(false);
  const [conversationToRename, setConversationToRename] =
    useState<Conversation | null>(null);
  const [newConversationName, setNewConversationName] = useState("");
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);
  const chatMainAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isRecording || isProcessingVoice) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue("");
    setIsTyping(false);

    // If no active conversation, create one
    if (!activeConversation) {
      await createNewConversation(selectedAssistant);
      return;
    }

    // Update the active conversation with the new message
    const updatedStages = [...stagesWithConversations];
    for (const stage of updatedStages) {
      for (const assistant of stage.assistants) {
        if (assistant.id === selectedAssistant) {
          const conversationIndex = assistant.conversations.findIndex(
            (conv) => conv.id === activeConversation.id,
          );

          if (conversationIndex >= 0) {
            assistant.conversations[conversationIndex].messages =
              updatedMessages;
            assistant.conversations[conversationIndex].lastUpdated = new Date();
            setStagesWithConversations(updatedStages);

            // Generate AI response using OpenAI
            setIsLoading(true);

            // Find the selected assistant to get the mode
            let assistantMode = "default";
            for (const stage of stagesWithConversations) {
              const assistant = stage.assistants.find(
                (a) => a.id === selectedAssistant,
              );
              if (assistant) {
                assistantMode = assistant.mode;
                break;
              }
            }

            // Save the message to Supabase first
            try {
              // Check if we need to create a conversation in the database
              if (
                activeConversation &&
                !activeConversation.id.includes("temp-")
              ) {
                // Add user message to existing conversation
                await supabase.from("messages").insert({
                  conversation_id: activeConversation.id,
                  content: inputValue,
                  sender: "user",
                  created_at: new Date().toISOString(),
                });

                // Update conversation last_updated timestamp
                await supabase
                  .from("conversations")
                  .update({ last_updated: new Date().toISOString() })
                  .eq("id", activeConversation.id);
              } else {
                // Create a new conversation in the database
                const { data: newConversation, error: convError } =
                  await supabase
                    .from("conversations")
                    .insert({
                      title: `New Conversation ${Date.now()}`,
                      assistant_id: selectedAssistant,
                      user_id: user?.id || "anonymous",
                      last_updated: new Date().toISOString(),
                    })
                    .select()
                    .single();

                if (convError) throw convError;

                // Add user message to the new conversation
                await supabase.from("messages").insert({
                  conversation_id: newConversation.id,
                  content: inputValue,
                  sender: "user",
                  created_at: new Date().toISOString(),
                });

                // Update the active conversation with the database ID
                if (activeConversation) {
                  const updatedStages = [...stagesWithConversations];
                  for (const stage of updatedStages) {
                    for (const assistant of stage.assistants) {
                      if (assistant.id === selectedAssistant) {
                        const convIndex = assistant.conversations.findIndex(
                          (conv) => conv.id === activeConversation.id,
                        );

                        if (convIndex >= 0) {
                          assistant.conversations[convIndex].id =
                            newConversation.id;
                        }
                      }
                    }
                  }
                  setStagesWithConversations(updatedStages);
                }
              }
            } catch (dbError) {
              console.error("Error saving message to database:", dbError);
              // Continue with OpenAI call even if database save fails
            }

            // Call OpenAI service
            generateOpenAIResponse(inputValue, assistantMode)
              .then(async (response) => {
                const aiResponse: Message = {
                  id: (Date.now() + 1).toString(),
                  content: response.content,
                  sender: "ai",
                  timestamp: new Date(),
                };

                // Calculate words used and update credits if callback provided
                if (onWordUsage) {
                  // Rough estimate: 1 token ≈ 0.75 words
                  const wordsUsed = Math.ceil(response.tokenCount * 0.75);
                  onWordUsage(wordsUsed);

                  // Update word credits in the database
                  try {
                    if (user) {
                      const { data: userData } = await supabase
                        .from("users")
                        .select("word_credits_remaining")
                        .eq("id", user.id)
                        .single();

                      if (userData) {
                        const newRemaining = Math.max(
                          0,
                          userData.word_credits_remaining - wordsUsed,
                        );
                        await supabase
                          .from("users")
                          .update({ word_credits_remaining: newRemaining })
                          .eq("id", user.id);
                      }
                    }
                  } catch (creditError) {
                    console.error("Error updating word credits:", creditError);
                  }
                }

                const finalMessages = [...updatedMessages, aiResponse];
                setMessages(finalMessages);

                // Save AI response to database
                try {
                  if (
                    activeConversation &&
                    !activeConversation.id.includes("temp-")
                  ) {
                    await supabase.from("messages").insert({
                      conversation_id: activeConversation.id,
                      content: response.content,
                      sender: "ai",
                      created_at: new Date().toISOString(),
                      token_count: response.tokenCount,
                    });
                  }
                } catch (dbError) {
                  console.error(
                    "Error saving AI response to database:",
                    dbError,
                  );
                }

                // Update conversation in state
                const finalStages = [...stagesWithConversations];
                for (const stage of finalStages) {
                  for (const assistant of stage.assistants) {
                    if (assistant.id === selectedAssistant) {
                      const convIndex = assistant.conversations.findIndex(
                        (conv) => conv.id === activeConversation.id,
                      );

                      if (convIndex >= 0) {
                        assistant.conversations[convIndex].messages =
                          finalMessages;
                        assistant.conversations[convIndex].lastUpdated =
                          new Date();
                        setStagesWithConversations(finalStages);
                      }
                    }
                  }
                }
              })
              .catch((error) => {
                console.error("Error generating AI response:", error);

                // Add error message
                const errorMessage: Message = {
                  id: (Date.now() + 1).toString(),
                  content:
                    "Sorry, I encountered an error while generating a response. Please try again later.",
                  sender: "ai",
                  timestamp: new Date(),
                };

                const finalMessages = [...updatedMessages, errorMessage];
                setMessages(finalMessages);

                // Update conversation with error message
                const finalStages = [...stagesWithConversations];
                for (const stage of finalStages) {
                  for (const assistant of stage.assistants) {
                    if (assistant.id === selectedAssistant) {
                      const convIndex = assistant.conversations.findIndex(
                        (conv) => conv.id === activeConversation.id,
                      );

                      if (convIndex >= 0) {
                        assistant.conversations[convIndex].messages =
                          finalMessages;
                        assistant.conversations[convIndex].lastUpdated =
                          new Date();
                        setStagesWithConversations(finalStages);
                      }
                    }
                  }
                }
              })
              .finally(() => {
                setIsLoading(false);
              });
          }
        }
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
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
    const userMessage: Message = {
      id: Date.now().toString(),
      content: "Processing voice message...",
      sender: "user",
      timestamp: new Date(),
      isVoice: true,
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
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response.text,
        sender: "ai",
        timestamp: new Date(),
        audioUrl: response.audioUrl,
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
                assistant.conversations[convIndex].lastUpdated = new Date();
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
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "Sorry, I encountered an error processing your voice message. Let's continue by text.",
        sender: "ai",
        timestamp: new Date(),
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

      const stageChangeMessage: Message = {
        id: Date.now().toString(),
        content: `I'm now focusing on "${stage.name}" stage. You can select a specific assistant for more targeted help.`,
        sender: "ai",
        timestamp: new Date(),
      };

      // Replace all messages with just the stage change message
      setMessages([stageChangeMessage]);

      // Reset the selected assistant to collapse all conversations
      setSelectedAssistant("");
      setActiveConversation(null);
    }
  }, [selectedCareerStage]);

  const handleAssistantChange = (assistantId: string) => {
    // If clicking the same assistant that's already selected, deselect it to collapse conversations
    if (selectedAssistant === assistantId) {
      setSelectedAssistant("");
      return;
    }

    // Use the prop setter from parent component
    setSelectedAssistant(assistantId);
    setActiveConversation(null);

    // Find the selected assistant
    let selectedAssistantObj: Assistant | undefined;
    for (const stage of stagesWithConversations) {
      const assistant = stage.assistants.find((a) => a.id === assistantId);
      if (assistant) {
        selectedAssistantObj = assistant;
        break;
      }
    }

    if (selectedAssistantObj) {
      // Clear previous messages and add a new system message when assistant changes
      const assistantChangeMessage: Message = {
        id: Date.now().toString(),
        content: getModeChangeMessage(selectedAssistantObj.mode),
        sender: "ai",
        timestamp: new Date(),
      };

      // Replace all messages with just the new assistant's welcome message
      setMessages([assistantChangeMessage]);
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setActiveConversation(conversation);
    setMessages(conversation.messages);
    // Clear search when selecting a conversation
    if (isSearching) {
      setIsSearching(false);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  // Fetch conversations from database
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user || !selectedAssistant) return;

      try {
        const { data, error } = await supabase
          .from("conversations")
          .select(
            `
            id,
            title,
            last_updated,
            messages:messages(id, content, sender, created_at)
          `,
          )
          .eq("user_id", user.id)
          .eq("assistant_id", selectedAssistant)
          .order("last_updated", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          // Transform data to match Conversation interface
          const conversations: Conversation[] = data.map((conv: any) => ({
            id: conv.id,
            title: conv.title,
            lastUpdated: new Date(conv.last_updated),
            messages: conv.messages.map((msg: any) => ({
              id: msg.id,
              content: msg.content,
              sender: msg.sender as "user" | "ai",
              timestamp: new Date(msg.created_at),
            })),
          }));

          // Update the stagesWithConversations state
          const updatedStages = [...stagesWithConversations];
          for (const stage of updatedStages) {
            for (const assistant of stage.assistants) {
              if (assistant.id === selectedAssistant) {
                assistant.conversations = conversations;
              }
            }
          }

          setStagesWithConversations(updatedStages);
        }
      } catch (err) {
        console.error("Error fetching conversations:", err);
      }
    };

    fetchConversations();
  }, [user, selectedAssistant]);

  const createNewConversation = async (assistantId: string) => {
    // Find the assistant
    let stageIndex = -1;
    let assistantIndex = -1;

    stagesWithConversations.forEach((stage, sIdx) => {
      stage.assistants.forEach((assistant, aIdx) => {
        if (assistant.id === assistantId) {
          stageIndex = sIdx;
          assistantIndex = aIdx;
        }
      });
    });

    if (stageIndex >= 0 && assistantIndex >= 0) {
      // Get the current conversations for this assistant to determine the next number
      const currentConversations =
        stagesWithConversations[stageIndex].assistants[assistantIndex]
          .conversations;

      // Find the highest number in existing "New Conversation {n}" titles
      let highestNumber = 0;
      currentConversations.forEach((conv) => {
        const match = conv.title.match(/New Conversation (\d+)/);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (num > highestNumber) {
            highestNumber = num;
          }
        }
      });

      // Create new conversation with incremented number
      const newConversation: Conversation = {
        id: `${assistantId}-conv-${Date.now()}`,
        title: `New Conversation ${highestNumber + 1}`,
        lastUpdated: new Date(),
        messages: [
          {
            id: Date.now().toString(),
            content: getModeChangeMessage(
              stagesWithConversations[stageIndex].assistants[assistantIndex]
                .mode,
            ),
            sender: "ai",
            timestamp: new Date(),
          },
        ],
      };

      // Create a deep copy of the state
      const updatedStages = [...stagesWithConversations];
      updatedStages[stageIndex].assistants[assistantIndex].conversations.push(
        newConversation,
      );

      setStagesWithConversations(updatedStages);
      setActiveConversation(newConversation);
      setMessages(newConversation.messages);
    }
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
      conversation: Conversation;
      messages: Message[];
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
              handleConversationSelect(assistant.conversations[0]);
            } else {
              // No conversations left, clear the active conversation
              setActiveConversation(null);
              setMessages([
                {
                  id: "1",
                  content:
                    "Hello! I'm your AI HR assistant. How can I help you today?",
                  sender: "ai",
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
                              handleConversationSelect(result.conversation)
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
                                  className={`flex items-center p-2 rounded-md cursor-pointer ${selectedAssistant === assistant.id ? "bg-accent" : "hover:bg-muted"}`}
                                  onClick={() =>
                                    handleAssistantChange(assistant.id)
                                  }
                                >
                                  <Avatar className="h-6 w-6 mr-2">
                                    <AvatarImage
                                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=${assistant.id}`}
                                    />
                                    <AvatarFallback>
                                      <Bot className="h-4 w-4" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-sm">
                                    {assistant.name}
                                  </span>
                                </div>

                                {selectedAssistant === assistant.id && (
                                  <div className="pl-8 space-y-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start text-xs gap-1 h-8 px-2"
                                      onClick={() => {
                                        createNewConversation(assistant.id);
                                      }}
                                    >
                                      <Plus className="h-3 w-3" />
                                      New Conversation
                                    </Button>

                                    <Separator className="my-2" />

                                    {assistant.conversations.map(
                                      (conversation) => (
                                        <div
                                          key={conversation.id}
                                          className={`flex items-center justify-between p-1 rounded-md cursor-pointer text-xs ${activeConversation?.id === conversation.id ? "bg-muted" : "hover:bg-muted/50"}`}
                                        >
                                          <div
                                            className="flex items-center flex-1 overflow-hidden"
                                            onClick={() =>
                                              handleConversationSelect(
                                                conversation,
                                              )
                                            }
                                          >
                                            <MessageSquare className="h-3 w-3 mr-2 text-muted-foreground flex-shrink-0" />
                                            <div className="overflow-hidden">
                                              <p className="truncate">
                                                {conversation.title}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                {conversation.lastUpdated.toLocaleDateString()}
                                              </p>
                                            </div>
                                          </div>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 p-0 ml-1"
                                                onClick={(e) =>
                                                  e.stopPropagation()
                                                }
                                              >
                                                <MoreVertical className="h-3 w-3" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                              align="end"
                                              className="w-40"
                                            >
                                              <DropdownMenuItem
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setConversationToRename(
                                                    conversation,
                                                  );
                                                  setNewConversationName(
                                                    conversation.title,
                                                  );
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
                                                    conversation.id,
                                                  );
                                                }}
                                              >
                                                <Trash2 className="h-3 w-3 mr-2" />
                                                Delete
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      ),
                                    )}
                                  </div>
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
        className={`flex-1 flex flex-col h-full overflow-hidden ${isMobileFullscreen ? "fixed inset-0 z-[1000] bg-background w-full" : ""}`}
        id="chat-main-area"
      >
        <div className="p-2 md:p-4 border-b flex justify-between items-center relative">
          {isMobileFullscreen && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={disableMobileFullscreen}
              id="minimize-chat-button"
              aria-label="Minimize chat"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="md:flex"
            >
              {showSidebar ? (
                <PanelRightClose className="h-5 w-5" />
              ) : (
                <PanelRightOpen className="h-5 w-5" />
              )}
            </Button>
            <h2 className="text-lg md:text-xl font-semibold ml-2 truncate">
              AI HR Assistant
            </h2>
          </div>

          <div className="flex items-center">
            {activeConversation ? (
              <div className="text-xs md:text-sm font-medium truncate max-w-[150px] md:max-w-[250px]">
                {getFilteredStages().map((stage) =>
                  stage.assistants.map((assistant) =>
                    assistant.conversations.find(
                      (conv) => conv.id === activeConversation?.id,
                    ) ? (
                      <span key={assistant.id}>
                        {assistant.name} - {activeConversation.title}
                      </span>
                    ) : null,
                  ),
                )}
              </div>
            ) : (
              <div className="text-xs md:text-sm font-medium truncate max-w-[150px] md:max-w-[250px]">
                {getFilteredStages().map((stage) =>
                  stage.assistants.find((a) => a.id === selectedAssistant) ? (
                    <span key={stage.id}>
                      {
                        stage.assistants.find((a) => a.id === selectedAssistant)
                          ?.name
                      }
                    </span>
                  ) : null,
                )}
              </div>
            )}
          </div>

          {/* Tabs removed as they're redundant with the career stages in the sidebar */}
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-2 md:p-4" id="chat-messages-area">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex ${message.sender === "user" ? "flex-row-reverse" : "flex-row"} items-start gap-2 max-w-[90%] md:max-w-[80%]`}
                >
                  <Avatar
                    className={
                      message.sender === "user" ? "bg-primary" : "bg-secondary"
                    }
                  >
                    {message.sender === "user" ? (
                      <>
                        <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </>
                    ) : (
                      <>
                        <AvatarImage src="https://api.dicebear.com/7.x/bottts/svg?seed=assistant" />
                        <AvatarFallback>
                          <Bot className="h-5 w-5" />
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div
                    className={`rounded-lg p-2 md:p-3 ${message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  >
                    {message.sender === "ai" ? (
                      <>
                        <MessageFormatter content={message.content} />
                        {message.audioUrl && (
                          <div className="flex items-center mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-6"
                              onClick={() => {
                                if (audioRef.current) {
                                  audioRef.current.src = message.audioUrl || "";
                                  audioRef.current.play();
                                  setIsPlaying(true);
                                  setAudioUrl(message.audioUrl || null);
                                }
                              }}
                            >
                              <Volume2 className="h-3 w-3 mr-1" />
                              <span className="text-xs">Play audio</span>
                            </Button>
                          </div>
                        )}
                        {message.moderation?.flagged && (
                          <div className="flex items-center mt-2 bg-red-50 p-2 rounded text-red-600 text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            <span>
                              Content flagged:{" "}
                              {message.moderation.categories?.join(", ") ||
                                "Policy violation"}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-sm md:text-base">
                          {message.content}
                        </p>
                        {message.isVoice && (
                          <div className="flex items-center mt-1 bg-blue-50 p-1 rounded text-blue-600 text-xs">
                            <Mic className="h-3 w-3 mr-1" />
                            <span>Voice message</span>
                          </div>
                        )}
                      </>
                    )}
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-2 md:p-4 border-t">
          {/* Hidden audio element for playing responses */}
          <audio
            ref={audioRef}
            onEnded={() => setIsPlaying(false)}
            style={{ display: "none" }}
          />

          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex flex-1 gap-2">
              <Input
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  // Set typing state when user starts typing
                  setIsTyping(e.target.value.length > 0);
                }}
                onKeyDown={(e) => {
                  handleKeyPress(e);
                  // Clear typing state if input is empty after pressing backspace
                  if (e.key === "Backspace" && inputValue.length <= 1) {
                    setIsTyping(false);
                  }
                }}
                onFocus={() => {
                  // Set typing state when input is focused with content
                  if (inputValue.length > 0) {
                    setIsTyping(true);
                  }
                  // Enable mobile fullscreen mode
                  enableMobileFullscreen();
                }}
                onBlur={() => {
                  // Keep typing state true only if there's content
                  setIsTyping(inputValue.length > 0);

                  // Don't disable fullscreen immediately to allow clicking other elements in the chat area
                  setTimeout(() => {
                    const activeElement = document.activeElement;
                    // Only exit fullscreen if focus moved outside the chat area and not to another input in the chat
                    if (
                      !activeElement?.closest("#chat-main-area") ||
                      activeElement?.id === "minimize-chat-button"
                    ) {
                      disableMobileFullscreen();
                    }
                  }, 100);
                }}
                placeholder={
                  isRecording
                    ? "Recording voice..."
                    : isProcessingVoice
                      ? "Processing voice..."
                      : "Type your message here..."
                }
                className={`flex-1 text-sm md:text-base ${isRecording ? "border-red-400" : isProcessingVoice ? "border-amber-400" : isTyping ? "border-blue-400" : ""}`}
                disabled={isLoading || isRecording || isProcessingVoice}
              />

              <div className="flex gap-1">
                {audioUrl && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={toggleAudioPlayback}
                          disabled={
                            isLoading || isRecording || isProcessingVoice
                          }
                          className="h-10 w-10 md:h-10 md:w-10"
                          onFocus={enableMobileFullscreen}
                        >
                          {isPlaying ? (
                            <VolumeX className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isPlaying ? "Stop audio" : "Play last response"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleRecording}
                        className={
                          isRecording
                            ? "bg-red-100 text-red-500 h-10 w-10 md:h-10 md:w-10"
                            : isTyping || inputValue.trim().length > 0
                              ? "opacity-50 h-10 w-10 md:h-10 md:w-10"
                              : "h-10 w-10 md:h-10 md:w-10"
                        }
                        disabled={
                          isLoading ||
                          isProcessingVoice ||
                          isTyping ||
                          inputValue.trim().length > 0
                        }
                        onFocus={enableMobileFullscreen}
                      >
                        {isRecording ? (
                          <MicOff className="h-4 w-4" />
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {isRecording
                          ? "Stop recording"
                          : "Start voice recording"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button
                  onClick={handleSendMessage}
                  disabled={
                    isLoading ||
                    isRecording ||
                    isProcessingVoice ||
                    (!inputValue.trim() && !isTyping)
                  }
                  className="h-10 md:h-10"
                  onFocus={enableMobileFullscreen}
                >
                  {isLoading || isProcessingVoice ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      <span className="hidden md:inline">
                        {isProcessingVoice ? "Processing..." : "Thinking..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">Send</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-0">
            <div className="flex flex-col">
              <p className="text-xs md:text-sm text-muted-foreground">
                {(() => {
                  // Find the selected assistant
                  for (const stage of stagesWithConversations) {
                    const assistant = stage.assistants.find(
                      (a) => a.id === selectedAssistant,
                    );
                    if (assistant) {
                      return assistant.description;
                    }
                  }
                  return "Ask me anything about HR or your career";
                })()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Word Credits: {wordCredits.remaining}/{wordCredits.total}{" "}
                remaining this month
              </p>
            </div>

            <Button
              variant="link"
              onClick={onRequestHumanSupport}
              className="text-xs md:text-sm px-0 md:px-2"
            >
              Need human support?{" "}
              <ArrowRight className="h-3 w-3 md:h-4 md:w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get system prompt based on mode
function getSystemPromptForMode(mode: string): string {
  switch (mode) {
    case "resume-coach":
      return "You are an expert resume coach. Help the user create or optimize their resume for job applications and ATS systems. Provide specific, actionable advice tailored to their industry and experience level.";
    case "negotiation-advisor":
      return "You are an expert negotiation advisor. Provide strategic guidance on negotiating job offers, compensation packages, and benefits. Help the user understand their leverage points and how to professionally advocate for themselves.";
    case "interview-practice":
      return "You are an expert interview coach. Help the user prepare for job interviews with practice questions, feedback, and strategies tailored to their industry and the specific role they're applying for.";
    case "performance-advisor":
      return "You are a performance improvement advisor. Help the user enhance their workplace performance and prepare for reviews. Provide actionable strategies for professional development and career advancement.";
    case "benefits-advisor":
      return "You are a benefits advisor. Help the user understand and optimize their employee benefits package. Provide guidance on health insurance, retirement plans, and other workplace benefits.";
    default:
      return "You are an AI HR assistant. Provide helpful, professional advice on career and workplace topics. Be concise, specific, and actionable in your responses.";
  }
}

export default AIAssistant;
