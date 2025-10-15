import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Send, 
  MessageSquare, 
  Package, 
  DollarSign, 
  Mail,
  User,
  Building,
  Phone
} from 'lucide-react';

interface InquiryFormProps {
  productId: string;
  productName: string;
  productPrice?: string;
  supplierName?: string;
}

export default function InquiryForm({ 
  productId, 
  productName, 
  productPrice = "$10.00-$100.00",
  supplierName = "Admin Supplier"
}: InquiryFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    quantity: '10',
    targetPrice: '',
    message: '',
    email: user?.email || '',
    requirements: ''
  });

  const sendInquiryMutation = useMutation({
    mutationFn: async (inquiryData: any) => {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          buyerId: user?.id,
          quantity: parseInt(inquiryData.quantity),
          targetPrice: inquiryData.targetPrice || null,
          message: inquiryData.message,
          requirements: inquiryData.requirements,
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
        quantity: '10',
        targetPrice: '',
        message: '',
        email: user?.email || '',
        requirements: ''
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
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

    if (!formData.message.trim()) {
      toast({
        title: "Message Required",
        description: "Please provide a message for your inquiry.",
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

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Send Inquiry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Info */}
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Package className="h-4 w-4" />
              <span className="font-medium">{productName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
              <DollarSign className="h-4 w-4" />
              <span>Price: {productPrice}/piece</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
              <Building className="h-4 w-4" />
              <span>Supplier: {supplierName}</span>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity (pieces)</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', e.target.value)}
              required
            />
          </div>

          {/* Target Price */}
          <div className="space-y-2">
            <Label htmlFor="targetPrice">Target Price (Optional)</Label>
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

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message to Supplier</Label>
            <Textarea
              id="message"
              placeholder="Describe your requirements, delivery timeline, or any specific needs..."
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* Requirements */}
          <div className="space-y-2">
            <Label htmlFor="requirements">Additional Requirements (Optional)</Label>
            <Textarea
              id="requirements"
              placeholder="Certifications, packaging requirements, payment terms, etc."
              value={formData.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              rows={2}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Your Email</Label>
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
                Sending...
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
            Contact Supplier
          </Button>
        </form>

        {/* User Info Display */}
        {user && (
          <div className="mt-4 pt-4 border-t">
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
