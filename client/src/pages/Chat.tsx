import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Bot,
  Sparkles,
  Zap,
  Shield,
  Clock,
  User,
  ArrowRight,
  Star,
  CheckCircle
} from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import { useToast } from '@/hooks/use-toast';
import AIAssistant from '@/components/AIAssistant';

export default function Chat() {
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { toast } = useToast();

  // Get current user info
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => apiRequest('GET', '/api/auth/me'),
  });

  const user = (userData as any)?.user;

  const handleOpenAIAssistant = () => {
    setIsAIAssistantOpen(true);
    setIsMinimized(false);
  };

  const handleCloseAIAssistant = () => {
    setIsAIAssistantOpen(false);
    setIsMinimized(false);
  };

  const handleMinimizeAIAssistant = () => {
    setIsMinimized(true);
  };

  const handleMaximizeAIAssistant = () => {
    setIsMinimized(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Please log in to access chat
          </h3>
          <p className="text-gray-500">
            You need to be logged in to use the chat feature.
          </p>
        </div>
      </div>
    );
  }

  if (showChatInterface && user.id) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="p-6 pb-0">
            <Breadcrumb items={[
              { label: "Home", href: "/" },
              { label: "Chat" }
            ]} />
          </div>

          {/* Chat Interface */}
          <div className="h-[calc(100vh-120px)]">
            <ImprovedChatInterface userRole="buyer" userId={user.id} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: "Home", href: "/" },
          { label: "Chat" }
        ]} />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Support Chat
          </h1>
          <p className="text-gray-600">
            Get instant help from our support team. Start a conversation or continue an existing chat.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <MessageCircle className="h-8 w-8 text-blue-200" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Live Chat</h3>
                  <p className="text-blue-100 text-sm">Get instant support</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Bot className="h-8 w-8 text-green-200" />
                <div>
                  <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
                  <p className="text-green-100 text-sm">24/7 automated help</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Phone className="h-8 w-8 text-purple-200" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Phone Support</h3>
                  <p className="text-purple-100 text-sm">Call us directly</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Support Team */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Our Support Team</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Chat with Support Team
              </h3>
              <p className="text-gray-500 mb-6">
                Get help from our support team. We're here to assist you with any questions or concerns.
              </p>
              <Button 
                onClick={handleStartChat}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                size="lg"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Start Chat
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium text-gray-900">How do I place an order?</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Browse our products, add items to your cart, and proceed to checkout. Our team will contact you to finalize the order details.
                </p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-medium text-gray-900">What are your payment terms?</h4>
                <p className="text-sm text-gray-600 mt-1">
                  We accept various payment methods including bank transfers, letters of credit, and trade financing options.
                </p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-medium text-gray-900">How long does shipping take?</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Shipping times vary by location and product. Our team will provide specific delivery estimates for your order.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
