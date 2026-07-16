import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/auth";
import { colors, fonts } from "../../lib/theme";

export default function TabLayout() {
  const { role } = useAuth();
  const orders = useQuery(api.orders.getActiveOrders);
  const pendingCount = orders?.filter((o) => o.status === "pending").length ?? 0;

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textFaint,
        headerStyle: { backgroundColor: colors.screenBg },
        headerTitleStyle: {
          fontFamily: fonts.headline,
          color: colors.textPrimary,
        },
        headerShadowVisible: false,
        headerTintColor: colors.textPrimary,
      }}
    >
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          headerShown: false,
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.primary,
            color: colors.onPrimary,
            fontFamily: fonts.bodySemiBold,
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: "Sales",
          headerShown: false,
          href: role === "owner" ? "/(tabs)/sales" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
