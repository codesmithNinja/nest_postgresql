# Master Dropdown Management API Documentation

## Overview

The Master Dropdown Management system provides comprehensive multi-language support for managing dropdown options across your application. The system automatically detects languages and creates entries for all available languages when creating new dropdown options.

## Key Features

- **Auto Language Detection**: Automatically detects active language from request headers
- **Multi-Language Support**: Creates entries for all active languages when `languageId` is not specified
- **isDefault Field**: Accepts 'YES'/'NO' values for managing default options
- **Dual Database Support**: Works with both PostgreSQL and MongoDB
- **Caching**: Built-in caching for performance optimization
- **Country-Specific Filtering**: Support for country-specific dropdown options

## Authentication

Most endpoints require admin authentication using JWT tokens. Public endpoints are marked as such.

```bash
Authorization: Bearer <admin_jwt_token>
```

## Language Management API

### Create Language

```http
POST /languages
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "name": "Spanish",
  "code": "es",
  "direction": "ltr",
  "flagImage": "https://example.com/flags/es.png",
  "isDefault": "NO",
  "status": true
}
```

**Response:**
```json
{
  "message": "Language created successfully",
  "statusCode": 201,
  "data": {
    "id": "clm1234567890",
    "publicId": "clm0987654321",
    "name": "Spanish",
    "code": "es",
    "direction": "ltr",
    "flagImage": "https://example.com/flags/es.png",
    "isDefault": "NO",
    "status": true,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Get All Active Languages (Public)

```http
GET /languages/active
```

**Response:**
```json
{
  "message": "Active languages retrieved successfully",
  "statusCode": 200,
  "data": [
    {
      "id": "clm1234567890",
      "publicId": "clm0987654321",
      "name": "English",
      "code": "en",
      "direction": "ltr",
      "flagImage": "https://example.com/flags/en.png",
      "isDefault": "YES",
      "status": true,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Default Language (Public)

```http
GET /languages/default
```

### Get Language by Code (Public)

```http
GET /languages/code/en
```

### Update Language

```http
PATCH /languages/{publicId}
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "name": "English (US)",
  "isDefault": "YES"
}
```

### Set Language as Default

```http
PUT /languages/{publicId}/set-default
Authorization: Bearer <admin_jwt_token>
```

### Delete Language

```http
DELETE /languages/{publicId}
Authorization: Bearer <admin_jwt_token>
```

## Master Dropdown Management API

### Get Dropdown Options (Public)

```http
GET /manage-dropdown/{optionType}?lang=en&country=US
```

**Example:**
```http
GET /manage-dropdown/industry?lang=en
```

**Response:**
```json
{
  "message": "Dropdown options retrieved successfully",
  "statusCode": 200,
  "data": [
    {
      "id": "clm1234567890",
      "publicId": "clm0987654321",
      "name": "Technology",
      "uniqueCode": 1,
      "dropdownType": "industry",
      "countryShortCode": null,
      "isDefault": "YES",
      "languageId": "clm1111111111",
      "language": {
        "id": "clm1111111111",
        "publicId": "clm2222222222",
        "name": "English",
        "code": "en",
        "direction": "ltr",
        "isDefault": "YES",
        "status": true
      },
      "status": true,
      "useCount": 5,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Dropdown Options for Admin

```http
GET /manage-dropdown/{optionType}/admin?page=1&limit=10&includeInactive=true
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "message": "Dropdown options retrieved successfully",
  "statusCode": 200,
  "data": {
    "data": [...],
    "total": 25,
    "page": 1,
    "limit": 10
  }
}
```

### Create Dropdown Option

```http
POST /manage-dropdown/{optionType}
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "name": "Artificial Intelligence",
  "uniqueCode": 101,
  "countryShortCode": "US",
  "isDefault": "NO",
  "status": true
}
```

**Note:** When `languageId` is not provided, the system will:
1. Auto-detect the current language from request headers
2. Create entries for ALL active languages in the system
3. Use the detected language as the primary reference

**Response:**
```json
{
  "message": "Dropdown option created successfully for 3 language(s)",
  "statusCode": 201,
  "data": [
    {
      "id": "clm1234567890",
      "publicId": "clm0987654321",
      "name": "Artificial Intelligence",
      "uniqueCode": 101,
      "dropdownType": "industry",
      "countryShortCode": "US",
      "isDefault": "NO",
      "languageId": "clm1111111111",
      "status": true,
      "useCount": 0,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Dropdown Option by Public ID

```http
GET /manage-dropdown/{optionType}/{publicId}
Authorization: Bearer <admin_jwt_token>
```

### Update Dropdown Option

```http
PATCH /manage-dropdown/{optionType}/{publicId}
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "name": "Artificial Intelligence & Machine Learning",
  "isDefault": "YES"
}
```

### Delete Dropdown Option

```http
DELETE /manage-dropdown/{optionType}/{publicId}
Authorization: Bearer <admin_jwt_token>
```

### Bulk Operations

```http
PATCH /manage-dropdown/{optionType}/bulk
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "publicIds": ["clm1234567890", "clm0987654321"],
  "action": "activate"
}
```

**Actions:** `activate`, `deactivate`, `delete`

## Language Detection

The system automatically detects language from multiple sources in this priority order:

1. **Query Parameter**: `?lang=es`
2. **Custom Header**: `X-Language: es`
3. **Accept-Language Header**: `Accept-Language: es-ES,es;q=0.9,en;q=0.8`
4. **Existing Request Language**: From previous middleware
5. **Default**: `en` (English)

## Dropdown Types

Supported dropdown types include but are not limited to:

- `industry` - Business industries
- `category` - General categories
- `country` - Countries
- `currency` - Currencies
- `timezone` - Time zones
- `status` - Status options
- `priority` - Priority levels
- `type` - General types
- `role` - User roles
- `department` - Departments
- `skill` - Skills
- `technology` - Technologies

## Error Responses

### Validation Error (400)
```json
{
  "statusCode": 400,
  "message": "Invalid dropdown type 'invalid-type'. Dropdown type must be 2-50 characters long, start with a letter, and contain only lowercase letters, numbers, hyphens, and underscores.",
  "error": "Bad Request"
}
```

### Not Found (404)
```json
{
  "statusCode": 404,
  "message": "Language with public ID 'invalid-id' not found",
  "error": "Not Found"
}
```

### Conflict (409)
```json
{
  "statusCode": 409,
  "message": "Language with code 'en' already exists",
  "error": "Conflict"
}
```

### Unauthorized (401)
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

## Implementation Examples

### JavaScript/TypeScript

```typescript
// Get dropdown options with auto language detection
const response = await fetch('/manage-dropdown/industry', {
  headers: {
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
  }
});
const dropdowns = await response.json();

// Create dropdown with specific language
const createResponse = await fetch('/manage-dropdown/industry', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + adminToken,
    'X-Language': 'es'
  },
  body: JSON.stringify({
    name: 'Tecnología',
    isDefault: 'NO'
  })
});

// Get country-specific dropdowns
const countryDropdowns = await fetch('/manage-dropdown/services?country=US&lang=en');
```

### curl Examples

```bash
# Get public dropdowns with language preference
curl -H "Accept-Language: es" \
     "https://api.example.com/manage-dropdown/industry"

# Create dropdown option (will create for all active languages)
curl -X POST \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "X-Language: en" \
     -d '{"name":"Biotechnology","isDefault":"NO"}' \
     "https://api.example.com/manage-dropdown/industry"

# Get admin view with pagination
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     "https://api.example.com/manage-dropdown/industry/admin?page=1&limit=20"
```

## Cache Management

The system includes intelligent caching:

- **Languages**: Cached for 1 hour
- **Dropdowns**: Cached for 30 minutes
- **Default Language**: Cached for 2 hours
- **Auto-invalidation**: Cache is automatically cleared when data is modified

## Database Support

The API works with both PostgreSQL (via Prisma) and MongoDB (via Mongoose) depending on the `DATABASE_TYPE` environment variable.

### PostgreSQL Setup
```bash
npm run prisma:migrate
```

### MongoDB Setup
```bash
node scripts/mongodb-setup.js
```

## Rate Limiting

API endpoints are protected by rate limiting. Adjust limits in your environment configuration as needed.

## Best Practices

1. **Always provide language context** when possible using headers or query parameters
2. **Use the isDefault field** with 'YES'/'NO' values to manage default options
3. **Cache responses** on the client side when appropriate
4. **Handle fallbacks** gracefully when specific language content isn't available
5. **Monitor use counts** to understand dropdown option popularity
6. **Use bulk operations** for efficiency when managing multiple items