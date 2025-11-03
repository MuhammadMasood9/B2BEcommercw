import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import Breadcrumb from "@/components/Breadcrumb";
import {
  Book,
  Search,
  FileText,
  Video,
  HelpCircle,
  ExternalLink,
  Download,
  Star,
  Clock,
  User,
  Tag,
  ChevronRight,
  BookOpen,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Play,
  Bookmark,
  Share,
  Filter,
  Grid,
  List,
  TrendingUp
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Documentation structure
interface DocumentationItem {
  id: string;
  title: string;
  description: string;
  type: 'guide' | 'tutorial' | 'reference' | 'troubleshooting' | 'video' | 'api';
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  lastUpdated: Date;
  author: string;
  tags: string[];
  featured: boolean;
  popular: boolean;
  url?: string;
  content?: string;
  videoUrl?: string;
  downloadUrl?: string;
}

const documentationItems: DocumentationItem[] = [
  // Getting Started
  {
    id: 'admin-overview',
    title: 'Admin Dashboard Overview',
    description: 'Complete guide to understanding and navigating the admin dashboard',
    type: 'guide',
    category: 'Getting Started',
    difficulty: 'beginner',
    estimatedTime: '10 min',
    lastUpdated: new Date('2024-01-15'),
    author: 'Platform Team',
    tags: ['dashboard', 'overview', 'navigation'],
    featured: true,
    popular: true,
    url: '/admin/docs/dashboard-overview'
  },
  {
    id: 'first-time-setup',
    title: 'First Time Admin Setup',
    description: 'Step-by-step guide for new administrators to configure their account and preferences',
    type: 'tutorial',
    category: 'Getting Started',
    difficulty: 'beginner',
    estimatedTime: '15 min',
    lastUpdated: new Date('2024-01-10'),
    author: 'Platform Team',
    tags: ['setup', 'configuration', 'onboarding'],
    featured: true,
    popular: false,
    url: '/admin/docs/first-time-setup'
  },

  // Supplier Management
  {
    id: 'supplier-approval-process',
    title: 'Supplier Approval Workflow',
    description: 'Complete guide to reviewing and approving supplier applications',
    type: 'guide',
    category: 'Supplier Management',
    difficulty: 'intermediate',
    estimatedTime: '20 min',
    lastUpdated: new Date('2024-01-12'),
    author: 'Operations Team',
    tags: ['suppliers', 'approval', 'workflow', 'verification'],
    featured: true,
    popular: true,
    url: '/admin/docs/supplier-approval'
  },
  {
    id: 'supplier-performance-monitoring',
    title: 'Monitoring Supplier Performance',
    description: 'How to track and analyze supplier performance metrics',
    type: 'guide',
    category: 'Supplier Management',
    difficulty: 'intermediate',
    estimatedTime: '25 min',
    lastUpdated: new Date('2024-01-08'),
    author: 'Analytics Team',
    tags: ['suppliers', 'performance', 'metrics', 'monitoring'],
    featured: false,
    popular: true,
    url: '/admin/docs/supplier-performance'
  },
  {
    id: 'bulk-supplier-operations',
    title: 'Bulk Supplier Operations',
    description: 'Efficiently manage multiple suppliers with bulk operations',
    type: 'tutorial',
    category: 'Supplier Management',
    difficulty: 'advanced',
    estimatedTime: '30 min',
    lastUpdated: new Date('2024-01-05'),
    author: 'Operations Team',
    tags: ['suppliers', 'bulk', 'operations', 'efficiency'],
    featured: false,
    popular: false,
    url: '/admin/docs/bulk-supplier-operations'
  },

  // Financial Management
  {
    id: 'commission-management',
    title: 'Commission Rate Management',
    description: 'Configure and manage commission rates for different supplier tiers',
    type: 'guide',
    category: 'Financial Management',
    difficulty: 'intermediate',
    estimatedTime: '20 min',
    lastUpdated: new Date('2024-01-14'),
    author: 'Finance Team',
    tags: ['commission', 'rates', 'financial', 'configuration'],
    featured: true,
    popular: true,
    url: '/admin/docs/commission-management'
  },
  {
    id: 'payout-processing',
    title: 'Processing Supplier Payouts',
    description: 'Step-by-step guide to processing and managing supplier payouts',
    type: 'tutorial',
    category: 'Financial Management',
    difficulty: 'intermediate',
    estimatedTime: '25 min',
    lastUpdated: new Date('2024-01-11'),
    author: 'Finance Team',
    tags: ['payouts', 'payments', 'processing', 'suppliers'],
    featured: false,
    popular: true,
    url: '/admin/docs/payout-processing'
  },

  // Content Moderation
  {
    id: 'product-approval-workflow',
    title: 'Product Approval Process',
    description: 'Review and approve supplier products efficiently',
    type: 'guide',
    category: 'Content Moderation',
    difficulty: 'intermediate',
    estimatedTime: '18 min',
    lastUpdated: new Date('2024-01-09'),
    author: 'Content Team',
    tags: ['products', 'approval', 'moderation', 'quality'],
    featured: false,
    popular: true,
    url: '/admin/docs/product-approval'
  },
  {
    id: 'content-quality-standards',
    title: 'Content Quality Standards',
    description: 'Understanding and enforcing platform content quality standards',
    type: 'reference',
    category: 'Content Moderation',
    difficulty: 'beginner',
    estimatedTime: '15 min',
    lastUpdated: new Date('2024-01-07'),
    author: 'Content Team',
    tags: ['quality', 'standards', 'guidelines', 'content'],
    featured: false,
    popular: false,
    url: '/admin/docs/content-quality'
  },

  // System Monitoring
  {
    id: 'monitoring-dashboard',
    title: 'System Monitoring Dashboard',
    description: 'Monitor platform health and performance metrics',
    type: 'guide',
    category: 'System Monitoring',
    difficulty: 'intermediate',
    estimatedTime: '22 min',
    lastUpdated: new Date('2024-01-13'),
    author: 'DevOps Team',
    tags: ['monitoring', 'performance', 'health', 'metrics'],
    featured: false,
    popular: true,
    url: '/admin/docs/monitoring-dashboard'
  },
  {
    id: 'alert-management',
    title: 'Managing System Alerts',
    description: 'Configure and respond to system alerts and notifications',
    type: 'tutorial',
    category: 'System Monitoring',
    difficulty: 'advanced',
    estimatedTime: '28 min',
    lastUpdated: new Date('2024-01-06'),
    author: 'DevOps Team',
    tags: ['alerts', 'notifications', 'monitoring', 'configuration'],
    featured: false,
    popular: false,
    url: '/admin/docs/alert-management'
  },

  // Troubleshooting
  {
    id: 'common-issues',
    title: 'Common Issues and Solutions',
    description: 'Quick solutions to frequently encountered admin problems',
    type: 'troubleshooting',
    category: 'Troubleshooting',
    difficulty: 'beginner',
    estimatedTime: '12 min',
    lastUpdated: new Date('2024-01-16'),
    author: 'Support Team',
    tags: ['troubleshooting', 'issues', 'solutions', 'faq'],
    featured: true,
    popular: true,
    url: '/admin/docs/common-issues'
  },
  {
    id: 'performance-optimization',
    title: 'Performance Optimization Tips',
    description: 'Best practices for optimizing admin dashboard performance',
    type: 'troubleshooting',
    category: 'Troubleshooting',
    difficulty: 'advanced',
    estimatedTime: '35 min',
    lastUpdated: new Date('2024-01-04'),
    author: 'DevOps Team',
    tags: ['performance', 'optimization', 'best-practices'],
    featured: false,
    popular: false,
    url: '/admin/docs/performance-optimization'
  },

  // Video Tutorials
  {
    id: 'dashboard-walkthrough-video',
    title: 'Admin Dashboard Walkthrough',
    description: 'Video tour of the admin dashboard and its key features',
    type: 'video',
    category: 'Video Tutorials',
    difficulty: 'beginner',
    estimatedTime: '12 min',
    lastUpdated: new Date('2024-01-15'),
    author: 'Training Team',
    tags: ['video', 'dashboard', 'walkthrough', 'tutorial'],
    featured: true,
    popular: true,
    videoUrl: '/admin/videos/dashboard-walkthrough.mp4'
  },
  {
    id: 'supplier-management-video',
    title: 'Supplier Management Masterclass',
    description: 'Comprehensive video guide to supplier management features',
    type: 'video',
    category: 'Video Tutorials',
    difficulty: 'intermediate',
    estimatedTime: '25 min',
    lastUpdated: new Date('2024-01-10'),
    author: 'Training Team',
    tags: ['video', 'suppliers', 'management', 'masterclass'],
    featured: false,
    popular: true,
    videoUrl: '/admin/videos/supplier-management.mp4'
  },

  // API Documentation
  {
    id: 'admin-api-reference',
    title: 'Admin API Reference',
    description: 'Complete API documentation for admin management endpoints',
    type: 'api',
    category: 'API Documentation',
    difficulty: 'advanced',
    estimatedTime: '45 min',
    lastUpdated: new Date('2024-01-17'),
    author: 'Development Team',
    tags: ['api', 'reference', 'endpoints', 'documentation'],
    featured: false,
    popular: false,
    url: '/admin/docs/api-reference'
  }
];

export default function AdminDocumentation() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set());

  // Filter and search functionality
  const filteredItems = documentationItems.filter(item => {
    const matchesSearch = searchQuery === "" || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesType = selectedType === "all" || item.type === selectedType;
    const matchesDifficulty = selectedDifficulty === "all" || item.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesType && matchesDifficulty;
  });

  // Get unique categories, types, and difficulties
  const categories = Array.from(new Set(documentationItems.map(item => item.category)));
  const types = Array.from(new Set(documentationItems.map(item => item.type)));
  const difficulties = Array.from(new Set(documentationItems.map(item => item.difficulty)));

  // Featured and popular items
  const featuredItems = documentationItems.filter(item => item.featured);
  const popularItems = documentationItems.filter(item => item.popular);

  const toggleBookmark = (itemId: string) => {
    setBookmarkedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
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
      case 'guide': return <Book className="h-4 w-4" />;
      case 'tutorial': return <Play className="h-4 w-4" />;
      case 'reference': return <FileText className="h-4 w-4" />;
      case 'troubleshooting': return <AlertTriangle className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'api': return <ExternalLink className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

  const renderDocumentationCard = (item: DocumentationItem) => (
    <Card key={item.id} className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getTypeIcon(item.type)}
            <Badge variant="outline" className={getDifficultyColor(item.difficulty)}>
              {item.difficulty}
            </Badge>
            {item.featured && (
              <Badge variant="secondary">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => toggleBookmark(item.id)}
          >
            <Bookmark 
              className={`h-4 w-4 ${bookmarkedItems.has(item.id) ? 'fill-current text-blue-500' : ''}`} 
            />
          </Button>
        </div>
        <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{item.description}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {item.estimatedTime}
            </div>
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {item.author}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{item.tags.length - 3}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              Updated {item.lastUpdated.toLocaleDateString()}
            </span>
            <div className="flex gap-2">
              {item.downloadUrl && (
                <Button variant="outline" size="sm">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              )}
              <Button size="sm" asChild>
                <Link href={item.url || '#'}>
                  {item.type === 'video' ? 'Watch' : 'Read'}
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderDocumentationList = (item: DocumentationItem) => (
    <Card key={item.id} className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {getTypeIcon(item.type)}
              <h3 className="font-semibold">{item.title}</h3>
              <Badge variant="outline" className={getDifficultyColor(item.difficulty)}>
                {item.difficulty}
              </Badge>
              {item.featured && (
                <Badge variant="secondary">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{item.estimatedTime}</span>
              <span>{item.author}</span>
              <span>Updated {item.lastUpdated.toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => toggleBookmark(item.id)}
            >
              <Bookmark 
                className={`h-4 w-4 ${bookmarkedItems.has(item.id) ? 'fill-current text-blue-500' : ''}`} 
              />
            </Button>
            <Button size="sm" asChild>
              <Link href={item.url || '#'}>
                {item.type === 'video' ? 'Watch' : 'Read'}
                <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-8 space-y-6">
      <Breadcrumb items={[
        { label: "Admin Dashboard", href: "/admin" },
        { label: "Documentation" }
      ]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Documentation</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive guides, tutorials, and references for platform administration
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
          <Button variant="outline">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  {difficulties.map(difficulty => (
                    <SelectItem key={difficulty} value={difficulty}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access Sections */}
      {searchQuery === "" && selectedCategory === "all" && selectedType === "all" && selectedDifficulty === "all" && (
        <div className="space-y-6">
          {/* Featured Content */}
          {featuredItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-yellow-500" />
                <h2 className="text-xl font-semibold">Featured Documentation</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredItems.slice(0, 3).map(renderDocumentationCard)}
              </div>
            </div>
          )}

          {/* Popular Content */}
          {popularItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold">Popular Guides</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularItems.slice(0, 3).map(renderDocumentationCard)}
              </div>
            </div>
          )}

          <Separator />
        </div>
      )}

      {/* All Documentation */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {searchQuery || selectedCategory !== "all" || selectedType !== "all" || selectedDifficulty !== "all" 
              ? "Search Results" 
              : "All Documentation"
            }
          </h2>
          <span className="text-sm text-muted-foreground">
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {filteredItems.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
          }>
            {filteredItems.map(item => 
              viewMode === 'grid' ? renderDocumentationCard(item) : renderDocumentationList(item)
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No documentation found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
              <Button variant="outline" onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedType("all");
                setSelectedDifficulty("all");
              }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}