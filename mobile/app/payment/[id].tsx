import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { api } from '@/services/api';
import type { PaymentHistory } from '@/types';

function formatMoney(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function PaymentPixScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    plan_name?: string;
    amount?: string;
    discount_points?: string;
    discount_amount?: string;
    final_amount?: string;
    qr_code?: string;
    qr_code_base64?: string;
    expires_at?: string;
  }>();

  const [secondsLeft, setSecondsLeft] = useState(0);
  const [status, setStatus] = useState('pending');
  const [polling, setPolling] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const paymentId = params.id;
  const planName = params.plan_name ?? 'Plano';
  const amount = Number(params.amount ?? '0');
  const discountAmount = Number(params.discount_amount ?? '0');
  const finalAmount = Number(params.final_amount ?? '0');
  const qrCode = params.qr_code ?? '';
  const qrCodeBase64 = params.qr_code_base64 ?? '';
  const expiresAt = params.expires_at ?? '';

  const imageUri = useMemo(
    () => (qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : null),
    [qrCodeBase64],
  );

  useEffect(() => {
    if (!expiresAt) {
      setSecondsLeft(0);
      return;
    }
    const expiresDate = new Date(expiresAt);
    if (Number.isNaN(expiresDate.getTime())) {
      setSecondsLeft(0);
      return;
    }
    const seconds = Math.max(0, Math.floor((expiresDate.getTime() - Date.now()) / 1000));
    setSecondsLeft(seconds);
  }, [expiresAt]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          setStatus('expired');
          setPolling(false);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!paymentId || !polling) {
      return;
    }

    const checkStatus = async () => {
      const { data } = await api.get<PaymentHistory[]>('/payments/history');
      const payment = data.find((item) => item.id === paymentId);
      if (!payment) {
        return;
      }

      setStatus(payment.status);
      if (payment.status === 'approved') {
        setPolling(false);
        setShowSuccess(true);
      }
      if (payment.status !== 'pending') {
        setPolling(false);
      }
    };

    const interval = setInterval(() => {
      checkStatus().catch(() => undefined);
    }, 5000);

    return () => clearInterval(interval);
  }, [paymentId, polling]);

  const handleCopyPixCode = async () => {
    if (!qrCode) {
      Alert.alert('Código indisponível', 'Não foi possível copiar o código PIX.');
      return;
    }

    await Clipboard.setStringAsync(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    router.replace('/(tabs)/home');
  };

  const handleTryAgain = () => {
    router.replace('/plans');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Voltar</Text>
        </Pressable>
        <Text style={styles.title}>Pagamento PIX</Text>
      </View>

      <View style={styles.planCard}>
        <Text style={styles.planTitle}>{planName}</Text>
        <Text style={styles.planInfo}>Valor: {formatMoney(amount)}</Text>
        <Text style={styles.planInfo}>Desconto pontos: {formatMoney(discountAmount)}</Text>
        <Text style={styles.planFinal}>Total: {formatMoney(finalAmount)}</Text>
      </View>

      <View style={styles.qrCard}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.qrImage} />
        ) : (
          <View style={styles.qrPlaceholder}>
            <Text style={styles.placeholderText}>QR Code indisponível</Text>
          </View>
        )}
        <Text style={styles.instructions}>Escaneie com o app do seu banco</Text>
        <Text style={styles.expireText}>⏰ Expira em: {formatCountdown(secondsLeft)}</Text>
      </View>

      <Text style={styles.orText}>-- OU --</Text>

      <Pressable onPress={handleCopyPixCode} style={styles.copyButton}>
        <Text style={styles.copyButtonText}>{copied ? 'Código PIX copiado ✅' : 'Copiar código PIX'}</Text>
      </Pressable>

      {status === 'expired' ? (
        <View style={styles.expiredCard}>
          <Text style={styles.expiredTitle}>QR Code expirado.</Text>
          <Pressable onPress={handleTryAgain} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.waitingCard}>
          {polling ? <ActivityIndicator color={COLORS.warning} /> : null}
          <Text style={styles.waitingTitle}>
            {status === 'approved' ? 'Pagamento confirmado! ✅' : '⏳ Aguardando pagamento'}
          </Text>
          <Text style={styles.waitingText}>Isso pode levar alguns instantes...</Text>
        </View>
      )}

      <Modal visible={showSuccess} transparent animationType="fade" onRequestClose={handleSuccessClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pagamento confirmado! ✅</Text>
            <Text style={styles.modalText}>Sua matrícula foi ativada.</Text>
            <Pressable onPress={handleSuccessClose} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Voltar para Home</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  container: {
    backgroundColor: COLORS.background,
    flexGrow: 1,
    gap: SPACING.md,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  copyButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    minHeight: 44,
  },
  copyButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  expireText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  expiredCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.warning,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  expiredTitle: {
    color: COLORS.warning,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  instructions: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  modalButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  modalButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
    padding: SPACING.lg,
    width: '86%',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  modalTitle: {
    color: COLORS.success,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  orText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  placeholderText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  planCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.xs,
    padding: SPACING.md,
  },
  planFinal: {
    color: COLORS.success,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  planInfo: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
  },
  planTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  qrCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  qrImage: {
    borderRadius: BORDER_RADIUS.sm,
    height: 220,
    width: 220,
  },
  qrPlaceholder: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    height: 220,
    justifyContent: 'center',
    width: 220,
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: COLORS.warning,
    borderRadius: BORDER_RADIUS.md,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  retryButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  waitingCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  waitingText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  waitingTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
