import { View, Text, StyleSheet } from "react-native";
import { fonts, radius, statusColors } from "../lib/theme";

export function StatusBadge({ status }: { status: string }) {
  const colors = statusColors[status] || statusColors.pending;

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
    borderRadius: radius.badge,
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
});
