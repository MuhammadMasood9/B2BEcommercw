import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle,
  Search,
  Book,
  Video,
  MessageCircle,
  ExternalLink,
  Star,
  Clock,
  ChevronRight,
  Play,
  FileText,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Bookmark,
  History,
  TrendingUp,
  Zap
} from "lucide-react";
import { useLocation } from "wouter";

// Help article structure
interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  type: 'article' | 'video' | 'tutorial' | 'faq';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  tags: string[];
  popular: boolean;
  lastUpdated: Date;
  relatedArticles?: string[];
  videoUrl?: string;
  steps?: {
    title: string;
    content: string;
    image?: string;
  }[];
}

// FAQ structure
interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  popular: boolean;
  tags: string[];
}

// Sample help articles
const helpArticles: HelpArticle[] = [
  {
    id: 'dashboard-navigation',
    title: 'Navigating the Admin Dashboard',
    content: 'Learn how to efficiently navigate through the admin dashboard and access key features.',
    category: 'Getting Started',
    type: 'tutorial',
    difficulty: 'beginner',
    estimatedTime: '5 min',
    tags: ['dashboard', 'navigation', 'basics'],
    popular: true,
    lastUpdated: new Date('2024-01-15'),
    steps: [
      {
        title: 'Dashboard Overview',
        content: 'The main dashboard provides a comprehensive view of your platform metrics including revenue, suppliers, and system health.'
      },
      {
        title: 'Navigation Menu',
        content: 'Use the left sidebar to access different admin sections. Click on items with arrows to expand sub-menus.'
      },
      {
        title: 'Quick Actions',
        content: 'The Quick Actions panel provides shortcuts to common tasks like approving suppliers and processing payouts.'
      }
    ]
  },
  {
    id: 'supplier-approval-guide',
    title: 'How to Approve Suppliers',
    content: 'Step-by-step guide to reviewing and approving new supplier applications.',
    category: 'Supplier Management',
    type: 'tutorial',
    difficulty: 'intermediate',
    estimatedTime: '10 min',
    tags: ['suppliers', 'approval', 'verification'],
    popular: true,
    lastUpdated: new Date('2024-01-12'),
    steps: [
      {
        title: 'Access Pending Applications',
        content: 'Navigate to Suppliers > Pending Approvals to see all applications waiting for review.'
      },
      {
        title: 'Review Application Details',
        content: 'Click on an application to view business documents, contact information, and risk assessment.'
      },
      {
        title: 'Verify Documents',
        content: 'Check business registration, tax documents, and compliance certificates for authenticity.'
      },
      {
        title: 'Make Decision',
        content: 'Click Approve to accept the application or Reject with a reason for denial.'
      }
    ]
  },
  {
    id: 'commission-setup',
    title: 'Setting Up Commission Rates',
    content: 'Configure commission rates for different supplier tiers and product categories.',
    category: 'Financial Management',
    type: 'article',
    difficulty: 'intermediate',
    estimatedTime: '8 min',
    tags: ['commission', 'rates', 'financial'],
    popular: false,
    lastUpdated: new Date('2024-01-10')
  },
  {
    id: 'monitoring-system-health',
    title: 'Monitoring System Health',
    content: 'Learn how to monitor platform performance and respond to system alerts.',
    category: 'System Monitoring',
    type: 'article',
    difficulty: 'advanced',
    estimatedTime: '15 min',
    tags: ['monitoring', 'performance', 'alerts'],
    popular: true,
    lastUpdated: new Date('2024-01-08')
  },
  {
    id: 'bulk-operations-video',
    title: 'Bulk Operations Tutorial',
    content: 'Video tutorial showing how to perform bulk operations on suppliers and products.',
    category: 'Advanced Features',
    type: 'video',
    difficulty: 'advanced',
    estimatedTime: '12 min',
    tags: ['bulk', 'operations', 'efficiency'],
    popular: false,
    lastUpdated: new Date('2024-01-05'),
    videoUrl: '/admin/videos/bulk-operations.mp4'
  }
];

// Sample FAQs
const faqs: FAQ[] = [
  {
    id: 'reset-password',
    question: 'How do I reset my admin password?',
    answer: 'Go to your profile settings and click "Change Password". You\'ll need to enter your current password and then your new password twice.',
    category: 'Account Management',
    popular: true,
    tags: ['password', 'security', 'account']
  },
  {
    id: 'supplier-not-appearing',
    question: 'Why isn\'t a supplier appearing in my list?',
    answer: 'Check your filters and search terms. The supplier might be in a different status (pending, suspended) or you might not have the right permissions to view them.',
    category: 'Supplier Management',
    popular: true,
    tags: ['suppliers', 'visibility', 'filters']
  },
  {
    id: 'commission-calculation',
    question: 'How are commission rates calculated?',
    answer: 'Commission rates are applied to the order total after taxes. Different rates can apply based on supplier tier, product category, or individual supplier agreements.',
    category: 'Financial Management',
    popular: false,
    tags: ['commission', 'calculation', 'rates']
  },
  {
    id: 'export-reports',
    question: 'Can I export reports to Excel?',
    answer: 'Yes, most reports have an export button that allows you to download data in Excel, CSV, or PDF format.',
    category: 'Reports',
    popular: true,
    tags: ['export', 'reports', 'excel']
  },
  {
    id: 'system-alerts',
    question: 'What do the different alert colors mean?',
    answer: 'Red alerts are critical and require immediate attention, yellow are warnings that should be addressed soon, and blue are informational updates.',
    category: 'System Monitoring',
    popular: false,
    tags: ['alerts', 'colors', 'monitoring']
  }
];

interface InAppHelpSystemProps {
  className?: string;
}

export function InAppHelpSystem({ className = "" }: InAppHelpSystemProps) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Set<string>>(new Set());

  // Filter articles based on search and category
  const filteredArticles = helpArticles.filter(article => {
    const matchesSearch = searchQuery === "" || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Filter FAQs based on search
  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = [...new Set([...helpArticles.map(a => a.category), ...faqs.map(f => f.category)])];

  // Popular and recent content
  const popularArticles = helpArticles.filter(article => article.popular);
  const recentArticles = recentlyViewed
    .map(id => helpArticles.find(article => article.id === id))
    .filter(Boolean) as HelpArticle[];

  const viewArticle = (articleId: string) => {
    setRecentlyViewed(prev => [
      articleId,
      ...prev.filter(id => id !== articleId)
    ].slice(0, 5));
  };

  const toggleBookmark = (articleId: string) => {
    setBookmarkedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'tutorial': return <Play className="h-4 w-4" />;
      case 'article': return <FileText className="h-4 w-4" />;
      case 'faq': return <HelpCircle className="h-4 w-4" />;
      default: return <Book className="h-4 w-4" />;
    }
  };

  const renderArticleCard = (article: HelpArticle) => (
    <Card key={article.id} className="hover:shadow-sm transition-shadow cursor-pointer"
          onClick={() => viewArticle(article.id)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {getTypeIcon(article.type)}
            <Badge variant="outline" className={getDifficultyColor(article.difficulty)}>
              {article.difficulty}
            </Badge>
            {article.popular && (
              <Badge variant="secondary">
                <Star className="h-3 w-3 mr-1" />
                Popular
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              toggleBookmark(article.id);
            }}
          >
            <Bookmark 
              className={`h-4 w-4 ${bookmarkedArticles.has(article.id) ? 'fill-current text-blue-500' : ''}`} 
            />
          </Button>
        </div>
        
        <h4 className="font-medium mb-1">{article.title}</h4>
        <p className="text-sm text-muted-foreground mb-2">{article.content}</p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            {article.estimatedTime}
          </div>
          <ChevronRight className="h-3 w-3" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className={className}>
          <HelpCircle className="h-4 w-4 mr-2" />
          Help
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Help Center
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search help articles and FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          <Tabs defaultValue="articles" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="articles">Articles</TabsTrigger>
              <TabsTrigger value="faqs">FAQs</TabsTrigger>
              <TabsTrigger value="quick">Quick Help</TabsTrigger>
            </TabsList>

            <TabsContent value="articles" className="space-y-4 mt-4">
              {/* Popular Articles */}
              {searchQuery === "" && selectedCategory === "all" && popularArticles.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <h3 className="font-medium">Popular Articles</h3>
                  </div>
                  <div className="space-y-2">
                    {popularArticles.slice(0, 3).map(renderArticleCard)}
                  </div>
                  <Separator className="my-4" />
                </div>
              )}

              {/* Recent Articles */}
              {searchQuery === "" && selectedCategory === "all" && recentArticles.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <History className="h-4 w-4 text-green-500" />
                    <h3 className="font-medium">Recently Viewed</h3>
                  </div>
                  <div className="space-y-2">
                    {recentArticles.map(renderArticleCard)}
                  </div>
                  <Separator className="my-4" />
                </div>
              )}

              {/* All Articles */}
              <div>
                <h3 className="font-medium mb-3">
                  {searchQuery || selectedCategory !== "all" ? "Search Results" : "All Articles"}
                  <span className="text-sm text-muted-foreground ml-2">
                    ({filteredArticles.length})
                  </span>
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredArticles.map(renderArticleCard)}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="faqs" className="space-y-4 mt-4">
              <div>
                <h3 className="font-medium mb-3">
                  Frequently Asked Questions
                  <span className="text-sm text-muted-foreground ml-2">
                    ({filteredFAQs.length})
                  </span>
                </h3>
                <Accordion type="single" collapsible className="w-full">
                  {filteredFAQs.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          {faq.popular && <Star className="h-3 w-3 text-yellow-500" />}
                          {faq.question}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          <p className="text-sm">{faq.answer}</p>
                          <div className="flex flex-wrap gap-1">
                            {faq.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </TabsContent>

            <TabsContent value="quick" className="space-y-4 mt-4">
              <div className="space-y-4">
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium mb-1">Quick Start</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          New to the admin panel? Start with these essential guides.
                        </p>
                        <div className="space-y-1">
                          <Button variant="link" className="h-auto p-0 text-sm" asChild>
                            <a href="/admin/docs/dashboard-overview">Dashboard Overview</a>
                          </Button>
                          <Button variant="link" className="h-auto p-0 text-sm" asChild>
                            <a href="/admin/docs/first-time-setup">First Time Setup</a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium mb-1">Pro Tips</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Keyboard shortcuts and efficiency tips for power users.
                        </p>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+K</kbd>
                            <span className="ml-2">Open command palette</span>
                          </div>
                          <div className="text-sm">
                            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Tab</kbd>
                            <span className="ml-2">Navigate between fields</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium mb-1">Common Issues</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Quick solutions to frequently encountered problems.
                        </p>
                        <Button variant="link" className="h-auto p-0 text-sm" asChild>
                          <a href="/admin/docs/troubleshooting">View Troubleshooting Guide</a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" asChild>
                    <a href="/admin/documentation">
                      <Book className="h-4 w-4 mr-2" />
                      Full Documentation
                    </a>
                  </Button>
                  <Button variant="outline" className="flex-1" asChild>
                    <a href="/admin/support">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Support
                    </a>
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}