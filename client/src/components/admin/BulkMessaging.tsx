import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, Send, Users, Calendar, Settings, Eye, Pause, Play, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BulkCommunication {
  id: string;
  name: string;
  description?: string;
  subject?: string;
  content: string;
  targetType: string;
  targetCriteria: any;
  estimatedRecipients: number;
  actualRecipients: number;
  deliveryMethod: string;
  scheduledAt?: string;
  channels: string[];
  status: string;
  approvalStatus: string;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  createdAt: string;
}

interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  criteria: any;
  estimatedCount: number;
}

interface CommunicationTemplate {
  id: string;
  name: string;
  category: string;
  type: string;
  subject?: string;
  content: string;
  variables: string[];
}

export default function BulkMessaging() {
  const [communications, setCommunications] = useState<BulkCommunication[]>([]);
  const [segments, setSegments] = useState<AudienceSegment[]>([]);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('create');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    templateId: '',
    subject: '',
    content: '',
    htmlContent: '',
    targetType: 'segment',
    targetCriteria: {
      userTypes: [] as string[],
      membershipTiers: [] as string[],
      countries: [] as string[],
      isActive: true,
      isVerified: undefined as boolean | undefined,
    },
    deliveryMethod: 'immediate',
    scheduledAt: '',
    channels: ['email'] as string[],
    channelSettings: {
      email: {
        fromName: 'B2B Platform',
        fromEmail: 'noreply@platform.com',
        replyTo: 'support@platform.com',
      },
    },
  });

  const [estimatedRecipients, setEstimatedRecipients] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.targetType && formData.targetCriteria) {
      estimateRecipients();
    }
  }, [formData.targetType, formData.targetCriteria]);

  const fetchData = async () => {
    try {
      const [commsRes, segmentsRes, templatesRes] = await Promise.all([
        fetch('/api/admin/communications/bulk-messaging'),
        fetch('/api/admin/communications/audience-segments'),
        fetch('/api/admin/communications/templates?type=email'),
      ]);

      const [commsData, segmentsData, templatesData] = await Promise.all([
        commsRes.json(),
        segmentsRes.json(),
        templatesRes.json(),
      ]);

      setCommunications(commsData.communications || []);
      setSegments(segmentsData.segments || []);
      setTemplates(templatesData.templates || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const estimateRecipients = async () => {
    try {
      const response = await fetch('/api/admin/communications/estimate-recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: formData.targetType,
          targetCriteria: formData.targetCriteria,
        }),
      });

      const data = await response.json();
      setEstimatedRecipients(data.estimatedRecipients || 0);
    } catch (error) {
      console.error('Error estimating recipients:', error);
      setEstimatedRecipients(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/communications/bulk-messaging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setCommunications(prev => [data.communication, ...prev]);
        setShowCreateDialog(false);
        resetForm();
        setActiveTab('manage');
      } else {
        console.error('Failed to create communication');
      }
    } catch (error) {
      console.error('Error creating communication:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      templateId: '',
      subject: '',
      content: '',
      htmlContent: '',
      targetType: 'segment',
      targetCriteria: {
        userTypes: [],
        membershipTiers: [],
        countries: [],
        isActive: true,
        isVerified: undefined,
      },
      deliveryMethod: 'immediate',
      scheduledAt: '',
      channels: ['email'],
      channelSettings: {
        email: {
          fromName: 'B2B Platform',
          fromEmail: 'noreply@platform.com',
          replyTo: 'support@platform.com',
        },
      },
    });
    setEstimatedRecipients(0);
  };

  const handleSendCommunication = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/communications/bulk-messaging/${id}/send`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error sending communication:', error);
    }
  };

  const handlePauseCommunication = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/communications/bulk-messaging/${id}/pause`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error pausing communication:', error);
    }
  };

  const handleCancelCommunication = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/communications/bulk-messaging/${id}/cancel`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error cancelling communication:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'sending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Bulk Messaging</h1>
          <p className="text-gray-600">Create and manage bulk communications to suppliers and buyers</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
          <Send className="h-4 w-4" />
          New Communication
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {segments.slice(0, 6).map((segment) => (
                  <Card key={segment.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{segment.name}</h3>
                        <Badge variant="secondary">{segment.estimatedCount}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{segment.description}</p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            targetType: 'segment',
                            targetCriteria: segment.criteria,
                          }));
                          setShowCreateDialog(true);
                        }}
                      >
                        Create Message
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {communications.map((comm) => (
              <Card key={comm.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{comm.name}</h3>
                      {comm.description && (
                        <p className="text-gray-600 mt-1">{comm.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(comm.status)}>
                        {comm.status}
                      </Badge>
                      {comm.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => handleSendCommunication(comm.id)}
                          className="flex items-center gap-1"
                        >
                          <Send className="h-3 w-3" />
                          Send
                        </Button>
                      )}
                      {comm.status === 'sending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePauseCommunication(comm.id)}
                          className="flex items-center gap-1"
                        >
                          <Pause className="h-3 w-3" />
                          Pause
                        </Button>
                      )}
                      {comm.status === 'paused' && (
                        <Button
                          size="sm"
                          onClick={() => handleSendCommunication(comm.id)}
                          className="flex items-center gap-1"
                        >
                          <Play className="h-3 w-3" />
                          Resume
                        </Button>
                      )}
                      {(comm.status === 'draft' || comm.status === 'scheduled') && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancelCommunication(comm.id)}
                          className="flex items-center gap-1"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Recipients</p>
                      <p className="font-semibold">{comm.actualRecipients || comm.estimatedRecipients}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Sent</p>
                      <p className="font-semibold">{comm.sentCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Delivered</p>
                      <p className="font-semibold">{comm.deliveredCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Opened</p>
                      <p className="font-semibold">{comm.openedCount}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Channels: {comm.channels.join(', ')}</span>
                    <span>•</span>
                    <span>Created: {new Date(comm.createdAt).toLocaleDateString()}</span>
                    {comm.scheduledAt && (
                      <>
                        <span>•</span>
                        <span>Scheduled: {new Date(comm.scheduledAt).toLocaleString()}</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Communications</p>
                    <p className="text-2xl font-bold">{communications.length}</p>
                  </div>
                  <Send className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Sent</p>
                    <p className="text-2xl font-bold">
                      {communications.reduce((sum, comm) => sum + comm.sentCount, 0)}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Delivery Rate</p>
                    <p className="text-2xl font-bold">
                      {communications.length > 0
                        ? Math.round(
                            (communications.reduce((sum, comm) => sum + comm.deliveredCount, 0) /
                              communications.reduce((sum, comm) => sum + comm.sentCount, 0)) * 100
                          ) || 0
                        : 0}%
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Open Rate</p>
                    <p className="text-2xl font-bold">
                      {communications.length > 0
                        ? Math.round(
                            (communications.reduce((sum, comm) => sum + comm.openedCount, 0) /
                              communications.reduce((sum, comm) => sum + comm.deliveredCount, 0)) * 100
                          ) || 0
                        : 0}%
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Communication Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Bulk Communication</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="template">Template (Optional)</Label>
                <Select
                  value={formData.templateId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, templateId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="content">Message Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
                required
              />
            </div>

            <div>
              <Label>Target Audience</Label>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>User Types</Label>
                  <div className="flex gap-4 mt-2">
                    {['supplier', 'buyer', 'admin'].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={type}
                          checked={formData.targetCriteria.userTypes.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({
                                ...prev,
                                targetCriteria: {
                                  ...prev.targetCriteria,
                                  userTypes: [...prev.targetCriteria.userTypes, type],
                                },
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                targetCriteria: {
                                  ...prev.targetCriteria,
                                  userTypes: prev.targetCriteria.userTypes.filter(t => t !== type),
                                },
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={type} className="capitalize">{type}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Channels</Label>
                  <div className="flex gap-4 mt-2">
                    {['email', 'sms', 'push', 'in_app'].map((channel) => (
                      <div key={channel} className="flex items-center space-x-2">
                        <Checkbox
                          id={channel}
                          checked={formData.channels.includes(channel)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({
                                ...prev,
                                channels: [...prev.channels, channel],
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                channels: prev.channels.filter(c => c !== channel),
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={channel} className="capitalize">{channel}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                Estimated recipients: <strong>{estimatedRecipients}</strong>
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Create Communication
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}