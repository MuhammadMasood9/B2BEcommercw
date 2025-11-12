import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Store, 
  Upload, 
  Save, 
  Building, 
  MapPin, 
  Phone, 
  Globe,
  Image as ImageIcon,
  FileText,
  Clock,
  DollarSign,
  Truck,
  Shield,
  ExternalLink,
  Plus,
  Trash2,
  CreditCard,
  Package
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
  storePolicies?: {
    shipping?: string;
    returns?: string;
    payment?: string;
    warranty?: string;
    shippingOptions?: Array<{
      id: string;
      method: string;
      carrier: string;
      estimatedDays: string;
      cost: string;
      freeShippingThreshold: string;
      enabled: boolean;
    }>;
    paymentTerms?: {
      acceptedMethods: string[];
      creditTerms: string;
      advancePayment: string;
      letterOfCredit: boolean;
      bankTransfer: boolean;
      paypal: boolean;
      creditCard: boolean;
      other: string;
    };
  };
  operatingHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
    timezone?: string;
  };
  status: string;
  isActive: boolean;
}

export default function SupplierStore() {
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

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
  });

  const [policiesForm, setPoliciesForm] = useState({
    shipping: '',
    returns: '',
    payment: '',
    warranty: '',
  });

  const [hoursForm, setHoursForm] = useState({
    monday: '',
    tuesday: '',
    wednesday: '',
    thursday: '',
    friday: '',
    saturday: '',
    sunday: '',
    timezone: 'UTC',
  });

  // Shipping options state
  const [shippingOptions, setShippingOptions] = useState<Array<{
    id: string;
    method: string;
    carrier: string;
    estimatedDays: string;
    cost: string;
    freeShippingThreshold: string;
    enabled: boolean;
  }>>([]);

  // Payment terms state
  const [paymentTerms, setPaymentTerms] = useState<{
    acceptedMethods: string[];
    creditTerms: string;
    advancePayment: string;
    letterOfCredit: boolean;
    bankTransfer: boolean;
    paypal: boolean;
    creditCard: boolean;
    other: string;
  }>({
    acceptedMethods: [],
    creditTerms: '',
    advancePayment: '',
    letterOfCredit: false,
    bankTransfer: false,
    paypal: false,
    creditCard: false,
    other: '',
  });

  // Fetch supplier profile
  const { data: profile, isLoading: profileLoading } = useQuery<{ profile: SupplierProfile }>({
    queryKey: ['/api/suppliers/profile'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/profile', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile?.profile) {
      const p = profile.profile;
      setProfileForm({
        businessName: p.businessName || '',
        businessType: p.businessType || '',
        storeName: p.storeName || '',
        storeDescription: p.storeDescription || '',
        contactPerson: p.contactPerson || '',
        position: p.position || '',
        phone: p.phone || '',
        whatsapp: p.whatsapp || '',
        address: p.address || '',
        city: p.city || '',
        country: p.country || '',
        website: p.website || '',
        yearEstablished: p.yearEstablished?.toString() || '',
        employeesCount: p.employeesCount || '',
        annualRevenue: p.annualRevenue || '',
      });

      if (p.storePolicies) {
        setPoliciesForm({
          shipping: p.storePolicies.shipping || '',
          returns: p.storePolicies.returns || '',
          payment: p.storePolicies.payment || '',
          warranty: p.storePolicies.warranty || '',
        });
      }

      if (p.operatingHours) {
        setHoursForm({
          monday: p.operatingHours.monday || '',
          tuesday: p.operatingHours.tuesday || '',
          wednesday: p.operatingHours.wednesday || '',
          thursday: p.operatingHours.thursday || '',
          friday: p.operatingHours.friday || '',
          saturday: p.operatingHours.saturday || '',
          sunday: p.operatingHours.sunday || '',
          timezone: p.operatingHours.timezone || 'UTC',
        });
      }

      // Load shipping options
      if (p.storePolicies?.shippingOptions) {
        setShippingOptions(p.storePolicies.shippingOptions);
      }

      // Load payment terms
      if (p.storePolicies?.paymentTerms) {
        setPaymentTerms(p.storePolicies.paymentTerms);
      }
    }
  }, [profile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/suppliers/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/profile'] });
      toast({ title: "Success", description: "Store profile updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update store mutation (for policies and hours)
  const updateStoreMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/suppliers/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update store');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/profile'] });
      toast({ title: "Success", description: "Store settings updated successfully" });
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
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/profile'] });
      toast({ title: "Success", description: "Logo uploaded successfully" });
      setLogoFile(null);
      setLogoPreview(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/profile'] });
      toast({ title: "Success", description: "Banner uploaded successfully" });
      setBannerFile(null);
      setBannerPreview(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle banner file selection
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSave = () => {
    const data = {
      ...profileForm,
      yearEstablished: profileForm.yearEstablished ? parseInt(profileForm.yearEstablished) : undefined,
    };
    updateProfileMutation.mutate(data);
  };

  const handlePoliciesSave = () => {
    updateStoreMutation.mutate({
      storePolicies: {
        ...policiesForm,
        shippingOptions,
        paymentTerms,
      },
    });
  };

  const addShippingOption = () => {
    setShippingOptions([
      ...shippingOptions,
      {
        id: Date.now().toString(),
        method: '',
        carrier: '',
        estimatedDays: '',
        cost: '',
        freeShippingThreshold: '',
        enabled: true,
      },
    ]);
  };

  const removeShippingOption = (id: string) => {
    setShippingOptions(shippingOptions.filter(option => option.id !== id));
  };

  const updateShippingOption = (id: string, field: string, value: any) => {
    setShippingOptions(shippingOptions.map(option =>
      option.id === id ? { ...option, [field]: value } : option
    ));
  };

  const handlePaymentMethodToggle = (method: string, checked: boolean) => {
    if (checked) {
      setPaymentTerms(prev => ({
        ...prev,
        acceptedMethods: [...prev.acceptedMethods, method],
      }));
    } else {
      setPaymentTerms(prev => ({
        ...prev,
        acceptedMethods: prev.acceptedMethods.filter(m => m !== method),
      }));
    }
  };

  const handleHoursSave = () => {
    updateStoreMutation.mutate({
      operatingHours: hoursForm,
    });
  };

  const handleLogoUpload = () => {
    if (logoFile) {
      uploadLogoMutation.mutate(logoFile);
    }
  };

  const handleBannerUpload = () => {
    if (bannerFile) {
      uploadBannerMutation.mutate(bannerFile);
    }
  };

  const publicStoreUrl = profile?.profile?.storeSlug 
    ? `${window.location.origin}/suppliers/${profile.profile.storeSlug}`
    : '';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Store Management</h1>
          <p className="text-muted-foreground">Manage your store profile, branding, and settings</p>
        </div>
        <div className="flex items-center gap-3">
          {profile?.profile?.status && (
            <Badge variant={profile.profile.status === 'approved' ? 'default' : 'secondary'}>
              {profile.profile.status}
            </Badge>
          )}
          {profile?.profile?.isActive && (
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Active
            </Badge>
          )}
        </div>
      </div>

      {/* Public Store URL */}
      {publicStoreUrl && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-brand-orange-600" />
                <div>
                  <p className="text-sm font-medium">Public Store URL</p>
                  <p className="text-sm text-muted-foreground">{publicStoreUrl}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(publicStoreUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Store
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {profileLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading store information...</div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="hours">Operating Hours</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Store Information
                </CardTitle>
                <CardDescription>
                  Basic information about your store and business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name *</Label>
                    <Input
                      id="storeName"
                      value={profileForm.storeName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, storeName: e.target.value }))}
                      placeholder="Enter store name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={profileForm.businessName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, businessName: e.target.value }))}
                      placeholder="Enter business name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeDescription">Store Description</Label>
                  <Textarea
                    id="storeDescription"
                    value={profileForm.storeDescription}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, storeDescription: e.target.value }))}
                    placeholder="Describe your store and products..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
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
                  <div className="space-y-2">
                    <Label htmlFor="yearEstablished">Year Established</Label>
                    <Input
                      id="yearEstablished"
                      type="number"
                      min="1800"
                      max={new Date().getFullYear()}
                      value={profileForm.yearEstablished}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, yearEstablished: e.target.value }))}
                      placeholder="Enter year"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person *</Label>
                    <Input
                      id="contactPerson"
                      value={profileForm.contactPerson}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                      placeholder="Enter contact person name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={profileForm.position}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="e.g., Sales Manager"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={profileForm.whatsapp}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                      placeholder="Enter WhatsApp number"
                    />
                  </div>
                  <div className="space-y-2">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter street address"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Enter city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={profileForm.country}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, country: e.target.value }))}
                      placeholder="Enter country"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Business Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
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
                  <div className="space-y-2">
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
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                onClick={handleProfileSave}
                disabled={updateProfileMutation.isPending}
                className="min-w-32"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Store Logo
                </CardTitle>
                <CardDescription>
                  Upload your store logo. Recommended size: 200x200px
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                    ) : profile?.profile?.storeLogo ? (
                      <img src={profile.profile.storeLogo} alt="Current Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="h-16 w-16 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Logo
                      </Button>
                      {logoFile && (
                        <Button
                          onClick={handleLogoUpload}
                          disabled={uploadLogoMutation.isPending}
                        >
                          {uploadLogoMutation.isPending ? 'Uploading...' : 'Upload Logo'}
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      PNG, JPG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Store Banner
                </CardTitle>
                <CardDescription>
                  Upload your store banner. Recommended size: 1200x300px
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                  ) : profile?.profile?.storeBanner ? (
                    <img src={profile.profile.storeBanner} alt="Current Banner" className="w-full h-full object-cover" />
                  ) : (
                    <p className="text-gray-400">No banner uploaded</p>
                  )}
                </div>
                <div className="space-y-3">
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => bannerInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Banner
                    </Button>
                    {bannerFile && (
                      <Button
                        onClick={handleBannerUpload}
                        disabled={uploadBannerMutation.isPending}
                      >
                        {uploadBannerMutation.isPending ? 'Uploading...' : 'Upload Banner'}
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG or GIF. Max size 5MB.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policies Tab */}
          <TabsContent value="policies" className="space-y-6">
            {/* Shipping Options Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Options
                </CardTitle>
                <CardDescription>
                  Configure your shipping methods, carriers, and costs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {shippingOptions.map((option, index) => (
                  <div key={option.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Shipping Option {index + 1}</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={option.enabled}
                            onCheckedChange={(checked) => 
                              updateShippingOption(option.id, 'enabled', checked)
                            }
                          />
                          <Label className="text-sm">Enabled</Label>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeShippingOption(option.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Shipping Method</Label>
                        <Input
                          value={option.method}
                          onChange={(e) => updateShippingOption(option.id, 'method', e.target.value)}
                          placeholder="e.g., Standard, Express, Overnight"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Carrier</Label>
                        <Input
                          value={option.carrier}
                          onChange={(e) => updateShippingOption(option.id, 'carrier', e.target.value)}
                          placeholder="e.g., DHL, FedEx, UPS"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Estimated Delivery (days)</Label>
                        <Input
                          value={option.estimatedDays}
                          onChange={(e) => updateShippingOption(option.id, 'estimatedDays', e.target.value)}
                          placeholder="e.g., 3-5, 7-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cost (USD)</Label>
                        <Input
                          value={option.cost}
                          onChange={(e) => updateShippingOption(option.id, 'cost', e.target.value)}
                          placeholder="e.g., 50.00 or Contact for quote"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Free Shipping Threshold (USD)</Label>
                        <Input
                          value={option.freeShippingThreshold}
                          onChange={(e) => updateShippingOption(option.id, 'freeShippingThreshold', e.target.value)}
                          placeholder="e.g., 1000 (leave empty if not applicable)"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addShippingOption}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Shipping Option
                </Button>
              </CardContent>
            </Card>

            {/* Payment Terms Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Terms
                </CardTitle>
                <CardDescription>
                  Configure accepted payment methods and terms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Accepted Payment Methods</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="bankTransfer"
                        checked={paymentTerms.acceptedMethods.includes('Bank Transfer')}
                        onCheckedChange={(checked) => 
                          handlePaymentMethodToggle('Bank Transfer', checked as boolean)
                        }
                      />
                      <Label htmlFor="bankTransfer" className="font-normal">
                        Bank Transfer / Wire Transfer
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="letterOfCredit"
                        checked={paymentTerms.acceptedMethods.includes('Letter of Credit')}
                        onCheckedChange={(checked) => 
                          handlePaymentMethodToggle('Letter of Credit', checked as boolean)
                        }
                      />
                      <Label htmlFor="letterOfCredit" className="font-normal">
                        Letter of Credit (L/C)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="creditCard"
                        checked={paymentTerms.acceptedMethods.includes('Credit Card')}
                        onCheckedChange={(checked) => 
                          handlePaymentMethodToggle('Credit Card', checked as boolean)
                        }
                      />
                      <Label htmlFor="creditCard" className="font-normal">
                        Credit Card
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="paypal"
                        checked={paymentTerms.acceptedMethods.includes('PayPal')}
                        onCheckedChange={(checked) => 
                          handlePaymentMethodToggle('PayPal', checked as boolean)
                        }
                      />
                      <Label htmlFor="paypal" className="font-normal">
                        PayPal
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="westernUnion"
                        checked={paymentTerms.acceptedMethods.includes('Western Union')}
                        onCheckedChange={(checked) => 
                          handlePaymentMethodToggle('Western Union', checked as boolean)
                        }
                      />
                      <Label htmlFor="westernUnion" className="font-normal">
                        Western Union
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="cashOnDelivery"
                        checked={paymentTerms.acceptedMethods.includes('Cash on Delivery')}
                        onCheckedChange={(checked) => 
                          handlePaymentMethodToggle('Cash on Delivery', checked as boolean)
                        }
                      />
                      <Label htmlFor="cashOnDelivery" className="font-normal">
                        Cash on Delivery (COD)
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creditTerms">Credit Terms</Label>
                  <Select
                    value={paymentTerms.creditTerms}
                    onValueChange={(value) => setPaymentTerms(prev => ({ ...prev, creditTerms: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select credit terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Credit Terms</SelectItem>
                      <SelectItem value="net15">Net 15 Days</SelectItem>
                      <SelectItem value="net30">Net 30 Days</SelectItem>
                      <SelectItem value="net45">Net 45 Days</SelectItem>
                      <SelectItem value="net60">Net 60 Days</SelectItem>
                      <SelectItem value="net90">Net 90 Days</SelectItem>
                      <SelectItem value="custom">Custom Terms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="advancePayment">Advance Payment Required</Label>
                  <Select
                    value={paymentTerms.advancePayment}
                    onValueChange={(value) => setPaymentTerms(prev => ({ ...prev, advancePayment: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select advance payment requirement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Advance Payment</SelectItem>
                      <SelectItem value="30">30% Advance</SelectItem>
                      <SelectItem value="50">50% Advance</SelectItem>
                      <SelectItem value="100">100% Advance (Full Payment)</SelectItem>
                      <SelectItem value="custom">Custom Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otherPaymentTerms">Additional Payment Terms</Label>
                  <Textarea
                    id="otherPaymentTerms"
                    value={paymentTerms.other}
                    onChange={(e) => setPaymentTerms(prev => ({ ...prev, other: e.target.value }))}
                    placeholder="Describe any additional payment terms, conditions, or special arrangements..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* General Store Policies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  General Store Policies
                </CardTitle>
                <CardDescription>
                  Define your store policies for shipping, returns, and warranty
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shipping" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    General Shipping Policy
                  </Label>
                  <Textarea
                    id="shipping"
                    value={policiesForm.shipping}
                    onChange={(e) => setPoliciesForm(prev => ({ ...prev, shipping: e.target.value }))}
                    placeholder="Describe your general shipping policy, packaging standards, and international shipping information..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="returns" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Returns & Refund Policy
                  </Label>
                  <Textarea
                    id="returns"
                    value={policiesForm.returns}
                    onChange={(e) => setPoliciesForm(prev => ({ ...prev, returns: e.target.value }))}
                    placeholder="Describe your returns and refund policy, including timeframes and conditions..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warranty" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Warranty & Guarantee Policy
                  </Label>
                  <Textarea
                    id="warranty"
                    value={policiesForm.warranty}
                    onChange={(e) => setPoliciesForm(prev => ({ ...prev, warranty: e.target.value }))}
                    placeholder="Describe your warranty and guarantee terms, coverage period, and claim process..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                onClick={handlePoliciesSave}
                disabled={updateStoreMutation.isPending}
                className="min-w-32"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateStoreMutation.isPending ? 'Saving...' : 'Save All Policies'}
              </Button>
            </div>
          </TabsContent>

          {/* Operating Hours Tab */}
          <TabsContent value="hours" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Operating Hours
                </CardTitle>
                <CardDescription>
                  Set your business operating hours for each day of the week. This helps buyers know when they can expect responses.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={hoursForm.timezone} 
                    onValueChange={(value) => setHoursForm(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (ET) - New York</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT) - Chicago</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT) - Denver</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT) - Los Angeles</SelectItem>
                      <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET/CEST)</SelectItem>
                      <SelectItem value="Europe/Berlin">Berlin (CET/CEST)</SelectItem>
                      <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                      <SelectItem value="Asia/Singapore">Singapore (SGT)</SelectItem>
                      <SelectItem value="Asia/Hong_Kong">Hong Kong (HKT)</SelectItem>
                      <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                      <SelectItem value="Australia/Sydney">Sydney (AEDT/AEST)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Select your local timezone to help buyers understand your availability
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Weekly Schedule</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const standardHours = '9:00 AM - 5:00 PM';
                          setHoursForm(prev => ({
                            ...prev,
                            monday: standardHours,
                            tuesday: standardHours,
                            wednesday: standardHours,
                            thursday: standardHours,
                            friday: standardHours,
                            saturday: 'Closed',
                            sunday: 'Closed',
                          }));
                        }}
                      >
                        Set Standard Hours
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setHoursForm(prev => ({
                            ...prev,
                            monday: '',
                            tuesday: '',
                            wednesday: '',
                            thursday: '',
                            friday: '',
                            saturday: '',
                            sunday: '',
                          }));
                        }}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { key: 'monday', label: 'Monday' },
                      { key: 'tuesday', label: 'Tuesday' },
                      { key: 'wednesday', label: 'Wednesday' },
                      { key: 'thursday', label: 'Thursday' },
                      { key: 'friday', label: 'Friday' },
                      { key: 'saturday', label: 'Saturday' },
                      { key: 'sunday', label: 'Sunday' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-3">
                        <Label htmlFor={key} className="w-28 font-medium">
                          {label}
                        </Label>
                        <Input
                          id={key}
                          value={hoursForm[key as keyof typeof hoursForm] as string}
                          onChange={(e) => setHoursForm(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder="e.g., 9:00 AM - 5:00 PM or Closed"
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="bg-brand-orange-50 border border-brand-orange-200 rounded-lg p-4">
                    <h4 className="font-medium text-brand-orange-900 mb-2">Tips for Setting Operating Hours:</h4>
                    <ul className="text-sm text-brand-orange-800 space-y-1 list-disc list-inside">
                      <li>Use consistent format: "9:00 AM - 5:00 PM" or "09:00 - 17:00"</li>
                      <li>For closed days, enter "Closed" or leave blank</li>
                      <li>For 24/7 operations, enter "24 Hours" or "Open 24/7"</li>
                      <li>Include break times if applicable: "9:00 AM - 1:00 PM, 2:00 PM - 6:00 PM"</li>
                      <li>Be clear about your timezone to avoid confusion with international buyers</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                onClick={handleHoursSave}
                disabled={updateStoreMutation.isPending}
                className="min-w-32"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateStoreMutation.isPending ? 'Saving...' : 'Save Operating Hours'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
