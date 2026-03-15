import { StyleSheet, Text, View } from "react-native";

type Application = {
  id: string;
  company: string;
  title: string;
  stage: string;
};

export function PipelineCard({ applications }: { applications: Application[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>Pipeline</Text>
      <Text style={styles.heading}>Applications in motion</Text>
      <View style={styles.list}>
        {applications.map((application) => (
          <View key={application.id} style={styles.item}>
            <Text style={styles.company}>{application.company}</Text>
            <Text style={styles.title}>{application.title}</Text>
            <Text style={styles.stage}>{application.stage}</Text>
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
  company: {
    fontWeight: "700",
    fontSize: 16,
    color: "#1f1d1a",
  },
  title: {
    color: "#1f1d1a",
    marginTop: 4,
  },
  stage: {
    color: "#ff6b35",
    marginTop: 6,
    fontWeight: "600",
  },
});

