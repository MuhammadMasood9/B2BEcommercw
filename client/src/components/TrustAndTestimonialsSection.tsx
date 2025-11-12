import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Award, 
  Clock, 
  Users, 
  Star, 
  CheckCircle,
  Globe,
  Zap,
  Heart,
  Quote
} from "lucide-react";

export default function TrustAndTestimonialsSection() {
  const trustFeatures = [
    {
      icon: Shield,
      title: "Trade Assurance",
      description: "Your payments are protected until you confirm receipt of your order",
      color: "from-green-100 to-green-200",
      iconColor: "text-green-600"
    },
    {
      icon: Award,
      title: "Quality Guarantee",
      description: "Get refunds if products don't meet the quality standards described",
      color: "from-primary to-orange-600",
      iconColor: "text-primary"
    },
    {
      icon: Clock,
      title: "On-Time Delivery",
      description: "Receive compensation if your order doesn't arrive on time",
      color: "from-purple-100 to-purple-200",
      iconColor: "text-purple-600"
    }
  ];

  const certifications = [
    { name: "ISO 9001", description: "Quality Management" },
    { name: "ISO 14001", description: "Environmental Management" },
    { name: "OHSAS 18001", description: "Occupational Health & Safety" },
    { name: "CE Marking", description: "European Conformity" },
    { name: "FDA Approved", description: "Food & Drug Administration" },
    { name: "RoHS Compliant", description: "Restriction of Hazardous Substances" }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      company: "TechCorp Solutions",
      role: "Procurement Manager",
      country: "United States",
      rating: 5,
      text: "Bago has revolutionized our sourcing process. We've found reliable suppliers and reduced our procurement costs by 30%.",
      avatar: "SJ"
    },
    {
      name: "Michael Chen",
      company: "Manufacturing Plus",
      role: "Operations Director",
      country: "Canada",
      rating: 5,
      text: "The quality of suppliers and products on this platform is exceptional. Trade assurance gives us peace of mind.",
      avatar: "MC"
    },
    {
      name: "Emma Rodriguez",
      company: "Retail Innovations",
      role: "Supply Chain Manager",
      country: "United Kingdom",
      rating: 5,
      text: "Fast response times and verified suppliers make this our go-to platform for B2B sourcing. Highly recommended!",
      avatar: "ER"
    }
  ];

  const stats = [
    { number: "10M+", label: "Successful Transactions", icon: CheckCircle },
    { number: "99.8%", label: "Customer Satisfaction", icon: Star },
    { number: "24h", label: "Average Response Time", icon: Clock },
    { number: "190+", label: "Countries Served", icon: Globe }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-primary/30 to-purple-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-green-100/30 to-orange-600/30 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Features */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 rounded-full px-4 py-2 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            <span>Trusted & Secure</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            Trade with Confidence
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Our comprehensive protection ensures safe and secure transactions for all parties
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {trustFeatures.map((feature, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
              <CardContent className="p-8 text-center">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-primary to-purple-600 rounded-3xl p-8 mb-20 text-white">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">
              Trusted by Millions Worldwide
            </h3>
            <p className="text-primary text-lg">
              Join the world's largest B2B marketplace
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold mb-2">{stat.number}</div>
                <div className="text-primary text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Industry Certifications
          </h3>
          <p className="text-gray-600 text-lg mb-8">
            Our platform meets the highest international standards
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {certifications.map((cert, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white border-gray-100">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Award className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    {cert.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {cert.description}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h3>
          <p className="text-gray-600 text-lg">
            Real feedback from satisfied buyers worldwide
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-orange-600 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {testimonial.avatar}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role} at {testimonial.company}
                    </div>
                    <div className="text-xs text-gray-500">
                      {testimonial.country}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <div className="relative">
                  <Quote className="w-8 h-8 text-primary absolute -top-2 -left-2" />
                  <p className="text-gray-700 leading-relaxed pl-6">
                    {testimonial.text}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-primary to-purple-50 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Start Trading?
            </h3>
            <p className="text-gray-600 mb-6">
              Join millions of buyers and suppliers in the world's largest B2B marketplace
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary text-white px-8 py-3">
                Start Sourcing Now
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary px-8 py-3">
                Contact Admin
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
