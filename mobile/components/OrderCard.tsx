import { View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { StatusBadge } from "./StatusBadge";
import { AppText } from "./ui";
import { colors, fonts, radius, shadow, spacing } from "../lib/theme";
import { formatCurrency, formatTimeAgo } from "../lib/format";

interface OrderCardProps {
  order: {
    _id: string;
    orderNumber: string;
    customerName: string;
    contactNumber: string;
    serviceType: string;
    total: number;
    status: string;
    items: { name: string; quantity: number }[];
    createdAt: number;
  };
}

export function OrderCard({ order }: OrderCardProps) {
  const router = useRouter();
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const timeAgo = formatTimeAgo(order.createdAt);
  const serviceLabel =
    order.serviceType.charAt(0).toUpperCase() + order.serviceType.slice(1);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push(`/order/${order._id}`)}
    >
      <View style={styles.header}>
        <AppText variant="heading">{order.orderNumber}</AppText>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.details}>
        <AppText variant="body" style={styles.customerName}>
          {order.customerName || "Walk-in Customer"}
        </AppText>
        <AppText variant="muted">
          {serviceLabel} · {itemCount} item{itemCount !== 1 ? "s" : ""}
        </AppText>
        <AppText variant="muted">
          {order.contactNumber || "No contact"}
        </AppText>
      </View>

      <View style={styles.footer}>
        <AppText variant="price">{formatCurrency(order.total)}</AppText>
        <AppText variant="muted" style={styles.time}>
          {timeAgo}
        </AppText>
      </View>
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
    marginBottom: spacing.sm + 4,
    ...shadow.card,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  details: { marginBottom: spacing.sm },
  customerName: {
    color: colors.textPrimary,
    fontFamily: fonts.bodyMedium,
    marginBottom: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  time: { color: colors.textFaint },
});
