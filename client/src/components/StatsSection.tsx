import { Users, Package, Globe, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import HeroBackgroundWrapper from "@/components/HeroBackgroundWrapper";

export default function StatsSection() {
  const stats = [
    {
      label: "Active Suppliers",
      value: "200K+",
      description: "Verified manufacturers worldwide",
      icon: Users,
    },
    {
      label: "Products",
      value: "50M+",
      description: "Across 40+ categories",
      icon: Package,
    },
    {
      label: "Countries",
      value: "190+",
      description: "Global market reach",
      icon: Globe,
    },
    {
      label: "Buyers",
      value: "10M+",
      description: "Active monthly users",
      icon: TrendingUp,
    },
  ];

  return (
    <HeroBackgroundWrapper
      className="py-20"
      contentClassName="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
          Trusted by Millions Worldwide
        </h2>
        <p className="text-lg text-white/80 max-w-2xl mx-auto">
          Join the world's largest B2B marketplace and connect with verified
          suppliers and buyers globally
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="group relative overflow-hidden border-white/10 bg-white/5 text-white transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10"
              data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="space-y-4">
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-lg border border-brand-orange-500/20 bg-gradient-to-br from-brand-orange-500/20 via-brand-orange-400/10 to-brand-orange-300/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  >
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-brand-orange-100" />
                  </div>

                  <div className="space-y-2">
                    <div
                      className="text-3xl sm:text-4xl md:text-5xl font-bold"
                      data-testid={`text-stat-value-${index}`}
                    >
                      {stat.value}
                    </div>
                    <div
                      className="font-semibold text-base sm:text-lg text-white/90"
                      data-testid={`text-stat-label-${index}`}
                    >
                      {stat.label}
                    </div>
                    <div
                      className="text-xs sm:text-sm text-white/70 leading-relaxed"
                      data-testid={`text-stat-desc-${index}`}
                    >
                      {stat.description}
                    </div>
                  </div>
                </div>

                <div className="absolute inset-0 bg-white/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </HeroBackgroundWrapper>
  );
}
