import Link from "next/link";
import { ReactNode } from "react";

import { signOutAction } from "@/app/actions";

type DashboardShellProps = {
  children: ReactNode;
  user: {
    name: string;
    email: string;
  };
};

export function DashboardShell({ children, user }: DashboardShellProps) {
  return (
    <div className="shell">
      <div className="topbar">
        <div>
          <div className="kicker">Career Control Center</div>
          <h2>Job Tracker</h2>
          <p className="muted">Signed in as {user.name}</p>
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
