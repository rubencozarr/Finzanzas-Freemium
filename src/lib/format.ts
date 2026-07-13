// OJO: usar componentes de fecha locales, no toISOString() (que es UTC y puede
// desplazar el día en zonas horarias adelantadas a UTC, como España, durante la madrugada).
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

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

export const fmt = (n: number) => {
  const rounded = round2(n);
  return (rounded < 0 ? "-" : "") + Math.abs(rounded).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
};
