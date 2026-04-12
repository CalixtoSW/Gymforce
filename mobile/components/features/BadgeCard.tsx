import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';

type BadgeCardProps = {
  icon: string;
  name: string;
  description: string;
  earned: boolean;
  earnedAt: string | null;
  pointsBonus: number;
};

function formatEarnedDate(earnedAt: string | null): string | null {
  if (!earnedAt) {
    return null;
  }

  const date = new Date(earnedAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString('pt-BR');
}

export function BadgeCard({
  icon,
  name,
  description,
  earned,
  earnedAt,
  pointsBonus,
}: BadgeCardProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const formattedDate = useMemo(() => formatEarnedDate(earnedAt), [earnedAt]);

  return (
    <>
      <Pressable
        onPress={() => setIsModalVisible(true)}
        style={[styles.card, earned ? styles.cardEarned : styles.cardLocked]}
      >
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.status}>{earned ? '✅' : '🔒'}</Text>
      </Pressable>

      <Modal
        animationType="fade"
        transparent
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>
                  {icon} {name}
                </Text>
                <Text style={styles.modalText}>{description}</Text>

                {earned ? (
                  <Text style={styles.modalStatus}>
                    Conquistado em {formattedDate ?? 'data indisponivel'}
                  </Text>
                ) : (
                  <Text style={styles.modalStatus}>Criterio para desbloquear: {description}</Text>
                )}

                {pointsBonus > 0 && (
                  <Text style={styles.modalBonus}>+{pointsBonus} pontos ao desbloquear</Text>
                )}

                <Pressable
                  onPress={() => setIsModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>Fechar</Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    flex: 1,
    minHeight: 140,
    padding: SPACING.md,
  },
  cardEarned: {
    backgroundColor: COLORS.surfaceLight,
    borderColor: COLORS.primary,
  },
  cardLocked: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    opacity: 0.45,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  closeButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  icon: {
    fontSize: 30,
    marginBottom: SPACING.xs,
  },
  modalBonus: {
    color: COLORS.xp,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.sm,
    padding: SPACING.lg,
    width: '88%',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalStatus: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  modalText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  status: {
    fontSize: FONT_SIZE.lg,
    marginTop: SPACING.xs,
  },
});
