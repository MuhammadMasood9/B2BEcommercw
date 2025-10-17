import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Eye, 
  MoreVertical, 
  User, 
  Bot, 
  Shield,
  Image as ImageIcon,
  FileText,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessageProps {
  message: {
    id: string;
    content?: string;
    messageType: string;
    attachments?: any[];
    senderType: 'buyer' | 'admin' | 'assistant';
    senderName?: string;
    createdAt: string;
    isRead: boolean;
  };
  isOwn: boolean;
  onImageClick?: (imageUrl: string) => void;
}

export default function ChatMessage({ message, isOwn, onImageClick }: ChatMessageProps) {
  const [showFullImage, setShowFullImage] = useState(false);

  const getSenderIcon = () => {
    switch (message.senderType) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'assistant':
        return <Bot className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getSenderColor = () => {
    switch (message.senderType) {
      case 'admin':
        return 'bg-blue-500 text-white';
      case 'assistant':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <div className="space-y-2 mt-2">
        {message.attachments.map((attachment, index) => (
          <div key={index} className="flex items-center space-x-2">
            {attachment.type === 'image' ? (
              <div className="relative group">
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="w-32 h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => onImageClick?.(attachment.url)}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                  <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg">
                <FileText className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">{attachment.name}</span>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[80%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${getSenderColor()} flex items-center justify-center`}>
          {getSenderIcon()}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Sender Name */}
          <div className="flex items-center space-x-2 mb-1">
            <span className={`text-sm font-medium ${isOwn ? 'text-blue-600' : 'text-gray-700'}`}>
              {message.senderType === 'admin' ? 'Admin' : (message.senderName || 'Customer')}
            </span>
            {message.senderType === 'admin' && (
              <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                Admin
              </Badge>
            )}
            {message.senderType === 'assistant' && (
              <Badge variant="secondary" className="text-xs">
                AI Assistant
              </Badge>
            )}
            {message.senderType === 'buyer' && (
              <Badge variant="outline" className="text-xs">
                Customer
              </Badge>
            )}
          </div>

          {/* Message Bubble */}
          <div className={`relative max-w-md ${isOwn ? 'ml-12' : 'mr-12'}`}>
            <div className={`rounded-2xl px-4 py-3 shadow-sm ${
              isOwn 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                : 'bg-white border border-gray-200 text-gray-900'
            }`}>
              {/* Text Content */}
              {message.content && (
                <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                  {message.content}
                </div>
              )}

              {/* Attachments */}
              {renderAttachments()}

              {/* Timestamp and Status */}
              <div className={`flex items-center space-x-1 mt-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                  {formatTime(message.createdAt)}
                </span>
                {isOwn && (
                  <div className="flex items-center space-x-1">
                    {message.isRead ? (
                      <div className="w-2 h-2 bg-blue-300 rounded-full" />
                    ) : (
                      <Clock className="h-3 w-3 text-blue-300" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
