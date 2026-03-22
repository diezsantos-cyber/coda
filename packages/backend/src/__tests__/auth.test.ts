import { describe, it, expect } from '@jest/globals';

describe('Auth Module', () => {
  describe('Registration', () => {
    it('should validate registration input schema', () => {
      const { registerSchema } = require('../validators/auth') as { registerSchema: { shape: { body: { safeParse: (data: unknown) => { success: boolean } } } } };
      
      const validInput = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Org',
      };

      const result = registerSchema.shape.body.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject weak passwords', () => {
      const { registerSchema } = require('../validators/auth') as { registerSchema: { shape: { body: { safeParse: (data: unknown) => { success: boolean } } } } };

      const weakInput = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Org',
      };

      const result = registerSchema.shape.body.safeParse(weakInput);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const { registerSchema } = require('../validators/auth') as { registerSchema: { shape: { body: { safeParse: (data: unknown) => { success: boolean } } } } };

      const invalidInput = {
        email: 'not-an-email',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Org',
      };

      const result = registerSchema.shape.body.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('Login', () => {
    it('should validate login input schema', () => {
      const { loginSchema } = require('../validators/auth') as { loginSchema: { shape: { body: { safeParse: (data: unknown) => { success: boolean } } } } };

      const validInput = {
        email: 'test@example.com',
        password: 'Password123',
      };

      const result = loginSchema.shape.body.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });
});

describe('Decision Validators', () => {
  it('should validate create decision schema', () => {
    const { createDecisionSchema } = require('../validators/decision') as { createDecisionSchema: { shape: { body: { safeParse: (data: unknown) => { success: boolean } } } } };

    const validInput = {
      title: 'Test Decision',
      category: 'TECHNICAL',
      options: [
        { title: 'Option A' },
        { title: 'Option B' },
      ],
    };

    const result = createDecisionSchema.shape.body.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject decision with less than 2 options', () => {
    const { createDecisionSchema } = require('../validators/decision') as { createDecisionSchema: { shape: { body: { safeParse: (data: unknown) => { success: boolean } } } } };

    const invalidInput = {
      title: 'Test Decision',
      category: 'TECHNICAL',
      options: [{ title: 'Only one option' }],
    };

    const result = createDecisionSchema.shape.body.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject short titles', () => {
    const { createDecisionSchema } = require('../validators/decision') as { createDecisionSchema: { shape: { body: { safeParse: (data: unknown) => { success: boolean } } } } };

    const invalidInput = {
      title: 'AB',
      category: 'TECHNICAL',
    };

    const result = createDecisionSchema.shape.body.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});

describe('Error Classes', () => {
  it('should create NotFoundError with correct properties', () => {
    const { NotFoundError } = require('../utils/errors') as { NotFoundError: new (resource: string, id?: string) => { statusCode: number; code: string; message: string } };
    const error = new NotFoundError('Decision', '123');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toContain('123');
  });

  it('should create UnauthorizedError with correct properties', () => {
    const { UnauthorizedError } = require('../utils/errors') as { UnauthorizedError: new (message?: string) => { statusCode: number; code: string } };
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
  });

  it('should create ForbiddenError with correct properties', () => {
    const { ForbiddenError } = require('../utils/errors') as { ForbiddenError: new (message?: string) => { statusCode: number; code: string } };
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });

  it('should create TenantIsolationError', () => {
    const { TenantIsolationError } = require('../utils/errors') as { TenantIsolationError: new () => { statusCode: number; code: string } };
    const error = new TenantIsolationError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('TENANT_ISOLATION_VIOLATION');
  });
});

describe('Helpers', () => {
  it('should parse pagination with defaults', () => {
    const { parsePagination } = require('../utils/helpers') as { parsePagination: (query: Record<string, unknown>) => { page: number; limit: number } };
    const result = parsePagination({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should cap pagination limit at 100', () => {
    const { parsePagination } = require('../utils/helpers') as { parsePagination: (query: Record<string, unknown>) => { page: number; limit: number } };
    const result = parsePagination({ limit: '500' });
    expect(result.limit).toBe(100);
  });

  it('should generate valid slugs', () => {
    const { generateSlug } = require('../utils/helpers') as { generateSlug: (text: string) => string };
    expect(generateSlug('My Test Organization')).toBe('my-test-organization');
    expect(generateSlug('Hello World! @#$')).toBe('hello-world');
  });

  it('should create paginated response', () => {
    const { paginatedResponse } = require('../utils/helpers') as { paginatedResponse: <T>(data: T[], total: number, params: { page: number; limit: number }) => { data: T[]; meta: { total: number; totalPages: number } } };
    const result = paginatedResponse(['a', 'b'], 10, { page: 1, limit: 5 });
    expect(result.data).toEqual(['a', 'b']);
    expect(result.meta.total).toBe(10);
    expect(result.meta.totalPages).toBe(2);
  });
});
