import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Image as ImageIcon,
  Star,
  Package,
  TrendingUp,
  Users,
  Activity,
  Plus,
  Upload,
  Trash2,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import Breadcrumb from '@/components/Breadcrumb';

// ==================== INTERFACES ====================

interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  images: string[];
  supplierId?: string;
  supplierName?: string;
  supplierTier?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  isApproved: boolean;
  isPublished: boolean;
  isFeatured: boolean;
  minOrderQuantity: number;
  sampleAvailable: boolean;
  samplePrice?: string;
  customizationAvailable: boolean;
  inStock: boolean;
  stockQuantity: number;
  views: number;
  inquiries: number;
  tags?: string[];
  sku?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

interface ProductFilters {
  status: string[];
  category: string;
  supplier: string;
  featured: boolean | null;
  inStock: boolean | null;
  search: string;
}

interface ProductStats {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  featuredProducts: number;
  outOfStockProducts: number;
  totalViews: number;
  totalInquiries: number;
  conversionRate: number;
  highPerformers: number;
}

// ==================== MAIN COMPONENT ====================

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [filters, setFilters] = useState<ProductFilters>({
    status: [],
    category: '',
    supplier: '',
    featured: null,
    inStock: null,
    search: ''
  });
  
  const [stats, setStats] = useState<ProductStats>({
    totalProducts: 0,
    publishedProducts: 0,
    draftProducts: 0,
    featuredProducts: 0,
    outOfStockProducts: 0,
    totalViews: 0,
    totalInquiries: 0,
    conversionRate: 0,
    highPerformers: 0
  });
  
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  const [suppliers, setSuppliers] = useState<Array<{id: string, name: string}>>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'feature' | 'unfeature' | 'delete' | ''>('');
  const [bulkNotes, setBulkNotes] = useState('');
  
  // ==================== DATA FETCHING ====================
  
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSuppliers();
  }, [filters]);
  
  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      
      if (filters.status.length > 0) {
        filters.status.forEach(status => queryParams.append('status', status));
      }
      if (filters.category) {
        queryParams.set('category', filters.category);
      }
      if (filters.supplier) {
        queryParams.set('supplier', filters.supplier);
      }
      if (filters.featured !== null) {
        queryParams.set('featured', filters.featured.toString());
      }
      if (filters.inStock !== null) {
        queryParams.set('inStock', filters.inStock.toString());
      }
      if (filters.search) {
        queryParams.set('search', filters.search);
      }
      
      const response = await fetch(`/api/admin/products?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };
  
  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/admin/suppliers');
      const data = await response.json();
      if (data.success) {
        setSuppliers(data.suppliers || []);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };
  
  // ==================== EVENT HANDLERS ====================
  
  const handleProductSelect = (productId: string, selected: boolean) => {
    if (selected) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };
  
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedProducts(products.map(product => product.id));
    } else {
      setSelectedProducts([]);
    }
  };
  
  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductDialogOpen(true);
  };
  
  const handleBulkAction = async (action: 'approve' | 'reject' | 'feature' | 'unfeature' | 'delete') => {
    if (selectedProducts.length === 0) return;
    
    setBulkAction(action);
    setBulkActionDialogOpen(true);
  };
  
  const executeBulkAction = async () => {
    try {
      const response = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: selectedProducts,
          action: bulkAction,
          notes: bulkNotes
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchProducts();
        setSelectedProducts([]);
        setBulkActionDialogOpen(false);
        setBulkNotes('');
      }
    } catch (error) {
      console.error('Error executing bulk action:', error);
    }
  };
  
  const handleProductAction = async (productId: string, action: 'approve' | 'reject' | 'feature' | 'unfeature' | 'delete', notes?: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchProducts();
      }
    } catch (error) {
      console.error(`Error ${action}ing product:`, error);
    }
  };
  
  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  // ==================== UTILITY FUNCTIONS ====================
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getPerformanceColor = (views: number, inquiries: number) => {
    const score = views + (inquiries * 10);
    if (score >= 100) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // ==================== RENDER ====================
  
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb 
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Products', href: '/admin/products' }
        ]} 
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your B2B product catalog with pricing tiers and specifications
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-green-600">{stats.publishedProducts}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.draftProducts}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Featured</p>
                <p className="text-2xl font-bold text-purple-600">{stats.featuredProducts}</p>
              </div>
              <Star className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.outOfStockProducts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Avg {Math.round(stats.totalViews / Math.max(stats.totalProducts, 1))}/product</p>
              </div>
              <Eye className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalInquiries}</p>
                <p className="text-xs text-gray-500">Avg {Math.round(stats.totalInquiries / Math.max(stats.totalProducts, 1))}/product</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">Views to Inquiries</p>
              </div>
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products, SKU, descriptions..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Status Filter */}
            <Select
              value={filters.status.join(',') || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? [] : value.split(','))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Category Filter */}
            <Select
              value={filters.category || 'all'}
              onValueChange={(value) => handleFilterChange('category', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
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
            
            {/* Supplier Filter */}
            <Select
              value={filters.supplier || 'all'}
              onValueChange={(value) => handleFilterChange('supplier', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Featured Filter */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={filters.featured === true}
                onCheckedChange={(checked) => handleFilterChange('featured', checked ? true : null)}
              />
              <label htmlFor="featured" className="text-sm">Featured Only</label>
            </div>
            
            {/* In Stock Filter */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inStock"
                checked={filters.inStock === true}
                onCheckedChange={(checked) => handleFilterChange('inStock', checked ? true : null)}
              />
              <label htmlFor="inStock" className="text-sm">In Stock Only</label>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('approve')}
                  className="text-green-600 hover:text-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Bulk Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('reject')}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Bulk Reject
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('feature')}
                  className="text-purple-600 hover:text-purple-700"
                >
                  <Star className="h-4 w-4 mr-1" />
                  Feature
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Products Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Products ({products.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedProducts.length === products.length && products.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first product</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={(checked) => handleProductSelect(product.id, checked as boolean)}
                    />
                    
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      {product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 truncate">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {product.supplierName && `by ${product.supplierName}`}
                            {product.categoryName && ` • ${product.categoryName}`}
                            {product.sku && ` • SKU: ${product.sku}`}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Created {format(new Date(product.createdAt), 'MMM dd, yyyy')}
                            {product.approvedAt && ` • Approved ${format(new Date(product.approvedAt), 'MMM dd, yyyy')}`}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(product.status)}>
                            {product.status.replace('_', ' ')}
                          </Badge>
                          {product.isFeatured && (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                              Featured
                            </Badge>
                          )}
                          {!product.inStock && (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              Out of Stock
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Product Metrics */}
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{product.views} views</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{product.inquiries} inquiries</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">MOQ: {product.minOrderQuantity}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Activity className="h-4 w-4 text-gray-400" />
                          <span className={`text-sm font-medium ${getPerformanceColor(product.views, product.inquiries)}`}>
                            Performance Score: {product.views + (product.inquiries * 10)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProduct(product)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        
                        {product.status === 'pending_approval' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleProductAction(product.id, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleProductAction(product.id, 'reject')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        
                        {product.isApproved && (
                          <Button
                            variant="outline"
                            size="sm"
                            className={product.isFeatured ? "text-gray-600" : "text-purple-600 hover:text-purple-700"}
                            onClick={() => handleProductAction(product.id, product.isFeatured ? 'unfeature' : 'feature')}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            {product.isFeatured ? 'Unfeature' : 'Feature'}
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Product Details Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-6">
              {/* Product Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {selectedProduct.name}</p>
                    <p><strong>SKU:</strong> {selectedProduct.sku || 'N/A'}</p>
                    <p><strong>Category:</strong> {selectedProduct.categoryName || 'N/A'}</p>
                    <p><strong>Supplier:</strong> {selectedProduct.supplierName || 'N/A'}</p>
                    <p><strong>Status:</strong> 
                      <Badge className={`ml-2 ${getStatusColor(selectedProduct.status)}`}>
                        {selectedProduct.status.replace('_', ' ')}
                      </Badge>
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Performance Metrics</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Views:</strong> {selectedProduct.views.toLocaleString()}</p>
                    <p><strong>Inquiries:</strong> {selectedProduct.inquiries}</p>
                    <p><strong>Conversion Rate:</strong> {selectedProduct.views > 0 ? ((selectedProduct.inquiries / selectedProduct.views) * 100).toFixed(2) : 0}%</p>
                    <p><strong>Stock:</strong> {selectedProduct.inStock ? `${selectedProduct.stockQuantity} units` : 'Out of stock'}</p>
                    <p><strong>MOQ:</strong> {selectedProduct.minOrderQuantity}</p>
                  </div>
                </div>
              </div>
              
              {/* Product Description */}
              {selectedProduct.description && (
                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    {selectedProduct.description}
                  </div>
                </div>
              )}
              
              {/* Product Images */}
              {selectedProduct.images.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Product Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedProduct.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Product ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Tags */}
              {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Bulk {bulkAction?.charAt(0).toUpperCase()}{bulkAction?.slice(1)} Products
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You are about to {bulkAction} {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''}. 
              {bulkAction === 'delete' && ' This action cannot be undone.'}
            </p>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Notes {bulkAction === 'reject' ? '(required)' : '(optional)'}
              </label>
              <Textarea
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                placeholder={`Add notes for this bulk ${bulkAction} action...`}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setBulkActionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={executeBulkAction}
                disabled={bulkAction === 'reject' && !bulkNotes.trim()}
                className={
                  bulkAction === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                  bulkAction === 'reject' || bulkAction === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                  bulkAction === 'feature' ? 'bg-purple-600 hover:bg-purple-700' : ''
                }
              >
                {bulkAction?.charAt(0).toUpperCase()}{bulkAction?.slice(1)} {selectedProducts.length} Product{selectedProducts.length > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}