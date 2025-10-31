import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  UserCheck, 
  UserX, 
  Mail, 
  Phone, 
  Building,
  MoreHorizontal,
  Download,
  Upload,
  Filter,
  Calendar,
  Eye,
  Lock,
  Unlock,
  UserPlus,
  Ban,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  X,
  FileSpreadsheet,
  Crown,
  Settings,
  Activity
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { z } from "zod";
import { format } from "date-fns";

// Types
interface AdminUser {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
  isLocked: boolean;
  lastLogin?: string;
  maxConcurrentSessions: number;
  sessionTimeoutMinutes: number;
  requireMfa: boolean;
  failedLoginAttempts: number;
  createdAt: string;
}

interface AdminRole {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  level: number;
  isSystemRole: boolean;
}

// Validation schemas
const createAdminUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  roleId: z.string().min(1, "Role is required"),
  requireMfa: z.boolean().default(false),
  sessionTimeoutMinutes: z.number().min(30).max(1440).default(480),
});

const updateAdminUserSchema = createAdminUserSchema.partial().omit({ password: true });

export default function EnhancedAdminUserList() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch admin users
  const { data: users = [], isLoading, error } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/access/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/access/users");
      return response.users || [];
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch roles
  const { data: roles = [] } = useQuery<AdminRole[]>({
    queryKey: ['/api/admin/access/roles'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/access/roles');
      return response.roles || [];
    },
  });

  // Create admin user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      return await apiRequest("POST", "/api/admin/access/users", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/access/users"] });
      toast({ title: "Success", description: "Admin user created successfully" });
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create admin user", variant: "destructive" });
    },
  });

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      return await apiRequest("PUT", `/api/admin/access/users/${userId}/role`, { roleId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/access/users"] });
      toast({ title: "Success", description: "Role assigned successfully" });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to assign role", variant: "destructive" });
    },
  });

  // Lock/unlock user mutation
  const toggleLockMutation = useMutation({
    mutationFn: async ({ userId, isLocked, reason }: { userId: string; isLocked: boolean; reason?: string }) => {
      const endpoint = isLocked ? "lock" : "unlock";
      return await apiRequest("PATCH", `/api/admin/access/users/${userId}/${endpoint}`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/access/users"] });
      toast({ title: "Success", description: "User status updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update user status", variant: "destructive" });
    },
  });

  // Forms
  const createForm = useForm({
    resolver: zodResolver(createAdminUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      roleId: "",
      requireMfa: false,
      sessionTimeoutMinutes: 480,
    },
  });

  const updateForm = useForm({
    resolver: zodResolver(updateAdminUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      roleId: "",
      requireMfa: false,
      sessionTimeoutMinutes: 480,
    },
  });

  // Filter and sort users
  const filteredAndSortedUsers = users?.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(search.toLowerCase());
    
    const matchesRole = filterRole === "all" || user.roleId === filterRole;
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "active" && user.isActive && !user.isLocked) ||
      (filterStatus === "locked" && user.isLocked) ||
      (filterStatus === "inactive" && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  }).sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case "name":
        aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
        bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
        break;
      case "email":
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
        break;
      case "role":
        aValue = a.roleName.toLowerCase();
        bValue = b.roleName.toLowerCase();
        break;
      case "lastLogin":
        aValue = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
        bValue = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
        break;
      default:
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
    }
    
    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const onCreateSubmit = (data: any) => {
    createUserMutation.mutate(data);
  };

  const onUpdateSubmit = (data: any) => {
    if (!selectedUser) return;
    assignRoleMutation.mutate({
      userId: selectedUser.id,
      roleId: data.roleId,
    });
  };

  const handleDeleteUser = (user: AdminUser) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    updateForm.reset({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      requireMfa: user.requireMfa,
      sessionTimeoutMinutes: user.sessionTimeoutMinutes,
    });
    setIsEditDialogOpen(true);
  };

  const handleToggleLock = (user: AdminUser) => {
    toggleLockMutation.mutate({
      userId: user.id,
      isLocked: !user.isLocked,
      reason: user.isLocked ? "Manual unlock by admin" : "Manual lock by admin",
    });
  };

  const getRoleColor = (role: AdminRole) => {
    if (role.level >= 80) return "bg-red-100 text-red-800";
    if (role.level >= 60) return "bg-orange-100 text-orange-800";
    if (role.level >= 40) return "bg-yellow-100 text-yellow-800";
    if (role.level >= 20) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  const getRoleIcon = (role: AdminRole) => {
    if (role.level >= 80) return <Crown className="w-4 h-4" />;
    if (role.level >= 60) return <Shield className="w-4 h-4" />;
    if (role.level >= 40) return <UserCheck className="w-4 h-4" />;
    return <Settings className="w-4 h-4" />;
  };

  const getUserStatusColor = (user: AdminUser) => {
    if (user.isLocked) return "bg-red-100 text-red-800";
    if (!user.isActive) return "bg-gray-100 text-gray-800";
    return "bg-green-100 text-green-800";
  };

  const getUserStatusText = (user: AdminUser) => {
    if (user.isLocked) return "Locked";
    if (!user.isActive) return "Inactive";
    return "Active";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin User Management</h2>
          <p className="text-gray-600 mt-1">Manage admin users, roles, and permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation("/admin/users/roles")}>
            <Shield className="w-4 h-4 mr-2" />
            Manage Roles
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Admin User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Admin User</DialogTitle>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="admin@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={createForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="roleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                <div className="flex items-center gap-2">
                                  {getRoleIcon(role)}
                                  {role.displayName}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-between">
                    <FormLabel>Require MFA</FormLabel>
                    <FormField
                      control={createForm.control}
                      name="requireMfa"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={createForm.control}
                    name="sessionTimeoutMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session Timeout (minutes)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="30" 
                            max="1440" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 480)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createUserMutation.isPending}>
                      {createUserMutation.isPending ? "Creating..." : "Create User"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Admin Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <UserCheck className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{users.filter(u => u.isActive && !u.isLocked).length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Locked Users</p>
                <p className="text-2xl font-bold">{users.filter(u => u.isLocked).length}</p>
              </div>
              <Lock className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">MFA Enabled</p>
                <p className="text-2xl font-bold">{users.filter(u => u.requireMfa).length}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search admin users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Security</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedUsers.map((user) => {
                const userRole = roles.find(r => r.id === user.roleId);
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserCheck className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {userRole && (
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${getRoleColor(userRole)}`}>
                            {getRoleIcon(userRole)}
                          </div>
                          <div>
                            <p className="font-medium">{userRole.displayName}</p>
                            <p className="text-xs text-gray-500">Level {userRole.level}</p>
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getUserStatusColor(user)}>
                        {getUserStatusText(user)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {format(new Date(user.lastLogin), 'MMM dd, HH:mm')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.requireMfa && (
                          <Badge variant="outline" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            MFA
                          </Badge>
                        )}
                        {user.failedLoginAttempts > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {user.failedLoginAttempts} Failed
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleLock(user)}
                        >
                          {user.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/admin/users/${user.id}/sessions`)}
                        >
                          <Activity className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Admin User</DialogTitle>
          </DialogHeader>
          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
              <FormField
                control={updateForm.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            <div className="flex items-center gap-2">
                              {getRoleIcon(role)}
                              {role.displayName}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={assignRoleMutation.isPending}>
                  {assignRoleMutation.isPending ? "Updating..." : "Update Role"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}