import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RFQCard from "@/components/RFQCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RFQBrowse() {
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
      title: "Industrial Grade Steel Pipes - Various Sizes Required",
      quantity: "2,000 meters",
      location: "Germany",
      timeRemaining: "1 day left",
      quotations: 15,
      category: "Construction",
    },
    {
      id: "4",
      title: "Eco-Friendly Packaging Boxes for E-commerce",
      quantity: "50,000 boxes",
      budget: "$0.50-1.00 per box",
      location: "Canada",
      timeRemaining: "6 days left",
      quotations: 10,
      category: "Packaging",
    },
    {
      id: "5",
      title: "LED Strip Lights for Commercial Use",
      quantity: "1,000 rolls",
      budget: "$20-30 per roll",
      location: "Australia",
      timeRemaining: "4 days left",
      quotations: 7,
      category: "Lighting",
    },
    {
      id: "6",
      title: "Automotive Parts - Brake Pads Wholesale",
      quantity: "5,000 sets",
      location: "United States",
      timeRemaining: "2 days left",
      quotations: 20,
      category: "Automotive",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="flex gap-4 sm:gap-8">
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Category</h3>
                  <div className="space-y-2">
                    {["Electronics", "Apparel", "Construction", "Packaging", "Automotive"].map((cat) => (
                      <div key={cat} className="flex items-center space-x-2">
                        <Checkbox id={`cat-${cat}`} data-testid={`checkbox-category-${cat.toLowerCase()}`} />
                        <Label htmlFor={`cat-${cat}`} className="text-sm cursor-pointer">{cat}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Location</h3>
                  <div className="space-y-2">
                    {["United States", "United Kingdom", "Germany", "Canada"].map((loc) => (
                      <div key={loc} className="flex items-center space-x-2">
                        <Checkbox id={`loc-${loc}`} data-testid={`checkbox-location-${loc.toLowerCase()}`} />
                        <Label htmlFor={`loc-${loc}`} className="text-sm cursor-pointer">{loc}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Quantity Range</h3>
                  <div className="space-y-2">
                    {["< 1,000", "1,000 - 10,000", "10,000 - 50,000", "> 50,000"].map((range) => (
                      <div key={range} className="flex items-center space-x-2">
                        <Checkbox id={`qty-${range}`} data-testid={`checkbox-quantity-${range}`} />
                        <Label htmlFor={`qty-${range}`} className="text-sm cursor-pointer">{range}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold mb-1">Browse RFQs</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">Find buyers looking for your products</p>
                </div>
                <div className="flex items-center gap-4">
                  <Select defaultValue="newest">
                    <SelectTrigger className="w-full sm:w-48" data-testid="select-sort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="ending-soon">Ending Soon</SelectItem>
                      <SelectItem value="most-quoted">Most Quoted</SelectItem>
                      <SelectItem value="budget-high">Highest Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {rfqs.map((rfq) => (
                  <RFQCard key={rfq.id} {...rfq} />
                ))}
              </div>

              <div className="mt-6 sm:mt-8 flex justify-center">
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm" data-testid="button-prev-page">Previous</Button>
                  <Button size="sm" className="text-xs sm:text-sm" data-testid="button-page-1">1</Button>
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm" data-testid="button-page-2">2</Button>
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm" data-testid="button-page-3">3</Button>
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm" data-testid="button-next-page">Next</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
