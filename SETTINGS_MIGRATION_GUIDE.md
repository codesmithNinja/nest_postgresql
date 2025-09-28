# Settings Module Migration Guide

## Overview

This guide provides instructions for setting up the database migration for the new Admin Settings Management feature.

## Database Migration Steps

### For PostgreSQL (Prisma)

1. **Ensure Database Connection**

   First, make sure your `.env` file contains the proper database connection string:
   ```env
   DATABASE_TYPE=postgres
   DATABASE_URL=postgresql://username:password@localhost:5432/your_database_name
   ```

2. **Generate Migration**

   Run the following command to generate the migration:
   ```bash
   npx prisma migrate dev --name add_settings_model
   ```

3. **Apply Migration**

   If you created the migration with `--create-only`, apply it:
   ```bash
   npx prisma migrate deploy
   ```

4. **Generate Prisma Client**

   Update the Prisma client:
   ```bash
   npx prisma generate
   ```

### For MongoDB

MongoDB doesn't require explicit migrations. The Settings collection and indexes will be created automatically when the application starts.

However, you can optionally create indexes manually for better performance:

```javascript
// Connect to your MongoDB instance and run:
db.settings.createIndex({ "groupType": 1, "key": 1 }, { unique: true })
db.settings.createIndex({ "groupType": 1 })
```

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Required: Database configuration
DATABASE_TYPE=postgres  # or mongodb
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
# or
MONGODB_URI=mongodb://localhost:27017/database_name

# Optional: Settings file storage
SETTINGS_BUCKET=settings

# Optional: Cache configuration
CACHE_TTL=300
MAX_CACHE_SIZE=1000

# Optional: File management
ASSET_MANAGEMENT_TOOL=AWS  # or leave empty for local storage
AWS_REGION=us-east-1
AWS_ID=your_access_key
AWS_SECRET=your_secret_key
```

## Manual SQL Migration (if needed)

If you prefer to run the SQL migration manually, here's the PostgreSQL schema:

```sql
-- Create RecordType enum
CREATE TYPE "RecordType" AS ENUM ('STRING', 'FILE');

-- Create settings table
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "groupType" TEXT NOT NULL,
    "recordType" "RecordType" NOT NULL DEFAULT 'STRING',
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on groupType and key combination
ALTER TABLE "settings" ADD CONSTRAINT "settings_groupType_key_key" UNIQUE ("groupType", "key");

-- Create index on groupType for performance
CREATE INDEX "settings_groupType_idx" ON "settings"("groupType");
```

## Verification Steps

### 1. Database Schema Verification

**PostgreSQL**:
```sql
-- Check if the settings table exists
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'settings';

-- Check table structure
\d settings
```

**MongoDB**:
```javascript
// Check if collection exists and has proper indexes
db.settings.getIndexes()
```

### 2. Application Startup

Start your application and check the logs for:
- Database connection success
- Settings module initialization
- Cache initialization

### 3. API Testing

Test the endpoints using curl or your preferred API client:

```bash
# Test public endpoint
curl http://localhost:3000/settings/test_group/front

# Test admin endpoint (requires admin token)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     http://localhost:3000/settings/test_group/admin
```

## Rollback Instructions

### PostgreSQL Rollback

If you need to rollback the migration:

```bash
# Rollback the last migration
npx prisma migrate resolve --rolled-back add_settings_model

# Or manually drop the table
```

```sql
-- Manual rollback SQL
DROP TABLE IF EXISTS "settings";
DROP TYPE IF EXISTS "RecordType";
```

### MongoDB Rollback

For MongoDB, simply drop the collection:

```javascript
db.settings.drop()
```

## Troubleshooting

### Common Issues

1. **Migration fails with "DATABASE_URL not found"**
   - Ensure your `.env` file is in the project root
   - Check that `DATABASE_URL` is properly set

2. **Prisma client out of sync**
   - Run `npx prisma generate` to regenerate the client

3. **MongoDB connection issues**
   - Verify `MONGODB_URI` format
   - Ensure MongoDB service is running

4. **File upload not working**
   - Check `SETTINGS_BUCKET` configuration
   - Verify AWS credentials (if using S3)
   - Ensure upload directories have write permissions (local storage)

### Health Checks

The application includes health checks that will verify:
- Database connectivity
- Required tables/collections exist
- Cache system is operational

Access health checks at: `http://localhost:3000/health`

## Post-Migration Tasks

1. **Test File Uploads**
   - Create test settings with file uploads
   - Verify files are stored correctly
   - Test file deletion on setting updates

2. **Cache Performance**
   - Monitor cache hit rates
   - Adjust TTL settings if needed
   - Verify cache invalidation works correctly

3. **Security Validation**
   - Test admin authentication requirements
   - Verify group type validation
   - Test file upload restrictions

4. **Performance Monitoring**
   - Monitor query performance on groupType index
   - Check memory usage with caching enabled
   - Validate file storage performance

## Support

If you encounter issues during migration:

1. Check application logs for detailed error messages
2. Verify environment variables are set correctly
3. Ensure all dependencies are installed (`npm install`)
4. Confirm database permissions are sufficient
5. Test database connectivity independently

For additional support, refer to the Settings module README.md file for detailed usage instructions and troubleshooting.