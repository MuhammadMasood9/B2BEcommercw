import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Building2, 
  User, 
  Phone, 
  Loader2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Calendar,
  Upload,
  X,
  Factory,
  Store,
  Crown,
  Star,
  Award,
  CheckCircle,
  Globe,
  Briefcase
} from "lucide-react";
import { toast } from "react-hot-toast";

interface SupplierRegistrationData {
  // Step 1: Personal Information
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  
  // Step 2: Business Information
  businessName: string;
  businessType: 'manufacturer' | 'trading_company' | 'wholesaler' | 'distributor' | '';
  storeName: string;
  contactPerson: string;
  position: string;
  phone: string;
  whatsapp: string;
  wechat: string;
  address: string;
  city: string;
  country: string;
  website: string;
  
  // Step 3: Business Details
  yearEstablished: number | '';
  employees: string;
  factorySize: string;
  annualRevenue: string;
  mainProducts: string[];
  exportMarkets: string[];
  storeDescription: string;
  
  // Step 4: Membership & Documents
  membershipTier: 'free' | 'silver' | 'gold' | 'platinum';
  terms: boolean;
}

const initialData: SupplierRegistrationData = {
  email: '',
  password: '',
  confirmPassword: '',
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
  storeDescription: '',
  membershipTier: 'free',
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

interface SupplierRegistrationFormProps {
  onSuccess?: () => void;
}

export default function SupplierRegistrationForm({ onSuccess }: SupplierRegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SupplierRegistrationData>(initialData);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<{
    businessLicense?: File;
    taxRegistration?: File;
    identityDocument?: File;
    storeLogo?: File;
  }>({});
  const [newProduct, setNewProduct] = useState('');
  const [newMarket, setNewMarket] = useState('');
  const [location, setLocation] = useLocation();

  const totalSteps = 4;

  const updateFormData = (field: keyof SupplierRegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
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
    const errors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.firstName.trim()) errors.firstName = 'First name is required';
        if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
        if (!formData.email.trim()) errors.email = 'Email is required';
        if (!formData.password) errors.password = 'Password is required';
        if (!formData.confirmPassword) errors.confirmPassword = 'Please confirm your password';

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
          errors.email = 'Please enter a valid email address';
        }

        // Password validation
        if (formData.password && formData.password.length < 8) {
          errors.password = 'Password must be at least 8 characters long';
        }

        if (formData.password && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
          errors.password = 'Password must contain uppercase, lowercase, number, and special character';
        }

        // Confirm password validation
        if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        }
        break;

      case 2:
        if (!formData.businessName.trim()) errors.businessName = 'Business name is required';
        if (!formData.businessType) errors.businessType = 'Business type is required';
        if (!formData.storeName.trim()) errors.storeName = 'Store name is required';
        if (!formData.contactPerson.trim()) errors.contactPerson = 'Contact person is required';
        if (!formData.position.trim()) errors.position = 'Position is required';
        if (!formData.phone.trim()) errors.phone = 'Phone number is required';
        if (!formData.address.trim()) errors.address = 'Address is required';
        if (!formData.city.trim()) errors.city = 'City is required';
        if (!formData.country.trim()) errors.country = 'Country is required';
        break;

      case 3:
        // Business details are optional
        break;

      case 4:
        if (!formData.terms) errors.terms = 'You must accept the terms and conditions';
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      toast.error('Please fix the errors below');
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

      if (response.ok && result.success) {
        toast.success('Registration successful! Your application is pending approval.');
        
        if (onSuccess) {
          onSuccess();
        } else {
          setLocation('/supplier/application-status');
        }
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch (error: any) {
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
              className={`pl-10 h-11 ${validationErrors.firstName ? 'border-red-500' : ''}`}
              disabled={isSubmitting}
            />
          </div>
          {validationErrors.firstName && (
            <p className="text-xs text-red-600">{validationErrors.firstName}</p>
          )}
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
              className={`pl-10 h-11 ${validationErrors.lastName ? 'border-red-500' : ''}`}
              disabled={isSubmitting}
            />
          </div>
          {validationErrors.lastName && (
            <p className="text-xs text-red-600">{validationErrors.lastName}</p>
          )}
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
            className={`pl-10 h-11 ${validationErrors.email ? 'border-red-500' : ''}`}
            disabled={isSubmitting}
          />
        </div>
        {validationErrors.email && (
          <p className="text-xs text-red-600">{validationErrors.email}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password *
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create password"
              value={formData.password}
              onChange={(e) => updateFormData('password', e.target.value)}
              className={`pl-10 pr-10 h-11 ${validationErrors.password ? 'border-red-500' : ''}`}
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={isSubmitting}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {validationErrors.password && (
            <p className="text-xs text-red-600">{validationErrors.password}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm Password *
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={(e) => updateFormData('confirmPassword', e.target.value)}
              className={`pl-10 pr-10 h-11 ${validationErrors.confirmPassword ? 'border-red-500' : ''}`}
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={isSubmitting}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <p className="text-xs text-red-600">{validationErrors.confirmPassword}</p>
          )}
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
            className={`pl-10 h-11 ${validationErrors.businessName ? 'border-red-500' : ''}`}
            disabled={isSubmitting}
          />
        </div>
        {validationErrors.businessName && (
          <p className="text-xs text-red-600">{validationErrors.businessName}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="businessType" className="text-sm font-medium">
            Business Type *
          </Label>
          <Select 
            value={formData.businessType} 
            onValueChange={(value) => updateFormData('businessType', value)}
            disabled={isSubmitting}
          >
            <SelectTrigger className={`h-11 ${validationErrors.businessType ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select business type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manufacturer">Manufacturer</SelectItem>
              <SelectItem value="trading_company">Trading Company</SelectItem>
              <SelectItem value="wholesaler">Wholesaler</SelectItem>
              <SelectItem value="distributor">Distributor</SelectItem>
            </SelectContent>
          </Select>
          {validationErrors.businessType && (
            <p className="text-xs text-red-600">{validationErrors.businessType}</p>
          )}
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
              className={`pl-10 h-11 ${validationErrors.storeName ? 'border-red-500' : ''}`}
              disabled={isSubmitting}
            />
          </div>
          {validationErrors.storeName && (
            <p className="text-xs text-red-600">{validationErrors.storeName}</p>
          )}
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
              className={`pl-10 h-11 ${validationErrors.contactPerson ? 'border-red-500' : ''}`}
              disabled={isSubmitting}
            />
          </div>
          {validationErrors.contactPerson && (
            <p className="text-xs text-red-600">{validationErrors.contactPerson}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="position" className="text-sm font-medium">
            Position *
          </Label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="position"
              placeholder="CEO, Manager, etc."
              value={formData.position}
              onChange={(e) => updateFormData('position', e.target.value)}
              className={`pl-10 h-11 ${validationErrors.position ? 'border-red-500' : ''}`}
              disabled={isSubmitting}
            />
          </div>
          {validationErrors.position && (
            <p className="text-xs text-red-600">{validationErrors.position}</p>
          )}
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
              className={`pl-10 h-11 ${validationErrors.phone ? 'border-red-500' : ''}`}
              disabled={isSubmitting}
            />
          </div>
          {validationErrors.phone && (
            <p className="text-xs text-red-600">{validationErrors.phone}</p>
          )}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
            className={`pl-10 min-h-[80px] ${validationErrors.address ? 'border-red-500' : ''}`}
            disabled={isSubmitting}
          />
        </div>
        {validationErrors.address && (
          <p className="text-xs text-red-600">{validationErrors.address}</p>
        )}
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
            className={`h-11 ${validationErrors.city ? 'border-red-500' : ''}`}
            disabled={isSubmitting}
          />
          {validationErrors.city && (
            <p className="text-xs text-red-600">{validationErrors.city}</p>
          )}
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
            className={`h-11 ${validationErrors.country ? 'border-red-500' : ''}`}
            disabled={isSubmitting}
          />
          {validationErrors.country && (
            <p className="text-xs text-red-600">{validationErrors.country}</p>
          )}
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
            disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="employees" className="text-sm font-medium">
            Number of Employees
          </Label>
          <Select 
            value={formData.employees} 
            onValueChange={(value) => updateFormData('employees', value)}
            disabled={isSubmitting}
          >
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
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="annualRevenue" className="text-sm font-medium">
            Annual Revenue
          </Label>
          <Select 
            value={formData.annualRevenue} 
            onValueChange={(value) => updateFormData('annualRevenue', value)}
            disabled={isSubmitting}
          >
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
            disabled={isSubmitting}
          />
          <Button 
            type="button" 
            onClick={addProduct} 
            variant="outline" 
            className="h-11 px-4"
            disabled={isSubmitting}
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.mainProducts.map((product, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {product}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => removeProduct(product)} 
              />
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
            disabled={isSubmitting}
          />
          <Button 
            type="button" 
            onClick={addMarket} 
            variant="outline" 
            className="h-11 px-4"
            disabled={isSubmitting}
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.exportMarkets.map((market, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {market}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => removeMarket(market)} 
              />
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
          disabled={isSubmitting}
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
        <h4 className="font-medium text-gray-900">Verification Documents (Optional)</h4>
        <p className="text-sm text-gray-600">Upload documents to speed up the verification process</p>
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
          disabled={isSubmitting}
          className={validationErrors.terms ? 'border-red-500' : ''}
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
          . I understand that my application will be reviewed and I will be notified of the approval status. *
        </Label>
      </div>
      {validationErrors.terms && (
        <p className="text-xs text-red-600 ml-6">{validationErrors.terms}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
        </div>
        <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
      </div>

      {/* Step Content */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        {currentStep > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            className="flex-1 h-11"
            disabled={isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
        )}
        
        {currentStep < totalSteps ? (
          <Button
            type="button"
            onClick={nextStep}
            className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
            disabled={isSubmitting}
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
    </div>
  );
}