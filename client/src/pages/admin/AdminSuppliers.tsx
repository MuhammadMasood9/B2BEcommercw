import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Ban,
  Shield,
  Store,
  Building,
  Mail,
  Phone,
  MapPin,
  MoreHorizontal,
  Download,
  Filter,
  Calendar,
  AlertCircle,
  Star,
  Package,
  TrendingUp,
  Users,
  Clock,
  Globe
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import Breadcrumb from "@/components/Breadcrumb";

// Supplier type based on the schema
interface Supplier {
  id: string;
  userId: string;
  businessName: string;
  businessType: 'manufacturer' | 'trading_company' | 'wholesaler';
  storeName: string;
  storeSlug: string;
  contactPerson: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  membershipTier: 'free' | 'silver' | 'gold' | 'platinum';
  verificationLevel: 'none' | 'basic' | 'business' | 'premium' | 'trade_assurance';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  isActive: boolean;
  isSuspended: boolean;
  rating: number;
  totalReviews: number;
  totalProducts: number;
  totalOrders: number;
  totalSales: number;
  createdAt: string;
  updatedAt: string;
}

interface SupplierStats {
  statusDistribution: Record<string, number>;
  membershipTiers: Record<string, number>;
  verificationLevels: Record<string, number>;
  recentRegistrations: number;
}

export default function AdminSuppliers() {
  const [search, setSearch] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [filterVerification, setFilterVerification] = useState<string>("all");
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch suppliers from API
  const { data: suppliersResponse, isLoading, error } = useQuery({
    queryKey: [
      "/api/admin/suppliers",
      search,
      filterStatus,
      filterTier,
      filterVerification,
      filterCountry,
      pageSize,
      currentPage
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterStatus !== "all") params.append('status', filterStatus);
      if (filterTier !== "all") params.append('membershipTier', filterTier);
      if (filterVerification !== "all") params.append('verificationLevel', filterVerification);
      if (filterCountry !== "all") params.append('country', filterCountry);
      params.append('limit', pageSize.toString());
      params.append('offset', ((currentPage - 1) * pageSize).toString());

      const url = `/api/admin/suppliers?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      return await res.json();
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch pending suppliers
  const { data: pendingSuppliersResponse } = useQuery({
    queryKey: ["/api/admin/suppliers/pending"],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', '100');

      const url = `/api/admin/suppliers/pending?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      return await res.json();
    },
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch supplier statistics
  const { data: stats } = useQuery<SupplierStats>({
    queryKey: ["/api/admin/suppliers/stats/overview"],
    queryFn: getQueryFn({ on401: "throw" }),
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const suppliers = (suppliersResponse as any)?.suppliers || [];
  const totalSuppliers = (suppliersResponse as any)?.total || 0;
  const pendingSuppliers = (pendingSuppliersResponse as any)?.suppliers || [];

  // Approve Supplier Mutation
  const approveSupplierMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      return await apiRequest("POST", `/api/admin/suppliers/${id}/approve`, { approvalNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers/stats/overview"] });
      toast({ title: "Success", description: "Supplier approved successfully" });
      setIsApprovalDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to approve supplier", variant: "destructive" });
    },
  });

  // Reject Supplier Mutation
  const rejectSupplierMutation = useMutation({
    mutationFn: async ({ id, reason, notes }: { id: string; reason: string; notes?: string }) => {
      return await apiRequest("POST", `/api/admin/suppliers/${id}/reject`, {
        rejectionReason: reason,
        rejectionNotes: notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers/stats/overview"] });
      toast({ title: "Success", description: "Supplier rejected successfully" });
      setIsRejectionDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to reject supplier", variant: "destructive" });
    },
  });

  // Suspend Supplier Mutation
  const suspendSupplierMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      return await apiRequest("POST", `/api/admin/suppliers/${id}/suspend`, {
        status: 'suspended',
        reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers/stats/overview"] });
      toast({ title: "Success", description: "Supplier suspended successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to suspend supplier", variant: "destructive" });
    },
  });

  // Activate Supplier Mutation
  const activateSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/admin/suppliers/${id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers/stats/overview"] });
      toast({ title: "Success", description: "Supplier activated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to activate supplier", variant: "destructive" });
    },
  });

  const handleSelectSupplier = (supplierId: string, checked: boolean) => {
    if (checked) {
      setSelectedSuppliers(prev => [...prev, supplierId]);
    } else {
      setSelectedSuppliers(prev => prev.filter(id => id !== supplierId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSuppliers(suppliers.map((supplier: { id: any; }) => supplier.id));
    } else {
      setSelectedSuppliers([]);
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      case 'suspended': return 'outline';
      default: return 'outline';
    }
  };

  const getTierBadgeVariant = (tier: string): "default" | "secondary" | "outline" => {
    switch (tier) {
      case 'platinum': return 'default';
      case 'gold': return 'secondary';
      case 'silver': return 'outline';
      case 'free': return 'outline';
      default: return 'outline';
    }
  };

  const getVerificationBadgeVariant = (level: string): "default" | "secondary" | "outline" => {
    switch (level) {
      case 'trade_assurance': return 'default';
      case 'premium': return 'secondary';
      case 'business': return 'outline';
      case 'basic': return 'outline';
      case 'none': return 'outline';
      default: return 'outline';
    }
  };

  const exportReport = (type: string) => {
    console.log(`Exporting ${type} report`);
    toast({ title: "Export Started", description: `Exporting ${type} data...` });
  };

  const totalPages = Math.ceil(totalSuppliers / pageSize);

  return (
    <div className="p-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "Suppliers" }]} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Supplier Management</h1>
          <p className="text-muted-foreground mt-2">Manage supplier applications, approvals, and performance monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportReport("suppliers")}>
            <Download className="w-4 h-4 mr-2" />
            Export Suppliers
          </Button>
          <Button onClick={() => setLocation("/admin/suppliers/pending")}>
            <Clock className="mr-2 h-4 w-4" />
            Pending ({pendingSuppliers.length})
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Suppliers - Blue */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total Suppliers</CardTitle>
            <Store className="h-6 w-6 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {isLoading ? "..." : (stats?.statusDistribution ? Object.values(stats.statusDistribution).reduce((a, b) => a + b, 0) : 0)}
            </div>
            <p className="text-sm text-blue-100 mt-1">All registered suppliers</p>
          </CardContent>
        </Card>

        {/* Active Suppliers - Green */}
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Active Suppliers</CardTitle>
            <CheckCircle className="h-6 w-6 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {isLoading ? "..." : (stats?.statusDistribution?.approved || 0)}
            </div>
            <p className="text-sm text-green-100 mt-1">Currently active</p>
          </CardContent>
        </Card>

        {/* Pending Approvals - Orange */}
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-100">Pending Approvals</CardTitle>
            <Clock className="h-6 w-6 text-orange-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {isLoading ? "..." : (stats?.statusDistribution?.pending || 0)}
            </div>
            <p className="text-sm text-orange-100 mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        {/* Recent Registrations - Purple */}
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Recent (30 days)</CardTitle>
            <TrendingUp className="h-6 w-6 text-purple-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {isLoading ? "..." : (stats?.recentRegistrations || 0)}
            </div>
            <p className="text-sm text-purple-100 mt-1">New registrations</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search suppliers..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterVerification} onValueChange={setFilterVerification}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Verification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="trade_assurance">Trade Assurance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            {selectedSuppliers.length > 0 && (
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Bulk Actions ({selectedSuppliers.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => console.log("Bulk approve")}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => console.log("Bulk suspend")}>
                      <Ban className="w-4 h-4 mr-2" />
                      Suspend Selected
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => exportReport("selected")} className="text-blue-600">
                      <Download className="w-4 h-4 mr-2" />
                      Export Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Suppliers ({totalSuppliers})
            {selectedSuppliers.length > 0 && (
              <span className="text-sm text-muted-foreground ml-2">
                ({selectedSuppliers.length} selected)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading suppliers...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Error loading suppliers</h3>
              <p className="text-sm mb-4">{error.message || "Failed to fetch suppliers"}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </div>
          ) : suppliers && suppliers.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedSuppliers.length === suppliers.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Business Info</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier: Supplier) => {
                    const isSelected = selectedSuppliers.includes(supplier.id);
                    return (
                      <TableRow key={supplier.id} className={isSelected ? "bg-blue-50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectSupplier(supplier.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${supplier.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                              <Store className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium">{supplier.businessName}</div>
                              <div className="text-sm text-muted-foreground">{supplier.storeName}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm capitalize">{(supplier.businessType || '').replace('_', ' ')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{supplier.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{supplier.phone}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm">{supplier.city}</div>
                              <div className="text-xs text-muted-foreground">{supplier.country}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant={getStatusBadgeVariant(supplier.status)}>
                              {supplier.status}
                            </Badge>
                            <Badge variant={getVerificationBadgeVariant(supplier.verificationLevel)} className="text-xs">
                              {(supplier.verificationLevel || '').replace('_', ' ')}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getTierBadgeVariant(supplier.membershipTier)} className="capitalize">
                            {supplier.membershipTier}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="text-sm">{Number(supplier.rating || 0).toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground">({Number(supplier.totalReviews || 0)})</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{Number(supplier.totalProducts || 0)} products</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{Number(supplier.totalOrders || 0)} orders</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {supplier.createdAt ? new Date(supplier.createdAt).toLocaleTimeString() : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedSupplier(supplier);
                                setIsDetailDialogOpen(true);
                              }}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>

                              {supplier.status === 'pending' && (
                                <>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedSupplier(supplier);
                                    setIsApprovalDialogOpen(true);
                                  }}>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedSupplier(supplier);
                                    setIsRejectionDialogOpen(true);
                                  }}>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}

                              {supplier.status === 'approved' && !supplier.isSuspended && (
                                <DropdownMenuItem onClick={() => {
                                  if (confirm(`Are you sure you want to suspend ${supplier.businessName}?`)) {
                                    suspendSupplierMutation.mutate({
                                      id: supplier.id,
                                      reason: 'Suspended by administrator'
                                    });
                                  }
                                }}>
                                  <Ban className="w-4 h-4 mr-2" />
                                  Suspend
                                </DropdownMenuItem>
                              )}

                              {supplier.isSuspended && (
                                <DropdownMenuItem onClick={() => {
                                  if (confirm(`Are you sure you want to activate ${supplier.businessName}?`)) {
                                    activateSupplierMutation.mutate(supplier.id);
                                  }
                                }}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setLocation(`/admin/suppliers/${supplier.id}`)}>
                                <Globe className="w-4 h-4 mr-2" />
                                View Store
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalSuppliers)} of {totalSuppliers} suppliers
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Store className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No suppliers found</h3>
              <p className="text-sm mb-4">Try adjusting your search or filter criteria</p>
              <Button onClick={() => setSearch("")} variant="outline">
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supplier Detail Dialog */}
      <SupplierDetailDialog
        supplier={selectedSupplier}
        isOpen={isDetailDialogOpen}
        onClose={() => setIsDetailDialogOpen(false)}
      />

      {/* Approval Dialog */}
      <ApprovalDialog
        supplier={selectedSupplier}
        isOpen={isApprovalDialogOpen}
        onClose={() => setIsApprovalDialogOpen(false)}
        onApprove={(notes) => selectedSupplier && approveSupplierMutation.mutate({ id: selectedSupplier.id, notes })}
        isLoading={approveSupplierMutation.isPending}
      />

      {/* Rejection Dialog */}
      <RejectionDialog
        supplier={selectedSupplier}
        isOpen={isRejectionDialogOpen}
        onClose={() => setIsRejectionDialogOpen(false)}
        onReject={(reason, notes) => selectedSupplier && rejectSupplierMutation.mutate({ id: selectedSupplier.id, reason, notes })}
        isLoading={rejectSupplierMutation.isPending}
      />
    </div>
  );
}

// Supplier Detail Dialog Component
function SupplierDetailDialog({
  supplier,
  isOpen,
  onClose
}: {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!supplier) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Supplier Details - {supplier.businessName}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="business">Business Details</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Contact Person:</strong> {supplier.contactPerson}</div>
                  <div><strong>Email:</strong> {supplier.email}</div>
                  <div><strong>Phone:</strong> {supplier.phone}</div>
                  <div><strong>Location:</strong> {supplier.city}, {supplier.country}</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Store Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Store Name:</strong> {supplier.storeName}</div>
                  <div><strong>Store Slug:</strong> {supplier.storeSlug}</div>
                  <div><strong>Business Type:</strong> {(supplier.businessType || '').replace('_', ' ')}</div>
                  <div><strong>Membership:</strong> {supplier.membershipTier}</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="business" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Business Status</h4>
                <div className="space-y-2">
                  <Badge variant={getStatusBadgeVariant(supplier.status)}>{supplier.status}</Badge>
                  <div className="text-sm">
                    <div><strong>Active:</strong> {supplier.isActive ? 'Yes' : 'No'}</div>
                    <div><strong>Suspended:</strong> {supplier.isSuspended ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Registration</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Registered:</strong> {new Date(supplier.createdAt).toLocaleDateString()}</div>
                  <div><strong>Last Updated:</strong> {new Date(supplier.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Number(supplier.rating || 0).toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">{Number(supplier.totalReviews || 0)} reviews</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Number(supplier.totalProducts || 0)}</div>
                  <p className="text-xs text-muted-foreground">Listed products</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Number(supplier.totalOrders || 0)}</div>
                  <p className="text-xs text-muted-foreground">Total orders</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="verification" className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Verification Status</h4>
              <Badge variant={getVerificationBadgeVariant(supplier.verificationLevel)}>
                {(supplier.verificationLevel || '').replace('_', ' ')}
              </Badge>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Approval Dialog Component
function ApprovalDialog({
  supplier,
  isOpen,
  onClose,
  onApprove,
  isLoading
}: {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (notes?: string) => void;
  isLoading: boolean;
}) {
  const [notes, setNotes] = useState("");

  if (!supplier) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve Supplier - {supplier.businessName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to approve this supplier? They will be able to start listing products and managing their store.
          </p>

          <div>
            <label className="text-sm font-medium">Approval Notes (Optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about the approval..."
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={() => onApprove(notes)} disabled={isLoading}>
              {isLoading ? "Approving..." : "Approve Supplier"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Rejection Dialog Component
function RejectionDialog({
  supplier,
  isOpen,
  onClose,
  onReject,
  isLoading
}: {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason: string, notes?: string) => void;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  if (!supplier) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Supplier - {supplier.businessName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please provide a reason for rejecting this supplier application.
          </p>

          <div>
            <label className="text-sm font-medium">Rejection Reason *</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select rejection reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="incomplete_documents">Incomplete Documents</SelectItem>
                <SelectItem value="invalid_business_license">Invalid Business License</SelectItem>
                <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                <SelectItem value="duplicate_application">Duplicate Application</SelectItem>
                <SelectItem value="policy_violation">Policy Violation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Additional Notes (Optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional details about the rejection..."
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => onReject(reason, notes)}
              disabled={isLoading || !reason}
            >
              {isLoading ? "Rejecting..." : "Reject Supplier"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper functions for badge variants
function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'approved': return 'default';
    case 'pending': return 'secondary';
    case 'rejected': return 'destructive';
    case 'suspended': return 'outline';
    default: return 'outline';
  }
}

function getTierBadgeVariant(tier: string): "default" | "secondary" | "outline" {
  switch (tier) {
    case 'platinum': return 'default';
    case 'gold': return 'secondary';
    case 'silver': return 'outline';
    case 'free': return 'outline';
    default: return 'outline';
  }
}

function getVerificationBadgeVariant(level: string): "default" | "secondary" | "outline" {
  switch (level) {
    case 'trade_assurance': return 'default';
    case 'premium': return 'secondary';
    case 'business': return 'outline';
    case 'basic': return 'outline';
    case 'none': return 'outline';
    default: return 'outline';
  }
}