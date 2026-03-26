'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { DashboardStats, ApiResponse } from '@/lib/types';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
      return res.data.data!;
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  const stats = data;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Próximas Reuniones" value={stats?.upcomingMeetings ?? 0} color="blue" />
        <StatCard title="Acuerdos Pendientes" value={stats?.pendingAgreements ?? 0} color="orange" />
        <StatCard title="Acuerdos Completados" value={stats?.completedAgreements ?? 0} color="green" />
        <StatCard title="Miembros del Equipo" value={stats?.totalTeamMembers ?? 0} color="purple" />
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Actividad Reciente</h2>
        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-500">{new Date(activity.scheduledAt).toLocaleDateString('es-MX')}</p>
                </div>
                <span className="text-sm text-gray-600">{activity.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No hay actividad reciente</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <div className={`rounded-lg border p-6 ${colorMap[color] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>
      <p className="text-sm font-medium opacity-75">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}
