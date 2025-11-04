import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  MessageSquare, 
  Package, 
  DollarSign, 
  Mail,
  User,
  Building,
  Phone,
  Clock,
  FileText,
  Lightbulb,
  Plus,
  X
} from 'lucide-react';

interface InquiryFormProps {
  productId: string;
  productName: string;
  productPrice?: string;
  supplierName?: string;
  supplierId?: string;
  onSuccess?: () => void;
}

interface InquiryTemplate {
  id: string;
  name: string;
  subject: string;
  message: string;
  category: string;
  isDefault: boolean;
}

export default function InquiryForm({ 
  productId, 
  productName, 
  productPrice = "$10.00-$100.00",
  supplierName = "Supplier",
  supplierId,
  onSuccess
}: InquiryFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    subject: '',
    quantity: '10',
    targetPrice: '',
    message: '',
    email: user?.email || '',
    requirements: '',
    urgency: 'normal',
    deadline: ''
  });

  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showTemplates, setShowTemplates] = useState(false);

  // Fetch inquiry templates for common questions
  const { data: templates } = useQuery<InquiryTemplate[]>({
    queryKey: ['/api/inquiry-templates'],
    queryFn: async () => {
      const response = await fetch('/api/inquiry-templates');
      if (!response.ok) return [];
      const data = await response.json();
      return data.templates || [];
    }
  });

  // Common inquiry templates (fallback if API doesn't have templates)
  const defaultTemplates: InquiryTemplate[] = [
    {
      id: 'pricing',
      name: 'Pricing Inquiry',
      subject: 'Pricing Information Request',
      message: 'Hello,\n\nI am interested in your product and would like to get detailed pricing information for different quantities. Could you please provide:\n\n- Unit price for different quantity tiers\n- Minimum order quantity\n- Payment terms\n- Lead time\n\nThank you for your time.',
      category: 'pricing',
      isDefault: true
    },
    {
      id: 'samples',
      name: 'Sample Request',
      subject: 'Sample Request',
      message: 'Hello,\n\nI would like to request samples of this product to evaluate quality before placing a larger order. Please let me know:\n\n- Sample availability and cost\n- Shipping arrangements\n- Sample lead time\n- Customization options\n\nLooking forward to your response.',
      category: 'samples',
      isDefault: false
    },
    {
      id: 'customization',
      name: 'Customization Inquiry',
      subject: 'Product Customization Options',
      message: 'Hello,\n\nI am interested in customizing this product for my business needs. Could you please provide information about:\n\n- Available customization options\n- Minimum quantities for custom orders\n- Additional costs for customization\n- Design and approval process\n- Production timeline\n\nThank you.',
      category: 'customization',
      isDefault: false
    },
    {
      id: 'shipping',
      name: 'Shipping & Logistics',
      subject: 'Shipping and Delivery Information',
      message: 'Hello,\n\nI need detailed information about shipping and logistics for this product:\n\n- Shipping methods available\n- Shipping costs to my location\n- Delivery timeframes\n- Packaging details\n- Insurance options\n\nPlease provide a comprehensive quote including all costs.',
      category: 'logistics',
      isDefault: false
    },
    {
      id: 'bulk',
      name: 'Bulk Order Inquiry',
      subject: 'Bulk Order Pricing Request',
      message: 'Hello,\n\nI am planning to place a large order and would like to discuss:\n\n- Volume discounts available\n- Bulk pricing tiers\n- Payment terms for large orders\n- Production capacity and lead times\n- Quality assurance processes\n\nI look forward to establishing a long-term business relationship.',
      category: 'bulk',
      isDefault: false
    }
  ];

  const availableTemplates = templates && templates.length > 0 ? templates : defaultTemplates;

  const sendInquiryMutation = useMutation({
    mutationFn: async (inquiryData: any) => {
      const response = await fetch('/api/buyer/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId,
          supplierId,
          subject: inquiryData.subject,
          quantity: parseInt(inquiryData.quantity),
          targetPrice: inquiryData.targetPrice ? parseFloat(inquiryData.targetPrice) : null,
          message: inquiryData.message,
          requirements: inquiryData.requirements,
          urgency: inquiryData.urgency,
          deadline: inquiryData.deadline || null,
          status: 'pending'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send inquiry');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Inquiry Sent Successfully",
        description: "Your inquiry has been sent to the supplier. You will receive a response soon.",
      });
      
      // Reset form
      setFormData({
        subject: '',
        quantity: '10',
        targetPrice: '',
        message: '',
        email: user?.email || '',
        requirements: '',
        urgency: 'normal',
        deadline: ''
      });
      setSelectedTemplate('');
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/buyer/inquiries'] });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error Sending Inquiry",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to send an inquiry.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.subject.trim() || !formData.message.trim()) {
      toast({
        title: "Required Fields Missing",
        description: "Please provide both a subject and message for your inquiry.",
        variant: "destructive",
      });
      return;
    }

    sendInquiryMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = availableTemplates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        subject: template.subject,
        message: template.message
      }));
      setSelectedTemplate(templateId);
      setShowTemplates(false);
    }
  };

  const clearTemplate = () => {
    setSelectedTemplate('');
    setFormData(prev => ({
      ...prev,
      subject: '',
      message: ''
    }));
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Send Product Inquiry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Info */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <Package className="h-4 w-4" />
              <span className="font-medium">{productName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <DollarSign className="h-4 w-4" />
              <span>Price: {productPrice}/piece</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Building className="h-4 w-4" />
              <span>Supplier: {supplierName}</span>
            </div>
          </div>

          {/* Template Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Quick Templates</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowTemplates(!showTemplates)}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                {showTemplates ? 'Hide Templates' : 'Use Template'}
              </Button>
            </div>

            {showTemplates && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {availableTemplates.map((template) => (
                  <Button
                    key={template.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`text-left justify-start h-auto p-3 ${
                      selectedTemplate === template.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                  >
                    <div>
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{template.subject}</div>
                    </div>
                  </Button>
                ))}
              </div>
            )}

            {selectedTemplate && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                <Badge variant="secondary" className="text-xs">
                  Template: {availableTemplates.find(t => t.id === selectedTemplate)?.name}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearTemplate}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="Brief description of your inquiry"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              required
            />
          </div>

          {/* Quantity and Target Price Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (pieces) *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetPrice">Target Price per Unit (Optional)</Label>
              <Input
                id="targetPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="Your target price"
                value={formData.targetPrice}
                onChange={(e) => handleInputChange('targetPrice', e.target.value)}
              />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message to Supplier *</Label>
            <Textarea
              id="message"
              placeholder="Describe your requirements, delivery timeline, or any specific needs..."
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={6}
              required
            />
          </div>

          {/* Additional Requirements */}
          <div className="space-y-2">
            <Label htmlFor="requirements">Additional Requirements (Optional)</Label>
            <Textarea
              id="requirements"
              placeholder="Certifications, packaging requirements, payment terms, etc."
              value={formData.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              rows={3}
            />
          </div>

          {/* Urgency and Deadline Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency Level</Label>
              <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - No rush</SelectItem>
                  <SelectItem value="normal">Normal - Standard timeline</SelectItem>
                  <SelectItem value="high">High - Need soon</SelectItem>
                  <SelectItem value="urgent">Urgent - ASAP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Response Deadline (Optional)</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Your Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full"
            disabled={sendInquiryMutation.isPending}
          >
            {sendInquiryMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending Inquiry...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Inquiry
              </>
            )}
          </Button>

          {/* Contact Supplier Button */}
          <Button 
            type="button" 
            variant="outline" 
            className="w-full"
            onClick={() => {
              // Navigate to messages or open chat
              window.location.href = '/messages';
            }}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Start Direct Chat
          </Button>
        </form>

        {/* User Info Display */}
        {user && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <User className="h-4 w-4" />
              <span>Sending as: {user.firstName} {user.lastName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
              <Mail className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}