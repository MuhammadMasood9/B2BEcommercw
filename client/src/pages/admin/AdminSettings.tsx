import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Save, 
  Globe, 
  Mail, 
  Shield, 
  Database, 
  Bell, 
  Palette,
  CreditCard,
  FileText,
  Users,
  Package
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SettingsData {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  adminEmail: string;
  supportEmail: string;
  currency: string;
  timezone: string;
  language: string;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  allowGuestCheckout: boolean;
  enableReviews: boolean;
  enableWishlist: boolean;
  enableNotifications: boolean;
  maintenanceMode: boolean;
  debugMode: boolean;
  maxFileSize: number;
  allowedFileTypes: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  analyticsEnabled: boolean;
  seoEnabled: boolean;
  socialLoginEnabled: boolean;
  paymentMethods: string[];
  shippingMethods: string[];
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState<SettingsData>({
    siteName: "B2B Marketplace",
    siteDescription: "Leading B2B marketplace for global trade",
    siteUrl: "https://b2bmarketplace.com",
    adminEmail: "admin@b2bmarketplace.com",
    supportEmail: "support@b2bmarketplace.com",
    currency: "USD",
    timezone: "UTC",
    language: "en",
    allowRegistration: true,
    requireEmailVerification: true,
    allowGuestCheckout: false,
    enableReviews: true,
    enableWishlist: true,
    enableNotifications: true,
    maintenanceMode: false,
    debugMode: false,
    maxFileSize: 10,
    allowedFileTypes: "jpg,jpeg,png,gif,pdf,doc,docx",
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    analyticsEnabled: true,
    seoEnabled: true,
    socialLoginEnabled: false,
    paymentMethods: ["credit_card", "paypal", "bank_transfer"],
    shippingMethods: ["standard", "express", "overnight"]
  });
  
  const { toast } = useToast();

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "users", label: "Users", icon: Users },
    { id: "products", label: "Products", icon: Package },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "advanced", label: "Advanced", icon: Database },
  ];

  const handleSave = () => {
    // In a real app, this would save to the backend
    toast({
      title: "Settings saved",
      description: "Your settings have been updated successfully.",
    });
  };

  const handleSettingChange = (key: keyof SettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="siteName">Site Name</Label>
            <Input
              id="siteName"
              value={settings.siteName}
              onChange={(e) => handleSettingChange("siteName", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="siteUrl">Site URL</Label>
            <Input
              id="siteUrl"
              value={settings.siteUrl}
              onChange={(e) => handleSettingChange("siteUrl", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="currency">Default Currency</Label>
            <Select value={settings.currency} onValueChange={(value) => handleSettingChange("currency", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="siteDescription">Site Description</Label>
            <Textarea
              id="siteDescription"
              value={settings.siteDescription}
              onChange={(e) => handleSettingChange("siteDescription", e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={settings.timezone} onValueChange={(value) => handleSettingChange("timezone", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="Europe/London">London</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                <SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Contact Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="adminEmail">Admin Email</Label>
            <Input
              id="adminEmail"
              type="email"
              value={settings.adminEmail}
              onChange={(e) => handleSettingChange("adminEmail", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              type="email"
              value={settings.supportEmail}
              onChange={(e) => handleSettingChange("supportEmail", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="allowRegistration">Allow User Registration</Label>
            <p className="text-sm text-muted-foreground">Allow new users to create accounts</p>
          </div>
          <Switch
            id="allowRegistration"
            checked={settings.allowRegistration}
            onCheckedChange={(checked) => handleSettingChange("allowRegistration", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="requireEmailVerification">Require Email Verification</Label>
            <p className="text-sm text-muted-foreground">Users must verify their email before accessing the platform</p>
          </div>
          <Switch
            id="requireEmailVerification"
            checked={settings.requireEmailVerification}
            onCheckedChange={(checked) => handleSettingChange("requireEmailVerification", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="allowGuestCheckout">Allow Guest Checkout</Label>
            <p className="text-sm text-muted-foreground">Allow purchases without creating an account</p>
          </div>
          <Switch
            id="allowGuestCheckout"
            checked={settings.allowGuestCheckout}
            onCheckedChange={(checked) => handleSettingChange("allowGuestCheckout", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="enableReviews">Enable Product Reviews</Label>
            <p className="text-sm text-muted-foreground">Allow users to review products and suppliers</p>
          </div>
          <Switch
            id="enableReviews"
            checked={settings.enableReviews}
            onCheckedChange={(checked) => handleSettingChange("enableReviews", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="enableWishlist">Enable Wishlist</Label>
            <p className="text-sm text-muted-foreground">Allow users to save favorite products</p>
          </div>
          <Switch
            id="enableWishlist"
            checked={settings.enableWishlist}
            onCheckedChange={(checked) => handleSettingChange("enableWishlist", checked)}
          />
        </div>
      </div>
    </div>
  );

  const renderProductSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
          <Input
            id="maxFileSize"
            type="number"
            value={settings.maxFileSize}
            onChange={(e) => handleSettingChange("maxFileSize", parseInt(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
          <Input
            id="allowedFileTypes"
            value={settings.allowedFileTypes}
            onChange={(e) => handleSettingChange("allowedFileTypes", e.target.value)}
            placeholder="jpg,jpeg,png,gif,pdf"
          />
          <p className="text-sm text-muted-foreground">Comma-separated file extensions</p>
        </div>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Payment Methods</h3>
        <div className="grid grid-cols-2 gap-4">
          {["credit_card", "paypal", "bank_transfer", "crypto", "alipay", "wechat_pay"].map((method) => (
            <div key={method} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="capitalize">{method.replace('_', ' ')}</Label>
              </div>
              <Switch
                checked={settings.paymentMethods.includes(method)}
                onCheckedChange={(checked) => {
                  const methods = checked 
                    ? [...settings.paymentMethods, method]
                    : settings.paymentMethods.filter(m => m !== method);
                  handleSettingChange("paymentMethods", methods);
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="emailNotifications">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">Send notifications via email</p>
          </div>
          <Switch
            id="emailNotifications"
            checked={settings.emailNotifications}
            onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="smsNotifications">SMS Notifications</Label>
            <p className="text-sm text-muted-foreground">Send notifications via SMS</p>
          </div>
          <Switch
            id="smsNotifications"
            checked={settings.smsNotifications}
            onCheckedChange={(checked) => handleSettingChange("smsNotifications", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="pushNotifications">Push Notifications</Label>
            <p className="text-sm text-muted-foreground">Send push notifications to mobile apps</p>
          </div>
          <Switch
            id="pushNotifications"
            checked={settings.pushNotifications}
            onCheckedChange={(checked) => handleSettingChange("pushNotifications", checked)}
          />
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="socialLoginEnabled">Social Login</Label>
            <p className="text-sm text-muted-foreground">Allow login with Google, Facebook, etc.</p>
          </div>
          <Switch
            id="socialLoginEnabled"
            checked={settings.socialLoginEnabled}
            onCheckedChange={(checked) => handleSettingChange("socialLoginEnabled", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
            <p className="text-sm text-muted-foreground">Put the site in maintenance mode</p>
          </div>
          <Switch
            id="maintenanceMode"
            checked={settings.maintenanceMode}
            onCheckedChange={(checked) => handleSettingChange("maintenanceMode", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="debugMode">Debug Mode</Label>
            <p className="text-sm text-muted-foreground">Enable debug logging (development only)</p>
          </div>
          <Switch
            id="debugMode"
            checked={settings.debugMode}
            onCheckedChange={(checked) => handleSettingChange("debugMode", checked)}
          />
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="language">Default Language</Label>
          <Select value={settings.language} onValueChange={(value) => handleSettingChange("language", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="zh">Chinese</SelectItem>
              <SelectItem value="ja">Japanese</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderAdvancedSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="analyticsEnabled">Analytics</Label>
            <p className="text-sm text-muted-foreground">Enable analytics tracking</p>
          </div>
          <Switch
            id="analyticsEnabled"
            checked={settings.analyticsEnabled}
            onCheckedChange={(checked) => handleSettingChange("analyticsEnabled", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="seoEnabled">SEO Optimization</Label>
            <p className="text-sm text-muted-foreground">Enable SEO features</p>
          </div>
          <Switch
            id="seoEnabled"
            checked={settings.seoEnabled}
            onCheckedChange={(checked) => handleSettingChange("seoEnabled", checked)}
          />
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "general": return renderGeneralSettings();
      case "users": return renderUserSettings();
      case "products": return renderProductSettings();
      case "payments": return renderPaymentSettings();
      case "notifications": return renderNotificationSettings();
      case "security": return renderSecuritySettings();
      case "appearance": return renderAppearanceSettings();
      case "advanced": return renderAdvancedSettings();
      default: return renderGeneralSettings();
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your B2B marketplace configuration</p>
        </div>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        activeTab === tab.id ? "bg-primary/5 text-primary border-r-2 border-primary" : ""
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => {
                  const tab = tabs.find(t => t.id === activeTab);
                  const Icon = tab?.icon || Settings;
                  return (
                    <>
                      <Icon className="w-5 h-5" />
                      {tab?.label} Settings
                    </>
                  );
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderTabContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
