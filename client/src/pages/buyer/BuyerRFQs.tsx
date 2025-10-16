import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Trash2,
  Plus,
  Users,
  DollarSign,
  Calendar,
  Package,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function BuyerRFQs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch RFQs from API
  const { data: rfqsData, isLoading } = useQuery({
    queryKey: ['/api/rfqs', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/rfqs?buyerId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch RFQs');
      return response.json();
    },
    enabled: !!user?.id
  });

  const rfqs = rfqsData || [];

  // Fetch categories for display
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories?isActive=true');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  // Helper function to get category name
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat: any) => cat.id === categoryId);
    return category ? category.name : categoryId || 'General';
  };

  // Delete RFQ mutation
  const deleteRFQMutation = useMutation({
    mutationFn: async (rfqId: string) => {
      const response = await fetch(`/api/rfqs/${rfqId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete RFQ');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rfqs'] });
      toast.success('RFQ deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete RFQ');
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return TrendingUp;
      case 'closed': return CheckCircle;
      default: return Clock;
    }
  };

  const filteredRFQs = rfqs.filter((rfq: any) => {
    const matchesSearch = rfq.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rfq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const stats = {
    total: rfqs.length,
    open: rfqs.filter((r: any) => r.status === 'open').length,
    closed: rfqs.filter((r: any) => r.status === 'closed').length,
    totalValue: rfqs.reduce((sum: number, r: any) => sum + (parseFloat(r.targetPrice) || 0), 0)
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                My RFQs
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your Request for Quotations and compare supplier responses
              </p>
            </div>
            <Link href="/rfq/create">
              <Button className="mt-4 lg:mt-0">
                <Plus className="h-4 w-4 mr-2" />
                Create New RFQ
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total RFQs</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-white">{stats.total}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Open</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-white">{stats.open}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Closed</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.closed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Budget</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-white">{formatPrice(stats.totalValue)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by title or category..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RFQs List */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading RFQs...</span>
              </div>
            ) : filteredRFQs.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No RFQs found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Create your first RFQ to start receiving quotations from suppliers.'
                    }
                  </p>
                  <Link href="/rfq/create">
                    <Button>
                      Create RFQ
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              filteredRFQs.map((rfq: any) => {
                const StatusIcon = getStatusIcon(rfq.status);
                const quotationCount = rfq.quotationsCount || 0;
                return (
                  <Card key={rfq.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                {rfq.title}
                              </h3>
                              <div className="flex gap-2">
                                <Badge className={getStatusColor(rfq.status)}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {rfq.status?.charAt(0).toUpperCase() + rfq.status?.slice(1)}
                                </Badge>
                                {rfq.categoryId && (
                                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                                    {getCategoryName(rfq.categoryId)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                            {rfq.description}
                          </p>
                          {rfq.attachments && rfq.attachments.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs font-medium text-gray-600 mb-2">Attachments:</p>
                              <div className="flex flex-wrap gap-2">
                                {rfq.attachments.map((attachment: string, index: number) => (
                                  <a 
                                    key={index}
                                    href={attachment} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-100"
                                  >
                                    <FileText className="w-3 h-3" />
                                    Doc {index + 1}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* RFQ Details */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium">{rfq.quantity?.toLocaleString() || 'N/A'} units</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Target Price:</span>
                          <span className="font-medium">{formatPrice(parseFloat(rfq.targetPrice))}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Expected:</span>
                          <span className="font-medium">{formatDate(rfq.expectedDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Quotations:</span>
                          <span className="font-medium text-blue-600">{quotationCount}</span>
                        </div>
                      </div>

                      {/* Statistics */}
                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                        <span>Location: {rfq.deliveryLocation || 'N/A'}</span>
                        <span>Created: {formatDate(rfq.createdAt)}</span>
                      </div>

                      {/* Quotation Badge */}
                      {quotationCount > 0 && (
                        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                            ✓ {quotationCount} quotation{quotationCount > 1 ? 's' : ''} received from admin
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/rfq/${rfq.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        {quotationCount > 0 && (
                          <Link href={`/rfq/${rfq.id}`}>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              View Quotations ({quotationCount})
                            </Button>
                          </Link>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this RFQ?')) {
                              deleteRFQMutation.mutate(rfq.id);
                            }
                          }}
                          disabled={deleteRFQMutation.isPending}
                        >
                          {deleteRFQMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {filteredRFQs.length > 0 && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="default" size="sm">1</Button>
                <Button variant="outline" size="sm">2</Button>
                <Button variant="outline" size="sm">3</Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
