import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: January 2024</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="p-8 prose prose-slate max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
                <p className="text-muted-foreground mb-4">
                  We collect information that you provide directly to us, including:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li><strong>Account Information:</strong> Name, email address, company name, business type, phone number</li>
                  <li><strong>Business Information:</strong> Business license, tax ID, certifications, factory address</li>
                  <li><strong>Transaction Information:</strong> Order details, payment information, shipping addresses</li>
                  <li><strong>Communication Data:</strong> Messages, inquiries, RFQs, and correspondence with other users</li>
                  <li><strong>Usage Data:</strong> Information about how you use our platform, including browsing history and search queries</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
                <p className="text-muted-foreground mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Verify business credentials and maintain platform integrity</li>
                  <li>Send you technical notices, updates, and support messages</li>
                  <li>Respond to your inquiries and provide customer service</li>
                  <li>Monitor and analyze trends, usage, and activities</li>
                  <li>Detect, prevent, and address fraud and security issues</li>
                  <li>Personalize and improve user experience</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">3. Information Sharing and Disclosure</h2>
                <p className="text-muted-foreground mb-4">
                  We may share your information in the following situations:
                </p>
                
                <h3 className="text-xl font-semibold mb-3">3.1 With Other Users</h3>
                <p className="text-muted-foreground mb-4">
                  When you use our platform, certain information is shared with other users, including your company name, products, and contact information visible on your public profile.
                </p>

                <h3 className="text-xl font-semibold mb-3">3.2 With Service Providers</h3>
                <p className="text-muted-foreground mb-4">
                  We may share your information with third-party service providers who perform services on our behalf, such as payment processing, data analysis, email delivery, and customer service.
                </p>

                <h3 className="text-xl font-semibold mb-3">3.3 For Legal Reasons</h3>
                <p className="text-muted-foreground mb-4">
                  We may disclose your information if required to do so by law or in response to valid requests by public authorities.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">4. Data Security</h2>
                <p className="text-muted-foreground mb-4">
                  We implement appropriate technical and organizational measures to protect your personal information, including:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>SSL encryption for data transmission</li>
                  <li>Secure data storage with access controls</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Employee training on data protection</li>
                  <li>Incident response procedures</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">5. Your Rights and Choices</h2>
                <p className="text-muted-foreground mb-4">
                  You have the following rights regarding your personal information:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li><strong>Access:</strong> Request access to your personal information</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your information (subject to legal requirements)</li>
                  <li><strong>Data Portability:</strong> Request a copy of your data in a machine-readable format</li>
                  <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
                  <li><strong>Cookie Preferences:</strong> Manage cookie settings through your browser</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">6. International Data Transfers</h2>
                <p className="text-muted-foreground mb-4">
                  Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">7. Data Retention</h2>
                <p className="text-muted-foreground mb-4">
                  We retain your information for as long as necessary to provide our services and comply with legal obligations. When you close your account, we will delete or anonymize your information unless we are required to retain it for legal, tax, or regulatory purposes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">8. Cookies and Tracking Technologies</h2>
                <p className="text-muted-foreground mb-4">
                  We use cookies and similar tracking technologies to collect and track information about your usage of our platform. You can control cookies through your browser settings.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">9. Children's Privacy</h2>
                <p className="text-muted-foreground mb-4">
                  Our platform is not intended for children under 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">10. Changes to This Policy</h2>
                <p className="text-muted-foreground mb-4">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">11. Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy, please contact us at:
                  <br />
                  Email: privacy@b2bmarketplace.com
                  <br />
                  Phone: +1 (234) 567-8900
                  <br />
                  Address: 123 Business Avenue, New York, NY 10001
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
