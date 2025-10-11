import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

interface FloatingChatButtonProps {
  supplierName?: string;
  supplierId?: string;
}

export default function FloatingChatButton({ supplierName, supplierId }: FloatingChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ from: string; message: string; time: string }>>([
    {
      from: "supplier",
      message: `Hello! I'm from ${supplierName || 'our company'}. How can I help you today?`,
      time: "Just now"
    }
  ]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    setChatHistory([
      ...chatHistory,
      {
        from: "user",
        message: message,
        time: "Just now"
      }
    ]);
    setMessage("");

    setTimeout(() => {
      setChatHistory(prev => [
        ...prev,
        {
          from: "supplier",
          message: "Thank you for your message. We'll get back to you shortly!",
          time: "Just now"
        }
      ]);
    }, 1000);
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-24 h-14 w-14 rounded-full bg-gray-700 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all z-[9998] no-default-hover-elevate"
          size="icon"
          data-testid="button-open-chat"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-24 w-96 h-[500px] flex flex-col shadow-2xl z-[9998] glass-card">
          <div className="bg-gray-700 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{supplierName || "Supplier Chat"}</h3>
                <p className="text-xs text-white/80">Online</p>
              </div>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              data-testid="button-close-chat"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
            {chatHistory.map((chat, index) => (
              <div
                key={index}
                className={`flex ${chat.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    chat.from === "user"
                      ? "bg-gray-700 text-white"
                      : "bg-white dark:bg-gray-800 border"
                  }`}
                >
                  <p className="text-sm">{chat.message}</p>
                  <p className={`text-xs mt-1 ${chat.from === "user" ? "text-white/80" : "text-gray-500"}`}>
                    {chat.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t bg-white dark:bg-gray-800">
            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="resize-none"
                rows={2}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                data-testid="textarea-chat-message"
              />
              <Button
                onClick={handleSendMessage}
                className="bg-gray-700 hover:bg-gray-800 text-white no-default-hover-elevate"
                size="icon"
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
