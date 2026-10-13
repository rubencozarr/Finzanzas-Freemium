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
import { IncomeSourceBreakdownList, type IncomeSourceSubgroup } from "./IncomeSourceBreakdownList";
import { fmt, round2 } from "../lib/format";
import { RESERVED_INCOME_SOURCE_NAME } from "../lib/calculations";
import type { AssetYearBreakdown, IncomeSourceBreakdown, YearComparisonPoint, YearMonthData } from "../lib/calculations";

const ASSET_COLORS = ["#818cf8", "#a78bfa", "#c4b5fd", "#6366f1", "#4f46e5"];
// Mismo rojo que MonthSwitcher usa para el punto de ahorro real negativo (bg-rose-500) — se reutiliza
// aquí para que "mes en negativo" se lea con el mismo color en toda la app.
const NEGATIVE_COLOR = "#f43f5e";

// Paleta categórica propia para el donut de ingresos por fuente (distinta de ASSET_COLORS, que sigue
// siendo solo para "Inversión por activo"): validada con la skill de dataviz (6 checks: banda de
// luminosidad, suelo de croma, separación CVD, suelo de visión normal, contraste — ver
// node scripts/validate_palette.js). Sin verde (ya lo "ocupan" los subgrupos fijos/extra de
// IncomeSourceBreakdownList) y sin rojo (en la app rosa/rojo siempre significa gasto, nunca debe
// etiquetar un ingreso). "aqua" se queda a pesar de ser verde-azulado: sin ella en esa posición ningún
// orden de los colores restantes supera el suelo de visión normal (comprobado), y es claramente más
// turquesa que el verde esmeralda de los subgrupos, así que no se confunden entre sí.
const INCOME_SOURCE_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#6250d6", "#92400e"];
// Más de 7 fuentes individuales: a partir de la 8ª se agrupan en una única porción gris ("Otras
// fuentes"), en vez de repetir colores de la paleta (que ya no distinguirían nada) o generar tonos
// nuevos sin validar. "Sin clasificar" nunca entra en este recuento ni consume un color de la paleta:
// siempre es la MISMA porción gris, resuelta aparte.
const MAX_INCOME_SOURCE_COLORS = 7;
const OTRAS_FUENTES_COLOR = "#d6d3d1"; // stone-300, gris claro
const SIN_CLASIFICAR_COLOR = "#a8a29e"; // stone-400, gris algo más oscuro para distinguirlo de "Otras fuentes"

// Recharts no soporta un stroke distinto por tramo en <Line>, así que el punto se colorea con un dot
// personalizado y el trazo con un <linearGradient> que lleva un stop por mes (mismo color que su punto):
// el gradiente es sobre la bounding box del propio trazo (primer punto = offset 0, último = offset 1),
// y como los meses están igualmente espaciados en el eje categórico, cada stop cae justo sobre su punto.
function TasaAhorroDot(props: { cx?: number; cy?: number; index?: number; value?: number }) {
  const { cx, cy, index, value } = props;
  if (cx == null || cy == null) return <g key={`dot-${index}`} />;
  const negative = round2(value ?? 0) < 0;
  return <circle key={`dot-${index}`} cx={cx} cy={cy} r={2} fill={negative ? NEGATIVE_COLOR : "#0f766e"} />;
}

function tasaAhorroGradientStops(values: number[]) {
  const n = values.length;
  if (n <= 1) return [{ offset: 0, color: round2(values[0] ?? 0) < 0 ? NEGATIVE_COLOR : "#0f766e" }];
  return values.map((v, i) => ({ offset: i / (n - 1), color: round2(v) < 0 ? NEGATIVE_COLOR : "#0f766e" }));
}

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
  incomeSourceBreakdown: IncomeSourceBreakdown[];
  incomeSourceSubgroups: IncomeSourceSubgroup[];
  totalIngresos: number;
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
  incomeSourceBreakdown,
  incomeSourceSubgroups,
  totalIngresos,
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
  // "Sin clasificar" (si existe, siempre al final por construcción de groupIncomeBySource) nunca
  // consume un color de la paleta: se separa primero y se añade ella sola, en gris, al final de todo.
  // Del resto (fuentes reales, ya ordenadas de mayor a menor), solo las primeras MAX_INCOME_SOURCE_COLORS
  // reciben un color propio; a partir de ahí se agregan en una única porción "Otras fuentes" — así la
  // lista de debajo (IncomeSourceBreakdownList) puede seguir mostrando cada fuente individual sin límite,
  // mientras el donut no intenta repartir más colores de los que la paleta puede distinguir.
  const sinClasificarEntry = incomeSourceBreakdown.find(
    (s) => s.id === null && s.name === RESERVED_INCOME_SOURCE_NAME,
  );
  const namedSources = incomeSourceBreakdown.filter((s) => s !== sinClasificarEntry);
  const coloredSources = namedSources.slice(0, MAX_INCOME_SOURCE_COLORS);
  const overflowSources = namedSources.slice(MAX_INCOME_SOURCE_COLORS);
  const overflowTotal = overflowSources.reduce((s, b) => s + b.total, 0);
  const incomeSourceDonutData: AssetDonutDatum[] = [
    ...coloredSources.map((s, i) => ({ name: s.name, value: s.total, color: INCOME_SOURCE_COLORS[i] })),
    ...(overflowTotal > 0 ? [{ name: "Otras fuentes", value: overflowTotal, color: OTRAS_FUENTES_COLOR }] : []),
    ...(sinClasificarEntry && sinClasificarEntry.total > 0
      ? [{ name: sinClasificarEntry.name, value: sinClasificarEntry.total, color: SIN_CLASIFICAR_COLOR }]
      : []),
  ];

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
          {/* Primer gráfico de la sección: "de dónde viene tu dinero" es la pregunta más directa antes
              de entrar en tendencias/gastos. Al comparar dos años no tiene sentido (las fuentes no se
              reparten "por año" de forma comparable como sí lo hacen barras/líneas mes a mes), así que
              se sustituye por un aviso breve en vez de desaparecer sin explicación. */}
          {comparing ? (
            <p className="text-xs text-stone-500 bg-stone-100 rounded-lg px-3 py-2.5 mb-4">
              El desglose de ingresos por fuente no está disponible comparando dos años. Quita la comparación para verlo.
            </p>
          ) : (
            incomeSourceBreakdown.length > 0 && (
              <ChartCard
                title={`Ingresos por fuente en ${year}`}
                explanation="Cómo se reparte el dinero que has ingresado este año según su origen. Te ayuda a ver de dónde viene tu dinero y si dependes demasiado de una sola fuente."
              >
                {(animate) => (
                  <div>
                    <AssetDonut data={incomeSourceDonutData} total={totalIngresos} animate={animate} />
                    <div className="mt-3 pt-3 border-t border-stone-100">
                      <IncomeSourceBreakdownList total={totalIngresos} subgroups={incomeSourceSubgroups} />
                    </div>
                  </div>
                )}
              </ChartCard>
            )
          )}

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
                    <defs>
                      <linearGradient id="tasaAhorroStroke" x1="0" y1="0" x2="1" y2="0">
                        {tasaAhorroGradientStops(data.map((d) => d.tasaAhorro)).map((s) => (
                          <stop key={s.offset} offset={s.offset} stopColor={s.color} />
                        ))}
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip trigger="click" formatter={(v) => `${Number(v).toFixed(0)}%`} />
                    <ReferenceLine y={0} stroke="#c3c2b7" />
                    <Line
                      type="monotone"
                      dataKey="tasaAhorro"
                      stroke="url(#tasaAhorroStroke)"
                      strokeWidth={2}
                      dot={TasaAhorroDot}
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
            title={`Ahorro libre acumulado en ${year}`}
            explanation="Suma progresiva de tu ahorro libre este año. Te ayuda a ver si tu ahorro va mejorando con el tiempo o se está estancando."
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
                    <ReferenceLine y={0} stroke="#c3c2b7" />
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
                    <ReferenceLine y={0} stroke="#c3c2b7" />
                    <Line
                      type="monotone"
                      dataKey="acumulado"
                      stroke="#d97706"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      name="Ahorro libre generado"
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
              explanation="Cómo evolucionan tus gastos fijos y variables. El variable depende de ti: si crece, ahí tienes margen para actuar."
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
                  explanation={`Cómo se reparte tu inversión de ${year} entre activos. Te ayuda a ver si algo está acaparando más de lo que pensabas.`}
                >
                  {(animate) => <AssetDonut data={assetDonutData} total={totalInversion} animate={animate} />}
                </ChartCard>
              )}
              {compareAssetDonutData.length > 0 && (
                <ChartCard
                  title={`Inversión por activo — ${compareYear}`}
                  explanation={`Cómo se repartía tu inversión de ${compareYear} entre activos.`}
                >
                  {(animate) => <AssetDonut data={compareAssetDonutData} total={compareTotalInversion} animate={animate} />}
                </ChartCard>
              )}
            </>
          ) : (
            assetDonutData.length > 0 && (
              <ChartCard title="Inversión por activo" explanation="Cómo se reparte tu inversión entre activos. Te ayuda a ver si algo está acaparando más de lo que pensabas.">
                {(animate) => <AssetDonut data={assetDonutData} total={totalInversion} animate={animate} />}
              </ChartCard>
            )
          )}
        </div>
      )}
    </div>
  );
}
