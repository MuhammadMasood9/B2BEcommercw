import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  Package,
  Truck,
  CreditCard,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  MessageSquare,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Loader2,
  AlertCircle,
  Check,
  X
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

export default function QuotationDetail() {
  const [, params] = useRoute("/quotation/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Fetch quotation details
  const { data: quotation, isLoading, error } = useQuery({
    queryKey: ['quotation', params?.id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/buyer/quotations/${params?.id}`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch quotation');
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching quotation:', error);
        throw error;
      }
    },
    enabled: !!params?.id
  });

  // Accept quotation mutation
  const acceptQuotationMutation = useMutation({
    mutationFn: async (quotationId: string) => {
      const response = await fetch(`/api/quotations/${quotationId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to accept quotation');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Quotation accepted successfully!');
      queryClient.invalidateQueries({ queryKey: ['quotation', params?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/buyer/quotations'] });
    },
    onError: () => {
      toast.error('Failed to accept quotation');
    }
  });

  // Reject quotation mutation
  const rejectQuotationMutation = useMutation({
    mutationFn: async ({ quotationId, reason }: { quotationId: string; reason: string }) => {
      const response = await fetch(`/api/quotations/${quotationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });
      if (!response.ok) throw new Error('Failed to reject quotation');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Quotation rejected');
      setIsRejectDialogOpen(false);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ['quotation', params?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/buyer/quotations'] });
    },
    onError: () => {
      toast.error('Failed to reject quotation');
    }
  });

  const handleAccept = () => {
    if (quotation?.id) {
      acceptQuotationMutation.mutate(quotation.id);
    }
  };

  const handleReject = () => {
    if (quotation?.id && rejectReason.trim()) {
      rejectQuotationMutation.mutate({ quotationId: quotation.id, reason: rejectReason });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'expired': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading quotation details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Quotation Not Found</h2>
            <p className="text-gray-600 mb-4">The quotation you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button onClick={() => setLocation('/buyer/quotations')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Quotations
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/buyer/quotations')}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Quotations
              </Button>
              <Badge className="bg-white/20 text-white border-white/30">
                Quotation Details
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Quotation #{quotation.id.slice(0, 8)}</h1>
                <p className="text-blue-100 text-lg">{quotation.productName}</p>
              </div>
              <div className="text-right">
                <Badge className={`${getStatusColor(quotation.status)} mb-2`}>
                  {getStatusIcon(quotation.status)}
                  <span className="ml-2 capitalize">{quotation.status}</span>
                </Badge>
                <p className="text-blue-100 text-sm">
                  Created {format(new Date(quotation.createdAt), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quotation Overview */}
              <Card className="bg-white border-gray-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Quotation Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Product</label>
                      <p className="text-lg font-semibold">{quotation.productName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Quantity</label>
                      <p className="text-lg font-semibold">{(quotation.inquiryQuantity ?? 0).toLocaleString()} units</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Unit Price</label>
                      <p className="text-lg font-semibold">${quotation.pricePerUnit ?? 0}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Total Amount</label>
                      <p className="text-lg font-semibold text-green-600">${(quotation.totalPrice ?? 0).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Lead Time</label>
                      <p className="text-lg font-semibold">{quotation.leadTime || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Payment Terms</label>
                      <p className="text-lg font-semibold">{quotation.paymentTerms || 'Not specified'}</p>
                    </div>
                  </div>

                  {quotation.validUntil && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Valid Until</label>
                      <p className="text-lg font-semibold">{format(new Date(quotation.validUntil), 'MMM dd, yyyy')}</p>
                    </div>
                  )}

                  {quotation.message && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Message</label>
                      <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{quotation.message}</p>
                    </div>
                  )}

                  {quotation.attachments && quotation.attachments.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Attachments</label>
                      <div className="space-y-2">
                        {quotation.attachments.map((attachment: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{attachment}</span>
                            <Button size="sm" variant="outline">
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Admin Information */}
              <Card className="bg-white border-gray-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-600" />
                    Admin Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Admin Name</label>
                      <p className="text-lg font-semibold">{quotation.supplierName || 'Admin Supplier'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Country</label>
                      <p className="text-lg font-semibold">{quotation.supplierCountry || 'USA'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              <Card className="bg-white border-gray-100 shadow-lg">
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {quotation.status === 'pending' && (
                    <>
                      <Button 
                        onClick={() => setIsAcceptDialogOpen(true)}
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={acceptQuotationMutation.isPending}
                      >
                        {acceptQuotationMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Accept Quotation
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setIsRejectDialogOpen(true)}
                        className="w-full border-red-200 text-red-600 hover:bg-red-50"
                        disabled={rejectQuotationMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Quotation
                      </Button>
                    </>
                  )}
                  
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact Admin
                  </Button>
                </CardContent>
              </Card>

              {/* Status Information */}
              <Card className="bg-white border-gray-100 shadow-lg">
                <CardHeader>
                  <CardTitle>Status Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <Badge className={getStatusColor(quotation.status)}>
                      {getStatusIcon(quotation.status)}
                      <span className="ml-2 capitalize">{quotation.status}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm font-medium">{format(new Date(quotation.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                  {quotation.validUntil && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Valid Until</span>
                      <span className="text-sm font-medium">{format(new Date(quotation.validUntil), 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Accept Dialog */}
      <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Quotation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to accept this quotation? This action will create an order and notify the admin.
            </p>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Total Amount:</strong> ${(quotation?.totalPrice ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAcceptDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAccept} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Accept Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Quotation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Please provide a reason for rejecting this quotation. This will help the admin improve their future quotations.
            </p>
            <div>
              <Label htmlFor="reject-reason">Reason for Rejection</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter your reason for rejecting this quotation..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReject} 
              className="bg-red-600 hover:bg-red-700"
              disabled={!rejectReason.trim()}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
