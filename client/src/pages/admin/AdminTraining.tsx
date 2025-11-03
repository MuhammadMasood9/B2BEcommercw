import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import Breadcrumb from "@/components/Breadcrumb";
import {
  GraduationCap,
  Play,
  CheckCircle,
  Clock,
  Star,
  Award,
  BookOpen,
  Video,
  FileText,
  Users,
  TrendingUp,
  Target,
  Zap,
  Shield,
  BarChart3,
  DollarSign,
  Package,
  MessageSquare,
  ChevronRight,
  Calendar,
  User,
  Trophy,
  Lightbulb,
  Bookmark
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Training module structure
interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'interactive' | 'video' | 'reading' | 'quiz';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  prerequisites?: string[];
  learningObjectives: string[];
  content: {
    sections: {
      title: string;
      type: 'text' | 'video' | 'interactive' | 'quiz';
      content: string;
      videoUrl?: string;
      quizQuestions?: {
        question: string;
        options: string[];
        correctAnswer: number;
        explanation: string;
      }[];
    }[];
  };
  certification: boolean;
  points: number;
  completionRate: number;
  userProgress?: {
    completed: boolean;
    progress: number;
    score?: number;
    completedAt?: Date;
  };
}

// Learning path structure
interface LearningPath {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  modules: string[];
  certification: boolean;
  badge?: string;
  progress?: {
    completed: number;
    total: number;
    percentage: number;
  };
}

// Sample training modules
const trainingModules: TrainingModule[] = [
  {
    id: 'admin-basics',
    title: 'Admin Dashboard Fundamentals',
    description: 'Learn the basics of navigating and using the admin dashboard effectively',
    category: 'Getting Started',
    type: 'interactive',
    difficulty: 'beginner',
    estimatedTime: '30 min',
    learningObjectives: [
      'Navigate the admin dashboard efficiently',
      'Understand key performance indicators',
      'Use quick actions and shortcuts',
      'Customize dashboard preferences'
    ],
    content: {
      sections: [
        {
          title: 'Dashboard Overview',
          type: 'interactive',
          content: 'Interactive tour of the main dashboard components and navigation'
        },
        {
          title: 'Understanding KPIs',
          type: 'text',
          content: 'Learn what each metric means and how to interpret trends'
        },
        {
          title: 'Quick Actions',
          type: 'interactive',
          content: 'Practice using quick actions for common admin tasks'
        }
      ]
    },
    certification: false,
    points: 100,
    completionRate: 85,
    userProgress: {
      completed: true,
      progress: 100,
      score: 92,
      completedAt: new Date('2024-01-10')
    }
  },
  {
    id: 'supplier-management',
    title: 'Supplier Management Mastery',
    description: 'Complete guide to managing suppliers from application to performance monitoring',
    category: 'Supplier Management',
    type: 'video',
    difficulty: 'intermediate',
    estimatedTime: '45 min',
    prerequisites: ['admin-basics'],
    learningObjectives: [
      'Review and approve supplier applications',
      'Monitor supplier performance metrics',
      'Handle supplier compliance issues',
      'Use bulk operations effectively'
    ],
    content: {
      sections: [
        {
          title: 'Supplier Approval Process',
          type: 'video',
          content: 'Step-by-step video guide to reviewing applications',
          videoUrl: '/admin/training/supplier-approval.mp4'
        },
        {
          title: 'Performance Monitoring',
          type: 'interactive',
          content: 'Interactive dashboard for tracking supplier metrics'
        },
        {
          title: 'Knowledge Check',
          type: 'quiz',
          content: 'Test your understanding of supplier management',
          quizQuestions: [
            {
              question: 'What documents are required for supplier verification?',
              options: [
                'Business registration only',
                'Business registration and tax documents',
                'Business registration, tax documents, and compliance certificates',
                'Only contact information'
              ],
              correctAnswer: 2,
              explanation: 'Complete verification requires business registration, tax documents, and compliance certificates to ensure legitimacy and compliance.'
            }
          ]
        }
      ]
    },
    certification: true,
    points: 250,
    completionRate: 78,
    userProgress: {
      completed: false,
      progress: 60,
      score: undefined
    }
  },
  {
    id: 'financial-management',
    title: 'Financial Operations & Commission Management',
    description: 'Master financial operations including commission rates and payout processing',
    category: 'Financial Management',
    type: 'interactive',
    difficulty: 'advanced',
    estimatedTime: '60 min',
    prerequisites: ['admin-basics', 'supplier-management'],
    learningObjectives: [
      'Configure commission rate structures',
      'Process supplier payouts efficiently',
      'Generate financial reports',
      'Handle payment disputes'
    ],
    content: {
      sections: [
        {
          title: 'Commission Configuration',
          type: 'interactive',
          content: 'Hands-on practice with commission rate setup'
        },
        {
          title: 'Payout Processing',
          type: 'video',
          content: 'Video walkthrough of payout workflows',
          videoUrl: '/admin/training/payout-processing.mp4'
        },
        {
          title: 'Financial Reporting',
          type: 'interactive',
          content: 'Create and customize financial reports'
        }
      ]
    },
    certification: true,
    points: 350,
    completionRate: 65,
    userProgress: {
      completed: false,
      progress: 0
    }
  },
  {
    id: 'content-moderation',
    title: 'Content Moderation & Quality Control',
    description: 'Learn to effectively moderate content and maintain platform quality standards',
    category: 'Content Management',
    type: 'interactive',
    difficulty: 'intermediate',
    estimatedTime: '40 min',
    prerequisites: ['admin-basics'],
    learningObjectives: [
      'Review and approve product listings',
      'Apply quality standards consistently',
      'Use automated moderation tools',
      'Handle content violations'
    ],
    content: {
      sections: [
        {
          title: 'Quality Standards',
          type: 'text',
          content: 'Understanding platform quality guidelines'
        },
        {
          title: 'Moderation Tools',
          type: 'interactive',
          content: 'Practice using moderation interface'
        },
        {
          title: 'Violation Handling',
          type: 'video',
          content: 'How to handle policy violations',
          videoUrl: '/admin/training/content-moderation.mp4'
        }
      ]
    },
    certification: true,
    points: 200,
    completionRate: 72,
    userProgress: {
      completed: false,
      progress: 25
    }
  },
  {
    id: 'system-monitoring',
    title: 'System Monitoring & Performance',
    description: 'Monitor platform health and respond to system alerts effectively',
    category: 'System Management',
    type: 'interactive',
    difficulty: 'advanced',
    estimatedTime: '50 min',
    prerequisites: ['admin-basics'],
    learningObjectives: [
      'Interpret system health metrics',
      'Respond to critical alerts',
      'Optimize platform performance',
      'Generate system reports'
    ],
    content: {
      sections: [
        {
          title: 'Health Metrics',
          type: 'interactive',
          content: 'Understanding system performance indicators'
        },
        {
          title: 'Alert Response',
          type: 'interactive',
          content: 'Practice responding to different alert types'
        },
        {
          title: 'Performance Optimization',
          type: 'text',
          content: 'Best practices for maintaining system performance'
        }
      ]
    },
    certification: true,
    points: 300,
    completionRate: 58,
    userProgress: {
      completed: false,
      progress: 0
    }
  }
];

// Sample learning paths
const learningPaths: LearningPath[] = [
  {
    id: 'new-admin',
    title: 'New Admin Onboarding',
    description: 'Complete onboarding path for new platform administrators',
    level: 'beginner',
    estimatedTime: '2-3 hours',
    modules: ['admin-basics', 'supplier-management', 'content-moderation'],
    certification: true,
    badge: 'Certified Admin',
    progress: {
      completed: 1,
      total: 3,
      percentage: 33
    }
  },
  {
    id: 'financial-specialist',
    title: 'Financial Management Specialist',
    description: 'Specialized training for financial operations and commission management',
    level: 'advanced',
    estimatedTime: '3-4 hours',
    modules: ['admin-basics', 'supplier-management', 'financial-management'],
    certification: true,
    badge: 'Financial Specialist',
    progress: {
      completed: 1,
      total: 3,
      percentage: 33
    }
  },
  {
    id: 'platform-expert',
    title: 'Platform Expert Certification',
    description: 'Comprehensive training covering all aspects of platform administration',
    level: 'advanced',
    estimatedTime: '5-6 hours',
    modules: ['admin-basics', 'supplier-management', 'financial-management', 'content-moderation', 'system-monitoring'],
    certification: true,
    badge: 'Platform Expert',
    progress: {
      completed: 1,
      total: 5,
      percentage: 20
    }
  }
];

export default function AdminTraining() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [userStats, setUserStats] = useState({
    totalPoints: 100,
    completedModules: 1,
    certificationsEarned: 0,
    currentStreak: 3,
    rank: 'Novice'
  });

  // Calculate overall progress
  const overallProgress = {
    completed: trainingModules.filter(m => m.userProgress?.completed).length,
    total: trainingModules.length,
    percentage: Math.round((trainingModules.filter(m => m.userProgress?.completed).length / trainingModules.length) * 100)
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
      case 'interactive': return <Zap className="h-4 w-4" />;
      case 'reading': return <BookOpen className="h-4 w-4" />;
      case 'quiz': return <Target className="h-4 w-4" />;

      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Getting Started': return <GraduationCap className="h-4 w-4" />;
      case 'Supplier Management': return <Users className="h-4 w-4" />;
      case 'Financial Management': return <DollarSign className="h-4 w-4" />;
      case 'Content Management': return <Package className="h-4 w-4" />;
      case 'System Management': return <BarChart3 className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const renderModuleCard = (module: TrainingModule) => (
    <Card key={module.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getTypeIcon(module.type)}
            <Badge variant="outline" className={getDifficultyColor(module.difficulty)}>
              {module.difficulty}
            </Badge>
            {module.certification && (
              <Badge variant="secondary">
                <Award className="h-3 w-3 mr-1" />
                Certification
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            {module.estimatedTime}
          </div>
        </div>
        <CardTitle className="text-lg">{module.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{module.description}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Progress */}
          {module.userProgress && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {module.userProgress.progress}%
                </span>
              </div>
              <Progress value={module.userProgress.progress} className="h-2" />
              {module.userProgress.completed && (
                <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  Completed
                  {module.userProgress.score && (
                    <span className="ml-1">• Score: {module.userProgress.score}%</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Learning Objectives */}
          <div>
            <h4 className="text-sm font-medium mb-1">Learning Objectives</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              {module.learningObjectives.slice(0, 2).map((objective, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-blue-500 mt-0.5">•</span>
                  {objective}
                </li>
              ))}
              {module.learningObjectives.length > 2 && (
                <li className="text-blue-600">+{module.learningObjectives.length - 2} more</li>
              )}
            </ul>
          </div>

          {/* Prerequisites */}
          {module.prerequisites && module.prerequisites.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-1">Prerequisites</h4>
              <div className="flex flex-wrap gap-1">
                {module.prerequisites.map(prereq => {
                  const prereqModule = trainingModules.find(m => m.id === prereq);
                  return (
                    <Badge key={prereq} variant="outline" className="text-xs">
                      {prereqModule?.title || prereq}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-3 w-3" />
              {module.points} points
            </div>
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setSelectedModule(module)}>
                    Preview
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {getCategoryIcon(module.category)}
                      {module.title}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">{module.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Duration:</span> {module.estimatedTime}
                      </div>
                      <div>
                        <span className="font-medium">Points:</span> {module.points}
                      </div>
                      <div>
                        <span className="font-medium">Difficulty:</span> {module.difficulty}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> {module.type}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Learning Objectives</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {module.learningObjectives.map((objective, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {objective}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1">
                        {module.userProgress?.completed ? 'Review Module' : 'Start Module'}
                      </Button>
                      <Button variant="outline">
                        <Bookmark className="h-4 w-4 mr-2" />
                        Bookmark
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button size="sm">
                {module.userProgress?.completed ? 'Review' : 'Start'}
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderLearningPath = (path: LearningPath) => (
    <Card key={path.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getDifficultyColor(path.level)}>
              {path.level}
            </Badge>
            {path.certification && (
              <Badge variant="secondary">
                <Award className="h-3 w-3 mr-1" />
                Certification
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">{path.estimatedTime}</div>
        </div>
        <CardTitle className="text-lg">{path.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{path.description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress */}
          {path.progress && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {path.progress.completed}/{path.progress.total} modules
                </span>
              </div>
              <Progress value={path.progress.percentage} className="h-2" />
            </div>
          )}

          {/* Modules */}
          <div>
            <h4 className="text-sm font-medium mb-2">Included Modules</h4>
            <div className="space-y-2">
              {path.modules.map((moduleId, index) => {
                const module = trainingModules.find(m => m.id === moduleId);
                const isCompleted = module?.userProgress?.completed;
                return (
                  <div key={moduleId} className="flex items-center gap-2 text-sm">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      isCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isCompleted ? <CheckCircle className="h-3 w-3" /> : index + 1}
                    </div>
                    <span className={isCompleted ? 'line-through text-muted-foreground' : ''}>
                      {module?.title || moduleId}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1">
              {path.progress && path.progress.percentage > 0 ? 'Continue Path' : 'Start Path'}
            </Button>
            <Button variant="outline">
              View Details
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
        { label: "Training & Certification" }
      ]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Training & Certification</h1>
          <p className="text-muted-foreground mt-1">
            Enhance your admin skills with interactive training modules and earn certifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/training/leaderboard">
              <Trophy className="h-4 w-4 mr-2" />
              Leaderboard
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/training/certificates">
              <Award className="h-4 w-4 mr-2" />
              My Certificates
            </Link>
          </Button>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{userStats.totalPoints}</div>
            <div className="text-sm text-muted-foreground">Total Points</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{userStats.completedModules}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{userStats.certificationsEarned}</div>
            <div className="text-sm text-muted-foreground">Certificates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{userStats.currentStreak}</div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{userStats.rank}</div>
            <div className="text-sm text-muted-foreground">Current Rank</div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Your Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Overall Completion</span>
              <span className="text-muted-foreground">
                {overallProgress.completed}/{overallProgress.total} modules
              </span>
            </div>
            <Progress value={overallProgress.percentage} className="h-3" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{overallProgress.percentage}% complete</span>
              <span>Keep going! 🚀</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="modules">Training Modules</TabsTrigger>
          <TabsTrigger value="paths">Learning Paths</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Recommended for You */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Recommended for You
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainingModules
                .filter(m => !m.userProgress?.completed)
                .slice(0, 3)
                .map(renderModuleCard)}
            </div>
          </div>

          <Separator />

          {/* Continue Learning */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-500" />
              Continue Learning
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trainingModules
                .filter(m => m.userProgress && !m.userProgress.completed && m.userProgress.progress > 0)
                .slice(0, 2)
                .map(renderModuleCard)}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="modules" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainingModules.map(renderModuleCard)}
          </div>
        </TabsContent>

        <TabsContent value="paths" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {learningPaths.map(renderLearningPath)}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-6 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                <h3 className="font-semibold mb-2">First Steps</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete your first training module
                </p>
                <Badge variant="secondary">Earned</Badge>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardContent className="p-6 text-center">
                <Award className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="font-semibold mb-2">Quick Learner</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete 3 modules in one day
                </p>
                <Badge variant="outline">Locked</Badge>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardContent className="p-6 text-center">
                <Star className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="font-semibold mb-2">Perfect Score</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Score 100% on any certification exam
                </p>
                <Badge variant="outline">Locked</Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}