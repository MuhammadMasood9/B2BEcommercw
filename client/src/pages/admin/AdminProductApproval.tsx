import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Breadcrumb from "@/components/Breadcrumb";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle,
  Clock,
  Filter,
  Download
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  categoryId: string;
  supplierId: string;
  approvalStatus: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  isPublished: boolean;
  createdAt: string;
  supplierName?: string;
  categoryName?: string;
}

export default function AdminProductApproval() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | null;
    product: Product | null;
  }>({ open: false, action: null, product: null });
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch products by approval status
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['/api/admin/products/approval', activeTab, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('approvalStatus', activeTab);
      if (search) params.append('search', search);
      
      const response = await fetch(`/api/admin/products/approval?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch products');
      return await response.json();
    },
  });

  const products = productsData?.products || [];

  // Approve product mutation
  const approveProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/admin/products/${productId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to approve product');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products/approval'] });
      toast({ title: "Success", description: "Product approved successfully" });
      setActionDialog({ open: false, action: null, product: null });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve product", variant: "destructive" });
    },
  });

  // Reject product mutation
  const rejectProductMutation = useMutation({
    mutationFn: async ({ productId, reason }: { productId: string; reason: string }) => {
      const response = await fetch(`/api/admin/products/${productId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to reject product');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products/approval'] });
      toast({ title: "Success", description: "Product rejected" });
      setActionDialog({ open: false, action: null, product: null });
      setRejectionReason("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject product", variant: "destructive" });
    },
  });

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      const response = await fetch('/api/admin/products/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productIds }),
      });
      if (!response.ok) throw new Error('Failed to bulk approve products');
      return await response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products/approval'] });
      toast({ title: "Success", description: `${variables.length} products approved` });
      setSelectedProducts([]);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to bulk approve products", variant: "destructive" });
    },
  });

  const handleAction = () => {
    if (!actionDialog.product) return;

    if (actionDialog.action === 'approve') {
      approveProductMutation.mutate(actionDialog.product.id);
    } else if (actionDialog.action === 'reject') {
      if (!rejectionReason.trim()) {
        toast({ title: "Error", description: "Rejection reason is required", variant: "destructive" });
        return;
      }
      rejectProductMutation.mutate({ 
        productId: actionDialog.product.id, 
        reason: rejectionReason 
      });
    }
  };

  const handleBulkApprove = () => {
    if (selectedProducts.length === 0) {
      toast({ title: "Error", description: "No products selected", variant: "destructive" });
      return;
    }
    bulkApproveMutation.mutate(selectedProducts);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    setSelectedProducts(products.map((p: Product) => p.id));
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: "secondary", icon: Clock, label: "Pending" },
      approved: { variant: "default", icon: CheckCircle, label: "Approved" },
      rejected: { variant: "destructive", icon: XCircle, label: "Rejected" },
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

  // Calculate stats
  const stats = {
    pending: products.filter((p: Product) => p.approvalStatus === 'pending').length,
    approved: products.filter((p: Product) => p.approvalStatus === 'approved').length,
    rejected: products.filter((p: Product) => p.approvalStatus === 'rejected').length,
  };

  return (
    <div className="p-8 space-y-6">
      <Breadcrumb items={[{ label: "Product Approval" }]} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Product Approval</h1>
          <p className="text-muted-foreground mt-1">Review and approve supplier product submissions</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-100">Pending Review</CardTitle>
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

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-100">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Bulk Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {selectedProducts.length > 0 && activeTab === 'pending' && (
              <div className="flex gap-2">
                <Button onClick={handleBulkApprove}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Selected ({selectedProducts.length})
                </Button>
                <Button variant="outline" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({stats.approved})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({stats.rejected})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center">Loading products...</div>
              ) : products.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No products found</h3>
                  <p className="text-muted-foreground">No products in this category</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {activeTab === 'pending' && (
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedProducts.length === products.length && products.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                selectAllProducts();
                              } else {
                                clearSelection();
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </TableHead>
                      )}
                      <TableHead>Product</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product: Product) => (
                      <TableRow key={product.id}>
                        {activeTab === 'pending' && (
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product.id)}
                              onChange={() => toggleProductSelection(product.id)}
                              className="rounded border-gray-300"
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="h-12 w-12 rounded object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {product.description}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{product.supplierName || 'Unknown'}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.categoryName || 'Uncategorized'}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(product.approvalStatus)}</TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {new Date(product.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedProduct(product);
                                setViewDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {product.approvalStatus === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => setActionDialog({ open: true, action: 'approve', product })}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setActionDialog({ open: true, action: 'reject', product })}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Product Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div>
                <Label>Product Name</Label>
                <div className="text-lg font-medium">{selectedProduct.name}</div>
              </div>
              <div>
                <Label>Description</Label>
                <div className="text-sm">{selectedProduct.description}</div>
              </div>
              <div>
                <Label>Images</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {selectedProduct.images?.map((img, idx) => (
                    <img key={idx} src={img} alt="" className="w-full h-24 object-cover rounded" />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Supplier</Label>
                  <div className="text-sm">{selectedProduct.supplierName}</div>
                </div>
                <div>
                  <Label>Category</Label>
                  <div className="text-sm">{selectedProduct.categoryName}</div>
                </div>
              </div>
              {selectedProduct.rejectionReason && (
                <div>
                  <Label>Rejection Reason</Label>
                  <div className="text-sm text-red-600">{selectedProduct.rejectionReason}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'approve' ? 'Approve Product' : 'Reject Product'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {actionDialog.action === 'approve' ? (
              <p>Are you sure you want to approve this product? It will be published on the marketplace.</p>
            ) : (
              <div className="space-y-2">
                <Label>Rejection Reason *</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  rows={4}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, action: null, product: null })}>
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
