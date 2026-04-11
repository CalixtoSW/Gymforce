import type { COLORS } from '@/constants/theme';

export type AppColor = keyof typeof COLORS;

export type UserRole = 'aluno' | 'personal' | 'admin' | 'recepcao';
export type UserTier = 'bronze' | 'prata' | 'ouro' | 'diamante' | 'lenda';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tier: UserTier;
  total_points: number;
  current_points: number;
  streak_count: number;
  avatar_url: string | null;
};
