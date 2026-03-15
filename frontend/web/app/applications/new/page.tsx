import Link from "next/link";

import { createApplicationAndRedirectAction } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentUser, UnauthorizedError } from "@/lib/api";
import { LoggedOutView } from "@/lib/auth-page";
import { clearSession, getSession } from "@/lib/session";

export default async function NewApplicationPage() {
  const session = await getSession();
  if (!session) {
    return <LoggedOutView />;
  }

  let currentUser;
  try {
    currentUser = await getCurrentUser();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      await clearSession();
      return <LoggedOutView sessionExpired />;
    }
    throw error;
  }

  return (
    <DashboardShell user={currentUser.user}>
      <section className="hero">
        <div className="kicker">New application</div>
        <h1>Add application</h1>
        <p className="muted">
          Capture the role details here, then return to the applications table to continue scanning and updating the pipeline.
        </p>
      </section>
      <section className="panel panel-grid-wide">
        <form action={createApplicationAndRedirectAction} className="panel form-card">
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
            <textarea name="notes" rows={5} placeholder="One note per line" />
          </label>
          <div className="cta-row">
            <button className="button primary" type="submit">
              Save and return
            </button>
            <Link href="/applications" className="button secondary">
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </DashboardShell>
  );
}
