'use client';

import { useQuery } from '@tanstack/react-query';
import { Download, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { PageTitle } from '@/components/layout/PageTitle';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { api } from '@/lib/api';
import { formatPoints, roleLabel, tierLabel } from '@/lib/utils';
import type { User, UserRole } from '@/types';

function exportCSV(users: User[]) {
  const headers = 'Nome,Email,CPF,Telefone,Role,Tier,Pontos,Streak,Status\n';
  const rows = users
    .map(
      (u) =>
        `${u.name},${u.email},${u.cpf ?? ''},${u.phone ?? ''},${u.role},${u.tier},${u.total_points},${u.streak_count},${u.is_active ? 'Ativo' : 'Inativo'}`,
    )
    .join('\n');
  const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gymforce_alunos_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function UsersPage() {
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const usersQuery = useQuery({
    queryKey: ['users', skip, limit],
    queryFn: () => api.get<User[]>(`/users?skip=${skip}&limit=${limit}`).then((res) => res.data),
  });

  const filteredUsers = useMemo(() => {
    return (usersQuery.data ?? []).filter((user) => {
      const bySearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const byRole = roleFilter === 'all' ? true : user.role === roleFilter;
      const byStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
            ? user.is_active
            : !user.is_active;
      return bySearch && byRole && byStatus;
    });
  }, [roleFilter, search, statusFilter, usersQuery.data]);

  return (
    <section>
      <PageTitle
        subtitle="Lista de alunos com filtros e exportação CSV"
        title="Alunos"
        actions={
          <Button onClick={() => exportCSV(filteredUsers)} variant="secondary">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <Input
          label="Buscar"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nome ou email"
          value={search}
        />
        <Select
          label="Role"
          onChange={(event) => setRoleFilter(event.target.value as 'all' | UserRole)}
          value={roleFilter}
        >
          <option value="all">Todas</option>
          <option value="aluno">Aluno</option>
          <option value="personal">Personal</option>
          <option value="admin">Admin</option>
          <option value="recepcao">Recepção</option>
        </Select>
        <Select
          label="Status"
          onChange={(event) => setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')}
          value={statusFilter}
        >
          <option value="all">Todos</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </Select>
        <Select
          label="Itens por página"
          onChange={(event) => {
            setLimit(Number(event.target.value));
            setSkip(0);
          }}
          value={String(limit)}
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </Select>
      </div>

      {usersQuery.isLoading ? <p className="text-sm text-gray-500">Carregando alunos...</p> : null}

      {filteredUsers.length === 0 ? (
        <EmptyState
          description="Ajuste filtros ou confira se há dados no backend."
          title="Nenhum aluno encontrado"
        />
      ) : (
        <Table
          columns={[
            { key: 'name', header: 'Nome', render: (user) => <span className="font-medium">{user.name}</span> },
            { key: 'email', header: 'Email', render: (user) => user.email },
            { key: 'role', header: 'Role', render: (user) => roleLabel(user.role) },
            {
              key: 'tier',
              header: 'Tier',
              render: (user) => <Badge tone="tier">{tierLabel(user.tier)}</Badge>,
            },
            { key: 'points', header: 'Pontos', render: (user) => formatPoints(user.total_points) },
            { key: 'streak', header: 'Streak', render: (user) => user.streak_count },
            {
              key: 'status',
              header: 'Status',
              render: (user) => (
                <Badge tone={user.is_active ? 'success' : 'danger'}>
                  {user.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              ),
            },
            {
              key: 'action',
              header: 'Ações',
              render: (user) => (
                <Link className="text-brand-600 hover:underline" href={`/users/${user.id}`}>
                  Ver detalhes
                </Link>
              ),
            },
          ]}
          rowKey={(user) => user.id}
          rows={filteredUsers}
        />
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button disabled={skip === 0} onClick={() => setSkip((prev) => Math.max(0, prev - limit))} variant="secondary">
          Anterior
        </Button>
        <Button disabled={(usersQuery.data ?? []).length < limit} onClick={() => setSkip((prev) => prev + limit)} variant="secondary">
          Próxima
        </Button>
        <Search className="h-4 w-4 text-gray-400" />
      </div>
    </section>
  );
}
