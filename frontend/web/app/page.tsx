import Link from "next/link";

import { createApplicationAction } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getApplications, getCurrentUser, getTasks, UnauthorizedError } from "@/lib/api";
import { LoggedOutView } from "@/lib/auth-page";
import { clearSession, getSession } from "@/lib/session";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    return <LoggedOutView />;
  }

  let applications;
  let tasks;
  let currentUser;

  try {
    [applications, tasks, currentUser] = await Promise.all([
      getApplications(),
      getTasks(),
      getCurrentUser(),
    ]);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      await clearSession();
      return <LoggedOutView sessionExpired />;
    }
    throw error;
  }

  const applicationItems = applications.items;
  const activeApplications = applicationItems.filter((application) => application.status !== "rejected");

  return (
    <DashboardShell user={currentUser.user}>
      <section className="hero">
        <div className="kicker">Live workspace</div>
        <div className="hero-grid">
          <div>
            <h1>Steer every application with a calmer system and faster follow-through.</h1>
            <p className="muted">
              Your deployed app is now backed by Postgres. Use this dashboard to add roles, move stages, and keep follow-ups from slipping.
            </p>
            <div className="pill-row">
              <span className="pill">Email auth live</span>
              <span className="pill">Stage history</span>
              <span className="pill">Persistent reminders</span>
            </div>
            <div className="cta-row">
              <Link href="/applications" className="button primary">
                View pipeline
              </Link>
              <Link href="/settings" className="button secondary">
                Notification settings
              </Link>
            </div>
          </div>
          <form action={createApplicationAction} className="panel form-card">
            <div className="kicker">Quick add</div>
            <h3>Capture a new application</h3>
            <label className="field">
              <span>Company</span>
              <input name="company" type="text" placeholder="North Peak Labs" required />
            </label>
            <label className="field">
              <span>Role</span>
              <input name="title" type="text" placeholder="Platform Engineer" required />
            </label>
            <label className="field">
              <span>Status</span>
              <select name="status" defaultValue="saved">
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
            <label className="field">
              <span>Location</span>
              <input name="location" type="text" placeholder="Remote" />
            </label>
            <label className="field">
              <span>Notes</span>
              <textarea name="notes" rows={3} placeholder="One note per line" />
            </label>
            <button className="button primary" type="submit">
              Save application
            </button>
          </form>
        </div>
        <div className="metrics">
          <div className="metric">
            <span className="muted">Open applications</span>
            <strong>{activeApplications.length}</strong>
          </div>
          <div className="metric">
            <span className="muted">Pending tasks</span>
            <strong>{tasks.filter((task) => !task.completed).length}</strong>
          </div>
          <div className="metric">
            <span className="muted">Signed in</span>
            <strong>1</strong>
          </div>
        </div>
      </section>

      <section className="panel-grid">
        <div className="panel">
          <div className="kicker">Applications</div>
          <h3>Recent roles</h3>
          <ul className="list">
            {applicationItems.slice(0, 4).map((application) => (
              <li className="list-item" key={application.id}>
                <strong>{application.company}</strong>
                <div>{application.title}</div>
                <div className="muted">{application.status}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <div className="kicker">Focus</div>
          <h3>What to do next</h3>
          <ul className="list">
            <li className="list-item">Move active applications to their latest stage.</li>
            <li className="list-item">Turn recruiter follow-ups into dated tasks.</li>
            <li className="list-item">Create reminders before interviews and deadlines.</li>
          </ul>
        </div>
        <div className="panel">
          <div className="kicker">Account</div>
          <h3>Current session</h3>
          <ul className="list">
            <li className="list-item">{currentUser.user.name}</li>
            <li className="list-item">{currentUser.user.email}</li>
            <li className="list-item">Your workspace is connected and ready.</li>
          </ul>
        </div>
      </section>
    </DashboardShell>
  );
}
