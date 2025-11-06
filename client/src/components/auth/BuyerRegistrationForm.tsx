import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  MapPin,
  Briefcase
} from "lucide-react";
import { toast } from "react-hot-toast";

interface BuyerRegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  position: string;
  industry: string;
  country: string;
  city: string;
  terms: boolean;
  newsletter: boolean;
}

const initialData: BuyerRegistrationData = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  companyName: '',
  phone: '',
  position: '',
  industry: '',
  country: '',
  city: '',
  terms: false,
  newsletter: false,
};

const industries = [
  'Agriculture & Food',
  'Automotive',
  'Chemicals',
  'Construction & Real Estate',
  'Consumer Electronics',
  'Energy',
  'Fashion & Apparel',
  'Healthcare & Medical',
  'Industrial Equipment',
  'Information Technology',
  'Manufacturing',
  'Retail & Wholesale',
  'Telecommunications',
  'Transportation & Logistics',
  'Other'
];

interface BuyerRegistrationFormProps {
  onSuccess?: () => void;
}

export default function BuyerRegistrationForm({ onSuccess }: BuyerRegistrationFormProps) {
  const [formData, setFormData] = useState<BuyerRegistrationData>(initialData);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [location, setLocation] = useLocation();
  
  const { error, clearError } = useAuth();

  const updateFormData = (field: keyof BuyerRegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Required fields
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.password) errors.password = 'Password is required';
    if (!formData.confirmPassword) errors.confirmPassword = 'Please confirm your password';
    if (!formData.companyName.trim()) errors.companyName = 'Company name is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.position.trim()) errors.position = 'Position is required';
    if (!formData.industry) errors.industry = 'Industry is required';
    if (!formData.country.trim()) errors.country = 'Country is required';
    if (!formData.city.trim()) errors.city = 'City is required';

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

    // Terms validation
    if (!formData.terms) {
      errors.terms = 'You must accept the terms and conditions';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      const response = await fetch('/api/registration/buyer/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          companyName: formData.companyName,
          phone: formData.phone,
          position: formData.position,
          industry: formData.industry,
          country: formData.country,
          city: formData.city,
          newsletter: formData.newsletter,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Registration successful! Please check your email to verify your account.');
        
        if (onSuccess) {
          onSuccess();
        } else {
          setLocation('/email-verification');
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Personal Information */}
      <div className="space-y-4">
        <div className="text-center">
          <h4 className="font-medium text-gray-900">Personal Information</h4>
          <p className="text-sm text-gray-600">Tell us about yourself</p>
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

      {/* Company Information */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <h4 className="font-medium text-gray-900">Company Information</h4>
          <p className="text-sm text-gray-600">Tell us about your business</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyName" className="text-sm font-medium">
            Company Name *
          </Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="companyName"
              placeholder="Your Company Ltd."
              value={formData.companyName}
              onChange={(e) => updateFormData('companyName', e.target.value)}
              className={`pl-10 h-11 ${validationErrors.companyName ? 'border-red-500' : ''}`}
              disabled={isSubmitting}
            />
          </div>
          {validationErrors.companyName && (
            <p className="text-xs text-red-600">{validationErrors.companyName}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="position" className="text-sm font-medium">
              Your Position *
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

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number *
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry" className="text-sm font-medium">
            Industry *
          </Label>
          <Select 
            value={formData.industry} 
            onValueChange={(value) => updateFormData('industry', value)}
            disabled={isSubmitting}
          >
            <SelectTrigger className={`h-11 ${validationErrors.industry ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              {industries.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {validationErrors.industry && (
            <p className="text-xs text-red-600">{validationErrors.industry}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country" className="text-sm font-medium">
              Country *
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="country"
                placeholder="United States"
                value={formData.country}
                onChange={(e) => updateFormData('country', e.target.value)}
                className={`pl-10 h-11 ${validationErrors.country ? 'border-red-500' : ''}`}
                disabled={isSubmitting}
              />
            </div>
            {validationErrors.country && (
              <p className="text-xs text-red-600">{validationErrors.country}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm font-medium">
              City *
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="city"
                placeholder="New York"
                value={formData.city}
                onChange={(e) => updateFormData('city', e.target.value)}
                className={`pl-10 h-11 ${validationErrors.city ? 'border-red-500' : ''}`}
                disabled={isSubmitting}
              />
            </div>
            {validationErrors.city && (
              <p className="text-xs text-red-600">{validationErrors.city}</p>
            )}
          </div>
        </div>
      </div>

      {/* Terms and Newsletter */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="terms" 
            checked={formData.terms}
            onCheckedChange={(checked) => updateFormData('terms', checked === true)}
            disabled={isSubmitting}
            className={validationErrors.terms ? 'border-red-500' : ''}
          />
          <Label htmlFor="terms" className="text-xs text-gray-600 cursor-pointer leading-relaxed">
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
            *
          </Label>
        </div>
        {validationErrors.terms && (
          <p className="text-xs text-red-600 ml-6">{validationErrors.terms}</p>
        )}

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="newsletter" 
            checked={formData.newsletter}
            onCheckedChange={(checked) => updateFormData('newsletter', checked === true)}
            disabled={isSubmitting}
          />
          <Label htmlFor="newsletter" className="text-xs text-gray-600 cursor-pointer leading-relaxed">
            I would like to receive marketing emails about new features, products, and special offers
          </Label>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !formData.terms}
        className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          <>
            Create Buyer Account
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}