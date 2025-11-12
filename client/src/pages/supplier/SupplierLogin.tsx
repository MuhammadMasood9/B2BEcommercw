import { useState } from "react";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2,
  Store,
  TrendingUp,
  Users,
  DollarSign,
  ArrowRight,
  CheckCircle,
  Package,
  BarChart3
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function SupplierLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const success = await login(email, password);
    
    if (success) {
      setLocation('/supplier/dashboard');
    }
    
    setIsSubmitting(false);
  };

  const features = [
    { icon: Store, text: "Manage Your Store", color: "text-brand-orange-600" },
    { icon: Package, text: "List Products", color: "text-green-600" },
    { icon: BarChart3, text: "Track Performance", color: "text-brand-grey-600" },
    { icon: DollarSign, text: "Grow Revenue", color: "text-brand-orange-600" }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      {/* <Header /> */}
      
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Side - Branding & Features */}
          <div className="hidden lg:flex flex-col justify-center space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-orange-100 rounded-full px-4 py-2 text-sm text-brand-orange-700 font-medium mb-6">
                <Store className="w-4 h-4" />
                <span>Supplier Portal</span>
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold brand-text-on-light mb-4">
                Welcome Back
                <span className="text-gradient-brand block mt-2">
                  Supplier Partner
                </span>
              </h1>
              <p className="text-lg text-brand-grey-600 mb-8">
                Access your supplier dashboard to manage products, orders, and grow your business.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="brand-card rounded-xl p-4 shadow-lg">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color === 'text-brand-orange-600' ? 'from-brand-orange-100 to-brand-orange-200' : feature.color === 'text-green-600' ? 'from-green-100 to-green-200' : feature.color === 'text-brand-grey-600' ? 'from-brand-grey-100 to-brand-grey-200' : 'from-brand-orange-100 to-brand-orange-200'} flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${feature.color}`} />
                    </div>
                    <p className="text-sm font-medium brand-text-on-light">{feature.text}</p>
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-r from-brand-orange-50 to-brand-grey-50 rounded-2xl p-6 border border-brand-orange-100">
              <h3 className="font-semibold brand-text-on-light mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-orange-600" />
                Join Successful Suppliers
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold text-brand-orange-600">10K+</div>
                  <div className="text-xs text-brand-grey-600">Active Suppliers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brand-grey-600">50K+</div>
                  <div className="text-xs text-brand-grey-600">Products Listed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">$5M+</div>
                  <div className="text-xs text-brand-grey-600">Monthly GMV</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md brand-card shadow-2xl">
              <CardHeader className="space-y-2 text-center px-6">
                <div className="w-16 h-16 gradient-brand-orange rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Store className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-gradient-brand">
                  Supplier Sign In
                </CardTitle>
                <CardDescription className="text-base">
                  Access your supplier dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium brand-text-on-light">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-grey-400 w-5 h-5" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="supplier@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="brand-input pl-10 h-12 text-base"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium brand-text-on-light">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-grey-400 w-5 h-5" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="brand-input pl-10 pr-10 h-12 text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-grey-400 hover:text-brand-grey-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="remember" 
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                      />
                      <Label htmlFor="remember" className="text-sm text-brand-grey-600 cursor-pointer">
                        Remember me
                      </Label>
                    </div>
                    <Link href="/forgot-password">
                      <span className="brand-link text-sm font-medium cursor-pointer">
                        Forgot password?
                      </span>
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="brand-button-primary w-full h-12 font-semibold text-base shadow-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In to Dashboard
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center space-y-3">
                  <p className="text-sm text-brand-grey-600">
                    Not a supplier yet?{" "}
                    <Link href="/supplier/register">
                      <span className="brand-link font-semibold cursor-pointer">
                        Register your business
                      </span>
                    </Link>
                  </p>
                  <div className="pt-3 border-t border-brand-grey-200">
                    <p className="text-sm text-brand-grey-600">
                      Looking to buy?{" "}
                      <Link href="/login">
                        <span className="brand-link font-semibold cursor-pointer">
                          Buyer Login
                        </span>
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Mobile Features */}
                <div className="lg:hidden mt-6 pt-6 border-t border-brand-grey-200">
                  <div className="grid grid-cols-2 gap-3">
                    {features.map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <div key={index} className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${feature.color}`} />
                          <span className="text-xs text-brand-grey-600">{feature.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* <Footer /> */}
    </div>
  );
}
