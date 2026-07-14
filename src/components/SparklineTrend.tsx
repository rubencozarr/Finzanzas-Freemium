import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { fmt } from "../lib/format";
import { useTapOutsideReset } from "../hooks/useTapOutsideReset";
import type { TrendPoint } from "../lib/calculations";

export function SparklineTrend({ data, isPremium }: { data: TrendPoint[]; isPremium: boolean }) {
  const { containerRef, resetKey } = useTapOutsideReset<HTMLDivElement>();
  const visibleData = isPremium ? data : data.slice(-3);
  const monthsLabel = isPremium ? "6 meses" : "3 meses";
  const mean = visibleData.length ? visibleData.reduce((s, d) => s + d.value, 0) / visibleData.length : 0;
  return (
    <div className="mb-5">
      <p className="text-sm font-medium mb-2">Tendencia de tu ahorro (últimos {monthsLabel})</p>
      <div ref={containerRef} className="bg-white rounded-lg border border-stone-100 p-2" style={{ height: 120 }}>
        <div key={resetKey} className="w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={visibleData} margin={{ top: 8, right: 10, left: 10, bottom: 0 }}>
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip trigger="click" formatter={(v) => fmt(Number(v))} />
              <ReferenceLine y={0} stroke="#d6d3d1" strokeWidth={1} label={{ value: "0", position: "left", fontSize: 9, fill: "#a8a29e" }} />
              <ReferenceLine
                y={mean}
                stroke="#0f766e"
                strokeWidth={1}
                strokeDasharray="4 3"
                label={{ value: "media", position: "right", fontSize: 9, fill: "#0f766e" }}
              />
              <Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="text-xs text-stone-400 mt-1.5">
        Línea continua gris = 0€ (por debajo estás perdiendo dinero). Línea punteada verde = tu media de estos {monthsLabel} ({fmt(mean)}).
        Si tu línea sube mes a mes, vas mejorando.
      </p>
      {!isPremium && <p className="text-[11px] text-stone-400 mt-1">Ve los 6 meses completos con Premium</p>}
    </div>
  );
}
