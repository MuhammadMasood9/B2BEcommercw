import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, User, Package, FileText, MessageSquare, Truck, CreditCard, Settings, Eye, Trash2, Edit, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import Breadcrumb from '@/components/Breadcrumb';

interface ActivityLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  description: string;
  entityType: 'inquiry' | 'quotation' | 'order' | 'product' | 'user' | 'category' | 'chat' | 'system';
  entityId?: string;
  entityName?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export default function AdminActivityLogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAdmin, setFilterAdmin] = useState<string>('all');

  // Get activity logs
  const { data: activityLogsResp, isLoading } = useQuery({
    queryKey: ['/api/admin/activity-logs', { search: searchQuery, type: filterType, admin: filterAdmin }],
    queryFn: () => apiRequest('GET', `/api/admin/activity-logs?search=${searchQuery}&type=${filterType}&admin=${filterAdmin}`),
  });
  const activityLogs: ActivityLog[] = (activityLogsResp as any)?.logs || [];

  // Get unique admins for filter
  const { data: adminsResp } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: () => apiRequest('GET', '/api/admin/users'),
  });
  const admins = (adminsResp as any)?.users || [];

  const getActionIcon = (entityType: string) => {
    switch (entityType) {
      case 'inquiry': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'quotation': return <Package className="h-4 w-4 text-green-500" />;
      case 'order': return <Truck className="h-4 w-4 text-purple-500" />;
      case 'product': return <Package className="h-4 w-4 text-orange-500" />;
      case 'user': return <User className="h-4 w-4 text-indigo-500" />;
      case 'category': return <FileText className="h-4 w-4 text-pink-500" />;
      case 'chat': return <MessageSquare className="h-4 w-4 text-cyan-500" />;
      case 'system': return <Settings className="h-4 w-4 text-gray-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('create') || action.includes('add')) return 'default';
    if (action.includes('update') || action.includes('edit')) return 'secondary';
    if (action.includes('delete') || action.includes('remove')) return 'destructive';
    if (action.includes('view') || action.includes('read')) return 'outline';
    return 'secondary';
  };

  const getActionIconForAction = (action: string) => {
    if (action.includes('create') || action.includes('add')) return <Plus className="h-3 w-3" />;
    if (action.includes('update') || action.includes('edit')) return <Edit className="h-3 w-3" />;
    if (action.includes('delete') || action.includes('remove')) return <Trash2 className="h-3 w-3" />;
    if (action.includes('view') || action.includes('read')) return <Eye className="h-3 w-3" />;
    return <Activity className="h-3 w-3" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Activity Log', href: '/admin/activity-log' }
        ]}
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
   
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
            <p className="text-sm text-gray-500">Track all admin activities and system events</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Total Activities: {activityLogs.length}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-gray-200 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Entity Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="border-gray-200 focus:border-blue-500">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="inquiry">Inquiries</SelectItem>
                  <SelectItem value="quotation">Quotations</SelectItem>
                  <SelectItem value="order">Orders</SelectItem>
                  <SelectItem value="product">Products</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="category">Categories</SelectItem>
                  <SelectItem value="chat">Chats</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Admin</label>
              <Select value={filterAdmin} onValueChange={setFilterAdmin}>
                <SelectTrigger className="border-gray-200 focus:border-blue-500">
                  <SelectValue placeholder="All Admins" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Admins</SelectItem>
                  {admins.map((admin: any) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.name || admin.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                  setFilterAdmin('all');
                }}
                className="w-full border-gray-200 hover:bg-gray-50"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : activityLogs.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Activity className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">No activities found</h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                No activities match your current filters.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {activityLogs.map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getActionIcon(activity.entityType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg text-gray-900">
                              {activity.action}
                            </h3>
                            <Badge variant={getActionBadgeVariant(activity.action)} className="text-xs">
                              <div className="flex items-center gap-1">
                                {getActionIconForAction(activity.action)}
                                {activity.entityType}
                              </div>
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            {activity.description}
                          </p>
                          {activity.entityName && (
                            <p className="text-xs text-gray-500 mb-2">
                              Entity: <span className="font-medium">{activity.entityName}</span>
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Admin: <span className="font-medium">{activity.adminName}</span></span>
                            {activity.ipAddress && (
                              <span>IP: <span className="font-medium">{activity.ipAddress}</span></span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                        {activity.entityId && (
                          <Badge variant="outline" className="text-xs">
                            ID: {activity.entityId}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}