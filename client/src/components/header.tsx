import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Search,
  X,
  AlignLeft,
  Image,
  FileAudio,
  Calendar,
  User,
  CalendarIcon,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Message, User as UserType } from '@shared/schema';
import { cn } from '@/lib/utils';
import { ConversationService } from '@/lib/services/conversations';
import { useUser } from '@/lib/context/user-context';
import {
  Popover as DatePopover,
  PopoverContent as DatePopoverContent,
  PopoverTrigger as DatePopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface MessageSearchProps {
  conversationId: number;
  onMessageFound: (messageId: number) => void;
}

type Filter = {
  type: 'date' | 'media' | 'sender' | 'text';
  value: string;
  label: string;
};

const conversationService = new ConversationService();

export default function MessageSearch({ conversationId, onMessageFound }: MessageSearchProps) {
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [isMediaOnly, setIsMediaOnly] = useState(false);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [senderFilter, setSenderFilter] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const { user } = useUser();
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get participants for sender filter using service
  const { data: participantsResponse } = useQuery({
    queryKey: ['conversation-participants', conversationId, user?.id],
    queryFn: async () => {
      if (!user?.id) return { participants: [] };
      return conversationService.getConversationParticipants(conversationId, user.id);
    },
    enabled: isAdvancedSearchOpen && !!user?.id,
  });
  
  const participants = participantsResponse?.participants || [];
  
  // Fetch search results using service
  const { data: searchResultsResponse, isLoading, refetch } = useQuery({
    queryKey: ['conversation-search', conversationId, user?.id, { query, filters: activeFilters }],
    queryFn: async () => {
      if (!user?.id || !query.trim()) return { messages: [] };
      return conversationService.searchMessages(conversationId, user.id, query.trim());
    },
    enabled: false,
  });
  
  const searchResults = searchResultsResponse?.messages || [];
  
  // Note: buildSearchQueryString removed - using service directly
  
  // Apply and execute the search
  const executeSearch = () => {
    if (!query && activeFilters.length === 0) return;
    
    setShowResults(true);
    refetch();
  };
  
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('email', data.session.user.email)
          .single();
        setUser(userProfile);
      }
    };
    
    getCurrentUser();
  }, []);
  const addFilter = (type: 'date' | 'media' | 'sender' | 'text', value: string, label: string) => {
    // Remove existing filter of same type if it exists
    const newFilters = activeFilters.filter(f => f.type !== type);
    
    // Add new filter
    setActiveFilters([...newFilters, { type, value, label }]);
  };
  
  // Remove a filter
  const removeFilter = (filterToRemove: Filter) => {
    setActiveFilters(activeFilters.filter(f => 
      !(f.type === filterToRemove.type && f.value === filterToRemove.value)
    ));
  };
  
  // Clear all filters and search query
  const clearSearch = () => {
    setQuery('');
    setActiveFilters([]);
    setShowResults(false);
    setIsMediaOnly(false);
    setMediaType(null);
    setDateFilter(undefined);
    setSenderFilter(null);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Apply advanced search configurations
  const applyAdvancedSearch = () => {
    // Set media filter
    if (isMediaOnly) {
      if (mediaType) {
        addFilter('media', mediaType, `Media: ${mediaType}`);
      } else {
        addFilter('media', 'any', 'Has media');
      }
    }
    
    // Set date filter
    if (dateFilter) {
      const dateStr = format(dateFilter, 'yyyy-MM-dd');
      addFilter('date', dateStr, `Date: ${format(dateFilter, 'PP')}`);
    }
    
    // Set sender filter
    if (senderFilter !== null && participants) {
      const sender = participants.find((p: UserType) => p.id === senderFilter);
      if (sender) {
        addFilter('sender', String(senderFilter), `From: ${sender.displayName || sender.username}`);
      }
    }
    
    setIsAdvancedSearchOpen(false);
    executeSearch();
  };
  
  // Navigate to a message when clicked
  const handleMessageClick = (messageId: number) => {
    onMessageFound(messageId);
    setShowResults(false);
  };
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out',
      });
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Error',
        description: 'Failed to log out',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div>
      {/* Search Input with Filters */}
      <div className="flex items-center space-x-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search messages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 pr-10"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                executeSearch();
              }
            }}
          />
          {(query || activeFilters.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-6 w-6 rounded-full p-0"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
        
        {/* Advanced Search Button */}
        <Popover open={isAdvancedSearchOpen} onOpenChange={setIsAdvancedSearchOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="px-3">
              <AlignLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <h4 className="font-medium">Search Filters</h4>
              
              <div className="space-y-2">
                <Label htmlFor="media-filter">Media Type</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="media-only" 
                    checked={isMediaOnly}
                    onCheckedChange={(checked) => setIsMediaOnly(!!checked)}
                  />
                  <Label htmlFor="media-only" className="text-sm font-normal">
                    Media only
                  </Label>
                </div>
                
                {isMediaOnly && (
                  <Select value={mediaType || ''} onValueChange={setMediaType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any media type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any media</SelectItem>
                      <SelectItem value="image">Images</SelectItem>
                      <SelectItem value="audio">Voice Messages</SelectItem>
                      <SelectItem value="video">Videos</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Date</Label>
                <DatePopover>
                  <DatePopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateFilter && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFilter ? format(dateFilter, 'PPP') : "Pick a date"}
                    </Button>
                  </DatePopoverTrigger>
                  <DatePopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dateFilter}
                      onSelect={setDateFilter}
                      initialFocus
                    />
                  </DatePopoverContent>
                </DatePopover>
              </div>
              
              <div className="space-y-2">
                <Label>From User</Label>
                <Select 
                  value={senderFilter?.toString() || ''} 
                  onValueChange={(val) => setSenderFilter(val ? parseInt(val) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any sender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any sender</SelectItem>
                    {participants?.map((participant: UserType) => (
                      <SelectItem key={participant.id} value={participant.id.toString()}>
                        {participant.displayName || participant.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAdvancedSearchOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={applyAdvancedSearch}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <Button onClick={executeSearch} disabled={!query && activeFilters.length === 0}>
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>
      </div>
      
      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {filter.label}
              <Button
                onClick={handleLogout}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove filter</span>
              </Button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setActiveFilters([])}>
            Clear filters
          </Button>
        </div>
      )}
      
      {/* Search Results */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search Results</DialogTitle>
            <DialogDescription>
              {isLoading ? 'Searching...' : searchResults?.length
                ? `Found ${searchResults.length} matching messages`
                : 'No matching messages found'
              }
            </DialogDescription>
          </DialogHeader>
          
          {searchResults?.length > 0 && (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {searchResults.map((message: Message) => (
                  <div
                    key={message.id}
                    className="border rounded-md p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => handleMessageClick(message.id)}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.timestamp), 'PPp')}
                      </span>
                      
                      {message.mediaType && (
                        <Badge variant="outline" className="text-xs">
                          {message.mediaType === 'image' && <Image className="h-3 w-3 mr-1" />}
                          {message.mediaType === 'audio' && <FileAudio className="h-3 w-3 mr-1" />}
                          {message.mediaType}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="line-clamp-2 text-sm">{message.content}</div>
                    
                    {message.mediaType === 'audio' && message.transcription && (
                      <div className="text-xs text-muted-foreground mt-1 italic">
                        Transcription: {message.transcription}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}