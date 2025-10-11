import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
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
  MessageSquare
} from "lucide-react";

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");

  const helpCategories = [
    { icon: ShoppingCart, title: "Getting Started", count: 8 },
    { icon: Users, title: "Account & Profile", count: 12 },
    { icon: CreditCard, title: "Payments & Orders", count: 15 },
    { icon: Truck, title: "Shipping & Delivery", count: 10 },
    { icon: Shield, title: "Trade Assurance", count: 9 },
    { icon: MessageSquare, title: "Communication", count: 6 },
  ];

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "How do I create an account?",
          a: "Click on 'Sign Up' in the top right corner and fill in your business details. You can register as either a buyer or supplier. Verification may take 1-2 business days."
        },
        {
          q: "What's the difference between a buyer and supplier account?",
          a: "Buyer accounts can browse products, send inquiries, and post RFQs. Supplier accounts can list products, respond to RFQs, and receive inquiries from buyers."
        },
        {
          q: "Is registration free?",
          a: "Yes, basic registration is completely free for both buyers and suppliers. Premium membership options are available with additional benefits."
        },
      ]
    },
    {
      category: "Payments & Orders",
      questions: [
        {
          q: "What payment methods do you accept?",
          a: "We accept T/T (Bank Transfer), L/C (Letter of Credit), Western Union, and various online payment methods. All payments are protected by our Trade Assurance program."
        },
        {
          q: "How does Trade Assurance work?",
          a: "Trade Assurance protects your payment until you confirm receipt of your order. If products don't match the description or aren't shipped on time, you can request a refund."
        },
        {
          q: "Can I get a sample before placing a bulk order?",
          a: "Yes, most suppliers offer samples. Sample costs and shipping fees are typically paid by the buyer. Some suppliers offer free samples for qualified buyers."
        },
      ]
    },
    {
      category: "Shipping & Delivery",
      questions: [
        {
          q: "How long does shipping take?",
          a: "Shipping time varies by location and shipping method. Express shipping typically takes 3-7 days, standard shipping 7-15 days. Custom orders may have longer production lead times."
        },
        {
          q: "Who pays for shipping?",
          a: "Shipping terms are negotiated between buyer and supplier. Common terms include FOB (buyer pays shipping) and CIF (supplier pays to destination port)."
        },
        {
          q: "Can I track my shipment?",
          a: "Yes, once your order ships, you'll receive a tracking number to monitor your shipment. You can track it in your buyer dashboard."
        },
      ]
    },
    {
      category: "RFQ & Inquiries",
      questions: [
        {
          q: "What is an RFQ?",
          a: "RFQ stands for Request for Quotation. It's a way to post your specific product requirements and receive quotes from multiple verified suppliers."
        },
        {
          q: "How do I send an inquiry?",
          a: "On any product page, click 'Contact Supplier' or 'Request Quote'. Fill in your requirements including quantity, target price, and delivery needs."
        },
        {
          q: "How quickly will suppliers respond?",
          a: "Most verified suppliers respond within 24 hours. Gold suppliers typically respond within 2-4 hours. Response times are shown on supplier profiles."
        },
      ]
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <HelpCircle className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Search our help center or browse by category
            </p>
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search for answers..."
                className="pl-12 h-14 text-lg bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-help"
              />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold mb-8">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {helpCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer" data-testid={`category-${index}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{category.title}</h3>
                        <p className="text-sm text-muted-foreground">{category.count} articles</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="space-y-8">
            {faqs.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <h3 className="text-xl font-semibold mb-4">{section.category}</h3>
                <Accordion type="single" collapsible className="w-full">
                  {section.questions.map((faq, faqIndex) => (
                    <AccordionItem key={faqIndex} value={`${sectionIndex}-${faqIndex}`}>
                      <AccordionTrigger data-testid={`faq-question-${sectionIndex}-${faqIndex}`}>
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent data-testid={`faq-answer-${sectionIndex}-${faqIndex}`}>
                        <p className="text-muted-foreground">{faq.a}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <Card className="bg-muted">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Still need help?</h3>
                <p className="text-muted-foreground mb-6">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button size="lg" data-testid="button-contact-support">Contact Support</Button>
                  <Button size="lg" variant="outline" data-testid="button-live-chat">Live Chat</Button>
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
