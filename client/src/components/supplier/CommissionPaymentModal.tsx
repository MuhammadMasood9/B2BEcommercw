import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface UnpaidCommission {
  id: string;
  orderId: string;
  orderNumber: string;
  orderAmount: string;
  commissionRate: string;
  commissionAmount: string;
  status: string;
  createdAt: string;
}

interface CommissionPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unpaidCommissions: UnpaidCommission[];
}

export function CommissionPaymentModal({ 
  open, 
  onOpenChange, 
  unpaidCommissions 
}: CommissionPaymentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [transactionReference, setTransactionReference] = useState("");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch("/api/upload/payment-proof", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload file");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setPaymentProofUrl(data.url);
      toast({ title: "Success", description: "Payment proof uploaded successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setPaymentProofFile(null);
    },
  });

  // Submit payment mutation
  const submitPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/commissions/supplier/payments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit payment");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commissions/supplier/unpaid-commissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/commissions/supplier/credit-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/commissions/supplier/commissions"] });
      toast({ 
        title: "Success", 
        description: "Payment submitted successfully for admin verification" 
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({ 
        title: "Error", 
        description: "Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP) or PDF file.", 
        variant: "destructive" 
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ 
        title: "Error", 
        description: "File size must be less than 5MB", 
        variant: "destructive" 
      });
      return;
    }

    setPaymentProofFile(file);
    setIsUploading(true);
    
    try {
      await uploadFileMutation.mutateAsync(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setPaymentProofFile(null);
    setPaymentProofUrl("");
  };

  const toggleCommissionSelection = (commissionId: string) => {
    setSelectedCommissions(prev =>
      prev.includes(commissionId)
        ? prev.filter(id => id !== commissionId)
        : [...prev, commissionId]
    );
  };

  const calculateSelectedTotal = () => {
    return unpaidCommissions
      .filter(c => selectedCommissions.includes(c.id))
      .reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);
  };

  const handleSubmit = () => {
    // Validation
    if (selectedCommissions.length === 0) {
      toast({ 
        title: "Error", 
        description: "Please select at least one commission to pay", 
        variant: "destructive" 
      });
      return;
    }

    if (!paymentProofUrl) {
      toast({ 
        title: "Error", 
        description: "Please upload payment proof", 
        variant: "destructive" 
      });
      return;
    }

    // Submit payment
    submitPaymentMutation.mutate({
      commissionIds: selectedCommissions,
      paymentMethod,
      transactionReference: transactionReference || undefined,
      proofOfPayment: paymentProofUrl
    });
  };

  const handleClose = () => {
    setSelectedCommissions([]);
    setPaymentMethod("bank_transfer");
    setTransactionReference("");
    setPaymentProofFile(null);
    setPaymentProofUrl("");
    onOpenChange(false);
  };

  const getFileIcon = () => {
    if (!paymentProofFile) return null;
    
    if (paymentProofFile.type === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    return <ImageIcon className="h-8 w-8 text-blue-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Commission Payment</DialogTitle>
          <DialogDescription>
            Select commissions to pay and upload proof of payment for admin verification
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Total Amount Summary */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Amount:</span>
              <span className="text-2xl font-bold">₹{calculateSelectedTotal().toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedCommissions.length} commission(s) selected
            </p>
          </div>

          {/* Commission Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Select Commissions to Pay</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
              {unpaidCommissions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No unpaid commissions available
                </p>
              ) : (
                unpaidCommissions.map((commission) => (
                  <div
                    key={commission.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedCommissions.includes(commission.id)}
                      onCheckedChange={() => toggleCommissionSelection(commission.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Order #{commission.orderNumber}</span>
                        <Badge variant="secondary">{commission.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(commission.createdAt), "PPP")}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-destructive">
                        ₹{parseFloat(commission.commissionAmount).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Order: ₹{parseFloat(commission.orderAmount).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transaction Reference */}
          <div>
            <Label htmlFor="transactionReference">Transaction Reference / ID (Optional)</Label>
            <Input
              id="transactionReference"
              placeholder="Enter transaction reference number"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
            />
          </div>

          {/* Payment Proof Upload */}
          <div>
            <Label htmlFor="paymentProof">Payment Proof *</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Upload a screenshot or receipt of your payment (Image or PDF, max 5MB)
            </p>
            
            {!paymentProofFile ? (
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                <input
                  id="paymentProof"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
                <label
                  htmlFor="paymentProof"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Click to upload payment proof</p>
                    <p className="text-xs text-muted-foreground">
                      Supports: JPEG, PNG, GIF, WebP, PDF (max 5MB)
                    </p>
                  </div>
                </label>
              </div>
            ) : (
              <div className="border rounded-lg p-4 flex items-center gap-3">
                {isUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  getFileIcon()
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{paymentProofFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(paymentProofFile.size / 1024).toFixed(2)} KB
                  </p>
                  {paymentProofUrl && (
                    <p className="text-xs text-green-600 mt-1">✓ Uploaded successfully</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Note:</strong> Your payment will be reviewed by an admin. Once verified, 
              your commission status will be updated to "paid" and any account restrictions will be lifted.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitPaymentMutation.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={
              submitPaymentMutation.isPending || 
              isUploading || 
              selectedCommissions.length === 0 || 
              !paymentProofUrl
            }
          >
            {submitPaymentMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
