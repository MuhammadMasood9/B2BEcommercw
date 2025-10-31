import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Calendar, 
  Users, 
  TrendingUp, 
  Star,
  Package,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Edit,
  Ban,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface SupplierDetailsProps {
  supplierId: string;
  onEdit?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onSuspend?: () => void;
  onActivate?: () => void;
}

interface SupplierDetail {
  id: string;
  businessName: string;
  businessType: string;
  storeName: string;
  storeSlug: string;
  storeDescription: string;
  storeLogo: string;
  storeBanner: string;
  contactPerson: string;
  position: string;
  phone: string;
  whatsapp: string;
  wechat: string;
  email: string;
  address: string;
  city: string;
  country: string;
  website: string;
  yearEstablished: number;
  employees: string;
  factorySize: string;
  annualRevenue: string;
  mainProducts: string[];
  exportMarkets: string[];
  verificationLevel: string;
  verificationDocs: any;
  isVerified: boolean;
  verifiedAt: string;
  membershipTier: string;
  rating: number;
  totalReviews: number;
  responseRate: number;
  responseTime: string;
  totalSales: number;
  totalOrders: number;
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  isSuspended: boolean;
  suspensionReason: string;
  customCommissionRate: number;
  totalProducts: number;
  totalInquiries: number;
  storeViews: number;
  followers: number;
  createdAt: string;
  updatedAt: string;
}

interface RiskAssessment {
  overallRisk: string;
  businessAge: {
    years: number;
    risk: string;
  };
  performance: {
    rating: number;
    totalReviews: number;
    risk: string;
  };
  volume: {
    totalOrders: number;
    totalSales: number;
    risk: string;
  };
  geographic: {
    country: string;
    risk: string;
  };
  recommendations: string[];
}

export function SupplierDetails({ 
  supplierId, 
  onEdit, 
  onApprove, 
  onReject, 
  onSuspend, 
  onActivate 
}: SupplierDetailsProps) {
  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchSupplierDetails();
    fetchRiskAssessment();
  }, [supplierId]);

  const fetchSupplierDetails = async () => {
    try {
      const response = await fetch(`/api/admin/suppliers/${supplierId}`);
      const data = await response.json();
      
      if (data.success) {
        setSupplier(data.supplier);
      }
    } catch (error) {
      console.error('Error fetching supplier details:', error);
    }
  };

  const fetchRiskAssessment = async () => {
    try {
      const response = await fetch(`/api/admin/suppliers/${supplierId}/risk-assessment`);
      const data = await response.json();
      
      if (data.success) {
        setRiskAssessment(data.riskAssessment);
      }
    } catch (error) {
      console.error('Error fetching risk assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !supplier) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading supplier details...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string, isActive: boolean, isSuspended: boolean) => {
    if (isSuspended) {
      return <Badge variant="destructive">Suspended</Badge>;
    }
    
    switch (status) {
      case 'approved':
        return isActive ? 
          <Badge variant="default" className="bg-green-500">Active</Badge> :
          <Badge variant="secondary">Inactive</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending Approval</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      free: 'bg-gray-500',
      silver: 'bg-gray-400',
      gold: 'bg-yellow-500',
      platinum: 'bg-purple-500',
    };
    
    return (
      <Badge className={colors[tier as keyof typeof colors] || 'bg-gray-500'}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    );
  };

  const getVerificationBadge = (level: string) => {
    const colors = {
      none: 'bg-red-500',
      basic: 'bg-yellow-500',
      business: 'bg-blue-500',
      premium: 'bg-green-500',
      trade_assurance: 'bg-purple-500',
    };
    
    return (
      <Badge className={colors[level as keyof typeof colors] || 'bg-gray-500'}>
        {level.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getRiskBadge = (riskLevel: string) => {
    const colors = {
      low: 'bg-green-500',
      medium: 'bg-yellow-500',
      high: 'bg-orange-500',
      critical: 'bg-red-500',
    };
    
    return (
      <Badge className={colors[riskLevel as keyof typeof colors] || 'bg-gray-500'}>
        {riskLevel.toUpperCase()} RISK
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          {supplier.storeLogo && (
            <img
              src={supplier.storeLogo}
              alt={supplier.businessName}
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">{supplier.businessName}</h1>
            <p className="text-muted-foreground">{supplier.storeName}</p>
            <div className="flex items-center space-x-2 mt-2">
              {getStatusBadge(supplier.status, supplier.isActive, supplier.isSuspended)}
              {getTierBadge(supplier.membershipTier)}
              {getVerificationBadge(supplier.verificationLevel)}
              {riskAssessment && getRiskBadge(riskAssessment.overallRisk)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          
          {supplier.status === 'pending' && onApprove && onReject && (
            <>
              <Button variant="outline" onClick={onReject}>
                Reject
              </Button>
              <Button onClick={onApprove}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </>
          )}
          
          {supplier.status === 'approved' && (
            <>
              {supplier.isSuspended ? (
                onActivate && (
                  <Button onClick={onActivate}>
                    <Play className="mr-2 h-4 w-4" />
                    Activate
                  </Button>
                )
              ) : (
                onSuspend && (
                  <Button variant="destructive" onClick={onSuspend}>
                    <Ban className="mr-2 h-4 w-4" />
                    Suspend
                  </Button>
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-xl font-bold">{formatCurrency(supplier.totalSales)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-xl font-bold">{supplier.totalOrders.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="text-xl font-bold">
                  {supplier.rating.toFixed(1)} ({supplier.totalReviews})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Response Rate</p>
                <p className="text-xl font-bold">{supplier.responseRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="business">Business Info</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{supplier.contactPerson}</p>
                    <p className="text-sm text-muted-foreground">{supplier.position}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p>{supplier.email}</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p>{supplier.phone}</p>
                </div>
                
                {supplier.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={supplier.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {supplier.website}
                    </a>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p>{supplier.address}, {supplier.city}, {supplier.country}</p>
                </div>
              </CardContent>
            </Card>

            {/* Store Information */}
            <Card>
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">Store Description</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {supplier.storeDescription || 'No description provided'}
                  </p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Products</p>
                    <p className="font-medium">{supplier.totalProducts}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Inquiries</p>
                    <p className="font-medium">{supplier.totalInquiries}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Store Views</p>
                    <p className="font-medium">{supplier.storeViews.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Followers</p>
                    <p className="font-medium">{supplier.followers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Company Information</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Business Type:</span>
                      <span className="ml-2 font-medium">{supplier.businessType}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Year Established:</span>
                      <span className="ml-2 font-medium">{supplier.yearEstablished || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Employees:</span>
                      <span className="ml-2 font-medium">{supplier.employees || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Factory Size:</span>
                      <span className="ml-2 font-medium">{supplier.factorySize || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Annual Revenue:</span>
                      <span className="ml-2 font-medium">{supplier.annualRevenue || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Products & Markets</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Main Products:</p>
                      <div className="flex flex-wrap gap-1">
                        {supplier.mainProducts && supplier.mainProducts.length > 0 ? (
                          supplier.mainProducts.map((product, index) => (
                            <Badge key={index} variant="outline">{product}</Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">Not specified</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Export Markets:</p>
                      <div className="flex flex-wrap gap-1">
                        {supplier.exportMarkets && supplier.exportMarkets.length > 0 ? (
                          supplier.exportMarkets.map((market, index) => (
                            <Badge key={index} variant="outline">{market}</Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">Not specified</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Response Rate</span>
                    <span className="text-sm font-medium">{supplier.responseRate}%</span>
                  </div>
                  <Progress value={supplier.responseRate} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Customer Rating</span>
                    <span className="text-sm font-medium">{supplier.rating.toFixed(1)}/5.0</span>
                  </div>
                  <Progress value={(supplier.rating / 5) * 100} className="h-2" />
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Response Time</p>
                    <p className="font-medium">{supplier.responseTime || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Reviews</p>
                    <p className="font-medium">{supplier.totalReviews}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Sales Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Sales</p>
                    <p className="font-medium">{formatCurrency(supplier.totalSales)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Orders</p>
                    <p className="font-medium">{supplier.totalOrders}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Order Value</p>
                    <p className="font-medium">
                      {supplier.totalOrders > 0 
                        ? formatCurrency(supplier.totalSales / supplier.totalOrders)
                        : '$0'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Commission Rate</p>
                    <p className="font-medium">
                      {supplier.customCommissionRate 
                        ? `${supplier.customCommissionRate}%` 
                        : 'Default'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verification Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Verification Level</p>
                  <p className="text-sm text-muted-foreground">
                    Current verification status and documents
                  </p>
                </div>
                {getVerificationBadge(supplier.verificationLevel)}
              </div>
              
              {supplier.isVerified && supplier.verifiedAt && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Verified on {formatDate(supplier.verifiedAt)}</span>
                </div>
              )}
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-3">Verification Documents</h4>
                <div className="space-y-2">
                  {supplier.verificationDocs ? (
                    Object.entries(supplier.verificationDocs).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                        </div>
                        <Badge variant="outline">
                          {typeof value === 'string' ? 'Uploaded' : 'Pending'}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No documents uploaded</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          {riskAssessment ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Risk Assessment
                    {getRiskBadge(riskAssessment.overallRisk)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Business Age</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{riskAssessment.businessAge.years} years</span>
                        <Badge variant={riskAssessment.businessAge.risk === 'low' ? 'default' : 'destructive'}>
                          {riskAssessment.businessAge.risk}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Performance Risk</span>
                      <Badge variant={riskAssessment.performance.risk === 'low' ? 'default' : 'destructive'}>
                        {riskAssessment.performance.risk}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Volume Risk</span>
                      <Badge variant={riskAssessment.volume.risk === 'low' ? 'default' : 'destructive'}>
                        {riskAssessment.volume.risk}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Geographic Risk</span>
                      <Badge variant={riskAssessment.geographic.risk === 'low' ? 'default' : 'destructive'}>
                        {riskAssessment.geographic.risk}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {riskAssessment.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Risk assessment data not available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Account Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Account Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium">Account Created</p>
                <p className="text-xs text-muted-foreground">{formatDate(supplier.createdAt)}</p>
              </div>
            </div>
            
            {supplier.verifiedAt && (
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Account Verified</p>
                  <p className="text-xs text-muted-foreground">{formatDate(supplier.verifiedAt)}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-xs text-muted-foreground">{formatDate(supplier.updatedAt)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}