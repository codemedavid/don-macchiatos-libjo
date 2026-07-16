import { useState, useMemo } from "react";
import { View, FlatList, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { OrderCard } from "../../components/OrderCard";
import { AppText, Pill } from "../../components/ui";
import { colors, fonts, radius, spacing } from "../../lib/theme";
import { DateFilter, getDateRange } from "../../lib/format";

const FILTERS: { key: DateFilter; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "all", label: "All" },
];

export default function HistoryScreen() {
  const [filter, setFilter] = useState<DateFilter>("today");
  const [search, setSearch] = useState("");

  const { start, end } = getDateRange(filter);
  const orders = useQuery(api.orders.getCompletedOrders, {
    startTime: start,
    endTime: end,
  });

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.contactNumber.includes(q)
    );
  }, [orders, search]);

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

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pill
            key={f.key}
            label={f.label}
            active={filter === f.key}
            onPress={() => setFilter(f.key)}
          />
        ))}
      </View>

      {!orders ? (
        <View style={styles.center}>
          <AppText variant="muted">Loading…</AppText>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.center}>
          <AppText variant="muted">No orders found</AppText>
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
  filters: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    gap: spacing.sm,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
});
