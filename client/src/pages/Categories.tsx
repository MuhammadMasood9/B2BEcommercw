import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useLoading } from "@/contexts/LoadingContext";
import type { Category } from "@shared/schema";
import { 
  Laptop, 
  Shirt, 
  Wrench, 
  Car, 
  Home as HomeIcon,
  Lightbulb,
  Package,
  Hammer,
  Pill,
  Utensils,
  Baby,
  Dumbbell,
  Briefcase,
  Palette,
  Zap,
  Factory,
  ArrowRight,
  Loader2
} from "lucide-react";

export default function Categories() {
  const { setLoading } = useLoading();

  // Fetch categories from API
  const { data: apiCategories = [], isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/categories", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched categories from API:", data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
      }
    },
  });


  useEffect(() => {
    if (isCategoriesLoading) {
      setLoading(true, "Loading Categories...");
    } else {
      setLoading(false);
    }
  }, [isCategoriesLoading, setLoading]);

  // Icon mapping for categories
  const getIconForCategory = (categoryName: string) => {
    const iconMap: Record<string, any> = {
      'electronics': Laptop,
      'apparel': Shirt,
      'machinery': Wrench,
      'automotive': Car,
      'home': HomeIcon,
      'lighting': Lightbulb,
      'packaging': Package,
      'construction': Hammer,
      'health': Pill,
      'food': Utensils,
      'baby': Baby,
      'sports': Dumbbell,
      'office': Briefcase,
      'beauty': Palette,
      'energy': Zap,
      'industrial': Factory,
    };
    
    const key = categoryName.toLowerCase().split(' ')[0];
    return iconMap[key] || Package;
  };

  // Color mapping for categories
  const getColorForCategory = (index: number) => {
    const colors = [
      "from-gray-500 to-gray-600",
      "from-pink-500 to-rose-500",
      "from-yellow-500 to-yellow-600",
      "from-red-500 to-red-600",
      "from-green-500 to-emerald-500",
      "from-blue-500 to-blue-600",
      "from-purple-500 to-fuchsia-500",
      "from-orange-500 to-orange-600",
      "from-teal-500 to-teal-600",
      "from-indigo-500 to-indigo-600",
    ];
    return colors[index % colors.length];
  };

  // Get parent categories only
  const parentCategories = apiCategories.filter(cat => !cat.parentId && cat.isActive);
  
  // Get subcategories for a parent
  const getSubcategories = (parentId: string) => {
    return apiCategories.filter(cat => cat.parentId === parentId && cat.isActive);
  };

  // Count products for a category (placeholder - you can implement this with a separate API call)
  const getProductCount = (categoryId: string) => {
    return "0"; // Placeholder
  };

  const categories = parentCategories.map((cat, index) => {
    const Icon = getIconForCategory(cat.name);
    const subcategories = getSubcategories(cat.id);
    
    return {
      id: cat.slug,
      name: cat.name,
      icon: Icon,
      subcategories: subcategories.map(sub => sub.name),
      productCount: getProductCount(cat.id),
      color: getColorForCategory(index),
      categoryId: cat.id,
      category: cat
    };
  });



  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1">
        <PageHeader
          title="All Categories"
          subtitle="Explore millions of products across all industries"
          variant="gradient"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {isCategoriesLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-lg text-muted-foreground">Loading categories...</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-20">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Categories Available</h3>
              <p className="text-muted-foreground">
                Categories will appear here once they are added by the administrator.
              </p>
            </div>
          ) : (
            // Show categories grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Link href={`/category/${category.category.slug}`}>
                    <Card 
                      key={category.id} 
                      className="h-full transition-all duration-300 hover-elevate active-elevate-2 cursor-pointer border-border overflow-hidden group"
                      data-testid={`card-category-${category.id}`}
                    >
                    <CardContent className="p-6">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2 text-foreground group-hover:text-primary transition-colors" data-testid={`text-name-${category.id}`}>{category.name}</h3>
                      <Badge variant="secondary" className="mb-4 font-medium" data-testid={`text-count-${category.id}`}>{category.productCount} Products</Badge>
                      <ul className="space-y-1.5">
                        {category.subcategories.slice(0, 3).map((sub, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-center gap-1 group-hover:text-foreground transition-colors" data-testid={`text-subcategory-${category.id}-${idx}`}>
                            <ArrowRight className="w-3 h-3 flex-shrink-0" />
                            {sub}
                          </li>
                        ))}
                        {category.subcategories.length > 3 && (
                          <li className="text-sm text-primary flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 flex-shrink-0" />
                            +{category.subcategories.length - 3} more
                          </li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
