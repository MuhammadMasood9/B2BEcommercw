import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  XCircle, 
  FileText, 
  Award,
  Star,
  Eye,
  Download,
  Search,
  Filter,
  Calendar,
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users
} from 'lucide-react';
import { VerificationApprovalDialog } from './VerificationApprovalDialog';
import { VerificationRejectionDialog } from './VerificationRejectionDialog';

interface VerificationApplication {
  id: string;
  userId: string;
  businessName: string;
  storeName: string;
  contactPerson: string;
  email: string;
  phone: string;
  country: string;
  currentVerificationLevel: string;
  isVerified: boolean;
  verificationDocs: any;
  membershipTier: string;
  createdAt: string;
  updatedAt: string;
  application: {
    requestedLevel: string;
    appliedAt: string;
    additionalInfo?: string;
    status: string;
  };
}

interface VerificationStats {
  verificationLevels: Record<string, number>;
  pendingApplications: number;
  recentVerifications: any[];
  totalVerified: number;
}

export function VerificationReview() {
  const [applications, setApplications] = useState<VerificationApplication[]>([]);
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<VerificationApplication | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/verification/admin/pending', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications);
      }
    } catch (error) {
      console.error('Error fetching verification applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/verification/admin/stats', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching verification stats:', error);
    }
  };

  const handleApprove = (application: VerificationApplication) => {
    setSelectedApplication(application);
    setShowApprovalDialog(true);
  };

  const handleReject = (application: VerificationApplication) => {
    setSelectedApplication(application);
    setShowRejectionDialog(true);
  };

  const handleApprovalSuccess = () => {
    setShowApprovalDialog(false);
    setSelectedApplication(null);
    fetchApplications();
    fetchStats();
  };

  const handleRejectionSuccess = () => {
    setShowRejectionDialog(false);
    setSelectedApplication(null);
    fetchApplications();
    fetchStats();
  };

  const getVerificationBadge = (level: string) => {
    const badgeConfig = {
      basic: { variant: 'default' as const, icon: Shield, color: 'text-blue-600', label: 'Basic' },
      business: { variant: 'default' as const, icon: Award, color: 'text-green-600', label: 'Business' },
      premium: { variant: 'default' as const, icon: Star, color: 'text-purple-600', label: 'Premium' },
      trade_assurance: { variant: 'default' as const, icon: CheckCircle, color: 'text-gold-600', label: 'Trade Assurance' }
    };

    const config = badgeConfig[level as keyof typeof badgeConfig];
    if (!config) return <Badge variant="secondary">Unknown</Badge>;

    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = !searchTerm || 
      app.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = !levelFilter || app.application.requestedLevel === levelFilter;
    
    return matchesSearch && matchesLevel;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{stats.pendingApplications}</h3>
                  <p className="text-sm text-muted-foreground">Pending Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{stats.totalVerified}</h3>
                  <p className="text-sm text-muted-foreground">Total Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{stats.verificationLevels.premium || 0}</h3>
                  <p className="text-sm text-muted-foreground">Premium Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gold-100 rounded-lg">
                  <Award className="h-6 w-6 text-gold-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{stats.verificationLevels.trade_assurance || 0}</h3>
                  <p className="text-sm text-muted-foreground">Trade Assurance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Applications List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Verification Applications</CardTitle>
              <CardDescription>
                Review and approve supplier verification applications
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by business name, store name, or contact person..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Levels</option>
              <option value="basic">Basic</option>
              <option value="business">Business</option>
              <option value="premium">Premium</option>
              <option value="trade_assurance">Trade Assurance</option>
            </select>
          </div>

          {/* Applications Grid */}
          <div className="space-y-4">
            {filteredApplications.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending applications</h3>
                <p className="text-gray-500">All verification applications have been processed.</p>
              </div>
            ) : (
              filteredApplications.map((application) => (
                <Card key={application.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{application.businessName}</h3>
                          {getVerificationBadge(application.application.requestedLevel)}
                          <Badge variant="outline" className="text-xs">
                            Applied {new Date(application.application.appliedAt).toLocaleDateString()}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Building className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">Store:</span>
                              <span>{application.storeName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">Contact:</span>
                              <span>{application.contactPerson}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-gray-500" />
                              <span>{application.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <span>{application.phone}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span>{application.country}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Award className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">Current:</span>
                              <span className="capitalize">{application.currentVerificationLevel}</span>
                            </div>
                          </div>
                        </div>

                        {application.application.additionalInfo && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>Additional Info:</strong> {application.application.additionalInfo}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FileText className="h-4 w-4" />
                          <span>
                            {Object.keys(application.verificationDocs || {}).filter(key => key !== 'applicationInfo').length} documents uploaded
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => window.open(`/admin/verification/application/${application.id}`, '_blank')}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Review
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(application)}
                          className="flex items-center gap-2 text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(application)}
                          className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Verifications */}
      {stats && stats.recentVerifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Verifications</CardTitle>
            <CardDescription>
              Recently approved verification applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentVerifications.map((verification, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">{verification.businessName}</p>
                      <p className="text-sm text-gray-600">
                        {getVerificationBadge(verification.verificationLevel)} • 
                        {new Date(verification.verifiedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <VerificationApprovalDialog
        open={showApprovalDialog}
        onOpenChange={setShowApprovalDialog}
        application={selectedApplication}
        onSuccess={handleApprovalSuccess}
      />

      <VerificationRejectionDialog
        open={showRejectionDialog}
        onOpenChange={setShowRejectionDialog}
        application={selectedApplication}
        onSuccess={handleRejectionSuccess}
      />
    </div>
  );
}