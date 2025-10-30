import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Store, 
  Upload, 
  Settings, 
  Eye, 
  BarChart3, 
  Package,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StoreProfile {
  id: string;
  storeName: string;
  storeSlug: string;
  storeDescription?: string;
  businessType: string;
  contactPerson: string;
  phone: string;
  whatsapp?: string;
  wechat?: string;
  website?: string;
  yearEstablished?: number;
  employees?: string;
  annualRevenue?: string;
  storeLogo?: string;
  storeBanner?: string;
  storeViews: number;
  followers: number;
  rating: number;
  totalReviews: number;
  responseRate: number;
}

export default function StoreManagement() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  // Mock data - in real implementation, this would come from API
  const [storeProfile, setStoreProfile] = useState<StoreProfile>({
    id: "1",
    storeName: "TechWorld Electronics",
    storeSlug: "techworld-electronics",
    storeDescription: "Leading manufacturer of high-quality electronics with 15+ years of experience in global markets.",
    businessType: "manufacturer",
    contactPerson: "John Smith",
    phone: "+1-555-0123",
    whatsapp: "+1-555-0123",
    wechat: "",
    website: "https://techworld.com",
    yearEstablished: 2008,
    employees: "51-100",
    annualRevenue: "1-5m",
    storeLogo: undefined,
    storeBanner: undefined,
    storeViews: 2847,
    followers: 156,
    rating: 4.8,
    totalReviews: 24,
    responseRate: 95
  });

  const handleInputChange = (field: keyof StoreProfile, value: any) => {
    setStoreProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement API call to save store profile
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      
      toast({
        title: "Profile Updated",
        description: "Your store profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update store profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (type: 'logo' | 'banner', file: File) => {
    setIsLoading(true);
    try {
      // TODO: Implement file upload API call
      const formData = new FormData();
      formData.append(type, file);
      
      // Mock upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful upload
      const mockUrl = `/uploads/store-assets/${type}-${Date.now()}.jpg`;
      
      if (type === 'logo') {
        handleInputChange('storeLogo', mockUrl);
      } else {
        handleInputChange('storeBanner', mockUrl);
      }
      
      toast({
        title: "Upload Successful",
        description: `Store ${type} has been uploaded successfully.`,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: `Failed to upload ${type}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload('logo', file);
    }
  };

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload('banner', file);
    }
  };

  const copyStoreUrl = () => {
    const storeUrl = `https://marketplace.com/stores/${storeProfile.storeSlug}`;
    navigator.clipboard.writeText(storeUrl);
    toast({
      title: "Copied!",
      description: "Store URL copied to clipboard.",
    });
  };

  const previewStore = () => {
    // TODO: Open store preview in new tab
    const storeUrl = `https://marketplace.com/stores/${storeProfile.storeSlug}`;
    window.open(storeUrl, '_blank');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Store Profile Section */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              <CardTitle>Store Profile</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Store Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input 
                  id="storeName" 
                  value={storeProfile.storeName}
                  onChange={(e) => handleInputChange('storeName', e.target.value)}
                  placeholder="Enter your store name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <Select 
                  value={storeProfile.businessType} 
                  onValueChange={(value) => handleInputChange('businessType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manufacturer">Manufacturer</SelectItem>
                    <SelectItem value="trading_company">Trading Company</SelectItem>
                    <SelectItem value="wholesaler">Wholesaler</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeDescription">Store Description</Label>
              <Textarea 
                id="storeDescription"
                value={storeProfile.storeDescription || ''}
                onChange={(e) => handleInputChange('storeDescription', e.target.value)}
                placeholder="Describe your business and what makes you unique..."
                className="min-h-[100px]"
              />
            </div>

            {/* Contact Information */}
            <Separator />
            <div>
              <h3 className="font-semibold mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input 
                    id="contactPerson" 
                    value={storeProfile.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={storeProfile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp (Optional)</Label>
                  <Input 
                    id="whatsapp" 
                    value={storeProfile.whatsapp || ''}
                    onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                    placeholder="+1-555-0123" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wechat">WeChat (Optional)</Label>
                  <Input 
                    id="wechat" 
                    value={storeProfile.wechat || ''}
                    onChange={(e) => handleInputChange('wechat', e.target.value)}
                    placeholder="WeChat ID" 
                  />
                </div>
              </div>
            </div>

            {/* Business Details */}
            <Separator />
            <div>
              <h3 className="font-semibold mb-4">Business Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yearEstablished">Year Established</Label>
                  <Input 
                    id="yearEstablished" 
                    type="number" 
                    value={storeProfile.yearEstablished || ''}
                    onChange={(e) => handleInputChange('yearEstablished', parseInt(e.target.value) || undefined)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employees">Number of Employees</Label>
                  <Select 
                    value={storeProfile.employees || ''} 
                    onValueChange={(value) => handleInputChange('employees', value)}
                  >
                    <SelectTrigger>
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
                <div className="space-y-2">
                  <Label htmlFor="website">Website (Optional)</Label>
                  <Input 
                    id="website" 
                    value={storeProfile.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://yourwebsite.com" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annualRevenue">Annual Revenue</Label>
                  <Select 
                    value={storeProfile.annualRevenue || ''} 
                    onValueChange={(value) => handleInputChange('annualRevenue', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="below-1m">Below $1M</SelectItem>
                      <SelectItem value="1-5m">$1M - $5M</SelectItem>
                      <SelectItem value="5-10m">$5M - $10M</SelectItem>
                      <SelectItem value="10m+">$10M+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                className="flex-1" 
                onClick={handleSaveProfile}
                disabled={isSaving}
                data-testid="button-save-store-profile"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Settings className="w-4 h-4 mr-2" />
                )}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                variant="outline" 
                onClick={previewStore}
                data-testid="button-preview-store"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Store
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Store Assets & Analytics */}
      <div className="space-y-6">
        {/* Store Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Store Assets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Store Logo */}
            <div className="space-y-3">
              <Label>Store Logo</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                {storeProfile.storeLogo ? (
                  <div className="space-y-3">
                    <img 
                      src={storeProfile.storeLogo} 
                      alt="Store Logo" 
                      className="w-16 h-16 object-cover rounded-lg mx-auto"
                    />
                    <div className="flex items-center justify-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Logo uploaded</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-muted rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <Store className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <p className="text-sm text-muted-foreground mb-2">
                  {storeProfile.storeLogo ? 'Change store logo' : 'Upload your store logo'}
                </p>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isLoading}
                  data-testid="button-upload-logo"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Choose File
                </Button>
              </div>
            </div>

            {/* Store Banner */}
            <div className="space-y-3">
              <Label>Store Banner</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                {storeProfile.storeBanner ? (
                  <div className="space-y-3">
                    <img 
                      src={storeProfile.storeBanner} 
                      alt="Store Banner" 
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <div className="flex items-center justify-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Banner uploaded</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-20 bg-muted rounded-lg mb-3 flex items-center justify-center">
                    <Package className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <p className="text-sm text-muted-foreground mb-2">
                  {storeProfile.storeBanner ? 'Change store banner' : 'Upload store banner (1200x300px)'}
                </p>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={isLoading}
                  data-testid="button-upload-banner"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Choose File
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Analytics Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Store Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Store Views</span>
                <span className="font-semibold">{storeProfile.storeViews.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Followers</span>
                <span className="font-semibold">{storeProfile.followers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Store Rating</span>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{storeProfile.rating}</span>
                  <span className="text-sm text-muted-foreground">({storeProfile.totalReviews} reviews)</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Response Rate</span>
                <span className="font-semibold text-green-600">{storeProfile.responseRate}%</span>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>Store URL:</span>
              </div>
              <div className="p-2 bg-muted rounded text-sm font-mono break-all">
                https://marketplace.com/stores/{storeProfile.storeSlug}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full" 
                onClick={copyStoreUrl}
                data-testid="button-copy-store-url"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Store URL
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}