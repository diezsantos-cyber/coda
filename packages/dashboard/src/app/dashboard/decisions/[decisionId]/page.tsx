'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useAuthStore } from '@/lib/store';
import { decisionService } from '@/services/decision.service';
import { Decision, Stakeholder, Vote, VoteSummary } from '@/types';
import {
  formatDate,
  formatDateTime,
  getStatusColor,
  getCategoryColor,
  getRoleColor,
  formatRole,
  getInitials,
} from '@/lib/utils';
import { getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'DECIDED', label: 'Decided' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export default function DecisionDetailPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const decisionId = params['decisionId'] as string;

  const [decision, setDecision] = useState<Decision | null>(null);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [voteSummary, setVoteSummary] = useState<VoteSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');
  const [voteType, setVoteType] = useState('APPROVE');
  const [voteComment, setVoteComment] = useState('');
  const [isVoting, setIsVoting] = useState(false);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      const [dec, stk, vts, smry] = await Promise.all([
        decisionService.getById(decisionId),
        decisionService.getStakeholders(decisionId),
        decisionService.getVotes(decisionId),
        decisionService.getVoteSummary(decisionId),
      ]);
      setDecision(dec);
      setStakeholders(stk);
      setVotes(vts);
      setVoteSummary(smry);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [decisionId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleStatusChange = async (newStatus: string): Promise<void> => {
    try {
      const updated = await decisionService.update(decisionId, { status: newStatus });
      setDecision(updated);
      toast.success(`Status updated to ${formatRole(newStatus)}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleVote = async (): Promise<void> => {
    if (!selectedOption) {
      toast.error('Please select an option');
      return;
    }
    setIsVoting(true);
    try {
      await decisionService.castVote(decisionId, {
        optionId: selectedOption,
        type: voteType,
        comment: voteComment || undefined,
      });
      toast.success('Vote cast successfully!');
      setShowVoteModal(false);
      setSelectedOption('');
      setVoteComment('');
      void loadData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!confirm('Are you sure you want to delete this decision?')) return;
    try {
      await decisionService.delete(decisionId);
      toast.success('Decision deleted');
      router.push('/dashboard/decisions');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (isLoading || !decision) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  const isCreator = decision.createdById === user?.id;
  const userVote = votes.find((v) => v.userId === user?.id);
  const canVote = decision.status === 'OPEN' && !userVote;

  return (
    <div>
      <Header
        title={decision.title}
        subtitle={`Created by ${decision.createdBy.firstName} ${decision.createdBy.lastName}`}
        actions={
          <div className="flex items-center gap-2">
            {canVote && (
              <Button onClick={() => setShowVoteModal(true)}>Cast Vote</Button>
            )}
            {isCreator && (
              <Button variant="danger" size="sm" onClick={() => void handleDelete()}>
                Delete
              </Button>
            )}
          </div>
        }
      />

      <div className="p-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge className={getStatusColor(decision.status)}>
                  {formatRole(decision.status)}
                </Badge>
                <Badge className={getCategoryColor(decision.category)}>
                  {formatRole(decision.category)}
                </Badge>
                {decision.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {decision.description && (
                <p className="text-gray-700">{decision.description}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                <span>Created {formatDateTime(decision.createdAt)}</span>
                {decision.deadline && (
                  <span className="text-orange-600">
                    Deadline: {formatDateTime(decision.deadline)}
                  </span>
                )}
              </div>

              {isCreator && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm text-gray-500">Status:</span>
                  <Select
                    options={statusOptions}
                    value={decision.status}
                    onChange={(e) => void handleStatusChange(e.target.value)}
                    className="w-40"
                  />
                </div>
              )}
            </Card>

            {/* Options & Vote Results */}
            <Card>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Options & Votes</h2>
              <div className="space-y-3">
                {decision.options.map((option) => {
                  const optionSummary = voteSummary?.byOption.find(
                    (o) => o.optionId === option.id,
                  );
                  const totalVotes = voteSummary?.totalVotes ?? 0;
                  const optionVotes = optionSummary?.totalCount ?? 0;
                  const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;
                  const isSelected = decision.selectedOptionId === option.id;

                  return (
                    <div
                      key={option.id}
                      className={`rounded-lg border p-4 ${
                        isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {option.title}
                            {isSelected && (
                              <span className="ml-2 text-sm text-green-600">Selected</span>
                            )}
                          </h3>
                          {option.description && (
                            <p className="mt-1 text-sm text-gray-500">{option.description}</p>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {optionVotes} vote{optionVotes !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {totalVotes > 0 && (
                        <div className="mt-3">
                          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full rounded-full bg-primary-500 transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="mt-1 flex justify-between text-xs text-gray-500">
                            <span>{percentage.toFixed(0)}%</span>
                            {optionSummary && (
                              <span>
                                {optionSummary.approveCount} approve, {optionSummary.rejectCount} reject, {optionSummary.abstainCount} abstain
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Vote History */}
            {votes.length > 0 && (
              <Card>
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Vote History</h2>
                <div className="space-y-3">
                  {votes.map((vote) => (
                    <div
                      key={vote.id}
                      className="flex items-start gap-3 rounded-lg border border-gray-100 p-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-700">
                        {getInitials(vote.user.firstName, vote.user.lastName)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {vote.user.firstName} {vote.user.lastName}
                          </span>
                          <Badge
                            variant={
                              vote.type === 'APPROVE'
                                ? 'success'
                                : vote.type === 'REJECT'
                                  ? 'danger'
                                  : 'default'
                            }
                          >
                            {vote.type}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            for {vote.option.title}
                          </span>
                        </div>
                        {vote.comment && (
                          <p className="mt-1 text-sm text-gray-600">{vote.comment}</p>
                        )}
                        <span className="text-xs text-gray-400">
                          {formatDate(vote.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Options</span>
                  <span className="font-medium">{decision.options.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Stakeholders</span>
                  <span className="font-medium">{stakeholders.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Votes</span>
                  <span className="font-medium">{votes.length}</span>
                </div>
                {userVote && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Your Vote</span>
                    <Badge
                      variant={
                        userVote.type === 'APPROVE'
                          ? 'success'
                          : userVote.type === 'REJECT'
                            ? 'danger'
                            : 'default'
                      }
                    >
                      {userVote.type}
                    </Badge>
                  </div>
                )}
              </div>
            </Card>

            {/* Stakeholders */}
            <Card>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Stakeholders</h3>
              <div className="space-y-2">
                {stakeholders.map((stakeholder) => (
                  <div
                    key={stakeholder.id}
                    className="flex items-center gap-2"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                      {getInitials(stakeholder.user.firstName, stakeholder.user.lastName)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {stakeholder.user.firstName} {stakeholder.user.lastName}
                      </p>
                    </div>
                    <Badge className={getRoleColor(stakeholder.role)}>
                      {formatRole(stakeholder.role)}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Vote Modal */}
      <Modal
        isOpen={showVoteModal}
        onClose={() => setShowVoteModal(false)}
        title="Cast Your Vote"
      >
        <div className="space-y-4">
          <Select
            label="Select Option"
            options={decision.options.map((opt) => ({
              value: opt.id,
              label: opt.title,
            }))}
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value)}
            placeholder="Choose an option..."
          />

          <Select
            label="Vote Type"
            options={[
              { value: 'APPROVE', label: 'Approve' },
              { value: 'REJECT', label: 'Reject' },
              { value: 'ABSTAIN', label: 'Abstain' },
            ]}
            value={voteType}
            onChange={(e) => setVoteType(e.target.value)}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Comment (optional)
            </label>
            <textarea
              className="input-field min-h-[80px] resize-y"
              value={voteComment}
              onChange={(e) => setVoteComment(e.target.value)}
              placeholder="Add a comment to explain your vote..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowVoteModal(false)}>
              Cancel
            </Button>
            <Button isLoading={isVoting} onClick={() => void handleVote()}>
              Submit Vote
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
