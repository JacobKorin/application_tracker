"use client";

import { useEffect } from "react";

import { API_READY_URL } from "@/lib/api-base-url";

const WARMUP_TIMEOUT_MS = 15_000;

export function ApiWarmup() {
  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), WARMUP_TIMEOUT_MS);

    // Trigger the Render backend to wake up while the user is on the auth screen.
    fetch(API_READY_URL, {
      cache: "no-store",
      mode: "cors",
      signal: controller.signal,
    }).catch(() => {
      // The server-side fetch path handles retries if the warm-up request loses the race.
    });

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
