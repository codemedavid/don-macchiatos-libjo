import { useEffect, useMemo, useRef, useState } from "react";
import { Slot, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { ConvexClientProvider } from "../lib/convex";
import { fontMap } from "../lib/fonts";
import { colors } from "../lib/theme";
import {
  AuthContext,
  AuthContextType,
  UserRole,
  loadAuth,
  saveAuth,
  clearAuth,
} from "../lib/auth";
import { addNotificationResponseListener } from "../lib/notifications";

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fontsLoaded] = useFonts(fontMap);
  const router = useRouter();
  const prevAuthRef = useRef<boolean | null>(null);

  useEffect(() => {
    loadAuth().then((data) => {
      if (data) {
        setIsAuthenticated(true);
        setRole(data.role);
      }
      setIsLoading(false);
    });
  }, []);

  // Only redirect when auth state actually changes (login/logout)
  useEffect(() => {
    if (isLoading) return;

    // Skip the initial load — index.tsx handles that redirect
    if (prevAuthRef.current === null) {
      prevAuthRef.current = isAuthenticated;
      return;
    }

    // Only act if auth state changed from previous value
    if (isAuthenticated !== prevAuthRef.current) {
      prevAuthRef.current = isAuthenticated;
      if (isAuthenticated) {
        router.replace("/(tabs)/orders");
      } else {
        router.replace("/login");
      }
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    const subscription = addNotificationResponseListener((orderId) => {
      router.push(`/order/${orderId}`);
    });
    return () => subscription.remove();
  }, [router]);

  // Stable identity: a fresh context value on every render re-renders every
  // consumer, including the tab navigator layout.
  const authContext: AuthContextType = useMemo(
    () => ({
      isAuthenticated,
      role,
      login: async (selectedRole: UserRole) => {
        await saveAuth(selectedRole);
        setRole(selectedRole);
        setIsAuthenticated(true);
      },
      logout: async () => {
        await clearAuth();
        setRole(null);
        setIsAuthenticated(false);
      },
    }),
    [isAuthenticated, role]
  );

  if (isLoading || !fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ConvexClientProvider>
        <AuthContext.Provider value={authContext}>
          <StatusBar style="dark" backgroundColor={colors.screenBg} />
          <Slot />
        </AuthContext.Provider>
      </ConvexClientProvider>
    </SafeAreaProvider>
  );
}
