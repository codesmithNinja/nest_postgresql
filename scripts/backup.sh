#!/bin/bash

# Campaign System Backup Script
set -e

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
POSTGRES_BACKUP="campaign_postgres_$DATE.sql"
MONGODB_BACKUP="campaign_mongodb_$DATE"
UPLOADS_BACKUP="campaign_uploads_$DATE.tar.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
echo "Backing up PostgreSQL..."
docker exec postgres pg_dump -U $POSTGRES_USER campaign_db > "$BACKUP_DIR/$POSTGRES_BACKUP"

# Backup MongoDB
echo "Backing up MongoDB..."
docker exec mongodb mongodump --db campaign_db --out "/tmp/$MONGODB_BACKUP"
docker cp mongodb:/tmp/$MONGODB_BACKUP $BACKUP_DIR/

# Backup uploads directory
echo "Backing up uploads..."
tar -czf "$BACKUP_DIR/$UPLOADS_BACKUP" uploads/

# Upload to cloud storage (example with AWS S3)
if [ ! -z "$AWS_S3_BUCKET" ]; then
    echo "Uploading backups to S3..."
    aws s3 cp "$BACKUP_DIR/$POSTGRES_BACKUP" "s3://$AWS_S3_BUCKET/backups/"
    aws s3 cp "$BACKUP_DIR/$MONGODB_BACKUP.tar.gz" "s3://$AWS_S3_BUCKET/backups/"
    aws s3 cp "$BACKUP_DIR/$UPLOADS_BACKUP" "s3://$AWS_S3_BUCKET/backups/"
fi

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "campaign_*" -mtime +7 -delete

echo "Backup completed successfully!"