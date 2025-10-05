# NestJS Multi-Database Authentication System - Developer Guide

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Getting Started](#getting-started)
4. [Core Concepts](#core-concepts)
5. [Database Architecture](#database-architecture)
6. [Authentication System](#authentication-system)
7. [Request Lifecycle](#request-lifecycle)
8. [Module Structure](#module-structure)
9. [Development Patterns](#development-patterns)
10. [API Documentation](#api-documentation)
11. [Development Workflow](#development-workflow)
12. [Troubleshooting](#troubleshooting)

---

## Project Overview

This is an enterprise-grade NestJS application that provides a robust foundation for building scalable web applications. The project features dual database support (PostgreSQL and MongoDB), JWT-based authentication, microservices architecture, and comprehensive business logic modules for investment campaigns.

### Key Features

- **Dual Database Support**: Switch between PostgreSQL (Prisma) and MongoDB (Mongoose)
- **JWT Authentication**: Secure token-based authentication with Passport
- **Modular Architecture**: Feature-based modules for better organization
- **Repository Pattern**: Database abstraction layer for flexibility
- **Internationalization (i18n)**: Multi-language support
- **Rate Limiting**: Built-in throttling for API protection
- **Comprehensive Validation**: Input validation using class-validator
- **Swagger Documentation**: Auto-generated API documentation
- **Email Integration**: Account activation and password reset emails

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │◄──►│   NestJS API    │◄──►│   Database      │
│                 │    │                 │    │ (PostgreSQL/    │
│ (Web/Mobile)    │    │ (REST Endpoints)│    │  MongoDB)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Directory Structure

```
src/
├── common/              # Shared utilities, guards, interceptors
│   ├── config/         # Configuration files
│   ├── decorators/     # Custom decorators
│   ├── dto/            # Common DTOs
│   ├── enums/          # Enumerations
│   ├── filters/        # Exception filters
│   ├── guards/         # Authentication/authorization guards
│   ├── interceptors/   # Request/response interceptors
│   ├── interfaces/     # Common interfaces
│   ├── services/       # Shared services
│   └── utils/          # Utility functions
├── database/           # Database layer
│   ├── entities/       # Database entities (Prisma)
│   ├── prisma/         # Prisma service and configuration
│   ├── repositories/   # Repository implementations
│   └── schemas/        # Mongoose schemas
├── email/              # Email service module
├── health/             # Health check endpoints
├── i18n/               # Internationalization
├── metrics/            # Application metrics
├── modules/            # Feature modules
│   ├── auth/          # Authentication module
│   ├── users/         # User management
│   ├── adminModules/  # Admin functionality
│   └── [other-modules]/ # Business logic modules
├── app.module.ts       # Root application module
└── main.ts            # Application entry point
```

---

## Getting Started

### Prerequisites

- Node.js (v22 or higher)
- npm or yarn
- PostgreSQL OR MongoDB (depending on configuration)
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd nestjs-postgres-auth

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Database setup (for PostgreSQL)
npm run prisma:generate
npm run prisma:migrate

# Start development server
npm run start:dev
```

### MongoDB-Only Installation

If you only want to use MongoDB (no PostgreSQL required):

```bash
# Clone the repository
git clone <repository-url>
cd nestjs-postgres-auth

# Install dependencies (automatically runs prisma generate)
npm install

# Setup environment variables for MongoDB
cp .env.example .env
# Edit .env and set:
# DATABASE_TYPE=mongodb
# MONGODB_URI=mongodb://localhost:27017/your-database-name

# Start development server (no migrations needed!)
npm run start:dev
```

**Key Points for MongoDB-Only Setup:**

- ✅ PostgreSQL installation is NOT required
- ✅ Prisma client is auto-generated on `npm install`
- ✅ No database migrations needed
- ❌ Do NOT run `npm run prisma:migrate` (PostgreSQL only)
- ✅ Just set `DATABASE_TYPE=mongodb` and start the app

### Environment Variables

```env
# Database Configuration
DATABASE_TYPE=postgres          # or 'mongodb'
DATABASE_URL=postgresql://...   # PostgreSQL connection string
MONGODB_URI=mongodb://...       # MongoDB connection string

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Application Configuration
PORT=3000
NODE_ENV=development
```

---

## Core Concepts

### 1. NestJS Fundamentals

#### Modules (@Module)

Modules are the basic building blocks of a NestJS application. They organize related functionality together.

```typescript
@Module({
  imports: [ConfigModule, DatabaseModule], // Other modules to import
  controllers: [AuthController], // Controllers in this module
  providers: [AuthService, JwtStrategy], // Services and providers
  exports: [AuthService], // Services to export to other modules
})
export class AuthModule {}
```

#### Controllers (@Controller)

Controllers handle incoming HTTP requests and return responses to the client.

```typescript
@Controller('auth') // Base route: /auth
export class AuthController {
  @Post('login') // Full route: POST /auth/login
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
```

#### Services (@Injectable)

Services contain business logic and can be injected into controllers or other services.

```typescript
@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository,
    private jwtService: JwtService
  ) {}

  async login(loginDto: LoginDto) {
    // Business logic here
  }
}
```

#### Dependency Injection

NestJS uses dependency injection to manage dependencies between classes.

```typescript
// Service is automatically injected into constructor
constructor(private authService: AuthService) {}

// Manual injection with token
constructor(
  @Inject(USER_REPOSITORY) private userRepository: IUserRepository
) {}
```

### 2. Decorators Used

| Decorator                 | Purpose                  | Example                                   |
| ------------------------- | ------------------------ | ----------------------------------------- |
| `@Module()`               | Define a module          | `@Module({ imports: [], providers: [] })` |
| `@Controller()`           | Define a controller      | `@Controller('users')`                    |
| `@Injectable()`           | Mark class as injectable | `@Injectable()`                           |
| `@Get()`, `@Post()`, etc. | HTTP method handlers     | `@Get('profile')`                         |
| `@Body()`                 | Extract request body     | `@Body() createUserDto: CreateUserDto`    |
| `@Param()`                | Extract route parameters | `@Param('id') id: string`                 |
| `@Query()`                | Extract query parameters | `@Query() paginationDto: PaginationDto`   |
| `@UseGuards()`            | Apply guards             | `@UseGuards(JwtAuthGuard)`                |
| `@Public()`               | Mark route as public     | `@Public()` (custom decorator)            |

---

## Database Architecture

### Dual Database Support

The application supports both PostgreSQL and MongoDB through a unified repository pattern.

#### Database Selection

```typescript
// Environment variable determines database type
DATABASE_TYPE = postgres; // or 'mongodb'
```

#### Repository Pattern Implementation

**1. Interface Definition**

```typescript
// src/database/repositories/user/user.repository.interface.ts
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  insert(userData: CreateUserData): Promise<User>;
  updateById(id: string, updateData: UpdateUserData): Promise<User>;
  // ... other methods
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
```

**2. PostgreSQL Implementation**

```typescript
// src/database/repositories/user/user-postgres.repository.ts
export class UserPostgresRepository implements IUserRepository {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }
  // ... other implementations using Prisma
}
```

**3. MongoDB Implementation**

```typescript
// src/database/repositories/user/user-mongodb.repository.ts
export class UserMongoRepository implements IUserRepository {
  constructor(private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }
  // ... other implementations using Mongoose
}
```

**4. Dynamic Injection**

```typescript
// src/database/database.module.ts
providers: [
  {
    provide: USER_REPOSITORY,
    useFactory: (prismaService: PrismaService) => {
      return new UserPostgresRepository(prismaService);
    },
    inject: [PrismaService],
  },
];
```

### Database Entities vs Schemas

#### PostgreSQL (Prisma Entities)

```typescript
// src/database/entities/user.entity.ts
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  active: ActiveStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

#### MongoDB (Mongoose Schemas)

```typescript
// src/database/schemas/user.schema.ts
@Schema()
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
```

---

## Authentication System

### JWT Authentication Flow

#### 1. User Registration

```
Client → POST /auth/register → Validation → Password Hashing → Save User → Send Activation Email
```

**Implementation (`src/modules/auth/auth.service.ts:40`)**:

```typescript
async register(registerDto: RegisterDto, ipAddress: string) {
  // 1. Check if user already exists
  const existingUser = await this.userRepository.findByEmail(email);
  if (existingUser) {
    return this.i18nResponse.translateBadRequest('auth.email_already_exists');
  }

  // 2. Hash password with bcrypt (12 rounds)
  const hashedPassword = await bcrypt.hash(password, 12);

  // 3. Generate unique slug and activation token
  const slug = `${slugify(fullName, { lower: true })}-${timeString}`;
  const activationToken = crypto.randomBytes(32).toString('hex');

  // 4. Save user with PENDING status
  const user = await this.userRepository.insert({
    ...userData,
    password: hashedPassword,
    active: ActiveStatus.PENDING
  });

  // 5. Return response (password excluded)
  return this.i18nResponse.created('auth.register_success_check_email', userResponse);
}
```

#### 2. User Login

```
Client → POST /auth/login → Validate Credentials → Generate JWT → Return Token + User Data
```

**Implementation (`src/modules/auth/auth.service.ts:113`)**:

```typescript
async login(loginDto: LoginDto, ipAddress: string) {
  // 1. Find user by email
  const user = await this.userRepository.findByEmail(email);
  if (!user) throw new UnauthorizedException();

  // 2. Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new UnauthorizedException();

  // 3. Check account status
  if (user.active !== ActiveStatus.ACTIVE) throw new UnauthorizedException();

  // 4. Generate JWT token
  const payload = { email: user.email, sub: user.id };
  const token = this.jwtService.sign(payload);

  // 5. Return user data + token
  return this.i18nResponse.userLoginSuccess({ user: userResponse, token });
}
```

#### 3. Protected Routes

```typescript
// Apply JWT guard to protect routes
@UseGuards(JwtUserGuard)
@Get('profile')
async getProfile(@Req() req: Request) {
  return req.user; // User info extracted from JWT
}

// Public routes (bypass authentication)
@Public()
@Post('login')
async login() { /* ... */ }
```

### JWT Strategy Implementation

```typescript
// src/modules/auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}
```

---

## Request Lifecycle

### Complete Request Flow

```
1. HTTP Request
   ↓
2. CORS Middleware
   ↓
3. Rate Limiting (Throttler)
   ↓
4. Route Matching (@Controller + @Method)
   ↓
5. Guards (Authentication/Authorization)
   ↓
6. Interceptors (Pre-processing)
   ↓
7. Validation Pipes (DTO Validation)
   ↓
8. Controller Method
   ↓
9. Service Method (Business Logic)
   ↓
10. Repository Method (Database)
    ↓
11. Interceptors (Post-processing)
    ↓
12. Exception Filters (Error Handling)
    ↓
13. HTTP Response
```

### Global Interceptors

```typescript
// src/app.module.ts - Global interceptors applied to all routes
providers: [
  {
    provide: APP_INTERCEPTOR,
    useClass: LanguagePersistenceInterceptor, // Handle i18n language
  },
  {
    provide: APP_INTERCEPTOR,
    useClass: I18nResponseInterceptor, // Translate responses
  },
  {
    provide: APP_INTERCEPTOR,
    useClass: ResponseInterceptor, // Standardize response format
  },
  {
    provide: APP_INTERCEPTOR,
    useClass: ErrorLoggingInterceptor, // Log errors
  },
];
```

### Example Request Processing

**Request**: `POST /auth/login`

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Processing Steps**:

1. **CORS Check**: Allow/deny based on origin
2. **Rate Limiting**: Check if under limit (10 requests/minute for login)
3. **Route Matching**: `AuthController.login()` method
4. **Public Route**: No JWT guard (marked with `@Public()`)
5. **Validation**: Validate `LoginDto` with class-validator
6. **Controller**: Call `authService.login()`
7. **Service**: Business logic (verify credentials, generate JWT)
8. **Repository**: Database query to find user
9. **Response**: Return standardized response with user data + token

---

## Module Structure

### Feature Module Example: AuthModule

```typescript
// src/modules/auth/auth.module.ts
@Module({
  imports: [
    ConfigModule, // Access to environment variables
    DatabaseModule, // User repository access
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      // JWT configuration
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    EmailModule, // Email service for notifications
  ],
  providers: [AuthService, JwtStrategy], // Business logic and JWT strategy
  controllers: [AuthController], // HTTP endpoints
  exports: [AuthService, JwtStrategy, PassportModule, JwtModule], // Available to other modules
})
export class AuthModule {}
```

### Feature Module Example: SettingsModule

```typescript
// src/modules/admin-modules/settings/settings.module.ts
@Module({
  imports: [
    ConfigModule, // Access to environment variables
    DatabaseModule, // Settings repository access
    FileManagementModule, // File upload service
    I18nModule, // Internationalization
  ],
  controllers: [SettingsController], // HTTP endpoints
  providers: [
    SettingsService, // Business logic
    {
      provide: SETTINGS_REPOSITORY, // Repository injection
      useFactory: (
        databaseType: string,
        prisma: PrismaService,
        settingsModel: Model<SettingsDocument>
      ) => {
        return databaseType === 'postgres'
          ? new SettingsPostgresRepository(prisma)
          : new SettingsMongoRepository(settingsModel);
      },
      inject: ['DATABASE_TYPE', PrismaService, getModelToken(Settings.name)],
    },
  ],
  exports: [SettingsService], // Make service available to other modules
})
export class SettingsModule {}
```

#### Settings Module Features

- **Dynamic Configuration**: Manage application settings by group types
- **File Upload Support**: Handle both text and file-based settings
- **Caching System**: Redis-like in-memory caching for performance
- **Public/Admin Access**: Separate endpoints for public and admin access
- **Validation**: Strong typing and validation for settings data
- **Internationalization**: Multi-language error messages

#### Settings Repository Pattern

```typescript
// Interface definition
export interface ISettingsRepository extends IRepository<Settings> {
  findByGroupType(groupType: string): Promise<Settings[]>;
  findByGroupTypeAndKey(
    groupType: string,
    key: string
  ): Promise<Settings | null>;
  upsertByGroupTypeAndKey(
    groupType: string,
    key: string,
    data: CreateSettingsData | UpdateSettingsData
  ): Promise<Settings>;
  deleteByGroupType(groupType: string): Promise<number>;
  deleteByGroupTypeAndKey(groupType: string, key: string): Promise<boolean>;
  bulkUpsert(settings: CreateSettingsData[]): Promise<Settings[]>;
}

// Usage in service
export class SettingsService {
  constructor(
    @Inject(SETTINGS_REPOSITORY)
    private settingsRepository: ISettingsRepository,
    private fileManagementService: FileManagementService
  ) {}

  async getSettingsByGroupType(groupType: string): Promise<Settings[]> {
    return this.settingsRepository.findByGroupType(groupType);
  }
}
```

#### File Upload Integration

```typescript
// Controller handling multipart form data
@Post(':groupType/admin')
@UseGuards(AdminJwtUserGuard)
@UseInterceptors(FilesInterceptor('files', 20, {
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 20, // Maximum 20 files
  },
}))
async createOrUpdateSettings(
  @Param() params: GroupTypeParamDto,
  @Body() body: any,
  @UploadedFiles() files?: Express.Multer.File[]
) {
  const formData = this.combineFormData(body, files);
  return this.settingsService.createOrUpdateSettings(params.groupType, formData);
}
```

### Module Dependencies

```
AppModule
├── ConfigModule (Global)
├── ThrottlerModule (Rate Limiting)
├── I18nModule (Internationalization)
├── DatabaseModule (Database Abstraction)
├── EmailModule
├── AuthModule
│   ├── ConfigModule
│   ├── DatabaseModule
│   ├── PassportModule
│   ├── JwtModule
│   └── EmailModule
├── UsersModule
│   └── DatabaseModule
├── AdminModulesModule
│   ├── AdminUsersModule
│   └── SettingsModule
│       ├── ConfigModule
│       ├── DatabaseModule
│       ├── FileManagementModule
│       └── I18nModule
└── [Other Business Modules]
```

---

## Development Patterns

### 1. TypeScript Coding Standards

**STRICT TypeScript Enforcement**: This project enforces strict TypeScript with zero tolerance for `any` types.

#### Type Safety Rules:
- ❌ **Never use `any` type** - Use specific types or `unknown` for truly unknown data
- ✅ **Always type function parameters and return values**
- ✅ **Use proper generic constraints**: `<T = unknown>` instead of `<T = any>`
- ✅ **Prefer interfaces over object literals** for complex structures
- ✅ **Use union types for specific value sets**: `'YES' | 'NO'` instead of `string`

#### Examples:

```typescript
// ❌ Bad - using any
function processData(data: any): any {
  return data.someProperty;
}

// ✅ Good - using proper types
interface UserData {
  id: string;
  name: string;
  email: string;
}

function processUserData(data: UserData): string {
  return data.name;
}

// ✅ Good - using unknown for truly unknown data
function parseJsonSafely(jsonString: string): unknown {
  return JSON.parse(jsonString);
}
```

#### Development Workflow:
1. **Lint Check**: Run `npm run lint` to catch type issues
2. **Build Check**: Run `npm run build` to verify TypeScript compilation
3. **Start App**: Use `npm run start:dev` for development with nodemon

### 2. DTO (Data Transfer Object) Pattern

```typescript
// src/modules/auth/dto/auth.dto.ts
export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName: string;

  @IsOptional()
  @IsUUID()
  userTypeId?: string;
}
```

### 2. Response Standardization

```typescript
// All API responses follow this pattern
interface StandardResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  statusCode: number;
  timestamp: string;
}

// Usage in services
return this.i18nResponse.success('auth.login_success', { user, token });
return this.i18nResponse.error('auth.invalid_credentials', 401);
```

### 3. Error Handling

```typescript
// Global exception filter handles all errors
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Standardized error response
    response.status(status).json({
      success: false,
      message: exception.message,
      statusCode: status,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### 4. Configuration Management

```typescript
// src/common/config/app.config.ts
export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
}));

// Usage in services
constructor(private configService: ConfigService) {
  const port = this.configService.get<number>('app.port');
}
```

### 5. Repository Token Pattern

```typescript
// Define token
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

// Register implementation
{
  provide: USER_REPOSITORY,
  useFactory: (prismaService: PrismaService) => {
    return new UserPostgresRepository(prismaService);
  },
  inject: [PrismaService],
}

// Inject in service
constructor(
  @Inject(USER_REPOSITORY) private userRepository: IUserRepository
) {}
```

### 6. File Upload Patterns

The application supports robust file upload handling with validation, storage management, and integration with the Settings module.

#### Basic File Upload Setup

```typescript
// Controller with file upload
@Post('upload')
@UseInterceptors(FilesInterceptor('files', 20, {
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 20, // Maximum 20 files
  },
}))
async uploadFiles(
  @UploadedFiles() files: Express.Multer.File[]
) {
  return this.fileService.handleUpload(files);
}
```

#### Mixed Form Data (Text + Files)

```typescript
// Settings module pattern for handling mixed data
@Post(':groupType/admin')
@UseInterceptors(FilesInterceptor('files', 20, {
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 20 },
}))
async createOrUpdateSettings(
  @Param() params: GroupTypeParamDto,
  @Body() body: any,
  @UploadedFiles() files?: Express.Multer.File[]
) {
  // Combine text data and files
  const formData: Record<string, string | Express.Multer.File> = {};

  // Add text data
  Object.entries(body).forEach(([key, value]) => {
    if (typeof value === 'string') {
      formData[key] = value;
    }
  });

  // Add files using their field names as keys
  files?.forEach((file) => {
    if (file.fieldname) {
      formData[file.fieldname] = file;
    }
  });

  return this.settingsService.createOrUpdateSettings(params.groupType, formData);
}
```

#### File Management Service

```typescript
// File upload service with validation and storage
@Injectable()
export class FileManagementService {
  async uploadSettingsFile(
    file: Express.Multer.File
  ): Promise<{ filePath: string }> {
    // Validate file type and size
    this.validateFile(file);

    // Generate unique filename
    const filename = this.generateUniqueFilename(file.originalname);

    // Save to storage (local, S3, etc.)
    const filePath = await this.saveFile(file, filename);

    return { filePath };
  }

  private validateFile(file: Express.Multer.File): void {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type');
    }

    if (file.size > maxSize) {
      throw new BadRequestException('File too large');
    }
  }
}
```

#### File Storage Strategies

```typescript
// Local storage implementation
async saveToLocal(file: Express.Multer.File, filename: string): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'uploads', 'settings');
  await fs.ensureDir(uploadDir);

  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, file.buffer);

  return `/uploads/settings/${filename}`;
}

// AWS S3 storage implementation
async saveToS3(file: Express.Multer.File, filename: string): Promise<string> {
  const uploadParams = {
    Bucket: this.configService.get('aws.s3.bucket'),
    Key: `settings/${filename}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const result = await this.s3.upload(uploadParams).promise();
  return result.Location;
}
```

#### File Cleanup and Management

```typescript
// Automatic cleanup of old files
async deleteOldFile(filePath: string): Promise<void> {
  try {
    const fileExists = await this.fileExists(filePath);
    if (fileExists) {
      await this.deleteFile(filePath);
      this.logger.debug(`Old file deleted: ${filePath}`);
    }
  } catch (error) {
    this.logger.warn(`Failed to delete old file: ${filePath}`, error.stack);
    // Don't throw error for file deletion failures
  }
}

// File existence check
async fileExists(filePath: string): Promise<boolean> {
  try {
    if (filePath.startsWith('http')) {
      // For S3 or external URLs
      const response = await fetch(filePath, { method: 'HEAD' });
      return response.ok;
    } else {
      // For local files
      const fullPath = path.join(process.cwd(), filePath);
      await fs.access(fullPath);
      return true;
    }
  } catch {
    return false;
  }
}
```

#### Frontend Integration Example

```javascript
// Frontend form data preparation
const formData = new FormData();

// Add text fields
formData.append('siteName', 'My Website');
formData.append('primaryColor', '#000000');

// Add files
if (logoFile) {
  formData.append('siteLogo', logoFile);
}
if (faviconFile) {
  formData.append('siteFavicon', faviconFile);
}

// Send request
const response = await fetch('/settings/site_setting/admin', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    // Don't set Content-Type header - let browser set it with boundary
  },
  body: formData,
});
```

---

## API Documentation

### Available Endpoints

#### Authentication Endpoints

```
POST   /auth/register         # User registration
POST   /auth/login            # User login
GET    /auth/activate         # Account activation
POST   /auth/forgot-password  # Request password reset
POST   /auth/reset-password   # Reset password with token
```

#### User Management Endpoints

```
GET    /users/profile         # Get current user profile
PATCH  /users/profile         # Update user profile
PATCH  /users/change-password # Change user password
GET    /users/slug/:slug      # Get user by slug
DELETE /users/deactivate      # Deactivate user account
```

#### Admin Endpoints

```
GET    /admin/users           # List all users (admin only)
POST   /admin/users           # Create user (admin only)
PATCH  /admin/users/:id       # Update user (admin only)
DELETE /admin/users/:id       # Delete user (admin only)
```

#### Settings Management Endpoints

```
# Public endpoints (no authentication required)
GET    /settings/:groupType/front         # Get public settings by group type

# Admin endpoints (require admin authentication)
GET    /settings/:groupType/admin         # Get admin settings by group type
POST   /settings/:groupType/admin         # Create/update settings (supports file upload)
DELETE /settings/:groupType/admin         # Delete all settings by group type

# Cache management (admin only)
GET    /settings/admin/cache/stats        # Get cache statistics
DELETE /settings/admin/cache/clear/:groupType?  # Clear cache (all or by group)
```

#### Settings API Examples

```bash
# Get public site configuration
curl -X GET "http://localhost:3000/settings/site_setting/front"

# Create/update settings with mixed data (admin)
curl -X POST "http://localhost:3000/settings/site_setting/admin" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: multipart/form-data" \
  -F "siteName=My Website" \
  -F "primaryColor=#000000" \
  -F "siteLogo=@./logo.png"

# Delete all settings in a group (admin)
curl -X DELETE "http://localhost:3000/settings/site_setting/admin" \
  -H "Authorization: Bearer <admin-token>"
```

### Authentication Required

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

### Rate Limiting

The API implements rate limiting:

- **General**: 50 requests per minute
- **Login**: 10 requests per minute
- **Registration**: 5 requests per minute
- **Password Reset**: 3 requests per minute

### Swagger Documentation

Access interactive API documentation at: `http://localhost:3000/api/docs`

---

## Development Workflow

### 1. Setup Development Environment

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Generate Prisma client (if using PostgreSQL)
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run start:dev
```

### 2. Creating a New Feature Module

**Step 1: Generate Module**

```bash
nest g module modules/feature-name
nest g controller modules/feature-name
nest g service modules/feature-name
```

**Step 2: Create DTOs**

```typescript
// src/modules/feature-name/dto/feature.dto.ts
export class CreateFeatureDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
```

**Step 3: Create Repository Interface**

```typescript
// src/database/repositories/feature/feature.repository.interface.ts
export interface IFeatureRepository {
  create(data: CreateFeatureData): Promise<Feature>;
  findById(id: string): Promise<Feature | null>;
}

export const FEATURE_REPOSITORY = Symbol('FEATURE_REPOSITORY');
```

**Step 4: Implement Repository**

```typescript
// src/database/repositories/feature/feature-postgres.repository.ts
export class FeaturePostgresRepository implements IFeatureRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateFeatureData): Promise<Feature> {
    return this.prisma.feature.create({ data });
  }
}
```

**Step 5: Register Repository in DatabaseModule**

```typescript
// Add to database.module.ts
{
  provide: FEATURE_REPOSITORY,
  useFactory: (prismaService: PrismaService) => {
    return new FeaturePostgresRepository(prismaService);
  },
  inject: [PrismaService],
}
```

**Step 6: Implement Service**

```typescript
// src/modules/feature-name/feature.service.ts
@Injectable()
export class FeatureService {
  constructor(
    @Inject(FEATURE_REPOSITORY) private featureRepository: IFeatureRepository
  ) {}

  async create(createFeatureDto: CreateFeatureDto) {
    return this.featureRepository.create(createFeatureDto);
  }
}
```

**Step 7: Implement Controller**

```typescript
// src/modules/feature-name/feature.controller.ts
@Controller('features')
export class FeatureController {
  constructor(private featureService: FeatureService) {}

  @Post()
  @UseGuards(JwtUserGuard)
  async create(@Body() createFeatureDto: CreateFeatureDto) {
    return this.featureService.create(createFeatureDto);
  }
}
```

### 3. Database Operations

#### PostgreSQL (Prisma)

```bash
# Generate Prisma client after schema changes
npm run prisma:generate

# Create and apply migration
npm run prisma:migrate

# Reset database (development only)
npm run prisma:reset

# Seed database
npm run prisma:seed

# Open Prisma Studio
npm run prisma:studio
```

#### MongoDB (Mongoose)

```bash
# Start MongoDB service
mongod

# Connect to MongoDB shell
mongo

# Database operations are handled through Mongoose models
```

### 4. Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run test coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

### 5. Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type checking
npx tsc --noEmit
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues

**Problem**: Cannot connect to database
**Solutions**:

- Check `DATABASE_URL` or `MONGODB_URI` in `.env`
- Ensure database server is running
- Verify database credentials and permissions
- Check firewall settings

#### 2. JWT Secret Missing

**Problem**: `JWT_SECRET is not defined in environment variables`
**Solution**: Add `JWT_SECRET` to your `.env` file

```env
JWT_SECRET=your-super-secret-jwt-key-here
```

#### 3. Prisma Client Not Generated (MongoDB-Only Users)

**Problem**: `Cannot find module '@prisma/client'` even when using MongoDB only
**Explanation**: The application imports Prisma types for TypeScript compilation, even in MongoDB mode
**Solution**: This is now handled automatically by the `postinstall` script. For manual generation:

```bash
npm run prisma:generate
```

**Note**: You do NOT need to run `prisma migrate` for MongoDB - only `prisma generate` is required for TypeScript compilation.

#### 4. Port Already in Use

**Problem**: `EADDRINUSE: address already in use :::3000`
**Solutions**:

- Change port in `.env`: `PORT=3001`
- Kill process using port: `kill -9 $(lsof -ti:3000)`

#### 5. Module Import Errors

**Problem**: Circular dependency or module not found
**Solutions**:

- Check import paths
- Ensure proper module exports
- Use `forwardRef()` for circular dependencies

#### 6. Validation Errors

**Problem**: Request validation fails
**Solutions**:

- Check DTO definitions
- Ensure all required fields are provided
- Verify data types match DTO expectations

### Debug Mode

```bash
# Start in debug mode
npm run start:debug

# Debug tests
npm run test:debug
```

### Logging

The application includes comprehensive logging:

- **Error Logging**: All errors are logged with stack traces
- **Request Logging**: HTTP requests and responses
- **Database Logging**: Database queries (in development)

### Performance Monitoring

- **Health Checks**: `/health` endpoint
- **Metrics**: `/metrics` endpoint (Prometheus format)
- **Rate Limiting**: Automatic throttling

---

## Additional Resources

### Documentation Links

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Passport JWT Documentation](http://www.passportjs.org/packages/passport-jwt/)

### Development Tools

- **Prisma Studio**: Database GUI (`npm run prisma:studio`)
- **Swagger UI**: API documentation (`/api/docs`)
- **Health Check**: Application status (`/health`)
- **Metrics**: Application metrics (`/metrics`)

### Best Practices

1. **Always use DTOs** for request/response validation
2. **Implement proper error handling** with try-catch blocks
3. **Use repository pattern** for database abstraction
4. **Write unit tests** for business logic
5. **Use environment variables** for configuration
6. **Implement proper logging** for debugging
7. **Follow naming conventions** for consistency
8. **Use guards and interceptors** for cross-cutting concerns

---

**Version**: 1.0.0
**Last Updated**: 2024
**Maintained by**: Development Team

This document provides a comprehensive guide for developers working with this NestJS application. For additional support or questions, please refer to the project repository or contact the development team.
