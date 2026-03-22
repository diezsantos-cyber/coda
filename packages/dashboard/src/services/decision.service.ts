import { api } from '@/lib/api';
import {
  ApiResponse,
  Decision,
  PaginatedResponse,
  Stakeholder,
  Vote,
  VoteSummary,
} from '@/types';

interface ListDecisionsParams {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

export const decisionService = {
  async list(params: ListDecisionsParams = {}): Promise<PaginatedResponse<Decision> & { success: boolean }> {
    const response = await api.get<PaginatedResponse<Decision> & { success: boolean }>('/decisions', {
      params,
    });
    return response.data;
  },

  async getById(id: string): Promise<Decision> {
    const response = await api.get<ApiResponse<Decision>>(`/decisions/${id}`);
    const result = response.data.data;
    if (!result) throw new Error('Decision not found');
    return result;
  },

  async create(data: {
    title: string;
    description?: string;
    category: string;
    deadline?: string;
    options?: Array<{ title: string; description?: string }>;
    tags?: string[];
  }): Promise<Decision> {
    const response = await api.post<ApiResponse<Decision>>('/decisions', data);
    const result = response.data.data;
    if (!result) throw new Error('Failed to create decision');
    return result;
  },

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      category?: string;
      status?: string;
      deadline?: string | null;
      selectedOptionId?: string | null;
      tags?: string[];
    },
  ): Promise<Decision> {
    const response = await api.patch<ApiResponse<Decision>>(`/decisions/${id}`, data);
    const result = response.data.data;
    if (!result) throw new Error('Failed to update decision');
    return result;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/decisions/${id}`);
  },

  // Stakeholders
  async getStakeholders(decisionId: string): Promise<Stakeholder[]> {
    const response = await api.get<ApiResponse<Stakeholder[]>>(
      `/decisions/${decisionId}/stakeholders`,
    );
    return response.data.data ?? [];
  },

  async addStakeholder(
    decisionId: string,
    data: { userId: string; role: string },
  ): Promise<Stakeholder> {
    const response = await api.post<ApiResponse<Stakeholder>>(
      `/decisions/${decisionId}/stakeholders`,
      data,
    );
    const result = response.data.data;
    if (!result) throw new Error('Failed to add stakeholder');
    return result;
  },

  async removeStakeholder(decisionId: string, stakeholderId: string): Promise<void> {
    await api.delete(`/decisions/${decisionId}/stakeholders/${stakeholderId}`);
  },

  // Votes
  async getVotes(decisionId: string): Promise<Vote[]> {
    const response = await api.get<ApiResponse<Vote[]>>(
      `/decisions/${decisionId}/votes`,
    );
    return response.data.data ?? [];
  },

  async getVoteSummary(decisionId: string): Promise<VoteSummary> {
    const response = await api.get<ApiResponse<VoteSummary>>(
      `/decisions/${decisionId}/votes/summary`,
    );
    const result = response.data.data;
    if (!result) throw new Error('Failed to get vote summary');
    return result;
  },

  async castVote(
    decisionId: string,
    data: { optionId: string; type: string; comment?: string },
  ): Promise<Vote> {
    const response = await api.post<ApiResponse<Vote>>(
      `/decisions/${decisionId}/votes`,
      data,
    );
    const result = response.data.data;
    if (!result) throw new Error('Failed to cast vote');
    return result;
  },

  async updateVote(
    decisionId: string,
    voteId: string,
    data: { optionId?: string; type?: string; comment?: string },
  ): Promise<Vote> {
    const response = await api.put<ApiResponse<Vote>>(
      `/decisions/${decisionId}/votes/${voteId}`,
      data,
    );
    const result = response.data.data;
    if (!result) throw new Error('Failed to update vote');
    return result;
  },

  async deleteVote(decisionId: string, voteId: string): Promise<void> {
    await api.delete(`/decisions/${decisionId}/votes/${voteId}`);
  },
};
