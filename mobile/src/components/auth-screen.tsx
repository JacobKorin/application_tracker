import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors } from "../theme";

type AuthMode = "sign_in" | "sign_up";

type Props = {
  errorMessage: string | null;
  infoMessage: string | null;
  loading: boolean;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (name: string, email: string, password: string) => Promise<void>;
};

export function AuthScreen({ errorMessage, infoMessage, loading, onSignIn, onSignUp }: Props) {
  const [mode, setMode] = useState<AuthMode>("sign_in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!email.trim() || !password.trim() || (mode === "sign_up" && !name.trim())) {
      setLocalError("Please complete the required fields.");
      return;
    }

    setLocalError(null);
    if (mode === "sign_in") {
      await onSignIn(email.trim(), password);
      return;
    }

    await onSignUp(name.trim(), email.trim(), password);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.safe}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.kicker}>Job tracker</Text>
          <Text style={styles.title}>Keep your search calm, current, and easy to scan.</Text>
          <Text style={styles.subtitle}>
            Mobile stays focused on the essentials: sign in, scan your pipeline, update stages, and add the next role.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.segmentedControl}>
            <Pressable
              onPress={() => setMode("sign_in")}
              style={[styles.segment, mode === "sign_in" && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, mode === "sign_in" && styles.segmentTextActive]}>Sign in</Text>
            </Pressable>
            <Pressable
              onPress={() => setMode("sign_up")}
              style={[styles.segment, mode === "sign_up" && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, mode === "sign_up" && styles.segmentTextActive]}>Create account</Text>
            </Pressable>
          </View>

          {mode === "sign_up" ? (
            <LabeledInput label="Name" value={name} onChangeText={setName} placeholder="Jamie Doe" />
          ) : null}
          <LabeledInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
          />
          <LabeledInput
            autoCapitalize="none"
            autoComplete={mode === "sign_up" ? "new-password" : "password"}
            label="Password"
            placeholder={mode === "sign_up" ? "Create a password" : "Your password"}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {localError ? <Banner tone="error" message={localError} /> : null}
          {errorMessage ? <Banner tone="error" message={errorMessage} /> : null}
          {infoMessage ? <Banner tone="info" message={infoMessage} /> : null}

          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={() => {
              void handleSubmit();
            }}
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitText}>{mode === "sign_in" ? "Sign in" : "Create account"}</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function LabeledInput({
  label,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?:
    | "email"
    | "name"
    | "new-password"
    | "password"
    | "username"
    | "off";
  keyboardType?: "default" | "email-address";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.mutedText} style={styles.input} {...props} />
    </View>
  );
}

function Banner({ tone, message }: { tone: "error" | "info"; message: string }) {
  return (
    <View style={[styles.banner, tone === "error" ? styles.bannerError : styles.bannerInfo]}>
      <Text style={[styles.bannerText, tone === "error" ? styles.bannerTextError : styles.bannerTextInfo]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 20,
    gap: 18,
    justifyContent: "center",
    flexGrow: 1,
  },
  hero: {
    gap: 10,
  },
  kicker: {
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: colors.surfaceMuted,
    padding: 4,
    borderRadius: 14,
    gap: 6,
  },
  segment: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: colors.white,
  },
  segmentText: {
    color: colors.mutedText,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: colors.text,
  },
  field: {
    gap: 6,
  },
  label: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.text,
    fontSize: 16,
  },
  submitButton: {
    marginTop: 4,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
  banner: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bannerError: {
    backgroundColor: colors.dangerSoft,
  },
  bannerInfo: {
    backgroundColor: colors.accentSoft,
  },
  bannerText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bannerTextError: {
    color: colors.danger,
  },
  bannerTextInfo: {
    color: colors.accent,
  },
});
