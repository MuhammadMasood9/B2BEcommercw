import { useState } from "react";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  User,
  Phone,
  Loader2,
  Store,
  ArrowRight,
  CheckCircle,
  Globe,
  Package,
  TrendingUp,
  Award
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SupplierRegister() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    businessName: '',
    businessType: 'trading_company' as 'manufacturer' | 'trading_company' | 'wholesaler',
    storeName: '',
    contactPerson: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    password: '',
    terms: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Current form data:', formData);

    if (!formData.terms) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        businessName: formData.businessName,
        businessType: formData.businessType,
        storeName: formData.storeName,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        country: formData.country,
      };

      console.log('Sending registration data:', requestData);

      const response = await fetch('/api/suppliers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        toast({
          title: "Registration Successful!",
          description: "Your supplier account has been created. Please wait for admin approval.",
        });
        setLocation('/supplier/login');
      } else {
        const error = await response.json();
        toast({
          title: "Registration Failed",
          description: error.message || "Please try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }

    setIsSubmitting(false);
  };

  const benefits = [
    {
      icon: Store,
      title: "Your Own Store",
      description: "Customizable storefront",
      color: "from-brand-orange-100 to-brand-orange-200",
      iconColor: "text-brand-orange-600"
    },
    {
      icon: Package,
      title: "Unlimited Products",
      description: "List as many as you want",
      color: "from-green-100 to-green-200",
      iconColor: "text-green-600"
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Access worldwide buyers",
      color: "from-brand-grey-100 to-brand-grey-200",
      iconColor: "text-brand-grey-600"
    },
    {
      icon: Award,
      title: "Verified Badge",
      description: "Build trust with buyers",
      color: "from-yellow-100 to-yellow-200",
      iconColor: "text-yellow-600"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      {/* <Header /> */}

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Side - Branding & Benefits */}
          <div className="hidden lg:flex flex-col justify-center space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 rounded-full px-4 py-2 text-sm text-green-700 font-medium mb-6">
                <CheckCircle className="w-4 h-4" />
                <span>Start Selling Today</span>
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold brand-text-on-light mb-4">
                Become a
                <span className="text-gradient-brand block mt-2">
                  Verified Supplier
                </span>
              </h1>
              <p className="text-lg text-brand-grey-600 mb-8">
                Join thousands of suppliers reaching millions of buyers worldwide on our B2B marketplace.
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

            {/* Stats */}
            <div className="bg-gradient-to-r from-brand-orange-50 to-brand-grey-50 rounded-2xl p-6 border border-brand-orange-100">
              <h3 className="font-semibold brand-text-on-light mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-orange-600" />
                Platform Success
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-brand-grey-700">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">10,000+ active suppliers</span>
                </li>
                <li className="flex items-center gap-3 text-brand-grey-700">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">1M+ monthly buyers</span>
                </li>
                <li className="flex items-center gap-3 text-brand-grey-700">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">$5M+ monthly transactions</span>
                </li>
                <li className="flex items-center gap-3 text-brand-grey-700">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">95% supplier satisfaction</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md brand-card shadow-2xl">
              <CardHeader className="space-y-2 text-center px-6">
                <div className="w-16 h-16 gradient-brand-orange rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Store className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-gradient-brand">
                  Supplier Registration
                </CardTitle>
                <CardDescription className="text-base">
                  Create your supplier account
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <form onSubmit={handleSubmit} className="space-y-4">
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
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
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
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
                        placeholder="supplier@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="brand-input pl-10 h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-sm font-medium brand-text-on-light">
                      Business Name
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-grey-400 w-4 h-4" />
                      <Input
                        id="businessName"
                        placeholder="Your Company Ltd."
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        required
                        className="brand-input pl-10 h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessType" className="text-sm font-medium brand-text-on-light">
                      Business Type
                    </Label>
                    <Select
                      value={formData.businessType}
                      onValueChange={(value) => setFormData({ ...formData, businessType: value as any })}
                      required
                    >
                      <SelectTrigger className="h-11">
                        <div className="flex items-center">
                          <Building2 className="mr-2 h-4 w-4 text-brand-grey-400" />
                          <SelectValue placeholder="Select business type" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trading_company">Trading Company</SelectItem>
                        <SelectItem value="manufacturer">Manufacturer</SelectItem>
                        <SelectItem value="wholesaler">Wholesaler</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storeName" className="text-sm font-medium brand-text-on-light">
                      Store Name
                    </Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-grey-400 w-4 h-4" />
                      <Input
                        id="storeName"
                        placeholder="My Store"
                        value={formData.storeName}
                        onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                        required
                        className="brand-input pl-10 h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPerson" className="text-sm font-medium brand-text-on-light">
                      Contact Person
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-grey-400 w-4 h-4" />
                      <Input
                        id="contactPerson"
                        placeholder="Contact person name"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        required
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
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        className="brand-input pl-10 h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium brand-text-on-light">
                      Business Address
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-grey-400 w-4 h-4" />
                      <Input
                        id="address"
                        placeholder="123 Business Street"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                        className="brand-input pl-10 h-11"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium brand-text-on-light">
                        City
                      </Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-grey-400 w-4 h-4" />
                        <Input
                          id="city"
                          placeholder="New York"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          required
                          className="brand-input pl-10 h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-sm font-medium brand-text-on-light">
                        Country
                      </Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-grey-400 w-4 h-4" />
                        <Input
                          id="country"
                          placeholder="United States"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          required
                          className="brand-input pl-10 h-11"
                        />
                      </div>
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
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                      checked={formData.terms}
                      onCheckedChange={(checked) => setFormData({ ...formData, terms: checked === true })}
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
                    disabled={isSubmitting || !formData.terms}
                    className="brand-button-primary w-full h-11 font-semibold shadow-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Register as Supplier
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center space-y-3">
                  <p className="text-sm text-brand-grey-600">
                    Already have an account?{" "}
                    <Link href="/supplier/login">
                      <span className="brand-link font-semibold cursor-pointer">
                        Sign in
                      </span>
                    </Link>
                  </p>
                  <div className="pt-3 border-t border-brand-grey-200">
                    <p className="text-sm text-brand-grey-600">
                      Looking to buy?{" "}
                      <Link href="/signup">
                        <span className="brand-link font-semibold cursor-pointer">
                          Buyer Registration
                        </span>
                      </Link>
                    </p>
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
