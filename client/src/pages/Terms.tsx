import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, Scale, AlertCircle, CheckCircle } from "lucide-react";

export default function Terms() {
  const sections = [
    {
      icon: AlertCircle,
      title: "1. Acceptance of Terms",
      content: "By accessing and using this B2B marketplace platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.",
      color: "from-primary/10 to-primary/20",
      iconColor: "text-primary"
    },
    {
      icon: Scale,
      title: "2. Use License",
      content: "Permission is granted to temporarily access the materials (information or software) on our platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.",
      points: [
        "Modify or copy the materials",
        "Use the materials for any commercial purpose or for any public display",
        "Attempt to reverse engineer any software contained on the platform",
        "Remove any copyright or other proprietary notations from the materials"
      ],
      color: "from-green-100 to-green-200",
      iconColor: "text-green-600"
    },
    {
      icon: Shield,
      title: "3. User Accounts",
      content: "When you create an account with us, you must provide accurate, complete, and current information at all times. Failure to do so constitutes a breach of the Terms.",
      points: [
        "You are responsible for safeguarding your password",
        "You must notify us immediately of any unauthorized use",
        "You may not use another user's account without permission",
        "Accounts are non-transferable"
      ],
      color: "from-purple-100 to-purple-200",
      iconColor: "text-purple-600"
    },
    {
      icon: FileText,
      title: "4. Buyer Obligations",
      content: "As a buyer on our platform, you agree to:",
      points: [
        "Provide accurate purchase order information",
        "Make timely payments for confirmed orders",
        "Communicate professionally with admins",
        "Report any issues within the specified timeframe",
        "Not engage in fraudulent activities"
      ],
      color: "from-yellow-100 to-yellow-200",
      iconColor: "text-yellow-600"
    },
    {
      icon: CheckCircle,
      title: "5. Admin Obligations",
      content: "As an admin on our platform, you agree to:",
      points: [
        "Provide accurate product information and pricing",
        "Fulfill orders as per agreed terms",
        "Maintain quality standards for products/services",
        "Respond to inquiries in a timely manner",
        "Comply with all applicable laws and regulations"
      ],
      color: "from-red-100 to-red-200",
      iconColor: "text-red-600"
    }
  ];

  const additionalSections = [
    {
      title: "6. Payment Terms",
      content: "All payments must be made through our secure payment gateway. We support various payment methods including credit cards, wire transfers, and escrow services for larger transactions."
    },
    {
      title: "7. Dispute Resolution",
      content: "In case of disputes between buyers and admins, our mediation team will facilitate resolution. All parties agree to cooperate in good faith during the dispute resolution process."
    },
    {
      title: "8. Intellectual Property",
      content: "All content on this platform, including text, graphics, logos, and software, is the property of the platform or its content suppliers and is protected by international copyright laws."
    },
    {
      title: "9. Limitation of Liability",
      content: "In no event shall the platform or its suppliers be liable for any damages arising out of the use or inability to use the materials on the platform, even if authorized representative has been notified orally or in writing."
    },
    {
      title: "10. Termination",
      content: "We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms."
    },
    {
      title: "11. Changes to Terms",
      content: "We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect."
    },
    {
      title: "12. Contact Information",
      content: "If you have any questions about these Terms, please contact us at legal@globaltradehub.com or call our legal department at +1 (555) 123-4567."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background theme-transition">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-br from-secondary via-secondary/90 to-secondary/80 overflow-hidden theme-transition">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-primary/20 to-primary/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-primary/25 to-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-sm text-white/95 shadow-lg mb-6">
              <FileText className="w-4 h-4" />
              <span>Legal</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-lg text-white/90">Last updated: January 2024</p>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Main Sections */}
          <div className="space-y-6 mb-12">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <Card key={index} className="bg-card border-border shadow-lg hover:shadow-xl transition-all theme-transition">
                  <CardHeader>
                    <CardTitle className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center flex-shrink-0 theme-transition`}>
                        <Icon className={`w-6 h-6 ${section.iconColor}`} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-card-foreground theme-transition">{section.title}</h2>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 theme-transition">{section.content}</p>
                    {section.points && (
                      <ul className="space-y-2 ml-4">
                        {section.points.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-muted-foreground theme-transition">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0 theme-transition" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Additional Sections */}
          <Card className="bg-white border-gray-100 shadow-lg">
            <CardContent className="p-8">
              <div className="prose prose-slate max-w-none">
                {additionalSections.map((section, index) => (
                  <section key={index} className="mb-8 last:mb-0">
                    <h2 className="text-xl font-bold text-gray-900 mb-3">{section.title}</h2>
                    <p className="text-gray-700 leading-relaxed">{section.content}</p>
                  </section>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <Card className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-full flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Important Notice</h3>
                  <p className="text-gray-700 text-sm">
                    These terms constitute a legally binding agreement between you and Bago. 
                    By using our platform, you acknowledge that you have read, understood, and agree to be bound by these terms. 
                    If you do not agree with any part of these terms, you must not use our service.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Section */}
          <div className="mt-8 text-center">
            <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Have Questions?</h3>
                <p className="text-gray-700 mb-6">
                  Our legal team is here to help clarify any questions you may have about our Terms of Service.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a href="mailto:legal@globaltradehub.com" className="text-primary hover:text-primary/80 font-medium">
                    legal@globaltradehub.com
                  </a>
                  <span className="hidden sm:inline text-gray-400">|</span>
                  <a href="tel:+15551234567" className="text-primary hover:text-primary/80 font-medium">
                    +1 (555) 123-4567
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}