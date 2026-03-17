import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { ApplicationsScreen } from "./src/components/applications-screen";
import { AuthScreen } from "./src/components/auth-screen";
import {
  Application,
  AuthResponse,
  UnauthorizedError,
  createApplication,
  getApplications,
  getCurrentUser,
  signIn,
  signUp,
  updateApplication,
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
        const [currentUser, response] = await Promise.all([
          getCurrentUser(token),
          getApplications(token, { sort: "updated_desc" }),
        ]);
        if (!active) {
          return;
        }
        setSession((current) => (current ? { ...current, user: currentUser.user } : current));
        setApplications(response.items);
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
      await refreshApplications({ sort: "updated_desc" });
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

  function handleSignOut() {
    setSession(null);
    setApplications([]);
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
        <ApplicationsScreen
          applications={applications}
          currentUser={session.user}
          errorMessage={applicationsError}
          infoMessage={applicationsInfo}
          loading={loadingApplications}
          onCreateApplication={handleCreateApplication}
          onRefresh={refreshApplications}
          onSignOut={handleSignOut}
          onUpdateApplication={handleUpdateApplication}
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
