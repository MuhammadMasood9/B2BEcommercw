import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Eye, Send, Clock, CheckCircle, Search, Filter, MapPin, Calendar, Package, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function SupplierRFQs() {
  const [selectedRFQ, setSelectedRFQ] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isQuotationDialogOpen, setIsQuotationDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Quotation form state
  const [quotationForm, setQuotationForm] = useState({
    pricePerUnit: "",
    moq: "",
    leadTime: "",
    paymentTerms: "",
    validUntil: "",
    message: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch supplier RFQs
  const { data: rfqsResponse, isLoading } = useQuery({
    queryKey: ['/api/suppliers/rfqs'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/rfqs', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch RFQs');
      const data = await response.json();
      return data;
    },
  });

  const rfqs = rfqsResponse?.rfqs || [];

  // Extract unique categories and locations for filters
  const categories = useMemo(() => {
    const cats = new Set(rfqs.map((r: any) => r.categoryName).filter(Boolean));
    return Array.from(cats);
  }, [rfqs]);

  const locations = useMemo(() => {
    const locs = new Set(rfqs.map((r: any) => r.deliveryLocation).filter(Boolean));
    return Array.from(locs);
  }, [rfqs]);

  // Filter and search RFQs
  const filteredRFQs = useMemo(() => {
    return rfqs.filter((rfq: any) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        rfq.title?.toLowerCase().includes(searchLower) ||
        rfq.description?.toLowerCase().includes(searchLower) ||
        rfq.buyerName?.toLowerCase().includes(searchLower);

      // Category filter
      const matchesCategory = categoryFilter === "all" || rfq.categoryName === categoryFilter;

      // Location filter
      const matchesLocation = locationFilter === "all" || rfq.deliveryLocation === locationFilter;

      // Status filter
      const matchesStatus = statusFilter === "all" || rfq.status === statusFilter;

      return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
    });
  }, [rfqs, searchQuery, categoryFilter, locationFilter, statusFilter]);

  const openRFQs = filteredRFQs.filter((r: any) => r.status === 'open');
  const closedRFQs = filteredRFQs.filter((r: any) => r.status === 'closed');

  const getStatusColor = (status: string) => {
    return status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  // Submit quotation mutation
  const submitQuotationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/suppliers/rfqs/${selectedRFQ.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit quotation');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your quotation has been submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/rfqs'] });
      setIsQuotationDialogOpen(false);
      setIsDetailDialogOpen(false);
      setQuotationForm({
        pricePerUnit: "",
        moq: "",
        leadTime: "",
        paymentTerms: "",
        validUntil: "",
        message: ""
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitQuotation = () => {
    const pricePerUnit = parseFloat(quotationForm.pricePerUnit);
    const moq = parseInt(quotationForm.moq);
    const quantity = selectedRFQ.quantity || moq;
    const totalPrice = pricePerUnit * quantity;

    if (!pricePerUnit || !moq) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    submitQuotationMutation.mutate({
      pricePerUnit,
      totalPrice,
      moq,
      leadTime: quotationForm.leadTime || undefined,
      paymentTerms: quotationForm.paymentTerms || undefined,
      validUntil: quotationForm.validUntil ? new Date(quotationForm.validUntil).toISOString() : undefined,
      message: quotationForm.message || undefined,
    });
  };

  const openQuotationDialog = (rfq: any) => {
    setSelectedRFQ(rfq);
    setQuotationForm({
      pricePerUnit: rfq.targetPrice || "",
      moq: rfq.quantity?.toString() || "",
      leadTime: "",
      paymentTerms: "",
      validUntil: "",
      message: ""
    });
    setIsQuotationDialogOpen(true);
  };

  const RFQTable = ({ data }: { data: any[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title & Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Buyer</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Target Price</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Expected Date</TableHead>
          <TableHead>Responses</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={10} className="text-center py-8 text-gray-500">
              No RFQs found
            </TableCell>
          </TableRow>
        ) : (
          data.map((rfq: any) => (
            <TableRow key={rfq.id} className="hover:bg-gray-50">
              <TableCell className="max-w-xs">
                <div>
                  <p className="font-medium text-sm">{rfq.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {rfq.description?.substring(0, 80)}...
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {rfq.categoryName || 'N/A'}
                </Badge>
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm font-medium">{rfq.buyerName} {rfq.buyerLastName}</p>
                  <p className="text-xs text-muted-foreground">{rfq.buyerEmail}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Package className="h-3 w-3 text-gray-400" />
                  <span className="text-sm">{rfq.quantity?.toLocaleString()}</span>
                </div>
              </TableCell>
              <TableCell>
                {rfq.targetPrice ? (
                  <span className="text-sm font-medium">${parseFloat(rfq.targetPrice).toFixed(2)}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Not specified</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span className="text-xs">{rfq.deliveryLocation || 'N/A'}</span>
                </div>
              </TableCell>
              <TableCell>
                {rfq.expectedDate ? (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-xs">{new Date(rfq.expectedDate).toLocaleDateString()}</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">N/A</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {rfq.quotationsCount || 0} quotes
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(rfq.status)}>
                  {rfq.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedRFQ(rfq);
                    setIsDetailDialogOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                {rfq.status === 'open' && (
                  <Button
                    size="sm"
                    onClick={() => openQuotationDialog(rfq)}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Quote
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">RFQs (Request for Quotations)</h1>
          <p className="text-muted-foreground mt-1">View and respond to buyer RFQs</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total RFQs</p>
                <p className="text-2xl font-bold">{rfqs.length}</p>
              </div>
              <FileText className="h-8 w-8 text-brand-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open RFQs</p>
                <p className="text-2xl font-bold">{openRFQs.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Closed RFQs</p>
                <p className="text-2xl font-bold">{closedRFQs.length}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Filtered Results</p>
                <p className="text-2xl font-bold">{filteredRFQs.length}</p>
              </div>
              <Filter className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search RFQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat: any) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((loc: any) => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* RFQs List */}
      <Card>
        <CardHeader>
          <CardTitle>RFQ List ({filteredRFQs.length} results)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading RFQs...</div>
          ) : (
            <Tabs defaultValue="all" onValueChange={(value) => setStatusFilter(value === "all" ? "all" : value)}>
              <TabsList className="inline-flex h-12 items-center justify-start rounded-lg bg-gray-100 p-1 w-full">
                <TabsTrigger 
                  value="all"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-brand-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-gray-200 data-[state=active]:hover:bg-brand-orange-600"
                >
                  All ({filteredRFQs.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="open"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-brand-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-gray-200 data-[state=active]:hover:bg-brand-orange-600"
                >
                  Open ({openRFQs.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="closed"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-brand-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-gray-200 data-[state=active]:hover:bg-brand-orange-600"
                >
                  Closed ({closedRFQs.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <RFQTable data={filteredRFQs} />
              </TabsContent>
              <TabsContent value="open">
                <RFQTable data={openRFQs} />
              </TabsContent>
              <TabsContent value="closed">
                <RFQTable data={closedRFQs} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* RFQ Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>RFQ Details</DialogTitle>
          </DialogHeader>
          {selectedRFQ && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedRFQ.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Posted on {new Date(selectedRFQ.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge className={getStatusColor(selectedRFQ.status)}>
                  {selectedRFQ.status}
                </Badge>
              </div>

              {/* Key Information Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Category</p>
                  <p className="text-sm font-medium">{selectedRFQ.categoryName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Quantity Required</p>
                  <p className="text-sm font-medium">{selectedRFQ.quantity?.toLocaleString()} units</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Target Price</p>
                  <p className="text-sm font-medium">
                    {selectedRFQ.targetPrice ? `$${parseFloat(selectedRFQ.targetPrice).toFixed(2)}` : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Delivery Location</p>
                  <p className="text-sm font-medium">{selectedRFQ.deliveryLocation || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Expected Date</p>
                  <p className="text-sm font-medium">
                    {selectedRFQ.expectedDate ? new Date(selectedRFQ.expectedDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Expires At</p>
                  <p className="text-sm font-medium">
                    {selectedRFQ.expiresAt ? new Date(selectedRFQ.expiresAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Buyer Information */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Buyer Information</h4>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium">{selectedRFQ.buyerName} {selectedRFQ.buyerLastName}</p>
                  <p className="text-sm text-muted-foreground">{selectedRFQ.buyerEmail}</p>
                  {selectedRFQ.buyerCompany && (
                    <p className="text-sm text-muted-foreground">{selectedRFQ.buyerCompany}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Description & Requirements</h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedRFQ.description}</p>
                </div>
              </div>

              {/* Product Info (if linked to product) */}
              {selectedRFQ.productName && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Related Product</h4>
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium">{selectedRFQ.productName}</p>
                    <Link href={`/products/${selectedRFQ.productSlug}`}>
                      <Button variant="ghost" size="sm" className="p-0 h-auto text-brand-orange-600 hover:text-brand-orange-800">
                        View Product Details
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedRFQ.attachments && selectedRFQ.attachments.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Attachments</h4>
                  <div className="space-y-2">
                    {selectedRFQ.attachments.map((attachment: string, index: number) => (
                      <a
                        key={index}
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">Attachment {index + 1}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Response Status */}
              <div className="p-4 bg-brand-orange-50 border border-brand-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-orange-900">Quotations Submitted</p>
                    <p className="text-xs text-brand-orange-700 mt-1">
                      {selectedRFQ.quotationsCount || 0} supplier(s) have responded to this RFQ
                    </p>
                  </div>
                  <Badge variant="secondary">{selectedRFQ.quotationsCount || 0}</Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  Close
                </Button>
                {selectedRFQ.status === 'open' && (
                  <Button onClick={() => {
                    setIsDetailDialogOpen(false);
                    openQuotationDialog(selectedRFQ);
                  }}>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Quotation
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quotation Submission Dialog */}
      <Dialog open={isQuotationDialogOpen} onOpenChange={setIsQuotationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Quotation</DialogTitle>
            <DialogDescription>
              Provide your pricing and terms for this RFQ
            </DialogDescription>
          </DialogHeader>
          {selectedRFQ && (
            <div className="space-y-4">
              {/* RFQ Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">{selectedRFQ.title}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Quantity:</span>{" "}
                    <span className="font-medium">{selectedRFQ.quantity?.toLocaleString()} units</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Target Price:</span>{" "}
                    <span className="font-medium">
                      {selectedRFQ.targetPrice ? `$${parseFloat(selectedRFQ.targetPrice).toFixed(2)}` : 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quotation Form */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricePerUnit">
                    Price Per Unit <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pricePerUnit"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={quotationForm.pricePerUnit}
                    onChange={(e) => setQuotationForm({ ...quotationForm, pricePerUnit: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="moq">
                    Minimum Order Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="moq"
                    type="number"
                    placeholder="0"
                    value={quotationForm.moq}
                    onChange={(e) => setQuotationForm({ ...quotationForm, moq: e.target.value })}
                  />
                </div>
              </div>

              {/* Calculated Total */}
              {quotationForm.pricePerUnit && quotationForm.moq && (
                <div className="p-3 bg-brand-orange-50 border border-brand-orange-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-brand-orange-900">Estimated Total Price:</span>
                    <span className="text-lg font-bold text-brand-orange-900">
                      ${(parseFloat(quotationForm.pricePerUnit) * (selectedRFQ.quantity || parseInt(quotationForm.moq))).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-brand-orange-700 mt-1">
                    Based on {selectedRFQ.quantity || quotationForm.moq} units
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leadTime">Lead Time</Label>
                  <Input
                    id="leadTime"
                    placeholder="e.g., 15-30 days"
                    value={quotationForm.leadTime}
                    onChange={(e) => setQuotationForm({ ...quotationForm, leadTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Input
                    id="paymentTerms"
                    placeholder="e.g., 30% deposit, 70% before shipment"
                    value={quotationForm.paymentTerms}
                    onChange={(e) => setQuotationForm({ ...quotationForm, paymentTerms: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={quotationForm.validUntil}
                  onChange={(e) => setQuotationForm({ ...quotationForm, validUntil: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Additional Message</Label>
                <Textarea
                  id="message"
                  placeholder="Add any additional information or terms..."
                  rows={4}
                  value={quotationForm.message}
                  onChange={(e) => setQuotationForm({ ...quotationForm, message: e.target.value })}
                />
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-xs text-yellow-800">
                  <p className="font-medium">Please review carefully</p>
                  <p>Once submitted, you cannot modify this quotation. Make sure all details are correct.</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsQuotationDialogOpen(false)}
                  disabled={submitQuotationMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitQuotation}
                  disabled={submitQuotationMutation.isPending}
                >
                  {submitQuotationMutation.isPending ? (
                    <>Submitting...</>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Quotation
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
