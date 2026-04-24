"use client";

import { useEffect } from "react";

/**
 * A client-side listener that catches ChunkLoadError.
 * This happens when a user's browser tries to load a JS chunk that no longer exists
 * on the server (usually after a new deployment).
 */
export function ChunkErrorListener() {
  useEffect(() => {
    const handleError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const error = "reason" in event ? event.reason : event.error;

      // Check if it's a ChunkLoadError
      if (
        error &&
        (error.name === "ChunkLoadError" ||
          /loading chunk \d+ failed/i.test(error.message))
      ) {
        console.warn("ChunkLoadError detected. Reloading page to fetch latest version...");
        window.location.reload();
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleError);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleError);
    };
  }, []);

  return null;
}
