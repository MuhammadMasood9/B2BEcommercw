# Shared Components Usage Examples

This document provides examples of how to use the shared UI components created for the supplier dashboard.

## StatCard Component

The `StatCard` component displays a metric with an icon, optional trend indicator, and badge.

### Basic Usage

```tsx
import { StatCard } from "@/components/ui/stat-card";
import { Package } from "lucide-react";

<StatCard
  title="Total Products"
  value={245}
  icon={Package}
  color="blue"
/>
```

### With Trend Indicator

```tsx
<StatCard
  title="Monthly Revenue"
  value="$12,450"
  icon={DollarSign}
  color="green"
  trend={{
    value: 12.5,
    direction: "up"
  }}
/>
```

### With Badge

```tsx
<StatCard
  title="Pending Orders"
  value={18}
  icon={ShoppingCart}
  color="orange"
  badge="Urgent"
/>
```

### Available Colors

- `blue` - Blue icon background
- `green` - Green icon background
- `orange` - Orange icon background
- `purple` - Purple icon background
- `red` - Red icon background
- `yellow` - Yellow icon background

## StatusBadge Component

The `StatusBadge` component displays status information with color coding and optional icons.

### Basic Usage with Status

```tsx
import { StatusBadge } from "@/components/ui/status-badge";

// Automatically styled based on status
<StatusBadge status="pending" />
<StatusBadge status="confirmed" />
<StatusBadge status="shipped" />
<StatusBadge status="delivered" />
```

### With Custom Variant

```tsx
<StatusBadge variant="success">Completed</StatusBadge>
<StatusBadge variant="warning">Attention Required</StatusBadge>
<StatusBadge variant="error">Failed</StatusBadge>
```

### With Custom Icon

```tsx
import { Star } from "lucide-react";

<StatusBadge icon={Star} variant="success">
  Featured
</StatusBadge>
```

### Without Icon

```tsx
<StatusBadge status="active" showIcon={false} />
```

### Supported Status Values

**Order Statuses:**
- `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`

**Quotation Statuses:**
- `draft`, `sent`, `accepted`, `rejected`, `expired`

**Inquiry Statuses:**
- `new`, `replied`, `quoted`, `closed`

**Product Statuses:**
- `active`, `inactive`, `out-of-stock`, `low-stock`

**Approval Statuses:**
- `approved`, `pending-approval`

**Payment Statuses:**
- `paid`, `unpaid`, `partially-paid`

## DataTable Component

The `DataTable` component provides a feature-rich table with sorting, filtering, search, and pagination.

### Basic Usage

```tsx
import { DataTable, ColumnDef } from "@/components/ui/data-table";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: string;
}

const columns: ColumnDef<Product>[] = [
  {
    id: "name",
    header: "Product Name",
    accessorKey: "name",
    sortable: true,
  },
  {
    id: "price",
    header: "Price",
    accessorKey: "price",
    sortable: true,
    cell: (row) => `$${row.price.toFixed(2)}`,
  },
  {
    id: "stock",
    header: "Stock",
    accessorKey: "stock",
    sortable: true,
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    cell: (row) => <StatusBadge status={row.status} />,
  },
];

const products: Product[] = [
  { id: "1", name: "Product A", price: 29.99, stock: 100, status: "active" },
  { id: "2", name: "Product B", price: 49.99, stock: 50, status: "low-stock" },
  // ... more products
];

<DataTable
  data={products}
  columns={columns}
  searchable
  pagination
  pageSize={10}
/>
```

### With Filters

```tsx
import { FilterConfig } from "@/components/ui/data-table";

const filters: FilterConfig[] = [
  {
    id: "status",
    label: "Status",
    options: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
      { label: "Low Stock", value: "low-stock" },
    ],
  },
];

<DataTable
  data={products}
  columns={columns}
  filters={filters}
  searchable
  searchPlaceholder="Search products..."
  pagination
/>
```

### With Row Click Handler

```tsx
const handleRowClick = (product: Product) => {
  console.log("Clicked product:", product);
  // Navigate to product detail or open modal
};

<DataTable
  data={products}
  columns={columns}
  onRowClick={handleRowClick}
  searchable
  pagination
/>
```

### Custom Cell Rendering

```tsx
const columns: ColumnDef<Product>[] = [
  {
    id: "name",
    header: "Product",
    accessorKey: "name",
    cell: (row) => (
      <div className="flex items-center gap-2">
        <img src={row.image} alt={row.name} className="h-8 w-8 rounded" />
        <span className="font-medium">{row.name}</span>
      </div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: (row) => (
      <div className="flex gap-2">
        <Button size="sm" variant="outline">Edit</Button>
        <Button size="sm" variant="destructive">Delete</Button>
      </div>
    ),
  },
];
```

### Using accessorFn for Complex Data

```tsx
const columns: ColumnDef<Order>[] = [
  {
    id: "buyerName",
    header: "Buyer",
    accessorFn: (row) => row.buyer.name,
    sortable: true,
  },
  {
    id: "totalAmount",
    header: "Total",
    accessorFn: (row) => row.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    sortable: true,
    cell: (row) => {
      const total = row.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      return `$${total.toFixed(2)}`;
    },
  },
];
```

### Without Pagination

```tsx
<DataTable
  data={products}
  columns={columns}
  pagination={false}
/>
```

### Custom Empty Message

```tsx
<DataTable
  data={products}
  columns={columns}
  emptyMessage="No products found. Add your first product to get started."
/>
```

## Complete Example: Supplier Orders Page

```tsx
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, ColumnDef, FilterConfig } from "@/components/ui/data-table";
import { Package, DollarSign, Clock, CheckCircle } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  buyer: string;
  total: number;
  status: string;
  date: string;
}

export function SupplierOrdersPage() {
  const orders: Order[] = [
    // ... order data
  ];

  const columns: ColumnDef<Order>[] = [
    {
      id: "orderNumber",
      header: "Order #",
      accessorKey: "orderNumber",
      sortable: true,
    },
    {
      id: "buyer",
      header: "Buyer",
      accessorKey: "buyer",
      sortable: true,
    },
    {
      id: "total",
      header: "Total",
      accessorKey: "total",
      sortable: true,
      cell: (row) => `$${row.total.toFixed(2)}`,
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "date",
      header: "Date",
      accessorKey: "date",
      sortable: true,
    },
  ];

  const filters: FilterConfig[] = [
    {
      id: "status",
      label: "Status",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Processing", value: "processing" },
        { label: "Shipped", value: "shipped" },
        { label: "Delivered", value: "delivered" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={156}
          icon={Package}
          color="blue"
          trend={{ value: 8, direction: "up" }}
        />
        <StatCard
          title="Revenue"
          value="$45,230"
          icon={DollarSign}
          color="green"
          trend={{ value: 12, direction: "up" }}
        />
        <StatCard
          title="Pending"
          value={23}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Completed"
          value={133}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Orders Table */}
      <DataTable
        data={orders}
        columns={columns}
        filters={filters}
        searchable
        searchPlaceholder="Search orders..."
        pagination
        pageSize={10}
        onRowClick={(order) => console.log("View order:", order)}
      />
    </div>
  );
}
```

## Tips

1. **StatCard Colors**: Choose colors that match the semantic meaning of the metric (green for positive, red for negative, blue for neutral).

2. **StatusBadge**: Use the predefined status values when possible for consistent styling across the application.

3. **DataTable Sorting**: Only enable sorting on columns where it makes sense (numbers, dates, text).

4. **DataTable Performance**: For large datasets (>1000 rows), consider implementing server-side pagination and filtering.

5. **Accessibility**: All components include proper ARIA labels and keyboard navigation support.
