export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  agenda?: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  location?: string;
  createdBy?: { id: string; name: string };
  participants?: MeetingParticipant[];
  minute?: Minute;
  agreements?: Agreement[];
  createdAt: string;
  updatedAt: string;
}

export interface MeetingParticipant {
  id: string;
  userId?: string;
  teamMemberId?: string;
  role: string;
  attendanceStatus: string;
  user?: { id: string; name: string; email: string };
  teamMember?: { id: string; name: string; telegramUsername?: string };
}

export interface Minute {
  id: string;
  meetingId: string;
  content: string;
  summary?: string;
  topicsDiscussed: string[];
  status: 'draft' | 'published';
  publishedAt?: string;
  createdBy?: { id: string; name: string };
  agreements?: Agreement[];
}

export interface Agreement {
  id: string;
  title: string;
  description?: string;
  meetingId?: string;
  minuteId?: string;
  assignedToUserId?: string;
  assignedToMemberId?: string;
  assignedToUser?: { id: string; name: string };
  assignedToMember?: { id: string; name: string };
  meeting?: { id: string; title: string };
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  completedAt?: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  telegramId: string;
  telegramUsername?: string;
  name?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface DashboardStats {
  upcomingMeetings: number;
  pendingAgreements: number;
  completedAgreements: number;
  totalTeamMembers: number;
  recentActivity: Array<{
    id: string;
    title: string;
    status: string;
    scheduledAt: string;
    updatedAt: string;
  }>;
}
