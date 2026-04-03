import { createContext, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_KEY = "donmac_auth";

export type UserRole = "staff" | "owner";

export interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
}

export async function saveAuth(role: UserRole): Promise<void> {
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ role }));
}

export async function loadAuth(): Promise<{ role: UserRole } | null> {
  const data = await AsyncStorage.getItem(AUTH_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_KEY);
}

export interface AuthContextType {
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  role: null,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);
