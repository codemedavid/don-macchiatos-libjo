import { ReactNode } from "react";
import {
  View,
  Text,
  TextProps,
  ViewStyle,
  TextStyle,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  StyleProp,
} from "react-native";
import * as Haptics from "expo-haptics";
import { colors, fonts, radius, shadow, spacing } from "../lib/theme";

/**
 * Shared UI primitives built on the brand theme so every screen stays visually
 * consistent with the website. Screens should compose these instead of raw
 * View/Text with ad-hoc colors.
 */

type TextVariant =
  | "display"
  | "title"
  | "heading"
  | "body"
  | "muted"
  | "label"
  | "price";

const TEXT_VARIANTS: Record<TextVariant, TextStyle> = {
  display: { fontFamily: fonts.headline, fontSize: 30, color: colors.textPrimary },
  title: { fontFamily: fonts.headline, fontSize: 22, color: colors.textPrimary },
  heading: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  body: { fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary },
  muted: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  price: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    color: colors.textPrimary,
  },
};

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  children: ReactNode;
}

export function AppText({
  variant = "body",
  style,
  children,
  ...rest
}: AppTextProps) {
  return (
    <Text style={[TEXT_VARIANTS[variant], style]} {...rest}>
      {children}
    </Text>
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        variant === "primary" && styles.buttonPrimary,
        variant === "secondary" && styles.buttonSecondary,
        variant === "danger" && styles.buttonDanger,
        pressed && !isDisabled && styles.buttonPressed,
        isDisabled && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.onPrimary : colors.textPrimary}
        />
      ) : (
        <Text
          style={[
            styles.buttonLabel,
            variant === "primary" && { color: colors.onPrimary },
            variant === "secondary" && { color: colors.textPrimary },
            variant === "danger" && { color: colors.danger },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

interface PillProps {
  label: string;
  active: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Pill({ label, active, onPress, style }: PillProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, active && styles.pillActive, style]}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow.card,
  },
  button: {
    borderRadius: radius.button,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDanger: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  buttonDisabled: { opacity: 0.5 },
  buttonLabel: { fontFamily: fonts.bodySemiBold, fontSize: 16 },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textMuted,
  },
  pillTextActive: { color: colors.onPrimary },
});
