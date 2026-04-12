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

export type PointEvent = {
  id: string;
  action_type: string;
  points: number;
  description: string;
  created_at: string;
};

export type StreakInfo = {
  current_streak: number;
  longest_streak: number;
  freeze_available: boolean;
  last_activity_date: string | null;
};

export type GamificationSummary = {
  total_points: number;
  current_points: number;
  tier: UserTier;
  streak: StreakInfo;
  rank: { rank: number; points: number } | null;
};

export type LeaderboardEntry = {
  rank: number;
  user_id: string;
  name: string;
  avatar_url: string | null;
  tier: string;
  points: number;
};

export type LeaderboardResponse = {
  leaderboard: LeaderboardEntry[];
  my_rank: { rank: number; points: number } | null;
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

export type RedemptionStatus = 'pending' | 'delivered' | 'cancelled';

export type Redemption = {
  id: string;
  user_id: string;
  reward_id: string;
  points_spent: number;
  status: RedemptionStatus;
  notes: string | null;
  created_at: string;
  reward: Reward;
};

export type Badge = {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  points_bonus: number;
  category: string;
  earned: boolean;
  earned_at: string | null;
};

export type BadgeListResponse = {
  badges: Badge[];
  total_earned: number;
  total_available: number;
};

export type PaymentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'expired';

export type PixPayment = {
  payment_id: string;
  plan_name: string;
  amount: number;
  discount_points: number;
  discount_amount: number;
  final_amount: number;
  qr_code: string;
  qr_code_base64: string;
  ticket_url: string | null;
  expires_at: string | null;
  status: PaymentStatus;
};

export type PaymentHistory = {
  id: string;
  plan_id: string;
  amount: number;
  discount_points: number;
  discount_amount: number;
  final_amount: number;
  method: string;
  status: PaymentStatus;
  mp_payment_id: string | null;
  paid_at: string | null;
  created_at: string;
};

export type MembershipInfo = {
  id: string;
  user_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: string;
  payment_status: string;
  plan_name: string | null;
  days_remaining: number | null;
};

export type PlanWithDiscount = {
  id: string;
  name: string;
  duration_days: number;
  price: number;
  description: string | null;
  discount_available: number;
  discount_points: number;
  final_price_with_discount: number;
  user_points: number;
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

export type AssessmentEvolution = {
  metric: string;
  previous: number | null;
  current: number | null;
  change: number | null;
  change_pct: number | null;
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

export type UserChallenge = {
  id: string;
  challenge: Challenge;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  progress_pct: number;
};

export type ReferralStats = {
  referral_code: string;
  total_referred: number;
  total_activated: number;
  points_earned: number;
};
