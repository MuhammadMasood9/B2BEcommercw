import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  Upload, 
  Download, 
  RefreshCw, 
  Filter,
  Search,
  AlertTriangle,
  Clock,
  Users,
  Package,
  Zap,
  FileText,
  Eye,
  Settings
} from 'lucide-react';

// ==================== INTERFACES ====================

interface BulkModerationItem {
  id: string;
  productId: string;
  productTitle: string;
  supplierName: string;
  supplierTier: string;
  screeningScore: number;
  recommendation: 'approve' | 'review' | 'reject';
  flagsCount: number;
  submittedAt: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_review' | 'processed';
}

interface BulkOperation {
  id: string;
  type: 'approve' | 'reject' | 'screening';
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalItems: number;
  processedItems: number;
  successCount: number;
  failureCount: number;
  startedAt: Date;
  completedAt?: Date;
  notes?: string;
  results?: BulkOperationResult[];
}

interface BulkOperationResult {
  itemId: string;
  success: boolean;
  error?: string;
}

interface BulkModerationFilters {
  recommendation: string[];
  priority: string[];
  supplierTier: string[];
  scoreRange: { min?: number; max?: number };
  hasFlags: boolean | null;
  dateRange: { from?: Date; to?: Date };
}

interface BulkModerationProps {
  className?: string;
}

// ==================== MAIN COMPONENT ====================

export default function BulkModeration({ className }: BulkModerationProps) {
  const [items, setItems] = useState<BulkModerationItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<BulkModerationFilters>({
    recommendation: [],
    priority: [],
    supplierTier: [],
    scoreRange: {},
    hasFlags: null,
    dateRange: {}
  });
  
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([]);
  const [activeOperation, setActiveOperation] = useState<BulkOperation | null>(null);
  
  // Dialog states
  const [bulkActionDialog, setBulkActionDialog] = useState(false);
  const [bulkScreeningDialog, setBulkScreeningDialog] = useState(false);
  const [operationDetailsDialog, setOperationDetailsDialog] = useState(false);
  
  // Form states
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject'>('approve');
  const [bulkNotes, setBulkNotes] = useState('');
  const [screeningPriority, setScreeningPriority] = useState<'low' | 'medium' | 'high'>('medium');
  
  // ==================== DATA FETCHING ====================
  
  useEffect(() => {
    fetchModerationItems();
    fetchBulkOperations();
  }, [filters]);
  
  const fetchModerationItems = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration
      const mockItems: BulkModerationItem[] = Array.from({ length: 50 }, (_, i) => ({
        id: `item_${i + 1}`,
        productId: `product_${1000 + i}`,
        productTitle: `Sample Product ${i + 1}`,
        supplierName: `Supplier ${Math.floor(i / 5) + 1}`,
        supplierTier: ['free', 'silver', 'gold', 'platinum'][Math.floor(Math.random() * 4)],
        screeningScore: 40 + Math.random() * 60,
        recommendation: ['approve', 'review', 'reject'][Math.floor(Math.random() * 3)] as any,
        flagsCount: Math.floor(Math.random() * 5),
        submittedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)] as any,
        status: 'pending'
      }));
      
      setItems(mockItems);
    } catch (error) {
      console.error('Error fetching moderation items:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchBulkOperations = async () => {
    try {
      // Mock bulk operations history
      const mockOperations: BulkOperation[] = [
        {
          id: 'op_001',
          type: 'approve',
          status: 'completed',
          totalItems: 25,
          processedItems: 25,
          successCount: 23,
          failureCount: 2,
          startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000),
          notes: 'Bulk approval of high-scoring products'
        },
        {
          id: 'op_002',
          type: 'screening',
          status: 'running',
          totalItems: 100,
          processedItems: 67,
          successCount: 65,
          failureCount: 2,
          startedAt: new Date(Date.now() - 30 * 60 * 1000),
          notes: 'Automated screening of new submissions'
        }
      ];
      
      setBulkOperations(mockOperations);
    } catch (error) {
      console.error('Error fetching bulk operations:', error);
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
      setSelectedItems(items.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };
  
  const handleBulkAction = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      const newOperation: BulkOperation = {
        id: `op_${Date.now()}`,
        type: bulkAction,
        status: 'running',
        totalItems: selectedItems.length,
        processedItems: 0,
        successCount: 0,
        failureCount: 0,
        startedAt: new Date(),
        notes: bulkNotes
      };
      
      setBulkOperations(prev => [newOperation, ...prev]);
      setActiveOperation(newOperation);
      setBulkActionDialog(false);
      
      // Simulate bulk operation progress
      for (let i = 0; i < selectedItems.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const success = Math.random() > 0.1; // 90% success rate
        
        setBulkOperations(prev => prev.map(op => 
          op.id === newOperation.id ? {
            ...op,
            processedItems: i + 1,
            successCount: op.successCount + (success ? 1 : 0),
            failureCount: op.failureCount + (success ? 0 : 1)
          } : op
        ));
      }
      
      // Complete operation
      setBulkOperations(prev => prev.map(op => 
        op.id === newOperation.id ? {
          ...op,
          status: 'completed',
          completedAt: new Date()
        } : op
      ));
      
      setActiveOperation(null);
      setSelectedItems([]);
      setBulkNotes('');
      
    } catch (error) {
      console.error('Error executing bulk action:', error);
    }
  };
  
  const handleBulkScreening = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      const response = await fetch('/api/admin/moderation/bulk-screening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: selectedItems.map(id => items.find(item => item.id === id)?.productId).filter(Boolean),
          priority: screeningPriority
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const newOperation: BulkOperation = {
          id: `op_${Date.now()}`,
          type: 'screening',
          status: 'completed',
          totalItems: data.summary.totalProducts,
          processedItems: data.summary.totalProducts,
          successCount: data.summary.successful,
          failureCount: data.summary.failed,
          startedAt: new Date(),
          completedAt: new Date(),
          notes: `Bulk screening with ${screeningPriority} priority`
        };
        
        setBulkOperations(prev => [newOperation, ...prev]);
        setBulkScreeningDialog(false);
        setSelectedItems([]);
        
        // Refresh items to show updated screening results
        await fetchModerationItems();
      }
    } catch (error) {
      console.error('Error executing bulk screening:', error);
    }
  };
  
  // ==================== UTILITY FUNCTIONS ====================
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'approve': return 'bg-green-100 text-green-800 border-green-200';
      case 'review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reject': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getOperationStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // ==================== RENDER ====================
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bulk Moderation</h2>
          <p className="text-gray-600">Efficiently moderate multiple products at once</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchModerationItems}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Active Operations */}
      {bulkOperations.filter(op => op.status === 'running').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Active Operations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bulkOperations.filter(op => op.status === 'running').map((operation) => (
              <div key={operation.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{operation.type} Operation</p>
                    <p className="text-sm text-gray-600">{operation.notes}</p>
                  </div>
                  <Badge className={getOperationStatusColor(operation.status)}>
                    {operation.status}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{operation.processedItems}/{operation.totalItems}</span>
                  </div>
                  <Progress 
                    value={(operation.processedItems / operation.totalItems) * 100} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Success: {operation.successCount}</span>
                    <span>Failed: {operation.failureCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Selection and Bulk Actions */}
      {selectedItems.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedItems([])}
                >
                  Clear Selection
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkScreeningDialog(true)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Bulk Screen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBulkAction('approve');
                    setBulkActionDialog(true);
                  }}
                  className="text-green-600 hover:text-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Bulk Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBulkAction('reject');
                    setBulkActionDialog(true);
                  }}
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
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Recommendation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approve">Approve</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="reject">Reject</SelectItem>
              </SelectContent>
            </Select>
            
            <Select>
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
            
            <Select>
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
            
            <Input
              type="number"
              placeholder="Min Score"
              className="w-full"
            />
            
            <Input
              type="number"
              placeholder="Max Score"
              className="w-full"
            />
            
            <div className="flex items-center space-x-2">
              <Checkbox id="hasFlags" />
              <label htmlFor="hasFlags" className="text-sm">Has Flags</label>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Items List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Moderation Queue ({items.length} items)</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedItems.length === items.length && items.length > 0}
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
          ) : (
            <div className="space-y-3">
              {items.slice(0, 20).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={(checked) => handleItemSelect(item.id, checked as boolean)}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 truncate">
                          {item.productTitle}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {item.supplierName} ({item.supplierTier})
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                        <Badge className={getRecommendationColor(item.recommendation)}>
                          {item.recommendation}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <span className={`font-medium ${getScoreColor(item.screeningScore)}`}>
                        Score: {Math.round(item.screeningScore)}/100
                      </span>
                      
                      {item.flagsCount > 0 && (
                        <span className="text-orange-600">
                          {item.flagsCount} flag{item.flagsCount > 1 ? 's' : ''}
                        </span>
                      )}
                      
                      <span className="text-gray-500">
                        {item.submittedAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              ))}
              
              {items.length > 20 && (
                <div className="text-center py-4">
                  <Button variant="outline">
                    Load More ({items.length - 20} remaining)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Recent Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bulkOperations.slice(0, 5).map((operation) => (
              <div
                key={operation.id}
                className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  setActiveOperation(operation);
                  setOperationDetailsDialog(true);
                }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className={getOperationStatusColor(operation.status)}>
                      {operation.status}
                    </Badge>
                    <span className="font-medium capitalize">{operation.type} Operation</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{operation.notes}</p>
                </div>
                
                <div className="text-right text-sm">
                  <p className="font-medium">
                    {operation.successCount}/{operation.totalItems} successful
                  </p>
                  <p className="text-gray-500">
                    {operation.startedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialog} onOpenChange={setBulkActionDialog}>
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
                onClick={() => setBulkActionDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkAction}
                className={bulkAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {bulkAction === 'approve' ? 'Approve' : 'Reject'} {selectedItems.length} Product{selectedItems.length > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Bulk Screening Dialog */}
      <Dialog open={bulkScreeningDialog} onOpenChange={setBulkScreeningDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Automated Screening</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Run automated screening on {selectedItems.length} selected product{selectedItems.length > 1 ? 's' : ''}.
            </p>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Screening Priority
              </label>
              <Select value={screeningPriority} onValueChange={(value: any) => setScreeningPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setBulkScreeningDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleBulkScreening}>
                <Zap className="h-4 w-4 mr-2" />
                Start Screening
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Operation Details Dialog */}
      <Dialog open={operationDetailsDialog} onOpenChange={setOperationDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Operation Details</DialogTitle>
          </DialogHeader>
          
          {activeOperation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Operation Type</p>
                  <p className="capitalize">{activeOperation.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <Badge className={getOperationStatusColor(activeOperation.status)}>
                    {activeOperation.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p>{activeOperation.totalItems}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p>{Math.round((activeOperation.successCount / activeOperation.totalItems) * 100)}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Started At</p>
                  <p>{activeOperation.startedAt.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Duration</p>
                  <p>
                    {activeOperation.completedAt ? 
                      `${Math.round((activeOperation.completedAt.getTime() - activeOperation.startedAt.getTime()) / 1000)}s` :
                      'In progress'
                    }
                  </p>
                </div>
              </div>
              
              {activeOperation.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Notes</p>
                  <p className="text-sm bg-gray-50 p-2 rounded">{activeOperation.notes}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <Progress 
                  value={(activeOperation.processedItems / activeOperation.totalItems) * 100} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Processed: {activeOperation.processedItems}/{activeOperation.totalItems}</span>
                  <span>Success: {activeOperation.successCount} | Failed: {activeOperation.failureCount}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}