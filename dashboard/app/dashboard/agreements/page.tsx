'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Agreement, ApiResponse } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';

export default function AgreementsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['agreements', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get<ApiResponse<Agreement[]>>(`/agreements?${params.toString()}`);
      return res.data.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      await api.post('/agreements', body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['agreements'] });
      setShowCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      await api.patch(`/agreements/${id}`, body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['agreements'] });
      setEditingId(null);
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Acuerdos</h1>
        <button onClick={() => setShowCreate(true)} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 text-sm font-medium">
          Nuevo Acuerdo
        </button>
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        {['', 'pending', 'in_progress', 'completed', 'overdue'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${statusFilter === s ? 'bg-primary-100 text-primary-700' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
            {s === '' ? 'Todos' : s === 'pending' ? 'Pendientes' : s === 'in_progress' ? 'En progreso' : s === 'completed' ? 'Completados' : 'Vencidos'}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asignado a</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data && data.length > 0 ? data.map((agreement) => (
                <tr key={agreement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{agreement.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{agreement.assignedToUser?.name ?? agreement.assignedToMember?.name ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{agreement.dueDate ? new Date(agreement.dueDate).toLocaleDateString('es-MX') : '-'}</td>
                  <td className="px-6 py-4"><StatusBadge status={agreement.priority} type="priority" /></td>
                  <td className="px-6 py-4"><StatusBadge status={agreement.status} /></td>
                  <td className="px-6 py-4">
                    <button onClick={() => setEditingId(agreement.id)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Editar</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No hay acuerdos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nuevo Acuerdo">
        <AgreementForm onSubmit={(d) => createMutation.mutate(d)} loading={createMutation.isPending} />
      </Modal>

      <Modal isOpen={!!editingId} onClose={() => setEditingId(null)} title="Editar Acuerdo">
        {editingId && (
          <EditAgreementForm
            agreement={data?.find((a) => a.id === editingId)}
            onSubmit={(d) => updateMutation.mutate({ id: editingId, body: d })}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
}

function AgreementForm({ onSubmit, loading }: { onSubmit: (data: Record<string, unknown>) => void; loading: boolean }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ title, description: description || undefined, dueDate: dueDate ? new Date(dueDate).toISOString() : undefined, priority }); }} className="space-y-4">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 text-sm font-medium">
          {loading ? 'Creando...' : 'Crear Acuerdo'}
        </button>
      </div>
    </form>
  );
}

function EditAgreementForm({ agreement, onSubmit, loading }: { agreement?: Agreement; onSubmit: (data: Record<string, unknown>) => void; loading: boolean }) {
    const [status, setStatus] = useState<string>(agreement?.status ?? 'pending');
    const [priority, setPriority] = useState<string>(agreement?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(agreement?.dueDate ? agreement.dueDate.split('T')[0] : '');

  if (!agreement) return null;

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ status, priority, dueDate: dueDate ? new Date(dueDate).toISOString() : undefined }); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as string)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="pending">Pendiente</option>
                <option value="in_progress">En progreso</option>
                <option value="completed">Completado</option>
                <option value="overdue">Vencido</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as string)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento</label>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 text-sm font-medium">
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  );
}
