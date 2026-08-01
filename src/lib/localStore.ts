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

/** Borra todas las claves de la app en localStorage (modo local). Recorre las claves existentes en vez
 * de listar cada nombre a mano, para no tener que acordarse de añadir aquí cada LOCAL_KEY nuevo que se
 * cree en el futuro. */
export function clearAllLocal(): void {
  if (typeof localStorage === "undefined") return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) keysToRemove.push(key);
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}
