import { ReactNode, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Application, Reminder, Task } from "../lib/api";
import { buildApplicationLabelMap, formatDateTime, partitionReminders, sortTasksForDisplay } from "../lib/execution";
import { colors } from "../theme";

type Props = {
  applications: Application[];
  reminders: Reminder[];
  tasks: Task[];
  errorMessage: string | null;
  infoMessage: string | null;
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
  onToggleTask: (taskId: string, completed: boolean) => Promise<void>;
};

export function ExecutionPane({
  applications,
  reminders,
  tasks,
  errorMessage,
  infoMessage,
  onCreateReminder,
  onCreateTask,
  onDeleteReminder,
  onDeleteTask,
  onToggleTask,
}: Props) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueAt, setTaskDueAt] = useState("");
  const [taskApplicationId, setTaskApplicationId] = useState<string | undefined>(undefined);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderScheduledFor, setReminderScheduledFor] = useState("");
  const [reminderApplicationId, setReminderApplicationId] = useState<string | undefined>(undefined);
  const [reminderTaskId, setReminderTaskId] = useState<string | undefined>(undefined);
  const [reminderChannel, setReminderChannel] = useState<"push" | "email">("push");
  const [reminderError, setReminderError] = useState<string | null>(null);

  const orderedTasks = useMemo(() => sortTasksForDisplay(tasks), [tasks]);
  const pendingTasks = orderedTasks.filter((task) => !task.completed);
  const completedTasks = orderedTasks.filter((task) => task.completed);
  const reminderGroups = useMemo(() => partitionReminders(reminders), [reminders]);
  const applicationLabels = useMemo(() => buildApplicationLabelMap(applications), [applications]);

  async function handleCreateTask() {
    if (!taskTitle.trim()) {
      setTaskError("Task title is required.");
      return;
    }

    try {
      setTaskError(null);
      await onCreateTask({
        title: taskTitle.trim(),
        application_id: taskApplicationId,
        due_at: taskDueAt.trim() || undefined,
      });
      setTaskTitle("");
      setTaskDueAt("");
      setTaskApplicationId(undefined);
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : "Unable to create task.");
    }
  }

  async function handleCreateReminder() {
    if (!reminderTitle.trim() || !reminderScheduledFor.trim()) {
      setReminderError("Reminder title and scheduled time are required.");
      return;
    }
    if (!reminderApplicationId && !reminderTaskId) {
      setReminderError("Pick an application or a task for the reminder.");
      return;
    }

    try {
      setReminderError(null);
      await onCreateReminder({
        title: reminderTitle.trim(),
        application_id: reminderApplicationId,
        task_id: reminderTaskId,
        scheduled_for: reminderScheduledFor.trim(),
        channel: reminderChannel,
      });
      setReminderTitle("");
      setReminderScheduledFor("");
      setReminderApplicationId(undefined);
      setReminderTaskId(undefined);
      setReminderChannel("push");
    } catch (error) {
      setReminderError(error instanceof Error ? error.message : "Unable to create reminder.");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.summaryRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Open tasks</Text>
          <Text style={styles.metricValue}>{pendingTasks.length}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Upcoming reminders</Text>
          <Text style={styles.metricValue}>{reminderGroups.upcoming.length}</Text>
        </View>
      </View>

      {infoMessage ? <Text style={styles.infoText}>{infoMessage}</Text> : null}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Add task</Text>
        <ComposerField label="Title" value={taskTitle} onChangeText={setTaskTitle} />
        <ComposerField
          label="Due at"
          hint="Use ISO like 2026-03-20T15:00:00+00:00"
          value={taskDueAt}
          onChangeText={setTaskDueAt}
        />
        <SelectionChips
          label="Linked application"
          emptyLabel="No linked application"
          selected={taskApplicationId}
          onSelect={setTaskApplicationId}
          options={applications.map((application) => ({
            value: application.id,
            label: application.company,
          }))}
        />
        {taskError ? <Text style={styles.errorText}>{taskError}</Text> : null}
        <Pressable onPress={() => void handleCreateTask()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Save task</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Add reminder</Text>
        <ComposerField label="Title" value={reminderTitle} onChangeText={setReminderTitle} />
        <ComposerField
          label="Scheduled for"
          hint="Use ISO like 2026-03-20T15:00:00+00:00"
          value={reminderScheduledFor}
          onChangeText={setReminderScheduledFor}
        />
        <SelectionChips
          label="Application"
          emptyLabel="No linked application"
          selected={reminderApplicationId}
          onSelect={(value) => {
            setReminderApplicationId(value);
            if (value) {
              setReminderTaskId(undefined);
            }
          }}
          options={applications.map((application) => ({
            value: application.id,
            label: application.company,
          }))}
        />
        <SelectionChips
          label="Task"
          emptyLabel="No linked task"
          selected={reminderTaskId}
          onSelect={setReminderTaskId}
          options={pendingTasks.map((task) => ({
            value: task.id,
            label: task.title,
          }))}
        />
        <SelectionChips
          label="Channel"
          selected={reminderChannel}
          onSelect={(value) => setReminderChannel((value as "push" | "email") ?? "push")}
          options={[
            { value: "push", label: "Push" },
            { value: "email", label: "Email" },
          ]}
        />
        {reminderError ? <Text style={styles.errorText}>{reminderError}</Text> : null}
        <Pressable onPress={() => void handleCreateReminder()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Save reminder</Text>
        </Pressable>
      </View>

      <SectionCard
        title="Pending tasks"
        emptyCopy="No pending tasks. Add your next follow-up above."
        items={pendingTasks.map((task) => (
          <View key={task.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>{task.title}</Text>
                <Text style={styles.itemMeta}>Due {formatDateTime(task.due_at)}</Text>
                {task.application_id ? (
                  <Text style={styles.itemMeta}>{applicationLabels.get(task.application_id) ?? "Linked application"}</Text>
                ) : null}
              </View>
              <View style={styles.itemActions}>
                <Pressable
                  onPress={() => void onToggleTask(task.id, true)}
                  style={[styles.actionButton, styles.secondaryButton]}
                >
                  <Text style={styles.secondaryButtonText}>Done</Text>
                </Pressable>
                <Pressable
                  onPress={() => void onDeleteTask(task.id)}
                  style={[styles.actionButton, styles.ghostButton]}
                >
                  <Text style={styles.ghostButtonText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      />

      <SectionCard
        title="Completed tasks"
        emptyCopy="Completed tasks will appear here."
        items={completedTasks.map((task) => (
          <View key={task.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>{task.title}</Text>
                <Text style={styles.itemMeta}>Completed</Text>
              </View>
              <Pressable
                onPress={() => void onToggleTask(task.id, false)}
                style={[styles.actionButton, styles.secondaryButton]}
              >
                <Text style={styles.secondaryButtonText}>Reopen</Text>
              </Pressable>
            </View>
          </View>
        ))}
      />

      <SectionCard
        title="Upcoming reminders"
        emptyCopy="No upcoming reminders yet."
        items={reminderGroups.upcoming.map((reminder) => (
          <View key={reminder.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>{reminder.title}</Text>
                <Text style={styles.itemMeta}>{formatDateTime(reminder.scheduled_for)}</Text>
                <Text style={styles.itemMeta}>
                  {reminder.task_id
                    ? "Linked to task"
                    : reminder.application_id
                      ? (applicationLabels.get(reminder.application_id) ?? "Linked application")
                      : reminder.channel}
                </Text>
              </View>
              <Pressable
                onPress={() => void onDeleteReminder(reminder.id)}
                style={[styles.actionButton, styles.ghostButton]}
              >
                <Text style={styles.ghostButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}
      />

      <SectionCard
        title="Past reminders"
        emptyCopy="Past reminders will appear here."
        items={reminderGroups.past.map((reminder) => (
          <View key={reminder.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>{reminder.title}</Text>
                <Text style={styles.itemMeta}>{formatDateTime(reminder.scheduled_for)}</Text>
              </View>
              <Pressable
                onPress={() => void onDeleteReminder(reminder.id)}
                style={[styles.actionButton, styles.ghostButton]}
              >
                <Text style={styles.ghostButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}
      />
    </ScrollView>
  );
}

function ComposerField({
  label,
  hint,
  value,
  onChangeText,
}: {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={hint}
        placeholderTextColor={colors.mutedText}
        style={styles.input}
        autoCapitalize="none"
      />
    </View>
  );
}

function SelectionChips({
  label,
  emptyLabel,
  selected,
  onSelect,
  options,
}: {
  label: string;
  emptyLabel?: string;
  selected?: string;
  onSelect: (value?: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {emptyLabel ? (
          <Chip label={emptyLabel} selected={!selected} onPress={() => onSelect(undefined)} />
        ) : null}
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={selected === option.value}
            onPress={() => onSelect(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

function Chip({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function SectionCard({
  title,
  emptyCopy,
  items,
}: {
  title: string;
  emptyCopy: string;
  items: ReactNode[];
}) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      <View style={styles.sectionList}>
        {items.length ? items : <Text style={styles.emptyCopy}>{emptyCopy}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
    backgroundColor: colors.background,
    paddingBottom: 32,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  metric: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 4,
  },
  metricLabel: {
    color: colors.mutedText,
    fontWeight: "600",
  },
  metricValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700",
  },
  panel: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    color: colors.text,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.text,
    fontSize: 15,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: colors.chip,
  },
  chipSelected: {
    backgroundColor: colors.accentSoft,
  },
  chipText: {
    color: colors.mutedText,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: colors.accent,
  },
  primaryButton: {
    borderRadius: 14,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 15,
  },
  sectionList: {
    gap: 10,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
    padding: 14,
  },
  itemHeader: {
    gap: 10,
  },
  itemText: {
    gap: 4,
  },
  itemTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 16,
  },
  itemMeta: {
    color: colors.mutedText,
    fontSize: 13,
  },
  itemActions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  actionButton: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: colors.accentSoft,
  },
  secondaryButtonText: {
    color: colors.accent,
    fontWeight: "700",
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  ghostButtonText: {
    color: colors.text,
    fontWeight: "600",
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  infoText: {
    color: colors.accent,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyCopy: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
});
