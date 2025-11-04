import React, { useState } from 'react';
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
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Star, 
  FileText, 
  DollarSign, 
  Package, 
  Clock,
  Search,
  Filter,
  BarChart3
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
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface TemplateFormData {
  name: string;
  category: string;
  unitPrice: string;
  moq: number;
  leadTime: string;
  paymentTerms: string;
  validityPeriod: number;
  termsConditions: string;
  isDefault: boolean;
}

const QuotationTemplateManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuotationTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<TemplateFormData>({
    name: '',
    category: '',
    unitPrice: '',
    moq: 1,
    leadTime: '',
    paymentTerms: '',
    validityPeriod: 30,
    termsConditions: '',
    isDefault: false
  });

  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['quotation-templates', searchTerm, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter) params.append('category', categoryFilter);
      
      const response = await fetch(`/api/suppliers/quotation-templates?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    }
  });

  // Fetch template analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['template-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/quotation-templates/analytics', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  });

  // Create/Update template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async ({ templateData, isEdit }: { templateData: TemplateFormData; isEdit: boolean }) => {
      const url = isEdit 
        ? `/api/suppliers/quotation-templates/${editingTemplate?.id}`
        : '/api/suppliers/quotation-templates';
      
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
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
        description: editingTemplate ? "Template updated successfully" : "Template created successfully"
      });
      setShowCreateDialog(false);
      setEditingTemplate(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['quotation-templates'] });
      queryClient.invalidateQueries({ queryKey: ['template-analytics'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await fetch(`/api/suppliers/quotation-templates/${templateId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete template');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['quotation-templates'] });
      queryClient.invalidateQueries({ queryKey: ['template-analytics'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Duplicate template mutation
  const duplicateTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await fetch(`/api/suppliers/quotation-templates/${templateId}/duplicate`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to duplicate template');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template duplicated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['quotation-templates'] });
    }
  });

  // Set as default mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await fetch(`/api/suppliers/quotation-templates/${templateId}/set-default`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to set default template');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Default template updated"
      });
      queryClient.invalidateQueries({ queryKey: ['quotation-templates'] });
    }
  });

  const resetForm = () => {
    setTemplateForm({
      name: '',
      category: '',
      unitPrice: '',
      moq: 1,
      leadTime: '',
      paymentTerms: '',
      validityPeriod: 30,
      termsConditions: '',
      isDefault: false
    });
  };

  const handleEdit = (template: QuotationTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      category: template.category,
      unitPrice: template.unitPrice,
      moq: template.moq,
      leadTime: template.leadTime,
      paymentTerms: template.paymentTerms,
      validityPeriod: template.validityPeriod,
      termsConditions: template.termsConditions,
      isDefault: template.isDefault
    });
    setShowCreateDialog(true);
  };

  const handleDelete = (template: QuotationTemplate) => {
    if (confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      deleteTemplateMutation.mutate(template.id);
    }
  };

  const handleDuplicate = (template: QuotationTemplate) => {
    duplicateTemplateMutation.mutate(template.id);
  };

  const handleSetDefault = (template: QuotationTemplate) => {
    setDefaultMutation.mutate(template.id);
  };

  const handleSubmit = () => {
    if (!templateForm.name || !templateForm.unitPrice || !templateForm.leadTime || !templateForm.paymentTerms) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    saveTemplateMutation.mutate({
      templateData: templateForm,
      isEdit: !!editingTemplate
    });
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const categories = templatesData?.success 
    ? Array.from(new Set(templatesData.templates.map((t: QuotationTemplate) => t.category).filter(Boolean)))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quotation Templates</h1>
          <p className="text-gray-600">Manage reusable quotation templates for faster responses</p>
        </div>
        <Button onClick={() => {
          setEditingTemplate(null);
          resetForm();
          setShowCreateDialog(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Analytics Cards */}
      {analyticsData?.success && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Templates</p>
                  <p className="text-2xl font-bold">{analyticsData.analytics.totalTemplates}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Most Used</p>
                  <p className="text-lg font-bold truncate">{analyticsData.analytics.mostUsedTemplate}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Usage</p>
                  <p className="text-2xl font-bold">{analyticsData.analytics.totalUsage}</p>
                </div>
                <Package className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Categories</p>
                  <p className="text-2xl font-bold">{analyticsData.analytics.totalCategories}</p>
                </div>
                <Filter className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="text-center py-8">Loading templates...</div>
      ) : templatesData?.success && templatesData.templates?.length > 0 ? (
        <div className="grid gap-4">
          {templatesData.templates.map((template: QuotationTemplate) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{template.name}</h3>
                      {template.isDefault && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                      <Badge variant="secondary">{template.category}</Badge>
                      {!template.isActive && (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span>Price: {formatCurrency(template.unitPrice)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span>MOQ: {template.moq.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>Lead Time: {template.leadTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-gray-400" />
                        <span>Used: {template.usageCount} times</span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      <strong>Payment Terms:</strong> {template.paymentTerms}
                    </div>
                    
                    {template.termsConditions && (
                      <div className="text-sm text-gray-600 mt-2">
                        <strong>Terms:</strong> {template.termsConditions.substring(0, 100)}
                        {template.termsConditions.length > 100 && '...'}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {!template.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(template)}
                        disabled={setDefaultMutation.isPending}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(template)}
                      disabled={duplicateTemplateMutation.isPending}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template)}
                      disabled={deleteTemplateMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
            <p className="text-gray-600 mb-4">Create your first quotation template to speed up your responses.</p>
            <Button onClick={() => {
              setEditingTemplate(null);
              resetForm();
              setShowCreateDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateName">Template Name *</Label>
                <Input
                  id="templateName"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Standard Electronics Quote"
                />
              </div>
              <div>
                <Label htmlFor="templateCategory">Category</Label>
                <Input
                  id="templateCategory"
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Electronics, Textiles"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateUnitPrice">Unit Price (USD) *</Label>
                <Input
                  id="templateUnitPrice"
                  type="number"
                  step="0.01"
                  value={templateForm.unitPrice}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, unitPrice: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="templateMoq">Minimum Order Quantity *</Label>
                <Input
                  id="templateMoq"
                  type="number"
                  value={templateForm.moq}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, moq: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateLeadTime">Lead Time *</Label>
                <Input
                  id="templateLeadTime"
                  value={templateForm.leadTime}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, leadTime: e.target.value }))}
                  placeholder="e.g., 15-30 days"
                />
              </div>
              <div>
                <Label htmlFor="templatePaymentTerms">Payment Terms *</Label>
                <Input
                  id="templatePaymentTerms"
                  value={templateForm.paymentTerms}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, paymentTerms: e.target.value }))}
                  placeholder="e.g., T/T, L/C"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="templateValidityPeriod">Validity Period (days)</Label>
              <Input
                id="templateValidityPeriod"
                type="number"
                value={templateForm.validityPeriod}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, validityPeriod: parseInt(e.target.value) || 30 }))}
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="templateTermsConditions">Terms & Conditions</Label>
              <Textarea
                id="templateTermsConditions"
                value={templateForm.termsConditions}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, termsConditions: e.target.value }))}
                placeholder="Standard terms and conditions..."
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="templateIsDefault"
                checked={templateForm.isDefault}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, isDefault: e.target.checked }))}
              />
              <Label htmlFor="templateIsDefault">Set as default template</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={saveTemplateMutation.isPending}
              >
                {saveTemplateMutation.isPending 
                  ? (editingTemplate ? 'Updating...' : 'Creating...') 
                  : (editingTemplate ? 'Update Template' : 'Create Template')
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotationTemplateManager;