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

export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes: string | null;
  order: number;
};

export type WorkoutSheet = {
  id: string;
  user_id: string;
  created_by: string;
  name: string;
  is_active: boolean;
  exercises: Exercise[];
};

export type Workout = {
  id: string;
  user_id: string;
  sheet_id: string;
  completed_at: string;
  duration_minutes: number | null;
  points_earned: number;
};

export type Checkin = {
  id: string;
  user_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  points_earned: number;
};

export type QRCodeData = {
  qr_token: string;
  expires_in_seconds: number;
};
