import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet } from "react-native";
import { useEffect, useState } from "react";

import { ApplicationsScreen } from "./src/components/applications-screen";
import { AuthScreen } from "./src/components/auth-screen";
import {
  Application,
  AuthResponse,
  CurrentUser,
  createApplication,
  getApplications,
  getCurrentUser,
  signIn,
  signUp,
  updateApplication,
} from "./src/lib/api";
import { colors } from "./src/theme";

type Session = {
  token: string;
  user: CurrentUser["user"];
};

type ApplicationFilters = {
  q?: string;
  status?: string;
  sort?: string;
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);
  const [submittingAuth, setSubmittingAuth] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);

  async function handleAuthResponse(result: AuthResponse) {
    if ("token" in result) {
      setSession({
        token: result.token,
        user: result.user,
      });
      setAuthError(null);
      setAuthInfo(null);
      return;
    }

    setAuthInfo(result.message);
  }

  async function handleSignIn(email: string, password: string) {
    try {
      setSubmittingAuth(true);
      setAuthError(null);
      setAuthInfo(null);
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
      if (message.toLowerCase().includes("expired") || message.toLowerCase().includes("unauthorized")) {
        setSession(null);
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
      } catch (error) {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : "Unable to load your workspace.";
        setApplicationsError(message);
        if (message.toLowerCase().includes("expired") || message.toLowerCase().includes("unauthorized")) {
          setSession(null);
        }
      } finally {
        if (active) {
          setLoadingApplications(false);
        }
      }
    }

    hydrate();
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
    await createApplication(token, {
      company: input.company,
      title: input.title,
      location: input.location,
      notes: input.notes,
      status: "saved",
    });
    await refreshApplications({ sort: "updated_desc" });
  }

  async function handleUpdateApplication(applicationId: string, input: Partial<Application>) {
    const token = session?.token;
    if (!token) {
      return;
    }
    await updateApplication(token, applicationId, input);
    await refreshApplications({ sort: "updated_desc" });
  }

  function handleSignOut() {
    setSession(null);
    setApplications([]);
    setApplicationsError(null);
    setAuthError(null);
    setAuthInfo(null);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {session ? (
        <ApplicationsScreen
          applications={applications}
          currentUser={session.user}
          errorMessage={applicationsError}
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
});
