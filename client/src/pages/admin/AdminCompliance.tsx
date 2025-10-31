import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComplianceAudit } from '@/components/admin/ComplianceAudit';
import { ComplianceReporting } from '@/components/admin/ComplianceReporting';
import { DataRetention } from '@/components/admin/DataRetention';
import { ComplianceViolation } from '@/components/admin/ComplianceViolation';
import { Shield, FileText, Database, AlertTriangle } from 'lucide-react';

export default function AdminCompliance() {
  const [activeTab, setActiveTab] = useState('audit');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Compliance Management</h1>
        <p className="text-gray-600">
          Comprehensive compliance and audit management system for regulatory requirements and data governance
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Audit Trail
          </TabsTrigger>
          <TabsTrigger value="violations" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Violations
          </TabsTrigger>
          <TabsTrigger value="reporting" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reporting
          </TabsTrigger>
          <TabsTrigger value="retention" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Retention
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          <ComplianceAudit />
        </TabsContent>

        <TabsContent value="violations">
          <ComplianceViolation />
        </TabsContent>

        <TabsContent value="reporting">
          <ComplianceReporting />
        </TabsContent>

        <TabsContent value="retention">
          <DataRetention />
        </TabsContent>
      </Tabs>
    </div>
  );
}