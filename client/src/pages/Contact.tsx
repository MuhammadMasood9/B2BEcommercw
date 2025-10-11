import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  MessageSquare,
  Send
} from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-12 mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions? We're here to help. Reach out to our team and we'll get back to you as soon as possible.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Email Us</h3>
                <p className="text-muted-foreground text-sm mb-3">Send us an email anytime</p>
                <a href="mailto:support@b2bmarketplace.com" className="text-primary hover:underline">
                  support@b2bmarketplace.com
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Call Us</h3>
                <p className="text-muted-foreground text-sm mb-3">Mon-Fri from 8am to 6pm</p>
                <a href="tel:+1234567890" className="text-primary hover:underline">
                  +1 (234) 567-8900
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Live Chat</h3>
                <p className="text-muted-foreground text-sm mb-3">Chat with our support team</p>
                <Button variant="outline" size="sm" data-testid="button-start-chat">Start Chat</Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card>
              <CardHeader>
                <CardTitle>Send Us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first-name">First Name *</Label>
                      <Input id="first-name" placeholder="John" className="mt-2" data-testid="input-first-name" />
                    </div>
                    <div>
                      <Label htmlFor="last-name">Last Name *</Label>
                      <Input id="last-name" placeholder="Doe" className="mt-2" data-testid="input-last-name" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" placeholder="john@company.com" className="mt-2" data-testid="input-email" />
                  </div>

                  <div>
                    <Label htmlFor="company">Company Name</Label>
                    <Input id="company" placeholder="Your Company Ltd." className="mt-2" data-testid="input-company" />
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input id="subject" placeholder="How can we help?" className="mt-2" data-testid="input-subject" />
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Tell us more about your inquiry..."
                      rows={6}
                      className="mt-2"
                      data-testid="textarea-message"
                    />
                  </div>

                  <Button className="w-full" size="lg" data-testid="button-submit">
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Office Locations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Headquarters
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      123 Business Avenue<br />
                      New York, NY 10001<br />
                      United States
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Asia Pacific Office
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      456 Trade Center Road<br />
                      Hong Kong<br />
                      China
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Europe Office
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      789 Commerce Street<br />
                      London EC1A 1BB<br />
                      United Kingdom
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Business Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Monday - Friday</p>
                        <p className="text-sm text-muted-foreground">8:00 AM - 6:00 PM (EST)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Saturday</p>
                        <p className="text-sm text-muted-foreground">9:00 AM - 2:00 PM (EST)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Sunday</p>
                        <p className="text-sm text-muted-foreground">Closed</p>
                      </div>
                    </div>
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
