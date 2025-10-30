import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Store, 
  MapPin, 
  Globe, 
  Phone, 
  MessageCircle, 
  Star, 
  Users, 
  Eye,
  Package,
  Calendar,
  Building,
  Mail,
  Send,
  Filter,
  Grid,
  List,
  Search,
  Heart,
  Share2,
  ExternalLink,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StoreData {
  id: string;
  businessName: string;
  storeName: string;
  storeSlug: string;
  storeDescription?: string;
  storeLogo?: string;
  storeBanner?: string;
  businessType: string;
  contactPerson: string;
  phone: string;
  whatsapp?: string;
  wechat?: string;
  address: string;
  city: string;
  country: string;
  website?: string;
  yearEstablished?: number;
  employees?: string;
  mainProducts?: string[];
  exportMarkets?: string[];
  verificationLevel: string;
  isVerified: boolean;
  membershipTier: string;
  rating: number;
  totalReviews: number;
  responseRate: number;
  responseTime?: string;
  totalProducts: number;
  storeViews: number;
  followers: number;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  image: string;
  price: string;
  moq: string;
  category: string;
}

interface Review {
  id: string;
  buyerName: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  useEffect(() => {
    if (slug) {
      fetchStoreData(slug);
    }
  }, [slug]);

  const fetchStoreData = async (storeSlug: string) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/suppliers/store/${storeSlug}`);
      // const data = await response.json();
      
      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockStore: StoreData = {
        id: "1",
        businessName: "TechWorld Electronics Co., Ltd.",
        storeName: "TechWorld Electronics",
        storeSlug: storeSlug,
        storeDescription: "Leading manufacturer of high-quality electronics with 15+ years of experience in global markets. We specialize in consumer electronics, smart devices, and innovative technology solutions for businesses worldwide.",
        storeLogo: "/api/placeholder/120/120",
        storeBanner: "/api/placeholder/1200/300",
        businessType: "manufacturer",
        contactPerson: "John Smith",
        phone: "+86-755-1234567",
        whatsapp: "+86-138-0013-8000",
        wechat: "techworld_sales",
        address: "Building A, Tech Park, Nanshan District",
        city: "Shenzhen",
        country: "China",
        website: "https://techworld-electronics.com",
        yearEstablished: 2008,
        employees: "51-100",
        mainProducts: ["Wireless Headphones", "Bluetooth Speakers", "Smart Watches", "Phone Accessories"],
        exportMarkets: ["North America", "Europe", "Southeast Asia", "Middle East"],
        verificationLevel: "business",
        isVerified: true,
        membershipTier: "gold",
        rating: 4.8,
        totalReviews: 247,
        responseRate: 95,
        responseTime: "< 2 hours",
        totalProducts: 124,
        storeViews: 15420,
        followers: 892,
        createdAt: "2008-03-15T00:00:00Z"
      };

      const mockProducts: Product[] = [
        {
          id: "1",
          name: "Wireless Bluetooth Headphones",
          image: "/api/placeholder/300/300",
          price: "$15.50 - $22.80",
          moq: "100 pieces",
          category: "Audio"
        },
        {
          id: "2", 
          name: "Smart Fitness Watch",
          image: "/api/placeholder/300/300",
          price: "$28.90 - $45.60",
          moq: "50 pieces",
          category: "Wearables"
        },
        {
          id: "3",
          name: "Portable Bluetooth Speaker",
          image: "/api/placeholder/300/300", 
          price: "$12.30 - $18.90",
          moq: "200 pieces",
          category: "Audio"
        },
        {
          id: "4",
          name: "USB-C Fast Charging Cable",
          image: "/api/placeholder/300/300",
          price: "$2.50 - $4.20",
          moq: "500 pieces", 
          category: "Accessories"
        }
      ];

      const mockReviews: Review[] = [
        {
          id: "1",
          buyerName: "Global Tech Solutions",
          rating: 5,
          comment: "Excellent quality products and very responsive communication. Delivered on time as promised.",
          date: "2024-01-15",
          verified: true
        },
        {
          id: "2",
          buyerName: "Electronics Plus Ltd",
          rating: 4,
          comment: "Good product quality and competitive pricing. Will order again.",
          date: "2024-01-10",
          verified: true
        }
      ];

      setStoreData(mockStore);
      setProducts(mockProducts);
      setReviews(mockReviews);
      
    } catch (error) {
      console.error('Error fetching store data:', error);
      toast({
        title: "Error",
        description: "Failed to load store information.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast({
      title: isFollowing ? "Unfollowed" : "Following",
      description: `You are ${isFollowing ? 'no longer following' : 'now following'} ${storeData?.storeName}.`,
    });
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "Store link copied to clipboard.",
    });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement contact form submission
    toast({
      title: "Message Sent",
      description: "Your message has been sent to the supplier.",
    });
    setContactForm({ name: "", email: "", subject: "", message: "" });
  };

  const renderVerificationBadge = () => {
    if (!storeData?.isVerified) return null;
    
    const badgeConfig = {
      basic: { label: "Verified", color: "bg-blue-100 text-blue-800" },
      business: { label: "Business Verified", color: "bg-green-100 text-green-800" },
      premium: { label: "Premium Verified", color: "bg-purple-100 text-purple-800" },
      trade_assurance: { label: "Trade Assurance", color: "bg-gold-100 text-gold-800" }
    };
    
    const config = badgeConfig[storeData.verificationLevel as keyof typeof badgeConfig] || badgeConfig.basic;
    
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading store...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Store Not Found</h2>
            <p className="text-muted-foreground mb-4">The store you're looking for doesn't exist or is not available.</p>
            <Button onClick={() => setLocation("/")}>Go Home</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Store Banner */}
        <div className="relative">
          {storeData.storeBanner ? (
            <img 
              src={storeData.storeBanner} 
              alt="Store Banner"
              className="w-full h-64 object-cover"
            />
          ) : (
            <div className="w-full h-64 bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-center">
              <Store className="w-16 h-16 text-primary/30" />
            </div>
          )}
          
          {/* Store Header Info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-end gap-6">
                {/* Store Logo */}
                <div className="w-24 h-24 bg-white rounded-lg p-2 shadow-lg">
                  {storeData.storeLogo ? (
                    <img 
                      src={storeData.storeLogo} 
                      alt="Store Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                      <Store className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                {/* Store Info */}
                <div className="flex-1 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{storeData.storeName}</h1>
                    {renderVerificationBadge()}
                    <Badge variant="outline" className="text-white border-white/30">
                      {storeData.membershipTier.charAt(0).toUpperCase() + storeData.membershipTier.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-lg text-white/90 mb-2">{storeData.businessName}</p>
                  <div className="flex items-center gap-4 text-sm text-white/80">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {storeData.city}, {storeData.country}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Est. {storeData.yearEstablished}
                    </div>
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      {storeData.businessType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    variant={isFollowing ? "secondary" : "default"}
                    onClick={handleFollow}
                    className="min-w-[100px]"
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isFollowing ? 'fill-current' : ''}`} />
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  <Button variant="outline" onClick={handleShare} className="text-white border-white/30 hover:bg-white/10">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Store Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="products">Products ({storeData.totalProducts})</TabsTrigger>
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews ({storeData.totalReviews})</TabsTrigger>
                  <TabsTrigger value="contact">Contact</TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="mt-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Search products..." className="w-64" />
                      </div>
                      <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={viewMode === "grid" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                      >
                        <Grid className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
                    {products.map((product) => (
                      <Card key={product.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          {viewMode === "grid" ? (
                            <>
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-full h-48 object-cover rounded-lg mb-4"
                              />
                              <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
                              <p className="text-primary font-bold mb-1">{product.price}</p>
                              <p className="text-sm text-muted-foreground">MOQ: {product.moq}</p>
                              <Badge variant="outline" className="mt-2">{product.category}</Badge>
                            </>
                          ) : (
                            <div className="flex gap-4">
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-24 h-24 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <h3 className="font-semibold mb-2">{product.name}</h3>
                                <p className="text-primary font-bold mb-1">{product.price}</p>
                                <p className="text-sm text-muted-foreground mb-2">MOQ: {product.moq}</p>
                                <Badge variant="outline">{product.category}</Badge>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="about" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>About {storeData.storeName}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <p className="text-muted-foreground leading-relaxed">
                        {storeData.storeDescription}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">Business Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Business Type:</span>
                              <span>{storeData.businessType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Established:</span>
                              <span>{storeData.yearEstablished}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Employees:</span>
                              <span>{storeData.employees}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Location:</span>
                              <span>{storeData.city}, {storeData.country}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-3">Main Products</h4>
                          <div className="flex flex-wrap gap-2">
                            {storeData.mainProducts?.map((product, index) => (
                              <Badge key={index} variant="secondary">{product}</Badge>
                            ))}
                          </div>
                          
                          <h4 className="font-semibold mb-3 mt-4">Export Markets</h4>
                          <div className="flex flex-wrap gap-2">
                            {storeData.exportMarkets?.map((market, index) => (
                              <Badge key={index} variant="outline">{market}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews" className="mt-6">
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{review.buyerName}</h4>
                                {review.verified && (
                                  <Badge variant="outline" className="text-xs">Verified Purchase</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-muted-foreground">{review.date}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-muted-foreground">{review.comment}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact {storeData.storeName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleContactSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Your Name</Label>
                            <Input 
                              id="name"
                              value={contactForm.name}
                              onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input 
                              id="email"
                              type="email"
                              value={contactForm.email}
                              onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subject">Subject</Label>
                          <Input 
                            id="subject"
                            value={contactForm.subject}
                            onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="message">Message</Label>
                          <Textarea 
                            id="message"
                            value={contactForm.message}
                            onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                            className="min-h-[120px]"
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Store Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Store Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{storeData.rating}</span>
                      <span className="text-sm text-muted-foreground">({storeData.totalReviews})</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Response Rate</span>
                    <span className="font-semibold text-green-600">{storeData.responseRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Response Time</span>
                    <span className="font-semibold">{storeData.responseTime}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Followers</span>
                    <span className="font-semibold">{storeData.followers}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{storeData.phone}</span>
                    </div>
                    {storeData.whatsapp && (
                      <div className="flex items-center gap-3">
                        <MessageCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{storeData.whatsapp}</span>
                      </div>
                    )}
                    {storeData.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={storeData.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          Visit Website
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">
                        <div>{storeData.address}</div>
                        <div>{storeData.city}, {storeData.country}</div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Button className="w-full">
                      <Mail className="w-4 h-4 mr-2" />
                      Send Inquiry
                    </Button>
                    <Button variant="outline" className="w-full">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Start Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}