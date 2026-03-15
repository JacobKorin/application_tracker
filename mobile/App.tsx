import { StatusBar } from "expo-status-bar";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { PipelineCard } from "./src/components/pipeline-card";
import { RemindersCard } from "./src/components/reminders-card";
import { mockApplications, mockReminders } from "./src/screens/mock-data";

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Mobile MVP</Text>
          <Text style={styles.title}>Track every role without losing the thread.</Text>
          <Text style={styles.description}>
            This Expo starter mirrors the web dashboard and is ready for auth, push registration,
            and API wiring in the next iteration.
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Open pipeline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Notification settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        <PipelineCard applications={mockApplications} />
        <RemindersCard reminders={mockReminders} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f2ea",
  },
  container: {
    padding: 20,
    gap: 18,
  },
  hero: {
    backgroundColor: "#fffaf2",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#4e3420",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  kicker: {
    color: "#2364aa",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 12,
    marginBottom: 8,
  },
  title: {
    color: "#1f1d1a",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
  },
  description: {
    color: "#6a6258",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
  },
  primaryButton: {
    backgroundColor: "#ff6b35",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  secondaryButton: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(31,29,26,0.15)",
  },
  secondaryButtonText: {
    color: "#1f1d1a",
    fontWeight: "600",
  },
});

