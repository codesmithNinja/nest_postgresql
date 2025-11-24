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
- **Internationalization (i18n)**: Multi-language support (English, Spanish, French, Arabic)
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
├── i18n/               # Internationalization (en, es, fr, ar)
├── metrics/            # Application metrics
├── modules/            # Feature modules
│   ├── auth/          # Authentication module
│   ├── users/         # User management
│   ├── adminModules/  # Admin functionality
│   │   ├── currencies/# Currencies management
│   │   ├── countries/ # Countries management
│   │   ├── email-templates/ # Email templates management
│   │   ├── languages/ # Languages management
│   │   ├── manage-dropdown/ # Master dropdown management
│   │   ├── meta-settings/ # Meta settings management
│   │   ├── revenue-subscriptions/ # Revenue subscriptions management
│   │   ├── settings/  # Settings management
│   │   └── sliders/   # Sliders management
│   ├── campaignModules/ # Campaign management functionality
│   │   ├── team-member/ # Team members for campaigns
│   │   ├── lead-investor/ # Lead investors for campaigns
│   │   ├── campaign-faq/ # FAQ management for campaigns
│   │   ├── extras-image/ # Extra images for campaigns
│   │   ├── extras-video/ # Extra videos for campaigns
│   │   └── extras-document/ # Extra documents for campaigns
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

The Settings Module provides a **fully dynamic configuration system** that revolutionizes how application settings are managed:

**🔧 Core Dynamic Capabilities:**

- **✅ Unlimited Dynamic Fields**: Accept ANY JSON field names without validation restrictions or predefined schemas
- **✅ Mixed Data Type Support**: Store actual booleans, numbers, and strings (not string representations)
- **✅ Smart Type Handling**: `undefined` → empty string, preserves boolean/number types automatically
- **✅ File Upload Integration**: Mixed form-data support with text fields + file uploads seamlessly
- **✅ Unlimited Group Types**: Support for any custom groupType categories (site_setting, amount_setting, etc.)
- **✅ Zero Validation Constraints**: No schema restrictions - accepts everything dynamically

**📊 Data Type Examples:**

```json
{
  "siteName": "My Company", // → string
  "enableFeature": true, // → boolean (actual boolean, not "true")
  "maxUsers": 1000, // → number (actual number, not "1000")
  "customSetting": "any value", // → string
  "undefinedValue": undefined // → "" (empty string)
}
```

**🔄 Mixed Form-Data Support:**

```
POST /settings/site_setting/admin
Content-Type: multipart/form-data

siteName=My Company                   (text field)
enableNotifications=true              (boolean field)
maxUsers=500                         (number field)
siteLogo=@logo.png                   (file upload)
favicon=@icon.ico                    (file upload)
```

**🏗️ Technical Architecture:**

- **MongoDB Mixed Schema**: Uses `Schema.Types.Mixed` for flexible data storage
- **Dynamic DTO**: `Record<string, unknown>` bypasses all validation constraints
- **Type Preservation**: Smart value conversion maintains original data types
- **Node-cache Caching**: In-memory caching for optimal performance
- **Public/Admin Access**: Separate endpoints for public and admin access
- **Internationalization**: Multi-language error messages and responses

**📂 Supported Group Types:**

```
site_setting       - Site configuration (colors, name, features)
amount_setting     - Investment amounts and currency settings
revenue_setting    - Revenue sharing and payout configuration
email_setting      - SMTP and email configuration
api_setting        - API keys and credentials
custom_group_*     - Any custom group type you create
```

### Feature Module Example: CurrenciesModule

```typescript
// src/modules/admin-modules/currencies/currencies.module.ts
@Module({
  imports: [
    ConfigModule, // Access to environment variables
    MongooseModule.forFeature([
      { name: Currency.name, schema: CurrencySchema },
    ]), // MongoDB schema registration
    I18nModule, // Internationalization
  ],
  controllers: [CurrenciesController], // HTTP endpoints
  providers: [
    CurrenciesService, // Business logic
    PrismaService, // PostgreSQL service
    I18nResponseService, // Response internationalization
    {
      provide: CURRENCY_REPOSITORY, // Repository injection token
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        currencyMongoRepository: CurrencyMongoRepository
      ) => {
        const databaseType = configService.get<string>('DATABASE_TYPE');
        if (databaseType === 'mongodb') {
          return currencyMongoRepository;
        }
        return new CurrencyPostgresRepository(prismaService);
      },
      inject: [ConfigService, PrismaService, CurrencyMongoRepository],
    },
    CurrencyMongoRepository, // MongoDB repository implementation
  ],
  exports: [CurrenciesService, CURRENCY_REPOSITORY], // Available to other modules
})
export class CurrenciesModule {}
```

#### Currencies Module Features

- **Multi-Currency Support**: Manage application currencies with ISO codes and symbols
- **Use Count Tracking**: Automatic tracking of currency usage across the system
- **Dual Database Support**: MongoDB and PostgreSQL repository implementations
- **Bulk Operations**: Bulk activate, deactivate, and delete with business rule enforcement
- **Public/Admin Endpoints**: Separate access levels for frontend and admin use
- **Validation**: Strict typing with ISO currency codes (3 letters), unique names and codes
- **Caching System**: Node-cache in-memory caching for optimal performance
- **Business Rules**: Prevent deletion of currencies with useCount > 0
- **Internationalization**: Multi-language error messages and responses

#### Currencies Repository Pattern

```typescript
// Interface definition
export interface ICurrencyRepository extends IRepository<Currency> {
  findForPublic(): Promise<Currency[]>;
  findCurrenciesWithPagination(
    page: number,
    limit: number,
    includeInactive?: boolean
  ): Promise<{
    data: Currency[];
    total: number;
    page: number;
    limit: number;
  }>;
  findByPublicId(publicId: string): Promise<Currency | null>;
  findByCode(code: string): Promise<Currency | null>;
  findByName(name: string): Promise<Currency | null>;
  updateByPublicId(
    publicId: string,
    updateDto: Partial<Currency>
  ): Promise<Currency>;
  deleteByPublicId(publicId: string): Promise<boolean>;
  incrementUseCount(publicId: string): Promise<void>;
  decrementUseCount(publicId: string): Promise<void>;
  bulkOperation(bulkDto: BulkCurrencyOperationDto): Promise<number>;
  isInUse(publicId: string): Promise<boolean>;
}

// Usage in service
export class CurrenciesService {
  constructor(
    @Inject(CURRENCY_REPOSITORY)
    private currencyRepository: ICurrencyRepository,
    private cache: NodeCache
  ) {}

  async getPublicCurrencies(): Promise<Currency[]> {
    // Try cache first, then repository
    const cached = this.cache.get<Currency[]>('currencies:public');
    if (cached) return cached;

    const currencies = await this.currencyRepository.findForPublic();
    this.cache.set('currencies:public', currencies, 300); // 5 minutes
    return currencies;
  }
}
```

#### Business Logic Implementation

```typescript
// Currency creation with validation
async createCurrency(createDto: CreateCurrencyDto): Promise<Currency> {
  // Check for duplicate name
  const existingByName = await this.currencyRepository.findByName(createDto.name);
  if (existingByName) {
    throw new CurrencyAlreadyExistsException('name', createDto.name);
  }

  // Check for duplicate code
  const existingByCode = await this.currencyRepository.findByCode(createDto.code);
  if (existingByCode) {
    throw new CurrencyAlreadyExistsException('code', createDto.code);
  }

  // Create currency with auto-generated UUID
  const currency = await this.currencyRepository.insert(createDto);

  // Clear relevant caches
  this.clearCurrencyCaches();

  return currency;
}

// Bulk operations with business rules
async bulkOperation(bulkDto: BulkCurrencyOperationDto): Promise<number> {
  // For delete operations, check use count
  if (bulkDto.action === 'delete') {
    for (const publicId of bulkDto.publicIds) {
      const currency = await this.currencyRepository.findByPublicId(publicId);
      if (currency && currency.useCount > 0) {
        throw new BulkCurrencyOperationException(
          bulkDto.action,
          `Currency ${currency.name} is in use (useCount: ${currency.useCount})`
        );
      }
    }
  }

  // Perform bulk operation
  const affectedCount = await this.currencyRepository.bulkOperation(bulkDto);

  // Clear caches
  this.clearCurrencyCaches();

  return affectedCount;
}
```

#### Cache Management

```typescript
// Comprehensive caching strategy
private readonly cachePrefix = 'currencies';
private readonly cacheTTL = 300; // 5 minutes

// Cache keys used:
// - currencies:public - Active currencies for public use
// - currencies:admin:page:limit:includeInactive - Admin pagination
// - currencies:single:publicId - Individual currency details

private clearCurrencyCaches(): void {
  const keys = this.cache.keys();
  const currencyKeys = keys.filter((key) => key.startsWith(this.cachePrefix));

  if (currencyKeys.length > 0) {
    currencyKeys.forEach((key) => this.cache.del(key));
    this.logger.debug(`Cleared ${currencyKeys.length} currency cache entries`);
  }
}
```

### Feature Module Example: LanguagesModule

```typescript
// src/modules/admin-modules/languages/languages.module.ts
@Module({
  imports: [
    ConfigModule, // Access to environment variables
    MongooseModule.forFeature([
      { name: Language.name, schema: LanguageSchema },
    ]), // MongoDB schema registration
    AdminUsersModule, // Admin authentication
  ],
  controllers: [LanguagesController], // HTTP endpoints
  providers: [
    LanguagesService, // Business logic
    PrismaService, // PostgreSQL service
    I18nResponseService, // Response internationalization
    {
      provide: LANGUAGES_REPOSITORY, // Repository injection token
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        languagesMongodbRepository: LanguagesMongodbRepository
      ) => {
        const databaseType = configService.get<string>('DATABASE_TYPE');
        if (databaseType === 'mongodb') {
          return languagesMongodbRepository;
        }
        return new LanguagesPostgresRepository(prismaService);
      },
      inject: [ConfigService, PrismaService, LanguagesMongodbRepository],
    },
    LanguagesMongodbRepository, // MongoDB repository implementation
  ],
  exports: [LanguagesService, LANGUAGES_REPOSITORY], // Available to other modules
})
export class LanguagesModule {}
```

#### Languages Module Features

- **Multi-Language Support**: Manage application languages and locales
- **Flag Image Upload**: Handle flag image files with validation and AWS/local storage
- **Default Language Logic**: Automatic handling of single default language constraint
- **Dual Database Support**: MongoDB and PostgreSQL repository implementations
- **Bulk Operations**: Bulk update and delete with business rule enforcement
- **Public/Admin Endpoints**: Separate access levels for frontend and admin use
- **Validation**: Strict typing with ISO codes, direction, and status validation
- **File Management**: Upload, update, and cleanup of flag image files

#### Settings Repository Pattern

The Settings Repository supports dynamic data handling with mixed data types:

```typescript
// Interface definition with mixed type support
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

// Settings entity with mixed data type support
export interface Settings {
  id: string;
  publicId: string;
  groupType: string;
  key: string;
  value: string | number | boolean; // Mixed data types
  description?: string;
  type: RecordType; // STRING, NUMBER, BOOLEAN, FILE
  createdAt: Date;
  updatedAt: Date;
}

// Usage in service with dynamic field handling
export class SettingsService {
  constructor(
    @Inject(SETTINGS_REPOSITORY)
    private settingsRepository: ISettingsRepository,
    private fileManagementService: FileManagementService
  ) {}

  async createOrUpdateSettings(
    groupType: string,
    formData: Record<string, string | number | boolean | Express.Multer.File>
  ): Promise<Settings[]> {
    const settingsToUpsert: CreateSettingsData[] = [];

    // Process each dynamic field
    for (const [key, value] of Object.entries(formData)) {
      let finalValue: string | number | boolean;
      let recordType: RecordType;

      if (value instanceof Object && 'buffer' in value) {
        // Handle file upload
        const fileResult =
          await this.fileManagementService.uploadSettingsFile(value);
        finalValue = fileResult.filePath;
        recordType = RecordType.FILE;
      } else {
        // Handle primitive values with type preservation
        if (typeof value === 'boolean') {
          finalValue = value;
          recordType = RecordType.BOOLEAN;
        } else if (typeof value === 'number') {
          finalValue = value;
          recordType = RecordType.NUMBER;
        } else {
          finalValue = value === undefined ? '' : String(value);
          recordType = RecordType.STRING;
        }
      }

      settingsToUpsert.push({
        groupType,
        key,
        value: finalValue,
        type: recordType,
        publicId: crypto.randomUUID(),
      });
    }

    return this.settingsRepository.bulkUpsert(settingsToUpsert);
  }
}
```

#### File Upload Integration

The Settings module handles mixed form-data with seamless file and text field integration:

```typescript
// Controller handling dynamic form data with files
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
  @Body() body: Record<string, unknown>,
  @UploadedFiles() files?: Express.Multer.File[]
) {
  // Combine text data and files into a single dynamic object
  const formData: Record<string, string | number | boolean | Express.Multer.File> = {};

  // Process text fields with type preservation
  Object.entries(body).forEach(([key, value]) => {
    let finalValue: string | number | boolean;
    if (value === undefined || value === null) {
      finalValue = '';
    } else if (typeof value === 'boolean') {
      finalValue = value; // Preserve boolean type
    } else if (typeof value === 'number') {
      finalValue = value; // Preserve number type
    } else if (typeof value === 'string') {
      finalValue = value === 'undefined' ? '' : value;
    } else {
      finalValue = JSON.stringify(value);
    }
    formData[key] = finalValue;
  });

  // Add files using their field names as keys
  files?.forEach((file) => {
    if (file.fieldname) {
      formData[file.fieldname] = file;
    }
  });

  return this.settingsService.createOrUpdateSettings(params.groupType, formData);
}

// Example: Mixed form-data handling
// POST /settings/site_setting/admin
// Content-Type: multipart/form-data
//
// Fields:
// - siteName=My Website (string)
// - enableFeatures=true (boolean)
// - maxUsers=100 (number)
// - siteLogo=@logo.png (file)
// - favicon=@favicon.ico (file)
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
│   ├── CurrenciesModule
│   │   ├── ConfigModule
│   │   ├── DatabaseModule
│   │   └── I18nModule
│   └── SettingsModule
│       ├── ConfigModule
│       ├── DatabaseModule
│       ├── FileManagementModule
│       └── I18nModule
└── [Other Business Modules]
```

### Feature Module Example: SlidersModule

```typescript
// src/modules/admin-modules/sliders/sliders.module.ts
@Module({
  imports: [
    ConfigModule, // Access to environment variables
    MongooseModule.forFeature([
      { name: Slider.name, schema: SliderSchema },
      { name: Language.name, schema: LanguageSchema },
    ]), // MongoDB schema registration
    AdminUsersModule, // For admin authentication
    FileUploadModule, // For slider image upload utilities
  ],
  controllers: [SlidersController], // HTTP endpoints
  providers: [
    SlidersService, // Business logic
    PrismaService, // PostgreSQL service
    I18nResponseService, // Response internationalization
    {
      provide: SLIDERS_REPOSITORY, // Repository injection token
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        sliderMongodbRepository: SliderMongodbRepository
      ) => {
        const databaseType = configService.get<string>('DATABASE_TYPE');
        if (databaseType === 'mongodb') {
          return sliderMongodbRepository;
        }
        return new SliderPostgresRepository(prismaService);
      },
      inject: [ConfigService, PrismaService, SliderMongodbRepository],
    },
    {
      provide: LANGUAGES_REPOSITORY, // Language repository for validation
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        languagesMongodbRepository: LanguagesMongodbRepository
      ) => {
        const databaseType = configService.get<string>('DATABASE_TYPE');
        if (databaseType === 'mongodb') {
          return languagesMongodbRepository;
        }
        return new LanguagesPostgresRepository(prismaService);
      },
      inject: [ConfigService, PrismaService, LanguagesMongodbRepository],
    },
    SliderMongodbRepository, // MongoDB repository implementation
    LanguagesMongodbRepository, // Languages repository for validation
  ],
  exports: [SlidersService, SLIDERS_REPOSITORY], // Available to other modules
})
export class SlidersModule {}
```

#### Sliders Module Features

- **Multi-Language Slider Management**: Create sliders that replicate across all active languages
- **Unique Code System**: Auto-generated 10-digit unique codes shared across language variants
- **Image Upload Support**: File upload with AWS S3 and local storage support
- **Color Customization**: Custom color options for title, description, and buttons with hex validation
- **URL Validation**: Support for both absolute URLs and relative paths for button links
- **Dual Database Support**: MongoDB and PostgreSQL repository implementations
- **Public/Admin Endpoints**: Separate access levels for frontend and admin use
- **Bulk Operations**: Bulk activate, deactivate, and delete with comprehensive validation
- **Multi-Language Creation**: Automatically creates slider entries in all active languages
- **File Management**: Automatic file cleanup on slider deletion
- **Business Logic**: Comprehensive validation for colors, URLs, and required fields
- **Internationalization**: Multi-language error messages and responses (EN, ES, FR, AR)

#### Sliders Repository Pattern

```typescript
// Interface definition
export interface ISliderRepository extends IRepository<Slider> {
  findForPublic(languageId: string): Promise<SliderWithLanguage[]>;
  findByLanguage(
    languageId: string,
    includeInactive?: boolean
  ): Promise<SliderWithLanguage[]>;
  findWithPaginationByLanguage(
    page: number,
    limit: number,
    languageId: string,
    includeInactive?: boolean
  ): Promise<PaginatedResult<SliderWithLanguage>>;
  findByPublicId(publicId: string): Promise<SliderWithLanguage | null>;
  findByUniqueCode(uniqueCode: number): Promise<SliderWithLanguage[]>;
  createMultiLanguage(
    createDto: CreateSliderDto,
    languageIds: string[]
  ): Promise<Slider[]>;
  updateById(id: string, updateDto: Partial<Slider>): Promise<Slider>;
  deleteByUniqueCode(uniqueCode: number): Promise<number>;
  bulkUpdateByPublicIds(
    publicIds: string[],
    updateDto: Partial<Slider>
  ): Promise<{ count: number }>;
  bulkDeleteByPublicIds(publicIds: string[]): Promise<{ count: number }>;
  generateUniqueCode(): Promise<number>;
  getDefaultLanguageId(): Promise<string>;
  getAllActiveLanguageIds(): Promise<string[]>;
}

// Usage in service with multi-language support
export class SlidersService {
  constructor(
    @Inject(SLIDERS_REPOSITORY)
    private sliderRepository: ISliderRepository,
    @Inject(LANGUAGES_REPOSITORY)
    private languagesRepository: ILanguagesRepository,
    private i18nResponse: I18nResponseService
  ) {}

  async createSlider(
    createDto: CreateSliderDto,
    file?: Express.Multer.File
  ): Promise<SliderResponseDto> {
    // Handle file upload
    const filePath = await this.handleFileUpload(null, file, false);

    // Auto-generate unique 10-digit code
    const uniqueCode = await this.sliderRepository.generateUniqueCode();

    // Get all active language IDs for multi-language replication
    const allLanguageIds =
      await this.sliderRepository.getAllActiveLanguageIds();

    // Create slider entries for all active languages
    const createdSliders = await this.sliderRepository.createMultiLanguage(
      createData,
      allLanguageIds
    );

    return this.transformToResponseDto(createdSliders[0]);
  }
}
```

### Feature Module Example: MetaSettingsModule

```typescript
// src/modules/admin-modules/meta-settings/meta-settings.module.ts
@Module({
  imports: [
    ConfigModule, // Access to environment variables
    MongooseModule.forFeature([
      { name: MetaSetting.name, schema: MetaSettingSchema },
      { name: Language.name, schema: LanguageSchema },
    ]), // MongoDB schema registration
    AdminUsersModule, // For admin authentication
    FileUploadModule, // For OG image upload utilities
  ],
  controllers: [MetaSettingsController], // HTTP endpoints
  providers: [
    MetaSettingsService, // Business logic
    PrismaService, // PostgreSQL service
    I18nResponseService, // Response internationalization
    {
      provide: META_SETTING_REPOSITORY, // Repository injection token
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        metaSettingMongodbRepository: MetaSettingMongodbRepository
      ) => {
        const databaseType = configService.get<string>('DATABASE_TYPE');
        if (databaseType === 'mongodb') {
          return metaSettingMongodbRepository;
        }
        return new MetaSettingPostgresRepository(prismaService);
      },
      inject: [ConfigService, PrismaService, MetaSettingMongodbRepository],
    },
    {
      provide: LANGUAGES_REPOSITORY, // Language repository for validation
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        languagesMongodbRepository: LanguagesMongodbRepository
      ) => {
        const databaseType = configService.get<string>('DATABASE_TYPE');
        if (databaseType === 'mongodb') {
          return languagesMongodbRepository;
        }
        return new LanguagesPostgresRepository(prismaService);
      },
      inject: [ConfigService, PrismaService, LanguagesMongodbRepository],
    },
    MetaSettingMongodbRepository, // MongoDB repository implementation
    LanguagesMongodbRepository, // Languages repository for validation
  ],
  exports: [MetaSettingsService, META_SETTING_REPOSITORY], // Available to other modules
})
export class MetaSettingsModule {}
```

#### Meta Settings Module Features

- **SEO & Social Media Optimization**: Manage meta titles, descriptions, keywords, and OpenGraph data
- **Multi-Language Support**: Create meta settings that work across all active languages
- **OG Image Management**: Upload and manage OpenGraph images with language-specific variants
- **AI Generated Image Tracking**: Flag whether OG images are AI-generated or manually created
- **Dual Database Support**: MongoDB and PostgreSQL repository implementations
- **Public/Admin Endpoints**: Language-specific frontend access and admin management
- **File Upload Integration**: Support for OG image upload with S3 and local storage
- **Comprehensive Validation**: SEO-optimized field length validation (meta title 1-300, description 1-500)
- **Business Logic**: Auto-creation across all languages, language-specific file naming
- **Internationalization**: Multi-language error messages and responses (EN, ES, FR, AR)

#### Meta Settings Repository Pattern

```typescript
// Interface definition
export interface IMetaSettingRepository extends IRepository<MetaSetting> {
  findByLanguageId(languageId: string): Promise<MetaSetting | null>;
  findByLanguageIdWithLanguage(languageId: string): Promise<MetaSettingWithLanguage | null>;
  findByPublicIdWithLanguage(publicId: string): Promise<MetaSettingWithLanguage | null>;
  existsByLanguageId(languageId: string): Promise<boolean>;
  getAllActiveLanguageIds(): Promise<string[]>;
  getDefaultLanguageId(): Promise<string>;
  getLanguageByCode(code: string): Promise<{ id: string } | null>;
  updateByPublicId(publicId: string, data: Partial<MetaSetting>): Promise<void>;
}
```

#### Meta Settings Service Logic

```typescript
// Multi-language meta setting creation
async createMetaSettings(
  createDto: CreateMetaSettingDto,
  file?: Express.Multer.File
): Promise<MetaSettingResponseDto> {
  // Get all active languages for universal creation
  const allLanguages = await this.metaSettingRepository.getAllActiveLanguageIds();

  // Handle OG image upload for all languages
  if (file) {
    const uploadResult = await FileUploadUtil.uploadFileForLanguages(
      file,
      { bucketName: getBucketName('META'), allowedMimeTypes: ['image/jpeg', 'image/png'], maxSizeInMB: 5 },
      uniqueCode,
      languageCodes
    );
  }

  // Create meta settings for each active language
  const createdMetaSettings = [];
  for (const languageId of allLanguages) {
    const created = await this.metaSettingRepository.insert({
      languageId,
      siteName: createDto.siteName,
      metaTitle: createDto.metaTitle,
      // ... other fields
    });
    createdMetaSettings.push(created);
  }

  return this.transformToResponseDto(defaultMetaSetting);
}
```

### Feature Module Example: EmailTemplatesModule

```typescript
// src/modules/admin-modules/email-templates/email-templates.module.ts
@Module({
  imports: [
    ConfigModule, // Access to environment variables
    MongooseModule.forFeature([
      { name: EmailTemplate.name, schema: EmailTemplateSchema },
      { name: Language.name, schema: LanguageSchema },
    ]), // MongoDB schema registration
    AdminUsersModule, // For admin authentication
  ],
  controllers: [EmailTemplatesController], // HTTP endpoints
  providers: [
    EmailTemplatesService, // Business logic
    PrismaService, // PostgreSQL service
    I18nResponseService, // Response internationalization
    {
      provide: EMAIL_TEMPLATE_REPOSITORY, // Repository injection token
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        emailTemplateMongodbRepository: EmailTemplateMongodbRepository
      ) => {
        const databaseType = configService.get<string>('DATABASE_TYPE');
        if (databaseType === 'mongodb') {
          return emailTemplateMongodbRepository;
        }
        return new EmailTemplatePostgresRepository(prismaService);
      },
      inject: [ConfigService, PrismaService, EmailTemplateMongodbRepository],
    },
    {
      provide: LANGUAGES_REPOSITORY, // Language repository for validation
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        languagesMongodbRepository: LanguagesMongodbRepository
      ) => {
        const databaseType = configService.get<string>('DATABASE_TYPE');
        if (databaseType === 'mongodb') {
          return languagesMongodbRepository;
        }
        return new LanguagesPostgresRepository(prismaService);
      },
      inject: [ConfigService, PrismaService, LanguagesMongodbRepository],
    },
    EmailTemplateMongodbRepository, // MongoDB repository implementation
    LanguagesMongodbRepository, // Languages repository for validation
  ],
  exports: [EmailTemplatesService, EMAIL_TEMPLATE_REPOSITORY], // Available to other modules
})
export class EmailTemplatesModule {}
```

#### Email Templates Module Features

- **Task-Based Organization**: Email templates organized by immutable task identifiers (account_activation, password_reset, etc.)
- **Multi-Language Support**: One email template per active language with automatic language resolution
- **HTML Email Content**: Full HTML support with template variable substitution for rich email formatting
- **Sender Configuration**: Configurable sender details (email, reply-to, sender name) per template
- **Immutable Task Field**: Task identifier cannot be modified after creation to ensure template consistency
- **Dual Database Support**: MongoDB and PostgreSQL repository implementations with type-safe transformations
- **Public/Admin Endpoints**: Language-specific frontend access and comprehensive admin management
- **Bulk Operations**: Efficient bulk status updates for multiple templates simultaneously
- **Performance Caching**: NodeCache integration with 5-minute TTL for optimal performance
- **Comprehensive Validation**: Email format, content length, task format validation with multilingual error messages
- **Status Management**: Active/inactive status control with business logic validation
- **Internationalization**: Multi-language error messages and responses (EN, ES, FR, AR)

#### Email Templates Repository Pattern

```typescript
// Interface definition
export interface IEmailTemplateRepository extends IRepository<EmailTemplate> {
  findByLanguageId(languageId: string): Promise<EmailTemplate | null>;
  findByTaskAndLanguageId(task: string, languageId: string): Promise<EmailTemplate | null>;
  findByLanguageIdWithLanguage(languageId: string): Promise<EmailTemplateWithLanguage | null>;
  findByPublicIdWithLanguage(publicId: string): Promise<EmailTemplateWithLanguage | null>;
  existsByTaskAndLanguageId(task: string, languageId: string): Promise<boolean>;
  findActiveTemplatesByLanguage(languageCode: string): Promise<EmailTemplate[]>;
  bulkUpdateStatus(publicIds: string[], status: boolean): Promise<void>;
  getAllActiveLanguageIds(): Promise<string[]>;
}

// PostgreSQL Implementation
export class EmailTemplatePostgresRepository implements IEmailTemplateRepository {
  constructor(private prisma: PrismaService) {}

  async findByTaskAndLanguageId(task: string, languageId: string): Promise<EmailTemplate | null> {
    const emailTemplate = await this.prisma.emailTemplate.findFirst({
      where: { task, languageId },
      include: { language: true },
    });
    return emailTemplate ? this.toEntity(emailTemplate) : null;
  }

  // ... other methods with Prisma-specific implementation
}

// MongoDB Implementation
export class EmailTemplateMongodbRepository implements IEmailTemplateRepository {
  constructor(@InjectModel(EmailTemplate.name) private emailTemplateModel: Model<EmailTemplateDocument>) {}

  async findByTaskAndLanguageId(task: string, languageId: string): Promise<EmailTemplate | null> {
    const emailTemplate = await this.emailTemplateModel
      .findOne({ task, languageId })
      .populate('language')
      .exec();
    return emailTemplate ? this.toEntity(emailTemplate) : null;
  }

  // ... other methods with Mongoose-specific implementation and type transformations
}
```

#### Email Templates Service Business Logic

```typescript
// Key service methods showcasing business logic
export class EmailTemplatesService {
  async createEmailTemplate(createDto: CreateEmailTemplateDto): Promise<EmailTemplateResponseDto> {
    // Validate email template data
    this.validateEmailTemplateData(createDto);

    // Validate task format (immutable field)
    this.validateTaskField(createDto.task);

    // Resolve language (supports both publicId and primary key)
    const language = await this.resolveLanguage(createDto.languageId);

    // Check for existing template with same task and language
    const existingTemplate = await this.emailTemplateRepository.findByTaskAndLanguageId(
      createDto.task,
      language.id
    );

    if (existingTemplate) {
      throw new EmailTemplateAlreadyExistsForLanguageException();
    }

    // Create template with validated data
    const emailTemplate = await this.emailTemplateRepository.create({
      ...createDto,
      languageId: language.id,
      publicId: generateUUID(),
    });

    // Clear cache for affected language
    this.clearLanguageCache(language.id);

    return this.transformToResponseDto(emailTemplate);
  }

  private validateTaskField(task: string): void {
    const taskRegex = /^[a-zA-Z0-9_]{3,100}$/;
    if (!taskRegex.test(task)) {
      throw new InvalidEmailTemplateTaskFormatException();
    }
  }

  private validateEmailTemplateData(data: CreateEmailTemplateDto | UpdateEmailTemplateDto): void {
    if (!this.isValidEmail(data.senderEmail)) {
      throw new InvalidSenderEmailException();
    }
    if (!this.isValidEmail(data.replyEmail)) {
      throw new InvalidReplyEmailException();
    }
    // ... additional validation logic
  }
}
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

## Internationalization (i18n)

### Supported Languages

The application provides comprehensive multi-language support with the following languages:

- **English (en)** - Default/fallback language
- **Spanish (es)** - Complete translation support
- **French (fr)** - Complete translation support
- **Arabic (ar)** - Complete translation support with RTL considerations

### Translation Files Structure

```
src/i18n/locales/
├── en/translations.json    # English translations
├── es/translations.json    # Spanish translations
├── fr/translations.json    # French translations
└── ar/translations.json    # Arabic translations
```

### Translation Categories

Each language file contains organized translation keys for:

- **auth**: Authentication messages (login, register, tokens)
- **user**: User management messages
- **validation**: Form validation messages
- **common**: General system messages
- **campaign**: Campaign-related messages
- **currencies**: Currencies module messages
- **languages**: Languages module messages
- **countries**: Countries module messages
- **settings**: Settings module messages
- **admin**: Admin-specific messages

### Usage Examples

```typescript
// In services using I18nResponseService
return this.i18nResponse.success('languages.created', 201, language);
return this.i18nResponse.error('languages.not_found', 404);
return this.i18nResponse.success('currencies.created', 201, currency);
return this.i18nResponse.error('currencies.not_found', 404);

// Parameterized translations
return this.i18nResponse.error('validation.required_field', 400, null, {
  field: 'name',
});
```

### Language Detection

- Uses `lang` query parameter from any APIs called.
- Falls back to English for missing translation keys
- Cached translation loading for optimal performance
- Language persistence through request interceptors

### Arabic Language Support

Arabic language support includes:

- Complete translation coverage for all modules
- RTL (Right-to-Left) language direction support
- Proper Arabic text formatting and cultural considerations
- Integrated with the Languages management module for dynamic configuration

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

#### Master Dropdown Management Endpoints

```
# Public endpoints (no authentication required)
GET    /manage-dropdown/:dropdownType/front      # Get active dropdown options by type

# Admin endpoints (require admin authentication)
GET    /manage-dropdown/:dropdownType/admin      # Get dropdown options with pagination
POST   /manage-dropdown/:dropdownType            # Create new dropdown option
GET    /manage-dropdown/:dropdownType/:publicId  # Get single dropdown option
PATCH  /manage-dropdown/:dropdownType/:publicId  # Update dropdown option
DELETE /manage-dropdown/:dropdownType/:uniqueCode  # Delete dropdown option (all language variants)
PATCH  /manage-dropdown/:dropdownType/bulk-update # Bulk update dropdown option status
PATCH  /manage-dropdown/:dropdownType/bulk-delete # Bulk delete dropdown options (useCount must be 0)
```

#### Countries Management Endpoints

```
# Public endpoints (no authentication required)
GET    /countries/front                          # Get active countries

# Admin endpoints (require admin authentication)
GET    /countries                                # Get all countries with pagination
GET    /countries/:publicId                      # Get single country
POST   /countries                                # Create new country with flag upload
PATCH  /countries/:publicId                      # Update country with optional flag upload
DELETE /countries/:publicId                      # Delete country
PATCH  /countries/bulk-update                    # Bulk update country status
PATCH  /countries/bulk-delete                    # Bulk delete countries
```

#### Currencies Management Endpoints

```
# Public endpoints (no authentication required)
GET    /currencies/front                         # Get active currencies

# Admin endpoints (require admin authentication)
GET    /currencies                               # Get all currencies with pagination
GET    /currencies/:publicId                     # Get single currency
POST   /currencies                               # Create new currency
PATCH  /currencies/:publicId                     # Update currency
DELETE /currencies/:publicId                     # Delete currency (only if useCount is 0)
PATCH  /currencies/bulk-update                  # Bulk update currency status
PATCH  /currencies/bulk-delete                  # Bulk delete currencies (only if useCount is 0)
```

#### Admin Users Management Endpoints

```
# Admin endpoints (require admin authentication)
GET    /admins/me                                # Get current admin profile
GET    /admins                                   # Get all admins with pagination
POST   /admins                                   # Create new admin user
PATCH  /admins/:id                               # Update admin user
DELETE /admins/:id                               # Delete admin user
```

#### Revenue Subscriptions Management Endpoints

```
# Public endpoints (no authentication required)
GET    /revenue-subscriptions/front             # Get active revenue subscriptions

# Admin endpoints (require admin authentication)
GET    /revenue-subscriptions                   # Get all revenue subscriptions with pagination
GET    /revenue-subscriptions/:publicId         # Get single revenue subscription
POST   /revenue-subscriptions                   # Create new revenue subscription with language content
PATCH  /revenue-subscriptions/:publicId         # Update revenue subscription with optional language content
DELETE /revenue-subscriptions/:publicId         # Delete revenue subscription (only if useCount is 0)
PATCH  /revenue-subscriptions/bulk-update       # Bulk update revenue subscription status
PATCH  /revenue-subscriptions/bulk-delete       # Bulk delete revenue subscriptions (only if useCount is 0)
```

**Revenue Subscription Types**:

- **INVESTOR**: Subscription plans for investors with financial limits and market access
- **SPONSOR**: Subscription plans for sponsors with project capacity and goal limits

**Key Features**:

- **Dual Subscription Types**: INVESTOR and SPONSOR with conditional field validation
- **Financial Controls**: Amount limits, investment caps, project allowances
- **Policy Management**: Refund/cancellation policies with day limits
- **Feature Flags**: Secondary market access, early bird access
- **Multi-language Support**: Title and description in multiple languages
- **Use Count Tracking**: Safe deletion only when useCount is 0

#### Bulk Operations Pattern

All admin modules follow a consistent bulk operations pattern with standardized payload format:

**Standardized Bulk Update Payload**:

```json
{
  "publicIds": [
    "627a5038-e5be-4135-9569-404d50c836c1",
    "e4113de7-5388-4f24-a58c-a22fb77d00a8"
  ],
  "status": true
}
```

**Supported Bulk Operations**:

- **Bulk Update**: Updates status of multiple entities
- **Bulk Delete**: Deletes multiple entities (with business rule validation)

**Business Rules**:

- ✅ All modules use `publicIds` property (never `ids`)
- ✅ Bulk update only affects `status` field
- ✅ Bulk delete validates business constraints (useCount, isDefault, etc.)
- ✅ Operations are transactional and atomic
- ✅ Detailed error reporting for failed operations

#### Currencies API Examples

```bash
# Get public currencies (no authentication required)
curl -X GET "http://localhost:3000/currencies/front"

# Get public currencies with language filter
curl -X GET "http://localhost:3000/currencies/front?lang=en"

# Get paginated currencies for admin
curl -X GET "http://localhost:3000/currencies?page=1&limit=10&includeInactive=true" \
  -H "Authorization: Bearer <admin-token>"

# Create new currency (admin)
curl -X POST "http://localhost:3000/currencies" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "United States Dollar", "code": "USD", "symbol": "$", "status": true}'

# Update currency (admin)
curl -X PATCH "http://localhost:3000/currencies/uuid-here" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "US Dollar", "symbol": "$"}'

# Bulk update currency status (admin)
curl -X PATCH "http://localhost:3000/currencies/bulk-update" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"publicIds": ["627a5038-e5be-4135-9569-404d50c836c1", "e4113de7-5388-4f24-a58c-a22fb77d00a8"], "status": true}'

# Bulk delete currencies (admin - only if useCount is 0)
curl -X PATCH "http://localhost:3000/currencies/bulk-delete" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"publicIds": ["627a5038-e5be-4135-9569-404d50c836c1", "e4113de7-5388-4f24-a58c-a22fb77d00a8"]}'

# Delete currency (admin - only if useCount is 0)
curl -X DELETE "http://localhost:3000/currencies/uuid-here" \
  -H "Authorization: Bearer <admin-token>"
```

#### Manage Dropdown API Examples

```bash
# Get public dropdown options by type (no authentication required)
curl -X GET "http://localhost:3000/manage-dropdown/industry/front"

# Get public dropdown options with language filter
curl -X GET "http://localhost:3000/manage-dropdown/industry/front?lang=en"

# Get paginated dropdown options for admin
curl -X GET "http://localhost:3000/manage-dropdown/industry/admin?page=1&limit=10" \
  -H "Authorization: Bearer <admin-token>"

# Create new dropdown option (admin)
curl -X POST "http://localhost:3000/manage-dropdown/industry" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Technology", "uniqueCode": 1001, "isDefault": "NO"}'

# Update dropdown option (admin)
curl -X PATCH "http://localhost:3000/manage-dropdown/industry/uuid-here" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Technology", "status": true}'

# Bulk update dropdown status (admin)
curl -X PATCH "http://localhost:3000/manage-dropdown/industry/bulk-update" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"publicIds": ["627a5038-e5be-4135-9569-404d50c836c1", "e4113de7-5388-4f24-a58c-a22fb77d00a8"], "status": true}'

# Bulk delete dropdown options (admin - only if useCount is 0)
curl -X PATCH "http://localhost:3000/manage-dropdown/industry/bulk-delete" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"publicIds": ["627a5038-e5be-4135-9569-404d50c836c1", "e4113de7-5388-4f24-a58c-a22fb77d00a8"]}'
```

#### Countries API Examples

```bash
# Get public countries (no authentication required)
curl -X GET "http://localhost:3000/countries/front"

# Get public countries with language filter
curl -X GET "http://localhost:3000/countries/front?lang=en"

# Get paginated countries for admin
curl -X GET "http://localhost:3000/countries?page=1&limit=10" \
  -H "Authorization: Bearer <admin-token>"

# Create new country with flag upload (admin)
curl -X POST "http://localhost:3000/countries" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: multipart/form-data" \
  -F "name=United States" \
  -F "shortCode=US" \
  -F "flag=@./us-flag.png"

# Bulk update countries (admin)
curl -X PATCH "http://localhost:3000/countries/bulk-update" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"publicIds": ["627a5038-e5be-4135-9569-404d50c836c1", "e4113de7-5388-4f24-a58c-a22fb77d00a8"], "status": true}'
```

#### Admin Users API Examples

```bash
# Get current admin profile
curl -X GET "http://localhost:3000/admins/me" \
  -H "Authorization: Bearer <admin-token>"

# Get all admin users with pagination
curl -X GET "http://localhost:3000/admins?page=1&limit=10" \
  -H "Authorization: Bearer <admin-token>"

# Create new admin user
curl -X POST "http://localhost:3000/admins" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "John", "lastName": "Doe", "email": "admin@example.com", "password": "SecurePass123!"}'
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

#### Campaign Management Endpoints

```
# Team Members (require user authentication and campaign ownership)
GET    /team-member/:equityId             # Get all team members for campaign
POST   /team-member/:equityId             # Create team member with photo upload (multipart/form-data)
PATCH  /team-member/:equityId/:id         # Update team member with optional photo upload
DELETE /team-member/:equityId/:id         # Delete team member

# Lead Investors (require user authentication and campaign ownership)
GET    /lead-investor/:equityId           # Get all lead investors for campaign
POST   /lead-investor/:equityId           # Create lead investor with photo upload (multipart/form-data)
PATCH  /lead-investor/:equityId/:id       # Update lead investor with optional photo upload
DELETE /lead-investor/:equityId/:id       # Delete lead investor

# Campaign FAQ (require user authentication and campaign ownership)
GET    /campaign-faq/:equityId            # Get all FAQ entries for campaign
POST   /campaign-faq/:equityId            # Create new FAQ entry
PATCH  /campaign-faq/:equityId/:id        # Update FAQ entry
DELETE /campaign-faq/:equityId/:id        # Delete FAQ entry

# Extras Images (require user authentication and campaign ownership)
GET    /extras-image/:equityId            # Get all extra images for campaign
POST   /extras-image/:equityId            # Create extra image entry
PATCH  /extras-image/:equityId/:id        # Update extra image entry
DELETE /extras-image/:equityId/:id        # Delete extra image entry
POST   /extras-image/upload/image         # Upload image file (multipart/form-data)

# Extras Videos (require user authentication and campaign ownership)
GET    /extras-video/:equityId            # Get all extra videos for campaign
POST   /extras-video/:equityId            # Create extra video entry
PATCH  /extras-video/:equityId/:id        # Update extra video entry
DELETE /extras-video/:equityId/:id        # Delete extra video entry
POST   /extras-video/upload/video         # Upload video file (multipart/form-data)

# Extras Documents (require user authentication and campaign ownership)
GET    /extras-document/:equityId         # Get all extra documents for campaign
POST   /extras-document/:equityId         # Create extra document entry
PATCH  /extras-document/:equityId/:id     # Update extra document entry
DELETE /extras-document/:equityId/:id     # Delete extra document entry
POST   /extras-document/upload/document   # Upload document file (multipart/form-data)
```

**Campaign Module Features:**

- **Campaign Ownership Validation**: All endpoints validate that the authenticated user owns the campaign (equityId)
- **File Upload Support**: Team members and lead investors support photo uploads, extras modules support respective file types
- **Photo Management**: Automatic file cleanup when deleting team members or lead investors
- **Content Management**: Support for additional content (images, videos, documents) to enhance campaign presentations
- **JWT Authentication**: All endpoints require valid user authentication
- **Multi-format Support**: Images (JPEG, PNG, WebP), videos (MP4, AVI, MOV), documents (PDF, DOC, DOCX)
- **File Validation**: Automatic MIME type and file size validation for uploads
- **Campaign Integration**: All modules are tightly integrated with the equity campaign system

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

# Get cache statistics (admin)
curl -X GET "http://localhost:3000/settings/admin/cache/stats" \
  -H "Authorization: Bearer <admin-token>"

# Clear cache for specific group (admin)
curl -X DELETE "http://localhost:3000/settings/admin/cache/clear/site_setting" \
  -H "Authorization: Bearer <admin-token>"

# Clear all cache (admin)
curl -X DELETE "http://localhost:3000/settings/admin/cache/clear" \
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
