import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Settings, 
  Users, 
  Mail, 
  MessageSquare, 
  Smartphone,
  Pause,
  Play,
  Trash2
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NotificationQueueItem {
  id: string;
  userId: string;
  channel: string;
  notificationType: string;
  subject?: string;
  content: string;
  recipientEmail?: string;
  recipientPhone?: string;
  priority: number;
  status: string;
  attempts: number;
  maxAttempts: number;
  scheduledAt: string;
  errorMessage?: string;
  createdAt: string;
}

interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  triggerEvent: string;
  targetAudience: string;
  channels: string[];
  isActive: boolean;
  priority: number;
  totalTriggered: number;
  totalSent: number;
  totalDelivered: number;
  createdAt: string;
}

interface NotificationPreference {
  id: string;
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  marketingEmails: boolean;
  systemNotifications: boolean;
  orderUpdates: boolean;
  inquiryNotifications: boolean;
  promotionalMessages: boolean;
}

export default function NotificationCenter() {
  const [queueItems, setQueueItems] = useState<NotificationQueueItem[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue');
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showRuleDialog, setShowRuleDialog] = useState(false);

  // Form states
  const [sendForm, setSendForm] = useState({
    userId: '',
    channel: 'email',
    subject: '',
    content: '',
    priority: 5,
    scheduledAt: '',
  });

  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    triggerEvent: 'user_signup',
    targetAudience: 'event_user',
    channels: ['email'] as string[],
    deliveryDelay: 0,
    priority: 5,
  });

  const [queueStats, setQueueStats] = useState({
    queued: 0,
    processing: 0,
    sent: 0,
    failed: 0,
    cancelled: 0,
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchQueueData, 5000); // Refresh queue every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchQueueData(),
        fetchAutomationRules(),
        fetchPreferences(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueueData = async () => {
    try {
      const response = await fetch('/api/admin/communications/notifications/queue');
      const data = await response.json();
      setQueueItems(data.queueItems || []);
      
      // Calculate stats
      const stats = (data.queueItems || []).reduce((acc: any, item: NotificationQueueItem) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});
      
      setQueueStats({
        queued: stats.queued || 0,
        processing: stats.processing || 0,
        sent: stats.sent || 0,
        failed: stats.failed || 0,
        cancelled: stats.cancelled || 0,
      });
    } catch (error) {
      console.error('Error fetching queue data:', error);
    }
  };

  const fetchAutomationRules = async () => {
    try {
      const response = await fetch('/api/admin/communications/automation/rules');
      const data = await response.json();
      setAutomationRules(data.rules || []);
    } catch (error) {
      console.error('Error fetching automation rules:', error);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/admin/communications/notifications/preferences');
      const data = await response.json();
      setPreferences(data.preferences || []);
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/communications/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sendForm),
      });

      if (response.ok) {
        setShowSendDialog(false);
        setSendForm({
          userId: '',
          channel: 'email',
          subject: '',
          content: '',
          priority: 5,
          scheduledAt: '',
        });
        fetchQueueData();
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/communications/automation/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleForm),
      });

      if (response.ok) {
        setShowRuleDialog(false);
        setRuleForm({
          name: '',
          description: '',
          triggerEvent: 'user_signup',
          targetAudience: 'event_user',
          channels: ['email'],
          deliveryDelay: 0,
          priority: 5,
        });
        fetchAutomationRules();
      }
    } catch (error) {
      console.error('Error creating rule:', error);
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/admin/communications/automation/rules/${ruleId}/toggle`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchAutomationRules();
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const handleCancelNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/communications/notifications/queue/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchQueueData();
      }
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'processing': return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>;
      case 'sent': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-gray-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'push': return <Smartphone className="h-4 w-4" />;
      case 'in_app': return <Bell className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'bg-red-100 text-red-800';
    if (priority >= 6) return 'bg-orange-100 text-orange-800';
    if (priority >= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Center</h1>
          <p className="text-gray-600">Manage notification delivery and automation rules</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowRuleDialog(true)} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            New Rule
          </Button>
          <Button onClick={() => setShowSendDialog(true)}>
            <Send className="h-4 w-4 mr-2" />
            Send Notification
          </Button>
        </div>
      </div>

      {/* Queue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Queued</p>
                <p className="text-2xl font-bold text-blue-600">{queueStats.queued}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-yellow-600">{queueStats.processing}</p>
              </div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sent</p>
                <p className="text-2xl font-bold text-green-600">{queueStats.sent}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{queueStats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-gray-600">{queueStats.cancelled}</p>
              </div>
              <XCircle className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="queue">Notification Queue</TabsTrigger>
          <TabsTrigger value="automation">Automation Rules</TabsTrigger>
          <TabsTrigger value="preferences">User Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {queueItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(item.status)}
                      {getChannelIcon(item.channel)}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.subject || 'No Subject'}</p>
                          <Badge className={getPriorityColor(item.priority)}>
                            Priority {item.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          To: {item.recipientEmail || item.recipientPhone || item.userId}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.content.substring(0, 100)}...
                        </p>
                        {item.errorMessage && (
                          <p className="text-sm text-red-600 mt-1">
                            Error: {item.errorMessage}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {item.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(item.scheduledAt).toLocaleString()}
                      </span>
                      {item.status === 'queued' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancelNotification(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {queueItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No notifications in queue
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automationRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{rule.name}</h3>
                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {rule.description && (
                        <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Trigger: {rule.triggerEvent}</span>
                        <span>•</span>
                        <span>Audience: {rule.targetAudience}</span>
                        <span>•</span>
                        <span>Channels: {rule.channels.join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span>Triggered: {rule.totalTriggered}</span>
                        <span>•</span>
                        <span>Sent: {rule.totalSent}</span>
                        <span>•</span>
                        <span>Delivered: {rule.totalDelivered}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => handleToggleRule(rule.id)}
                      />
                    </div>
                  </div>
                ))}
                {automationRules.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No automation rules configured
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {preferences.slice(0, 10).map((pref) => (
                  <div key={pref.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">User ID: {pref.userId}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className={pref.emailEnabled ? 'text-green-600' : 'text-red-600'}>
                          Email: {pref.emailEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <span className={pref.smsEnabled ? 'text-green-600' : 'text-red-600'}>
                          SMS: {pref.smsEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <span className={pref.pushEnabled ? 'text-green-600' : 'text-red-600'}>
                          Push: {pref.pushEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <span className={pref.inAppEnabled ? 'text-green-600' : 'text-red-600'}>
                          In-App: {pref.inAppEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {preferences.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No user preferences found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Send Notification Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSendNotification} className="space-y-4">
            <div>
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                value={sendForm.userId}
                onChange={(e) => setSendForm(prev => ({ ...prev, userId: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="channel">Channel</Label>
              <Select
                value={sendForm.channel}
                onValueChange={(value) => setSendForm(prev => ({ ...prev, channel: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                  <SelectItem value="in_app">In-App</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={sendForm.subject}
                onChange={(e) => setSendForm(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={sendForm.content}
                onChange={(e) => setSendForm(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="priority">Priority (1-10)</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="10"
                value={sendForm.priority}
                onChange={(e) => setSendForm(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowSendDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Send Notification
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Rule Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Automation Rule</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateRule} className="space-y-4">
            <div>
              <Label htmlFor="ruleName">Rule Name</Label>
              <Input
                id="ruleName"
                value={ruleForm.name}
                onChange={(e) => setRuleForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="ruleDescription">Description</Label>
              <Textarea
                id="ruleDescription"
                value={ruleForm.description}
                onChange={(e) => setRuleForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="triggerEvent">Trigger Event</Label>
              <Select
                value={ruleForm.triggerEvent}
                onValueChange={(value) => setRuleForm(prev => ({ ...prev, triggerEvent: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user_signup">User Signup</SelectItem>
                  <SelectItem value="order_placed">Order Placed</SelectItem>
                  <SelectItem value="inquiry_received">Inquiry Received</SelectItem>
                  <SelectItem value="payment_completed">Payment Completed</SelectItem>
                  <SelectItem value="supplier_approved">Supplier Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Select
                value={ruleForm.targetAudience}
                onValueChange={(value) => setRuleForm(prev => ({ ...prev, targetAudience: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event_user">Event User</SelectItem>
                  <SelectItem value="admins">Admins</SelectItem>
                  <SelectItem value="suppliers">All Suppliers</SelectItem>
                  <SelectItem value="buyers">All Buyers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowRuleDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Create Rule
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}