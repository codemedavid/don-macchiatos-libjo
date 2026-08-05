import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  SectionList,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "convex/react";
import * as Haptics from "expo-haptics";
import { api } from "../../../convex/_generated/api";
import { OrderCard } from "../../components/OrderCard";
import { AppText, Pill } from "../../components/ui";
import { colors, fonts, spacing } from "../../lib/theme";
import {
  registerForPushNotifications,
  playNewOrderSound,
} from "../../lib/notifications";
import { useAuth } from "../../lib/auth";
import {
  ACTIVE_FILTERS,
  ActiveFilterKey,
  activeFilterCounts,
  buildActiveSections,
} from "../../lib/orderFilters";

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
  const [filter, setFilter] = useState<ActiveFilterKey>("all");
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

  const counts = useMemo(() => activeFilterCounts(orders ?? []), [orders]);
  const sections = useMemo(
    () => buildActiveSections(orders ?? [], filter),
    [orders, filter]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <View>
          <AppText variant="display">Active Orders</AppText>
          <AppText variant="muted" style={styles.pendingBadge}>
            {counts.new > 0 ? `${counts.new} pending` : "All caught up"}
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filters}
      >
        {ACTIVE_FILTERS.map((f) => (
          <Pill
            key={f.key}
            label={`${f.label} · ${counts[f.key]}`}
            active={filter === f.key}
            onPress={() => setFilter(f.key)}
          />
        ))}
      </ScrollView>

      {!orders ? (
        <View style={styles.center}>
          <AppText variant="muted">Loading orders…</AppText>
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.center}>
          <AppText variant="title" style={styles.emptyTitle}>
            {counts.all === 0 ? "No active orders" : "Nothing in this filter"}
          </AppText>
          <AppText variant="muted" style={styles.emptySubtext}>
            {counts.all === 0
              ? "New orders appear here in real time"
              : `${counts.all} active order${
                  counts.all === 1 ? "" : "s"
                } under “All”`}
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
  // A horizontal ScrollView stretches to fill a flex column by default; pin it
  // to its content height so the list below keeps the remaining space.
  filtersScroll: { flexGrow: 0, flexShrink: 0 },
  filters: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm + 4,
    gap: spacing.sm,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyTitle: { marginBottom: 4 },
  emptySubtext: {},
  sectionHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
});
