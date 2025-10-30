import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Upload,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  MoreHorizontal,
  FileText,
  BarChart3
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ProductForm from "./ProductForm";
import BulkUploadDialog from "./BulkUploadDialog";
import ProductAnalytics from "./ProductAnalytics";

interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  categoryId?: string;
  categoryName?: string;
  images: string[];
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  isApproved: boolean;
  isPublished: boolean;
  isFeatured: boolean;
  minOrderQuantity: number;
  priceRanges?: Array<{
    minQty: number;
    maxQty?: number;
    pricePerUnit: number;
  }>;
  sampleAvailable: boolean;
  samplePrice?: string;
  inStock: boolean;
  stockQuantity: number;
  views: number;
  inquiries: number;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductsResponse {
  success: boolean;
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  const limit = 20;

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((currentPage - 1) * limit).toString(),
      });

      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('categoryId', categoryFilter);

      const response = await fetch(`/api/suppliers/products?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data: ProductsResponse = await response.json();
      setProducts(data.products);
      setTotalProducts(data.total);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchQuery, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle product deletion
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`/api/suppliers/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        fetchProducts(); // Refresh the list
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  // Get status badge
  const getStatusBadge = (product: Product) => {
    switch (product.status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending_approval':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'draft':
        return <Badge variant="outline"><Edit className="w-3 h-3 mr-1" />Draft</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get price display
  const getPriceDisplay = (product: Product) => {
    if (product.priceRanges && product.priceRanges.length > 0) {
      const minPrice = Math.min(...product.priceRanges.map(r => r.pricePerUnit));
      const maxPrice = Math.max(...product.priceRanges.map(r => r.pricePerUnit));
      if (minPrice === maxPrice) {
        return `$${minPrice.toFixed(2)}`;
      }
      return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
    }
    return 'Contact for price';
  };

  const totalPages = Math.ceil(totalProducts / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Product Management</h2>
          <p className="text-muted-foreground">Manage your product catalog and track performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAnalytics(true)}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button onClick={() => {
            setSelectedProduct(null);
            setShowProductForm(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending_approval">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Products ({totalProducts})</span>
            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Start by adding your first product'
                }
              </p>
              {!searchQuery && statusFilter === 'all' && categoryFilter === 'all' && (
                <Button onClick={() => {
                  setSelectedProduct(null);
                  setShowProductForm(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Product
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold truncate">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">{product.categoryName || 'Uncategorized'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(product)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedProduct(product);
                                setShowProductForm(true);
                              }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {product.shortDescription && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {product.shortDescription}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">{getPriceDisplay(product)}</span>
                        <span className="text-muted-foreground">MOQ: {product.minOrderQuantity}</span>
                        <span className="text-muted-foreground">Stock: {product.stockQuantity}</span>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Eye className="w-3 h-3" />
                          {product.views}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <FileText className="w-3 h-3" />
                          {product.inquiries}
                        </div>
                      </div>

                      {product.status === 'rejected' && product.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                          <div className="flex items-center gap-1 text-red-800 font-medium mb-1">
                            <AlertCircle className="w-3 h-3" />
                            Rejection Reason:
                          </div>
                          <p className="text-red-700">{product.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalProducts)} of {totalProducts} products
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Form Dialog */}
      <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            product={selectedProduct}
            categories={categories}
            onSuccess={() => {
              setShowProductForm(false);
              setSelectedProduct(null);
              fetchProducts();
            }}
            onCancel={() => {
              setShowProductForm(false);
              setSelectedProduct(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <BulkUploadDialog
        open={showBulkUpload}
        onOpenChange={setShowBulkUpload}
        onSuccess={() => {
          setShowBulkUpload(false);
          fetchProducts();
        }}
      />

      {/* Analytics Dialog */}
      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Analytics</DialogTitle>
          </DialogHeader>
          <ProductAnalytics />
        </DialogContent>
      </Dialog>
    </div>
  );
}