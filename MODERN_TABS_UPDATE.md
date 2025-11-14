# Modern Tabs Update - Supplier Portal

## Overview
Updated all tabs across the supplier portal to use a modern, branded design with the website's orange color scheme.

## New Tab Design Features

### Visual Improvements
1. **Modern Pill Style**: Tabs now have rounded corners and sit in a light gray container
2. **Brand Orange Active State**: Active tabs use the brand orange (#F2A30F) with white text
3. **Smooth Transitions**: All state changes have smooth animations
4. **Hover Effects**: Inactive tabs show a subtle gray background on hover
5. **Better Spacing**: Increased padding and height for better touch targets
6. **Focus States**: Accessible focus rings using brand orange

### Design Specifications

```tsx
// Container
className="inline-flex h-12 items-center justify-start rounded-lg bg-gray-100 p-1 w-full"

// Individual Tab
className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-brand-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-gray-200 data-[state=active]:hover:bg-brand-orange-600"
```

## Pages Updated

### 1. Supplier Dashboard (`SupplierDashboard.tsx`)
**Tabs**: Overview, Performance, Products, Analytics
- 4 main navigation tabs
- Full-width container
- Equal spacing between tabs

### 2. Supplier Quotations (`SupplierQuotations.tsx`)
**Tabs**: All, Pending, Accepted, Rejected, Expired
- 5 status filter tabs
- Shows count badges for each status
- Full-width container

### 3. Supplier Negotiations (`SupplierNegotiations.tsx`)
**Tabs**: All, Active, Accepted, Rejected
- 4 status filter tabs
- Shows count badges
- Full-width container

### 4. Supplier RFQs (`SupplierRFQs.tsx`)
**Tabs**: All, Open, Closed
- 3 status filter tabs
- Shows count badges
- Full-width container

### 5. Supplier Reviews (`SupplierReviews.tsx`)
**Tabs**: All Reviews
- Single tab (ready for expansion)
- Shows review count
- Compact container

## Color Palette Used

### Active State
- Background: `bg-brand-orange-500` (#F2A30F)
- Text: `text-white`
- Hover: `bg-brand-orange-600`
- Shadow: `shadow-sm`

### Inactive State
- Background: Transparent
- Text: Default (gray-700)
- Hover: `bg-gray-200`

### Container
- Background: `bg-gray-100`
- Padding: `p-1`
- Border Radius: `rounded-lg`

### Focus State
- Ring: `ring-brand-orange-500`
- Ring Width: `ring-2`
- Ring Offset: `ring-offset-2`

## Reusable Components Created

### ModernTabs Component
Location: `client/src/components/supplier/ModernTabs.tsx`

Three variants available:

1. **ModernTabs** (Default)
   - Pill-style tabs in gray container
   - Orange active state
   - Best for most use cases

2. **PillTabs**
   - Rounded pill container with border
   - White background
   - More compact design

3. **UnderlineTabs**
   - Underline-style tabs
   - Border-bottom indicator
   - Minimal design

### Usage Example

```tsx
import { ModernTabs } from "@/components/supplier/ModernTabs";

const tabs = [
  { value: "overview", label: "Overview" },
  { value: "analytics", label: "Analytics" },
];

<ModernTabs 
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
>
  <TabsContent value="overview">...</TabsContent>
  <TabsContent value="analytics">...</TabsContent>
</ModernTabs>
```

## Benefits

1. **Brand Consistency**: All tabs now use the brand orange color
2. **Modern Look**: Pill-style design is contemporary and clean
3. **Better UX**: Larger touch targets and clear active states
4. **Accessibility**: Proper focus states and ARIA attributes
5. **Smooth Animations**: Transitions make the interface feel polished
6. **Scalable**: Easy to add new tabs following the same pattern

## Before vs After

### Before
- Basic gray tabs
- Small, hard to click
- No hover states
- Inconsistent styling
- Poor visual hierarchy

### After
- Modern pill design
- Larger, easier to click
- Smooth hover effects
- Consistent brand colors
- Clear active state with orange background
- Professional appearance

## Next Steps

To apply this pattern to other pages:
1. Replace `<TabsList>` with the new styled version
2. Add the full className to each `<TabsTrigger>`
3. Or use the `ModernTabs` component for cleaner code

The tabs are now consistent, modern, and perfectly aligned with your brand identity!
