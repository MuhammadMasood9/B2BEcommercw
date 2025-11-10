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
  ShieldCheck,
  TrendingUp,
  Users,
  Globe,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { SiGoogle, SiFacebook, SiLinkedin } from "react-icons/si";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useLocation();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const success = await login(email, password);
    
    if (success) {
      // Redirect based on user role
      if (location.includes('admin')) {
        setLocation('/admin');
      } else {
        setLocation('/');
      }
    }
    
    setIsSubmitting(false);
  };

  const features = [
    { icon: ShieldCheck, text: "Secure & Encrypted", color: "text-green-600" },
    { icon: Users, text: "10M+ Active Users", color: "text-blue-600" },
    { icon: TrendingUp, text: "Growing Network", color: "text-purple-600" },
    { icon: Globe, text: "Global Reach", color: "text-orange-600" }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Side - Branding & Features */}
          <div className="hidden lg:flex flex-col justify-center space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-100 rounded-full px-4 py-2 text-sm text-blue-700 font-medium mb-6">
                <ShieldCheck className="w-4 h-4" />
                <span>Trusted by 10M+ Businesses</span>
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold text-gray-900 mb-4">
                Welcome to
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block mt-2">
                  Global Trade Hub
                </span>
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Connect with verified admins and buyers worldwide. Start growing your business today.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color === 'text-green-600' ? 'from-green-100 to-green-200' : feature.color === 'text-blue-600' ? 'from-blue-100 to-blue-200' : feature.color === 'text-purple-600' ? 'from-purple-100 to-purple-200' : 'from-orange-100 to-orange-200'} flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${feature.color}`} />
                    </div>
                    <p className="text-sm font-medium text-gray-900">{feature.text}</p>
                  </div>
                );
              })}
            </div>

            {/* Testimonial */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                  JD
                </div>
                <div>
                  <p className="font-semibold text-gray-900">John Doe</p>
                  <p className="text-sm text-gray-600">CEO, Tech Company</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "This platform has transformed how we connect with admins. The verification process ensures we only work with trusted partners."
              </p>
              <div className="flex items-center gap-1 mt-4">
                {[...Array(5)].map((_, i) => (
                  <CheckCircle key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md bg-white shadow-2xl border-gray-100">
              <CardHeader className="space-y-2 text-center px-6">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Sign In
                </CardTitle>
                <CardDescription className="text-base">
                  Welcome back! Please enter your credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 h-12 text-base"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 pr-10 h-12 text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                      <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                        Remember me
                      </Label>
                    </div>
                    <Link href="/forgot-password">
                      <span className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
                        Forgot password?
                      </span>
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-base shadow-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 hover:bg-red-50 hover:border-red-300"
                    >
                      <SiGoogle className="h-5 w-5 text-red-500" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <SiFacebook className="h-5 w-5 text-blue-600" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <SiLinkedin className="h-5 w-5 text-blue-700" />
                    </Button>
                  </div>
                </div>

                <div className="mt-6 text-center space-y-3">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Link href="/signup">
                      <span className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer">
                        Sign up for free
                      </span>
                    </Link>
                  </p>
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Are you a supplier?{" "}
                      <Link href="/supplier/login">
                        <span className="text-purple-600 hover:text-purple-700 font-semibold cursor-pointer">
                          Supplier Login
                        </span>
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Mobile Features */}
                <div className="lg:hidden mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-3">
                    {features.map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <div key={index} className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${feature.color}`} />
                          <span className="text-xs text-gray-600">{feature.text}</span>
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