import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Users, 
  Settings, 
  Activity, 
  Monitor,
  Lock,
  Eye,
  AlertTriangle,
  CheckCircle,
  Crown,
  UserCheck
} from "lucide-react";
import EnhancedAdminUserList from "@/components/admin/EnhancedAdminUserList";
import RoleConfiguration from "@/components/admin/RoleConfiguration";
import SecurityAudit from "@/components/admin/SecurityAudit";
import SecurityDashboard from "@/components/admin/SecurityDashboard";
import SessionManagement from "@/components/admin/SessionManagement";
import Breadcrumb from "@/components/Breadcrumb";

export default function AdminAccessManagement() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Breadcrumb 
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Access Management" }
          ]} 
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Access Management</h1>
              <p className="text-gray-600 mt-2">
                Manage admin users, roles, permissions, and security settings
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                System Secure
              </Badge>
            </div>
          </div>
        </div>

        {/* Security Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Admin Users</p>
                  <p className="text-3xl font-bold text-gray-900">12</p>
                  <p className="text-sm text-green-600 mt-1">
                    <CheckCircle className="w-3 h-3 inline mr-1" />
                    All active
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Roles</p>
                  <p className="text-3xl font-bold text-gray-900">7</p>
                  <p className="text-sm text-blue-600 mt-1">
                    <Crown className="w-3 h-3 inline mr-1" />
                    3 system roles
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                  <p className="text-3xl font-bold text-gray-900">8</p>
                  <p className="text-sm text-green-600 mt-1">
                    <Monitor className="w-3 h-3 inline mr-1" />
                    All secure
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Security Events</p>
                  <p className="text-3xl font-bold text-gray-900">3</p>
                  <p className="text-sm text-orange-600 mt-1">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Needs review
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Eye className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-gray-200 px-6 pt-6">
                <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
                  <TabsTrigger value="dashboard" className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <span className="hidden sm:inline">Security</span>
                  </TabsTrigger>
                  <TabsTrigger value="users" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Users</span>
                  </TabsTrigger>
                  <TabsTrigger value="roles" className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span className="hidden sm:inline">Roles</span>
                  </TabsTrigger>
                  <TabsTrigger value="sessions" className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    <span className="hidden sm:inline">Sessions</span>
                  </TabsTrigger>
                  <TabsTrigger value="audit" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Audit</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="dashboard" className="mt-0">
                  <SecurityDashboard />
                </TabsContent>

                <TabsContent value="users" className="mt-0">
                  <EnhancedAdminUserList />
                </TabsContent>

                <TabsContent value="roles" className="mt-0">
                  <RoleConfiguration />
                </TabsContent>

                <TabsContent value="sessions" className="mt-0">
                  <SessionManagement />
                </TabsContent>

                <TabsContent value="audit" className="mt-0">
                  <SecurityAudit />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Security Recommendations */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Security Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Multi-Factor Authentication</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Enable MFA for all admin accounts to enhance security.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">Regular Access Reviews</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Review admin access permissions monthly to ensure principle of least privilege.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-900">Session Monitoring</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      Monitor for suspicious login patterns and concurrent sessions.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900">Password Policies</h4>
                    <p className="text-sm text-purple-700 mt-1">
                      Enforce strong password requirements and regular password changes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}