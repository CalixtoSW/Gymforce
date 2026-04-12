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
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { api } from '@/lib/api';
import type { Challenge, ChallengeGoalType } from '@/types';

export default function ChallengesPage() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalType, setGoalType] = useState<ChallengeGoalType>('checkins');
  const [goalValue, setGoalValue] = useState('10');
  const [rewardPoints, setRewardPoints] = useState('100');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [icon, setIcon] = useState('🎯');

  const challengesQuery = useQuery({
    queryKey: ['challenges'],
    queryFn: () => api.get<Challenge[]>('/challenges').then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/challenges', {
        title,
        description: description || null,
        goal_type: goalType,
        goal_value: Number(goalValue),
        reward_points: Number(rewardPoints),
        start_date: startDate,
        end_date: endDate,
        icon,
      }),
    onSuccess: async () => {
      toast.success('Desafio criado com sucesso.');
      setOpen(false);
      setTitle('');
      setDescription('');
      await challengesQuery.refetch();
    },
    onError: () => toast.error('Falha ao criar desafio.'),
  });

  return (
    <section>
      <PageTitle
        subtitle="Cadastro e monitoramento de desafios ativos"
        title="Desafios"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Desafio
          </Button>
        }
      />

      <Table
        columns={[
          {
            key: 'title',
            header: 'Título',
            render: (item) => (
              <span className="font-medium">
                {item.icon} {item.title}
              </span>
            ),
          },
          { key: 'type', header: 'Tipo', render: (item) => item.goal_type },
          { key: 'goal', header: 'Meta', render: (item) => item.goal_value },
          { key: 'points', header: 'Pontos', render: (item) => item.reward_points },
          { key: 'period', header: 'Período', render: (item) => `${item.start_date} → ${item.end_date}` },
          { key: 'members', header: 'Participantes', render: (item) => item.total_participants },
          {
            key: 'status',
            header: 'Status',
            render: (item) => <Badge tone={item.is_active ? 'success' : 'muted'}>{item.is_active ? 'Ativo' : 'Encerrado'}</Badge>,
          },
        ]}
        rowKey={(item) => item.id}
        rows={challengesQuery.data ?? []}
      />

      <Modal onClose={() => setOpen(false)} open={open} title="Novo Desafio">
        <form
          className="grid grid-cols-1 gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
        >
          <Input label="Título" onChange={(event) => setTitle(event.target.value)} required value={title} />
          <Input
            label="Descrição"
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />
          <Select
            label="Tipo"
            onChange={(event) => setGoalType(event.target.value as ChallengeGoalType)}
            value={goalType}
          >
            <option value="checkins">Check-ins</option>
            <option value="workouts">Workouts</option>
            <option value="points">Pontos</option>
            <option value="streak">Streak</option>
          </Select>
          <Input
            label="Meta"
            min={1}
            onChange={(event) => setGoalValue(event.target.value)}
            required
            type="number"
            value={goalValue}
          />
          <Input
            label="Pontos de recompensa"
            min={0}
            onChange={(event) => setRewardPoints(event.target.value)}
            required
            type="number"
            value={rewardPoints}
          />
          <Input
            label="Data de início"
            onChange={(event) => setStartDate(event.target.value)}
            required
            type="date"
            value={startDate}
          />
          <Input
            label="Data de fim"
            onChange={(event) => setEndDate(event.target.value)}
            required
            type="date"
            value={endDate}
          />
          <Input label="Ícone" maxLength={2} onChange={(event) => setIcon(event.target.value)} value={icon} />
          <Button loading={createMutation.isPending} type="submit">
            Salvar
          </Button>
        </form>
      </Modal>
    </section>
  );
}
