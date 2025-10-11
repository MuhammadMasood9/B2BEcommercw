import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Upload, ShieldCheck, Award, Building2, FileText } from "lucide-react";

export default function GetVerified() {
  const [formData, setFormData] = useState({
    companyName: "",
    businessType: "",
    registrationNumber: "",
    yearEstablished: "",
    country: "",
    address: "",
    contactPerson: "",
    email: "",
    phone: "",
    website: "",
    annualRevenue: "",
    employees: "",
    mainProducts: "",
    certifications: ""
  });

  const benefits = [
    {
      icon: <ShieldCheck className="h-8 w-8" />,
      title: "Trust Badge",
      description: "Display verified badge on your profile and products"
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Higher Rankings",
      description: "Appear higher in search results and get more visibility"
    },
    {
      icon: <Building2 className="h-8 w-8" />,
      title: "More Inquiries",
      description: "Get up to 3x more buyer inquiries with verified status"
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Verification form submitted:", formData);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="gradient-blue text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Get Verified</h1>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto">
              Boost your credibility and attract more buyers with our supplier verification program
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-6 text-center glass-card hover:shadow-lg transition-shadow">
                <div className="gradient-blue text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{benefit.description}</p>
              </Card>
            ))}
          </div>

          <Card className="max-w-4xl mx-auto p-8 glass-card">
            <h2 className="text-2xl font-bold mb-6">Verification Application</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                    data-testid="input-company-name"
                  />
                </div>
                <div>
                  <Label htmlFor="businessType">Business Type *</Label>
                  <Select
                    value={formData.businessType}
                    onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                  >
                    <SelectTrigger data-testid="select-business-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manufacturer">Manufacturer</SelectItem>
                      <SelectItem value="trading">Trading Company</SelectItem>
                      <SelectItem value="wholesaler">Wholesaler</SelectItem>
                      <SelectItem value="distributor">Distributor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="registrationNumber">Business Registration Number *</Label>
                  <Input
                    id="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    required
                    data-testid="input-registration-number"
                  />
                </div>
                <div>
                  <Label htmlFor="yearEstablished">Year Established *</Label>
                  <Input
                    id="yearEstablished"
                    type="number"
                    value={formData.yearEstablished}
                    onChange={(e) => setFormData({ ...formData, yearEstablished: e.target.value })}
                    required
                    data-testid="input-year-established"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    required
                    data-testid="input-country"
                  />
                </div>
                <div>
                  <Label htmlFor="employees">Number of Employees *</Label>
                  <Select
                    value={formData.employees}
                    onValueChange={(value) => setFormData({ ...formData, employees: value })}
                  >
                    <SelectTrigger data-testid="select-employees">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-50">1-50</SelectItem>
                      <SelectItem value="51-200">51-200</SelectItem>
                      <SelectItem value="201-500">201-500</SelectItem>
                      <SelectItem value="501-1000">501-1000</SelectItem>
                      <SelectItem value="1000+">1000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="address">Business Address *</Label>
                <Textarea
                  id="address"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  data-testid="textarea-address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    required
                    data-testid="input-contact-person"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    data-testid="input-phone"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="mainProducts">Main Products *</Label>
                <Textarea
                  id="mainProducts"
                  rows={3}
                  placeholder="Describe your main products and services"
                  value={formData.mainProducts}
                  onChange={(e) => setFormData({ ...formData, mainProducts: e.target.value })}
                  required
                  data-testid="textarea-main-products"
                />
              </div>

              <div>
                <Label htmlFor="certifications">Certifications (Optional)</Label>
                <Textarea
                  id="certifications"
                  rows={2}
                  placeholder="List any certifications (ISO, CE, FDA, etc.)"
                  value={formData.certifications}
                  onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                  data-testid="textarea-certifications"
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Required Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm font-medium mb-1">Business License</p>
                    <Button variant="outline" size="sm" data-testid="button-upload-license">Upload File</Button>
                  </div>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm font-medium mb-1">Company Registration</p>
                    <Button variant="outline" size="sm" data-testid="button-upload-registration">Upload File</Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" size="lg" className="flex-1 gradient-blue text-white" data-testid="button-submit-verification">
                  <FileText className="h-5 w-5 mr-2" />
                  Submit Application
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
