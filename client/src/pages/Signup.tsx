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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Building2, 
  User, 
  Phone, 
  Loader2,
  ShieldCheck,
  TrendingUp,
  Users,
  Globe,
  ArrowRight,
  CheckCircle,
  Award,
  Zap
} from "lucide-react";
import { SiGoogle, SiFacebook, SiLinkedin } from "react-icons/si";
import { useAuth } from "@/contexts/AuthContext";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useLocation();
  const { register } = useAuth();

  // Form states for buyer
  const [buyerData, setBuyerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    phone: '',
    password: '',
    terms: false
  });

  const handleBuyerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerData.terms) return;
    
    setIsSubmitting(true);
    const success = await register({
      email: buyerData.email,
      password: buyerData.password,
      firstName: buyerData.firstName,
      lastName: buyerData.lastName,
      companyName: buyerData.companyName,
      phone: buyerData.phone,
      role: 'buyer',
      industry: 'General'
    });
    
    if (success) {
      setLocation('/dashboard');
    }
    
    setIsSubmitting(false);
  };

  const benefits = [
    { 
      icon: ShieldCheck, 
      title: "Secure Platform", 
      description: "Enterprise-grade security",
      color: "from-green-100 to-green-200",
      iconColor: "text-green-600"
    },
    { 
      icon: Users, 
      title: "Global Network", 
      description: "Connect with 10M+ users",
      color: "from-brand-orange-100 to-brand-orange-200",
      iconColor: "text-brand-orange-600"
    },
    { 
      icon: Award, 
      title: "Verified Admins", 
      description: "Only trusted partners",
      color: "from-brand-grey-100 to-brand-grey-200",
      iconColor: "text-brand-grey-600"
    },
    { 
      icon: Zap, 
      title: "Fast & Easy", 
      description: "Get started in minutes",
      color: "from-yellow-100 to-yellow-200",
      iconColor: "text-yellow-600"
    }
  ];

  const features = [
    "Free account creation",
    "Access to 10M+ products",
    "Verified admins network",
    "Trade assurance protection",
    "24/7 customer support",
    "Multi-language support"
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background theme-transition">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Side - Branding & Benefits */}
          <div className="hidden lg:flex flex-col justify-center space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 rounded-full px-4 py-2 text-sm text-green-700 font-medium mb-6 theme-transition">
                <CheckCircle className="w-4 h-4" />
                <span>Free to Join</span>
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold text-foreground mb-4 theme-transition">
                Start Your
                <span className="bg-gradient-to-r from-brand-orange-500 to-brand-orange-600 bg-clip-text text-transparent block mt-2">
                  B2B Journey Today
                </span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 theme-transition">
                Join the world's leading B2B marketplace and connect with verified admins globally.
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-2 gap-4">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="brand-card rounded-xl p-4 shadow-lg hover:shadow-xl transition-all">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${benefit.iconColor}`} />
                    </div>
                    <h3 className="text-sm font-semibold brand-text-on-light mb-1">{benefit.title}</h3>
                    <p className="text-xs text-brand-grey-600">{benefit.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Features List */}
            <div className="bg-gradient-to-r from-brand-orange-50 to-brand-grey-50 rounded-2xl p-6 border border-brand-orange-100">
              <h3 className="font-semibold brand-text-on-light mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-brand-orange-600" />
                What You Get
              </h3>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-brand-grey-700">
                    <div className="w-5 h-5 rounded-full gradient-brand-orange flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Side - Signup Form */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md bg-card border-border shadow-2xl theme-transition">
              <CardHeader className="space-y-2 text-center px-6">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-brand-orange-500 to-brand-orange-600 bg-clip-text text-transparent">
                  Create Account
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground theme-transition">
                  Join thousands of businesses worldwide
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <Tabs defaultValue="buyer" className="w-full">
                  <TabsList className="grid w-full grid-cols-1 mb-6">
                    <TabsTrigger value="buyer" className="text-base py-3">
                      <Users className="w-4 h-4 mr-2" />
                      Sign up as Buyer
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="buyer">
                    <form onSubmit={handleBuyerSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-sm font-medium brand-text-on-light">
                            First Name
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-grey-400 w-4 h-4" />
                            <Input
                              id="firstName"
                              placeholder="John"
                              value={buyerData.firstName}
                              onChange={(e) => setBuyerData({ ...buyerData, firstName: e.target.value })}
                              required
                              className="brand-input pl-10 h-11"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-sm font-medium brand-text-on-light">
                            Last Name
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-grey-400 w-4 h-4" />
                            <Input
                              id="lastName"
                              placeholder="Doe"
                              value={buyerData.lastName}
                              onChange={(e) => setBuyerData({ ...buyerData, lastName: e.target.value })}
                              required
                              className="brand-input pl-10 h-11"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium brand-text-on-light">
                          Email Address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-grey-400 w-4 h-4" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@company.com"
                            value={buyerData.email}
                            onChange={(e) => setBuyerData({ ...buyerData, email: e.target.value })}
                            required
                            className="brand-input pl-10 h-11"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company" className="text-sm font-medium brand-text-on-light">
                          Company Name
                        </Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-grey-400 w-4 h-4" />
                          <Input
                            id="company"
                            placeholder="Your Company Ltd."
                            value={buyerData.companyName}
                            onChange={(e) => setBuyerData({ ...buyerData, companyName: e.target.value })}
                            className="brand-input pl-10 h-11"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium brand-text-on-light">
                          Phone Number
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-grey-400 w-4 h-4" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={buyerData.phone}
                            onChange={(e) => setBuyerData({ ...buyerData, phone: e.target.value })}
                            className="brand-input pl-10 h-11"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium brand-text-on-light">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-grey-400 w-4 h-4" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password"
                            value={buyerData.password}
                            onChange={(e) => setBuyerData({ ...buyerData, password: e.target.value })}
                            required
                            className="brand-input pl-10 pr-10 h-11"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-grey-400 hover:text-brand-grey-600"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox 
                          id="terms" 
                          checked={buyerData.terms}
                          onCheckedChange={(checked) => setBuyerData({ ...buyerData, terms: checked === true })}
                          required
                        />
                        <Label htmlFor="terms" className="text-xs text-brand-grey-600 cursor-pointer leading-relaxed">
                          I agree to the{" "}
                          <Link href="/terms">
                            <span className="brand-link font-medium">
                              Terms of Service
                            </span>
                          </Link>
                          {" "}and{" "}
                          <Link href="/privacy">
                            <span className="brand-link font-medium">
                              Privacy Policy
                            </span>
                          </Link>
                        </Label>
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting || !buyerData.terms}
                        className="brand-button-primary w-full h-11 font-semibold shadow-lg"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          <>
                            Create Account
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Or sign up with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 hover:bg-red-50 hover:border-red-300"
                    >
                      <SiGoogle className="h-4 w-4 text-red-500" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 hover:bg-brand-grey-50 hover:border-brand-grey-300"
                    >
                      <SiFacebook className="h-4 w-4 text-brand-grey-600" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 hover:bg-brand-grey-50 hover:border-brand-grey-300"
                    >
                      <SiLinkedin className="h-4 w-4 text-brand-grey-700" />
                    </Button>
                  </div>
                </div>

                <div className="mt-6 text-center space-y-3">
                  <p className="text-sm text-brand-grey-600">
                    Already have an account?{" "}
                    <Link href="/login">
                      <span className="brand-link font-semibold cursor-pointer">
                        Sign in
                      </span>
                    </Link>
                  </p>
                  <div className="pt-3 border-t border-brand-grey-200">
                    <p className="text-sm text-brand-grey-600">
                      Want to sell on our platform?{" "}
                      <Link href="/supplier/register">
                        <span className="brand-link font-semibold cursor-pointer">
                          Register as Supplier
                        </span>
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Mobile Features */}
                <div className="lg:hidden mt-6 pt-6 border-t border-brand-grey-200">
                  <div className="grid grid-cols-2 gap-3">
                    {benefits.slice(0, 4).map((benefit, index) => {
                      const Icon = benefit.icon;
                      return (
                        <div key={index} className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${benefit.iconColor}`} />
                          <span className="text-xs text-brand-grey-600">{benefit.title}</span>
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

      <Footer />
    </div>
  );
}