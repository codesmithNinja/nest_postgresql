# Backup and Restore Scripts

This directory contains backup and restore scripts for the Equity Crowdfunding NestJS application.

## Scripts Overview

### 1. `backup.sh`

Comprehensive backup script that creates backups of:

- PostgreSQL database (`equity_crowdfunding_nest`)
- MongoDB database (`equity_crowfunding_nest`)
- Uploads directory
- Optional S3 cloud storage upload

### 2. `restore.sh`

Restore script that can restore from backup files:

- PostgreSQL database restoration
- MongoDB database restoration
- Uploads directory restoration

### 3. `setup-backup-cron.sh`

Utility script to setup automated backups via cron jobs.

### 4. `backup-config.env`

Configuration file with environment variables for backup settings.

## Usage

### Basic Backup

```bash
# Run manual backup
./backup.sh

# Run backup with custom configuration
source backup-config.env && ./backup.sh
```

### Restore Operations

```bash
# List available backups
./restore.sh --list

# Restore PostgreSQL only
./restore.sh --postgres equity_crowdfunding_postgres_20231215_120000.sql

# Restore MongoDB only
./restore.sh --mongodb equity_crowdfunding_mongodb_20231215_120000.tar.gz

# Restore both databases (with confirmation)
./restore.sh --postgres backup.sql --mongodb backup.tar.gz

# Force restore without confirmation
./restore.sh --postgres backup.sql --mongodb backup.tar.gz --force
```

### Setup Automated Backups

```bash
# Setup daily backup at 2 AM (default)
./setup-backup-cron.sh

# Setup custom schedule (every 6 hours)
./setup-backup-cron.sh --schedule "0 */6 * * *"

# Remove backup cron job
./setup-backup-cron.sh --remove

# List current cron jobs
./setup-backup-cron.sh --list
```

## Configuration

### Environment Variables

The scripts use the following environment variables (with defaults):

| Variable                | Default                   | Description                      |
| ----------------------- | ------------------------- | -------------------------------- |
| `BACKUP_DIR`            | `/backups`                | Directory to store backups       |
| `POSTGRES_DB`           | `equity_crowfunding_nest` | PostgreSQL database name         |
| `MONGO_DB`              | `equity_crowfunding_nest` | MongoDB database name            |
| `POSTGRES_CONTAINER`    | `postgres`                | PostgreSQL Docker container name |
| `MONGODB_CONTAINER`     | `mongodb`                 | MongoDB Docker container name    |
| `POSTGRES_USER`         | `postgres`                | PostgreSQL username              |
| `BACKUP_RETENTION_DAYS` | `7`                       | Days to keep local backups       |
| `AWS_S3_BUCKET`         | (optional)                | S3 bucket for cloud backups      |

### S3 Cloud Backup Configuration

To enable S3 uploads, set these environment variables:

```bash
export AWS_S3_BUCKET=your-backup-bucket
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1
```

## Features

### Backup Script Features

- ✅ Comprehensive logging with timestamps
- ✅ Error handling and validation
- ✅ Docker container health checks
- ✅ Automatic compression for MongoDB backups
- ✅ S3 cloud storage upload (optional)
- ✅ Automatic cleanup of old backups
- ✅ Backup size reporting
- ✅ Configurable retention policy

### Restore Script Features

- ✅ Interactive confirmation prompts
- ✅ Force mode for automated restores
- ✅ Backup file listing and validation
- ✅ Database recreation for clean restores
- ✅ Automatic cleanup of temporary files
- ✅ Support for partial restores (individual components)

### Automation Features

- ✅ Cron job setup and management
- ✅ Configurable backup schedules
- ✅ User-specific cron job installation
- ✅ Easy removal of scheduled backups

## File Structure

```
scripts/
├── backup.sh              # Main backup script
├── restore.sh             # Main restore script
├── setup-backup-cron.sh   # Cron job setup utility
├── backup-config.env      # Configuration file
└── README.md              # This file
```

## Backup File Naming Convention

- PostgreSQL: `equity_crowdfunding_postgres_YYYYMMDD_HHMMSS.sql`
- MongoDB: `equity_crowdfunding_mongodb_YYYYMMDD_HHMMSS.tar.gz`
- Uploads: `equity_crowdfunding_uploads_YYYYMMDD_HHMMSS.tar.gz`

## Prerequisites

1. Docker and Docker Compose running
2. PostgreSQL and MongoDB containers running
3. Appropriate permissions for backup directory
4. (Optional) AWS CLI configured for S3 uploads

## Troubleshooting

### Common Issues

1. **Permission Denied**

   ```bash
   chmod +x scripts/*.sh
   ```

2. **Container Not Found**
   - Verify container names in configuration
   - Check if containers are running: `docker ps`

3. **Backup Directory Access**
   - Ensure backup directory exists and is writable
   - Check disk space availability

4. **S3 Upload Failures**
   - Verify AWS credentials and bucket permissions
   - Check internet connectivity

### Logs

Backup and restore operations are logged to:

- `/var/log/backup.log`
- `/var/log/restore.log`

Monitor logs for detailed error information:

```bash
tail -f /var/log/backup.log
tail -f /var/log/restore.log
```

## Security Considerations

1. **Backup Encryption**: Consider encrypting sensitive backup files
2. **Access Control**: Restrict access to backup files and scripts
3. **Credentials**: Store database credentials securely
4. **S3 Permissions**: Use minimal required S3 permissions
5. **Log Rotation**: Implement log rotation for backup logs

## Best Practices

1. **Test Restores**: Regularly test restore procedures
2. **Monitor Backups**: Set up monitoring and alerts
3. **Multiple Locations**: Store backups in multiple locations
4. **Documentation**: Keep backup procedures documented
5. **Versioning**: Maintain backup script version control
