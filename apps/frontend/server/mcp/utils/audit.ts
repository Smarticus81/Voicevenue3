export function auditLog(event: string, details: Record<string, any> = {}) {
  // For MVP, log to stdout
  console.log(`[audit] ${event}`, details);
}

