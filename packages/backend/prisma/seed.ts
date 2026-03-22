import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.info('Seeding database...');

  // Create demo organization
  const org = await prisma.organization.create({
    data: {
      name: 'Demo Organization',
      slug: 'demo-organization',
      description: 'A demo organization for testing CODA',
      settings: {
        defaultDecisionDeadlineDays: 7,
        requireMinimumVoters: 2,
        allowAnonymousVoting: false,
      },
    },
  });

  const passwordHash = await bcrypt.hash('Password123', 12);

  // Create demo users
  const owner = await prisma.user.create({
    data: {
      email: 'owner@demo.com',
      passwordHash,
      firstName: 'Alice',
      lastName: 'Owner',
      role: 'OWNER',
      organizationId: org.id,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      passwordHash,
      firstName: 'Bob',
      lastName: 'Admin',
      role: 'ADMIN',
      organizationId: org.id,
    },
  });

  const member = await prisma.user.create({
    data: {
      email: 'member@demo.com',
      passwordHash,
      firstName: 'Carol',
      lastName: 'Member',
      role: 'MEMBER',
      organizationId: org.id,
    },
  });

  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@demo.com',
      passwordHash,
      firstName: 'Dave',
      lastName: 'Viewer',
      role: 'VIEWER',
      organizationId: org.id,
    },
  });

  // Create sample decisions
  const decision1 = await prisma.decision.create({
    data: {
      title: 'Choose Cloud Provider for Infrastructure',
      description:
        'We need to select a cloud provider for our new infrastructure. Consider cost, reliability, and team expertise.',
      category: 'TECHNICAL',
      status: 'OPEN',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      tags: ['infrastructure', 'cloud', 'technical'],
      createdById: owner.id,
      organizationId: org.id,
      options: {
        create: [
          { title: 'AWS', description: 'Amazon Web Services - most comprehensive cloud platform' },
          { title: 'Google Cloud', description: 'Google Cloud Platform - strong in ML and data analytics' },
          { title: 'Azure', description: 'Microsoft Azure - good integration with enterprise tools' },
        ],
      },
      stakeholders: {
        create: [
          { userId: owner.id, role: 'DECISION_MAKER' },
          { userId: admin.id, role: 'CONTRIBUTOR' },
          { userId: member.id, role: 'REVIEWER' },
          { userId: viewer.id, role: 'OBSERVER' },
        ],
      },
    },
  });

  const decision2 = await prisma.decision.create({
    data: {
      title: 'Q2 Marketing Budget Allocation',
      description: 'Decide how to allocate the Q2 marketing budget across different channels.',
      category: 'FINANCIAL',
      status: 'DRAFT',
      tags: ['budget', 'marketing', 'q2'],
      createdById: admin.id,
      organizationId: org.id,
      options: {
        create: [
          { title: 'Digital-First', description: '70% digital, 30% traditional' },
          { title: 'Balanced', description: '50% digital, 50% traditional' },
          { title: 'Traditional-Heavy', description: '30% digital, 70% traditional' },
        ],
      },
      stakeholders: {
        create: [
          { userId: admin.id, role: 'DECISION_MAKER' },
          { userId: owner.id, role: 'REVIEWER' },
        ],
      },
    },
  });

  // Add a vote to decision 1
  const decision1Options = await prisma.option.findMany({
    where: { decisionId: decision1.id },
  });

  if (decision1Options[0]) {
    await prisma.vote.create({
      data: {
        type: 'APPROVE',
        comment: 'AWS has the broadest range of services and our team has the most experience with it.',
        userId: admin.id,
        decisionId: decision1.id,
        optionId: decision1Options[0].id,
      },
    });
  }

  // Add some comments
  await prisma.comment.create({
    data: {
      content: 'I think we should also consider the long-term cost implications of each provider.',
      userId: member.id,
      decisionId: decision1.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'We should factor in the learning curve for the team as well.',
      userId: admin.id,
      decisionId: decision1.id,
    },
  });

  console.info('Seed data created successfully');
  console.info(`Organization: ${org.name} (${org.id})`);
  console.info(`Users: owner@demo.com, admin@demo.com, member@demo.com, viewer@demo.com`);
  console.info(`Password for all users: Password123`);
  console.info(`Decisions: ${decision1.title}, ${decision2.title}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
