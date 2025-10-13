import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Users,
  FileSpreadsheet,
  Database,
  Settings,
  Eye,
  Trash2,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import Breadcrumb from "@/components/Breadcrumb";

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

export default function AdminUserImportExport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<ImportResult | null>(null);
  const [exportFormat, setExportFormat] = useState("csv");
  const [exportFilters, setExportFilters] = useState({
    role: "all",
    status: "all",
    dateRange: "all"
  });
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Mock import data
  const [importData, setImportData] = useState([
    { email: "user1@example.com", firstName: "John", lastName: "Doe", role: "buyer", company: "Tech Corp" },
    { email: "user2@example.com", firstName: "Jane", lastName: "Smith", role: "supplier", company: "Manufacturing Inc" },
    { email: "user3@example.com", firstName: "Bob", lastName: "Johnson", role: "buyer", company: "Retail Co" },
  ]);

  const importMutation = useMutation({
    mutationFn: async (data: any[]) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        total: data.length,
        successful: Math.floor(data.length * 0.9),
        failed: Math.floor(data.length * 0.1),
        errors: ["user1@example.com: Email already exists", "user2@example.com: Invalid role"]
      };
    },
    onSuccess: (result) => {
      setImportResults(result);
      toast({ 
        title: "Import completed", 
        description: `${result.successful} users imported successfully, ${result.failed} failed` 
      });
    },
    onError: () => {
      toast({ title: "Import failed", description: "Failed to import users", variant: "destructive" });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (format: string) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return `users_export_${new Date().toISOString().split('T')[0]}.${format}`;
    },
    onSuccess: (filename) => {
      toast({ title: "Export completed", description: `File ${filename} downloaded successfully` });
    },
    onError: () => {
      toast({ title: "Export failed", description: "Failed to export users", variant: "destructive" });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Parse CSV file (mock)
      console.log("File selected:", file.name);
    }
  };

  const handleImport = () => {
    if (importData.length > 0) {
      importMutation.mutate(importData);
    }
  };

  const handleExport = () => {
    exportMutation.mutate(exportFormat);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb 
        items={[
          { label: "Users", href: "/admin/users" },
          { label: "Import/Export" }
        ]} 
      />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setLocation("/admin/users")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
          <div>
            <h1 className="text-3xl font-bold">User Import/Export</h1>
            <p className="text-muted-foreground mt-2">Bulk import and export user data</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import">Import Users</TabsTrigger>
          <TabsTrigger value="export">Export Users</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          {/* Import Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Import Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Required Fields</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• email (required)</li>
                    <li>• firstName (required)</li>
                    <li>• lastName (required)</li>
                    <li>• role (buyer/supplier/admin)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Optional Fields</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• companyName</li>
                    <li>• phone</li>
                    <li>• password (if not provided, random password will be generated)</li>
                  </ul>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Important Notes</h4>
                </div>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• File must be in CSV format</li>
                  <li>• First row should contain column headers</li>
                  <li>• Maximum file size: 10MB</li>
                  <li>• Duplicate emails will be skipped</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="file-upload">Select CSV File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="mt-2"
                  />
                </div>
                {selectedFile && (
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    <span className="text-sm">{selectedFile.name}</span>
                    <Badge variant="outline">Ready</Badge>
                  </div>
                )}
              </div>

              {/* Sample Data Preview */}
              <div className="space-y-4">
                <h4 className="font-medium">Sample Data Preview</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>First Name</TableHead>
                      <TableHead>Last Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Company</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importData.map((user, index) => (
                      <TableRow key={index}>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.firstName}</TableCell>
                        <TableCell>{user.lastName}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'supplier' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.company}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Import Progress */}
              {importMutation.isPending && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Importing users...</span>
                    <span className="text-sm text-muted-foreground">Please wait</span>
                  </div>
                  <Progress value={66} className="w-full" />
                </div>
              )}

              {/* Import Results */}
              {importResults && (
                <div className="space-y-4">
                  <h4 className="font-medium">Import Results</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Database className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-2xl font-bold">{importResults.total}</p>
                            <p className="text-sm text-muted-foreground">Total</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-2xl font-bold">{importResults.successful}</p>
                            <p className="text-sm text-muted-foreground">Successful</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-5 h-5 text-red-600" />
                          <div>
                            <p className="text-2xl font-bold">{importResults.failed}</p>
                            <p className="text-sm text-muted-foreground">Failed</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {importResults.errors.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-red-600">Errors</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {importResults.errors.map((error, index) => (
                            <li key={index} className="text-sm text-red-600">
                              • {error}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleImport} 
                  disabled={!selectedFile || importMutation.isPending}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {importMutation.isPending ? "Importing..." : "Import Users"}
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          {/* Export Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="export-format">Format</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="export-role">Role Filter</Label>
                  <Select value={exportFilters.role} onValueChange={(value) => setExportFilters({...exportFilters, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="buyer">Buyer</SelectItem>
                      <SelectItem value="supplier">Supplier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="export-status">Status Filter</Label>
                  <Select value={exportFilters.status} onValueChange={(value) => setExportFilters({...exportFilters, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                      <SelectItem value="verified">Verified Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Export Options</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Fields to Include</Label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">Basic Info (Name, Email, Role)</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">Company Information</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Activity Data</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Preferences</span>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <Select value={exportFilters.dateRange} onValueChange={(value) => setExportFilters({...exportFilters, dateRange: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="last30">Last 30 Days</SelectItem>
                        <SelectItem value="last90">Last 90 Days</SelectItem>
                        <SelectItem value="lastyear">Last Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleExport} 
                  disabled={exportMutation.isPending}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exportMutation.isPending ? "Exporting..." : "Export Users"}
                </Button>
                <Button variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Export History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Exports</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>2024-10-13</TableCell>
                    <TableCell>CSV</TableCell>
                    <TableCell>1,250</TableCell>
                    <TableCell>
                      <Badge variant="default">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2024-10-12</TableCell>
                    <TableCell>Excel</TableCell>
                    <TableCell>850</TableCell>
                    <TableCell>
                      <Badge variant="default">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
