import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Calendar,
  Target,
  Award
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StaffPerformance {
  staffMemberId: string;
  staffName: string;
  role: string;
  metrics: {
    tasksCompleted: number;
    tasksAssigned: number;
    responseTime: number; // in hours
    accuracyRate: number; // percentage
    customerSatisfaction: number; // rating out of 5
    loginFrequency: number; // days per week
    productivityScore: number; // calculated score
  };
  trends: {
    tasksCompletedTrend: number; // percentage change
    responseTimeTrend: number;
    accuracyTrend: number;
  };
  recentActivities: Array<{
    action: string;
    description: string;
    timestamp: string;
    impact: 'positive' | 'neutral' | 'negative';
  }>;
}

interface TeamMetrics {
  totalStaff: number;
  activeStaff: number;
  averageProductivity: number;
  totalTasksCompleted: number;
  averageResponseTime: number;
  teamSatisfactionScore: number;
}

export default function StaffPerformanceDashboard() {
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([]);
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchPerformanceData();
  }, [selectedPeriod, selectedStaff]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        period: selectedPeriod,
        staff: selectedStaff
      });
      
      const response = await fetch(`/api/suppliers/staff/performance?${params}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStaffPerformance(data.staffPerformance || []);
        setTeamMetrics(data.teamMetrics || null);
      } else {
        throw new Error('Failed to fetch performance data');
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load performance data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 80) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Average</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <div className="w-4 h-4" />;
  };

  const formatResponseTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Staff Performance Dashboard</h2>
          <p className="text-gray-600">Monitor and track team performance metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStaff} onValueChange={setSelectedStaff}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {staffPerformance.map((staff) => (
                <SelectItem key={staff.staffMemberId} value={staff.staffMemberId}>
                  {staff.staffName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Team Overview */}
      {teamMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-blue-600" />
                <Badge variant="outline">{teamMetrics.activeStaff}/{teamMetrics.totalStaff}</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-1">Active Staff</p>
              <p className="text-2xl font-bold">{teamMetrics.activeStaff}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-8 h-8 text-green-600" />
                <div className="flex items-center gap-1">
                  {getTrendIcon(5)}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Avg Productivity</p>
              <p className="text-2xl font-bold">{teamMetrics.averageProductivity}%</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div className="flex items-center gap-1">
                  {getTrendIcon(-2)}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Avg Response Time</p>
              <p className="text-2xl font-bold">{formatResponseTime(teamMetrics.averageResponseTime)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-8 h-8 text-purple-600" />
                <div className="flex items-center gap-1">
                  {getTrendIcon(3)}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Team Satisfaction</p>
              <p className="text-2xl font-bold">{teamMetrics.teamSatisfactionScore.toFixed(1)}/5</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Performance Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual Performance</TabsTrigger>
          <TabsTrigger value="goals">Goals & Targets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance Summary</CardTitle>
              <CardDescription>
                Overview of all staff members' performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {staffPerformance.map((staff) => (
                  <div key={staff.staffMemberId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{staff.staffName}</h3>
                        <p className="text-sm text-gray-600 capitalize">{staff.role}</p>
                      </div>
                      {getPerformanceBadge(staff.metrics.productivityScore)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Tasks Completed</p>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{staff.metrics.tasksCompleted}/{staff.metrics.tasksAssigned}</p>
                          {getTrendIcon(staff.trends.tasksCompletedTrend)}
                        </div>
                        <Progress 
                          value={(staff.metrics.tasksCompleted / staff.metrics.tasksAssigned) * 100} 
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Response Time</p>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{formatResponseTime(staff.metrics.responseTime)}</p>
                          {getTrendIcon(staff.trends.responseTimeTrend)}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Accuracy Rate</p>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{staff.metrics.accuracyRate}%</p>
                          {getTrendIcon(staff.trends.accuracyTrend)}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Satisfaction</p>
                        <p className="font-semibold">{staff.metrics.customerSatisfaction.toFixed(1)}/5</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual" className="space-y-4">
          {selectedStaff !== 'all' ? (
            (() => {
              const staff = staffPerformance.find(s => s.staffMemberId === selectedStaff);
              if (!staff) return <div>Staff member not found</div>;
              
              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{staff.staffName} - Performance Metrics</CardTitle>
                      <CardDescription>Detailed performance breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span>Productivity Score</span>
                            <span className={`font-semibold ${getPerformanceColor(staff.metrics.productivityScore)}`}>
                              {staff.metrics.productivityScore}%
                            </span>
                          </div>
                          <Progress value={staff.metrics.productivityScore} />
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span>Task Completion Rate</span>
                            <span className="font-semibold">
                              {Math.round((staff.metrics.tasksCompleted / staff.metrics.tasksAssigned) * 100)}%
                            </span>
                          </div>
                          <Progress value={(staff.metrics.tasksCompleted / staff.metrics.tasksAssigned) * 100} />
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span>Accuracy Rate</span>
                            <span className={`font-semibold ${getPerformanceColor(staff.metrics.accuracyRate)}`}>
                              {staff.metrics.accuracyRate}%
                            </span>
                          </div>
                          <Progress value={staff.metrics.accuracyRate} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-4">
                          <div className="text-center">
                            <Clock className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                            <p className="text-sm text-gray-600">Avg Response Time</p>
                            <p className="font-semibold">{formatResponseTime(staff.metrics.responseTime)}</p>
                          </div>
                          <div className="text-center">
                            <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2" />
                            <p className="text-sm text-gray-600">Customer Rating</p>
                            <p className="font-semibold">{staff.metrics.customerSatisfaction.toFixed(1)}/5</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activities</CardTitle>
                      <CardDescription>Latest actions and their impact</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {staff.recentActivities.map((activity, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 border rounded">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              activity.impact === 'positive' ? 'bg-green-500' :
                              activity.impact === 'negative' ? 'bg-red-500' : 'bg-gray-400'
                            }`} />
                            <div className="flex-1">
                              <p className="font-medium">{activity.action}</p>
                              <p className="text-sm text-gray-600">{activity.description}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(activity.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Staff Member</h3>
                <p className="text-gray-600">Choose a staff member from the dropdown to view detailed performance metrics</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Performance Goals & Targets
              </CardTitle>
              <CardDescription>
                Set and track performance goals for your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Goals Feature Coming Soon</h3>
                <p className="text-gray-600 mb-4">
                  Set individual and team performance goals, track progress, and celebrate achievements.
                </p>
                <Button variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Set Goals
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}