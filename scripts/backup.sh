#!/bin/bash

# Equity Crowdfunding System Backup Script
set -e

# Enable logging
exec > >(tee -a "/var/log/backup.log") 2>&1

# Configuration with environment variable defaults
BACKUP_DIR="${BACKUP_DIR:-/backups}"
DATE=$(date +"%Y%m%d_%H%M%S")
DB_NAME="${POSTGRES_DB:-equity_crowfunding_nest}"
MONGO_DB_NAME="${MONGO_DB:-equity_crowfunding_nest}"

# Docker container names (configurable)
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-postgres}"
MONGODB_CONTAINER="${MONGODB_CONTAINER:-mongodb}"

# Backup file names
POSTGRES_BACKUP="equity_crowdfunding_postgres_$DATE.sql"
MONGODB_BACKUP="equity_crowdfunding_mongodb_$DATE"
UPLOADS_BACKUP="equity_crowdfunding_uploads_$DATE.tar.gz"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Error handling function
handle_error() {
    log "ERROR: $1"
    exit 1
}

log "Starting backup process..."

# Create backup directory
mkdir -p "$BACKUP_DIR" || handle_error "Failed to create backup directory"

# Check if Docker containers are running
if ! docker ps | grep -q "$POSTGRES_CONTAINER"; then
    handle_error "PostgreSQL container '$POSTGRES_CONTAINER' is not running"
fi

if ! docker ps | grep -q "$MONGODB_CONTAINER"; then
    handle_error "MongoDB container '$MONGODB_CONTAINER' is not running"
fi

# Backup PostgreSQL
log "Backing up PostgreSQL database: $DB_NAME"
if ! docker exec "$POSTGRES_CONTAINER" pg_dump -U "${POSTGRES_USER:-postgres}" "$DB_NAME" > "$BACKUP_DIR/$POSTGRES_BACKUP"; then
    handle_error "PostgreSQL backup failed"
fi
log "PostgreSQL backup completed: $POSTGRES_BACKUP"

# Backup MongoDB
log "Backing up MongoDB database: $MONGO_DB_NAME"
if ! docker exec "$MONGODB_CONTAINER" mongodump --db "$MONGO_DB_NAME" --out "/tmp/$MONGODB_BACKUP"; then
    handle_error "MongoDB backup failed"
fi

# Copy MongoDB backup from container
if ! docker cp "$MONGODB_CONTAINER:/tmp/$MONGODB_BACKUP" "$BACKUP_DIR/"; then
    handle_error "Failed to copy MongoDB backup from container"
fi

# Compress MongoDB backup
if ! tar -czf "$BACKUP_DIR/$MONGODB_BACKUP.tar.gz" -C "$BACKUP_DIR" "$MONGODB_BACKUP"; then
    handle_error "Failed to compress MongoDB backup"
fi

# Remove uncompressed MongoDB backup
rm -rf "$BACKUP_DIR/$MONGODB_BACKUP"

# Clean up MongoDB backup from container
docker exec "$MONGODB_CONTAINER" rm -rf "/tmp/$MONGODB_BACKUP"
log "MongoDB backup completed: $MONGODB_BACKUP.tar.gz"

# Backup uploads directory if it exists
if [ -d "uploads" ]; then
    log "Backing up uploads directory..."
    if ! tar -czf "$BACKUP_DIR/$UPLOADS_BACKUP" uploads/; then
        log "WARNING: Failed to backup uploads directory"
    else
        log "Uploads backup completed: $UPLOADS_BACKUP"
    fi
else
    log "WARNING: uploads directory not found, skipping uploads backup"
fi

# Upload to cloud storage (AWS S3)
if [ ! -z "$AWS_S3_BUCKET" ]; then
    log "Uploading backups to S3 bucket: $AWS_S3_BUCKET"

    # Check if AWS CLI is available
    if ! command -v aws &> /dev/null; then
        log "WARNING: AWS CLI not found, skipping S3 upload"
    else
        # Upload PostgreSQL backup
        if aws s3 cp "$BACKUP_DIR/$POSTGRES_BACKUP" "s3://$AWS_S3_BUCKET/backups/postgres/"; then
            log "PostgreSQL backup uploaded to S3"
        else
            log "WARNING: Failed to upload PostgreSQL backup to S3"
        fi

        # Upload MongoDB backup
        if aws s3 cp "$BACKUP_DIR/$MONGODB_BACKUP.tar.gz" "s3://$AWS_S3_BUCKET/backups/mongodb/"; then
            log "MongoDB backup uploaded to S3"
        else
            log "WARNING: Failed to upload MongoDB backup to S3"
        fi

        # Upload uploads backup if it exists
        if [ -f "$BACKUP_DIR/$UPLOADS_BACKUP" ]; then
            if aws s3 cp "$BACKUP_DIR/$UPLOADS_BACKUP" "s3://$AWS_S3_BUCKET/backups/uploads/"; then
                log "Uploads backup uploaded to S3"
            else
                log "WARNING: Failed to upload uploads backup to S3"
            fi
        fi
    fi
else
    log "AWS_S3_BUCKET not configured, skipping S3 upload"
fi

# Cleanup old local backups (keep last 7 days by default)
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
log "Cleaning up backups older than $RETENTION_DAYS days..."

if find "$BACKUP_DIR" -name "equity_crowdfunding_*" -mtime +$RETENTION_DAYS -delete; then
    log "Old backups cleaned up successfully"
else
    log "WARNING: Failed to clean up old backups"
fi

# Display backup summary
log "=== BACKUP SUMMARY ==="
log "Backup directory: $BACKUP_DIR"
log "PostgreSQL backup: $POSTGRES_BACKUP ($(du -h "$BACKUP_DIR/$POSTGRES_BACKUP" | cut -f1))"
log "MongoDB backup: $MONGODB_BACKUP.tar.gz ($(du -h "$BACKUP_DIR/$MONGODB_BACKUP.tar.gz" | cut -f1))"
if [ -f "$BACKUP_DIR/$UPLOADS_BACKUP" ]; then
    log "Uploads backup: $UPLOADS_BACKUP ($(du -h "$BACKUP_DIR/$UPLOADS_BACKUP" | cut -f1))"
fi
log "======================"

log "Backup completed successfully!"