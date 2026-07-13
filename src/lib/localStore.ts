// Persistencia local (localStorage) usada por los hooks cuando DATA_BACKEND === "local".
// Sustituye al window.storage del prototipo original.

const PREFIX = "mis-cuentas:";

export function readLocal<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw != null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocal<T>(key: string, value: T): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}
