import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Download, 
  FileText, 
  BarChart3, 
  Users, 
  Package,
  Calendar,
  Loader2
} from "lucide-react";

interface ReportConfig {
  timeRange: string;
  reportType: string;
  format: string;
  sections: {
    overview: boolean;
    products: boolean;
    customers: boolean;
    sales: boolean;
    trends: boolean;
  };
}

export default function ReportGenerator() {
  const [config, setConfig] = useState<ReportConfig>({
    timeRange: '30d',
    reportType: 'comprehensive',
    format: 'pdf',
    sections: {
      overview: true,
      products: true,
      customers: true,
      sales: true,
      trends: true
    }
  });
  const [generating, setGenerating] = useState(false);

  const reportTypes = [
    { value: 'comprehensive', label: 'Comprehensive Report', description: 'All analytics data' },
    { value: 'sales', label: 'Sales Report', description: 'Revenue and order analytics' },
    { value: 'products', label: 'Product Performance', description: 'Product views and conversions' },
    { value: 'customers', label: 'Customer Analytics', description: 'Customer behavior and demographics' }
  ];

  const timeRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
    { value: 'custom', label: 'Custom range' }
  ];

  const formats = [
    { value: 'pdf', label: 'PDF Document', icon: FileText },
    { value: 'excel', label: 'Excel Spreadsheet', icon: BarChart3 },
    { value: 'csv', label: 'CSV Data', icon: FileText }
  ];

  const sections = [
    { key: 'overview', label: 'Overview & Summary', icon: BarChart3 },
    { key: 'products', label: 'Product Performance', icon: Package },
    { key: 'customers', label: 'Customer Analytics', icon: Users },
    { key: 'sales', label: 'Sales & Revenue', icon: BarChart3 },
    { key: 'trends', label: 'Trends & Forecasts', icon: Calendar }
  ];

  const updateSection = (key: keyof ReportConfig['sections'], value: boolean) => {
    setConfig(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [key]: value
      }
    }));
  };

  const generateReport = async () => {
    try {
      setGenerating(true);
      
      // Fetch analytics data based on configuration
      const response = await fetch(`/api/suppliers/analytics/overview?timeRange=${config.timeRange}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const data = await response.json();
      
      if (config.format === 'pdf') {
        await generatePDFReport(data.analytics);
      } else if (config.format === 'excel') {
        await generateExcelReport(data.analytics);
      } else if (config.format === 'csv') {
        await generateCSVReport(data.analytics);
      }
      
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const generatePDFReport = async (analytics: any) => {
    // In a real implementation, this would use a PDF library like jsPDF or call a backend service
    const reportData = {
      title: `Analytics Report - ${config.timeRange}`,
      generatedAt: new Date().toISOString(),
      timeRange: config.timeRange,
      reportType: config.reportType,
      sections: config.sections,
      data: analytics
    };
    
    // For now, download as JSON (in real implementation, would be PDF)
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
      type: 'application/json' 
    });
    
    downloadFile(blob, `analytics-report-${config.timeRange}.json`);
  };

  const generateExcelReport = async (analytics: any) => {
    // In a real implementation, this would use a library like SheetJS
    const csvContent = convertToCSV(analytics);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    downloadFile(blob, `analytics-report-${config.timeRange}.csv`);
  };

  const generateCSVReport = async (analytics: any) => {
    const csvContent = convertToCSV(analytics);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    downloadFile(blob, `analytics-report-${config.timeRange}.csv`);
  };

  const convertToCSV = (analytics: any) => {
    let csv = 'Metric,Value\n';
    
    if (config.sections.overview) {
      csv += `Total Products,${analytics.totalProducts}\n`;
      csv += `Total Views,${analytics.totalViews}\n`;
      csv += `Total Inquiries,${analytics.totalInquiries}\n`;
      csv += `Total Orders,${analytics.totalOrders}\n`;
      csv += `Total Revenue,${analytics.totalRevenue}\n`;
      csv += `Conversion Rate,${analytics.conversionRate}%\n`;
      csv += '\n';
    }
    
    if (config.sections.products && analytics.topPerformingProducts) {
      csv += 'Product Performance\n';
      csv += 'Product Name,Views,Inquiries,Orders,Revenue,Conversion Rate\n';
      analytics.topPerformingProducts.forEach((product: any) => {
        csv += `${product.name},${product.views},${product.inquiries},${product.orders},${product.revenue},${product.conversionRate}%\n`;
      });
      csv += '\n';
    }
    
    if (config.sections.customers && analytics.customerAnalytics) {
      csv += 'Customer Analytics\n';
      csv += `Total Customers,${analytics.customerAnalytics.totalCustomers}\n`;
      csv += `Repeat Customers,${analytics.customerAnalytics.repeatCustomers}\n`;
      csv += '\n';
    }
    
    return csv;
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Report Generator</h2>
        <p className="text-muted-foreground">Generate detailed analytics reports for your records</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Report Type */}
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={config.reportType} onValueChange={(value) => setConfig(prev => ({ ...prev, reportType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Range */}
            <div className="space-y-2">
              <Label>Time Range</Label>
              <Select value={config.timeRange} onValueChange={(value) => setConfig(prev => ({ ...prev, timeRange: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeRanges.map(range => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Format */}
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select value={config.format} onValueChange={(value) => setConfig(prev => ({ ...prev, format: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formats.map(format => {
                    const Icon = format.icon;
                    return (
                      <SelectItem key={format.value} value={format.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {format.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Report Sections */}
        <Card>
          <CardHeader>
            <CardTitle>Include Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sections.map(section => {
                const Icon = section.icon;
                return (
                  <div key={section.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={section.key}
                      checked={config.sections[section.key as keyof ReportConfig['sections']]}
                      onCheckedChange={(checked) => updateSection(section.key as keyof ReportConfig['sections'], checked as boolean)}
                    />
                    <Label htmlFor={section.key} className="flex items-center gap-2 cursor-pointer">
                      <Icon className="w-4 h-4" />
                      {section.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Button */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Ready to Generate Report</h3>
              <p className="text-sm text-muted-foreground">
                {config.reportType} report for {config.timeRange} in {config.format.toUpperCase()} format
              </p>
            </div>
            <Button onClick={generateReport} disabled={generating} size="lg">
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Monthly Summary</div>
                <div className="text-sm text-muted-foreground">Last 30 days overview</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Package className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Product Report</div>
                <div className="text-sm text-muted-foreground">Product performance data</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Users className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Customer Report</div>
                <div className="text-sm text-muted-foreground">Customer analytics</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}