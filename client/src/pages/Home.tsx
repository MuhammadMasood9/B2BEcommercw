import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import CategoryGrid from "@/components/CategoryGrid";
import FeaturedProducts from "@/components/FeaturedProducts";
import StatsSection from "@/components/StatsSection";
import RFQSection from "@/components/RFQSection";
import TopSuppliers from "@/components/TopSuppliers";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Award } from "lucide-react";
import { useLoading } from "@/contexts/LoadingContext";

export default function Home() {
  const { setLoading } = useLoading();

  useEffect(() => {
    // Show loader when component mounts
    setLoading(true, "Loading Global Trade Hub...");
    
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []); // Empty dependency array - only run once on mount
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <CategoryGrid />
        <FeaturedProducts />
        <StatsSection />
        
        <section className="py-20 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-gray-400/10 rounded-full blur-3xl" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-12">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 text-sm text-white/90">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Trade Assurance Protection</span>
                </div>
                
                <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                  Trade with <span className="bg-gradient-to-r from-gray-200 to-gray-300 bg-clip-text text-transparent">Confidence</span>
                </h2>
                
                <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                  Our Trade Assurance protects your orders from payment to delivery. 
                  Get refunds for orders that don't ship on time or meet quality requirements.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Secure Payment</h3>
                  </div>
                  <p className="text-white/80 leading-relaxed">
                    Your payments are protected throughout the entire transaction process with our secure payment system.
                  </p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Quality Guarantee</h3>
                  </div>
                  <p className="text-white/80 leading-relaxed">
                    We ensure product quality meets your specifications with our comprehensive quality assurance program.
                  </p>
                </div>
              </div>
              
              <div className="pt-8">
                <Button size="lg" variant="outline" className="h-14 px-8 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 group" data-testid="button-learn-trade-assurance">
                  Learn More About Trade Assurance
                  <Award className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        <RFQSection />
        <TopSuppliers />
      </main>
      <Footer />
    </div>
  );
}
