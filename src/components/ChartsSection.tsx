import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { BudgetComplianceChart } from "./BudgetComplianceChart";
import { fmt } from "../lib/format";
import type { AssetYearBreakdown, YearComparisonPoint, YearMonthData } from "../lib/calculations";

const ASSET_COLORS = ["#818cf8", "#a78bfa", "#c4b5fd", "#6366f1", "#4f46e5"];

interface ChartsSectionProps {
  data: YearMonthData[];
  variableBudget: number;
  assetBreakdown: AssetYearBreakdown[];
  totalInversion: number;
  year: number;
  compareYear?: number | null;
  compareData?: YearComparisonPoint[] | null;
}

export function ChartsSection({ data, variableBudget, assetBreakdown, totalInversion, year, compareYear, compareData }: ChartsSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const assetDonutData = assetBreakdown.map((a, i) => ({ name: a.name, value: a.total, color: ASSET_COLORS[i % ASSET_COLORS.length] }));
  const comparing = !!(compareYear && compareData);

  return (
    <div className="mb-5">
      <button onClick={() => setExpanded((e) => !e)} className="w-full text-left mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide rounded-full px-2.5 py-1 bg-stone-700 text-white inline-flex items-center gap-1">
          Gráficos y análisis
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </span>
      </button>
      {expanded && (
        <div>
          <ChartCard
            title="Tasa de ahorro mensual"
            explanation="Qué % de tus ingresos ahorras cada mes. Es la referencia más directa de si tu gestión mejora o empeora."
            height={180}
          >
            <ResponsiveContainer width="100%" height="100%">
              {comparing ? (
                <LineChart data={compareData!} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v) => `${Number(v).toFixed(0)}%`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={0} stroke="#c3c2b7" />
                  <Line type="monotone" dataKey="tasaAhorro" stroke="#0f766e" strokeWidth={2} dot={{ r: 2 }} name={String(year)} />
                  <Line
                    type="monotone"
                    dataKey="compareTasaAhorro"
                    stroke="#5eead4"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={{ r: 2 }}
                    name={String(compareYear)}
                  />
                </LineChart>
              ) : (
                <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v) => `${Number(v).toFixed(0)}%`} />
                  <ReferenceLine y={0} stroke="#c3c2b7" />
                  <Line type="monotone" dataKey="tasaAhorro" stroke="#0f766e" strokeWidth={2} dot={{ r: 2 }} name="Tasa de ahorro" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Ingresos vs gastos por mes"
            explanation="Si las barras de gastos se acercan o superan a las de ingresos con frecuencia, es la primera señal de alerta."
            height={200}
          >
            <ResponsiveContainer width="100%" height="100%">
              {comparing ? (
                <LineChart data={compareData!} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="ingresos" stroke="#059669" strokeWidth={2} dot={{ r: 2 }} name={`Ingresos ${year}`} />
                  <Line
                    type="monotone"
                    dataKey="compareIngresos"
                    stroke="#6ee7b7"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={{ r: 2 }}
                    name={`Ingresos ${compareYear}`}
                  />
                  <Line type="monotone" dataKey="gastos" stroke="#e11d48" strokeWidth={2} dot={{ r: 2 }} name={`Gastos ${year}`} />
                  <Line
                    type="monotone"
                    dataKey="compareGastos"
                    stroke="#fda4af"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={{ r: 2 }}
                    name={`Gastos ${compareYear}`}
                  />
                </LineChart>
              ) : (
                <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="ingresos" fill="#059669" name="Ingresos" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="gastos" fill="#e11d48" name="Gastos" radius={[3, 3, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Ahorro libre consolidado, mes a mes"
            explanation="Tu saldo real acumulado. Si esta línea baja de forma sostenida, estás usando ahorro más rápido de lo que generas."
            height={180}
          >
            <ResponsiveContainer width="100%" height="100%">
              {comparing ? (
                <LineChart data={compareData!} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="acumulado" stroke="#d97706" strokeWidth={2} dot={{ r: 2 }} name={String(year)} />
                  <Line
                    type="monotone"
                    dataKey="compareAcumulado"
                    stroke="#fcd34d"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={{ r: 2 }}
                    name={String(compareYear)}
                  />
                </LineChart>
              ) : (
                <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Line type="monotone" dataKey="acumulado" stroke="#d97706" strokeWidth={2} dot={{ r: 2 }} name="Ahorro libre consolidado" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Evolución de gasto fijo vs variable"
            explanation="Si el variable crece de forma sostenida mientras el fijo no se mueve, suele ser la señal más temprana de descontrol."
            height={200}
          >
            <ResponsiveContainer width="100%" height="100%">
              {comparing ? (
                <LineChart data={compareData!} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="fixedOrdinario" stroke="#64748b" strokeWidth={2} dot={{ r: 2 }} name={`Fijo ${year}`} />
                  <Line
                    type="monotone"
                    dataKey="compareFixedOrdinario"
                    stroke="#cbd5e1"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={{ r: 2 }}
                    name={`Fijo ${compareYear}`}
                  />
                  <Line type="monotone" dataKey="variableOrdinario" stroke="#fb7185" strokeWidth={2} dot={{ r: 2 }} name={`Variable ${year}`} />
                  <Line
                    type="monotone"
                    dataKey="compareVariableOrdinario"
                    stroke="#fecdd3"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={{ r: 2 }}
                    name={`Variable ${compareYear}`}
                  />
                </LineChart>
              ) : (
                <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="fixedOrdinario" fill="#64748b" name="Gasto fijo" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="variableOrdinario" fill="#fb7185" name="Gasto variable" radius={[3, 3, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Cumplimiento de presupuesto de variable" explanation="En cuántos meses te has mantenido dentro del presupuesto general de gasto variable.">
            <BudgetComplianceChart data={data} variableBudget={variableBudget} />
          </ChartCard>

          {assetDonutData.length > 0 && (
            <ChartCard title="Inversión por activo" explanation="Cómo se reparte lo que has invertido este año entre tus distintos activos.">
              <div className="flex items-center gap-4 py-2">
                <div style={{ width: 100, height: 100 }} className="shrink-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={assetDonutData} dataKey="value" nameKey="name" innerRadius={30} outerRadius={48} paddingAngle={2} stroke="none">
                        {assetDonutData.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => fmt(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="font-mono text-[10px] font-semibold text-slate-700">{fmt(totalInversion)}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-1.5 min-w-0">
                  {assetDonutData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs gap-2">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="truncate">{d.name}</span>
                      </span>
                      <span className="font-mono text-stone-600 shrink-0">
                        {fmt(d.value)} · {totalInversion ? ((d.value / totalInversion) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          )}
        </div>
      )}
    </div>
  );
}
