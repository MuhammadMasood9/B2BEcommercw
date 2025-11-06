import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Loader2, 
  Mail, 
  Search,
  Building2,
  Calendar,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { toast } from "react-hot-toast";

interface ApplicationStatus {
  email: string;
  emailVerified: boolean;
  isActive: boolean;
  status: 'pending' | 'approved' | 'rejected';
  businessName: string;
  storeName: string;
  submittedAt: string;
}

export default function SupplierApplicationStatus() {
  const [location, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState<ApplicationStatus | null>(null);
  const [searchEmail, setSearchEmail] = useState('');

  // Check application status
  const checkStatus = async (email: string) => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/registration/supplier/status/${encodeURIComponent(email)}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setApplication(result.application);
      } else {
        toast.error(result.error || 'Application not found');
        setApplication(null);
      }
    } catch (error) {
      console.error('Status check error:', error);
      toast.error('Failed to check application status');
      setApplication(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusMessage = (application: ApplicationStatus) => {
    if (!application.emailVerified) {
      return {
        title: "Email Verification Required",
        message: "Please check your email and click the verification link to continue with your application.",
        action: "Check Email"
      };
    }

    switch (application.status) {
      case 'pending':
        return {
          title: "Application Under Review",
          message: "Our team is reviewing your supplier application and uploaded documents. This process typically takes 1-3 business days.",
          action: "Please Wait"
        };
      case 'approved':
        return {
          title: "Application Approved!",
          message: "Congratulations! Your supplier application has been approved. You can now access your supplier dashboard and start selling.",
          action: "Go to Dashboard"
        };
      case 'rejected':
        return {
          title: "Application Needs Attention",
          message: "Your application requires additional information or documentation. Please contact support for details.",
          action: "Contact Support"
        };
      default:
        return {
          title: "Status Unknown",
          message: "Unable to determine application status. Please contact support.",
          action: "Contact Support"
        };
    }
  };

  const handleAction = (application: ApplicationStatus) => {
    const statusInfo = getStatusMessage(application);
    
    switch (statusInfo.action) {
      case "Go to Dashboard":
        setLocation('/supplier/dashboard');
        break;
      case "Contact Support":
        window.location.href = 'mailto:support@b2bmarketplace.com';
        break;
      case "Check Email":
        toast('Please check your email for the verification link', { icon: 'ℹ️' });
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          <Card className="bg-white shadow-2xl border-gray-100">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Supplier Application Status
              </CardTitle>
              <p className="text-gray-600 mt-2">Check the status of your supplier registration</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter the email used for registration"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      className="pl-10"
                      onKeyPress={(e) => e.key === 'Enter' && checkStatus(searchEmail)}
                    />
                  </div>
                </div>
                
                <Button
                  onClick={() => checkStatus(searchEmail)}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking Status...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Check Application Status
                    </>
                  )}
                </Button>
              </div>

              {/* Application Status Display */}
              {application && (
                <div className="border-t pt-6">
                  <div className="space-y-6">
                    {/* Status Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(application.status)}
                        <div>
                          <h3 className="font-semibold text-gray-900">{application.businessName}</h3>
                          <p className="text-sm text-gray-600">{application.storeName}</p>
                        </div>
                      </div>
                      {getStatusBadge(application.status)}
                    </div>

                    {/* Application Details */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Email:</span>
                          <span className="text-sm font-medium">{application.email}</span>
                          {application.emailVerified ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Submitted:</span>
                          <span className="text-sm font-medium">
                            {new Date(application.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Message */}
                    <div className="text-center space-y-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {getStatusMessage(application).title}
                        </h4>
                        <p className="text-gray-600">
                          {getStatusMessage(application).message}
                        </p>
                      </div>

                      {/* Action Button */}
                      {getStatusMessage(application).action !== "Please Wait" && (
                        <Button
                          onClick={() => handleAction(application)}
                          className={
                            application.status === 'approved'
                              ? "bg-green-600 hover:bg-green-700"
                              : application.status === 'rejected'
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-blue-600 hover:bg-blue-700"
                          }
                        >
                          {getStatusMessage(application).action}
                        </Button>
                      )}

                      {/* Refresh Button */}
                      <div className="pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => checkStatus(application.email)}
                          disabled={loading}
                          size="sm"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh Status
                        </Button>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h5 className="font-medium text-blue-900 mb-3">Application Timeline</h5>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-blue-800">Application submitted</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {application.emailVerified ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-yellow-600" />
                          )}
                          <span className="text-sm text-blue-800">Email verification</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {application.status === 'pending' ? (
                            <Clock className="w-4 h-4 text-yellow-600" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                          <span className="text-sm text-blue-800">Document review</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {application.status === 'approved' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-sm text-blue-800">Final approval</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Help Section */}
              <div className="border-t pt-6">
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    Need help with your application?
                  </p>
                  <Button variant="outline" size="sm" onClick={() => window.location.href = 'mailto:support@b2bmarketplace.com'}>
                    Contact Support
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}