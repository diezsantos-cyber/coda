import { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  organizationId: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export enum DecisionStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  DECIDED = 'DECIDED',
  ARCHIVED = 'ARCHIVED',
}

export enum DecisionCategory {
  STRATEGIC = 'STRATEGIC',
  OPERATIONAL = 'OPERATIONAL',
  TACTICAL = 'TACTICAL',
  TECHNICAL = 'TECHNICAL',
  FINANCIAL = 'FINANCIAL',
  HR = 'HR',
  OTHER = 'OTHER',
}

export enum StakeholderRole {
  DECISION_MAKER = 'DECISION_MAKER',
  CONTRIBUTOR = 'CONTRIBUTOR',
  REVIEWER = 'REVIEWER',
  OBSERVER = 'OBSERVER',
}

export enum VoteType {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  ABSTAIN = 'ABSTAIN',
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
}

export interface WebSocketMessage {
  type: string;
  payload: Record<string, unknown>;
  organizationId: string;
  userId?: string;
  timestamp: string;
}
