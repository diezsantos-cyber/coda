'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import type { Meeting, ApiResponse } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';

export default function MeetingsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['meetings', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get<ApiResponse<Meeting[]>>(`/meetings?${params.toString()}`);
      return res.data.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      await api.post('/meetings', body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['meetings'] });
      setShowModal(false);
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reuniones</h1>
        <button onClick={() => setShowModal(true)} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors text-sm font-medium">
          Nueva Reunión
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        {['', 'scheduled', 'completed', 'cancelled'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${statusFilter === s ? 'bg-primary-100 text-primary-700' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
            {s === '' ? 'Todas' : s === 'scheduled' ? 'Programadas' : s === 'completed' ? 'Completadas' : 'Canceladas'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data && data.length > 0 ? data.map((meeting) => (
                <tr key={meeting.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{meeting.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(meeting.scheduledAt).toLocaleString('es-MX')}</td>
                  <td className="px-6 py-4"><StatusBadge status={meeting.status} /></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{meeting.location ?? '-'}</td>
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/meetings/${meeting.id}`} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Ver detalle</Link>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No hay reuniones</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva Reunión">
        <CreateMeetingForm onSubmit={(data) => createMutation.mutate(data)} loading={createMutation.isPending} />
      </Modal>
    </div>
  );
}

function CreateMeetingForm({ onSubmit, loading }: { onSubmit: (data: Record<string, unknown>) => void; loading: boolean }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [location, setLocation] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ title, description: description || undefined, scheduledAt: new Date(scheduledAt).toISOString(), durationMinutes, location: location || undefined }); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora *</label>
          <input type="datetime-local" required value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duración (min)</label>
          <input type="number" min={5} max={480} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Sala de juntas / Zoom" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={loading} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 text-sm font-medium">
          {loading ? 'Creando...' : 'Crear Reunión'}
        </button>
      </div>
    </form>
  );
}
