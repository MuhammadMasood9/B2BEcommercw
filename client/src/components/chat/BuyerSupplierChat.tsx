import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle, 
  Search, 
  Plus, 
  Package,
  FileText,
  Image as ImageIcon,
  X,
  ExternalLink
} from 'lucide-react';
import ChatWindow from './ChatWindow';
import ConversationList from './ConversationList';
import { useToast } from '@/hooks/use-toast';

interface BuyerSupplierChatProps {
  userRole: 'buyer' | 'supplier';
  userId: string;
}

interface Product {
  id: string;
  name: string;
  images: string[];
  supplierId: string;
  supplierName?: string;
}

interface Supplier {
  id: string;
  businessName: string;
  storeName: string;
  email: string;
}

export default function BuyerSupplierChat({ userRole, userId }: BuyerSupplierChatProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/chat/conversations'],
    queryFn: () => apiRequest('GET', '/api/chat/conversations'),
  });

  // Fetch products for product reference (buyers only)
  const { data: productsData } = useQuery({
    queryKey: ['/api/products'],
    queryFn: () => apiRequest('GET', '/api/products'),
    enabled: userRole === 'buyer',
  });

  // Fetch suppliers for new chat (buyers only)
  const { data: suppliersData } = useQuery({
    queryKey: ['/api/suppliers'],
    queryFn: () => apiRequest('GET', '/api/suppliers'),
    enabled: userRole === 'buyer',
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: (data: { 
      supplierId?: string; 
      buyerId?: string; 
      subject?: string; 
      productId?: string;
      type: 'buyer_supplier';
    }) =>
      apiRequest('POST', '/api/chat/conversations', data),
    onSuccess: (newConversation) => {
      setSelectedConversationId(newConversation.id);
      setShowNewChatDialog(false);
      setSelectedProduct(null);
      setSelectedSupplier(null);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      toast({
        title: "Chat started",
        description: "You can now start messaging!",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to start chat",
        description: "Please try again",
        variant: "destructive"
      });
    }
  });

  const conversations = Array.isArray(conversationsData) 
    ? conversationsData.filter((c: any) => c.type === 'buyer_supplier')
    : (conversationsData as any)?.conversations?.filter((c: any) => c.type === 'buyer_supplier') || [];

  const products = (productsData as any)?.products || [];
  const suppliers = (suppliersData as any)?.suppliers || [];

  const handleCreateConversation = () => {
    setShowNewChatDialog(true);
  };

  const handleStartChatWithSupplier = (supplier: Supplier, product?: Product) => {
    const conversationData = {
      type: 'buyer_supplier' as const,
      supplierId: supplier.id,
      subject: product 
        ? `Inquiry about ${product.name}` 
        : `Chat with ${supplier.businessName}`,
      productId: product?.id
    };

    createConversationMutation.mutate(conversationData);
  };

  const handleStartChatWithBuyer = (buyerId: string, subject?: string) => {
    const conversationData = {
      type: 'buyer_supplier' as const,
      buyerId,
      subject: subject || 'New conversation'
    };

    createConversationMutation.mutate(conversationData);
  };

  const ProductReferenceCard = ({ product }: { product: Product }) => (
    <Card className="w-full max-w-sm cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <img 
                src={product.images[0]} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {product.name}
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              {product.supplierName || 'Supplier'}
            </p>
            <div className="flex items-center mt-2">
              <Badge variant="outline" className="text-xs">
                Product
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SupplierCard = ({ supplier }: { supplier: Supplier }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => handleStartChatWithSupplier(supplier)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              {supplier.businessName}
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              {supplier.storeName}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {supplier.email}
            </p>
          </div>
          <Button size="sm" variant="outline">
            <MessageCircle className="h-4 w-4 mr-1" />
            Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const NewChatDialog = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Start New Chat</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowNewChatDialog(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto">
          {userRole === 'buyer' ? (
            <div className="space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search suppliers or products..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Product Selection */}
              <div>
                <h3 className="text-lg font-medium mb-3">Chat about a product</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {products
                    .filter((product: Product) => 
                      !searchQuery || 
                      product.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((product: Product) => (
                      <div 
                        key={product.id}
                        onClick={() => {
                          const supplier = suppliers.find((s: Supplier) => s.id === product.supplierId);
                          if (supplier) {
                            handleStartChatWithSupplier(supplier, product);
                          }
                        }}
                      >
                        <ProductReferenceCard product={product} />
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Supplier Selection */}
              <div>
                <h3 className="text-lg font-medium mb-3">Chat with suppliers</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {suppliers
                    .filter((supplier: Supplier) => 
                      !searchQuery || 
                      supplier.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      supplier.storeName.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((supplier: Supplier) => (
                      <SupplierCard key={supplier.id} supplier={supplier} />
                    ))
                  }
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Supplier Chat
              </h3>
              <p className="text-gray-500">
                Customers will initiate conversations with you. 
                You can respond to their inquiries here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex h-full bg-gray-50">
      {/* Conversation List */}
      <div className="w-96 border-r border-gray-200">
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId || undefined}
          onSelectConversation={setSelectedConversationId}
          onCreateConversation={userRole === 'buyer' ? handleCreateConversation : undefined}
          userRole={userRole}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1">
        {selectedConversationId ? (
          <ChatWindow
            conversationId={selectedConversationId}
            userRole={userRole}
            userId={userId}
            className="h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {userRole === 'buyer' ? 'Connect with Suppliers' : 'Customer Communications'}
              </h3>
              <p className="text-gray-500 mb-6">
                {userRole === 'buyer' 
                  ? 'Start conversations with suppliers about products or general inquiries.'
                  : 'Respond to customer inquiries and build relationships.'
                }
              </p>
              {userRole === 'buyer' && (
                <Button onClick={handleCreateConversation} size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Start New Chat
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      {showNewChatDialog && <NewChatDialog />}
    </div>
  );
}