import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocation } from 'wouter';
import { useUnseenCounts } from '@/contexts/UnseenCountsContext';
import { 
  MessageCircle, 
  ShoppingCart, 
  ChevronUp,
  Bell,
  User,
  Package,
  HelpCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import FloatingChat from './FloatingChat';

interface FloatingActionButtonsProps {
  chatType?: 'general' | 'product';
  productId?: string;
  productName?: string;
}

export default function FloatingActionButtons({ 
  chatType = 'general',
  productId,
  productName
}: FloatingActionButtonsProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showAllButtons, setShowAllButtons] = useState(false);
  const [, setLocation] = useLocation();
  const { unseenCounts } = useUnseenCounts();

  // Debug logging
  console.log('FloatingActionButtons - unseenCounts:', unseenCounts);

  return (
    <TooltipProvider>
      <div className="fixed bottom-32 right-6 z-50 flex flex-col gap-4">
        {/* Expandable Action Buttons */}
        {showAllButtons && (
          <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-2 duration-300">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-12 w-12 rounded-full shadow-xl bg-white hover:bg-gray-50 border-2 border-gray-200"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  <ArrowUp className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Scroll to Top</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-12 w-12 rounded-full shadow-xl bg-white hover:bg-gray-50 border-2 border-gray-200"
                  onClick={() => setLocation('/profile')}
                >
                  <User className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>My Profile</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-12 w-12 rounded-full shadow-xl bg-white hover:bg-gray-50 border-2 border-gray-200"
                    onClick={() => setLocation('/notifications')}
                  >
                    <Bell className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Notifications</p>
                </TooltipContent>
              </Tooltip>
              {unseenCounts.notifications > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white border-2 border-white"
                >
                  {unseenCounts.notifications > 9 ? '9+' : unseenCounts.notifications}
                </Badge>
              )}
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-12 w-12 rounded-full shadow-xl bg-white hover:bg-gray-50 border-2 border-gray-200"
                  onClick={() => setLocation('/cart')}
                >
                  <ShoppingCart className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Shopping Cart</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Main Action Buttons - Fixed spacing */}
        <div className="flex flex-col gap-4">
          {/* Main Chat Button */}
          <div className="relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary text-white border-4 border-white"
                  onClick={() => setIsChatOpen(!isChatOpen)}
                >
                  <MessageCircle className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{chatType === 'product' ? `Chat about ${productName || 'this product'}` : 'Chat with Admin Support'}</p>
              </TooltipContent>
            </Tooltip>
            {unseenCounts.chats > 0 && (
              <Badge 
                className="absolute -top-2 -right-2 h-7 w-7 p-0 flex items-center justify-center text-sm font-bold bg-red-500 text-white border-3 border-white rounded-full"
              >
                {unseenCounts.chats > 99 ? '99+' : unseenCounts.chats}
              </Badge>
            )}
          </div>

          {/* Expand/Collapse Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-12 w-12 rounded-full shadow-xl bg-white hover:bg-gray-50 border-2 border-gray-200"
                onClick={() => setShowAllButtons(!showAllButtons)}
              >
                {showAllButtons ? (
                  <ArrowDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{showAllButtons ? 'Hide Menu' : 'Show More Options'}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Floating Chat */}
      <FloatingChat
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
        chatType={chatType}
        productId={productId}
        productName={productName}
      />
    </TooltipProvider>
  );
}
