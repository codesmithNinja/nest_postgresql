# Admin Settings Module

## Overview

The Admin Settings Module provides a comprehensive settings management system for the NestJS application with support for dual databases (PostgreSQL/MongoDB), file uploads, caching, and admin authentication.

## Features

- **Dual Database Support**: Works with both PostgreSQL (via Prisma) and MongoDB (via Mongoose)
- **File Upload Support**: Handle both text and file-based settings with automatic file management
- **Intelligent Caching**: Node-cache implementation with TTL and cache invalidation
- **Admin Authentication**: Protected endpoints requiring admin JWT authentication
- **Group Type Management**: Organize settings by group types with validation
- **Multi-language Support**: i18n integration with English, Spanish, and French translations
- **Comprehensive Error Handling**: Custom exceptions with detailed error messages
- **Form-data Processing**: Support for mixed form data (text + files)
- **File Cleanup**: Automatic old file removal when updating file settings

## API Endpoints

### Public Endpoints

#### GET `/settings/:groupType/front`

- **Description**: Get all settings for a group type (public access)
- **Authentication**: None required
- **Parameters**:
  - `groupType` (string): Settings group type (e.g., 'site_setting')
- **Response**: List of settings for the specified group type

### Admin Endpoints (Authentication Required)

#### GET `/settings/:groupType/admin`

- **Description**: Get all settings for a group type (admin access)
- **Authentication**: Admin JWT required
- **Parameters**:
  - `groupType` (string): Settings group type
- **Response**: List of settings with full admin access

#### POST `/settings/:groupType/admin`

- **Description**: Create or update settings for a group type
- **Authentication**: Admin JWT required
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `groupType` (string): Settings group type
- **Body**: Mixed form data (text fields and files)
- **Behavior**:
  - If setting exists: Updates the existing setting
  - If setting doesn't exist: Creates new setting
  - Files automatically get `recordType: FILE`
  - Text values get `recordType: STRING`
  - Old files are automatically deleted when updated

**Example form data**:

```
siteName: "My Website"
primaryColor: "#000000"
siteLogo: [file upload]
```

#### DELETE `/settings/:groupType/admin`

- **Description**: Delete all settings for a group type
- **Authentication**: Admin JWT required
- **Parameters**:
  - `groupType` (string): Settings group type to delete
- **Response**: Number of deleted settings

## Database Schema

### Settings Model

```typescript
interface Settings {
  id: string; // UUID primary key
  groupType: string; // Group type (e.g., 'site_setting')
  recordType: RecordType; // 'STRING' or 'FILE'
  key: string; // Setting key
  value: string; // Setting value or file path
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last update timestamp
}
```

### Indexes

- **Unique Index**: `(groupType, key)` - Ensures unique keys within group types
- **Performance Index**: `groupType` - Optimizes queries by group type

## Environment Variables

Add to your `.env` file:

```env
# Settings file storage bucket
SETTINGS_BUCKET=settings

# Cache configuration (optional)
CACHE_TTL=300
MAX_CACHE_SIZE=1000
```

## Database Migration

### PostgreSQL (Prisma)

Run the following command to create and apply the migration:

```bash
npx prisma migrate dev --name add_settings_model
```

### MongoDB

No migration needed - schemas are created automatically when first accessed.

## Usage Examples

### Basic Text Settings

```bash
# Create/update text settings
curl -X POST \
  http://localhost:3000/settings/site_setting/admin \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "siteName=My Website" \
  -F "primaryColor=#000000" \
  -F "secondaryColor=#FFFFFF"
```

### Mixed Text and File Settings

```bash
# Create/update settings with files
curl -X POST \
  http://localhost:3000/settings/site_setting/admin \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "siteName=My Website" \
  -F "siteLogo=@logo.png" \
  -F "bannerImage=@banner.jpg"
```

### Retrieve Settings

```bash
# Public access
curl http://localhost:3000/settings/site_setting/front

# Admin access
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     http://localhost:3000/settings/site_setting/admin
```

## File Upload Configuration

### Supported File Types

- **Images**: JPEG, PNG, WebP, GIF (up to 5MB)
- **Documents**: PDF, Word, Excel, Text files (up to 10MB)

### File Storage

Files are stored in the `SETTINGS` bucket using the existing file management system:

- **AWS S3**: When `ASSET_MANAGEMENT_TOOL=AWS`
- **Local Storage**: When using local file management

### File Naming

Files are automatically renamed using a timestamp-based naming system to prevent conflicts.

## Caching System

### Cache Configuration

- **Default TTL**: 300 seconds (5 minutes)
- **Max Keys**: 1000 entries
- **Auto Cleanup**: Expired entries are cleaned every 60 seconds

### Cache Keys

- Public settings: `settings:public:{groupType}:all`
- Admin settings: `settings:admin:{groupType}:all`
- Individual settings: `settings:admin:{groupType}:{key}`

### Cache Invalidation

Cache is automatically invalidated when:

- Settings are created or updated
- Settings are deleted
- Group types are deleted

## Error Handling

### Custom Exceptions

- `SettingsNotFoundException`: Setting or group type not found
- `InvalidGroupTypeException`: Invalid group type format
- `SettingsValidationException`: Validation errors
- `FileUploadSettingsException`: File upload failures
- `SettingsDuplicateException`: Duplicate setting conflicts
- `SettingsAccessDeniedException`: Authentication required
- `SettingsCacheException`: Cache operation failures

### Validation Rules

- **Group Type**: Letters, numbers, underscores, hyphens only (1-100 chars)
- **Key**: Letters, numbers, underscores, hyphens only (1-100 chars)
- **Restricted Prefixes**: `sys_`, `internal_`, `secret_`
- **Restricted Names**: `system`, `internal`, `secret`, `private`

## Testing

Run the unit tests:

```bash
npm test -- settings.service.spec.ts
```

The test suite covers:

- Settings retrieval and filtering
- Create/update operations
- File upload handling
- Error scenarios
- Cache functionality
- Cleanup operations

## Integration

### Add to App Module

```typescript
import { SettingsModule } from './modules/admin-modules/settings/settings.module';

@Module({
  imports: [
    // ... other imports
    SettingsModule,
  ],
})
export class AppModule {}
```

### Use in Other Services

```typescript
import { SettingsService } from './modules/admin-modules/settings/settings.service';

@Injectable()
export class MyService {
  constructor(private settingsService: SettingsService) {}

  async getAppSettings() {
    return this.settingsService.getPublicSettingsByGroupType('app_config');
  }
}
```

## Security Considerations

- All admin endpoints require JWT authentication
- File upload validation prevents malicious files
- Group type validation prevents system access
- Proper error handling prevents information leakage
- Files are stored securely with access controls

## Performance Optimizations

- Database indexing on frequently queried fields
- Intelligent caching with TTL
- Batch operations for multiple settings
- File cleanup in background operations
- Memory-efficient file processing

## Monitoring and Maintenance

### Cache Statistics

Access cache statistics (admin only):

```
GET /settings/admin/cache/stats
```

### Clear Cache

Clear all cache or specific group type:

```
DELETE /settings/admin/cache/clear
DELETE /settings/admin/cache/clear/:groupType
```

### Health Checks

The module integrates with the application's health check system for monitoring database connectivity and cache status.
