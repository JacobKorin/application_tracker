import Link from "next/link";

import {
  deleteApplicationAction,
  updateApplicationDetailsAction,
  updateApplicationStageAction,
} from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getApplications, getCurrentUser, UnauthorizedError } from "@/lib/api";
import { LoggedOutView } from "@/lib/auth-page";
import { clearSession, getSession } from "@/lib/session";

type ApplicationsSearchParams = {
  q?: string;
  status?: string;
  sort?: string;
  page?: string;
  per_page?: string;
};

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

function buildApplicationsHref(
  filters: { q: string; status: string; sort: string },
  page: number,
  perPage: number,
) {
  const safePage = Math.max(page, 1);
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.sort) params.set("sort", filters.sort);
  params.set("page", String(safePage));
  params.set("per_page", String(perPage));
  return `/applications?${params.toString()}`;
}

function hasActiveControls(filters: { q: string; status: string; sort: string }, perPage: number) {
  return Boolean(filters.q) || filters.status !== "all" || filters.sort !== "updated_desc" || perPage !== 25;
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams?: Promise<ApplicationsSearchParams>;
}) {
  const session = await getSession();
  if (!session) {
    return <LoggedOutView />;
  }

  const params = (await searchParams) ?? {};
  const query = {
    q: params.q?.trim() || undefined,
    status: params.status?.trim() || undefined,
    sort: params.sort?.trim() || undefined,
    page: params.page ? Number(params.page) : undefined,
    per_page: params.per_page ? Number(params.per_page) : undefined,
  };

  let applications;
  let currentUser;
  try {
    [applications, currentUser] = await Promise.all([getApplications(query), getCurrentUser()]);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      await clearSession();
      return <LoggedOutView sessionExpired />;
    }
    throw error;
  }

  const items = applications.items;
  const activeApplications = items.filter((application) => application.status !== "rejected");
  const interviewing = items.filter((application) => application.status === "interview");
  const controlsOpen = hasActiveControls(applications.filters, applications.pagination.per_page);
  const showingFrom = applications.pagination.total === 0 ? 0 : (applications.pagination.page - 1) * applications.pagination.per_page + 1;
  const showingTo =
    applications.pagination.total === 0
      ? 0
      : Math.min(applications.pagination.page * applications.pagination.per_page, applications.pagination.total);

  return (
    <DashboardShell user={currentUser.user}>
      <section className="hero">
        <div className="hero-header-row">
          <div>
            <div className="kicker">Pipeline view</div>
            <h1>Applications</h1>
            <p className="muted">
              Scan the full pipeline quickly, change stage inline, and open row details only when you need to edit notes or clean up records.
            </p>
          </div>
          <Link href="/applications/new" className="plus-button" aria-label="Add application">
            +
          </Link>
        </div>
        <div className="metrics">
          <div className="metric">
            <span className="muted">Tracked roles</span>
            <strong>{applications.pagination.total}</strong>
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

      <section className="panel table-panel">
        <details className="expander table-tools" open={controlsOpen}>
          <summary>
            <span className="kicker">Table controls</span>
            <span className="summary-title">Search, filter, sort, and page the pipeline</span>
          </summary>
          <div className="table-controls">
            <form className="toolbar-grid" method="GET">
              <label className="field">
                <span>Search</span>
                <input name="q" type="search" defaultValue={applications.filters.q} placeholder="Company, role, location" />
              </label>
              <label className="field">
                <span>Status</span>
                <select name="status" defaultValue={applications.filters.status}>
                  <option value="all">All statuses</option>
                  <option value="saved">Saved</option>
                  <option value="applied">Applied</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>
              <label className="field">
                <span>Sort</span>
                <select name="sort" defaultValue={applications.filters.sort}>
                  <option value="updated_desc">Recently updated</option>
                  <option value="updated_asc">Oldest updates</option>
                  <option value="company_asc">Company A-Z</option>
                  <option value="company_desc">Company Z-A</option>
                  <option value="status_asc">Status A-Z</option>
                  <option value="status_desc">Status Z-A</option>
                </select>
              </label>
              <label className="field">
                <span>Rows</span>
                <select name="per_page" defaultValue={String(applications.pagination.per_page)}>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </label>
              <input type="hidden" name="page" value="1" />
              <div className="toolbar-actions">
                <button className="button primary" type="submit">
                  Apply
                </button>
                <Link href="/applications" className="button secondary">
                  Reset
                </Link>
              </div>
            </form>
          </div>
        </details>

        <div className="results-meta">
          <span>
            Showing {showingFrom} - {showingTo} of {applications.pagination.total}
          </span>
        </div>

        {applications.pagination.total === 0 ? (
          <div className="empty-state">
            <h3>{hasActiveControls(applications.filters, applications.pagination.per_page) ? "No matches for the current controls" : "No applications yet"}</h3>
            <p className="muted">
              {hasActiveControls(applications.filters, applications.pagination.per_page)
                ? "Try adjusting search, filter, or sort settings, or reset the table controls."
                : "Use the plus button to add your first tracked role."}
            </p>
            {hasActiveControls(applications.filters, applications.pagination.per_page) ? (
              <Link href="/applications" className="button secondary">
                Clear controls
              </Link>
            ) : (
              <Link href="/applications/new" className="button primary">
                Add application
              </Link>
            )}
          </div>
        ) : (
          <>
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
                  {items.map((application) => (
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

            <div className="pagination-bar">
              <Link
                href={buildApplicationsHref(applications.filters, applications.pagination.page - 1, applications.pagination.per_page)}
                className={`button secondary ${!applications.pagination.has_prev ? "is-disabled" : ""}`}
                aria-disabled={!applications.pagination.has_prev}
                tabIndex={applications.pagination.has_prev ? 0 : -1}
              >
                Previous
              </Link>
              <div className="pagination-copy">
                Page {applications.pagination.page} of {applications.pagination.total_pages}
              </div>
              <Link
                href={buildApplicationsHref(applications.filters, applications.pagination.page + 1, applications.pagination.per_page)}
                className={`button secondary ${!applications.pagination.has_next ? "is-disabled" : ""}`}
                aria-disabled={!applications.pagination.has_next}
                tabIndex={applications.pagination.has_next ? 0 : -1}
              >
                Next
              </Link>
            </div>
          </>
        )}
      </section>
    </DashboardShell>
  );
}
