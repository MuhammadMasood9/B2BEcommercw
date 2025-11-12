import { 
  Laptop, 
  Shirt, 
  Cog, 
  Car, 
  Home, 
  Hammer,
  Package,
  Lightbulb,
  ArrowRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const categories = [
  { name: "Electronics", icon: Laptop, count: "2.5M+ products", color: "from-gray-500 to-gray-600", href: "/category/electronics" },
  { name: "Fashion", icon: Shirt, count: "1.8M+ products", color: "from-pink-500 to-rose-500", href: "/category/apparel" },
  { name: "Machinery", icon: Cog, count: "950K+ products", color: "from-gray-500 to-slate-500", href: "/category/machinery" },
  { name: "Automotive", icon: Car, count: "1.2M+ products", color: "from-red-500 to-red-600", href: "/category/automotive" },
  { name: "Home & Garden", icon: Home, count: "3.1M+ products", color: "from-green-500 to-emerald-500", href: "/category/home" },
  { name: "Construction", icon: Hammer, count: "720K+ products", color: "from-yellow-500 to-yellow-600", href: "/category/construction" },
  { name: "Packaging", icon: Package, count: "890K+ products", color: "from-purple-500 to-orange-600", href: "/category/packaging" },
  { name: "Lighting", icon: Lightbulb, count: "650K+ products", color: "from-gray-600 to-gray-700", href: "/category/lighting" },
];

export default function CategoryGrid() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Shop by Category
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore millions of products across all major industries from verified suppliers worldwide
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 md:gap-8">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Link key={index} href={category.href}>
                <Card className="group relative overflow-hidden hover-elevate transition-all duration-300 cursor-pointer hover:-translate-y-1" data-testid={`card-category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                          {category.count}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ArrowRight className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                  
                  {/* Hover Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-gray-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Card>
              </Link>
            );
          })}
        </div>

        {/* View All Categories Button */}
        <div className="text-center mt-12">
          <Link href="/categories">
            <Button size="lg" variant="outline" className="group h-12 px-8 border-2">
              View All Categories
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
