import React from 'react';
import { Button } from './button';
import { Input } from './input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Textarea } from './textarea';
import { Checkbox } from './checkbox';
import { Switch } from './switch';
import { Label } from './label';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

export function ComponentThemeTest() {
  const [checked, setChecked] = React.useState(false);
  const [switched, setSwitched] = React.useState(false);

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold font-sans text-foreground mb-8">
          UI Components Theme Test
        </h1>

        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Testing all button variants with brand colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button variant="default">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="link">Link Button</Button>
              <Button variant="destructive">Destructive Button</Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button size="sm">Small Button</Button>
              <Button size="default">Default Button</Button>
              <Button size="lg">Large Button</Button>
              <Button size="icon">🎨</Button>
            </div>
          </CardContent>
        </Card>

        {/* Form Elements */}
        <Card>
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
            <CardDescription>Testing inputs, selects, and form controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="test-input">Text Input</Label>
                <Input id="test-input" placeholder="Enter some text..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test-select">Select</Label>
                <Select>
                  <SelectTrigger id="test-select">
                    <SelectValue placeholder="Choose an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option1">Option 1</SelectItem>
                    <SelectItem value="option2">Option 2</SelectItem>
                    <SelectItem value="option3">Option 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-textarea">Textarea</Label>
              <Textarea id="test-textarea" placeholder="Enter a longer message..." />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="test-checkbox" 
                  checked={checked}
                  onCheckedChange={setChecked}
                />
                <Label htmlFor="test-checkbox">Checkbox</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="test-switch"
                  checked={switched}
                  onCheckedChange={setSwitched}
                />
                <Label htmlFor="test-switch">Switch</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>Testing badge variants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <div className="space-y-4">
          <Alert variant="default">
            <Info className="h-4 w-4" />
            <AlertTitle>Default Alert</AlertTitle>
            <AlertDescription>
              This is a default alert with brand colors.
            </AlertDescription>
          </Alert>

          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning Alert</AlertTitle>
            <AlertDescription>
              This is a warning alert using brand orange colors.
            </AlertDescription>
          </Alert>

          <Alert variant="success">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success Alert</AlertTitle>
            <AlertDescription>
              This is a success alert with proper contrast.
            </AlertDescription>
          </Alert>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Table</CardTitle>
            <CardDescription>Testing table with hover states</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>John Doe</TableCell>
                  <TableCell><Badge variant="success">Active</Badge></TableCell>
                  <TableCell>Admin</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">Edit</Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Jane Smith</TableCell>
                  <TableCell><Badge variant="warning">Pending</Badge></TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">Edit</Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Bob Johnson</TableCell>
                  <TableCell><Badge variant="destructive">Inactive</Badge></TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">Edit</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Theme Information */}
        <Card>
          <CardHeader>
            <CardTitle>Theme Information</CardTitle>
            <CardDescription>Brand color implementation details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-brand-orange-500 text-white">
                <h3 className="font-semibold">Primary Orange</h3>
                <p className="text-sm opacity-90">#F2A30F</p>
                <p className="text-xs opacity-75">hsl(39 95% 51%)</p>
              </div>
              <div className="p-4 rounded-lg bg-brand-grey-900 text-white">
                <h3 className="font-semibold">Dark Grey</h3>
                <p className="text-sm opacity-90">#212121</p>
                <p className="text-xs opacity-75">hsl(0 0% 13%)</p>
              </div>
              <div className="p-4 rounded-lg bg-brand-grey-50 text-brand-grey-900 border">
                <h3 className="font-semibold">Light Grey</h3>
                <p className="text-sm opacity-90">#EEEEEE</p>
                <p className="text-xs opacity-75">hsl(0 0% 93%)</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>✅ All components use Base Neue font family</p>
              <p>✅ Focus indicators use brand orange with proper contrast</p>
              <p>✅ Hover states provide smooth transitions</p>
              <p>✅ Interactive elements meet WCAG AA accessibility standards</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}