import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Store, 
  Building, 
  Mail, 
  Phone, 
  MapPin,
  MoreHorizontal,
  ArrowLeft,
  AlertCircle,
  Clock,
  FileText,
  Download
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import Breadcrumb from "@/components/Breadcrumb";

// Supplier type for pending applications
interface PendingSupplier {
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
  verificationDocs: any;
  status: 'pending';
  createdAt: string;
}

export default function AdminSuppliersPending() {
  const [search, setSearch] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<PendingSupplier | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch pending suppliers from API
  const { data: pendingSuppliersResponse, isLoading, error } = useQuery({
    queryKey: ["/api/admin/suppliers/pending", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
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

  const pendingSuppliers = (pendingSuppliersResponse as any)?.suppliers || [];

  // Approve Supplier Mutation
  const approveSupplierMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      return await apiRequest("POST", `/api/admin/suppliers/${id}/approve`, { approvalNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers/stats/overview"] });
      toast({ title: "Success", description: "Supplier rejected successfully" });
      setIsRejectionDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to reject supplier", variant: "destructive" });
    },
  });

  // Filter and sort suppliers
  const filteredAndSortedSuppliers = pendingSuppliers?.filter((supplier: PendingSupplier) => {
    const matchesSearch = 
      supplier.businessName.toLowerCase().includes(search.toLowerCase()) ||
      supplier.storeName.toLowerCase().includes(search.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      supplier.email.toLowerCase().includes(search.toLowerCase());
    
    return matchesSearch;
  }).sort((a: PendingSupplier, b: PendingSupplier) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case "businessName":
        aValue = a.businessName.toLowerCase();
        bValue = b.businessName.toLowerCase();
        break;
      case "email":
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
        break;
      case "country":
        aValue = a.country.toLowerCase();
        bValue = b.country.toLowerCase();
        break;
      case "createdAt":
      default:
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
    }
    
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const exportReport = () => {
    console.log("Exporting pending suppliers report");
    toast({ title: "Export Started", description: "Exporting pending suppliers data..." });
  };

  return (
    <div className="p-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: "Suppliers", href: "/admin/suppliers" },
        { label: "Pending Approvals" }
      ]} />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setLocation("/admin/suppliers")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Suppliers
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Pending Supplier Approvals</h1>
            <p className="text-muted-foreground mt-2">Review and approve new supplier applications</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Pending
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-orange-100">Pending Applications</CardTitle>
          <Clock className="h-6 w-6 text-orange-200" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-white">
            {isLoading ? "..." : pendingSuppliers.length}
          </div>
          <p className="text-sm text-orange-100 mt-1">Awaiting your review</p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search pending suppliers..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Application Date</SelectItem>
                  <SelectItem value="businessName">Business Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="country">Country</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Pending Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Pending Applications ({filteredAndSortedSuppliers?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading pending applications...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Error loading applications</h3>
              <p className="text-sm mb-4">{error.message || "Failed to fetch pending suppliers"}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </div>
          ) : filteredAndSortedSuppliers && filteredAndSortedSuppliers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Business Info</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Membership</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedSuppliers.map((supplier: PendingSupplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-orange-100">
                          <Store className="h-4 w-4 text-orange-600" />
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
                          <span className="text-sm capitalize">{supplier.businessType.replace('_', ' ')}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {supplier.verificationLevel.replace('_', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{supplier.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{supplier.phone}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">{supplier.contactPerson}</div>
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
                      <Badge variant="outline" className="capitalize">
                        {supplier.membershipTier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(supplier.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(supplier.createdAt).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { 
                            setSelectedSupplier(supplier); 
                            setIsDetailDialogOpen(true); 
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No pending applications</h3>
              <p className="text-sm mb-4">All supplier applications have been processed</p>
              <Button onClick={() => setLocation("/admin/suppliers")} variant="outline">
                View All Suppliers
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supplier Detail Dialog */}
      <PendingSupplierDetailDialog 
        supplier={selectedSupplier}
        isOpen={isDetailDialogOpen}
        onClose={() => setIsDetailDialogOpen(false)}
        onApprove={() => {
          setIsDetailDialogOpen(false);
          setIsApprovalDialogOpen(true);
        }}
        onReject={() => {
          setIsDetailDialogOpen(false);
          setIsRejectionDialogOpen(true);
        }}
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

// Pending Supplier Detail Dialog Component
function PendingSupplierDetailDialog({ 
  supplier, 
  isOpen, 
  onClose,
  onApprove,
  onReject
}: { 
  supplier: PendingSupplier | null; 
  isOpen: boolean; 
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  if (!supplier) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Application - {supplier.businessName}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="business">Business Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Contact Person:</strong> {supplier.contactPerson}</div>
                  <div><strong>Email:</strong> {supplier.email}</div>
                  <div><strong>Phone:</strong> {supplier.phone}</div>
                  <div><strong>Location:</strong> {supplier.city}, {supplier.country}</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Store Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Store Name:</strong> {supplier.storeName}</div>
                  <div><strong>Store Slug:</strong> {supplier.storeSlug}</div>
                  <div><strong>Business Type:</strong> {supplier.businessType.replace('_', ' ')}</div>
                  <div><strong>Requested Tier:</strong> {supplier.membershipTier}</div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="business" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Application Details</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Business Name:</strong> {supplier.businessName}</div>
                  <div><strong>Business Type:</strong> {supplier.businessType.replace('_', ' ')}</div>
                  <div><strong>Verification Level:</strong> {supplier.verificationLevel.replace('_', ' ')}</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Application Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Applied:</strong> {new Date(supplier.createdAt).toLocaleDateString()}</div>
                  <div><strong>Time:</strong> {new Date(supplier.createdAt).toLocaleTimeString()}</div>
                  <div><strong>Status:</strong> <Badge variant="secondary">Pending Review</Badge></div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="documents" className="space-y-4">
            <div>
              <h4 className="font-semibold mb-3">Verification Documents</h4>
              {supplier.verificationDocs ? (
                <div className="space-y-3">
                  {Object.entries(supplier.verificationDocs as Record<string, string>).map(([docType, docPath]) => (
                    <div key={docType} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium capitalize">{docType.replace(/([A-Z])/g, ' $1')}</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => window.open(docPath as string, '_blank')}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No documents uploaded</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="destructive" onClick={onReject}>
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button onClick={onApprove}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve
          </Button>
        </div>
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
  supplier: PendingSupplier | null; 
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
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-green-900">Approve Application</h4>
            </div>
            <p className="text-sm text-green-800">
              This supplier will be able to start listing products and managing their store immediately after approval.
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium">Approval Notes (Optional)</label>
            <Textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about the approval process..."
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
  supplier: PendingSupplier | null; 
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
          <DialogTitle>Reject Application - {supplier.businessName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <h4 className="font-medium text-red-900">Reject Application</h4>
            </div>
            <p className="text-sm text-red-800">
              Please provide a clear reason for rejection. The supplier will be notified with this information.
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium">Rejection Reason *</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select rejection reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="incomplete_documents">Incomplete or Invalid Documents</SelectItem>
                <SelectItem value="invalid_business_license">Invalid Business License</SelectItem>
                <SelectItem value="suspicious_activity">Suspicious Activity Detected</SelectItem>
                <SelectItem value="duplicate_application">Duplicate Application</SelectItem>
                <SelectItem value="policy_violation">Platform Policy Violation</SelectItem>
                <SelectItem value="insufficient_information">Insufficient Business Information</SelectItem>
                <SelectItem value="other">Other (specify in notes)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Additional Details</label>
            <Textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide specific details about the rejection reason..."
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
              {isLoading ? "Rejecting..." : "Reject Application"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}