# B2B Marketplace Design Guidelines

## Design Approach: Reference-Based (Alibaba.com Inspired)

**Rationale**: B2B marketplace requiring professional trust signals, information density, and efficient transaction flows. Alibaba.com serves as primary design reference for proven B2B UX patterns.

**Core Principles**:
- Professional trustworthiness over creative flair
- Information clarity and hierarchy
- Action-oriented layouts with clear CTAs
- Verification and credibility indicators throughout
- Efficient multi-step workflows

---

## Color Palette

### Light Mode (Primary)
- **Primary Brand**: 251 89% 48% (vibrant orange-red, trust and energy)
- **Primary Hover**: 251 89% 42%
- **Secondary**: 220 13% 20% (dark slate for text)
- **Accent**: 142 76% 36% (green for verification badges, success states)
- **Background**: 0 0% 100% (pure white)
- **Surface**: 220 13% 97% (light gray for cards)
- **Border**: 220 13% 85%
- **Muted Text**: 220 9% 46%

### Dark Mode
- **Primary**: 251 89% 58%
- **Background**: 222 47% 11%
- **Surface**: 217 33% 17%
- **Border**: 217 33% 25%
- **Text**: 210 20% 98%

---

## Typography

**Font Families**:
- Primary: 'Inter', system-ui, sans-serif (clean, professional)
- Data/Numbers: 'DM Sans', sans-serif (clarity for pricing)

**Scale**:
- Hero Headline: text-5xl md:text-6xl font-bold (48px-60px)
- Section Headline: text-3xl md:text-4xl font-bold (30px-36px)
- Page Title: text-2xl md:text-3xl font-semibold (24px-30px)
- Card Title: text-lg font-semibold (18px)
- Body: text-base (16px)
- Small/Meta: text-sm (14px)
- Micro: text-xs (12px)

**Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

---

## Layout System

**Container Strategy**:
- Max-width: max-w-7xl (1280px) for main content
- Product grids: max-w-screen-2xl (1536px)
- Padding: px-4 md:px-6 lg:px-8

**Spacing Units** (Tailwind):
- Micro spacing: 2, 3, 4 (8px, 12px, 16px)
- Component spacing: 6, 8 (24px, 32px)
- Section spacing: 12, 16, 20 (48px, 64px, 80px)
- Large gaps: 24, 32 (96px, 128px)

**Grid Systems**:
- Category cards: grid-cols-2 md:grid-cols-4 lg:grid-cols-6
- Product cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Feature sections: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Gap: gap-4 md:gap-6

---

## Component Library

### Navigation Header
- Dual-level: Top utility bar (language, currency, sign in) + Main nav
- Sticky on scroll with subtle shadow
- Search bar: Prominent with three-field design (keyword, category, button)
- Height: h-16 utility bar + h-20 main nav
- Background: white with border-b

### Product Cards (B2B Specific)
- Image: aspect-square, hover zoom effect
- Badge overlay: "Verified Supplier", "Trade Assurance" (top-right)
- Price display: Prominent with "/piece" unit, MOQ below
- Supplier meta: Flag icon + name + response rate
- Dual CTAs: "Contact Supplier" (outline) + "Request Quote" (primary)
- Border: border with hover:shadow-lg transition

### Buttons
- Primary: bg-primary text-white, rounded-md, px-6 py-3
- Secondary/Outline: border-2 border-primary text-primary
- Ghost: text-primary hover:bg-primary/10
- Icon buttons: p-2 rounded-full for utility actions
- Sizes: sm (py-2 px-4), default (py-3 px-6), lg (py-4 px-8)

### Input Fields
- Height: h-12 for text inputs
- Border: border-2 focus:border-primary
- Rounded: rounded-md
- Labels: text-sm font-medium mb-2
- Helper text: text-xs text-muted-foreground

### Badges & Tags
- Verification: bg-accent/10 text-accent border border-accent/20
- Status: Colored backgrounds with matching text
- Size: px-3 py-1 text-xs font-medium rounded-full
- Icons: Include checkmark/shield icons for trust signals

### Data Tables
- Striped rows: even:bg-gray-50
- Borders: border-b on rows
- Headers: bg-gray-100 font-semibold sticky top-0
- Mobile: Stack to cards on small screens

### Supplier Profile Headers
- Cover banner: aspect-[4/1], gradient overlay
- Logo: -mt-16 relative, border-4 border-white, rounded-lg
- Stats bar: grid-cols-5, border-y, py-4
- Action buttons: Absolute top-right on banner

### RFQ Cards
- Compact design with clear hierarchy
- Time remaining: Prominent countdown badge
- Quotation count: Social proof indicator
- Price target: If specified, highlighted
- CTA: Full-width "Send Quotation" button

---

## Images

### Hero Section
- **Full-width banner image**: Professional B2B imagery (warehouse, shipping containers, business handshake, global trade visualization)
- Overlay: Dark gradient (from black/60% to black/20%) for text readability
- Height: min-h-[500px] md:min-h-[600px]

### Product Images
- **Aspect ratio**: Square (1:1) for consistency in grids
- Hover state: Subtle zoom (scale-105)
- Placeholder: Use https://placehold.co/400x400 with product category text

### Supplier/Factory Images
- **Factory tour galleries**: Grid layout with lightbox functionality
- **Certification images**: Display as thumbnails, clickable for full-size view
- **Banner images**: aspect-[4/1] for company profile headers

### Category Icons
- Use Lucide React icon library
- Size: w-12 h-12 for featured categories
- Color: text-primary with bg-primary/10 background circle

### Trust & Verification
- Badge icons throughout (shield, checkmark, star)
- Consistent sizing: w-5 h-5 inline with text

---

## Page-Specific Guidelines

### Homepage
- Hero with three-field search, full-bleed background image
- Stats counter section: 4-column grid, large numbers
- Categories: 6-8 featured with icons, card-based layout
- Supplier spotlight: Carousel with 3-4 visible cards
- RFQ ticker: Horizontal auto-scroll of recent requests

### Product Listing
- Left sidebar filters: sticky, w-64, collapsible mobile
- Product grid: 4 columns desktop, 2 tablet, 1 mobile
- Sort bar: Flex justify-between with view toggles (grid/list)

### Product Detail
- Two-column: 60% gallery + 40% purchase panel (sticky)
- Tabs navigation: Sticky below images
- Related products: Horizontal scroll on mobile

### Dashboards
- Sidebar navigation: w-64, icons + labels
- Main content: Metrics cards + data tables
- Card metrics: Icon + number + label + trend indicator

---

## Animation & Interaction

**Minimal, purposeful animations**:
- Hover states: scale-105 for images, shadow-lg for cards
- Transitions: transition-all duration-200
- Loading states: Subtle pulse animations
- No page transitions or complex scroll animations
- Focus: Clear focus rings (ring-2 ring-primary)

---

## Accessibility & Responsive

- Mobile-first approach: All layouts stack gracefully
- Touch targets: Minimum 44px height for buttons
- Color contrast: WCAG AA compliant (4.5:1 text, 3:1 UI)
- Focus indicators: Always visible, never disabled
- Breakpoints: sm:640px, md:768px, lg:1024px, xl:1280px, 2xl:1536px