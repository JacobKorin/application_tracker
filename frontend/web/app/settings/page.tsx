import { updateSettingsAction } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getSettings } from "@/lib/api";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  const settings = await getSettings();

  return (
    <DashboardShell session={session}>
      <section className="hero">
        <div className="kicker">Preferences</div>
        <h1>Account settings</h1>
        <p className="muted">Identity, reminders, timezone, and notification defaults live here.</p>
      </section>
      <section className="panel-grid panel-grid-wide">
        <form action={updateSettingsAction} className="panel form-card">
          <div className="kicker">Update preferences</div>
          <label className="field">
            <span>Timezone</span>
            <input name="timezone" type="text" defaultValue={settings.timezone} />
          </label>
          <label className="field">
            <span>Theme</span>
            <select name="theme" defaultValue={settings.theme}>
              <option value="sunrise">Sunrise</option>
              <option value="minimal">Minimal</option>
              <option value="focus">Focus</option>
            </select>
          </label>
          <label className="checkbox-row">
            <input name="weekly_summary" type="checkbox" defaultChecked={settings.weekly_summary} />
            <span>Weekly summary emails</span>
          </label>
          <button className="button primary" type="submit">
            Save settings
          </button>
        </form>
        <div className="panel">
          <div className="kicker">Current values</div>
          <ul className="list">
            <li className="list-item">Timezone: {settings.timezone}</li>
            <li className="list-item">Theme: {settings.theme}</li>
            <li className="list-item">
              Weekly summary: {settings.weekly_summary ? "Enabled" : "Disabled"}
            </li>
          </ul>
        </div>
      </section>
    </DashboardShell>
  );
}
