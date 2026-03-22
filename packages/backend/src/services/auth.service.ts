import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth';
import { AuthUser, UserRole } from '../types';
import { ConflictError, UnauthorizedError } from '../utils/errors';
import { generateSlug } from '../utils/helpers';
import { RegisterInput, LoginInput } from '../validators/auth';

interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    organizationId: string;
    organizationName: string;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const slug = generateSlug(input.organizationName);

    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      throw new ConflictError('An organization with a similar name already exists');
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new ConflictError('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: input.organizationName,
          slug,
          settings: {
            defaultDecisionDeadlineDays: 7,
            requireMinimumVoters: 1,
            allowAnonymousVoting: false,
          },
        },
      });

      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          role: 'OWNER',
          organizationId: organization.id,
        },
      });

      return { user, organization };
    });

    const authUser: AuthUser = {
      id: result.user.id,
      email: result.user.email,
      organizationId: result.user.organizationId,
      role: result.user.role as UserRole,
    };

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role as UserRole,
        organizationId: result.user.organizationId,
        organizationName: result.organization.name,
      },
      accessToken: generateToken(authUser),
      refreshToken: generateRefreshToken(authUser),
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await prisma.user.findFirst({
      where: { email: input.email },
      include: { organization: true },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role as UserRole,
    };

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as UserRole,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
      },
      accessToken: generateToken(authUser),
      refreshToken: generateRefreshToken(authUser),
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role as UserRole,
    };

    return {
      accessToken: generateToken(authUser),
      refreshToken: generateRefreshToken(authUser),
    };
  }

  async getProfile(userId: string): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    organizationId: string;
    organizationName: string;
    createdAt: Date;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRole,
      organizationId: user.organizationId,
      organizationName: user.organization.name,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();
