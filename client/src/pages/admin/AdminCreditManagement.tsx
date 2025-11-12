import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { CreditCard, AlertTriangle, Settings, Search } from 'lucide-react';

interface SupplierCredit {
  id: number;
  name: string;
  email: string;
  currentBalance: number;
  creditLimit: number;
  totalOutstanding: number;
  isRestricted: boolean;
  restrictionReason?: string;
  lastPayment?: string;
  registeredAt: string;
}

export default function AdminCreditManagement() {
  const [suppliers, setSuppliers] = useState<SupplierCredit[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierCredit | null>(null);
  const [creditLimit, setCreditLimit] = useState('');
  const [restrictionReason, setRestrictionReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'restricted' | 'overlimit'>('all');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/admin/suppliers/credit-status', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      }
    } catch (error) {
      toast.error('Failed to fetch suppliers');
    }
  };

  const updateCreditLimit = async (supplierId: number) => {
    if (!creditLimit || parseFloat(creditLimit) < 0) {
      toast.error('Please enter a valid credit limit');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/suppliers/${supplierId}/credit-limit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ creditLimit: parseFloat(creditLimit) })
      });

      if (response.ok) {
        toast.success('Credit limit updated successfully');
        fetchSuppliers();
        setCreditLimit('');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update credit limit');
      }
    } catch (error) {
      toast.error('Failed to update credit limit');
    } finally {
      setLoading(false);
    }
  };

  const toggleRestriction = async (supplierId: number, restrict: boolean) => {
    if (restrict && !restrictionReason.trim()) {
      toast.error('Please provide a restriction reason');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/suppliers/${supplierId}/restriction`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          isRestricted: restrict,
          restrictionReason: restrict ? restrictionReason : null
        })
      });

      if (response.ok) {
        toast.success(`Supplier ${restrict ? 'restricted' : 'unrestricted'} successfully`);
        fetchSuppliers();
        setRestrictionReason('');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update restriction');
      }
    } catch (error) {
      toast.error('Failed to update restriction');
    } finally {
      setLoading(false);
    }
  };

  const selectSupplier = (supplier: SupplierCredit) => {
    setSelectedSupplier(supplier);
    setCreditLimit(supplier.creditLimit.toString());
    setRestrictionReason(supplier.restrictionReason || '');
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (filter) {
      case 'restricted':
        return supplier.isRestricted;
      case 'overlimit':
        return supplier.totalOutstanding > supplier.creditLimit;
      default:
        return true;
    }
  });

  const getCreditStatus = (supplier: SupplierCredit) => {
    if (supplier.isRestricted) return { text: 'Restricted', color: 'bg-red-100 text-red-800' };
    if (supplier.totalOutstanding > supplier.creditLimit) return { text: 'Over Limit', color: 'bg-orange-100 text-orange-800' };
    if (supplier.totalOutstanding > supplier.creditLimit * 0.8) return { text: 'Near Limit', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Good Standing', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Credit Management</h1>
        </div>
        <div className="flex gap-2">
          {(['all', 'restricted', 'overlimit'] as const).map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(filterType)}
            >
              {filterType === 'overlimit' ? 'Over Limit' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search suppliers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Suppliers List */}
        <Card>
          <CardHeader>
            <CardTitle>Suppliers ({filteredSuppliers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredSuppliers.map((supplier) => {
                const status = getCreditStatus(supplier);
                return (
                  <div
                    key={supplier.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedSupplier?.id === supplier.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                    onClick={() => selectSupplier(supplier)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        <p className="text-sm text-gray-600">{supplier.email}</p>
                      </div>
                      <Badge className={status.color}>
                        {status.text}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Balance:</span>
                        <p className="font-medium">${supplier.currentBalance.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Limit:</span>
                        <p className="font-medium">${supplier.creditLimit.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Outstanding:</span>
                        <p className="font-medium text-red-600">${supplier.totalOutstanding.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredSuppliers.length === 0 && (
                <p className="text-center text-gray-500 py-8">No suppliers found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Supplier Management */}
        {selectedSupplier && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Manage {selectedSupplier.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Credit Limit */}
              <div>
                <Label htmlFor="credit-limit">Credit Limit</Label>
                <div className="flex gap-2">
                  <Input
                    id="credit-limit"
                    type="number"
                    step="0.01"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    placeholder="0.00"
                  />
                  <Button
                    onClick={() => updateCreditLimit(selectedSupplier.id)}
                    disabled={loading}
                  >
                    Update
                  </Button>
                </div>
              </div>

              {/* Current Status */}
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2 text-foreground">Current Status</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Current Balance:</span>
                    <p className="font-medium text-foreground">${selectedSupplier.currentBalance.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Outstanding:</span>
                    <p className="font-medium text-foreground">${selectedSupplier.totalOutstanding.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Available Credit:</span>
                    <p className="font-medium text-foreground">
                      ${Math.max(0, selectedSupplier.creditLimit - selectedSupplier.totalOutstanding).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Payment:</span>
                    <p className="font-medium text-foreground">
                      {selectedSupplier.lastPayment 
                        ? new Date(selectedSupplier.lastPayment).toLocaleDateString()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Restriction Management */}
              <div>
                <Label>Restriction Status</Label>
                <div className="mt-2">
                  {selectedSupplier.isRestricted ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span className="text-destructive font-medium">Currently Restricted</span>
                      </div>
                      {selectedSupplier.restrictionReason && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
                          <p className="text-destructive text-sm">{selectedSupplier.restrictionReason}</p>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => toggleRestriction(selectedSupplier.id, false)}
                        disabled={loading}
                      >
                        Remove Restriction
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-green-600 font-medium">Not Restricted</p>
                      <div>
                        <Label htmlFor="restriction-reason">Restriction Reason</Label>
                        <Textarea
                          id="restriction-reason"
                          value={restrictionReason}
                          onChange={(e) => setRestrictionReason(e.target.value)}
                          placeholder="Enter reason for restriction..."
                          rows={3}
                        />
                      </div>
                      <Button
                        variant="destructive"
                        onClick={() => toggleRestriction(selectedSupplier.id, true)}
                        disabled={loading}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Restrict Supplier
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}