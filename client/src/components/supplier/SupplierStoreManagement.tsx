import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Store, 
  Upload, 
  Image, 
  Settings, 
  BarChart3, 
  Shield, 
  FileText, 
  Clock, 
  Star, 
  TrendingUp, 
  Eye, 
  MessageSquare,
  CheckCircle,
  AlertCircle,
  XCircle,
  Camera,
  Palette,
  Globe,
  Phone,
  Mail,
  MapPin,
  Building,
  Calendar,
  DollarSign,
  Package,
  Users,
  Award,
  Verified,
  Activity
} from "lucide-react";

interface SupplierProfile {
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  storeName: string;
  storeSlug: string;
  storeDescription?: string;
  storeLogo?: string;
  storeBanner?: string;
  contactPerson: string;
  position?: string;
  phone: string;
  whatsapp?: string;
  address: string;
  city: string;
  country: string;
  website?: string;
  yearEstablished?: number;
  employeesCount?: string;
  annualRevenue?: string;
  mainProducts: string[];
  exportMarkets: string[];
  verificationLevel: string;
  isVerified: boolean;
  verifiedAt?: string;
  rating: number;
  totalReviews: number;
  responseRate: number;
  responseTime?: string;
  totalSales: number;
  totalOrders: number;
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  storePolicies?: any;
  operatingHours?: any;
  createdAt: string;
  updatedAt: string;
}

interface StoreData {
  storeName: string;
  storeSlug: string;
  storeDescription?: string;
  storeLogo?: string;
  storeBanner?: string;
  storePolicies?: any;
  operatingHours?: any;
  isActive: boolean;
  isFeatured: boolean;
}

interface VerificationData {
  verificationLevel: string;
  isVerified: boolean;
  verifiedAt?: string;
  verificationDocuments?: any;
  status: string;
}

interface MetricsData {
  rating: number;
  totalReviews: number;
  responseRate: number;
  responseTime?: string;
  totalSales: number;
  totalOrders: number;
  verificationLevel: string;
  isVerified: boolean;
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export default function SupplierStoreManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [verificationFiles, setVerificationFiles] = useState<FileList | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingVerification, setIsUploadingVerification] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    businessName: '',
    businessType: '',
    storeName: '',
    storeDescription: '',
    contactPerson: '',
    position: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: '',
    country: '',
    website: '',
    yearEstablished: '',
    employeesCount: '',
    annualRevenue: '',
    mainProducts: [] as string[],
    exportMarkets: [] as string[]
  });

  const [storeForm, setStoreForm] = useState({
    storeName: '',
    storeDescription: '',
    storePolicies: {
      shipping: '',
      returns: '',
      payment: '',
      warranty: ''
    },
    operatingHours: {
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: '',
      timezone: ''
    }
  });

  // Fetch supplier profile
  const { data: profile, isLoading: profileLoading } = useQuery<SupplierProfile>({
    queryKey: ['/api/suppliers/profile'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/profile', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      return data.profile;
    },
    enabled: !!user && user.role === 'supplier',
  });

  // Fetch store data
  const { data: storeData, isLoading: storeLoading } = useQuery<StoreData>({
    queryKey: ['/api/suppliers/store'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/store', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch store data');
      const data = await response.json();
      return data.store;
    },
    enabled: !!user && user.role === 'supplier',
  });

  // Fetch verification status
  const { data: verificationData, isLoading: verificationLoading } = useQuery<VerificationData>({
    queryKey: ['/api/suppliers/verification/status'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/verification/status', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch verification status');
      const data = await response.json();
      return data.verification;
    },
    enabled: !!user && user.role === 'supplier',
  });

  // Fetch metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery<MetricsData>({
    queryKey: ['/api/suppliers/metrics'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/metrics', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      return data.metrics;
    },
    enabled: !!user && user.role === 'supplier',
  });

  // Update profile form when data loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        businessName: profile.businessName || '',
        businessType: profile.businessType || '',
        storeName: profile.storeName || '',
        storeDescription: profile.storeDescription || '',
        contactPerson: profile.contactPerson || '',
        position: profile.position || '',
        phone: profile.phone || '',
        whatsapp: profile.whatsapp || '',
        address: profile.address || '',
        city: profile.city || '',
        country: profile.country || '',
        website: profile.website || '',
        yearEstablished: profile.yearEstablished?.toString() || '',
        employeesCount: profile.employeesCount || '',
        annualRevenue: profile.annualRevenue || '',
        mainProducts: profile.mainProducts || [],
        exportMarkets: profile.exportMarkets || []
      });
    }
  }, [profile]);

  // Update store form when data loads
  useEffect(() => {
    if (storeData) {
      setStoreForm({
        storeName: storeData.storeName || '',
        storeDescription: storeData.storeDescription || '',
        storePolicies: storeData.storePolicies || {
          shipping: '',
          returns: '',
          payment: '',
          warranty: ''
        },
        operatingHours: storeData.operatingHours || {
          monday: '',
          tuesday: '',
          wednesday: '',
          thursday: '',
          friday: '',
          saturday: '',
          sunday: '',
          timezone: ''
        }
      });
    }
  }, [storeData]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const response = await fetch('/api/suppliers/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/profile'] });
      toast({ title: "Success", description: "Profile updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update store mutation
  const updateStoreMutation = useMutation({
    mutationFn: async (storeData: any) => {
      const response = await fetch('/api/suppliers/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(storeData),
      });
      if (!response.ok) throw new Error('Failed to update store');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/store'] });
      toast({ title: "Success", description: "Store updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Upload logo mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('files', file);
      
      const response = await fetch('/api/suppliers/store/logo', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload logo');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/store'] });
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/profile'] });
      toast({ title: "Success", description: "Logo uploaded successfully" });
      setLogoFile(null);
      setIsUploadingLogo(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setIsUploadingLogo(false);
    },
  });

  // Upload banner mutation
  const uploadBannerMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('files', file);
      
      const response = await fetch('/api/suppliers/store/banner', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload banner');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/store'] });
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/profile'] });
      toast({ title: "Success", description: "Banner uploaded successfully" });
      setBannerFile(null);
      setIsUploadingBanner(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setIsUploadingBanner(false);
    },
  });

  // Upload verification documents mutation
  const uploadVerificationMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch('/api/suppliers/verification/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload verification documents');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/verification/status'] });
      toast({ title: "Success", description: "Verification documents uploaded successfully" });
      setVerificationFiles(null);
      setIsUploadingVerification(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setIsUploadingVerification(false);
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = {
      ...profileForm,
      yearEstablished: profileForm.yearEstablished ? parseInt(profileForm.yearEstablished) : undefined
    };
    updateProfileMutation.mutate(formData);
  };

  const handleStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreMutation.mutate(storeForm);
  };

  const handleLogoUpload = () => {
    if (logoFile) {
      setIsUploadingLogo(true);
      uploadLogoMutation.mutate(logoFile);
    }
  };

  const handleBannerUpload = () => {
    if (bannerFile) {
      setIsUploadingBanner(true);
      uploadBannerMutation.mutate(bannerFile);
    }
  };

  const handleVerificationUpload = () => {
    if (verificationFiles && verificationFiles.length > 0) {
      setIsUploadingVerification(true);
      uploadVerificationMutation.mutate(verificationFiles);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationColor = (level: string) => {
    switch (level) {
      case 'none': return 'bg-gray-100 text-gray-800';
      case 'basic': return 'bg-primary text-primary';
      case 'business': return 'bg-purple-100 text-purple-800';
      case 'premium': return 'bg-gold-100 text-gold-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || user.role !== 'supplier') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">Store Management</h2>
          <p className="text-muted-foreground">Manage your store profile, branding, and settings</p>
        </div>
        <div className="flex gap-2">
          {storeData?.storeLogo && (
            <img 
              src={storeData.storeLogo} 
              alt="Store Logo" 
              className="w-12 h-12 rounded-lg object-cover border"
            />
          )}
          <Badge className={getStatusColor(profile?.status || 'pending')}>
            {profile?.status || 'pending'}
          </Badge>
        </div>
      </div>

      {/* Store Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Store Status</p>
                <p className="font-semibold">{profile?.isActive ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verification</p>
                <p className="font-semibold capitalize">{verificationData?.verificationLevel || 'None'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="font-semibold">{metricsData?.rating || 0}/5</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Response Rate</p>
                <p className="font-semibold">{metricsData?.responseRate || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={profileForm.businessName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, businessName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessType">Business Type *</Label>
                    <Select 
                      value={profileForm.businessType} 
                      onValueChange={(value) => setProfileForm(prev => ({ ...prev, businessType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manufacturer">Manufacturer</SelectItem>
                        <SelectItem value="trading_company">Trading Company</SelectItem>
                        <SelectItem value="wholesaler">Wholesaler</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="storeName">Store Name *</Label>
                    <Input
                      id="storeName"
                      value={profileForm.storeName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, storeName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPerson">Contact Person *</Label>
                    <Input
                      id="contactPerson"
                      value={profileForm.contactPerson}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="storeDescription">Store Description</Label>
                  <Textarea
                    id="storeDescription"
                    value={profileForm.storeDescription}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, storeDescription: e.target.value }))}
                    placeholder="Describe your business and what makes it unique..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={profileForm.position}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="e.g., Sales Manager"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={profileForm.whatsapp}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={profileForm.website}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, city: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={profileForm.country}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, country: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="yearEstablished">Year Established</Label>
                    <Input
                      id="yearEstablished"
                      type="number"
                      min="1800"
                      max={new Date().getFullYear()}
                      value={profileForm.yearEstablished}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, yearEstablished: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                    required
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employeesCount">Number of Employees</Label>
                    <Select 
                      value={profileForm.employeesCount} 
                      onValueChange={(value) => setProfileForm(prev => ({ ...prev, employeesCount: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee count" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10</SelectItem>
                        <SelectItem value="11-50">11-50</SelectItem>
                        <SelectItem value="51-200">51-200</SelectItem>
                        <SelectItem value="201-500">201-500</SelectItem>
                        <SelectItem value="500+">500+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="annualRevenue">Annual Revenue</Label>
                    <Select 
                      value={profileForm.annualRevenue} 
                      onValueChange={(value) => setProfileForm(prev => ({ ...prev, annualRevenue: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select revenue range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Under $1M">Under $1M</SelectItem>
                        <SelectItem value="$1M - $5M">$1M - $5M</SelectItem>
                        <SelectItem value="$5M - $10M">$5M - $10M</SelectItem>
                        <SelectItem value="$10M - $50M">$10M - $50M</SelectItem>
                        <SelectItem value="Over $50M">Over $50M</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    className="min-w-32"
                  >
                    {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>   
     {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logo Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Store Logo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {storeData?.storeLogo && (
                  <div className="flex justify-center">
                    <img 
                      src={storeData.storeLogo} 
                      alt="Current Logo" 
                      className="w-32 h-32 rounded-lg object-cover border"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="logo">Upload New Logo</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Recommended: Square image, 200x200px minimum
                  </p>
                </div>
                <Button 
                  onClick={handleLogoUpload}
                  disabled={!logoFile || isUploadingLogo}
                  className="w-full"
                >
                  {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                </Button>
              </CardContent>
            </Card>

            {/* Banner Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Store Banner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {storeData?.storeBanner && (
                  <div className="flex justify-center">
                    <img 
                      src={storeData.storeBanner} 
                      alt="Current Banner" 
                      className="w-full h-24 rounded-lg object-cover border"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="banner">Upload New Banner</Label>
                  <Input
                    id="banner"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Recommended: 1200x300px, landscape orientation
                  </p>
                </div>
                <Button 
                  onClick={handleBannerUpload}
                  disabled={!bannerFile || isUploadingBanner}
                  className="w-full"
                >
                  {isUploadingBanner ? 'Uploading...' : 'Upload Banner'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Store Customization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Store Customization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStoreSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="storeNameCustom">Store Name</Label>
                  <Input
                    id="storeNameCustom"
                    value={storeForm.storeName}
                    onChange={(e) => setStoreForm(prev => ({ ...prev, storeName: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="storeDescriptionCustom">Store Description</Label>
                  <Textarea
                    id="storeDescriptionCustom"
                    value={storeForm.storeDescription}
                    onChange={(e) => setStoreForm(prev => ({ ...prev, storeDescription: e.target.value }))}
                    placeholder="Tell customers about your store..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateStoreMutation.isPending}
                    className="min-w-32"
                  >
                    {updateStoreMutation.isPending ? 'Updating...' : 'Update Store'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Store Policies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStoreSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="shippingPolicy">Shipping Policy</Label>
                    <Textarea
                      id="shippingPolicy"
                      value={storeForm.storePolicies.shipping}
                      onChange={(e) => setStoreForm(prev => ({
                        ...prev,
                        storePolicies: { ...prev.storePolicies, shipping: e.target.value }
                      }))}
                      placeholder="Describe your shipping terms, delivery times, and costs..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="returnsPolicy">Returns Policy</Label>
                    <Textarea
                      id="returnsPolicy"
                      value={storeForm.storePolicies.returns}
                      onChange={(e) => setStoreForm(prev => ({
                        ...prev,
                        storePolicies: { ...prev.storePolicies, returns: e.target.value }
                      }))}
                      placeholder="Explain your return and refund policy..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="paymentPolicy">Payment Policy</Label>
                    <Textarea
                      id="paymentPolicy"
                      value={storeForm.storePolicies.payment}
                      onChange={(e) => setStoreForm(prev => ({
                        ...prev,
                        storePolicies: { ...prev.storePolicies, payment: e.target.value }
                      }))}
                      placeholder="Detail your payment terms and accepted methods..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="warrantyPolicy">Warranty Policy</Label>
                    <Textarea
                      id="warrantyPolicy"
                      value={storeForm.storePolicies.warranty}
                      onChange={(e) => setStoreForm(prev => ({
                        ...prev,
                        storePolicies: { ...prev.storePolicies, warranty: e.target.value }
                      }))}
                      placeholder="Describe warranty coverage and terms..."
                      rows={4}
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Operating Hours
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                      <div key={day}>
                        <Label htmlFor={day} className="capitalize">{day}</Label>
                        <Input
                          id={day}
                          value={storeForm.operatingHours[day as keyof typeof storeForm.operatingHours]}
                          onChange={(e) => setStoreForm(prev => ({
                            ...prev,
                            operatingHours: { ...prev.operatingHours, [day]: e.target.value }
                          }))}
                          placeholder="9:00 AM - 5:00 PM"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      value={storeForm.operatingHours.timezone}
                      onChange={(e) => setStoreForm(prev => ({
                        ...prev,
                        operatingHours: { ...prev.operatingHours, timezone: e.target.value }
                      }))}
                      placeholder="e.g., UTC+8, EST, PST"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateStoreMutation.isPending}
                    className="min-w-32"
                  >
                    {updateStoreMutation.isPending ? 'Updating...' : 'Update Policies'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verification Tab */}
        <TabsContent value="verification" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Verification Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {verificationData?.isVerified ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                    )}
                    <div>
                      <p className="font-medium">
                        {verificationData?.isVerified ? 'Verified' : 'Pending Verification'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Current Level: {verificationData?.verificationLevel || 'None'}
                      </p>
                    </div>
                  </div>
                  <Badge className={getVerificationColor(verificationData?.verificationLevel || 'none')}>
                    {verificationData?.verificationLevel || 'None'}
                  </Badge>
                </div>

                {verificationData?.verifiedAt && (
                  <div className="text-sm text-muted-foreground">
                    Verified on: {new Date(verificationData.verifiedAt).toLocaleDateString()}
                  </div>
                )}

                <div className="space-y-2">
                  <h5 className="font-medium">Verification Benefits:</h5>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Increased buyer trust</li>
                    <li>• Higher search ranking</li>
                    <li>• Access to premium features</li>
                    <li>• Verification badge display</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Document Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="verificationDocs">Verification Documents</Label>
                  <Input
                    id="verificationDocs"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => setVerificationFiles(e.target.files)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload business license, certificates, ID documents
                  </p>
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium">Required Documents:</h5>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Business Registration Certificate</li>
                    <li>• Tax Registration Document</li>
                    <li>• Company ID/Passport</li>
                    <li>• Bank Account Verification</li>
                    <li>• Trade License (if applicable)</li>
                  </ul>
                </div>

                <Button 
                  onClick={handleVerificationUpload}
                  disabled={!verificationFiles || verificationFiles.length === 0 || isUploadingVerification}
                  className="w-full"
                >
                  {isUploadingVerification ? 'Uploading...' : 'Upload Documents'}
                </Button>

                {verificationData?.verificationDocuments?.documents && (
                  <div className="mt-4">
                    <h5 className="font-medium mb-2">Uploaded Documents:</h5>
                    <div className="space-y-2">
                      {verificationData.verificationDocuments.documents.map((doc: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4" />
                          <span>{doc.originalName}</span>
                          <Badge variant="outline" className="text-xs">
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <Star className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Store Rating</p>
                    <p className="text-2xl font-bold">{metricsData?.rating || 0}</p>
                    <p className="text-xs text-muted-foreground">
                      {metricsData?.totalReviews || 0} reviews
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Response Rate</p>
                    <p className="text-2xl font-bold">{metricsData?.responseRate || 0}%</p>
                    <p className="text-xs text-muted-foreground">
                      Avg: {metricsData?.responseTime || 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                    <p className="text-2xl font-bold">${(metricsData?.totalSales || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {metricsData?.totalOrders || 0} orders
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="text-lg font-bold">
                      {metricsData?.createdAt ? 
                        new Date(metricsData.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          year: 'numeric' 
                        }) : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-primary rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {metricsData?.isVerified ? 'Verified' : 'Unverified'}
                  </div>
                  <div className="text-sm text-primary mb-1">Verification Status</div>
                  <Badge className={getVerificationColor(metricsData?.verificationLevel || 'none')}>
                    {metricsData?.verificationLevel || 'None'}
                  </Badge>
                </div>

                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {metricsData?.isActive ? 'Active' : 'Inactive'}
                  </div>
                  <div className="text-sm text-green-600 mb-1">Store Status</div>
                  <Badge className={metricsData?.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {metricsData?.isActive ? 'Online' : 'Offline'}
                  </Badge>
                </div>

                <div className="text-center p-6 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {metricsData?.isFeatured ? 'Featured' : 'Standard'}
                  </div>
                  <div className="text-sm text-purple-600 mb-1">Store Type</div>
                  <Badge className={metricsData?.isFeatured ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}>
                    {metricsData?.isFeatured ? 'Premium' : 'Basic'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Store Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Store Health Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Profile Completeness</span>
                  <span className="text-sm text-muted-foreground">
                    {profile ? Math.round(
                      (Object.values(profile).filter(v => v !== null && v !== '' && v !== undefined).length / 
                       Object.keys(profile).length) * 100
                    ) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ 
                      width: `${profile ? Math.round(
                        (Object.values(profile).filter(v => v !== null && v !== '' && v !== undefined).length / 
                         Object.keys(profile).length) * 100
                      ) : 0}%` 
                    }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Verification Level</span>
                  <span className="text-sm text-muted-foreground">
                    {verificationData?.verificationLevel === 'premium' ? '100%' :
                     verificationData?.verificationLevel === 'business' ? '75%' :
                     verificationData?.verificationLevel === 'basic' ? '50%' : '0%'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: verificationData?.verificationLevel === 'premium' ? '100%' :
                             verificationData?.verificationLevel === 'business' ? '75%' :
                             verificationData?.verificationLevel === 'basic' ? '50%' : '0%'
                    }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Response Rate</span>
                  <span className="text-sm text-muted-foreground">{metricsData?.responseRate || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${metricsData?.responseRate || 0}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}