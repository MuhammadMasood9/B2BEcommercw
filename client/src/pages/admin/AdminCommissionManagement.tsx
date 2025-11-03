import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CommissionManagement from '@/components/admin/CommissionManagement';
import EnhancedCommissionDashboard from '@/components/admin/EnhancedCommissionDashboard';
import CommissionAdjustment from '@/components/admin/CommissionAdjustment';
import { Settings, BarChart3, Calculator } from 'lucide-react';

export default function AdminCommissionManagement() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Commission Management</h1>
        <p className="text-gray-600">
          Manage commission rates, track performance, and handle adjustments
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard & Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings & Rates
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Adjustments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <EnhancedCommissionDashboard />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <CommissionManagement />
        </TabsContent>

        <TabsContent value="adjustments" className="mt-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Commission Adjustments</h2>
              <p className="text-gray-600">
                Create commission adjustments for dispute resolutions, refunds, and corrections.
              </p>
            </div>
            
            {/* Example adjustment form - in real implementation, this would be triggered from dispute management */}
            <CommissionAdjustment
              orderId="example-order-id"
              disputeId="example-dispute-id"
              originalAmount={1000}
              originalCommission={50}
              onAdjustmentCreated={() => {
                // Refresh data or show success message
                console.log('Adjustment created successfully');
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}