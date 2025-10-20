import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  CheckCircle, 
  Lock, 
  FileText, 
  CreditCard,
  Package,
  Award,
  AlertCircle,
  Globe,
  Clock,
  Users,
  TrendingUp,
  ArrowRight,
  HeadphonesIcon,
  Star
} from "lucide-react";

export default function BuyerProtection() {
  const protectionFeatures = [
    {
      icon: Shield,
      title: "Trade Assurance",
      description: "Your payment is protected until you confirm receipt of your order",
      benefits: [
        "100% product quality protection",
        "100% on-time shipment protection",
        "Refund policy for quality issues",
      ],
      color: "from-green-100 to-green-200",
      iconColor: "text-green-600"
    },
    {
      icon: Lock,
      title: "Secure Payments",
      description: "Multiple secure payment options with encryption",
      benefits: [
        "SSL encrypted transactions",
        "Verified payment gateways",
        "Fraud protection systems",
      ],
      color: "from-blue-100 to-blue-200",
      iconColor: "text-blue-600"
    },
    {
      icon: FileText,
      title: "Verified Admins",
      description: "All admins go through strict verification",
      benefits: [
        "Business license verification",
        "Factory inspection reports",
        "Quality certifications checked",
      ],
      color: "from-purple-100 to-purple-200",
      iconColor: "text-purple-600"
    },
    {
      icon: CreditCard,
      title: "Escrow Service",
      description: "Secure escrow for high-value transactions",
      benefits: [
        "Third-party escrow protection",
        "Milestone-based payments",
        "Dispute resolution support",
      ],
      color: "from-yellow-100 to-yellow-200",
      iconColor: "text-yellow-600"
    },
    {
      icon: Package,
      title: "Quality Inspection",
      description: "Independent quality checks before shipment",
      benefits: [
        "Pre-shipment inspection available",
        "Quality control reports",
        "Sample approval process",
      ],
      color: "from-red-100 to-red-200",
      iconColor: "text-red-600"
    },
    {
      icon: Award,
      title: "Dispute Resolution",
      description: "Fair and efficient dispute handling",
      benefits: [
        "Dedicated mediation team",
        "Evidence-based decisions",
        "Fast resolution process",
      ],
      color: "from-pink-100 to-pink-200",
      iconColor: "text-pink-600"
    },
  ];

  const stats = [
    { icon: Users, value: "10M+", label: "Protected Buyers", color: "text-blue-600" },
    { icon: Shield, value: "$50B+", label: "Transaction Value", color: "text-green-600" },
    { icon: Star, value: "4.9/5", label: "Satisfaction Rate", color: "text-yellow-600" },
    { icon: Clock, value: "24/7", label: "Support Available", color: "text-purple-600" },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Place Your Order",
      description: "Select products and choose Trade Assurance as payment method",
      icon: ShoppingCart
    },
    {
      step: "2",
      title: "Secure Payment",
      description: "Your payment is held securely in escrow until delivery",
      icon: Lock
    },
    {
      step: "3",
      title: "Admin Ships",
      description: "Admin processes and ships your order with tracking",
      icon: Package
    },
    {
      step: "4",
      title: "Confirm Receipt",
      description: "Once satisfied, confirm receipt and payment is released",
      icon: CheckCircle
    },
  ];

  const ShoppingCart = Package;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      {/* Hero Section with Gradient */}
      <section className="relative py-20 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-blue-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-600/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-sm text-white/95 shadow-lg mb-6">
              <Shield className="w-4 h-4 text-green-300" />
              <span>100% Protected</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Buyer
              <span className="bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent block">
                Protection
              </span>
            </h1>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Shop with confidence. Your transactions are protected from payment to delivery
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-300" />
                <span>100% Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-300" />
                <span>Global Coverage</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-300" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="bg-white border-gray-100 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color === 'text-blue-600' ? 'from-blue-100 to-blue-200' : stat.color === 'text-green-600' ? 'from-green-100 to-green-200' : stat.color === 'text-yellow-600' ? 'from-yellow-100 to-yellow-200' : 'from-purple-100 to-purple-200'} flex items-center justify-center mx-auto mb-4`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Protection Features */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Complete Protection for Every Transaction
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Multiple layers of protection ensure your business transactions are safe and secure
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {protectionFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                    <CardHeader>
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-8 h-8 ${feature.iconColor}`} />
                      </div>
                      <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">{feature.description}</p>
                      <ul className="space-y-2">
                        {feature.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                How Buyer Protection Works
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Simple, transparent process to keep your transactions safe
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {howItWorks.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="relative">
                    {index < howItWorks.length - 1 && (
                      <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-600 to-blue-400 -ml-2" />
                    )}
                    <Card className="relative z-10 bg-white border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                          {step.step}
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mx-auto mb-4">
                          <Icon className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2 text-gray-900">{step.title}</h3>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Important Notice */}
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 mb-16">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-full flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    Important Information
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span>Always use Trade Assurance for your transactions to ensure full protection</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span>Communicate with admins through our platform to maintain protection coverage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span>Report any issues within 7 days of delivery for fastest resolution</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span>Keep all documentation and correspondence for dispute evidence</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-none text-white">
              <CardContent className="p-8">
                <Shield className="w-12 h-12 mb-4 opacity-90" />
                <h3 className="text-2xl font-bold mb-4">Ready to Start Trading?</h3>
                <p className="text-white/90 mb-6">
                  Browse thousands of products from verified admins with full buyer protection
                </p>
                <Link href="/products">
                  <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                    Browse Products
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-600 to-green-700 border-none text-white">
              <CardContent className="p-8">
                <HeadphonesIcon className="w-12 h-12 mb-4 opacity-90" />
                <h3 className="text-2xl font-bold mb-4">Need Help?</h3>
                <p className="text-white/90 mb-6">
                  Our support team is available 24/7 to assist you with any questions or concerns
                </p>
                <Link href="/contact">
                  <Button size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
                    Contact Support
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Preview */}
          <Card className="bg-gradient-to-r from-gray-50 to-white border-gray-100 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">What is Trade Assurance?</h4>
                  <p className="text-gray-600 text-sm">
                    Trade Assurance is a free service that protects your orders from payment to delivery, covering product quality and shipping time.
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">How do I file a dispute?</h4>
                  <p className="text-gray-600 text-sm">
                    If you're not satisfied with your order, you can file a dispute through your order page within 7 days of delivery. Our mediation team will help resolve the issue.
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Is there a fee for buyer protection?</h4>
                  <p className="text-gray-600 text-sm">
                    No, buyer protection is completely free for all transactions on our platform. It's our commitment to safe trading.
                  </p>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Link href="/help">
                  <Button variant="outline" size="lg">
                    View All FAQs
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}