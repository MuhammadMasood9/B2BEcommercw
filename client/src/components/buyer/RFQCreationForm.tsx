import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  CalendarIcon,
  Plus,
  X,
  FileText,
  Package,
  DollarSign,
  MapPin,
  Clock,
  Building2,
  AlertCircle,
  CheckCircle,
  Upload,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface RFQFormData {
  title: string;
  description: string;
  categoryId: string;
  specifications: Record<string, any>;
  quantity: number;
  targetPrice: string;
  budgetRange: {
    min: number;
    max: number;
  };
  deliveryLocation: string;
  requiredDeliveryDate: Date | null;
  paymentTerms: string;
  expiresAt: Date | null;
  attachments: string[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface RFQCreationFormProps {
  onSuccess?: (rfqId: string) => void;
  onCancel?: () => void;
  initialData?: Partial<RFQFormData>;
}

const RFQCreationForm: React.FC<RFQCreationFormProps> = ({
  onSuccess,
  onCancel,
  initialData
}) => {
  const [formData, setFormData] = useState<RFQFormData>({
    title: '',
    description: '',
    categoryId: '',
    specifications: {},
    quantity: 1,
    targetPrice: '',
    budgetRange: {
      min: 0,
      max: 0
    },
    deliveryLocation: '',
    requiredDeliveryDate: null,
    paymentTerms: '',
    expiresAt: null,
    attachments: [],
    ...initialData
  });

  const [specificationFields, setSpecificationFields] = useState<Array<{id: string, key: string, value: string}>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);

  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  // Create RFQ mutation
  const createRFQMutation = useMutation({
    mutationFn: async (rfqData: RFQFormData) => {
      const response = await fetch('/api/buyer/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...rfqData,
          specifications: Object.fromEntries(
            specificationFields.map(field => [field.key, field.value])
          )
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create RFQ');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "RFQ created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['buyer-rfqs'] });
      onSuccess?.(data.rfq.id);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Initialize specification fields from initial data
  useEffect(() => {
    if (initialData?.specifications) {
      const fields = Object.entries(initialData.specifications).map(([key, value], index) => ({
        id: `spec-${index}`,
        key,
        value: String(value)
      }));
      setSpecificationFields(fields);
    }
  }, [initialData]);

  // Set default expiry date (30 days from now)
  useEffect(() => {
    if (!formData.expiresAt) {
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 30);
      setFormData(prev => ({ ...prev, expiresAt: defaultExpiry }));
    }
  }, []);

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (stepNumber) {
      case 1:
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.categoryId) newErrors.categoryId = 'Category is required';
        break;
      case 2:
        if (formData.quantity < 1) newErrors.quantity = 'Quantity must be at least 1';
        if (formData.budgetRange.min < 0) newErrors.budgetMin = 'Minimum budget cannot be negative';
        if (formData.budgetRange.max > 0 && formData.budgetRange.max < formData.budgetRange.min) {
          newErrors.budgetMax = 'Maximum budget must be greater than minimum';
        }
        break;
      case 3:
        if (!formData.deliveryLocation.trim()) newErrors.deliveryLocation = 'Delivery location is required';
        if (!formData.paymentTerms.trim()) newErrors.paymentTerms = 'Payment terms are required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleSubmit = () => {
    if (validateStep(step)) {
      createRFQMutation.mutate(formData);
    }
  };

  const addSpecificationField = () => {
    const newField = {
      id: `spec-${Date.now()}`,
      key: '',
      value: ''
    };
    setSpecificationFields([...specificationFields, newField]);
  };

  const updateSpecificationField = (id: string, field: 'key' | 'value', value: string) => {
    setSpecificationFields(fields =>
      fields.map(f => f.id === id ? { ...f, [field]: value } : f)
    );
  };

  const removeSpecificationField = (id: string) => {
    setSpecificationFields(fields => fields.filter(f => f.id !== id));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">RFQ Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Custom LED Light Strips for Commercial Use"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select 
              value={formData.categoryId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
            >
              <SelectTrigger className={errors.categoryId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categoriesData?.categories?.map((category: Category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && <p className="text-sm text-red-500 mt-1">{errors.categoryId}</p>}
          </div>

          <div>
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide detailed requirements, intended use, quality standards, etc."
              rows={4}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Technical Specifications</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={addSpecificationField}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Specification
              </Button>
            </div>
            
            <div className="space-y-2">
              {specificationFields.map((field) => (
                <div key={field.id} className="flex gap-2">
                  <Input
                    placeholder="Specification name (e.g., Material)"
                    value={field.key}
                    onChange={(e) => updateSpecificationField(field.id, 'key', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value (e.g., Aluminum alloy)"
                    value={field.value}
                    onChange={(e) => updateSpecificationField(field.id, 'value', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeSpecificationField(field.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            {specificationFields.length === 0 && (
              <p className="text-sm text-gray-500 italic">
                Add technical specifications to help suppliers understand your requirements better
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Quantity & Pricing</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="quantity">Required Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              className={errors.quantity ? 'border-red-500' : ''}
            />
            {errors.quantity && <p className="text-sm text-red-500 mt-1">{errors.quantity}</p>}
          </div>

          <div>
            <Label htmlFor="targetPrice">Target Unit Price (USD)</Label>
            <Input
              id="targetPrice"
              type="number"
              step="0.01"
              value={formData.targetPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, targetPrice: e.target.value }))}
              placeholder="Optional - helps suppliers provide competitive quotes"
            />
          </div>

          <div>
            <Label>Budget Range (USD)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budgetMin" className="text-sm">Minimum Budget</Label>
                <Input
                  id="budgetMin"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.budgetRange.min || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    budgetRange: { ...prev.budgetRange, min: parseFloat(e.target.value) || 0 }
                  }))}
                  placeholder="0.00"
                  className={errors.budgetMin ? 'border-red-500' : ''}
                />
                {errors.budgetMin && <p className="text-sm text-red-500 mt-1">{errors.budgetMin}</p>}
              </div>
              <div>
                <Label htmlFor="budgetMax" className="text-sm">Maximum Budget</Label>
                <Input
                  id="budgetMax"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.budgetRange.max || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    budgetRange: { ...prev.budgetRange, max: parseFloat(e.target.value) || 0 }
                  }))}
                  placeholder="0.00"
                  className={errors.budgetMax ? 'border-red-500' : ''}
                />
                {errors.budgetMax && <p className="text-sm text-red-500 mt-1">{errors.budgetMax}</p>}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Optional - Providing a budget range helps suppliers tailor their quotes
            </p>
          </div>

          {formData.budgetRange.min > 0 && formData.budgetRange.max > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Budget Summary</span>
              </div>
              <div className="text-sm text-blue-800">
                <p>Total Budget Range: {formatCurrency(formData.budgetRange.min)} - {formatCurrency(formData.budgetRange.max)}</p>
                <p>Per Unit Range: {formatCurrency(formData.budgetRange.min / formData.quantity)} - {formatCurrency(formData.budgetRange.max / formData.quantity)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Delivery & Terms</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="deliveryLocation">Delivery Location *</Label>
            <Input
              id="deliveryLocation"
              value={formData.deliveryLocation}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryLocation: e.target.value }))}
              placeholder="e.g., New York, USA or specific address"
              className={errors.deliveryLocation ? 'border-red-500' : ''}
            />
            {errors.deliveryLocation && <p className="text-sm text-red-500 mt-1">{errors.deliveryLocation}</p>}
          </div>

          <div>
            <Label>Required Delivery Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.requiredDeliveryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.requiredDeliveryDate ? (
                    format(formData.requiredDeliveryDate, "PPP")
                  ) : (
                    <span>Select delivery date (optional)</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.requiredDeliveryDate || undefined}
                  onSelect={(date) => setFormData(prev => ({ ...prev, requiredDeliveryDate: date || null }))}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="paymentTerms">Preferred Payment Terms *</Label>
            <Select 
              value={formData.paymentTerms} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, paymentTerms: value }))}
            >
              <SelectTrigger className={errors.paymentTerms ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select payment terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="T/T">T/T (Telegraphic Transfer)</SelectItem>
                <SelectItem value="L/C">L/C (Letter of Credit)</SelectItem>
                <SelectItem value="30% advance">30% Advance, 70% on delivery</SelectItem>
                <SelectItem value="50% advance">50% Advance, 50% on delivery</SelectItem>
                <SelectItem value="Net 30">Net 30 days</SelectItem>
                <SelectItem value="Net 60">Net 60 days</SelectItem>
                <SelectItem value="Cash on delivery">Cash on Delivery</SelectItem>
                <SelectItem value="Other">Other (specify in description)</SelectItem>
              </SelectContent>
            </Select>
            {errors.paymentTerms && <p className="text-sm text-red-500 mt-1">{errors.paymentTerms}</p>}
          </div>

          <div>
            <Label>RFQ Expiry Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.expiresAt && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.expiresAt ? (
                    format(formData.expiresAt, "PPP")
                  ) : (
                    <span>Select expiry date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.expiresAt || undefined}
                  onSelect={(date) => setFormData(prev => ({ ...prev, expiresAt: date || null }))}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-sm text-gray-500 mt-1">
              Suppliers can submit quotes until this date. Default is 30 days from now.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Review & Submit</h3>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">RFQ Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">{formData.title}</h4>
                <p className="text-gray-600 mt-1">{formData.description}</p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Category:</span>
                  <p>{categoriesData?.categories?.find((c: Category) => c.id === formData.categoryId)?.name}</p>
                </div>
                <div>
                  <span className="font-medium">Quantity:</span>
                  <p>{formData.quantity.toLocaleString()} units</p>
                </div>
                <div>
                  <span className="font-medium">Target Price:</span>
                  <p>{formData.targetPrice ? formatCurrency(parseFloat(formData.targetPrice)) : 'Not specified'}</p>
                </div>
                <div>
                  <span className="font-medium">Budget Range:</span>
                  <p>
                    {formData.budgetRange.min > 0 || formData.budgetRange.max > 0
                      ? `${formatCurrency(formData.budgetRange.min)} - ${formatCurrency(formData.budgetRange.max)}`
                      : 'Not specified'
                    }
                  </p>
                </div>
                <div>
                  <span className="font-medium">Delivery Location:</span>
                  <p>{formData.deliveryLocation}</p>
                </div>
                <div>
                  <span className="font-medium">Required Date:</span>
                  <p>{formData.requiredDeliveryDate ? format(formData.requiredDeliveryDate, "PPP") : 'Not specified'}</p>
                </div>
                <div>
                  <span className="font-medium">Payment Terms:</span>
                  <p>{formData.paymentTerms}</p>
                </div>
                <div>
                  <span className="font-medium">Expires:</span>
                  <p>{formData.expiresAt ? format(formData.expiresAt, "PPP") : 'Not set'}</p>
                </div>
              </div>

              {specificationFields.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <span className="font-medium">Specifications:</span>
                    <div className="mt-2 space-y-1">
                      {specificationFields.map((field) => (
                        <div key={field.id} className="flex justify-between text-sm">
                          <span className="font-medium">{field.key}:</span>
                          <span>{field.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="space-y-1">
                  <li>• Your RFQ will be published to relevant suppliers</li>
                  <li>• Suppliers will submit quotations based on your requirements</li>
                  <li>• You'll receive notifications when new quotes arrive</li>
                  <li>• You can compare quotes and communicate with suppliers</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Request for Quotation (RFQ)
          </CardTitle>
          
          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step >= stepNumber 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-200 text-gray-600"
                )}>
                  {step > stepNumber ? <CheckCircle className="h-4 w-4" /> : stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={cn(
                    "w-12 h-0.5 mx-2",
                    step > stepNumber ? "bg-blue-600" : "bg-gray-200"
                  )} />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-sm text-gray-600 mt-2">
            Step {step} of 4: {
              step === 1 ? 'Basic Information' :
              step === 2 ? 'Quantity & Pricing' :
              step === 3 ? 'Delivery & Terms' :
              'Review & Submit'
            }
          </div>
        </CardHeader>
        
        <CardContent>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          
          <div className="flex justify-between mt-8">
            <div>
              {step > 1 && (
                <Button variant="outline" onClick={handlePrevious}>
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              
              {step < 4 ? (
                <Button onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={createRFQMutation.isPending}
                >
                  {createRFQMutation.isPending ? 'Creating RFQ...' : 'Create RFQ'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RFQCreationForm;