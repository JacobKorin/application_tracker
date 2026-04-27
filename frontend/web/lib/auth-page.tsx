import { signInAction, signUpAction } from "@/app/actions";
import { AuthSubmitButton } from "@/components/auth-submit-button";

const AUTH_MESSAGES: Record<string, string> = {
  "signup-check-signin": "If that email is available, the account was created. Otherwise, try signing in instead.",
  "sign-in-invalid": "That email or password did not match. Check your credentials and try again.",
  "sign-in-rate-limited": "Too many sign-in attempts. Wait a few minutes, then try again.",
  "sign-in-unavailable": "Sign-in is temporarily unavailable. Please try again shortly.",
  "sign-up-rate-limited": "Too many sign-up attempts. Wait a few minutes, then try again.",
  "sign-up-unavailable": "Sign-up is temporarily unavailable. Please try again shortly.",
  "session-check-failed": "We could not verify your previous session. Please sign in again.",
};

export function LoggedOutView({
  sessionExpired = false,
  authMessage,
}: {
  sessionExpired?: boolean;
  authMessage?: string;
}) {
  return (
    <div className="shell">
      <section className="hero">
        <div className="kicker">Welcome</div>
        <div className="hero-grid">
          <div>
            <h1>Keep your search organized, visible, and actually moving.</h1>
            <p className="muted">
              Sign in or create an account to start tracking applications, tasks, and reminders in the deployed app.
            </p>
            {sessionExpired ? (
              <div className="session-banner">
                Your session expired or became invalid. Please sign in again.
              </div>
            ) : null}
            {authMessage && AUTH_MESSAGES[authMessage] ? (
              <div className="session-banner">{AUTH_MESSAGES[authMessage]}</div>
            ) : null}
            <div className="pill-row">
              <span className="pill">Persistent Postgres storage</span>
              <span className="pill">Stage history</span>
              <span className="pill">Tasks and reminders</span>
            </div>
          </div>
          <div className="auth-grid">
            <form action={signInAction} className="panel form-card">
              <div className="kicker">Sign in</div>
              <label className="field">
                <span>Email</span>
                <input name="email" type="email" placeholder="you@example.com" required />
              </label>
              <label className="field">
                <span>Password</span>
                <input name="password" type="password" placeholder="Your password" required />
              </label>
              <AuthSubmitButton
                idleLabel="Sign in"
                pendingLabel="Signing in..."
                pendingMessage="Signing you in. If the backend is waking up, this can take a few seconds."
              />
            </form>
            <form action={signUpAction} className="panel form-card">
              <div className="kicker">Create account</div>
              <label className="field">
                <span>Name</span>
                <input name="name" type="text" placeholder="Jamie Doe" required />
              </label>
              <label className="field">
                <span>Email</span>
                <input name="email" type="email" placeholder="jamie@example.com" required />
              </label>
              <label className="field">
                <span>Password</span>
                <input name="password" type="password" placeholder="Create a password" required />
              </label>
              <AuthSubmitButton
                idleLabel="Create account"
                pendingLabel="Creating account..."
                pendingMessage="Creating your account. If the backend is waking up, this can take a few seconds."
              />
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
