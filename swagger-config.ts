import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Campaign Management API')
  .setDescription(
    `
    Comprehensive campaign management system with multi-step campaign creation,
    investor management, team management, and file uploads.
    
    ## Authentication
    All endpoints except /equity/front and /health require JWT authentication.
    Use the /auth/login endpoint to obtain a token.
    
    ## Campaign Creation Process
    1. **Step 1**: Create campaign with company information (POST /equity)
    2. **Step 2**: Update fundraising details (PATCH /equity/:id)
    3. **Step 3**: Add project story (PATCH /equity/:id)
    4. **Step 4**: Add FAQs (POST /campaignFaq/:equityId)
    5. **Step 5**: Add extras (videos, images, documents)
    6. **Step 6**: Add investment information (PATCH /equity/:id)
    
    ## File Uploads
    Use multipart/form-data for all file uploads. Supported formats:
    - Images: JPEG, PNG, WebP, GIF (max 5MB)
    - Videos: MP4, WebM, OGG (max 100MB) 
    - Documents: PDF, DOC, DOCX, XLS, XLSX (max 10MB)
    
    ## Rate Limiting
    - Authentication endpoints: 5 requests/minute
    - File uploads: 2 requests/minute
    - General endpoints: 10 requests/second
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
  .addServer('http://localhost:3000', 'Development server')
  .addServer('https://api.yourdomain.com', 'Production server')
  .build();
