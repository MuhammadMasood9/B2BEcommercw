import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface Commission {
  id: number;
  orderId: number;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
}

interface CreditStatus {
  currentBalance: number;
  creditLimit: number;
  totalOutstanding: number;
  isRestricted: boolean;
  restrictionReason?: string;
}

export default function SupplierPayments() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [creditStatus, setCreditStatus] = useState<CreditStatus | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedCommissions, setSelectedCommissions] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCommissions();
    fetchCreditStatus();
  }, []);

  const fetchCommissions = async () => {
    try {
      const response = await fetch('/api/supplier/commissions', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCommissions(data);
      }
    } catch (error) {
      toast.error('Failed to fetch commissions');
    }
  };

  const fetchCreditStatus = async () => {
    try {
      const response = await fetch('/api/supplier/credit-status', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCreditStatus(data);
      }
    } catch (error) {
      toast.error('Failed to fetch credit status');
    }
  };

  const submitPayment = async () => {
    if (!paymentAmount || selectedCommissions.length === 0) {
      toast.error('Please select commissions and enter payment amount');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/supplier/submit-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          commissionIds: selectedCommissions,
          paymentMethod: 'bank_transfer' // Could be expanded
        })
      });

      if (response.ok) {
        toast.success('Payment submitted for verification');
        setPaymentAmount('');
        setSelectedCommissions([]);
        fetchCommissions();
        fetchCreditStatus();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Payment submission failed');
      }
    } catch (error) {
      toast.error('Payment submission failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleCommissionSelection = (commissionId: number) => {
    setSelectedCommissions(prev => 
      prev.includes(commissionId) 
        ? prev.filter(id => id !== commissionId)
        : [...prev, commissionId]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const selectedTotal = commissions
    .filter(c => selectedCommissions.includes(c.id))
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Commission Payments</h1>
      </div>

      {/* Credit Status Card */}
      {creditStatus && (
        <Card className={creditStatus.isRestricted ? 'border-destructive/20 bg-destructive/5' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Credit Status
              {creditStatus.isRestricted && (
                <Badge variant="destructive">Restricted</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Current Balance</Label>
                <p className="text-lg font-semibold">${creditStatus.currentBalance.toFixed(2)}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Credit Limit</Label>
                <p className="text-lg font-semibold">${creditStatus.creditLimit.toFixed(2)}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Outstanding</Label>
                <p className="text-lg font-semibold text-destructive">${creditStatus.totalOutstanding.toFixed(2)}</p>
              </div>
            </div>
            {creditStatus.isRestricted && creditStatus.restrictionReason && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-destructive text-sm">
                  <strong>Restriction Reason:</strong> {creditStatus.restrictionReason}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Submission */}
      <Card>
        <CardHeader>
          <CardTitle>Submit Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Payment Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-end">
              <div className="w-full">
                <Label className="text-sm text-gray-600">Selected Total</Label>
                <p className="text-lg font-semibold">${selectedTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <Button 
            onClick={submitPayment} 
            disabled={loading || selectedCommissions.length === 0}
            className="w-full"
          >
            {loading ? 'Submitting...' : 'Submit Payment for Verification'}
          </Button>
        </CardContent>
      </Card>

      {/* Commissions List */}
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Commissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {commissions.map((commission) => (
              <div
                key={commission.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedCommissions.includes(commission.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
                onClick={() => toggleCommissionSelection(commission.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedCommissions.includes(commission.id)}
                      onChange={() => toggleCommissionSelection(commission.id)}
                      className="h-4 w-4"
                    />
                    <div>
                      <p className="font-medium">Order #{commission.orderId}</p>
                      <p className="text-sm text-gray-600">
                        Due: {new Date(commission.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold">${commission.amount.toFixed(2)}</p>
                    <Badge className={getStatusColor(commission.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(commission.status)}
                        {commission.status}
                      </div>
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
            {commissions.length === 0 && (
              <p className="text-center text-gray-500 py-8">No outstanding commissions</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}