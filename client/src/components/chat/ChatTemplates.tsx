import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Star,
  Clock,
  Tag,
  Copy,
  Send,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatTemplatesProps {
  userRole: 'buyer' | 'supplier' | 'admin';
  userId: string;
  onTemplateSelect?: (template: ChatTemplate) => void;
  isModal?: boolean;
  onClose?: () => void;
}

interface ChatTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  tags: string[];
  isDefault: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface QuickResponse {
  id: string;
  text: string;
  category: string;
  shortcut: string;
  usageCount: number;
}

const defaultCategories = [
  'greeting',
  'inquiry_response',
  'quotation',
  'order_confirmation',
  'shipping',
  'support',
  'closing',
  'follow_up'
];

const quickResponseCategories = [
  'acknowledgment',
  'questions',
  'requests',
  'confirmations',
  'apologies'
];

export default function ChatTemplates({ 
  userRole, 
  userId, 
  onTemplateSelect, 
  isModal = false,
  onClose 
}: ChatTemplatesProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'quick_responses'>('templates');
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showCreateQuickResponse, setShowCreateQuickResponse] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChatTemplate | null>(null);
  const [editingQuickResponse, setEditingQuickResponse] = useState<QuickResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Template form state
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateTags, setTemplateTags] = useState('');
  
  // Quick response form state
  const [responseText, setResponseText] = useState('');
  const [responseCategory, setResponseCategory] = useState('');
  const [responseShortcut, setResponseShortcut] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/chat/templates', userRole],
    queryFn: () => apiRequest('GET', `/api/chat/templates?role=${userRole}`),
  });

  // Fetch quick responses
  const { data: quickResponsesData, isLoading: quickResponsesLoading } = useQuery({
    queryKey: ['/api/chat/quick-responses', userRole],
    queryFn: () => apiRequest('GET', `/api/chat/quick-responses?role=${userRole}`),
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (data: {
      name: string;
      content: string;
      category: string;
      tags: string[];
    }) => apiRequest('POST', '/api/chat/templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/templates'] });
      resetTemplateForm();
      setShowCreateTemplate(false);
      toast({
        title: "Template created",
        description: "Chat template has been created successfully",
      });
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: (data: {
      id: string;
      name: string;
      content: string;
      category: string;
      tags: string[];
    }) => apiRequest('PUT', `/api/chat/templates/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/templates'] });
      resetTemplateForm();
      setEditingTemplate(null);
      toast({
        title: "Template updated",
        description: "Chat template has been updated successfully",
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) => apiRequest('DELETE', `/api/chat/templates/${templateId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/templates'] });
      toast({
        title: "Template deleted",
        description: "Chat template has been deleted successfully",
      });
    }
  });

  // Create quick response mutation
  const createQuickResponseMutation = useMutation({
    mutationFn: (data: {
      text: string;
      category: string;
      shortcut: string;
    }) => apiRequest('POST', '/api/chat/quick-responses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/quick-responses'] });
      resetQuickResponseForm();
      setShowCreateQuickResponse(false);
      toast({
        title: "Quick response created",
        description: "Quick response has been created successfully",
      });
    }
  });

  const templates = (templatesData as any)?.templates || [];
  const quickResponses = (quickResponsesData as any)?.quickResponses || [];

  const resetTemplateForm = () => {
    setTemplateName('');
    setTemplateContent('');
    setTemplateCategory('');
    setTemplateTags('');
  };

  const resetQuickResponseForm = () => {
    setResponseText('');
    setResponseCategory('');
    setResponseShortcut('');
  };

  const handleEditTemplate = (template: ChatTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateContent(template.content);
    setTemplateCategory(template.category);
    setTemplateTags(template.tags.join(', '));
    setShowCreateTemplate(true);
  };

  const handleSaveTemplate = () => {
    const templateData = {
      name: templateName.trim(),
      content: templateContent.trim(),
      category: templateCategory,
      tags: templateTags.split(',').map(tag => tag.trim()).filter(Boolean)
    };

    if (!templateData.name || !templateData.content) {
      toast({
        title: "Missing information",
        description: "Please provide template name and content",
        variant: "destructive"
      });
      return;
    }

    if (editingTemplate) {
      updateTemplateMutation.mutate({ ...templateData, id: editingTemplate.id });
    } else {
      createTemplateMutation.mutate(templateData);
    }
  };

  const handleSaveQuickResponse = () => {
    const responseData = {
      text: responseText.trim(),
      category: responseCategory,
      shortcut: responseShortcut.trim()
    };

    if (!responseData.text || !responseData.shortcut) {
      toast({
        title: "Missing information",
        description: "Please provide response text and shortcut",
        variant: "destructive"
      });
      return;
    }

    createQuickResponseMutation.mutate(responseData);
  };

  const handleUseTemplate = (template: ChatTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
      // Update usage count
      apiRequest('POST', `/api/chat/templates/${template.id}/use`);
    }
  };

  const handleCopyTemplate = (template: ChatTemplate) => {
    navigator.clipboard.writeText(template.content);
    toast({
      title: "Copied to clipboard",
      description: "Template content has been copied",
    });
  };

  // Filter templates and quick responses
  const filteredTemplates = templates.filter((template: ChatTemplate) => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const filteredQuickResponses = quickResponses.filter((response: QuickResponse) => {
    const matchesSearch = !searchQuery || 
      response.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      response.shortcut.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || response.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const TemplateCard = ({ template }: { template: ChatTemplate }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-1">{template.name}</h4>
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {template.category}
              </Badge>
              {template.isDefault && (
                <Badge variant="secondary" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Default
                </Badge>
              )}
              <span className="text-xs text-gray-500">
                Used {template.usageCount} times
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleCopyTemplate(template)}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEditTemplate(template)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => deleteTemplateMutation.mutate(template.id)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
          {template.content}
        </p>
        
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {template.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            <Clock className="h-3 w-3 inline mr-1" />
            {new Date(template.updatedAt).toLocaleDateString()}
          </span>
          <Button
            size="sm"
            onClick={() => handleUseTemplate(template)}
            className="h-7"
          >
            <Send className="h-3 w-3 mr-1" />
            Use
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const QuickResponseCard = ({ response }: { response: QuickResponse }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {response.shortcut}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {response.category}
              </Badge>
            </div>
            <p className="text-sm text-gray-900">{response.text}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (onTemplateSelect) {
                onTemplateSelect({
                  id: response.id,
                  name: response.shortcut,
                  content: response.text,
                  category: response.category,
                  tags: [],
                  isDefault: false,
                  usageCount: response.usageCount,
                  createdBy: userId,
                  createdAt: '',
                  updatedAt: ''
                });
              }
            }}
            className="h-7"
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>
        <div className="text-xs text-gray-500">
          Used {response.usageCount} times
        </div>
      </CardContent>
    </Card>
  );

  const content = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
            Chat Templates & Quick Responses
          </h2>
          {isModal && onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-4">
          <Button
            variant={activeTab === 'templates' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('templates')}
          >
            Templates
          </Button>
          <Button
            variant={activeTab === 'quick_responses' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('quick_responses')}
          >
            Quick Responses
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={`Search ${activeTab === 'templates' ? 'templates' : 'quick responses'}...`}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {(activeTab === 'templates' ? defaultCategories : quickResponseCategories).map(category => (
                <SelectItem key={category} value={category}>
                  {category.replace('_', ' ').toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              if (activeTab === 'templates') {
                setShowCreateTemplate(true);
              } else {
                setShowCreateQuickResponse(true);
              }
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {activeTab === 'templates' ? 'Template' : 'Response'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'templates' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template: ChatTemplate) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredQuickResponses.map((response: QuickResponse) => (
              <QuickResponseCard key={response.id} response={response} />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Template Modal */}
      {showCreateTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="border-b">
              <CardTitle>
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <Select value={templateCategory} onValueChange={setTemplateCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <Textarea
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  placeholder="Enter template content..."
                  rows={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <Input
                  value={templateTags}
                  onChange={(e) => setTemplateTags(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateTemplate(false);
                    setEditingTemplate(null);
                    resetTemplateForm();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate}>
                  {editingTemplate ? 'Update' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Quick Response Modal */}
      {showCreateQuickResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="border-b">
              <CardTitle>Create Quick Response</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Response Text *
                </label>
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Enter response text..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shortcut *
                </label>
                <Input
                  value={responseShortcut}
                  onChange={(e) => setResponseShortcut(e.target.value)}
                  placeholder="e.g., /thanks, /hello"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <Select value={responseCategory} onValueChange={setResponseCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {quickResponseCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateQuickResponse(false);
                    resetQuickResponseForm();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveQuickResponse}>
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-6xl h-[90vh]">
          {content}
        </Card>
      </div>
    );
  }

  return content;
}