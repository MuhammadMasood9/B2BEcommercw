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
import { Mail, Lock, Eye, EyeOff, Building2, User, Phone, Loader2 } from "lucide-react";
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
      setLocation('/dashboard/buyer');
    }
    setIsSubmitting(false);
  };


  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6">
        <div className="w-full max-w-2xl">
          <Card>
            <CardHeader className="space-y-2 text-center px-4 sm:px-6">
              <CardTitle className="text-2xl sm:text-3xl font-bold">Create Your Account</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Join thousands of businesses trading globally
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="mb-4 sm:mb-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold">Create Your Buyer Account</h3>
                  <p className="text-sm text-muted-foreground mt-1">Join as a buyer to access our B2B marketplace</p>
                </div>
                  <form onSubmit={handleBuyerSubmit} className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="buyer-first-name">First Name *</Label>
                        <div className="relative mt-2">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                          <Input
                            id="buyer-first-name"
                            placeholder="John"
                            className="pl-10"
                            required
                            value={buyerData.firstName}
                            onChange={(e) => setBuyerData({...buyerData, firstName: e.target.value})}
                            data-testid="input-buyer-first-name"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="buyer-last-name">Last Name *</Label>
                        <div className="relative mt-2">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                          <Input
                            id="buyer-last-name"
                            placeholder="Doe"
                            className="pl-10"
                            required
                            value={buyerData.lastName}
                            onChange={(e) => setBuyerData({...buyerData, lastName: e.target.value})}
                            data-testid="input-buyer-last-name"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="buyer-email">Business Email *</Label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <Input
                          id="buyer-email"
                          type="email"
                          placeholder="you@company.com"
                          className="pl-10"
                          required
                          value={buyerData.email}
                          onChange={(e) => setBuyerData({...buyerData, email: e.target.value})}
                          data-testid="input-buyer-email"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="buyer-company">Company Name *</Label>
                      <div className="relative mt-2">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <Input
                          id="buyer-company"
                          placeholder="Your Company Ltd."
                          className="pl-10"
                          required
                          value={buyerData.companyName}
                          onChange={(e) => setBuyerData({...buyerData, companyName: e.target.value})}
                          data-testid="input-buyer-company"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="buyer-phone">Phone Number</Label>
                      <div className="relative mt-2">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <Input
                          id="buyer-phone"
                          type="tel"
                          placeholder="+1 (234) 567-8900"
                          className="pl-10"
                          value={buyerData.phone}
                          onChange={(e) => setBuyerData({...buyerData, phone: e.target.value})}
                          data-testid="input-buyer-phone"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="buyer-password">Password *</Label>
                      <div className="relative mt-2">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <Input
                          id="buyer-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          className="pl-10 pr-10"
                          required
                          value={buyerData.password}
                          onChange={(e) => setBuyerData({...buyerData, password: e.target.value})}
                          data-testid="input-buyer-password"
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
                      <p className="text-xs text-muted-foreground mt-1">
                        Must be at least 8 characters with uppercase, lowercase, and numbers
                      </p>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox 
                        id="buyer-terms" 
                        checked={buyerData.terms}
                        onCheckedChange={(checked) => setBuyerData({...buyerData, terms: checked === true})}
                        required 
                        data-testid="checkbox-buyer-terms" 
                      />
                      <Label htmlFor="buyer-terms" className="text-sm cursor-pointer leading-relaxed">
                        I agree to the <Link href="/terms"><a className="text-primary hover:underline">Terms of Service</a></Link> and <Link href="/privacy"><a className="text-primary hover:underline">Privacy Policy</a></Link>
                      </Label>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg" 
                      disabled={isSubmitting}
                      data-testid="button-buyer-signup"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        'Create Buyer Account'
                      )}
                    </Button>
                  </form>
              </div>

              <div className="mt-4 sm:mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or sign up with</span>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-3">
                  <Button variant="outline" className="w-full" data-testid="button-google-signup">
                    <SiGoogle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                  <Button variant="outline" className="w-full" data-testid="button-facebook-signup">
                    <SiFacebook className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                  <Button variant="outline" className="w-full" data-testid="button-linkedin-signup">
                    <SiLinkedin className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link href="/login">
                  <a className="text-primary font-semibold hover:underline" data-testid="link-login">
                    Sign in
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
