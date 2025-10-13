import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLogin() {
  const [email, setEmail] = useState("admin@b2bmarketplace.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const success = await login(email, password);
      if (success) {
        setLocation('/admin');
      } else {
        setError("Invalid admin credentials. Please check your email and password.");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const useDemoAccount = () => {
    setEmail("admin@b2bmarketplace.com");
    setPassword("admin123");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Main Site */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Main Site
            </Button>
          </Link>
        </div>

        {/* Admin Login Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-2 text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Admin Portal</CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to access the admin dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Admin Access Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Administrator Access</h3>
              <p className="text-sm text-blue-700 mb-4">
                Enter your admin credentials to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-sm font-medium">Admin Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@b2bmarketplace.com"
                    className="pl-10 h-12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="input-admin-email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter admin password"
                    className="pl-10 pr-10 h-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    data-testid="input-admin-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                disabled={isSubmitting}
                data-testid="button-admin-login"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In as Admin'
                )}
              </Button>
            </form>

            {/* Demo Account Button */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full h-10 text-sm"
                onClick={useDemoAccount}
                disabled={isSubmitting}
                data-testid="button-demo-admin"
              >
                Use Demo Admin Account
              </Button>
            </div>

            {/* Demo Credentials Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-gray-700 mb-1">Demo Credentials:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>Email:</strong> admin@b2bmarketplace.com</div>
                <div><strong>Password:</strong> admin123</div>
              </div>
            </div>

            {/* Footer Links */}
            <div className="text-center pt-4">
              <p className="text-xs text-muted-foreground">
                Need help? Contact system administrator
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            🔒 This is a secure admin portal. All activities are logged.
          </p>
        </div>
      </div>
    </div>
  );
}