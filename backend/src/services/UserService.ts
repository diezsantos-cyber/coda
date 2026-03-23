import { prisma } from '../config/database';
import { hashPassword } from '../utils/password';
import { NotFoundError, ConflictError } from '../utils/errors';

export class UserService {
  async list(organizationId: string): Promise<Array<{ id: string; email: string; name: string; role: string; isActive: boolean; createdAt: Date }>> {
    const users = await prisma.user.findMany({
      where: { organizationId },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return users;
  }

  async create(organizationId: string, input: { email: string; password: string; name: string; role?: string }): Promise<{ id: string; email: string; name: string; role: string }> {
    const existing = await prisma.user.findFirst({
      where: { organizationId, email: input.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictError('User with this email already exists in this organization');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        organizationId,
        email: input.email.toLowerCase(),
        passwordHash,
        name: input.name,
        role: input.role ?? 'admin',
      },
      select: { id: true, email: true, name: true, role: true },
    });
    return user;
  }

  async update(organizationId: string, userId: string, input: { name?: string; role?: string; email?: string }): Promise<{ id: string; email: string; name: string; role: string }> {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId },
    });
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.role !== undefined && { role: input.role }),
        ...(input.email !== undefined && { email: input.email.toLowerCase() }),
      },
      select: { id: true, email: true, name: true, role: true },
    });
    return updated;
  }

  async deactivate(organizationId: string, userId: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId },
    });
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }
}

export const userService = new UserService();
