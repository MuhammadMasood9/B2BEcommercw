import { useState } from "react";
import { Bot, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ from: string; message: string; time: string }>>([
    {
      from: "bot",
      message: "Hi! I'm your B2B assistant. I can help you find products, suppliers, or answer questions about our platform. How can I help you today?",
      time: "Just now"
    }
  ]);

  const botResponses = [
    "I can help you find suppliers for your business needs. What product are you looking for?",
    "Would you like me to show you our top-rated suppliers or help you post an RFQ?",
    "You can browse products by category, or I can help you find specific items. What interests you?",
    "I'm here to assist! Feel free to ask about MOQs, pricing, or shipping options.",
    "Our platform connects you with verified suppliers worldwide. What industry are you in?"
  ];

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
      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
      setChatHistory(prev => [
        ...prev,
        {
          from: "bot",
          message: randomResponse,
          time: "Just now"
        }
      ]);
    }, 800);
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="chatbot-button h-16 w-16 rounded-full bg-primary hover:bg-primary/90 text-white shadow-2xl hover:shadow-3xl transition-all animate-pulse hover:scale-110 no-default-hover-elevate no-default-active-elevate"
          size="icon"
          data-testid="button-open-chatbot"
        >
          <Bot className="h-7 w-7" />
        </Button>
      )}

      {isOpen && (
        <Card className="chatbot-widget w-96 h-[500px] flex flex-col shadow-2xl overflow-hidden">
          <div className="bg-primary text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">B2B Assistant</h3>
                <p className="text-xs text-white/80">Always Online</p>
              </div>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 no-default-hover-elevate"
              data-testid="button-close-chatbot"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
            {chatHistory.map((chat, index) => (
              <div
                key={index}
                className={`flex ${chat.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    chat.from === "user"
                      ? "bg-primary text-white"
                      : "bg-card border border-border"
                  }`}
                >
                  <p className="text-sm">{chat.message}</p>
                  <p className={`text-xs mt-1 ${chat.from === "user" ? "text-white/80" : "text-muted-foreground"}`}>
                    {chat.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border bg-background">
            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask me anything..."
                className="resize-none flex-1"
                rows={2}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                data-testid="textarea-chatbot-message"
              />
              <Button
                onClick={handleSendMessage}
                className="self-end"
                size="icon"
                data-testid="button-send-chatbot-message"
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
