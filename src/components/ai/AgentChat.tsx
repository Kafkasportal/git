/**
 * AI Agent Chat Component
 *
 * Full-featured agent interface with:
 * - Thread management
 * - Multi-agent support
 * - Tool execution visualization
 * - Usage tracking
 * - Message search
 */

'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import logger from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Send, Bot, User, TrendingUp, Archive, Search, Wrench } from 'lucide-react';

interface AgentChatProps {
  userId: string;
}

interface Thread {
  _id?: string;
  $id?: string;
  title?: string;
  agent_name?: string;
  status?: 'active' | 'archived';
  last_message_at?: string;
  createdAt?: string;
  [key: string]: unknown;
}

// Message interface removed - using query results directly

// Predefined agent configurations
const AGENT_CONFIGS = {
  support: {
    name: 'Support Agent',
    model: 'gpt-4o-mini',
    provider: 'openai' as const,
    instructions:
      'You are a helpful customer support agent. Assist users with their questions professionally and courteously. Speak Turkish.',
    temperature: 0.7,
  },
  assistant: {
    name: 'General Assistant',
    model: 'gpt-4o',
    provider: 'openai' as const,
    instructions:
      'You are a helpful AI assistant. Provide accurate and helpful information. Speak Turkish.',
    temperature: 0.8,
  },
  analyst: {
    name: 'Data Analyst',
    model: 'claude-3-5-sonnet-20241022',
    provider: 'anthropic' as const,
    instructions:
      'You are a data analyst. Help analyze data, create reports, and provide insights. Speak Turkish.',
    temperature: 0.5,
  },
};

export function AgentChat({ userId }: AgentChatProps) {
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<keyof typeof AGENT_CONFIGS>('support');
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Queries
  // AI Agent API endpoints not yet implemented
  // Requires: /api/agent/threads, /api/agent/messages, /api/agent/usage
  // See docs/ISSUES.md - Issue #3: AI Agent API Endpoints
  const { data: threadsData } = useQuery({
    queryKey: ['agent-threads', userId],
    queryFn: async () => {
      // Endpoint: GET /api/agent/threads
      return [];
    },
    enabled: !!userId,
  });

  const threads = threadsData || [];

  const { data: messagesData } = useQuery({
    queryKey: ['agent-messages', activeThread?._id || activeThread?.$id],
    queryFn: async () => {
      // Endpoint: GET /api/agent/threads/[id]/messages
      return [];
    },
    enabled: !!activeThread && (!!activeThread._id || !!activeThread.$id),
  });

  const messages = messagesData || [];

  const { data: usageStats } = useQuery({
    queryKey: ['agent-usage', userId],
    queryFn: async () => {
      // Endpoint: GET /api/agent/usage
      return {
        totalMessages: 0,
        totalTokens: 0,
        totalCost: 0,
      };
    },
    enabled: !!userId,
  });

  // Mutations
  const createAndRespondMutation = useMutation({
    mutationFn: async (_data: { userId: string; agentName: string; prompt: string }) => {
      // Endpoint: POST /api/agent/threads (create thread and first response)
      return {
        threadId: `thread_${Date.now()}`,
        messageId: `msg_${Date.now()}`,
      };
    },
    onSuccess: (result) => {
      const newThread: Thread = {
        _id: result.threadId,
        title: prompt.slice(0, 50),
        agent_name: selectedAgent,
        status: 'active',
        last_message_at: new Date().toISOString(),
      };
      setActiveThread(newThread);
      queryClient.invalidateQueries({ queryKey: ['agent-threads', userId] });
      queryClient.invalidateQueries({ queryKey: ['agent-messages', result.threadId] });
    },
  });

  const generateResponseMutation = useMutation({
    mutationFn: async (_data: { threadId: string; prompt: string }) => {
      // Endpoint: POST /api/agent/threads/[id]/messages
      return {
        messageId: `msg_${Date.now()}`,
      };
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agent-messages', variables.threadId] });
    },
  });

  // Mutations
  const archiveThreadMutation = useMutation({
    mutationFn: async (_threadId: string) => {
      // Endpoint: POST /api/agent/threads/[id]/archive
      return { success: true };
    },
    onSuccess: (_result, threadId) => {
      queryClient.invalidateQueries({ queryKey: ['agent-threads', userId] });
      if ((activeThread?._id || activeThread?.$id) === threadId) {
        setActiveThread(null);
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      if (activeThread) {
        // Continue existing thread
        await generateResponseMutation.mutateAsync({
          threadId: activeThread._id || activeThread.$id || '',
          prompt: prompt.trim(),
        });
      } else {
        // Create new thread
        await createAndRespondMutation.mutateAsync({
          userId,
          agentName: selectedAgent,
          prompt: prompt.trim(),
        });
      }

      setPrompt('');
    } catch (error) {
      logger.error('Agent response generation failed', { error });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleArchive = async (threadId: string) => {
    await archiveThreadMutation.mutateAsync(threadId);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      {/* Sidebar - Threads List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Agent Threads
          </CardTitle>
          <CardDescription>Conversation history</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {threads?.map((thread: Thread) => {
                const threadId = thread._id || thread.$id || '';
                return (
                <button
                  key={threadId}
                  onClick={() => setActiveThread(thread)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
                    (activeThread?._id || activeThread?.$id) === threadId ? 'border-primary bg-accent' : ''
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <Badge variant="outline">{thread.agent_name || 'Unknown'}</Badge>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchive(threadId);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Archive className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="truncate font-medium">{thread.title || 'Untitled'}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {thread.last_message_at && typeof thread.last_message_at === 'string'
                      ? new Date(thread.last_message_at).toLocaleDateString('tr-TR')
                      : thread.createdAt && typeof thread.createdAt === 'string'
                        ? new Date(thread.createdAt).toLocaleDateString('tr-TR')
                        : '-'}
                  </div>
                </button>
              );
              })}
              {(!threads || threads.length === 0) && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No active threads. Start a new conversation!
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Chat Area */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Agent Chat
              </CardTitle>
              <CardDescription>
                {activeThread ? `Thread: ${activeThread.title || 'Untitled'}` : 'Start a new conversation'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedAgent}
                onValueChange={(value) => setSelectedAgent(value as keyof typeof AGENT_CONFIGS)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Support Agent
                    </div>
                  </SelectItem>
                  <SelectItem value="assistant">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      General Assistant
                    </div>
                  </SelectItem>
                  <SelectItem value="analyst">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Data Analyst
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chat">
            <TabsList className="mb-4 grid w-full grid-cols-3">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat">
              <ScrollArea className="mb-4 h-[450px] rounded-lg border p-4">
                {messages && messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((msg: { _id?: string; $id?: string; role?: string; content?: string; agent_name?: string; tool_calls?: unknown; [key: string]: unknown }) => {
                      const msgId = msg._id || msg.$id || '';
                      return (
                      <div
                        key={msgId}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          }`}
                        >
                          <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                            {msg.role === 'user' ? (
                              <User className="h-3 w-3" />
                            ) : (
                              <Bot className="h-3 w-3" />
                            )}
                            {String(msg.agent_name || msg.role || 'unknown')}
                            {Boolean(msg.tool_calls) && <Wrench className="h-3 w-3" />}
                          </div>
                          <div className="whitespace-pre-wrap">{String(msg.content || '')}</div>
                          {Boolean(msg.tool_calls) && (
                            <div className="mt-2 rounded bg-background/50 p-2 text-xs">
                              <div className="font-medium">Tool Calls:</div>
                              <pre className="mt-1 overflow-auto">
                                {JSON.stringify(msg.tool_calls, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                    })}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                    <div>
                      <Bot className="mx-auto mb-2 h-12 w-12 opacity-50" />
                      <p>
                        {activeThread
                          ? 'No messages yet'
                          : 'Select a thread or start a new conversation'}
                      </p>
                    </div>
                  </div>
                )}
              </ScrollArea>

              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask me anything..."
                  disabled={isGenerating}
                  className="flex-1"
                />
                <Button type="submit" disabled={!prompt.trim() || isGenerating || createAndRespondMutation.isPending || generateResponseMutation.isPending}>
                  {isGenerating || createAndRespondMutation.isPending || generateResponseMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-2 text-xs text-muted-foreground">
                Agent: {AGENT_CONFIGS[selectedAgent].name} ({AGENT_CONFIGS[selectedAgent].model})
              </div>
            </TabsContent>

            {/* Search Tab */}
            <TabsContent value="search">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search messages..."
                    disabled={!activeThread}
                  />
                  <Button disabled={!activeThread || !searchTerm}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                {!activeThread && (
                  <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                    Select a thread to search messages
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Usage Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {usageStats ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Total Tokens</div>
                          <div className="text-2xl font-bold">
                            {(usageStats?.totalTokens || 0).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Requests</div>
                          <div className="text-2xl font-bold">
                            {(usageStats?.totalMessages || 0).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Input Tokens</div>
                          <div className="text-xl font-bold">
                            {(usageStats?.totalTokens || 0).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Output Tokens</div>
                          <div className="text-xl font-bold">
                            {(usageStats?.totalTokens || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">Loading stats...</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Agent Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{AGENT_CONFIGS[selectedAgent].name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Model:</span>
                        <span className="font-medium">{AGENT_CONFIGS[selectedAgent].model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Provider:</span>
                        <span className="font-medium">{AGENT_CONFIGS[selectedAgent].provider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Temperature:</span>
                        <span className="font-medium">
                          {AGENT_CONFIGS[selectedAgent].temperature}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
