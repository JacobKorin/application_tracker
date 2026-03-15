import {
  createReminderAction,
  createTaskAction,
  deleteReminderAction,
  deleteTaskAction,
  toggleTaskAction,
} from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getApplications, getCurrentUser, getReminders, getTasks } from "@/lib/api";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function TasksPage() {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  const [tasks, reminders, applications, currentUser] = await Promise.all([
    getTasks(),
    getReminders(),
    getApplications(),
    getCurrentUser(),
  ]);

  return (
    <DashboardShell user={currentUser.user}>
      <section className="hero">
        <div className="kicker">Execution lane</div>
        <h1>Tasks and reminders</h1>
        <p className="muted">Keep interview prep, follow-ups, and deadlines visible across devices.</p>
      </section>
      <section className="panel-grid panel-grid-wide">
        <form action={createTaskAction} className="panel form-card">
          <div className="kicker">Add task</div>
          <label className="field">
            <span>Title</span>
            <input name="title" type="text" required />
          </label>
          <label className="field">
            <span>Linked application</span>
            <select name="application_id" defaultValue="">
              <option value="">None</option>
              {applications.map((application) => (
                <option key={application.id} value={application.id}>
                  {application.company} - {application.title}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Due at</span>
            <input name="due_at" type="datetime-local" />
          </label>
          <button className="button primary" type="submit">
            Save task
          </button>
        </form>
        <form action={createReminderAction} className="panel form-card">
          <div className="kicker">Add reminder</div>
          <label className="field">
            <span>Title</span>
            <input name="title" type="text" required />
          </label>
          <label className="field">
            <span>Application</span>
            <select name="application_id" defaultValue="">
              <option value="">None</option>
              {applications.map((application) => (
                <option key={application.id} value={application.id}>
                  {application.company} - {application.title}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Task</span>
            <select name="task_id" defaultValue="">
              <option value="">None</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Scheduled for</span>
            <input name="scheduled_for" type="datetime-local" required />
          </label>
          <label className="field">
            <span>Channel</span>
            <select name="channel" defaultValue="push">
              <option value="push">Push</option>
              <option value="email">Email</option>
            </select>
          </label>
          <button className="button primary" type="submit">
            Save reminder
          </button>
        </form>
      </section>
      <section className="panel-grid">
        {tasks.map((task) => (
          <article className="panel" key={task.id}>
            <div className="kicker">{task.completed ? "Done" : "Open"}</div>
            <h3>{task.title}</h3>
            <p className="muted">Due: {task.due_at ?? "Not scheduled"}</p>
            <div className="cta-row">
              <form action={toggleTaskAction} className="inline-form">
                <input type="hidden" name="task_id" value={task.id} />
                <input type="hidden" name="completed" value={task.completed ? "false" : "true"} />
                <button className="button secondary" type="submit">
                  {task.completed ? "Mark open" : "Mark done"}
                </button>
              </form>
              <form action={deleteTaskAction}>
                <input type="hidden" name="task_id" value={task.id} />
                <button className="button ghost" type="submit">
                  Delete
                </button>
              </form>
            </div>
          </article>
        ))}
      </section>
      <section className="panel-grid">
        {reminders.map((reminder) => (
          <article className="panel" key={reminder.id}>
            <div className="kicker">{reminder.channel}</div>
            <h3>{reminder.title}</h3>
            <p className="muted">Scheduled: {reminder.scheduled_for}</p>
            <form action={deleteReminderAction}>
              <input type="hidden" name="reminder_id" value={reminder.id} />
              <button className="button ghost" type="submit">
                Delete reminder
              </button>
            </form>
          </article>
        ))}
      </section>
    </DashboardShell>
  );
}
