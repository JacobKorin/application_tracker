import { DashboardShell } from "@/components/dashboard-shell";
import { getTasks } from "@/lib/api";

export default async function TasksPage() {
  const tasks = await getTasks();

  return (
    <DashboardShell>
      <section className="hero">
        <div className="kicker">Execution lane</div>
        <h1>Tasks and reminders</h1>
        <p className="muted">Keep interview prep, follow-ups, and deadlines visible across devices.</p>
      </section>
      <section className="panel-grid">
        {(tasks ?? []).map((task) => (
          <article className="panel" key={task.id}>
            <div className="kicker">{task.completed ? "Done" : "Open"}</div>
            <h3>{task.title}</h3>
            <p className="muted">Due: {task.due_at ?? "Not scheduled"}</p>
          </article>
        ))}
      </section>
    </DashboardShell>
  );
}

