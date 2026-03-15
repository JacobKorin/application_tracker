import Link from "next/link";

import { DashboardShell } from "@/components/dashboard-shell";
import { getApplications, getTasks } from "@/lib/api";

export default async function HomePage() {
  const [applications, tasks] = await Promise.all([getApplications(), getTasks()]);

  return (
    <DashboardShell>
      <section className="hero">
        <div className="kicker">Production scaffold</div>
        <div className="hero-grid">
          <div>
            <h1>Steer every application with a cleaner pipeline and calmer follow-ups.</h1>
            <p className="muted">
              This starter ties a Next.js dashboard to a Flask microservice backend so we can grow
              from a crisp MVP into a durable production platform.
            </p>
            <div className="pill-row">
              <span className="pill">Email + Google auth</span>
              <span className="pill">Stage history</span>
              <span className="pill">Push and email reminders</span>
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
          <div className="panel">
            <div className="kicker">V1 focus</div>
            <h3>Solo user workflow, ready for production hardening</h3>
            <ul className="list">
              <li className="list-item">Bounded services for identity, applications, and notifications</li>
              <li className="list-item">Shared contract layer for web and mobile parity</li>
              <li className="list-item">Render deployment blueprint with Dockerized services</li>
            </ul>
          </div>
        </div>
        <div className="metrics">
          <div className="metric">
            <span className="muted">Open applications</span>
            <strong>{applications?.length ?? 0}</strong>
          </div>
          <div className="metric">
            <span className="muted">Pending tasks</span>
            <strong>{tasks?.filter((task) => !task.completed).length ?? 0}</strong>
          </div>
          <div className="metric">
            <span className="muted">Services</span>
            <strong>4</strong>
          </div>
        </div>
      </section>

      <section className="panel-grid">
        <div className="panel">
          <div className="kicker">Applications</div>
          <h3>Recent roles</h3>
          <ul className="list">
            {(applications ?? []).map((application) => (
              <li className="list-item" key={application.id}>
                <strong>{application.company}</strong>
                <div>{application.title}</div>
                <div className="muted">{application.status}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <div className="kicker">Ritual</div>
          <h3>Weekly review checklist</h3>
          <ul className="list">
            <li className="list-item">Archive stale leads without losing history</li>
            <li className="list-item">Advance applications with new recruiter replies</li>
            <li className="list-item">Confirm next week’s reminders and interview prep</li>
          </ul>
        </div>
        <div className="panel">
          <div className="kicker">Ops</div>
          <h3>Production notes</h3>
          <ul className="list">
            <li className="list-item">Health endpoints and CI are already scaffolded</li>
            <li className="list-item">Replace in-memory repositories with PostgreSQL next</li>
            <li className="list-item">Hook notification dispatch into a Redis-backed worker</li>
          </ul>
        </div>
      </section>
    </DashboardShell>
  );
}

