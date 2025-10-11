import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Search,
  Send,
  Paperclip,
  MoreVertical,
  Circle
} from "lucide-react";

export default function Messages() {
  const [activeConversation, setActiveConversation] = useState("1");
  const [message, setMessage] = useState("");

  //todo: remove mock functionality
  const conversations = [
    {
      id: "1",
      supplier: "AudioTech Pro",
      avatar: "AP",
      lastMessage: "Yes, we can customize the packaging with your logo",
      timestamp: "10:30 AM",
      unread: 2,
      online: true,
    },
    {
      id: "2",
      supplier: "Global Electronics",
      avatar: "GE",
      lastMessage: "The samples will be shipped tomorrow",
      timestamp: "Yesterday",
      unread: 0,
      online: false,
    },
    {
      id: "3",
      supplier: "Fashion Textile Ltd",
      avatar: "FT",
      lastMessage: "We can offer $4.50 per piece for 10K units",
      timestamp: "2 days ago",
      unread: 1,
      online: true,
    },
  ];

  const currentMessages = [
    { id: 1, sender: "supplier", text: "Hello! Thank you for your inquiry about our wireless headphones.", time: "9:45 AM" },
    { id: 2, sender: "me", text: "Hi, I'm interested in ordering 5000 units. Can you provide a quote?", time: "9:50 AM" },
    { id: 3, sender: "supplier", text: "For 5000 units, we can offer $28 per piece. This includes customization options.", time: "10:15 AM" },
    { id: 4, sender: "me", text: "That sounds good. Can we customize the packaging with our logo?", time: "10:20 AM" },
    { id: 5, sender: "supplier", text: "Yes, we can customize the packaging with your logo. There's a one-time setup fee of $500 for the custom packaging design.", time: "10:30 AM" },
  ];

  const handleSend = () => {
    if (message.trim()) {
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-8">Messages</h1>

          <Card className="h-[600px] flex overflow-hidden">
            <div className="w-80 border-r flex flex-col">
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    className="pl-9"
                    data-testid="input-search-conversations"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversation(conv.id)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors border-b ${
                      activeConversation === conv.id ? 'bg-muted' : ''
                    }`}
                    data-testid={`conversation-${conv.id}`}
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {conv.avatar}
                        </AvatarFallback>
                      </Avatar>
                      {conv.online && (
                        <Circle className="absolute bottom-0 right-0 w-3 h-3 fill-green-500 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-semibold text-sm">{conv.supplier}</h4>
                        <span className="text-xs text-muted-foreground">{conv.timestamp}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{conv.lastMessage}</p>
                    </div>
                    {conv.unread > 0 && (
                      <Badge className="bg-primary">{conv.unread}</Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">AP</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">AudioTech Pro</h3>
                    <p className="text-xs text-muted-foreground">Online</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" data-testid="button-more-options">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    data-testid={`message-${msg.id}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.sender === 'me'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" data-testid="button-attach">
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Input
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    data-testid="input-message"
                  />
                  <Button onClick={handleSend} data-testid="button-send">
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
