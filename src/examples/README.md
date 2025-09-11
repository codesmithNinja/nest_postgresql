# I18n Implementation Examples

This directory contains example implementations showing how to integrate i18n (internationalization) into your NestJS application.

## Files in this directory:

### `auth-example.controller.ts`
Example implementation of the AuthController using i18n features:
- Uses `@CurrentLanguage()` decorator to get current language
- Uses `I18nResponseService` for consistent translated responses
- Shows error handling with appropriate translation keys

## How to Use I18n in Your Controllers

### 1. Import Required Services and Decorators
```typescript
import { I18nService } from 'nestjs-i18n';
import { CurrentLanguage } from '../common/decorators/i18n.decorator';
import { I18nResponseService } from '../common/services/i18n-response.service';
```

### 2. Inject Services in Constructor
```typescript
constructor(
  private i18nResponseService: I18nResponseService,
  private i18n: I18nService
) {}
```

### 3. Use Language Detection
```typescript
async someMethod(@CurrentLanguage() lang: string) {
  // lang will contain the detected language (en, es, fr, etc.)
}
```

### 4. Return Translated Responses
```typescript
// Success responses
return this.i18nResponseService.success('auth.login_success', userData);
return this.i18nResponseService.created('user.user_created', newUser);

// Error responses
return this.i18nResponseService.badRequest('auth.invalid_credentials');
return this.i18nResponseService.notFound('user.user_not_found');
```

### 5. Use Translation Keys with Parameters
```typescript
return this.i18nResponseService.validationError('validation.required_field', null, {
  field: 'email'
});
```

## Language Detection Methods

The i18n module supports multiple ways to detect language:

1. **Query Parameter**: `?lang=es`
2. **Header**: `x-lang: es`
3. **Accept-Language Header**: Browser's preferred language
4. **Fallback**: English (en)

## Translation File Structure

Translation files are located in `src/i18n/locales/`:

- `en.json` - English (default)
- `es.json` - Spanish
- `fr.json` - French

### Example translation key usage:
```json
{
  "auth": {
    "login_success": "Login successful",
    "invalid_credentials": "Invalid email or password"
  },
  "validation": {
    "required_field": "{{field}} is required"
  }
}
```

## Testing Different Languages

### Using Query Parameter
```bash
curl http://localhost:3000/auth/login?lang=es
```

### Using Headers
```bash
curl -H "x-lang: fr" http://localhost:3000/auth/login
```

### Using Accept-Language
```bash
curl -H "Accept-Language: es-ES,es;q=0.9" http://localhost:3000/auth/login
```

## Best Practices

1. **Use Descriptive Keys**: `auth.invalid_credentials` instead of `error1`
2. **Group by Feature**: All auth-related messages under `auth.*`
3. **Handle Parameters**: Use `{{field}}` for dynamic values
4. **Consistent Error Handling**: Use try-catch with appropriate translation keys
5. **Fallback Language**: Always provide English translations as fallback

## Migrating Existing Controllers

To migrate your existing controllers:

1. Add i18n service imports
2. Replace hardcoded messages with translation keys
3. Use `I18nResponseService` instead of direct `ResponseHandler`
4. Add `@CurrentLanguage()` parameter where needed
5. Update error handling to use appropriate translation keys