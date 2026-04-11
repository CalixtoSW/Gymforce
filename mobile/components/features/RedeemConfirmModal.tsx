import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import type { Reward } from '@/types';

type RedeemConfirmModalProps = {
  visible: boolean;
  reward: Reward | null;
  userPoints: number;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function RedeemConfirmModal({
  visible,
  reward,
  userPoints,
  isSubmitting,
  onCancel,
  onConfirm,
}: RedeemConfirmModalProps) {
  if (!reward) {
    return null;
  }

  const afterBalance = userPoints - reward.cost_points;

  return (
    <Modal animationType='fade' transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>Confirmar Resgate?</Text>
          <Text style={styles.rewardName}>{reward.name}</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Custo: ⭐ {reward.cost_points.toLocaleString('pt-BR')} pts</Text>
            <Text style={styles.infoText}>Seu saldo: ⭐ {userPoints.toLocaleString('pt-BR')} pts</Text>
            <Text style={styles.infoText}>Saldo apos: ⭐ {afterBalance.toLocaleString('pt-BR')} pts</Text>
          </View>

          <View style={styles.actionsRow}>
            <Pressable disabled={isSubmitting} onPress={onCancel} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable disabled={isSubmitting} onPress={onConfirm} style={styles.confirmButton}>
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.textPrimary} />
              ) : (
                <Text style={styles.confirmText}>Confirmar</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  confirmText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
    padding: SPACING.sm,
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.md,
    padding: SPACING.lg,
    width: '88%',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  rewardName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
});
