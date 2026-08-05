import { useState } from "react";
import {
  View,
  TextInput,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, UserRole } from "../lib/auth";
import { AppText, Button, Pill } from "../components/ui";
import { colors, fonts, radius, spacing } from "../lib/theme";

const VALID_PASSWORD = "DonMacchiatos2026@";

export default function LoginScreen() {
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("staff");
  const { login } = useAuth();

  const handleLogin = async () => {
    if (password !== VALID_PASSWORD) {
      Alert.alert("Invalid Password", "Please enter the correct password.");
      return;
    }
    await login(selectedRole);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.inner}>
          <AppText variant="display" style={styles.title}>
            Don Macchiatos
          </AppText>
          <AppText variant="muted" style={styles.subtitle}>
            Order Management
          </AppText>

          <View style={styles.roleSelector}>
            <Pill
              label="Staff"
              active={selectedRole === "staff"}
              onPress={() => setSelectedRole("staff")}
              style={styles.rolePill}
            />
            <Pill
              label="Owner"
              active={selectedRole === "owner"}
              onPress={() => setSelectedRole("owner")}
              style={styles.rolePill}
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor={colors.textFaint}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />

          <Button label="Login" onPress={handleLogin} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screenBg },
  flex: { flex: 1 },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  title: { fontSize: 34, textAlign: "center", marginBottom: 4 },
  subtitle: { textAlign: "center", marginBottom: spacing.xl + 8 },
  roleSelector: {
    flexDirection: "row",
    marginBottom: spacing.lg,
    gap: spacing.sm + 4,
  },
  rolePill: { flex: 1, alignItems: "center", paddingVertical: 14 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
});
