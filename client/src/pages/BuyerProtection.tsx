import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  CheckCircle, 
  Lock, 
  FileText, 
  CreditCard,
  Package,
  Award,
  AlertCircle
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
      ]
    },
    {
      icon: Lock,
      title: "Secure Payments",
      description: "Multiple secure payment options with encryption",
      benefits: [
        "SSL encrypted transactions",
        "Verified payment gateways",
        "Fraud protection systems",
      ]
    },
    {
      icon: FileText,
      title: "Verified Suppliers",
      description: "All suppliers go through strict verification",
      benefits: [
        "Business license verification",
        "Factory inspection reports",
        "Quality certifications checked",
      ]
    },
    {
      icon: CreditCard,
      title: "Escrow Service",
      description: "Funds held securely until delivery confirmation",
      benefits: [
        "Payment released after inspection",
        "Dispute resolution support",
        "Money-back guarantee",
      ]
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Place Your Order",
      description: "Select products and submit your order with Trade Assurance protection"
    },
    {
      step: 2,
      title: "Payment Protection",
      description: "Your payment is held securely in escrow until shipment is confirmed"
    },
    {
      step: 3,
      title: "Quality Inspection",
      description: "Inspect your products according to the agreed specifications"
    },
    {
      step: 4,
      title: "Confirm Receipt",
      description: "Release payment to supplier once you're satisfied with the order"
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-r from-success/10 to-success/5 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Shield className="w-16 h-16 text-success mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">Buyer Protection Program</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Trade with confidence. Our comprehensive buyer protection ensures your orders are safe, secure, and delivered as promised.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {protectionFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow" data-testid={`feature-${index}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-success" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground mb-4">{feature.description}</p>
                        <ul className="space-y-2">
                          {feature.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">How Trade Assurance Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {howItWorks.map((item) => (
                <div key={item.step} className="text-center" data-testid={`step-${item.step}`}>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <Card className="bg-primary/5">
              <CardContent className="p-6 text-center">
                <Package className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Quality Guarantee</h3>
                <p className="text-sm text-muted-foreground">
                  Products must match description and quality standards
                </p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5">
              <CardContent className="p-6 text-center">
                <Award className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">On-Time Delivery</h3>
                <p className="text-sm text-muted-foreground">
                  Shipment protection ensures delivery within agreed timeframe
                </p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5">
              <CardContent className="p-6 text-center">
                <AlertCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Dispute Resolution</h3>
                <p className="text-sm text-muted-foreground">
                  Professional mediation team to resolve any issues
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-muted">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Refund Policy</h2>
              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="font-semibold mb-2">Full Refund Available When:</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-success mt-0.5 shrink-0" />
                      <span>Product quality does not match the agreed specifications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-success mt-0.5 shrink-0" />
                      <span>Shipment is significantly delayed beyond the agreed delivery date</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-success mt-0.5 shrink-0" />
                      <span>Products are not as described in the order agreement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-success mt-0.5 shrink-0" />
                      <span>Supplier fails to ship the order</span>
                    </li>
                  </ul>
                </div>
              </div>
              <Button size="lg" data-testid="button-learn-more">Learn More About Refunds</Button>
            </CardContent>
          </Card>

          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Trading Safely?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of businesses who trust our buyer protection program for secure international trade
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" data-testid="button-start-sourcing">Start Sourcing</Button>
              <Button size="lg" variant="outline" data-testid="button-contact-support">Contact Support</Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
