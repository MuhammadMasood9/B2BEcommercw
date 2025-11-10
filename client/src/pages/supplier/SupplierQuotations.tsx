import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, Eye, CheckCircle, XCircle, Clock, Plus, Search, Edit, RefreshCw, AlertCircle, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function SupplierQuotations() {
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch supplier quotations
  const { data: quotationsResponse, isLoading } = useQuery({
    queryKey: ['/api/suppliers/quotations'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/quotations', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch quotations');
      return response.json();
    },
  });

  const quotations = quotationsResponse?.quotations || [];

  // Auto-update expired quotations
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/quotations'] });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [queryClient]);

  // Filter and search quotations
  const filteredQuotations = useMemo(() => {
    let filtered = quotations;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((q: any) => 
        q.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.buyerLastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((q: any) => q.type === typeFilter);
    }

    // Check for expired quotations and mark them
    filtered = filtered.map((q: any) => {
      const isExpired = q.validUntil && new Date(q.validUntil) < new Date() && q.status === 'pending';
      return {
        ...q,
        status: isExpired ? 'expired' : q.status
      };
    });

    return filtered;
  }, [quotations, searchQuery, typeFilter]);

  const sentQuotations = filteredQuotations.filter((q: any) => q.status === 'pending' || q.status === 'sent');
  const acceptedQuotations = filteredQuotations.filter((q: any) => q.status === 'accepted');
  const rejectedQuotations = filteredQuotations.filter((q: any) => q.status === 'rejected');
  const expiredQuotations = filteredQuotations.filter((q: any) => q.status === 'expired');

  // Edit quotation mutation
  const editQuotationMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = data.type === 'rfq' 
        ? `/api/suppliers/quotations/${data.id}`
        : `/api/suppliers/inquiry-quotations/${data.id}`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pricePerUnit: parseFloat(data.pricePerUnit),
          totalPrice: parseFloat(data.totalPrice),
          moq: parseInt(data.moq),
          leadTime: data.leadTime,
          paymentTerms: data.paymentTerms,
          validUntil: data.validUntil,
          message: data.message,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to update quotation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/quotations'] });
      toast({ title: "Success", description: "Quotation updated successfully" });
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update quotation",
        variant: "destructive" 
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'sent': return Send;
      case 'accepted': return CheckCircle;
      case 'rejected': return XCircle;
      case 'expired': return AlertCircle;
      default: return Clock;
    }
  };

  const handleEditQuotation = (quotation: any) => {
    setSelectedQuotation(quotation);
    setIsEditDialogOpen(true);
  };

  const handleResendQuotation = (quotation: any) => {
    // Extend validity and resend
    const newValidUntil = new Date();
    newValidUntil.setDate(newValidUntil.getDate() + 30);
    
    editQuotationMutation.mutate({
      ...quotation,
      validUntil: newValidUntil.toISOString(),
    });
  };

  const QuotationTable = ({ data }: { data: any[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Buyer</TableHead>
          <TableHead>Product/RFQ</TableHead>
          <TableHead>Total Amount</TableHead>
          <TableHead>Valid Until</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-gray-500">
              No quotations found
            </TableCell>
          </TableRow>
        ) : (
          data.map((quotation: any) => {
            const StatusIcon = getStatusIcon(quotation.status);
            const isExpired = quotation.status === 'expired';
            const canEdit = quotation.status === 'pending' || quotation.status === 'sent' || isExpired;
            
            return (
              <TableRow key={quotation.id}>
                <TableCell className="font-mono text-sm">#{quotation.id.substring(0, 8)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {quotation.type === 'rfq' ? 'RFQ' : 'Inquiry'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <p>{quotation.buyerName} {quotation.buyerLastName}</p>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate">{quotation.title || 'N/A'}</TableCell>
                <TableCell className="font-semibold">${parseFloat(quotation.totalPrice).toLocaleString()}</TableCell>
                <TableCell>
                  {quotation.validUntil ? (
                    <span className={isExpired ? 'text-red-600 font-medium' : ''}>
                      {new Date(quotation.validUntil).toLocaleDateString()}
                    </span>
                  ) : 'N/A'}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(quotation.status)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {quotation.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(quotation.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedQuotation(quotation);
                        setIsDetailDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canEdit && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditQuotation(quotation)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {isExpired && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResendQuotation(quotation)}
                            disabled={editQuotationMutation.isPending}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quotations</h1>
          <p className="text-muted-foreground mt-1">Manage your sent quotations</p>
        </div>
        <Link href="/supplier/quotations/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Quotation
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">{quotations.length}</p>
              </div>
              <Send className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{sentQuotations.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accepted</p>
                <p className="text-2xl font-bold">{acceptedQuotations.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{rejectedQuotations.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">
                  {quotations.length > 0 
                    ? ((acceptedQuotations.length / quotations.length) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by buyer name, product, or quotation ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="rfq">RFQ Quotes</SelectItem>
                <SelectItem value="inquiry">Inquiry Quotes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quotations List */}
      <Card>
        <CardHeader>
          <CardTitle>Quotation List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading quotations...</div>
          ) : (
            <Tabs defaultValue="all" value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList>
                <TabsTrigger value="all">All ({filteredQuotations.length})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({sentQuotations.length})</TabsTrigger>
                <TabsTrigger value="accepted">Accepted ({acceptedQuotations.length})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({rejectedQuotations.length})</TabsTrigger>
                <TabsTrigger value="expired">Expired ({expiredQuotations.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <QuotationTable data={filteredQuotations} />
              </TabsContent>
              <TabsContent value="pending">
                <QuotationTable data={sentQuotations} />
              </TabsContent>
              <TabsContent value="accepted">
                <QuotationTable data={acceptedQuotations} />
              </TabsContent>
              <TabsContent value="rejected">
                <QuotationTable data={rejectedQuotations} />
              </TabsContent>
              <TabsContent value="expired">
                <QuotationTable data={expiredQuotations} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Quotation Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quotation Details</DialogTitle>
          </DialogHeader>
          {selectedQuotation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Quotation ID</p>
                  <p className="font-mono">#{selectedQuotation.id.substring(0, 8)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <Badge variant="outline">{selectedQuotation.type === 'rfq' ? 'RFQ' : 'Inquiry'}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedQuotation.status)}>
                    {selectedQuotation.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Buyer</p>
                  <p>{selectedQuotation.buyerName} {selectedQuotation.buyerLastName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Product/RFQ</p>
                  <p>{selectedQuotation.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valid Until</p>
                  <p className={selectedQuotation.status === 'expired' ? 'text-red-600 font-medium' : ''}>
                    {selectedQuotation.validUntil 
                      ? new Date(selectedQuotation.validUntil).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">Pricing Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity (MOQ)</p>
                    <p className="font-semibold">{selectedQuotation.moq} units</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Price per Unit</p>
                    <p className="font-semibold">${parseFloat(selectedQuotation.pricePerUnit).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lead Time</p>
                    <p className="font-semibold">{selectedQuotation.leadTime || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Terms</p>
                    <p className="font-semibold">{selectedQuotation.paymentTerms || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold">Total Amount</p>
                <p className="text-2xl font-bold">${parseFloat(selectedQuotation.totalPrice).toLocaleString()}</p>
              </div>

              {selectedQuotation.message && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Message</p>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{selectedQuotation.message}</p>
                  </div>
                </div>
              )}

              {selectedQuotation.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Requirements</p>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{selectedQuotation.description}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {(selectedQuotation.status === 'pending' || selectedQuotation.status === 'sent' || selectedQuotation.status === 'expired') && (
                  <Button variant="outline" onClick={() => {
                    setIsDetailDialogOpen(false);
                    handleEditQuotation(selectedQuotation);
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Quotation Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Quotation</DialogTitle>
          </DialogHeader>
          {selectedQuotation && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                id: selectedQuotation.id,
                type: selectedQuotation.type,
                pricePerUnit: formData.get('pricePerUnit'),
                totalPrice: formData.get('totalPrice'),
                moq: formData.get('moq'),
                leadTime: formData.get('leadTime'),
                paymentTerms: formData.get('paymentTerms'),
                validUntil: formData.get('validUntil'),
                message: formData.get('message'),
              };
              editQuotationMutation.mutate(data);
            }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="moq">Minimum Order Quantity</Label>
                    <Input
                      id="moq"
                      name="moq"
                      type="number"
                      defaultValue={selectedQuotation.moq}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pricePerUnit">Price per Unit ($)</Label>
                    <Input
                      id="pricePerUnit"
                      name="pricePerUnit"
                      type="number"
                      step="0.01"
                      defaultValue={parseFloat(selectedQuotation.pricePerUnit)}
                      required
                      onChange={(e) => {
                        const moq = (document.getElementById('moq') as HTMLInputElement)?.value;
                        const total = parseFloat(e.target.value) * parseInt(moq || '0');
                        const totalInput = document.getElementById('totalPrice') as HTMLInputElement;
                        if (totalInput) totalInput.value = total.toFixed(2);
                      }}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="totalPrice">Total Price ($)</Label>
                  <Input
                    id="totalPrice"
                    name="totalPrice"
                    type="number"
                    step="0.01"
                    defaultValue={parseFloat(selectedQuotation.totalPrice)}
                    required
                    readOnly
                    className="bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="leadTime">Lead Time</Label>
                    <Input
                      id="leadTime"
                      name="leadTime"
                      placeholder="e.g., 15-20 days"
                      defaultValue={selectedQuotation.leadTime || ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="validUntil">Valid Until</Label>
                    <Input
                      id="validUntil"
                      name="validUntil"
                      type="date"
                      defaultValue={selectedQuotation.validUntil 
                        ? new Date(selectedQuotation.validUntil).toISOString().split('T')[0]
                        : ''}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Input
                    id="paymentTerms"
                    name="paymentTerms"
                    placeholder="e.g., 30% deposit, 70% before shipment"
                    defaultValue={selectedQuotation.paymentTerms || ''}
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Additional notes or terms..."
                    rows={4}
                    defaultValue={selectedQuotation.message || ''}
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editQuotationMutation.isPending}>
                  {editQuotationMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
