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
import type { NotificationResponse, User } from '@/types';

export default function NotificationsPage() {
  const [target, setTarget] = useState<'single' | 'all'>('all');
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const usersQuery = useQuery({
    queryKey: ['users-notification-select'],
    queryFn: () => api.get<User[]>('/users?limit=100').then((res) => res.data),
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      api
        .post<NotificationResponse>('/notifications/send', {
          user_id: target === 'single' ? userId : null,
          title,
          body: message,
        })
        .then((response) => response.data),
    onSuccess: (data) => {
      toast.success(`Enviado para ${data.sent} dispositivos.`);
      setTitle('');
      setMessage('');
    },
    onError: () => toast.error('Falha ao enviar notificação.'),
  });

  return (
    <section>
      <PageTitle subtitle="Envio de push notifications" title="Notificações" />

      <Card>
        <form
          className="grid grid-cols-1 gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (target === 'single' && !userId) {
              toast.error('Selecione o aluno para envio individual.');
              return;
            }
            sendMutation.mutate();
          }}
        >
          <Select
            label="Destino"
            onChange={(event) => setTarget(event.target.value as 'single' | 'all')}
            value={target}
          >
            <option value="all">Para todos</option>
            <option value="single">Para um aluno</option>
          </Select>

          {target === 'single' ? (
            <Select label="Aluno" onChange={(event) => setUserId(event.target.value)} value={userId}>
              <option value="">Selecione...</option>
              {(usersQuery.data ?? []).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </Select>
          ) : null}

          <Input
            label="Título"
            maxLength={100}
            onChange={(event) => setTitle(event.target.value)}
            required
            value={title}
          />
          <Input
            label="Mensagem"
            maxLength={500}
            onChange={(event) => setMessage(event.target.value)}
            required
            value={message}
          />

          <Button loading={sendMutation.isPending} type="submit">
            Enviar
          </Button>
        </form>
      </Card>
    </section>
  );
}
