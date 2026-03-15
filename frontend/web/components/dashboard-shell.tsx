import Link from "next/link";
import { ReactNode } from "react";

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="shell">
      <div className="topbar">
        <div>
          <div className="kicker">Career Control Center</div>
          <h2>Job Tracker</h2>
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
        </div>
      </div>
      {children}
    </div>
  );
}

