import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  BarChart3, 
  CheckCircle, 
  X, 
  Eye, 
  Download, 
  TrendingUp, 
  TrendingDown,
  Clock,
  DollarSign,
  Package,
  Truck,
  Shield,
  Star,
  MessageSquare,
  FileText,
  Calculator,
  Award,
  AlertTriangle,
  Info,
  CheckSquare,
  Square,
  ArrowRight,
  Percent,
  Timer,
  Globe
} from 'lucide-react';

interface Quotation {
  id: string;
  type: 'rfq' | 'inquiry';
  productName: string;
  supplierName?: string;
  adminName?: string;
  unitPrice: number;
  totalPrice: number;
  quantity: number;
  moq: number;
  leadTime: string;
  paymentTerms: string;
  validUntil: string;
  status: string;
  createdAt: string;
  rfqId?: string;
  inquiryId?: string;
  message?: string;
  attachments?: string[];
  termsConditions?: string;
  // Additional fields for comparison
  shippingCost?: number;
  taxAmount?: number;
  discountPercent?: number;
  certifications?: string[];
  warranty?: string;
  returnPolicy?: string;
  supplierRating?: number;
  responseTime?: string;
}

interface QuotationComparisonProps {
  quotations: Quotation[];
  onAccept?: (quotation: Quotation) => void;
  onReject?: (quotation: Quotation) => void;
  onNegotiate?: (quotation: Quotation) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuotationComparison({
  quotations,
  onAccept,
  onReject,
  onNegotiate,
  isOpen,
  onClose
}: QuotationComparisonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedQuotations, setSelectedQuotations] = useState<Quotation[]>([]);
  const [comparisonMode, setComparisonMode] = useState<'side-by-side' | 'detailed' | 'summary'>('side-by-side');
  const [sortBy, setSortBy] = useState<'price' | 'total' | 'leadtime' | 'rating'>('price');
  const [showOnlyPending, setShowOnlyPending] = useState(true);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isNegotiateDialogOpen, setIsNegotiateDialogOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [shippingAddress, setShippingAddress] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [negotiationMessage, setNegotiationMessage] = useState('');
  const [counterOffer, setCounterOffer] = useState({
    quantity: '',
    targetPrice: '',
    message: ''
  });

  // Filter and sort quotations
  const filteredQuotations = quotations.filter(q => 
    !showOnlyPending || q.status === 'pending'
  );

  const sortedQuotations = [...filteredQuotations].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.unitPrice - b.unitPrice;
      case 'total':
        return a.totalPrice - b.totalPrice;
      case 'leadtime':
        // Simple lead time comparison (assumes format like "7-15 days")
        const aLeadTime = parseInt(a.leadTime.match(/\d+/)?.[0] || '999');
        const bLeadTime = parseInt(b.leadTime.match(/\d+/)?.[0] || '999');
        return aLeadTime - bLeadTime;
      case 'rating':
        return (b.supplierRating || 0) - (a.supplierRating || 0);
      default:
        return 0;
    }
  });

  // Initialize selected quotations
  useEffect(() => {
    if (quotations.length > 0 && selectedQuotations.length === 0) {
      setSelectedQuotations(sortedQuotations.slice(0, Math.min(3, sortedQuotations.length)));
    }
  }, [quotations, sortedQuotations]);

  const handleQuotationSelect = (quotation: Quotation, selected: boolean) => {
    if (selected && selectedQuotations.length < 3) {
      setSelectedQuotations([...selectedQuotations, quotation]);
    } else if (!selected) {
      setSelectedQuotations(selectedQuotations.filter(q => q.id !== quotation.id));
    } else {
      toast({
        title: "Selection Limit",
        description: "You can compare up to 3 quotations at a time.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "accepted": return <CheckCircle className="h-4 w-4" />;
      case "rejected": return <X className="h-4 w-4" />;
      case "expired": return <AlertTriangle className="h-4 w-4" />;
      case "negotiating": return <MessageSquare className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "accepted": return "bg-green-100 text-green-800 border-green-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      case "expired": return "bg-gray-100 text-gray-800 border-gray-200";
      case "negotiating": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const calculateSavings = (quotations: Quotation[]) => {
    if (quotations.length < 2) return null;
    
    const prices = quotations.map(q => q.totalPrice);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const savings = maxPrice - minPrice;
    const savingsPercent = ((savings / maxPrice) * 100).toFixed(1);
    
    return { savings, savingsPercent, minPrice, maxPrice };
  };

  const getBestValue = (quotations: Quotation[]) => {
    // Simple scoring algorithm considering price, lead time, and rating
    return quotations.map(q => {
      const priceScore = 100 - ((q.unitPrice / Math.max(...quotations.map(qt => qt.unitPrice))) * 100);
      const leadTimeScore = 100 - ((parseInt(q.leadTime.match(/\d+/)?.[0] || '30') / 30) * 100);
      const ratingScore = (q.supplierRating || 3) * 20;
      
      const totalScore = (priceScore * 0.4) + (leadTimeScore * 0.3) + (ratingScore * 0.3);
      
      return { ...q, valueScore: totalScore };
    }).sort((a, b) => b.valueScore - a.valueScore);
  };

  const handleAccept = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setIsAcceptDialogOpen(true);
  };

  const handleReject = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setIsRejectDialogOpen(true);
  };

  const handleNegotiate = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setCounterOffer({
      quantity: quotation.quantity.toString(),
      targetPrice: (quotation.unitPrice * 0.9).toFixed(2), // 10% lower as starting point
      message: ''
    });
    setIsNegotiateDialogOpen(true);
  };

  const exportComparison = () => {
    const csvContent = [
      ['Supplier', 'Product', 'Unit Price', 'Total Price', 'Quantity', 'Lead Time', 'Payment Terms', 'Status'],
      ...selectedQuotations.map(q => [
        q.supplierName || q.adminName || 'Unknown',
        q.productName,
        q.unitPrice,
        q.totalPrice,
        q.quantity,
        q.leadTime,
        q.paymentTerms,
        q.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotation-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Quotation comparison has been exported to CSV.",
    });
  };

  const savings = calculateSavings(selectedQuotations);
  const bestValueQuotations = getBestValue(selectedQuotations);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Quotation Comparison
          </DialogTitle>
          <DialogDescription>
            Compare quotations side by side to make the best decision for your business.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Label htmlFor="comparison-mode">View:</Label>
              <Tabs value={comparisonMode} onValueChange={(value) => setComparisonMode(value as any)}>
                <TabsList>
                  <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
                  <TabsTrigger value="detailed">Detailed</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="sort-by">Sort by:</Label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="price">Unit Price</option>
                <option value="total">Total Price</option>
                <option value="leadtime">Lead Time</option>
                <option value="rating">Supplier Rating</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="show-pending"
                checked={showOnlyPending}
                onCheckedChange={setShowOnlyPending}
              />
              <Label htmlFor="show-pending">Show only pending</Label>
            </div>

            <Button variant="outline" size="sm" onClick={exportComparison}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Savings Summary */}
          {savings && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Potential Savings</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      ${savings.savings.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-700">
                      {savings.savingsPercent}% savings vs highest quote
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quotation Selection */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Select Quotations to Compare (max 3)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedQuotations.map((quotation) => {
                const isSelected = selectedQuotations.some(q => q.id === quotation.id);
                const bestValue = bestValueQuotations.find(q => q.id === quotation.id);
                
                return (
                  <div 
                    key={quotation.id}
                    className={`p-3 border rounded-lg transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => handleQuotationSelect(quotation, !isSelected)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="font-medium text-sm">{quotation.productName}</span>
                      </div>
                      {bestValue && bestValueQuotations.indexOf(bestValue) === 0 && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                          <Award className="w-3 h-3 mr-1" />
                          Best Value
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Supplier:</span>
                        <span className="font-medium">{quotation.supplierName || quotation.adminName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Unit Price:</span>
                        <span className="font-medium text-green-600">${quotation.unitPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-medium">${quotation.totalPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lead Time:</span>
                        <span>{quotation.leadTime}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Status:</span>
                        <Badge className={`${getStatusColor(quotation.status)} text-xs`}>
                          {quotation.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comparison Views */}
          {selectedQuotations.length > 0 && (
            <Tabs value={comparisonMode} onValueChange={(value) => setComparisonMode(value as any)}>
              <TabsContent value="side-by-side">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-3 font-medium text-gray-700">Criteria</th>
                        {selectedQuotations.map((quotation, index) => (
                          <th key={quotation.id} className="text-left p-3 font-medium text-gray-700">
                            <div className="space-y-2">
                              <Badge className={getStatusColor(quotation.status)}>
                                {getStatusIcon(quotation.status)}
                                <span className="ml-1">{quotation.status}</span>
                              </Badge>
                              <div className="text-xs text-gray-500">
                                <div>Quote #{index + 1}</div>
                                <div>{quotation.supplierName || quotation.adminName}</div>
                              </div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="p-3 font-medium text-gray-700">Product</td>
                        {selectedQuotations.map((quotation) => (
                          <td key={quotation.id} className="p-3">{quotation.productName}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="p-3 font-medium text-gray-700">Quantity</td>
                        {selectedQuotations.map((quotation) => (
                          <td key={quotation.id} className="p-3">{quotation.quantity.toLocaleString()}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-100 bg-green-50">
                        <td className="p-3 font-medium text-gray-700">Unit Price</td>
                        {selectedQuotations.map((quotation) => {
                          const isLowest = quotation.unitPrice === Math.min(...selectedQuotations.map(q => q.unitPrice));
                          return (
                            <td key={quotation.id} className={`p-3 font-medium ${isLowest ? 'text-green-600' : 'text-gray-900'}`}>
                              ${quotation.unitPrice}
                              {isLowest && <TrendingDown className="w-4 h-4 inline ml-1 text-green-600" />}
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="border-b border-gray-100 bg-green-50">
                        <td className="p-3 font-medium text-gray-700">Total Price</td>
                        {selectedQuotations.map((quotation) => {
                          const isLowest = quotation.totalPrice === Math.min(...selectedQuotations.map(q => q.totalPrice));
                          return (
                            <td key={quotation.id} className={`p-3 font-medium ${isLowest ? 'text-green-600' : 'text-gray-900'}`}>
                              ${quotation.totalPrice.toLocaleString()}
                              {isLowest && <TrendingDown className="w-4 h-4 inline ml-1 text-green-600" />}
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="p-3 font-medium text-gray-700">MOQ</td>
                        {selectedQuotations.map((quotation) => (
                          <td key={quotation.id} className="p-3">{quotation.moq.toLocaleString()}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="p-3 font-medium text-gray-700">Lead Time</td>
                        {selectedQuotations.map((quotation) => (
                          <td key={quotation.id} className="p-3">{quotation.leadTime}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="p-3 font-medium text-gray-700">Payment Terms</td>
                        {selectedQuotations.map((quotation) => (
                          <td key={quotation.id} className="p-3">{quotation.paymentTerms || 'Not specified'}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="p-3 font-medium text-gray-700">Valid Until</td>
                        {selectedQuotations.map((quotation) => (
                          <td key={quotation.id} className="p-3">
                            {new Date(quotation.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toLocaleDateString()}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="p-3 font-medium text-gray-700">Actions</td>
                        {selectedQuotations.map((quotation) => (
                          <td key={quotation.id} className="p-3">
                            <div className="flex flex-col gap-2">
                              {quotation.status === 'pending' && (
                                <>
                                  <Button 
                                    size="sm"
                                    onClick={() => handleAccept(quotation)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Accept
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleNegotiate(quotation)}
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                  >
                                    <MessageSquare className="w-3 h-3 mr-1" />
                                    Negotiate
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleReject(quotation)}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Details
                              </Button>
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="detailed">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {selectedQuotations.map((quotation, index) => {
                    const bestValue = bestValueQuotations.find(q => q.id === quotation.id);
                    const isLowestPrice = quotation.totalPrice === Math.min(...selectedQuotations.map(q => q.totalPrice));
                    
                    return (
                      <Card key={quotation.id} className={`${isLowestPrice ? 'border-green-500 bg-green-50' : ''}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Quote #{index + 1}</CardTitle>
                            <div className="flex gap-1">
                              {isLowestPrice && (
                                <Badge className="bg-green-100 text-green-800">
                                  <TrendingDown className="w-3 h-3 mr-1" />
                                  Lowest Price
                                </Badge>
                              )}
                              {bestValue && bestValueQuotations.indexOf(bestValue) === 0 && (
                                <Badge className="bg-yellow-100 text-yellow-800">
                                  <Award className="w-3 h-3 mr-1" />
                                  Best Value
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Badge className={getStatusColor(quotation.status)}>
                            {getStatusIcon(quotation.status)}
                            <span className="ml-1">{quotation.status}</span>
                          </Badge>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">{quotation.productName}</h4>
                            <p className="text-sm text-gray-600">From: {quotation.supplierName || quotation.adminName}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Unit Price:</span>
                              <div className="font-medium text-lg text-green-600">${quotation.unitPrice}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Total Price:</span>
                              <div className="font-medium text-lg">${quotation.totalPrice.toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Quantity:</span>
                              <div className="font-medium">{quotation.quantity.toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">MOQ:</span>
                              <div className="font-medium">{quotation.moq.toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Lead Time:</span>
                              <div className="font-medium">{quotation.leadTime}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Valid Until:</span>
                              <div className="font-medium">
                                {new Date(quotation.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <div>
                            <span className="text-gray-600 text-sm">Payment Terms:</span>
                            <div className="font-medium">{quotation.paymentTerms || 'Not specified'}</div>
                          </div>

                          {quotation.message && (
                            <div>
                              <span className="text-gray-600 text-sm">Message:</span>
                              <div className="text-sm bg-gray-50 p-2 rounded mt-1">{quotation.message}</div>
                            </div>
                          )}

                          {quotation.status === 'pending' && (
                            <div className="flex flex-col gap-2 pt-2">
                              <Button 
                                size="sm"
                                onClick={() => handleAccept(quotation)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Accept Quote
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleNegotiate(quotation)}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Negotiate
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleReject(quotation)}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="summary">
                <div className="space-y-6">
                  {/* Summary Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-600">
                          ${Math.min(...selectedQuotations.map(q => q.unitPrice))}
                        </div>
                        <div className="text-sm text-gray-600">Lowest Unit Price</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Calculator className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-600">
                          ${Math.min(...selectedQuotations.map(q => q.totalPrice)).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Lowest Total</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Timer className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.min(...selectedQuotations.map(q => parseInt(q.leadTime.match(/\d+/)?.[0] || '30')))} days
                        </div>
                        <div className="text-sm text-gray-600">Fastest Delivery</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Percent className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-orange-600">
                          {savings ? savings.savingsPercent : '0'}%
                        </div>
                        <div className="text-sm text-gray-600">Max Savings</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-600" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {bestValueQuotations.slice(0, 3).map((quotation, index) => (
                        <div key={quotation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                              index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{quotation.supplierName || quotation.adminName}</div>
                              <div className="text-sm text-gray-600">
                                ${quotation.unitPrice} per unit • {quotation.leadTime} • Score: {quotation.valueScore?.toFixed(1)}
                              </div>
                            </div>
                          </div>
                          {index === 0 && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Award className="w-3 h-3 mr-1" />
                              Best Value
                            </Badge>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={exportComparison} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Export Comparison
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Accept Dialog */}
      <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Quotation</DialogTitle>
            <DialogDescription>
              Please provide your shipping address to proceed with this quotation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="shipping-address">Shipping Address *</Label>
              <Textarea
                id="shipping-address"
                placeholder="Enter your complete shipping address..."
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAcceptDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedQuotation && onAccept) {
                  onAccept(selectedQuotation);
                  setIsAcceptDialogOpen(false);
                  setShippingAddress('');
                }
              }}
              disabled={!shippingAddress.trim()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Accept Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Quotation</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this quotation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Reason for Rejection *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please explain why you're rejecting this quotation..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedQuotation && onReject) {
                  onReject(selectedQuotation);
                  setIsRejectDialogOpen(false);
                  setRejectionReason('');
                }
              }}
              disabled={!rejectionReason.trim()}
              variant="destructive"
            >
              Reject Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Negotiate Dialog */}
      <Dialog open={isNegotiateDialogOpen} onOpenChange={setIsNegotiateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Counter Offer</DialogTitle>
            <DialogDescription>
              Propose different terms for this quotation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="counter-quantity">Quantity</Label>
                <Input
                  id="counter-quantity"
                  type="number"
                  value={counterOffer.quantity}
                  onChange={(e) => setCounterOffer(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="counter-price">Target Unit Price</Label>
                <Input
                  id="counter-price"
                  type="number"
                  step="0.01"
                  value={counterOffer.targetPrice}
                  onChange={(e) => setCounterOffer(prev => ({ ...prev, targetPrice: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="counter-message">Message</Label>
              <Textarea
                id="counter-message"
                placeholder="Explain your counter offer..."
                value={counterOffer.message}
                onChange={(e) => setCounterOffer(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNegotiateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedQuotation && onNegotiate) {
                  onNegotiate(selectedQuotation);
                  setIsNegotiateDialogOpen(false);
                  setCounterOffer({ quantity: '', targetPrice: '', message: '' });
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Send Counter Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}