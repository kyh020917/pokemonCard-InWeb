// Handles both JSON string (SQLite) and native array (PostgreSQL)
export function parseCardTypes(types: string | string[]): string[] {
  if (Array.isArray(types)) return types;
  try {
    return JSON.parse(types);
  } catch {
    return [];
  }
}
