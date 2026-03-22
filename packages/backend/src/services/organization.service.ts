import { prisma } from '../config/database';
import { UserRole } from '../types';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';
import { UpdateOrganizationInput, InviteMemberInput } from '../validators/organization';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export class OrganizationService {
  async getOrganization(organizationId: string): Promise<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    settings: unknown;
    memberCount: number;
    createdAt: Date;
  }> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!org) {
      throw new NotFoundError('Organization', organizationId);
    }

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      settings: org.settings,
      memberCount: org._count.users,
      createdAt: org.createdAt,
    };
  }

  async updateOrganization(
    organizationId: string,
    userId: string,
    input: UpdateOrganizationInput,
  ): Promise<{ id: string; name: string; slug: string; description: string | null; settings: unknown }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
      throw new ForbiddenError('Only owners and admins can update organization settings');
    }

    const org = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.settings && { settings: input.settings }),
      },
    });

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      settings: org.settings,
    };
  }

  async getMembers(organizationId: string): Promise<
    Array<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      isActive: boolean;
      lastLoginAt: Date | null;
      createdAt: Date;
    }>
  > {
    const members = await prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return members;
  }

  async inviteMember(
    organizationId: string,
    inviterId: string,
    input: InviteMemberInput,
  ): Promise<{ id: string; email: string; role: string; token: string; expiresAt: Date }> {
    const inviter = await prisma.user.findUnique({
      where: { id: inviterId },
    });

    if (!inviter || (inviter.role !== 'OWNER' && inviter.role !== 'ADMIN')) {
      throw new ForbiddenError('Only owners and admins can invite members');
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: input.email, organizationId },
    });

    if (existingUser) {
      throw new ConflictError('User is already a member of this organization');
    }

    const existingInvite = await prisma.invite.findFirst({
      where: {
        email: input.email,
        organizationId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      throw new ConflictError('An active invite already exists for this email');
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await prisma.invite.create({
      data: {
        email: input.email,
        role: input.role as UserRole,
        token,
        expiresAt,
        organizationId,
      },
    });

    return {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      token: invite.token,
      expiresAt: invite.expiresAt,
    };
  }

  async acceptInvite(
    token: string,
    firstName: string,
    lastName: string,
    password: string,
  ): Promise<{ userId: string; organizationId: string }> {
    const invite = await prisma.invite.findUnique({
      where: { token },
    });

    if (!invite) {
      throw new NotFoundError('Invite');
    }

    if (invite.acceptedAt) {
      throw new ConflictError('This invite has already been accepted');
    }

    if (invite.expiresAt < new Date()) {
      throw new ForbiddenError('This invite has expired');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: invite.email,
          passwordHash,
          firstName,
          lastName,
          role: invite.role,
          organizationId: invite.organizationId,
        },
      });

      await tx.invite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      return user;
    });

    return {
      userId: result.id,
      organizationId: result.organizationId,
    };
  }

  async updateMemberRole(
    organizationId: string,
    updaterId: string,
    memberId: string,
    role: string,
  ): Promise<{ id: string; email: string; role: string }> {
    const updater = await prisma.user.findUnique({
      where: { id: updaterId },
    });

    if (!updater || updater.role !== 'OWNER') {
      throw new ForbiddenError('Only the organization owner can change member roles');
    }

    if (updaterId === memberId) {
      throw new ForbiddenError('Cannot change your own role');
    }

    const member = await prisma.user.findFirst({
      where: { id: memberId, organizationId },
    });

    if (!member) {
      throw new NotFoundError('Member', memberId);
    }

    const updated = await prisma.user.update({
      where: { id: memberId },
      data: { role: role as UserRole },
    });

    return {
      id: updated.id,
      email: updated.email,
      role: updated.role,
    };
  }

  async removeMember(
    organizationId: string,
    removerId: string,
    memberId: string,
  ): Promise<void> {
    const remover = await prisma.user.findUnique({
      where: { id: removerId },
    });

    if (!remover || (remover.role !== 'OWNER' && remover.role !== 'ADMIN')) {
      throw new ForbiddenError('Only owners and admins can remove members');
    }

    if (removerId === memberId) {
      throw new ForbiddenError('Cannot remove yourself from the organization');
    }

    const member = await prisma.user.findFirst({
      where: { id: memberId, organizationId },
    });

    if (!member) {
      throw new NotFoundError('Member', memberId);
    }

    if (member.role === 'OWNER') {
      throw new ForbiddenError('Cannot remove the organization owner');
    }

    await prisma.user.update({
      where: { id: memberId },
      data: { isActive: false },
    });
  }
}

export const organizationService = new OrganizationService();
