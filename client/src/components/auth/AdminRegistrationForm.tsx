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
  User, 
  Phone, 
  Loader2,
  AlertCircle,
  ArrowRight,
  Shield,
  Briefcase,
  Key
} from "lucide-react";
import { toast } from "react-hot-toast";

interface AdminRegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  position: string;
  department: string;
  accessLevel: 'admin' | 'super_admin';
  twoFactorEnabled: boolean;
  terms: boolean;
}

const initialData: AdminRegistrationData = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  phone: '',
  position: '',
  department: '',
  accessLevel: 'admin',
  twoFactorEnabled: true,
  terms: false,
};

const departments = [
  'Operations',
  'Customer Support',
  'Business Development',
  'Marketing',
  'Finance',
  'Technology',
  'Legal & Compliance',
  'Human Resources',
  'Other'
];

interface AdminRegistrationFormProps {
  onSuccess?: () => void;
  allowSuperAdmin?: boolean; // Only super-admins can create other super-admins
}

export default function AdminRegistrationForm({ onSuccess, allowSuperAdmin = false }: AdminRegistrationFormProps) {
  const [formData, setFormData] = useState<AdminRegistrationData>(initialData);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [location, setLocation] = useLocation();
  
  const { error, clearError, user } = useAuth();

  // Check if current user can create admin accounts
  const canCreateAdmin = user?.role === 'admin';

  const updateFormData = (field: keyof AdminRegistrationData, value: any) => {
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
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.position.trim()) errors.position = 'Position is required';
    if (!formData.department) errors.department = 'Department is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation - stricter for admins
    if (formData.password && formData.password.length < 12) {
      errors.password = 'Admin password must be at least 12 characters long';
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

    // Access level validation
    if (formData.accessLevel === 'super_admin' && !allowSuperAdmin) {
      errors.accessLevel = 'You do not have permission to create super admin accounts';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canCreateAdmin) {
      toast.error('You do not have permission to create admin accounts');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      const response = await fetch('/api/registration/admin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          position: formData.position,
          department: formData.department,
          accessLevel: formData.accessLevel,
          twoFactorEnabled: formData.twoFactorEnabled,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Admin account created successfully! The user will receive login instructions via email.');
        
        if (onSuccess) {
          onSuccess();
        } else {
          setLocation('/admin/user-management');
        }
      } else {
        toast.error(result.error || 'Failed to create admin account');
      }
    } catch (error: any) {
      console.error('Admin creation error:', error);
      toast.error('Failed to create admin account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canCreateAdmin) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You do not have permission to create admin accounts. Only existing administrators can create new admin accounts.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Admin accounts have elevated privileges and require enhanced security measures including two-factor authentication.
        </AlertDescription>
      </Alert>

      {/* Personal Information */}
      <div className="space-y-4">
        <div className="text-center">
          <h4 className="font-medium text-gray-900">Administrator Information</h4>
          <p className="text-sm text-gray-600">Create a new admin account</p>
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
              placeholder="admin@company.com"
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
                placeholder="Create secure password"
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
            <p className="text-xs text-gray-500">
              Minimum 12 characters with uppercase, lowercase, number, and special character
            </p>
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

      {/* Role Information */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <h4 className="font-medium text-gray-900">Role & Department</h4>
          <p className="text-sm text-gray-600">Administrative role details</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="position" className="text-sm font-medium">
              Position *
            </Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="position"
                placeholder="Platform Administrator"
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
            <Label htmlFor="department" className="text-sm font-medium">
              Department *
            </Label>
            <Select 
              value={formData.department} 
              onValueChange={(value) => updateFormData('department', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger className={`h-11 ${validationErrors.department ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.department && (
              <p className="text-xs text-red-600">{validationErrors.department}</p>
            )}
          </div>
        </div>

        {allowSuperAdmin && (
          <div className="space-y-2">
            <Label htmlFor="accessLevel" className="text-sm font-medium">
              Access Level *
            </Label>
            <Select 
              value={formData.accessLevel} 
              onValueChange={(value) => updateFormData('accessLevel', value as 'admin' | 'super_admin')}
              disabled={isSubmitting}
            >
              <SelectTrigger className={`h-11 ${validationErrors.accessLevel ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Select access level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>Administrator</span>
                  </div>
                </SelectItem>
                <SelectItem value="super_admin">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    <span>Super Administrator</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {validationErrors.accessLevel && (
              <p className="text-xs text-red-600">{validationErrors.accessLevel}</p>
            )}
            <p className="text-xs text-gray-500">
              Super administrators can create other admin accounts and have full system access
            </p>
          </div>
        )}
      </div>

      {/* Security Settings */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        <div className="text-center">
          <h4 className="font-medium text-gray-900">Security Settings</h4>
          <p className="text-sm text-gray-600">Enhanced security requirements</p>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="twoFactor" 
            checked={formData.twoFactorEnabled}
            onCheckedChange={(checked) => updateFormData('twoFactorEnabled', checked === true)}
            disabled={true} // Always required for admins
          />
          <Label htmlFor="twoFactor" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
            Enable Two-Factor Authentication (Required for all admin accounts)
          </Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="terms" 
            checked={formData.terms}
            onCheckedChange={(checked) => updateFormData('terms', checked === true)}
            disabled={isSubmitting}
            className={validationErrors.terms ? 'border-red-500' : ''}
          />
          <Label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
            I acknowledge that this admin account will have elevated privileges and agree to the{" "}
            <Link href="/admin-terms">
              <span className="text-blue-600 hover:text-blue-700 font-medium">
                Administrator Terms of Service
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
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !formData.terms}
        className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating admin account...
          </>
        ) : (
          <>
            Create Admin Account
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}