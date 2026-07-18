import { MONTHS_FULL } from "./constants";

// OJO: usar componentes de fecha locales, no toISOString() (que es UTC y puede
// desplazar el día en zonas horarias adelantadas a UTC, como España, durante la madrugada).
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const firstOfNextMonthISO = () => {
  const d = new Date();
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
};

// True mientras el bloqueo siga vigente. Se vuelve false sin ninguna acción explícita en cuanto
// cambia el mes (lockedUntil es siempre el día 1 del mes siguiente al que se fijó), que es el
// comportamiento de expiración automática pedido para "fondos/categorías activas".
export const isFutureLock = (lockedUntil: string | null | undefined) => !!lockedUntil && todayISO() < lockedUntil;

export const monthKey = (dateStr: string) => dateStr.slice(0, 7);

export const prevMonthKey = (mKey: string) => {
  const [y, m] = mKey.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

// Redondea a céntimos antes de decidir signo/formato: sumas y restas repetidas de importes
// (en JS, coma flotante) pueden dejar un resto como -0.00000000000003 en vez de un 0 exacto, y sin
// este redondeo eso se mostraría como "-0,00 €" en vez de "0,00 €".
export const round2 = (n: number) => Math.round(n * 100) / 100;

// "2026-08-01" -> "agosto de 2026", para el texto "Tu selección está fijada hasta {fecha}".
export const formatMonthYear = (dateStr: string) => {
  const [y, m] = dateStr.split("-").map(Number);
  return `${MONTHS_FULL[m - 1]} de ${y}`;
};

// "2026-08-01" -> "01-08-2026": el formato ISO (año-mes-día) de la base de datos no es el habitual en
// España, donde se lee día-mes-año. Solo para mostrar; el ISO original (t.date) sigue usándose para
// ordenar, comparar y editar.
export const formatDateEs = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-");
  return `${d}-${m}-${y}`;
};

export const fmt = (n: number) => {
  const rounded = round2(n);
  return (rounded < 0 ? "-" : "") + Math.abs(rounded).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
};
