import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Play,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    X,
    Lightbulb,
    Target,
    MousePointer,
    Eye,
    Hand,
    Zap,
    Award,
    Star,
    ChevronRight,
    BookOpen,
    Video,
    Users,
    DollarSign,
    BarChart3,
    Settings
} from "lucide-react";
import { useLocation } from "wouter";

// Onboarding step structure
interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    type: 'tour' | 'interaction' | 'information' | 'task' | 'quiz';
    target?: string; // CSS selector for element to highlight
    position?: 'top' | 'bottom' | 'left' | 'right';
    content: {
        text: string;
        image?: string;
        video?: string;
        interactive?: boolean;
        task?: {
            description: string;
            action: string;
            validation: () => boolean;
        };
        quiz?: {
            question: string;
            options: string[];
            correctAnswer: number;
            explanation: string;
        };
    };
    optional?: boolean;
    completionCriteria?: string;
}

// Onboarding flow structure
interface OnboardingFlow {
    id: string;
    title: string;
    description: string;
    category: 'new-user' | 'feature' | 'advanced';
    estimatedTime: string;
    steps: OnboardingStep[];
    prerequisites?: string[];
    rewards?: {
        points: number;
        badge?: string;
        certification?: boolean;
    };
}

// Sample onboarding flows
const onboardingFlows: OnboardingFlow[] = [
    {
        id: 'admin-dashboard-tour',
        title: 'Admin Dashboard Tour',
        description: 'Get familiar with your admin dashboard and key features',
        category: 'new-user',
        estimatedTime: '10 minutes',
        rewards: {
            points: 100,
            badge: 'Dashboard Explorer'
        },
        steps: [
            {
                id: 'welcome',
                title: 'Welcome to Admin Dashboard',
                description: 'Let\'s start your journey as a platform administrator',
                type: 'information',
                content: {
                    text: 'Welcome to the admin dashboard! This interactive tour will help you understand the key features and navigation. You\'ll learn how to monitor platform health, manage suppliers, and access important tools.',
                    image: '/admin/onboarding/welcome.png'
                }
            },
            {
                id: 'navigation-overview',
                title: 'Navigation Overview',
                description: 'Learn about the main navigation structure',
                type: 'tour',
                target: '.admin-sidebar',
                position: 'right',
                content: {
                    text: 'This is your main navigation sidebar. It provides access to all admin functions including supplier management, financial operations, content moderation, and system monitoring.',
                    interactive: true
                }
            },
            {
                id: 'kpi-cards',
                title: 'Key Performance Indicators',
                description: 'Understanding your dashboard metrics',
                type: 'tour',
                target: '.kpi-cards',
                position: 'bottom',
                content: {
                    text: 'These KPI cards show your platform\'s key metrics at a glance. Monitor revenue, active suppliers, pending approvals, and system alerts. Click on any card to drill down into detailed views.',
                    interactive: true
                }
            },
            {
                id: 'quick-actions',
                title: 'Quick Actions Panel',
                description: 'Access frequently used functions quickly',
                type: 'interaction',
                target: '.quick-actions',
                position: 'top',
                content: {
                    text: 'The Quick Actions panel provides shortcuts to common admin tasks. Try clicking on "Review Pending Suppliers" to see how it works.',
                    interactive: true,
                    task: {
                        description: 'Click on any quick action button',
                        action: 'click-quick-action',
                        validation: () => true // Would be implemented with actual validation
                    }
                }
            },
            {
                id: 'alerts-panel',
                title: 'System Alerts',
                description: 'Stay informed about important system events',
                type: 'tour',
                target: '.alerts-panel',
                position: 'left',
                content: {
                    text: 'System alerts keep you informed about critical events, warnings, and information that requires your attention. Critical alerts are highlighted in red and require immediate action.',
                    interactive: true
                }
            },
            {
                id: 'dashboard-quiz',
                title: 'Quick Knowledge Check',
                description: 'Test your understanding of the dashboard',
                type: 'quiz',
                content: {
                    text: 'Let\'s test what you\'ve learned about the admin dashboard.',
                    quiz: {
                        question: 'Where can you find shortcuts to common admin tasks?',
                        options: [
                            'In the navigation sidebar',
                            'In the Quick Actions panel',
                            'In the system alerts',
                            'In the KPI cards'
                        ],
                        correctAnswer: 1,
                        explanation: 'The Quick Actions panel provides shortcuts to frequently used admin functions like reviewing suppliers and processing payouts.'
                    }
                }
            }
        ]
    },
    {
        id: 'supplier-management-intro',
        title: 'Supplier Management Introduction',
        description: 'Learn the basics of managing suppliers on your platform',
        category: 'feature',
        estimatedTime: '15 minutes',
        prerequisites: ['admin-dashboard-tour'],
        rewards: {
            points: 200,
            badge: 'Supplier Manager'
        },
        steps: [
            {
                id: 'supplier-overview',
                title: 'Supplier Management Overview',
                description: 'Understanding supplier lifecycle and management',
                type: 'information',
                content: {
                    text: 'Supplier management is a core function of platform administration. You\'ll handle supplier applications, monitor performance, and ensure compliance with platform standards.',
                    video: '/admin/onboarding/supplier-overview.mp4'
                }
            },
            {
                id: 'approval-process',
                title: 'Supplier Approval Process',
                description: 'Learn how to review and approve supplier applications',
                type: 'tour',
                target: '.supplier-approval',
                position: 'right',
                content: {
                    text: 'The supplier approval process involves reviewing business documents, checking compliance, and assessing risk factors. Each application requires careful evaluation before approval.',
                    interactive: true
                }
            },
            {
                id: 'performance-monitoring',
                title: 'Performance Monitoring',
                description: 'Track supplier performance metrics',
                type: 'tour',
                target: '.performance-metrics',
                position: 'bottom',
                content: {
                    text: 'Monitor supplier performance through key metrics like response time, fulfillment rate, and customer satisfaction. Set up alerts for performance issues.',
                    interactive: true
                }
            },
            {
                id: 'bulk-operations',
                title: 'Bulk Operations',
                description: 'Efficiently manage multiple suppliers',
                type: 'interaction',
                target: '.bulk-actions',
                position: 'top',
                content: {
                    text: 'Use bulk operations to efficiently manage multiple suppliers at once. You can approve, reject, or update multiple suppliers simultaneously.',
                    interactive: true,
                    task: {
                        description: 'Select multiple suppliers and try a bulk action',
                        action: 'bulk-operation',
                        validation: () => true
                    }
                }
            }
        ]
    },
    {
        id: 'financial-management-basics',
        title: 'Financial Management Basics',
        description: 'Learn to manage commissions and payouts effectively',
        category: 'feature',
        estimatedTime: '20 minutes',
        prerequisites: ['admin-dashboard-tour'],
        rewards: {
            points: 250,
            badge: 'Financial Administrator',
            certification: true
        },
        steps: [
            {
                id: 'financial-overview',
                title: 'Financial Management Overview',
                description: 'Understanding platform financial operations',
                type: 'information',
                content: {
                    text: 'Financial management involves setting commission rates, processing supplier payouts, and generating financial reports. These operations are critical for platform profitability and supplier satisfaction.',
                    image: '/admin/onboarding/financial-overview.png'
                }
            },
            {
                id: 'commission-setup',
                title: 'Commission Rate Configuration',
                description: 'Learn to set up commission structures',
                type: 'tour',
                target: '.commission-settings',
                position: 'right',
                content: {
                    text: 'Commission rates can be configured at multiple levels: default rates, tier-based rates, category-specific rates, and individual supplier overrides. Changes apply to new transactions only.',
                    interactive: true
                }
            },
            {
                id: 'payout-processing',
                title: 'Payout Processing',
                description: 'Process supplier payments efficiently',
                type: 'interaction',
                target: '.payout-queue',
                position: 'bottom',
                content: {
                    text: 'The payout queue shows all pending payments to suppliers. You can process payments individually or in batches, with approval workflows for large amounts.',
                    interactive: true,
                    task: {
                        description: 'Review a payout and mark it for processing',
                        action: 'process-payout',
                        validation: () => true
                    }
                }
            }
        ]
    }
];

interface InteractiveOnboardingProps {
    flowId?: string;
    autoStart?: boolean;
    onComplete?: (flowId: string) => void;
    onSkip?: (flowId: string) => void;
}

export function InteractiveOnboarding({
    flowId,
    autoStart = false,
    onComplete,
    onSkip
}: InteractiveOnboardingProps) {
    const [location] = useLocation();
    const [isActive, setIsActive] = useState(false);
    const [currentFlow, setCurrentFlow] = useState<OnboardingFlow | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
    const [showResults, setShowResults] = useState(false);

    // Auto-start onboarding if specified
    useEffect(() => {
        if (autoStart && flowId) {
            startOnboarding(flowId);
        }
    }, [autoStart, flowId]);

    const startOnboarding = (id: string) => {
        const flow = onboardingFlows.find(f => f.id === id);
        if (flow) {
            setCurrentFlow(flow);
            setCurrentStepIndex(0);
            setCompletedSteps(new Set());
            setIsActive(true);
        }
    };

    const nextStep = () => {
        if (!currentFlow) return;

        const currentStep = currentFlow.steps[currentStepIndex];
        setCompletedSteps(prev => new Set(Array.from(prev).concat([currentStep.id])));

        if (currentStepIndex < currentFlow.steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            completeOnboarding();
        }
    };

    const previousStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    const skipStep = () => {
        if (!currentFlow) return;

        const currentStep = currentFlow.steps[currentStepIndex];
        if (currentStep.optional) {
            nextStep();
        }
    };

    const completeOnboarding = () => {
        if (currentFlow) {
            setShowResults(true);
            setTimeout(() => {
                setIsActive(false);
                setShowResults(false);
                onComplete?.(currentFlow.id);
            }, 3000);
        }
    };

    const skipOnboarding = () => {
        if (currentFlow) {
            setIsActive(false);
            onSkip?.(currentFlow.id);
        }
    };

    const handleQuizAnswer = (answerIndex: number) => {
        setQuizAnswer(answerIndex);
        setTimeout(() => {
            nextStep();
            setShowQuiz(false);
            setQuizAnswer(null);
        }, 2000);
    };

    if (!isActive || !currentFlow) {
        return null;
    }

    const currentStep = currentFlow.steps[currentStepIndex];
    const progress = ((currentStepIndex + 1) / currentFlow.steps.length) * 100;

    // Show completion results
    if (showResults) {
        return (
            <Dialog open={true}>
                <DialogContent className="max-w-md">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Onboarding Complete!</h3>
                            <p className="text-muted-foreground">
                                You've successfully completed "{currentFlow.title}"
                            </p>
                        </div>
                        {currentFlow.rewards && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-center gap-2">
                                    <Star className="h-4 w-4 text-yellow-500" />
                                    <span className="font-medium">+{currentFlow.rewards.points} points</span>
                                </div>
                                {currentFlow.rewards.badge && (
                                    <div className="flex items-center justify-center gap-2">
                                        <Award className="h-4 w-4 text-blue-500" />
                                        <span className="font-medium">Badge: {currentFlow.rewards.badge}</span>
                                    </div>
                                )}
                                {currentFlow.rewards.certification && (
                                    <div className="flex items-center justify-center gap-2">
                                        <BookOpen className="h-4 w-4 text-purple-500" />
                                        <span className="font-medium">Certification Earned</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // Show quiz dialog
    if (currentStep.type === 'quiz' && currentStep.content.quiz) {
        return (
            <Dialog open={true}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            {currentStep.title}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                Step {currentStepIndex + 1} of {currentFlow.steps.length}
                            </span>
                            <Progress value={progress} className="w-32 h-2" />
                        </div>

                        <div className="space-y-4">
                            <p className="text-lg font-medium">{currentStep.content.quiz.question}</p>
                            <div className="space-y-2">
                                {currentStep.content.quiz.options.map((option, index) => (
                                    <Button
                                        key={index}
                                        variant={quizAnswer === index ?
                                            (index === currentStep.content.quiz!.correctAnswer ? "default" : "destructive")
                                            : "outline"
                                        }
                                        className="w-full justify-start h-auto p-4"
                                        onClick={() => handleQuizAnswer(index)}
                                        disabled={quizAnswer !== null}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm">
                                                {String.fromCharCode(65 + index)}
                                            </div>
                                            <span>{option}</span>
                                            {quizAnswer === index && (
                                                <div className="ml-auto">
                                                    {index === currentStep.content.quiz!.correctAnswer ? (
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <X className="h-4 w-4 text-red-600" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </Button>
                                ))}
                            </div>

                            {quizAnswer !== null && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                                    <p className="text-sm">
                                        <strong>Explanation:</strong> {currentStep.content.quiz.explanation}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // Main onboarding overlay
    return (
        <div className="fixed inset-0 z-50 bg-black/50">
            {/* Highlight target element if specified */}
            {currentStep.target && (
                <div
                    className="absolute border-2 border-blue-500 rounded-lg shadow-lg pointer-events-none"
                    style={{
                        // This would be calculated based on the target element's position
                        // For demo purposes, using placeholder values
                        top: '20%',
                        left: '20%',
                        width: '300px',
                        height: '200px'
                    }}
                />
            )}

            {/* Onboarding card */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Card className="w-96 max-w-[90vw]">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {currentStep.type === 'tour' && <Eye className="h-4 w-4 text-blue-500" />}
                                {currentStep.type === 'interaction' && <Hand className="h-4 w-4 text-green-500" />}
                                {currentStep.type === 'information' && <Lightbulb className="h-4 w-4 text-yellow-500" />}
                                {currentStep.type === 'task' && <Target className="h-4 w-4 text-purple-500" />}
                                {currentStep.type === 'quiz' && <Target className="h-4 w-4 text-red-500" />}
                                <CardTitle className="text-lg">{currentStep.title}</CardTitle>
                            </div>
                            <Button variant="ghost" size="sm" onClick={skipOnboarding}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                Step {currentStepIndex + 1} of {currentFlow.steps.length}
                            </span>
                            <Progress value={progress} className="w-32 h-2" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">{currentStep.description}</p>

                        <div className="space-y-3">
                            <p>{currentStep.content.text}</p>

                            {currentStep.content.image && (
                                <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                                    <span className="text-sm text-muted-foreground">
                                        [Image: {currentStep.content.image}]
                                    </span>
                                </div>
                            )}

                            {currentStep.content.video && (
                                <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                                    <Video className="h-8 w-8 text-muted-foreground" />
                                    <span className="ml-2 text-sm text-muted-foreground">
                                        Video Tutorial
                                    </span>
                                </div>
                            )}

                            {currentStep.content.task && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="h-4 w-4 text-blue-600" />
                                        <span className="font-medium text-blue-900">Try it yourself</span>
                                    </div>
                                    <p className="text-sm text-blue-800">{currentStep.content.task.description}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={previousStep}
                                    disabled={currentStepIndex === 0}
                                >
                                    <ArrowLeft className="h-3 w-3 mr-1" />
                                    Previous
                                </Button>
                                {currentStep.optional && (
                                    <Button variant="ghost" size="sm" onClick={skipStep}>
                                        Skip
                                    </Button>
                                )}
                            </div>

                            <Button onClick={nextStep}>
                                {currentStepIndex === currentFlow.steps.length - 1 ? 'Complete' : 'Next'}
                                <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Onboarding trigger component
interface OnboardingTriggerProps {
    flowId: string;
    children?: React.ReactNode;
    variant?: 'button' | 'card' | 'banner';
}

export function OnboardingTrigger({ flowId, children, variant = 'button' }: OnboardingTriggerProps) {
    const [showOnboarding, setShowOnboarding] = useState(false);
    const flow = onboardingFlows.find(f => f.id === flowId);

    if (!flow) return null;

    const handleStart = () => {
        setShowOnboarding(true);
    };

    const handleComplete = () => {
        setShowOnboarding(false);
        // Could trigger analytics or user progress updates here
    };

    const handleSkip = () => {
        setShowOnboarding(false);
    };

    if (variant === 'card') {
        return (
            <>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleStart}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Play className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium">{flow.title}</h4>
                                <p className="text-sm text-muted-foreground">{flow.description}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline">{flow.estimatedTime}</Badge>
                                    {flow.rewards && (
                                        <Badge variant="secondary">+{flow.rewards.points} points</Badge>
                                    )}
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                {showOnboarding && (
                    <InteractiveOnboarding
                        flowId={flowId}
                        autoStart={true}
                        onComplete={handleComplete}
                        onSkip={handleSkip}
                    />
                )}
            </>
        );
    }

    if (variant === 'banner') {
        return (
            <>
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Zap className="h-5 w-5 text-blue-600" />
                                <div>
                                    <h4 className="font-medium text-blue-900">{flow.title}</h4>
                                    <p className="text-sm text-blue-700">{flow.description}</p>
                                </div>
                            </div>
                            <Button onClick={handleStart}>
                                Start Tour
                                <Play className="h-3 w-3 ml-1" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {showOnboarding && (
                    <InteractiveOnboarding
                        flowId={flowId}
                        autoStart={true}
                        onComplete={handleComplete}
                        onSkip={handleSkip}
                    />
                )}
            </>
        );
    }

    return (
        <>
            {children ? (
                <div onClick={handleStart} className="cursor-pointer">
                    {children}
                </div>
            ) : (
                <Button onClick={handleStart}>
                    <Play className="h-4 w-4 mr-2" />
                    Start {flow.title}
                </Button>
            )}

            {showOnboarding && (
                <InteractiveOnboarding
                    flowId={flowId}
                    autoStart={true}
                    onComplete={handleComplete}
                    onSkip={handleSkip}
                />
            )}
        </>
    );
}