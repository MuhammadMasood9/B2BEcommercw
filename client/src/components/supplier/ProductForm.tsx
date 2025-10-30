import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  X, 
  Plus, 
  Minus, 
  AlertCircle,
  Package,
  DollarSign,
  Settings,
  Image as ImageIcon
} from "lucide-react";

interface Product {
  id?: string;
  name: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  categoryId?: string;
  specifications?: Record<string, any>;
  images: string[];
  minOrderQuantity: number;
  priceRanges?: Array<{
    minQty: number;
    maxQty?: number;
    pricePerUnit: number;
  }>;
  sampleAvailable: boolean;
  samplePrice?: string;
  customizationAvailable: boolean;
  customizationDetails?: string;
  leadTime?: string;
  port?: string;
  paymentTerms: string[];
  inStock: boolean;
  stockQuantity: number;
  colors?: string[];
  sizes?: string[];
  keyFeatures?: string[];
  certifications?: string[];
  tags?: string[];
  hasTradeAssurance: boolean;
  sku?: string;
}

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProductForm({ product, categories, onSuccess, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<Product>({
    name: '',
    shortDescription: '',
    description: '',
    categoryId: '',
    images: [],
    minOrderQuantity: 1,
    priceRanges: [{ minQty: 1, pricePerUnit: 0 }],
    sampleAvailable: false,
    samplePrice: '',
    customizationAvailable: false,
    customizationDetails: '',
    leadTime: '',
    port: '',
    paymentTerms: [],
    inStock: true,
    stockQuantity: 0,
    colors: [],
    sizes: [],
    keyFeatures: [],
    certifications: [],
    tags: [],
    hasTradeAssurance: false,
    sku: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [specifications, setSpecifications] = useState<Array<{ key: string; value: string }>>([]);

  // Initialize form data
  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        priceRanges: product.priceRanges || [{ minQty: 1, pricePerUnit: 0 }],
        paymentTerms: product.paymentTerms || [],
        colors: product.colors || [],
        sizes: product.sizes || [],
        keyFeatures: product.keyFeatures || [],
        certifications: product.certifications || [],
        tags: product.tags || [],
      });

      // Convert specifications object to array
      if (product.specifications) {
        const specs = Object.entries(product.specifications).map(([key, value]) => ({
          key,
          value: String(value)
        }));
        setSpecifications(specs);
      }
    }
  }, [product]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validate required fields
      const newErrors: Record<string, string> = {};
      if (!formData.name.trim()) newErrors.name = 'Product name is required';
      if (!formData.categoryId) newErrors.categoryId = 'Category is required';
      if (formData.minOrderQuantity < 1) newErrors.minOrderQuantity = 'MOQ must be at least 1';

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setLoading(false);
        return;
      }

      // Prepare form data for submission
      const submitFormData = new FormData();
      
      // Add basic fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'images') return; // Handle separately
        if (key === 'priceRanges' || key === 'specifications') {
          submitFormData.append(key, JSON.stringify(value));
        } else if (Array.isArray(value)) {
          submitFormData.append(key, value.join(','));
        } else if (value !== null && value !== undefined) {
          submitFormData.append(key, String(value));
        }
      });

      // Add specifications
      const specsObject = specifications.reduce((acc, spec) => {
        if (spec.key.trim() && spec.value.trim()) {
          acc[spec.key.trim()] = spec.value.trim();
        }
        return acc;
      }, {} as Record<string, string>);
      
      if (Object.keys(specsObject).length > 0) {
        submitFormData.append('specifications', JSON.stringify(specsObject));
      }

      // Add image files
      imageFiles.forEach((file) => {
        submitFormData.append('images', file);
      });

      // Submit to API
      const url = product 
        ? `/api/suppliers/products/${product.id}`
        : '/api/suppliers/products';
      
      const method = product ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        body: submitFormData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save product');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving product:', error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(prev => [...prev, ...files]);
  };

  // Remove image
  const removeImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    } else {
      const existingCount = formData.images.length;
      const fileIndex = index - existingCount;
      setImageFiles(prev => prev.filter((_, i) => i !== fileIndex));
    }
  };

  // Add price range
  const addPriceRange = () => {
    setFormData(prev => ({
      ...prev,
      priceRanges: [
        ...(prev.priceRanges || []),
        { minQty: 1, pricePerUnit: 0 }
      ]
    }));
  };

  // Remove price range
  const removePriceRange = (index: number) => {
    setFormData(prev => ({
      ...prev,
      priceRanges: prev.priceRanges?.filter((_, i) => i !== index) || []
    }));
  };

  // Update price range
  const updatePriceRange = (index: number, field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      priceRanges: prev.priceRanges?.map((range, i) => 
        i === index ? { ...range, [field]: value } : range
      ) || []
    }));
  };

  // Add specification
  const addSpecification = () => {
    setSpecifications(prev => [...prev, { key: '', value: '' }]);
  };

  // Remove specification
  const removeSpecification = (index: number) => {
    setSpecifications(prev => prev.filter((_, i) => i !== index));
  };

  // Update specification
  const updateSpecification = (index: number, field: 'key' | 'value', value: string) => {
    setSpecifications(prev => prev.map((spec, i) => 
      i === index ? { ...spec, [field]: value } : spec
    ));
  };

  // Handle array field updates
  const handleArrayFieldUpdate = (field: keyof Product, value: string) => {
    const array = value.split(',').map(item => item.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, [field]: array }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-red-700 mt-1">{errors.submit}</p>
        </div>
      )}

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter product name"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.categoryId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                  >
                    <SelectTrigger className={errors.categoryId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && <p className="text-sm text-red-600 mt-1">{errors.categoryId}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input
                  id="shortDescription"
                  value={formData.shortDescription || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                  placeholder="Brief product description"
                />
              </div>

              <div>
                <Label htmlFor="description">Full Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed product description"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="Product SKU"
                  />
                </div>

                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags?.join(', ') || ''}
                    onChange={(e) => handleArrayFieldUpdate('tags', e.target.value)}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Specifications</span>
                <Button type="button" variant="outline" size="sm" onClick={addSpecification}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Spec
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {specifications.map((spec, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Specification name"
                      value={spec.key}
                      onChange={(e) => updateSpecification(index, 'key', e.target.value)}
                    />
                    <Input
                      placeholder="Value"
                      value={spec.value}
                      onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSpecification(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {specifications.length === 0 && (
                  <p className="text-muted-foreground text-sm">No specifications added</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pricing & Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minOrderQuantity">Minimum Order Quantity *</Label>
                  <Input
                    id="minOrderQuantity"
                    type="number"
                    min="1"
                    value={formData.minOrderQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, minOrderQuantity: parseInt(e.target.value) || 1 }))}
                    className={errors.minOrderQuantity ? 'border-red-500' : ''}
                  />
                  {errors.minOrderQuantity && <p className="text-sm text-red-600 mt-1">{errors.minOrderQuantity}</p>}
                </div>

                <div>
                  <Label htmlFor="stockQuantity">Stock Quantity</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="inStock"
                  checked={formData.inStock}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, inStock: checked }))}
                />
                <Label htmlFor="inStock">In Stock</Label>
              </div>

              {/* Price Ranges */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Price Ranges</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addPriceRange}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Range
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.priceRanges?.map((range, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        type="number"
                        placeholder="Min Qty"
                        value={range.minQty}
                        onChange={(e) => updatePriceRange(index, 'minQty', parseInt(e.target.value) || 0)}
                      />
                      <Input
                        type="number"
                        placeholder="Max Qty (optional)"
                        value={range.maxQty || ''}
                        onChange={(e) => updatePriceRange(index, 'maxQty', parseInt(e.target.value) || undefined)}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price per unit"
                        value={range.pricePerUnit}
                        onChange={(e) => updatePriceRange(index, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                      />
                      {formData.priceRanges && formData.priceRanges.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removePriceRange(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sampleAvailable"
                    checked={formData.sampleAvailable}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sampleAvailable: checked }))}
                  />
                  <Label htmlFor="sampleAvailable">Sample Available</Label>
                </div>

                {formData.sampleAvailable && (
                  <div>
                    <Label htmlFor="samplePrice">Sample Price</Label>
                    <Input
                      id="samplePrice"
                      type="number"
                      step="0.01"
                      value={formData.samplePrice || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, samplePrice: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="leadTime">Lead Time</Label>
                  <Input
                    id="leadTime"
                    value={formData.leadTime || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, leadTime: e.target.value }))}
                    placeholder="e.g., 15-30 days"
                  />
                </div>

                <div>
                  <Label htmlFor="port">Shipping Port</Label>
                  <Input
                    id="port"
                    value={formData.port || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value }))}
                    placeholder="e.g., Shanghai/Ningbo"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="paymentTerms">Payment Terms (comma-separated)</Label>
                <Input
                  id="paymentTerms"
                  value={formData.paymentTerms.join(', ')}
                  onChange={(e) => handleArrayFieldUpdate('paymentTerms', e.target.value)}
                  placeholder="T/T, L/C, Western Union"
                />
              </div>

              <div>
                <Label htmlFor="colors">Available Colors (comma-separated)</Label>
                <Input
                  id="colors"
                  value={formData.colors?.join(', ') || ''}
                  onChange={(e) => handleArrayFieldUpdate('colors', e.target.value)}
                  placeholder="Black, White, Blue"
                />
              </div>

              <div>
                <Label htmlFor="sizes">Available Sizes (comma-separated)</Label>
                <Input
                  id="sizes"
                  value={formData.sizes?.join(', ') || ''}
                  onChange={(e) => handleArrayFieldUpdate('sizes', e.target.value)}
                  placeholder="S, M, L, XL"
                />
              </div>

              <div>
                <Label htmlFor="keyFeatures">Key Features (comma-separated)</Label>
                <Input
                  id="keyFeatures"
                  value={formData.keyFeatures?.join(', ') || ''}
                  onChange={(e) => handleArrayFieldUpdate('keyFeatures', e.target.value)}
                  placeholder="Waterproof, Durable, Lightweight"
                />
              </div>

              <div>
                <Label htmlFor="certifications">Certifications (comma-separated)</Label>
                <Input
                  id="certifications"
                  value={formData.certifications?.join(', ') || ''}
                  onChange={(e) => handleArrayFieldUpdate('certifications', e.target.value)}
                  placeholder="ISO9001, CE, RoHS"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="customizationAvailable"
                    checked={formData.customizationAvailable}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, customizationAvailable: checked }))}
                  />
                  <Label htmlFor="customizationAvailable">Customization Available</Label>
                </div>

                {formData.customizationAvailable && (
                  <div>
                    <Label htmlFor="customizationDetails">Customization Details</Label>
                    <Textarea
                      id="customizationDetails"
                      value={formData.customizationDetails || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, customizationDetails: e.target.value }))}
                      placeholder="Describe available customization options"
                      rows={3}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="hasTradeAssurance"
                    checked={formData.hasTradeAssurance}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasTradeAssurance: checked }))}
                  />
                  <Label htmlFor="hasTradeAssurance">Trade Assurance Available</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Product Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Image Upload */}
                <div>
                  <Label htmlFor="images">Upload Images</Label>
                  <div className="mt-2">
                    <input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('images')?.click()}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Images
                    </Button>
                  </div>
                </div>

                {/* Image Preview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Existing images */}
                  {formData.images.map((image, index) => (
                    <div key={`existing-${index}`} className="relative">
                      <img
                        src={image}
                        alt={`Product ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => removeImage(index, true)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}

                  {/* New image files */}
                  {imageFiles.map((file, index) => (
                    <div key={`new-${index}`} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`New ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => removeImage(formData.images.length + index, false)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                {formData.images.length === 0 && imageFiles.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No images uploaded</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
        </Button>
      </div>
    </form>
  );
}