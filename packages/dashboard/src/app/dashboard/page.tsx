'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/lib/store';
import { decisionService } from '@/services/decision.service';
import { organizationService } from '@/services/organization.service';
import { Decision, Organization } from '@/types';
import { formatDate, getStatusColor, getCategoryColor, formatRole } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api';

export default function DashboardPage(): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuthStore();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData(): Promise<void> {
      try {
        const [decisionsRes, org] = await Promise.all([
          decisionService.list({ limit: 5, sortBy: 'updatedAt', sortOrder: 'desc' }),
          organizationService.get(),
        ]);
        setDecisions(decisionsRes.data);
        setOrganization(org);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, []);

  const stats = [
    {
      name: 'Total Decisions',
      value: organization ? decisions.length.toString() : '-',
      color: 'bg-blue-500',
    },
    {
      name: 'Open Decisions',
      value: decisions.filter((d) => d.status === 'OPEN').length.toString(),
      color: 'bg-green-500',
    },
    {
      name: 'In Review',
      value: decisions.filter((d) => d.status === 'IN_REVIEW').length.toString(),
      color: 'bg-yellow-500',
    },
    {
      name: 'Team Members',
      value: organization?.memberCount.toString() ?? '-',
      color: 'bg-purple-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <Header
        title={`Welcome back, ${user?.firstName ?? 'User'}`}
        subtitle={organization?.name ?? 'Your Organization'}
        actions={
          <Button onClick={() => router.push('/dashboard/decisions/new')}>
            New Decision
          </Button>
        }
      />

      <div className="p-8">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name}>
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <span className="text-lg font-bold text-white">{stat.value}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Recent Decisions */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Decisions</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/decisions')}
            >
              View all
            </Button>
          </div>

          {decisions.length === 0 ? (
            <Card>
              <div className="py-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No decisions yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first decision.
                </p>
                <div className="mt-4">
                  <Button onClick={() => router.push('/dashboard/decisions/new')}>
                    Create Decision
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {decisions.map((decision) => (
                <Card
                  key={decision.id}
                  hoverable
                  onClick={() => router.push(`/dashboard/decisions/${decision.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{decision.title}</h3>
                        <Badge className={getStatusColor(decision.status)}>
                          {formatRole(decision.status)}
                        </Badge>
                        <Badge className={getCategoryColor(decision.category)}>
                          {formatRole(decision.category)}
                        </Badge>
                      </div>
                      {decision.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                          {decision.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                        <span>
                          by {decision.createdBy.firstName} {decision.createdBy.lastName}
                        </span>
                        <span>{formatDate(decision.createdAt)}</span>
                        <span>{decision._count.votes} votes</span>
                        <span>{decision._count.stakeholders} stakeholders</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
