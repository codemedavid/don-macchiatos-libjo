import { View, Text, StyleSheet } from "react-native";

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
  color = "#4ADE80",
}: SalesSummaryCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    flex: 1,
  },
  title: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
});
