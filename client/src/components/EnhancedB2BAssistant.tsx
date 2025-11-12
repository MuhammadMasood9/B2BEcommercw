import { useState, useEffect, useRef } from "react";
import { Bot, X, Send, Sparkles, ArrowRight, CheckCircle2, ShoppingCart, FileText, MessageSquare, HelpCircle, TrendingUp, Package, ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface Product {
  id: string;
  name: string;
  description?: string;
  priceRange?: string;
  moq?: number;
  categoryId?: string;
  images?: string[];
  isPublished?: boolean;
}

interface Message {
  from: "user" | "bot";
  message: string;
  time: string;
  suggestions?: string[];
  products?: Product[];
}

export default function EnhancedB2BAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<Message[]>([
    {
      from: "bot",
      message: "Hi! I'm your B2B assistant. I can help you find products, suppliers, or answer questions about our platform. How can I help you today?",
      time: "Just now",
      suggestions: [
        "Show me electronics products",
        "How do I search for products?",
        "How do I place an order?",
        "What is an Inquiry?"
      ]
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch products when search query is set
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.trim().length < 2) return [];
      try {
        const params = new URLSearchParams({
          search: searchQuery.trim(),
          isPublished: "true",
          limit: "8" // Limit to 8 products for chat display
        });
        const response = await fetch(`/api/products?${params.toString()}`, {
          credentials: "include",
        });
        if (!response.ok) return [];
        const data = await response.json();
        const productsList = Array.isArray(data) ? data : (data.products || []);
        return productsList.filter((p: any) => p.isPublished === true).slice(0, 8);
      } catch (error) {
        console.error("Error fetching products:", error);
        return [];
      }
    },
    enabled: !!searchQuery && searchQuery.trim().length >= 2,
    staleTime: 30000,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Intelligent response generator with suggestions
  const generateResponse = (userMessage: string): { response: string; suggestions: string[] } => {
    const lowerMsg = userMessage.toLowerCase();

    // How website works
    if (lowerMsg.includes("how") && (lowerMsg.includes("website") || lowerMsg.includes("platform") || lowerMsg.includes("work"))) {
      return {
        response: `🎯 **How Our B2B Platform Works:**

Our platform connects buyers and suppliers for wholesale trading. Here's the basic flow:

1. **Browse & Search**: Find products by category or search
2. **Inquiry or RFQ**: 
   - Send an **Inquiry** for specific products
   - Create an **RFQ (Request for Quotation)** for custom needs
3. **Get Quotations**: Suppliers respond with pricing and terms
4. **Negotiate**: Discuss pricing, quantity, and terms
5. **Accept & Order**: Accept a quotation to create an order
6. **Track & Receive**: Monitor your order through delivery

📌 **Key Features:**
- Browse thousands of verified products
- Request quotes for bulk orders
- Negotiate terms directly with suppliers
- Secure order management
- Track shipments in real-time

Would you like me to explain the complete ordering process step-by-step?`,
        suggestions: [
          "Show me step-by-step ordering process",
          "What's the difference between Inquiry and RFQ?",
          "How do I negotiate with suppliers?",
          "How do I track my order?"
        ]
      };
    }

    // How to place order - detailed steps
    if ((lowerMsg.includes("order") && (lowerMsg.includes("place") || lowerMsg.includes("make") || lowerMsg.includes("how"))) || 
        (lowerMsg.includes("step") && lowerMsg.includes("order"))) {
      return {
        response: `📦 **Complete Order Placement Guide:**

Follow these steps to place an order on our platform:

**STEP 1: Choose Your Product**
- Browse products by category or use the search bar
- Click on any product to view details (MOQ, price, lead time)
- Or create an RFQ for custom requirements

**STEP 2: Send Inquiry or Create RFQ**
- **For Products**: Click "Send Inquiry" on product page
  - Enter quantity and target price
  - Add your requirements and delivery date
  - Submit and wait for supplier response
  
- **For RFQ**: Go to "RFQs" → "Create RFQ"
  - Describe what you need
  - Set category, quantity, and budget
  - Multiple suppliers will respond

**STEP 3: Receive Quotations**
- Suppliers will send you quotations with:
  - Price per unit
  - MOQ (Minimum Order Quantity)
  - Lead time
  - Payment terms
  - Valid until date

**STEP 4: Review & Negotiate**
- Compare quotations from different suppliers
- Click "Negotiate" if you want better terms
- Send counter-offers with your preferred price/quantity

**STEP 5: Accept Quotation**
- When satisfied, click "Accept"
- Provide shipping address
- Confirm order details
- Your order is created automatically!

**STEP 6: Track Order**
- Go to "My Orders" to see status
- Track: Pending → Confirmed → Processing → Shipped → Delivered
- Get tracking number when shipped

💡 **Pro Tip**: Always check MOQ, lead time, and payment terms before accepting!`,
        suggestions: [
          "Where do I find my orders?",
          "How do I send an inquiry?",
          "How do I negotiate prices?",
          "What is MOQ?"
        ]
      };
    }

    // What is Inquiry
    if (lowerMsg.includes("inquiry") || (lowerMsg.includes("what") && lowerMsg.includes("inquiry"))) {
      return {
        response: `📋 **What is an Inquiry?**

An **Inquiry** is a request you send to a supplier for a specific product that's already listed on our platform.

**When to Use Inquiry:**
✅ You found a product you like
✅ You want pricing for specific quantity
✅ Product details are already available

**Inquiry Process:**
1. Visit product page → Click "Send Inquiry"
2. Fill in:
   - Quantity needed
   - Target price (your budget)
   - Delivery date preference
   - Special requirements/message
3. Supplier receives your inquiry
4. Supplier sends you a quotation
5. You can accept, reject, or negotiate

**After Inquiry:**
- Receive quotation with pricing & terms
- Compare with other suppliers
- Negotiate if needed
- Accept to create order

🔍 **Want to create an Inquiry?** Go to any product page and click "Send Inquiry" button!`,
        suggestions: [
          "What is an RFQ?",
          "How do I send an inquiry?",
          "How long does inquiry take?",
          "Can I negotiate after inquiry?"
        ]
      };
    }

    // What is RFQ
    if (lowerMsg.includes("rfq") || (lowerMsg.includes("request") && lowerMsg.includes("quotation"))) {
      return {
        response: `🎯 **What is an RFQ (Request for Quotation)?**

An **RFQ** is a request for quotation where you describe what you need, and multiple suppliers can respond with their offers.

**When to Use RFQ:**
✅ You need custom products or specifications
✅ You want to compare multiple suppliers
✅ Product not listed on platform
✅ You're flexible with suppliers

**RFQ Process:**
1. Go to "RFQs" → "Create RFQ"
2. Fill in:
   - Title & description
   - Category
   - Quantity needed
   - Target price/budget
   - Requirements & specifications
3. Submit RFQ → Multiple suppliers see it
4. Suppliers send quotations
5. Compare all quotations
6. Accept the best offer

**RFQ vs Inquiry:**
- **Inquiry**: For existing products, one supplier
- **RFQ**: For custom needs, multiple suppliers compete

🚀 **Tip**: RFQ is great for getting competitive pricing from multiple suppliers!`,
        suggestions: [
          "What is an Inquiry?",
          "How do I create an RFQ?",
          "Can I negotiate RFQ quotations?",
          "How do I accept RFQ quotation?"
        ]
      };
    }

    // How to negotiate
    if (lowerMsg.includes("negotiate") || lowerMsg.includes("negotiation") || (lowerMsg.includes("price") && lowerMsg.includes("negotiate"))) {
      return {
        response: `💬 **How to Negotiate:**

Negotiation allows you to discuss better terms with suppliers before accepting a quotation.

**When to Negotiate:**
- Price is slightly higher than your budget
- You want better payment terms
- Lead time needs adjustment
- Quantity discounts possible

**Negotiation Steps:**
1. **Review Quotation**: Check price, MOQ, lead time
2. **Click "Negotiate"**: On quotation card or detail page
3. **Send Counter-Offer**:
   - Enter your preferred price per unit
   - Adjust quantity if needed
   - Add message explaining your request
4. **Wait for Response**: Supplier reviews your counter-offer
5. **Supplier Responds**: With revised quotation or accepts your terms
6. **Continue or Accept**: Negotiate again or accept if satisfied

**Negotiation Tips:**
✅ Be professional and polite
✅ Explain your reasoning
✅ Show interest in long-term partnership
✅ Be realistic with your counter-offers

📊 **Where**: Go to "My Quotations" to see all quotations and negotiate.`,
        suggestions: [
          "How many times can I negotiate?",
          "What if supplier rejects my negotiation?",
          "How do I accept a quotation?",
          "Where are my quotations?"
        ]
      };
    }

    // Track order
    if (lowerMsg.includes("track") || (lowerMsg.includes("order") && lowerMsg.includes("status")) || lowerMsg.includes("shipment")) {
      return {
        response: `📦 **Order Tracking:**

Track your orders easily through the platform!

**How to Track:**
1. Go to **"My Orders"** in your dashboard
2. View all your orders with status badges
3. Click on any order to see details

**Order Statuses:**
- 🟡 **Pending**: Order created, awaiting confirmation
- 🔵 **Confirmed**: Supplier confirmed the order
- ⚙️ **Processing**: Supplier is preparing your order
- 🚚 **Shipped**: Order is on the way (tracking number available)
- ✅ **Delivered**: Order received successfully
- ❌ **Cancelled**: Order was cancelled

**Order Details Include:**
- Order number
- Product information
- Quantity & pricing
- Shipping address
- Tracking number (when shipped)
- Estimated delivery date
- Order timeline/history

**Tracking Number:**
- Provided when order status changes to "Shipped"
- Use it to track on carrier's website
- Also visible in order details

🔍 **Go to**: "My Orders" to track all your orders!`,
        suggestions: [
          "Where do I find my orders?",
          "What if my order is delayed?",
          "How do I contact supplier about order?",
          "Can I cancel an order?"
        ]
      };
    }

    // My orders
    if (lowerMsg.includes("my order") || (lowerMsg.includes("where") && lowerMsg.includes("order"))) {
      return {
        response: `📍 **Finding Your Orders:**

**Step 1**: Log in to your account
**Step 2**: Go to your **Dashboard** or click **"My Orders"** in the navigation
**Step 3**: View all your orders in one place

**In "My Orders" you can:**
- See all orders (Inquiry-based & RFQ-based)
- Filter by status (Pending, Confirmed, Shipped, etc.)
- Search for specific orders
- View order details
- Download invoices
- Track shipments
- Contact supplier

**Order Types:**
- **Inquiry Orders**: Created from product inquiries
- **RFQ Orders**: Created from RFQ quotations

Both are managed in the same "My Orders" section.

🎯 **Quick Access**: Use the navigation menu → "My Orders" or from your dashboard.`,
        suggestions: [
          "How do I track my order?",
          "How do I contact supplier?",
          "What is order status?",
          "Can I cancel an order?"
        ]
      };
    }

    // How to send inquiry
    if ((lowerMsg.includes("send") || lowerMsg.includes("create")) && lowerMsg.includes("inquiry")) {
      return {
        response: `📝 **How to Send an Inquiry:**

**Step-by-Step Guide:**

1. **Find a Product**
   - Browse products by category
   - Or use the search bar
   - Click on any product you like

2. **Open Inquiry Form**
   - On product detail page
   - Click **"Send Inquiry"** button
   - Or click **"Inquiry"** button

3. **Fill Inquiry Form**
   - **Quantity**: Enter how many units you need
   - **Target Price**: Your budget per unit (optional)
   - **Requirements**: Special specifications or notes
   - **Message**: Additional information for supplier
   - **Delivery Date**: When you need it by

4. **Submit Inquiry**
   - Review your information
   - Click **"Send Inquiry"**
   - Confirmation message appears

5. **Wait for Response**
   - Supplier receives your inquiry
   - They will send a quotation
   - You'll be notified when quotation arrives

**After Sending:**
- Check "My Inquiries" to see status
- Receive quotation in "My Quotations"
- Accept, reject, or negotiate

✅ **Ready?** Visit any product page and click "Send Inquiry"!`,
        suggestions: [
          "What is an Inquiry?",
          "How long until I get a quotation?",
          "Where do I see my inquiries?",
          "What is an RFQ?"
        ]
      };
    }

    // How to create RFQ
    if ((lowerMsg.includes("create") || lowerMsg.includes("make")) && lowerMsg.includes("rfq")) {
      return {
        response: `🚀 **How to Create an RFQ:**

**Step-by-Step Guide:**

1. **Navigate to RFQ Section**
   - Click **"RFQs"** in navigation menu
   - Or go to **"RFQs"** from dashboard
   - Click **"Create RFQ"** button

2. **Fill RFQ Form**
   - **Title**: Short description (e.g., "LED Strip Lights 500m")
   - **Category**: Select product category
   - **Description**: Detailed requirements
   - **Quantity**: How many units you need
   - **Target Price**: Your budget range
   - **Requirements**: Technical specs, certifications, etc.
   - **Delivery Location**: Where to ship

3. **Submit RFQ**
   - Review all information
   - Click **"Submit RFQ"**
   - RFQ is published on platform

4. **Multiple Suppliers Respond**
   - Suppliers see your RFQ
   - They send quotations with pricing
   - You receive notifications

5. **Compare & Choose**
   - View all quotations in "My Quotations"
   - Compare prices, MOQ, lead times
   - Accept the best offer

**RFQ Benefits:**
✅ Get competitive pricing
✅ Multiple suppliers compete
✅ Best for custom requirements
✅ Find new suppliers

📋 **Create your first RFQ**: Go to "RFQs" → "Create RFQ"!`,
        suggestions: [
          "What is an RFQ?",
          "How long until I get RFQ quotations?",
          "Where do I see RFQ quotations?",
          "Can I negotiate RFQ quotations?"
        ]
      };
    }

    // MOQ
    if (lowerMsg.includes("moq") || (lowerMsg.includes("minimum") && lowerMsg.includes("quantity"))) {
      return {
        response: `📊 **What is MOQ?**

**MOQ** = **Minimum Order Quantity**

It's the smallest quantity a supplier is willing to sell.

**Why MOQ Exists:**
- Suppliers prefer bulk orders
- More cost-effective for both parties
- Better pricing for larger quantities

**Example:**
- Product MOQ: 100 units
- You must order at least 100 units
- Price gets better with larger quantities

**MOQ in Quotations:**
- Suppliers set MOQ in their quotations
- You can negotiate MOQ if needed
- Some suppliers flexible on MOQ

**Tips:**
✅ Check MOQ before sending inquiry
✅ If you need less, ask supplier to negotiate
✅ Consider combining orders to meet MOQ
✅ Larger orders often get better prices

💡 **Pro Tip**: MOQ is negotiable in many cases!`,
        suggestions: [
          "How do I negotiate MOQ?",
          "What if I need less than MOQ?",
          "How do I find products with low MOQ?",
          "What is a quotation?"
        ]
      };
    }

    // Product search queries - return null to trigger product search
    const productSearchKeywords = ["find", "search", "looking for", "need", "want", "show me", "looking", "find me", "help me find", "i need", "i want", "show", "looking", "products", "product"];
    const isProductSearch = productSearchKeywords.some(keyword => 
      lowerMsg.includes(keyword) && (
        lowerMsg.length > keyword.length + 3 || // Has additional text after keyword
        lowerMsg.includes("product") ||
        lowerMsg.includes("item") ||
        lowerMsg.includes("goods")
      )
    );

    // Extract product search terms
    if (isProductSearch) {
      // Return special indicator for product search
      return {
        response: "SEARCH_PRODUCTS", // Special marker for product search
        suggestions: [
          "Show me all products",
          "Browse by category",
          "How do I send an inquiry?",
          "What is an RFQ?"
        ]
      };
    }

    // How to search for products
    if ((lowerMsg.includes("how") && lowerMsg.includes("search")) || 
        (lowerMsg.includes("search") && (lowerMsg.includes("product") || lowerMsg.includes("help"))) ||
        lowerMsg.includes("how to find product")) {
      return {
        response: `🔍 **How to Search for Products:**

**Method 1: Using AI Assistant (Recommended)**
Just ask me! I can search for products for you. Examples:
- "Show me LED lights"
- "Find blood pressure monitors"
- "I need electronics"
- "Search for textiles"

**Method 2: Main Search Bar**
1. Use the **search bar** at the top of the page
2. Type **product name or keywords** (e.g., "LED strip lights", "textiles")
3. Select a **category** if you know it (optional)
4. Press **Enter** or click **"Search"** button

**Method 3: Browse by Category**
1. Click **"Categories"** in navigation
2. Select a category (Electronics, Textiles, Machinery, etc.)
3. Browse products in that category
4. Use filters for price, MOQ, location

**Best Search Tips:**
✅ **Use specific names**: "LED lights" instead of "lights"
✅ **Try synonyms**: "textiles" or "fabric" or "cloth"
✅ **Category names work**: "electronics", "machinery", "medical"
✅ **Be descriptive**: "digital blood pressure monitor"
✅ **Spell correctly**: Check spelling for better results

**Pro Tip**: Ask me to search! Just say "show me [product name]" and I'll find it for you! 🚀`,
        suggestions: [
          "Show me electronics products",
          "Find LED lights",
          "Search for medical devices",
          "How do I send an inquiry?"
        ]
      };
    }

    // Product search/find (general info)
    if (lowerMsg.includes("product") && (lowerMsg.includes("find") || lowerMsg.includes("search") || lowerMsg.includes("browse")) && !isProductSearch) {
      return {
        response: `🔍 **Finding Products on Our Platform:**

**Method 1: Ask Me to Search (Easiest!)**
Just tell me what you need! Examples:
- "Show me LED lights"
- "Find blood pressure monitors"
- "I need electronics"
- "Search for textiles"

**Method 2: Browse by Category**
1. Click **"Categories"** in navigation
2. Select a category (e.g., Electronics, Textiles)
3. Browse subcategories
4. View all products in that category

**Method 3: Main Search Bar**
1. Use search bar at top of page
2. Type product name or keywords
3. Press Enter or click search
4. Filter results by price, MOQ, location

**Best Practices:**
- Use specific product names when possible
- Try broader terms if specific search doesn't work
- Use category names for browsing
- Check spelling

🎯 **Ask me**: "Show me [product name]" and I'll search for you! Or use the search bar at the top!`,
        suggestions: [
          "How do I search for products?",
          "Show me electronics products",
          "Find products with low MOQ",
          "What is MOQ?"
        ]
      };
    }

    // Default response with platform overview
    return {
      response: `I'm here to help you navigate our B2B platform! 🌟

I can assist you with:
• **Ordering Process**: Step-by-step guide to place orders
• **Inquiries**: How to send inquiries for products
• **RFQs**: Creating Request for Quotations
• **Negotiations**: How to negotiate with suppliers
• **Tracking**: Following your orders
• **General Questions**: Platform features and usage

**Popular Questions:**
- "How does this website work?"
- "How do I place an order?"
- "What is an Inquiry?"
- "What is an RFQ?"

What would you like to know? Just ask me anything! 😊`,
      suggestions: [
        "How does this website work?",
        "How do I place an order?",
        "What is an Inquiry?",
        "What is an RFQ?"
      ]
    };
  };

  const extractSearchTerms = (text: string): string => {
    // Remove common phrases to extract product keywords
    const lowerText = text.toLowerCase();
    
    // Patterns to remove
    const patterns = [
      /^(show me|find|search|looking for|need|want|find me|help me find|i need|i want|show|looking for|find me|can you find|could you find)\s+/i,
      /\s+(products|product|items|item|goods|please|can you|could you)$/i,
      /\b(me|the|a|an|for|with|that|have|has)\b/gi
    ];
    
    let cleaned = text;
    patterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, ' ').trim();
    });
    
    // Clean multiple spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // If we still have meaningful content (at least 2 chars), use it
    if (cleaned.length >= 2) {
      return cleaned;
    }
    
    // Fallback: try to extract any words that look like product names
    const words = text.split(/\s+/).filter(w => {
      const lowerW = w.toLowerCase();
      return w.length >= 3 && !['show', 'me', 'find', 'search', 'looking', 'for', 'product', 'products', 'item', 'items'].includes(lowerW);
    });
    
    return words.length > 0 ? words.join(' ') : text; // Final fallback to original text
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessageText = message.trim();
    const userMessage: Message = {
      from: "user",
      message: userMessageText,
      time: "Just now"
    };

    setChatHistory((prev) => [...prev, userMessage]);
    const currentMessage = message.trim();
    setMessage("");

    // Check if this is a product search request
    const lowerMsg = userMessageText.toLowerCase();
    const productSearchKeywords = ["find", "search", "looking for", "need", "want", "show me", "looking", "find me", "help me find", "i need", "i want", "show"];
    const isProductSearch = productSearchKeywords.some(keyword => lowerMsg.includes(keyword));

    if (isProductSearch) {
      // Extract search terms and trigger product search
      const searchTerms = extractSearchTerms(userMessageText);
      console.log("Product search detected. Extracted terms:", searchTerms);
      
      // Set search query which will trigger the API call
      setSearchQuery(searchTerms);
      
      // Wait a moment then show searching message
      setTimeout(() => {
        // Generate response that will include products
        const botMessage: Message = {
          from: "bot",
          message: `🔍 **Searching for products matching "${searchTerms}"...**\n\nLet me find the best products for you!`,
          time: "Just now",
          suggestions: [
            "How do I search for products?",
            "Show me all products",
            "Browse by category",
            "What is an RFQ?"
          ]
        };
        setChatHistory((prev) => [...prev, botMessage]);
      }, 500);
    } else {
      // Clear search query for non-product queries
      setSearchQuery("");
      // Generate intelligent response
      setTimeout(() => {
        const { response, suggestions } = generateResponse(userMessageText);
        const botMessage: Message = {
          from: "bot",
          message: response,
          time: "Just now",
          suggestions
        };
        setChatHistory((prev) => [...prev, botMessage]);
      }, 800);
    }
  };

  // Update chat history when products are loaded
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return; // Don't update if no valid search query
    
    console.log("Products loaded:", products.length, "for query:", searchQuery, "isLoading:", isLoadingProducts);
    
    if (products.length > 0) {
      // Products found - update the last bot message
      setChatHistory((prev) => {
        const updated = [...prev];
        // Find the last bot message that mentions searching
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i]?.from === "bot" && 
              (updated[i]?.message.includes("Searching for products") || 
               updated[i]?.message.includes("matching"))) {
            console.log("Updating bot message with products:", products.length);
            updated[i] = {
              ...updated[i],
              message: `✅ **Found ${products.length} product${products.length > 1 ? 's' : ''} matching "${searchQuery}"**\n\nHere are the products I found:`,
              products: products, // Attach products array
              suggestions: [
                `Search for more "${searchQuery}" products`,
                "How do I send an inquiry?",
                "What is MOQ?",
                "How do I search for products?"
              ]
            };
            break;
          }
        }
        return updated;
      });
    } else if (!isLoadingProducts && searchQuery.trim().length >= 2) {
      // No products found or search completed with no results
      setChatHistory((prev) => {
        const updated = [...prev];
        // Find the last bot message that mentions searching
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i]?.from === "bot" && 
              (updated[i]?.message.includes("Searching for products") || 
               updated[i]?.message.includes("matching"))) {
            console.log("No products found, updating message");
            updated[i] = {
              ...updated[i],
              message: `😔 **No products found matching "${searchQuery}"**\n\n**How to search better:**\n- Use specific product names (e.g., "LED lights")\n- Try broader terms (e.g., "electronics" instead of "electronic components")\n- Use category names (e.g., "textiles", "machinery")\n- Check spelling\n- Try related synonyms\n\n**You can also:**\n- Browse by category\n- Create an RFQ for custom products\n- Ask me to search with different keywords`,
              products: [], // Ensure products is empty array
              suggestions: [
                "How do I search for products?",
                "Show me all products",
                "How do I create an RFQ?",
                "Browse by category"
              ]
            };
            break;
          }
        }
        return updated;
      });
    }
  }, [products, searchQuery, isLoadingProducts]);

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    // Auto-send after a brief moment
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const formatMessage = (text: string) => {
    // Split by double newlines for paragraphs
    const parts = text.split(/\n\n/);
    return parts.map((part, index) => {
      // Check for headers (starts with **)
      if (part.trim().startsWith("**") && part.trim().endsWith("**")) {
        return (
          <div key={index} className="font-semibold text-base mb-2">
            {part.replace(/\*\*/g, "")}
          </div>
        );
      }
      // Check for bullet points or numbered lists
      const lines = part.split("\n");
      return (
        <div key={index} className="mb-2">
          {lines.map((line, lineIndex) => {
            const trimmedLine = line.trim();
            // Bold text with **
            if (trimmedLine.match(/\*\*.+\*\*/)) {
              const boldParts = trimmedLine.split(/(\*\*.+?\*\*)/g);
              return (
                <div key={lineIndex} className="mb-1">
                  {boldParts.map((boldPart, boldIndex) => {
                    if (boldPart.startsWith("**") && boldPart.endsWith("**")) {
                      return (
                        <strong key={boldIndex} className="font-semibold">
                          {boldPart.replace(/\*\*/g, "")}
                        </strong>
                      );
                    }
                    return <span key={boldIndex}>{boldPart}</span>;
                  })}
                </div>
              );
            }
            // Emoji and text
            if (trimmedLine.startsWith("- ") || trimmedLine.match(/^\d+\./)) {
              return (
                <div key={lineIndex} className="ml-2 mb-1">
                  {trimmedLine}
                </div>
              );
            }
            return (
              <div key={lineIndex} className="mb-1">
                {trimmedLine}
              </div>
            );
          })}
        </div>
      );
    });
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white shadow-2xl hover:shadow-3xl transition-all hover:scale-110"
          size="icon"
          style={{ 
            position: 'fixed', 
            bottom: '96px', 
            left: '24px', 
            zIndex: 99999,
            pointerEvents: 'auto'
          }}
        >
          <Bot className="h-7 w-7" />
        </Button>
      )}

      {isOpen && (
        <Card 
          className="w-96 h-[600px] flex flex-col shadow-2xl border-gray-200"
          style={{ 
            position: 'fixed', 
            bottom: '96px', 
            left: '24px', 
            zIndex: 99999,
            pointerEvents: 'auto'
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4 flex items-center justify-between rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base">B2B Assistant</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-xs text-gray-300">Always Online</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gray-50">
            {chatHistory.map((chat, index) => (
              <div
                key={index}
                className={`flex ${chat.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg ${
                    chat.from === "user"
                      ? "bg-primary text-white p-3.5"
                      : "bg-white border border-gray-200 shadow-sm p-4"
                  }`}
                >
                  {chat.from === "bot" && (
                    <div className="flex items-center gap-2 mb-3">
                      <Bot className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium text-primary">B2B Assistant</span>
                    </div>
                  )}
                  <div className={`text-sm ${chat.from === "bot" ? "text-gray-800" : "text-white"} leading-relaxed ${chat.from === "bot" ? "mb-2" : ""}`}>
                    {chat.from === "bot" ? formatMessage(chat.message) : chat.message}
                  </div>
                  
                  {/* Loading State for Product Search */}
                  {chat.from === "bot" && chat.message.includes("Searching for products") && isLoadingProducts && (
                    <div className="mt-5 bg-gradient-to-br from-brand-orange-50 via-brand-orange-100 to-brand-orange-50 border border-brand-orange-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative flex-shrink-0">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-orange-200 border-t-primary"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Search className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-brand-grey-900 mb-1">Searching products...</p>
                          <p className="text-xs text-brand-grey-700">Finding the best matches for you</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="h-2.5 bg-brand-orange-300 rounded-full flex-1 opacity-60 animate-pulse" style={{ animationDelay: '0s' }}></div>
                        <div className="h-2.5 bg-brand-orange-400 rounded-full flex-1 opacity-80 animate-pulse" style={{ animationDelay: '0.15s' }}></div>
                        <div className="h-2.5 bg-primary rounded-full flex-1 opacity-100 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                        <div className="h-2.5 bg-brand-orange-400 rounded-full flex-1 opacity-80 animate-pulse" style={{ animationDelay: '0.45s' }}></div>
                        <div className="h-2.5 bg-brand-orange-300 rounded-full flex-1 opacity-60 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Product Results */}
                  {chat.from === "bot" && chat.products && chat.products.length > 0 && (
                    <div className="mt-5 space-y-4 max-h-80 overflow-y-auto pr-1">
                      {chat.products.map((product, productIndex) => (
                        <Link key={product.id} href={`/product/${product.id}`}>
                          <div className="bg-gradient-to-br from-brand-orange-50 via-brand-orange-100 to-brand-orange-50 border border-brand-orange-200/60 rounded-xl p-4 hover:shadow-lg hover:border-brand-orange-300 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
                            <div className="flex items-start gap-4">
                              {product.images && product.images.length > 0 ? (
                                <div className="flex-shrink-0">
                                  <img 
                                    src={product.images[0]} 
                                    alt={product.name}
                                    className="w-20 h-20 object-cover rounded-lg shadow-sm border border-gray-200 group-hover:shadow-md transition-shadow"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder-product.png';
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-20 h-20 bg-gradient-to-br from-brand-orange-100 to-brand-orange-200 rounded-lg flex items-center justify-center border border-brand-orange-200 shadow-sm flex-shrink-0">
                                  <Package className="h-9 w-9 text-primary" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0 flex flex-col gap-2">
                                <div className="flex items-start justify-between gap-3">
                                  <h4 className="font-semibold text-base text-gray-900 group-hover:text-primary line-clamp-2 leading-tight transition-colors">
                                    {product.name}
                                  </h4>
                                  <ExternalLink className="h-4 w-4 text-primary flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                {product.description && (
                                  <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                    {product.description.replace(/\n/g, ' ').replace(/\|/g, '').trim()}
                                  </p>
                                )}
                                <div className="flex items-center flex-wrap gap-2 mt-1">
                                  {product.priceRange && (
                                    <Badge variant="outline" className="text-xs bg-white border-brand-orange-300 text-brand-orange-700 font-medium px-2.5 py-0.5">
                                      💰 {product.priceRange}
                                    </Badge>
                                  )}
                                  {product.moq && (
                                    <Badge variant="outline" className="text-xs bg-white border-orange-600 text-orange-600 font-medium px-2.5 py-0.5">
                                      📦 MOQ: {product.moq}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                      <div className="pt-1">
                        <Link href={`/products?search=${encodeURIComponent(searchQuery)}`}>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-xs bg-white hover:bg-gradient-to-r hover:from-brand-orange-50 hover:to-brand-orange-100 border-brand-orange-300 hover:border-brand-orange-400 transition-all duration-200 py-2.5"
                          >
                            <Search className="h-3.5 w-3.5 mr-2" />
                            View All Results on Products Page
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                  
                  <p className={`text-xs mt-3 ${chat.from === "user" ? "text-white/80" : "text-gray-500"}`}>
                    {chat.time}
                  </p>
                  
                  {/* Suggestions - Always show if bot message has suggestions */}
                  {chat.from === "bot" && chat.suggestions && Array.isArray(chat.suggestions) && chat.suggestions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-3 font-semibold flex items-center gap-1.5">
                        <span className="text-base">💡</span> Suggestions:
                      </p>
                      <div className="flex flex-col gap-2.5">
                        {chat.suggestions.map((suggestion, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs h-auto py-2.5 px-3.5 text-left justify-start hover:bg-brand-orange-50 hover:border-brand-orange-300 hover:text-primary transition-all duration-200 rounded-md border-gray-200 bg-gray-50/50"
                          >
                            <ArrowRight className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                            <span className="text-xs leading-relaxed">{suggestion}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-5 border-t border-gray-200 bg-white">
            <div className="flex gap-3">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 text-sm py-2.5 px-4 border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                className="bg-gray-900 hover:bg-gray-800 transition-all duration-200 h-auto px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md"
                size="icon"
                disabled={!message.trim()}
              >
                <Send className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
