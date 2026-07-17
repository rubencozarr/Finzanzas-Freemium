import { useState } from "react";

// Los tabs se desmontan al cambiar de pestaña (App.tsx solo renderiza el tab activo), así que un
// useState normal dentro de ellos se pierde al salir y volver. Este Map vive en el módulo, no en el
// árbol de React, así que sobrevive a esos remounts durante toda la sesión de la app y solo se resetea
// con una recarga completa de página (que es cuando sí queremos que todo vuelva a verse "de cero").
const store = new Map<string, unknown>();

export function usePersistentState<T>(key: string, initial: T): [T, (updater: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => (store.has(key) ? (store.get(key) as T) : initial));

  const update = (updater: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const next = typeof updater === "function" ? (updater as (prev: T) => T)(prev) : updater;
      store.set(key, next);
      return next;
    });
  };

  return [value, update];
}
