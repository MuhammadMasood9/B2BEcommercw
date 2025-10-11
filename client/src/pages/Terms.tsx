import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: January 2024</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="p-8 prose prose-slate max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground mb-4">
                  By accessing and using this B2B marketplace platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">2. Use License</h2>
                <p className="text-muted-foreground mb-4">
                  Permission is granted to temporarily access the materials (information or software) on our platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose or for any public display</li>
                  <li>Attempt to reverse engineer any software contained on the platform</li>
                  <li>Remove any copyright or other proprietary notations from the materials</li>
                  <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">3. Account Registration</h2>
                <p className="text-muted-foreground mb-4">
                  To access certain features of the platform, you must register for an account. When you register, you agree to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and promptly update your account information</li>
                  <li>Maintain the security of your password and accept all risks of unauthorized access</li>
                  <li>Immediately notify us of any unauthorized use of your account</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">4. Buyer and Supplier Obligations</h2>
                <h3 className="text-xl font-semibold mb-3">4.1 Buyer Obligations</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Provide accurate product requirements and order information</li>
                  <li>Make payments according to agreed terms</li>
                  <li>Respond to supplier communications in a timely manner</li>
                  <li>Inspect goods upon receipt and report any issues promptly</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">4.2 Supplier Obligations</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Provide accurate product descriptions and images</li>
                  <li>Honor quoted prices and delivery timelines</li>
                  <li>Ship products according to agreed specifications</li>
                  <li>Maintain valid business licenses and certifications</li>
                  <li>Respond to inquiries within 48 hours</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">5. Trade Assurance</h2>
                <p className="text-muted-foreground mb-4">
                  Our Trade Assurance program protects buyers' payments and ensures suppliers fulfill orders according to agreed terms. Key provisions include:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Product quality protection</li>
                  <li>On-time shipment protection</li>
                  <li>Dispute resolution services</li>
                  <li>Refund policy for non-compliance</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">6. Prohibited Activities</h2>
                <p className="text-muted-foreground mb-4">
                  You may not use the platform to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Engage in fraudulent activities</li>
                  <li>List counterfeit or illegal products</li>
                  <li>Manipulate reviews or ratings</li>
                  <li>Harass or abuse other users</li>
                  <li>Violate intellectual property rights</li>
                  <li>Circumvent platform fees or payments</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">7. Limitation of Liability</h2>
                <p className="text-muted-foreground mb-4">
                  In no event shall our platform or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">8. Governing Law</h2>
                <p className="text-muted-foreground mb-4">
                  These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">9. Changes to Terms</h2>
                <p className="text-muted-foreground mb-4">
                  We reserve the right to modify these terms at any time. We will notify users of any material changes via email or platform notification. Continued use of the platform after changes constitutes acceptance of the modified terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">10. Contact Information</h2>
                <p className="text-muted-foreground">
                  If you have any questions about these Terms of Service, please contact us at:
                  <br />
                  Email: legal@b2bmarketplace.com
                  <br />
                  Phone: +1 (234) 567-8900
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
