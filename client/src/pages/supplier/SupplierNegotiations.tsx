import { useState, useMemo } from "react";
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
import { MessageSquare, Eye, CheckCircle, XCircle, Clock, Search, Send, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function SupplierNegotiations() {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCounterOfferDialogOpen, setIsCounterOfferDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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

  // Filter quotations
  const filteredQuotations = useMemo(() => {
    let filtered = quotations;

    if (searchQuery) {
      filtered = filtered.filter((q: any) => 
        q.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((q: any) => q.status === statusFilter);
    }

    return filtered;
  }, [quotations, searchQuery, statusFilter]);

  const pendingNegotiations = filteredQuotations.filter((q: any) => q.status === 'pending' || q.status === 'sent');
  const acceptedNegotiations = filteredQuotations.filter((q: any) => q.status === 'accepted');
  const rejectedNegotiations = filteredQuotations.filter((q: any) => q.status === 'rejected');

  // Counter offer mutation
  const counterOfferMutation = useMutation({
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
      
      if (!response.ok) throw new Error('Failed to send counter offer');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/quotations'] });
      toast({ title: "Success", description: "Counter offer sent successfully" });
      setIsCounterOfferDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to send counter offer",
        variant: "destructive" 
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'sent': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'negotiating': return 'bg-brand-orange-100 text-brand-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'sent': return Clock;
      case 'accepted': return CheckCircle;
      case 'rejected': return XCircle;
      case 'negotiating': return MessageSquare;
      default: return AlertCircle;
    }
  };

  const handleCounterOffer = (item: any) => {
    setSelectedItem(item);
    setIsCounterOfferDialogOpen(true);
  };

  const NegotiationTable = ({ data }: { data: any[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Buyer</TableHead>
          <TableHead>Product/RFQ</TableHead>
          <TableHead>Buyer's Target</TableHead>
          <TableHead>Your Quote</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-gray-500">
              No negotiations found
            </TableCell>
          </TableRow>
        ) : (
          data.map((item: any) => {
            const StatusIcon = getStatusIcon(item.status);
            const canNegotiate = item.status === 'pending' || item.status === 'sent';
            
            return (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm">#{item.id.substring(0, 8)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {item.type === 'rfq' ? 'RFQ' : 'Inquiry'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{item.buyerName} {item.buyerLastName}</p>
                    <p className="text-xs text-gray-500">{item.buyerCompany || 'N/A'}</p>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate">{item.title || 'N/A'}</TableCell>
                <TableCell>
                  {item.targetPrice ? (
                    <div>
                      <p className="font-semibold text-brand-orange-600">${parseFloat(item.targetPrice).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">per unit</p>
                    </div>
                  ) : (
                    <span className="text-gray-400">Not specified</span>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-semibold">${parseFloat(item.pricePerUnit).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Total: ${parseFloat(item.totalPrice).toLocaleString()}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(item.status)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedItem(item);
                        setIsDetailDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canNegotiate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCounterOffer(item)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
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

  const calculatePriceDifference = (targetPrice: string | null, quotedPrice: string) => {
    if (!targetPrice) return null;
    const target = parseFloat(targetPrice);
    const quoted = parseFloat(quotedPrice);
    const diff = ((quoted - target) / target) * 100;
    return diff;
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Negotiations</h1>
          <p className="text-muted-foreground mt-1">Manage quotation negotiations with buyers</p>
        </div>
        <Link href="/supplier/quotations">
          <Button variant="outline">
            View All Quotations
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Negotiations</p>
                <p className="text-2xl font-bold">{pendingNegotiations.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-brand-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accepted</p>
                <p className="text-2xl font-bold">{acceptedNegotiations.length}</p>
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
                <p className="text-2xl font-bold">{rejectedNegotiations.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">
                  {quotations.length > 0 
                    ? ((acceptedNegotiations.length / quotations.length) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by buyer name, product, or quotation ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Negotiations List */}
      <Card>
        <CardHeader>
          <CardTitle>Negotiation List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading negotiations...</div>
          ) : (
            <Tabs defaultValue="all" value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="inline-flex h-12 items-center justify-start rounded-lg bg-gray-100 p-1 w-full">
                <TabsTrigger 
                  value="all"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-brand-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-gray-200 data-[state=active]:hover:bg-brand-orange-600"
                >
                  All ({filteredQuotations.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="pending"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-brand-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-gray-200 data-[state=active]:hover:bg-brand-orange-600"
                >
                  Active ({pendingNegotiations.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="accepted"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-brand-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-gray-200 data-[state=active]:hover:bg-brand-orange-600"
                >
                  Accepted ({acceptedNegotiations.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="rejected"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-brand-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-gray-200 data-[state=active]:hover:bg-brand-orange-600"
                >
                  Rejected ({rejectedNegotiations.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <NegotiationTable data={filteredQuotations} />
              </TabsContent>
              <TabsContent value="pending">
                <NegotiationTable data={pendingNegotiations} />
              </TabsContent>
              <TabsContent value="accepted">
                <NegotiationTable data={acceptedNegotiations} />
              </TabsContent>
              <TabsContent value="rejected">
                <NegotiationTable data={rejectedNegotiations} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Negotiation Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Quotation ID</p>
                  <p className="font-mono">#{selectedItem.id.substring(0, 8)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <Badge variant="outline">{selectedItem.type === 'rfq' ? 'RFQ' : 'Inquiry'}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedItem.status)}>
                    {selectedItem.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Buyer</p>
                  <p>{selectedItem.buyerName} {selectedItem.buyerLastName}</p>
                  <p className="text-xs text-gray-500">{selectedItem.buyerCompany || 'N/A'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">Product/RFQ Details</p>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-semibold">{selectedItem.title}</p>
                  {selectedItem.description && (
                    <p className="text-sm text-gray-600 mt-2">{selectedItem.description}</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">Price Comparison</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-brand-orange-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Buyer's Target Price</p>
                    <p className="text-2xl font-bold text-brand-orange-600">
                      {selectedItem.targetPrice 
                        ? `$${parseFloat(selectedItem.targetPrice).toFixed(2)}`
                        : 'Not specified'}
                    </p>
                    <p className="text-xs text-gray-500">per unit</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Your Quoted Price</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${parseFloat(selectedItem.pricePerUnit).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">per unit</p>
                  </div>
                </div>
                {selectedItem.targetPrice && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">
                      Price difference: 
                      <span className={`font-semibold ml-2 ${
                        calculatePriceDifference(selectedItem.targetPrice, selectedItem.pricePerUnit)! > 0 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {calculatePriceDifference(selectedItem.targetPrice, selectedItem.pricePerUnit)?.toFixed(1)}%
                        {calculatePriceDifference(selectedItem.targetPrice, selectedItem.pricePerUnit)! > 0 ? ' higher' : ' lower'}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">Quotation Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity (MOQ)</p>
                    <p className="font-semibold">{selectedItem.moq} units</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Price</p>
                    <p className="font-semibold">${parseFloat(selectedItem.totalPrice).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lead Time</p>
                    <p className="font-semibold">{selectedItem.leadTime || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Terms</p>
                    <p className="font-semibold">{selectedItem.paymentTerms || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valid Until</p>
                    <p className="font-semibold">
                      {selectedItem.validUntil 
                        ? new Date(selectedItem.validUntil).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {selectedItem.message && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Your Message</p>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{selectedItem.message}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {(selectedItem.status === 'pending' || selectedItem.status === 'sent') && (
                  <Button onClick={() => {
                    setIsDetailDialogOpen(false);
                    handleCounterOffer(selectedItem);
                  }}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Counter Offer
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

      {/* Counter Offer Dialog */}
      <Dialog open={isCounterOfferDialogOpen} onOpenChange={setIsCounterOfferDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Counter Offer</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const validUntilDate = formData.get('validUntil') as string;
              
              // Convert date to ISO datetime string
              const validUntilISO = validUntilDate 
                ? new Date(validUntilDate + 'T23:59:59.999Z').toISOString()
                : null;
              
              const data = {
                id: selectedItem.id,
                type: selectedItem.type,
                pricePerUnit: formData.get('pricePerUnit'),
                totalPrice: formData.get('totalPrice'),
                moq: formData.get('moq'),
                leadTime: formData.get('leadTime'),
                paymentTerms: formData.get('paymentTerms'),
                validUntil: validUntilISO,
                message: formData.get('message'),
              };
              counterOfferMutation.mutate(data);
            }}>
              <div className="space-y-4">
                {selectedItem.targetPrice && (
                  <div className="p-4 bg-brand-orange-50 rounded-lg">
                    <p className="text-sm font-medium">Buyer's Target Price</p>
                    <p className="text-xl font-bold text-brand-orange-600">
                      ${parseFloat(selectedItem.targetPrice).toFixed(2)} per unit
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="moq">Minimum Order Quantity</Label>
                    <Input
                      id="moq"
                      name="moq"
                      type="number"
                      defaultValue={selectedItem.moq}
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
                      defaultValue={parseFloat(selectedItem.pricePerUnit)}
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
                    defaultValue={parseFloat(selectedItem.totalPrice)}
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
                      defaultValue={selectedItem.leadTime || ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="validUntil">Valid Until</Label>
                    <Input
                      id="validUntil"
                      name="validUntil"
                      type="date"
                      defaultValue={selectedItem.validUntil 
                        ? new Date(selectedItem.validUntil).toISOString().split('T')[0]
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
                    defaultValue={selectedItem.paymentTerms || ''}
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message to Buyer</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Explain your counter offer, highlight value propositions..."
                    rows={4}
                    defaultValue={selectedItem.message || ''}
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsCounterOfferDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={counterOfferMutation.isPending}>
                  <Send className="h-4 w-4 mr-2" />
                  {counterOfferMutation.isPending ? "Sending..." : "Send Counter Offer"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
