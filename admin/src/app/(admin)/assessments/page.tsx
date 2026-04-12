'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { PageTitle } from '@/components/layout/PageTitle';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { api } from '@/lib/api';
import { toNumber } from '@/lib/utils';
import type { User } from '@/types';

export default function AssessmentsPage() {
  const [userId, setUserId] = useState('');
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().slice(0, 10));

  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [bodyFatPct, setBodyFatPct] = useState('');
  const [muscleMassKg, setMuscleMassKg] = useState('');
  const [chestCm, setChestCm] = useState('');
  const [waistCm, setWaistCm] = useState('');
  const [hipsCm, setHipsCm] = useState('');
  const [rightArmCm, setRightArmCm] = useState('');
  const [leftArmCm, setLeftArmCm] = useState('');
  const [rightThighCm, setRightThighCm] = useState('');
  const [leftThighCm, setLeftThighCm] = useState('');
  const [rightCalfCm, setRightCalfCm] = useState('');
  const [leftCalfCm, setLeftCalfCm] = useState('');
  const [notes, setNotes] = useState('');

  const usersQuery = useQuery({
    queryKey: ['users-assessment-select'],
    queryFn: () => api.get<User[]>('/users?limit=100').then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/assessments', {
        user_id: userId,
        assessment_date: assessmentDate,
        weight_kg: toNumber(weightKg),
        height_cm: toNumber(heightCm),
        body_fat_pct: toNumber(bodyFatPct),
        muscle_mass_kg: toNumber(muscleMassKg),
        chest_cm: toNumber(chestCm),
        waist_cm: toNumber(waistCm),
        hips_cm: toNumber(hipsCm),
        right_arm_cm: toNumber(rightArmCm),
        left_arm_cm: toNumber(leftArmCm),
        right_thigh_cm: toNumber(rightThighCm),
        left_thigh_cm: toNumber(leftThighCm),
        right_calf_cm: toNumber(rightCalfCm),
        left_calf_cm: toNumber(leftCalfCm),
        notes: notes || null,
      }),
    onSuccess: () => {
      toast.success('Avaliação registrada com sucesso.');
    },
    onError: () => {
      toast.error('Falha ao registrar avaliação.');
    },
  });

  return (
    <section>
      <PageTitle subtitle="Registro de avaliação física" title="Avaliações" />

      <Card>
        <form
          className="grid grid-cols-1 gap-3 md:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!userId) {
              toast.error('Selecione um aluno.');
              return;
            }
            createMutation.mutate();
          }}
        >
          <Select label="Aluno" onChange={(event) => setUserId(event.target.value)} required value={userId}>
            <option value="">Selecione...</option>
            {(usersQuery.data ?? []).map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </Select>
          <Input
            label="Data da avaliação"
            onChange={(event) => setAssessmentDate(event.target.value)}
            required
            type="date"
            value={assessmentDate}
          />
          <Input label="Peso (kg)" onChange={(e) => setWeightKg(e.target.value)} type="number" value={weightKg} />
          <Input label="Altura (cm)" onChange={(e) => setHeightCm(e.target.value)} type="number" value={heightCm} />
          <Input label="% Gordura" onChange={(e) => setBodyFatPct(e.target.value)} type="number" value={bodyFatPct} />
          <Input
            label="Massa muscular (kg)"
            onChange={(e) => setMuscleMassKg(e.target.value)}
            type="number"
            value={muscleMassKg}
          />
          <Input label="Peito (cm)" onChange={(e) => setChestCm(e.target.value)} type="number" value={chestCm} />
          <Input label="Cintura (cm)" onChange={(e) => setWaistCm(e.target.value)} type="number" value={waistCm} />
          <Input label="Quadril (cm)" onChange={(e) => setHipsCm(e.target.value)} type="number" value={hipsCm} />
          <Input label="Braço dir (cm)" onChange={(e) => setRightArmCm(e.target.value)} type="number" value={rightArmCm} />
          <Input label="Braço esq (cm)" onChange={(e) => setLeftArmCm(e.target.value)} type="number" value={leftArmCm} />
          <Input
            label="Coxa dir (cm)"
            onChange={(e) => setRightThighCm(e.target.value)}
            type="number"
            value={rightThighCm}
          />
          <Input
            label="Coxa esq (cm)"
            onChange={(e) => setLeftThighCm(e.target.value)}
            type="number"
            value={leftThighCm}
          />
          <Input
            label="Panturrilha dir (cm)"
            onChange={(e) => setRightCalfCm(e.target.value)}
            type="number"
            value={rightCalfCm}
          />
          <Input
            label="Panturrilha esq (cm)"
            onChange={(e) => setLeftCalfCm(e.target.value)}
            type="number"
            value={leftCalfCm}
          />
          <Input
            className="md:col-span-3"
            label="Observações"
            onChange={(e) => setNotes(e.target.value)}
            value={notes}
          />
          <div className="md:col-span-3">
            <Button loading={createMutation.isPending} type="submit">
              Registrar Avaliação
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}
