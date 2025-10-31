import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Upload, 
  FileText, 
  Award,
  Star,
  TrendingUp,
  Users,
  ShoppingBag
} from 'lucide-react';
import { VerificationApplicationDialog } from './VerificationApplicationDialog';
import { DocumentUploadDialog } from './DocumentUploadDialog';

interface VerificationLevel {
  name: string;
  description: string;
  requirements: string[];
  benefits: string[];
}

interface VerificationStatus {
  level: string;
  isVerified: boolean;
  verifiedAt?: string;
  documents?: any;
  availableLevels: Record<string, VerificationLevel>;
  currentLevel: VerificationLevel;
}

export function VerificationDashboard() {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>('');

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch('/api/verification/status', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setVerificationStatus(data.verification);
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationBadge = (level: string, isVerified: boolean) => {
    if (!isVerified) {
      return <Badge variant="secondary">Not Verified</Badge>;
    }

    const badgeConfig = {
      basic: { variant: 'default' as const, icon: Shield, color: 'text-blue-600' },
      business: { variant: 'default' as const, icon: Award, color: 'text-green-600' },
      premium: { variant: 'default' as const, icon: Star, color: 'text-purple-600' },
      trade_assurance: { variant: 'default' as const, icon: CheckCircle, color: 'text-gold-600' }
    };

    const config = badgeConfig[level as keyof typeof badgeConfig];
    if (!config) return <Badge variant="secondary">Unknown</Badge>;

    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {verificationStatus?.availableLevels[level]?.name || level}
      </Badge>
    );
  };

  const getProgressPercentage = (currentLevel: string) => {
    const levels = ['none', 'basic', 'business', 'premium', 'trade_assurance'];
    const currentIndex = levels.indexOf(currentLevel);
    return ((currentIndex + 1) / levels.length) * 100;
  };

  const getNextLevel = (currentLevel: string) => {
    const levels = ['none', 'basic', 'business', 'premium', 'trade_assurance'];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  };

  const handleApplyForVerification = (level: string) => {
    setSelectedLevel(level);
    setShowApplicationDialog(true);
  };

  const handleApplicationSuccess = () => {
    setShowApplicationDialog(false);
    fetchVerificationStatus();
  };

  const handleDocumentUploadSuccess = () => {
    setShowDocumentDialog(false);
    fetchVerificationStatus();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!verificationStatus) {
    return (
      <Alert>
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to load verification status. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const nextLevel = getNextLevel(verificationStatus.level);
  const applicationInfo = verificationStatus.documents?.applicationInfo;

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Verification Status
              </CardTitle>
              <CardDescription>
                Your current verification level and progress
              </CardDescription>
            </div>
            {getVerificationBadge(verificationStatus.level, verificationStatus.isVerified)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Verification Progress</span>
              <span>{Math.round(getProgressPercentage(verificationStatus.level))}%</span>
            </div>
            <Progress value={getProgressPercentage(verificationStatus.level)} className="h-2" />
          </div>

          {verificationStatus.isVerified && verificationStatus.verifiedAt && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Verified on {new Date(verificationStatus.verifiedAt).toLocaleDateString()}
            </div>
          )}

          {applicationInfo && applicationInfo.status === 'pending_review' && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Your {verificationStatus.availableLevels[applicationInfo.requestedLevel]?.name} application is under review.
                Applied on {new Date(applicationInfo.appliedAt).toLocaleDateString()}.
              </AlertDescription>
            </Alert>
          )}

          {applicationInfo && applicationInfo.status === 'rejected' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Your verification application was rejected. 
                {applicationInfo.rejectionReason && ` Reason: ${applicationInfo.rejectionReason}`}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            {nextLevel && !applicationInfo && (
              <Button 
                onClick={() => handleApplyForVerification(nextLevel)}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Apply for {verificationStatus.availableLevels[nextLevel]?.name}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => setShowDocumentDialog(true)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Documents
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Verification Levels */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Levels</CardTitle>
          <CardDescription>
            Choose the verification level that best fits your business needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="premium">Premium</TabsTrigger>
              <TabsTrigger value="trade_assurance">Trade Assurance</TabsTrigger>
            </TabsList>

            {Object.entries(verificationStatus.availableLevels).map(([level, config]) => {
              if (level === 'none') return null;
              
              const isCurrentLevel = verificationStatus.level === level;
              const isAvailable = !isCurrentLevel && !applicationInfo;
              
              return (
                <TabsContent key={level} value={level} className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{config.name}</h3>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                      </div>
                      {isCurrentLevel && (
                        <Badge variant="default">Current Level</Badge>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Requirements
                        </h4>
                        <ul className="space-y-1 text-sm">
                          {config.requirements.map((req, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="h-1.5 w-1.5 bg-blue-600 rounded-full" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          Benefits
                        </h4>
                        <ul className="space-y-1 text-sm">
                          {config.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {isAvailable && (
                      <div className="mt-4 pt-4 border-t">
                        <Button 
                          onClick={() => handleApplyForVerification(level)}
                          className="w-full"
                        >
                          Apply for {config.name}
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Benefits Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Build Trust</h3>
                <p className="text-sm text-muted-foreground">
                  Verification badges increase buyer confidence
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Higher Rankings</h3>
                <p className="text-sm text-muted-foreground">
                  Verified suppliers appear higher in search results
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">More Orders</h3>
                <p className="text-sm text-muted-foreground">
                  Verified suppliers receive 3x more inquiries
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <VerificationApplicationDialog
        open={showApplicationDialog}
        onOpenChange={setShowApplicationDialog}
        level={selectedLevel}
        levelConfig={selectedLevel ? verificationStatus.availableLevels[selectedLevel] : null}
        onSuccess={handleApplicationSuccess}
      />

      <DocumentUploadDialog
        open={showDocumentDialog}
        onOpenChange={setShowDocumentDialog}
        onSuccess={handleDocumentUploadSuccess}
      />
    </div>
  );
}