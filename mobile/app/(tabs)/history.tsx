import { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { OrderCard } from "../../components/OrderCard";

type DateFilter = "today" | "week" | "month" | "all";

function getDateRange(filter: DateFilter): { start: number; end: number } {
  const now = new Date();
  const end = now.getTime();
  let start: number;

  switch (filter) {
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
    case "all":
    default:
      start = 0;
      break;
  }

  return { start, end };
}

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
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search orders..."
        placeholderTextColor="#666"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filters}>
        {(["today", "week", "month", "all"] as DateFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f === "all"
                ? "All"
                : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!orders ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No orders found</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  searchInput: {
    backgroundColor: "#2a2a2a",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#fff",
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#444",
  },
  filterActive: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  filterText: {
    fontSize: 13,
    color: "#999",
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#1a1a1a",
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
    color: "#666",
    fontSize: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
});
