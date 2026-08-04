import { Check, X } from "lucide-react";

type CellValue = "yes" | "no" | string;

interface ComparisonRow {
  label: string;
  values: CellValue[];
}

interface AppComparisonTableProps {
  apps: string[];
  rows: ComparisonRow[];
  /** Índice de la columna a resaltar (la app "propia" de turno). */
  highlightIndex?: number;
}

export function AppComparisonTable({ apps, rows, highlightIndex = 0 }: AppComparisonTableProps) {
  return (
    <div className="rounded-2xl bg-stone-50 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[600px]">
          <thead>
            <tr>
              <th className="text-left p-3"></th>
              {apps.map((app, i) => (
                <th key={app} className={`p-3 font-semibold text-center ${i === highlightIndex ? "bg-teal-50 text-teal-800" : "text-stone-600"}`}>
                  {app}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-stone-200">
                <td className="p-3 text-stone-600 whitespace-nowrap text-xs sm:text-sm">{row.label}</td>
                {row.values.map((value, i) => (
                  <td key={i} className={`p-3 text-center ${i === highlightIndex ? "bg-teal-50/60" : ""}`}>
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
  if (value === "yes") return <Check className="inline text-emerald-500" size={16} strokeWidth={2.5} />;
  if (value === "no") return <X className="inline text-stone-300" size={16} strokeWidth={2.5} />;
  return <span className="text-xs text-stone-600">{value}</span>;
}
