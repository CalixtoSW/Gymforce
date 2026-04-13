import * as Haptics from 'expo-haptics';
import { AxiosError } from 'axios';
import { create } from 'zustand';

import { api } from '@/services/api';
import type { SessionDetail, SetLogStatus } from '@/types';

type SessionState = {
  session: SessionDetail | null;
  isLoading: boolean;
  currentExerciseIndex: number;
  isTimerActive: boolean;
  timerSeconds: number;

  startSession: (sheetId: string) => Promise<void>;
  loadActiveSession: () => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  logSet: (data: {
    exercise_id: string;
    set_number: number;
    actual_reps?: number;
    actual_weight_kg?: number;
    status?: SetLogStatus;
    rest_seconds_taken?: number;
  }) => Promise<void>;
  finishSession: (
    type: 'complete' | 'partial',
    reason?: string,
    notes?: string,
  ) => Promise<void>;
  refreshSession: () => Promise<void>;
  setCurrentExercise: (index: number) => void;
  startTimer: (seconds: number) => void;
  tickTimer: () => void;
  stopTimer: () => void;
  reset: () => void;
};

function inferCurrentExerciseIndex(session: SessionDetail | null): number {
  if (!session || !session.exercises_progress.length) {
    return 0;
  }

  const nextIndex = session.exercises_progress.findIndex(
    (exercise) => exercise.sets_remaining > 0,
  );
  return nextIndex >= 0 ? nextIndex : session.exercises_progress.length - 1;
}

function isNotFound(error: unknown): boolean {
  return (
    error instanceof AxiosError &&
    error.response?.status === 404
  );
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  isLoading: false,
  currentExerciseIndex: 0,
  isTimerActive: false,
  timerSeconds: 0,

  startSession: async (sheetId) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post<SessionDetail>('/sessions/start', {
        sheet_id: sheetId,
      });
      set({
        session: data,
        currentExerciseIndex: inferCurrentExerciseIndex(data),
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loadActiveSession: async () => {
    try {
      const { data } = await api.get<SessionDetail | null>('/sessions/active');
      set({
        session: data,
        currentExerciseIndex: inferCurrentExerciseIndex(data),
      });
    } catch (error) {
      if (isNotFound(error)) {
        set({ session: null, currentExerciseIndex: 0 });
        return;
      }
      throw error;
    }
  },

  pauseSession: async () => {
    const { session } = get();
    if (!session) {
      return;
    }
    await api.post(`/sessions/${session.id}/pause`);
    await get().refreshSession();
  },

  resumeSession: async () => {
    const { session } = get();
    if (!session) {
      return;
    }
    await api.post(`/sessions/${session.id}/resume`);
    await get().refreshSession();
  },

  logSet: async (data) => {
    const { session } = get();
    if (!session) {
      return;
    }

    await api.post(`/sessions/${session.id}/log-set`, data);
    if (data.status !== 'skipped') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await get().refreshSession();
  },

  finishSession: async (type, reason, notes) => {
    const { session } = get();
    if (!session) {
      return;
    }

    const { data } = await api.post<SessionDetail>(`/sessions/${session.id}/finish`, {
      completion_type: type,
      partial_reason: reason,
      partial_notes: notes,
    });
    set({ session: data, isTimerActive: false, timerSeconds: 0 });
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  refreshSession: async () => {
    const { session } = get();
    if (!session) {
      return;
    }
    const { data } = await api.get<SessionDetail>(`/sessions/${session.id}`);
    set({
      session: data,
      currentExerciseIndex: inferCurrentExerciseIndex(data),
    });
  },

  setCurrentExercise: (index) => set({ currentExerciseIndex: Math.max(0, index) }),

  startTimer: (seconds) =>
    set({ isTimerActive: true, timerSeconds: Math.max(0, Math.floor(seconds)) }),

  tickTimer: () => {
    const current = get().timerSeconds;
    if (current <= 0) {
      set({ isTimerActive: false, timerSeconds: 0 });
      return;
    }
    set({ timerSeconds: current - 1 });
  },

  stopTimer: () => set({ isTimerActive: false, timerSeconds: 0 }),

  reset: () =>
    set({
      session: null,
      isLoading: false,
      currentExerciseIndex: 0,
      isTimerActive: false,
      timerSeconds: 0,
    }),
}));
