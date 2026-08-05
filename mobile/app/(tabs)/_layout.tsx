import { Tabs } from "expo-router";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth";
import { colors, fonts } from "../../lib/theme";

// Options live at module scope so the navigator gets stable references and
// does not re-derive its screen config on every render.
const SCREEN_OPTIONS: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarStyle: {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
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
};

const renderOrdersIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="receipt-outline" size={size} color={color} />
);

const renderHistoryIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="time-outline" size={size} color={color} />
);

const renderSalesIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="bar-chart-outline" size={size} color={color} />
);

const HISTORY_OPTIONS: BottomTabNavigationOptions = {
  title: "History",
  tabBarIcon: renderHistoryIcon,
};

const ORDERS_OPTIONS: BottomTabNavigationOptions = {
  title: "Orders",
  tabBarIcon: renderOrdersIcon,
};

const SALES_OPTIONS: BottomTabNavigationOptions = {
  title: "Sales",
  tabBarIcon: renderSalesIcon,
};

export default function TabLayout() {
  const { role } = useAuth();

  return (
    <Tabs screenOptions={SCREEN_OPTIONS}>
      <Tabs.Screen name="orders" options={ORDERS_OPTIONS} />
      <Tabs.Screen name="history" options={HISTORY_OPTIONS} />
      {/*
        `Protected` drops the route from the navigator entirely for non-owners.
        The previous `href: null` approach kept the screen registered and made
        expo-router swap in a custom `tabBarButton` that renders a <Link> around
        a <Pressable> on native only — a path this layout does not need.
      */}
      <Tabs.Protected guard={role === "owner"}>
        <Tabs.Screen name="sales" options={SALES_OPTIONS} />
      </Tabs.Protected>
    </Tabs>
  );
}
