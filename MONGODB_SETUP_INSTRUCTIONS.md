# MongoDB Setup Instructions

## Prerequisites

1. **MongoDB installed and running** on `localhost:27017`
2. **Database configured** in `.env`: `DATABASE_TYPE=mongodb`
3. **All dependencies installed**: `npm install`

## Setup Commands

### Initial Database Setup

```bash
# Option 1: Setup collections and seed data in one go
npm run mongodb:seed

# Option 2: Setup collections first, then seed data
npm run mongodb:setup  # Sets up collections and indexes (optional)
npm run mongodb:seed   # Creates admin user and initial data
```

### Reset Database (if needed)

```bash
npm run mongodb:reset  # Clears all data
npm run mongodb:seed   # Re-create initial data
```

## Created Admin User

After running `npm run mongodb:seed`, you'll have:

- **Admin Email**: `admin@example.com`
- **Admin Password**: `Test@123`
- **Default User**: `divyang.rockersinfo@gmail.com` (Password: `Test@123`)

## Created Data

### Languages (3 total)

- English (default, code: 'en')
- Spanish (code: 'es')
- French (code: 'fr')

### Master Dropdown Options (7 total)

**Industry Categories:**

- Technology (default)
- Healthcare
- Finance
- Real Estate

**Investment Types:**

- Equity (default)
- Debt
- Convertible Note

## Start the Server

```bash
npm run start:dev
```

## Access APIs

1. **Swagger Documentation**: http://localhost:3000/api/docs
2. **Admin Login**: Use `admin@example.com` / `Test@123`
3. **Test Master Dropdown APIs**: Available in the Swagger UI under "Master Dropdown Management"

## Troubleshooting

### If you get "DATABASE_TYPE=mongodb but trying to use Prisma":

- Make sure your `.env` has `DATABASE_TYPE=mongodb`
- Use `npm run mongodb:seed` instead of `npm run prisma:seed`

### If MongoDB connection fails:

- Ensure MongoDB is running: `mongod` or check your MongoDB service
- Verify MongoDB URI in `.env`: `MONGODB_URI=mongodb://localhost:27017/equity_crowfunding_nest`

### If server port conflicts:

- Change the port in `.env`: `PORT=3001`
- Or kill existing processes on port 3000

## Master Dropdown Management Features

✅ **Language auto-detection**: When `languageId` is not provided, creates entries for all active languages
✅ **isDefault field**: Accepts 'YES'/'NO' values
✅ **Multi-language support**: Full CRUD operations per language
✅ **Caching**: Built-in caching for better performance
✅ **Swagger documentation**: Complete API documentation with examples

Your MongoDB database is now ready with admin user and Master Dropdown Management system!
