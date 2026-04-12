'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { PageTitle } from '@/components/layout/PageTitle';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { api } from '@/lib/api';
import { roleLabel, tierLabel } from '@/lib/utils';
import type { Assessment, User, UserRole, WorkoutSheet } from '@/types';

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const userId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [newRole, setNewRole] = useState<UserRole>('aluno');

  const userQuery = useQuery({
    queryKey: ['user', userId],
    queryFn: () => api.get<User>(`/users/${userId}`).then((res) => res.data),
    enabled: Boolean(userId),
  });

  const assessmentsQuery = useQuery({
    queryKey: ['assessments-history-admin'],
    queryFn: () => api.get<Assessment[]>('/assessments/history').then((res) => res.data),
  });

  const sheetsQuery = useQuery({
    queryKey: ['workout-sheets-admin'],
    queryFn: () => api.get<WorkoutSheet[]>('/workouts/sheets').then((res) => res.data),
  });

  const updateRoleMutation = useMutation({
    mutationFn: () => api.patch(`/users/${userId}`, { role: newRole }),
    onSuccess: async () => {
      await userQuery.refetch();
      toast.success('Role atualizada com sucesso.');
    },
    onError: () => toast.error('Falha ao atualizar role.'),
  });

  const deactivateMutation = useMutation({
    mutationFn: () => api.delete(`/users/${userId}`),
    onSuccess: async () => {
      toast.success('Conta desativada.');
      await userQuery.refetch();
    },
    onError: () => toast.error('Falha ao desativar conta.'),
  });

  const user = userQuery.data;

  const filteredAssessments = useMemo(
    () => (assessmentsQuery.data ?? []).filter((item) => item.user_id === userId),
    [assessmentsQuery.data, userId],
  );

  const filteredSheets = useMemo(
    () => (sheetsQuery.data ?? []).filter((item) => item.user_id === userId),
    [sheetsQuery.data, userId],
  );

  return (
    <section>
      <PageTitle
        subtitle="Dados do aluno e ações administrativas"
        title="Detalhe do Aluno"
        actions={
          <Button onClick={() => router.push('/users')} variant="secondary">
            Voltar
          </Button>
        }
      />

      {user ? (
        <Card>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500">Nome</p>
              <p className="font-semibold text-gray-900">{user.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-semibold text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Role</p>
              <p className="font-semibold text-gray-900">{roleLabel(user.role)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tier</p>
              <Badge tone="tier">{tierLabel(user.tier)}</Badge>
            </div>
            <div>
              <p className="text-xs text-gray-500">Pontos</p>
              <p className="font-semibold text-gray-900">{user.total_points}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Streak</p>
              <p className="font-semibold text-gray-900">{user.streak_count}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-2">
            <Select label="Alterar role" onChange={(event) => setNewRole(event.target.value as UserRole)} value={newRole}>
              <option value="aluno">Aluno</option>
              <option value="personal">Personal</option>
              <option value="admin">Admin</option>
              <option value="recepcao">Recepção</option>
            </Select>
            <Button loading={updateRoleMutation.isPending} onClick={() => updateRoleMutation.mutate()}>
              Salvar Role
            </Button>
            <Button
              loading={deactivateMutation.isPending}
              onClick={() => {
                if (window.confirm('Confirma desativar esta conta?')) {
                  deactivateMutation.mutate();
                }
              }}
              variant="danger"
            >
              Desativar Conta
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Fichas de treino ativas</h2>
          {filteredSheets.length === 0 ? (
            <p className="text-sm text-gray-500">Sem fichas ativas para este aluno.</p>
          ) : (
            <Table
              columns={[
                { key: 'name', header: 'Ficha', render: (sheet) => sheet.name },
                { key: 'exercises', header: 'Exercícios', render: (sheet) => sheet.exercises.length },
                {
                  key: 'status',
                  header: 'Status',
                  render: (sheet) => <Badge tone={sheet.is_active ? 'success' : 'muted'}>{sheet.is_active ? 'Ativa' : 'Inativa'}</Badge>,
                },
              ]}
              rowKey={(sheet) => sheet.id}
              rows={filteredSheets}
            />
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold">Avaliações físicas</h2>
          {filteredAssessments.length === 0 ? (
            <p className="text-sm text-gray-500">Sem avaliações registradas para este aluno.</p>
          ) : (
            <Table
              columns={[
                { key: 'date', header: 'Data', render: (item) => item.assessment_date },
                { key: 'weight', header: 'Peso', render: (item) => (item.weight_kg ? `${item.weight_kg} kg` : '-') },
                { key: 'bodyfat', header: 'Gordura', render: (item) => (item.body_fat_pct ? `${item.body_fat_pct}%` : '-') },
                { key: 'bmi', header: 'IMC', render: (item) => (item.bmi ? item.bmi.toFixed(1) : '-') },
              ]}
              rowKey={(item) => item.id}
              rows={filteredAssessments}
            />
          )}
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="mb-2 text-lg font-semibold">Históricos (check-ins e pontos)</h2>
        <p className="text-sm text-gray-500">
          A API atual não expõe histórico por usuário específico para o painel admin. Este bloco permanece
          reservado para o próximo incremento backend.
        </p>
      </Card>
    </section>
  );
}
