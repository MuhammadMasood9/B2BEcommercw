import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Plus, Edit, Trash2, AlertCircle, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CommissionTier {
  id: string;
  minAmount: string;
  maxAmount: string | null;
  commissionRate: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RestrictedSupplier {
  id: string;
  businessName: string;
  storeName: string;
  email: string;
  phone: string;
  creditLimit: string;
  totalUnpaid: string;
  isRestricted: boolean;
  lastPaymentDate: string | null;
}

export default function AdminCommissionSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<CommissionTier | null>(null);
  const [newTier, setNewTier] = useState({
    minAmount: "",
    maxAmount: "",
    commissionRate: "",
    description: ""
  });

  // Fetch commission tiers
  const { data: tiersData, isLoading: tiersLoading } = useQuery({
    queryKey: ["/api/commissions/admin/commission-tiers"],
    queryFn: async () => {
      const response = await fetch("/api/commissions/admin/commission-tiers", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch commission tiers");
      return response.json();
    },
  });

  // Fetch restricted suppliers
  const { data: restrictedData, isLoading: restrictedLoading } = useQuery({
    queryKey: ["/api/commissions/admin/restricted-suppliers"],
    queryFn: async () => {
      const response = await fetch("/api/commissions/admin/restricted-suppliers", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch restricted suppliers");
      return response.json();
    },
  });

  const tiers: CommissionTier[] = tiersData?.tiers || [];
  const restrictedSuppliers: RestrictedSupplier[] = restrictedData?.suppliers || [];

  // Create tier mutation
  const createTierMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/commissions/admin/commission-tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create tier");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commissions/admin/commission-tiers"] });
      toast({ title: "Success", description: "Commission tier created successfully" });
      setIsAddDialogOpen(false);
      setNewTier({ minAmount: "", maxAmount: "", commissionRate: "", description: "" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create commission tier", variant: "destructive" });
    },
  });

  // Update tier mutation
  const updateTierMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/commissions/admin/commission-tiers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update tier");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commissions/admin/commission-tiers"] });
      toast({ title: "Success", description: "Commission tier updated successfully" });
      setEditingTier(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update commission tier", variant: "destructive" });
    },
  });

  // Delete tier mutation
  const deleteTierMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/commissions/admin/commission-tiers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete tier");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commissions/admin/commission-tiers"] });
      toast({ title: "Success", description: "Commission tier deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete commission tier", variant: "destructive" });
    },
  });

  // Lift restriction mutation
  const liftRestrictionMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      const response = await fetch(`/api/commissions/admin/suppliers/${supplierId}/lift-restriction`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to lift restriction");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commissions/admin/restricted-suppliers"] });
      toast({ title: "Success", description: "Supplier restriction lifted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to lift restriction", variant: "destructive" });
    },
  });

  const handleCreateTier = () => {
    const minAmount = parseFloat(newTier.minAmount);
    const maxAmount = newTier.maxAmount ? parseFloat(newTier.maxAmount) : null;
    const commissionRate = parseFloat(newTier.commissionRate) / 100; // Convert percentage to decimal

    if (isNaN(minAmount) || isNaN(commissionRate)) {
      toast({ title: "Error", description: "Please enter valid numbers", variant: "destructive" });
      return;
    }

    createTierMutation.mutate({
      minAmount,
      maxAmount,
      commissionRate,
      description: newTier.description || null,
    });
  };

  const handleUpdateTier = (tier: CommissionTier, updates: any) => {
    updateTierMutation.mutate({ id: tier.id, data: updates });
  };

  const handleToggleTierStatus = (tier: CommissionTier) => {
    handleUpdateTier(tier, { isActive: !tier.isActive });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Commission Settings
          </h1>
          <p className="text-muted-foreground">Manage commission tiers and restricted suppliers</p>
        </div>
      </div>

      <Tabs defaultValue="tiers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tiers">Commission Tiers</TabsTrigger>
          <TabsTrigger value="restricted">
            Restricted Suppliers
            {restrictedSuppliers.length > 0 && (
              <Badge variant="destructive" className="ml-2">{restrictedSuppliers.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Commission Tiers Tab */}
        <TabsContent value="tiers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Commission Rate Tiers</CardTitle>
                  <CardDescription>
                    Define commission rates based on order amount ranges
                  </CardDescription>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tier
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Commission Tier</DialogTitle>
                      <DialogDescription>
                        Add a new commission rate tier based on order amount
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="minAmount">Minimum Amount (₹)</Label>
                        <Input
                          id="minAmount"
                          type="number"
                          placeholder="0"
                          value={newTier.minAmount}
                          onChange={(e) => setNewTier({ ...newTier, minAmount: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxAmount">Maximum Amount (₹) - Optional</Label>
                        <Input
                          id="maxAmount"
                          type="number"
                          placeholder="Leave empty for no limit"
                          value={newTier.maxAmount}
                          onChange={(e) => setNewTier({ ...newTier, maxAmount: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                        <Input
                          id="commissionRate"
                          type="number"
                          step="0.1"
                          placeholder="5"
                          value={newTier.commissionRate}
                          onChange={(e) => setNewTier({ ...newTier, commissionRate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          placeholder="e.g., Orders below ₹10,000"
                          value={newTier.description}
                          onChange={(e) => setNewTier({ ...newTier, description: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateTier} disabled={createTierMutation.isPending}>
                        Create Tier
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {tiersLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : tiers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No commission tiers configured
                </div>
              ) : (
                <div className="space-y-4">
                  {tiers.map((tier) => (
                    <div
                      key={tier.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            ₹{parseFloat(tier.minAmount).toLocaleString()} - {" "}
                            {tier.maxAmount ? `₹${parseFloat(tier.maxAmount).toLocaleString()}` : "No Limit"}
                          </span>
                          <Badge variant={tier.isActive ? "default" : "secondary"}>
                            {tier.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {(parseFloat(tier.commissionRate) * 100).toFixed(2)}% Commission
                        </div>
                        {tier.description && (
                          <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={tier.isActive}
                          onCheckedChange={() => handleToggleTierStatus(tier)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingTier(tier)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this tier?")) {
                              deleteTierMutation.mutate(tier.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How Commission Tiers Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Commission rates are automatically applied based on the order amount</p>
              <p>• Tiers are evaluated from highest to lowest minimum amount</p>
              <p>• The first matching tier is used for commission calculation</p>
              <p>• Inactive tiers are not considered in calculations</p>
              <p>• Individual suppliers can have custom rates that override these tiers</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Restricted Suppliers Tab */}
        <TabsContent value="restricted" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Restricted Suppliers
              </CardTitle>
              <CardDescription>
                Suppliers who have exceeded their commission credit limit
              </CardDescription>
            </CardHeader>
            <CardContent>
              {restrictedLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : restrictedSuppliers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No restricted suppliers
                </div>
              ) : (
                <div className="space-y-4">
                  {restrictedSuppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg bg-destructive/5"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{supplier.businessName}</h3>
                          <Badge variant="destructive">Restricted</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{supplier.storeName}</p>
                        <div className="mt-2 space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Email:</span>
                            <span>{supplier.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Phone:</span>
                            <span>{supplier.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Unpaid Commission:</span>
                            <span className="font-bold text-destructive">
                              ₹{parseFloat(supplier.totalUnpaid).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Credit Limit:</span>
                            <span>₹{parseFloat(supplier.creditLimit).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Overdue Amount:</span>
                            <span className="font-bold text-destructive">
                              ₹{(parseFloat(supplier.totalUnpaid) - parseFloat(supplier.creditLimit)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (confirm(`Lift restriction for ${supplier.businessName}? They will regain full access.`)) {
                              liftRestrictionMutation.mutate(supplier.id);
                            }
                          }}
                          disabled={liftRestrictionMutation.isPending}
                        >
                          Lift Restriction
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About Supplier Restrictions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Suppliers are automatically restricted when unpaid commissions exceed their credit limit</p>
              <p>• Restricted suppliers cannot create quotations, respond to RFQs, or add new products</p>
              <p>• They can still view their dashboard and submit commission payments</p>
              <p>• Restrictions are automatically lifted when payments are verified and balance is below limit</p>
              <p>• Admins can manually lift restrictions if needed</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
 
            );
          }
