# Bago - B2B Marketplace Platform

## Overview

Bago is a comprehensive B2B (Business-to-Business) marketplace platform that connects suppliers and manufacturers with business buyers for bulk wholesale orders. Inspired by Alibaba.com's proven UX patterns, the platform focuses on professional trustworthiness, information density, and efficient transaction flows.

The application enables:
- Product browsing and search with B2B-specific filters
- Request for Quotation (RFQ) system for bulk orders
- Supplier verification and profile management
- Buyer-supplier communication and negotiation
- Trade assurance and buyer protection features
- Tiered pricing based on order quantities

## Recent Changes

### October 11, 2025 - Comprehensive Admin Panel Implementation
- **Complete Admin Panel**: Built full-featured admin interface with Shadcn sidebar navigation at `/admin` route
- **Product Management**: Full CRUD operations for products with search functionality and modal-based forms
- **Bulk CSV Upload**: Implemented bulk product upload system supporting CSV/Excel files with:
  - Multiple images per product (comma-separated URLs)
  - Row-level validation with granular error reporting
  - CSV format guide with downloadable template
  - Support for all product fields including pricing, inventory, dimensions, and metadata
- **Entity Management**: Created admin pages for Categories, Orders, Customers, and Suppliers with full CRUD
- **Analytics Dashboard**: Overview page displaying total products, orders, customers, suppliers, and revenue
- **Data Validation**: All API endpoints use Zod schema validation with `.partial()` for PATCH operations
- **Type-Safe Storage**: In-memory storage implementation ready for easy database migration
- **Comprehensive Schema**: Designed complete data models for all B2B ecommerce entities in `shared/schema.ts`

### October 9, 2025 - UI/UX Enhancement Update
- **Comprehensive UI Redesign**: Updated all major pages (Categories, Products, FindSuppliers, ReadyToShip, CategoryProducts) with modern, consistent design language
- **Enhanced Header**: Redesigned search bar with larger input, integrated category dropdown, visual separators, and improved focus states
- **Gradient Headers**: Implemented blue gradient page headers across all pages for visual consistency
- **Color-Coded Categories**: Added gradient-colored icons for each category with unique color schemes
- **Glass-Card Effects**: Modern card designs with hover effects and proper elevation states
- **Improved Filters**: Enhanced filter sidebars with better organization and clear visual hierarchy
- **Accessibility**: Added comprehensive data-testid attributes to all interactive elements for testing and automation
- **Responsive Design**: All pages optimized for mobile, tablet, and desktop viewing
- **Design Consistency**: Unified design system with consistent spacing, colors, and typography

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**Routing**: Wouter for lightweight client-side routing

**UI Component System**: 
- Shadcn/ui components (Radix UI primitives) for accessible, customizable UI elements
- Tailwind CSS for styling with custom design tokens
- Design system based on "New York" style variant
- Custom color palette with primary brand color (vibrant orange-red HSL: 251 89% 48%)

**State Management**: 
- React Query (@tanstack/react-query) for server state management
- React hooks for local component state
- Custom query client with credential-based authentication

**Form Handling**:
- React Hook Form for form state management
- Hookform resolvers for validation
- Zod for schema validation (integrated with Drizzle)

**Key Design Patterns**:
- Component composition with reusable UI primitives
- Page-level components in `/pages` directory
- Shared components in `/components` directory
- Professional B2B design language (trust signals, verification badges, information hierarchy)

### Backend Architecture

**Runtime**: Node.js with Express.js framework

**Language**: TypeScript with ESM modules

**API Structure**:
- RESTful API endpoints (prefix: `/api`)
- Routes defined in `server/routes.ts`
- Middleware for request logging and error handling
- Session-based authentication ready (connect-pg-simple for session store)

**Data Layer**:
- Storage abstraction pattern via IStorage interface
- Current implementation: In-memory storage (MemStorage class)
- Designed for easy migration to database-backed storage
- CRUD operations for users and business entities

**Development Setup**:
- Vite development server with HMR
- Custom middleware mode for SSR capability
- Runtime error overlay for debugging
- Replit-specific dev tooling integration

### Database Schema

**ORM**: Drizzle ORM with PostgreSQL dialect

**Current Schema** (shared/schema.ts):
- `users` table with UUID primary keys, username, and password fields
- `products` table with comprehensive ecommerce fields:
  - Product identification: SKU, GTIN, external ID, slug
  - Descriptions: name, short description, full description
  - Pricing: regular price, sale price, tax configuration
  - Inventory: stock management, backorders, low stock alerts
  - Media: multiple images (array), tags (array)
  - Physical properties: weight, dimensions (length, width, height)
  - Visibility and publishing controls
- `categories` table with name, slug, description, icon, and parent relationship
- `customers` table with company info, contact details, and verification status
- `suppliers` table with business details, verification, and ratings
- `orders` table with customer relationships, status tracking, and totals
- Schema validation through Drizzle-Zod integration for all entities

**Migration Strategy**:
- Drizzle Kit for schema migrations (output: `./migrations` directory)
- Push-based deployment via `db:push` script
- Database URL configuration via environment variables
- Current implementation uses in-memory storage (MemStorage) for rapid development
- Storage interface designed for seamless migration to PostgreSQL when ready

### Authentication & Authorization

**Authentication Pattern**:
- Dual-role system: Buyer and Supplier accounts
- Session-based authentication using express-session
- PostgreSQL session store (connect-pg-simple)
- Credential-based requests throughout frontend

**Authorization Considerations**:
- Role-based access control for buyer vs. supplier features
- Verification status affecting supplier visibility
- Trade assurance and business verification workflows

## External Dependencies

### Database & ORM
- **PostgreSQL**: Primary database (via @neondatabase/serverless for Neon DB integration)
- **Drizzle ORM**: Type-safe database queries and schema management
- **Drizzle Kit**: Schema migrations and database push operations

### UI Component Libraries
- **Radix UI**: Comprehensive set of accessible, unstyled component primitives (@radix-ui/react-*)
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Lucide React**: Icon library for consistent iconography
- **React Icons**: Additional icons (specifically for social media logos)
- **Embla Carousel**: Carousel/slider functionality
- **cmdk**: Command palette component

### Form & Validation
- **React Hook Form**: Form state management and validation
- **Zod**: Schema validation library
- **@hookform/resolvers**: Integrates Zod with React Hook Form

### State & Data Fetching
- **TanStack Query (React Query)**: Server state management, caching, and synchronization
- **date-fns**: Date manipulation and formatting

### Development Tools
- **Vite**: Build tool and development server
- **esbuild**: JavaScript bundler for production builds
- **TypeScript**: Type checking and compilation
- **PostCSS**: CSS processing with Tailwind
- **@replit/vite-plugin-***: Replit-specific development plugins (cartographer, dev-banner, runtime-error-modal)

### Utilities
- **class-variance-authority**: Component variant management
- **clsx** & **tailwind-merge**: Class name composition utilities
- **nanoid**: Unique ID generation

### Planned Integrations (based on requirements documents)
- File upload service (Uploadthing or Cloudinary) for product images and documents
- Real-time communication (Socket.io or Pusher) for messaging system
- Email service (Resend or SendGrid) for notifications and RFQ alerts
- Payment gateway integration for trade assurance and transactions