import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Mail, 
  RefreshCw,
  ArrowRight,
  AlertTriangle
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function EmailVerification() {
  const [location, setLocation] = useLocation();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'buyer' | 'supplier' | 'admin'>('buyer');
  const [isResending, setIsResending] = useState(false);
  const [resendEmail, setResendEmail] = useState('');

  // Extract token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  // Verify email token
  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch(`/api/registration/verify-email/${verificationToken}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setVerificationStatus('success');
        setMessage(result.message);
        setUserEmail(result.user?.email || '');
        setUserRole(result.user?.role || 'buyer');
        
        toast.success('Email verified successfully!');
        
        // Redirect to appropriate dashboard after 3 seconds
        setTimeout(() => {
          if (result.user?.role === 'supplier') {
            setLocation('/supplier/dashboard');
          } else if (result.user?.role === 'admin') {
            setLocation('/admin/dashboard');
          } else {
            setLocation('/buyer/dashboard');
          }
        }, 3000);
      } else {
        setVerificationStatus('error');
        setMessage(result.error || 'Verification failed');
        
        if (result.error?.includes('expired')) {
          setVerificationStatus('expired');
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
      setMessage('Network error occurred during verification');
    }
  };

  // Resend verification email
  const resendVerification = async () => {
    if (!resendEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResending(true);

    try {
      const response = await fetch('/api/registration/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resendEmail }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Verification email sent successfully!');
        setResendEmail('');
      } else {
        toast.error(result.error || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Resend error:', error);
      toast.error('Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setVerificationStatus('error');
      setMessage('No verification token provided');
    }
  }, [token]);

  const renderContent = () => {
    switch (verificationStatus) {
      case 'loading':
        return (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Your Email</h2>
            <p className="text-gray-600">Please wait while we verify your email address...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Verified Successfully!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            
            {userRole === 'supplier' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-800 text-sm">
                  <strong>Next Step:</strong> Your supplier application is now under review. 
                  You'll receive an email notification once the review is complete.
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <span>Redirecting to your dashboard</span>
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            
            <Button 
              onClick={() => {
                if (userRole === 'supplier') {
                  setLocation('/supplier/dashboard');
                } else if (userRole === 'admin') {
                  setLocation('/admin/dashboard');
                } else {
                  setLocation('/buyer/dashboard');
                }
              }}
              className="mt-4"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification Link Expired</h2>
            <p className="text-gray-600 mb-6">
              Your verification link has expired. Please request a new verification email.
            </p>
            
            <div className="max-w-sm mx-auto space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resendEmail">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="resendEmail"
                    type="email"
                    placeholder="Enter your email address"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Button
                onClick={resendVerification}
                disabled={isResending}
                className="w-full"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 'error':
      default:
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="max-w-sm mx-auto space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resendEmail">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="resendEmail"
                    type="email"
                    placeholder="Enter your email address"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Button
                onClick={resendVerification}
                disabled={isResending}
                className="w-full"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
              
              <div className="text-center">
                <Button variant="outline" onClick={() => setLocation('/login')}>
                  Back to Login
                </Button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md bg-white shadow-2xl border-gray-100">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Email Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}