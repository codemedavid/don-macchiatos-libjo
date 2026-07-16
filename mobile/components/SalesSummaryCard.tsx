import { StyleSheet } from "react-native";
import { Card, AppText } from "./ui";
import { colors, fonts } from "../lib/theme";

interface SalesSummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
}

export function SalesSummaryCard({
  title,
  value,
  subtitle,
  color = colors.textPrimary,
}: SalesSummaryCardProps) {
  return (
    <Card style={styles.card}>
      <AppText variant="label">{title}</AppText>
      <AppText style={[styles.value, { color }]}>{value}</AppText>
      {subtitle && (
        <AppText variant="muted" style={styles.subtitle}>
          {subtitle}
        </AppText>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  value: {
    fontFamily: fonts.headline,
    fontSize: 24,
    marginTop: 6,
  },
  subtitle: { marginTop: 4 },
});
