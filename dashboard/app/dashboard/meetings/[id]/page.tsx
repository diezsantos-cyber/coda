'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Meeting, ApiResponse } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const meetingId = params.id as string;
  const [activeTab, setActiveTab] = useState<'details' | 'minute' | 'agreements'>('details');

  const { data: meeting, isLoading } = useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Meeting>>(`/meetings/${meetingId}`);
      return res.data.data!;
    },
  });

  const [minuteContent, setMinuteContent] = useState('');
  const [minuteSummary, setMinuteSummary] = useState('');
  const [minuteTopics, setMinuteTopics] = useState('');

  const { data: minute } = useQuery({
    queryKey: ['minute', meetingId],
    queryFn: async () => {
      try {
        const res = await api.get(`/meetings/${meetingId}/minutes`);
        const m = res.data.data;
        if (m) {
          setMinuteContent(m.content ?? '');
          setMinuteSummary(m.summary ?? '');
          setMinuteTopics((m.topicsDiscussed ?? []).join('\n'));
        }
        return m;
      } catch {
        return null;
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/meetings/${meetingId}/minutes`, {
        content: minuteContent,
        summary: minuteSummary || undefined,
        topicsDiscussed: minuteTopics.split('\n').filter(Boolean),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['minute', meetingId] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/meetings/${meetingId}/minutes/publish`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['minute', meetingId] });
      void queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  if (!meeting) {
    return <div className="text-center py-12 text-gray-500">Reunión no encontrada</div>;
  }

  return (
    <div>
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-4">&larr; Volver</button>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
        <StatusBadge status={meeting.status} />
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {(['details', 'minute', 'agreements'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab === 'details' ? 'Detalles' : tab === 'minute' ? 'Minuta' : 'Acuerdos'}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-sm text-gray-500">Fecha:</span><p className="font-medium">{new Date(meeting.scheduledAt).toLocaleString('es-MX')}</p></div>
            <div><span className="text-sm text-gray-500">Duración:</span><p className="font-medium">{meeting.durationMinutes} minutos</p></div>
            <div><span className="text-sm text-gray-500">Ubicación:</span><p className="font-medium">{meeting.location ?? '-'}</p></div>
          </div>
          {meeting.description && <div><span className="text-sm text-gray-500">Descripción:</span><p className="mt-1">{meeting.description}</p></div>}
          {meeting.agenda && <div><span className="text-sm text-gray-500">Agenda:</span><pre className="mt-1 whitespace-pre-wrap text-sm">{meeting.agenda}</pre></div>}
          {meeting.participants && meeting.participants.length > 0 && (
            <div>
              <span className="text-sm text-gray-500">Participantes:</span>
              <ul className="mt-1 space-y-1">
                {meeting.participants.map((p) => (
                  <li key={p.id} className="text-sm">{p.user?.name ?? p.teamMember?.name ?? 'Desconocido'} <span className="text-gray-400">({p.role})</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === 'minute' && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          {minute?.status === 'published' ? (
            <div>
              <div className="flex items-center gap-2 mb-4"><StatusBadge status="published" /><span className="text-sm text-gray-500">Publicada el {minute.publishedAt ? new Date(minute.publishedAt).toLocaleString('es-MX') : ''}</span></div>
              {minute.summary && <div><span className="text-sm text-gray-500 font-medium">Resumen:</span><p className="mt-1">{minute.summary}</p></div>}
              <div><span className="text-sm text-gray-500 font-medium">Contenido:</span><pre className="mt-1 whitespace-pre-wrap text-sm">{minute.content}</pre></div>
              {minute.topicsDiscussed?.length > 0 && <div><span className="text-sm text-gray-500 font-medium">Temas:</span><ul className="mt-1 list-disc list-inside">{minute.topicsDiscussed.map((t: string, i: number) => <li key={i} className="text-sm">{t}</li>)}</ul></div>}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenido *</label>
                <textarea value={minuteContent} onChange={(e) => setMinuteContent(e.target.value)} rows={8} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="Escribe el contenido de la minuta..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resumen</label>
                <textarea value={minuteSummary} onChange={(e) => setMinuteSummary(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temas Discutidos (uno por línea)</label>
                <textarea value={minuteTopics} onChange={(e) => setMinuteTopics(e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 text-sm">
                  {saveMutation.isPending ? 'Guardando...' : 'Guardar Borrador'}
                </button>
                <button onClick={() => { if (confirm('¿Publicar la minuta? Esta acción no se puede deshacer.')) publishMutation.mutate(); }} disabled={publishMutation.isPending || !minuteContent} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 text-sm">
                  {publishMutation.isPending ? 'Publicando...' : 'Publicar Minuta'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'agreements' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {meeting.agreements && meeting.agreements.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asignado a</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {meeting.agreements.map((a) => (
                  <tr key={a.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{a.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{a.assignedToUser?.name ?? a.assignedToMember?.name ?? '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{a.dueDate ? new Date(a.dueDate).toLocaleDateString('es-MX') : '-'}</td>
                    <td className="px-6 py-4"><StatusBadge status={a.priority} type="priority" /></td>
                    <td className="px-6 py-4"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">No hay acuerdos para esta reunión</div>
          )}
        </div>
      )}
    </div>
  );
}
