import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, Eye, EyeOff, Building2, User, Phone } from "lucide-react";
import { SiGoogle, SiFacebook, SiLinkedin } from "react-icons/si";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState("buyer");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Signup attempt for:", accountType);
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
              <Tabs value={accountType} onValueChange={setAccountType} className="mb-4 sm:mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="buyer" className="text-sm sm:text-base" data-testid="tab-buyer">I'm a Buyer</TabsTrigger>
                  <TabsTrigger value="supplier" className="text-sm sm:text-base" data-testid="tab-supplier">I'm a Supplier</TabsTrigger>
                </TabsList>

                <TabsContent value="buyer" className="mt-4 sm:mt-6">
                  <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
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
                      <Checkbox id="buyer-terms" required data-testid="checkbox-buyer-terms" />
                      <Label htmlFor="buyer-terms" className="text-sm cursor-pointer leading-relaxed">
                        I agree to the <Link href="/terms"><a className="text-primary hover:underline">Terms of Service</a></Link> and <Link href="/privacy"><a className="text-primary hover:underline">Privacy Policy</a></Link>
                      </Label>
                    </div>

                    <Button type="submit" className="w-full" size="lg" data-testid="button-buyer-signup">
                      Create Buyer Account
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="supplier" className="mt-4 sm:mt-6">
                  <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="supplier-first-name">First Name *</Label>
                        <div className="relative mt-2">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                          <Input
                            id="supplier-first-name"
                            placeholder="John"
                            className="pl-10"
                            required
                            data-testid="input-supplier-first-name"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="supplier-last-name">Last Name *</Label>
                        <div className="relative mt-2">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                          <Input
                            id="supplier-last-name"
                            placeholder="Doe"
                            className="pl-10"
                            required
                            data-testid="input-supplier-last-name"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="supplier-email">Business Email *</Label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <Input
                          id="supplier-email"
                          type="email"
                          placeholder="sales@company.com"
                          className="pl-10"
                          required
                          data-testid="input-supplier-email"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="supplier-company">Company Name *</Label>
                      <div className="relative mt-2">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <Input
                          id="supplier-company"
                          placeholder="Manufacturing Co. Ltd."
                          className="pl-10"
                          required
                          data-testid="input-supplier-company"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="supplier-phone">Phone Number *</Label>
                      <div className="relative mt-2">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <Input
                          id="supplier-phone"
                          type="tel"
                          placeholder="+86 123 4567 8900"
                          className="pl-10"
                          required
                          data-testid="input-supplier-phone"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="supplier-password">Password *</Label>
                      <div className="relative mt-2">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <Input
                          id="supplier-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          className="pl-10 pr-10"
                          required
                          data-testid="input-supplier-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          data-testid="button-toggle-password-supplier"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox id="supplier-terms" required data-testid="checkbox-supplier-terms" />
                      <Label htmlFor="supplier-terms" className="text-sm cursor-pointer leading-relaxed">
                        I agree to the <Link href="/terms"><a className="text-primary hover:underline">Terms of Service</a></Link> and <Link href="/privacy"><a className="text-primary hover:underline">Privacy Policy</a></Link>
                      </Label>
                    </div>

                    <Button type="submit" className="w-full" size="lg" data-testid="button-supplier-signup">
                      Create Supplier Account
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

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
