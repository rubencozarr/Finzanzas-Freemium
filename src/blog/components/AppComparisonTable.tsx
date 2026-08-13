import { Check, X } from "lucide-react";

type CellValue = "yes" | "no" | string;

interface ComparisonRow {
  label: string;
  values: CellValue[];
  /** Fila que merece destacarse sobre el resto (p. ej. precio) con un fondo ámbar. */
  emphasis?: boolean;
}

interface AppComparisonTableProps {
  apps: string[];
  rows: ComparisonRow[];
  /** Índice de la columna a resaltar (la app "propia" de turno). */
  highlightIndex?: number;
  /** Logo de la app en el índice `highlightIndex` (si no hay, esa columna también cae al circulito con inicial). */
  highlightLogo?: string;
}

export function AppComparisonTable({ apps, rows, highlightIndex = 0, highlightLogo }: AppComparisonTableProps) {
  return (
    <div className="rounded-2xl bg-white shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[640px]">
          <thead>
            <tr>
              <th className="text-left p-3 bg-stone-100"></th>
              {apps.map((app, i) => (
                <th
                  key={app}
                  className={`p-3 text-center ${i === highlightIndex ? "bg-teal-50 border-t-[3px] border-teal-500" : "bg-stone-100"}`}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    {i === highlightIndex && highlightLogo ? (
                      <img src={highlightLogo} alt={app} width={192} height={192} className="w-7 h-7 rounded-lg" />
                    ) : (
                      <span
                        className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${i === highlightIndex ? "bg-teal-500 text-white" : "bg-teal-100 text-teal-700"}`}
                      >
                        {app[0]}
                      </span>
                    )}
                    <span className={`font-bold ${i === highlightIndex ? "text-teal-800" : "text-stone-700"}`}>{app}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.label} className={row.emphasis ? "bg-amber-50" : rowIndex % 2 === 0 ? "bg-white" : "bg-stone-50"}>
                <td className="p-3 font-medium text-stone-600 whitespace-nowrap bg-stone-100">{row.label}</td>
                {row.values.map((value, i) => (
                  <td key={i} className={`p-3 text-center ${i === highlightIndex && !row.emphasis ? "bg-teal-50/60" : ""}`}>
                    <ComparisonCell value={value} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComparisonCell({ value }: { value: CellValue }) {
  if (value === "yes") {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100">
        <Check className="text-emerald-600" size={16} strokeWidth={2.75} />
      </span>
    );
  }
  if (value === "no") {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100">
        <X className="text-rose-400" size={16} strokeWidth={2.75} />
      </span>
    );
  }
  return <span className="text-xs font-medium text-stone-600">{value}</span>;
}
