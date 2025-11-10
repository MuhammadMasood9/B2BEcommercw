import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Send,
  DollarSign,
  Package,
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  TrendingUp
} from "lucide-react";

interface Inquiry {
  id: string;
  productId: string;
  productName: string;
  productSlug?: string;
  productImages?: string[];
  buyerId: string;
  buyerName: string;
  buyerLastName?: string;
  buyerEmail: string;
  buyerCompany?: string;
  quantity: number;
  targetPrice?: string;
  message?: string;
  requirements?: string;
  status: 'pending' | 'replied' | 'quoted' | 'negotiating' | 'closed';
  createdAt: string;
}

interface QuotationForm {
  pricePerUnit: number;
  totalPrice: number;
  moq: number;
  leadTime: string;
  paymentTerms: string;
  validUntil: string;
  message: string;
}

export default function SupplierInquiries() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isQuotationDialogOpen, setIsQuotationDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [quotationForm, setQuotationForm] = useState<QuotationForm>({
    pricePerUnit: 0,
    totalPrice: 0,
    moq: 1,
    leadTime: "",
    paymentTerms: "",
    validUntil: "",
    message: ""
  });

  // Fetch inquiries with filters
  const { data: inquiriesData, isLoading: inquiriesLoading } = useQuery({
    queryKey: ['/api/suppliers/inquiries', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/suppliers/inquiries?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch inquiries');
      return response.json();
    },
  });

  const inquiries = inquiriesData?.inquiries || [];

  // Create quotation mutation
  const createQuotationMutation = useMutation({
    mutationFn: async (quotationData: any) => {
      const response = await fetch('/api/suppliers/inquiry-quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(quotationData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create quotation');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/inquiries'] });
      toast({ title: "Success", description: "Quotation sent successfully" });
      setIsQuotationDialogOpen(false);
      setIsDetailDialogOpen(false);
      setSelectedInquiry(null);
      resetQuotationForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'replied': return 'bg-blue-100 text-blue-800';
      case 'quoted': return 'bg-purple-100 text-purple-800';
      case 'negotiating': return 'bg-orange-100 text-orange-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'replied': return MessageSquare;
      case 'quoted': return FileText;
      case 'negotiating': return TrendingUp;
      case 'closed': return CheckCircle;
      default: return AlertCircle;
    }
  };

  const getPriorityLevel = (inquiry: Inquiry): 'high' | 'medium' | 'low' => {
    const daysSinceCreated = Math.floor(
      (new Date().getTime() - new Date(inquiry.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (inquiry.status === 'pending' && daysSinceCreated > 2) return 'high';
    if (inquiry.status === 'pending' && daysSinceCreated > 1) return 'medium';
    return 'low';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDetails = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setIsDetailDialogOpen(true);
  };

  const handleCreateQuotation = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    // Pre-fill quotation form with inquiry data
    setQuotationForm({
      pricePerUnit: inquiry.targetPrice ? parseFloat(inquiry.targetPrice) : 0,
      totalPrice: inquiry.targetPrice ? parseFloat(inquiry.targetPrice) * inquiry.quantity : 0,
      moq: inquiry.quantity,
      leadTime: "",
      paymentTerms: "",
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      message: ""
    });
    setIsQuotationDialogOpen(true);
  };

  const resetQuotationForm = () => {
    setQuotationForm({
      pricePerUnit: 0,
      totalPrice: 0,
      moq: 1,
      leadTime: "",
      paymentTerms: "",
      validUntil: "",
      message: ""
    });
  };

  const handleQuotationSubmit = () => {
    if (!selectedInquiry) return;

    if (!quotationForm.pricePerUnit || !quotationForm.moq || !quotationForm.validUntil) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const quotationData = {
      inquiryId: selectedInquiry.id,
      pricePerUnit: quotationForm.pricePerUnit,
      totalPrice: quotationForm.totalPrice,
      moq: quotationForm.moq,
      leadTime: quotationForm.leadTime || null,
      paymentTerms: quotationForm.paymentTerms || null,
      validUntil: new Date(quotationForm.validUntil).toISOString(),
      message: quotationForm.message || null,
      attachments: []
    };

    createQuotationMutation.mutate(quotationData);
  };

  const handlePriceChange = (pricePerUnit: number) => {
    setQuotationForm(prev => ({
      ...prev,
      pricePerUnit,
      totalPrice: pricePerUnit * prev.moq
    }));
  };

  const handleQuantityChange = (moq: number) => {
    setQuotationForm(prev => ({
      ...prev,
      moq,
      totalPrice: prev.pricePerUnit * moq
    }));
  };

  // Filter inquiries based on search
  const filteredInquiries = inquiries.filter((inquiry: Inquiry) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      inquiry.productName?.toLowerCase().includes(searchLower) ||
      inquiry.buyerName?.toLowerCase().includes(searchLower) ||
      inquiry.buyerEmail?.toLowerCase().includes(searchLower) ||
      inquiry.buyerCompany?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate stats
  const stats = {
    total: inquiries.length,
    pending: inquiries.filter((i: Inquiry) => i.status === 'pending').length,
    replied: inquiries.filter((i: Inquiry) => i.status === 'replied').length,
    quoted: inquiries.filter((i: Inquiry) => i.status === 'quoted').length,
    highPriority: inquiries.filter((i: Inquiry) => getPriorityLevel(i) === 'high').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inquiries</h1>
          <p className="text-muted-foreground">Manage buyer inquiries and send quotations</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Inquiries</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Replied</p>
                <p className="text-2xl font-bold">{stats.replied}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quoted</p>
                <p className="text-2xl font-bold">{stats.quoted}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold">{stats.highPriority}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Inquiry List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by product, buyer name, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="quoted">Quoted</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Inquiries Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Target Price</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiriesLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading inquiries...
                    </TableCell>
                  </TableRow>
                ) : filteredInquiries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No inquiries found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInquiries.map((inquiry: Inquiry) => {
                    const StatusIcon = getStatusIcon(inquiry.status);
                    const priority = getPriorityLevel(inquiry);
                    return (
                      <TableRow key={inquiry.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {inquiry.productImages && inquiry.productImages.length > 0 ? (
                              <img
                                src={inquiry.productImages[0]}
                                alt={inquiry.productName}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{inquiry.productName}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {inquiry.buyerName} {inquiry.buyerLastName || ''}
                            </p>
                            {inquiry.buyerCompany && (
                              <p className="text-sm text-muted-foreground">{inquiry.buyerCompany}</p>
                            )}
                            <p className="text-xs text-muted-foreground">{inquiry.buyerEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{inquiry.quantity}</span> units
                        </TableCell>
                        <TableCell>
                          {inquiry.targetPrice ? (
                            <span className="font-medium">${parseFloat(inquiry.targetPrice).toFixed(2)}</span>
                          ) : (
                            <span className="text-muted-foreground">Not specified</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(priority)}>
                            {priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon className="w-4 h-4" />
                            <Badge className={getStatusColor(inquiry.status)}>
                              {inquiry.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(inquiry.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(inquiry)}
                            >
                              View
                            </Button>
                            {inquiry.status === 'pending' || inquiry.status === 'replied' ? (
                              <Button
                                size="sm"
                                onClick={() => handleCreateQuotation(inquiry)}
                              >
                                <Send className="w-4 h-4 mr-1" />
                                Quote
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Inquiry Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-6">
              {/* Product Info */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Product Information
                </h3>
                <div className="flex gap-4">
                  {selectedInquiry.productImages && selectedInquiry.productImages.length > 0 && (
                    <img
                      src={selectedInquiry.productImages[0]}
                      alt={selectedInquiry.productName}
                      className="w-24 h-24 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-lg">{selectedInquiry.productName}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Quantity:</span>{' '}
                        <span className="font-medium">{selectedInquiry.quantity} units</span>
                      </p>
                      {selectedInquiry.targetPrice && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Target Price:</span>{' '}
                          <span className="font-medium">${parseFloat(selectedInquiry.targetPrice).toFixed(2)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Buyer Info */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Buyer Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {selectedInquiry.buyerName} {selectedInquiry.buyerLastName || ''}
                    </span>
                  </div>
                  {selectedInquiry.buyerCompany && (
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedInquiry.buyerCompany}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedInquiry.buyerEmail}</span>
                  </div>
                </div>
              </div>

              {/* Message & Requirements */}
              {(selectedInquiry.message || selectedInquiry.requirements) && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Message & Requirements
                  </h3>
                  {selectedInquiry.message && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Message:</p>
                      <p className="text-sm">{selectedInquiry.message}</p>
                    </div>
                  )}
                  {selectedInquiry.requirements && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Requirements:</p>
                      <p className="text-sm">{selectedInquiry.requirements}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Status & Date */}
              <div className="flex items-center justify-between border rounded-lg p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedInquiry.status)}>
                    {selectedInquiry.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Received</p>
                  <p className="font-medium">{new Date(selectedInquiry.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <Badge className={getPriorityColor(getPriorityLevel(selectedInquiry))}>
                    {getPriorityLevel(selectedInquiry)}
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  Close
                </Button>
                {(selectedInquiry.status === 'pending' || selectedInquiry.status === 'replied') && (
                  <Button onClick={() => {
                    setIsDetailDialogOpen(false);
                    handleCreateQuotation(selectedInquiry);
                  }}>
                    <Send className="w-4 h-4 mr-2" />
                    Send Quotation
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Quotation Dialog */}
      <Dialog open={isQuotationDialogOpen} onOpenChange={setIsQuotationDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Quotation</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4">
              {/* Inquiry Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-medium">{selectedInquiry.productName}</p>
                <p className="text-sm text-muted-foreground">
                  For: {selectedInquiry.buyerName} {selectedInquiry.buyerLastName || ''} • 
                  Requested Qty: {selectedInquiry.quantity} units
                </p>
              </div>

              {/* Quotation Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pricePerUnit">Price Per Unit *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="pricePerUnit"
                        type="number"
                        step="0.01"
                        min="0"
                        value={quotationForm.pricePerUnit || ''}
                        onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="moq">Minimum Order Quantity *</Label>
                    <Input
                      id="moq"
                      type="number"
                      min="1"
                      value={quotationForm.moq || ''}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Total Price</Label>
                  <div className="text-2xl font-bold text-green-600">
                    ${quotationForm.totalPrice.toFixed(2)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="leadTime">Lead Time</Label>
                    <Input
                      id="leadTime"
                      placeholder="e.g., 15-30 days"
                      value={quotationForm.leadTime}
                      onChange={(e) => setQuotationForm(prev => ({ ...prev, leadTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="validUntil">Valid Until *</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={quotationForm.validUntil}
                      onChange={(e) => setQuotationForm(prev => ({ ...prev, validUntil: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Input
                    id="paymentTerms"
                    placeholder="e.g., 30% deposit, 70% before shipment"
                    value={quotationForm.paymentTerms}
                    onChange={(e) => setQuotationForm(prev => ({ ...prev, paymentTerms: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="message">Additional Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Add any additional information or terms..."
                    value={quotationForm.message}
                    onChange={(e) => setQuotationForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsQuotationDialogOpen(false);
                    resetQuotationForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleQuotationSubmit}
                  disabled={createQuotationMutation.isPending}
                >
                  {createQuotationMutation.isPending ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Quotation
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
