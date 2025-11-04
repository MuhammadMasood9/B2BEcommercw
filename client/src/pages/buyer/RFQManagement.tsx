import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'wouter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RFQDashboard from '@/components/buyer/RFQDashboard';

export default function RFQManagement() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'buyer') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <RFQDashboard />
        </div>
      </main>

      <Footer />
    </div>
  );
}