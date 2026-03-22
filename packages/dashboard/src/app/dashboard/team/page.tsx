'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useAuthStore } from '@/lib/store';
import { organizationService } from '@/services/organization.service';
import { Member, UserRole } from '@/types';
import { formatDate, getRoleColor, formatRole, getInitials } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';

export default function TeamPage(): React.JSX.Element {
  const { user } = useAuthStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [isInviting, setIsInviting] = useState(false);

  const loadMembers = async (): Promise<void> => {
    try {
      const data = await organizationService.getMembers();
      setMembers(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMembers();
  }, []);

  const handleInvite = async (): Promise<void> => {
    if (!inviteEmail) return;
    setIsInviting(true);
    try {
      await organizationService.inviteMember({
        email: inviteEmail,
        role: inviteRole,
      });
      toast.success('Invite sent successfully!');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('MEMBER');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string): Promise<void> => {
    if (!confirm(`Are you sure you want to remove ${memberName}?`)) return;
    try {
      await organizationService.removeMember(memberId);
      toast.success('Member removed');
      void loadMembers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const canManageTeam = user?.role === UserRole.OWNER || user?.role === UserRole.ADMIN;

  if (isLoading) {
    return (
      <div>
        <Header title="Team" subtitle="Manage your team members" />
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Team"
        subtitle={`${members.length} member${members.length !== 1 ? 's' : ''}`}
        actions={
          canManageTeam ? (
            <Button onClick={() => setShowInviteModal(true)}>Invite Member</Button>
          ) : undefined
        }
      />

      <div className="p-8">
        <div className="space-y-3">
          {members.map((member) => (
            <Card key={member.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                    {getInitials(member.firstName, member.lastName)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </p>
                      <Badge className={getRoleColor(member.role)}>
                        {formatRole(member.role)}
                      </Badge>
                      {!member.isActive && (
                        <Badge variant="danger">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right text-xs text-gray-400">
                    <p>Joined {formatDate(member.createdAt)}</p>
                    {member.lastLoginAt && (
                      <p>Last login {formatDate(member.lastLoginAt)}</p>
                    )}
                  </div>
                  {canManageTeam && member.id !== user?.id && member.role !== 'OWNER' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        void handleRemoveMember(
                          member.id,
                          `${member.firstName} ${member.lastName}`,
                        )
                      }
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Team Member"
      >
        <div className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            required
          />

          <Select
            label="Role"
            options={[
              { value: 'ADMIN', label: 'Admin' },
              { value: 'MEMBER', label: 'Member' },
              { value: 'VIEWER', label: 'Viewer' },
            ]}
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
          />

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button isLoading={isInviting} onClick={() => void handleInvite()}>
              Send Invite
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
