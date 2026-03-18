import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Application, CurrentUser, Reminder, Task } from "../lib/api";
import { colors } from "../theme";
import { ApplicationsScreen } from "./applications-screen";
import { ExecutionPane } from "./execution-pane";

type WorkspaceTab = "applications" | "tasks";

type Props = {
  applications: Application[];
  currentUser: CurrentUser["user"];
  errorMessage: string | null;
  infoMessage: string | null;
  loading: boolean;
  reminders: Reminder[];
  tasks: Task[];
  onCreateApplication: (input: {
    company: string;
    title: string;
    location?: string;
    notes?: string[];
  }) => Promise<void>;
  onCreateReminder: (input: {
    title: string;
    application_id?: string;
    task_id?: string;
    scheduled_for: string;
    channel: string;
  }) => Promise<void>;
  onCreateTask: (input: { title: string; application_id?: string; due_at?: string }) => Promise<void>;
  onDeleteReminder: (reminderId: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onRefreshApplications: (filters?: { q?: string; status?: string; sort?: string }) => Promise<void>;
  onSignOut: () => void;
  onToggleTask: (taskId: string, completed: boolean) => Promise<void>;
  onUpdateApplication: (applicationId: string, update: Partial<Application>) => Promise<void>;
};

export function WorkspaceScreen({
  applications,
  currentUser,
  errorMessage,
  infoMessage,
  loading,
  reminders,
  tasks,
  onCreateApplication,
  onCreateReminder,
  onCreateTask,
  onDeleteReminder,
  onDeleteTask,
  onRefreshApplications,
  onSignOut,
  onToggleTask,
  onUpdateApplication,
}: Props) {
  const [tab, setTab] = useState<WorkspaceTab>("applications");

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>Live workspace</Text>
          <Text style={styles.title}>Job tracker</Text>
          <Text style={styles.subtitle}>Signed in as {currentUser.name}</Text>
        </View>
        <Pressable onPress={onSignOut} style={styles.ghostButton}>
          <Text style={styles.ghostButtonText}>Sign out</Text>
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        <TabButton
          label="Applications"
          selected={tab === "applications"}
          onPress={() => setTab("applications")}
        />
        <TabButton
          label="Tasks & reminders"
          selected={tab === "tasks"}
          onPress={() => setTab("tasks")}
        />
      </View>

      {tab === "applications" ? (
        <ApplicationsScreen
          applications={applications}
          errorMessage={errorMessage}
          infoMessage={infoMessage}
          loading={loading}
          onCreateApplication={onCreateApplication}
          onRefresh={onRefreshApplications}
          onUpdateApplication={onUpdateApplication}
        />
      ) : (
        <ExecutionPane
          applications={applications}
          reminders={reminders}
          tasks={tasks}
          errorMessage={errorMessage}
          infoMessage={infoMessage}
          onCreateReminder={onCreateReminder}
          onCreateTask={onCreateTask}
          onDeleteReminder={onDeleteReminder}
          onDeleteTask={onDeleteTask}
          onToggleTask={onToggleTask}
        />
      )}
    </View>
  );
}

function TabButton({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tabButton, selected && styles.tabButtonSelected]}>
      <Text style={[styles.tabButtonText, selected && styles.tabButtonTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  kicker: {
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 14,
  },
  ghostButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  ghostButtonText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 14,
  },
  tabRow: {
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 10,
    paddingBottom: 8,
  },
  tabButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    backgroundColor: colors.chip,
    alignItems: "center",
  },
  tabButtonSelected: {
    backgroundColor: colors.accentSoft,
  },
  tabButtonText: {
    color: colors.mutedText,
    fontWeight: "700",
  },
  tabButtonTextSelected: {
    color: colors.accent,
  },
});
