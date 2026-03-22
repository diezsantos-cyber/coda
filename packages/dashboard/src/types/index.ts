export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  createdAt?: string;
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

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  settings: OrganizationSettings;
  memberCount: number;
  createdAt: string;
}

export interface OrganizationSettings {
  defaultDecisionDeadlineDays: number;
  requireMinimumVoters: number;
  allowAnonymousVoting: boolean;
}

export interface Decision {
  id: string;
  title: string;
  description: string | null;
  category: DecisionCategory;
  status: DecisionStatus;
  deadline: string | null;
  selectedOptionId: string | null;
  tags: string[];
  createdById: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  options: Option[];
  _count: {
    stakeholders: number;
    votes: number;
    comments: number;
  };
}

export interface Option {
  id: string;
  title: string;
  description: string | null;
}

export interface Stakeholder {
  id: string;
  role: StakeholderRole;
  userId: string;
  decisionId: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Vote {
  id: string;
  type: VoteType;
  comment: string | null;
  userId: string;
  decisionId: string;
  optionId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  option: {
    id: string;
    title: string;
  };
}

export interface VoteSummary {
  totalVotes: number;
  byOption: Array<{
    optionId: string;
    optionTitle: string;
    approveCount: number;
    rejectCount: number;
    abstainCount: number;
    totalCount: number;
  }>;
  byType: {
    approve: number;
    reject: number;
    abstain: number;
  };
}

export interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
