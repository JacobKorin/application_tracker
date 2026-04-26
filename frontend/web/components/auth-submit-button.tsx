"use client";

import { useFormStatus } from "react-dom";

type AuthSubmitButtonProps = {
  idleLabel: string;
  pendingLabel: string;
  pendingMessage: string;
};

export function AuthSubmitButton({
  idleLabel,
  pendingLabel,
  pendingMessage,
}: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <div className="submit-stack">
      <button className="button primary" type="submit" disabled={pending} aria-busy={pending}>
        {pending ? <span className="spinner" aria-hidden="true" /> : null}
        <span>{pending ? pendingLabel : idleLabel}</span>
      </button>
      {pending ? (
        <div className="submit-progress" role="status" aria-live="polite">
          <div className="progress-bar" aria-hidden="true" />
          <span>{pendingMessage}</span>
        </div>
      ) : null}
    </div>
  );
}
