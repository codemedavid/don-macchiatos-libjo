import { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SalesSummaryCard } from "../../components/SalesSummaryCard";

type Period = "today" | "week" | "month";

function getPeriodRange(period: Period): { start: number; end: number } {
  const now = new Date();
  const end = now.getTime();
  let start: number;

  switch (period) {
    case "today":
      start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).getTime();
      break;
    case "week":
      start = end - 7 * 24 * 60 * 60 * 1000;
      break;
    case "month":
      start = end - 30 * 24 * 60 * 60 * 1000;
      break;
  }

  return { start, end };
}

export default function SalesScreen() {
  const [period, setPeriod] = useState<Period>("today");
  const { start, end } = getPeriodRange(period);

  const orders = useQuery(api.orders.getOrdersByDateRange, {
    startTime: start,
    endTime: end,
  });

  const stats = useMemo(() => {
    if (!orders) return null;

    const completed = orders.filter((o) => o.status === "completed");
    const totalRevenue = completed.reduce((sum, o) => sum + o.total, 0);
    const orderCount = completed.length;
    const allCount = orders.length;

    const byService: Record<string, { count: number; revenue: number }> = {};
    for (const o of completed) {
      if (!byService[o.serviceType]) {
        byService[o.serviceType] = { count: 0, revenue: 0 };
      }
      byService[o.serviceType].count++;
      byService[o.serviceType].revenue += o.total;
    }

    const byPayment: Record<string, { count: number; revenue: number }> = {};
    for (const o of completed) {
      if (!byPayment[o.paymentMethod]) {
        byPayment[o.paymentMethod] = { count: 0, revenue: 0 };
      }
      byPayment[o.paymentMethod].count++;
      byPayment[o.paymentMethod].revenue += o.total;
    }

    const cancelledCount = orders.filter(
      (o) => o.status === "cancelled"
    ).length;

    return {
      totalRevenue,
      orderCount,
      allCount,
      cancelledCount,
      byService,
      byPayment,
    };
  }, [orders]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Sales Summary</Text>

      <View style={styles.periodSelector}>
        {(["today", "week", "month"] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodButton, period === p && styles.periodActive]}
            onPress={() => setPeriod(p)}
          >
            <Text
              style={[
                styles.periodText,
                period === p && styles.periodTextActive,
              ]}
            >
              {p === "today"
                ? "Today"
                : p === "week"
                  ? "This Week"
                  : "This Month"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!stats ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
          <View style={styles.statsRow}>
            <SalesSummaryCard
              title="Revenue"
              value={`PHP ${stats.totalRevenue.toFixed(2)}`}
              subtitle={`${stats.orderCount} completed orders`}
            />
          </View>
          <View style={styles.statsRow}>
            <SalesSummaryCard
              title="Total Orders"
              value={stats.allCount.toString()}
              color="#60A5FA"
            />
            <SalesSummaryCard
              title="Cancelled"
              value={stats.cancelledCount.toString()}
              color="#EF4444"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>By Service Type</Text>
            {Object.entries(stats.byService).map(([type, data]) => (
              <View key={type} style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
                <View style={styles.breakdownValues}>
                  <Text style={styles.breakdownCount}>
                    {data.count} orders
                  </Text>
                  <Text style={styles.breakdownRevenue}>
                    PHP {data.revenue.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
            {Object.keys(stats.byService).length === 0 && (
              <Text style={styles.emptyText}>No completed orders yet</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>By Payment Method</Text>
            {Object.entries(stats.byPayment).map(([method, data]) => (
              <View key={method} style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>
                  {method.toUpperCase()}
                </Text>
                <View style={styles.breakdownValues}>
                  <Text style={styles.breakdownCount}>
                    {data.count} orders
                  </Text>
                  <Text style={styles.breakdownRevenue}>
                    PHP {data.revenue.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
            {Object.keys(stats.byPayment).length === 0 && (
              <Text style={styles.emptyText}>No completed orders yet</Text>
            )}
          </View>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  periodSelector: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#444",
    alignItems: "center",
  },
  periodActive: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  periodText: {
    fontSize: 13,
    color: "#999",
    fontWeight: "600",
  },
  periodTextActive: {
    color: "#1a1a1a",
  },
  center: {
    paddingTop: 60,
    alignItems: "center",
  },
  loadingText: {
    color: "#999",
    fontSize: 16,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
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
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  breakdownLabel: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "500",
  },
  breakdownValues: {
    alignItems: "flex-end",
  },
  breakdownCount: {
    fontSize: 13,
    color: "#999",
  },
  breakdownRevenue: {
    fontSize: 15,
    color: "#4ADE80",
    fontWeight: "600",
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 12,
  },
});
