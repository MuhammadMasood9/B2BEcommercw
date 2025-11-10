import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Breadcrumb from "@/components/Breadcrumb";
import { useToast } from "@/hooks/use-toast";
import {
  Store,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Star,
  Eye,
  Ban,
  RefreshCw,
  Filter,
  Download,
  TrendingUp,
  Package,
  DollarSign,
  Users,
  Award
} from "lucide-react";

interface Supplier {
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  storeName: string;
  storeSlug: string;
  contactPerson: string;
  phone: string;
  city: string;
  country: string;
  verificationLevel: string;
  isVerified: boolean;
  verifiedAt: string | null;
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  rating: number;
  totalReviews: number;
  totalSales: number;
  totalOrders: number;
  createdAt: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export default function AdminSuppliers() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterVerification, setFilterVerification] = useState<string>("all");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | 'suspend' | 'verify' | null;
    supplier: Supplier | null;
  }>({ open: false, action: null, supplier: null });
  const [actionReason, setActionReason] = useState("");
  const [verificationLevel, setVerificationLevel] = useState("basic");
  const { toast } = useToast();

  // Fetch suppliers
  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ['/api/admin/suppliers', search, filterStatus, filterVerification],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterVerification !== 'all') params.append('verificationLevel', filterVerification);
      
      const response = await fetch(`/api/admin/suppliers?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      return await response.json();
    },
  });

  const suppliers = suppliersData?.suppliers || [];

  // Supplier action mutations
  const approveSupplierMutation = useMutation({
    mutationFn: async ({ id, verificationLevel }: { id: string; verificationLevel: string }) => {
      const response = await fetch(`/api/admin/suppliers/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ verificationLevel }),
      });
      if (!response.ok) throw new Error('Failed to approve supplier');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers'] });
      toast({ title: "Success", description: "Supplier approved successfully" });
      setActionDialog({ open: false, action: null, supplier: null });
      setActionReason("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve supplier", variant: "destructive" });
    },
  });

  const rejectSupplierMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await fetch(`/api/admin/suppliers/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to reject supplier');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers'] });
      toast({ title: "Success", description: "Supplier rejected" });
      setActionDialog({ open: false, action: null, supplier: null });
      setActionReason("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject supplier", variant: "destructive" });
    },
  });

  const suspendSupplierMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await fetch(`/api/admin/suppliers/${id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to suspend supplier');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers'] });
      toast({ title: "Success", description: "Supplier suspended" });
      setActionDialog({ open: false, action: null, supplier: null });
      setActionReason("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to suspend supplier", variant: "destructive" });
    },
  });

  const reactivateSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/suppliers/${id}/reactivate`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to reactivate supplier');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers'] });
      toast({ title: "Success", description: "Supplier reactivated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reactivate supplier", variant: "destructive" });
    },
  });

  const updateVerificationMutation = useMutation({
    mutationFn: async ({ id, verificationLevel, isVerified }: { id: string; verificationLevel: string; isVerified: boolean }) => {
      const response = await fetch(`/api/admin/suppliers/${id}/verification`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ verificationLevel, isVerified }),
      });
      if (!response.ok) throw new Error('Failed to update verification');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers'] });
      toast({ title: "Success", description: "Verification updated" });
      setActionDialog({ open: false, action: null, supplier: null });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update verification", variant: "destructive" });
    },
  });

  const handleAction = () => {
    if (!actionDialog.supplier) return;

    switch (actionDialog.action) {
      case 'approve':
        approveSupplierMutation.mutate({ 
          id: actionDialog.supplier.id, 
          verificationLevel 
        });
        break;
      case 'reject':
        if (!actionReason.trim()) {
          toast({ title: "Error", description: "Rejection reason is required", variant: "destructive" });
          return;
        }
        rejectSupplierMutation.mutate({ 
          id: actionDialog.supplier.id, 
          reason: actionReason 
        });
        break;
      case 'suspend':
        if (!actionReason.trim()) {
          toast({ title: "Error", description: "Suspension reason is required", variant: "destructive" });
          return;
        }
        suspendSupplierMutation.mutate({ 
          id: actionDialog.supplier.id, 
          reason: actionReason 
        });
        break;
      case 'verify':
        updateVerificationMutation.mutate({
          id: actionDialog.supplier.id,
          verificationLevel,
          isVerified: true
        });
        break;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: "secondary", icon: AlertCircle, label: "Pending" },
      approved: { variant: "default", icon: CheckCircle, label: "Approved" },
      rejected: { variant: "destructive", icon: XCircle, label: "Rejected" },
      suspended: { variant: "destructive", icon: Ban, label: "Suspended" },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getVerificationBadge = (level: string, isVerified: boolean) => {
    if (!isVerified) return <Badge variant="outline">Not Verified</Badge>;
    
    const colors: Record<string, string> = {
      basic: "bg-blue-100 text-blue-800",
      business: "bg-purple-100 text-purple-800",
      premium: "bg-yellow-100 text-yellow-800",
    };
    return (
      <Badge className={colors[level] || colors.basic}>
        <Shield className="h-3 w-3 mr-1" />
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </Badge>
    );
  };

  // Calculate stats
  const stats = {
    total: suppliers.length,
    pending: suppliers.filter((s: Supplier) => s.status === 'pending').length,
    approved: suppliers.filter((s: Supplier) => s.status === 'approved').length,
    verified: suppliers.filter((s: Supplier) => s.isVerified).length,
    totalSales: suppliers.reduce((sum: number, s: Supplier) => sum + (s.totalSales || 0), 0),
    totalOrders: suppliers.reduce((sum: number, s: Supplier) => sum + (s.totalOrders || 0), 0),
  };

  return (
    <div className="p-8 space-y-6">
      <Breadcrumb items={[{ label: "Supplier Management" }]} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Supplier Management</h1>
          <p className="text-muted-foreground mt-1">Manage supplier registrations, verifications, and performance</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-100">Total Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-100">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-100">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-100">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.verified}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-100">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${stats.totalSales.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-teal-100">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterVerification} onValueChange={setFilterVerification}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="none">Not Verified</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Loading suppliers...</div>
          ) : suppliers.length === 0 ? (
            <div className="p-8 text-center">
              <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No suppliers found</h3>
              <p className="text-muted-foreground">No suppliers match your filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Business Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier: Supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{supplier.storeName}</div>
                        <div className="text-sm text-muted-foreground">{supplier.businessName}</div>
                        <div className="text-xs text-muted-foreground">{supplier.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{supplier.businessType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {supplier.city}, {supplier.country}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                    <TableCell>{getVerificationBadge(supplier.verificationLevel, supplier.isVerified)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          {Number(supplier.rating || 0).toFixed(1)} ({supplier.totalReviews || 0})
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {supplier.totalOrders || 0} orders • ${Number(supplier.totalSales || 0).toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {supplier.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => setActionDialog({ open: true, action: 'approve', supplier })}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setActionDialog({ open: true, action: 'reject', supplier })}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {supplier.status === 'approved' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setActionDialog({ open: true, action: 'verify', supplier })}
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setActionDialog({ open: true, action: 'suspend', supplier })}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Suspend
                            </Button>
                          </>
                        )}
                        {supplier.status === 'suspended' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => reactivateSupplierMutation.mutate(supplier.id)}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Reactivate
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'approve' && 'Approve Supplier'}
              {actionDialog.action === 'reject' && 'Reject Supplier'}
              {actionDialog.action === 'suspend' && 'Suspend Supplier'}
              {actionDialog.action === 'verify' && 'Update Verification'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {actionDialog.action === 'approve' && (
              <div className="space-y-2">
                <Label>Verification Level</Label>
                <Select value={verificationLevel} onValueChange={setVerificationLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {actionDialog.action === 'verify' && (
              <div className="space-y-2">
                <Label>Verification Level</Label>
                <Select value={verificationLevel} onValueChange={setVerificationLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {(actionDialog.action === 'reject' || actionDialog.action === 'suspend') && (
              <div className="space-y-2">
                <Label>Reason *</Label>
                <Textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason..."
                  rows={4}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, action: null, supplier: null })}>
              Cancel
            </Button>
            <Button onClick={handleAction}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
