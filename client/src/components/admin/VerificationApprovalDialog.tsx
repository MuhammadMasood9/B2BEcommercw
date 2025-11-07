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
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle,
  Shield,
  Award,
  Star
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface VerificationApplication {
  id: string;
  businessName: string;
  storeName: string;
  application: {
    requestedLevel: string;
  };
}

interface VerificationApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: VerificationApplication | null;
  onSuccess: () => void;
}

const VERIFICATION_LEVELS = {
  basic: { name: 'Basic Verification', icon: Shield, color: 'text-blue-600' },
  business: { name: 'Business Verification', icon: Award, color: 'text-green-600' },
  premium: { name: 'Premium Verification', icon: Star, color: 'text-purple-600' },
  trade_assurance: { name: 'Trade Assurance', icon: CheckCircle, color: 'text-gold-600' }
};

export function VerificationApprovalDialog({
  open,
  onOpenChange,
  application,
  onSuccess
}: VerificationApprovalDialogProps) {
  const [level, setLevel] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (application) {
      setLevel(application.application.requestedLevel);
      setNotes('');
      setError('');
    }
  }, [application]);

  const handleSubmit = async () => {
    if (!level) {
      setError('Please select a verification level.');
      return;
    }

    if (!application) return;

    setSubmitting(true);
    setError('');

    try {
      const data = await apiRequest('POST', `/api/verification/admin/approve/${application.id}`, {
        level,
        notes,
      });

      if (data?.success) {
        onSuccess();
        resetForm();
      } else {
        setError(data?.error || 'Failed to approve verification');
      }
    } catch (error) {
      console.error('Error approving verification:', error);
      setError('Failed to approve verification. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setLevel('');
    setNotes('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  if (!application) return null;

  const levelConfig = VERIFICATION_LEVELS[level as keyof typeof VERIFICATION_LEVELS];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Approve Verification
          </DialogTitle>
          <DialogDescription>
            Approve the verification application for {application.businessName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">Approval Details</span>
            </div>
            <div className="space-y-1 text-sm text-green-700">
              <p><strong>Business:</strong> {application.businessName}</p>
              <p><strong>Store:</strong> {application.storeName}</p>
              <p><strong>Requested Level:</strong> {VERIFICATION_LEVELS[application.application.requestedLevel as keyof typeof VERIFICATION_LEVELS]?.name}</p>
            </div>
          </div>

          <div>
            <Label htmlFor="level">Verification Level *</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select verification level to approve" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(VERIFICATION_LEVELS).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        {config.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              You can approve at a different level than requested if needed
            </p>
          </div>

          {levelConfig && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <levelConfig.icon className={`h-4 w-4 ${levelConfig.color}`} />
                <span className="font-medium text-blue-800">Approving for {levelConfig.name}</span>
              </div>
              <p className="text-sm text-blue-700">
                The supplier will receive verification at this level and gain access to all associated benefits.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Admin Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this approval decision..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              These notes will be visible to other administrators
            </p>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Confirmation:</strong> This action will immediately grant verification status to the supplier. 
              They will receive a notification and their verification badge will be updated.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || !level}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? 'Approving...' : 'Approve Verification'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}