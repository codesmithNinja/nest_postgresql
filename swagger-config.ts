import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Campaign Management & Master Dropdown API')
  .setDescription(
    `
    Comprehensive campaign management system with multi-step campaign creation,
    investor management, team management, file uploads, and multi-language dropdown management.

    ## Authentication
    - **User Auth**: All user endpoints except /equity/front and /health require JWT authentication
    - **Admin Auth**: All admin endpoints require Admin JWT authentication
    - Use /auth/login for user authentication and admin login for admin authentication

    ## Campaign Creation Process
    1. **Step 1**: Create campaign with company information (POST /equity)
    2. **Step 2**: Update fundraising details (PATCH /equity/:id)
    3. **Step 3**: Add project story (PATCH /equity/:id)
    4. **Step 4**: Add FAQs (POST /campaignFaq/:equityId)
    5. **Step 5**: Add extras (videos, images, documents)
    6. **Step 6**: Add investment information (PATCH /equity/:id)

    ## Master Dropdown Management
    **Multi-language dropdown system with automatic language detection:**

    ### Key Features:
    - **Auto Language Detection**: System detects language from headers/query params
    - **Multi-Language Creation**: When creating dropdowns without languageId, creates for ALL active languages
    - **isDefault Support**: Accepts 'YES'/'NO' values for default options
    - **Public Access**: Get dropdown options without authentication
    - **Admin Management**: Full CRUD with authentication required

    ### Language Detection Priority:
    1. Query parameter: \`?lang=es\`
    2. Custom header: \`X-Language: es\`
    3. Accept-Language header: \`Accept-Language: es-ES,es;q=0.9\`
    4. Default: English (en)

    ### Available Dropdown Types:
    - \`industry\` - Business industries (Technology, Healthcare, Finance, Real Estate)
    - \`investment_type\` - Investment types (Equity, Debt, Convertible Note)
    - \`company-industry\` - Company industry categories (alias for industry)
    - Custom types can be created via admin endpoints

    ### Example Usage:
    \`\`\`bash
    # Get dropdown options (auto-detects language)
    GET /manage-dropdown/industry?lang=es

    # Create dropdown (creates for all active languages if no languageId)
    POST /manage-dropdown/industry
    {
      "name": "Technology",
      "isDefault": "YES"
    }

    # Bulk operations
    PATCH /manage-dropdown/industry/bulk
    {
      "publicIds": ["2ec8a4cf-000e-4582-b802-86c9360c03dc"],
      "action": "activate"
    }
    \`\`\`

    ### Seeded Test Data:
    - **Admin Login**: admin@example.com / Test@123
    - **Test User**: divyang.rockersinfo@gmail.com / Test@123
    - **Languages**: English (en), Spanish (es), French (fr)
    - **Industry Options**: Technology, Healthcare, Finance, Real Estate
    - **Investment Types**: Equity, Debt, Convertible Note

    ## File Uploads
    Use multipart/form-data for all file uploads. Supported formats:
    - Images: JPEG, PNG, WebP, GIF (max 5MB)
    - Videos: MP4, WebM, OGG (max 100MB)
    - Documents: PDF, DOC, DOCX, XLS, XLSX (max 10MB)

    ## Rate Limiting
    - Authentication endpoints: 5 requests/minute
    - File uploads: 2 requests/minute
    - General endpoints: 10 requests/second

    ## Multi-Language Support
    All error messages and responses support internationalization.
    Available languages: English (en), Spanish (es), French (fr)
  `
  )
  .setVersion('1.0')
  .addBearerAuth({
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    name: 'Authorization',
    description: 'Enter your JWT token',
    in: 'header',
  })
  .addTag('Authentication', 'User authentication and authorization')
  .addTag('Users', 'User profile management')
  .addTag('Equity Campaigns', 'Main campaign management')
  .addTag('Lead Investors', 'Campaign lead investor management')
  .addTag('Team Members', 'Campaign team member management')
  .addTag('Campaign FAQs', 'Campaign FAQ management')
  .addTag('Extras Videos', 'Campaign video content management')
  .addTag('Extras Images', 'Campaign image content management')
  .addTag('Extras Documents', 'Campaign document management')
  .addTag('Languages', 'Multi-language system management')
  .addTag('Master Dropdown Management', 'Dynamic dropdown options with multi-language support')
  .addServer('http://localhost:3000', 'Development server')
  .addServer('https://api.yourdomain.com', 'Production server')
  .build();
