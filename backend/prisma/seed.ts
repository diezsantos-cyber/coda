import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.info('Seeding database...');

  // Create test organization
  const org = await prisma.organization.create({
    data: {
      name: 'HeyBanco',
      slug: 'heybanco',
      plan: 'pro',
      settings: { timezone: 'America/Mexico_City', language: 'es' },
    },
  });

  // Create admin user
  const passwordHash = await bcrypt.hash('test123', 12);
  const admin = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'manuel@heybanco.mx',
      passwordHash,
      name: 'Manuel Arámburu',
      role: 'admin',
    },
  });

  // Create secretary user
  const secretary = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'franco@heybanco.mx',
      passwordHash,
      name: 'Franco García',
      role: 'secretary',
    },
  });

  // Create team members with Telegram IDs
  const member1 = await prisma.teamMember.create({
    data: {
      organizationId: org.id,
      telegramId: '123456789',
      telegramUsername: 'carlos_dev',
      name: 'Carlos López',
      email: 'carlos@heybanco.mx',
    },
  });

  const member2 = await prisma.teamMember.create({
    data: {
      organizationId: org.id,
      telegramId: '987654321',
      telegramUsername: 'ana_ops',
      name: 'Ana Martínez',
      email: 'ana@heybanco.mx',
    },
  });

  const member3 = await prisma.teamMember.create({
    data: {
      organizationId: org.id,
      telegramId: '555666777',
      telegramUsername: 'luis_finance',
      name: 'Luis Rodríguez',
      email: 'luis@heybanco.mx',
    },
  });

  // Create past meeting (completed)
  const pastMeeting = await prisma.meeting.create({
    data: {
      organizationId: org.id,
      title: 'Sprint Planning - Semana 12',
      description: 'Planificación del sprint semanal',
      agenda: '1. Revisión de tareas previas\n2. Nuevos objetivos\n3. Asignación de tareas',
      scheduledAt: new Date('2026-03-15T10:00:00Z'),
      durationMinutes: 60,
      status: 'completed',
      location: 'Sala de juntas',
      createdById: admin.id,
    },
  });

  // Add participants to past meeting
  await prisma.meetingParticipant.createMany({
    data: [
      { meetingId: pastMeeting.id, userId: admin.id, role: 'organizer', attendanceStatus: 'attended' },
      { meetingId: pastMeeting.id, userId: secretary.id, role: 'secretary', attendanceStatus: 'attended' },
      { meetingId: pastMeeting.id, teamMemberId: member1.id, role: 'attendee', attendanceStatus: 'attended' },
      { meetingId: pastMeeting.id, teamMemberId: member2.id, role: 'attendee', attendanceStatus: 'attended' },
    ],
  });

  // Create published minute for past meeting
  const minute = await prisma.minute.create({
    data: {
      organizationId: org.id,
      meetingId: pastMeeting.id,
      content: 'Se revisaron los avances del sprint anterior. Se identificaron 3 tareas pendientes y se asignaron nuevos objetivos para la semana.',
      summary: 'Sprint planning con revisión de avances y asignación de nuevas tareas.',
      topicsDiscussed: ['Revisión de sprint anterior', 'Métricas de rendimiento', 'Nuevos objetivos Q2'],
      status: 'published',
      publishedAt: new Date('2026-03-15T11:30:00Z'),
      createdById: secretary.id,
    },
  });

  // Create agreements from the minute
  await prisma.agreement.createMany({
    data: [
      {
        organizationId: org.id,
        meetingId: pastMeeting.id,
        minuteId: minute.id,
        title: 'Implementar dashboard de métricas',
        description: 'Crear panel con KPIs principales del equipo',
        assignedToMemberId: member1.id,
        dueDate: new Date('2026-03-22T23:59:59Z'),
        priority: 'high',
        status: 'in_progress',
      },
      {
        organizationId: org.id,
        meetingId: pastMeeting.id,
        minuteId: minute.id,
        title: 'Documentar proceso de onboarding',
        description: 'Escribir guía para nuevos miembros del equipo',
        assignedToMemberId: member2.id,
        dueDate: new Date('2026-03-25T23:59:59Z'),
        priority: 'medium',
        status: 'pending',
      },
      {
        organizationId: org.id,
        meetingId: pastMeeting.id,
        minuteId: minute.id,
        title: 'Revisar presupuesto Q2',
        description: 'Preparar proyección financiera para el siguiente trimestre',
        assignedToMemberId: member3.id,
        dueDate: new Date('2026-03-28T23:59:59Z'),
        priority: 'high',
        status: 'pending',
      },
    ],
  });

  // Create upcoming meeting
  await prisma.meeting.create({
    data: {
      organizationId: org.id,
      title: 'Revisión Semanal - Semana 13',
      description: 'Revisión de avances y planificación',
      agenda: '1. Status de acuerdos\n2. Revisión de métricas\n3. Próximos pasos',
      scheduledAt: new Date('2026-03-29T10:00:00Z'),
      durationMinutes: 45,
      status: 'scheduled',
      location: 'Zoom',
      createdById: admin.id,
    },
  });

  console.info('Seed completed successfully!');
  console.info('  - Organization: HeyBanco');
  console.info('  - Admin: manuel@heybanco.mx / test123');
  console.info('  - Secretary: franco@heybanco.mx / test123');
  console.info('  - Team members: 3');
  console.info('  - Meetings: 2 (1 completed, 1 upcoming)');
  console.info('  - Published minute: 1');
  console.info('  - Agreements: 3');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
