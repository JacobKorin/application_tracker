import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Application } from "../lib/api";
import { colors, statusColors } from "../theme";

const STATUS_OPTIONS = ["saved", "applied", "interview", "offer", "rejected"] as const;

type Props = {
  application: Application;
  onSave: (applicationId: string, update: Partial<Application>) => Promise<void>;
};

export function ApplicationRow({ application, onSave }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [location, setLocation] = useState(application.location ?? "");
  const [notes, setNotes] = useState((application.notes ?? []).join("\n"));
  const [status, setStatus] = useState(application.status);

  const latestStage = application.stage_history[application.stage_history.length - 1];
  const latestTimestamp = latestStage?.timestamp
    ? new Date(latestStage.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "No activity";

  async function saveDetails() {
    try {
      setSaving(true);
      await onSave(application.id, {
        status,
        location: location.trim() || null,
        notes: notes
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.card}>
      <Pressable onPress={() => setExpanded((current) => !current)} style={styles.summary}>
        <View style={styles.primaryColumn}>
          <Text style={styles.company}>{application.company}</Text>
          <Text numberOfLines={1} style={styles.title}>
            {application.title}
          </Text>
          <Text numberOfLines={1} style={styles.meta}>
            {application.location || "Location not set"}
          </Text>
        </View>
        <View style={styles.secondaryColumn}>
          <View style={[styles.statusPill, { backgroundColor: statusColors[application.status]?.bg ?? colors.chip }]}>
            <Text style={[styles.statusText, { color: statusColors[application.status]?.text ?? colors.text }]}>
              {application.status}
            </Text>
          </View>
          <Text style={styles.meta}>{latestTimestamp}</Text>
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.details}>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((option) => {
              const selected = status === option;
              const optionColors = statusColors[option];
              return (
                <Pressable
                  key={option}
                  onPress={() => setStatus(option)}
                  style={[
                    styles.statusOption,
                    selected && { backgroundColor: optionColors.bg, borderColor: optionColors.text },
                  ]}
                >
                  <Text style={[styles.statusOptionText, selected && { color: optionColors.text }]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              placeholder="Remote"
              placeholderTextColor={colors.mutedText}
              style={styles.input}
              value={location}
              onChangeText={setLocation}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              multiline
              numberOfLines={4}
              placeholder="One note per line"
              placeholderTextColor={colors.mutedText}
              style={[styles.input, styles.notesInput]}
              textAlignVertical="top"
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          <Pressable disabled={saving} onPress={() => void saveDetails()} style={styles.saveButton}>
            {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>Save</Text>}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    padding: 16,
  },
  primaryColumn: {
    flex: 1,
    gap: 3,
  },
  secondaryColumn: {
    alignItems: "flex-end",
    gap: 8,
  },
  company: {
    fontWeight: "700",
    fontSize: 16,
    color: colors.text,
  },
  title: {
    color: colors.text,
    fontSize: 14,
  },
  meta: {
    color: colors.mutedText,
    fontSize: 13,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    textTransform: "capitalize",
    fontWeight: "700",
    fontSize: 12,
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
    gap: 14,
    backgroundColor: colors.surfaceMuted,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  statusOptionText: {
    color: colors.mutedText,
    textTransform: "capitalize",
    fontWeight: "600",
    fontSize: 12,
  },
  field: {
    gap: 6,
  },
  label: {
    color: colors.text,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
  },
  notesInput: {
    minHeight: 96,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    paddingVertical: 13,
    borderRadius: 14,
  },
  saveText: {
    color: colors.white,
    fontWeight: "700",
  },
});
