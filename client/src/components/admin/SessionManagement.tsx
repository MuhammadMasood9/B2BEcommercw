import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Monitor, 
  Smartphone, 
  Laptop, 
  Globe, 
  Clock, 
  MapPin, 
  Shield, 
  AlertTriangle, 
  LogOut, 
  Lock, 
  Unlock,
  Eye,
  EyeOff,
  Settings,
  User,
  Calendar,
  Activity,
  Zap,
  Ban,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

// Types
interface AdminSession {
  id: string;
  adminUserId: string;
  adminName: string;
  adminEmail: string;
  sessionToken: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  isActive: boolean;
  expiresAt: string;
  lastActivity: string;
  createdAt: string;
  terminatedAt?: string;
  terminationReason?: string;
}

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
}

interface SessionSecuritySettings {
  globalSessionTimeout: number;
  maxConcurrentSessions: number;
  requireMfaForHighRisk: boolean;
  autoLockAfterFailedAttempts: number;
  sessionInactivityTimeout: number;
  forceLogoutOnSuspiciousActivity: boolean;
}

export default function SessionManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [selectedSession, setSelectedSession] = useState<AdminSession | null>(null);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [securitySettings, setSecuritySettings] = useState<SessionSecuritySettings>({
    globalSessionTimeout: 480, // 8 hours
    maxConcurrentSessions: 3,
    requireMfaForHighRisk: true,
    autoLockAfterFailedAttempts: 5,
    sessionInactivityTimeout: 60, // 1 hour
    forceLogoutOnSuspiciousActivity: true,
  });
  const { toast } = useToast();

  // Fetch admin users
  const { data: adminUsers = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/access/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/access/users');
      return response.users || [];
    },
  });

  // Fetch active sessions (mock data for now - would need to implement session tracking API)
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<AdminSession[]>({
    queryKey: ['/api/admin/sessions'],
    queryFn: async () => {
      // Mock data - in real implementation, this would fetch from admin sessions API
      return [
        {
          id: '1',
          adminUserId: 'admin1',
          adminName: 'John Doe',
          adminEmail: 'john@example.com',
          sessionToken: 'sess_abc123',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          deviceFingerprint: 'fp_xyz789',
          isActive: true,
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
          lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          adminUserId: 'admin2',
          adminName: 'Jane Smith',
          adminEmail: 'jane@example.com',
          sessionToken: 'sess_def456',
          ipAddress: '10.0.0.50',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          deviceFingerprint: 'fp_abc456',
          isActive: true,
          expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          lastActivity: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        },
      ];
    },
  });

  // Terminate session mutation
  const terminateSessionMutation = useMutation({
    mutationFn: async ({ sessionId, reason }: { sessionId: string; reason: string }) => {
      // Mock implementation - would call actual API
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sessions'] });
      toast({ title: "Success", description: "Session terminated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to terminate session", 
        variant: "destructive" 
      });
    },
  });

  // Lock user mutation
  const lockUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      return await apiRequest('PATCH', `/api/admin/access/users/${userId}/lock`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/access/users'] });
      toast({ title: "Success", description: "User locked successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to lock user", 
        variant: "destructive" 
      });
    },
  });

  // Filter sessions
  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = searchTerm === "" || 
      session.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.adminEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUser = selectedUser === "all" || session.adminUserId === selectedUser;
    
    const matchesFilter = sessionFilter === "all" || 
      (sessionFilter === "active" && session.isActive) ||
      (sessionFilter === "expired" && !session.isActive) ||
      (sessionFilter === "suspicious" && isSuspiciousSession(session));
    
    return matchesSearch && matchesUser && matchesFilter;
  });

  // Helper functions
  const isSuspiciousSession = (session: AdminSession): boolean => {
    // Mock logic for detecting suspicious sessions
    const lastActivityTime = new Date(session.lastActivity).getTime();
    const now = Date.now();
    const inactiveTime = now - lastActivityTime;
    
    // Consider suspicious if inactive for more than 2 hours but still active
    return session.isActive && inactiveTime > 2 * 60 * 60 * 1000;
  };

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Monitor className="w-4 h-4" />;
    
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return <Smartphone className="w-4 h-4" />;
    }
    if (userAgent.includes('Macintosh') || userAgent.includes('Windows')) {
      return <Laptop className="w-4 h-4" />;
    }
    return <Monitor className="w-4 h-4" />;
  };

  const getDeviceInfo = (userAgent?: string) => {
    if (!userAgent) return "Unknown Device";
    
    if (userAgent.includes('Windows')) return "Windows PC";
    if (userAgent.includes('Macintosh')) return "Mac";
    if (userAgent.includes('iPhone')) return "iPhone";
    if (userAgent.includes('Android')) return "Android";
    return "Unknown Device";
  };

  const getLocationInfo = (ipAddress?: string) => {
    // Mock location detection - in real implementation, use IP geolocation service
    if (!ipAddress) return "Unknown Location";
    
    if (ipAddress.startsWith('192.168') || ipAddress.startsWith('10.0')) {
      return "Local Network";
    }
    return "External Location";
  };

  const getSessionStatus = (session: AdminSession) => {
    if (!session.isActive) return { status: "Terminated", color: "bg-gray-100 text-gray-800" };
    
    const expiresAt = new Date(session.expiresAt).getTime();
    const now = Date.now();
    
    if (expiresAt < now) return { status: "Expired", color: "bg-red-100 text-red-800" };
    if (isSuspiciousSession(session)) return { status: "Suspicious", color: "bg-orange-100 text-orange-800" };
    
    return { status: "Active", color: "bg-green-100 text-green-800" };
  };

  const handleTerminateSession = (session: AdminSession) => {
    terminateSessionMutation.mutate({
      sessionId: session.id,
      reason: "Manual termination by admin",
    });
  };

  const handleLockUser = (userId: string) => {
    lockUserMutation.mutate({
      userId,
      reason: "Suspicious activity detected",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Session Management</h2>
          <p className="text-gray-600 mt-1">Monitor and manage admin user sessions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsSettingsDialogOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Security Settings
          </Button>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Session Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold">{sessions.filter(s => s.isActive).length}</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Online Admins</p>
                <p className="text-2xl font-bold">{new Set(sessions.filter(s => s.isActive).map(s => s.adminUserId)).size}</p>
              </div>
              <User className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Suspicious Sessions</p>
                <p className="text-2xl font-bold">{sessions.filter(isSuspiciousSession).length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Locked Users</p>
                <p className="text-2xl font-bold">{adminUsers.filter(u => u.isLocked).length}</p>
              </div>
              <Lock className="w-8 h-8 text-red-500" />
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
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {adminUsers.map((user) => (
                  <SelectItem key={user.id} value={user.userId}>
                    {user.firstName} {user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sessionFilter} onValueChange={setSessionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Session status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="suspicious">Suspicious</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Admin Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Device & Location</TableHead>
                <TableHead>Session Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map((session) => {
                const sessionStatus = getSessionStatus(session);
                return (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{session.adminName}</p>
                          <p className="text-sm text-gray-500">{session.adminEmail}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(session.userAgent)}
                          <span className="text-sm">{getDeviceInfo(session.userAgent)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">{getLocationInfo(session.ipAddress)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-400 font-mono">{session.ipAddress}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">
                          Started: {format(new Date(session.createdAt), 'MMM dd, HH:mm')}
                        </p>
                        <p className="text-sm text-gray-500">
                          Expires: {format(new Date(session.expiresAt), 'MMM dd, HH:mm')}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">
                          ID: {session.sessionToken.substring(0, 12)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={sessionStatus.color}>
                        {sessionStatus.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(session.lastActivity), { addSuffix: true })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSession(session)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {session.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTerminateSession(session)}
                          >
                            <LogOut className="w-4 h-4" />
                          </Button>
                        )}
                        {isSuspiciousSession(session) && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleLockUser(session.adminUserId)}
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Security Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Session Security Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Global Session Timeout (minutes)</Label>
              <Input
                type="number"
                value={securitySettings.globalSessionTimeout}
                onChange={(e) => setSecuritySettings(prev => ({
                  ...prev,
                  globalSessionTimeout: parseInt(e.target.value) || 480
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Concurrent Sessions</Label>
              <Input
                type="number"
                value={securitySettings.maxConcurrentSessions}
                onChange={(e) => setSecuritySettings(prev => ({
                  ...prev,
                  maxConcurrentSessions: parseInt(e.target.value) || 3
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Session Inactivity Timeout (minutes)</Label>
              <Input
                type="number"
                value={securitySettings.sessionInactivityTimeout}
                onChange={(e) => setSecuritySettings(prev => ({
                  ...prev,
                  sessionInactivityTimeout: parseInt(e.target.value) || 60
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Auto-lock after failed attempts</Label>
              <Input
                type="number"
                value={securitySettings.autoLockAfterFailedAttempts}
                onChange={(e) => setSecuritySettings(prev => ({
                  ...prev,
                  autoLockAfterFailedAttempts: parseInt(e.target.value) || 5
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Require MFA for high-risk actions</Label>
              <Switch
                checked={securitySettings.requireMfaForHighRisk}
                onCheckedChange={(checked) => setSecuritySettings(prev => ({
                  ...prev,
                  requireMfaForHighRisk: checked
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Force logout on suspicious activity</Label>
              <Switch
                checked={securitySettings.forceLogoutOnSuspiciousActivity}
                onCheckedChange={(checked) => setSecuritySettings(prev => ({
                  ...prev,
                  forceLogoutOnSuspiciousActivity: checked
                }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast({ title: "Success", description: "Security settings updated" });
                setIsSettingsDialogOpen(false);
              }}>
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Session Details Dialog */}
      {selectedSession && (
        <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Session Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">User</Label>
                  <p className="font-medium">{selectedSession.adminName}</p>
                  <p className="text-sm text-gray-500">{selectedSession.adminEmail}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Status</Label>
                  <Badge className={getSessionStatus(selectedSession).color}>
                    {getSessionStatus(selectedSession).status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">IP Address</Label>
                  <p className="font-mono text-sm">{selectedSession.ipAddress}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Location</Label>
                  <p className="text-sm">{getLocationInfo(selectedSession.ipAddress)}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">User Agent</Label>
                <p className="text-sm break-all">{selectedSession.userAgent}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Session Started</Label>
                  <p className="text-sm">{format(new Date(selectedSession.createdAt), 'PPpp')}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Last Activity</Label>
                  <p className="text-sm">{format(new Date(selectedSession.lastActivity), 'PPpp')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Expires At</Label>
                  <p className="text-sm">{format(new Date(selectedSession.expiresAt), 'PPpp')}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Session Token</Label>
                  <p className="text-xs font-mono break-all">{selectedSession.sessionToken}</p>
                </div>
              </div>
              {selectedSession.isActive && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This session is currently active. Terminating it will immediately log out the user.
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedSession(null)}>
                  Close
                </Button>
                {selectedSession.isActive && (
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      handleTerminateSession(selectedSession);
                      setSelectedSession(null);
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Terminate Session
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}