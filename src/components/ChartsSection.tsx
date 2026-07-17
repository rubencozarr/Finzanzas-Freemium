import { ChevronDown, ChevronUp } from "lucide-react";
import { usePersistentState } from "../lib/persistentState";
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

interface AssetDonutDatum {
  name: string;
  value: number;
  color: string;
}

function AssetDonut({ data, total, animate }: { data: AssetDonutDatum[]; total: number; animate: boolean }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <div style={{ width: 100, height: 100 }} className="shrink-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={30} outerRadius={48} paddingAngle={2} stroke="none" isAnimationActive={animate}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip trigger="click" formatter={(v) => fmt(Number(v))} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-mono text-[10px] font-semibold text-slate-700">{fmt(total)}</span>
        </div>
      </div>
      <div className="flex-1 space-y-1.5 min-w-0">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-xs gap-2">
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
              <span className="truncate">{d.name}</span>
            </span>
            <span className="font-mono text-stone-600 shrink-0">
              {fmt(d.value)} · {total ? ((d.value / total) * 100).toFixed(0) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ChartsSectionProps {
  data: YearMonthData[];
  variableBudget: number;
  assetBreakdown: AssetYearBreakdown[];
  totalInversion: number;
  year: number;
  compareYear?: number | null;
  compareData?: YearComparisonPoint[] | null;
  compareAssetBreakdown?: AssetYearBreakdown[];
  compareTotalInversion?: number;
}

export function ChartsSection({
  data,
  variableBudget,
  assetBreakdown,
  totalInversion,
  year,
  compareYear,
  compareData,
  compareAssetBreakdown = [],
  compareTotalInversion = 0,
}: ChartsSectionProps) {
  const [expanded, setExpanded] = usePersistentState("anual.chartsExpanded", false);
  const comparing = !!(compareYear && compareData);

  // Mismo activo -> mismo color en ambos donuts, aunque el orden (por total invertido, mayor a menor)
  // difiera entre años: se asigna por nombre a partir de la unión de ambos años, no por índice de cada
  // array por separado.
  const allAssetNames = Array.from(new Set([...assetBreakdown.map((a) => a.name), ...compareAssetBreakdown.map((a) => a.name)]));
  const colorByAssetName = Object.fromEntries(allAssetNames.map((name, i) => [name, ASSET_COLORS[i % ASSET_COLORS.length]]));
  const assetDonutData: AssetDonutDatum[] = assetBreakdown.map((a) => ({ name: a.name, value: a.total, color: colorByAssetName[a.name] }));
  const compareAssetDonutData: AssetDonutDatum[] = compareAssetBreakdown.map((a) => ({
    name: a.name,
    value: a.total,
    color: colorByAssetName[a.name],
  }));

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
            {(animate) => (
              <ResponsiveContainer width="100%" height="100%">
                {comparing ? (
                  <LineChart data={compareData!} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip trigger="click" formatter={(v) => `${Number(v).toFixed(0)}%`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceLine y={0} stroke="#c3c2b7" />
                    <Line
                      type="monotone"
                      dataKey="tasaAhorro"
                      stroke="#0f766e"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      name={String(year)}
                      isAnimationActive={animate}
                    />
                    <Line
                      type="monotone"
                      dataKey="compareTasaAhorro"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      name={String(compareYear)}
                      isAnimationActive={animate}
                    />
                  </LineChart>
                ) : (
                  <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip trigger="click" formatter={(v) => `${Number(v).toFixed(0)}%`} />
                    <ReferenceLine y={0} stroke="#c3c2b7" />
                    <Line
                      type="monotone"
                      dataKey="tasaAhorro"
                      stroke="#0f766e"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      name="Tasa de ahorro"
                      isAnimationActive={animate}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </ChartCard>

          {comparing ? (
            <>
              <ChartCard title={`Ingresos ${year} vs ${compareYear}`} explanation="Compara tus ingresos mes a mes entre los dos años." height={160}>
                {(animate) => (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={compareData!} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip trigger="click" formatter={(v) => fmt(Number(v))} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="ingresos" fill="#059669" name={String(year)} radius={[3, 3, 0, 0]} isAnimationActive={animate} />
                      <Bar
                        dataKey="compareIngresos"
                        fill="#6ee7b7"
                        name={String(compareYear)}
                        radius={[3, 3, 0, 0]}
                        isAnimationActive={animate}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <ChartCard title={`Gastos ${year} vs ${compareYear}`} explanation="Compara tus gastos totales mes a mes entre los dos años." height={160}>
                {(animate) => (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={compareData!} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip trigger="click" formatter={(v) => fmt(Number(v))} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="gastos" fill="#e11d48" name={String(year)} radius={[3, 3, 0, 0]} isAnimationActive={animate} />
                      <Bar
                        dataKey="compareGastos"
                        fill="#fda4af"
                        name={String(compareYear)}
                        radius={[3, 3, 0, 0]}
                        isAnimationActive={animate}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </>
          ) : (
            <ChartCard
              title="Ingresos vs gastos por mes"
              explanation="Si las barras de gastos se acercan o superan a las de ingresos con frecuencia, es la primera señal de alerta."
              height={200}
            >
              {(animate) => (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip trigger="click" formatter={(v) => fmt(Number(v))} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="ingresos" fill="#059669" name="Ingresos" radius={[3, 3, 0, 0]} isAnimationActive={animate} />
                    <Bar dataKey="gastos" fill="#e11d48" name="Gastos" radius={[3, 3, 0, 0]} isAnimationActive={animate} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          )}

          <ChartCard
            title="Ahorro libre consolidado, mes a mes"
            explanation="Tu saldo real acumulado. Si esta línea baja de forma sostenida, estás usando ahorro más rápido de lo que generas."
            height={180}
          >
            {(animate) => (
              <ResponsiveContainer width="100%" height="100%">
                {comparing ? (
                  <LineChart data={compareData!} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip trigger="click" formatter={(v) => fmt(Number(v))} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="acumulado"
                      stroke="#0f766e"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      name={String(year)}
                      isAnimationActive={animate}
                    />
                    <Line
                      type="monotone"
                      dataKey="compareAcumulado"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      name={String(compareYear)}
                      isAnimationActive={animate}
                    />
                  </LineChart>
                ) : (
                  <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip trigger="click" formatter={(v) => fmt(Number(v))} />
                    <Line
                      type="monotone"
                      dataKey="acumulado"
                      stroke="#d97706"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      name="Ahorro libre consolidado"
                      isAnimationActive={animate}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </ChartCard>

          {comparing ? (
            <>
              <ChartCard title={`Gasto fijo ${year} vs ${compareYear}`} explanation="Compara tu gasto fijo mes a mes entre los dos años." height={160}>
                {(animate) => (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={compareData!} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip trigger="click" formatter={(v) => fmt(Number(v))} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="fixedOrdinario" fill="#64748b" name={String(year)} radius={[3, 3, 0, 0]} isAnimationActive={animate} />
                      <Bar
                        dataKey="compareFixedOrdinario"
                        fill="#cbd5e1"
                        name={String(compareYear)}
                        radius={[3, 3, 0, 0]}
                        isAnimationActive={animate}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <ChartCard
                title={`Gasto variable ${year} vs ${compareYear}`}
                explanation="Compara tu gasto variable mes a mes entre los dos años."
                height={160}
              >
                {(animate) => (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={compareData!} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip trigger="click" formatter={(v) => fmt(Number(v))} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="variableOrdinario" fill="#fb7185" name={String(year)} radius={[3, 3, 0, 0]} isAnimationActive={animate} />
                      <Bar
                        dataKey="compareVariableOrdinario"
                        fill="#fecdd3"
                        name={String(compareYear)}
                        radius={[3, 3, 0, 0]}
                        isAnimationActive={animate}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </>
          ) : (
            <ChartCard
              title="Evolución de gasto fijo vs variable"
              explanation="Si el variable crece de forma sostenida mientras el fijo no se mueve, suele ser la señal más temprana de descontrol."
              height={200}
            >
              {(animate) => (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip trigger="click" formatter={(v) => fmt(Number(v))} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="fixedOrdinario" fill="#64748b" name="Gasto fijo" radius={[3, 3, 0, 0]} isAnimationActive={animate} />
                    <Bar dataKey="variableOrdinario" fill="#fb7185" name="Gasto variable" radius={[3, 3, 0, 0]} isAnimationActive={animate} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          )}

          <ChartCard title="Cumplimiento de presupuesto de variable" explanation="En cuántos meses te has mantenido dentro del presupuesto general de gasto variable.">
            {() => (
              <BudgetComplianceChart data={data} variableBudget={variableBudget} year={year} compareYear={compareYear} compareData={compareData} />
            )}
          </ChartCard>

          {comparing ? (
            <>
              {assetDonutData.length > 0 && (
                <ChartCard
                  title={`Inversión por activo — ${year}`}
                  explanation="Cómo se reparte lo que has invertido este año entre tus distintos activos."
                >
                  {(animate) => <AssetDonut data={assetDonutData} total={totalInversion} animate={animate} />}
                </ChartCard>
              )}
              {compareAssetDonutData.length > 0 && (
                <ChartCard
                  title={`Inversión por activo — ${compareYear}`}
                  explanation={`Cómo se repartió lo invertido en ${compareYear} entre tus distintos activos.`}
                >
                  {(animate) => <AssetDonut data={compareAssetDonutData} total={compareTotalInversion} animate={animate} />}
                </ChartCard>
              )}
            </>
          ) : (
            assetDonutData.length > 0 && (
              <ChartCard title="Inversión por activo" explanation="Cómo se reparte lo que has invertido este año entre tus distintos activos.">
                {(animate) => <AssetDonut data={assetDonutData} total={totalInversion} animate={animate} />}
              </ChartCard>
            )
          )}
        </div>
      )}
    </div>
  );
}
