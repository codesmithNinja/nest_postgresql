# NestJS Multi-Database Auth Project Guide

## Project Overview

NestJS application with dual database support (PostgreSQL/MongoDB), JWT authentication, Prisma ORM, and email integration. The project supports microservices architecture with separate services for admin, campaign, and investment modules.

## Architecture Style

- **Modular Architecture** with feature-based modules
- **Repository Pattern** for database abstraction
- **Dual Database Support** (PostgreSQL with Prisma, MongoDB with Mongoose)
- **JWT Authentication** with Passport
- **Microservices Ready** with separate entry points

## Project Structure

```
src/
├── common/           # Shared utilities, guards, interceptors
├── database/         # Database layer with repositories
│   ├── entities/    # Domain entities
│   ├── prisma/      # Prisma service
│   ├── repositories/# Repository implementations
│   └── schemas/     # Mongoose schemas
├── email/           # Email service module
└── modules/         # Feature modules
    ├── auth/           # Authentication module
    ├── users/          # Users module
    └── admin-modules/  # Admin modules
        ├── admin-users/     # Admin users management
        ├── countries/       # Countries management
        ├── languages/       # Languages management
        ├── manage-dropdown/ # Master dropdown management
        └── settings/        # Settings management
```

## Code Conventions

### TypeScript/NestJS Style

- **Strict TypeScript**: NO `any` types allowed anywhere in the project
- **Type Safety**: All variables, parameters, and return types must be explicitly typed
- **Indentation**: 2 spaces (enforced by .prettierrc)
- **Quotes**: Single quotes for strings
- **Semicolons**: Always use semicolons
- **Line Width**: 80 characters max
- **Trailing Comma**: ES5 style

### Naming Conventions

- **Controllers**: [Entity]Controller (e.g., `AuthController`, `UsersController`)
- **Services**: [Entity]Service (e.g., `AuthService`, `UsersService`)
- **Modules**: [Feature]Module (e.g., `AuthModule`, `UsersModule`)
- **DTOs**: [Action][Entity]Dto (e.g., `RegisterDto`, `UpdateProfileDto`)
- **Interfaces**: I[Name] for repository interfaces (e.g., `IUserRepository`)
- **Repository Token**: [ENTITY]\_REPOSITORY (e.g., `USER_REPOSITORY`)
- **Database Entities**: Singular names (e.g., `User`, not `Users`)

### Repository Pattern Implementation

- **Base Repository**: Abstract class in `src/database/repositories/base/`
- **PostgreSQL Repository**: Extends `PostgresRepository<T>`
- **MongoDB Repository**: Implements `MongoRepository<T>`
- **Interface**: All repositories implement `IRepository<T>`
- **Dependency Injection**: Use tokens like `USER_REPOSITORY`

### Error Handling

- **Global Exception Filter**: `GlobalExceptionFilter` in `common/filters/`
- **Response Handler**: Use `ResponseHandler` utility for consistent responses
- **HTTP Exceptions**: Use NestJS built-in exceptions
- **Custom Exceptions**: Extend HttpException when needed
- **Validation**: Use class-validator with DTOs

### Authentication & Security

- **JWT Strategy**: Passport JWT strategy with guards
- **Password Hashing**: bcryptjs with 12 rounds
- **Rate Limiting**: Throttler module with custom limits per endpoint
- **CORS**: Configured whitelist in `cors.config.ts`
- **Public Routes**: Use `@Public()` decorator

### Database Operations

- **Prisma Client**: Accessed via `PrismaService`
- **Mongoose Models**: Injected using `@InjectModel()`
- **Transactions**: Use Prisma transactions for PostgreSQL
- **Pagination**: Implement `findWithPagination` method
- **Soft Deletes**: Use `ActiveStatus` enum (ACTIVE, INACTIVE, DELETED)

### Testing Strategy

- **Unit Tests**: Jest with `.spec.ts` files
- **E2E Tests**: Supertest for API testing
- **Test Coverage**: Minimum 80% for business logic
- **Mocking**: Use `@nestjs/testing` utilities

## Database Schema

### User Entity Fields

- Core fields: id, firstName, lastName, email, password, slug
- Status fields: active (enum), enableNotification
- Authentication: accountActivationToken, passwordResetToken
- Social: uniqueGoogleId, uniqueLinkedInId, etc.
- Financial: walletId, achCustomerId, plaidDwollaCustomerId
- Metadata: createdAt, updatedAt

### Enums

- **ActiveStatus**: PENDING, ACTIVE, INACTIVE, DELETED
- **NotificationStatus**: YES, NO
- **DatabaseType**: postgres, mongodb

## API Endpoints Structure

```
/auth
  POST /register
  POST /login
  GET  /activate
  POST /forgot-password
  POST /reset-password

/users
  GET    /profile
  PATCH  /profile
  PATCH  /change-password
  GET    /slug/:slug
  DELETE /deactivate

/languages (admin-modules)
  GET    /front                    # Public: Get active languages
  GET    /                         # Admin: Get all languages with pagination
  GET    /:publicId                # Admin: Get single language
  POST   /                         # Admin: Create new language with flag upload
  PATCH  /:publicId                # Admin: Update language with optional flag upload
  DELETE /:publicId                # Admin: Delete language (only if isDefault=NO)
  PATCH  /bulk-update              # Admin: Bulk update language status
  PATCH  /bulk-delete              # Admin: Bulk delete languages (isDefault=NO only)

/manage-dropdown (admin-modules)
  GET    /:optionType              # Public: Get dropdown options by type
  GET    /:optionType/admin        # Admin: Get dropdown options with pagination
  POST   /:optionType              # Admin: Create new dropdown option
  GET    /:optionType/:publicId    # Admin: Get single dropdown option
  PATCH  /:optionType/:publicId    # Admin: Update dropdown option
  DELETE /:optionType/:publicId    # Admin: Delete dropdown option
  PATCH  /:optionType/bulk         # Admin: Bulk operations on dropdown options
```

## Email Templates

- Account Activation Email
- Password Reset Email
- Use nodemailer with HTML templates

## Internationalization (i18n)

The application supports comprehensive multi-language functionality:

### Supported Languages

- **English (en)** - Default/Fallback language
- **Spanish (es)** - Full translation support
- **French (fr)** - Full translation support
- **Arabic (ar)** - Full translation support with RTL considerations

### Translation Structure

- Translation files: `src/i18n/locales/{lang}/translations.json`
- Organized by feature modules (auth, user, admin, languages, countries, etc.)
- Consistent message keys across all languages
- Support for parameterized translations using `{{variable}}` syntax

### Usage in Controllers

```typescript
return this.i18nResponse.success('languages.created', 201, language);
return this.i18nResponse.error('languages.not_found', 404);
```

### Language Detection

- Uses `lang` query parameter from any APIs called.
- Falls back to English for missing translations
- Cached translation loading for performance

## Environment Variables

```env
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://...
MONGODB_URI=mongodb://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
EMAIL_HOST=...
EMAIL_PORT=...

# File Upload Buckets
ADMIN_BUCKET=admins
COUNTRIES_BUCKET=countries
LANGUAGES_BUCKET=languages
SETTINGS_BUCKET=settings
...
```

## Docker Configuration

- Multi-stage builds for optimization
- Separate services for microservices
- PostgreSQL, MongoDB, Redis, Nginx included
- Health checks configured

## Common Patterns

### Response Format

Always use ResponseHandler:

```typescript
return ResponseHandler.success('Message', 200, data);
return ResponseHandler.error('Error message', 400);
```

### Repository Usage

```typescript
@Inject(USER_REPOSITORY) private userRepository: IUserRepository
```

### DTO Validation

```typescript
@Body(ValidationPipe) dto: RegisterDto
```

### Guard Usage

```typescript
@UseGuards(JwtUserGuard)
```

## Current Dependencies

- @nestjs/common: ^11.0.1
- @nestjs/jwt: ^11.0.0
- @prisma/client: ^6.13.0
- @nestjs/mongoose: ^11.0.3
- bcryptjs: ^3.0.2
- class-validator: ^0.14.2
- nodemailer: ^7.0.5

## Development Workflow

1. Create feature module with `nest g module modules/[name]`
2. Implement repository following dual-database pattern
3. Create DTOs with validation
4. Implement service with business logic
5. Create controller with proper guards
6. Write unit tests alongside implementation
7. Update Prisma schema if needed and migrate

## Microservices Configuration

- ENABLE_MICROSERVICES flag for separate/single port mode
- Separate Docker targets for each service
- Nginx configuration for routing
- Rate limiting per service type

- Response system now completely working as multi-language including Arabic (ar), English (en), Spanish (es), and French (fr). Future APIs must follow the same response style as of now.
- entire document will be strict typescript. Do not use any type anywhere in the project
- every API creation or updation check lint format and build and resolve all the errors you found then start the application to test weather it is working or not
- Always start application using npm run start:dev. it will start the application using nodemon so you dont have to kill the application everytime.
- After all task completion, if the new APIs are created or old API routes are updated then do the necessary changes in belwo files as well.

. CLAUDE.md (because it contains the escence of the project itself)
. DEVELOPER_GUIDE.md
. Equity Crowdfunding with NestJS + PostgreSQL + MongoDB.postman_collection.json
. README.md
. backup script (not sure about this but if you need to do any changes, then do it)
. swagger docs
