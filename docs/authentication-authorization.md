# Authentication and Authorization Documentation

## Overview

The B2B Marketplace implements a comprehensive authentication and authorization system supporting three distinct user roles: Buyers, Suppliers, and Admins. The system uses JWT (JSON Web Tokens) for stateless authentication and role-based access control (RBAC) for authorization.

## Authentication System

### JWT Token Structure

The system uses JWT tokens with the following structure:

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "id": "user-uuid",
    "email": "user@example.com",
    "role": "buyer|supplier|admin",
    "firstName": "John",
    "lastName": "Doe",
    "iat": 1640995200,
    "exp": 1641081600
  },
  "signature": "..."
}
```

### Token Lifecycle

1. **Token Generation**: Created upon successful login
2. **Token Expiration**: 24 hours for regular users, 8 hours for admins
3. **Token Refresh**: Automatic refresh when token is within 1 hour of expiration
4. **Token Revocation**: Immediate invalidation on logout or security events

### Authentication Endpoints

#### POST /api/auth/login
Authenticate user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh-token-here",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "role": "buyer",
    "firstName": "John",
    "lastName": "Doe",
    "isVerified": true
  },
  "expiresIn": 86400
}
```

#### POST /api/auth/register
Register a new user account.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "buyer",
  "companyName": "ABC Company"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully. Please verify your email.",
  "user": {
    "id": "new-user-uuid",
    "email": "newuser@example.com",
    "role": "buyer",
    "emailVerified": false
  }
}
```

#### POST /api/auth/refresh
Refresh an expired or near-expired token.

**Request:**
```json
{
  "refreshToken": "refresh-token-here"
}
```

**Response:**
```json
{
  "success": true,
  "token": "new-jwt-token",
  "refreshToken": "new-refresh-token",
  "expiresIn": 86400
}
```

#### POST /api/auth/logout
Logout and invalidate current session.

**Request Headers:**
```
Authorization: Bearer jwt-token-here
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### POST /api/auth/forgot-password
Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent if account exists"
}
```

#### POST /api/auth/reset-password
Reset password using reset token.

**Request:**
```json
{
  "token": "password-reset-token",
  "newPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

#### POST /api/auth/verify-email
Verify email address using verification token.

**Request:**
```json
{
  "token": "email-verification-token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

## Authorization System

### Role-Based Access Control (RBAC)

The system implements three primary roles with distinct permissions:

#### 1. Buyer Role
**Permissions:**
- Browse and search products
- Create and manage RFQs
- Send inquiries to suppliers
- Compare quotations
- Place orders
- Communicate with suppliers and admins
- Manage their profile and company information
- Create disputes for orders

**Restricted Actions:**
- Cannot access supplier management features
- Cannot access admin panel
- Cannot approve products or suppliers
- Cannot view other buyers' data

#### 2. Supplier Role
**Permissions:**
- Manage their product catalog
- Respond to RFQs and inquiries
- Create and manage quotations
- Process orders
- Communicate with buyers and admins
- Manage their store and business profile
- View their analytics and performance metrics
- Upload evidence for disputes

**Restricted Actions:**
- Cannot access other suppliers' data
- Cannot access admin panel
- Cannot approve their own products
- Cannot view buyer contact information without permission

#### 3. Admin Role
**Permissions:**
- Full platform oversight and management
- Approve/reject suppliers and products
- Manage disputes and mediation
- Access all analytics and reports
- Manage platform settings and configuration
- Communicate with all users
- Process refunds and payouts
- Manage commission settings

**Restricted Actions:**
- Cannot directly manage supplier business operations
- Cannot place orders on behalf of buyers
- Cannot create RFQs or quotations

### Permission Matrix

| Feature | Buyer | Supplier | Admin |
|---------|-------|----------|-------|
| Product Browsing | ✅ | ✅ | ✅ |
| Product Management | ❌ | ✅ (Own) | ✅ (All) |
| RFQ Creation | ✅ | ❌ | ❌ |
| RFQ Response | ❌ | ✅ | ❌ |
| Order Placement | ✅ | ❌ | ❌ |
| Order Processing | ❌ | ✅ (Own) | ✅ (All) |
| Dispute Creation | ✅ | ✅ | ❌ |
| Dispute Resolution | ❌ | ❌ | ✅ |
| Chat with Suppliers | ✅ | ❌ | ✅ |
| Chat with Buyers | ❌ | ✅ | ✅ |
| Platform Analytics | ❌ | ✅ (Own) | ✅ (All) |
| User Management | ❌ | ❌ | ✅ |
| Commission Management | ❌ | ❌ | ✅ |

### Middleware Implementation

#### Authentication Middleware
```typescript
// authMiddleware.ts
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Check if user is active
    const user = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);
    
    if (!user.length || !user[0].isActive) {
      return res.status(401).json({ error: 'Account inactive or not found' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
```

#### Role-Based Guards
```typescript
// authGuards.ts
export const requireBuyer = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'buyer') {
    return res.status(403).json({ error: 'Buyer access required' });
  }
  next();
};

export const requireSupplier = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'supplier') {
    return res.status(403).json({ error: 'Supplier access required' });
  }
  next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const requireRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

#### Resource Ownership Validation
```typescript
// Resource ownership guards
export const requireBuyerOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const buyerId = req.params.buyerId || req.body.buyerId;
    const userBuyerProfile = await getBuyerProfile(req.user!.id);
    
    if (!userBuyerProfile || userBuyerProfile.id !== buyerId) {
      return res.status(403).json({ error: 'Access denied to this resource' });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

export const requireSupplierOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplierId = req.params.supplierId || req.body.supplierId;
    const userSupplierProfile = await getSupplierProfile(req.user!.id);
    
    if (!userSupplierProfile || userSupplierProfile.id !== supplierId) {
      return res.status(403).json({ error: 'Access denied to this resource' });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};
```

### Route Protection Examples

#### Buyer Routes
```typescript
// buyerApiRoutes.ts
router.use(authMiddleware);
router.use(requireBuyer);

// Get buyer's RFQs - requires buyer role and ownership
router.get('/rfqs', requireBuyerOwnership, async (req, res) => {
  // Implementation
});

// Create new RFQ - requires buyer role
router.post('/rfqs', async (req, res) => {
  // Implementation
});
```

#### Supplier Routes
```typescript
// supplierApiRoutes.ts
router.use(authMiddleware);
router.use(requireSupplier);
router.use(requireSupplierStatus(['approved'])); // Additional status check

// Get supplier's quotations
router.get('/quotations', async (req, res) => {
  // Implementation
});

// Update quotation - requires ownership
router.put('/quotations/:id', requireSupplierOwnership, async (req, res) => {
  // Implementation
});
```

#### Admin Routes
```typescript
// adminRoutes.ts
router.use(authMiddleware);
router.use(requireAdmin);

// Get all disputes - admin only
router.get('/disputes', async (req, res) => {
  // Implementation
});

// Resolve dispute - admin only
router.put('/disputes/:id/resolve', async (req, res) => {
  // Implementation
});
```

## Security Features

### Password Security
- **Minimum Requirements**: 8 characters, mixed case, numbers, special characters
- **Hashing**: bcrypt with salt rounds of 12
- **Password History**: Prevents reuse of last 5 passwords
- **Account Lockout**: 5 failed attempts locks account for 15 minutes

```typescript
// Password validation
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain uppercase, lowercase, number, and special character');

// Password hashing
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

// Password verification
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
```

### Session Management
- **JWT Expiration**: Configurable token lifetime
- **Refresh Tokens**: Secure token renewal mechanism
- **Session Invalidation**: Immediate logout on security events
- **Concurrent Sessions**: Limited to 3 active sessions per user

### Multi-Factor Authentication (MFA)
- **TOTP Support**: Time-based one-time passwords
- **SMS Backup**: SMS verification for account recovery
- **Recovery Codes**: One-time backup codes for emergency access

```typescript
// MFA verification
export const verifyMFA = async (userId: string, token: string): Promise<boolean> => {
  const user = await getUserById(userId);
  if (!user.mfaSecret) return false;
  
  return speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token,
    window: 2
  });
};
```

### Rate Limiting
- **Login Attempts**: 5 attempts per 15 minutes per IP
- **API Requests**: 100 requests per minute per user
- **Password Reset**: 3 requests per hour per email

```typescript
// Rate limiting middleware
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Account Security
- **Email Verification**: Required for account activation
- **Password Reset**: Secure token-based reset process
- **Account Lockout**: Automatic lockout after failed attempts
- **Security Notifications**: Email alerts for security events

## Frontend Integration

### Authentication Context
```typescript
// AuthContext.tsx
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // Implementation
};
```

### Route Protection
```typescript
// RouteGuard.tsx
interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: 'buyer' | 'supplier' | 'admin';
  requireAuth?: boolean;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  requiredRole, 
  requireAuth = true 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
};
```

### Permission-Based Component Rendering
```typescript
// PermissionGuard.tsx
interface PermissionGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  children, 
  allowedRoles, 
  fallback = null 
}) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Usage
<PermissionGuard allowedRoles={['admin']}>
  <AdminPanel />
</PermissionGuard>
```

## API Authentication Examples

### Making Authenticated Requests
```typescript
// API client setup
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post('/api/auth/refresh', { refreshToken });
          const { token } = response.data;
          localStorage.setItem('token', token);
          
          // Retry original request
          error.config.headers.Authorization = `Bearer ${token}`;
          return apiClient.request(error.config);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
```

## Security Best Practices

### Token Security
1. **Secure Storage**: Store tokens in httpOnly cookies when possible
2. **Token Rotation**: Regular token refresh and rotation
3. **Scope Limitation**: Minimal token permissions
4. **Expiration**: Short-lived tokens with refresh mechanism

### API Security
1. **HTTPS Only**: All authentication endpoints use HTTPS
2. **CORS Configuration**: Strict CORS policies
3. **Input Validation**: Comprehensive input sanitization
4. **SQL Injection Prevention**: Parameterized queries only

### Monitoring and Logging
1. **Authentication Events**: Log all login/logout events
2. **Failed Attempts**: Monitor and alert on suspicious activity
3. **Token Usage**: Track token usage patterns
4. **Security Incidents**: Automated incident response

### Compliance
1. **GDPR Compliance**: User data protection and privacy
2. **Data Retention**: Secure data retention policies
3. **Audit Trails**: Comprehensive audit logging
4. **Regular Security Reviews**: Periodic security assessments

This authentication and authorization system provides robust security while maintaining usability for all user roles in the B2B marketplace platform.