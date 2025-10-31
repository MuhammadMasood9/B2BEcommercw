import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Save, 
  RotateCcw, 
  AlertTriangle, 
  Info, 
  Lock, 
  Unlock,
  Download,
  Upload,
  History,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface PlatformSetting {
  id: string;
  key: string;
  name: string;
  description?: string;
  valueType: 'string' | 'number' | 'boolean' | 'json';
  value: any;
  defaultValue: any;
  validationRules?: any;
  environment: string;
  requiresRestart: boolean;
  isSensitive: boolean;
  dependencies?: string[];
  affects?: string[];
  isReadonly: boolean;
  updatedAt: string;
  updatedBy?: string;
}

interface SettingsGroup {
  [category: string]: PlatformSetting[];
}

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

export function PlatformSettings() {
  const [settings, setSettings] = useState<SettingsGroup>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState('production');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});
  const [impactAnalysis, setImpactAnalysis] = useState<Record<string, ImpactAnalysis>>({});
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const environments = ['development', 'staging', 'production'];
  
  const categoryLabels: Record<string, string> = {
    general: 'General Settings',
    commission: 'Commission Settings',
    payout: 'Payout Settings',
    verification: 'Verification Settings',
    limits: 'Platform Limits',
    features: 'Feature Flags',
    security: 'Security Settings'
  };

  const severityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    fetchSettings();
  }, [selectedEnvironment]);

  useEffect(() => {
    if (Object.keys(settings).length > 0 && !selectedCategory) {
      setSelectedCategory(Object.keys(settings)[0]);
    }
  }, [settings]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/settings/platform-configuration?environment=${selectedEnvironment}`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch settings');

      const data = await response.json();
      setSettings(data.settings || {});
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load platform settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (settingId: string, newValue: any) => {
    setPendingChanges(prev => ({
      ...prev,
      [settingId]: newValue
    }));

    // Validate the change
    try {
      const response = await fetch('/api/admin/settings/platform-configuration/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ settingId, newValue })
      });

      if (response.ok) {
        const data = await response.json();
        setValidationResults(prev => ({
          ...prev,
          [settingId]: data.validation
        }));
        setImpactAnalysis(prev => ({
          ...prev,
          [settingId]: data.impact
        }));
      }
    } catch (error) {
      console.error('Error validating setting:', error);
    }
  };

  const saveSetting = async (settingId: string, changeReason: string) => {
    if (!pendingChanges[settingId]) return;

    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings/platform-configuration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          settingId,
          newValue: pendingChanges[settingId],
          changeReason
        })
      });

      if (!response.ok) throw new Error('Failed to save setting');

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Setting updated successfully"
        });

        // Remove from pending changes
        setPendingChanges(prev => {
          const updated = { ...prev };
          delete updated[settingId];
          return updated;
        });

        // Refresh settings
        await fetchSettings();
      } else {
        throw new Error(data.errors?.join(', ') || 'Failed to save setting');
      }
    } catch (error: any) {
      console.error('Error saving setting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save setting",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const resetSetting = (settingId: string) => {
    setPendingChanges(prev => {
      const updated = { ...prev };
      delete updated[settingId];
      return updated;
    });
    setValidationResults(prev => {
      const updated = { ...prev };
      delete updated[settingId];
      return updated;
    });
    setImpactAnalysis(prev => {
      const updated = { ...prev };
      delete updated[settingId];
      return updated;
    });
  };

  const toggleSensitiveVisibility = (settingId: string) => {
    setShowSensitive(prev => ({
      ...prev,
      [settingId]: !prev[settingId]
    }));
  };

  const renderSettingInput = (setting: PlatformSetting) => {
    const currentValue = pendingChanges[setting.id] !== undefined 
      ? pendingChanges[setting.id] 
      : setting.value;
    const validation = validationResults[setting.id];
    const impact = impactAnalysis[setting.id];
    const hasChanges = pendingChanges[setting.id] !== undefined;

    return (
      <Card key={setting.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {setting.name}
                {setting.isSensitive && <Lock className="h-3 w-3 text-amber-500" />}
                {setting.requiresRestart && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                {setting.isReadonly && <Badge variant="secondary" className="text-xs">Read Only</Badge>}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {setting.description}
                {setting.key && <span className="text-muted-foreground ml-2">({setting.key})</span>}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resetSetting(setting.id)}
                    disabled={saving}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const reason = prompt('Please provide a reason for this change:');
                      if (reason) {
                        saveSetting(setting.id, reason);
                      }
                    }}
                    disabled={saving || (validation && !validation.isValid)}
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Setting Input */}
            <div>
              {setting.valueType === 'boolean' ? (
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={currentValue || false}
                    onCheckedChange={(checked) => handleSettingChange(setting.id, checked)}
                    disabled={setting.isReadonly}
                  />
                  <Label className="text-sm">
                    {currentValue ? 'Enabled' : 'Disabled'}
                  </Label>
                </div>
              ) : setting.valueType === 'number' ? (
                <Input
                  type="number"
                  value={currentValue || ''}
                  onChange={(e) => handleSettingChange(setting.id, parseFloat(e.target.value) || 0)}
                  disabled={setting.isReadonly}
                  className="max-w-xs"
                />
              ) : setting.valueType === 'json' ? (
                <Textarea
                  value={typeof currentValue === 'object' ? JSON.stringify(currentValue, null, 2) : currentValue || ''}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      handleSettingChange(setting.id, parsed);
                    } catch {
                      handleSettingChange(setting.id, e.target.value);
                    }
                  }}
                  disabled={setting.isReadonly}
                  rows={4}
                  className="font-mono text-sm"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type={setting.isSensitive && !showSensitive[setting.id] ? 'password' : 'text'}
                    value={currentValue || ''}
                    onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                    disabled={setting.isReadonly}
                    className="flex-1"
                  />
                  {setting.isSensitive && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleSensitiveVisibility(setting.id)}
                    >
                      {showSensitive[setting.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Validation Results */}
            {validation && (
              <div className="space-y-2">
                {validation.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside text-sm">
                        {validation.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                {validation.warnings.length > 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside text-sm">
                        {validation.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Impact Analysis */}
            {impact && hasChanges && (
              <div className="border rounded-lg p-3 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={severityColors[impact.severity]}>
                    {impact.severity.toUpperCase()} IMPACT
                  </Badge>
                  {impact.rollbackComplexity !== 'simple' && (
                    <Badge variant="outline">
                      {impact.rollbackComplexity} rollback
                    </Badge>
                  )}
                </div>
                
                {impact.affectedSystems.length > 0 && (
                  <div className="text-sm mb-2">
                    <strong>Affected Systems:</strong> {impact.affectedSystems.join(', ')}
                  </div>
                )}
                
                {impact.estimatedDowntime && (
                  <div className="text-sm mb-2">
                    <strong>Estimated Downtime:</strong> {Math.floor(impact.estimatedDowntime / 60)} minutes
                  </div>
                )}
                
                {impact.recommendations.length > 0 && (
                  <div className="text-sm">
                    <strong>Recommendations:</strong>
                    <ul className="list-disc list-inside mt-1 ml-2">
                      {impact.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Setting Metadata */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {setting.updatedAt && (
                <span>Last updated: {new Date(setting.updatedAt).toLocaleString()}</span>
              )}
              {setting.updatedBy && (
                <span>by {setting.updatedBy}</span>
              )}
              {setting.dependencies && setting.dependencies.length > 0 && (
                <span>Depends on: {setting.dependencies.join(', ')}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const categories = Object.keys(settings);
  const currentSettings = selectedCategory ? settings[selectedCategory] || [] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Platform Settings
          </h2>
          <p className="text-muted-foreground">
            Configure platform-wide settings and operational parameters
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {environments.map(env => (
                <SelectItem key={env} value={env}>
                  {env.charAt(0).toUpperCase() + env.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          
          <Button variant="outline" size="sm">
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
        </div>
      </div>

      {/* Settings Interface */}
      <div className="grid grid-cols-12 gap-6">
        {/* Category Sidebar */}
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${
                      selectedCategory === category ? 'bg-muted font-medium' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{categoryLabels[category] || category}</span>
                      <Badge variant="secondary" className="text-xs">
                        {settings[category]?.length || 0}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="col-span-9">
          {selectedCategory && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {categoryLabels[selectedCategory] || selectedCategory}
                </h3>
                <Badge variant="outline">
                  {currentSettings.length} settings
                </Badge>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                {currentSettings.map(setting => renderSettingInput(setting))}
              </div>
              
              {currentSettings.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No settings found in this category
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}