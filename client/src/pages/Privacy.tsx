import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Shield, 
  Lock, 
  Eye, 
  Database, 
  UserCheck, 
  AlertCircle,
  CheckCircle,
  Cookie,
  FileText
} from "lucide-react";

export default function Privacy() {
  const sections = [
    {
      icon: Database,
      title: "1. Information We Collect",
      content: "We collect information that you provide directly to us, including:",
      points: [
        "Account Information: Name, email address, company name, business type, phone number",
        "Business Information: Business license, tax ID, certifications, factory address",
        "Transaction Information: Order details, payment information, shipping addresses",
        "Communication Data: Messages, inquiries, RFQs, and correspondence with other users",
        "Usage Data: Information about how you use our platform, including browsing history and search queries"
      ],
      color: "from-primary/10 to-primary/20",
      iconColor: "text-primary"
    },
    {
      icon: Eye,
      title: "2. How We Use Your Information",
      content: "We use the information we collect to:",
      points: [
        "Provide, maintain, and improve our services",
        "Process transactions and send related information",
        "Send you technical notices, updates, and support messages",
        "Respond to your comments, questions, and customer service requests",
        "Communicate with you about products, services, offers, and events",
        "Monitor and analyze trends, usage, and activities",
        "Detect, prevent, and address technical issues and fraudulent activities"
      ],
      color: "from-green-100 to-green-200",
      iconColor: "text-green-600"
    },
    {
      icon: UserCheck,
      title: "3. Information Sharing",
      content: "We may share your information in the following situations:",
      points: [
        "With other users when you communicate through our platform",
        "With service providers who perform services on our behalf",
        "For legal purposes if required by law or to protect our rights",
        "In connection with a merger, sale, or business transfer",
        "With your consent or at your direction"
      ],
      color: "from-purple-100 to-purple-200",
      iconColor: "text-purple-600"
    },
    {
      icon: Lock,
      title: "4. Data Security",
      content: "We implement appropriate technical and organizational measures to protect your personal information:",
      points: [
        "Encryption of data in transit and at rest using industry-standard protocols",
        "Regular security assessments and audits",
        "Access controls and authentication requirements",
        "Employee training on data protection and privacy",
        "Incident response procedures for data breaches"
      ],
      color: "from-red-100 to-red-200",
      iconColor: "text-red-600"
    },
    {
      icon: Cookie,
      title: "5. Cookies and Tracking",
      content: "We use cookies and similar tracking technologies to track activity on our platform:",
      points: [
        "Essential cookies for platform functionality",
        "Analytics cookies to understand usage patterns",
        "Advertising cookies to deliver relevant ads",
        "Social media cookies for sharing features",
        "You can control cookie preferences through your browser settings"
      ],
      color: "from-yellow-100 to-yellow-200",
      iconColor: "text-yellow-600"
    },
    {
      icon: Shield,
      title: "6. Your Rights",
      content: "You have the following rights regarding your personal information:",
      points: [
        "Access: Request access to your personal information",
        "Correction: Request correction of inaccurate information",
        "Deletion: Request deletion of your personal information",
        "Objection: Object to processing of your information",
        "Portability: Request transfer of your information",
        "Withdraw Consent: Withdraw consent at any time"
      ],
      color: "from-pink-100 to-pink-200",
      iconColor: "text-pink-600"
    }
  ];

  const additionalSections = [
    {
      title: "7. Data Retention",
      content: "We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need your information, we will securely delete or anonymize it."
    },
    {
      title: "8. International Data Transfers",
      content: "Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards."
    },
    {
      title: "9. Children's Privacy",
      content: "Our platform is not intended for children under 18 years of age. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us."
    },
    {
      title: "10. Changes to This Policy",
      content: "We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the 'Last updated' date. You are advised to review this Privacy Policy periodically for any changes."
    },
    {
      title: "11. Contact Us",
      content: "If you have any questions about this Privacy Policy, please contact our Data Protection Officer at privacy@globaltradehub.com or write to us at our registered office address."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-br from-green-900 via-green-800 to-green-700 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-green-400/20 to-green-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-green-500/20 to-green-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-sm text-white/95 shadow-lg mb-6">
              <Shield className="w-4 h-4" />
              <span>Privacy & Security</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-lg text-white/90">Last updated: January 2024</p>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Introduction */}
          <Card className="mb-8 bg-gradient-to-r from-green-50 to-primary/5 border-green-100">
            <CardContent className="p-6">
              <p className="text-gray-700 leading-relaxed">
                At Bago, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our B2B marketplace platform. Please read this privacy policy carefully. By using the platform, you agree to the collection and use of information in accordance with this policy.
              </p>
            </CardContent>
          </Card>

          {/* Main Sections */}
          <div className="space-y-6 mb-12">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <Card key={index} className="bg-white border-gray-100 shadow-lg hover:shadow-xl transition-all">
                  <CardHeader>
                    <CardTitle className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-6 h-6 ${section.iconColor}`} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{section.content}</p>
                    {section.points && (
                      <ul className="space-y-2 ml-4">
                        {section.points.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-700">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
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

          {/* GDPR & CCPA Notice */}
          <Card className="mt-8 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-full flex-shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">GDPR & CCPA Compliance</h3>
                  <p className="text-gray-700 text-sm mb-3">
                    We are committed to complying with the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA). If you are a resident of the EU or California, you have additional rights regarding your personal information.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <span className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      GDPR Compliant
                    </span>
                    <span className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      CCPA Compliant
                    </span>
                    <span className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700">
                      <Shield className="w-3 h-3 text-primary" />
                      ISO 27001 Certified
                    </span>
                  </div>
                </div>
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
                  <h3 className="font-semibold text-gray-900 mb-2">Your Privacy Matters</h3>
                  <p className="text-gray-700 text-sm">
                    We are committed to protecting your privacy and ensuring the security of your personal information. 
                    If you have any concerns about how we handle your data, please don't hesitate to contact our Data Protection Officer. 
                    We will respond to your inquiry within 48 hours.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Section */}
          <div className="mt-8 text-center">
            <Card className="bg-gradient-to-r from-green-50 to-primary/5 border-green-100">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Questions About Your Privacy?</h3>
                <p className="text-gray-700 mb-6">
                  Our Data Protection Officer is available to answer any questions you may have about our Privacy Policy.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a href="mailto:privacy@globaltradehub.com" className="text-green-600 hover:text-green-700 font-medium">
                    privacy@globaltradehub.com
                  </a>
                  <span className="hidden sm:inline text-gray-400">|</span>
                  <a href="tel:+15551234567" className="text-green-600 hover:text-green-700 font-medium">
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