/**
 * Real-time Server-Sent Events (SSE) Manager for College CodeRank.
 * Allows instant, zero-dependency push updates to connected Admin and Student panels
 * whenever platform stats (LeetCode, HackerRank, GitHub) change.
 */

const clients = new Set();

/**
 * Register a new SSE client connection
 */
export function addRealtimeClient(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no"
  });

  // Initial connection handshake
  res.write(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`);

  const client = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    res,
    userRole: req.user?.role ?? "guest",
    userId: req.user?.id ?? null
  };

  clients.add(client);

  req.on("close", () => {
    clients.delete(client);
  });
}

/**
 * Broadcast an event to all connected clients
 */
export function broadcastRealtimeEvent(event, data = {}) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try {
      client.res.write(payload);
    } catch {
      clients.delete(client);
    }
  }
}

/**
 * Broadcast student update notification
 */
export function broadcastStudentUpdate(student, options = {}) {
  broadcastRealtimeEvent("student:updated", {
    studentId: student._id?.toString() || student.id,
    name: student.name,
    email: student.email,
    branch: student.branch,
    section: student.section,
    score: student.score,
    stats: student.stats,
    source: options.source || "sync",
    timestamp: new Date().toISOString()
  });

  broadcastRealtimeEvent("leaderboard:refresh", {
    reason: "student_updated",
    studentName: student.name,
    timestamp: new Date().toISOString()
  });
}

// Keep-alive heartbeat every 25 seconds to prevent browser/proxy timeouts
setInterval(() => {
  for (const client of clients) {
    try {
      client.res.write(": heartbeat\n\n");
    } catch {
      clients.delete(client);
    }
  }
}, 25_000).unref();
