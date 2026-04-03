import { View, Text, StyleSheet } from "react-native";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FEF3C7", text: "#92400E" },
  confirmed: { bg: "#DBEAFE", text: "#1E40AF" },
  preparing: { bg: "#E0E7FF", text: "#3730A3" },
  ready: { bg: "#D1FAE5", text: "#065F46" },
  completed: { bg: "#E5E7EB", text: "#374151" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B" },
};

export function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.pending;

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
});
