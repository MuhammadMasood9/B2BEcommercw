import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Search, 
  HelpCircle,
  ShoppingCart,
  Users,
  CreditCard,
  Truck,
  Shield,
  MessageSquare,
  Phone,
  Mail,
  Globe,
  Clock,
  BookOpen,
  FileText,
  Video,
  Download
} from "lucide-react";

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");

  const helpCategories = [
    { icon: ShoppingCart, title: "Getting Started", count: 8, color: "from-primary/10 to-primary/20", iconColor: "text-primary" },
    { icon: Users, title: "Account & Profile", count: 12, color: "from-green-100 to-green-200", iconColor: "text-green-600" },
    { icon: CreditCard, title: "Payments & Orders", count: 15, color: "from-purple-100 to-purple-200", iconColor: "text-purple-600" },
    { icon: Truck, title: "Shipping & Delivery", count: 10, color: "from-yellow-100 to-yellow-200", iconColor: "text-yellow-600" },
    { icon: Shield, title: "Trade Assurance", count: 9, color: "from-red-100 to-red-200", iconColor: "text-red-600" },
    { icon: MessageSquare, title: "Communication", count: 6, color: "from-pink-100 to-pink-200", iconColor: "text-pink-600" },
  ];

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "How do I create an account?",
          a: "Click on 'Sign Up' in the top right corner and fill in your business details. You can register as either a buyer or admin. Verification may take 1-2 business days."
        },
        {
          q: "What's the difference between a buyer and admin account?",
          a: "Buyer accounts can browse products, send inquiries, and post RFQs. Admin accounts can list products, respond to RFQs, and receive inquiries from buyers."
        },
        {
          q: "Is registration free?",
          a: "Yes, basic registration is completely free for both buyers and admins. Premium membership options are available with additional benefits."
        },
      ]
    },
    {
      category: "Account & Profile",
      questions: [
        {
          q: "How do I verify my account?",
          a: "After registration, submit your business documents through the verification center. Our team will review within 1-2 business days."
        },
        {
          q: "Can I change my account type?",
          a: "Yes, contact our support team to switch between buyer and admin accounts. Note that this may require additional verification."
        },
        {
          q: "How do I reset my password?",
          a: "Click 'Forgot Password' on the login page and follow the email instructions to reset your password."
        },
      ]
    },
    {
      category: "Payments & Orders",
      questions: [
        {
          q: "What payment methods are accepted?",
          a: "We accept credit cards, bank transfers, PayPal, and escrow services for secure transactions."
        },
        {
          q: "How does Trade Assurance work?",
          a: "Trade Assurance protects your order from payment to delivery. Your payment is held securely until you confirm receipt of products as described."
        },
        {
          q: "Can I cancel my order?",
          a: "Orders can be cancelled before the admin processes them. Contact the admin or our support team immediately."
        },
      ]
    },
    {
      category: "Shipping & Delivery",
      questions: [
        {
          q: "How long does shipping take?",
          a: "Shipping times vary by admin location and shipping method. Typically 15-30 days for international orders."
        },
        {
          q: "Can I track my shipment?",
          a: "Yes, tracking information is provided once the admin ships your order. You can track it in 'My Orders' section."
        },
        {
          q: "What if my order is damaged?",
          a: "Contact us immediately with photos. Trade Assurance covers damaged shipments and we'll help resolve the issue."
        },
      ]
    },
  ];

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      faq =>
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen flex flex-col bg-background theme-transition">
      <Header />
      
      {/* Hero Section with Gradient */}
      <section className="relative py-16 bg-gradient-to-br from-secondary via-secondary/90 to-secondary/80 overflow-hidden theme-transition">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-primary/20 to-primary/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-primary/25 to-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/15 to-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-sm text-white/95 shadow-lg mb-6">
              <HelpCircle className="w-4 h-4" />
              <span>Help Center</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              How Can
              <span className="bg-gradient-to-r from-primary/80 via-white to-primary/80 bg-clip-text text-transparent block">
                We Help?
              </span>
            </h1>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Find answers to your questions, explore our resources, or contact our support team
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-white/15 backdrop-blur-xl border border-white/30 rounded-2xl p-3 shadow-2xl">
                <div className="flex items-center bg-white rounded-xl overflow-hidden shadow-lg">
                  <Search className="w-5 h-5 text-gray-400 ml-4 mr-3" />
                  <Input
                    placeholder="Search for answers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 border-0 focus-visible:ring-0 h-14 text-gray-900 placeholder:text-gray-500 text-lg"
                  />
                  <Button size="lg" className="m-1 h-12 px-8 shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90">
                    Search
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-green-300" />
                <span>60+ Articles</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-300" />
                <span>24/7 Support</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-300" />
                <span>Multi-Language</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Help Categories */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {helpCategories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-card border-border cursor-pointer theme-transition">
                    <CardContent className="p-6">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-7 h-7 ${category.iconColor}`} />
                      </div>
                      <h3 className="font-semibold text-lg mb-2 text-card-foreground group-hover:text-primary transition-colors theme-transition">
                        {category.title}
                      </h3>
                      <p className="text-muted-foreground text-sm theme-transition">
                        {category.count} articles
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* FAQs */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            {filteredFaqs.length > 0 ? (
              <div className="space-y-6">
                {filteredFaqs.map((category, idx) => (
                  <Card key={idx} className="bg-white border-gray-100 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-xl">{category.category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {category.questions.map((faq, qIdx) => (
                          <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`}>
                            <AccordionTrigger className="text-left hover:text-primary">
                              {faq.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-600">
                              {faq.a}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white border-gray-100 shadow-lg">
                <CardContent className="p-12 text-center">
                  <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600">
                    Try a different search term or browse our categories above
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resources Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-primary/5 to-primary/10 border-none">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Video className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">Video Tutorials</h3>
                  <p className="text-gray-700 text-sm mb-4">
                    Watch step-by-step guides to get started quickly
                  </p>
                  <Button variant="outline" className="w-full group-hover:bg-white">
                    Watch Now
                  </Button>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-green-50 to-green-100 border-none">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">Documentation</h3>
                  <p className="text-gray-700 text-sm mb-4">
                    Explore detailed documentation and guides
                  </p>
                  <Button variant="outline" className="w-full group-hover:bg-white">
                    Read Docs
                  </Button>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-purple-50 to-purple-100 border-none">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Download className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">Download Center</h3>
                  <p className="text-gray-700 text-sm mb-4">
                    Access forms, templates, and other resources
                  </p>
                  <Button variant="outline" className="w-full group-hover:bg-white">
                    Download
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contact Support */}
          <Card className="bg-gradient-to-r from-primary to-secondary border-none text-white">
            <CardContent className="p-8 text-center">
              <HelpCircle className="w-16 h-16 mx-auto mb-4 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
              <p className="text-white/90 text-lg mb-6 max-w-2xl mx-auto">
                Our support team is available 24/7 to assist you with any questions or concerns
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-gray-100 px-8">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Support
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20 px-8">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Us
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}