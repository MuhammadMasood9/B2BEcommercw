import RFQCard from "./RFQCard";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function RFQSection() {
  //todo: remove mock functionality
  const rfqs = [
    {
      id: "1",
      title: "Looking for High-Quality Wireless Earbuds - Bulk Order",
      quantity: "5,000 units",
      budget: "$15-20 per unit",
      location: "United States",
      timeRemaining: "3 days left",
      quotations: 12,
      category: "Electronics",
    },
    {
      id: "2",
      title: "Need Custom Branded T-Shirts with Logo Printing",
      quantity: "10,000 pieces",
      budget: "$3-5 per piece",
      location: "United Kingdom",
      timeRemaining: "5 days left",
      quotations: 8,
      category: "Apparel",
    },
    {
      id: "3",
      title: "Industrial Grade Steel Pipes - Various Sizes",
      quantity: "2,000 meters",
      location: "Germany",
      timeRemaining: "1 day left",
      quotations: 15,
      category: "Construction",
    },
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Recent RFQs</h2>
            <p className="text-muted-foreground">Connect with buyers looking for your products</p>
          </div>
          <Link href="/rfq/browse">
            <Button variant="outline" data-testid="button-browse-rfqs">Browse All RFQs</Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rfqs.map((rfq) => (
            <RFQCard key={rfq.id} {...rfq} />
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <Link href="/rfq/create">
            <Button size="lg" data-testid="button-post-rfq">Post Your RFQ</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
