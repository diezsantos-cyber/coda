'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { decisionService } from '@/services/decision.service';
import { Decision, PaginatedResponse } from '@/types';
import { formatDate, getStatusColor, getCategoryColor, formatRole } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'DECIDED', label: 'Decided' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'STRATEGIC', label: 'Strategic' },
  { value: 'OPERATIONAL', label: 'Operational' },
  { value: 'TACTICAL', label: 'Tactical' },
  { value: 'TECHNICAL', label: 'Technical' },
  { value: 'FINANCIAL', label: 'Financial' },
  { value: 'HR', label: 'HR' },
  { value: 'OTHER', label: 'Other' },
];

export default function DecisionsPage(): React.JSX.Element {
  const router = useRouter();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<Decision>['meta'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const loadDecisions = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await decisionService.list({
        page,
        limit: 10,
        ...(search && { search }),
        ...(status && { status }),
        ...(category && { category }),
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });
      setDecisions(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, search, status, category]);

  useEffect(() => {
    void loadDecisions();
  }, [loadDecisions]);

  return (
    <div>
      <Header
        title="Decisions"
        subtitle="Manage and track your organization's decisions"
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

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-end gap-4">
          <div className="w-64">
            <Input
              placeholder="Search decisions..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-40">
            <Select
              options={statusOptions}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-40">
            <Select
              options={categoryOptions}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Decision List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
        ) : decisions.length === 0 ? (
          <Card>
            <div className="py-12 text-center">
              <h3 className="text-sm font-medium text-gray-900">No decisions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search || status || category
                  ? 'Try adjusting your filters'
                  : 'Create your first decision to get started'}
              </p>
            </div>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {decisions.map((decision) => (
                <Card
                  key={decision.id}
                  hoverable
                  onClick={() => router.push(`/dashboard/decisions/${decision.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
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
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-400">
                        <span>
                          by {decision.createdBy.firstName} {decision.createdBy.lastName}
                        </span>
                        <span>{formatDate(decision.createdAt)}</span>
                        {decision.deadline && (
                          <span className="text-orange-500">
                            Due {formatDate(decision.deadline)}
                          </span>
                        )}
                        <span>{decision._count.votes} votes</span>
                        <span>{decision._count.stakeholders} stakeholders</span>
                        <span>{decision.options.length} options</span>
                      </div>
                      {decision.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {decision.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(meta.page - 1) * meta.limit + 1} to{' '}
                  {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} decisions
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
