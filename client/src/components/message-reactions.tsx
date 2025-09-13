import React, { useState, useEffect } from 'react';
import { User } from "@shared/schema";
import { conversationService } from "@/lib/services/conversations";
import { useWebSocket } from "@/lib/context/websocket-context";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Common emoji reactions
const EMOJI_OPTIONS = ["👍", "👎", "❤️", "😂", "😮", "😢", "🎉", "🤔"];

interface MessageReactionsProps {
  messageId: number;
  conversationId: number;
  currentUserId: number;
  onReactionAdded?: (messageId: number, emoji: string) => void;
  onReactionRemoved?: (messageId: number, emoji: string) => void;
}

interface ReactionItem {
  emoji: string;
  count: number;
  users: User[];
}

export default function MessageReactions({ 
  messageId,
  conversationId,
  currentUserId,
  onReactionAdded,
  onReactionRemoved
}: MessageReactionsProps) {
  const [reactions, setReactions] = useState<ReactionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Fetch reactions on mount
  useEffect(() => {
    const fetchReactions = async () => {
      try {
        setLoading(true);
        const { reactions, error } = await conversationService.getMessageReactions(messageId, currentUserId);
        
        if (error) {
          throw new Error(error);
        }
        
        // Transform reactions to the expected format
        const reactionMap = new Map<string, ReactionItem>();
        
        reactions.forEach(reaction => {
          if (!reactionMap.has(reaction.emoji)) {
            reactionMap.set(reaction.emoji, {
              emoji: reaction.emoji,
              count: 0,
              users: []
            });
          }
          
          const item = reactionMap.get(reaction.emoji)!;
          item.count++;
          item.users.push({
            id: reaction.userId,
            username: reaction.username,
            displayName: reaction.displayName,
          } as User);
        });
        
        setReactions(Array.from(reactionMap.values()));
      } catch (error) {
        console.error('Error fetching reactions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReactions();
  }, [messageId]);
  
  // Get WebSocket context
  const { connected, sendMessage: sendWebSocketMessage } = useWebSocket();
  
  // Add reaction
  const addReaction = async (emoji: string) => {
    try {
      // Try to use WebSocket first for real-time updates
      if (connected) {
        sendWebSocketMessage({
          type: 'add_reaction',
          messageId,
          emoji
        });
      }
      
      // Always make API call for persistence
      const { error } = await conversationService.addReaction(messageId, currentUserId, emoji);
      
      if (error) {
        throw new Error(error);
      }
      
      // Trigger callback
      onReactionAdded?.(messageId, emoji);
      
      // Add to local state temporarily until WebSocket update arrives
      const userReaction = reactions.find(r => r.emoji === emoji);
      
      if (userReaction) {
        // Check if user already reacted with this emoji
        if (!userReaction.users.some(u => u.id === currentUserId)) {
          setReactions(prev => prev.map(r => 
            r.emoji === emoji 
              ? { 
                  ...r, 
                  count: r.count + 1,
                  users: [...r.users, { id: currentUserId } as User]
                } 
              : r
          ));
        }
      } else {
        // Add new reaction
        setReactions(prev => [...prev, {
          emoji,
          count: 1,
          users: [{ id: currentUserId } as User]
        }]);
      }
      
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast({
        title: 'Error',
        description: 'Could not add reaction',
        variant: 'destructive'
      });
    }
  };
  
  // Remove reaction
  const removeReaction = async (emoji: string) => {
    try {
      // Try to use WebSocket first for real-time updates
      if (connected) {
        sendWebSocketMessage({
          type: 'remove_reaction',
          messageId,
          emoji
        });
      }
      
      // Always make API call for persistence
      const { error } = await conversationService.removeReaction(messageId, currentUserId, emoji);
      
      if (error) {
        throw new Error(error);
      }
      
      // Trigger callback
      onReactionRemoved?.(messageId, emoji);
      
      // Update local state temporarily until WebSocket update arrives
      setReactions(prev => {
        const updated = prev.map(r => {
          if (r.emoji === emoji) {
            return {
              ...r,
              count: r.count - 1,
              users: r.users.filter(u => u.id !== currentUserId)
            };
          }
          return r;
        });
        
        // Remove reactions with count 0
        return updated.filter(r => r.count > 0);
      });
      
    } catch (error) {
      console.error('Error removing reaction:', error);
      toast({
        title: 'Error',
        description: 'Could not remove reaction',
        variant: 'destructive'
      });
    }
  };
  
  // Check if the current user has reacted with a specific emoji
  const hasUserReacted = (emoji: string) => {
    const reaction = reactions.find(r => r.emoji === emoji);
    return reaction ? reaction.users.some(u => u.id === currentUserId) : false;
  };
  
  // Toggle reaction
  const toggleReaction = (emoji: string) => {
    if (hasUserReacted(emoji)) {
      removeReaction(emoji);
    } else {
      addReaction(emoji);
    }
  };
  
  return (
    <div className="flex items-center space-x-1 mt-1">
      {/* Display existing reactions */}
      {reactions.map(reaction => (
        <TooltipProvider key={reaction.emoji}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant={hasUserReacted(reaction.emoji) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/90 transition-colors"
                onClick={() => toggleReaction(reaction.emoji)}
              >
                <span className="mr-1">{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex flex-col space-y-1">
                {reaction.users.slice(0, 3).map(user => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{user.displayName}</span>
                  </div>
                ))}
                {reaction.users.length > 3 && (
                  <span className="text-xs text-center">{`+${reaction.users.length - 3} more`}</span>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      
      {/* Add reaction button */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
            <span className="text-lg">+</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex flex-wrap gap-1">
            {EMOJI_OPTIONS.map(emoji => (
              <Button 
                key={emoji} 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => toggleReaction(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}