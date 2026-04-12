export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatPoints(value: number): string {
  return `${value.toLocaleString('pt-BR')} pts`;
}

export function tierLabel(tier: string): string {
  const map: Record<string, string> = {
    bronze: 'Bronze',
    prata: 'Prata',
    ouro: 'Ouro',
    diamante: 'Diamante',
    lenda: 'Lenda',
  };
  return map[tier] ?? tier;
}

export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    admin: 'Admin',
    recepcao: 'Recepção',
    personal: 'Personal',
    aluno: 'Aluno',
  };
  return map[role] ?? role;
}

export function toNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
