'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Banknote, DoorOpen, Trophy, UserCheck, Users } from 'lucide-react';

import { BarChart } from '@/components/charts/BarChart';
import { KPICard } from '@/components/charts/KPICard';
import { PageTitle } from '@/components/layout/PageTitle';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { CheckinsByDay, CheckinsByHour, DashboardKPIs } from '@/types';

export default function DashboardPage() {
  const kpisQuery = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => api.get<DashboardKPIs>('/dashboard/kpis').then((res) => res.data),
  });

  const byHourQuery = useQuery({
    queryKey: ['dashboard-hour'],
    queryFn: () => api.get<CheckinsByHour[]>('/dashboard/checkins/by-hour').then((res) => res.data),
  });

  const byWeekdayQuery = useQuery({
    queryKey: ['dashboard-weekday'],
    queryFn: () =>
      api.get<CheckinsByDay[]>('/dashboard/checkins/by-weekday').then((res) => res.data),
  });

  const kpis = kpisQuery.data;

  return (
    <section>
      <PageTitle subtitle="Visão geral operacional da academia" title="Dashboard" />

      {kpisQuery.isError ? (
        <EmptyState
          description="Verifique token admin e disponibilidade do backend."
          title="Não foi possível carregar KPIs"
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPICard icon={<Users size={20} />} title="Total de Alunos" value={kpis?.total_users ?? '-'} />
        <KPICard
          color="#22c55e"
          icon={<UserCheck size={20} />}
          title="Usuários Ativos"
          value={kpis?.active_users ?? '-'}
        />
        <KPICard
          color="#f59e0b"
          icon={<DoorOpen size={20} />}
          title="Check-ins Hoje"
          value={kpis?.checkins_today ?? '-'}
        />
        <KPICard
          color="#14b8a6"
          icon={<Activity size={20} />}
          title="Treinos Semana"
          value={kpis?.workouts_this_week ?? '-'}
        />
        <KPICard
          color="#10b981"
          icon={<Banknote size={20} />}
          title="Receita Mês"
          value={kpis ? formatCurrency(kpis.revenue_month) : '-'}
        />
        <KPICard
          color="#ef4444"
          icon={<Trophy size={20} />}
          title="Resgates Pendentes"
          value={kpis?.pending_redemptions ?? '-'}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Check-ins por Hora</h3>
          {byHourQuery.isLoading ? (
            <p className="text-sm text-gray-500">Carregando...</p>
          ) : (
            <BarChart data={byHourQuery.data ?? []} xKey="hour" yKey="count" />
          )}
        </Card>

        <Card>
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Check-ins por Dia da Semana</h3>
          {byWeekdayQuery.isLoading ? (
            <p className="text-sm text-gray-500">Carregando...</p>
          ) : (
            <BarChart data={byWeekdayQuery.data ?? []} xKey="day" yKey="count" color="#22c55e" />
          )}
        </Card>
      </div>
    </section>
  );
}
