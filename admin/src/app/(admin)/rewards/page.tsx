'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { PageTitle } from '@/components/layout/PageTitle';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import type { Redemption, Reward } from '@/types';

type RewardFormState = {
  id?: string;
  name: string;
  description: string;
  cost_points: string;
  stock: string;
  category: string;
  is_active: boolean;
};

const initialForm: RewardFormState = {
  name: '',
  description: '',
  cost_points: '100',
  stock: '10',
  category: '',
  is_active: true,
};

export default function RewardsPage() {
  const [tab, setTab] = useState<'catalog' | 'pending'>('catalog');
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState<RewardFormState>(initialForm);

  const rewardsQuery = useQuery({
    queryKey: ['admin-rewards'],
    queryFn: () => api.get<Reward[]>('/rewards').then((res) => res.data),
  });

  const pendingQuery = useQuery({
    queryKey: ['admin-pending-redemptions'],
    queryFn: () => api.get<Redemption[]>('/rewards/admin/pending').then((res) => res.data),
  });

  const saveRewardMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        description: form.description || null,
        cost_points: Number(form.cost_points),
        stock: form.stock ? Number(form.stock) : null,
        category: form.category || null,
        is_active: form.is_active,
      };

      if (form.id) {
        return api.patch(`/rewards/${form.id}`, payload);
      }

      return api.post('/rewards', payload);
    },
    onSuccess: async () => {
      toast.success('Recompensa salva com sucesso.');
      setOpenModal(false);
      setForm(initialForm);
      await rewardsQuery.refetch();
    },
    onError: () => toast.error('Falha ao salvar recompensa.'),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'deliver' | 'cancel' }) =>
      api.post(`/rewards/admin/redemptions/${id}/${action}`),
    onSuccess: async (_, vars) => {
      toast.success(vars.action === 'deliver' ? 'Resgate entregue.' : 'Resgate cancelado.');
      await pendingQuery.refetch();
    },
    onError: () => toast.error('Falha ao processar ação.'),
  });

  const sortedPending = useMemo(
    () => [...(pendingQuery.data ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [pendingQuery.data],
  );

  return (
    <section>
      <PageTitle subtitle="Catálogo de recompensas e gestão de resgates" title="Prêmios" />

      <div className="mb-4 flex gap-2">
        <Button onClick={() => setTab('catalog')} variant={tab === 'catalog' ? 'primary' : 'secondary'}>
          Catálogo
        </Button>
        <Button onClick={() => setTab('pending')} variant={tab === 'pending' ? 'primary' : 'secondary'}>
          Resgates Pendentes
        </Button>
      </div>

      {tab === 'catalog' ? (
        <>
          <div className="mb-4">
            <Button
              onClick={() => {
                setForm(initialForm);
                setOpenModal(true);
              }}
            >
              Nova Recompensa
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(rewardsQuery.data ?? []).map((reward) => (
              <Card className="cursor-pointer" key={reward.id}>
                <button
                  className="w-full text-left"
                  onClick={() => {
                    setForm({
                      id: reward.id,
                      name: reward.name,
                      description: reward.description ?? '',
                      cost_points: String(reward.cost_points),
                      stock: reward.stock !== null ? String(reward.stock) : '',
                      category: reward.category ?? '',
                      is_active: reward.is_active,
                    });
                    setOpenModal(true);
                  }}
                  type="button"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{reward.name}</h3>
                  <p className="mt-1 text-sm text-gray-600">{reward.description ?? 'Sem descrição'}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone="warning">{reward.cost_points} pts</Badge>
                    <Badge tone={reward.is_active ? 'success' : 'muted'}>
                      {reward.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Badge tone="default">Estoque: {reward.stock ?? '∞'}</Badge>
                  </div>
                </button>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Table
          columns={[
            { key: 'user', header: 'Aluno (ID)', render: (item) => item.user_id },
            { key: 'reward', header: 'Recompensa', render: (item) => item.reward.name },
            { key: 'points', header: 'Pontos', render: (item) => item.points_spent },
            { key: 'date', header: 'Data', render: (item) => formatDateTime(item.created_at) },
            {
              key: 'actions',
              header: 'Ações',
              render: (item) => (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (window.confirm('Confirmar entrega do resgate?')) {
                        actionMutation.mutate({ id: item.id, action: 'deliver' });
                      }
                    }}
                    variant="secondary"
                  >
                    Entregar
                  </Button>
                  <Button
                    onClick={() => {
                      if (window.confirm('Cancelar resgate e devolver pontos?')) {
                        actionMutation.mutate({ id: item.id, action: 'cancel' });
                      }
                    }}
                    variant="danger"
                  >
                    Cancelar
                  </Button>
                </div>
              ),
            },
          ]}
          rowKey={(item) => item.id}
          rows={sortedPending}
        />
      )}

      <Modal onClose={() => setOpenModal(false)} open={openModal} title={form.id ? 'Editar Recompensa' : 'Nova Recompensa'}>
        <form
          className="grid grid-cols-1 gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            saveRewardMutation.mutate();
          }}
        >
          <Input label="Nome" onChange={(e) => setForm({ ...form, name: e.target.value })} required value={form.name} />
          <Input
            label="Descrição"
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            value={form.description}
          />
          <Input
            label="Custo (pts)"
            min={1}
            onChange={(e) => setForm({ ...form, cost_points: e.target.value })}
            required
            type="number"
            value={form.cost_points}
          />
          <Input
            label="Estoque"
            min={0}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            type="number"
            value={form.stock}
          />
          <Input
            label="Categoria"
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            value={form.category}
          />
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              type="checkbox"
            />
            Ativa
          </label>

          <Button loading={saveRewardMutation.isPending} type="submit">
            Salvar
          </Button>
        </form>
      </Modal>
    </section>
  );
}
