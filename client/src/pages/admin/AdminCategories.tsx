import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import Breadcrumb from "@/components/Breadcrumb";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { insertCategorySchema, type Category } from "@shared/schema";
import type { z } from "zod";
import { ImageUpload } from "@/components/ImageUpload";
import {
  FolderTree,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  FolderPlus,
  Image,
  ChevronRight,
  ChevronDown,
  Grid3x3,
  List,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  FileImage,
  Save,
  X
} from "lucide-react";

// Dynamic categories data loaded from API

export default function AdminCategories() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"hierarchy" | "flat">("hierarchy");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["1", "4"]));
  const { toast } = useToast();

  // Fetch categories from API (real data, not demo)
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      try {
        const data = await apiRequest("GET", "/api/categories");
        console.log("Fetched categories from API:", data);
        
        // Ensure the response is an array, or default to an empty array
        if (Array.isArray(data)) {
          return data as Category[];
        } else {
          console.warn("API /api/categories did not return an array:", data);
          return [];
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Return empty array on error
        return [];
      }
    },
  });

  // Create/Update category mutation
  const saveCategoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertCategorySchema>) => {
      if (selectedCategory) {
        return await apiRequest("PUT", `/api/categories/${selectedCategory.id}`, data);
      } else {
        return await apiRequest("POST", "/api/categories", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success",
        description: `Category ${selectedCategory ? 'updated' : 'created'} successfully.`,
      });
      setIsDialogOpen(false);
      setSelectedCategory(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save category",
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success",
        description: "Category deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  // Toggle category status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/categories/${id}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success",
        description: "Category status updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update category status",
        variant: "destructive",
      });
    },
  });

  // Toggle category featured status
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: string; isFeatured: boolean }) => {
      return await apiRequest("PATCH", `/api/categories/${id}/featured`, { isFeatured });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success",
        description: "Category featured status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update category featured status",
        variant: "destructive",
      });
    },
  });

  // Get parent categories (for dropdown)
  const parentCategories = categories.filter(c => !c.parentId);

  // Get subcategories for a parent
  const getSubcategories = (parentId: string) => {
    return categories.filter(c => c.parentId === parentId);
  };

  // Filter categories
  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Toggle expand/collapse
  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Calculate stats
  const stats = {
    total: categories.length,
    active: categories.filter(c => c.isActive).length,
    inactive: categories.filter(c => !c.isActive).length,
    parent: categories.filter(c => !c.parentId).length,
    subcategories: categories.filter(c => c.parentId).length,
  };

  return (
    <div className="p-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "Categories" }]} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Category Management</h1>
          <p className="text-muted-foreground mt-2">Organize products with categories and subcategories</p>
        </div>
        <div className="flex gap-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
              <Button onClick={() => setSelectedCategory(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>
                  {selectedCategory ? "Edit Category" : "Add New Category"}
                </DialogTitle>
            </DialogHeader>
              <CategoryForm
                category={selectedCategory}
                parentCategories={parentCategories}
                onSubmit={(data) => saveCategoryMutation.mutate(data)}
                isLoading={saveCategoryMutation.isPending}
              />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Total Categories - Blue */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-100">Total Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </CardContent>
        </Card>
        
        {/* Parent Categories - Green */}
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-100">Parent Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.parent}</div>
          </CardContent>
        </Card>
        
        {/* Subcategories - Purple */}
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-100">Subcategories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.subcategories}</div>
          </CardContent>
        </Card>
        
        {/* Active - Teal */}
        <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-teal-100">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.active}</div>
          </CardContent>
        </Card>
        
        {/* Inactive - Red */}
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-100">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "hierarchy" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("hierarchy")}
              >
                <FolderTree className="h-4 w-4 mr-2" />
                Hierarchy
              </Button>
              <Button
                variant={viewMode === "flat" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("flat")}
              >
                <List className="h-4 w-4 mr-2" />
                Flat View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Loading categories...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-8 text-center">
              <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No categories found</h3>
              <p className="text-muted-foreground mb-4">
                {search ? "Try a different search term" : "Get started by creating your first category"}
              </p>
              {!search && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {viewMode === "hierarchy" ? (
                  <>
                    {parentCategories
                      .filter(c =>
                        c.name.toLowerCase().includes(search.toLowerCase()) ||
                        c.description?.toLowerCase().includes(search.toLowerCase())
                      )
                      .map((parent) => (
                        <CategoryRow
                          key={parent.id}
                          category={parent}
                          subcategories={getSubcategories(parent.id)}
                          isExpanded={expandedCategories.has(parent.id)}
                          onToggleExpand={() => toggleExpand(parent.id)}
                          onEdit={(cat) => {
                            setSelectedCategory(cat);
                            setIsDialogOpen(true);
                          }}
                          onDelete={(id) => {
                            if (confirm("Are you sure you want to delete this category?")) {
                              deleteCategoryMutation.mutate(id);
                            }
                          }}
                          onToggleStatus={(id, isActive) => toggleStatusMutation.mutate({ id, isActive })}
                          onToggleFeatured={(id, isFeatured) => toggleFeaturedMutation.mutate({ id, isFeatured })}
                          level={0}
                        />
                      ))}
                  </>
                ) : (
                  <>
                    {filteredCategories.map((category) => (
                      <CategoryRow
                        key={category.id}
                        category={category}
                        subcategories={[]}
                        isExpanded={false}
                        onToggleExpand={() => {}}
                        onEdit={(cat) => {
                          setSelectedCategory(cat);
                          setIsDialogOpen(true);
                        }}
                        onDelete={(id) => {
                          if (confirm("Are you sure you want to delete this category?")) {
                            deleteCategoryMutation.mutate(id);
                          }
                        }}
                        onToggleStatus={(id, isActive) => toggleStatusMutation.mutate({ id, isActive })}
                        onToggleFeatured={(id, isFeatured) => toggleFeaturedMutation.mutate({ id, isFeatured })}
                        level={0}
                        flatView
                      />
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Category Row Component
interface CategoryRowProps {
  category: Category;
  subcategories: Category[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onToggleFeatured?: (id: string, isFeatured: boolean) => void;
  level: number;
  flatView?: boolean;
}

function CategoryRow({
  category,
  subcategories,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onToggleStatus,
  onToggleFeatured,
  level,
  flatView = false,
}: CategoryRowProps) {
  const hasSubcategories = subcategories.length > 0;

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
            {!flatView && hasSubcategories && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={onToggleExpand}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
            <div className="flex items-center gap-3">
              {category.imageUrl ? (
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                  <FolderTree className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="font-medium">{category.name}</p>
                <p className="text-xs text-muted-foreground">{category.slug}</p>
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <p className="text-sm text-muted-foreground max-w-xs truncate">
            {category.description || "No description"}
          </p>
        </TableCell>
        <TableCell>
          {category.parentId ? (
            <Badge variant="outline">Subcategory</Badge>
          ) : (
            <Badge variant="default">Parent</Badge>
          )}
        </TableCell>
        <TableCell>
          <span className="text-sm text-muted-foreground">0 products</span>
        </TableCell>
        <TableCell>
          <span className="text-sm">{category.displayOrder}</span>
        </TableCell>
        <TableCell>
          <Switch
            checked={category.isFeatured ?? false}
            onCheckedChange={(checked) => onToggleFeatured?.(category.id, checked)}
          />
        </TableCell>
        <TableCell>
          <Switch
            checked={category.isActive ?? false}
            onCheckedChange={(checked) => onToggleStatus(category.id, checked)}
          />
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(category)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" />
                View Products
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(category.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Render subcategories if expanded */}
      {!flatView && isExpanded && subcategories.map((sub) => (
        <CategoryRow
          key={sub.id}
          category={sub}
          subcategories={[]}
          isExpanded={false}
          onToggleExpand={() => {}}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
          level={level + 1}
        />
      ))}
    </>
  );
}

// Category Form Component
interface CategoryFormProps {
  category: Category | null;
  parentCategories: Category[];
  onSubmit: (data: z.infer<typeof insertCategorySchema>) => void;
  isLoading: boolean;
}

function CategoryForm({ category, parentCategories, onSubmit, isLoading }: CategoryFormProps) {
  const form = useForm<z.infer<typeof insertCategorySchema>>({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: category?.name || "",
      slug: category?.slug || "",
      description: category?.description || "",
      parentId: category?.parentId || null,
      imageUrl: category?.imageUrl || "",
      displayOrder: category?.displayOrder || 0,
      isActive: category?.isActive ?? true,
    },
  });

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    form.setValue("name", name);
    if (!category) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      form.setValue("slug", slug);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Electronics"
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Slug *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., electronics" />
                  </FormControl>
                  <FormDescription>
                    Used in URLs. Only lowercase letters, numbers, and hyphens.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Describe this category..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None (Top Level)</SelectItem>
                      {parentCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Leave as "None" to create a top-level category
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ImageUpload
                      value={field.value ? [field.value] : []}
                      onChange={(urls) => field.onChange(urls[0] || "")}
                      maxImages={1}
                      label="Category Image"
                      description="Upload an image for this category (optional)"
                    />
                  </FormControl>
                  <FormMessage />
          </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="displayOrder"
              render={({ field }) => (
          <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      value={field.value || 0}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Lower numbers appear first (default: 0)
                  </FormDescription>
            <FormMessage />
          </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Inactive categories won't be displayed on the website
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
          </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Saving..." : category ? "Update Category" : "Create Category"}
        </Button>
        </div>
      </form>
    </Form>
  );
}
