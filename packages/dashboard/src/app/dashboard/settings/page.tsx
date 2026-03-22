'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/lib/store';
import { organizationService } from '@/services/organization.service';
import { Organization, UserRole } from '@/types';
import { getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage(): React.JSX.Element {
  const { user } = useAuthStore();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultDeadlineDays, setDefaultDeadlineDays] = useState('7');
  const [minimumVoters, setMinimumVoters] = useState('1');

  useEffect(() => {
    async function loadOrg(): Promise<void> {
      try {
        const org = await organizationService.get();
        setOrganization(org);
        setName(org.name);
        setDescription(org.description ?? '');
        setDefaultDeadlineDays(String(org.settings.defaultDecisionDeadlineDays));
        setMinimumVoters(String(org.settings.requireMinimumVoters));
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    void loadOrg();
  }, []);

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    try {
      await organizationService.update({
        name,
        description: description || undefined,
        settings: {
          defaultDecisionDeadlineDays: parseInt(defaultDeadlineDays, 10) || 7,
          requireMinimumVoters: parseInt(minimumVoters, 10) || 1,
        },
      });
      toast.success('Settings saved');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const canEdit = user?.role === UserRole.OWNER || user?.role === UserRole.ADMIN;

  if (isLoading) {
    return (
      <div>
        <Header title="Settings" subtitle="Manage your organization settings" />
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Settings"
        subtitle="Manage your organization settings"
        actions={
          canEdit ? (
            <Button isLoading={isSaving} onClick={() => void handleSave()}>
              Save Changes
            </Button>
          ) : undefined
        }
      />

      <div className="mx-auto max-w-3xl p-8 space-y-6">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Organization</h2>
          <div className="space-y-4">
            <Input
              label="Organization Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                className="input-field min-h-[80px] resize-y"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEdit}
                placeholder="Describe your organization..."
              />
            </div>

            {organization && (
              <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500">
                <p>Slug: <code className="font-mono text-gray-700">{organization.slug}</code></p>
                <p>Member count: {organization.memberCount}</p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Decision Settings</h2>
          <div className="space-y-4">
            <Input
              label="Default Decision Deadline (days)"
              type="number"
              value={defaultDeadlineDays}
              onChange={(e) => setDefaultDeadlineDays(e.target.value)}
              disabled={!canEdit}
              helperText="Default number of days until a decision deadline"
            />

            <Input
              label="Minimum Required Voters"
              type="number"
              value={minimumVoters}
              onChange={(e) => setMinimumVoters(e.target.value)}
              disabled={!canEdit}
              helperText="Minimum number of votes required before a decision can be finalized"
            />
          </div>
        </Card>

        {user && (
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Your Profile</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="font-medium">
                  {user.firstName} {user.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Role</span>
                <span className="font-medium">{user.role}</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
