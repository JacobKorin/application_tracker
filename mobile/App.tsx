import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { AuthScreen } from "./src/components/auth-screen";
import { WorkspaceScreen } from "./src/components/workspace-screen";
import {
  Application,
  AuthResponse,
  Reminder,
  Task,
  UnauthorizedError,
  createApplication,
  createReminder,
  createTask,
  deleteReminder,
  deleteTask,
  getApplications,
  getCurrentUser,
  getReminders,
  getTasks,
  signIn,
  signUp,
  updateApplication,
  updateTask,
} from "./src/lib/api";
import { clearSession, loadSession, saveSession, Session } from "./src/lib/session";
import { colors } from "./src/theme";

type ApplicationFilters = {
  q?: string;
  status?: string;
  sort?: string;
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [restoringSession, setRestoringSession] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);
  const [submittingAuth, setSubmittingAuth] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  const [applicationsInfo, setApplicationsInfo] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    let active = true;

    async function restorePersistedSession() {
      try {
        const storedSession = await loadSession();
        if (!active || !storedSession) {
          return;
        }
        setSession(storedSession);
        setAuthInfo("Session restored.");
      } catch {
        if (active) {
          setAuthInfo("Unable to restore your previous session. Please sign in again.");
        }
      } finally {
        if (active) {
          setRestoringSession(false);
          setSessionReady(true);
        }
      }
    }

    void restorePersistedSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!sessionReady) {
      return;
    }

    if (session) {
      void saveSession(session);
      return;
    }

    void clearSession();
  }, [session, sessionReady]);

  async function handleAuthResponse(result: AuthResponse) {
    if ("token" in result) {
      setSession({
        token: result.token,
        user: result.user,
      });
      setAuthError(null);
      setAuthInfo("Signed in successfully.");
      setApplicationsInfo(null);
      return;
    }

    setAuthInfo(result.message);
  }

  async function handleSignIn(email: string, password: string) {
    try {
      setSubmittingAuth(true);
      setAuthError(null);
      setAuthInfo(null);
      setApplicationsInfo(null);
      const result = await signIn(email, password);
      await handleAuthResponse(result);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setSubmittingAuth(false);
    }
  }

  async function handleSignUp(name: string, email: string, password: string) {
    try {
      setSubmittingAuth(true);
      setAuthError(null);
      setAuthInfo(null);
      setApplicationsInfo(null);
      const result = await signUp(email, password, name);
      await handleAuthResponse(result);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to create account.");
    } finally {
      setSubmittingAuth(false);
    }
  }

  async function refreshApplications(filters: ApplicationFilters = {}) {
    const token = session?.token;
    if (!token) {
      return;
    }

    try {
      setLoadingApplications(true);
      setApplicationsError(null);
      const response = await getApplications(token, filters);
      setApplications(response.items);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load applications.";
      setApplicationsError(message);
      if (error instanceof UnauthorizedError || message.toLowerCase().includes("expired")) {
        setSession(null);
        setAuthInfo("Your session expired. Please sign in again.");
      }
    } finally {
      setLoadingApplications(false);
    }
  }

  async function refreshExecutionLane() {
    const token = session?.token;
    if (!token) {
      return;
    }

    try {
      setLoadingApplications(true);
      setApplicationsError(null);
      const [taskItems, reminderItems] = await Promise.all([getTasks(token), getReminders(token)]);
      setTasks(taskItems);
      setReminders(reminderItems);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load tasks and reminders.";
      setApplicationsError(message);
      if (error instanceof UnauthorizedError || message.toLowerCase().includes("expired")) {
        setSession(null);
        setAuthInfo("Your session expired. Please sign in again.");
      }
    } finally {
      setLoadingApplications(false);
    }
  }

  useEffect(() => {
    if (!session) {
      return;
    }

    const token = session.token;
    let active = true;

    async function hydrate() {
      try {
        setLoadingApplications(true);
        setApplicationsError(null);
        const [currentUser, response, taskItems, reminderItems] = await Promise.all([
          getCurrentUser(token),
          getApplications(token, { sort: "updated_desc" }),
          getTasks(token),
          getReminders(token),
        ]);
        if (!active) {
          return;
        }
        setSession((current) => (current ? { ...current, user: currentUser.user } : current));
        setApplications(response.items);
        setTasks(taskItems);
        setReminders(reminderItems);
        setApplicationsInfo("Workspace synced with Render.");
      } catch (error) {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : "Unable to load your workspace.";
        setApplicationsError(message);
        if (error instanceof UnauthorizedError || message.toLowerCase().includes("expired")) {
          setSession(null);
          setAuthInfo("Your session expired. Please sign in again.");
        }
      } finally {
        if (active) {
          setLoadingApplications(false);
        }
      }
    }

    void hydrate();

    return () => {
      active = false;
    };
  }, [session?.token]);

  async function handleCreateApplication(input: {
    company: string;
    title: string;
    location?: string;
    notes?: string[];
  }) {
    const token = session?.token;
    if (!token) {
      return;
    }

    try {
      await createApplication(token, {
        company: input.company,
        title: input.title,
        location: input.location,
        notes: input.notes,
        status: "saved",
      });
      setApplicationsInfo("Application created.");
      await Promise.all([refreshApplications({ sort: "updated_desc" }), refreshExecutionLane()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create application.";
      setApplicationsError(message);
      if (error instanceof UnauthorizedError) {
        setSession(null);
        setAuthInfo("Your session expired. Please sign in again.");
      }
      throw error;
    }
  }

  async function handleUpdateApplication(applicationId: string, input: Partial<Application>) {
    const token = session?.token;
    if (!token) {
      return;
    }

    try {
      await updateApplication(token, applicationId, input);
      setApplicationsInfo("Application updated.");
      await refreshApplications({ sort: "updated_desc" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update application.";
      setApplicationsError(message);
      if (error instanceof UnauthorizedError) {
        setSession(null);
        setAuthInfo("Your session expired. Please sign in again.");
      }
      throw error;
    }
  }

  async function handleCreateTask(input: { title: string; application_id?: string; due_at?: string }) {
    const token = session?.token;
    if (!token) {
      return;
    }

    try {
      await createTask(token, input);
      setApplicationsInfo("Task created.");
      await refreshExecutionLane();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create task.";
      setApplicationsError(message);
      if (error instanceof UnauthorizedError) {
        setSession(null);
        setAuthInfo("Your session expired. Please sign in again.");
      }
      throw error;
    }
  }

  async function handleToggleTask(taskId: string, completed: boolean) {
    const token = session?.token;
    if (!token) {
      return;
    }

    try {
      await updateTask(token, taskId, { completed });
      setApplicationsInfo(completed ? "Task marked done." : "Task reopened.");
      await refreshExecutionLane();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update task.";
      setApplicationsError(message);
      if (error instanceof UnauthorizedError) {
        setSession(null);
        setAuthInfo("Your session expired. Please sign in again.");
      }
      throw error;
    }
  }

  async function handleDeleteTask(taskId: string) {
    const token = session?.token;
    if (!token) {
      return;
    }

    try {
      await deleteTask(token, taskId);
      setApplicationsInfo("Task deleted.");
      await refreshExecutionLane();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete task.";
      setApplicationsError(message);
      if (error instanceof UnauthorizedError) {
        setSession(null);
        setAuthInfo("Your session expired. Please sign in again.");
      }
      throw error;
    }
  }

  async function handleCreateReminder(input: {
    title: string;
    application_id?: string;
    task_id?: string;
    scheduled_for: string;
    channel: string;
  }) {
    const token = session?.token;
    if (!token) {
      return;
    }

    try {
      await createReminder(token, input);
      setApplicationsInfo("Reminder created.");
      await refreshExecutionLane();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create reminder.";
      setApplicationsError(message);
      if (error instanceof UnauthorizedError) {
        setSession(null);
        setAuthInfo("Your session expired. Please sign in again.");
      }
      throw error;
    }
  }

  async function handleDeleteReminder(reminderId: string) {
    const token = session?.token;
    if (!token) {
      return;
    }

    try {
      await deleteReminder(token, reminderId);
      setApplicationsInfo("Reminder deleted.");
      await refreshExecutionLane();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete reminder.";
      setApplicationsError(message);
      if (error instanceof UnauthorizedError) {
        setSession(null);
        setAuthInfo("Your session expired. Please sign in again.");
      }
      throw error;
    }
  }

  function handleSignOut() {
    setSession(null);
    setApplications([]);
    setTasks([]);
    setReminders([]);
    setApplicationsError(null);
    setApplicationsInfo("Signed out.");
    setAuthError(null);
    setAuthInfo("Signed out.");
  }

  if (restoringSession) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.loadingTitle}>Restoring session</Text>
          <Text style={styles.loadingCopy}>Checking for your last successful mobile sign-in.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {session ? (
        <WorkspaceScreen
          applications={applications}
          currentUser={session.user}
          errorMessage={applicationsError}
          infoMessage={applicationsInfo}
          loading={loadingApplications}
          onCreateApplication={handleCreateApplication}
          onCreateReminder={handleCreateReminder}
          onCreateTask={handleCreateTask}
          onDeleteReminder={handleDeleteReminder}
          onDeleteTask={handleDeleteTask}
          onRefreshApplications={refreshApplications}
          onSignOut={handleSignOut}
          onToggleTask={handleToggleTask}
          onUpdateApplication={handleUpdateApplication}
          reminders={reminders}
          tasks={tasks}
        />
      ) : (
        <AuthScreen
          errorMessage={authError}
          infoMessage={authInfo}
          loading={submittingAuth}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    gap: 12,
  },
  loadingTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
  loadingCopy: {
    color: colors.mutedText,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
