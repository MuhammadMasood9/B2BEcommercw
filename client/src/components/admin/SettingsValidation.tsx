import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info,
  Clock,
  Users,
  Server,
  DollarSign,
  Shield,
  Zap
} from 'lucide-react';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ImpactAnalysis {
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedSystems: string[];
  affectedUsers: string[];
  estimatedDowntime?: number;
  rollbackComplexity: 'simple' | 'moderate' | 'complex';
  recommendations: string[];
}

interface SettingsValidationProps {
  settingId: string;
  currentValue: any;
  newValue: any;
  onValidationComplete?: (isValid: boolean) => void;
}

export function SettingsValidation({ 
  settingId, 
  currentValue, 
  newValue, 
  onValidationComplete 
}: SettingsValidationProps) {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [impact, setImpact] = useState<ImpactAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const severityColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200'
  };

  const complexityColors = {
    simple: 'bg-green-100 text-green-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    complex: 'bg-red-100 text-red-800'
  };

  const systemIcons: Record<string, React.ReactNode> = {
    'commission': <DollarSign className="h-4 w-4" />,
    'payout': <DollarSign className="h-4 w-4" />,
    'security': <Shield className="h-4 w-4" />,
    'performance': <Zap className="h-4 w-4" />,
    'database': <Server className="h-4 w-4" />,
    'api': <Server className="h-4 w-4" />,
    'users': <Users className="h-4 w-4" />
  };

  useEffect(() => {
    if (settingId && newValue !== undefined) {
      validateChange();
    }
  }, [settingId, newValue]);

  useEffect(() => {
    if (validation) {
      onValidationComplete?.(validation.isValid);
    }
  }, [validation, onValidationComplete]);

  const validateChange = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings/platform-configuration/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ settingId, newValue })
      });

      if (!response.ok) throw new Error('Failed to validate setting');

      const data = await response.json();
      setValidation(data.validation);
      setImpact(data.impact);
    } catch (error) {
      console.error('Error validating setting:', error);
      setValidation({
        isValid: false,
        errors: ['Failed to validate setting change'],
        warnings: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Validating change...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!validation || !impact) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Validation Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {validation.isValid ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            Validation Results
          </CardTitle>
          <CardDescription>
            Analysis of the proposed setting change
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Value Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm mb-2 text-red-600">Current Value</h4>
              <pre className="bg-red-50 p-3 rounded text-xs overflow-auto max-h-32 border">
                {formatValue(currentValue)}
              </pre>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2 text-green-600">New Value</h4>
              <pre className="bg-green-50 p-3 rounded text-xs overflow-auto max-h-32 border">
                {formatValue(newValue)}
              </pre>
            </div>
          </div>

          <Separator />

          {/* Validation Status */}
          <div className="flex items-center gap-2">
            <Badge variant={validation.isValid ? "default" : "destructive"}>
              {validation.isValid ? 'Valid' : 'Invalid'}
            </Badge>
            {validation.errors.length > 0 && (
              <Badge variant="destructive">
                {validation.errors.length} Error{validation.errors.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {validation.warnings.length > 0 && (
              <Badge variant="secondary">
                {validation.warnings.length} Warning{validation.warnings.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Errors */}
          {validation.errors.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">Validation Errors:</div>
                  <ul className="list-disc list-inside text-sm">
                    {validation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">Warnings:</div>
                  <ul className="list-disc list-inside text-sm">
                    {validation.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Impact Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5 text-blue-500" />
            Impact Analysis
          </CardTitle>
          <CardDescription>
            Predicted impact of this change on the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Impact Summary */}
          <div className="flex items-center gap-4">
            <Badge className={`${severityColors[impact.severity]} border`}>
              {impact.severity.toUpperCase()} IMPACT
            </Badge>
            <Badge className={complexityColors[impact.rollbackComplexity]}>
              {impact.rollbackComplexity.toUpperCase()} ROLLBACK
            </Badge>
            {impact.estimatedDowntime && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {Math.floor(impact.estimatedDowntime / 60)}min downtime
              </Badge>
            )}
          </div>

          {/* Affected Systems */}
          {impact.affectedSystems.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Affected Systems</h4>
              <div className="flex flex-wrap gap-2">
                {impact.affectedSystems.map((system, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {systemIcons[system.toLowerCase()] || <Server className="h-3 w-3" />}
                    {system}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Affected Users */}
          {impact.affectedUsers.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Affected Users</h4>
              <div className="flex flex-wrap gap-2">
                {impact.affectedUsers.map((userType, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {userType}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {impact.recommendations.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Recommendations</h4>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {impact.recommendations.map((recommendation, index) => (
                      <li key={index}>{recommendation}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Impact Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Severity Level:</strong>
              <div className="mt-1">
                <Badge className={severityColors[impact.severity]}>
                  {impact.severity}
                </Badge>
              </div>
            </div>
            <div>
              <strong>Rollback Complexity:</strong>
              <div className="mt-1">
                <Badge className={complexityColors[impact.rollbackComplexity]}>
                  {impact.rollbackComplexity}
                </Badge>
              </div>
            </div>
          </div>

          {/* Critical Impact Warning */}
          {impact.severity === 'critical' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">Critical Impact Detected</div>
                <div className="text-sm mt-1">
                  This change has been identified as having critical impact on the platform. 
                  Please review all recommendations carefully and consider scheduling this 
                  change during a maintenance window.
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}