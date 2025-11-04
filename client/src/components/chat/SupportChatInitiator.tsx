import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  HelpCircle, 
  AlertTriangle, 
  Package, 
  CreditCard,
  Settings,
  X,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SupportChatInitiatorProps {
  userRole: 'buyer' | 'supplier';
  userId: string;
  onChatCreated?: (conversationId: string) => void;
}

interface SupportCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const supportCategories: SupportCategory[] = [
  {
    id: 'general',
    name: 'General Support',
    description: 'General questions and assistance',
    icon: <HelpCircle className="h-5 w-5" />,
    priority: 'low'
  },
  {
    id: 'product',
    name: 'Product Issues',
    description: 'Product-related problems or questions',
    icon: <Package className="h-5 w-5" />,
    priority: 'medium'
  },
  {
    id: 'payment',
    name: 'Payment & Billing',
    description: 'Payment issues, billing questions',
    icon: <CreditCard className="h-5 w-5" />,
    priority: 'high'
  },
  {
    id: 'technical',
    name: 'Technical Issues',
    description: 'Platform bugs, technical problems',
    icon: <Settings className="h-5 w-5" />,
    priority: 'high'
  },
  {
    id: 'urgent',
    name: 'Urgent Issue',
    description: 'Critical issues requiring immediate attention',
    icon: <AlertTriangle className="h-5 w-5" />,
    priority: 'urgent'
  }
];

export default function SupportChatInitiator({ userRole, userId, onChatCreated }: SupportChatInitiatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SupportCategory | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create support conversation mutation
  const createSupportChatMutation = useMutation({
    mutationFn: (data: {
      type: 'buyer_admin' | 'supplier_admin';
      subject: string;
      description: string;
      priority: string;
      category: string;
    }) => apiRequest('POST', '/api/chat/conversations', data),
    onSuccess: (newConversation) => {
      setIsOpen(false);
      setSelectedCategory(null);
      setSubject('');
      setDescription('');
      setPriority('medium');
      
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      
      toast({
        title: "Support chat created",
        description: "Our support team will respond shortly",
      });

      onChatCreated?.(newConversation.id);
    },
    onError: (error) => {
      toast({
        title: "Failed to create support chat",
        description: "Please try again",
        variant: "destructive"
      });
    }
  });

  const handleCategorySelect = (category: SupportCategory) => {
    setSelectedCategory(category);
    setPriority(category.priority);
    setSubject(category.name);
  };

  const handleCreateChat = () => {
    if (!selectedCategory || !subject.trim() || !description.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const chatType = userRole === 'buyer' ? 'buyer_admin' : 'supplier_admin';
    
    createSupportChatMutation.mutate({
      type: chatType,
      subject: subject.trim(),
      description: description.trim(),
      priority,
      category: selectedCategory.id
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 z-50"
        size="lg"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
              Contact Support
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 overflow-y-auto">
          {!selectedCategory ? (
            /* Category Selection */
            <div>
              <h3 className="text-lg font-medium mb-4">What do you need help with?</h3>
              <div className="grid gap-3">
                {supportCategories.map((category) => (
                  <Card 
                    key={category.id}
                    className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-200"
                    onClick={() => handleCategorySelect(category)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="text-blue-600 mt-1">
                          {category.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-gray-900">
                              {category.name}
                            </h4>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getPriorityColor(category.priority)}`}
                            >
                              {category.priority.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {category.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            /* Support Request Form */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Create Support Request</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedCategory(null)}
                >
                  ← Back
                </Button>
              </div>

              {/* Selected Category */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2">
                    <div className="text-blue-600">
                      {selectedCategory.icon}
                    </div>
                    <span className="font-medium text-blue-900">
                      {selectedCategory.name}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(selectedCategory.priority)}`}
                    >
                      {selectedCategory.priority.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  className="w-full"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide detailed information about your issue..."
                  className="w-full min-h-[100px]"
                  rows={4}
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - General question</SelectItem>
                    <SelectItem value="medium">Medium - Standard issue</SelectItem>
                    <SelectItem value="high">High - Important issue</SelectItem>
                    <SelectItem value="urgent">Urgent - Critical issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateChat}
                  disabled={createSupportChatMutation.isPending || !subject.trim() || !description.trim()}
                >
                  {createSupportChatMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Create Support Request
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}