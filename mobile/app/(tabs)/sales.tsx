import { useState, useMemo } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SalesSummaryCard } from "../../components/SalesSummaryCard";
import { Card, AppText, Pill } from "../../components/ui";
import { colors, spacing } from "../../lib/theme";
import { formatCurrency, getDateRange, DateFilter } from "../../lib/format";
import { computeSalesStats, SalesOrder } from "../../lib/sales";

type Period = Extract<DateFilter, "today" | "week" | "month">;

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];

export default function SalesScreen() {
  const [period, setPeriod] = useState<Period>("today");
  const { start, end } = getDateRange(period);

  const orders = useQuery(api.orders.getOrdersByDateRange, {
    startTime: start,
    endTime: end,
  }) as SalesOrder[] | undefined;

  const stats = useMemo(
    () => (orders ? computeSalesStats(orders) : null),
    [orders]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppText variant="display" style={styles.title}>
          Sales
        </AppText>

        <View style={styles.periodSelector}>
          {PERIODS.map((p) => (
            <Pill
              key={p.key}
              label={p.label}
              active={period === p.key}
              onPress={() => setPeriod(p.key)}
              style={styles.periodPill}
            />
          ))}
        </View>

        {!stats ? (
          <View style={styles.center}>
            <AppText variant="muted">Loading…</AppText>
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <SalesSummaryCard
                title="Revenue"
                value={formatCurrency(stats.totalRevenue)}
                subtitle={`${stats.orderCount} completed`}
              />
            </View>
            <View style={styles.statsRow}>
              <SalesSummaryCard
                title="Avg Order"
                value={formatCurrency(stats.averageOrderValue)}
              />
              <SalesSummaryCard
                title="Cancelled"
                value={stats.cancelledCount.toString()}
                color={colors.danger}
              />
            </View>

            <Breakdown title="By Service Type" data={stats.byService} />
            <Breakdown title="By Payment Method" data={stats.byPayment} upper />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Breakdown({
  title,
  data,
  upper = false,
}: {
  title: string;
  data: Record<string, { count: number; revenue: number }>;
  upper?: boolean;
}) {
  const entries = Object.entries(data);
  return (
    <Card style={styles.section}>
      <AppText variant="label" style={styles.sectionTitle}>
        {title}
      </AppText>
      {entries.length === 0 ? (
        <AppText variant="muted" style={styles.emptyText}>
          No completed orders yet
        </AppText>
      ) : (
        entries.map(([label, d]) => (
          <View key={label} style={styles.breakdownRow}>
            <AppText variant="body" style={styles.breakdownLabel}>
              {upper
                ? label.toUpperCase()
                : label.charAt(0).toUpperCase() + label.slice(1)}
            </AppText>
            <View style={styles.breakdownValues}>
              <AppText variant="muted">{d.count} orders</AppText>
              <AppText variant="price" style={styles.breakdownRevenue}>
                {formatCurrency(d.revenue)}
              </AppText>
            </View>
          </View>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { paddingBottom: spacing.xl },
  title: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  periodSelector: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    gap: spacing.sm,
  },
  periodPill: { flex: 1, alignItems: "center" },
  center: { paddingTop: 60, alignItems: "center" },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm + 4,
    gap: spacing.sm + 4,
  },
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm + 4,
  },
  sectionTitle: { marginBottom: spacing.sm + 4 },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  breakdownLabel: { color: colors.textPrimary },
  breakdownValues: { alignItems: "flex-end" },
  breakdownRevenue: { fontSize: 15 },
  emptyText: { textAlign: "center", paddingVertical: spacing.sm + 4 },
});
