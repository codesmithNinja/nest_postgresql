<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Enterprise-grade NestJS application with dual database support (PostgreSQL/MongoDB), JWT authentication, and comprehensive business modules for equity crowdfunding platform.

### Key Features

- 🔒 **Strict TypeScript** - Zero tolerance for `any` types, enforced type safety
- 🗄️ **Dual Database Support** - PostgreSQL (Prisma) and MongoDB (Mongoose)
- 🔐 **JWT Authentication** - Secure token-based authentication
- 🌐 **Internationalization** - Multi-language support with i18n (English, Spanish, French, Arabic)
- 📝 **Auto-generated API Docs** - Swagger/OpenAPI documentation
- ⚡ **Rate Limiting** - Built-in API protection
- 📧 **Email Integration** - Account activation and notifications

### Available Modules

#### Admin Modules

- **🌍 Languages Management** - Multi-language support with flag images, ISO codes, and direction settings (English, Spanish, French, Arabic)
- **🏳️ Countries Management** - Country data management with flags and usage tracking
- **💰 Currencies Management** - Multi-currency support with ISO codes, symbols, and usage tracking
- **📋 Manage Dropdown** - Dynamic dropdown data management with multi-language support
- **⚙️ Dynamic Settings Management** - Fully dynamic application configuration with mixed data type support (boolean, number, string) and file uploads
- **🎯 Sliders Management** - Multi-language slider management with image upload, color customization, and unique code system
- **💰 Revenue Subscriptions Management** - Subscription plan management for INVESTOR and SPONSOR types with financial limits, refund/cancel policies, and multi-language content support
- **🔍 Meta Settings Management** - SEO and social media optimization with meta titles, descriptions, keywords, OpenGraph data, OG image uploads, and AI-generated image tracking across all languages
- **📧 Email Templates Management** - Task-based email template system with HTML content, sender configuration, multi-language support, immutable task identifiers, bulk operations, and NodeCache performance optimization
- **👤 Admin Users** - Administrative user management and authentication

#### Campaign Modules

- **👥 Team Member Management** - Manage campaign team members with photo uploads and profile information
- **💼 Lead Investor Management** - Manage lead investors for campaigns with photo uploads and investor details
- **❓ Campaign FAQ Management** - Create and manage frequently asked questions for campaigns
- **🖼️ Extras Images Management** - Manage additional images for campaigns with upload support
- **🎥 Extras Videos Management** - Manage additional videos for campaigns with upload support
- **📄 Extras Documents Management** - Manage additional documents for campaigns with upload support

#### Public API Endpoints (No Authentication Required)

```
GET /languages/front                           # Get active languages for frontend
GET /countries/front                           # Get active countries for frontend
GET /currencies/front                          # Get active currencies for frontend
GET /sliders/front                             # Get active sliders for frontend with language support
GET /revenue-subscriptions/front               # Get active revenue subscriptions for frontend with language support
GET /manage-dropdown/:dropdownType/front       # Get active dropdown options by type with language support
GET /meta-settings/:languageCode/front         # Get meta settings for frontend by language code with SEO/OG data
GET /settings/:groupType/front                 # Get settings by group type for frontend
```

#### Admin API Endpoints (Authentication Required)

```
/admins                                # Admin user management
  GET    /me                             # Get current admin profile
  GET    /                               # Get all admins with pagination
  POST   /                               # Create new admin user
  PATCH  /:id                            # Update admin user
  DELETE /:id                            # Delete admin user

/languages                             # Languages management
  GET    /front                          # Public: Get active languages
  GET    /                               # Admin: Get all languages with pagination
  GET    /:publicId                      # Admin: Get single language
  POST   /                               # Admin: Create new language with flag upload
  PATCH  /:publicId                      # Admin: Update language
  DELETE /:publicId                      # Admin: Delete language
  PATCH  /bulk-update                    # Admin: Bulk update language status
  PATCH  /bulk-delete                    # Admin: Bulk delete languages

/countries                             # Countries management
  GET    /front                          # Public: Get active countries
  GET    /                               # Admin: Get all countries with pagination
  GET    /:publicId                      # Admin: Get single country
  POST   /                               # Admin: Create new country with flag upload
  PATCH  /:publicId                      # Admin: Update country
  DELETE /:publicId                      # Admin: Delete country
  PATCH  /bulk-update                    # Admin: Bulk update country status
  PATCH  /bulk-delete                    # Admin: Bulk delete countries

/currencies                            # Currencies management
  GET    /front                          # Public: Get active currencies
  GET    /                               # Admin: Get all currencies with pagination
  GET    /:publicId                      # Admin: Get single currency
  POST   /                               # Admin: Create new currency
  PATCH  /:publicId                      # Admin: Update currency
  DELETE /:publicId                      # Admin: Delete currency (only if useCount is 0)
  PATCH  /bulk-update                    # Admin: Bulk update currency status
  PATCH  /bulk-delete                    # Admin: Bulk delete currencies (only if useCount is 0)

/sliders                               # Sliders management
  GET    /front                          # Public: Get active sliders for frontend
  GET    /                               # Admin: Get all sliders with pagination
  GET    /:publicId                      # Admin: Get single slider
  POST   /                               # Admin: Create new slider with image upload
  PATCH  /:publicId                      # Admin: Update slider with optional image upload
  DELETE /:publicId                      # Admin: Delete slider (all language variants)
  PATCH  /bulk-update                    # Admin: Bulk update slider status
  PATCH  /bulk-delete                    # Admin: Bulk delete sliders

/revenue-subscriptions                 # Revenue subscriptions management
  GET    /front                          # Public: Get active revenue subscriptions for frontend
  GET    /                               # Admin: Get all revenue subscriptions with pagination
  GET    /:publicId                      # Admin: Get single revenue subscription
  POST   /                               # Admin: Create new subscription with language content
  PATCH  /:publicId                      # Admin: Update subscription with partial data
  DELETE /:publicId                      # Admin: Delete subscription (cannot delete if useCount > 0)
  PATCH  /bulk-update                    # Admin: Bulk update subscription status
  PATCH  /bulk-delete                    # Admin: Bulk delete subscriptions (cannot delete if useCount > 0)

/meta-settings                         # SEO and social media meta settings management
  GET    /:languageCode/front            # Public: Get meta settings for frontend by language code
  GET    /:languageCode/admin            # Admin: Get meta settings by language code
  GET    /:publicId                      # Admin: Get single meta setting by public ID
  POST   /                               # Admin: Create meta settings for all active languages with OG image upload
  PATCH  /:publicId                      # Admin: Update meta setting with optional OG image upload

/email-templates                        # Email templates management
  GET    /front                          # Public: Get active email templates for frontend
  GET    /                               # Admin: Get email templates with pagination and search functionality
  GET    /:publicId                      # Admin: Get single email template by public ID
  POST   /                               # Admin: Create new email template with task and content
  POST   /all-languages                  # Admin: Create email template for all active languages
  PATCH  /:publicId                      # Admin: Update email template (task field immutable)
  DELETE /:publicId                      # Admin: Delete email template
  PATCH  /bulk-update                    # Admin: Bulk update email template status
  GET    /admin/cache/stats              # Admin: Get cache statistics
  DELETE /admin/cache/clear              # Admin: Clear all cache
  DELETE /admin/cache/clear/:pattern     # Admin: Clear cache by pattern

/manage-dropdown                       # Master dropdown data management
  GET    /:dropdownType/front            # Public: Get active dropdown options by type
  GET    /:dropdownType/admin            # Admin: Get dropdown options with pagination
  POST   /:dropdownType                  # Admin: Create new dropdown option
  GET    /:dropdownType/:publicId        # Admin: Get single dropdown by publicId
  PATCH  /:dropdownType/:publicId        # Admin: Update dropdown option
  DELETE /:dropdownType/:uniqueCode      # Admin: Delete dropdown option (all language variants, useCount must be 0)
  PATCH  /:dropdownType/bulk-update      # Admin: Bulk update dropdown option status
  PATCH  /:dropdownType/bulk-delete      # Admin: Bulk delete dropdown options (useCount must be 0)

/settings                              # Dynamic settings management
  GET    /:groupType/front               # Public: Get settings by group type
  GET    /:groupType/admin               # Admin: Get settings with admin access
  POST   /:groupType/admin               # Admin: Create/update dynamic settings with mixed data types
  DELETE /:groupType/admin               # Admin: Delete all settings by group type
  GET    /admin/cache/stats              # Admin: Get cache statistics
  DELETE /admin/cache/clear/:groupType?  # Admin: Clear cache (all or by group)

/team-member                           # Team member management for campaigns (User Authentication Required)
  GET    /:equityId                      # Get all team members for campaign
  POST   /:equityId                      # Create team member with photo upload
  PATCH  /:equityId/:id                  # Update team member with optional photo upload
  DELETE /:equityId/:id                  # Delete team member

/lead-investor                         # Lead investor management for campaigns (User Authentication Required)
  GET    /:equityId                      # Get all lead investors for campaign
  POST   /:equityId                      # Create lead investor with photo upload
  PATCH  /:equityId/:id                  # Update lead investor with optional photo upload
  DELETE /:equityId/:id                  # Delete lead investor

/campaign-faq                          # Campaign FAQ management (User Authentication Required)
  GET    /:equityId                      # Get all FAQ entries for campaign
  POST   /:equityId                      # Create new FAQ entry
  PATCH  /:equityId/:id                  # Update FAQ entry
  DELETE /:equityId/:id                  # Delete FAQ entry

/extras-image                          # Campaign extras images management (User Authentication Required)
  GET    /:equityId                      # Get all extra images for campaign
  POST   /:equityId                      # Create extra image entry
  PATCH  /:equityId/:id                  # Update extra image entry
  DELETE /:equityId/:id                  # Delete extra image entry
  POST   /upload/image                   # Upload image file

/extras-video                          # Campaign extras videos management (User Authentication Required)
  GET    /:equityId                      # Get all extra videos for campaign
  POST   /:equityId                      # Create extra video entry
  PATCH  /:equityId/:id                  # Update extra video entry
  DELETE /:equityId/:id                  # Delete extra video entry
  POST   /upload/video                   # Upload video file

/extras-document                       # Campaign extras documents management (User Authentication Required)
  GET    /:equityId                      # Get all extra documents for campaign
  POST   /:equityId                      # Create extra document entry
  PATCH  /:equityId/:id                  # Update extra document entry
  DELETE /:equityId/:id                  # Delete extra document entry
  POST   /upload/document                # Upload document file
```

#### Bulk Operations

All admin modules support consistent bulk operations with standardized payload format:

**Bulk Update Payload Example:**

```json
{
  "publicIds": [
    "627a5038-e5be-4135-9569-404d50c836c1",
    "e4113de7-5388-4f24-a58c-a22fb77d00a8"
  ],
  "status": true
}
```

**Key Features:**

- ✅ All modules use `publicIds` property (never `ids`)
- ✅ Bulk update only affects `status` field (active/inactive)
- ✅ Bulk delete validates business constraints (useCount, isDefault, etc.)
- ✅ Operations are transactional and atomic
- ✅ Detailed error reporting for failed operations

**📖 Documentation:** Access full API documentation at `http://localhost:3000/api/docs` when running the application.

### 🔧 Dynamic Settings System

The settings module provides a **fully dynamic configuration system** that accepts any field names and data types without predefined schemas:

#### **Key Features:**

- **✅ Mixed Data Type Support** - Stores actual booleans, numbers, and strings (not string representations)
- **✅ Unlimited Dynamic Fields** - Accept any JSON field names without validation restrictions
- **✅ File Upload Support** - Mixed form-data with text fields + file uploads
- **✅ Smart Type Handling** - undefined → empty string, preserves boolean/number types
- **✅ Dynamic Group Types** - Unlimited custom groupType categories

#### **Supported Group Types:**

```
site_setting       - Site configuration (colors, name, features)
amount_setting     - Investment amounts and currency settings
revenue_setting    - Revenue sharing and payout configuration
email_setting      - SMTP and email configuration
api_setting        - API keys and credentials
custom_group_*     - Any custom group type you create
```

#### **Data Type Examples:**

```json
{
  "siteName": "My Company", // → string
  "enableFeature": true, // → boolean (actual boolean, not "true")
  "maxUsers": 1000, // → number (actual number, not "1000")
  "customSetting": "any value", // → string
  "undefinedValue": undefined // → "" (empty string)
}
```

#### **Mixed Form-Data Support:**

```
POST /settings/site_setting/admin
Content-Type: multipart/form-data

siteName=My Company                   (text field)
enableNotifications=true              (boolean field)
maxUsers=500                         (number field)
siteLogo=@logo.png                   (file upload)
favicon=@icon.ico                    (file upload)
```

**No Schema Restrictions** - The API dynamically accepts any field structure, making it perfect for:

- Feature flags and toggles
- Configuration parameters
- Theme and branding settings
- API credentials and keys
- Business logic parameters

## Project Setup

```bash
$ npm install
```

## Development Workflow

```bash
# Check TypeScript strict compliance
$ npm run lint

# Verify build compilation
$ npm run build

# Start in watch mode (recommended)
$ npm run start:dev

# Production mode
$ npm run start:prod
```

## Type Safety Requirements

This project enforces **STRICT TypeScript** with zero tolerance for `any` types:

- ❌ Never use `any` type
- ✅ Always type function parameters and return values
- ✅ Use `unknown` for truly unknown data
- ✅ Run `npm run lint` and `npm run build` before commits

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
