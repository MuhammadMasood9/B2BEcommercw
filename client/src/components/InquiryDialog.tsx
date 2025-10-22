import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  DollarSign, 
  Calendar, 
  MessageSquare, 
  FileText, 
  Clock, 
  User, 
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  Info,
  Send,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface InquiryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    priceRange?: string;
    moq?: number;
    supplierName?: string;
    supplierCountry?: string;
    leadTime?: string;
    paymentTerms?: string[];
    image?: string;
  };
}

export default function InquiryDialog({ isOpen, onClose, product }: InquiryDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    quantity: '',
    targetPrice: '',
    deliveryDate: '',
    paymentTerms: '',
    message: '',
    requirements: '',
    contactEmail: user?.email || '',
    contactPhone: '',
    companyName: '',
    shippingAddress: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendInquiryMutation = useMutation({
    mutationFn: async (inquiryData: any) => {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(inquiryData)
      });
      if (!response.ok) throw new Error('Failed to send inquiry');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Inquiry Sent Successfully!",
        description: "Your inquiry has been sent to the supplier. You'll receive a quotation soon.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/buyer/inquiries'] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Inquiry",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      quantity: '',
      targetPrice: '',
      deliveryDate: '',
      paymentTerms: '',
      message: '',
      requirements: '',
      contactEmail: user?.email || '',
      contactPhone: '',
      companyName: '',
      shippingAddress: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to send inquiries.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.quantity || !formData.targetPrice) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in quantity and target price.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    const inquiryData = {
      productId: product.id,
      buyerId: user.id,
      quantity: parseInt(formData.quantity),
      targetPrice: parseFloat(formData.targetPrice),
      message: formData.message,
      requirements: formData.requirements,
      deliveryDate: formData.deliveryDate,
      paymentTerms: formData.paymentTerms,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      companyName: formData.companyName,
      shippingAddress: formData.shippingAddress
    };

    sendInquiryMutation.mutate(inquiryData);
    setIsSubmitting(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Send Inquiry
          </DialogTitle>
          <DialogDescription>
            Send a detailed inquiry to the supplier for this product. Be specific about your requirements to get the best quotation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Information */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {product.image && (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-lg border"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium">{product.priceRange || 'Contact for price'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-600">MOQ:</span>
                      <span className="font-medium">{product.moq || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="text-gray-600">Lead Time:</span>
                      <span className="font-medium">{product.leadTime || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-600" />
                      <span className="text-gray-600">Supplier:</span>
                      <span className="font-medium">{product.supplierName || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Requirements */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Basic Requirements
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                    Quantity Required *
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="Enter quantity"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    className="mt-1"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum order quantity may apply</p>
                </div>
                
                <div>
                  <Label htmlFor="targetPrice" className="text-sm font-medium text-gray-700">
                    Target Price per Unit ($) *
                  </Label>
                  <Input
                    id="targetPrice"
                    type="number"
                    step="0.01"
                    placeholder="Enter your target price"
                    value={formData.targetPrice}
                    onChange={(e) => handleInputChange('targetPrice', e.target.value)}
                    className="mt-1"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Your expected price range</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deliveryDate" className="text-sm font-medium text-gray-700">
                    Required Delivery Date
                  </Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="paymentTerms" className="text-sm font-medium text-gray-700">
                    Preferred Payment Terms
                  </Label>
                  <Input
                    id="paymentTerms"
                    placeholder="e.g., 30% advance, 70% on delivery"
                    value={formData.paymentTerms}
                    onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-green-600" />
                Contact Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactEmail" className="text-sm font-medium text-gray-700">
                    Email Address *
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="contactPhone" className="text-sm font-medium text-gray-700">
                    Phone Number
                  </Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  placeholder="Your company name"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="shippingAddress" className="text-sm font-medium text-gray-700">
                  Shipping Address
                </Label>
                <Textarea
                  id="shippingAddress"
                  placeholder="Enter your shipping address"
                  value={formData.shippingAddress}
                  onChange={(e) => handleInputChange('shippingAddress', e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>

            <Separator />

            {/* Additional Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                Additional Information
              </h4>
              
              <div>
                <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                  Message to Supplier
                </Label>
                <Textarea
                  id="message"
                  placeholder="Tell the supplier about your specific needs, timeline, or any questions you have..."
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="requirements" className="text-sm font-medium text-gray-700">
                  Technical Requirements & Specifications
                </Label>
                <Textarea
                  id="requirements"
                  placeholder="Specify any technical requirements, certifications needed, quality standards, packaging requirements, etc."
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Tips */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <h5 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Tips for Better Quotations
                </h5>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Be specific about quantity and timeline to get better pricing</li>
                  <li>• Mention any certifications or quality requirements</li>
                  <li>• Ask about bulk discounts or long-term partnership opportunities</li>
                  <li>• Include your company background for better supplier confidence</li>
                </ul>
              </CardContent>
            </Card>
          </form>
        </div>

        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.quantity || !formData.targetPrice}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Inquiry
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
