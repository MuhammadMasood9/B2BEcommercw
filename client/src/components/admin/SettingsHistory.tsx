import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  History, 
  RotateCcw, 
  Eye, 
  Search, 
  Filter,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface SettingsHistoryItem {
  id: string;
  settingId?: string;
  action: 'create' | 'update' | 'delete' | 'rollback';
  previousValue: any;
  newValue: any;
  changeReason?: string;
  createdBy: string;
  createdAt: string;
  canRollback: boolean;
  ipAddress?: string;
}

interface SettingsHistoryProps {
  settingId?: string;
  onClose?: () => void;
}

export function SettingsHistory({ settingId, onClose }: SettingsHistoryProps) {
  const [history, setHistory] = useState<SettingsHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<SettingsHistoryItem | null>(null);
  const [showRollbackDialog, setShowRollbackDialog] = useState(false);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const { toast } = useToast();

  const actionLabels = {
    create: 'Created',
    update: 'Updated',
    delete: 'Deleted',
    rollback: 'Rolled Back'
  };

  const actionColors = {
    create: 'bg-green-100 text-green-800',
    update: 'bg-blue-100 text-blue-800',
    delete: 'bg-red-100 text-red-800',
    rollback: 'bg-orange-100 text-orange-800'
  };

  useEffect(() => {
    fetchHistory();
  }, [settingId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const url = settingId 
        ? `/api/admin/settings/platform-configuration/${settingId}/history`
        : '/api/admin/settings/platform-configuration/recent-changes';
      
      const response = await fetch(url, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch history');

      const data = await response.json();
      setHistory(settingId ? data.history : data.changes);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        title: "Error",
        description: "Failed to load settings history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (historyId: string) => {
    try {
      setRollbackLoading(true);
      const response = await fetch('/api/admin/settings/platform-configuration/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          historyId,
          confirmRollback: true
        })
      });

      if (!response.ok) throw new Error('Failed to rollback setting');

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Setting rolled back successfully"
        });
        setShowRollbackDialog(false);
        setSelectedItem(null);
        await fetchHistory();
      } else {
        throw new Error(data.errors?.join(', ') || 'Failed to rollback setting');
      }
    } catch (error: any) {
      console.error('Error rolling back setting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to rollback setting",
        variant: "destructive"
      });
    } finally {
      setRollbackLoading(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const filteredHistory = history.filter(item => {
    const matchesSearch = !searchTerm || 
      item.changeReason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || item.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6" />
            Settings History
          </h2>
          <p className="text-muted-foreground">
            {settingId ? 'View change history for this setting' : 'View recent platform settings changes'}
          </p>
        </div>
        
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by reason or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Created</SelectItem>
                <SelectItem value="update">Updated</SelectItem>
                <SelectItem value="delete">Deleted</SelectItem>
                <SelectItem value="rollback">Rolled Back</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <div className="space-y-4">
        {filteredHistory.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  {/* Action and Timestamp */}
                  <div className="flex items-center gap-3">
                    <Badge className={actionColors[item.action]}>
                      {actionLabels[item.action]}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {item.createdBy}
                    </span>
                  </div>

                  {/* Change Reason */}
                  {item.changeReason && (
                    <div className="text-sm">
                      <strong>Reason:</strong> {item.changeReason}
                    </div>
                  )}

                  {/* Value Changes */}
                  {item.action === 'update' && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-red-600 mb-1">Previous Value:</div>
                        <pre className="bg-red-50 p-2 rounded text-xs overflow-auto max-h-32">
                          {formatValue(item.previousValue)}
                        </pre>
                      </div>
                      <div>
                        <div className="font-medium text-green-600 mb-1">New Value:</div>
                        <pre className="bg-green-50 p-2 rounded text-xs overflow-auto max-h-32">
                          {formatValue(item.newValue)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* IP Address */}
                  {item.ipAddress && (
                    <div className="text-xs text-muted-foreground">
                      IP: {item.ipAddress}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedItem(item)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Details
                  </Button>
                  
                  {item.canRollback && item.action !== 'rollback' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedItem(item);
                        setShowRollbackDialog(true);
                      }}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Rollback
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredHistory.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || actionFilter !== 'all' 
                  ? 'No history items match your filters'
                  : 'No history items found'
                }
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Details Dialog */}
      {selectedItem && !showRollbackDialog && (
        <Dialog open={true} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Badge className={actionColors[selectedItem.action]}>
                  {actionLabels[selectedItem.action]}
                </Badge>
                Change Details
              </DialogTitle>
              <DialogDescription>
                {new Date(selectedItem.createdAt).toLocaleString()} by {selectedItem.createdBy}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedItem.changeReason && (
                <div>
                  <h4 className="font-medium mb-2">Reason</h4>
                  <p className="text-sm bg-muted p-3 rounded">{selectedItem.changeReason}</p>
                </div>
              )}

              {selectedItem.action === 'update' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">Previous Value</h4>
                    <pre className="bg-red-50 p-3 rounded text-xs overflow-auto max-h-64 border">
                      {formatValue(selectedItem.previousValue)}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-green-600">New Value</h4>
                    <pre className="bg-green-50 p-3 rounded text-xs overflow-auto max-h-64 border">
                      {formatValue(selectedItem.newValue)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedItem.action === 'create' && (
                <div>
                  <h4 className="font-medium mb-2">Created Value</h4>
                  <pre className="bg-green-50 p-3 rounded text-xs overflow-auto max-h-64 border">
                    {formatValue(selectedItem.newValue)}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Timestamp:</strong> {new Date(selectedItem.createdAt).toLocaleString()}
                </div>
                <div>
                  <strong>User:</strong> {selectedItem.createdBy}
                </div>
                {selectedItem.ipAddress && (
                  <div>
                    <strong>IP Address:</strong> {selectedItem.ipAddress}
                  </div>
                )}
                <div>
                  <strong>Can Rollback:</strong> {selectedItem.canRollback ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Rollback Confirmation Dialog */}
      {showRollbackDialog && selectedItem && (
        <Dialog open={true} onOpenChange={() => setShowRollbackDialog(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Confirm Rollback
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to rollback this change? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This will revert the setting to its previous value from {new Date(selectedItem.createdAt).toLocaleString()}.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">Current Value (will be reverted)</h4>
                <pre className="bg-red-50 p-2 rounded text-xs max-h-32 overflow-auto">
                  {formatValue(selectedItem.newValue)}
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-2">Previous Value (will be restored)</h4>
                <pre className="bg-green-50 p-2 rounded text-xs max-h-32 overflow-auto">
                  {formatValue(selectedItem.previousValue)}
                </pre>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRollbackDialog(false)}
                disabled={rollbackLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleRollback(selectedItem.id)}
                disabled={rollbackLoading}
              >
                {rollbackLoading ? 'Rolling back...' : 'Confirm Rollback'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}