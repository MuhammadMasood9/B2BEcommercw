import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  User,
  Flag,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  FileText,
  Image as ImageIcon,
  Calendar,
  Star
} from 'lucide-react';
import { format } from 'date-fns';

// ==================== INTERFACES ====================

interface ProductReviewItem {
  id: string;
  productId: string;
  productTitle: string;
  productDescription: string;
  productImages: string[];
  supplierId: string;
  supplierName: string;
  supplierTier: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  screeningScore: number;
  screeningRecommendation: 'approve' | 'review' | 'reject';
  screeningFlags: ContentFlag[];
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  assignedAt?: Date;
  reviewDecision?: 'approve' | 'reject' | 'request_changes';
  reviewNotes?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
  escalatedReason?: string;
  escalatedAt?: Date;
  escalatedBy?: string;
  submittedAt: Date;
  updatedAt: Date;
}

interface ContentFlag {
  type: 'inappropriate' | 'spam' | 'policy_violation' | 'quality_issue' | 'duplicate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
  suggestedAction: 'approve' | 'review' | 'reject' | 'edit';
}

interface QueueFilters {
  status: string[];
  priority: string[];
  assignedReviewer: string;
  supplierTier: string[];
  screeningScore: { min?: number; max?: number };
  hasFlags: boolean | null;
  search: string;
}

interface ProductReviewQueueProps {
  className?: string;
}

// ==================== MAIN COMPONENT ====================

export default function ProductReviewQueue({ className }: ProductReviewQueueProps) {
  const [reviewItems, setReviewItems] = useState<ProductReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filters, setFilters] = useState<QueueFilters>({
    status: [],
    priority: [],
    assignedReviewer: '',
    supplierTier: [],
    screeningScore: {},
    hasFlags: null,
    search: ''
  });
  
  const [queueSummary, setQueueSummary] = useState({
    pendingCount: 0,
    inReviewCount: 0,
    highPriorityCount: 0,
    averageWaitTime: 0
  });
  
  const [selectedReview, setSelectedReview] = useState<ProductReviewItem | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | ''>('');
  const [bulkNotes, setBulkNotes] = useState('');
  
  // ==================== DATA FETCHING ====================
  
  useEffect(() => {
    fetchReviewQueue();
  }, [filters]);
  
  const fetchReviewQueue = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      
      if (filters.status.length > 0) {
        filters.status.forEach(status => queryParams.append('status', status));
      }
      if (filters.priority.length > 0) {
        filters.priority.forEach(priority => queryParams.append('priority', priority));
      }
      if (filters.assignedReviewer) {
        queryParams.set('assignedReviewer', filters.assignedReviewer);
      }
      if (filters.supplierTier.length > 0) {
        filters.supplierTier.forEach(tier => queryParams.append('supplierTier', tier));
      }
      if (filters.screeningScore.min !== undefined) {
        queryParams.set('screeningScore[min]', filters.screeningScore.min.toString());
      }
      if (filters.screeningScore.max !== undefined) {
        queryParams.set('screeningScore[max]', filters.screeningScore.max.toString());
      }
      if (filters.hasFlags !== null) {
        queryParams.set('hasFlags', filters.hasFlags.toString());
      }
      
      const response = await fetch(`/api/admin/moderation/products/queue?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setReviewItems(data.queue || []);
        setQueueSummary(data.summary || {});
      }
    } catch (error) {
      console.error('Error fetching review queue:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // ==================== EVENT HANDLERS ====================
  
  const handleItemSelect = (itemId: string, selected: boolean) => {
    if (selected) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };
  
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedItems(reviewItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };
  
  const handleReviewItem = (item: ProductReviewItem) => {
    setSelectedReview(item);
    setReviewDialogOpen(true);
  };
  
  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedItems.length === 0) return;
    
    setBulkAction(action);
    setBulkActionDialogOpen(true);
  };
  
  const executeBulkAction = async () => {
    try {
      const response = await fetch('/api/admin/moderation/products/bulk/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewIds: selectedItems,
          decision: bulkAction,
          notes: bulkNotes
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchReviewQueue();
        setSelectedItems([]);
        setBulkActionDialogOpen(false);
        setBulkNotes('');
      }
    } catch (error) {
      console.error('Error executing bulk action:', error);
    }
  };
  
  const handleFilterChange = (key: keyof QueueFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  // ==================== UTILITY FUNCTIONS ====================
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'in_review': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'escalated': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };
  
  // ==================== RENDER ====================
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{queueSummary.pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Review</p>
                <p className="text-2xl font-bold text-blue-600">{queueSummary.inReviewCount}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-orange-600">{queueSummary.highPriorityCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Wait Time</p>
                <p className="text-2xl font-bold text-gray-900">{queueSummary.averageWaitTime.toFixed(1)}h</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Status Filter */}
            <Select
              value={filters.status.join(',')}
              onValueChange={(value) => handleFilterChange('status', value ? value.split(',') : [])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Priority Filter */}
            <Select
              value={filters.priority.join(',')}
              onValueChange={(value) => handleFilterChange('priority', value ? value.split(',') : [])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Supplier Tier Filter */}
            <Select
              value={filters.supplierTier.join(',')}
              onValueChange={(value) => handleFilterChange('supplierTier', value ? value.split(',') : [])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Supplier Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Score Range */}
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min Score"
                value={filters.screeningScore.min || ''}
                onChange={(e) => handleFilterChange('screeningScore', {
                  ...filters.screeningScore,
                  min: e.target.value ? parseInt(e.target.value) : undefined
                })}
                className="w-20"
              />
              <Input
                type="number"
                placeholder="Max Score"
                value={filters.screeningScore.max || ''}
                onChange={(e) => handleFilterChange('screeningScore', {
                  ...filters.screeningScore,
                  max: e.target.value ? parseInt(e.target.value) : undefined
                })}
                className="w-20"
              />
            </div>
            
            {/* Has Flags Filter */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasFlags"
                checked={filters.hasFlags === true}
                onCheckedChange={(checked) => handleFilterChange('hasFlags', checked ? true : null)}
              />
              <label htmlFor="hasFlags" className="text-sm">Has Flags</label>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('approve')}
                  className="text-green-600 hover:text-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Bulk Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('reject')}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Bulk Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Review Queue Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Product Review Queue</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedItems.length === reviewItems.length && reviewItems.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : reviewItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No products in review queue
            </div>
          ) : (
            <div className="space-y-4">
              {reviewItems.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => handleItemSelect(item.id, checked as boolean)}
                    />
                    
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      {item.productImages.length > 0 ? (
                        <img
                          src={item.productImages[0]}
                          alt={item.productTitle}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 truncate">
                            {item.productTitle}
                          </h3>
                          <p className="text-sm text-gray-600">
                            by {item.supplierName} ({item.supplierTier})
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Submitted {format(new Date(item.submittedAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(item.priority)}>
                            {item.priority}
                          </Badge>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Screening Info */}
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-gray-400" />
                          <span className={`text-sm font-medium ${getScoreColor(item.screeningScore)}`}>
                            {item.screeningScore}/100
                          </span>
                        </div>
                        
                        {item.screeningFlags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Flag className="h-4 w-4 text-orange-400" />
                            <span className="text-sm text-orange-600">
                              {item.screeningFlags.length} flag{item.screeningFlags.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        
                        {item.assignedReviewerName && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-blue-400" />
                            <span className="text-sm text-blue-600">
                              {item.assignedReviewerName}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReviewItem(item)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                        
                        {item.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Quick Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Quick Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Review Details</DialogTitle>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-6">
              {/* Product Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Product Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Title:</strong> {selectedReview.productTitle}</p>
                    <p><strong>Supplier:</strong> {selectedReview.supplierName} ({selectedReview.supplierTier})</p>
                    <p><strong>Submitted:</strong> {format(new Date(selectedReview.submittedAt), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Screening Results</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Score:</strong> <span className={getScoreColor(selectedReview.screeningScore)}>{selectedReview.screeningScore}/100</span></p>
                    <p><strong>Recommendation:</strong> {selectedReview.screeningRecommendation}</p>
                    <p><strong>Flags:</strong> {selectedReview.screeningFlags.length}</p>
                  </div>
                </div>
              </div>
              
              {/* Product Description */}
              <div>
                <h3 className="font-medium mb-2">Product Description</h3>
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  {selectedReview.productDescription}
                </div>
              </div>
              
              {/* Product Images */}
              {selectedReview.productImages.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Product Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedReview.productImages.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Product ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Screening Flags */}
              {selectedReview.screeningFlags.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Screening Flags</h3>
                  <div className="space-y-2">
                    {selectedReview.screeningFlags.map((flag, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <Badge className={getPriorityColor(flag.severity)}>
                            {flag.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {Math.round(flag.confidence * 100)}% confidence
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{flag.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Suggested: {flag.suggestedAction}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Bulk {bulkAction === 'approve' ? 'Approve' : 'Reject'} Products
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You are about to {bulkAction} {selectedItems.length} product{selectedItems.length > 1 ? 's' : ''}. 
              This action cannot be undone.
            </p>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Notes (optional)
              </label>
              <Textarea
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                placeholder={`Add notes for this bulk ${bulkAction} action...`}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setBulkActionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={executeBulkAction}
                className={bulkAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {bulkAction === 'approve' ? 'Approve' : 'Reject'} {selectedItems.length} Product{selectedItems.length > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}