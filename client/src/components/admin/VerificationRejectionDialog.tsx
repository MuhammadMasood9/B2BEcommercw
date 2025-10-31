import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  XCircle, 
  AlertCircle
} from 'lucide-react';

interface VerificationApplication {
  id: string;
  businessName: string;
  storeName: string;
  application: {
    requestedLevel: string;
  };
}

interface VerificationRejectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: VerificationApplication | null;
  onSuccess: () => void;
}

const REJECTION_REASONS = [
  'Incomplete documentation',
  'Invalid or expired documents',
  'Business information mismatch',
  'Insufficient business history',
  'Failed identity verification',
  'Suspicious business activity',
  'Does not meet minimum requirements',
  'Document quality issues',
  'Missing required certifications',
  'Other (specify in notes)'
];

const VERIFICATION_LEVELS = {
  basic: 'Basic Verification',
  business: 'Business Verification',
  premium: 'Premium Verification',
  trade_assurance: 'Trade Assurance'
};

export function VerificationRejectionDialog({
  open,
  onOpenChange,
  application,
  onSuccess
}: VerificationRejectionDialogProps) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (application) {
      setReason('');
      setNotes('');
      setError('');
    }
  }, [application]);

  const handleSubmit = async () => {
    if (!reason) {
      setError('Please select a rejection reason.');
      return;
    }

    if (!application) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/verification/admin/reject/${application.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reason,
          notes
        })
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        resetForm();
      } else {
        setError(data.error || 'Failed to reject verification');
      }
    } catch (error) {
      console.error('Error rejecting verification:', error);
      setError('Failed to reject verification. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setReason('');
    setNotes('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  if (!application) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Reject Verification
          </DialogTitle>
          <DialogDescription>
            Reject the verification application for {application.businessName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-800">Rejection Details</span>
            </div>
            <div className="space-y-1 text-sm text-red-700">
              <p><strong>Business:</strong> {application.businessName}</p>
              <p><strong>Store:</strong> {application.storeName}</p>
              <p><strong>Requested Level:</strong> {VERIFICATION_LEVELS[application.application.requestedLevel as keyof typeof VERIFICATION_LEVELS]}</p>
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Rejection Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason for rejection" />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((reasonOption) => (
                  <SelectItem key={reasonOption} value={reasonOption}>
                    {reasonOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes *</Label>
            <Textarea
              id="notes"
              placeholder="Provide detailed feedback to help the supplier understand what needs to be improved..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              These notes will be sent to the supplier to help them reapply successfully
            </p>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> The supplier will be notified of this rejection and can reapply 
              after addressing the issues mentioned in your feedback.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || !reason || !notes.trim()}
            variant="destructive"
          >
            {submitting ? 'Rejecting...' : 'Reject Application'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}