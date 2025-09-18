# Admin Users Module

A comprehensive admin management system for NestJS with dual database support (PostgreSQL/MongoDB), JWT authentication, file upload handling, and complete CRUD operations.

## Features

- ✅ **Dual Database Support** - Works with both PostgreSQL (via Prisma) and MongoDB (via Mongoose)
- ✅ **JWT Authentication** - Separate admin authentication with JWT tokens
- ✅ **File Upload** - Admin photo upload with S3/local storage support
- ✅ **Security** - Password hashing, 2FA support, IP tracking, rate limiting
- ✅ **Validation** - Comprehensive input validation with class-validator
- ✅ **Error Handling** - Custom exceptions with detailed error messages
- ✅ **API Documentation** - Full Swagger/OpenAPI documentation
- ✅ **Unit Testing** - Complete test coverage for services and controllers
- ✅ **TypeScript** - Fully typed with strict TypeScript compliance

## API Endpoints

### Public Endpoints (No Authentication Required)

| Method | Endpoint                  | Description               |
| ------ | ------------------------- | ------------------------- |
| POST   | `/admins/login`           | Admin authentication      |
| POST   | `/admins/forgot-password` | Request password reset    |
| POST   | `/admins/reset-password`  | Reset password with token |

### Protected Endpoints (Admin Authentication Required)

| Method | Endpoint                  | Description                       |
| ------ | ------------------------- | --------------------------------- |
| GET    | `/admins/me`              | Get current admin profile         |
| GET    | `/admins`                 | List all admins (paginated)       |
| GET    | `/admins/:publicId`       | Get admin by public ID            |
| POST   | `/admins`                 | Create new admin                  |
| PATCH  | `/admins/:publicId`       | Update admin (excluding password) |
| DELETE | `/admins/:publicId`       | Delete admin                      |
| PATCH  | `/admins/update-password` | Change admin password             |
| POST   | `/admins/logout`          | Logout current admin              |

## Database Schema

### Admin Model Fields

```typescript
interface Admin {
  id: string; // UUID primary key
  publicId: string; // UUID for public API access
  firstName: string; // 3-40 characters
  lastName: string; // 3-40 characters
  email: string; // Unique, lowercase
  photo?: string; // Photo URL/path
  password: string; // Hashed with bcrypt
  passwordChangedAt?: Date; // Password change timestamp
  passwordResetToken?: string; // For password reset
  passwordResetExpires?: Date; // Reset token expiry
  active: boolean; // Account active status
  loginIpAddress: string; // Last login IP
  currentLoginDateTime: Date; // Current login time
  lastLoginDateTime: Date; // Previous login time
  twoFactorAuthVerified: boolean; // 2FA status
  twoFactorSecretKey?: string; // 2FA secret
  createdAt: Date; // Record creation
  updatedAt: Date; // Record update
}
```

### Database Indexes

For optimal performance, the following indexes are created:

- `email` (unique)
- `firstName`
- `lastName`
- `active`
- `publicId` (unique)
- `active + id` (compound)
- `firstName + lastName + email + id` (compound)

## Module Structure

```
src/modules/adminModules/admin-users/
├── admin-users.controller.ts       # REST API endpoints
├── admin-users.service.ts          # Business logic
├── admin-users.module.ts           # Module configuration
├── dto/
│   └── admin-user.dto.ts          # Data transfer objects
├── guards/
│   └── admin-jwt-user.guard.ts    # JWT authentication guard
├── strategies/
│   └── admin-jwt.strategy.ts      # JWT strategy for admins
├── exceptions/
│   └── admin.exceptions.ts        # Custom exception classes
└── tests/
    ├── admin-users.service.spec.ts
    └── admin-users.controller.spec.ts
```

## Request/Response Examples

### Admin Login

**Request:**

```json
POST /admins/login
{
  "email": "admin@example.com",
  "password": "securepassword123"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "clxxxx",
    "publicId": "pub-clxxxx",
    "firstName": "John",
    "lastName": "Doe",
    "email": "admin@example.com",
    "active": true,
    "loginIpAddress": "192.168.1.1",
    "currentLoginDateTime": "2023-01-01T12:00:00.000Z",
    "lastLoginDateTime": "2022-12-31T12:00:00.000Z",
    "twoFactorAuthVerified": false,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T12:00:00.000Z"
  }
}
```

### Create Admin

**Request:**

```json
POST /admins
Content-Type: multipart/form-data

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "password": "securepassword123",
  "passwordConfirm": "securepassword123",
  "active": true,
  "loginIpAddress": "192.168.1.100",
  "currentLoginDateTime": "2023-01-01T12:00:00.000Z",
  "lastLoginDateTime": "2023-01-01T12:00:00.000Z",
  "twoFactorAuthVerified": false,
  "photo": [FILE]
}
```

### Get Admins (Paginated)

**Request:**

```
GET /admins?page=1&limit=10&firstName=John&active=true
```

**Response:**

```json
{
  "admins": [
    {
      "id": "clxxxx",
      "publicId": "pub-clxxxx",
      "firstName": "John",
      "lastName": "Doe"
      // ... other fields
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

## Authentication

Admin authentication uses JWT tokens with the following payload structure:

```typescript
{
  sub: string; // Admin ID
  email: string; // Admin email
  type: 'admin'; // Token type identifier
  iat: number; // Issued at
  exp: number; // Expiration
}
```

### Using Authentication

Include the JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## File Upload

Admin photos are uploaded using the existing `FileUploadUtil` with the following configuration:

- **Allowed Types**: JPEG, PNG, WebP
- **Max Size**: 5MB
- **Storage**: AWS S3 or local filesystem (based on `ASSET_MANAGEMENT_TOOL` env variable)
- **Bucket**: `admin-users`

## Error Handling

Custom exception classes provide detailed error information:

- `AdminNotFoundException` - Admin not found (404)
- `AdminAlreadyExistsException` - Duplicate email (409)
- `InvalidAdminCredentialsException` - Invalid login (401)
- `InactiveAdminException` - Account inactive (401)
- `AdminPasswordMismatchException` - Password validation failed (400)
- `InvalidCurrentPasswordException` - Wrong current password (400)
- `InvalidResetTokenException` - Invalid/expired reset token (400)
- `AdminEmailSendException` - Email sending failed (400)

## Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Email Configuration (for password reset)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=noreply@example.com
EMAIL_PASS=your-email-password

# File Upload (optional)
ASSET_MANAGEMENT_TOOL=AWS  # or leave empty for local storage
AWS_REGION=us-east-1
AWS_ID=your-access-key
AWS_SECRET=your-secret-key
AWS_BUCKET_NAME=your-bucket
AWS_CLOUDFRONT_URL=https://your-cdn.com
```

## Running Tests

```bash
# Run admin module tests
npm run test -- --testPathPatterns="admin-users"

# Run with coverage
npm run test:cov -- --testPathPatterns="admin-users"

# Run specific test file
npm run test -- admin-users.service.spec.ts
```

## Database Migration

### PostgreSQL (Prisma)

The admin table was created with the following migration:

```bash
npx prisma migrate dev --name add-admin-model
```

### MongoDB

Admin schema is automatically registered when the application starts.

## Security Considerations

1. **Password Security**: Passwords are hashed using bcrypt with 12 rounds
2. **JWT Security**: Tokens are signed and verified with a secret key
3. **IP Tracking**: Login IP addresses are recorded for audit trails
4. **Rate Limiting**: API endpoints are protected with throttling
5. **Input Validation**: All inputs are validated using class-validator
6. **File Upload Security**: File types and sizes are strictly validated

## Integration with Main Application

The AdminUsersModule is integrated into the main application through:

1. **Database Module**: Provides repository implementations
2. **App Module**: Imports AdminModulesModule
3. **Authentication**: Uses separate JWT strategy for admins
4. **File Upload**: Integrates with existing FileUploadUtil

## Future Enhancements

Potential improvements for future versions:

- [ ] Role-based access control (RBAC)
- [ ] Admin activity logging
- [ ] Session management
- [ ] Bulk admin operations
- [ ] Admin groups/teams
- [ ] Advanced 2FA with TOTP
- [ ] Email notifications for admin activities

## Support

For issues or questions related to the Admin Users Module, please check:

1. Unit tests for usage examples
2. Swagger documentation at `/api/docs`
3. TypeScript interfaces for type definitions
4. Custom exceptions for error handling patterns
