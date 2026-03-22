import { api } from '@/lib/api';
import { ApiResponse, Organization, Member } from '@/types';

export const organizationService = {
  async get(): Promise<Organization> {
    const response = await api.get<ApiResponse<Organization>>('/organization');
    const result = response.data.data;
    if (!result) throw new Error('Failed to get organization');
    return result;
  },

  async update(data: {
    name?: string;
    description?: string;
    settings?: Record<string, unknown>;
  }): Promise<Organization> {
    const response = await api.patch<ApiResponse<Organization>>('/organization', data);
    const result = response.data.data;
    if (!result) throw new Error('Failed to update organization');
    return result;
  },

  async getMembers(): Promise<Member[]> {
    const response = await api.get<ApiResponse<Member[]>>('/organization/members');
    return response.data.data ?? [];
  },

  async inviteMember(data: { email: string; role: string }): Promise<{ token: string }> {
    const response = await api.post<ApiResponse<{ token: string }>>(
      '/organization/members/invite',
      data,
    );
    const result = response.data.data;
    if (!result) throw new Error('Failed to invite member');
    return result;
  },

  async updateMemberRole(memberId: string, role: string): Promise<void> {
    await api.patch(`/organization/members/${memberId}/role`, { role });
  },

  async removeMember(memberId: string): Promise<void> {
    await api.delete(`/organization/members/${memberId}`);
  },
};
