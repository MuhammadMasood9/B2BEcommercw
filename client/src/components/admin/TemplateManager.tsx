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
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Bell,
  Code,
  Users,
  Settings
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CommunicationTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  type: string;
  subject?: string;
  content: string;
  htmlContent?: string;
  variables: string[];
  defaultValues: Record<string, any>;
  targetAudience: string;
  audienceCriteria: Record<string, any>;
  isActive: boolean;
  isSystemTemplate: boolean;
  requiresApproval: boolean;
  isAbTest: boolean;
  abTestConfig: Record<string, any>;
  createdAt: string;
  createdBy: string;
}

const TEMPLATE_CATEGORIES = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'policy_update', label: 'Policy Update' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'system_notification', label: 'System Notification' },
  { value: 'approval', label: 'Approval' },
  { value: 'rejection', label: 'Rejection' },
];

const TEMPLATE_TYPES = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'sms', label: 'SMS', icon: MessageSquare },
  { value: 'push', label: 'Push Notification', icon: Smartphone },
  { value: 'in_app', label: 'In-App Notification', icon: Bell },
];

const TARGET_AUDIENCES = [
  { value: 'all', label: 'All Users' },
  { value: 'suppliers', label: 'Suppliers' },
  { value: 'buyers', label: 'Buyers' },
  { value: 'admins', label: 'Administrators' },
  { value: 'custom', label: 'Custom Criteria' },
];

const COMMON_VARIABLES = [
  '{{firstName}}',
  '{{lastName}}',
  '{{companyName}}',
  '{{email}}',
  '{{phone}}',
  '{{membershipTier}}',
  '{{country}}',
  '{{currentDate}}',
  '{{platformName}}',
];

export default function TemplateManager() {
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CommunicationTemplate | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'announcement',
    type: 'email',
    subject: '',
    content: '',
    htmlContent: '',
    variables: [] as string[],
    defaultValues: {} as Record<string, any>,
    targetAudience: 'all',
    audienceCriteria: {} as Record<string, any>,
    requiresApproval: false,
  });

  const [previewData, setPreviewData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    companyName: 'Acme Corp',
    email: 'john.doe@acme.com',
    phone: '+1234567890',
    membershipTier: 'Gold',
    country: 'United States',
    currentDate: new Date().toLocaleDateString(),
    platformName: 'B2B Platform',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/communications/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = selectedTemplate 
        ? `/api/admin/communications/templates/${selectedTemplate.id}`
        : '/api/admin/communications/templates';
      
      const method = selectedTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchTemplates();
        setShowCreateDialog(false);
        setShowEditDialog(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/communications/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleDuplicate = async (template: CommunicationTemplate) => {
    setFormData({
      name: `${template.name} (Copy)`,
      description: template.description || '',
      category: template.category,
      type: template.type,
      subject: template.subject || '',
      content: template.content,
      htmlContent: template.htmlContent || '',
      variables: template.variables,
      defaultValues: template.defaultValues,
      targetAudience: template.targetAudience,
      audienceCriteria: template.audienceCriteria,
      requiresApproval: template.requiresApproval,
    });
    setSelectedTemplate(null);
    setShowCreateDialog(true);
  };

  const handleEdit = (template: CommunicationTemplate) => {
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category,
      type: template.type,
      subject: template.subject || '',
      content: template.content,
      htmlContent: template.htmlContent || '',
      variables: template.variables,
      defaultValues: template.defaultValues,
      targetAudience: template.targetAudience,
      audienceCriteria: template.audienceCriteria,
      requiresApproval: template.requiresApproval,
    });
    setSelectedTemplate(template);
    setShowEditDialog(true);
  };

  const handlePreview = (template: CommunicationTemplate) => {
    setSelectedTemplate(template);
    setShowPreviewDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'announcement',
      type: 'email',
      subject: '',
      content: '',
      htmlContent: '',
      variables: [],
      defaultValues: {},
      targetAudience: 'all',
      audienceCriteria: {},
      requiresApproval: false,
    });
    setSelectedTemplate(null);
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newText = before + variable + after;
      
      setFormData(prev => ({ ...prev, content: newText }));
      
      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const renderPreviewContent = (content: string) => {
    let previewContent = content;
    Object.entries(previewData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      previewContent = previewContent.replace(regex, String(value));
    });
    return previewContent;
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = TEMPLATE_TYPES.find(t => t.value === type);
    if (typeConfig) {
      const Icon = typeConfig.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const filteredTemplates = templates.filter(template => {
    if (activeTab === 'all') return true;
    return template.type === activeTab;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Template Manager</h1>
          <p className="text-gray-600">Create and manage communication templates</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="push">Push</TabsTrigger>
          <TabsTrigger value="in_app">In-App</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(template.type)}
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      {template.isSystemTemplate && (
                        <Badge variant="secondary" className="text-xs">System</Badge>
                      )}
                      <Badge 
                        variant={template.isActive ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {template.description && (
                    <p className="text-sm text-gray-600">{template.description}</p>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="capitalize">
                      {template.category.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {template.targetAudience}
                    </Badge>
                  </div>

                  {template.subject && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Subject:</p>
                      <p className="text-sm font-medium">{template.subject}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Content Preview:</p>
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {template.content.substring(0, 100)}...
                    </p>
                  </div>

                  {template.variables.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Variables:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.slice(0, 3).map((variable) => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                        {template.variables.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.variables.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(template.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePreview(template)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDuplicate(template)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      {!template.isSystemTemplate && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(template)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(template.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600 mb-4">
                {activeTab === 'all' 
                  ? 'Create your first communication template to get started.'
                  : `No ${activeTab} templates found. Create one to get started.`
                }
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Template Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Select
                  value={formData.targetAudience}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, targetAudience: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_AUDIENCES.map((audience) => (
                      <SelectItem key={audience.value} value={audience.value}>
                        {audience.label}
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

            {(formData.type === 'email' || formData.type === 'push') && (
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={8}
                  required
                />
              </div>
              <div>
                <Label>Variables</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {COMMON_VARIABLES.map((variable) => (
                    <Button
                      key={variable}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => insertVariable(variable)}
                    >
                      <Code className="h-3 w-3 mr-1" />
                      {variable}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {formData.type === 'email' && (
              <div>
                <Label htmlFor="htmlContent">HTML Content (Optional)</Label>
                <Textarea
                  id="htmlContent"
                  value={formData.htmlContent}
                  onChange={(e) => setFormData(prev => ({ ...prev, htmlContent: e.target.value }))}
                  rows={6}
                  placeholder="Rich HTML version of the content..."
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="requiresApproval"
                checked={formData.requiresApproval}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requiresApproval: checked }))}
              />
              <Label htmlFor="requiresApproval">Requires approval before use</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowCreateDialog(false);
                  setShowEditDialog(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {selectedTemplate ? 'Update Template' : 'Create Template'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getTypeIcon(selectedTemplate.type)}
                <h3 className="font-semibold">{selectedTemplate.name}</h3>
                <Badge variant="outline" className="capitalize">
                  {selectedTemplate.type}
                </Badge>
              </div>

              {selectedTemplate.subject && (
                <div>
                  <Label className="text-sm font-medium">Subject:</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded">
                    {renderPreviewContent(selectedTemplate.subject)}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Content:</Label>
                <div className="text-sm bg-gray-50 p-4 rounded whitespace-pre-wrap">
                  {renderPreviewContent(selectedTemplate.content)}
                </div>
              </div>

              {selectedTemplate.htmlContent && (
                <div>
                  <Label className="text-sm font-medium">HTML Preview:</Label>
                  <div 
                    className="text-sm bg-white border p-4 rounded"
                    dangerouslySetInnerHTML={{ 
                      __html: renderPreviewContent(selectedTemplate.htmlContent) 
                    }}
                  />
                </div>
              )}

              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  This preview uses sample data. Actual content will be personalized for each recipient.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}