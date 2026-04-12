'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { PageTitle } from '@/components/layout/PageTitle';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Plan } from '@/types';

export default function PlansPage() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [price, setPrice] = useState('99.90');
  const [description, setDescription] = useState('');

  const plansQuery = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get<Plan[]>('/plans').then((res) => res.data),
  });

  const createPlanMutation = useMutation({
    mutationFn: () =>
      api.post('/plans', {
        name,
        duration_days: Number(durationDays),
        price: Number(price),
        description: description || null,
      }),
    onSuccess: async () => {
      toast.success('Plano criado com sucesso.');
      setOpen(false);
      setName('');
      setDurationDays('30');
      setPrice('99.90');
      setDescription('');
      await plansQuery.refetch();
    },
    onError: () => toast.error('Falha ao criar plano.'),
  });

  return (
    <section>
      <PageTitle
        subtitle="Gestão de planos ativos"
        title="Planos"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Plano
          </Button>
        }
      />

      <Table
        columns={[
          { key: 'name', header: 'Nome', render: (plan) => <span className="font-medium">{plan.name}</span> },
          { key: 'duration', header: 'Duração', render: (plan) => `${plan.duration_days} dias` },
          { key: 'price', header: 'Preço', render: (plan) => formatCurrency(plan.price) },
          {
            key: 'status',
            header: 'Status',
            render: (plan) => <Badge tone={plan.is_active ? 'success' : 'muted'}>{plan.is_active ? 'Ativo' : 'Inativo'}</Badge>,
          },
        ]}
        rowKey={(plan) => plan.id}
        rows={plansQuery.data ?? []}
      />

      <Modal onClose={() => setOpen(false)} open={open} title="Novo Plano">
        <form
          className="grid grid-cols-1 gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            createPlanMutation.mutate();
          }}
        >
          <Input label="Nome" onChange={(event) => setName(event.target.value)} required value={name} />
          <Input
            label="Duração (dias)"
            min={1}
            onChange={(event) => setDurationDays(event.target.value)}
            required
            type="number"
            value={durationDays}
          />
          <Input
            label="Preço"
            min={0}
            onChange={(event) => setPrice(event.target.value)}
            required
            step="0.01"
            type="number"
            value={price}
          />
          <Input
            label="Descrição"
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />
          <Button loading={createPlanMutation.isPending} type="submit">
            Salvar Plano
          </Button>
        </form>
      </Modal>
    </section>
  );
}
