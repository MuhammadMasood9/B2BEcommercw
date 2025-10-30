import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface Goal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  category: 'revenue' | 'products' | 'customers' | 'orders' | 'custom';
  deadline: Date;
  createdAt: Date;
  status: 'active' | 'completed' | 'overdue' | 'paused';
  progress: number;
}

interface GoalFormData {
  title: string;
  description: string;
  target: number;
  unit: string;
  category: string;
  deadline: string;
}

export default function GoalTracker() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    target: 0,
    unit: '$',
    category: 'revenue',
    deadline: ''
  });

  const goalCategories = [
    { value: 'revenue', label: 'Revenue', icon: '💰' },
    { value: 'products', label: 'Products', icon: '📦' },
    { value: 'customers', label: 'Customers', icon: '👥' },
    { value: 'orders', label: 'Orders', icon: '🛒' },
    { value: 'custom', label: 'Custom', icon: '🎯' }
  ];

  const unitOptions = [
    { value: '$', label: 'Dollars ($)' },
    { value: 'units', label: 'Units' },
    { value: '%', label: 'Percentage (%)' },
    { value: 'count', label: 'Count' }
  ];

  // Fetch goals
  const fetchGoals = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - in real implementation, fetch from API
      const mockGoals: Goal[] = [
        {
          id: '1',
          title: 'Monthly Revenue Target',
          description: 'Achieve $50,000 in monthly revenue',
          target: 50000,
          current: 32500,
          unit: '$',
          category: 'revenue',
          deadline: new Date(2024, 11, 31),
          createdAt: new Date(2024, 9, 1),
          status: 'active',
          progress: 65
        },
        {
          id: '2',
          title: 'New Product Launches',
          description: 'Launch 20 new products this quarter',
          target: 20,
          current: 14,
          unit: 'units',
          category: 'products',
          deadline: new Date(2024, 11, 31),
          createdAt: new Date(2024, 9, 1),
          status: 'active',
          progress: 70
        },
        {
          id: '3',
          title: 'Customer Acquisition',
          description: 'Acquire 100 new customers',
          target: 100,
          current: 87,
          unit: 'count',
          category: 'customers',
          deadline: new Date(2024, 11, 31),
          createdAt: new Date(2024, 9, 1),
          status: 'active',
          progress: 87
        },
        {
          id: '4',
          title: 'Q3 Sales Target',
          description: 'Complete 500 orders in Q3',
          target: 500,
          current: 520,
          unit: 'count',
          category: 'orders',
          deadline: new Date(2024, 8, 30),
          createdAt: new Date(2024, 6, 1),
          status: 'completed',
          progress: 104
        }
      ];
      
      setGoals(mockGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create or update goal
  const saveGoal = async () => {
    try {
      const goalData = {
        ...formData,
        target: Number(formData.target),
        deadline: new Date(formData.deadline),
        current: editingGoal?.current || 0,
        progress: editingGoal?.progress || 0,
        status: editingGoal?.status || 'active',
        createdAt: editingGoal?.createdAt || new Date()
      };

      if (editingGoal) {
        // Update existing goal
        setGoals(prev => prev.map(goal => 
          goal.id === editingGoal.id 
            ? { ...goal, ...goalData, category: goalData.category as 'revenue' | 'products' | 'customers' | 'orders' | 'custom' }
            : goal
        ));
      } else {
        // Create new goal
        const newGoal: Goal = {
          id: Date.now().toString(),
          ...goalData,
          category: goalData.category as 'revenue' | 'products' | 'customers' | 'orders' | 'custom'
        };
        setGoals(prev => [...prev, newGoal]);
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        target: 0,
        unit: '$',
        category: 'revenue',
        deadline: ''
      });
      setEditingGoal(null);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  // Delete goal
  const deleteGoal = async (goalId: string) => {
    try {
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  // Update goal progress
  const updateProgress = async (goalId: string, newCurrent: number) => {
    try {
      setGoals(prev => prev.map(goal => {
        if (goal.id === goalId) {
          const progress = Math.round((newCurrent / goal.target) * 100);
          const status = progress >= 100 ? 'completed' : 
                        new Date() > goal.deadline ? 'overdue' : 'active';
          return {
            ...goal,
            current: newCurrent,
            progress,
            status
          };
        }
        return goal;
      }));
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'paused': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      case 'paused': return <Clock className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '$') return `$${value.toLocaleString()}`;
    if (unit === '%') return `${value}%`;
    return `${value.toLocaleString()} ${unit}`;
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Goal Tracker</h2>
          <p className="text-muted-foreground">Set and track your business objectives</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter goal title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your goal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target">Target Value</Label>
                  <Input
                    id="target"
                    type="number"
                    value={formData.target}
                    onChange={(e) => setFormData(prev => ({ ...prev, target: Number(e.target.value) }))}
                    placeholder="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map(unit => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {goalCategories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          {category.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={saveGoal} className="flex-1">
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateDialog(false);
                    setEditingGoal(null);
                    setFormData({
                      title: '',
                      description: '',
                      target: 0,
                      unit: '$',
                      category: 'revenue',
                      deadline: ''
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goal Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{goals.filter(g => g.status === 'active').length}</div>
            <div className="text-sm text-muted-foreground">Active Goals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{goals.filter(g => g.status === 'completed').length}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold">{goals.filter(g => g.status === 'overdue').length}</div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">
              {goals.length > 0 ? Math.round(goals.reduce((acc, goal) => acc + goal.progress, 0) / goals.length) : 0}%
            </div>
            <div className="text-sm text-muted-foreground">Avg Progress</div>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {goals.map((goal) => (
          <Card key={goal.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                    <Badge className={getStatusColor(goal.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(goal.status)}
                        {goal.status}
                      </div>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingGoal(goal);
                      setFormData({
                        title: goal.title,
                        description: goal.description,
                        target: goal.target,
                        unit: goal.unit,
                        category: goal.category,
                        deadline: goal.deadline.toISOString().split('T')[0]
                      });
                      setShowCreateDialog(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteGoal(goal.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm font-bold">{goal.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      goal.status === 'completed' ? 'bg-green-500' : 
                      goal.status === 'overdue' ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Current vs Target */}
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <div className="text-lg font-bold">{formatValue(goal.current, goal.unit)}</div>
                  <div className="text-xs text-muted-foreground">Current</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{formatValue(goal.target, goal.unit)}</div>
                  <div className="text-xs text-muted-foreground">Target</div>
                </div>
              </div>

              {/* Deadline */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Due: {goal.deadline.toLocaleDateString()}</span>
                <span className="ml-auto">
                  {Math.ceil((goal.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                </span>
              </div>

              {/* Update Progress */}
              {goal.status === 'active' && (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Update current value"
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const value = Number((e.target as HTMLInputElement).value);
                        if (value >= 0) {
                          updateProgress(goal.id, value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
                      const value = Number(input?.value || 0);
                      if (value >= 0) {
                        updateProgress(goal.id, value);
                        if (input) input.value = '';
                      }
                    }}
                  >
                    Update
                  </Button>
                </div>
              )}

              {/* Achievement Badge */}
              {goal.status === 'completed' && (
                <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg">
                  <Award className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">Goal Achieved!</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {goals.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Goals Set</h3>
            <p className="text-muted-foreground mb-4">
              Start tracking your business objectives by creating your first goal.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}