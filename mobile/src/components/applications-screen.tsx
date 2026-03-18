import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Application } from "../lib/api";
import { colors } from "../theme";
import { ApplicationRow } from "./application-row";

const FILTER_OPTIONS = ["all", "saved", "applied", "interview", "offer", "rejected"] as const;
const SORT_OPTIONS = [
  { label: "Newest", value: "updated_desc" },
  { label: "Oldest", value: "updated_asc" },
  { label: "Company A-Z", value: "company_asc" },
  { label: "Company Z-A", value: "company_desc" },
] as const;

type Props = {
  applications: Application[];
  errorMessage: string | null;
  infoMessage: string | null;
  loading: boolean;
  onCreateApplication: (input: {
    company: string;
    title: string;
    location?: string;
    notes?: string[];
  }) => Promise<void>;
  onRefresh: (filters?: { q?: string; status?: string; sort?: string }) => Promise<void>;
  onUpdateApplication: (applicationId: string, update: Partial<Application>) => Promise<void>;
};

export function ApplicationsScreen({
  applications,
  errorMessage,
  infoMessage,
  loading,
  onCreateApplication,
  onRefresh,
  onUpdateApplication,
}: Props) {
  const [queryDraft, setQueryDraft] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [sort, setSort] = useState<string>("updated_desc");
  const [showFilters, setShowFilters] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [composerCompany, setComposerCompany] = useState("");
  const [composerTitle, setComposerTitle] = useState("");
  const [composerLocation, setComposerLocation] = useState("");
  const [composerNotes, setComposerNotes] = useState("");
  const [composerBusy, setComposerBusy] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  useEffect(() => {
    void onRefresh({ q: query, status, sort });
  }, [query, status, sort]);

  async function handleCreate() {
    if (!composerCompany.trim() || !composerTitle.trim()) {
      setComposerError("Company and role are required.");
      return;
    }

    try {
      setComposerBusy(true);
      setComposerError(null);
      await onCreateApplication({
        company: composerCompany.trim(),
        title: composerTitle.trim(),
        location: composerLocation.trim() || undefined,
        notes: composerNotes
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean),
      });
      setComposerCompany("");
      setComposerTitle("");
      setComposerLocation("");
      setComposerNotes("");
      setShowComposer(false);
    } catch (error) {
      setComposerError(error instanceof Error ? error.message : "Unable to create application.");
    } finally {
      setComposerBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerText}>
        <Text style={styles.kicker}>Applications</Text>
        <Text style={styles.title}>Your pipeline</Text>
        <Text style={styles.subtitle}>Search, filter, and keep your active roles moving.</Text>
      </View>

      <View style={styles.toolbar}>
        <TextInput
          placeholder="Search company or role"
          placeholderTextColor={colors.mutedText}
          style={styles.searchInput}
          value={queryDraft}
          onChangeText={setQueryDraft}
          onSubmitEditing={() => setQuery(queryDraft.trim())}
          returnKeyType="search"
        />
        <Pressable onPress={() => setQuery(queryDraft.trim())} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Search</Text>
        </Pressable>
        <Pressable onPress={() => setShowFilters((current) => !current)} style={styles.ghostButton}>
          <Text style={styles.ghostButtonText}>Filters</Text>
        </Pressable>
        <Pressable onPress={() => setShowComposer((current) => !current)} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{showComposer ? "Close" : "+ Add"}</Text>
        </Pressable>
      </View>

      {showFilters ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Refine the list</Text>
          <Text style={styles.panelLabel}>Status</Text>
          <View style={styles.chipRow}>
            {FILTER_OPTIONS.map((option) => {
              const selected = status === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setStatus(option)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.panelLabel}>Sort</Text>
          <View style={styles.chipRow}>
            {SORT_OPTIONS.map((option) => {
              const selected = sort === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setSort(option.value)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => {
              setQueryDraft("");
              setQuery("");
              setStatus("all");
              setSort("updated_desc");
              setShowFilters(false);
            }}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Clear controls</Text>
          </Pressable>
        </View>
      ) : null}

      {showComposer ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Add application</Text>
          <ComposerField label="Company" value={composerCompany} onChangeText={setComposerCompany} />
          <ComposerField label="Role" value={composerTitle} onChangeText={setComposerTitle} />
          <ComposerField label="Location" value={composerLocation} onChangeText={setComposerLocation} />
          <ComposerField
            label="Notes"
            multiline
            value={composerNotes}
            onChangeText={setComposerNotes}
          />
          {composerError ? <Text style={styles.errorText}>{composerError}</Text> : null}
          <Pressable disabled={composerBusy} onPress={() => void handleCreate()} style={styles.primaryButtonWide}>
            {composerBusy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryButtonText}>Save application</Text>}
          </Pressable>
        </View>
      ) : null}

      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderPrimary}>Role</Text>
        <Text style={styles.tableHeaderSecondary}>Stage</Text>
      </View>

      {infoMessage ? <Text style={styles.infoText}>{infoMessage}</Text> : null}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {loading ? <ActivityIndicator color={colors.accent} style={styles.loader} /> : null}

      {!loading && applications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No applications match this view.</Text>
          <Text style={styles.emptyCopy}>Try clearing the filters or add your next role.</Text>
        </View>
      ) : null}

      <View style={styles.list}>
        {applications.map((application) => (
          <ApplicationRow
            key={application.id}
            application={application}
            onSave={onUpdateApplication}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function ComposerField({
  label,
  multiline = false,
  value,
  onChangeText,
}: {
  label: string;
  multiline?: boolean;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.panelLabel}>{label}</Text>
      <TextInput
        multiline={multiline}
        placeholderTextColor={colors.mutedText}
        style={[styles.input, multiline && styles.notesInput]}
        textAlignVertical={multiline ? "top" : "center"}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
    backgroundColor: colors.background,
  },
  headerText: {
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
  toolbar: {
    gap: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.text,
    fontSize: 16,
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
    fontSize: 18,
    fontWeight: "700",
  },
  panelLabel: {
    color: colors.text,
    fontWeight: "600",
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
    textTransform: "capitalize",
    fontWeight: "600",
    fontSize: 13,
  },
  chipTextSelected: {
    color: colors.accent,
  },
  primaryButton: {
    borderRadius: 14,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonWide: {
    borderRadius: 14,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 15,
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
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.mutedText,
    fontWeight: "600",
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  tableHeaderPrimary: {
    color: colors.mutedText,
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  tableHeaderSecondary: {
    color: colors.mutedText,
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  field: {
    gap: 6,
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
  notesInput: {
    minHeight: 96,
  },
  list: {
    gap: 10,
    paddingBottom: 28,
  },
  loader: {
    marginVertical: 12,
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
  emptyState: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 6,
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 16,
  },
  emptyCopy: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
});
