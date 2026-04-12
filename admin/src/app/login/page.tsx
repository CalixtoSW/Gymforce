'use client';

import { useMutation } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { setTokens } from '@/lib/auth';
import type { AuthTokens, User } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@gymforce.app');
  const [password, setPassword] = useState('Teste@123');

  const loginMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<AuthTokens>('/auth/login', { email, password });
      setTokens(data.access_token, data.refresh_token);
      const me = await api.get<User>('/auth/me');
      if (me.data.role !== 'admin' && me.data.role !== 'recepcao') {
        throw new Error('Acesso restrito a administradores/recepção.');
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Login realizado com sucesso.');
      router.replace('/dashboard');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Falha ao autenticar';
      toast.error(message);
    },
  });

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-brand-500" />
          <h1 className="text-2xl font-bold">GymForce Admin</h1>
          <p className="mt-1 text-sm text-gray-600">Acesso restrito a administradores</p>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            loginMutation.mutate();
          }}
        >
          <Input
            autoComplete="email"
            label="Email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
          <Input
            autoComplete="current-password"
            label="Senha"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          <Button className="w-full" loading={loginMutation.isPending} type="submit">
            Entrar
          </Button>
        </form>
      </Card>
    </main>
  );
}
