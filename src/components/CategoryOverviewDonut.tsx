import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { fmt } from "../lib/format";

export interface DonutDatum {
  name: string;
  value: number;
  color: string;
}

interface CategoryOverviewDonutProps {
  data: DonutDatum[];
  title: string;
  ingresos: number;
}

export function CategoryOverviewDonut({ data, title, ingresos }: CategoryOverviewDonutProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total <= 0) return null;

  return (
    <div className="bg-white rounded-lg border border-stone-100 p-4 mb-5">
      <p className="text-sm font-medium mb-3">{title}</p>
      <div className="flex items-center gap-4">
        <div style={{ width: 120, height: 120 }} className="shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={36} outerRadius={58} paddingAngle={2} stroke="none">
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => fmt(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[8px] text-stone-400 leading-tight">Total</span>
            <span className="font-mono text-[11px] font-semibold text-slate-700 leading-tight">{fmt(total)}</span>
          </div>
        </div>
        <div className="flex-1 space-y-1.5 min-w-0">
          {data.map((d) => {
            const pctGasto = ((d.value / total) * 100).toFixed(0);
            const pctIng = ingresos ? ((d.value / ingresos) * 100).toFixed(0) : null;
            return (
              <div key={d.name}>
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="truncate">{d.name}</span>
                  </span>
                  <span className="font-mono text-stone-600 shrink-0">
                    {fmt(d.value)} · {pctGasto}%
                  </span>
                </div>
                {pctIng && d.name !== "Uso de ahorro" && <p className="text-[10px] text-stone-400 ml-5 -mt-0.5">{pctIng}% de tus ingresos</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
