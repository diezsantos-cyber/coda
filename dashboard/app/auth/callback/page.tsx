'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Procesando autenticación...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(`Error de autenticación: ${error}`);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('Código de autorización no recibido');
        return;
      }

      try {
        // Try Calendar callback first
        const calendarResponse = await fetch(`/api/integrations/google/calendar/callback?code=${code}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (calendarResponse.ok) {
          const data = await calendarResponse.json();
          if (data.success) {
            setStatus('success');
            setMessage('Google Calendar conectado exitosamente. Configurando calendario...');
            
            // Configure default calendar (primary)
            await fetch('/api/integrations/google/calendar/configure', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
              },
              body: JSON.stringify({ calendarId: 'primary' }),
            });

            // Trigger initial sync
            await fetch('/api/integrations/google/calendar/sync', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
              },
            });

            setTimeout(() => {
              router.push('/dashboard/meetings');
            }, 2000);
            return;
          }
        }

        // If not calendar, try sheets callback
        const sheetsResponse = await fetch(`/api/integrations/google/callback?code=${code}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const sheetsData = await sheetsResponse.json();
        if (sheetsData.success) {
          setStatus('success');
          setMessage('Google Sheets conectado exitosamente');
          setTimeout(() => {
            router.push('/dashboard/settings');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Error al procesar la autenticación');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage('Error al procesar la autenticación');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
        {status === 'loading' && (
          <>
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <h2 className="mb-2 text-xl font-semibold text-gray-900">Conectando...</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">¡Éxito!</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">Error</h2>
            <p className="mb-4 text-gray-600">{message}</p>
            <button
              onClick={() => router.push('/dashboard/settings')}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Volver a configuración
            </button>
          </>
        )}
      </div>
    </div>
  );
}
