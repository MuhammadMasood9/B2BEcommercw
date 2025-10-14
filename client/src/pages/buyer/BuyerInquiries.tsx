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
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Package,
  Eye,
  Download,
  Calendar,
  DollarSign,
  Truck
} from 'lucide-react';

export default function BuyerInquiries() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Mock data - in real app, this would come from API
  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['/api/inquiries', statusFilter, searchQuery, sortBy],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [
        {
          id: 1,
          productId: 'prod-1',
          productName: 'Industrial Water Pumps',
          productImage: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=200&h=200&fit=crop',
          supplierName: 'Shanghai Manufacturing Co.',
          supplierCountry: 'China',
          supplierVerified: true,
          quantity: 50,
          targetPrice: 800,
          message: 'Need pumps for water treatment plant. Must be ISO certified.',
          requirements: 'ISO 9001 certification required',
          status: 'replied',
          createdAt: '2024-01-15T10:30:00Z',
          quotations: [
            {
              id: 1,
              pricePerUnit: 850,
              totalPrice: 42500,
              moq: 50,
              leadTime: '30 days',
              paymentTerms: 'T/T 30% advance',
              validUntil: '2024-02-15',
              message: 'We can provide ISO certified pumps. Samples available.'
            }
          ]
        },
        {
          id: 2,
          productId: 'prod-2',
          productName: 'LED Street Lights',
          productImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
          supplierName: 'Guangzhou Electronics Ltd.',
          supplierCountry: 'China',
          supplierVerified: true,
          quantity: 200,
          targetPrice: 25,
          message: 'Looking for LED street lights for municipal project.',
          requirements: 'Must meet IP65 rating',
          status: 'pending',
          createdAt: '2024-01-14T14:20:00Z',
          quotations: []
        },
        {
          id: 3,
          productId: 'prod-3',
          productName: 'Custom Packaging Boxes',
          productImage: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=200&h=200&fit=crop',
          supplierName: 'Dongguan Packaging Co.',
          supplierCountry: 'China',
          supplierVerified: false,
          quantity: 1000,
          targetPrice: 2.5,
          message: 'Need custom printed boxes for electronics packaging.',
          requirements: 'Eco-friendly materials preferred',
          status: 'negotiating',
          createdAt: '2024-01-13T09:15:00Z',
          quotations: [
            {
              id: 2,
              pricePerUnit: 2.8,
              totalPrice: 2800,
              moq: 500,
              leadTime: '15 days',
              paymentTerms: 'T/T 50% advance',
              validUntil: '2024-02-10',
              message: 'Can provide eco-friendly materials. Sample available.'
            }
          ]
        },
        {
          id: 4,
          productId: 'prod-4',
          productName: 'Steel Construction Beams',
          productImage: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=200&h=200&fit=crop',
          supplierName: 'Beijing Steel Works',
          supplierCountry: 'China',
          supplierVerified: true,
          quantity: 100,
          targetPrice: 120,
          message: 'Construction project requiring structural steel beams.',
          requirements: 'ASTM A572 Grade 50',
          status: 'closed',
          createdAt: '2024-01-10T16:45:00Z',
          quotations: [
            {
              id: 3,
              pricePerUnit: 125,
              totalPrice: 12500,
              moq: 100,
              leadTime: '45 days',
              paymentTerms: 'L/C at sight',
              validUntil: '2024-02-05',
              message: 'ASTM certified steel available. Factory inspection welcome.'
            }
          ]
        }
      ];
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'replied': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'negotiating': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'replied': return CheckCircle;
      case 'pending': return Clock;
      case 'negotiating': return MessageSquare;
      case 'closed': return AlertCircle;
      default: return Clock;
    }
  };

  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = inquiry.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         inquiry.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              My Inquiries
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track and manage all your product inquiries and quotations
            </p>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by product or supplier..."
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
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="replied">Replied</SelectItem>
                      <SelectItem value="negotiating">Negotiating</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
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

          {/* Inquiries List */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading inquiries...</span>
              </div>
            ) : filteredInquiries.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No inquiries found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Start by browsing products and sending inquiries to suppliers.'
                    }
                  </p>
                  <Link href="/products">
                    <Button>
                      Browse Products
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              filteredInquiries.map((inquiry) => {
                const StatusIcon = getStatusIcon(inquiry.status);
                return (
                  <Card key={inquiry.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={inquiry.productImage}
                            alt={inquiry.productName}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        </div>

                        {/* Main Content */}
                        <div className="flex-1">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                {inquiry.productName}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Supplier: {inquiry.supplierName} • {inquiry.supplierCountry}
                                {inquiry.supplierVerified && (
                                  <Badge variant="secondary" className="ml-2">
                                    Verified
                                  </Badge>
                                )}
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {inquiry.message}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 mt-4 lg:mt-0">
                              <Badge className={getStatusColor(inquiry.status)}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {formatDate(inquiry.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Inquiry Details */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Package className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Quantity:</span>
                              <span className="font-medium">{inquiry.quantity.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Target Price:</span>
                              <span className="font-medium">{formatPrice(inquiry.targetPrice)}/unit</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Sent:</span>
                              <span className="font-medium">{formatDate(inquiry.createdAt)}</span>
                            </div>
                          </div>

                          {/* Quotations */}
                          {inquiry.quotations.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                Quotations Received ({inquiry.quotations.length})
                              </h4>
                              <div className="space-y-2">
                                {inquiry.quotations.map((quotation) => (
                                  <div key={quotation.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <span className="font-medium text-green-600">
                                          {formatPrice(quotation.pricePerUnit)}/unit
                                        </span>
                                        <span className="text-gray-600 ml-2">
                                          (Total: {formatPrice(quotation.totalPrice)})
                                        </span>
                                      </div>
                                      <Badge variant="outline" className="text-xs">
                                        Valid until {formatDate(quotation.validUntil)}
                                      </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                                      <span>MOQ: {quotation.moq}</span>
                                      <span>Lead Time: {quotation.leadTime}</span>
                                      <span>Payment: {quotation.paymentTerms}</span>
                                      <span className="truncate" title={quotation.message}>
                                        {quotation.message}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Requirements */}
                          {inquiry.requirements && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                Requirements:
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {inquiry.requirements}
                              </p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button variant="outline" size="sm">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message Supplier
                            </Button>
                            {inquiry.quotations.length > 0 && (
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Download Quote
                              </Button>
                            )}
                            {inquiry.status === 'replied' && (
                              <Button size="sm">
                                <Truck className="h-4 w-4 mr-2" />
                                Start Order
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {filteredInquiries.length > 0 && (
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
