import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Edit,
  Trash2,
  Plus,
  Users,
  DollarSign,
  Calendar,
  MessageSquare,
  TrendingUp
} from 'lucide-react';

export default function BuyerRFQs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data - in real app, this would come from API
  const { data: rfqs = [], isLoading } = useQuery({
    queryKey: ['/api/buyer/rfqs', statusFilter, searchQuery],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [
        {
          id: 1,
          title: 'Industrial Water Pumps for Treatment Plant',
          description: 'Need high-quality water pumps for municipal water treatment facility. Must be energy efficient and meet ISO standards.',
          category: 'Machinery',
          subcategory: 'Pumps & Valves',
          quantity: 50,
          unit: 'pieces',
          budget: 50000,
          currency: 'USD',
          specifications: 'ISO 9001 certified, Energy Star rated, Stainless steel construction',
          requirements: 'Must include installation and maintenance support',
          deadline: '2024-02-15',
          status: 'active',
          responses: 8,
          views: 156,
          createdAt: '2024-01-15T10:30:00Z',
          quotations: [
            {
              id: 1,
              supplierName: 'Shanghai Manufacturing Co.',
              supplierCountry: 'China',
              price: 850,
              totalPrice: 42500,
              leadTime: '30 days',
              paymentTerms: 'T/T 30% advance',
              rating: 4.8,
              isVerified: true
            },
            {
              id: 2,
              supplierName: 'Guangzhou Industrial Ltd.',
              supplierCountry: 'China',
              price: 920,
              totalPrice: 46000,
              leadTime: '25 days',
              paymentTerms: 'L/C at sight',
              rating: 4.6,
              isVerified: true
            }
          ]
        },
        {
          id: 2,
          title: 'LED Street Lighting System',
          description: 'Municipal project requiring LED street lights with smart controls and monitoring system.',
          category: 'Electronics',
          subcategory: 'LED Lighting',
          quantity: 200,
          unit: 'units',
          budget: 25000,
          currency: 'USD',
          specifications: 'IP65 rating, 5000K color temperature, Smart control system',
          requirements: 'Include installation and 5-year warranty',
          deadline: '2024-03-01',
          status: 'active',
          responses: 12,
          views: 234,
          createdAt: '2024-01-14T14:20:00Z',
          quotations: []
        },
        {
          id: 3,
          title: 'Custom Packaging Solutions',
          description: 'Need eco-friendly packaging boxes for electronics products with custom printing.',
          category: 'Packaging',
          subcategory: 'Custom Boxes',
          quantity: 10000,
          unit: 'boxes',
          budget: 15000,
          currency: 'USD',
          specifications: 'Recycled cardboard, Custom printing, Various sizes',
          requirements: 'FSC certified materials, Fast turnaround',
          deadline: '2024-02-28',
          status: 'closed',
          responses: 6,
          views: 89,
          createdAt: '2024-01-10T09:15:00Z',
          quotations: [
            {
              id: 3,
              supplierName: 'Dongguan Packaging Co.',
              supplierCountry: 'China',
              price: 1.45,
              totalPrice: 14500,
              leadTime: '20 days',
              paymentTerms: 'T/T 50% advance',
              rating: 4.7,
              isVerified: false
            }
          ]
        },
        {
          id: 4,
          title: 'Steel Construction Materials',
          description: 'Structural steel beams and columns for commercial building construction.',
          category: 'Construction',
          subcategory: 'Steel Materials',
          quantity: 100,
          unit: 'tons',
          budget: 80000,
          currency: 'USD',
          specifications: 'ASTM A572 Grade 50, Various sizes, Galvanized finish',
          requirements: 'Include delivery and installation quotes',
          deadline: '2024-04-15',
          status: 'draft',
          responses: 0,
          views: 0,
          createdAt: '2024-01-20T16:45:00Z',
          quotations: []
        }
      ];
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return TrendingUp;
      case 'closed': return CheckCircle;
      case 'draft': return Clock;
      case 'expired': return AlertCircle;
      default: return Clock;
    }
  };

  const filteredRFQs = rfqs.filter(rfq => {
    const matchesSearch = rfq.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rfq.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rfq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const stats = {
    total: rfqs.length,
    active: rfqs.filter(r => r.status === 'active').length,
    closed: rfqs.filter(r => r.status === 'closed').length,
    draft: rfqs.filter(r => r.status === 'draft').length
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
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total RFQs</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Closed</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Drafts</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
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
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
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
              filteredRFQs.map((rfq) => {
                const StatusIcon = getStatusIcon(rfq.status);
                return (
                  <Card key={rfq.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {rfq.title}
                            </h3>
                            <Badge className={getStatusColor(rfq.status)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {rfq.status.charAt(0).toUpperCase() + rfq.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {rfq.category} • {rfq.subcategory}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                            {rfq.description}
                          </p>
                        </div>
                      </div>

                      {/* RFQ Details */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium">{rfq.quantity.toLocaleString()} {rfq.unit}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Budget:</span>
                          <span className="font-medium">{formatPrice(rfq.budget, rfq.currency)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Deadline:</span>
                          <span className="font-medium">{formatDate(rfq.deadline)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Responses:</span>
                          <span className="font-medium">{rfq.responses}</span>
                        </div>
                      </div>

                      {/* Statistics */}
                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                        <span>Views: {rfq.views}</span>
                        <span>Created: {formatDate(rfq.createdAt)}</span>
                      </div>

                      {/* Quotations Preview */}
                      {rfq.quotations.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Top Quotations ({rfq.quotations.length})
                          </h4>
                          <div className="space-y-2">
                            {rfq.quotations.slice(0, 2).map((quotation) => (
                              <div key={quotation.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{quotation.supplierName}</span>
                                    <span className="text-xs text-gray-500">({quotation.supplierCountry})</span>
                                    {quotation.isVerified && (
                                      <Badge variant="secondary" className="text-xs">
                                        Verified
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium text-green-600">
                                      {formatPrice(quotation.price, rfq.currency)}/unit
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Total: {formatPrice(quotation.totalPrice, rfq.currency)}
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                                  <span>Lead Time: {quotation.leadTime}</span>
                                  <span>Payment: {quotation.paymentTerms}</span>
                                  <span>Rating: {quotation.rating}/5</span>
                                </div>
                              </div>
                            ))}
                            {rfq.quotations.length > 2 && (
                              <p className="text-xs text-gray-500 text-center">
                                And {rfq.quotations.length - 2} more quotations...
                              </p>
                            )}
                          </div>
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
                        {rfq.status === 'draft' && (
                          <>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-2" />
                              Publish
                            </Button>
                          </>
                        )}
                        {rfq.status === 'active' && (
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            View Responses
                          </Button>
                        )}
                        {rfq.quotations.length > 0 && (
                          <Button variant="outline" size="sm">
                            <Users className="h-4 w-4 mr-2" />
                            Compare Quotes
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4 mr-2" />
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
