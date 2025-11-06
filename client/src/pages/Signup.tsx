import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BuyerRegistrationForm from "@/components/auth/BuyerRegistrationForm";
import SupplierRegistrationForm from "@/components/auth/SupplierRegistrationForm";
import AdminRegistrationForm from "@/components/auth/AdminRegistrationForm";
import { 
  Building2, 
  Users,
  ArrowRight,
  CheckCircle,
  Award,
  Zap,
  ShieldCheck,
  Shield,
  Store
} from "lucide-react";
import { SiGoogle, SiFacebook, SiLinkedin } from "react-icons/si";

export default function Signup() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Role-based redirect
      switch (user.role) {
        case 'admin':
          setLocation('/admin/dashboard');
          break;
        case 'supplier':
          if (user.supplierStatus === 'approved') {
            setLocation('/supplier/dashboard');
          } else {
            setLocation('/supplier/application-status');
          }
          break;
        case 'buyer':
          setLocation('/buyer/dashboard');
          break;
        default:
          setLocation('/dashboard');
      }
    }
  }, [isAuthenticated, user, setLocation]);

  const handleRegistrationSuccess = () => {
    // Success handling is done within each form component
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
      description: "Connect with millions of users",
      color: "from-blue-100 to-blue-200",
      iconColor: "text-blue-600"
    },
    { 
      icon: Award, 
      title: "Verified Partners", 
      description: "Only trusted businesses",
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
    "Access to global marketplace",
    "Verified business network",
    "Trade assurance protection",
    "24/7 customer support",
    "Multi-language support"
  ];

  const roleFeatures = {
    buyer: [
      "Browse millions of products",
      "Create and manage RFQs",
      "Compare supplier quotations",
      "Secure payment options",
      "Order tracking and management"
    ],
    supplier: [
      "Create your online store",
      "List unlimited products",
      "Manage inquiries and orders",
      "Access to global buyers",
      "Analytics and reporting tools"
    ],
    admin: [
      "Platform management tools",
      "User oversight and control",
      "Advanced analytics dashboard",
      "System configuration access",
      "Security and compliance tools"
    ]
  };

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
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="buyer" className="text-sm py-3">
                      <Users className="w-4 h-4 mr-2" />
                      Buyer
                    </TabsTrigger>
                    <TabsTrigger value="supplier" className="text-sm py-3">
                      <Building2 className="w-4 h-4 mr-2" />
                      Supplier
                    </TabsTrigger>
                    <TabsTrigger value="admin" className="text-sm py-3">
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="buyer">
                    <div className="space-y-4">
                      <div className="text-center mb-4">
                        <h4 className="font-semibold text-gray-900">Join as a Buyer</h4>
                        <p className="text-sm text-gray-600">Source products from verified suppliers worldwide</p>
                      </div>
                      
                      {/* Buyer Features */}
                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <h5 className="font-medium text-blue-900 mb-2">What you get:</h5>
                        <ul className="text-sm text-blue-800 space-y-1">
                          {roleFeatures.buyer.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-blue-600" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <BuyerRegistrationForm onSuccess={handleRegistrationSuccess} />
                    </div>
                  </TabsContent>

                  <TabsContent value="supplier">
                    <div className="space-y-4">
                      <div className="text-center mb-4">
                        <h4 className="font-semibold text-gray-900">Join as a Supplier</h4>
                        <p className="text-sm text-gray-600">Sell your products to buyers globally</p>
                      </div>
                      
                      {/* Supplier Features */}
                      <div className="bg-green-50 rounded-lg p-4 mb-4">
                        <h5 className="font-medium text-green-900 mb-2">What you get:</h5>
                        <ul className="text-sm text-green-800 space-y-1">
                          {roleFeatures.supplier.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <SupplierRegistrationForm onSuccess={handleRegistrationSuccess} />
                    </div>
                  </TabsContent>

                  <TabsContent value="admin">
                    <div className="space-y-4">
                      <div className="text-center mb-4">
                        <h4 className="font-semibold text-gray-900">Create Admin Account</h4>
                        <p className="text-sm text-gray-600">Platform administration and management</p>
                      </div>
                      
                      {/* Admin Features */}
                      <div className="bg-purple-50 rounded-lg p-4 mb-4">
                        <h5 className="font-medium text-purple-900 mb-2">Admin capabilities:</h5>
                        <ul className="text-sm text-purple-800 space-y-1">
                          {roleFeatures.admin.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-purple-600" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <AdminRegistrationForm 
                        onSuccess={handleRegistrationSuccess}
                        allowSuperAdmin={false}
                      />
                    </div>
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

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link href="/login">
                      <span className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer">
                        Sign in
                      </span>
                    </Link>
                  </p>
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