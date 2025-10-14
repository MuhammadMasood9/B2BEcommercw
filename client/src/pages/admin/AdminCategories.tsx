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

// B2B Categories data - comprehensive industry categories
const mockCategories: Category[] = [
  // Electronics & Electrical
  {
    id: "1",
    name: "Electronics & Electrical",
    slug: "electronics-electrical",
    description: "Electronic devices, components, and electrical equipment for industrial and commercial use",
    parentId: null,
    imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400",
    displayOrder: 1,
    isActive: true,
    createdAt: new Date("2024-01-10"),
  },
  {
    id: "2",
    name: "Consumer Electronics",
    slug: "consumer-electronics",
    description: "Mobile phones, tablets, computers, and consumer electronic devices",
    parentId: "1",
    imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
    displayOrder: 1,
    isActive: true,
    createdAt: new Date("2024-01-11"),
  },
  {
    id: "3",
    name: "Electronic Components",
    slug: "electronic-components",
    description: "Integrated circuits, capacitors, resistors, and electronic components",
    parentId: "1",
    imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
    displayOrder: 2,
    isActive: true,
    createdAt: new Date("2024-01-11"),
  },
  {
    id: "4",
    name: "LED & Lighting",
    slug: "led-lighting",
    description: "LED lights, commercial lighting, and industrial lighting solutions",
    parentId: "1",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    displayOrder: 3,
    isActive: true,
    createdAt: new Date("2024-01-11"),
  },

  // Machinery & Equipment
  {
    id: "5",
    name: "Machinery & Equipment",
    slug: "machinery-equipment",
    description: "Industrial machinery, construction equipment, and manufacturing tools",
    parentId: null,
    imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400",
    displayOrder: 2,
    isActive: true,
    createdAt: new Date("2024-01-12"),
  },
  {
    id: "6",
    name: "Industrial Machinery",
    slug: "industrial-machinery",
    description: "Manufacturing equipment, production lines, and industrial automation",
    parentId: "5",
    imageUrl: "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=400",
    displayOrder: 1,
    isActive: true,
    createdAt: new Date("2024-01-13"),
  },
  {
    id: "7",
    name: "Construction Machinery",
    slug: "construction-machinery",
    description: "Excavators, bulldozers, cranes, and construction equipment",
    parentId: "5",
    imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400",
    displayOrder: 2,
    isActive: true,
    createdAt: new Date("2024-01-13"),
  },

  // Apparel & Fashion
  {
    id: "8",
    name: "Apparel & Fashion",
    slug: "apparel-fashion",
    description: "Clothing, textiles, and fashion accessories for wholesale and retail",
    parentId: null,
    imageUrl: "https://images.unsplash.com/photo-1558769132-cb1aea3c0eb4?w=400",
    displayOrder: 3,
    isActive: true,
    createdAt: new Date("2024-01-14"),
  },
  {
    id: "9",
    name: "Men's Clothing",
    slug: "mens-clothing",
    description: "Men's apparel, suits, shirts, and business wear",
    parentId: "8",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    displayOrder: 1,
    isActive: true,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "10",
    name: "Women's Clothing",
    slug: "womens-clothing",
    description: "Women's apparel, dresses, blouses, and professional wear",
    parentId: "8",
    imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400",
    displayOrder: 2,
    isActive: true,
    createdAt: new Date("2024-01-15"),
  },

  // Automotive & Transportation
  {
    id: "11",
    name: "Automotive & Transportation",
    slug: "automotive-transportation",
    description: "Auto parts, vehicles, and transportation equipment",
    parentId: null,
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    displayOrder: 4,
    isActive: true,
    createdAt: new Date("2024-01-16"),
  },
  {
    id: "12",
    name: "Auto Parts",
    slug: "auto-parts",
    description: "Engine parts, brakes, suspension, and automotive components",
    parentId: "11",
    imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08e3?w=400",
    displayOrder: 1,
    isActive: true,
    createdAt: new Date("2024-01-17"),
  },

  // Home & Garden
  {
    id: "13",
    name: "Home & Garden",
    slug: "home-garden",
    description: "Home decor, furniture, garden supplies, and household items",
    parentId: null,
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400",
    displayOrder: 5,
    isActive: true,
    createdAt: new Date("2024-01-18"),
  },
  {
    id: "14",
    name: "Furniture",
    slug: "furniture",
    description: "Office furniture, home furniture, and commercial seating",
    parentId: "13",
    imageUrl: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400",
    displayOrder: 1,
    isActive: true,
    createdAt: new Date("2024-01-19"),
  },

  // Packaging & Printing
  {
    id: "15",
    name: "Packaging & Printing",
    slug: "packaging-printing",
    description: "Packaging materials, printing services, and labeling solutions",
    parentId: null,
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    displayOrder: 6,
    isActive: true,
    createdAt: new Date("2024-01-20"),
  },

  // Health & Medical
  {
    id: "16",
    name: "Health & Medical",
    slug: "health-medical",
    description: "Medical equipment, health products, and pharmaceutical supplies",
    parentId: null,
    imageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400",
    displayOrder: 7,
    isActive: true,
    createdAt: new Date("2024-01-21"),
  },

  // Food & Beverage
  {
    id: "17",
    name: "Food & Beverage",
    slug: "food-beverage",
    description: "Food products, beverages, and food processing equipment",
    parentId: null,
    imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
    displayOrder: 8,
    isActive: true,
    createdAt: new Date("2024-01-22"),
  },

  // Beauty & Personal Care
  {
    id: "18",
    name: "Beauty & Personal Care",
    slug: "beauty-personal-care",
    description: "Cosmetics, skincare, personal care products, and beauty equipment",
    parentId: null,
    imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400",
    displayOrder: 9,
    isActive: true,
    createdAt: new Date("2024-01-23"),
  },

  // Sports & Entertainment
  {
    id: "19",
    name: "Sports & Entertainment",
    slug: "sports-entertainment",
    description: "Sports equipment, toys, games, and entertainment products",
    parentId: null,
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
    displayOrder: 10,
    isActive: true,
    createdAt: new Date("2024-01-24"),
  },

  // Industrial Supplies
  {
    id: "20",
    name: "Industrial Supplies",
    slug: "industrial-supplies",
    description: "Tools, hardware, safety equipment, and industrial consumables",
    parentId: null,
    imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400",
    displayOrder: 11,
    isActive: true,
    createdAt: new Date("2024-01-25"),
  },
];

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
        const response = await apiRequest("GET", "/api/categories");
        const data = await response.json();
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
        const response = await apiRequest("PUT", `/api/categories/${selectedCategory.id}`, data);
        return await response.json();
      } else {
        const response = await apiRequest("POST", "/api/categories", data);
        return await response.json();
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
      const response = await apiRequest("DELETE", `/api/categories/${id}`);
      return await response.json();
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
      const response = await apiRequest("PATCH", `/api/categories/${id}/status`, { isActive });
      return await response.json();
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Parent Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.parent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subcategories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subcategories}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
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
