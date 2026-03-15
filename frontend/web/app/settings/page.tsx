import { DashboardShell } from "@/components/dashboard-shell";
import { getSettings } from "@/lib/api";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <DashboardShell>
      <section className="hero">
        <div className="kicker">Preferences</div>
        <h1>Account settings</h1>
        <p className="muted">Identity, reminders, timezone, and notification defaults live here.</p>
      </section>
      <section className="panel-grid">
        <div className="panel">
          <div className="kicker">Timezone</div>
          <h3>{settings?.timezone ?? "UTC"}</h3>
        </div>
        <div className="panel">
          <div className="kicker">Theme</div>
          <h3>{settings?.theme ?? "sunrise"}</h3>
        </div>
        <div className="panel">
          <div className="kicker">Weekly summary</div>
          <h3>{settings?.weekly_summary ? "Enabled" : "Disabled"}</h3>
        </div>
      </section>
    </DashboardShell>
  );
}

