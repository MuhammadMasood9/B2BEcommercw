import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { 
  Send, 
  Image as ImageIcon, 
  Paperclip, 
  Smile,
  X,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatInputProps {
  onSendMessage: (content: string, attachments?: any[]) => void;
  onSendImage?: (file: File) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ 
  onSendMessage, 
  onSendImage, 
  disabled = false, 
  placeholder = "Type your message..." 
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive"
        });
        return;
      }

      setIsUploading(true);
      
      // Simulate upload - replace with actual upload logic
      setTimeout(() => {
        setIsUploading(false);
        toast({
          title: "File uploaded",
          description: `${file.name} has been uploaded successfully`,
        });
        // Call the onSendImage callback
        onSendImage?.(file);
      }, 1000);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit for images
        toast({
          title: "Image too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }

      setIsUploading(true);
      
      // Simulate upload - replace with actual upload logic
      setTimeout(() => {
        setIsUploading(false);
        toast({
          title: "Image uploaded",
          description: `${file.name} has been uploaded successfully`,
        });
        // Call the onSendImage callback
        onSendImage?.(file);
      }, 1000);
    }
  };

  return (
    <Card className="border-t border-gray-200 rounded-none">
      <div className="p-4">
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
          </div>

          {/* Message Input */}
          <div className="flex-1">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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
            disabled={!message.trim() || disabled || isUploading}
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
          onChange={handleImageUpload}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
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
