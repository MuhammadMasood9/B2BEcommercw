import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import Breadcrumb from "@/components/Breadcrumb";
import {
  Search,
  Code,
  Copy,
  ExternalLink,
  Book,
  Zap,
  Shield,
  Database,
  Settings,
  BarChart3,
  Users,
  Package,
  DollarSign,
  Bell,
  FileText,
  CheckCircle,
  AlertTriangle,
  Info
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// API endpoint structure
interface APIEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  title: string;
  description: string;
  category: string;
  authentication: boolean;
  permissions?: string[];
  parameters?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
    example?: any;
  }[];
  requestBody?: {
    type: string;
    description: string;
    example: any;
  };
  responses: {
    status: number;
    description: string;
    example: any;
  }[];
  examples?: {
    title: string;
    description: string;
    request: string;
    response: string;
  }[];
}

// Sample API endpoints
const apiEndpoints: APIEndpoint[] = [
  // Dashboard APIs
  {
    id: 'dashboard-metrics',
    method: 'GET',
    path: '/api/admin/dashboard/metrics',
    title: 'Get Dashboard Metrics',
    description: 'Retrieve comprehensive dashboard metrics including KPIs and trends',
    category: 'Dashboard',
    authentication: true,
    permissions: ['admin.dashboard.read'],
    parameters: [
      {
        name: 'timeRange',
        type: 'string',
        required: false,
        description: 'Time range for metrics (7d, 30d, 90d)',
        example: '30d'
      },
      {
        name: 'includeComparisons',
        type: 'boolean',
        required: false,
        description: 'Include period-over-period comparisons',
        example: true
      }
    ],
    responses: [
      {
        status: 200,
        description: 'Dashboard metrics retrieved successfully',
        example: {
          kpis: {
            totalRevenue: 125000,
            activeSuppliers: 45,
            pendingApprovals: 8,
            systemAlerts: 2
          },
          trends: {
            revenue: [/* chart data */],
            suppliers: [/* chart data */]
          },
          comparisons: {
            revenue: { current: 125000, previous: 110000, change: 13.6 }
          }
        }
      }
    ],
    examples: [
      {
        title: 'Get 30-day metrics with comparisons',
        description: 'Retrieve dashboard metrics for the last 30 days including period comparisons',
        request: 'GET /api/admin/dashboard/metrics?timeRange=30d&includeComparisons=true',
        response: JSON.stringify({
          success: true,
          data: {
            kpis: { totalRevenue: 125000, activeSuppliers: 45 },
            comparisons: { revenue: { change: 13.6 } }
          }
        }, null, 2)
      }
    ]
  },

  // Supplier Management APIs
  {
    id: 'suppliers-list',
    method: 'GET',
    path: '/api/admin/suppliers',
    title: 'List Suppliers',
    description: 'Get a paginated list of all suppliers with filtering options',
    category: 'Supplier Management',
    authentication: true,
    permissions: ['admin.suppliers.read'],
    parameters: [
      {
        name: 'page',
        type: 'number',
        required: false,
        description: 'Page number for pagination',
        example: 1
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Number of items per page',
        example: 20
      },
      {
        name: 'status',
        type: 'string',
        required: false,
        description: 'Filter by supplier status',
        example: 'active'
      },
      {
        name: 'search',
        type: 'string',
        required: false,
        description: 'Search suppliers by name or email',
        example: 'acme'
      }
    ],
    responses: [
      {
        status: 200,
        description: 'Suppliers retrieved successfully',
        example: {
          suppliers: [
            {
              id: 'sup_123',
              name: 'Acme Corp',
              email: 'contact@acme.com',
              status: 'active',
              tier: 'gold',
              joinedAt: '2024-01-15T10:00:00Z'
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 45,
            pages: 3
          }
        }
      }
    ]
  },

  {
    id: 'supplier-approve',
    method: 'POST',
    path: '/api/admin/suppliers/{id}/approve',
    title: 'Approve Supplier',
    description: 'Approve a pending supplier application',
    category: 'Supplier Management',
    authentication: true,
    permissions: ['admin.suppliers.approve'],
    parameters: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'Supplier ID',
        example: 'sup_123'
      }
    ],
    requestBody: {
      type: 'object',
      description: 'Approval details',
      example: {
        tier: 'silver',
        commissionRate: 5.0,
        notes: 'Approved after document verification'
      }
    },
    responses: [
      {
        status: 200,
        description: 'Supplier approved successfully',
        example: {
          success: true,
          message: 'Supplier approved successfully',
          supplier: {
            id: 'sup_123',
            status: 'active',
            tier: 'silver',
            approvedAt: '2024-01-20T15:30:00Z'
          }
        }
      },
      {
        status: 404,
        description: 'Supplier not found',
        example: {
          success: false,
          error: 'Supplier not found'
        }
      }
    ]
  },

  // Financial Management APIs
  {
    id: 'commission-settings',
    method: 'PUT',
    path: '/api/admin/financial/commission/settings',
    title: 'Update Commission Settings',
    description: 'Update commission rate configuration',
    category: 'Financial Management',
    authentication: true,
    permissions: ['admin.financial.write'],
    requestBody: {
      type: 'object',
      description: 'Commission configuration',
      example: {
        defaultRate: 5.0,
        tierRates: {
          silver: 4.5,
          gold: 4.0,
          platinum: 3.5
        },
        categoryRates: {
          electronics: 3.0,
          clothing: 6.0
        }
      }
    },
    responses: [
      {
        status: 200,
        description: 'Commission settings updated successfully',
        example: {
          success: true,
          message: 'Commission settings updated',
          settings: {
            defaultRate: 5.0,
            effectiveDate: '2024-01-21T00:00:00Z'
          }
        }
      }
    ]
  },

  // Content Moderation APIs
  {
    id: 'products-queue',
    method: 'GET',
    path: '/api/admin/moderation/products/queue',
    title: 'Get Product Review Queue',
    description: 'Get products pending approval with priority scoring',
    category: 'Content Moderation',
    authentication: true,
    permissions: ['admin.moderation.read'],
    parameters: [
      {
        name: 'priority',
        type: 'string',
        required: false,
        description: 'Filter by priority level',
        example: 'high'
      },
      {
        name: 'category',
        type: 'string',
        required: false,
        description: 'Filter by product category',
        example: 'electronics'
      }
    ],
    responses: [
      {
        status: 200,
        description: 'Product queue retrieved successfully',
        example: {
          products: [
            {
              id: 'prod_456',
              title: 'Wireless Headphones',
              supplier: 'Acme Corp',
              priority: 'high',
              submittedAt: '2024-01-20T10:00:00Z',
              riskScore: 0.2
            }
          ],
          summary: {
            total: 25,
            high: 5,
            medium: 12,
            low: 8
          }
        }
      }
    ]
  },

  // System Monitoring APIs
  {
    id: 'system-health',
    method: 'GET',
    path: '/api/admin/monitoring/system/health',
    title: 'Get System Health',
    description: 'Retrieve comprehensive system health metrics',
    category: 'System Monitoring',
    authentication: true,
    permissions: ['admin.monitoring.read'],
    responses: [
      {
        status: 200,
        description: 'System health retrieved successfully',
        example: {
          status: 'healthy',
          uptime: 99.9,
          metrics: {
            cpu: 45.2,
            memory: 67.8,
            disk: 23.1,
            database: {
              connections: 15,
              responseTime: 12.5
            }
          },
          alerts: [
            {
              id: 'alert_789',
              type: 'warning',
              message: 'High memory usage detected'
            }
          ]
        }
      }
    ]
  }
];

// Group endpoints by category
const categories = Array.from(new Set(apiEndpoints.map(endpoint => endpoint.category)));

export default function AdminAPIDocumentation() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMethod, setSelectedMethod] = useState("all");
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());

  // Filter endpoints
  const filteredEndpoints = apiEndpoints.filter(endpoint => {
    const matchesSearch = searchQuery === "" ||
      endpoint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.path.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || endpoint.category === selectedCategory;
    const matchesMethod = selectedMethod === "all" || endpoint.method === selectedMethod;
    
    return matchesSearch && matchesCategory && matchesMethod;
  });

  const toggleEndpoint = (endpointId: string) => {
    setExpandedEndpoints(prev => {
      const newSet = new Set(prev);
      if (newSet.has(endpointId)) {
        newSet.delete(endpointId);
      } else {
        newSet.add(endpointId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'PATCH': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Dashboard': return <BarChart3 className="h-4 w-4" />;
      case 'Supplier Management': return <Users className="h-4 w-4" />;
      case 'Financial Management': return <DollarSign className="h-4 w-4" />;
      case 'Content Moderation': return <Package className="h-4 w-4" />;
      case 'System Monitoring': return <Shield className="h-4 w-4" />;
      default: return <Code className="h-4 w-4" />;
    }
  };

  const renderEndpoint = (endpoint: APIEndpoint) => {
    const isExpanded = expandedEndpoints.has(endpoint.id);
    
    return (
      <Card key={endpoint.id} className="mb-4">
        <Collapsible open={isExpanded} onOpenChange={() => toggleEndpoint(endpoint.id)}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={getMethodColor(endpoint.method)}>
                    {endpoint.method}
                  </Badge>
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {endpoint.path}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  {endpoint.authentication && (
                    <Badge variant="outline">
                      <Shield className="h-3 w-3 mr-1" />
                      Auth Required
                    </Badge>
                  )}
                  {getCategoryIcon(endpoint.category)}
                </div>
              </div>
              <div>
                <CardTitle className="text-lg">{endpoint.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{endpoint.description}</p>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-6">
                {/* Authentication & Permissions */}
                {endpoint.authentication && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Authentication & Permissions
                    </h4>
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-sm mb-2">This endpoint requires authentication.</p>
                      {endpoint.permissions && (
                        <div>
                          <p className="text-sm font-medium mb-1">Required permissions:</p>
                          <div className="flex flex-wrap gap-1">
                            {endpoint.permissions.map(permission => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Parameters */}
                {endpoint.parameters && endpoint.parameters.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Parameters</h4>
                    <div className="border rounded overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-3 font-medium">Name</th>
                            <th className="text-left p-3 font-medium">Type</th>
                            <th className="text-left p-3 font-medium">Required</th>
                            <th className="text-left p-3 font-medium">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {endpoint.parameters.map((param, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-3 font-mono text-sm">{param.name}</td>
                              <td className="p-3">
                                <Badge variant="outline">{param.type}</Badge>
                              </td>
                              <td className="p-3">
                                {param.required ? (
                                  <Badge variant="destructive">Required</Badge>
                                ) : (
                                  <Badge variant="secondary">Optional</Badge>
                                )}
                              </td>
                              <td className="p-3">{param.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Request Body */}
                {endpoint.requestBody && (
                  <div>
                    <h4 className="font-medium mb-2">Request Body</h4>
                    <p className="text-sm text-muted-foreground mb-2">{endpoint.requestBody.description}</p>
                    <div className="bg-gray-50 border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{endpoint.requestBody?.type}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(endpoint.requestBody?.example || {}, null, 2))}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <pre className="text-xs overflow-x-auto">
                        <code>{JSON.stringify(endpoint.requestBody?.example || {}, null, 2)}</code>
                      </pre>
                    </div>
                  </div>
                )}

                {/* Responses */}
                <div>
                  <h4 className="font-medium mb-2">Responses</h4>
                  <div className="space-y-3">
                    {endpoint.responses.map((response, index) => (
                      <div key={index} className="border rounded">
                        <div className="bg-gray-50 px-3 py-2 border-b">
                          <div className="flex items-center gap-2">
                            <Badge variant={response.status === 200 ? "default" : "destructive"}>
                              {response.status}
                            </Badge>
                            <span className="text-sm">{response.description}</span>
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Example Response</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(JSON.stringify(response.example, null, 2))}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                            <code>{JSON.stringify(response.example, null, 2)}</code>
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Examples */}
                {endpoint.examples && endpoint.examples.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Examples</h4>
                    <div className="space-y-4">
                      {endpoint.examples.map((example, index) => (
                        <div key={index} className="border rounded">
                          <div className="bg-gray-50 px-3 py-2 border-b">
                            <h5 className="font-medium">{example.title}</h5>
                            <p className="text-sm text-muted-foreground">{example.description}</p>
                          </div>
                          <div className="p-3 space-y-3">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Request</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(example.request)}
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </Button>
                              </div>
                              <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                                <code>{example.request}</code>
                              </pre>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Response</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(example.response)}
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </Button>
                              </div>
                              <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                                <code>{example.response}</code>
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  return (
    <div className="p-8 space-y-6">
      <Breadcrumb items={[
        { label: "Admin Dashboard", href: "/admin" },
        { label: "Documentation", href: "/admin/documentation" },
        { label: "API Reference" }
      ]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin API Documentation</h1>
          <p className="text-muted-foreground mt-1">
            Complete reference for admin management API endpoints
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/admin/docs/api-authentication">
              <Shield className="h-4 w-4 mr-2" />
              Authentication Guide
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/admin/docs/api-examples" target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Postman Collection
            </a>
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
                placeholder="Search API endpoints..."
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

              <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Code className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{apiEndpoints.length}</div>
            <div className="text-sm text-muted-foreground">Total Endpoints</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{apiEndpoints.filter(e => e.authentication).length}</div>
            <div className="text-sm text-muted-foreground">Authenticated</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Database className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{categories.length}</div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">REST</div>
            <div className="text-sm text-muted-foreground">API Type</div>
          </CardContent>
        </Card>
      </div>

      {/* API Endpoints */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            API Endpoints
            <span className="text-sm text-muted-foreground ml-2">
              ({filteredEndpoints.length} endpoints)
            </span>
          </h2>
          <Button
            variant="outline"
            onClick={() => {
              if (expandedEndpoints.size === filteredEndpoints.length) {
                setExpandedEndpoints(new Set());
              } else {
                setExpandedEndpoints(new Set([...filteredEndpoints.map(e => e.id)]));
              }
            }}
          >
            {Array.from(expandedEndpoints).length === filteredEndpoints.length ? 'Collapse All' : 'Expand All'}
          </Button>
        </div>

        {filteredEndpoints.length > 0 ? (
          <div>
            {filteredEndpoints.map(renderEndpoint)}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No endpoints found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or filters.
              </p>
              <Button variant="outline" onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedMethod("all");
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