import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3, 
  PieChart, 
  Target,
  Lightbulb,
  RefreshCw,
  Download,
  Calendar,
  Filter,
  Eye,
  Flag
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ==================== INTERFACES ====================

interface QualityMetrics {
  overallQualityScore: number;
  qualityTrend: Array<{
    date: Date;
    score: number;
  }>;
  categoryBreakdown: {
    textQuality: number;
    imageQuality: number;
    policyCompliance: number;
    duplicateRate: number;
  };
  improvementSuggestions: string[];
  topIssues: Array<{
    issue: string;
    count: number;
    percentage: number;
  }>;
}

interface QualityStandard {
  id: string;
  name: string;
  description: string;
  category: 'text' | 'image' | 'policy' | 'general';
  threshold: number;
  currentScore: number;
  status: 'passing' | 'warning' | 'failing';
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

interface QualityControlProps {
  className?: string;
}

// ==================== MAIN COMPONENT ====================

export default function QualityControl({ className }: QualityControlProps) {
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null);
  const [qualityStandards, setQualityStandards] = useState<QualityStandard[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  
  // ==================== DATA FETCHING ====================
  
  useEffect(() => {
    fetchQualityMetrics();
    fetchQualityStandards();
  }, [timeRange]);
  
  const fetchQualityMetrics = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/moderation/quality-metrics?timeRange=${timeRange}`);
      const data = await response.json();
      
      if (data.success) {
        setQualityMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Error fetching quality metrics:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchQualityStandards = async () => {
    try {
      // Mock quality standards (in real implementation, would fetch from API)
      const mockStandards: QualityStandard[] = [
        {
          id: 'text_quality',
          name: 'Text Quality Standard',
          description: 'Minimum quality score for product descriptions and titles',
          category: 'text',
          threshold: 75,
          currentScore: 82.3,
          status: 'passing',
          trend: 'up',
          lastUpdated: new Date()
        },
        {
          id: 'image_quality',
          name: 'Image Quality Standard',
          description: 'Minimum quality score for product images',
          category: 'image',
          threshold: 70,
          currentScore: 75.8,
          status: 'passing',
          trend: 'stable',
          lastUpdated: new Date()
        },
        {
          id: 'policy_compliance',
          name: 'Policy Compliance Standard',
          description: 'Minimum compliance score for platform policies',
          category: 'policy',
          threshold: 85,
          currentScore: 88.1,
          status: 'passing',
          trend: 'up',
          lastUpdated: new Date()
        },
        {
          id: 'duplicate_rate',
          name: 'Duplicate Content Rate',
          description: 'Maximum acceptable duplicate content rate',
          category: 'general',
          threshold: 10,
          currentScore: 5.2,
          status: 'passing',
          trend: 'down',
          lastUpdated: new Date()
        }
      ];
      
      setQualityStandards(mockStandards);
    } catch (error) {
      console.error('Error fetching quality standards:', error);
    }
  };
  
  // ==================== UTILITY FUNCTIONS ====================
  
  const getScoreColor = (score: number, threshold?: number) => {
    if (threshold) {
      return score >= threshold ? 'text-green-600' : 'text-red-600';
    }
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passing': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failing': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4" />;
    }
  };
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  // ==================== RENDER ====================
  
  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quality Control Dashboard</h2>
          <p className="text-gray-600">Monitor and manage content quality standards</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={fetchQualityMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {qualityMetrics && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="standards">Quality Standards</TabsTrigger>
            <TabsTrigger value="trends">Trends & Analytics</TabsTrigger>
            <TabsTrigger value="issues">Top Issues</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Overall Quality Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Overall Quality Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-6xl font-bold ${getScoreColor(qualityMetrics.overallQualityScore)}`}>
                      {qualityMetrics.overallQualityScore}
                    </div>
                    <div className="text-gray-500 mt-2">out of 100</div>
                    <Progress 
                      value={qualityMetrics.overallQualityScore} 
                      className="w-64 mt-4"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Category Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Text Quality</p>
                      <p className={`text-2xl font-bold ${getScoreColor(qualityMetrics.categoryBreakdown.textQuality)}`}>
                        {qualityMetrics.categoryBreakdown.textQuality}%
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Image Quality</p>
                      <p className={`text-2xl font-bold ${getScoreColor(qualityMetrics.categoryBreakdown.imageQuality)}`}>
                        {qualityMetrics.categoryBreakdown.imageQuality}%
                      </p>
                    </div>
                    <Eye className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Policy Compliance</p>
                      <p className={`text-2xl font-bold ${getScoreColor(qualityMetrics.categoryBreakdown.policyCompliance)}`}>
                        {qualityMetrics.categoryBreakdown.policyCompliance}%
                      </p>
                    </div>
                    <Flag className="h-8 w-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Duplicate Rate</p>
                      <p className={`text-2xl font-bold ${getScoreColor(100 - qualityMetrics.categoryBreakdown.duplicateRate)}`}>
                        {qualityMetrics.categoryBreakdown.duplicateRate}%
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Quality Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quality Trend ({timeRange})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={qualityMetrics.qualityTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value) => [`${value}%`, 'Quality Score']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#0088FE" 
                        strokeWidth={2}
                        dot={{ fill: '#0088FE' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Improvement Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Improvement Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {qualityMetrics.improvementSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Quality Standards Tab */}
          <TabsContent value="standards" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {qualityStandards.map((standard) => (
                <Card key={standard.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{standard.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(standard.status)}>
                          {standard.status}
                        </Badge>
                        {getTrendIcon(standard.trend)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">{standard.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current Score</span>
                        <span className={getScoreColor(standard.currentScore, standard.threshold)}>
                          {standard.currentScore}
                          {standard.category === 'general' && standard.id === 'duplicate_rate' ? '%' : '/100'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Threshold</span>
                        <span className="text-gray-600">
                          {standard.threshold}
                          {standard.category === 'general' && standard.id === 'duplicate_rate' ? '%' : '/100'}
                        </span>
                      </div>
                      
                      <Progress 
                        value={standard.id === 'duplicate_rate' ? 
                          Math.max(0, 100 - (standard.currentScore / standard.threshold * 100)) :
                          (standard.currentScore / 100) * 100
                        }
                        className="h-2"
                      />
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Last updated: {standard.lastUpdated.toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Trends & Analytics Tab */}
          <TabsContent value="trends" className="space-y-6">
            {/* Category Breakdown Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Quality Category Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: 'Text Quality', value: qualityMetrics.categoryBreakdown.textQuality },
                          { name: 'Image Quality', value: qualityMetrics.categoryBreakdown.imageQuality },
                          { name: 'Policy Compliance', value: qualityMetrics.categoryBreakdown.policyCompliance },
                          { name: 'Duplicate Prevention', value: 100 - qualityMetrics.categoryBreakdown.duplicateRate }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {[0, 1, 2, 3].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Quality Trend Area Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quality Score Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={qualityMetrics.qualityTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value) => [`${value}%`, 'Quality Score']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#0088FE" 
                        fill="#0088FE"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Top Issues Tab */}
          <TabsContent value="issues" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Top Quality Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {qualityMetrics.topIssues.map((issue, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-red-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{issue.issue}</p>
                          <p className="text-sm text-gray-600">{issue.count} occurrences</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{issue.percentage}%</p>
                          <p className="text-xs text-gray-500">of total issues</p>
                        </div>
                        <Progress value={issue.percentage} className="w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Issues Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Issue Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={qualityMetrics.topIssues}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="issue" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, 'Count']} />
                      <Bar dataKey="count" fill="#FF8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}