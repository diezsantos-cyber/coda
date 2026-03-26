import { Request } from 'express';

export interface AuthUser {
  userId: string;
  organizationId: string;
  role: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type AgreementStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
export type AgreementPriority = 'high' | 'medium' | 'low';
export type MinuteStatus = 'draft' | 'published';
export type UserRole = 'admin' | 'secretary' | 'viewer';
export type ParticipantRole = 'organizer' | 'secretary' | 'attendee';
export type AttendanceStatus = 'pending' | 'confirmed' | 'declined' | 'attended';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
