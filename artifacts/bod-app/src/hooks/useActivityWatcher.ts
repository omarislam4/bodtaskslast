import { useEffect, useRef } from "react";
import { focusManager } from "@tanstack/react-query";

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

/**
 * Pauses all TanStack Query background polling while the user is inactive
 * (no mouse movement, keyboard, touch, or scroll for INACTIVITY_TIMEOUT ms).
 * Resumes + triggers an immediate refetch as soon as activity is detected again.
 *
 * Works alongside `refetchIntervalInBackground: false` which independently pauses
 * polling when the browser tab is hidden or the window loses focus.
 */
export function useActivityWatcher() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInactiveRef = useRef(false);

  useEffect(() => {
    const onActivity = () => {
      if (isInactiveRef.current) {
        // User returned — restore default focus detection.
        // TanStack will re-check actual window focus and fire refetchOnWindowFocus.
        isInactiveRef.current = false;
        focusManager.setFocused(undefined);
      }

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        isInactiveRef.current = true;
        // the app is "unfocused" pauses refetchInterval.
        focusManager.setFocused(false);
      }, INACTIVITY_TIMEOUT);
    };

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    // Kick off the initial timer
    onActivity();

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
      // Always restore default focus detection on unmount
      focusManager.setFocused(undefined);
    };
  }, []);
}
