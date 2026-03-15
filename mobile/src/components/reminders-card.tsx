import { StyleSheet, Text, View } from "react-native";

type Reminder = {
  id: string;
  title: string;
  due: string;
  channel: string;
};

export function RemindersCard({ reminders }: { reminders: Reminder[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>Reminders</Text>
      <Text style={styles.heading}>Follow-ups that stay visible</Text>
      <View style={styles.list}>
        {reminders.map((reminder) => (
          <View key={reminder.id} style={styles.item}>
            <Text style={styles.title}>{reminder.title}</Text>
            <Text style={styles.meta}>{reminder.due}</Text>
            <Text style={styles.channel}>{reminder.channel}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 24,
    padding: 20,
  },
  kicker: {
    color: "#2364aa",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 12,
  },
  heading: {
    color: "#1f1d1a",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 8,
  },
  list: {
    gap: 12,
    marginTop: 16,
  },
  item: {
    backgroundColor: "#fffaf2",
    borderRadius: 18,
    padding: 16,
  },
  title: {
    color: "#1f1d1a",
    fontWeight: "700",
  },
  meta: {
    color: "#6a6258",
    marginTop: 4,
  },
  channel: {
    color: "#2e8b57",
    marginTop: 8,
    fontWeight: "600",
  },
});

