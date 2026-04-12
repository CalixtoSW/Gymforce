export type UserRole = 'aluno' | 'personal' | 'admin' | 'recepcao';
export type UserTier = 'bronze' | 'prata' | 'ouro' | 'diamante' | 'lenda';

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  tier: UserTier;
  total_points: number;
  current_points: number;
  streak_count: number;
  is_active: boolean;
};

export type DashboardKPIs = {
  total_users: number;
  active_users: number;
  checkins_today: number;
  checkins_this_week: number;
  checkins_this_month: number;
  workouts_this_week: number;
  revenue_month: number;
  pending_redemptions: number;
};

export type CheckinsByHour = {
  hour: number;
  count: number;
};

export type CheckinsByDay = {
  day: string;
  count: number;
};

export type Plan = {
  id: string;
  name: string;
  duration_days: number;
  price: number;
  description: string | null;
  is_active: boolean;
};

export type Reward = {
  id: string;
  name: string;
  description: string | null;
  cost_points: number;
  stock: number | null;
  image_url: string | null;
  is_active: boolean;
  category: string | null;
};

export type Redemption = {
  id: string;
  user_id: string;
  reward_id: string;
  points_spent: number;
  status: string;
  notes: string | null;
  created_at: string;
  reward: Reward;
};

export type ChallengeGoalType = 'checkins' | 'workouts' | 'points' | 'streak';

export type Challenge = {
  id: string;
  title: string;
  description: string | null;
  goal_type: ChallengeGoalType;
  goal_value: number;
  reward_points: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  icon: string;
  total_participants: number;
};

export type Exercise = {
  id?: string;
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

export type Assessment = {
  id: string;
  user_id: string;
  assessed_by: string;
  assessment_date: string;
  weight_kg: number | null;
  height_cm: number | null;
  body_fat_pct: number | null;
  muscle_mass_kg: number | null;
  bmi: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  right_arm_cm: number | null;
  left_arm_cm: number | null;
  right_thigh_cm: number | null;
  left_thigh_cm: number | null;
  right_calf_cm: number | null;
  left_calf_cm: number | null;
  notes: string | null;
};

export type NotificationResponse = {
  sent: number;
};
