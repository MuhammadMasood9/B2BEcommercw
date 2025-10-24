import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Building, MapPin, Edit, Save, Lock, X, Camera, Shield, Truck, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  avatarUrl: string;
  role: string;
  joinDate: string;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile>({
    id: 'user123',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    company: 'Acme Corporation',
    address: '123 Main Street, Anytown, USA 12345',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=JD',
    role: 'Buyer',
    joinDate: '2023-01-15'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // In a real application, you would send this data to your backend
    console.log('Saving profile:', editedProfile);
    setProfile(editedProfile);
    setIsEditing(false);
    toast({
      title: "Success",
      description: "Profile updated successfully!",
    });
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
    toast({
      title: "Info",
      description: "Profile editing cancelled.",
    });
  };

  const handleAvatarChange = () => {
    // In a real application, you would implement file upload
    toast({
      title: "Info",
      description: "Avatar upload feature coming soon!",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      {/* Hero Section with Gradient */}
      <section className="relative py-16 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-blue-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-600/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-sm text-white/95 shadow-lg mb-6">
              <User className="w-4 h-4" />
              <span>My Profile</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Manage Your
              <span className="bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent block">
                Profile
              </span>
            </h1>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Keep your account information up to date for better B2B experience
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-white/80 text-sm mt-8">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-300" />
                <span>Verified Account</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-yellow-300" />
                <span>Fast Shipping</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-300" />
                <span>Direct Communication</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Profile Information</CardTitle>
                  <p className="text-sm text-gray-500">Manage your account information</p>
                </div>
              </div>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="border-blue-200 hover:bg-blue-50">
                  <Edit className="h-4 w-4 mr-2" /> Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" /> Save Changes
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancel} className="border-gray-200 hover:bg-gray-50">
                    <X className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-4">
              {/* Avatar Section */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative">
                  <Avatar className="h-32 w-32 mb-4 border-4 border-blue-500 shadow-lg">
                    <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                    <AvatarFallback className="text-2xl font-bold">{profile.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="sm"
                      className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-600"
                      onClick={handleAvatarChange}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{profile.name}</h2>
                <p className="text-lg text-gray-600 mb-1">{profile.company}</p>
                <p className="text-sm text-gray-500">Member since {new Date(profile.joinDate).toLocaleDateString()}</p>
              </div>

              <Separator className="my-6" />

              {/* Profile Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="flex items-center gap-2 mb-2 text-gray-700 font-medium">
                    <User className="h-4 w-4 text-gray-500" /> Full Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={editedProfile.name}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className={isEditing ? 'border-blue-300 focus:border-blue-500' : 'bg-gray-50 border-gray-200'}
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="flex items-center gap-2 mb-2 text-gray-700 font-medium">
                    <Mail className="h-4 w-4 text-gray-500" /> Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={editedProfile.email}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className={isEditing ? 'border-blue-300 focus:border-blue-500' : 'bg-gray-50 border-gray-200'}
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2 mb-2 text-gray-700 font-medium">
                    <Phone className="h-4 w-4 text-gray-500" /> Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={editedProfile.phone}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className={isEditing ? 'border-blue-300 focus:border-blue-500' : 'bg-gray-50 border-gray-200'}
                  />
                </div>
                
                <div>
                  <Label htmlFor="company" className="flex items-center gap-2 mb-2 text-gray-700 font-medium">
                    <Building className="h-4 w-4 text-gray-500" /> Company
                  </Label>
                  <Input
                    id="company"
                    name="company"
                    value={editedProfile.company}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className={isEditing ? 'border-blue-300 focus:border-blue-500' : 'bg-gray-50 border-gray-200'}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="address" className="flex items-center gap-2 mb-2 text-gray-700 font-medium">
                    <MapPin className="h-4 w-4 text-gray-500" /> Address
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={editedProfile.address}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className={isEditing ? 'border-blue-300 focus:border-blue-500' : 'bg-gray-50 border-gray-200'}
                  />
                </div>
              </div>

              <Separator className="my-8" />

              {/* Account Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Account Security</h3>
                  <p className="text-sm text-gray-500">Manage your password and security settings</p>
                </div>
                <Button variant="secondary" className="flex items-center gap-2 border-gray-200 hover:bg-gray-50">
                  <Lock className="h-4 w-4" /> Change Password
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
