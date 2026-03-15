import Link from "next/link";
import { ReactNode } from "react";

import { signOutAction } from "@/app/actions";
import { Session } from "@/lib/session";

type DashboardShellProps = {
  children: ReactNode;
  session: Session;
};

export function DashboardShell({ children, session }: DashboardShellProps) {
  return (
    <div className="shell">
      <div className="topbar">
        <div>
          <div className="kicker">Career Control Center</div>
          <h2>Job Tracker</h2>
          <p className="muted">Signed in as {session.name}</p>
        </div>
        <div className="nav-row">
          <Link href="/" className="button secondary">
            Overview
          </Link>
          <Link href="/applications" className="button secondary">
            Applications
          </Link>
          <Link href="/tasks" className="button secondary">
            Tasks
          </Link>
          <Link href="/settings" className="button secondary">
            Settings
          </Link>
          <form action={signOutAction}>
            <button type="submit" className="button secondary">
              Sign out
            </button>
          </form>
        </div>
      </div>
      {children}
    </div>
  );
}
