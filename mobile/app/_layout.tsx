import { useEffect, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ConvexClientProvider } from "../lib/convex";
import {
  AuthContext,
  AuthContextType,
  UserRole,
  loadAuth,
  saveAuth,
  clearAuth,
} from "../lib/auth";

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadAuth().then((data) => {
      if (data) {
        setIsAuthenticated(true);
        setRole(data.role);
      }
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "login";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)/orders");
    }
  }, [isAuthenticated, segments, isLoading]);

  const authContext: AuthContextType = {
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
  };

  if (isLoading) return null;

  return (
    <ConvexClientProvider>
      <AuthContext.Provider value={authContext}>
        <StatusBar style="light" />
        <Slot />
      </AuthContext.Provider>
    </ConvexClientProvider>
  );
}
