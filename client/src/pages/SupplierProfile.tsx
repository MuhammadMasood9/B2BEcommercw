import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  MapPin, 
  Star, 
  ShieldCheck,
  Heart,
  MessageSquare,
  Building2,
  Users,
  TrendingUp,
  Award,
  Phone,
  Mail,
  Globe
} from "lucide-react";

export default function SupplierProfile() {
  const [activeTab, setActiveTab] = useState("products");

  //todo: remove mock functionality
  const supplierProducts = [
    {
      id: "p1",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      name: "Premium Wireless Headphones",
      priceRange: "$25.00-$35.00 /piece",
      moq: "100 pieces",
      supplierName: "Global Electronics Mfg",
      supplierCountry: "China",
      responseRate: "98%",
      verified: true,
      tradeAssurance: true,
    },
    {
      id: "p2",
      image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop",
      name: "Bluetooth Speaker Portable",
      priceRange: "$18.00-$28.00 /piece",
      moq: "200 pieces",
      supplierName: "Global Electronics Mfg",
      supplierCountry: "China",
      responseRate: "98%",
      verified: true,
    },
  ];

  const reviews = [
    { id: 1, rating: 5, buyer: "John D.", country: "USA", comment: "Excellent quality products and great communication. Highly recommended!", date: "2 weeks ago" },
    { id: 2, rating: 5, buyer: "Sarah M.", country: "UK", comment: "Fast delivery and products exactly as described. Will order again.", date: "1 month ago" },
    { id: 3, rating: 4, buyer: "Michael K.", country: "Germany", comment: "Good quality overall. Minor packaging issues but supplier resolved quickly.", date: "2 months ago" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="relative h-48 sm:h-64 bg-gradient-to-r from-primary/20 to-primary/10">
          <div className="absolute inset-0 bg-cover bg-center opacity-30" 
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop)' }} 
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-16 sm:-mt-20 mb-6 sm:mb-8">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white border-4 border-background rounded-lg flex items-center justify-center overflow-hidden mx-auto md:mx-0">
                    <img src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop" alt="Company Logo" className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-col gap-4 mb-4">
                      <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 text-center md:text-left">Global Electronics Manufacturing Co.</h1>
                        <div className="flex flex-wrap gap-2 mb-3 justify-center md:justify-start">
                          <Badge className="bg-success text-white text-xs">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Verified Supplier
                          </Badge>
                          <Badge className="bg-amber-500 text-white text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            Gold Member
                          </Badge>
                          <Badge className="bg-primary text-xs">Trade Assurance</Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground justify-center md:justify-start">
                          <div className="flex items-center gap-1 justify-center md:justify-start">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Shenzhen, China</span>
                          </div>
                          <div className="flex items-center gap-1 justify-center md:justify-start">
                            <Building2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Manufacturer</span>
                          </div>
                          <div className="flex items-center gap-1 justify-center md:justify-start">
                            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>12 Years</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center md:justify-start">
                        <Button size="lg" className="h-10 sm:h-12 text-xs sm:text-sm" data-testid="button-contact-supplier">
                          <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          Contact Supplier
                        </Button>
                        <Button size="lg" variant="outline" className="h-10 sm:h-12" data-testid="button-add-favorite">
                          <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold text-primary" data-testid="text-stat-products">450+</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Products</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold text-primary" data-testid="text-stat-transactions">2,500+</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Transactions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold text-primary" data-testid="text-stat-response">95%</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Response Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold text-primary" data-testid="text-stat-time">&lt;2h</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Response Time</div>
                      </div>
                      <div className="text-center col-span-2 sm:col-span-1">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-lg sm:text-2xl font-bold text-primary" data-testid="text-stat-rating">4.8</span>
                          <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 text-amber-400" />
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Rating</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8 sm:mb-12">
            <TabsList className="w-full grid grid-cols-4 lg:grid-cols-8 text-xs sm:text-sm">
              <TabsTrigger value="products" className="text-xs sm:text-sm" data-testid="tab-products">Products</TabsTrigger>
              <TabsTrigger value="about" className="text-xs sm:text-sm" data-testid="tab-about">About</TabsTrigger>
              <TabsTrigger value="capabilities" className="text-xs sm:text-sm" data-testid="tab-capabilities">Capabilities</TabsTrigger>
              <TabsTrigger value="certifications" className="text-xs sm:text-sm" data-testid="tab-certifications">Certificates</TabsTrigger>
              <TabsTrigger value="factory" className="text-xs sm:text-sm" data-testid="tab-factory">Factory</TabsTrigger>
              <TabsTrigger value="trade" className="text-xs sm:text-sm" data-testid="tab-trade">Trade Data</TabsTrigger>
              <TabsTrigger value="contact" className="text-xs sm:text-sm" data-testid="tab-contact">Contact</TabsTrigger>
              <TabsTrigger value="reviews" className="text-xs sm:text-sm" data-testid="tab-reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="mt-4 sm:mt-6">
              <div className="mb-4 sm:mb-6 flex gap-4">
                <Input placeholder="Search products..." className="max-w-md text-sm sm:text-base" data-testid="input-search-products" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {supplierProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="about" className="mt-4 sm:mt-6">
              <Card>
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Company Overview</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Global Electronics Manufacturing Co. is a leading manufacturer and exporter of consumer electronics with over 12 years of experience. 
                      We specialize in audio products, smart devices, and mobile accessories. Our factory spans 50,000 square meters with state-of-the-art 
                      production facilities and employs over 500 skilled workers.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 text-sm sm:text-base">Business Information</h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Business Type:</span>
                          <span className="font-medium">Manufacturer</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Year Established:</span>
                          <span className="font-medium">2012</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Employees:</span>
                          <span className="font-medium">500-1000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Factory Size:</span>
                          <span className="font-medium">50,000 m²</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-sm sm:text-base">Main Products</h4>
                      <div className="flex flex-wrap gap-2">
                        {["Headphones", "Speakers", "Earbuds", "Smart Watches", "Chargers", "Cables"].map((product) => (
                          <Badge key={product} variant="outline" className="text-xs">{product}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="capabilities" className="mt-4 sm:mt-6">
              <Card>
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Production Capacity</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="p-3 sm:p-4 bg-muted rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-primary mb-1">100K+</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Units per Month</div>
                      </div>
                      <div className="p-3 sm:p-4 bg-muted rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-primary mb-1">15-30</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Days Lead Time</div>
                      </div>
                      <div className="p-3 sm:p-4 bg-muted rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-primary mb-1">50+</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">R&D Engineers</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Services</h3>
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      <div className="flex items-start gap-3">
                        <Award className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-1" />
                        <div>
                          <h4 className="font-medium mb-1 text-sm sm:text-base">OEM/ODM Services</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">Custom design and manufacturing solutions</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Award className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-1" />
                        <div>
                          <h4 className="font-medium mb-1 text-sm sm:text-base">Quality Control</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">Strict QC process with multiple checkpoints</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="certifications" className="mt-4 sm:mt-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {["ISO 9001", "CE", "RoHS", "FCC", "BSCI", "ISO 14001"].map((cert) => (
                  <Card key={cert} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4 sm:p-6 text-center">
                      <Award className="w-8 h-8 sm:w-12 sm:h-12 text-primary mx-auto mb-2 sm:mb-3" />
                      <h4 className="font-semibold text-sm sm:text-base">{cert}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">Certified</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="factory" className="mt-4 sm:mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img 
                      src={`https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&h=400&fit=crop&sig=${i}`}
                      alt={`Factory ${i}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trade" className="mt-4 sm:mt-6">
              <Card>
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Export Markets</h3>
                      <div className="space-y-2">
                        {[
                          { region: "North America", percentage: 40 },
                          { region: "Europe", percentage: 35 },
                          { region: "Asia", percentage: 15 },
                          { region: "Others", percentage: 10 },
                        ].map((market) => (
                          <div key={market.region}>
                            <div className="flex justify-between text-xs sm:text-sm mb-1">
                              <span>{market.region}</span>
                              <span className="font-medium">{market.percentage}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${market.percentage}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Trade Statistics</h3>
                      <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Annual Revenue:</span>
                          <span className="font-medium">$10-25 Million</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Export Percentage:</span>
                          <span className="font-medium">80%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Production Capacity:</span>
                          <span className="font-medium">100K units/month</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="mt-4 sm:mt-6">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Contact Information</h3>
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        <div>
                          <div className="text-xs sm:text-sm text-muted-foreground">Phone</div>
                          <div className="font-medium text-sm sm:text-base">+86 755 1234 5678</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        <div>
                          <div className="text-xs sm:text-sm text-muted-foreground">Email</div>
                          <div className="font-medium text-sm sm:text-base break-all">sales@globalelectronics.com</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        <div>
                          <div className="text-xs sm:text-sm text-muted-foreground">Website</div>
                          <div className="font-medium text-sm sm:text-base">www.globalelectronics.com</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        <div>
                          <div className="text-xs sm:text-sm text-muted-foreground">Address</div>
                          <div className="font-medium text-sm sm:text-base">Building A, Tech Park, Shenzhen, China</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Contact Person</h3>
                      <Card className="bg-muted">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm sm:text-base">David Chen</div>
                              <div className="text-xs sm:text-sm text-muted-foreground">Sales Manager</div>
                            </div>
                          </div>
                          <Button className="w-full text-xs sm:text-sm" data-testid="button-contact-person">
                            <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            Send Message
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-4 sm:mt-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 mb-4 sm:mb-6">
                  <div className="text-center mx-auto sm:mx-0">
                    <div className="text-4xl sm:text-5xl font-bold text-primary mb-2">4.8</div>
                    <div className="flex items-center gap-1 mb-1 justify-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Based on 234 reviews</div>
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xs sm:text-sm w-10 sm:w-12">{rating} star</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-400" 
                            style={{ width: rating === 5 ? '80%' : rating === 4 ? '15%' : '5%' }} 
                          />
                        </div>
                        <span className="text-xs sm:text-sm text-muted-foreground w-8 sm:w-12 text-right">
                          {rating === 5 ? '187' : rating === 4 ? '35' : '12'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start justify-between mb-3 gap-3 sm:gap-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-semibold text-primary text-sm sm:text-base">{review.buyer[0]}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-sm sm:text-base">{review.buyer}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground">{review.country} • {review.date}</div>
                          </div>
                        </div>
                        <div className="flex ml-11 sm:ml-0">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
