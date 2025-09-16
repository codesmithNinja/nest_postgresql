#!/bin/bash

# Setup Backup Cron Job for Equity Crowdfunding System

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup.sh"
CONFIG_FILE="$SCRIPT_DIR/backup-config.env"

# Default schedule: Daily at 2 AM
DEFAULT_SCHEDULE="0 2 * * *"

# Function to display usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -s, --schedule CRON    Set custom cron schedule (default: '$DEFAULT_SCHEDULE')"
    echo "  -u, --user USER        Set user to run cron job (default: current user)"
    echo "  -r, --remove           Remove existing backup cron job"
    echo "  -l, --list             List current cron jobs"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Setup with default schedule"
    echo "  $0 -s '0 3 * * *'                   # Daily at 3 AM"
    echo "  $0 -s '0 */6 * * *'                 # Every 6 hours"
    echo "  $0 -s '0 2 * * 0'                   # Weekly on Sunday at 2 AM"
    echo "  $0 --remove                          # Remove backup cron job"
}

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to add cron job
add_cron_job() {
    local schedule="$1"
    local user="$2"

    # Create the cron command
    local cron_command="cd $(dirname $BACKUP_SCRIPT) && source $CONFIG_FILE && $BACKUP_SCRIPT"
    local cron_entry="$schedule $cron_command"

    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -F "$BACKUP_SCRIPT" > /dev/null; then
        log "Removing existing backup cron job..."
        (crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT") | crontab -
    fi

    # Add new cron job
    log "Adding backup cron job with schedule: $schedule"
    (crontab -l 2>/dev/null; echo "$cron_entry") | crontab -

    log "Backup cron job added successfully!"
    log "Schedule: $schedule"
    log "Command: $cron_command"
}

# Function to remove cron job
remove_cron_job() {
    if crontab -l 2>/dev/null | grep -F "$BACKUP_SCRIPT" > /dev/null; then
        log "Removing backup cron job..."
        (crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT") | crontab -
        log "Backup cron job removed successfully!"
    else
        log "No backup cron job found"
    fi
}

# Function to list cron jobs
list_cron_jobs() {
    log "Current cron jobs:"
    crontab -l 2>/dev/null || log "No cron jobs found"
}

# Check if backup script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    log "ERROR: Backup script not found: $BACKUP_SCRIPT"
    exit 1
fi

# Make backup script executable
chmod +x "$BACKUP_SCRIPT"

# Parse command line arguments
SCHEDULE="$DEFAULT_SCHEDULE"
USER="$(whoami)"
REMOVE_CRON="false"
LIST_CRON="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--schedule)
            SCHEDULE="$2"
            shift 2
            ;;
        -u|--user)
            USER="$2"
            shift 2
            ;;
        -r|--remove)
            REMOVE_CRON="true"
            shift
            ;;
        -l|--list)
            LIST_CRON="true"
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

# Execute requested action
if [ "$LIST_CRON" = "true" ]; then
    list_cron_jobs
elif [ "$REMOVE_CRON" = "true" ]; then
    remove_cron_job
else
    add_cron_job "$SCHEDULE" "$USER"
fi

log "Done!"