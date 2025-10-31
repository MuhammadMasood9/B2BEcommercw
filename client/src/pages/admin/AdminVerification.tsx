import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VerificationReview } from '@/components/admin/VerificationReview';
import Breadcrumb from '@/components/Breadcrumb';
import { Shield, Clock, CheckCircle, Star } from 'lucide-react';

export default function AdminVerification() {
  const breadcrumbItems = [
    { label: 'Admin', href: '/admin' },
    { label: 'Verification Management', href: '/admin/verification' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Breadcrumb items={breadcrumbItems} />
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              Verification Management
            </h1>
            <p className="text-gray-600 mt-2">
              Review and manage supplier verification applications and status
            </p>
          </div>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Applications
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Overview & Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <VerificationReview />
          </TabsContent>

          <TabsContent value="overview">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Verification System Overview</CardTitle>
                  <CardDescription>
                    Manage the supplier verification system and review statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center p-6 border rounded-lg">
                      <div className="flex justify-center mb-3">
                        <div className="p-3 bg-blue-100 rounded-full">
                          <Shield className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-blue-900">Basic Verification</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Identity and basic business verification
                      </p>
                      <ul className="text-xs text-gray-500 mt-2 space-y-1">
                        <li>• Business License</li>
                        <li>• Identity Document</li>
                        <li>• Contact Verification</li>
                      </ul>
                    </div>

                    <div className="text-center p-6 border rounded-lg">
                      <div className="flex justify-center mb-3">
                        <div className="p-3 bg-green-100 rounded-full">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-green-900">Business Verification</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Comprehensive business verification
                      </p>
                      <ul className="text-xs text-gray-500 mt-2 space-y-1">
                        <li>• Tax Registration</li>
                        <li>• Bank Verification</li>
                        <li>• Address Verification</li>
                      </ul>
                    </div>

                    <div className="text-center p-6 border rounded-lg">
                      <div className="flex justify-center mb-3">
                        <div className="p-3 bg-purple-100 rounded-full">
                          <Star className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-purple-900">Premium Verification</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Enhanced credibility verification
                      </p>
                      <ul className="text-xs text-gray-500 mt-2 space-y-1">
                        <li>• Financial Statements</li>
                        <li>• Quality Certifications</li>
                        <li>• Audit Reports</li>
                      </ul>
                    </div>

                    <div className="text-center p-6 border rounded-lg">
                      <div className="flex justify-center mb-3">
                        <div className="p-3 bg-amber-100 rounded-full">
                          <CheckCircle className="h-6 w-6 text-amber-600" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-amber-900">Trade Assurance</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Highest level with trade protection
                      </p>
                      <ul className="text-xs text-gray-500 mt-2 space-y-1">
                        <li>• Insurance Coverage</li>
                        <li>• Escrow Protection</li>
                        <li>• Quality Guarantee</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Verification Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-green-900 mb-2">For Suppliers</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Increased buyer trust and credibility</li>
                          <li>• Higher search rankings and visibility</li>
                          <li>• Access to premium platform features</li>
                          <li>• Reduced commission rates</li>
                          <li>• Priority customer support</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900 mb-2">For Buyers</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Confidence in supplier legitimacy</li>
                          <li>• Reduced risk of fraud</li>
                          <li>• Quality assurance guarantees</li>
                          <li>• Trade protection services</li>
                          <li>• Dispute resolution support</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Verification Process</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                          1
                        </div>
                        <div>
                          <h4 className="font-medium">Application Submission</h4>
                          <p className="text-sm text-gray-600">Supplier submits verification application with required documents</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                          2
                        </div>
                        <div>
                          <h4 className="font-medium">Document Review</h4>
                          <p className="text-sm text-gray-600">Admin team reviews all submitted documents and business information</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                          3
                        </div>
                        <div>
                          <h4 className="font-medium">Verification Decision</h4>
                          <p className="text-sm text-gray-600">Application is approved or rejected with detailed feedback</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium text-green-600">
                          4
                        </div>
                        <div>
                          <h4 className="font-medium">Badge Assignment</h4>
                          <p className="text-sm text-gray-600">Verified suppliers receive badges and access to benefits</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}