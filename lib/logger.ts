type LogLevel = 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

const REDACTED = '[REDACTED]';
const SENSITIVE_KEY = /(authorization|cookie|password|passwd|secret|token|api[-_]?key|receipt)/i;

function sanitize(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }
  if (Array.isArray(value)) {
    return value.map((entry) => sanitize(entry, seen));
  }
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';

  seen.add(value);
  const clean: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    clean[key] = SENSITIVE_KEY.test(key) ? REDACTED : sanitize(entry, seen);
  }
  seen.delete(value);
  return clean;
}

function write(level: LogLevel, event: string, context: LogContext = {}) {
  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...sanitize(context) as LogContext,
  });

  if (level === 'error') console.error(payload);
  else if (level === 'warn') console.warn(payload);
  else console.info(payload);
}

export const logInfo = (event: string, context?: LogContext) => write('info', event, context);
export const logWarn = (event: string, context?: LogContext) => write('warn', event, context);
export const logError = (event: string, context?: LogContext) => write('error', event, context);

