import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useLoading } from "@/contexts/LoadingContext";
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
  ArrowRight
} from "lucide-react";

export default function Categories() {
  const { setLoading } = useLoading();

  useEffect(() => {
    setLoading(true, "Loading Categories...");
    
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const categories = [
    {
      id: "electronics",
      name: "Electronics & Electrical",
      icon: Laptop,
      subcategories: ["Consumer Electronics", "Electronic Components", "Electrical Equipment", "LED & Lighting"],
      productCount: "2.5M+",
      color: "from-gray-500 to-gray-600"
    },
    {
      id: "apparel",
      name: "Apparel & Fashion",
      icon: Shirt,
      subcategories: ["Men's Clothing", "Women's Clothing", "Kids & Baby Clothing", "Accessories"],
      productCount: "1.8M+",
      color: "from-pink-500 to-rose-500"
    },
    {
      id: "machinery",
      name: "Machinery",
      icon: Wrench,
      subcategories: ["Industrial Machinery", "Construction Machinery", "Agricultural Machinery", "Food Processing"],
      productCount: "950K+",
      color: "from-yellow-500 to-yellow-600"
    },
    {
      id: "automotive",
      name: "Automotive & Transportation",
      icon: Car,
      subcategories: ["Auto Parts", "Motorcycles", "Bicycles", "Vehicle Accessories"],
      productCount: "780K+",
      color: "from-red-500 to-red-600"
    },
    {
      id: "home",
      name: "Home & Garden",
      icon: HomeIcon,
      subcategories: ["Home Decor", "Furniture", "Kitchenware", "Garden Supplies"],
      productCount: "1.2M+",
      color: "from-green-500 to-emerald-500"
    },
    {
      id: "lighting",
      name: "Lights & Lighting",
      icon: Lightbulb,
      subcategories: ["LED Lights", "Outdoor Lighting", "Commercial Lighting", "Smart Lighting"],
      productCount: "450K+",
      color: "from-yellow-500 to-yellow-600"
    },
    {
      id: "packaging",
      name: "Packaging & Printing",
      icon: Package,
      subcategories: ["Packaging Materials", "Paper Products", "Printing Services", "Labels & Tags"],
      productCount: "620K+",
      color: "from-purple-500 to-fuchsia-500"
    },
    {
      id: "construction",
      name: "Construction & Real Estate",
      icon: Hammer,
      subcategories: ["Building Materials", "Hardware", "Real Estate", "Flooring & Tiles"],
      productCount: "890K+",
      color: "from-red-500 to-red-600"
    },
    {
      id: "health",
      name: "Health & Medical",
      icon: Pill,
      subcategories: ["Medical Equipment", "Healthcare Supplies", "Pharmaceuticals", "Personal Care"],
      productCount: "340K+",
      color: "from-teal-500 to-teal-600"
    },
    {
      id: "food",
      name: "Food & Beverage",
      icon: Utensils,
      subcategories: ["Food Products", "Beverages", "Food Ingredients", "Snacks"],
      productCount: "560K+",
      color: "from-rose-500 to-pink-500"
    },
    {
      id: "baby",
      name: "Toys & Baby Products",
      icon: Baby,
      subcategories: ["Baby Care", "Toys & Games", "Baby Clothing", "Nursery Furniture"],
      productCount: "480K+",
      color: "from-gray-500 to-gray-600"
    },
    {
      id: "sports",
      name: "Sports & Entertainment",
      icon: Dumbbell,
      subcategories: ["Sports Equipment", "Outdoor Recreation", "Fitness", "Entertainment"],
      productCount: "410K+",
      color: "from-indigo-500 to-purple-500"
    },
    {
      id: "office",
      name: "Office & School Supplies",
      icon: Briefcase,
      subcategories: ["Office Equipment", "Stationery", "School Supplies", "Writing Instruments"],
      productCount: "320K+",
      color: "from-slate-500 to-gray-500"
    },
    {
      id: "beauty",
      name: "Beauty & Personal Care",
      icon: Palette,
      subcategories: ["Cosmetics", "Skincare", "Hair Care", "Personal Hygiene"],
      productCount: "680K+",
      color: "from-fuchsia-500 to-pink-500"
    },
    {
      id: "energy",
      name: "Energy & Minerals",
      icon: Zap,
      subcategories: ["Solar Energy", "Batteries", "Generators", "Minerals & Metallurgy"],
      productCount: "290K+",
      color: "from-lime-500 to-green-500"
    },
    {
      id: "industrial",
      name: "Industrial Supplies",
      icon: Factory,
      subcategories: ["Tools", "Safety Equipment", "Industrial Parts", "Measurement Tools"],
      productCount: "750K+",
      color: "from-gray-500 to-slate-500"
    },
  ];

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link key={category.id} href={`/category/${category.id}`} data-testid={`link-category-${category.id}`}>
                  <Card className="h-full transition-all duration-300 hover-elevate active-elevate-2 cursor-pointer border-border overflow-hidden group">
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
                      </ul>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
