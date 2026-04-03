import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { StatusBadge } from "./StatusBadge";

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
  const timeAgo = getTimeAgo(order.createdAt);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/order/${order._id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.details}>
        <Text style={styles.customerName}>
          {order.customerName || "Walk-in Customer"}
        </Text>
        <Text style={styles.meta}>
          {order.serviceType.charAt(0).toUpperCase() +
            order.serviceType.slice(1)}{" "}
          | {itemCount} item{itemCount !== 1 ? "s" : ""}
        </Text>
        <Text style={styles.meta}>{order.contactNumber || "No contact"}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.total}>PHP {order.total.toFixed(2)}</Text>
        <Text style={styles.time}>{timeAgo}</Text>
      </View>
    </TouchableOpacity>
  );
}

function getTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  details: {
    marginBottom: 8,
  },
  customerName: {
    fontSize: 15,
    color: "#fff",
    marginBottom: 2,
  },
  meta: {
    fontSize: 13,
    color: "#999",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 8,
  },
  total: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4ADE80",
  },
  time: {
    fontSize: 12,
    color: "#666",
  },
});
