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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Save, 
  RefreshCw, 
  Edit, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3, 
  Calculator, 
  History,
  Plus,
  Trash2
} from "lucide-react";
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

interface CommissionHistory {
  id: string;
  changeDate: Date;
  changedBy: string;
  changeType: 'tier_rate' | 'category_rate' | 'supplier_override';
  previousValue: number;
  newValue: number;
  affectedEntity: string;
  reason?: string;
}

interface ImpactAnalysis {
  affectedSuppliers: number;
  estimatedRevenueChange: number;
  estimatedSupplierImpact: number;
  projectedMonthlyChange: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

interface Category {
  id: string;
  name: string;
  currentRate?: number;
}

interface Supplier {
  id: string;
  businessName: string;
  membershipTier: string;
  customCommissionRate?: number;
}

export default function CommissionSettings() {
  const [commissionRates, setCommissionRates] = useState<CommissionRates | null>(null);
  const [editingRates, setEditingRates] = useState<CommissionRates | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [commissionHistory, setCommissionHistory] = useState<CommissionHistory[]>([]);
  const [impactAnalysis, setImpactAnalysis] = useState<ImpactAnalysis | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('tier-rates');
  
  // Dialog states
  const [showImpactDialog, setShowImpactDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  
  // Form states
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryRate, setCategoryRate] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierRate, setSupplierRate] = useState('');
  const [changeReason, setChangeReason] = useState('');

  useEffect(() => {
    fetchCommissionData();
  }, []);

  const fetchCommissionData = async () => {
    setLoading(true);
    try {
      // Fetch commission settings
      const settingsResponse = await fetch('/api/admin/financial/commission/advanced-settings');
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setCommissionRates(settingsData);
        setEditingRates(settingsData);
      }

      // Fetch categories
      const categoriesResponse = await fetch('/api/categories');
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
      }

      // Fetch suppliers
      const suppliersResponse = await fetch('/api/admin/suppliers?status=approved&limit=100');
      if (suppliersResponse.ok) {
        const suppliersData = await suppliersResponse.json();
        setSuppliers(suppliersData.suppliers || []);
      }

      // Fetch commission history
      const historyResponse = await fetch('/api/admin/financial/commission/history?limit=50');
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setCommissionHistory(historyData);
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
      const response = await fetch('/api/admin/financial/commission/advanced-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editingRates,
          changeReason: changeReason || 'Rate adjustment'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setCommissionRates(editingRates);
        setImpactAnalysis(result.impactAnalysis);
        setChangeReason('');
        alert('Commission settings updated successfully!');
        fetchCommissionData(); // Refresh all data
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

  const analyzeImpact = async () => {
    if (!editingRates) return;

    try {
      const response = await fetch('/api/admin/financial/commission/impact-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingRates),
      });

      if (response.ok) {
        const analysis = await response.json();
        setImpactAnalysis(analysis);
        setShowImpactDialog(true);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error analyzing impact:', error);
      alert('Failed to analyze impact');
    }
  };

  const setCategoryCommissionRate = async () => {
    if (!selectedCategory || !categoryRate) return;

    try {
      const response = await fetch('/api/admin/financial/commission/category-rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryId: selectedCategory.id,
          rate: parseFloat(categoryRate),
          reason: changeReason || 'Category rate update'
        }),
      });

      if (response.ok) {
        alert('Category commission rate updated successfully!');
        setSelectedCategory(null);
        setCategoryRate('');
        setChangeReason('');
        setShowCategoryDialog(false);
        fetchCommissionData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error setting category rate:', error);
      alert('Failed to set category rate');
    }
  };

  const setSupplierCommissionRate = async () => {
    if (!selectedSupplier || !supplierRate) return;

    try {
      const response = await fetch('/api/admin/financial/commission/supplier-rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplierId: selectedSupplier.id,
          customRate: parseFloat(supplierRate),
          reason: changeReason || 'Supplier rate override'
        }),
      });

      if (response.ok) {
        alert('Supplier commission rate updated successfully!');
        setSelectedSupplier(null);
        setSupplierRate('');
        setChangeReason('');
        setShowSupplierDialog(false);
        fetchCommissionData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error setting supplier rate:', error);
      alert('Failed to set supplier rate');
    }
  };

  const resetToDefaults = () => {
    if (commissionRates) {
      setEditingRates({ ...commissionRates });
    }
  };

  const formatPercentage = (rate: number) => {
    return `${rate.toFixed(1)}%`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
          <h1 className="text-3xl font-bold">Commission Settings</h1>
          <p className="text-muted-foreground">Configure commission rates and manage rate structures</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowHistoryDialog(true)} variant="outline" size="sm">
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button onClick={analyzeImpact} variant="outline" size="sm">
            <Calculator className="h-4 w-4 mr-2" />
            Analyze Impact
          </Button>
          <Button onClick={fetchCommissionData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tier-rates">Tier Rates</TabsTrigger>
          <TabsTrigger value="category-rates">Category Rates</TabsTrigger>
          <TabsTrigger value="supplier-overrides">Supplier Overrides</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="tier-rates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Membership Tier Commission Rates</CardTitle>
              <CardDescription>
                Configure commission rates by supplier membership tier
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
                      min="0"
                      max="100"
                      value={editingRates.defaultRate}
                      onChange={(e) => setEditingRates({
                        ...editingRates,
                        defaultRate: parseFloat(e.target.value) || 0
                      })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Fallback rate for unspecified tiers
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="freeRate">Free Tier Rate (%)</Label>
                    <Input
                      id="freeRate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={editingRates.freeRate}
                      onChange={(e) => setEditingRates({
                        ...editingRates,
                        freeRate: parseFloat(e.target.value) || 0
                      })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Rate for free tier suppliers
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="silverRate">Silver Tier Rate (%)</Label>
                    <Input
                      id="silverRate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={editingRates.silverRate}
                      onChange={(e) => setEditingRates({
                        ...editingRates,
                        silverRate: parseFloat(e.target.value) || 0
                      })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Rate for silver tier suppliers
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="goldRate">Gold Tier Rate (%)</Label>
                    <Input
                      id="goldRate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={editingRates.goldRate}
                      onChange={(e) => setEditingRates({
                        ...editingRates,
                        goldRate: parseFloat(e.target.value) || 0
                      })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Rate for gold tier suppliers
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="platinumRate">Platinum Tier Rate (%)</Label>
                    <Input
                      id="platinumRate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={editingRates.platinumRate}
                      onChange={(e) => setEditingRates({
                        ...editingRates,
                        platinumRate: parseFloat(e.target.value) || 0
                      })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Rate for platinum tier suppliers
                    </p>
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <Label htmlFor="changeReason">Change Reason</Label>
                  <span className="text-xs text-muted-foreground">(Optional)</span>
                </div>
                <Textarea
                  id="changeReason"
                  placeholder="Describe the reason for this rate change..."
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  className="mb-4"
                />
                
                <div className="flex justify-between">
                  <Button onClick={resetToDefaults} variant="outline">
                    Reset to Current
                  </Button>
                  <Button onClick={saveCommissionSettings} disabled={saving}>
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Tier Rates
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category-rates" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Category-Specific Commission Rates</CardTitle>
                  <CardDescription>
                    Override commission rates for specific product categories
                  </CardDescription>
                </div>
                <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category Rate
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Set Category Commission Rate</DialogTitle>
                      <DialogDescription>
                        Override the default commission rate for a specific category
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select onValueChange={(value) => {
                          const category = categories.find(c => c.id === value);
                          setSelectedCategory(category || null);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="categoryRate">Commission Rate (%)</Label>
                        <Input
                          id="categoryRate"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={categoryRate}
                          onChange={(e) => setCategoryRate(e.target.value)}
                          placeholder="Enter commission rate"
                        />
                      </div>
                      <div>
                        <Label htmlFor="categoryReason">Reason</Label>
                        <Textarea
                          id="categoryReason"
                          placeholder="Reason for this category rate..."
                          value={changeReason}
                          onChange={(e) => setChangeReason(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={setCategoryCommissionRate} disabled={!selectedCategory || !categoryRate}>
                        Set Category Rate
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Custom Rate</TableHead>
                    <TableHead>Default Rate</TableHead>
                    <TableHead>Effective Rate</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => {
                    const customRate = commissionRates?.categoryRates?.[category.id];
                    const defaultRate = commissionRates?.defaultRate || 0;
                    const effectiveRate = customRate || defaultRate;

                    return (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          {category.name}
                        </TableCell>
                        <TableCell>
                          {customRate ? formatPercentage(customRate) : '-'}
                        </TableCell>
                        <TableCell>{formatPercentage(defaultRate)}</TableCell>
                        <TableCell className="font-medium">
                          {formatPercentage(effectiveRate)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedCategory(category);
                                setCategoryRate(customRate?.toString() || '');
                                setShowCategoryDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {customRate && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  // Remove category rate override
                                  try {
                                    const response = await fetch(`/api/admin/financial/commission/category-rate/${category.id}`, {
                                      method: 'DELETE',
                                    });
                                    if (response.ok) {
                                      fetchCommissionData();
                                    }
                                  } catch (error) {
                                    console.error('Error removing category rate:', error);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supplier-overrides" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Supplier Commission Overrides</CardTitle>
                  <CardDescription>
                    Set custom commission rates for individual suppliers
                  </CardDescription>
                </div>
                <Dialog open={showSupplierDialog} onOpenChange={setShowSupplierDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Supplier Override
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Set Supplier Commission Override</DialogTitle>
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
                        <Label htmlFor="supplierRate">Commission Rate (%)</Label>
                        <Input
                          id="supplierRate"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={supplierRate}
                          onChange={(e) => setSupplierRate(e.target.value)}
                          placeholder="Enter commission rate"
                        />
                      </div>
                      <div>
                        <Label htmlFor="supplierReason">Reason</Label>
                        <Textarea
                          id="supplierReason"
                          placeholder="Reason for this supplier override..."
                          value={changeReason}
                          onChange={(e) => setChangeReason(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={setSupplierCommissionRate} disabled={!selectedSupplier || !supplierRate}>
                        Set Supplier Rate
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Membership Tier</TableHead>
                    <TableHead>Tier Rate</TableHead>
                    <TableHead>Custom Rate</TableHead>
                    <TableHead>Effective Rate</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.filter(s => s.customCommissionRate).map((supplier) => {
                    const tierRates = {
                      free: commissionRates?.freeRate || 0,
                      silver: commissionRates?.silverRate || 0,
                      gold: commissionRates?.goldRate || 0,
                      platinum: commissionRates?.platinumRate || 0,
                    };
                    const tierRate = tierRates[supplier.membershipTier as keyof typeof tierRates] || commissionRates?.defaultRate || 0;
                    const effectiveRate = supplier.customCommissionRate || tierRate;

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
                        <TableCell>{formatPercentage(tierRate)}</TableCell>
                        <TableCell className="font-medium">
                          {supplier.customCommissionRate ? formatPercentage(supplier.customCommissionRate) : '-'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatPercentage(effectiveRate)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedSupplier(supplier);
                                setSupplierRate(supplier.customCommissionRate?.toString() || '');
                                setShowSupplierDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                // Remove supplier rate override
                                try {
                                  const response = await fetch(`/api/admin/financial/commission/supplier-rate/${supplier.id}`, {
                                    method: 'DELETE',
                                  });
                                  if (response.ok) {
                                    fetchCommissionData();
                                  }
                                } catch (error) {
                                  console.error('Error removing supplier rate:', error);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {suppliers.filter(s => s.customCommissionRate).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No supplier overrides configured
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Commission Settings</CardTitle>
              <CardDescription>
                Configure advanced commission calculation rules and policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Advanced settings affect commission calculations platform-wide. Changes should be made carefully and tested thoroughly.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Commission Calculation Rules</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Commission rates are applied to the order total amount</p>
                    <p>• Supplier overrides take precedence over category rates</p>
                    <p>• Category rates take precedence over tier rates</p>
                    <p>• Tier rates take precedence over default rate</p>
                    <p>• Minimum commission: $0.01</p>
                    <p>• Maximum commission rate: 100%</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Rate Change Policy</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Rate changes apply to new orders only</p>
                    <p>• Existing orders maintain original rates</p>
                    <p>• All rate changes are logged and auditable</p>
                    <p>• Impact analysis is recommended before changes</p>
                    <p>• Bulk rate updates require admin approval</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Impact Analysis Dialog */}
      <Dialog open={showImpactDialog} onOpenChange={setShowImpactDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Commission Impact Analysis</DialogTitle>
            <DialogDescription>
              Analysis of proposed commission rate changes
            </DialogDescription>
          </DialogHeader>
          
          {impactAnalysis && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{impactAnalysis.affectedSuppliers}</div>
                    <div className="text-sm text-muted-foreground">Affected Suppliers</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">
                      {impactAnalysis.estimatedRevenueChange >= 0 ? '+' : ''}
                      {formatCurrency(impactAnalysis.estimatedRevenueChange)}
                    </div>
                    <div className="text-sm text-muted-foreground">Revenue Impact</div>
                  </CardContent>
                </Card>
              </div>

              <Alert className={`${
                impactAnalysis.riskLevel === 'high' ? 'border-red-200 bg-red-50' :
                impactAnalysis.riskLevel === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                'border-green-200 bg-green-50'
              }`}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">Risk Level: {impactAnalysis.riskLevel.toUpperCase()}</div>
                  <div className="mt-2">
                    Monthly projected change: {formatCurrency(impactAnalysis.projectedMonthlyChange)}
                  </div>
                </AlertDescription>
              </Alert>

              {impactAnalysis.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Recommendations:</h4>
                  <ul className="space-y-1">
                    {impactAnalysis.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Commission History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Commission Rate History</DialogTitle>
            <DialogDescription>
              Recent changes to commission rates and settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Previous</TableHead>
                  <TableHead>New</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissionHistory.map((change) => (
                  <TableRow key={change.id}>
                    <TableCell>
                      {format(new Date(change.changeDate), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>{change.changedBy}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {change.changeType.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{change.affectedEntity}</TableCell>
                    <TableCell>{formatPercentage(change.previousValue)}</TableCell>
                    <TableCell>{formatPercentage(change.newValue)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {change.reason || '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {commissionHistory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No commission history available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}