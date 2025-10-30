import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  Activity, 
  User, 
  Clock, 
  Filter,
  Search,
  Download,
  Eye,
  Edit,
  Plus,
  Trash2,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ActivityLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  description: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
}

const ACTION_ICONS = {
  create: Plus,
  read: Eye,
  update: Edit,
  delete: Trash2,
  respond: MessageSquare,
  login: User,
  logout: User
};

const ACTION_COLORS = {
  create: 'text-green-600',
  read: 'text-blue-600',
  update: 'text-yellow-600',
  delete: 'text-red-600',
  respond: 'text-purple-600',
  login: 'text-gray-600',
  logout: 'text-gray-400'
};

export default function StaffActivityMonitor() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    staffMember: '',
    action: '',
    entityType: '',
    dateRange: '7d'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchStaffMembers();
    fetchActivities();
  }, [filters, pagination.page]);

  const fetchStaffMembers = async () => {
    try {
      const response = await fetch('/api/suppliers/staff', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStaffMembers(data.staff || []);
      }
    } catch (error) {
      console.error('Error fetching staff members:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await fetch(`/api/suppliers/staff/activities?${params}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      } else {
        throw new Error('Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load staff activities',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const exportActivities = async () => {
    try {
      const params = new URLSearchParams(filters);
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      params.append('export', 'true');
      
      const response = await fetch(`/api/suppliers/staff/activities?${params}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `staff-activities-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Success',
          description: 'Activities exported successfully'
        });
      } else {
        throw new Error('Failed to export activities');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getActionIcon = (action: string) => {
    const Icon = ACTION_ICONS[action as keyof typeof ACTION_ICONS] || Activity;
    const color = ACTION_COLORS[action as keyof typeof ACTION_COLORS] || 'text-gray-600';
    return <Icon className={`w-4 h-4 ${color}`} />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStaffMemberName = (adminName: string) => {
    // Extract staff member name from the formatted admin name
    const match = adminName.match(/^(.+?)\s+\(/);
    return match ? match[1] : adminName;
  };

  const getStaffRole = (adminName: string) => {
    // Extract role from the formatted admin name
    const match = adminName.match(/\((.+?)\)/);
    return match ? match[1] : '';
  };

  const clearFilters = () => {
    setFilters({
      staffMember: '',
      action: '',
      entityType: '',
      dateRange: '7d'
    });
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Staff Activity Monitor</h2>
          <p className="text-gray-600">Track and monitor staff member activities</p>
        </div>
        <Button onClick={exportActivities} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Activities
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Staff Member</label>
              <Select value={filters.staffMember} onValueChange={(value) => setFilters({ ...filters, staffMember: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All staff</SelectItem>
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} ({staff.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Action</label>
              <Select value={filters.action} onValueChange={(value) => setFilters({ ...filters, action: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="respond">Respond</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Entity Type</label>
              <Select value={filters.entityType} onValueChange={(value) => setFilters({ ...filters, entityType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="product">Products</SelectItem>
                  <SelectItem value="order">Orders</SelectItem>
                  <SelectItem value="inquiry">Inquiries</SelectItem>
                  <SelectItem value="store">Store</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select value={filters.dateRange} onValueChange={(value) => setFilters({ ...filters, dateRange: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button onClick={fetchActivities}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activities ({pagination.total})
          </CardTitle>
          <CardDescription>
            Monitor all staff member activities and actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
              <p className="text-gray-500">No staff activities match your current filters</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{getStaffMemberName(activity.adminName)}</div>
                          <div className="text-sm text-gray-500">{getStaffRole(activity.adminName)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(activity.action)}
                          <Badge variant="outline" className="capitalize">
                            {activity.action}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={activity.description}>
                          {activity.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium capitalize">{activity.entityType}</div>
                          {activity.entityName && (
                            <div className="text-sm text-gray-500 truncate max-w-xs" title={activity.entityName}>
                              {activity.entityName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatDate(activity.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500 font-mono">
                          {activity.ipAddress || 'N/A'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} activities
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}