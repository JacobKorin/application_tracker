import { DashboardShell } from "@/components/dashboard-shell";
import { getApplications } from "@/lib/api";

const stageColor: Record<string, string> = {
  saved: "#2364aa",
  applied: "#ff6b35",
  interview: "#2e8b57",
  offer: "#6a994e",
  rejected: "#8d6a9f",
};

export default async function ApplicationsPage() {
  const applications = await getApplications();

  return (
    <DashboardShell>
      <section className="hero">
        <div className="kicker">Pipeline view</div>
        <h1>Applications</h1>
        <p className="muted">Track current stage, notes, and follow-ups across every opportunity.</p>
      </section>
      <section className="panel-grid">
        {(applications ?? []).map((application) => (
          <article className="panel" key={application.id}>
            <div
              className="pill"
              style={{ background: `${stageColor[application.status] ?? "#2364aa"}16`, color: stageColor[application.status] ?? "#2364aa" }}
            >
              {application.status}
            </div>
            <h3>{application.company}</h3>
            <p>{application.title}</p>
            <p className="muted">Application ID: {application.id}</p>
          </article>
        ))}
      </section>
    </DashboardShell>
  );
}

