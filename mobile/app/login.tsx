import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth, UserRole } from "../lib/auth";

export default function LoginScreen() {
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("staff");
  const { login } = useAuth();

  const VALID_PASSWORD = "DonMacchiatos2026@";

  const handleLogin = async () => {
    if (password !== VALID_PASSWORD) {
      Alert.alert("Invalid Password", "Please enter the correct password.");
      return;
    }
    await login(selectedRole);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Don Macchiatos</Text>
        <Text style={styles.subtitle}>Order Management</Text>

        <View style={styles.roleSelector}>
          <TouchableOpacity
            style={[
              styles.roleButton,
              selectedRole === "staff" && styles.roleButtonActive,
            ]}
            onPress={() => setSelectedRole("staff")}
          >
            <Text
              style={[
                styles.roleButtonText,
                selectedRole === "staff" && styles.roleButtonTextActive,
              ]}
            >
              Staff
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.roleButton,
              selectedRole === "owner" && styles.roleButtonActive,
            ]}
            onPress={() => setSelectedRole("owner")}
          >
            <Text
              style={[
                styles.roleButtonText,
                selectedRole === "owner" && styles.roleButtonTextActive,
              ]}
            >
              Owner
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Enter password"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginBottom: 40,
  },
  roleSelector: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#333",
    alignItems: "center",
  },
  roleButtonActive: {
    borderColor: "#fff",
    backgroundColor: "#fff",
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
  },
  roleButtonTextActive: {
    color: "#1a1a1a",
  },
  input: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#fff",
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
});
