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
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { SiGoogle, SiFacebook, SiLinkedin } from "react-icons/si";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="space-y-2 text-center px-4 sm:px-6">
              <CardTitle className="text-2xl sm:text-3xl font-bold">Welcome Back</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/forgot-password">
                      <a className="text-sm text-primary hover:underline" data-testid="link-forgot-password">
                        Forgot password?
                      </a>
                    </Link>
                  </div>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" data-testid="checkbox-remember" />
                  <Label htmlFor="remember" className="text-sm cursor-pointer">
                    Remember me for 30 days
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg" 
                  disabled={isSubmitting}
                  data-testid="button-login"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-4 sm:mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-3">
                  <Button variant="outline" className="w-full" data-testid="button-google-login">
                    <SiGoogle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                  <Button variant="outline" className="w-full" data-testid="button-facebook-login">
                    <SiFacebook className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                  <Button variant="outline" className="w-full" data-testid="button-linkedin-login">
                    <SiLinkedin className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link href="/signup">
                  <a className="text-primary font-semibold hover:underline" data-testid="link-signup">
                    Sign up for free
                  </a>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
