import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Building,
  Calendar,
  Shield,
  UserCheck,
  Building2,
  CheckCircle,
  XCircle,
  Activity,
  Eye,
  Lock,
  Key,
  Settings,
  Trash2,
  FileSpreadsheet
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Breadcrumb from "@/components/Breadcrumb";

export default function AdminUserDetails() {
  const [, params] = useRoute("/admin/users/:userId");
  const userId = params?.userId || "1";
  const [, setLocation] = useLocation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  // Mock user data - in real app, this would come from API
  const { data: user, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}`],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        id: userId,
        email: "john.doe@techcorp.com",
        firstName: "John",
        lastName: "Doe",
        companyName: "TechCorp Industries",
        phone: "+1-555-0124",
        role: "buyer",
        emailVerified: true,
        isActive: true,
        createdAt: new Date("2024-02-20"),
        updatedAt: new Date("2024-02-20"),
        lastLoginAt: new Date("2024-10-13"),
        profileImage: null,
        bio: "Experienced procurement manager with 10+ years in technology sourcing.",
        location: "San Francisco, CA",
        website: "https://techcorp.com",
        linkedin: "https://linkedin.com/in/johndoe",
        totalOrders: 45,
        totalSpent: 125000,
        averageOrderValue: 2777,
        ordersThisMonth: 3,
        spendThisMonth: 8500,
        lastOrderDate: new Date("2024-10-10"),
        preferredCategories: ["Electronics", "Software", "Hardware"],
        paymentMethods: ["Credit Card", "Bank Transfer"],
        shippingAddresses: [
          {
            id: "1",
            name: "Headquarters",
            address: "123 Tech Street, San Francisco, CA 94105",
            isDefault: true
          },
          {
            id: "2", 
            name: "Warehouse",
            address: "456 Industrial Ave, Oakland, CA 94607",
            isDefault: false
          }
        ]
      };
    }
  });

  // Mock activity data
  const { data: activities } = useQuery({
    queryKey: [`/api/users/${userId}/activities`],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return [
        {
          id: "1",
          type: "login",
          description: "User logged in",
          timestamp: new Date("2024-10-13T10:30:00"),
          ip: "192.168.1.100",
          userAgent: "Chrome/119.0.0.0"
        },
        {
          id: "2",
          type: "order",
          description: "Placed order #ORD-2024-001",
          timestamp: new Date("2024-10-10T14:22:00"),
          details: "Order total: $2,500"
        },
        {
          id: "3",
          type: "profile_update",
          description: "Updated profile information",
          timestamp: new Date("2024-10-08T09:15:00"),
          details: "Updated phone number"
        },
        {
          id: "4",
          type: "password_change",
          description: "Changed password",
          timestamp: new Date("2024-10-05T16:45:00"),
          ip: "192.168.1.100"
        }
      ];
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User deleted successfully" });
      setLocation("/admin/users");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      toast({ title: "Success", description: "User status updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user status", variant: "destructive" });
    },
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      case 'supplier': return Building2;
      case 'buyer': return UserCheck;
      default: return UserCheck;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'supplier': return 'default';
      case 'buyer': return 'secondary';
      default: return 'outline';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login': return Key;
      case 'order': return Activity;
      case 'profile_update': return Edit;
      case 'password_change': return Lock;
      default: return Eye;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading user details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <UserCheck className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">User not found</h3>
          <p className="text-muted-foreground mb-4">The user you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/admin/users")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  const RoleIcon = getRoleIcon(user.role);

  return (
    <div className="p-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb 
        items={[
          { label: "Users", href: "/admin/users" },
          { label: `${user?.firstName} ${user?.lastName}` }
        ]} 
      />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setLocation("/admin/users")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
          <div>
            <h1 className="text-3xl font-bold">User Details</h1>
            <p className="text-muted-foreground">View and manage user information</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation("/admin/users/import-export")}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Import/Export
          </Button>
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit User
          </Button>
          <Button 
            variant={user.isActive ? "destructive" : "default"}
            onClick={() => toggleUserStatusMutation.mutate({ id: user.id, isActive: !user.isActive })}
          >
            {user.isActive ? (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Activate
              </>
            )}
          </Button>
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>Are you sure you want to delete this user? This action cannot be undone.</p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => deleteUserMutation.mutate(user.id)}
                  >
                    Delete User
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.profileImage || ""} alt={`${user.firstName} ${user.lastName}`} />
              <AvatarFallback className="text-lg">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  <RoleIcon className="w-3 h-3 mr-1" />
                  {user.role}
                </Badge>
                <Badge variant={user.isActive ? "default" : "secondary"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
                {user.emailVerified && (
                  <Badge variant="outline">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{user.phone || "No phone"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <span>{user.companyName || "No company"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Joined {user.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
              {user.bio && (
                <p className="mt-4 text-muted-foreground">{user.bio}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  {user.ordersThisMonth} this month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                <span className="text-sm font-medium">💰</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${user.totalSpent.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  ${user.spendThisMonth.toLocaleString()} this month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <span className="text-sm font-medium">📊</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${user.averageOrderValue}</div>
                <p className="text-xs text-muted-foreground">
                  Per order
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Order</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {user.lastOrderDate.toLocaleDateString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.floor((Date.now() - user.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))} days ago
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Preferences */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Preferred Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.preferredCategories.map((category) => (
                    <Badge key={category} variant="outline">
                      {category}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {user.paymentMethods.map((method) => (
                    <div key={method} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{method}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shipping Addresses */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Addresses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user.shippingAddresses.map((address) => (
                  <div key={address.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{address.name}</h4>
                        {address.isDefault && (
                          <Badge variant="outline">Default</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{address.address}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>#ORD-2024-001</TableCell>
                    <TableCell>{user.lastOrderDate.toLocaleDateString()}</TableCell>
                    <TableCell>$2,500</TableCell>
                    <TableCell>
                      <Badge variant="default">Delivered</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities?.map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <ActivityIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.timestamp.toLocaleString()}
                        </p>
                        {activity.details && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {activity.details}
                          </p>
                        )}
                        {activity.ip && (
                          <p className="text-xs text-muted-foreground mt-1">
                            IP: {activity.ip}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Password</h4>
                  <p className="text-sm text-muted-foreground">Last changed 5 days ago</p>
                </div>
                <Button variant="outline">
                  <Lock className="w-4 h-4 mr-2" />
                  Reset Password
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground">Not enabled</p>
                </div>
                <Button variant="outline">
                  <Key className="w-4 h-4 mr-2" />
                  Enable 2FA
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
