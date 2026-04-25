import Link from "next/link";

import { createApplicationAction } from "@/app/actions";
import { UpstreamUnavailable } from "@/components/upstream-unavailable";
import { DashboardShell } from "@/components/dashboard-shell";
import { getApplications, getCurrentUser, getReminders, getTasks, UnauthorizedError, UpstreamResponseError } from "@/lib/api";
import { LoggedOutView } from "@/lib/auth-page";
import { buildApplicationLabelMap, formatDateTime, partitionReminders, sortTasksForDisplay } from "@/lib/execution";
import { clearSession, getSession } from "@/lib/session";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ authMessage?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const session = await getSession();

  if (!session) {
    return <LoggedOutView authMessage={params?.authMessage} />;
  }

  let applications;
  let tasks;
  let reminders;
  let currentUser;

  try {
    [applications, tasks, reminders, currentUser] = await Promise.all([
      getApplications(),
      getTasks(),
      getReminders(),
      getCurrentUser(),
    ]);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      await clearSession();
      return <LoggedOutView sessionExpired authMessage={params?.authMessage} />;
    }
    if (error instanceof UpstreamResponseError) {
      return <UpstreamUnavailable retryHref="/" />;
    }
    throw error;
  }

  const applicationItems = applications.items;
  const activeApplications = applicationItems.filter((application) => application.status !== "rejected");
  const pendingTasks = sortTasksForDisplay(tasks).filter((task) => !task.completed);
  const reminderGroups = partitionReminders(reminders);
  const applicationLabels = buildApplicationLabelMap(applicationItems);
  const timeZone = currentUser.settings?.timezone;

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
            <strong>{pendingTasks.length}</strong>
          </div>
          <div className="metric">
            <span className="muted">Upcoming reminders</span>
            <strong>{reminderGroups.upcoming.length}</strong>
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
          <div className="hero-header-row">
            <div>
              <div className="kicker">Focus</div>
              <h3>Pending tasks</h3>
            </div>
            <Link href="/tasks" className="button secondary">
              Open lane
            </Link>
          </div>
          {pendingTasks.length ? (
            <ul className="list compact-list">
              {pendingTasks.slice(0, 4).map((task) => (
                <li className="list-item" key={task.id}>
                  <strong>{task.title}</strong>
                  <div className="muted">{formatDateTime(task.due_at, timeZone)}</div>
                  {task.application_id ? (
                    <div className="muted">{applicationLabels.get(task.application_id) ?? "Linked application"}</div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="list-item empty-state">
              No pending tasks yet. Add your next follow-up from the tasks lane.
            </div>
          )}
        </div>
        <div className="panel">
          <div className="hero-header-row">
            <div>
              <div className="kicker">Timing</div>
              <h3>Upcoming reminders</h3>
            </div>
            <Link href="/tasks" className="button secondary">
              Manage reminders
            </Link>
          </div>
          {reminderGroups.upcoming.length ? (
            <ul className="list compact-list">
              {reminderGroups.upcoming.slice(0, 4).map((reminder) => (
                <li className="list-item" key={reminder.id}>
                  <strong>{reminder.title}</strong>
                  <div className="muted">{formatDateTime(reminder.scheduled_for, timeZone)}</div>
                  <div className="muted">
                    {reminder.task_id
                      ? "Linked to task"
                      : reminder.application_id
                        ? (applicationLabels.get(reminder.application_id) ?? "Linked application")
                        : reminder.channel}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="list-item empty-state">
              No upcoming reminders yet. Schedule your next interview or follow-up reminder.
            </div>
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
