import {
  createReminderAction,
  createTaskAction,
  deleteReminderAction,
  deleteTaskAction,
  toggleTaskAction,
} from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { getApplications, getCurrentUser, getReminders, getTasks, UnauthorizedError } from "@/lib/api";
import { LoggedOutView } from "@/lib/auth-page";
import { buildApplicationLabelMap, formatDateTime, partitionReminders, sortTasksForDisplay } from "@/lib/execution";
import { clearSession, getSession } from "@/lib/session";

export default async function TasksPage() {
  const session = await getSession();
  if (!session) {
    return <LoggedOutView />;
  }

  let tasks;
  let reminders;
  let applications;
  let currentUser;
  try {
    [tasks, reminders, applications, currentUser] = await Promise.all([
      getTasks(),
      getReminders(),
      getApplications(),
      getCurrentUser(),
    ]);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      await clearSession();
      return <LoggedOutView sessionExpired />;
    }
    throw error;
  }

  const applicationItems = applications.items;
  const applicationLabels = buildApplicationLabelMap(applicationItems);
  const orderedTasks = sortTasksForDisplay(tasks);
  const openTasks = orderedTasks.filter((task) => !task.completed);
  const completedTasks = orderedTasks.filter((task) => task.completed);
  const reminderGroups = partitionReminders(reminders);
  const timeZone = currentUser.settings?.timezone;

  return (
    <DashboardShell user={currentUser.user}>
      <section className="hero">
        <div className="hero-header-row">
          <div>
            <div className="kicker">Execution lane</div>
            <h1>Tasks and reminders</h1>
            <p className="muted">Keep interview prep, follow-ups, and deadlines visible across devices.</p>
          </div>
          <div className="metrics">
            <div className="metric">
              <span className="muted">Open tasks</span>
              <strong>{openTasks.length}</strong>
            </div>
            <div className="metric">
              <span className="muted">Upcoming reminders</span>
              <strong>{reminderGroups.upcoming.length}</strong>
            </div>
          </div>
        </div>
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
              {applicationItems.map((application) => (
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
              {applicationItems.map((application) => (
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
      <section className="panel-grid panel-grid-wide">
        <div className="panel">
          <div className="kicker">Open tasks</div>
          <h3>What needs attention now</h3>
          {openTasks.length ? (
            <div className="list">
              {openTasks.map((task) => (
                <article className="list-item" key={task.id}>
                  <div className="hero-header-row">
                    <div>
                      <strong>{task.title}</strong>
                      <div className="muted">Due {formatDateTime(task.due_at, timeZone)}</div>
                      {task.application_id ? (
                        <div className="muted">{applicationLabels.get(task.application_id) ?? "Linked application"}</div>
                      ) : null}
                    </div>
                    <div className="cta-row">
                      <form action={toggleTaskAction} className="inline-form">
                        <input type="hidden" name="task_id" value={task.id} />
                        <input type="hidden" name="completed" value="true" />
                        <button className="button secondary" type="submit">
                          Mark done
                        </button>
                      </form>
                      <form action={deleteTaskAction}>
                        <input type="hidden" name="task_id" value={task.id} />
                        <button className="button ghost" type="submit">
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="list-item empty-state">No open tasks. Add your next follow-up or deadline above.</div>
          )}
        </div>
        <div className="panel">
          <div className="kicker">Completed tasks</div>
          <h3>Recently finished</h3>
          {completedTasks.length ? (
            <div className="list compact-list">
              {completedTasks.map((task) => (
                <article className="list-item" key={task.id}>
                  <div className="hero-header-row">
                    <div>
                      <strong>{task.title}</strong>
                      <div className="muted">Completed task</div>
                      {task.application_id ? (
                        <div className="muted">{applicationLabels.get(task.application_id) ?? "Linked application"}</div>
                      ) : null}
                    </div>
                    <div className="cta-row">
                      <form action={toggleTaskAction} className="inline-form">
                        <input type="hidden" name="task_id" value={task.id} />
                        <input type="hidden" name="completed" value="false" />
                        <button className="button secondary" type="submit">
                          Reopen
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="list-item empty-state">Completed tasks will appear here once you start checking work off.</div>
          )}
        </div>
      </section>
      <section className="panel-grid panel-grid-wide">
        <div className="panel">
          <div className="kicker">Upcoming reminders</div>
          <h3>Keep the next deadline visible</h3>
          {reminderGroups.upcoming.length ? (
            <div className="list">
              {reminderGroups.upcoming.map((reminder) => (
                <article className="list-item" key={reminder.id}>
                  <div className="hero-header-row">
                    <div>
                      <strong>{reminder.title}</strong>
                      <div className="muted">{formatDateTime(reminder.scheduled_for, timeZone)}</div>
                      <div className="muted">
                        {reminder.task_id
                          ? "Linked to task"
                          : reminder.application_id
                            ? (applicationLabels.get(reminder.application_id) ?? "Linked application")
                            : reminder.channel}
                      </div>
                    </div>
                    <form action={deleteReminderAction}>
                      <input type="hidden" name="reminder_id" value={reminder.id} />
                      <button className="button ghost" type="submit">
                        Delete reminder
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="list-item empty-state">No upcoming reminders. Schedule your next follow-up above.</div>
          )}
        </div>
        <div className="panel">
          <div className="kicker">Past reminders</div>
          <h3>Recently scheduled</h3>
          {reminderGroups.past.length ? (
            <div className="list compact-list">
              {reminderGroups.past.map((reminder) => (
                <article className="list-item" key={reminder.id}>
                  <div className="hero-header-row">
                    <div>
                      <strong>{reminder.title}</strong>
                      <div className="muted">{formatDateTime(reminder.scheduled_for, timeZone)}</div>
                      <div className="muted">{reminder.channel}</div>
                    </div>
                    <form action={deleteReminderAction}>
                      <input type="hidden" name="reminder_id" value={reminder.id} />
                      <button className="button ghost" type="submit">
                        Delete
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="list-item empty-state">Past reminders will collect here once items move behind you.</div>
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
