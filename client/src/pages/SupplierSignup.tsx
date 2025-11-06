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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Zap,
  MapPin,
  Calendar,
  Upload,
  X,
  Factory,
  Store,
  Crown,
  Star
} from "lucide-react";
import { toast } from "react-hot-toast";

interface SupplierRegistrationData {
  // User information
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  
  // Business information
  businessName: string;
  businessType: 'manufacturer' | 'trading_company' | 'wholesaler' | '';
  storeName: string;
  
  // Contact details
  contactPerson: string;
  position: string;
  phone: string;
  whatsapp: string;
  wechat: string;
  address: string;
  city: string;
  country: string;
  website: string;
  
  // Business details
  yearEstablished: number | '';
  employees: string;
  factorySize: string;
  annualRevenue: string;
  mainProducts: string[];
  exportMarkets: string[];
  
  // Membership
  membershipTier: 'free' | 'silver' | 'gold' | 'platinum';
  
  // Store description
  storeDescription: string;
  
  // Terms
  terms: boolean;
}

const initialData: SupplierRegistrationData = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  businessName: '',
  businessType: '',
  storeName: '',
  contactPerson: '',
  position: '',
  phone: '',
  whatsapp: '',
  wechat: '',
  address: '',
  city: '',
  country: '',
  website: '',
  yearEstablished: '',
  employees: '',
  factorySize: '',
  annualRevenue: '',
  mainProducts: [],
  exportMarkets: [],
  membershipTier: 'free',
  storeDescription: '',
  terms: false,
};

const membershipTiers = [
  {
    id: 'free',
    name: 'Free',
    price: '$0/month',
    commission: '5%',
    features: ['Basic store setup', 'Product listings', 'Basic analytics', 'Email support'],
    icon: Store,
    color: 'from-gray-100 to-gray-200',
    iconColor: 'text-gray-600',
    popular: false
  },
  {
    id: 'silver',
    name: 'Silver',
    price: '$29/month',
    commission: '3%',
    features: ['Enhanced store design', 'Priority support', 'Advanced analytics', 'Marketing tools'],
    icon: Award,
    color: 'from-gray-300 to-gray-400',
    iconColor: 'text-gray-700',
    popular: false
  },
  {
    id: 'gold',
    name: 'Gold',
    price: '$79/month',
    commission: '2%',
    features: ['Premium store features', 'Dedicated support', 'API access', 'Custom branding'],
    icon: Star,
    color: 'from-yellow-200 to-yellow-300',
    iconColor: 'text-yellow-700',
    popular: true
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: '$199/month',
    commission: '1.5%',
    features: ['All features', 'Account manager', 'White-label options', 'Priority placement'],
    icon: Crown,
    color: 'from-purple-200 to-purple-300',
    iconColor: 'text-purple-700',
    popular: false
  }
];

export default function SupplierSignup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useLocation();
  const [formData, setFormData] = useState<SupplierRegistrationData>(initialData);
  const [files, setFiles] = useState<{
    businessLicense?: File;
    taxRegistration?: File;
    identityDocument?: File;
    storeLogo?: File;
    storeBanner?: File;
  }>({});
  const [newProduct, setNewProduct] = useState('');
  const [newMarket, setNewMarket] = useState('');

  const totalSteps = 4;

  const updateFormData = (field: keyof SupplierRegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addProduct = () => {
    if (newProduct.trim() && !formData.mainProducts.includes(newProduct.trim())) {
      updateFormData('mainProducts', [...formData.mainProducts, newProduct.trim()]);
      setNewProduct('');
    }
  };

  const removeProduct = (product: string) => {
    updateFormData('mainProducts', formData.mainProducts.filter(p => p !== product));
  };

  const addMarket = () => {
    if (newMarket.trim() && !formData.exportMarkets.includes(newMarket.trim())) {
      updateFormData('exportMarkets', [...formData.exportMarkets, newMarket.trim()]);
      setNewMarket('');
    }
  };

  const removeMarket = (market: string) => {
    updateFormData('exportMarkets', formData.exportMarkets.filter(m => m !== market));
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [field]: file || undefined }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.email && formData.password && formData.firstName && formData.lastName);
      case 2:
        return !!(formData.businessName && formData.businessType && formData.storeName && 
                 formData.contactPerson && formData.position && formData.phone && 
                 formData.address && formData.city && formData.country);
      case 3:
        return true; // Business details are optional
      case 4:
        return formData.terms;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          formDataToSend.append(key, JSON.stringify(value));
        } else if (value !== '' && value !== null && value !== undefined) {
          formDataToSend.append(key, value.toString());
        }
      });

      // Add files
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          formDataToSend.append(key, file);
        }
      });

      const response = await fetch('/api/registration/supplier/register', {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Registration successful! Your application is pending approval.');
        setLocation('/login');
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
        <p className="text-gray-600">Let's start with your basic details</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-medium">
            First Name *
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="firstName"
              placeholder="John"
              value={formData.firstName}
              onChange={(e) => updateFormData('firstName', e.target.value)}
              required
              className="pl-10 h-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-medium">
            Last Name *
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="lastName"
              placeholder="Doe"
              value={formData.lastName}
              onChange={(e) => updateFormData('lastName', e.target.value)}
              required
              className="pl-10 h-11"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email Address *
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            required
            className="pl-10 h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          Password *
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
            value={formData.password}
            onChange={(e) => updateFormData('password', e.target.value)}
            required
            className="pl-10 pr-10 h-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Business Information</h3>
        <p className="text-gray-600">Tell us about your business</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessName" className="text-sm font-medium">
          Business Name *
        </Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="businessName"
            placeholder="Your Business Ltd."
            value={formData.businessName}
            onChange={(e) => updateFormData('businessName', e.target.value)}
            required
            className="pl-10 h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessType" className="text-sm font-medium">
          Business Type *
        </Label>
        <Select value={formData.businessType} onValueChange={(value) => updateFormData('businessType', value)}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select business type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manufacturer">Manufacturer</SelectItem>
            <SelectItem value="trading_company">Trading Company</SelectItem>
            <SelectItem value="wholesaler">Wholesaler</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="storeName" className="text-sm font-medium">
          Store Name *
        </Label>
        <div className="relative">
          <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="storeName"
            placeholder="Your Store Name"
            value={formData.storeName}
            onChange={(e) => updateFormData('storeName', e.target.value)}
            required
            className="pl-10 h-11"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactPerson" className="text-sm font-medium">
            Contact Person *
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="contactPerson"
              placeholder="Contact person name"
              value={formData.contactPerson}
              onChange={(e) => updateFormData('contactPerson', e.target.value)}
              required
              className="pl-10 h-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="position" className="text-sm font-medium">
            Position *
          </Label>
          <Input
            id="position"
            placeholder="CEO, Manager, etc."
            value={formData.position}
            onChange={(e) => updateFormData('position', e.target.value)}
            required
            className="h-11"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">
            Phone *
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={(e) => updateFormData('phone', e.target.value)}
              required
              className="pl-10 h-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp" className="text-sm font-medium">
            WhatsApp
          </Label>
          <Input
            id="whatsapp"
            type="tel"
            placeholder="WhatsApp number"
            value={formData.whatsapp}
            onChange={(e) => updateFormData('whatsapp', e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wechat" className="text-sm font-medium">
            WeChat
          </Label>
          <Input
            id="wechat"
            placeholder="WeChat ID"
            value={formData.wechat}
            onChange={(e) => updateFormData('wechat', e.target.value)}
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address" className="text-sm font-medium">
          Address *
        </Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          <Textarea
            id="address"
            placeholder="Full business address"
            value={formData.address}
            onChange={(e) => updateFormData('address', e.target.value)}
            required
            className="pl-10 min-h-[80px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city" className="text-sm font-medium">
            City *
          </Label>
          <Input
            id="city"
            placeholder="City"
            value={formData.city}
            onChange={(e) => updateFormData('city', e.target.value)}
            required
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country" className="text-sm font-medium">
            Country *
          </Label>
          <Input
            id="country"
            placeholder="Country"
            value={formData.country}
            onChange={(e) => updateFormData('country', e.target.value)}
            required
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website" className="text-sm font-medium">
          Website
        </Label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="website"
            type="url"
            placeholder="https://yourwebsite.com"
            value={formData.website}
            onChange={(e) => updateFormData('website', e.target.value)}
            className="pl-10 h-11"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Business Details</h3>
        <p className="text-gray-600">Additional information about your business</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="yearEstablished" className="text-sm font-medium">
            Year Established
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="yearEstablished"
              type="number"
              placeholder="2020"
              min="1800"
              max={new Date().getFullYear()}
              value={formData.yearEstablished}
              onChange={(e) => updateFormData('yearEstablished', e.target.value ? parseInt(e.target.value) : '')}
              className="pl-10 h-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="employees" className="text-sm font-medium">
            Number of Employees
          </Label>
          <Select value={formData.employees} onValueChange={(value) => updateFormData('employees', value)}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-10">1-10</SelectItem>
              <SelectItem value="11-50">11-50</SelectItem>
              <SelectItem value="51-100">51-100</SelectItem>
              <SelectItem value="101-500">101-500</SelectItem>
              <SelectItem value="500+">500+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="factorySize" className="text-sm font-medium">
            Factory Size
          </Label>
          <div className="relative">
            <Factory className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="factorySize"
              placeholder="e.g., 5000 sqm"
              value={formData.factorySize}
              onChange={(e) => updateFormData('factorySize', e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="annualRevenue" className="text-sm font-medium">
            Annual Revenue
          </Label>
          <Select value={formData.annualRevenue} onValueChange={(value) => updateFormData('annualRevenue', value)}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Below US$1 Million">Below US$1 Million</SelectItem>
              <SelectItem value="US$1 Million - US$2.5 Million">US$1 Million - US$2.5 Million</SelectItem>
              <SelectItem value="US$2.5 Million - US$5 Million">US$2.5 Million - US$5 Million</SelectItem>
              <SelectItem value="US$5 Million - US$10 Million">US$5 Million - US$10 Million</SelectItem>
              <SelectItem value="Above US$10 Million">Above US$10 Million</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Main Products</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add a product category"
            value={newProduct}
            onChange={(e) => setNewProduct(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addProduct())}
            className="h-11"
          />
          <Button type="button" onClick={addProduct} variant="outline" className="h-11 px-4">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.mainProducts.map((product, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {product}
              <X className="w-3 h-3 cursor-pointer" onClick={() => removeProduct(product)} />
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Export Markets</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add an export market"
            value={newMarket}
            onChange={(e) => setNewMarket(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMarket())}
            className="h-11"
          />
          <Button type="button" onClick={addMarket} variant="outline" className="h-11 px-4">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.exportMarkets.map((market, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {market}
              <X className="w-3 h-3 cursor-pointer" onClick={() => removeMarket(market)} />
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="storeDescription" className="text-sm font-medium">
          Store Description
        </Label>
        <Textarea
          id="storeDescription"
          placeholder="Describe your business and what makes you unique..."
          value={formData.storeDescription}
          onChange={(e) => updateFormData('storeDescription', e.target.value)}
          className="min-h-[100px]"
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Choose Your Plan & Upload Documents</h3>
        <p className="text-gray-600">Select a membership tier and upload verification documents</p>
      </div>

      {/* Membership Tiers */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Membership Tier</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {membershipTiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.id}
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.membershipTier === tier.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${tier.popular ? 'ring-2 ring-blue-200' : ''}`}
                onClick={() => updateFormData('membershipTier', tier.id)}
              >
                {tier.popular && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${tier.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-900">{tier.name}</h5>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{tier.price}</div>
                        <div className="text-sm text-gray-600">{tier.commission} commission</div>
                      </div>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
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

      {/* Document Upload */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Verification Documents</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Business License</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => handleFileChange('businessLicense', e.target.files?.[0] || null)}
                className="hidden"
                id="businessLicense"
              />
              <label htmlFor="businessLicense" className="cursor-pointer">
                <span className="text-sm text-blue-600 hover:text-blue-700">
                  {files.businessLicense ? files.businessLicense.name : 'Upload Business License'}
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Tax Registration</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => handleFileChange('taxRegistration', e.target.files?.[0] || null)}
                className="hidden"
                id="taxRegistration"
              />
              <label htmlFor="taxRegistration" className="cursor-pointer">
                <span className="text-sm text-blue-600 hover:text-blue-700">
                  {files.taxRegistration ? files.taxRegistration.name : 'Upload Tax Registration'}
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Identity Document</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => handleFileChange('identityDocument', e.target.files?.[0] || null)}
                className="hidden"
                id="identityDocument"
              />
              <label htmlFor="identityDocument" className="cursor-pointer">
                <span className="text-sm text-blue-600 hover:text-blue-700">
                  {files.identityDocument ? files.identityDocument.name : 'Upload ID/Passport'}
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Store Logo (Optional)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(e) => handleFileChange('storeLogo', e.target.files?.[0] || null)}
                className="hidden"
                id="storeLogo"
              />
              <label htmlFor="storeLogo" className="cursor-pointer">
                <span className="text-sm text-blue-600 hover:text-blue-700">
                  {files.storeLogo ? files.storeLogo.name : 'Upload Store Logo'}
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="terms" 
          checked={formData.terms}
          onCheckedChange={(checked) => updateFormData('terms', checked === true)}
          required
        />
        <Label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
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
          . I understand that my application will be reviewed and I will be notified of the approval status.
        </Label>
      </div>
    </div>
  );

  const benefits = [
    { 
      icon: ShieldCheck, 
      title: "Verified Platform", 
      description: "Join a trusted marketplace",
      color: "from-green-100 to-green-200",
      iconColor: "text-green-600"
    },
    { 
      icon: Users, 
      title: "Global Reach", 
      description: "Access millions of buyers",
      color: "from-blue-100 to-blue-200",
      iconColor: "text-blue-600"
    },
    { 
      icon: TrendingUp, 
      title: "Grow Sales", 
      description: "Increase your revenue",
      color: "from-purple-100 to-purple-200",
      iconColor: "text-purple-600"
    },
    { 
      icon: Zap, 
      title: "Easy Setup", 
      description: "Get started quickly",
      color: "from-yellow-100 to-yellow-200",
      iconColor: "text-yellow-600"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Side - Branding & Benefits */}
          <div className="hidden lg:flex flex-col justify-center space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-100 rounded-full px-4 py-2 text-sm text-blue-700 font-medium mb-6">
                <Store className="w-4 h-4" />
                <span>Start Selling Today</span>
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold text-gray-900 mb-4">
                Become a
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block mt-2">
                  Verified Supplier
                </span>
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Join thousands of successful suppliers on our global B2B marketplace and grow your business worldwide.
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

            {/* Progress Indicator */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-4">Registration Progress</h3>
              <div className="space-y-3">
                {[
                  { step: 1, title: "Personal Information", completed: currentStep > 1 },
                  { step: 2, title: "Business Information", completed: currentStep > 2 },
                  { step: 3, title: "Business Details", completed: currentStep > 3 },
                  { step: 4, title: "Plan & Documents", completed: currentStep > 4 }
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      currentStep === item.step 
                        ? 'bg-blue-600 text-white' 
                        : item.completed 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-200 text-gray-600'
                    }`}>
                      {item.completed ? <CheckCircle className="w-4 h-4" /> : item.step}
                    </div>
                    <span className={`text-sm ${
                      currentStep === item.step ? 'text-blue-600 font-medium' : 'text-gray-600'
                    }`}>
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md bg-white shadow-2xl border-gray-100">
              <CardHeader className="space-y-2 text-center px-6">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Supplier Registration
                </CardTitle>
                <CardDescription className="text-base">
                  Step {currentStep} of {totalSteps}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  />
                </div>

                {/* Form Steps */}
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}

                {/* Navigation Buttons */}
                <div className="flex gap-3 mt-6">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="flex-1 h-11"
                    >
                      Previous
                    </Button>
                  )}
                  
                  {currentStep < totalSteps ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
                    >
                      Next Step
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting || !formData.terms}
                      className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit Application
                          <CheckCircle className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
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
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}