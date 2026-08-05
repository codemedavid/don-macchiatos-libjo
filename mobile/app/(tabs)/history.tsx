import { useState, useMemo } from "react";
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { OrderCard } from "../../components/OrderCard";
import { AppText, Pill } from "../../components/ui";
import { colors, fonts, radius, spacing } from "../../lib/theme";
import { DateFilter } from "../../lib/format";
import { useDateRange } from "../../lib/useDateRange";
import {
  HISTORY_FILTERS,
  HistoryFilterKey,
  filterHistoryOrders,
  historyFilterCounts,
} from "../../lib/orderFilters";

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "all", label: "All time" },
];

export default function HistoryScreen() {
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [statusFilter, setStatusFilter] = useState<HistoryFilterKey>("all");
  const [search, setSearch] = useState("");

  const { start, end } = useDateRange(dateFilter);
  const orders = useQuery(api.orders.getCompletedOrders, {
    startTime: start,
    endTime: end,
  });

  // Counts describe the whole date window, so the chips still show what a
  // different status filter would reveal.
  const counts = useMemo(() => historyFilterCounts(orders ?? []), [orders]);

  const filteredOrders = useMemo(
    () =>
      filterHistoryOrders(orders ?? [], {
        status: statusFilter,
        search,
      }),
    [orders, statusFilter, search]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <AppText variant="display" style={styles.title}>
        History
      </AppText>

      <TextInput
        style={styles.searchInput}
        placeholder="Search by order #, name, or contact"
        placeholderTextColor={colors.textFaint}
        value={search}
        onChangeText={setSearch}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filters}
      >
        {DATE_FILTERS.map((f) => (
          <Pill
            key={f.key}
            label={f.label}
            active={dateFilter === f.key}
            onPress={() => setDateFilter(f.key)}
          />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.statusFilters}
      >
        {HISTORY_FILTERS.map((f) => (
          <Pill
            key={f.key}
            label={`${f.label} · ${counts[f.key]}`}
            active={statusFilter === f.key}
            onPress={() => setStatusFilter(f.key)}
          />
        ))}
      </ScrollView>

      {!orders ? (
        <View style={styles.center}>
          <AppText variant="muted">Loading…</AppText>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.center}>
          <AppText variant="muted">
            {counts.all === 0
              ? "No closed orders in this date range"
              : "No orders match this filter"}
          </AppText>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <OrderCard order={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screenBg },
  title: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  searchInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm + 4,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: fonts.body,
    color: colors.textPrimary,
  },
  // A horizontal ScrollView stretches to fill a flex column by default; pin it
  // to its content height so the list below keeps the remaining space.
  filtersScroll: { flexGrow: 0, flexShrink: 0 },
  filters: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 4,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  statusFilters: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm + 4,
    gap: spacing.sm,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
});
