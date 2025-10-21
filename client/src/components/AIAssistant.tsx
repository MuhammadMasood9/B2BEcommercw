import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Send, 
  MessageCircle, 
  Sparkles, 
  Zap, 
  Shield, 
  Clock,
  User,
  Loader2,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

export default function AIAssistant({ isOpen, onClose, onMinimize, isMinimized }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI assistant for Global Trade Hub. How can I help you today? I can assist with product inquiries, order tracking, account questions, and general marketplace guidance.",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate AI response
  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const responses = {
      greeting: [
        "Hello! Welcome to Global Trade Hub. I'm here to help you with any questions about our B2B marketplace.",
        "Hi there! How can I assist you with your trading needs today?",
        "Greetings! I'm your AI assistant, ready to help you navigate Global Trade Hub."
      ],
      products: [
        "I can help you find products! You can browse by categories, use our search feature, or check out our 'Ready to Ship' section for quick delivery options.",
        "For product inquiries, I recommend checking our product catalog or using the search bar. You can also filter by price range, MOQ, and supplier location.",
        "Our marketplace has thousands of verified products. Would you like me to guide you to specific categories or help you with product specifications?"
      ],
      orders: [
        "For order tracking, you can use the 'Track Order' feature in your dashboard. If you need help with a specific order, please provide your order number.",
        "I can help you track your orders! You can also view your order history in your buyer dashboard.",
        "Order management is easy with our platform. You can track shipments, view order status, and manage deliveries all in one place."
      ],
      account: [
        "For account-related questions, you can update your profile in the dashboard, manage your company information, or contact our support team for complex issues.",
        "Account settings can be managed through your profile. I can guide you through common account tasks like updating company details or payment methods.",
        "Your account dashboard has all the tools you need to manage your profile, company information, and trading preferences."
      ],
      support: [
        "I'm here to help! You can ask me about products, orders, account settings, or general marketplace questions. For urgent issues, you can also contact our human support team.",
        "I can assist with most common questions about Global Trade Hub. For complex issues, I can connect you with our support team.",
        "Support is available 24/7 through me! I can help with marketplace navigation, product inquiries, and account management."
      ],
      default: [
        "That's a great question! I can help you with product searches, order tracking, account management, and general marketplace guidance. What specific area would you like to know more about?",
        "I understand you're looking for help. I can assist with finding products, managing orders, account settings, or explain how our B2B marketplace works.",
        "I'm here to help! I can guide you through our marketplace features, help with product inquiries, or assist with your account. What would you like to know?"
      ]
    };

    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
    } else if (lowerMessage.includes('product') || lowerMessage.includes('search') || lowerMessage.includes('find')) {
      return responses.products[Math.floor(Math.random() * responses.products.length)];
    } else if (lowerMessage.includes('order') || lowerMessage.includes('track') || lowerMessage.includes('shipment')) {
      return responses.orders[Math.floor(Math.random() * responses.orders.length)];
    } else if (lowerMessage.includes('account') || lowerMessage.includes('profile') || lowerMessage.includes('settings')) {
      return responses.account[Math.floor(Math.random() * responses.account.length)];
    } else if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('assist')) {
      return responses.support[Math.floor(Math.random() * responses.support.length)];
    } else {
      return responses.default[Math.floor(Math.random() * responses.default.length)];
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const aiResponse = await generateAIResponse(userMessage.text);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Sorry, I encountered an error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onMinimize}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
        >
          <Bot className="h-6 w-6 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-[600px]">
      <Card className="h-full flex flex-col shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">AI Assistant</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="bg-green-500 text-white text-xs px-2 py-0.5">
                    <div className="w-2 h-2 bg-green-300 rounded-full mr-1 animate-pulse"></div>
                    Online
                  </Badge>
                  <span className="text-xs text-blue-100">Global Trade Hub</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onMinimize && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMinimize}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.sender === 'ai' && (
                      <Bot className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-600" />
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">AI is typing...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputText("How do I find products?")}
                className="text-xs"
              >
                <Search className="w-3 h-3 mr-1" />
                Find Products
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputText("How do I track my order?")}
                className="text-xs"
              >
                <Clock className="w-3 h-3 mr-1" />
                Track Order
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputText("I need help with my account")}
                className="text-xs"
              >
                <User className="w-3 h-3 mr-1" />
                Account Help
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
