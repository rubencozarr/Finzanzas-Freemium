import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { fmt } from "../lib/format";
import type { TrendPoint } from "../lib/calculations";

export function SparklineTrend({ data }: { data: TrendPoint[] }) {
  const mean = data.length ? data.reduce((s, d) => s + d.value, 0) / data.length : 0;
  return (
    <div className="mb-5">
      <p className="text-sm font-medium mb-2">Tendencia de tu ahorro (últimos 6 meses)</p>
      <div className="bg-white rounded-lg border border-stone-100 p-2" style={{ height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 10, left: 10, bottom: 0 }}>
            <XAxis dataKey="mes" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => fmt(Number(v))} />
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
      <p className="text-xs text-stone-400 mt-1.5">
        Línea continua gris = 0€ (por debajo estás perdiendo dinero). Línea punteada verde = tu media de estos 6 meses ({fmt(mean)}). Si tu
        línea sube mes a mes, vas mejorando.
      </p>
    </div>
  );
}
