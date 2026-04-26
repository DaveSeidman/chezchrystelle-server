type AuditLogDetails = Record<string, unknown>;

function redactValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, redactValue(nestedValue)]));
  }

  return value;
}

export function logAuditEvent(event: string, details: AuditLogDetails = {}) {
  const sanitizedDetails = redactValue(details) as AuditLogDetails;
  const payload = {
    scope: 'audit',
    event,
    at: new Date().toISOString(),
    ...sanitizedDetails
  };

  console.info(JSON.stringify(payload));
}
