import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Eye, Clock, CheckCircle, XCircle, Send, Package, User, Calendar, DollarSign, FileText, BarChart3, Zap, Plus, Edit, Trash2, TrendingUp, Timer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Inquiry {
  id: string;
  productId: string;
  buyerId: string;
  quantity: number;
  targetPrice?: string;
  message?: string;
  requirements?: string;
  status: 'pending' | 'replied' | 'negotiating' | 'closed';
  createdAt: string;
  productName: string;
  productImage?: string;
  productSlug: string;
  buyerName: string;
  buyerLastName?: string;
  buyerEmail: string;
  buyerCompany?: string;
  buyerCountry?: string;
  buyerPhone?: string;
  quotations: Quotation[];
}

interface Quotation {
  id: string;
  pricePerUnit: string;
  totalPrice: string;
  moq: number;
  leadTime?: string;
  paymentTerms?: string;
  validUntil?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface InquiryStats {
  pending: number;
  replied: number;
  negotiating: number;
  closed: number;
  total: number;
  responseRate: number;
  avgResponseTime: number;
  conversionRate: number;
}

interface InquiryTemplate {
  id: string;
  name: string;
  subject: string;
  message: string;
  category: string;
  isDefault: boolean;
  usageCount: number;
}

interface InquiryAnalytics {
  date: string;
  totalInquiries: number;
  respondedInquiries: number;
  convertedInquiries: number;
  avgResponseTime: number;
  responseRate: number;
  conversionRate: number;
}

export default function InquiryManagement() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState<InquiryStats>({ 
    pending: 0, replied: 0, negotiating: 0, closed: 0, total: 0,
    responseRate: 0, avgResponseTime: 0, conversionRate: 0
  });
  const [templates, setTemplates] = useState<InquiryTemplate[]>([]);
  const [analytics, setAnalytics] = useState<InquiryAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [showQuotationDialog, setShowQuotationDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<InquiryTemplate | null>(null);
  const [quotationForm, setQuotationForm] = useState({
    pricePerUnit: '',
    totalPrice: '',
    moq: '',
    leadTime: '',
    paymentTerms: '',
    validUntil: '',
    message: '',
    templateId: ''
  });
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    message: '',
    category: '',
    isDefault: false
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchInquiries();
    fetchStats();
    fetchTemplates();
    fetchAnalytics();
  }, [selectedStatus, searchTerm]);

  const fetchInquiries = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (searchTerm) params.append('search', searchTerm);
      params.append('limit', '20');

      const response = await fetch(`/api/suppliers/inquiries?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch inquiries');
      }

      const data = await response.json();
      setInquiries(data.inquiries || []);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      toast({
        title: "Error",
        description: "Failed to load inquiries",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/suppliers/inquiries/stats', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/suppliers/inquiries/templates', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/suppliers/inquiries/analytics?days=30', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleCreateQuotation = async () => {
    if (!selectedInquiry) return;

    try {
      const response = await fetch(`/api/suppliers/inquiries/${selectedInquiry.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(quotationForm)
      });

      if (!response.ok) {
        throw new Error('Failed to create quotation');
      }

      // Update template usage count if template was used
      if (quotationForm.templateId) {
        await fetch(`/api/suppliers/inquiries/templates/${quotationForm.templateId}/use`, {
          method: 'POST',
          credentials: 'include'
        });
      }

      toast({
        title: "Success",
        description: "Quotation sent successfully"
      });

      setShowQuotationDialog(false);
      setQuotationForm({
        pricePerUnit: '',
        totalPrice: '',
        moq: '',
        leadTime: '',
        paymentTerms: '',
        validUntil: '',
        message: '',
        templateId: ''
      });
      fetchInquiries();
      fetchStats();
      fetchTemplates();
    } catch (error) {
      console.error('Error creating quotation:', error);
      toast({
        title: "Error",
        description: "Failed to send quotation",
        variant: "destructive"
      });
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch('/api/suppliers/inquiries/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(templateForm)
      });

      if (!response.ok) {
        throw new Error('Failed to create template');
      }

      toast({
        title: "Success",
        description: "Template created successfully"
      });

      setShowTemplateDialog(false);
      setTemplateForm({
        name: '',
        subject: '',
        message: '',
        category: '',
        isDefault: false
      });
      fetchTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/suppliers/inquiries/templates/${templateId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      toast({
        title: "Success",
        description: "Template deleted successfully"
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive"
      });
    }
  };

  const handleUseTemplate = (template: InquiryTemplate) => {
    setQuotationForm(prev => ({
      ...prev,
      message: template.message,
      templateId: template.id
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
      replied: { label: 'Replied', variant: 'default' as const, icon: MessageSquare },
      negotiating: { label: 'Negotiating', variant: 'outline' as const, icon: MessageSquare },
      closed: { label: 'Closed', variant: 'destructive' as const, icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Replied</p>
                <p className="text-2xl font-bold text-blue-600">{stats.replied}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Negotiating</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.negotiating}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Closed</p>
                <p className="text-2xl font-bold text-green-600">{stats.closed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold text-purple-600">{stats.responseRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.avgResponseTime}h</p>
              </div>
              <Timer className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.conversionRate}%</p>
              </div>
              <Zap className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search inquiries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="negotiating">Negotiating</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              
              <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Templates
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Response Templates</DialogTitle>
                  </DialogHeader>
                  <TemplateManager 
                    templates={templates}
                    onCreateTemplate={handleCreateTemplate}
                    onDeleteTemplate={handleDeleteTemplate}
                    templateForm={templateForm}
                    setTemplateForm={setTemplateForm}
                  />
                </DialogContent>
              </Dialog>

              <Dialog open={showAnalyticsDialog} onOpenChange={setShowAnalyticsDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Inquiry Analytics</DialogTitle>
                  </DialogHeader>
                  <InquiryAnalyticsView analytics={analytics} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inquiries List */}
      <div className="space-y-4">
        {inquiries.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No inquiries found</h3>
              <p className="text-gray-600">
                {selectedStatus !== 'all' || searchTerm
                  ? 'Try adjusting your filters to see more inquiries.'
                  : 'You haven\'t received any inquiries yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          inquiries.map((inquiry) => (
            <Card key={inquiry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {inquiry.productImage && (
                          <img
                            src={inquiry.productImage}
                            alt={inquiry.productName}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">{inquiry.productName}</h3>
                          <p className="text-sm text-gray-600">
                            Quantity: {inquiry.quantity.toLocaleString()} units
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(inquiry.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>
                          {inquiry.buyerName} {inquiry.buyerLastName}
                          {inquiry.buyerCompany && ` (${inquiry.buyerCompany})`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(inquiry.createdAt)}</span>
                      </div>
                      {inquiry.targetPrice && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span>Target: {formatCurrency(inquiry.targetPrice)}</span>
                        </div>
                      )}
                      {inquiry.quotations.length > 0 && (
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                          <span>{inquiry.quotations.length} quotation(s)</span>
                        </div>
                      )}
                    </div>

                    {inquiry.message && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">{inquiry.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Inquiry Details</DialogTitle>
                        </DialogHeader>
                        <InquiryDetails inquiry={inquiry} />
                      </DialogContent>
                    </Dialog>

                    {inquiry.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedInquiry(inquiry);
                          setShowQuotationDialog(true);
                        }}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Quote
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quotation Dialog */}
      <Dialog open={showQuotationDialog} onOpenChange={setShowQuotationDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Quotation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Template Selection */}
            {templates.length > 0 && (
              <div>
                <Label>Use Template (Optional)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {templates.slice(0, 4).map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                      className="justify-start text-left h-auto p-3"
                    >
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-gray-500">Used {template.usageCount} times</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pricePerUnit">Price per Unit ($)</Label>
                <Input
                  id="pricePerUnit"
                  type="number"
                  step="0.01"
                  value={quotationForm.pricePerUnit}
                  onChange={(e) => setQuotationForm({ ...quotationForm, pricePerUnit: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="totalPrice">Total Price ($)</Label>
                <Input
                  id="totalPrice"
                  type="number"
                  step="0.01"
                  value={quotationForm.totalPrice}
                  onChange={(e) => setQuotationForm({ ...quotationForm, totalPrice: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="moq">Minimum Order Quantity</Label>
                <Input
                  id="moq"
                  type="number"
                  value={quotationForm.moq}
                  onChange={(e) => setQuotationForm({ ...quotationForm, moq: e.target.value })}
                  placeholder="1"
                />
              </div>
              <div>
                <Label htmlFor="leadTime">Lead Time</Label>
                <Input
                  id="leadTime"
                  value={quotationForm.leadTime}
                  onChange={(e) => setQuotationForm({ ...quotationForm, leadTime: e.target.value })}
                  placeholder="e.g., 15-30 days"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Input
                  id="paymentTerms"
                  value={quotationForm.paymentTerms}
                  onChange={(e) => setQuotationForm({ ...quotationForm, paymentTerms: e.target.value })}
                  placeholder="e.g., T/T, L/C"
                />
              </div>
              <div>
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={quotationForm.validUntil}
                  onChange={(e) => setQuotationForm({ ...quotationForm, validUntil: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={quotationForm.message}
                onChange={(e) => setQuotationForm({ ...quotationForm, message: e.target.value })}
                placeholder="Additional information or terms..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowQuotationDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateQuotation}>
                Send Quotation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Inquiry Details Component
function InquiryDetails({ inquiry }: { inquiry: Inquiry }) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="buyer">Buyer Info</TabsTrigger>
          <TabsTrigger value="quotations">Quotations</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Product</Label>
              <p className="font-medium">{inquiry.productName}</p>
            </div>
            <div>
              <Label>Quantity</Label>
              <p className="font-medium">{inquiry.quantity.toLocaleString()} units</p>
            </div>
            <div>
              <Label>Target Price</Label>
              <p className="font-medium">
                {inquiry.targetPrice ? `$${inquiry.targetPrice}` : 'Not specified'}
              </p>
            </div>
            <div>
              <Label>Status</Label>
              <div className="mt-1">
                {/* Status badge would go here */}
              </div>
            </div>
          </div>

          {inquiry.message && (
            <div>
              <Label>Message</Label>
              <div className="bg-gray-50 p-3 rounded-lg mt-1">
                <p className="text-sm">{inquiry.message}</p>
              </div>
            </div>
          )}

          {inquiry.requirements && (
            <div>
              <Label>Requirements</Label>
              <div className="bg-gray-50 p-3 rounded-lg mt-1">
                <p className="text-sm">{inquiry.requirements}</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="buyer" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <p className="font-medium">{inquiry.buyerName} {inquiry.buyerLastName}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p className="font-medium">{inquiry.buyerEmail}</p>
            </div>
            {inquiry.buyerCompany && (
              <div>
                <Label>Company</Label>
                <p className="font-medium">{inquiry.buyerCompany}</p>
              </div>
            )}
            {inquiry.buyerCountry && (
              <div>
                <Label>Country</Label>
                <p className="font-medium">{inquiry.buyerCountry}</p>
              </div>
            )}
            {inquiry.buyerPhone && (
              <div>
                <Label>Phone</Label>
                <p className="font-medium">{inquiry.buyerPhone}</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="quotations" className="space-y-4">
          {inquiry.quotations.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No quotations sent yet</p>
          ) : (
            <div className="space-y-4">
              {inquiry.quotations.map((quotation) => (
                <Card key={quotation.id}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label>Price per Unit</Label>
                        <p className="font-medium">${quotation.pricePerUnit}</p>
                      </div>
                      <div>
                        <Label>Total Price</Label>
                        <p className="font-medium">${quotation.totalPrice}</p>
                      </div>
                      <div>
                        <Label>MOQ</Label>
                        <p className="font-medium">{quotation.moq} units</p>
                      </div>
                      <div>
                        <Label>Lead Time</Label>
                        <p className="font-medium">{quotation.leadTime || 'Not specified'}</p>
                      </div>
                    </div>
                    {quotation.message && (
                      <div className="mt-3">
                        <Label>Message</Label>
                        <div className="bg-gray-50 p-2 rounded mt-1">
                          <p className="text-sm">{quotation.message}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Template Manager Component
function TemplateManager({ 
  templates, 
  onCreateTemplate, 
  onDeleteTemplate, 
  templateForm, 
  setTemplateForm 
}: {
  templates: InquiryTemplate[];
  onCreateTemplate: () => void;
  onDeleteTemplate: (id: string) => void;
  templateForm: any;
  setTemplateForm: (form: any) => void;
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Response Templates</h3>
        <Button onClick={() => setShowCreateForm(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="e.g., Standard Response"
                />
              </div>
              <div>
                <Label htmlFor="templateCategory">Category</Label>
                <Input
                  id="templateCategory"
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                  placeholder="e.g., General, Pricing"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="templateSubject">Subject</Label>
              <Input
                id="templateSubject"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                placeholder="Response subject"
              />
            </div>
            <div>
              <Label htmlFor="templateMessage">Message</Label>
              <Textarea
                id="templateMessage"
                value={templateForm.message}
                onChange={(e) => setTemplateForm({ ...templateForm, message: e.target.value })}
                placeholder="Template message content..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                onCreateTemplate();
                setShowCreateForm(false);
              }}>
                Create Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{template.name}</h4>
                    {template.isDefault && (
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">{template.category}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{template.subject}</p>
                  <p className="text-sm text-gray-700 line-clamp-2">{template.message}</p>
                  <p className="text-xs text-gray-500 mt-2">Used {template.usageCount} times</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteTemplate(template.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Inquiry Analytics View Component
function InquiryAnalyticsView({ analytics }: { analytics: InquiryAnalytics[] }) {
  const totalInquiries = analytics.reduce((sum, day) => sum + day.totalInquiries, 0);
  const totalResponded = analytics.reduce((sum, day) => sum + day.respondedInquiries, 0);
  const totalConverted = analytics.reduce((sum, day) => sum + day.convertedInquiries, 0);
  const avgResponseTime = analytics.length > 0 
    ? analytics.reduce((sum, day) => sum + day.avgResponseTime, 0) / analytics.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalInquiries}</div>
            <div className="text-sm text-gray-600">Total Inquiries</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{totalResponded}</div>
            <div className="text-sm text-gray-600">Responded</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{totalConverted}</div>
            <div className="text-sm text-gray-600">Converted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{avgResponseTime.toFixed(1)}h</div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Performance (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.slice(-7).map((day, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium">
                    {new Date(day.date).toLocaleDateString()}
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-blue-600">{day.totalInquiries} inquiries</span>
                    <span className="text-green-600">{day.respondedInquiries} responded</span>
                    <span className="text-purple-600">{day.convertedInquiries} converted</span>
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-600">{day.responseRate}% response rate</span>
                  <span className="text-gray-600">{day.avgResponseTime}h avg time</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}