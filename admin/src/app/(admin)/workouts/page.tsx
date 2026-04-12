'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { PageTitle } from '@/components/layout/PageTitle';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { api } from '@/lib/api';
import type { Exercise, User, WorkoutSheet } from '@/types';

function buildExercise(order: number): Exercise {
  return {
    name: '',
    notes: null,
    order,
    reps: '12',
    rest_seconds: 60,
    sets: 3,
  };
}

export default function WorkoutsPage() {
  const [userId, setUserId] = useState('');
  const [sheetName, setSheetName] = useState('Treino A');
  const [exercises, setExercises] = useState<Exercise[]>([buildExercise(0)]);

  const usersQuery = useQuery({
    queryKey: ['users-workout-select'],
    queryFn: () => api.get<User[]>('/users?limit=100').then((res) => res.data),
  });

  const sheetsQuery = useQuery({
    queryKey: ['workout-sheets-list'],
    queryFn: () => api.get<WorkoutSheet[]>('/workouts/sheets').then((res) => res.data),
  });

  const createSheetMutation = useMutation({
    mutationFn: () =>
      api.post('/workouts/sheets', {
        user_id: userId,
        name: sheetName,
        exercises: exercises.map((exercise, index) => ({
          ...exercise,
          notes: exercise.notes || null,
          order: index,
          rest_seconds: Number(exercise.rest_seconds),
          sets: Number(exercise.sets),
        })),
      }),
    onSuccess: async () => {
      toast.success('Ficha criada com sucesso.');
      setSheetName('Treino A');
      setExercises([buildExercise(0)]);
      await sheetsQuery.refetch();
    },
    onError: () => toast.error('Falha ao criar ficha.'),
  });

  function addExercise() {
    setExercises((prev) => [...prev, buildExercise(prev.length)]);
  }

  function removeExercise(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <section>
      <PageTitle subtitle="Criação de fichas de treino por aluno" title="Fichas de Treino" />

      <Card>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!userId) {
              toast.error('Selecione um aluno.');
              return;
            }
            createSheetMutation.mutate();
          }}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Select label="Aluno" onChange={(event) => setUserId(event.target.value)} required value={userId}>
              <option value="">Selecione...</option>
              {(usersQuery.data ?? []).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </Select>
            <Input
              label="Nome da ficha"
              onChange={(event) => setSheetName(event.target.value)}
              required
              value={sheetName}
            />
          </div>

          <div className="space-y-3">
            {exercises.map((exercise, index) => (
              <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-3 md:grid-cols-6" key={index}>
                <Input
                  className="md:col-span-2"
                  label="Exercício"
                  onChange={(event) => {
                    const next = [...exercises];
                    next[index].name = event.target.value;
                    setExercises(next);
                  }}
                  required
                  value={exercise.name}
                />
                <Input
                  label="Séries"
                  min={1}
                  onChange={(event) => {
                    const next = [...exercises];
                    next[index].sets = Number(event.target.value);
                    setExercises(next);
                  }}
                  required
                  type="number"
                  value={exercise.sets}
                />
                <Input
                  label="Reps"
                  onChange={(event) => {
                    const next = [...exercises];
                    next[index].reps = event.target.value;
                    setExercises(next);
                  }}
                  required
                  value={exercise.reps}
                />
                <Input
                  label="Descanso (s)"
                  min={0}
                  onChange={(event) => {
                    const next = [...exercises];
                    next[index].rest_seconds = Number(event.target.value);
                    setExercises(next);
                  }}
                  required
                  type="number"
                  value={exercise.rest_seconds}
                />
                <div className="flex items-end">
                  <Button
                    onClick={() => removeExercise(index)}
                    type="button"
                    variant="danger"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover
                  </Button>
                </div>
                <Input
                  className="md:col-span-6"
                  label="Observações"
                  onChange={(event) => {
                    const next = [...exercises];
                    next[index].notes = event.target.value;
                    setExercises(next);
                  }}
                  value={exercise.notes ?? ''}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={addExercise} type="button" variant="secondary">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Exercício
            </Button>
            <Button loading={createSheetMutation.isPending} type="submit">
              Salvar Ficha
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-6">
        <Table
          columns={[
            { key: 'name', header: 'Ficha', render: (sheet) => sheet.name },
            { key: 'user', header: 'Aluno ID', render: (sheet) => sheet.user_id },
            { key: 'exercises', header: 'Exercícios', render: (sheet) => sheet.exercises.length },
          ]}
          rowKey={(sheet) => sheet.id}
          rows={sheetsQuery.data ?? []}
        />
      </div>
    </section>
  );
}
