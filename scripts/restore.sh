#!/bin/bash

# Equity Crowdfunding System Restore Script
set -e

# Enable logging
exec > >(tee -a "/var/log/restore.log") 2>&1

# Configuration with environment variable defaults
BACKUP_DIR="${BACKUP_DIR:-/backups}"
DB_NAME="${POSTGRES_DB:-equity_crowfunding_nest}"
MONGO_DB_NAME="${MONGO_DB:-equity_crowfunding_nest}"

# Docker container names (configurable)
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-postgres}"
MONGODB_CONTAINER="${MONGODB_CONTAINER:-mongodb}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Error handling function
handle_error() {
    log "ERROR: $1"
    exit 1
}

# Usage function
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -p, --postgres FILE     Restore PostgreSQL from specified backup file"
    echo "  -m, --mongodb FILE      Restore MongoDB from specified backup file"
    echo "  -u, --uploads FILE      Restore uploads from specified backup file"
    echo "  -l, --list              List available backup files"
    echo "  -f, --force             Force restore without confirmation"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --list"
    echo "  $0 --postgres equity_crowdfunding_postgres_20231215_120000.sql"
    echo "  $0 --mongodb equity_crowdfunding_mongodb_20231215_120000.tar.gz"
    echo "  $0 --postgres backup.sql --mongodb backup.tar.gz --force"
}

# List available backups
list_backups() {
    log "Available backup files in $BACKUP_DIR:"
    echo ""

    echo "PostgreSQL backups:"
    find "$BACKUP_DIR" -name "equity_crowdfunding_postgres_*.sql" -type f -exec basename {} \; 2>/dev/null | sort -r | head -10 || echo "  No PostgreSQL backups found"

    echo ""
    echo "MongoDB backups:"
    find "$BACKUP_DIR" -name "equity_crowdfunding_mongodb_*.tar.gz" -type f -exec basename {} \; 2>/dev/null | sort -r | head -10 || echo "  No MongoDB backups found"

    echo ""
    echo "Upload backups:"
    find "$BACKUP_DIR" -name "equity_crowdfunding_uploads_*.tar.gz" -type f -exec basename {} \; 2>/dev/null | sort -r | head -10 || echo "  No upload backups found"
}

# Confirm action
confirm_action() {
    if [ "$FORCE_RESTORE" != "true" ]; then
        echo ""
        read -p "Are you sure you want to restore? This will overwrite existing data. (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Restore cancelled by user"
            exit 0
        fi
    fi
}

# Check if Docker containers are running
check_containers() {
    if [ ! -z "$POSTGRES_FILE" ]; then
        if ! docker ps | grep -q "$POSTGRES_CONTAINER"; then
            handle_error "PostgreSQL container '$POSTGRES_CONTAINER' is not running"
        fi
    fi

    if [ ! -z "$MONGODB_FILE" ]; then
        if ! docker ps | grep -q "$MONGODB_CONTAINER"; then
            handle_error "MongoDB container '$MONGODB_CONTAINER' is not running"
        fi
    fi
}

# Restore PostgreSQL
restore_postgres() {
    local backup_file="$1"
    local full_path="$BACKUP_DIR/$backup_file"

    if [ ! -f "$full_path" ]; then
        handle_error "PostgreSQL backup file not found: $full_path"
    fi

    log "Restoring PostgreSQL from: $backup_file"

    # Drop existing database and recreate
    log "Dropping existing database: $DB_NAME"
    docker exec "$POSTGRES_CONTAINER" psql -U "${POSTGRES_USER:-postgres}" -c "DROP DATABASE IF EXISTS $DB_NAME;"

    log "Creating database: $DB_NAME"
    docker exec "$POSTGRES_CONTAINER" psql -U "${POSTGRES_USER:-postgres}" -c "CREATE DATABASE $DB_NAME;"

    # Restore database
    log "Restoring database from backup..."
    if ! docker exec -i "$POSTGRES_CONTAINER" psql -U "${POSTGRES_USER:-postgres}" "$DB_NAME" < "$full_path"; then
        handle_error "Failed to restore PostgreSQL database"
    fi

    log "PostgreSQL restore completed successfully"
}

# Restore MongoDB
restore_mongodb() {
    local backup_file="$1"
    local full_path="$BACKUP_DIR/$backup_file"

    if [ ! -f "$full_path" ]; then
        handle_error "MongoDB backup file not found: $full_path"
    fi

    log "Restoring MongoDB from: $backup_file"

    # Extract backup to temporary directory
    local temp_dir="/tmp/mongo_restore_$(date +%s)"
    mkdir -p "$temp_dir"

    # Extract the tar.gz file
    if ! tar -xzf "$full_path" -C "$temp_dir"; then
        handle_error "Failed to extract MongoDB backup"
    fi

    # Copy extracted backup to container
    local backup_name=$(basename "$backup_file" .tar.gz)
    docker cp "$temp_dir/$backup_name" "$MONGODB_CONTAINER:/tmp/"

    # Drop existing database
    log "Dropping existing MongoDB database: $MONGO_DB_NAME"
    docker exec "$MONGODB_CONTAINER" mongo "$MONGO_DB_NAME" --eval "db.dropDatabase()"

    # Restore database
    log "Restoring MongoDB database..."
    if ! docker exec "$MONGODB_CONTAINER" mongorestore --db "$MONGO_DB_NAME" "/tmp/$backup_name/$MONGO_DB_NAME"; then
        handle_error "Failed to restore MongoDB database"
    fi

    # Cleanup
    docker exec "$MONGODB_CONTAINER" rm -rf "/tmp/$backup_name"
    rm -rf "$temp_dir"

    log "MongoDB restore completed successfully"
}

# Restore uploads
restore_uploads() {
    local backup_file="$1"
    local full_path="$BACKUP_DIR/$backup_file"

    if [ ! -f "$full_path" ]; then
        handle_error "Uploads backup file not found: $full_path"
    fi

    log "Restoring uploads from: $backup_file"

    # Remove existing uploads directory
    if [ -d "uploads" ]; then
        log "Removing existing uploads directory"
        rm -rf uploads
    fi

    # Extract uploads
    if ! tar -xzf "$full_path"; then
        handle_error "Failed to extract uploads backup"
    fi

    log "Uploads restore completed successfully"
}

# Parse command line arguments
POSTGRES_FILE=""
MONGODB_FILE=""
UPLOADS_FILE=""
FORCE_RESTORE="false"
LIST_BACKUPS="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--postgres)
            POSTGRES_FILE="$2"
            shift 2
            ;;
        -m|--mongodb)
            MONGODB_FILE="$2"
            shift 2
            ;;
        -u|--uploads)
            UPLOADS_FILE="$2"
            shift 2
            ;;
        -l|--list)
            LIST_BACKUPS="true"
            shift
            ;;
        -f|--force)
            FORCE_RESTORE="true"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# List backups if requested
if [ "$LIST_BACKUPS" = "true" ]; then
    list_backups
    exit 0
fi

# Check if at least one restore option is specified
if [ -z "$POSTGRES_FILE" ] && [ -z "$MONGODB_FILE" ] && [ -z "$UPLOADS_FILE" ]; then
    echo "Error: No restore options specified"
    echo ""
    usage
    exit 1
fi

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    handle_error "Backup directory not found: $BACKUP_DIR"
fi

log "Starting restore process..."

# Check containers
check_containers

# Confirm action
confirm_action

# Perform restores
if [ ! -z "$POSTGRES_FILE" ]; then
    restore_postgres "$POSTGRES_FILE"
fi

if [ ! -z "$MONGODB_FILE" ]; then
    restore_mongodb "$MONGODB_FILE"
fi

if [ ! -z "$UPLOADS_FILE" ]; then
    restore_uploads "$UPLOADS_FILE"
fi

log "Restore process completed successfully!"