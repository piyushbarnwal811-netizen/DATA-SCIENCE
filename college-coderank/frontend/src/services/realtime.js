import { useEffect, useState } from "react";

let eventSource = null;
let reconnectTimer = null;
const listeners = {
  "student:updated": new Set(),
  "leaderboard:refresh": new Set()
};

function initEventSource() {
  if (eventSource && (eventSource.readyState === EventSource.OPEN || eventSource.readyState === EventSource.CONNECTING)) {
    return;
  }

  try {
    eventSource = new EventSource("/api/realtime/events");

    eventSource.onopen = () => {
      window.dispatchEvent(new CustomEvent("ccr:realtime-connected"));
    };

    eventSource.addEventListener("student:updated", (event) => {
      try {
        const data = JSON.parse(event.data);
        listeners["student:updated"].forEach((fn) => fn(data));
        window.dispatchEvent(new CustomEvent("ccr:student-updated", { detail: data }));
      } catch (err) {
        console.error("Error parsing student:updated event:", err);
      }
    });

    eventSource.addEventListener("leaderboard:refresh", (event) => {
      try {
        const data = JSON.parse(event.data);
        listeners["leaderboard:refresh"].forEach((fn) => fn(data));
        window.dispatchEvent(new CustomEvent("ccr:leaderboard-refresh", { detail: data }));
      } catch (err) {
        console.error("Error parsing leaderboard:refresh event:", err);
      }
    });

    eventSource.onerror = () => {
      eventSource?.close();
      eventSource = null;
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          initEventSource();
        }, 5000);
      }
    };
  } catch (error) {
    console.error("Failed to establish SSE connection:", error);
  }
}

/**
 * Hook to subscribe to real-time events in React components
 */
export function useRealtimeSync({ onStudentUpdated, onLeaderboardRefresh } = {}) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    initEventSource();
    setConnected(eventSource?.readyState === EventSource.OPEN);

    const onConn = () => setConnected(true);
    window.addEventListener("ccr:realtime-connected", onConn);

    if (onStudentUpdated) {
      listeners["student:updated"].add(onStudentUpdated);
    }
    if (onLeaderboardRefresh) {
      listeners["leaderboard:refresh"].add(onLeaderboardRefresh);
    }

    return () => {
      window.removeEventListener("ccr:realtime-connected", onConn);
      if (onStudentUpdated) listeners["student:updated"].delete(onStudentUpdated);
      if (onLeaderboardRefresh) listeners["leaderboard:refresh"].delete(onLeaderboardRefresh);
    };
  }, [onStudentUpdated, onLeaderboardRefresh]);

  return { connected };
}
