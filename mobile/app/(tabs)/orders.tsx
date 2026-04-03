import { useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { OrderCard } from "../../components/OrderCard";
import {
  registerForPushNotifications,
  playNewOrderSound,
} from "../../lib/notifications";
import { useAuth } from "../../lib/auth";

export default function OrdersScreen() {
  const orders = useQuery(api.orders.getActiveOrders);
  const registerToken = useMutation(api.notifications.registerPushToken);
  const { role, logout } = useAuth();
  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    (async () => {
      const token = await registerForPushNotifications();
      if (token && role) {
        await registerToken({ token, role });
      }
    })();
  }, [role]);

  useEffect(() => {
    if (!orders) return;

    const currentIds = new Set(orders.map((o) => o._id));

    if (isInitialLoadRef.current) {
      prevOrderIdsRef.current = currentIds;
      isInitialLoadRef.current = false;
      return;
    }

    for (const id of currentIds) {
      if (!prevOrderIdsRef.current.has(id)) {
        playNewOrderSound();
        break;
      }
    }

    prevOrderIdsRef.current = currentIds;
  }, [orders]);

  const pendingCount =
    orders?.filter((o) => o.status === "pending").length ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Active Orders</Text>
          {pendingCount > 0 && (
            <Text style={styles.pendingBadge}>
              {pendingCount} pending
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {!orders ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No active orders</Text>
          <Text style={styles.emptySubtext}>
            New orders will appear here in real-time
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <OrderCard order={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  pendingBadge: {
    fontSize: 14,
    color: "#F59E0B",
    fontWeight: "600",
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  logoutText: {
    color: "#999",
    fontSize: 14,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#999",
    fontSize: 16,
  },
  emptyText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtext: {
    color: "#666",
    fontSize: 14,
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
});
