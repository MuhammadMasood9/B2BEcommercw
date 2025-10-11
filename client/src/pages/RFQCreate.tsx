import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText } from "lucide-react";

export default function RFQCreate() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Post a Request for Quotation</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Get quotes from verified suppliers for your bulk order requirements</p>
          </div>

          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">RFQ Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
              <div>
                <Label htmlFor="title" className="text-sm sm:text-base">RFQ Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Looking for High-Quality Wireless Earbuds"
                  className="mt-2 text-sm sm:text-base"
                  data-testid="input-rfq-title"
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-sm sm:text-base">Product Category *</Label>
                <Select>
                  <SelectTrigger className="mt-2 text-sm sm:text-base" data-testid="select-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="fashion">Fashion & Apparel</SelectItem>
                    <SelectItem value="machinery">Machinery</SelectItem>
                    <SelectItem value="automotive">Automotive</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="packaging">Packaging</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm sm:text-base">Detailed Requirements *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your product requirements in detail: specifications, quality standards, packaging needs, etc."
                  rows={5}
                  className="mt-2 text-sm sm:text-base"
                  data-testid="textarea-requirements"
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Be as specific as possible to get accurate quotations
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label htmlFor="quantity" className="text-sm sm:text-base">Quantity Needed *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="e.g., 5000"
                    className="mt-2 text-sm sm:text-base"
                    data-testid="input-quantity"
                  />
                </div>
                <div>
                  <Label htmlFor="unit" className="text-sm sm:text-base">Unit</Label>
                  <Select>
                    <SelectTrigger className="mt-2 text-sm sm:text-base" data-testid="select-unit">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pieces">Pieces</SelectItem>
                      <SelectItem value="units">Units</SelectItem>
                      <SelectItem value="sets">Sets</SelectItem>
                      <SelectItem value="boxes">Boxes</SelectItem>
                      <SelectItem value="kg">Kilograms</SelectItem>
                      <SelectItem value="meters">Meters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="target-price" className="text-sm sm:text-base">Target Price (Optional)</Label>
                <Input
                  id="target-price"
                  placeholder="e.g., $15-20 per unit"
                  className="mt-2 text-sm sm:text-base"
                  data-testid="input-target-price"
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Providing a budget helps suppliers give accurate quotes
                </p>
              </div>

              <div>
                <Label className="text-sm sm:text-base">Upload Images/Documents (Optional)</Label>
                <div className="mt-2 border-2 border-dashed rounded-lg p-6 sm:p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                  <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Supports: JPG, PNG, PDF (Max 10MB each)
                  </p>
                  <Input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        setFiles(Array.from(e.target.files));
                      }
                    }}
                    data-testid="input-file-upload"
                  />
                </div>
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs sm:text-sm">
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="truncate">{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label htmlFor="delivery-location" className="text-sm sm:text-base">Delivery Location *</Label>
                  <Input
                    id="delivery-location"
                    placeholder="City, Country"
                    className="mt-2 text-sm sm:text-base"
                    data-testid="input-location"
                  />
                </div>
                <div>
                  <Label htmlFor="delivery-date" className="text-sm sm:text-base">Expected Delivery Date</Label>
                  <Input
                    id="delivery-date"
                    type="date"
                    className="mt-2 text-sm sm:text-base"
                    data-testid="input-delivery-date"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="additional" className="text-sm sm:text-base">Additional Requirements</Label>
                <Textarea
                  id="additional"
                  placeholder="Certifications needed, special packaging, delivery terms, etc."
                  rows={3}
                  className="mt-2 text-sm sm:text-base"
                  data-testid="textarea-additional"
                />
              </div>

              <div className="border-t pt-4 sm:pt-6">
                <h3 className="font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Your Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="contact-name" className="text-sm sm:text-base">Full Name *</Label>
                    <Input
                      id="contact-name"
                      placeholder="John Doe"
                      className="mt-2 text-sm sm:text-base"
                      data-testid="input-contact-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-email" className="text-sm sm:text-base">Email *</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="john@company.com"
                      className="mt-2 text-sm sm:text-base"
                      data-testid="input-contact-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-phone" className="text-sm sm:text-base">Phone Number</Label>
                    <Input
                      id="contact-phone"
                      placeholder="+1 234 567 8900"
                      className="mt-2 text-sm sm:text-base"
                      data-testid="input-contact-phone"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company" className="text-sm sm:text-base">Company Name</Label>
                    <Input
                      id="company"
                      placeholder="Your Company Ltd."
                      className="mt-2 text-sm sm:text-base"
                      data-testid="input-company"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t">
                <Button size="lg" className="flex-1 text-sm sm:text-base" data-testid="button-post-rfq">
                  Post RFQ
                </Button>
                <Button size="lg" variant="outline" className="flex-1 text-sm sm:text-base" data-testid="button-save-draft">
                  Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
