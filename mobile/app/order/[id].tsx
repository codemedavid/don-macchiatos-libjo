import { View, ScrollView, Pressable, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { StatusBadge } from "../../components/StatusBadge";
import { Card, AppText, Button } from "../../components/ui";
import { colors, fonts, spacing } from "../../lib/theme";
import { formatCurrency } from "../../lib/format";

const STATUS_FLOW: Record<string, string> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "completed",
};

const ACTION_LABELS: Record<string, string> = {
  pending: "Confirm Order",
  confirmed: "Start Preparing",
  preparing: "Mark as Ready",
  ready: "Complete Order",
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const order = useQuery(api.orders.getOrderById, { orderId: id as any });
  const updateStatus = useMutation(api.orders.updateOrderStatus);

  if (!order) {
    return (
      <SafeAreaView style={styles.center}>
        <AppText variant="muted">Loading order…</AppText>
      </SafeAreaView>
    );
  }

  const nextStatus = STATUS_FLOW[order.status];
  const actionLabel = ACTION_LABELS[order.status];
  const isClosed = ["completed", "cancelled"].includes(order.status);

  // A rejected mutation used to disappear into an unhandled promise, leaving
  // the button looking like it did nothing. Always surface the failure.
  const applyStatus = async (status: string) => {
    try {
      await updateStatus({ orderId: id as any, status: status as any });
      return true;
    } catch (error) {
      console.warn("Failed to update order status:", error);
      Alert.alert(
        "Update Failed",
        "The order status could not be updated. Check your connection and try again."
      );
      return false;
    }
  };

  const handleStatusUpdate = () => {
    if (!nextStatus) return;
    Alert.alert("Update Status", `Change order status to "${nextStatus}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => void applyStatus(nextStatus) },
    ]);
  };

  const handleCancel = () => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          if (await applyStatus("cancelled")) router.back();
        },
      },
    ]);
  };

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color={colors.accent} />
            <AppText variant="body" style={styles.backText}>
              Back
            </AppText>
          </Pressable>
          <AppText variant="display" style={styles.orderNumber}>
            {order.orderNumber}
          </AppText>
          <StatusBadge status={order.status} />
        </View>

        <Card style={styles.section}>
          <AppText variant="label" style={styles.sectionTitle}>
            Customer Details
          </AppText>
          <DetailRow
            label="Name"
            value={order.customerName || "Walk-in Customer"}
          />
          <DetailRow
            label="Contact"
            value={order.contactNumber || "Not provided"}
          />
          <DetailRow
            label="Service"
            value={
              order.serviceType.charAt(0).toUpperCase() +
              order.serviceType.slice(1)
            }
          />
          {order.address && <DetailRow label="Address" value={order.address} />}
          {order.pickupTime && (
            <DetailRow label="Pickup Time" value={order.pickupTime} />
          )}
          <DetailRow label="Payment" value={order.paymentMethod.toUpperCase()} />
          {order.referenceNumber && (
            <DetailRow label="Ref #" value={order.referenceNumber} />
          )}
          <DetailRow label="Ordered" value={formattedDate} />
        </Card>

        <Card style={styles.section}>
          <AppText variant="label" style={styles.sectionTitle}>
            Order Items
          </AppText>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <AppText variant="heading">
                  {item.name} ×{item.quantity}
                </AppText>
                {item.variations && item.variations.length > 0 && (
                  <AppText variant="muted" style={styles.itemMeta}>
                    {item.variations
                      .map((v) => `${v.type}: ${v.name}`)
                      .join(", ")}
                  </AppText>
                )}
                {item.servingPreference && (
                  <AppText variant="muted" style={styles.itemMeta}>
                    Serving: {item.servingPreference}
                  </AppText>
                )}
                {item.addOns && item.addOns.length > 0 && (
                  <AppText variant="muted" style={styles.itemMeta}>
                    Add-ons: {item.addOns.join(", ")}
                  </AppText>
                )}
              </View>
              <AppText variant="price">
                {formatCurrency(item.totalPrice * item.quantity)}
              </AppText>
            </View>
          ))}

          {order.bundleItems?.map((bundle, index) => (
            <View key={`bundle-${index}`} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <View style={styles.bundleHeader}>
                  <View style={styles.bundleBadge}>
                    <AppText style={styles.bundleBadgeText}>BUNDLE</AppText>
                  </View>
                  <AppText variant="heading">
                    {bundle.bundleName} ×{bundle.quantity}
                  </AppText>
                </View>
                {bundle.items.map((item, i) => (
                  <AppText key={i} variant="muted" style={styles.bundleItem}>
                    • {item.name}
                    {item.variations &&
                      ` (${item.variations
                        .map((v) => `${v.type}: ${v.name}`)
                        .join(", ")})`}
                  </AppText>
                ))}
              </View>
              <AppText variant="price">
                {formatCurrency(bundle.bundlePrice * bundle.quantity)}
              </AppText>
            </View>
          ))}
        </Card>

        {order.notes && (
          <Card style={styles.section}>
            <AppText variant="label" style={styles.sectionTitle}>
              Special Instructions
            </AppText>
            <AppText variant="body" style={styles.notes}>
              {order.notes}
            </AppText>
          </Card>
        )}

        <Card style={[styles.section, styles.totalSection]}>
          <AppText variant="title">Total</AppText>
          <AppText style={styles.totalValue}>
            {formatCurrency(order.total)}
          </AppText>
        </Card>

        {!isClosed && (
          <View style={styles.actions}>
            {actionLabel && (
              <Button label={actionLabel} onPress={handleStatusUpdate} />
            )}
            <Button
              label="Cancel Order"
              variant="danger"
              onPress={handleCancel}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <AppText variant="muted">{label}</AppText>
      <AppText variant="body" style={styles.detailValue}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { paddingBottom: spacing.xl },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.screenBg,
  },
  header: { padding: spacing.md, gap: spacing.sm },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  backText: { color: colors.accent, fontFamily: fonts.bodyMedium },
  orderNumber: { fontSize: 28 },
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm + 4,
  },
  sectionTitle: { marginBottom: spacing.sm + 4 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  detailValue: {
    color: colors.textPrimary,
    fontFamily: fonts.bodyMedium,
    maxWidth: "60%",
    textAlign: "right",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemInfo: { flex: 1, paddingRight: spacing.sm },
  itemMeta: { marginTop: 2 },
  bundleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  bundleBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bundleBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: colors.onPrimary,
  },
  bundleItem: { marginLeft: spacing.sm, marginTop: 2 },
  notes: { color: colors.textPrimary, lineHeight: 20 },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalValue: {
    fontFamily: fonts.headline,
    fontSize: 26,
    color: colors.textPrimary,
  },
  actions: { paddingHorizontal: spacing.md, gap: spacing.sm + 4 },
});
