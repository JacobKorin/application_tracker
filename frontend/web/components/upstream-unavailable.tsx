import Link from "next/link";

type UpstreamUnavailableProps = {
  retryHref?: string;
};

export function UpstreamUnavailable({ retryHref = "/" }: UpstreamUnavailableProps) {
  return (
    <div className="shell">
      <section className="hero">
        <div className="kicker">Temporary interruption</div>
        <div className="panel form-card">
          <h1>We could not reach the app backend just yet.</h1>
          <p className="muted">
            This usually happens while the Render services are finishing a deploy, waking from
            inactivity, or briefly throttling requests. Your session is still intact.
          </p>
          <div className="session-banner">
            Try again in a few seconds. If the deploy is still rolling out, the dashboard should
            recover on its own shortly.
          </div>
          <div className="cta-row">
            <Link href={retryHref} className="button primary">
              Try again
            </Link>
            <Link href="/" className="button secondary">
              Overview
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
