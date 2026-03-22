'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { decisionService } from '@/services/decision.service';
import { getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';

const categoryOptions = [
  { value: 'STRATEGIC', label: 'Strategic' },
  { value: 'OPERATIONAL', label: 'Operational' },
  { value: 'TACTICAL', label: 'Tactical' },
  { value: 'TECHNICAL', label: 'Technical' },
  { value: 'FINANCIAL', label: 'Financial' },
  { value: 'HR', label: 'HR' },
  { value: 'OTHER', label: 'Other' },
];

interface OptionForm {
  title: string;
  description: string;
}

export default function NewDecisionPage(): React.JSX.Element {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('OTHER');
  const [deadline, setDeadline] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [options, setOptions] = useState<OptionForm[]>([
    { title: '', description: '' },
    { title: '', description: '' },
  ]);

  const addOption = (): void => {
    if (options.length >= 20) return;
    setOptions([...options, { title: '', description: '' }]);
  };

  const removeOption = (index: number): void => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: keyof OptionForm, value: string): void => {
    setOptions(
      options.map((opt, i) => (i === index ? { ...opt, [field]: value } : opt)),
    );
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const validOptions = options.filter((opt) => opt.title.trim());

      const decision = await decisionService.create({
        title,
        description: description || undefined,
        category,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        options: validOptions.length >= 2 ? validOptions : undefined,
        tags: tags.length > 0 ? tags : undefined,
      });

      toast.success('Decision created successfully!');
      router.push(`/dashboard/decisions/${decision.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Header title="New Decision" subtitle="Create a new decision for your team" />

      <div className="mx-auto max-w-3xl p-8">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Details</h2>
            <div className="space-y-4">
              <Input
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What decision needs to be made?"
                required
              />

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  className="input-field min-h-[100px] resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide context and background for this decision..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Category"
                  options={categoryOptions}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
                <Input
                  label="Deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <Input
                label="Tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Comma-separated tags (e.g., infrastructure, urgent)"
                helperText="Separate multiple tags with commas"
              />
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Options</h2>
              <Button type="button" variant="secondary" size="sm" onClick={addOption}>
                Add Option
              </Button>
            </div>

            <div className="space-y-4">
              {options.map((option, index) => (
                <div key={index} className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      Option {index + 1}
                    </span>
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Option title"
                      value={option.title}
                      onChange={(e) => updateOption(index, 'title', e.target.value)}
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={option.description}
                      onChange={(e) => updateOption(index, 'description', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Create Decision
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
