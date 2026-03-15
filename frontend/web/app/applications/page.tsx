import {
  createApplicationAction,
  deleteApplicationAction,
  updateApplicationStageAction,
} from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getApplications } from "@/lib/api";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

const stageColor: Record<string, string> = {
  saved: "#2364aa",
  applied: "#ff6b35",
  interview: "#2e8b57",
  offer: "#6a994e",
  rejected: "#8d6a9f",
};

export default async function ApplicationsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  const applications = await getApplications();

  return (
    <DashboardShell session={session}>
      <section className="hero">
        <div className="kicker">Pipeline view</div>
        <h1>Applications</h1>
        <p className="muted">Track current stage, notes, and follow-ups across every opportunity.</p>
      </section>
      <section className="panel-grid panel-grid-wide">
        <form action={createApplicationAction} className="panel form-card">
          <div className="kicker">Add application</div>
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
          <label className="field">
            <span>Notes</span>
            <textarea name="notes" rows={4} placeholder="One note per line" />
          </label>
          <button className="button primary" type="submit">
            Add application
          </button>
        </form>
      </section>
      <section className="panel-grid">
        {applications.map((application) => (
          <article className="panel" key={application.id}>
            <div
              className="pill"
              style={{ background: `${stageColor[application.status] ?? "#2364aa"}16`, color: stageColor[application.status] ?? "#2364aa" }}
            >
              {application.status}
            </div>
            <h3>{application.company}</h3>
            <p>{application.title}</p>
            <p className="muted">{application.location ?? "Location not set"}</p>
            {application.notes.length > 0 ? (
              <ul className="list compact-list">
                {application.notes.slice(0, 2).map((note) => (
                  <li className="list-item" key={note}>
                    {note}
                  </li>
                ))}
              </ul>
            ) : null}
            <form action={updateApplicationStageAction} className="inline-form">
              <input type="hidden" name="application_id" value={application.id} />
              <select name="status" defaultValue={application.status}>
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
              <button className="button secondary" type="submit">
                Update stage
              </button>
            </form>
            <form action={deleteApplicationAction}>
              <input type="hidden" name="application_id" value={application.id} />
              <button className="button ghost" type="submit">
                Delete
              </button>
            </form>
            <p className="muted">Application ID: {application.id}</p>
          </article>
        ))}
      </section>
    </DashboardShell>
  );
}
