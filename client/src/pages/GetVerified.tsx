import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CheckCircle, 
  Upload, 
  ShieldCheck, 
  Award, 
  Building2, 
  FileText,
  TrendingUp,
  Users,
  Globe,
  Clock,
  Loader2,
  ArrowRight,
  Star,
  BadgeCheck
} from "lucide-react";

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
  const [files, setFiles] = useState<File[]>([]);

  const submitVerificationMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const formDataToSend = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      files.forEach((file, index) => {
        formDataToSend.append(`file${index}`, file);
      });

      const response = await fetch('/api/verification/submit', {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to submit verification');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Verification request submitted successfully! We\'ll review it within 2-3 business days.');
      setFormData({
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
      setFiles([]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit verification');
    }
  });

  const benefits = [
    {
      icon: ShieldCheck,
      title: "Trust Badge",
      description: "Display verified badge on your profile and products",
      color: "from-green-100 to-green-200",
      iconColor: "text-green-600"
    },
    {
      icon: Award,
      title: "Higher Rankings",
      description: "Appear higher in search results and get more visibility",
      color: "from-primary to-orange-600",
      iconColor: "text-primary"
    },
    {
      icon: Building2,
      title: "More Inquiries",
      description: "Get up to 3x more buyer inquiries with verified status",
      color: "from-purple-100 to-purple-200",
      iconColor: "text-purple-600"
    },
    {
      icon: TrendingUp,
      title: "Increased Sales",
      description: "Verified admins see 5x higher conversion rates",
      color: "from-yellow-100 to-yellow-200",
      iconColor: "text-yellow-600"
    },
    {
      icon: Users,
      title: "Priority Support",
      description: "Get dedicated account management and support",
      color: "from-red-100 to-red-200",
      iconColor: "text-red-600"
    },
    {
      icon: Star,
      title: "Featured Listings",
      description: "Get featured placement in search and categories",
      color: "from-pink-100 to-pink-200",
      iconColor: "text-pink-600"
    }
  ];

  const stats = [
    { value: "10,000+", label: "Verified Admins", icon: BadgeCheck, color: "text-green-600" },
    { value: "98%", label: "Approval Rate", icon: CheckCircle, color: "text-primary" },
    { value: "2-3 Days", label: "Review Time", icon: Clock, color: "text-purple-600" },
    { value: "5x", label: "More Inquiries", icon: TrendingUp, color: "text-yellow-600" }
  ];

  const verificationSteps = [
    {
      step: "1",
      title: "Submit Application",
      description: "Fill out the form with your company details and upload required documents"
    },
    {
      step: "2",
      title: "Document Review",
      description: "Our team reviews your documents and verifies business authenticity"
    },
    {
      step: "3",
      title: "Background Check",
      description: "We conduct thorough background checks on your company"
    },
    {
      step: "4",
      title: "Get Verified",
      description: "Receive verification badge and enjoy premium benefits"
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitVerificationMutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      {/* Hero Section with Gradient */}
      <section className="relative py-20 bg-gradient-to-br from-primary via-primary to-orange-600 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-primary/20 to-orange-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-primary/20 to-orange-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/10 to-orange-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-sm text-white/95 shadow-lg mb-6">
              <BadgeCheck className="w-4 h-4 text-green-300" />
              <span>Get Verified Today</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Get
              <span className="bg-gradient-to-r from-primary via-white to-orange-600 bg-clip-text text-transparent block">
                Verified
              </span>
            </h1>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Join thousands of verified admins and unlock premium benefits for your business
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-300" />
                <span>Fast Approval</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield Check className="w-4 h-4 text-yellow-300" />
                <span>Verified Badge</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-300" />
                <span>More Visibility</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="bg-white border-gray-100 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color === 'text-green-600' ? 'from-green-100 to-green-200' : stat.color === 'text-primary' ? 'from-primary to-orange-600' : stat.color === 'text-purple-600' ? 'from-purple-100 to-purple-200' : 'from-yellow-100 to-yellow-200'} flex items-center justify-center mx-auto mb-4`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Benefits Section */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Get Verified?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Unlock powerful benefits that help grow your business and build trust with buyers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-8 h-8 ${benefit.iconColor}`} />
                      </div>
                      <h3 className="font-semibold text-lg mb-2 text-gray-900 group-hover:text-primary transition-colors">
                        {benefit.title}
                      </h3>
                      <p className="text-gray-600 text-sm">{benefit.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Verification Steps */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Verification Process
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Simple 4-step process to get your business verified
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {verificationSteps.map((step, index) => (
                <div key={index} className="relative">
                  {index < verificationSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary to-orange-600 -ml-2" />
                  )}
                  <Card className="relative z-10 bg-white border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                        {step.step}
                      </div>
                      <h3 className="font-semibold text-lg mb-2 text-gray-900">{step.title}</h3>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Application Form */}
          <div className="mb-16">
            <Card className="bg-white border-gray-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <FileText className="w-6 h-6 text-primary" />
                  Verification Application
                </CardTitle>
                <p className="text-gray-600">
                  Fill out the form below to start your verification process
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Company Information */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name *</Label>
                        <Input
                          id="companyName"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="businessType">Business Type *</Label>
                        <Select value={formData.businessType} onValueChange={(value) => setFormData({ ...formData, businessType: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manufacturer">Manufacturer</SelectItem>
                            <SelectItem value="trading">Trading Company</SelectItem>
                            <SelectItem value="distributor">Distributor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="registrationNumber">Registration Number *</Label>
                        <Input
                          id="registrationNumber"
                          value={formData.registrationNumber}
                          onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="yearEstablished">Year Established *</Label>
                        <Input
                          id="yearEstablished"
                          type="number"
                          value={formData.yearEstablished}
                          onChange={(e) => setFormData({ ...formData, yearEstablished: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="country">Country *</Label>
                        <Input
                          id="country"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Business Address *</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="contactPerson">Contact Person *</Label>
                        <Input
                          id="contactPerson"
                          value={formData.contactPerson}
                          onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Business Details */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Business Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          type="url"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="annualRevenue">Annual Revenue (USD)</Label>
                        <Input
                          id="annualRevenue"
                          value={formData.annualRevenue}
                          onChange={(e) => setFormData({ ...formData, annualRevenue: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employees">Number of Employees</Label>
                        <Input
                          id="employees"
                          type="number"
                          value={formData.employees}
                          onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mainProducts">Main Products/Services *</Label>
                      <Textarea
                        id="mainProducts"
                        value={formData.mainProducts}
                        onChange={(e) => setFormData({ ...formData, mainProducts: e.target.value })}
                        required
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="certifications">Certifications (if any)</Label>
                      <Textarea
                        id="certifications"
                        value={formData.certifications}
                        onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Document Upload */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Required Documents</h3>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm font-medium text-gray-900 mb-2">Upload Documents</p>
                      <p className="text-xs text-gray-500 mb-4">
                        Business License, Tax Certificate, ID Card (PDF, JPG, PNG up to 10MB each)
                      </p>
                      <Input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      {files.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-medium text-gray-900">Selected files:</p>
                          {files.map((file, index) => (
                            <p key={index} className="text-sm text-gray-600">
                              {file.name}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={submitVerificationMutation.isPending}
                      className="bg-primary hover:bg-primary text-white px-12 py-4 text-lg font-semibold"
                    >
                      {submitVerificationMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit Application
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}