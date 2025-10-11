import { Users, Package, Globe, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function StatsSection() {
  const stats = [
    { 
      label: "Active Suppliers", 
      value: "200K+", 
      description: "Verified manufacturers worldwide",
      icon: Users,
      color: "from-gray-500 to-gray-600"
    },
    { 
      label: "Products", 
      value: "50M+", 
      description: "Across 40+ categories",
      icon: Package,
      color: "from-purple-500 to-pink-500"
    },
    { 
      label: "Countries", 
      value: "190+", 
      description: "Global market reach",
      icon: Globe,
      color: "from-green-500 to-emerald-500"
    },
    { 
      label: "Buyers", 
      value: "10M+", 
      description: "Active monthly users",
      icon: TrendingUp,
      color: "from-red-500 to-red-600"
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Trusted by Millions Worldwide
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join the world's largest B2B marketplace and connect with verified suppliers and buyers globally
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="group relative overflow-hidden hover-elevate transition-all duration-300 hover:-translate-y-1" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardContent className="p-6 sm:p-8 text-center">
                  <div className="space-y-4">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary" data-testid={`text-stat-value-${index}`}>
                        {stat.value}
                      </div>
                      <div className="font-bold text-base sm:text-lg text-foreground" data-testid={`text-stat-label-${index}`}>
                        {stat.label}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed" data-testid={`text-stat-desc-${index}`}>
                        {stat.description}
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-gray-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
