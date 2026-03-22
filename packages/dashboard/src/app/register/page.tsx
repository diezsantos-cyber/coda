'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/lib/store';
import { authService } from '@/services/auth.service';
import { getErrorMessage } from '@/lib/api';

export default function RegisterPage(): React.JSX.Element {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    organizationName: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: string, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await authService.register(formData);
      setUser(result.user);
      router.push('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600">
            <span className="text-xl font-bold text-white">C</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Get started with CODA for your organization
          </p>
        </div>

        <div className="card">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Input
              label="Organization Name"
              value={formData.organizationName}
              onChange={(e) => updateField('organizationName', e.target.value)}
              placeholder="Acme Inc."
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                placeholder="John"
                required
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                placeholder="Doe"
                required
              />
            </div>

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="you@company.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder="Min 8 characters"
              helperText="Must contain uppercase, lowercase, and a number"
              required
            />

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Create account
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
