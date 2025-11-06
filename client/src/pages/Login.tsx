import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Building2,
  Users,
  Shield,
  ArrowRight
} from "lucide-react";
import { SiGoogle, SiFacebook, SiLinkedin } from "react-icons/si";
import { toast } from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useLocation();
  
  const { login, isAuthenticated, user, error, clearError, authStatus } = useAuth();

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

  // Clear error when component mounts or form changes
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      await login(email, password, true);
      toast.success('Login successful!');
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error(error.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleFeatures = [
    {
      role: 'buyer',
      title: 'For Buyers',
      icon: Users,
      color: 'from-blue-100 to-blue-200',
      iconColor: 'text-blue-600',
      features: ['Browse products', 'Create RFQs', 'Manage orders', 'Compare quotations']
    },
    {
      role: 'supplier',
      title: 'For Suppliers',
      icon: Building2,
      color: 'from-green-100 to-green-200',
      iconColor: 'text-green-600',
      features: ['Manage store', 'List products', 'Handle inquiries', 'Process orders']
    },
    {
      role: 'admin',
      title: 'For Admins',
      icon: Shield,
      color: 'from-purple-100 to-purple-200',
      iconColor: 'text-purple-600',
      features: ['Platform management', 'User oversight', 'Analytics', 'System control']
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Side - Branding & Role Features */}
          <div className="hidden lg:flex flex-col justify-center space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-100 rounded-full px-4 py-2 text-sm text-blue-700 font-medium mb-6">
                <CheckCircle className="w-4 h-4" />
                <span>Secure Login</span>
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold text-gray-900 mb-4">
                Welcome Back to
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block mt-2">
                  B2B Marketplace
                </span>
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Sign in to access your personalized dashboard and continue your business journey.
              </p>
            </div>

            {/* Role Features */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">Access by Role</h3>
              {roleFeatures.map((roleFeature, index) => {
                const Icon = roleFeature.icon;
                return (
                  <div key={index} className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${roleFeature.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${roleFeature.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">{roleFeature.title}</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {roleFeature.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Account Locked Alert */}
                {user?.lockedUntil && new Date(user.lockedUntil) > new Date() && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Account is temporarily locked due to multiple failed login attempts. 
                      Please try again later or reset your password.
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 h-11"
                        disabled={isSubmitting || authStatus === 'loading'}
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
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 pr-10 h-11"
                        disabled={isSubmitting || authStatus === 'loading'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        disabled={isSubmitting}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
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
                        disabled={isSubmitting}
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
                    disabled={isSubmitting || authStatus === 'loading' || !email || !password}
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
                  >
                    {isSubmitting || authStatus === 'loading' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-4 w-4" />
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
                      <span className="bg-white px-2 text-gray-500">Or sign in with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 hover:bg-red-50 hover:border-red-300"
                      disabled={isSubmitting}
                    >
                      <SiGoogle className="h-4 w-4 text-red-500" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 hover:bg-blue-50 hover:border-blue-300"
                      disabled={isSubmitting}
                    >
                      <SiFacebook className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 hover:bg-blue-50 hover:border-blue-300"
                      disabled={isSubmitting}
                    >
                      <SiLinkedin className="h-4 w-4 text-blue-700" />
                    </Button>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Link href="/signup">
                      <span className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer">
                        Sign up
                      </span>
                    </Link>
                  </p>
                </div>

                {/* Mobile Role Features */}
                <div className="lg:hidden mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Quick Access</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {roleFeatures.map((roleFeature, index) => {
                      const Icon = roleFeature.icon;
                      return (
                        <div key={index} className="text-center">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${roleFeature.color} flex items-center justify-center mx-auto mb-1`}>
                            <Icon className={`w-4 h-4 ${roleFeature.iconColor}`} />
                          </div>
                          <span className="text-xs text-gray-600">{roleFeature.title.replace('For ', '')}</span>
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