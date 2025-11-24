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
    ├── admin-modules/  # Admin modules
    │   ├── admin-users/         # Admin users management
    │   ├── countries/           # Countries management
    │   ├── currencies/          # Currencies management
    │   ├── email-templates/     # Email templates management
    │   ├── languages/           # Languages management
    │   ├── manage-dropdown/     # Master dropdown management
    │   ├── meta-settings/       # Meta settings (SEO/OG) management
    │   ├── revenue-subscriptions/ # Revenue subscription management
    │   ├── settings/            # Settings management
    │   └── sliders/             # Sliders management
    └── campaign-modules/ # Campaign management modules
        ├── team-member/         # Team members for campaigns
        ├── lead-investor/       # Lead investors for campaigns
        ├── campaign-faq/        # FAQ management for campaigns
        ├── extras-image/        # Extra images for campaigns
        ├── extras-video/        # Extra videos for campaigns
        └── extras-document/     # Extra documents for campaigns
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
- **MongoDB Repository**: Implements `MongoRepository<T>` with strict type transformations
- **Interface**: All repositories implement `IRepository<T>`
- **Dependency Injection**: Use tokens like `USER_REPOSITORY`
- **Type Safety**: All MongoDB repositories use `toEntity()` and `toDocument()` methods for type-safe transformations
- **No Type Assertions**: Strict elimination of `as any` patterns - use proper type casting with interfaces

### Error Handling

- **Global Exception Filter**: `GlobalExceptionFilter` in `common/filters/`
- **I18n Response Service**: Use `I18nResponseService` with `I18nResponseInterceptor` for multilingual error messages
- **HTTP Exceptions**: Use NestJS built-in exceptions
- **Custom Exceptions**: Extend HttpException when needed - each module has its own exceptions directory
- **Validation**: Use class-validator with DTOs
- **Module-Specific Exceptions**:
  - Settings: `SettingsNotFoundException`, `InvalidGroupTypeException`, etc.
  - Manage-Dropdown: `ManageDropdownNotFoundException`, `InvalidOptionTypeException`, etc.
  - Currencies: `CurrencyNotFoundException`, `CurrencyAlreadyExistsException`, `CurrencyInUseException`, etc.
  - Consistent error code patterns: `SETTINGS_NOT_FOUND`, `DROPDOWN_NOT_FOUND`, `CURRENCY_NOT_FOUND`

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

### Revenue Subscription Entity Fields

- **Core fields**: id, publicId, subscriptionType, amount, useCount, status
- **Financial limits**: maxInvestmentAllowed, maxProjectAllowed, maxProjectGoalLimit
- **Policy fields**: allowRefund, allowRefundDays, allowCancel, allowCancelDays
- **Feature flags**: secondaryMarketAccess, earlyBirdAccess
- **Metadata**: createdAt, updatedAt
- **Multi-language support**: Separate RevenueSubscriptionLanguage entity for title/description

### Revenue Subscription Language Entity Fields

- **Core fields**: id, publicId, mainSubscriptionId, languageId
- **Content**: title, description
- **Metadata**: createdAt, updatedAt

### Email Template Entity Fields

- **Core fields**: id, publicId, languageId, task (immutable)
- **Sender details**: senderEmail, replyEmail, senderName
- **Content**: subject, message (HTML)
- **Status**: status (boolean - active/inactive)
- **Metadata**: createdAt, updatedAt
- **Relationships**: One email template per language (unique languageId)
- **Constraints**: Task field is immutable after creation for template identification

### Enums

- **ActiveStatus**: PENDING, ACTIVE, INACTIVE, DELETED
- **NotificationStatus**: YES, NO
- **DatabaseType**: postgres, mongodb
- **RecordType**: STRING, NUMBER, BOOLEAN, FILE (for Settings module mixed data types)
- **SubscriptionType**: INVESTOR, SPONSOR (for Revenue Subscription module)

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
  GET    /:dropdownType/front      # Public: Get active dropdown options by type (no auth)
  GET    /:dropdownType/admin      # Admin: Get dropdown options with pagination
  POST   /:dropdownType            # Admin: Create new dropdown option
  GET    /:dropdownType/:publicId  # Admin: Get single dropdown option
  PATCH  /:dropdownType/:publicId  # Admin: Update dropdown option
  DELETE /:dropdownType/:uniqueCode  # Admin: Delete dropdown option (all language variants, useCount must be 0)
  PATCH  /:dropdownType/bulk-update # Admin: Bulk update dropdown option status
  PATCH  /:dropdownType/bulk-delete # Admin: Bulk delete dropdown options (useCount must be 0)

/countries (admin-modules)
  GET    /front                    # Public: Get active countries
  GET    /                         # Admin: Get all countries with pagination
  GET    /:publicId                # Admin: Get single country
  POST   /                         # Admin: Create new country with flag upload
  PATCH  /:publicId                # Admin: Update country with optional flag upload
  DELETE /:publicId                # Admin: Delete country
  PATCH  /bulk-update              # Admin: Bulk update country status
  PATCH  /bulk-delete              # Admin: Bulk delete countries

/currencies (admin-modules)
  GET    /front                    # Public: Get active currencies
  GET    /                         # Admin: Get all currencies with pagination
  GET    /:publicId                # Admin: Get single currency
  POST   /                         # Admin: Create new currency
  PATCH  /:publicId                # Admin: Update currency
  DELETE /:publicId                # Admin: Delete currency (only if useCount is 0)
  PATCH  /bulk-update              # Admin: Bulk update currency status
  PATCH  /bulk-delete              # Admin: Bulk delete currencies (only if useCount is 0)

/settings (admin-modules)
  GET    /:groupType/front         # Public: Get settings by group type
  GET    /:groupType/admin         # Admin: Get settings with admin access
  POST   /:groupType/admin         # Admin: Create or update settings (supports file upload)
  DELETE /:groupType/admin         # Admin: Delete all settings by group type
  GET    /admin/cache/stats        # Admin: Get cache statistics
  DELETE /admin/cache/clear/:groupType?  # Admin: Clear cache (all or by group)

/admins (admin-modules)
  GET    /me                       # Admin: Get current admin profile
  GET    /                         # Admin: Get all admins with pagination
  POST   /                         # Admin: Create new admin user
  PATCH  /:id                      # Admin: Update admin user
  DELETE /:id                      # Admin: Delete admin user

/sliders (admin-modules)
  GET    /front                    # Public: Get active sliders for frontend
  GET    /                         # Admin: Get all sliders with pagination
  GET    /:publicId                # Admin: Get single slider
  POST   /                         # Admin: Create new slider with image upload
  PATCH  /:publicId                # Admin: Update slider with optional image upload
  DELETE /:publicId                # Admin: Delete slider (all language variants)
  PATCH  /bulk-update              # Admin: Bulk update slider status
  PATCH  /bulk-delete              # Admin: Bulk delete sliders

/revenue-subscriptions (admin-modules)
  GET    /front                    # Public: Get active revenue subscriptions for frontend
  GET    /                         # Admin: Get all revenue subscriptions with pagination
  GET    /:publicId                # Admin: Get single revenue subscription
  POST   /                         # Admin: Create new revenue subscription with language content
  PATCH  /:publicId                # Admin: Update revenue subscription with optional language content
  DELETE /:publicId                # Admin: Delete revenue subscription (only if useCount is 0)
  PATCH  /bulk-update              # Admin: Bulk update revenue subscription status
  PATCH  /bulk-delete              # Admin: Bulk delete revenue subscriptions (only if useCount is 0)

/meta-settings (admin-modules)
  GET    /:languageCode/front      # Public: Get meta settings for frontend by language code (no auth)
  GET    /:languageCode/admin      # Admin: Get meta settings for admin by language code
  GET    /:publicId                # Admin: Get single meta setting by public ID
  POST   /                         # Admin: Create meta settings for all active languages with OG image upload
  PATCH  /:publicId                # Admin: Update meta setting with optional OG image upload

/email-templates (admin-modules)
  GET    /                         # Admin: Get email templates with pagination and search (supports filtering by task, senderEmail, senderName, subject, languageId, status, and search across task/subject/senderName)
  GET    /:publicId                # Admin: Get single email template by public ID
  POST   /                         # Admin: Create new email template with task and content
  POST   /all-languages            # Admin: Create email template for all active languages
  PATCH  /:publicId                # Admin: Update email template (task field immutable)
  DELETE /:publicId                # Admin: Delete email template
  PATCH  /bulk-update              # Admin: Bulk update email template status
  GET    /admin/cache/stats        # Admin: Get cache statistics
  DELETE /admin/cache/clear        # Admin: Clear all cache
  DELETE /admin/cache/clear/:pattern # Admin: Clear cache by pattern

/team-member (campaign-modules)
  GET    /:equityId                # User: Get all team members for campaign
  POST   /:equityId                # User: Create team member with photo upload (requires file)
  PATCH  /:equityId/:id            # User: Update team member with optional photo upload
  DELETE /:equityId/:id            # User: Delete team member

/lead-investor (campaign-modules)
  GET    /:equityId                # User: Get all lead investors for campaign
  POST   /:equityId                # User: Create lead investor with photo upload (requires file)
  PATCH  /:equityId/:id            # User: Update lead investor with optional photo upload
  DELETE /:equityId/:id            # User: Delete lead investor

/campaign-faq (campaign-modules)
  GET    /:equityId                # User: Get all FAQ entries for campaign
  POST   /:equityId                # User: Create new FAQ entry
  PATCH  /:equityId/:id            # User: Update FAQ entry
  DELETE /:equityId/:id            # User: Delete FAQ entry

/extras-image (campaign-modules)
  GET    /:equityId                # User: Get all extra images for campaign
  POST   /:equityId                # User: Create extra image entry
  PATCH  /:equityId/:id            # User: Update extra image entry
  DELETE /:equityId/:id            # User: Delete extra image entry
  POST   /upload/image             # User: Upload image file

/extras-video (campaign-modules)
  GET    /:equityId                # User: Get all extra videos for campaign
  POST   /:equityId                # User: Create extra video entry
  PATCH  /:equityId/:id            # User: Update extra video entry
  DELETE /:equityId/:id            # User: Delete extra video entry
  POST   /upload/video             # User: Upload video file

/extras-document (campaign-modules)
  GET    /:equityId                # User: Get all extra documents for campaign
  POST   /:equityId                # User: Create extra document entry
  PATCH  /:equityId/:id            # User: Update extra document entry
  DELETE /:equityId/:id            # User: Delete extra document entry
  POST   /upload/document          # User: Upload document file
```

## Email Templates

The application features a comprehensive Email Templates management system with the following capabilities:

### Template Management Features

- **Task-Based Organization**: Templates organized by immutable task identifiers (e.g., `account_activation`, `password_reset`, `welcome_email`)
- **Multi-Language Support**: One template per active language with automatic language resolution
- **HTML Content**: Full HTML support for rich email formatting with template variables
- **Sender Configuration**: Configurable sender email, reply-to email, and sender name per template
- **Status Management**: Active/inactive status control with bulk operations support
- **Dual Database Support**: Works with both PostgreSQL (Prisma) and MongoDB (Mongoose)

### Template Structure

- **Core Fields**: Task (immutable), language association, status
- **Content Fields**: Subject, HTML message content with variable support
- **Sender Fields**: Sender email, reply email, sender name for professional communication
- **Metadata**: Creation and update timestamps, public ID for API access

### API Features

- **Admin Management**: Full CRUD operations with authentication
- **Public Access**: Frontend access to active templates by language
- **Bulk Operations**: Mass status updates for efficient management
- **Caching**: NodeCache integration for optimal performance (5-minute TTL)
- **Validation**: Comprehensive validation with multilingual error messages

### Common Template Types

- Account Activation Email
- Password Reset Email
- Welcome Email
- Newsletter Templates
- Notification Templates
- Promotional Templates
- Administrative Communications

### Integration

- Use with nodemailer for email delivery
- Template variable substitution support
- I18n integration for multilingual content
- Admin dashboard integration for template management

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
return this.i18nResponse.success(
  'languages.created_successfully',
  201,
  language
);
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
META_BUCKET=meta-settings
SETTINGS_BUCKET=settings
SLIDERS_BUCKET=sliders
...
```

## Docker Configuration

- Multi-stage builds for optimization
- Separate services for microservices
- PostgreSQL, MongoDB, Redis, Nginx included
- Health checks configured

## Common Patterns

### Response Format

For modern modules, use I18nResponseService with multilingual support:

```typescript
// Success responses
return this.i18nResponse.translateAndRespond(
  'settings.retrieved_successfully',
  HttpStatus.OK,
  response
);

// Error responses
return this.i18nResponse.translateError(
  'settings.not_found',
  HttpStatus.NOT_FOUND
);
```

Legacy modules may still use ResponseHandler:

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

### Module Alignment Pattern

Admin modules follow consistent patterns for similar functionality:

**Settings Module Pattern** (Revolutionary Dynamic Implementation):

- **🔧 Fully Dynamic Configuration**: Accept ANY field names without schema restrictions or predefined validations
- **📊 Mixed Data Type Support**: Store actual booleans, numbers, and strings (not string representations)
- **📁 File Upload Integration**: Seamlessly handle text fields + file uploads via multipart form-data
- **🗂️ Unlimited Group Types**: Support for any custom groupType (site_setting, amount_setting, revenue_setting, etc.)
- **⚡ Zero Validation Constraints**: No schema restrictions - accepts everything dynamically

**API Endpoints:**

- `GET /:groupType/front` - Public endpoint (no auth) - Get settings for frontend
- `GET /:groupType/admin` - Admin endpoint (with auth) - Get settings with admin access
- `POST /:groupType/admin` - Admin endpoint (with auth) - Create/update dynamic settings with mixed data types and files
- `DELETE /:groupType/admin` - Admin endpoint (with auth) - Delete all settings by group type
- `GET /admin/cache/stats` - Admin endpoint - Get cache statistics
- `DELETE /admin/cache/clear/:groupType?` - Admin endpoint - Clear cache (all or by group)

**Dynamic Features:**

- Uses `Record<string, unknown>` to bypass all validation constraints
- MongoDB Schema.Types.Mixed for flexible data storage
- Smart type handling: undefined → empty string, preserves boolean/number types
- Response format: `{ settings, groupType, count }`
- Cache management with Node-cache for optimal performance

**Example Usage:**

```json
POST /settings/site_setting/admin
{
  "siteName": "My Website",           // → string
  "enableFeatures": true,             // → boolean
  "maxUsers": 1000,                   // → number
  "customField": "any value",         // → string
  "undefinedField": undefined         // → "" (empty string)
}
```

**Manage-Dropdown Module** (Aligned Implementation):

- `GET /:dropdownType/front` - Public endpoint (no auth)
- `GET /:dropdownType/admin` - Admin endpoint (with auth)
- Uses `DropdownTypeParamDto` for parameter validation
- Response format: `{ dropdowns, dropdownType, count }`

**Currencies Module** (Aligned Implementation):

- `GET /front` - Public endpoint (no auth)
- `GET /` - Admin endpoint (with auth)
- Uses standard pagination with `AdminCurrencyQueryDto`
- Response format: `{ currencies, count }` for public, `{ data, total, page, limit }` for admin
- Includes use count tracking and safe deletion (useCount > 0 prevents deletion)
- Features: Create, Update, Delete, Bulk operations with comprehensive validation

**Key Alignment Points**:

- Same route structure with `/front` and `/admin` suffixes
- Same parameter validation patterns
- Same response structure
- Same error handling with custom exceptions
- Same I18n response service integration

### Bulk Operations Pattern

All admin modules support consistent bulk operations:

**Bulk Update Pattern**:

```typescript
// Request payload format (standardized across all modules)
{
  "publicIds": [
    "627a5038-e5be-4135-9569-404d50c836c1",
    "e4113de7-5388-4f24-a58c-a22fb77d00a8"
  ],
  "status": true
}

// DTO Implementation
export class BulkUpdate[Entity]Dto {
  @ApiProperty({
    description: 'Array of [entity] public IDs to update',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(4, { each: true }) // For countries/languages
  // OR @IsString({ each: true }) // For currencies/manage-dropdown
  publicIds!: string[];

  @ApiProperty({
    description: '[Entity] status (active/inactive)',
  })
  @IsNotEmpty()
  @IsBoolean()
  status!: boolean;
}
```

**Endpoints Supporting Bulk Operations**:

- `PATCH /countries/bulk-update` - Updates country status by publicIds
- `PATCH /languages/bulk-update` - Updates language status by publicIds
- `PATCH /currencies/bulk-update` - Updates currency status by publicIds
- `PATCH /manage-dropdown/:dropdownType/bulk-update` - Updates dropdown status by publicIds

**Bulk Delete Pattern**:

- Similar payload structure using `publicIds` array
- Additional validation based on entity constraints (useCount, isDefault, etc.)
- Soft delete or hard delete based on entity requirements

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
- After all task completion, if the new APIs are created or old API routes are updated then do the necessary changes in below files as well.

. CLAUDE.md (because it contains the escence of the project itself)
. DEVELOPER_GUIDE.md
. Equity Crowdfunding with NestJS + PostgreSQL + MongoDB.postman_collection.json
. README.md
. backup script (not sure about this but if you need to do any changes, then do it)
. swagger docs
