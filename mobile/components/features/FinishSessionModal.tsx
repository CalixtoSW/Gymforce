import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { PARTIAL_REASON_LABELS, type PartialReason } from '@/types';

type FinishSessionModalProps = {
  visible: boolean;
  completionPct: number;
  totalSetsCompleted: number;
  totalSetsPlanned: number;
  onClose: () => void;
  onConfirmComplete: () => Promise<void>;
  onConfirmPartial: (reason: PartialReason, notes?: string) => Promise<void>;
};

export function FinishSessionModal({
  visible,
  completionPct,
  totalSetsCompleted,
  totalSetsPlanned,
  onClose,
  onConfirmComplete,
  onConfirmPartial,
}: FinishSessionModalProps) {
  const [mode, setMode] = useState<'choice' | 'partial'>('choice');
  const [reason, setReason] = useState<PartialReason>('fatigue');
  const [notes, setNotes] = useState('');

  const canComplete = completionPct >= 100;

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Encerrar Treino</Text>
          <Text style={styles.subtitle}>
            Progresso: {completionPct}% ({totalSetsCompleted}/{totalSetsPlanned} series)
          </Text>

          {mode === 'choice' ? (
            <>
              <Pressable
                disabled={!canComplete}
                onPress={onConfirmComplete}
                style={[styles.primary, !canComplete && styles.disabled]}
              >
                <Text style={styles.primaryText}>✅ Treino Completo</Text>
              </Pressable>

              <Pressable
                onPress={() => setMode('partial')}
                style={[styles.secondary, styles.marginTop]}
              >
                <Text style={styles.secondaryText}>⚠️ Encerrar Parcialmente</Text>
              </Pressable>

              <Pressable onPress={onClose} style={[styles.ghost, styles.marginTop]}>
                <Text style={styles.ghostText}>Cancelar</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.reasonTitle}>Qual o motivo?</Text>
              {Object.entries(PARTIAL_REASON_LABELS).map(([key, label]) => {
                const value = key as PartialReason;
                const selected = reason === value;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setReason(value)}
                    style={[styles.reasonOption, selected && styles.reasonOptionSelected]}
                  >
                    <Text style={styles.reasonText}>{label}</Text>
                  </Pressable>
                );
              })}

              <TextInput
                onChangeText={setNotes}
                placeholder="Observacoes (opcional)"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
                value={notes}
              />

              <View style={styles.row}>
                <Pressable
                  onPress={() => setMode('choice')}
                  style={[styles.secondary, styles.rowItem]}
                >
                  <Text style={styles.secondaryText}>Voltar</Text>
                </Pressable>
                <Pressable
                  onPress={() => onConfirmPartial(reason, notes)}
                  style={[styles.primary, styles.rowItem]}
                >
                  <Text style={styles.primaryText}>Confirmar</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    maxHeight: '85%',
    padding: SPACING.lg,
    width: '90%',
  },
  disabled: {
    opacity: 0.55,
  },
  ghost: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
  },
  ghostText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
    minHeight: 44,
    paddingHorizontal: SPACING.md,
  },
  marginTop: {
    marginTop: SPACING.sm,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: '#00000099',
    flex: 1,
    justifyContent: 'center',
  },
  primary: {
    alignItems: 'center',
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: SPACING.md,
  },
  primaryText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  reasonOption: {
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginTop: SPACING.xs,
    padding: SPACING.sm,
  },
  reasonOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceLight,
  },
  reasonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
  },
  reasonTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  rowItem: {
    flex: 1,
  },
  secondary: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: SPACING.md,
  },
  secondaryText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
});
