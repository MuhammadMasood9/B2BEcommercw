import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Wand2, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Settings,
  DollarSign,
  Shield,
  Zap,
  Users
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  settings: WizardSetting[];
}

interface WizardSetting {
  key: string;
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  required: boolean;
  defaultValue: any;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface ConfigurationWizardProps {
  onComplete?: (configuration: Record<string, any>) => void;
  onCancel?: () => void;
}

export function ConfigurationWizard({ onComplete, onCancel }: ConfigurationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [configuration, setConfiguration] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const wizardSteps: WizardStep[] = [
    {
      id: 'general',
      title: 'General Settings',
      description: 'Configure basic platform information and branding',
      icon: <Settings className="h-5 w-5" />,
      category: 'general',
      settings: [
        {
          key: 'platform_name',
          name: 'Platform Name',
          description: 'The name of your B2B marketplace',
          type: 'string',
          required: true,
          defaultValue: 'B2B Marketplace'
        },
        {
          key: 'platform_description',
          name: 'Platform Description',
          description: 'Brief description for SEO and branding',
          type: 'string',
          required: false,
          defaultValue: 'Professional B2B marketplace connecting suppliers and buyers worldwide'
        },
        {
          key: 'support_email',
          name: 'Support Email',
          description: 'Primary support contact email',
          type: 'string',
          required: true,
          defaultValue: 'support@example.com',
          validation: {
            pattern: '^[^@]+@[^@]+\\.[^@]+$'
          }
        },
        {
          key: 'maintenance_mode',
          name: 'Maintenance Mode',
          description: 'Enable to restrict platform access during updates',
          type: 'boolean',
          required: false,
          defaultValue: false
        }
      ]
    },
    {
      id: 'commission',
      title: 'Commission Structure',
      description: 'Set up commission rates and financial policies',
      icon: <DollarSign className="h-5 w-5" />,
      category: 'commission',
      settings: [
        {
          key: 'default_rate',
          name: 'Default Commission Rate (%)',
          description: 'Standard commission rate for new suppliers',
          type: 'number',
          required: true,
          defaultValue: 5.0,
          validation: { min: 0, max: 50 }
        },
        {
          key: 'minimum_commission',
          name: 'Minimum Commission Amount ($)',
          description: 'Minimum commission per transaction',
          type: 'number',
          required: true,
          defaultValue: 1.00,
          validation: { min: 0 }
        }
      ]
    },
    {
      id: 'payout',
      title: 'Payout Configuration',
      description: 'Configure supplier payout settings and schedules',
      icon: <DollarSign className="h-5 w-5" />,
      category: 'payout',
      settings: [
        {
          key: 'minimum_payout',
          name: 'Minimum Payout Amount ($)',
          description: 'Minimum amount required for payout processing',
          type: 'number',
          required: true,
          defaultValue: 50.00,
          validation: { min: 1 }
        },
        {
          key: 'payout_schedule',
          name: 'Payout Schedule',
          description: 'How often payouts are processed',
          type: 'select',
          required: true,
          defaultValue: 'weekly',
          options: [
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'biweekly', label: 'Bi-weekly' },
            { value: 'monthly', label: 'Monthly' }
          ]
        }
      ]
    },
    {
      id: 'verification',
      title: 'Supplier Verification',
      description: 'Set verification requirements and policies',
      icon: <Shield className="h-5 w-5" />,
      category: 'verification',
      settings: [
        {
          key: 'auto_approval_enabled',
          name: 'Auto Approval',
          description: 'Automatically approve qualified supplier applications',
          type: 'boolean',
          required: false,
          defaultValue: false
        },
        {
          key: 'verification_expiry_days',
          name: 'Verification Expiry (Days)',
          description: 'Days after which verification expires',
          type: 'number',
          required: true,
          defaultValue: 365,
          validation: { min: 30, max: 1095 }
        }
      ]
    },
    {
      id: 'limits',
      title: 'Platform Limits',
      description: 'Configure operational limits and constraints',
      icon: <Zap className="h-5 w-5" />,
      category: 'limits',
      settings: [
        {
          key: 'max_products_per_supplier',
          name: 'Max Products Per Supplier',
          description: 'Maximum number of products each supplier can list',
          type: 'number',
          required: true,
          defaultValue: 1000,
          validation: { min: 1, max: 10000 }
        },
        {
          key: 'max_images_per_product',
          name: 'Max Images Per Product',
          description: 'Maximum number of images per product listing',
          type: 'number',
          required: true,
          defaultValue: 10,
          validation: { min: 1, max: 50 }
        },
        {
          key: 'max_file_size_mb',
          name: 'Max File Size (MB)',
          description: 'Maximum file size for uploads',
          type: 'number',
          required: true,
          defaultValue: 10,
          validation: { min: 1, max: 100 }
        }
      ]
    },
    {
      id: 'security',
      title: 'Security Settings',
      description: 'Configure security policies and access controls',
      icon: <Shield className="h-5 w-5" />,
      category: 'security',
      settings: [
        {
          key: 'session_timeout_minutes',
          name: 'Session Timeout (Minutes)',
          description: 'User session timeout duration',
          type: 'number',
          required: true,
          defaultValue: 60,
          validation: { min: 5, max: 480 }
        },
        {
          key: 'max_login_attempts',
          name: 'Max Login Attempts',
          description: 'Maximum failed login attempts before lockout',
          type: 'number',
          required: true,
          defaultValue: 5,
          validation: { min: 3, max: 10 }
        },
        {
          key: 'password_min_length',
          name: 'Password Minimum Length',
          description: 'Minimum required password length',
          type: 'number',
          required: true,
          defaultValue: 8,
          validation: { min: 6, max: 32 }
        }
      ]
    }
  ];

  useEffect(() => {
    // Initialize configuration with default values
    const initialConfig: Record<string, any> = {};
    wizardSteps.forEach(step => {
      step.settings.forEach(setting => {
        const key = `${step.category}.${setting.key}`;
        initialConfig[key] = setting.defaultValue;
      });
    });
    setConfiguration(initialConfig);
  }, []);

  const validateSetting = (setting: WizardSetting, value: any): string | null => {
    if (setting.required && (value === null || value === undefined || value === '')) {
      return 'This field is required';
    }

    if (setting.validation) {
      if (setting.type === 'number') {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return 'Must be a valid number';
        if (setting.validation.min !== undefined && numValue < setting.validation.min) {
          return `Must be at least ${setting.validation.min}`;
        }
        if (setting.validation.max !== undefined && numValue > setting.validation.max) {
          return `Must be at most ${setting.validation.max}`;
        }
      }

      if (setting.type === 'string' && setting.validation.pattern) {
        const regex = new RegExp(setting.validation.pattern);
        if (!regex.test(value)) {
          return 'Invalid format';
        }
      }
    }

    return null;
  };

  const validateCurrentStep = (): boolean => {
    const step = wizardSteps[currentStep];
    const errors: Record<string, string> = {};
    let isValid = true;

    step.settings.forEach(setting => {
      const key = `${step.category}.${setting.key}`;
      const value = configuration[key];
      const error = validateSetting(setting, value);
      
      if (error) {
        errors[key] = error;
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleSettingChange = (category: string, key: string, value: any) => {
    const fullKey = `${category}.${key}`;
    setConfiguration(prev => ({
      ...prev,
      [fullKey]: value
    }));

    // Clear validation error for this field
    if (validationErrors[fullKey]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[fullKey];
        return updated;
      });
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < wizardSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      
      // Prepare settings for bulk update
      const updates = Object.entries(configuration).map(([key, value]) => {
        const [category, settingKey] = key.split('.');
        const setting = wizardSteps
          .find(s => s.category === category)
          ?.settings.find(s => s.key === settingKey);

        return {
          category,
          key: settingKey,
          newValue: setting?.type === 'number' ? parseFloat(value) : value
        };
      });

      // Apply configuration
      const response = await fetch('/api/admin/settings/platform-configuration/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          updates,
          changeReason: 'Initial platform configuration via setup wizard'
        })
      });

      if (!response.ok) throw new Error('Failed to apply configuration');

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Platform configuration completed successfully"
        });
        onComplete?.(configuration);
      } else {
        throw new Error(data.errors?.join(', ') || 'Failed to apply configuration');
      }
    } catch (error: any) {
      console.error('Error completing configuration:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderSettingInput = (step: WizardStep, setting: WizardSetting) => {
    const key = `${step.category}.${setting.key}`;
    const value = configuration[key];
    const error = validationErrors[key];

    return (
      <div key={setting.key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">
          {setting.name}
          {setting.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        <div className="space-y-1">
          {setting.type === 'boolean' ? (
            <div className="flex items-center space-x-2">
              <Switch
                id={key}
                checked={value || false}
                onCheckedChange={(checked) => handleSettingChange(step.category, setting.key, checked)}
              />
              <Label htmlFor={key} className="text-sm text-muted-foreground">
                {value ? 'Enabled' : 'Disabled'}
              </Label>
            </div>
          ) : setting.type === 'select' ? (
            <Select value={value || ''} onValueChange={(val) => handleSettingChange(step.category, setting.key, val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {setting.options?.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : setting.type === 'number' ? (
            <Input
              id={key}
              type="number"
              value={value || ''}
              onChange={(e) => handleSettingChange(step.category, setting.key, e.target.value)}
              className={error ? 'border-red-500' : ''}
            />
          ) : (
            <Input
              id={key}
              type="text"
              value={value || ''}
              onChange={(e) => handleSettingChange(step.category, setting.key, e.target.value)}
              className={error ? 'border-red-500' : ''}
            />
          )}
          
          {setting.description && (
            <p className="text-xs text-muted-foreground">{setting.description}</p>
          )}
          
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      </div>
    );
  };

  const currentStepData = wizardSteps[currentStep];
  const progress = ((currentStep + 1) / wizardSteps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Wand2 className="h-8 w-8" />
          Platform Configuration Wizard
        </h1>
        <p className="text-muted-foreground">
          Set up your B2B marketplace platform with guided configuration
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Step {currentStep + 1} of {wizardSteps.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Navigation */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-2">
          {wizardSteps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                index === currentStep 
                  ? 'bg-primary text-primary-foreground' 
                  : index < currentStep 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-muted text-muted-foreground'
              }`}>
                {index < currentStep ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  step.icon
                )}
                <span className="text-sm font-medium">{step.title}</span>
              </div>
              {index < wizardSteps.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentStepData.icon}
            {currentStepData.title}
          </CardTitle>
          <CardDescription>
            {currentStepData.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStepData.settings.map(setting => renderSettingInput(currentStepData, setting))}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <div>
          {currentStep > 0 && (
            <Button variant="outline" onClick={handlePrevious}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          
          <Button onClick={handleNext} disabled={loading}>
            {loading ? (
              'Applying...'
            ) : currentStep === wizardSteps.length - 1 ? (
              'Complete Setup'
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Validation Summary */}
      {Object.keys(validationErrors).length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please fix the validation errors above before proceeding.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}