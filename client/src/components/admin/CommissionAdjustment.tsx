import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign,
  Calculator,
  AlertTriangle,
  CheckCircle,
  FileText,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

interface CommissionAdjustmentProps {
  orderId: string;
  disputeId?: string;
  originalAmount: number;
  originalCommission: number;
  onAdjustmentCreated?: () => void;
}

interface AdjustmentPreview {
  originalCommission: number;
  adjustmentAmount: number;
  newCommission: number;
  impact: number;
  impactPercentage: number;
}

export const CommissionAdjustment: React.FC<CommissionAdjustmentProps> = ({
  orderId,
  disputeId,
  originalAmount,
  originalCommission,
  onAdjustmentCreated
}) => {
  const [adjustmentType, setAdjustmentType] = useState<'refund' | 'penalty' | 'bonus' | 'correction'>('refund');
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState<AdjustmentPreview | null>(null);

  const queryClient = useQueryClient();

  // Create adjustment mutation
  const createAdjustmentMutation = useMutation({
    mutationFn: async (adjustmentData: {
      orderId: string;
      disputeId?: string;
      adjustmentType: string;
      adjustmentAmount: number;
      reason: string;
    }) => {
      const response = await fetch('/api/commission/admin/commission/adjustment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(adjustmentData),
      });

      if (!response.ok) {
        throw new Error('Failed to create commission adjustment');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Commission adjustment created successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/commission'] });
      if (onAdjustmentCreated) {
        onAdjustmentCreated();
      }
      // Reset form
      setAdjustmentAmount(0);
      setReason('');
      setPreview(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create commission adjustment');
    },
  });

  const calculatePreview = () => {
    if (!adjustmentAmount || adjustmentAmount === 0) {
      setPreview(null);
      return;
    }

    let newCommission = originalCommission;
    let impact = 0;

    switch (adjustmentType) {
      case 'refund':
        // Reduce commission proportionally to refund
        const refundRatio = adjustmentAmount / originalAmount;
        newCommission = originalCommission * (1 - refundRatio);
        impact = originalCommission - newCommission;
        break;
      case 'penalty':
        // Increase commission (penalty to supplier)
        newCommission = originalCommission + adjustmentAmount;
        impact = adjustmentAmount;
        break;
      case 'bonus':
        // Reduce commission (bonus to supplier)
        newCommission = Math.max(0, originalCommission - adjustmentAmount);
        impact = -(adjustmentAmount);
        break;
      case 'correction':
        // Direct commission adjustment
        newCommission = originalCommission + adjustmentAmount;
        impact = adjustmentAmount;
        break;
    }

    const impactPercentage = originalCommission > 0 ? (impact / originalCommission) * 100 : 0;

    setPreview({
      originalCommission,
      adjustmentAmount,
      newCommission,
      impact,
      impactPercentage,
    });
  };

  const handleSubmit = () => {
    if (!adjustmentAmount || adjustmentAmount === 0) {
      toast.error('Please enter an adjustment amount');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for the adjustment');
      return;
    }

    createAdjustmentMutation.mutate({
      orderId,
      disputeId,
      adjustmentType,
      adjustmentAmount,
      reason,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getAdjustmentTypeInfo = (type: string) => {
    switch (type) {
      case 'refund':
        return {
          label: 'Refund Adjustment',
          description: 'Reduce commission proportionally to refund amount',
          icon: TrendingDown,
          color: 'text-red-600'
        };
      case 'penalty':
        return {
          label: 'Supplier Penalty',
          description: 'Increase commission due to supplier penalty',
          icon: AlertTriangle,
          color: 'text-orange-600'
        };
      case 'bonus':
        return {
          label: 'Supplier Bonus',
          description: 'Reduce commission to provide supplier bonus',
          icon: TrendingUp,
          color: 'text-green-600'
        };
      case 'correction':
        return {
          label: 'Commission Correction',
          description: 'Direct commission amount adjustment',
          icon: Calculator,
          color: 'text-blue-600'
        };
      default:
        return {
          label: 'Unknown',
          description: '',
          icon: DollarSign,
          color: 'text-gray-600'
        };
    }
  };

  const typeInfo = getAdjustmentTypeInfo(adjustmentType);
  const TypeIcon = typeInfo.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Commission Adjustment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Commission Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Current Commission Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Order Amount:</span>
              <span className="font-medium ml-2">{formatCurrency(originalAmount)}</span>
            </div>
            <div>
              <span className="text-gray-600">Commission:</span>
              <span className="font-medium ml-2">{formatCurrency(originalCommission)}</span>
            </div>
          </div>
        </div>

        {/* Adjustment Type */}
        <div>
          <Label htmlFor="adjustmentType">Adjustment Type</Label>
          <Select value={adjustmentType} onValueChange={(value: any) => setAdjustmentType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="refund">Refund Adjustment</SelectItem>
              <SelectItem value="penalty">Supplier Penalty</SelectItem>
              <SelectItem value="bonus">Supplier Bonus</SelectItem>
              <SelectItem value="correction">Commission Correction</SelectItem>
            </SelectContent>
          </Select>
          <div className={`flex items-center gap-2 mt-2 text-sm ${typeInfo.color}`}>
            <TypeIcon className="h-4 w-4" />
            <span>{typeInfo.description}</span>
          </div>
        </div>

        {/* Adjustment Amount */}
        <div>
          <Label htmlFor="adjustmentAmount">Adjustment Amount</Label>
          <Input
            id="adjustmentAmount"
            type="number"
            step="0.01"
            min="0"
            value={adjustmentAmount || ''}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              setAdjustmentAmount(value);
            }}
            onBlur={calculatePreview}
            placeholder="0.00"
          />
        </div>

        {/* Reason */}
        <div>
          <Label htmlFor="reason">Reason for Adjustment</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain the reason for this commission adjustment..."
            rows={3}
          />
        </div>

        {/* Preview */}
        {preview && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Adjustment Preview
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Original Commission:</span>
                <span className="font-medium">{formatCurrency(preview.originalCommission)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Adjustment Amount:</span>
                <span className="font-medium">{formatCurrency(preview.adjustmentAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-blue-200 pt-2">
                <span className="text-blue-900 font-medium">New Commission:</span>
                <span className="font-bold">{formatCurrency(preview.newCommission)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Impact:</span>
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${preview.impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {preview.impact >= 0 ? '+' : ''}{formatCurrency(preview.impact)}
                  </span>
                  <Badge variant={preview.impact >= 0 ? 'default' : 'destructive'}>
                    {preview.impactPercentage >= 0 ? '+' : ''}{preview.impactPercentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={calculatePreview}
            variant="outline"
            disabled={!adjustmentAmount}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Preview
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!preview || !reason.trim() || createAdjustmentMutation.isPending}
          >
            {createAdjustmentMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Create Adjustment
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommissionAdjustment;