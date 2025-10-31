import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Download, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Calculator, 
  Shield, 
  DollarSign,
  Users,
  Building,
  Globe,
  Clock,
  Eye,
  Send,
  Archive
} from "lucide-react";
import { format, startOfYear, endOfYear, startOfQuarter, endOfQuarter } from "date-fns";

interface TaxReportData {
  period: {
    start: Date;
    end: Date;
    quarter?: number;
    year: number;
  };
  summary: {
    totalRevenue: number;
    totalCommission: number;
    totalPayouts: number;
    taxableIncome: number;
    estimatedTax: number;
  };
  breakdown: {
    byMonth: MonthlyTaxData[];
    bySupplier: SupplierTaxData[];
    byCategory: CategoryTaxData[];
  };
  compliance: {
    form1099Required: boolean;
    form1099Count: number;
    internationalPayments: number;
    withholdingRequired: number;
  };
}

interface MonthlyTaxData {
  month: string;
  revenue: number;
  commission: number;
  payouts: number;
  taxableIncome: number;
}

interface SupplierTaxData {
  supplierId: string;
  supplierName: string;
  totalPayouts: number;
  taxableAmount: number;
  form1099Required: boolean;
  withholdingAmount: number;
}

interface CategoryTaxData {
  categoryId: string;
  categoryName: string;
  revenue: number;
  commission: number;
  taxRate: number;
}

interface TaxCompliance {
  year: number;
  compliance: {
    form1099Required: boolean;
    form1099Count: number;
    internationalPayments: number;
    withholdingRequired: number;
  };
  summary: {
    totalRevenue: number;
    totalCommission: number;
    totalPayouts: number;
    taxableIncome: number;
    estimatedTax: number;
  };
}

interface TaxDocument {
  id: string;
  type: '1099-NEC' | '1099-K' | 'W-9' | 'W-8BEN' | 'Tax Summary';
  supplierId?: string;
  supplierName?: string;
  year: number;
  quarter?: number;
  status: 'draft' | 'generated' | 'sent' | 'filed';
  amount?: number;
  generatedAt?: Date;
  sentAt?: Date;
  filedAt?: Date;
}

const TAX_YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
const QUARTERS = [1, 2, 3, 4];

export default function TaxManagement() {
  const [taxReportData, setTaxReportData] = useState<TaxReportData | null>(null);
  const [taxCompliance, setTaxCompliance] = useState<TaxCompliance | null>(null);
  const [taxDocuments, setTaxDocuments] = useState<TaxDocument[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dialog states
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showComplianceDialog, setShowComplianceDialog] = useState(false);
  const [documentType, setDocumentType] = useState<'1099-NEC' | '1099-K' | 'Tax Summary'>('1099-NEC');

  useEffect(() => {
    fetchTaxData();
    fetchTaxCompliance();
    fetchTaxDocuments();
  }, [selectedYear, selectedQuarter]);

  const fetchTaxData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/financial/tax-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: selectedYear,
          quarter: selectedQuarter
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTaxReportData(data);
      }
    } catch (error) {
      console.error('Error fetching tax data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTaxCompliance = async () => {
    try {
      const response = await fetch('/api/admin/financial/tax-compliance');
      if (response.ok) {
        const data = await response.json();
        setTaxCompliance(data);
      }
    } catch (error) {
      console.error('Error fetching tax compliance:', error);
    }
  };

  const fetchTaxDocuments = async () => {
    try {
      const params = new URLSearchParams();
      params.append('year', selectedYear.toString());
      if (selectedQuarter) {
        params.append('quarter', selectedQuarter.toString());
      }

      const response = await fetch(`/api/admin/financial/tax-documents?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTaxDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching tax documents:', error);
    }
  };

  const generateTaxDocument = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/admin/financial/tax-documents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: documentType,
          year: selectedYear,
          quarter: selectedQuarter
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${documentType} documents generated successfully!`);
        setShowGenerateDialog(false);
        fetchTaxDocuments();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error generating tax document:', error);
      alert('Failed to generate tax document');
    } finally {
      setGenerating(false);
    }
  };

  const downloadTaxDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/admin/financial/tax-documents/${documentId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `tax_document_${documentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading tax document:', error);
      alert('Failed to download tax document');
    }
  };

  const sendTaxDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/admin/financial/tax-documents/${documentId}/send`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Tax document sent successfully!');
        fetchTaxDocuments();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error sending tax document:', error);
      alert('Failed to send tax document');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getComplianceStatus = (compliance: TaxCompliance['compliance']) => {
    const issues = [];
    if (compliance.form1099Required && compliance.form1099Count === 0) {
      issues.push('1099 forms required but not generated');
    }
    if (compliance.internationalPayments > 0) {
      issues.push('International payments require additional documentation');
    }
    if (compliance.withholdingRequired > 0) {
      issues.push('Tax withholding required for some suppliers');
    }

    return {
      status: issues.length === 0 ? 'compliant' : 'attention-required',
      issues
    };
  };

  const getDocumentStatusBadge = (status: TaxDocument['status']) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: 'Draft' },
      generated: { variant: 'default' as const, label: 'Generated' },
      sent: { variant: 'default' as const, label: 'Sent' },
      filed: { variant: 'default' as const, label: 'Filed' },
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tax Management</h1>
          <p className="text-muted-foreground">Manage tax compliance and reporting</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
            <DialogTrigger asChild>
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Generate Tax Documents
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Tax Documents</DialogTitle>
                <DialogDescription>
                  Generate tax documents for the selected period
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="documentType">Document Type</Label>
                  <Select value={documentType} onValueChange={(value: any) => setDocumentType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1099-NEC">1099-NEC Forms</SelectItem>
                      <SelectItem value="1099-K">1099-K Forms</SelectItem>
                      <SelectItem value="Tax Summary">Tax Summary Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="year">Tax Year</Label>
                    <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TAX_YEARS.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="quarter">Quarter (Optional)</Label>
                    <Select value={selectedQuarter?.toString() || ''} onValueChange={(value) => setSelectedQuarter(value ? parseInt(value) : null)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Full Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Full Year</SelectItem>
                        {QUARTERS.map((quarter) => (
                          <SelectItem key={quarter} value={quarter.toString()}>
                            Q{quarter}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={generateTaxDocument} disabled={generating}>
                  {generating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Generate Documents
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button onClick={fetchTaxData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tax Period Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="taxYear">Tax Year</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAX_YEARS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="taxQuarter">Quarter (Optional)</Label>
              <Select value={selectedQuarter?.toString() || ''} onValueChange={(value) => setSelectedQuarter(value ? parseInt(value) : null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Full Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Full Year</SelectItem>
                  {QUARTERS.map((quarter) => (
                    <SelectItem key={quarter} value={quarter.toString()}>
                      Q{quarter} {selectedYear}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchTaxData} className="w-full">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Tax Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Status */}
      {taxCompliance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Tax Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const complianceStatus = getComplianceStatus(taxCompliance.compliance);
              return (
                <Alert className={complianceStatus.status === 'compliant' ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
                  {complianceStatus.status === 'compliant' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  <AlertDescription>
                    <div className="font-medium">
                      {complianceStatus.status === 'compliant' ? 'Tax Compliant' : 'Attention Required'}
                    </div>
                    {complianceStatus.issues.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {complianceStatus.issues.map((issue, index) => (
                          <li key={index} className="text-sm">• {issue}</li>
                        ))}
                      </ul>
                    )}
                  </AlertDescription>
                </Alert>
              );
            })()}
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{taxCompliance.compliance.form1099Count}</div>
                <div className="text-sm text-muted-foreground">1099 Forms Required</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{taxCompliance.compliance.internationalPayments}</div>
                <div className="text-sm text-muted-foreground">International Payments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatCurrency(taxCompliance.compliance.withholdingRequired)}</div>
                <div className="text-sm text-muted-foreground">Withholding Required</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatCurrency(taxCompliance.summary.estimatedTax)}</div>
                <div className="text-sm text-muted-foreground">Estimated Tax</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {taxReportData && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Breakdown</TabsTrigger>
            <TabsTrigger value="suppliers">Supplier Tax Data</TabsTrigger>
            <TabsTrigger value="documents">Tax Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Tax Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(taxReportData.summary.totalRevenue)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Gross platform revenue
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(taxReportData.summary.totalCommission)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Platform commission earned
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxable Income</CardTitle>
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(taxReportData.summary.taxableIncome)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Subject to taxation
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Estimated Tax</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(taxReportData.summary.estimatedTax)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Estimated tax liability
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Compliance Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Requirements</CardTitle>
                <CardDescription>
                  Tax compliance requirements for {selectedQuarter ? `Q${selectedQuarter} ` : ''}{selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Form 1099 Requirements</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>1099-NEC Required:</span>
                        <Badge variant={taxReportData.compliance.form1099Required ? 'default' : 'secondary'}>
                          {taxReportData.compliance.form1099Required ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Suppliers Requiring 1099:</span>
                        <span className="font-medium">{taxReportData.compliance.form1099Count}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Suppliers with payments ≥ $600 require 1099-NEC forms
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">International Compliance</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>International Payments:</span>
                        <span className="font-medium">{taxReportData.compliance.internationalPayments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Withholding Required:</span>
                        <span className="font-medium">{formatCurrency(taxReportData.compliance.withholdingRequired)}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        International suppliers may require W-8BEN forms and tax withholding
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Tax Breakdown</CardTitle>
                <CardDescription>
                  Monthly tax data for {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Payouts</TableHead>
                      <TableHead>Taxable Income</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxReportData.breakdown.byMonth.map((month) => (
                      <TableRow key={month.month}>
                        <TableCell className="font-medium">{month.month}</TableCell>
                        <TableCell>{formatCurrency(month.revenue)}</TableCell>
                        <TableCell>{formatCurrency(month.commission)}</TableCell>
                        <TableCell>{formatCurrency(month.payouts)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(month.taxableIncome)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Tax Information</CardTitle>
                <CardDescription>
                  Tax information and 1099 requirements by supplier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Total Payouts</TableHead>
                      <TableHead>Taxable Amount</TableHead>
                      <TableHead>1099 Required</TableHead>
                      <TableHead>Withholding</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxReportData.breakdown.bySupplier.map((supplier) => (
                      <TableRow key={supplier.supplierId}>
                        <TableCell className="font-medium">{supplier.supplierName}</TableCell>
                        <TableCell>{formatCurrency(supplier.totalPayouts)}</TableCell>
                        <TableCell>{formatCurrency(supplier.taxableAmount)}</TableCell>
                        <TableCell>
                          <Badge variant={supplier.form1099Required ? 'default' : 'secondary'}>
                            {supplier.form1099Required ? 'Required' : 'Not Required'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(supplier.withholdingAmount)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {supplier.form1099Required && (
                              <Button size="sm" variant="outline">
                                <FileText className="h-4 w-4 mr-2" />
                                Generate 1099
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tax Documents</CardTitle>
                <CardDescription>
                  Generated tax documents and forms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Generated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxDocuments.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell className="font-medium">{document.type}</TableCell>
                        <TableCell>{document.supplierName || '-'}</TableCell>
                        <TableCell>
                          {document.quarter ? `Q${document.quarter} ` : ''}{document.year}
                        </TableCell>
                        <TableCell>
                          {document.amount ? formatCurrency(document.amount) : '-'}
                        </TableCell>
                        <TableCell>{getDocumentStatusBadge(document.status)}</TableCell>
                        <TableCell>
                          {document.generatedAt ? format(new Date(document.generatedAt), 'MMM dd, yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadTaxDocument(document.id)}
                              disabled={document.status === 'draft'}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {document.status === 'generated' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => sendTaxDocument(document.id)}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {taxDocuments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No tax documents generated for this period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}