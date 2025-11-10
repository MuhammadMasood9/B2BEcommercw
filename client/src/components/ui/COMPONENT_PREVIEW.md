# Shared Components Visual Reference

## StatCard Component

```
┌─────────────────────────────────────────┐
│  Total Orders                    [📦]   │
│  156                    ↑ 8%            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Monthly Revenue  [New]          [💰]   │
│  $12,450                ↑ 12.5%         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Pending Orders  [Urgent]        [⏰]   │
│  18                                     │
└─────────────────────────────────────────┘
```

**Features:**
- Large, bold value display
- Icon with colored background (top right)
- Optional trend indicator with arrow and percentage
- Optional badge for highlighting
- Hover effect with shadow

---

## StatusBadge Component

```
Order Statuses:
[⏰ Pending]  [✓ Confirmed]  [📦 Processing]  [🚚 Shipped]  [✓ Delivered]  [✗ Cancelled]

Quotation Statuses:
[📄 Draft]  [💬 Sent]  [✓ Accepted]  [✗ Rejected]  [⚠ Expired]

Inquiry Statuses:
[⚠ New]  [💬 Replied]  [📄 Quoted]  [✓ Closed]

Product Statuses:
[✓ Active]  [✗ Inactive]  [✗ Out of Stock]  [⚠ Low Stock]

Payment Statuses:
[💰 Paid]  [⚠ Unpaid]  [💰 Partially Paid]
```

**Features:**
- Automatic color coding based on status
- Icon automatically selected for common statuses
- Consistent styling across all status types
- Can hide icon or use custom icon
- Multiple variant styles available

---

## DataTable Component

```
┌────────────────────────────────────────────────────────────────────────┐
│  [🔍 Search products...]              [Status ▼]  [Category ▼]         │
├────────────────────────────────────────────────────────────────────────┤
│  Product Name ↕    Price ↕    Stock ↕    Status                        │
├────────────────────────────────────────────────────────────────────────┤
│  Product A         $29.99    100       [✓ Active]                      │
│  Product B         $49.99    50        [⚠ Low Stock]                   │
│  Product C         $19.99    0         [✗ Out of Stock]                │
│  Product D         $39.99    200       [✓ Active]                      │
│  Product E         $59.99    75        [✓ Active]                      │
├────────────────────────────────────────────────────────────────────────┤
│  Showing 1 to 5 of 50 results          [⏮] [◀] Page 1 of 10 [▶] [⏭]  │
└────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Search bar for filtering across all columns
- Multiple filter dropdowns
- Sortable columns (click header to sort)
- Sort indicators (arrows)
- Pagination controls
- Row click handler
- Custom cell rendering
- Empty state message
- Responsive design

---

## Component Hierarchy

```
StatCard
├── Card (shadcn/ui)
│   └── CardContent
│       ├── Title + Badge
│       ├── Value + Trend
│       └── Icon (colored background)

StatusBadge
├── div (with variants)
│   ├── Icon (optional)
│   └── Text

DataTable
├── Search Input
├── Filter Selects
├── Table (shadcn/ui)
│   ├── TableHeader
│   │   └── Sortable Headers
│   └── TableBody
│       └── Rows with Custom Cells
└── Pagination Controls
```

---

## Color Schemes

### StatCard Icon Colors
- **Blue**: `text-blue-600 bg-blue-50` - General metrics
- **Green**: `text-green-600 bg-green-50` - Positive metrics, revenue
- **Orange**: `text-orange-600 bg-orange-50` - Warnings, pending items
- **Purple**: `text-purple-600 bg-purple-50` - Special features
- **Red**: `text-red-600 bg-red-50` - Errors, critical items
- **Yellow**: `text-yellow-600 bg-yellow-50` - Alerts, attention needed

### StatusBadge Colors
- **Green**: Success, active, delivered, accepted, paid
- **Blue**: Info, confirmed, sent, new
- **Yellow**: Pending, warning
- **Orange**: Expired, low stock, partially paid
- **Red**: Error, cancelled, rejected, out of stock, unpaid
- **Purple**: Processing, replied
- **Gray**: Inactive, draft, closed

---

## Responsive Behavior

### StatCard
- **Desktop**: Full width with icon on right
- **Tablet**: Stacked layout if needed
- **Mobile**: Full width, maintains icon position

### StatusBadge
- **All Sizes**: Compact, inline display
- Text wraps if necessary
- Icon scales appropriately

### DataTable
- **Desktop**: Full table with all features
- **Tablet**: Horizontal scroll for wide tables
- **Mobile**: 
  - Search and filters stack vertically
  - Table scrolls horizontally
  - Pagination controls adapt to smaller space
  - Consider card view for better mobile UX (future enhancement)

---

## Integration Example

```tsx
// Supplier Orders Page
<div className="space-y-6">
  {/* Metrics Overview */}
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
    columns={[
      {
        id: "orderNumber",
        header: "Order #",
        accessorKey: "orderNumber",
        sortable: true,
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      // ... more columns
    ]}
    filters={[
      {
        id: "status",
        label: "Status",
        options: [
          { label: "Pending", value: "pending" },
          { label: "Shipped", value: "shipped" },
          // ... more options
        ],
      },
    ]}
    searchable
    pagination
    pageSize={10}
    onRowClick={(order) => navigate(`/supplier/orders/${order.id}`)}
  />
</div>
```

---

## Accessibility Features

### StatCard
- Semantic HTML structure
- Proper heading hierarchy
- Color is not the only indicator (icons + text)
- Sufficient color contrast

### StatusBadge
- ARIA labels for status
- Icon + text for redundancy
- High contrast colors
- Screen reader friendly

### DataTable
- Keyboard navigation (Tab, Enter)
- Sortable headers with keyboard support
- ARIA labels for pagination controls
- Focus indicators
- Screen reader announcements for sorting

---

## Performance Considerations

### StatCard
- Lightweight component
- No complex state management
- Fast render time

### StatusBadge
- Minimal re-renders
- Simple conditional styling
- No external API calls

### DataTable
- Memoized filtering and sorting
- Efficient pagination (only renders visible rows)
- Debounced search (recommended for large datasets)
- Virtual scrolling (future enhancement for 1000+ rows)

---

## Browser Support

All components support:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

No IE11 support (uses modern CSS features like Grid, Flexbox, CSS Variables)
