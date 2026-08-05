import { useEffect, useMemo, useRef } from "react";
import { View, SectionList, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "convex/react";
import * as Haptics from "expo-haptics";
import { api } from "../../../convex/_generated/api";
import { OrderCard } from "../../components/OrderCard";
import { AppText } from "../../components/ui";
import { colors, fonts, spacing } from "../../lib/theme";
import {
  registerForPushNotifications,
  playNewOrderSound,
} from "../../lib/notifications";
import { useAuth } from "../../lib/auth";
import { buildActiveSections } from "../../lib/orderFilters";

interface ActiveOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  contactNumber: string;
  serviceType: string;
  total: number;
  status: string;
  items: { name: string; quantity: number }[];
  createdAt: number;
}

export default function OrdersScreen() {
  const orders = useQuery(api.orders.getActiveOrders) as
    | ActiveOrder[]
    | undefined;
  const registerToken = useMutation(api.notifications.registerPushToken);
  const { role, logout } = useAuth();
  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    let isCancelled = false;

    (async () => {
      try {
        const token = await registerForPushNotifications();
        if (isCancelled || !token || !role) return;
        await registerToken({ token, role });
      } catch (error) {
        // Push is a convenience here — orders still arrive over the live query,
        // so a failed registration must not take the screen down.
        console.warn("Failed to register for push notifications:", error);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [role, registerToken]);

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
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        ).catch(() => {});
        break;
      }
    }

    prevOrderIdsRef.current = currentIds;
  }, [orders]);

  const pendingCount =
    orders?.filter((o) => o.status === "pending").length ?? 0;
  const sections = useMemo(() => buildActiveSections(orders ?? []), [orders]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <View>
          <AppText variant="display">Active Orders</AppText>
          <AppText variant="muted" style={styles.pendingBadge}>
            {pendingCount > 0
              ? `${pendingCount} pending`
              : "All caught up"}
          </AppText>
        </View>
        <Pressable
          onPress={logout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutPressed,
          ]}
        >
          <AppText variant="muted" style={styles.logoutText}>
            Logout
          </AppText>
        </Pressable>
      </View>

      {!orders ? (
        <View style={styles.center}>
          <AppText variant="muted">Loading orders…</AppText>
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.center}>
          <AppText variant="title" style={styles.emptyTitle}>
            No active orders
          </AppText>
          <AppText variant="muted" style={styles.emptySubtext}>
            New orders appear here in real time
          </AppText>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <OrderCard order={item} />}
          renderSectionHeader={({ section }) => (
            <AppText variant="label" style={styles.sectionHeader}>
              {section.title} · {section.data.length}
            </AppText>
          )}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screenBg },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  pendingBadge: { color: colors.warning, marginTop: 2, fontFamily: fonts.bodyMedium },
  logoutButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  logoutPressed: { opacity: 0.7 },
  logoutText: { color: colors.textSecondary },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyTitle: { marginBottom: 4 },
  emptySubtext: {},
  sectionHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
});
