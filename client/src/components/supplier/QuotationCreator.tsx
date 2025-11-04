import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Save, 
  FileText, 
  DollarSign, 
  Package, 
  Clock, 
  Calendar,
  Upload,
  X,
  Copy,
  Edit,
  Trash2,
  Calculator,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface QuotationTemplate {
  id: string;
  name: string;
  category: string;
  unitPrice: string;
  moq: number;
  leadTime: string;
  paymentTerms: string;
  validityPeriod: number;
  termsConditions: string;
  isDefault: boolean;
  usageCount: number;
}

interface QuotationFormData {
  unitPrice: string;
  totalPrice: string;
  moq: number;
  leadTime: string;
  paymentTerms: string;
  validityPeriod: number;
  termsConditions: string;
  attachments: string[];
  priceBreakdown: PriceBreakdown[];
  shippingTerms: string;
  warrantyTerms: string;
  deliveryTerms: string;
}

interface PriceBreakdown {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

interface QuotationCreatorProps {
  rfqId?: string;
  inquiryId?: string;
  rfqData?: any;
  inquiryData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const QuotationCreator: React.FC<QuotationCreatorProps> = ({
  rfqId,
  inquiryId,
  rfqData,
  inquiryData,
  onSuccess,
  onCancel
}) => {
  const [quotationForm, setQuotationForm] = useState<QuotationFormData>({
    unitPrice: '',
    totalPrice: '',
    moq: 1,
    leadTime: '',
    paymentTerms: '',
    validityPeriod: 30,
    termsConditions: '',
    attachments: [],
    priceBreakdown: [],
    shippingTerms: '',
    warrantyTerms: '',
    deliveryTerms: ''
  });

  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showPriceCalculator, setShowPriceCalculator] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<QuotationTemplate | null>(null);
  const [newBreakdownItem, setNewBreakdownItem] = useState({
    description: '',
    quantity: 1,
    unitPrice: ''
  });

  const queryClient = useQueryClient();

  // Fetch quotation templates
  const { data: templatesData } = useQuery({
    queryKey: ['quotation-templates'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/quotation-templates', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    }
  });

  // Create quotation mutation
  const createQuotationMutation = useMutation({
    mutationFn: async (quotationData: QuotationFormData) => {
      const endpoint = rfqId 
        ? `/api/suppliers/rfqs/${rfqId}/quotations`
        : `/api/suppliers/inquiries/${inquiryId}/respond`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(quotationData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create quotation');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quotation created successfully"
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (templateData: Partial<QuotationTemplate>) => {
      const response = await fetch('/api/suppliers/quotation-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(templateData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save template');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template saved successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['quotation-templates'] });
    }
  });

  // Calculate total price when unit price or MOQ changes
  useEffect(() => {
    if (quotationForm.unitPrice && quotationForm.moq) {
      const unitPrice = parseFloat(quotationForm.unitPrice);
      const quantity = rfqData?.quantity || inquiryData?.quantity || quotationForm.moq;
      const total = (unitPrice * Math.max(quotationForm.moq, quantity)).toFixed(2);
      setQuotationForm(prev => ({ ...prev, totalPrice: total }));
    }
  }, [quotationForm.unitPrice, quotationForm.moq, rfqData, inquiryData]);

  // Calculate price breakdown total
  useEffect(() => {
    const breakdownTotal = quotationForm.priceBreakdown.reduce((sum, item) => {
      return sum + parseFloat(item.totalPrice || '0');
    }, 0);
    
    if (breakdownTotal > 0) {
      setQuotationForm(prev => ({ ...prev, totalPrice: breakdownTotal.toFixed(2) }));
    }
  }, [quotationForm.priceBreakdown]);

  const handleApplyTemplate = (template: QuotationTemplate) => {
    setQuotationForm(prev => ({
      ...prev,
      unitPrice: template.unitPrice,
      moq: template.moq,
      leadTime: template.leadTime,
      paymentTerms: template.paymentTerms,
      validityPeriod: template.validityPeriod,
      termsConditions: template.termsConditions
    }));
    setShowTemplateDialog(false);
    
    // Update template usage count
    fetch(`/api/suppliers/quotation-templates/${template.id}/use`, {
      method: 'POST',
      credentials: 'include'
    });
  };

  const handleSaveAsTemplate = () => {
    const templateName = prompt('Enter template name:');
    if (!templateName) return;

    const category = prompt('Enter category (optional):') || 'General';

    saveTemplateMutation.mutate({
      name: templateName,
      category,
      unitPrice: quotationForm.unitPrice,
      moq: quotationForm.moq,
      leadTime: quotationForm.leadTime,
      paymentTerms: quotationForm.paymentTerms,
      validityPeriod: quotationForm.validityPeriod,
      termsConditions: quotationForm.termsConditions
    });
  };

  const addBreakdownItem = () => {
    if (!newBreakdownItem.description || !newBreakdownItem.unitPrice) {
      toast({
        title: "Validation Error",
        description: "Please fill in description and unit price",
        variant: "destructive"
      });
      return;
    }

    const totalPrice = (parseFloat(newBreakdownItem.unitPrice) * newBreakdownItem.quantity).toFixed(2);
    
    const newItem: PriceBreakdown = {
      id: Date.now().toString(),
      description: newBreakdownItem.description,
      quantity: newBreakdownItem.quantity,
      unitPrice: newBreakdownItem.unitPrice,
      totalPrice
    };

    setQuotationForm(prev => ({
      ...prev,
      priceBreakdown: [...prev.priceBreakdown, newItem]
    }));

    setNewBreakdownItem({
      description: '',
      quantity: 1,
      unitPrice: ''
    });
  };

  const removeBreakdownItem = (id: string) => {
    setQuotationForm(prev => ({
      ...prev,
      priceBreakdown: prev.priceBreakdown.filter(item => item.id !== id)
    }));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!quotationForm.unitPrice || !quotationForm.leadTime || !quotationForm.paymentTerms) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    createQuotationMutation.mutate(quotationForm);
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const sourceData = rfqData || inquiryData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Create Quotation</h2>
          <p className="text-gray-600">
            {rfqId ? 'Responding to RFQ' : 'Responding to Inquiry'}: {sourceData?.title || sourceData?.subject}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Use Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Quotation Templates</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-96">
                <div className="space-y-2">
                  {templatesData?.success && templatesData.templates?.map((template: QuotationTemplate) => (
                    <Card key={template.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleApplyTemplate(template)}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{template.name}</h4>
                            <p className="text-sm text-gray-600">{template.category}</p>
                            <div className="flex gap-4 mt-2 text-sm">
                              <span>Price: {formatCurrency(template.unitPrice)}</span>
                              <span>MOQ: {template.moq}</span>
                              <span>Lead Time: {template.leadTime}</span>
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <div>Used {template.usageCount} times</div>
                            {template.isDefault && <Badge variant="secondary">Default</Badge>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={handleSaveAsTemplate}>
            <Save className="h-4 w-4 mr-2" />
            Save as Template
          </Button>
        </div>
      </div>

      {/* Source Information */}
      {sourceData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Request Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong>Quantity:</strong> {sourceData.quantity?.toLocaleString() || 'Not specified'} units
              </div>
              <div>
                <strong>Target Price:</strong> {sourceData.targetPrice ? formatCurrency(sourceData.targetPrice) : 'Not specified'}
              </div>
              <div>
                <strong>Delivery:</strong> {sourceData.deliveryLocation || 'Not specified'}
              </div>
              <div>
                <strong>Required Date:</strong> {sourceData.requiredDeliveryDate ? new Date(sourceData.requiredDeliveryDate).toLocaleDateString() : 'Not specified'}
              </div>
            </div>
            {sourceData.description && (
              <div className="mt-4">
                <strong>Description:</strong>
                <p className="text-gray-600 mt-1">{sourceData.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pricing Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unitPrice">Unit Price (USD) *</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                value={quotationForm.unitPrice}
                onChange={(e) => setQuotationForm(prev => ({ ...prev, unitPrice: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="totalPrice">Total Price (USD)</Label>
              <Input
                id="totalPrice"
                type="number"
                step="0.01"
                value={quotationForm.totalPrice}
                onChange={(e) => setQuotationForm(prev => ({ ...prev, totalPrice: e.target.value }))}
                placeholder="Calculated automatically"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="moq">Minimum Order Quantity *</Label>
              <Input
                id="moq"
                type="number"
                value={quotationForm.moq}
                onChange={(e) => setQuotationForm(prev => ({ ...prev, moq: parseInt(e.target.value) || 1 }))}
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="validityPeriod">Validity Period (days)</Label>
              <Input
                id="validityPeriod"
                type="number"
                value={quotationForm.validityPeriod}
                onChange={(e) => setQuotationForm(prev => ({ ...prev, validityPeriod: parseInt(e.target.value) || 30 }))}
                min="1"
              />
            </div>
          </div>

          {/* Price Breakdown */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Price Breakdown (Optional)</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPriceCalculator(!showPriceCalculator)}
              >
                <Calculator className="h-4 w-4 mr-2" />
                {showPriceCalculator ? 'Hide' : 'Show'} Calculator
              </Button>
            </div>
            
            {showPriceCalculator && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    placeholder="Description"
                    value={newBreakdownItem.description}
                    onChange={(e) => setNewBreakdownItem(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Quantity"
                    value={newBreakdownItem.quantity}
                    onChange={(e) => setNewBreakdownItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Unit Price"
                    value={newBreakdownItem.unitPrice}
                    onChange={(e) => setNewBreakdownItem(prev => ({ ...prev, unitPrice: e.target.value }))}
                  />
                  <Button onClick={addBreakdownItem}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {quotationForm.priceBreakdown.length > 0 && (
                  <div className="space-y-2">
                    {quotationForm.priceBreakdown.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex-1">
                          <span className="font-medium">{item.description}</span>
                          <span className="text-sm text-gray-600 ml-2">
                            {item.quantity} × {formatCurrency(item.unitPrice)} = {formatCurrency(item.totalPrice)}
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeBreakdownItem(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="text-right font-semibold">
                      Total: {formatCurrency(quotationForm.priceBreakdown.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Terms and Conditions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="leadTime">Lead Time *</Label>
              <Input
                id="leadTime"
                value={quotationForm.leadTime}
                onChange={(e) => setQuotationForm(prev => ({ ...prev, leadTime: e.target.value }))}
                placeholder="e.g., 15-30 days"
              />
            </div>
            <div>
              <Label htmlFor="paymentTerms">Payment Terms *</Label>
              <Input
                id="paymentTerms"
                value={quotationForm.paymentTerms}
                onChange={(e) => setQuotationForm(prev => ({ ...prev, paymentTerms: e.target.value }))}
                placeholder="e.g., T/T, L/C, 30% advance"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shippingTerms">Shipping Terms</Label>
              <Input
                id="shippingTerms"
                value={quotationForm.shippingTerms}
                onChange={(e) => setQuotationForm(prev => ({ ...prev, shippingTerms: e.target.value }))}
                placeholder="e.g., FOB, CIF, EXW"
              />
            </div>
            <div>
              <Label htmlFor="deliveryTerms">Delivery Terms</Label>
              <Input
                id="deliveryTerms"
                value={quotationForm.deliveryTerms}
                onChange={(e) => setQuotationForm(prev => ({ ...prev, deliveryTerms: e.target.value }))}
                placeholder="e.g., Door to door, Port to port"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="warrantyTerms">Warranty Terms</Label>
            <Input
              id="warrantyTerms"
              value={quotationForm.warrantyTerms}
              onChange={(e) => setQuotationForm(prev => ({ ...prev, warrantyTerms: e.target.value }))}
              placeholder="e.g., 1 year manufacturer warranty"
            />
          </div>

          <div>
            <Label htmlFor="termsConditions">Additional Terms & Conditions</Label>
            <Textarea
              id="termsConditions"
              value={quotationForm.termsConditions}
              onChange={(e) => setQuotationForm(prev => ({ ...prev, termsConditions: e.target.value }))}
              placeholder="Additional terms and conditions..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={createQuotationMutation.isPending}
        >
          {createQuotationMutation.isPending ? 'Creating...' : 'Create Quotation'}
        </Button>
      </div>
    </div>
  );
};

export default QuotationCreator;