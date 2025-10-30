import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, DollarSign, TrendingUp, Users, Save, RefreshCw, Edit } from "lucide-react";
import { format } from "date-fns";

interface CommissionRates {
  defaultRate: number;
  freeRate: number;
  silverRate: number;
  goldRate: number;
  platinumRate: number;
  categoryRates?: Record<string, number>;
  vendorOverrides?: Record<string, number>;
}

interface CommissionSummary {
  totalOrders: number;
  totalSales: number;
  totalCommission: number;
  totalPaidToSuppliers: number;
  avgCommissionRate: number;
}

interface CommissionTrackingRecord {
  orderId: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  totalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  supplierAmount: number;
  paymentStatus: string;
  createdAt: string;
}

interface Supplier {
  id: string;
  businessName: string;
  membershipTier: string;
  customCommissionRate?: number;
}

export default function CommissionManagement() {
  const [commissionRates, setCommissionRates] = useState<CommissionRates | null>(null);
  const [commissionSummary, setCommissionSummary] = useState<CommissionSummary | null>(null);
  const [trackingRecords, setTrackingRecords] = useState<CommissionTrackingRecord[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  const [editingRates, setEditingRates] = useState<CommissionRates | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [customRate, setCustomRate] = useState('');
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    fetchCommissionData();
  }, [dateRange]);

  const fetchCommissionData = async () => {
    setLoading(true);
    try {
      // Fetch commission settings
      const settingsResponse = await fetch('/api/commission/admin/settings');
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setCommissionRates(settingsData);
        setEditingRates(settingsData);
      }

      // Fetch commission summary
      const summaryParams = new URLSearchParams();
      if (dateRange !== 'all') {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        summaryParams.append('startDate', startDate.toISOString());
        summaryParams.append('endDate', new Date().toISOString());
      }

      const summaryResponse = await fetch(`/api/commission/admin/summary?${summaryParams}`);
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setCommissionSummary(summaryData);
      }

      // Fetch tracking records
      const trackingResponse = await fetch(`/api/commission/admin/tracking?${summaryParams}&limit=50`);
      if (trackingResponse.ok) {
        const trackingData = await trackingResponse.json();
        setTrackingRecords(trackingData);
      }

      // Fetch suppliers for custom rate management
      const suppliersResponse = await fetch('/api/admin/suppliers?status=approved&limit=100');
      if (suppliersResponse.ok) {
        const suppliersData = await suppliersResponse.json();
        setSuppliers(suppliersData.suppliers || []);
      }
    } catch (error) {
      console.error('Error fetching commission data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCommissionSettings = async () => {
    if (!editingRates) return;

    setSaving(true);
    try {
      const response = await fetch('/api/commission/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingRates),
      });

      if (response.ok) {
        setCommissionRates(editingRates);
        alert('Commission settings updated successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving commission settings:', error);
      alert('Failed to save commission settings');
    } finally {
      setSaving(false);
    }
  };

  const setSupplierCustomRate = async () => {
    if (!selectedSupplier || !customRate) return;

    try {
      const response = await fetch('/api/commission/admin/supplier-rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplierId: selectedSupplier.id,
          customRate: parseFloat(customRate),
        }),
      });

      if (response.ok) {
        alert('Supplier commission rate updated successfully!');
        setSelectedSupplier(null);
        setCustomRate('');
        fetchCommissionData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error setting supplier rate:', error);
      alert('Failed to set supplier rate');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return `${rate.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Commission Management</h1>
          <p className="text-muted-foreground">Manage commission rates and track platform revenue</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchCommissionData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(commissionSummary?.totalCommission || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {commissionSummary?.totalOrders || 0} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(commissionSummary?.totalSales || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Platform gross revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid to Suppliers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(commissionSummary?.totalPaidToSuppliers || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Supplier earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Commission Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(commissionSummary?.avgCommissionRate || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all tiers
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="settings">Commission Settings</TabsTrigger>
          <TabsTrigger value="tracking">Commission Tracking</TabsTrigger>
          <TabsTrigger value="suppliers">Supplier Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Commission Rate Settings</CardTitle>
              <CardDescription>
                Configure commission rates by membership tier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingRates && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="defaultRate">Default Rate (%)</Label>
                    <Input
                      id="defaultRate"
                      type="number"
                      step="0.1"
                      value={editingRates.defaultRate}
                      onChange={(e) => setEditingRates({
                        ...editingRates,
                        defaultRate: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="freeRate">Free Tier Rate (%)</Label>
                    <Input
                      id="freeRate"
                      type="number"
                      step="0.1"
                      value={editingRates.freeRate}
                      onChange={(e) => setEditingRates({
                        ...editingRates,
                        freeRate: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="silverRate">Silver Tier Rate (%)</Label>
                    <Input
                      id="silverRate"
                      type="number"
                      step="0.1"
                      value={editingRates.silverRate}
                      onChange={(e) => setEditingRates({
                        ...editingRates,
                        silverRate: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="goldRate">Gold Tier Rate (%)</Label>
                    <Input
                      id="goldRate"
                      type="number"
                      step="0.1"
                      value={editingRates.goldRate}
                      onChange={(e) => setEditingRates({
                        ...editingRates,
                        goldRate: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="platinumRate">Platinum Tier Rate (%)</Label>
                    <Input
                      id="platinumRate"
                      type="number"
                      step="0.1"
                      value={editingRates.platinumRate}
                      onChange={(e) => setEditingRates({
                        ...editingRates,
                        platinumRate: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button onClick={saveCommissionSettings} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Commission Tracking</CardTitle>
              <CardDescription>
                Track commission calculations for all orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Commission Rate</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Supplier Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trackingRecords.map((record) => (
                    <TableRow key={record.orderId}>
                      <TableCell className="font-medium">
                        {record.orderNumber}
                      </TableCell>
                      <TableCell>{record.supplierName}</TableCell>
                      <TableCell>{formatCurrency(record.totalAmount)}</TableCell>
                      <TableCell>{formatPercentage(record.commissionRate)}</TableCell>
                      <TableCell>{formatCurrency(record.commissionAmount)}</TableCell>
                      <TableCell>{formatCurrency(record.supplierAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={record.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                          {record.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(record.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Commission Rates</CardTitle>
              <CardDescription>
                Set custom commission rates for individual suppliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Edit className="h-4 w-4 mr-2" />
                      Set Custom Rate
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Set Custom Commission Rate</DialogTitle>
                      <DialogDescription>
                        Override the default commission rate for a specific supplier
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="supplier">Supplier</Label>
                        <Select onValueChange={(value) => {
                          const supplier = suppliers.find(s => s.id === value);
                          setSelectedSupplier(supplier || null);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.businessName} ({supplier.membershipTier})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="customRate">Custom Rate (%)</Label>
                        <Input
                          id="customRate"
                          type="number"
                          step="0.1"
                          value={customRate}
                          onChange={(e) => setCustomRate(e.target.value)}
                          placeholder="Enter custom commission rate"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={setSupplierCustomRate} disabled={!selectedSupplier || !customRate}>
                        Set Custom Rate
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Membership Tier</TableHead>
                      <TableHead>Default Rate</TableHead>
                      <TableHead>Custom Rate</TableHead>
                      <TableHead>Effective Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier) => {
                      const tierRates = {
                        free: commissionRates?.freeRate || 0,
                        silver: commissionRates?.silverRate || 0,
                        gold: commissionRates?.goldRate || 0,
                        platinum: commissionRates?.platinumRate || 0,
                      };
                      const defaultRate = tierRates[supplier.membershipTier as keyof typeof tierRates] || commissionRates?.defaultRate || 0;
                      const effectiveRate = supplier.customCommissionRate || defaultRate;

                      return (
                        <TableRow key={supplier.id}>
                          <TableCell className="font-medium">
                            {supplier.businessName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {supplier.membershipTier}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatPercentage(defaultRate)}</TableCell>
                          <TableCell>
                            {supplier.customCommissionRate ? 
                              formatPercentage(supplier.customCommissionRate) : 
                              '-'
                            }
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatPercentage(effectiveRate)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}