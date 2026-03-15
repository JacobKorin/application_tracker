import {
  createApplicationAction,
  deleteApplicationAction,
  updateApplicationDetailsAction,
  updateApplicationStageAction,
} from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getApplications, getCurrentUser, UnauthorizedError } from "@/lib/api";
import { LoggedOutView } from "@/lib/auth-page";
import { clearSession, getSession } from "@/lib/session";

const stageColor: Record<string, string> = {
  saved: "#2364aa",
  applied: "#ff6b35",
  interview: "#2e8b57",
  offer: "#6a994e",
  rejected: "#8d6a9f",
};

function formatLatestActivity(stageHistory: Array<{ stage: string; timestamp: string }>) {
  const latest = stageHistory.at(-1)?.timestamp;
  if (!latest) {
    return "No updates";
  }

  const date = new Date(latest);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function notePreview(notes: string[]) {
  if (notes.length === 0) {
    return "No notes";
  }

  const first = notes[0];
  return first.length > 48 ? `${first.slice(0, 48)}...` : first;
}

export default async function ApplicationsPage() {
  const session = await getSession();
  if (!session) {
    return <LoggedOutView />;
  }

  let applications;
  let currentUser;
  try {
    [applications, currentUser] = await Promise.all([getApplications(), getCurrentUser()]);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      await clearSession();
      return <LoggedOutView sessionExpired />;
    }
    throw error;
  }

  const activeApplications = applications.filter((application) => application.status !== "rejected");
  const interviewing = applications.filter((application) => application.status === "interview");

  return (
    <DashboardShell user={currentUser.user}>
      <section className="hero">
        <div className="kicker">Pipeline view</div>
        <h1>Applications</h1>
        <p className="muted">
          Scan the full pipeline quickly, change stage inline, and open row details only when you need to edit notes or clean up records.
        </p>
        <div className="metrics">
          <div className="metric">
            <span className="muted">Tracked roles</span>
            <strong>{applications.length}</strong>
          </div>
          <div className="metric">
            <span className="muted">Active pipeline</span>
            <strong>{activeApplications.length}</strong>
          </div>
          <div className="metric">
            <span className="muted">Interviews</span>
            <strong>{interviewing.length}</strong>
          </div>
        </div>
      </section>
      <section className="panel">
        <details className="expander" open={applications.length === 0}>
          <summary>
            <span className="kicker">Add application</span>
            <span className="summary-title">Capture a new role without leaving the table workflow</span>
          </summary>
          <form action={createApplicationAction} className="form-card expander-form">
            <div className="field-row">
              <label className="field">
                <span>Company</span>
                <input name="company" type="text" required />
              </label>
              <label className="field">
                <span>Role</span>
                <input name="title" type="text" required />
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
                <input name="location" type="text" />
              </label>
            </div>
            <label className="field">
              <span>Notes</span>
              <textarea name="notes" rows={3} placeholder="One note per line" />
            </label>
            <div className="cta-row">
              <button className="button primary" type="submit">
                Add application
              </button>
            </div>
          </form>
        </details>
      </section>
      <section className="panel table-panel">
        {applications.length === 0 ? (
          <div className="empty-state">
            <h3>No applications yet</h3>
            <p className="muted">Use the add form above to create your first tracked role.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Notes</th>
                  <th>Updated</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td className="company-cell">
                      <strong>{application.company}</strong>
                    </td>
                    <td>{application.title}</td>
                    <td>
                      <form action={updateApplicationStageAction} className="table-inline-form">
                        <input type="hidden" name="application_id" value={application.id} />
                        <select
                          name="status"
                          defaultValue={application.status}
                          className="table-select"
                          style={{
                            color: stageColor[application.status] ?? "#2364aa",
                            borderColor: `${stageColor[application.status] ?? "#2364aa"}33`,
                          }}
                        >
                          <option value="saved">Saved</option>
                          <option value="applied">Applied</option>
                          <option value="interview">Interview</option>
                          <option value="offer">Offer</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <button className="button secondary table-button" type="submit">
                          Save
                        </button>
                      </form>
                    </td>
                    <td>{application.location ?? "Unspecified"}</td>
                    <td className="notes-cell">{notePreview(application.notes)}</td>
                    <td>{formatLatestActivity(application.stage_history)}</td>
                    <td>
                      <details className="row-expander">
                        <summary>Edit</summary>
                        <div className="row-expander-body">
                          <form action={updateApplicationDetailsAction} className="form-card">
                            <input type="hidden" name="application_id" value={application.id} />
                            <input type="hidden" name="status" value={application.status} />
                            <label className="field">
                              <span>Location</span>
                              <input name="location" type="text" defaultValue={application.location ?? ""} />
                            </label>
                            <label className="field">
                              <span>Notes</span>
                              <textarea
                                name="notes"
                                rows={4}
                                defaultValue={application.notes.join("\n")}
                                placeholder="One note per line"
                              />
                            </label>
                            <div className="cta-row">
                              <button className="button secondary" type="submit">
                                Save details
                              </button>
                            </div>
                          </form>
                          <form action={deleteApplicationAction}>
                            <input type="hidden" name="application_id" value={application.id} />
                            <button className="button ghost" type="submit">
                              Delete application
                            </button>
                          </form>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
