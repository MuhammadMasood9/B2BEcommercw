import React, { useState, useEffect } from "react";
import { 
  Palette, 
  Monitor, 
  Sun, 
  Moon, 
  Smartphone, 
  Tablet, 
  Laptop, 
  Eye,
  Type,
  Layout,
  Zap,
  RotateCcw,
  Download,
  Upload,
  Check
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ThemeSettings {
  // Color scheme
  colorScheme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  accentColor: string;
  
  // Typography
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: 'system' | 'inter' | 'roboto' | 'poppins';
  
  // Layout
  sidebarWidth: number;
  compactMode: boolean;
  borderRadius: number;
  
  // Accessibility
  highContrast: boolean;
  reducedMotion: boolean;
  focusVisible: boolean;
  
  // Performance
  animations: boolean;
  transitions: boolean;
  
  // Customization
  customCSS: string;
}

const defaultTheme: ThemeSettings = {
  colorScheme: 'auto',
  primaryColor: '#3b82f6',
  accentColor: '#10b981',
  fontSize: 'medium',
  fontFamily: 'system',
  sidebarWidth: 256,
  compactMode: false,
  borderRadius: 8,
  highContrast: false,
  reducedMotion: false,
  focusVisible: true,
  animations: true,
  transitions: true,
  customCSS: ''
};

const colorPresets = [
  { name: 'Blue', primary: '#3b82f6', accent: '#10b981' },
  { name: 'Purple', primary: '#8b5cf6', accent: '#f59e0b' },
  { name: 'Green', primary: '#10b981', accent: '#3b82f6' },
  { name: 'Red', primary: '#ef4444', accent: '#8b5cf6' },
  { name: 'Orange', primary: '#f97316', accent: '#06b6d4' },
  { name: 'Pink', primary: '#ec4899', accent: '#84cc16' }
];

const fontOptions = [
  { value: 'system', label: 'System Default' },
  { value: 'inter', label: 'Inter' },
  { value: 'roboto', label: 'Roboto' },
  { value: 'poppins', label: 'Poppins' }
];

interface AdminThemeCustomizerProps {
  className?: string;
}

export function AdminThemeCustomizer({ className }: AdminThemeCustomizerProps) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);
  const [previewMode, setPreviewMode] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('admin-theme-settings');
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        setTheme({ ...defaultTheme, ...parsed });
      } catch (error) {
        console.error('Failed to parse saved theme:', error);
      }
    }
  }, []);

  // Apply theme changes to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Color scheme
    if (theme.colorScheme === 'dark') {
      root.classList.add('dark');
    } else if (theme.colorScheme === 'light') {
      root.classList.remove('dark');
    } else {
      // Auto mode - use system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (mediaQuery.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    // CSS custom properties
    root.style.setProperty('--primary-color', theme.primaryColor);
    root.style.setProperty('--accent-color', theme.accentColor);
    root.style.setProperty('--sidebar-width', `${theme.sidebarWidth}px`);
    root.style.setProperty('--border-radius', `${theme.borderRadius}px`);
    
    // Font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[theme.fontSize]);
    
    // Font family
    const fontFamilyMap = {
      system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      inter: '"Inter", sans-serif',
      roboto: '"Roboto", sans-serif',
      poppins: '"Poppins", sans-serif'
    };
    root.style.setProperty('--font-family', fontFamilyMap[theme.fontFamily]);
    
    // Accessibility
    if (theme.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    if (theme.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    
    if (!theme.animations) {
      root.classList.add('no-animations');
    } else {
      root.classList.remove('no-animations');
    }

    // Custom CSS
    let customStyleElement = document.getElementById('admin-custom-styles');
    if (theme.customCSS) {
      if (!customStyleElement) {
        customStyleElement = document.createElement('style');
        customStyleElement.id = 'admin-custom-styles';
        document.head.appendChild(customStyleElement);
      }
      customStyleElement.textContent = theme.customCSS;
    } else if (customStyleElement) {
      customStyleElement.remove();
    }
  }, [theme]);

  const saveTheme = () => {
    localStorage.setItem('admin-theme-settings', JSON.stringify(theme));
    toast.success('Theme settings saved');
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
    localStorage.removeItem('admin-theme-settings');
    toast.success('Theme reset to defaults');
  };

  const exportTheme = () => {
    const dataStr = JSON.stringify(theme, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'admin-theme.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Theme exported');
  };

  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setTheme({ ...defaultTheme, ...imported });
        toast.success('Theme imported successfully');
      } catch (error) {
        toast.error('Failed to import theme');
      }
    };
    reader.readAsText(file);
  };

  const updateTheme = (updates: Partial<ThemeSettings>) => {
    setTheme(prev => ({ ...prev, ...updates }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("gap-2", className)}>
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">Customize</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Admin Interface Customization
            {previewMode && (
              <Badge variant="secondary">Preview Mode</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="appearance" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-6">
            {/* Color Scheme */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Color Scheme
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  {[
                    { value: 'light', icon: Sun, label: 'Light' },
                    { value: 'dark', icon: Moon, label: 'Dark' },
                    { value: 'auto', icon: Monitor, label: 'Auto' }
                  ].map(({ value, icon: Icon, label }) => (
                    <Button
                      key={value}
                      variant={theme.colorScheme === value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateTheme({ colorScheme: value as any })}
                      className="flex-1"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Color Presets */}
            <Card>
              <CardHeader>
                <CardTitle>Color Presets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {colorPresets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      className="h-16 flex flex-col gap-1"
                      onClick={() => updateTheme({
                        primaryColor: preset.primary,
                        accentColor: preset.accent
                      })}
                    >
                      <div className="flex gap-1">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: preset.accent }}
                        />
                      </div>
                      <span className="text-xs">{preset.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Typography */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Typography
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <Select
                      value={theme.fontFamily}
                      onValueChange={(value) => updateTheme({ fontFamily: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Font Size</Label>
                    <Select
                      value={theme.fontSize}
                      onValueChange={(value) => updateTheme({ fontSize: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="layout" className="space-y-6">
            {/* Layout Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Layout Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Sidebar Width: {theme.sidebarWidth}px</Label>
                  <Slider
                    value={[theme.sidebarWidth]}
                    onValueChange={([value]) => updateTheme({ sidebarWidth: value })}
                    min={200}
                    max={400}
                    step={16}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Border Radius: {theme.borderRadius}px</Label>
                  <Slider
                    value={[theme.borderRadius]}
                    onValueChange={([value]) => updateTheme({ borderRadius: value })}
                    min={0}
                    max={16}
                    step={2}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="compact-mode">Compact Mode</Label>
                  <Switch
                    id="compact-mode"
                    checked={theme.compactMode}
                    onCheckedChange={(checked) => updateTheme({ compactMode: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accessibility" className="space-y-6">
            {/* Accessibility Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Accessibility Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="high-contrast">High Contrast</Label>
                    <p className="text-sm text-muted-foreground">
                      Increase contrast for better visibility
                    </p>
                  </div>
                  <Switch
                    id="high-contrast"
                    checked={theme.highContrast}
                    onCheckedChange={(checked) => updateTheme({ highContrast: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="reduced-motion">Reduced Motion</Label>
                    <p className="text-sm text-muted-foreground">
                      Minimize animations and transitions
                    </p>
                  </div>
                  <Switch
                    id="reduced-motion"
                    checked={theme.reducedMotion}
                    onCheckedChange={(checked) => updateTheme({ reducedMotion: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="focus-visible">Enhanced Focus Indicators</Label>
                    <p className="text-sm text-muted-foreground">
                      Show clear focus outlines for keyboard navigation
                    </p>
                  </div>
                  <Switch
                    id="focus-visible"
                    checked={theme.focusVisible}
                    onCheckedChange={(checked) => updateTheme({ focusVisible: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Performance Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="animations">Animations</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable smooth animations
                    </p>
                  </div>
                  <Switch
                    id="animations"
                    checked={theme.animations}
                    onCheckedChange={(checked) => updateTheme({ animations: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="transitions">Transitions</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable smooth transitions
                    </p>
                  </div>
                  <Switch
                    id="transitions"
                    checked={theme.transitions}
                    onCheckedChange={(checked) => updateTheme({ transitions: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            {/* Import/Export */}
            <Card>
              <CardHeader>
                <CardTitle>Theme Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={exportTheme} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export Theme
                  </Button>
                  
                  <div className="flex-1">
                    <input
                      type="file"
                      accept=".json"
                      onChange={importTheme}
                      className="hidden"
                      id="import-theme"
                    />
                    <Button asChild variant="outline" className="w-full">
                      <label htmlFor="import-theme" className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Import Theme
                      </label>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom CSS */}
            <Card>
              <CardHeader>
                <CardTitle>Custom CSS</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={theme.customCSS}
                  onChange={(e) => updateTheme({ customCSS: e.target.value })}
                  placeholder="/* Add your custom CSS here */"
                  className="w-full h-32 p-3 text-sm font-mono border rounded-md resize-none"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={resetTheme}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => { saveTheme(); setOpen(false); }}>
              <Check className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AdminThemeCustomizer;