import { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import FloatingChatButton from "@/components/FloatingChatButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLoading } from "@/contexts/LoadingContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ShieldCheck, 
  MapPin, 
  Star, 
  Heart,
  MessageSquare,
  Package,
  Truck,
  Award,
  FileText
} from "lucide-react";

export default function ProductDetail() {
  const { setLoading } = useLoading();
  const [, params] = useRoute("/product/:id");
  const productId = params?.id || "1";
  const [quantity, setQuantity] = useState(100);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    setLoading(true, "Loading Product Details...");
    
    const timer = setTimeout(() => {
      setLoading(false);
    }, 900);

    return () => clearTimeout(timer);
  }, [productId]); // Only depend on productId, not setLoading

  //todo: remove mock functionality
  const images = [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1545127398-14699f92334b?w=600&h=600&fit=crop",
  ];

  const relatedProducts = [
    {
      id: "10",
      image: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop",
      name: "Wireless Gaming Mouse",
      priceRange: "$18.00-$28.00 /piece",
      moq: "200 pieces",
      supplierName: "TechGear",
      supplierCountry: "China",
      responseRate: "96%",
      verified: true,
    },
    {
      id: "11",
      image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop",
      name: "USB-C Charging Cable",
      priceRange: "$2.00-$4.00 /piece",
      moq: "500 pieces",
      supplierName: "CableWorks",
      supplierCountry: "Taiwan",
      responseRate: "94%",
    },
  ];

  const getPriceForQuantity = (qty: number) => {
    if (qty >= 1000) return "$22.00";
    if (qty >= 500) return "$25.00";
    return "$28.00";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div>
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-3 sm:mb-4">
                    <img 
                      src={images[selectedImage]} 
                      alt="Product" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 ${
                          selectedImage === idx ? 'border-primary' : 'border-transparent'
                        }`}
                        data-testid={`button-image-${idx}`}
                      >
                        <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className="bg-success text-white text-xs sm:text-sm">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Verified Supplier
                    </Badge>
                    <Badge className="bg-primary text-xs sm:text-sm">Trade Assurance</Badge>
                  </div>
                  
                  <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                    Premium Wireless Bluetooth Headphones with Active Noise Cancellation
                  </h1>

                  <div className="mb-4 sm:mb-6">
                    <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">
                      {getPriceForQuantity(quantity)} <span className="text-base sm:text-lg text-muted-foreground">/piece</span>
                    </div>
                    <div className="space-y-1 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">100-499 pieces:</span>
                        <span className="font-medium">$28.00/piece</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">500-999 pieces:</span>
                        <span className="font-medium">$25.00/piece</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">≥1000 pieces:</span>
                        <span className="font-medium">$22.00/piece</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6 text-xs sm:text-sm">
                    <div>
                      <p className="text-muted-foreground">MOQ:</p>
                      <p className="font-medium">100 pieces</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Lead Time:</p>
                      <p className="font-medium">15-30 days</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sample:</p>
                      <p className="font-medium">Available ($30)</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Customization:</p>
                      <p className="font-medium">Available</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link href={`/start-order/${productId}`}>
                      <Button size="lg" className="w-full bg-gray-700 hover:bg-gray-800 text-white no-default-hover-elevate" data-testid="button-start-order">
                        <Package className="w-4 h-4 mr-2" />
                        Start Bulk Order
                      </Button>
                    </Link>
                    <div className="flex gap-2">
                      <Link href={`/contact-supplier/${productId}`} className="flex-1">
                        <Button size="lg" variant="outline" className="w-full" data-testid="button-contact-supplier">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Contact Supplier</span>
                          <span className="sm:hidden">Contact</span>
                        </Button>
                      </Link>
                      <Button size="lg" variant="outline" data-testid="button-add-favorite">
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button size="lg" variant="outline" className="w-full" data-testid="button-request-quotation">
                      <FileText className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Request Quotation</span>
                      <span className="sm:hidden">Request Quote</span>
                    </Button>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="description" className="mt-6 sm:mt-8">
                <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4">
                  <TabsTrigger value="description" className="text-xs sm:text-sm" data-testid="tab-description">Description</TabsTrigger>
                  <TabsTrigger value="specs" className="text-xs sm:text-sm" data-testid="tab-specs">Specs</TabsTrigger>
                  <TabsTrigger value="company" className="text-xs sm:text-sm" data-testid="tab-company">Company</TabsTrigger>
                  <TabsTrigger value="reviews" className="text-xs sm:text-sm" data-testid="tab-reviews">Reviews</TabsTrigger>
                </TabsList>
                
                <TabsContent value="description" className="mt-4 sm:mt-6">
                  <div className="prose prose-sm sm:prose max-w-none">
                    <p className="text-sm sm:text-base">Experience premium audio quality with our advanced wireless headphones featuring active noise cancellation technology. Perfect for business professionals and music enthusiasts.</p>
                    <h3 className="text-base sm:text-lg">Key Features:</h3>
                    <ul className="text-sm sm:text-base">
                      <li>Active Noise Cancellation (ANC) technology</li>
                      <li>40-hour battery life</li>
                      <li>Premium comfort ear cushions</li>
                      <li>Bluetooth 5.0 connectivity</li>
                      <li>Built-in microphone for calls</li>
                    </ul>
                  </div>
                </TabsContent>
                
                <TabsContent value="specs" className="mt-4 sm:mt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {[
                      ["Driver Size", "40mm"],
                      ["Frequency Response", "20Hz-20kHz"],
                      ["Impedance", "32Ω"],
                      ["Bluetooth Version", "5.0"],
                      ["Battery Capacity", "600mAh"],
                      ["Charging Time", "2 hours"],
                      ["Weight", "250g"],
                      ["Colors Available", "Black, White, Blue"],
                    ].map(([key, value]) => (
                      <div key={key} className="border-b pb-2 text-sm sm:text-base">
                        <p className="text-xs sm:text-sm text-muted-foreground">{key}</p>
                        <p className="font-medium">{value}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="company" className="mt-4 sm:mt-6">
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start gap-4 mb-4 sm:mb-6">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-lg flex-shrink-0" />
                        <div className="flex-1 w-full">
                          <h3 className="text-base sm:text-lg font-semibold mb-2">AudioTech Pro Manufacturing</h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>Shenzhen, China</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
                              <span>4.8 Rating</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-success text-white text-xs">Verified</Badge>
                            <Badge className="bg-amber-500 text-white text-xs">Gold Supplier</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center text-xs sm:text-sm border-t pt-4">
                        <div>
                          <p className="font-semibold text-sm sm:text-base">12 Years</p>
                          <p className="text-muted-foreground text-xs">In Business</p>
                        </div>
                        <div>
                          <p className="font-semibold text-sm sm:text-base">500+</p>
                          <p className="text-muted-foreground text-xs">Products</p>
                        </div>
                        <div>
                          <p className="font-semibold text-sm sm:text-base">95%</p>
                          <p className="text-muted-foreground text-xs">Response Rate</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="reviews" className="mt-4 sm:mt-6">
                  <div className="space-y-3 sm:space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i}>
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <div className="flex">
                              {[...Array(5)].map((_, idx) => (
                                <Star key={idx} className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                            <span className="text-xs sm:text-sm text-muted-foreground">John D. • 2 weeks ago</span>
                          </div>
                          <p className="text-xs sm:text-sm">Great quality headphones! The supplier was very responsive and shipping was fast. Highly recommend for bulk orders.</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="font-semibold text-base sm:text-lg mb-4">Send Inquiry</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="text-xs sm:text-sm font-medium mb-2 block">Quantity (pieces)</label>
                      <Input 
                        type="number" 
                        value={quantity} 
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        min={100}
                        className="text-sm"
                        data-testid="input-quantity"
                      />
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Price: {getPriceForQuantity(quantity)}/piece
                      </p>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium mb-2 block">Target Price (Optional)</label>
                      <Input placeholder="Your target price" className="text-sm" data-testid="input-target-price" />
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium mb-2 block">Message to Supplier</label>
                      <Textarea 
                        placeholder="Describe your requirements..."
                        rows={3}
                        className="text-sm"
                        data-testid="textarea-message"
                      />
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium mb-2 block">Your Email</label>
                      <Input type="email" placeholder="your@email.com" className="text-sm" data-testid="input-email" />
                    </div>
                    <Button className="w-full bg-gray-700 hover:bg-gray-800 text-white no-default-hover-elevate" size="lg" data-testid="button-send-inquiry">
                      Send Inquiry
                    </Button>
                    <Link href={`/contact-supplier/${productId}`}>
                      <Button variant="outline" className="w-full" size="lg" data-testid="button-contact-supplier-sidebar">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Contact Supplier
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <section className="mt-10 sm:mt-16">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
      <FloatingChatButton supplierName="AudioTech Pro Manufacturing" supplierId={productId} />
    </div>
  );
}
