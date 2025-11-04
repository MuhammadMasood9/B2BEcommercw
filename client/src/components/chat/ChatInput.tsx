import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Image as ImageIcon, 
  Paperclip, 
  Smile,
  X,
  Loader2,
  Package,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatInputProps {
  onSendMessage: (content: string, attachments?: any[], productReferences?: string[]) => void;
  onSendImage?: (file: File) => void;
  onTyping?: (isTyping: boolean) => void;
  onAddProductReference?: () => void;
  disabled?: boolean;
  placeholder?: string;
  showProductReference?: boolean;
}

export default function ChatInput({ 
  onSendMessage, 
  onSendImage, 
  onTyping,
  onAddProductReference,
  disabled = false, 
  placeholder = "Type your message...",
  showProductReference = false
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [productReferences, setProductReferences] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const handleSend = () => {
    if ((message.trim() || attachedFiles.length > 0 || productReferences.length > 0) && !disabled) {
      // Convert attached files to attachments
      const attachments = attachedFiles.map(file => ({
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        size: file.size,
        url: URL.createObjectURL(file) // In real app, upload to server first
      }));

      onSendMessage(message.trim(), attachments, productReferences);
      setMessage('');
      setAttachedFiles([]);
      setProductReferences([]);
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        onTyping?.(false);
      }
    }
  };

  const handleMessageChange = (value: string) => {
    setMessage(value);
    
    // Handle typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      onTyping?.(true);
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      onTyping?.(false);
    }
    
    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing indicator after 3 seconds of inactivity
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTyping?.(false);
      }, 3000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB`,
          variant: "destructive"
        });
        continue;
      }

      setAttachedFiles(prev => [...prev, file]);
    }

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file`,
          variant: "destructive"
        });
        continue;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit for images
        toast({
          title: "Image too large",
          description: `${file.name} is larger than 5MB`,
          variant: "destructive"
        });
        continue;
      }

      setAttachedFiles(prev => [...prev, file]);
    }

    // Clear the input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeProductReference = (index: number) => {
    setProductReferences(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddProductReference = () => {
    onAddProductReference?.();
  };

  return (
    <Card className="border-t border-gray-200 rounded-none">
      <div className="p-4">
        {/* Attached Files */}
        {attachedFiles.length > 0 && (
          <div className="mb-3 space-y-2">
            <div className="text-xs text-gray-500 font-medium">Attached Files:</div>
            <div className="flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <div key={index} className="flex items-center space-x-2 bg-gray-100 rounded-lg p-2">
                  {file.type.startsWith('image/') ? (
                    <ImageIcon className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Paperclip className="h-4 w-4 text-gray-600" />
                  )}
                  <span className="text-sm text-gray-700 truncate max-w-32">
                    {file.name}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeAttachedFile(index)}
                    className="h-4 w-4 p-0 text-gray-500 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product References */}
        {productReferences.length > 0 && (
          <div className="mb-3 space-y-2">
            <div className="text-xs text-gray-500 font-medium">Product References:</div>
            <div className="flex flex-wrap gap-2">
              {productReferences.map((productId, index) => (
                <Badge key={index} variant="outline" className="flex items-center space-x-1">
                  <Package className="h-3 w-3" />
                  <span>Product {productId}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeProductReference(index)}
                    className="h-3 w-3 p-0 ml-1 text-gray-500 hover:text-red-500"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="flex items-center space-x-2 mb-3 p-2 bg-blue-50 rounded-lg">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            <span className="text-sm text-blue-700">Uploading...</span>
          </div>
        )}

        {/* Input Area */}
        <div className="flex items-end space-x-2">
          {/* File Upload Buttons */}
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => imageInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="h-8 w-8 p-0"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="h-8 w-8 p-0"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            {showProductReference && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddProductReference}
                disabled={disabled}
                className="h-8 w-8 p-0"
                title="Add product reference"
              >
                <Package className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Message Input */}
          <div className="flex-1">
            <Textarea
              value={message}
              onChange={(e) => handleMessageChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled || isUploading}
              className="min-h-[40px] max-h-[120px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              rows={1}
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={(!message.trim() && attachedFiles.length === 0 && productReferences.length === 0) || disabled || isUploading}
            size="sm"
            className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Quick Actions */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <span>Max 10MB per file</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
