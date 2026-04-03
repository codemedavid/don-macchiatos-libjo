import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { StatusBadge } from "../../components/StatusBadge";

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
  const order = useQuery(api.orders.getOrderById, {
    orderId: id as any,
  });
  const updateStatus = useMutation(api.orders.updateOrderStatus);

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading order...</Text>
      </View>
    );
  }

  const nextStatus = STATUS_FLOW[order.status];
  const actionLabel = ACTION_LABELS[order.status];

  const handleStatusUpdate = () => {
    if (!nextStatus) return;
    Alert.alert(
      "Update Status",
      `Change order status to "${nextStatus}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            await updateStatus({
              orderId: id as any,
              status: nextStatus as any,
            });
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          await updateStatus({
            orderId: id as any,
            status: "cancelled",
          });
          router.back();
        },
      },
    ]);
  };

  const date = new Date(order.createdAt);
  const formattedDate = date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Details</Text>
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
        {order.address && (
          <DetailRow label="Address" value={order.address} />
        )}
        {order.pickupTime && (
          <DetailRow label="Pickup Time" value={order.pickupTime} />
        )}
        <DetailRow label="Payment" value={order.paymentMethod.toUpperCase()} />
        {order.referenceNumber && (
          <DetailRow label="Ref #" value={order.referenceNumber} />
        )}
        <DetailRow label="Ordered" value={formattedDate} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {order.items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>
                {item.name} x{item.quantity}
              </Text>
              {item.variations && item.variations.length > 0 && (
                <Text style={styles.itemMeta}>
                  {item.variations.map((v) => `${v.type}: ${v.name}`).join(", ")}
                </Text>
              )}
              {item.servingPreference && (
                <Text style={styles.itemMeta}>
                  Serving: {item.servingPreference}
                </Text>
              )}
              {item.addOns && item.addOns.length > 0 && (
                <Text style={styles.itemMeta}>
                  Add-ons: {item.addOns.join(", ")}
                </Text>
              )}
            </View>
            <Text style={styles.itemPrice}>
              PHP {(item.totalPrice * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}

        {order.bundleItems?.map((bundle, index) => (
          <View key={`bundle-${index}`} style={styles.bundleRow}>
            <View style={styles.bundleHeader}>
              <View style={styles.bundleBadge}>
                <Text style={styles.bundleBadgeText}>BUNDLE</Text>
              </View>
              <Text style={styles.itemName}>
                {bundle.bundleName} x{bundle.quantity}
              </Text>
            </View>
            {bundle.items.map((item, i) => (
              <Text key={i} style={styles.bundleItem}>
                • {item.name}
                {item.variations &&
                  ` (${item.variations.map((v) => `${v.type}: ${v.name}`).join(", ")})`}
              </Text>
            ))}
            <Text style={styles.itemPrice}>
              PHP {(bundle.bundlePrice * bundle.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      {order.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <Text style={styles.notes}>{order.notes}</Text>
        </View>
      )}

      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>PHP {order.total.toFixed(2)}</Text>
      </View>

      {!["completed", "cancelled"].includes(order.status) && (
        <View style={styles.actions}>
          {actionLabel && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleStatusUpdate}
            >
              <Text style={styles.primaryButtonText}>{actionLabel}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel Order</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  loadingText: {
    color: "#999",
    fontSize: 16,
  },
  header: {
    padding: 16,
    gap: 8,
  },
  backButton: {
    color: "#60A5FA",
    fontSize: 16,
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  section: {
    backgroundColor: "#2a2a2a",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#999",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: "#999",
  },
  detailValue: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
    maxWidth: "60%",
    textAlign: "right",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  itemName: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "600",
  },
  itemMeta: {
    fontSize: 13,
    color: "#999",
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 15,
    color: "#4ADE80",
    fontWeight: "600",
  },
  bundleRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  bundleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  bundleBadge: {
    backgroundColor: "#fff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bundleBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  bundleItem: {
    fontSize: 13,
    color: "#999",
    marginLeft: 8,
    marginTop: 2,
  },
  notes: {
    fontSize: 14,
    color: "#fff",
    lineHeight: 20,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4ADE80",
  },
  actions: {
    paddingHorizontal: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
});
