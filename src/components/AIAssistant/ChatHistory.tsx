import React, { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, ChevronDown } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';

interface ChatHistoryProps {
  assistantId: string;
  userId: string;
  onConversationSelect: (conversationId: string) => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  assistantId,
  userId,
  onConversationSelect,
}) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          last_updated,
          messages!inner (
            content,
            created_at
          )
        `)
        .eq('user_id', userId)
        .eq('assistant_id', assistantId)
        .order('last_updated', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (error) throw error;

      if (data) {
        // If we got less results than PAGE_SIZE, there are no more results
        setHasMore(data.length === PAGE_SIZE);
        
        if (page === 0) {
          setConversations(data);
        } else {
          setConversations(prev => [...prev, ...data]);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [assistantId, userId, page]);

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  return (
    <ScrollArea className="h-[500px] w-full pr-4">
      <div className="space-y-4">
        {conversations.map((conversation) => (
          <Card
            key={conversation.id}
            className="cursor-pointer hover:bg-accent"
            onClick={() => onConversationSelect(conversation.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <h4 className="text-sm font-medium leading-none">
                      {conversation.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(conversation.last_updated), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {hasMore && (
          <div className="flex justify-center py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={loadMore}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                "Loading..."
              ) : (
                <>
                  Load More
                  <ChevronDown className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}; 