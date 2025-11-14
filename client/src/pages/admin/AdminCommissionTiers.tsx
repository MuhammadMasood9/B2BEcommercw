import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

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

interface TierFormData {
  minAmount: string;
  maxAmount: string;
  commissionRate: string;
  description: string;
}

export default function AdminCommissionTiers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<CommissionTier | null>(null);
  const [formData, setFormData] = useState<TierFormData>({
    minAmount: "",
    maxAmount: "",
    commissionRate: "",
    description: "",
  });
  const [validationError, setValidationError] = useState<string>("");

  // Fetch commission tiers
  const { data: tiersData, isLoading } = useQuery({
    queryKey: ["/api/commissions/admin/commission-tiers"],
    queryFn: async () => {
      const response = await fetch("/api/commissions/admin/commission-tiers", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch commission tiers");
      return response.json();
    },
  });

  const tiers: CommissionTier[] = tiersData?.tiers || [];

  // Validate tier ranges don't overlap
  const validateTierRanges = (newTier: TierFormData, excludeTierId?: string): string | null => {
    const minAmount = parseFloat(newTier.minAmount);
    const maxAmount = newTier.maxAmount ? parseFloat(newTier.maxAmount) : Infinity;

    if (isNaN(minAmount) || minAmount < 0) {
      return "Minimum amount must be a valid positive number";
    }

    if (newTier.maxAmount && (isNaN(maxAmount) || maxAmount <= minAmount)) {
      return "Maximum amount must be greater than minimum amount";
    }

    const rate = parseFloat(newTier.commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 1) {
      return "Commission rate must be between 0 and 1 (0% to 100%)";
    }

    // Check for overlapping ranges
    for (const tier of tiers) {
      if (excludeTierId && tier.id === excludeTierId) continue;
      if (!tier.isActive) continue;

      const tierMin = parseFloat(tier.minAmount);
      const tierMax = tier.maxAmount ? parseFloat(tier.maxAmount) : Infinity;

      // Check if ranges overlap
      const overlaps = 
        (minAmount >= tierMin && minAmount <= tierMax) ||
        (maxAmount >= tierMin && maxAmount <= tierMax) ||
        (minAmount <= tierMin && maxAmount >= tierMax);

      if (overlaps) {
        return `Range overlaps with existing tier: ₹${tierMin} - ${tierMax === Infinity ? '∞' : `₹${tierMax}`}`;
      }
    }

    return null;
  };

  // Create tier mutation
  const createTierMutation = useMutation({
    mutationFn: async (data: TierFormData) => {
      const response = await fetch("/api/commissions/admin/commission-tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          minAmount: parseFloat(data.minAmount),
          maxAmount: data.maxAmount ? parseFloat(data.maxAmount) : null,
          commissionRate: parseFloat(data.commissionRate),
          description: data.description || null,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create tier");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commissions/admin/commission-tiers"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Commission tier created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update tier mutation
  const updateTierMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TierFormData> & { isActive?: boolean } }) => {
      const payload: any = {};
      if (data.minAmount) payload.minAmount = parseFloat(data.minAmount);
      if (data.maxAmount !== undefined) payload.maxAmount = data.maxAmount ? parseFloat(data.maxAmount) : null;
      if (data.commissionRate) payload.commissionRate = parseFloat(data.commissionRate);
      if (data.description !== undefined) payload.description = data.description || null;
      if (data.isActive !== undefined) payload.isActive = data.isActive;

      const response = await fetch(`/api/commissions/admin/commission-tiers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update tier");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commissions/admin/commission-tiers"] });
      setIsEditDialogOpen(false);
      setSelectedTier(null);
      resetForm();
      toast({
        title: "Success",
        description: "Commission tier updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete tier mutation
  const deleteTierMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/commissions/admin/commission-tiers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete tier");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commissions/admin/commission-tiers"] });
      setIsDeleteDialogOpen(false);
      setSelectedTier(null);
      toast({
        title: "Success",
        description: "Commission tier deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      minAmount: "",
      maxAmount: "",
      commissionRate: "",
      description: "",
    });
    setValidationError("");
  };

  const handleCreate = () => {
    const error = validateTierRanges(formData);
    if (error) {
      setValidationError(error);
      return;
    }
    createTierMutation.mutate(formData);
  };

  const handleEdit = () => {
    if (!selectedTier) return;
    const error = validateTierRanges(formData, selectedTier.id);
    if (error) {
      setValidationError(error);
      return;
    }
    updateTierMutation.mutate({ id: selectedTier.id, data: formData });
  };

  const handleDelete = () => {
    if (!selectedTier) return;
    deleteTierMutation.mutate(selectedTier.id);
  };

  const openEditDialog = (tier: CommissionTier) => {
    setSelectedTier(tier);
    setFormData({
      minAmount: tier.minAmount,
      maxAmount: tier.maxAmount || "",
      commissionRate: tier.commissionRate,
      description: tier.description || "",
    });
    setValidationError("");
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (tier: CommissionTier) => {
    setSelectedTier(tier);
    setIsDeleteDialogOpen(true);
  };

  const toggleTierActive = (tier: CommissionTier) => {
    updateTierMutation.mutate({
      id: tier.id,
      data: { isActive: !tier.isActive },
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Commission Tiers</h1>
          <p className="text-muted-foreground">Manage tiered commission rates based on order values</p>
        </div>
        <Button onClick={() => {
          resetForm();
          setIsCreateDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Tier
        </Button>
      </div>

      {/* Tiers List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Commission Tiers</CardTitle>
          <CardDescription>
            Commission rates are automatically applied based on order amount ranges
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : tiers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No commission tiers configured. Create your first tier to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    !tier.isActive ? "opacity-50 bg-muted/50" : "hover:bg-accent/50"
                  } transition-colors`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-lg">
                        ₹{parseFloat(tier.minAmount).toLocaleString()} - {tier.maxAmount ? `₹${parseFloat(tier.maxAmount).toLocaleString()}` : '∞'}
                      </p>
                      <Badge variant={tier.isActive ? "default" : "secondary"}>
                        {tier.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tier.description || "No description"}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {(parseFloat(tier.commissionRate) * 100).toFixed(1)}%
                      </div>
                      <p className="text-xs text-muted-foreground">Commission Rate</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={tier.isActive}
                        onCheckedChange={() => toggleTierActive(tier)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(tier)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(tier)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Tier Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Commission Tier</DialogTitle>
            <DialogDescription>
              Define a new commission rate tier based on order value range
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {validationError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {validationError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minAmount">Minimum Amount (₹)</Label>
                <Input
                  id="minAmount"
                  type="number"
                  placeholder="0"
                  value={formData.minAmount}
                  onChange={(e) => {
                    setFormData({ ...formData, minAmount: e.target.value });
                    setValidationError("");
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAmount">Maximum Amount (₹)</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  placeholder="Leave empty for unlimited"
                  value={formData.maxAmount}
                  onChange={(e) => {
                    setFormData({ ...formData, maxAmount: e.target.value });
                    setValidationError("");
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commissionRate">Commission Rate (%)</Label>
              <Input
                id="commissionRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="10"
                value={formData.commissionRate ? (parseFloat(formData.commissionRate) * 100).toString() : ""}
                onChange={(e) => {
                  const percentage = parseFloat(e.target.value);
                  setFormData({ ...formData, commissionRate: (percentage / 100).toString() });
                  setValidationError("");
                }}
              />
              <p className="text-xs text-muted-foreground">
                Enter as percentage (e.g., 10 for 10%)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="e.g., Standard tier for small orders"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createTierMutation.isPending}>
              {createTierMutation.isPending ? "Creating..." : "Create Tier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tier Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Commission Tier</DialogTitle>
            <DialogDescription>
              Update the commission rate tier configuration
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {validationError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {validationError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-minAmount">Minimum Amount (₹)</Label>
                <Input
                  id="edit-minAmount"
                  type="number"
                  placeholder="0"
                  value={formData.minAmount}
                  onChange={(e) => {
                    setFormData({ ...formData, minAmount: e.target.value });
                    setValidationError("");
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-maxAmount">Maximum Amount (₹)</Label>
                <Input
                  id="edit-maxAmount"
                  type="number"
                  placeholder="Leave empty for unlimited"
                  value={formData.maxAmount}
                  onChange={(e) => {
                    setFormData({ ...formData, maxAmount: e.target.value });
                    setValidationError("");
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-commissionRate">Commission Rate (%)</Label>
              <Input
                id="edit-commissionRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="10"
                value={formData.commissionRate ? (parseFloat(formData.commissionRate) * 100).toString() : ""}
                onChange={(e) => {
                  const percentage = parseFloat(e.target.value);
                  setFormData({ ...formData, commissionRate: (percentage / 100).toString() });
                  setValidationError("");
                }}
              />
              <p className="text-xs text-muted-foreground">
                Enter as percentage (e.g., 10 for 10%)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="e.g., Standard tier for small orders"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateTierMutation.isPending}>
              {updateTierMutation.isPending ? "Updating..." : "Update Tier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Commission Tier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this commission tier? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedTier && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">
                ₹{parseFloat(selectedTier.minAmount).toLocaleString()} - {selectedTier.maxAmount ? `₹${parseFloat(selectedTier.maxAmount).toLocaleString()}` : '∞'}
              </p>
              <p className="text-sm text-muted-foreground">
                Rate: {(parseFloat(selectedTier.commissionRate) * 100).toFixed(1)}%
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTierMutation.isPending}
            >
              {deleteTierMutation.isPending ? "Deleting..." : "Delete Tier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
