import type { Application, Reminder, Task } from "./api";

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not scheduled";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export function sortTasksForDisplay(tasks: Task[]) {
  return [...tasks].sort((left, right) => {
    if (left.completed !== right.completed) {
      return left.completed ? 1 : -1;
    }
    if (!left.due_at && !right.due_at) {
      return 0;
    }
    if (!left.due_at) {
      return 1;
    }
    if (!right.due_at) {
      return -1;
    }
    return new Date(left.due_at).getTime() - new Date(right.due_at).getTime();
  });
}

export function partitionReminders(reminders: Reminder[]) {
  const now = Date.now();
  const upcoming: Reminder[] = [];
  const past: Reminder[] = [];

  for (const reminder of reminders) {
    if (new Date(reminder.scheduled_for).getTime() >= now) {
      upcoming.push(reminder);
    } else {
      past.push(reminder);
    }
  }

  upcoming.sort((left, right) => new Date(left.scheduled_for).getTime() - new Date(right.scheduled_for).getTime());
  past.sort((left, right) => new Date(right.scheduled_for).getTime() - new Date(left.scheduled_for).getTime());

  return { upcoming, past };
}

export function buildApplicationLabelMap(applications: Application[]) {
  return new Map(applications.map((application) => [application.id, `${application.company} - ${application.title}`]));
}
