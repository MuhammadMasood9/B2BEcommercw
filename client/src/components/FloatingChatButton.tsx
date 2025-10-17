import { useState, useEffect } from "react";
import { MessageCircle, X, Send, Image as ImageIcon, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface FloatingChatButtonProps {
  supplierName?: string;
  supplierId?: string;
  productId?: string;
  productName?: string;
  onClose?: () => void;
}

export default function FloatingChatButton({ supplierName, supplierId, productId, productName, onClose }: FloatingChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();


  // Get or create conversation
  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: ['/api/chat/conversations', user?.id, productId],
    queryFn: async () => {
      if (!user?.id || !productId) return null;
      
      // Try to find existing conversation for this product
      const response = await fetch(`/api/chat/conversations/buyer/${user.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch conversations');
      const data = await response.json();
      
      // Find conversation related to this product
      const existingConversation = data.conversations?.find((conv: any) => 
        conv.productId === productId || conv.subject?.includes(productName || '')
      );
      
      if (existingConversation) {
        setConversationId(existingConversation.id);
        return existingConversation;
      }
      
      // Create new conversation
      const createResponse = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          buyerId: user.id,
          adminId: 'admin', // Use generic admin ID
          subject: `Inquiry about ${productName || 'Product'}`,
          productId: productId,
        }),
      });
      
      if (!createResponse.ok) {
        let errorMessage = 'Failed to create conversation';
        try {
          const errorData = await createResponse.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (jsonError) {
          const errorText = await createResponse.text();
          console.error('Non-JSON error response:', errorText);
          errorMessage = `Server error: ${createResponse.status} ${createResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      let newConversation;
      try {
        newConversation = await createResponse.json();
      } catch (jsonError) {
        console.error('Failed to parse conversation response as JSON:', jsonError);
        throw new Error('Invalid response from server');
      }
      setConversationId(newConversation.id);
      return newConversation;
    },
    enabled: !!user?.id && !!productId,
  });

  // Get messages for conversation
  const { data: messages = [] } = useQuery({
    queryKey: ['/api/chat/conversations', conversationId, 'messages'],
    queryFn: async () => {
      if (!conversationId) return [];
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      return data.messages || [];
    },
    enabled: !!conversationId,
    refetchInterval: 5000, // Poll for new messages
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      if (!conversationId || !user?.id) throw new Error('No conversation or user');
      
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: messageText,
          senderId: user.id,
          receiverId: 'admin', // Use generic admin ID
        }),
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', conversationId, 'messages'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim() || sendMessageMutation.isPending) return;
    if (!conversationId || !user?.id) {
      toast({
        title: "Error",
        description: "Please wait for the conversation to be created.",
        variant: "destructive",
      });
      return;
    }
    sendMessageMutation.mutate(message);
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  // Auto-open when component mounts
  useEffect(() => {
    if (user && productId) {
      setIsOpen(true);
    }
  }, [user, productId]);

  if (!user) {
    return null; // Don't show chat if user is not logged in
  }

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all z-[9998] no-default-hover-elevate"
          size="icon"
          data-testid="button-open-chat"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[500px] flex flex-col shadow-2xl z-[9998] glass-card">
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{supplierName || "Admin Support"}</h3>
                <p className="text-xs text-white/80">
                  {productName ? `About: ${productName}` : "Online"}
                </p>
              </div>
            </div>
            <Button
              onClick={handleClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              data-testid="button-close-chat"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
            {conversationLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500 text-sm">Setting up conversation...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 text-sm">
                  {productName 
                    ? `Start a conversation about ${productName}`
                    : "Start a conversation with our support team"
                  }
                </p>
              </div>
            ) : (
              messages.map((msg: any, index: number) => (
                <div
                  key={index}
                  className={`flex ${msg.senderId === user.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.senderId === user.id
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-gray-800 border"
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1 ${
                      msg.senderId === user.id ? "text-white/80" : "text-gray-500"
                    }`}>
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t bg-white dark:bg-gray-800">
            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={conversationLoading ? "Setting up conversation..." : "Type your message..."}
                className="resize-none"
                rows={2}
                disabled={sendMessageMutation.isPending || conversationLoading}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                data-testid="textarea-chat-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending || !message.trim() || conversationLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white no-default-hover-elevate"
                size="icon"
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
