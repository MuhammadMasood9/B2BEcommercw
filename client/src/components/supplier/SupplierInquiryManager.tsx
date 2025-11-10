import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Reply, Send, Eye, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface Inquiry {
  id: string;
  productId: string;
  productName: string;
  buyerId: string;
  buyerName: string;
  buyerCompany: string;
  buyerEmail: string;
  buyerPhone?: string;
  message: string;
  quantity: number;
  targetPrice: number;
  urgency: string;
  status: 'pending' | 'replied' | 'quoted' | 'closed';
  createdAt: string;
  updatedAt: string;
}

interface SupplierInquiryManagerProps {
  inquiries: Inquiry[];
  isLoading: boolean;
  onReply: (inquiryId: string, message: string) => void;
  onSendQuotation: (inquiry: Inquiry) => void;
}

export default function SupplierInquiryManager({
  inquiries,
  isLoading,
  onReply,
  onSendQuotation
}: SupplierInquiryManagerProps) {
  const { toast } = useToast();
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'replied': return 'bg-blue-100 text-blue-800';
      case 'quoted': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return AlertCircle;
      case 'replied': return Reply;
      case 'quoted': return CheckCircle;
      case 'closed': return XCircle;
      default: return Clock;
    }
  };

  const filteredInquiries = inquiries.filter(inquiry => 
    statusFilter === "all" || inquiry.status === statusFilter
  );

  const handleReply = () => {
    if (!selectedInquiry || !replyMessage.trim()) return;
    
    onReply(selectedInquiry.id, replyMessage);
    setReplyMessage("");
    setIsDialogOpen(false);
    setSelectedInquiry(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Inquiry Management</h3>
          <p className="text-sm text-muted-foreground">Manage buyer inquiries and send quotations</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Inquiries</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="quoted">Quoted</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Target Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading inquiries...
                  </TableCell>
                </TableRow>
              ) : filteredInquiries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <MessageSquare className="w-8 h-8 text-gray-400" />
                      <p className="text-gray-500">No inquiries found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInquiries.map((inquiry) => {
                  const StatusIcon = getStatusIcon(inquiry.status);
                  return (
                    <TableRow key={inquiry.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{inquiry.productName}</p>
                          <p className="text-sm text-muted-foreground">{inquiry.urgency}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{inquiry.buyerName}</p>
                          <p className="text-sm text-muted-foreground">{inquiry.buyerCompany}</p>
                        </div>
                      </TableCell>
                      <TableCell>{inquiry.quantity.toLocaleString()}</TableCell>
                      <TableCell>${inquiry.targetPrice.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusIcon className="w-4 h-4" />
                          <Badge className={getStatusColor(inquiry.status)}>
                            {inquiry.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(inquiry.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedInquiry(inquiry);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => onSendQuotation(inquiry)}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Quote
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Inquiry Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Product</Label>
                  <p className="font-medium">{selectedInquiry.productName}</p>
                </div>
                <div>
                  <Label>Quantity</Label>
                  <p>{selectedInquiry.quantity.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Target Price</Label>
                  <p>${selectedInquiry.targetPrice.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Urgency</Label>
                  <Badge>{selectedInquiry.urgency}</Badge>
                </div>
              </div>
              
              <div>
                <Label>Buyer Information</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{selectedInquiry.buyerName}</p>
                  <p className="text-sm text-muted-foreground">{selectedInquiry.buyerCompany}</p>
                  <p className="text-sm">{selectedInquiry.buyerEmail}</p>
                  {selectedInquiry.buyerPhone && (
                    <p className="text-sm">{selectedInquiry.buyerPhone}</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Message</Label>
                <p className="mt-2 p-3 bg-gray-50 rounded-lg">{selectedInquiry.message}</p>
              </div>

              <div>
                <Label>Reply Message</Label>
                <Textarea 
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleReply} disabled={!replyMessage.trim()}>
                  <Reply className="w-4 h-4 mr-2" />
                  Send Reply
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => onSendQuotation(selectedInquiry)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Quotation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 