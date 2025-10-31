import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/Breadcrumb';
import ProductReviewQueue from '@/components/admin/ProductReviewQueue';
import ContentAnalyzer from '@/components/admin/ContentAnalyzer';
import QualityControl from '@/components/admin/QualityControl';
import BulkModeration from '@/components/admin/BulkModeration';
import { 
  Eye, 
  Zap, 
  Target, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Settings
} from 'lucide-react';

// ==================== INTERFACES ====================

interface ModerationStats {
  pendingReviews: number;
  completedToday: number;
  averageProcessingTime: number;
  qualityScore: number;
  flaggedItems: number;
  autoApproved: number;
}

// ==================== MAIN COMPONENT ====================

export default function AdminContentModeration() {
  const [activeTab, setActiveTab] = useState('queue');
  const [stats, setStats] = useState<ModerationStats>({
    pendingReviews: 127,
    completedToday: 89,
    averageProcessingTime: 12.5,
    qualityScore: 78.5,
    flaggedItems: 23,
    autoApproved: 156
  });

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb 
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Content Moderation', href: '/admin/content-moderation' }
        ]} 
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Moderation</h1>
          <p className="text-gray-600 mt-1">
            Review, analyze, and manage product content quality
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingReviews}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Processing</p>
                <p className="text-2xl font-bold text-blue-600">{stats.averageProcessingTime}m</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Quality Score</p>
                <p className={`text-2xl font-bold ${
                  stats.qualityScore >= 80 ? 'text-green-600' : 
                  stats.qualityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {stats.qualityScore}%
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Flagged Items</p>
                <p className="text-2xl font-bold text-red-600">{stats.flaggedItems}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Auto Approved</p>
                <p className="text-2xl font-bold text-gray-600">{stats.autoApproved}</p>
              </div>
              <Zap className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b">
              <TabsList className="h-auto p-0 bg-transparent">
                <TabsTrigger 
                  value="queue" 
                  className="flex items-center gap-2 px-6 py-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700"
                >
                  <Eye className="h-4 w-4" />
                  Review Queue
                  {stats.pendingReviews > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {stats.pendingReviews}
                    </Badge>
                  )}
                </TabsTrigger>
                
                <TabsTrigger 
                  value="analyzer" 
                  className="flex items-center gap-2 px-6 py-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700"
                >
                  <Zap className="h-4 w-4" />
                  Content Analyzer
                </TabsTrigger>
                
                <TabsTrigger 
                  value="quality" 
                  className="flex items-center gap-2 px-6 py-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700"
                >
                  <Target className="h-4 w-4" />
                  Quality Control
                </TabsTrigger>
                
                <TabsTrigger 
                  value="bulk" 
                  className="flex items-center gap-2 px-6 py-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700"
                >
                  <Package className="h-4 w-4" />
                  Bulk Operations
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              {/* Product Review Queue Tab */}
              <TabsContent value="queue" className="mt-0">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Product Review Queue</h2>
                    <p className="text-gray-600">
                      Review and moderate product submissions from suppliers
                    </p>
                  </div>
                  <ProductReviewQueue />
                </div>
              </TabsContent>

              {/* Content Analyzer Tab */}
              <TabsContent value="analyzer" className="mt-0">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Content Analyzer</h2>
                    <p className="text-gray-600">
                      Analyze text, images, and detect duplicates with AI-powered tools
                    </p>
                  </div>
                  <ContentAnalyzer />
                </div>
              </TabsContent>

              {/* Quality Control Tab */}
              <TabsContent value="quality" className="mt-0">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Quality Control Dashboard</h2>
                    <p className="text-gray-600">
                      Monitor content quality metrics and manage quality standards
                    </p>
                  </div>
                  <QualityControl />
                </div>
              </TabsContent>

              {/* Bulk Operations Tab */}
              <TabsContent value="bulk" className="mt-0">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Bulk Moderation</h2>
                    <p className="text-gray-600">
                      Efficiently moderate multiple products with bulk operations
                    </p>
                  </div>
                  <BulkModeration />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions Footer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Quick Actions:</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Run Quality Check
                </Button>
                <Button variant="outline" size="sm">
                  Generate Report
                </Button>
                <Button variant="outline" size="sm">
                  Export Data
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}