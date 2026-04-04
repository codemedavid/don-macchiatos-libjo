import { Redirect } from "expo-router";
import { useAuth } from "../lib/auth";

export default function Index() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/orders" />;
  }

  return <Redirect href="/login" />;
}
