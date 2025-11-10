# SupplierLayout Component Usage Guide

## Overview
The `SupplierLayout` component provides a consistent layout wrapper for all supplier pages with:
- Top navigation bar with sidebar toggle, notifications, and user profile
- Responsive padding and spacing
- Consistent styling across all supplier pages

## Basic Usage

```tsx
import { SupplierLayout } from "@/components/SupplierLayout";

export default function SupplierProducts() {
  return (
    <SupplierLayout title="Products">
      <div>
        {/* Your page content here */}
        <h1>My Products</h1>
        {/* ... */}
      </div>
    </SupplierLayout>
  );
}
```

## Props

### SupplierLayout
- `children` (required): React.ReactNode - The page content
- `title` (optional): string - Page title shown in top nav (default: "Supplier Portal")
- `className` (optional): string - Additional CSS classes for the main content area
- `notificationCount` (optional): number - Number of unread notifications (default: 0)

### SupplierTopNav
- `title` (optional): string - Portal title (default: "Supplier Portal")
- `notificationCount` (optional): number - Badge count for notifications (default: 0)

## Features

### Top Navigation Bar
- **Sidebar Toggle**: Mobile-responsive button to show/hide sidebar
- **Portal Title**: Displays the current page or section name
- **Notification Bell**: Dropdown with notification count badge
- **User Profile Dropdown**: Shows user info with quick access to:
  - Profile
  - Store Settings
  - Settings
  - Logout

### Responsive Design
- **Mobile (< 640px)**: Sidebar toggle button visible, compact layout
- **Tablet (640px - 1024px)**: Optimized spacing
- **Desktop (> 1024px)**: Full layout with all features

### Content Area
- Consistent padding: 4 (mobile), 6 (tablet), 8 (desktop)
- Max width: 7xl (1280px) centered
- Background: gray-50 (light mode), gray-950 (dark mode)
- Full height with scroll overflow

## Example: Complete Page

```tsx
import { SupplierLayout } from "@/components/SupplierLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function SupplierProducts() {
  const notificationCount = 5; // From your notification system

  return (
    <SupplierLayout 
      title="My Products" 
      notificationCount={notificationCount}
    >
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Page Content */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Product List</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Your product list here */}
          </CardContent>
        </Card>
      </div>
    </SupplierLayout>
  );
}
```

## Integration with App.tsx

The layout works seamlessly with the existing App.tsx structure:

```tsx
// In App.tsx - Supplier routes are already wrapped with SidebarProvider
if (isSupplierRoute) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <SupplierSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 overflow-auto">
            <SupplierRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
```

Each supplier page component should use `SupplierLayout` internally:

```tsx
// In SupplierProducts.tsx
export default function SupplierProducts() {
  return (
    <SupplierLayout title="Products">
      {/* Content */}
    </SupplierLayout>
  );
}
```

## Styling Customization

You can customize the content area styling:

```tsx
<SupplierLayout 
  title="Analytics"
  className="bg-white dark:bg-gray-900"
>
  {/* Content with custom background */}
</SupplierLayout>
```

## Notes

- The sidebar is managed by `SidebarProvider` in App.tsx
- The layout automatically handles responsive behavior
- Dark mode is supported through Tailwind's dark: prefix
- The component uses existing UI components from shadcn/ui
