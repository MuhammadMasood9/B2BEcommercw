import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  HelpCircle,
  Book,
  Video,
  ExternalLink,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronRight,
  Play,
  FileText,
  MessageCircle
} from "lucide-react";
import { useLocation } from "wouter";

// Help content structure
interface HelpContent {
  id: string;
  title: string;
  description: string;
  type: 'tip' | 'guide' | 'video' | 'warning' | 'info';
  content: string;
  actions?: {
    label: string;
    url?: string;
    action?: () => void;
  }[];
  relatedLinks?: {
    title: string;
    url: string;
    type: 'guide' | 'video' | 'api';
  }[];
}

// Page-specific help content mapping
const pageHelpContent: Record<string, HelpContent[]> = {
  '/admin': [
    {
      id: 'dashboard-overview',
      title: 'Dashboard Overview',
      description: 'Understanding your admin dashboard metrics and navigation',
      type: 'info',
      content: 'The admin dashboard provides a comprehensive overview of your platform\'s performance. Key metrics include revenue, active suppliers, pending approvals, and system health indicators.',
      actions: [
        { label: 'View Full Guide', url: '/admin/docs/dashboard-overview' },
        { label: 'Watch Video Tutorial', url: '/admin/docs/dashboard-walkthrough-video' }
      ],
      relatedLinks: [
        { title: 'Customizing Your Dashboard', url: '/admin/docs/dashboard-customization', type: 'guide' },
        { title: 'Understanding KPIs', url: '/admin/docs/kpi-explanation', type: 'guide' }
      ]
    },
    {
      id: 'quick-actions',
      title: 'Quick Actions',
      description: 'Access frequently used admin functions quickly',
      type: 'tip',
      content: 'Use the Quick Actions panel to jump directly to pending tasks like supplier approvals, product reviews, and payout processing.',
      actions: [
        { label: 'Learn More', url: '/admin/docs/quick-actions' }
      ]
    },
    {
      id: 'real-time-alerts',
      title: 'Real-time Alerts',
      description: 'Stay informed about critical system events',
      type: 'warning',
      content: 'Critical alerts require immediate attention. Click on any alert to view details and take appropriate action.',
      actions: [
        { label: 'Alert Management Guide', url: '/admin/docs/alert-management' }
      ]
    }
  ],
  '/admin/suppliers': [
    {
      id: 'supplier-management',
      title: 'Supplier Management',
      description: 'Efficiently manage your platform suppliers',
      type: 'info',
      content: 'This page shows all suppliers on your platform. Use filters to find specific suppliers, and bulk actions to manage multiple suppliers at once.',
      actions: [
        { label: 'Supplier Management Guide', url: '/admin/docs/supplier-management' },
        { label: 'Bulk Operations Tutorial', url: '/admin/docs/bulk-supplier-operations' }
      ]
    },
    {
      id: 'supplier-verification',
      title: 'Verification Status',
      description: 'Understanding supplier verification levels',
      type: 'tip',
      content: 'Verification badges indicate the level of documentation and compliance checks completed for each supplier.',
      relatedLinks: [
        { title: 'Verification Process', url: '/admin/docs/supplier-verification', type: 'guide' }
      ]
    }
  ],
  '/admin/suppliers/pending': [
    {
      id: 'approval-process',
      title: 'Supplier Approval Process',
      description: 'Review and approve new supplier applications',
      type: 'info',
      content: 'Review each application carefully, checking business documents, compliance status, and risk assessment before making approval decisions.',
      actions: [
        { label: 'Approval Workflow Guide', url: '/admin/docs/supplier-approval' },
        { label: 'Risk Assessment Tutorial', url: '/admin/docs/risk-assessment' }
      ]
    },
    {
      id: 'document-verification',
      title: 'Document Verification',
      description: 'Best practices for reviewing supplier documents',
      type: 'tip',
      content: 'Verify business registration, tax documents, and compliance certificates. Look for consistency in business names and addresses.',
      actions: [
        { label: 'Document Checklist', url: '/admin/docs/document-verification' }
      ]
    }
  ],
  '/admin/financial': [
    {
      id: 'financial-overview',
      title: 'Financial Management',
      description: 'Manage platform finances and supplier payouts',
      type: 'info',
      content: 'Monitor revenue, configure commission rates, and process supplier payouts from this central financial hub.',
      actions: [
        { label: 'Financial Management Guide', url: '/admin/docs/financial-management' }
      ]
    },
    {
      id: 'commission-rates',
      title: 'Commission Configuration',
      description: 'Setting up commission rates for different supplier tiers',
      type: 'tip',
      content: 'Commission rates can be set globally, by category, or for individual suppliers. Changes apply to new transactions only.',
      actions: [
        { label: 'Commission Setup Guide', url: '/admin/docs/commission-management' }
      ]
    }
  ],
  '/admin/monitoring': [
    {
      id: 'system-monitoring',
      title: 'System Monitoring',
      description: 'Monitor platform health and performance',
      type: 'info',
      content: 'Track system performance, monitor error rates, and receive alerts about potential issues before they impact users.',
      actions: [
        { label: 'Monitoring Guide', url: '/admin/docs/monitoring-dashboard' }
      ]
    },
    {
      id: 'performance-metrics',
      title: 'Understanding Performance Metrics',
      description: 'Key metrics to monitor for platform health',
      type: 'tip',
      content: 'Focus on response times, error rates, and system load. Set up alerts for metrics that exceed normal thresholds.',
      relatedLinks: [
        { title: 'Performance Optimization', url: '/admin/docs/performance-optimization', type: 'guide' }
      ]
    }
  ]
};

// Common help topics that appear on all pages
const commonHelpTopics: HelpContent[] = [
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Speed up your workflow with keyboard shortcuts',
    type: 'tip',
    content: 'Press Ctrl+K (Cmd+K on Mac) to open the command palette. Use Tab to navigate between form fields quickly.',
    actions: [
      { label: 'View All Shortcuts', url: '/admin/docs/keyboard-shortcuts' }
    ]
  },
  {
    id: 'getting-help',
    title: 'Getting Help',
    description: 'Need additional assistance?',
    type: 'info',
    content: 'Contact our support team for personalized assistance with complex admin tasks or technical issues.',
    actions: [
      { label: 'Contact Support', url: '/admin/support' },
      { label: 'Browse Documentation', url: '/admin/documentation' }
    ]
  }
];

interface ContextualHelpProps {
  className?: string;
  variant?: 'button' | 'icon' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  showCommonTopics?: boolean;
}

export function ContextualHelp({ 
  className = "", 
  variant = 'button',
  size = 'md',
  showCommonTopics = true 
}: ContextualHelpProps) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<HelpContent | null>(null);

  // Get help content for current page
  const currentPageHelp = pageHelpContent[location] || [];
  const allHelpContent = showCommonTopics 
    ? [...currentPageHelp, ...commonHelpTopics]
    : currentPageHelp;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tip': return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'guide': return <Book className="h-4 w-4 text-green-500" />;
      case 'video': return <Video className="h-4 w-4 text-purple-500" />;
      default: return <HelpCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tip': return 'border-yellow-200 bg-yellow-50';
      case 'warning': return 'border-red-200 bg-red-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      case 'guide': return 'border-green-200 bg-green-50';
      case 'video': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const renderHelpContent = (content: HelpContent) => (
    <Card key={content.id} className={`${getTypeColor(content.type)} border cursor-pointer hover:shadow-sm transition-shadow`}
          onClick={() => setSelectedTopic(content)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {getTypeIcon(content.type)}
          <div className="flex-1">
            <h4 className="font-medium mb-1">{content.title}</h4>
            <p className="text-sm text-muted-foreground mb-2">{content.description}</p>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>Click to learn more</span>
              <ChevronRight className="h-3 w-3 ml-1" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTrigger = () => {
    switch (variant) {
      case 'icon':
        return (
          <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${className}`}>
            <HelpCircle className="h-4 w-4" />
          </Button>
        );
      case 'inline':
        return (
          <Button variant="ghost" className={`h-auto p-0 text-muted-foreground ${className}`}>
            <HelpCircle className="h-4 w-4 mr-1" />
            Help
          </Button>
        );
      default:
        return (
          <Button variant="outline" size={size === 'md' ? 'default' : size} className={className}>
            <HelpCircle className="h-4 w-4 mr-2" />
            Help
          </Button>
        );
    }
  };

  if (allHelpContent.length === 0) {
    return null;
  }

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {renderTrigger()}
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Help & Tips</h3>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Get help with this page
            </p>
          </div>
          
          <div className="max-h-96 overflow-y-auto p-4 space-y-3">
            {allHelpContent.map(renderHelpContent)}
            
            <Separator />
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a href="/admin/documentation">
                  <Book className="h-3 w-3 mr-1" />
                  All Docs
                </a>
              </Button>
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a href="/admin/support">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Support
                </a>
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Detailed Help Dialog */}
      <Dialog open={!!selectedTopic} onOpenChange={() => setSelectedTopic(null)}>
        <DialogContent className="max-w-2xl">
          {selectedTopic && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getTypeIcon(selectedTopic.type)}
                  {selectedTopic.title}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <p className="text-muted-foreground">{selectedTopic.description}</p>
                
                <div className={`p-4 rounded-lg border ${getTypeColor(selectedTopic.type)}`}>
                  <p>{selectedTopic.content}</p>
                </div>

                {selectedTopic.actions && selectedTopic.actions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Quick Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTopic.actions.map((action, index) => (
                        <Button key={index} variant="outline" size="sm" asChild>
                          <a href={action.url} target={action.url?.startsWith('http') ? '_blank' : '_self'}>
                            {action.url?.includes('video') && <Play className="h-3 w-3 mr-1" />}
                            {action.url?.includes('docs') && <FileText className="h-3 w-3 mr-1" />}
                            {action.url?.startsWith('http') && <ExternalLink className="h-3 w-3 mr-1" />}
                            {action.label}
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTopic.relatedLinks && selectedTopic.relatedLinks.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Related Resources</h4>
                    <div className="space-y-2">
                      {selectedTopic.relatedLinks.map((link, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded border">
                          <div className="flex items-center gap-2">
                            {link.type === 'video' && <Video className="h-4 w-4 text-purple-500" />}
                            {link.type === 'guide' && <Book className="h-4 w-4 text-green-500" />}
                            {link.type === 'api' && <ExternalLink className="h-4 w-4 text-blue-500" />}
                            <span className="text-sm">{link.title}</span>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={link.url}>
                              <ChevronRight className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Quick help tooltip component for specific UI elements
interface QuickHelpProps {
  content: string;
  title?: string;
  type?: 'tip' | 'info' | 'warning';
  children: React.ReactNode;
}

export function QuickHelp({ content, title, type = 'info', children }: QuickHelpProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tip': return <Lightbulb className="h-3 w-3 text-yellow-500" />;
      case 'warning': return <AlertTriangle className="h-3 w-3 text-red-500" />;
      default: return <CheckCircle className="h-3 w-3 text-blue-500" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80" side="top">
        <div className="space-y-2">
          {title && (
            <div className="flex items-center gap-2">
              {getTypeIcon(type)}
              <h4 className="font-medium">{title}</h4>
            </div>
          )}
          <p className="text-sm text-muted-foreground">{content}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}