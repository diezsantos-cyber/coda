import { prisma } from '../config/database';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { generateSlug } from '../utils/helpers';
import { UnauthorizedError, ConflictError, NotFoundError } from '../utils/errors';

interface RegisterInput {
  organizationName: string;
  email: string;
  password: string;
  name: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  async register(input: RegisterInput): Promise<{ token: string; user: { id: string; email: string; name: string; role: string; organization: { id: string; name: string; slug: string } } }> {
    const slug = generateSlug(input.organizationName);

    const existingOrg = await prisma.organization.findUnique({ where: { slug } });
    if (existingOrg) {
      throw new ConflictError('Organization with this name already exists');
    }

    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: input.organizationName,
          slug,
        },
      });

      const passwordHash = await hashPassword(input.password);
      const user = await tx.user.create({
        data: {
          organizationId: org.id,
          email: input.email.toLowerCase(),
          passwordHash,
          name: input.name,
          role: 'admin',
        },
      });

      return { org, user };
    });

    const token = generateToken(result.user.id, result.org.id, result.user.role, result.user.email);

    return {
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        organization: {
          id: result.org.id,
          name: result.org.name,
          slug: result.org.slug,
        },
      },
    };
  }

  async login(input: LoginInput): Promise<{ token: string; user: { id: string; email: string; name: string; role: string; organization: { id: string; name: string; slug: string } } }> {
    const user = await prisma.user.findFirst({
      where: { email: input.email.toLowerCase(), isActive: true },
      include: { organization: true },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = generateToken(user.id, user.organizationId, user.role, user.email);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug,
        },
      },
    };
  }

  async getProfile(userId: string): Promise<{ id: string; email: string; name: string; role: string; organizationId: string; organization: { id: string; name: string; slug: string } }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
      },
    };
  }
}

export const authService = new AuthService();
