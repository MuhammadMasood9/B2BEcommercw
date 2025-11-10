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
      color: "from-blue-100 to-blue-200",
      iconColor: "text-blue-600"
    },
    { 
      icon: Award, 
      title: "Verified Admins", 
      description: "Only trusted partners",
      color: "from-purple-100 to-purple-200",
      iconColor: "text-purple-600"
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Side - Branding & Benefits */}
          <div className="hidden lg:flex flex-col justify-center space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 rounded-full px-4 py-2 text-sm text-green-700 font-medium mb-6">
                <CheckCircle className="w-4 h-4" />
                <span>Free to Join</span>
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold text-gray-900 mb-4">
                Start Your
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block mt-2">
                  B2B Journey Today
                </span>
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Join the world's leading B2B marketplace and connect with verified admins globally.
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-2 gap-4">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${benefit.iconColor}`} />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                    <p className="text-xs text-gray-600">{benefit.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Features List */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                What You Get
              </h3>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-700">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
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
            <Card className="w-full max-w-md bg-white shadow-2xl border-gray-100">
              <CardHeader className="space-y-2 text-center px-6">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Create Account
                </CardTitle>
                <CardDescription className="text-base">
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
                          <Label htmlFor="firstName" className="text-sm font-medium">
                            First Name
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              id="firstName"
                              placeholder="John"
                              value={buyerData.firstName}
                              onChange={(e) => setBuyerData({ ...buyerData, firstName: e.target.value })}
                              required
                              className="pl-10 h-11"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-sm font-medium">
                            Last Name
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              id="lastName"
                              placeholder="Doe"
                              value={buyerData.lastName}
                              onChange={(e) => setBuyerData({ ...buyerData, lastName: e.target.value })}
                              required
                              className="pl-10 h-11"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email Address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@company.com"
                            value={buyerData.email}
                            onChange={(e) => setBuyerData({ ...buyerData, email: e.target.value })}
                            required
                            className="pl-10 h-11"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company" className="text-sm font-medium">
                          Company Name
                        </Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="company"
                            placeholder="Your Company Ltd."
                            value={buyerData.companyName}
                            onChange={(e) => setBuyerData({ ...buyerData, companyName: e.target.value })}
                            className="pl-10 h-11"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">
                          Phone Number
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={buyerData.phone}
                            onChange={(e) => setBuyerData({ ...buyerData, phone: e.target.value })}
                            className="pl-10 h-11"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password"
                            value={buyerData.password}
                            onChange={(e) => setBuyerData({ ...buyerData, password: e.target.value })}
                            required
                            className="pl-10 pr-10 h-11"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                        <Label htmlFor="terms" className="text-xs text-gray-600 cursor-pointer leading-relaxed">
                          I agree to the{" "}
                          <Link href="/terms">
                            <span className="text-blue-600 hover:text-blue-700 font-medium">
                              Terms of Service
                            </span>
                          </Link>
                          {" "}and{" "}
                          <Link href="/privacy">
                            <span className="text-blue-600 hover:text-blue-700 font-medium">
                              Privacy Policy
                            </span>
                          </Link>
                        </Label>
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting || !buyerData.terms}
                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
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
                      className="h-10 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <SiFacebook className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <SiLinkedin className="h-4 w-4 text-blue-700" />
                    </Button>
                  </div>
                </div>

                <div className="mt-6 text-center space-y-3">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link href="/login">
                      <span className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer">
                        Sign in
                      </span>
                    </Link>
                  </p>
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Want to sell on our platform?{" "}
                      <Link href="/supplier/register">
                        <span className="text-purple-600 hover:text-purple-700 font-semibold cursor-pointer">
                          Register as Supplier
                        </span>
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Mobile Features */}
                <div className="lg:hidden mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-3">
                    {benefits.slice(0, 4).map((benefit, index) => {
                      const Icon = benefit.icon;
                      return (
                        <div key={index} className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${benefit.iconColor}`} />
                          <span className="text-xs text-gray-600">{benefit.title}</span>
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