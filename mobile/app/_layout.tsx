import { useEffect, useRef, useState } from "react";
import { Slot, useRouter } from "expo-router";
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
