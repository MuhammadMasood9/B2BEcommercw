# Design Document

## Overview

The Multivendor Authentication System provides secure, role-based access control for a B2B marketplace platform supporting three distinct user types: Admins, Suppliers/Vendors, and Buyers. The system implements hybrid authentication (JWT + session-based), comprehensive role-based authorization, multi-step registration workflows, and advanced security features including audit logging and staff management.

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Admin Dashboard]
        S[Supplier Dashboard]
        B[Buyer Dashboard]
        P[Public Pages]
    end
    
    subgraph "Authentication Layer"
        AM[Auth Middleware]
        JM[JWT Manager]
        SM[Session Manager]
        RG[Role Guards]
    end
    
    subgraph "Business Logic Layer"
        AS[Auth Service]
        US[User Service]
        VS[Verification Service]
        NS[Notification Service]
    end
    
    subgraph "Data Layer"
        UD[User Database]
        SP[Supplier Profiles]
        BP[Buyer Profiles]
        ST[Staff Members]
        AL[Audit Logs]
    end
    
    A --> AM
    S --> AM
    B --> AM
    P --> AM
    
    AM --> JM
    AM --> SM
    AM --> RG
    
    JM --> AS
    SM --> AS
    RG --> US
    
    AS --> UD
    US --> SP
    US --> BP
    US --> ST
    VS --> NS
    
    AS --> AL
```

### Authentication Flow Architecture

```mermaid
sequenceDiagram
    participant C as Client
    participant AM as Auth Middleware
    participant JM as JWT Manager
    participant SM as Session Manager
    participant DB as Database
    
    C->>AM: Request with Token/Session
    AM->>JM: Check JWT Token
    alt JWT Token Present
        JM->>JM: Verify Token
        JM->>DB: Load User Data
        JM->>AM: Return User
    else No JWT Token
        AM->>SM: Check Session
        SM->>DB: Load Session Data
        SM->>AM: Return User
    end
    AM->>C: Authorized Response
```

## Components and Interfaces

### 1. Authentication Service

**Purpose**: Core authentication logic and user management

**Key Methods**:
```typescript
interface AuthService {
  // Authentication
  login(email: string, password: string, useJWT?: boolean): Promise<AuthResult>
  logout(req: Request): Promise<void>
  refreshToken(refreshToken: string): Promise<TokenResult>
  
  // Registration
  registerBuyer(data: BuyerRegistrationData): Promise<User>
  registerSupplier(data: SupplierRegistrationData): Promise<User>
  createAdmin(data: AdminCreationData): Promise<User>
  
  // Verification
  verifyEmail(token: string): Promise<boolean>
  sendVerificationEmail(userId: string): Promise<void>
  
  // Password Management
  requestPasswordReset(email: string): Promise<void>
  resetPassword(token: string, newPassword: string): Promise<void>
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>
}
```

### 2. Authorization System

**Purpose**: Role-based access control and permission management

**Key Components**:
```typescript
interface AuthorizationSystem {
  // Role Guards
  requireAuth(req: Request, res: Response, next: NextFunction): void
  requireRole(roles: string[]): Middleware
  requireSupplierStatus(statuses: string[]): Middleware
  
  // Resource Ownership
  requireResourceOwnership(resourceType: string, getOwner: Function): Middleware
  requireSupplierOwnership(getSupplierId: Function): Middleware
  requireBuyerOwnership(getBuyerId: Function): Middleware
  
  // Staff Permissions
  requireStaffPermission(resource: string, action: string): Middleware
  
  // Verification Requirements
  requireEmailVerification(req: Request, res: Response, next: NextFunction): void
}
```

### 3. User Management Service

**Purpose**: User profile management and role-specific operations

**Key Methods**:
```typescript
interface UserManagementService {
  // User Operations
  getUserById(id: string): Promise<User>
  updateUserProfile(id: string, data: UserUpdateData): Promise<User>
  deactivateUser(id: string): Promise<void>
  
  // Supplier Operations
  approveSupplier(supplierId: string, adminId: string): Promise<void>
  rejectSupplier(supplierId: string, reason: string, adminId: string): Promise<void>
  updateSupplierStatus(supplierId: string, status: string): Promise<void>
  
  // Staff Management
  createStaffMember(supplierId: string, staffData: StaffCreationData): Promise<StaffMember>
  updateStaffPermissions(staffId: string, permissions: StaffPermissions): Promise<void>
  deactivateStaffMember(staffId: string): Promise<void>
}
```

### 4. Session and Token Management

**Purpose**: Secure session handling and JWT token lifecycle

**Key Features**:
```typescript
interface TokenManager {
  // JWT Operations
  generateAccessToken(payload: JWTPayload): string
  generateRefreshToken(payload: RefreshTokenPayload): string
  verifyAccessToken(token: string): JWTPayload
  verifyRefreshToken(token: string): RefreshTokenPayload
  
  // Session Operations
  createSession(userId: string): Promise<Session>
  validateSession(sessionId: string): Promise<Session | null>
  destroySession(sessionId: string): Promise<void>
  
  // Security
  blacklistToken(jti: string): Promise<void>
  isTokenBlacklisted(jti: string): Promise<boolean>
}
```

## Data Models

### Enhanced User Model

```typescript
interface User {
  id: string
  email: string
  password: string // hashed
  firstName?: string
  lastName?: string
  companyName?: string
  phone?: string
  role: 'buyer' | 'admin' | 'supplier'
  emailVerified: boolean
  isActive: boolean
  isOnline: boolean
  lastSeen?: Date
  createdAt: Date
  updatedAt: Date
  
  // Security
  passwordResetToken?: string
  passwordResetExpires?: Date
  emailVerificationToken?: string
  emailVerificationExpires?: Date
  
  // Login tracking
  lastLoginAt?: Date
  loginAttempts: number
  lockedUntil?: Date
}
```

### Supplier Profile Model

```typescript
interface SupplierProfile {
  id: string
  userId: string
  
  // Business Information
  businessName: string
  businessType: 'manufacturer' | 'trading_company' | 'wholesaler' | 'distributor'
  storeName: string
  storeSlug: string
  storeDescription?: string
  storeLogo?: string
  storeBanner?: string
  
  // Contact Information
  contactPerson: string
  position: string
  phone: string
  whatsapp?: string
  wechat?: string
  address: string
  city: string
  country: string
  website?: string
  
  // Business Details
  yearEstablished?: number
  employees?: string
  factorySize?: string
  annualRevenue?: string
  mainProducts: string[]
  exportMarkets: string[]
  
  // Verification
  verificationLevel: 'none' | 'basic' | 'business' | 'premium' | 'trade_assurance'
  verificationDocs?: VerificationDocument[]
  isVerified: boolean
  verifiedAt?: Date
  
  // Membership
  membershipTier: 'free' | 'silver' | 'gold' | 'platinum'
  subscriptionId?: string
  subscriptionStatus?: string
  subscriptionExpiry?: Date
  
  // Performance Metrics
  rating: number
  totalReviews: number
  responseRate: number
  responseTime?: string
  totalSales: number
  totalOrders: number
  
  // Status
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  isActive: boolean
  isFeatured: boolean
  isSuspended: boolean
  suspensionReason?: string
  
  // Financial
  customCommissionRate?: number
  bankName?: string
  accountNumber?: string
  accountName?: string
  paypalEmail?: string
  
  // Metadata
  totalProducts: number
  totalInquiries: number
  storeViews: number
  followers: number
  
  createdAt: Date
  updatedAt: Date
}
```

### Staff Member Model

```typescript
interface StaffMember {
  id: string
  supplierId: string
  email: string
  name: string
  role: 'manager' | 'product_manager' | 'customer_service' | 'accountant'
  permissions: StaffPermissions
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

interface StaffPermissions {
  products: string[] // ['read', 'write', 'delete']
  orders: string[] // ['read', 'write', 'fulfill']
  inquiries: string[] // ['read', 'write', 'respond']
  quotations: string[] // ['read', 'write', 'send']
  analytics: string[] // ['read']
  financial: string[] // ['read']
  settings: string[] // ['read', 'write']
}
```

### Audit Log Model

```typescript
interface AuditLog {
  id: string
  userId?: string
  userEmail?: string
  userRole?: string
  action: string
  resource: string
  resourceId?: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  timestamp: Date
  success: boolean
  errorMessage?: string
}
```

## Error Handling

### Authentication Errors

```typescript
enum AuthErrorCodes {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  SUPPLIER_NOT_APPROVED = 'SUPPLIER_NOT_APPROVED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

interface AuthError {
  code: AuthErrorCodes
  message: string
  details?: Record<string, any>
  timestamp: Date
}
```

### Error Response Format

```typescript
interface ErrorResponse {
  success: false
  error: string
  code: string
  details?: Record<string, any>
  timestamp: string
}
```

## Testing Strategy

### Unit Tests

1. **Authentication Service Tests**
   - Login with valid/invalid credentials
   - Token generation and verification
   - Password hashing and validation
   - Email verification flow

2. **Authorization Tests**
   - Role-based access control
   - Resource ownership validation
   - Staff permission checking
   - Middleware functionality

3. **User Management Tests**
   - User creation and updates
   - Supplier approval workflow
   - Staff member management
   - Profile data validation

### Integration Tests

1. **Authentication Flow Tests**
   - Complete login/logout cycles
   - Token refresh workflows
   - Session management
   - Multi-step registration

2. **Role-Based Access Tests**
   - Admin dashboard access
   - Supplier dashboard access
   - Buyer dashboard access
   - Cross-role access restrictions

3. **Security Tests**
   - Rate limiting
   - Password security
   - Token security
   - Audit logging

### End-to-End Tests

1. **User Registration Flows**
   - Buyer registration and immediate access
   - Supplier registration and approval workflow
   - Admin account creation

2. **Authentication Scenarios**
   - Login with different user types
   - Password reset flow
   - Email verification flow
   - Account lockout scenarios

3. **Dashboard Access Tests**
   - Role-appropriate dashboard loading
   - Navigation restrictions
   - Feature access validation

## Security Considerations

### Password Security

- **Hashing**: bcrypt with salt rounds ≥ 12
- **Requirements**: Minimum 8 characters, mixed case, numbers, special characters
- **History**: Prevent reuse of last 5 passwords
- **Reset**: Secure token-based reset with 1-hour expiration

### Token Security

- **JWT**: Short-lived access tokens (15 minutes)
- **Refresh**: Long-lived refresh tokens (7 days) with rotation
- **Storage**: Secure HTTP-only cookies for refresh tokens
- **Blacklisting**: Token revocation capability

### Session Security

- **Expiration**: 30-minute idle timeout
- **Regeneration**: Session ID regeneration on privilege escalation
- **Storage**: Secure session store (Redis recommended)
- **Cleanup**: Automatic cleanup of expired sessions

### Rate Limiting

- **Login Attempts**: 5 attempts per 15 minutes per IP
- **Account Lockout**: Progressive lockout (5 min, 15 min, 1 hour)
- **API Requests**: Role-based rate limits
- **Password Reset**: 3 requests per hour per email

### Audit and Monitoring

- **Authentication Events**: All login/logout attempts
- **Authorization Events**: Access denials and privilege escalations
- **Administrative Actions**: User management operations
- **Security Events**: Suspicious activity detection

## Performance Considerations

### Database Optimization

- **Indexes**: Email, role, status fields
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Minimize N+1 queries
- **Caching**: User session and profile data

### Token Management

- **Memory Usage**: Efficient token storage
- **Validation Speed**: Fast token verification
- **Cleanup**: Automatic expired token cleanup
- **Blacklist Efficiency**: Redis-based token blacklisting

### Session Management

- **Storage**: Redis for session data
- **Serialization**: Efficient session serialization
- **Cleanup**: Background session cleanup
- **Scaling**: Session store clustering

## Deployment and Configuration

### Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-jwt-secret-256-bit
JWT_REFRESH_SECRET=your-refresh-secret-256-bit
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Session Configuration
SESSION_SECRET=your-session-secret-256-bit
SESSION_TIMEOUT=30m

# Security Configuration
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=15m

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=your-smtp-password

# Database Configuration
DATABASE_URL=postgresql://user:pass@localhost:5432/db
REDIS_URL=redis://localhost:6379
```

### Production Deployment

1. **SSL/TLS**: HTTPS enforcement
2. **Headers**: Security headers (HSTS, CSP, etc.)
3. **Monitoring**: Authentication metrics and alerts
4. **Backup**: Regular database backups
5. **Scaling**: Load balancer configuration

This design provides a comprehensive, secure, and scalable authentication system that supports the complex requirements of a multivendor B2B marketplace platform.