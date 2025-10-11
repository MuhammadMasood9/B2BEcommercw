import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Building2,
  Search,
  Star,
  TrendingUp
} from "lucide-react";

export default function TradeShows() {
  //todo: remove mock functionality
  const upcomingShows = [
    {
      id: 1,
      name: "International Electronics & Technology Expo 2024",
      date: "March 15-18, 2024",
      location: "Las Vegas Convention Center, USA",
      category: "Electronics",
      exhibitors: "2,500+",
      visitors: "80,000+",
      featured: true,
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop"
    },
    {
      id: 2,
      name: "Global Fashion & Apparel Trade Fair",
      date: "April 10-13, 2024",
      location: "ExCeL London, UK",
      category: "Fashion",
      exhibitors: "1,800+",
      visitors: "65,000+",
      featured: true,
      image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=400&fit=crop"
    },
    {
      id: 3,
      name: "Industrial Machinery Summit",
      date: "May 5-8, 2024",
      location: "Messe Frankfurt, Germany",
      category: "Machinery",
      exhibitors: "3,200+",
      visitors: "120,000+",
      featured: false,
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=400&fit=crop"
    },
    {
      id: 4,
      name: "Asia Pacific Home & Living Expo",
      date: "June 20-23, 2024",
      location: "Singapore Expo, Singapore",
      category: "Home & Garden",
      exhibitors: "1,500+",
      visitors: "55,000+",
      featured: false,
      image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=400&fit=crop"
    },
    {
      id: 5,
      name: "Medical & Healthcare Innovation Conference",
      date: "July 8-11, 2024",
      location: "Shanghai International Expo Center, China",
      category: "Medical",
      exhibitors: "2,100+",
      visitors: "75,000+",
      featured: false,
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=400&fit=crop"
    },
    {
      id: 6,
      name: "Automotive Parts & Accessories Show",
      date: "August 15-18, 2024",
      location: "Dubai World Trade Centre, UAE",
      category: "Automotive",
      exhibitors: "1,900+",
      visitors: "60,000+",
      featured: false,
      image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=400&fit=crop"
    },
  ];

  const pastShows = [
    {
      id: 101,
      name: "Canton Fair 2023",
      date: "Oct 15-19, 2023",
      location: "Guangzhou, China",
      category: "Multi-industry",
      highlights: "25,000+ exhibitors, 200,000+ buyers from 200+ countries"
    },
    {
      id: 102,
      name: "CES 2024",
      date: "Jan 9-12, 2024",
      location: "Las Vegas, USA",
      category: "Technology",
      highlights: "4,000+ exhibitors, latest tech innovations showcased"
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-12 mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-10 h-10 text-primary" />
              <h1 className="text-4xl font-bold">Trade Shows & Events</h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6">
              Connect with suppliers and buyers at global trade shows
            </p>

            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search by event name, location, or industry..."
                className="pl-10 bg-background"
                data-testid="input-search-events"
              />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Featured Events</h2>
              <Button variant="outline" data-testid="button-view-calendar">
                <Calendar className="w-4 h-4 mr-2" />
                View Calendar
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {upcomingShows.filter(show => show.featured).map((show) => (
                <Card key={show.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`event-${show.id}`}>
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={show.image} 
                      alt={show.name}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-4 right-4 bg-primary gap-1">
                      <Star className="w-3 h-3" />
                      Featured
                    </Badge>
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-xl">{show.name}</CardTitle>
                      <Badge variant="outline">{show.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{show.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{show.location}</span>
                    </div>
                    <div className="flex gap-6 pt-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        <div>
                          <div className="font-semibold">{show.exhibitors}</div>
                          <div className="text-xs text-muted-foreground">Exhibitors</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <div>
                          <div className="font-semibold">{show.visitors}</div>
                          <div className="text-xs text-muted-foreground">Visitors</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button className="flex-1" data-testid={`button-register-${show.id}`}>Register Now</Button>
                      <Button variant="outline" className="flex-1" data-testid={`button-details-${show.id}`}>View Details</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Upcoming Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingShows.filter(show => !show.featured).map((show) => (
                <Card key={show.id} className="hover:shadow-lg transition-shadow" data-testid={`event-${show.id}`}>
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={show.image} 
                      alt={show.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2">{show.name}</CardTitle>
                      <Badge variant="outline" className="shrink-0">{show.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{show.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{show.location}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 text-sm">
                      <div>
                        <div className="font-semibold">{show.exhibitors}</div>
                        <div className="text-xs text-muted-foreground">Exhibitors</div>
                      </div>
                      <div>
                        <div className="font-semibold">{show.visitors}</div>
                        <div className="text-xs text-muted-foreground">Visitors</div>
                      </div>
                    </div>
                    <Button className="w-full" variant="outline" data-testid={`button-learn-more-${show.id}`}>
                      Learn More
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Past Events</h2>
            <div className="space-y-4">
              {pastShows.map((show) => (
                <Card key={show.id} data-testid={`past-event-${show.id}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <TrendingUp className="w-5 h-5 text-primary mt-1" />
                          <div>
                            <h3 className="font-semibold text-lg mb-1">{show.name}</h3>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {show.date}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {show.location}
                              </div>
                              <Badge variant="outline" className="text-xs">{show.category}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">{show.highlights}</p>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" data-testid={`button-view-recap-${show.id}`}>
                        View Recap
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
