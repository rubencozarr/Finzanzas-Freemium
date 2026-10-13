import { CalendarCheck, MoreHorizontal, Sparkles, type LucideIcon } from "lucide-react";
import { fmt } from "../lib/format";
import { RESERVED_INCOME_SOURCE_NAME, type IncomeSourceBreakdown } from "../lib/calculations";

export type IncomeSourceSubgroupKind = "fijo" | "extra" | "otros";

export interface IncomeSourceSubgroup {
  kind: IncomeSourceSubgroupKind;
  label: string;
  total: number;
  sources: IncomeSourceBreakdown[];
}

interface SubgroupStyle {
  Icon: LucideIcon;
  // Círculo de 32px de la cabecera de la tarjeta (distinto del icono de la leyenda: ahí el icono va
  // suelto sobre el fondo de la página, no sobre un círculo de color, así que necesita su propio tono).
  iconWrapClass: string;
  iconClass: string;
  legendIconClass: string;
  labelClass: string;
  // Color de las minibarras de sus fuentes (y del segmento que le corresponde en la barra apilada de
  // arriba). "Sin clasificar" nunca usa esto: siempre gris, resuelto aparte en SourceRow.
  barColorClass: string;
}

// Fijos vs. extra NO se distinguen solo por el tono de verde (eso fallaría para quien no distingue
// bien los colores): el icono (Repeat vs. Sparkles), el relleno del círculo (sólido vs. hueco con borde)
// y el peso del texto (emerald-800 vs. emerald-700) son tres señales adicionales, redundantes entre sí.
const SUBGROUP_STYLE: Record<IncomeSourceSubgroupKind, SubgroupStyle> = {
  fijo: {
    Icon: CalendarCheck,
    iconWrapClass: "bg-emerald-600",
    iconClass: "text-white",
    legendIconClass: "text-emerald-600",
    labelClass: "text-emerald-800",
    barColorClass: "bg-emerald-600",
  },
  extra: {
    Icon: Sparkles,
    iconWrapClass: "bg-emerald-100 border border-emerald-200",
    iconClass: "text-emerald-700",
    legendIconClass: "text-emerald-500",
    labelClass: "text-emerald-700",
    barColorClass: "bg-emerald-300",
  },
  otros: {
    Icon: MoreHorizontal,
    iconWrapClass: "bg-stone-200",
    iconClass: "text-stone-500",
    legendIconClass: "text-stone-400",
    labelClass: "text-stone-600",
    barColorClass: "bg-stone-400",
  },
};

const SIN_CLASIFICAR_BAR_CLASS = "bg-stone-300";

/** Redondea cada valor a entero y ajusta el ÚLTIMO por diferencia, para que la suma visible sea
 * siempre exactamente 100 (redondear cada % por separado puede dar 99 o 101 por arrastre de decimales). */
function roundPercentagesTo100(values: number[]): number[] {
  if (values.length === 0) return [];
  const rounded = values.map((v) => Math.round(v));
  const diff = 100 - rounded.reduce((s, v) => s + v, 0);
  rounded[rounded.length - 1] += diff;
  return rounded;
}

/** Barra apilada con un segmento por subgrupo (>0, ya filtrados por el llamador) + leyenda con icono y
 * %. Oculta si solo hay un subgrupo: con uno solo no hay ninguna proporción que mostrar. */
function ProportionBar({ subgroups, total }: { subgroups: IncomeSourceSubgroup[]; total: number }) {
  if (subgroups.length < 2) return null;
  const rawPcts = subgroups.map((g) => (total ? (g.total / total) * 100 : 0));
  const roundedPcts = roundPercentagesTo100(rawPcts);
  return (
    <div className="mb-4">
      <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5 bg-stone-100">
        {subgroups.map((g, i) => (
          <div
            key={g.kind}
            className={`${SUBGROUP_STYLE[g.kind].barColorClass} rounded-full`}
            style={{ width: `${rawPcts[i]}%` }}
          />
        ))}
      </div>
      <p className="flex items-center gap-x-2.5 gap-y-1 flex-wrap mt-1.5 text-xs text-stone-500">
        {subgroups.map((g, i) => {
          const Icon = SUBGROUP_STYLE[g.kind].Icon;
          const shortLabel = g.label.replace(/^Ingresos? /, "");
          return (
            <span key={g.kind} className="flex items-center gap-1">
              <Icon size={11} className={SUBGROUP_STYLE[g.kind].legendIconClass} />
              {shortLabel} {roundedPcts[i]}%
            </span>
          );
        })}
      </p>
    </div>
  );
}

function SourceRow({ source, total, barColorClass }: { source: IncomeSourceBreakdown; total: number; barColorClass: string }) {
  const isSinClasificar = source.id === null && source.name === RESERVED_INCOME_SOURCE_NAME;
  const pct = total ? (source.total / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between items-baseline gap-2">
        <span className={`text-sm truncate min-w-0 flex-1 ${isSinClasificar ? "text-stone-500" : "text-slate-700"}`}>
          {source.name}
        </span>
        <span className="font-mono tabular-nums text-sm shrink-0">{fmt(source.total)}</span>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <div className="flex-1 h-1 rounded-full bg-stone-100 overflow-hidden">
          <div
            className={`h-full rounded-full ${isSinClasificar ? SIN_CLASIFICAR_BAR_CLASS : barColorClass}`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <span className="text-[11px] text-stone-400 shrink-0 w-7 text-right">{pct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

function SubgroupCard({ group, total }: { group: IncomeSourceSubgroup; total: number }) {
  const style = SUBGROUP_STYLE[group.kind];
  const Icon = style.Icon;
  return (
    <div className="bg-white rounded-lg border border-stone-100 p-3">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="flex items-center gap-2 min-w-0">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${style.iconWrapClass}`}>
            <Icon size={15} className={style.iconClass} />
          </span>
          <span className={`text-sm font-medium truncate min-w-0 ${style.labelClass}`}>{group.label}</span>
        </span>
        <span className="font-mono tabular-nums text-sm font-medium text-slate-800 shrink-0">{fmt(group.total)}</span>
      </div>
      <div className="space-y-2.5">
        {group.sources.map((s) => (
          <SourceRow key={s.id ?? s.name} source={s} total={total} barColorClass={style.barColorClass} />
        ))}
      </div>
    </div>
  );
}

interface IncomeSourceBreakdownListProps {
  // Base del % de cada fuente y de cada subgrupo — el total de ingresos del mes/año, NUNCA el subtotal
  // del subgrupo (así "Nómina" dentro de "Ingresos fijos" se lee en relación a todo lo que ingresaste,
  // no solo a lo fijo).
  total: number;
  // Ya filtrados a total > 0 y en orden fijos/extra/otros por el llamador (MensualTab/AnualTab).
  subgroups: IncomeSourceSubgroup[];
}

/** Desglose de ingresos por fuente, agrupado en subgrupos (fijos/extra/otros), compartido entre el
 * bloque plegable de Mensual (IncomeSourceGroup) y el gráfico "Ingresos por fuente" de Anual
 * (ChartsSection), para que el formato sea idéntico en los dos sitios. El % de cada subgrupo en la
 * leyenda de la barra solo aparece ahí (no se repite en la cabecera de su tarjeta, para no acumular
 * porcentajes); el % de cada fuente individual sí se repite junto a su minibarra, porque esa cifra no
 * está en ningún otro sitio. */
export function IncomeSourceBreakdownList({ total, subgroups }: IncomeSourceBreakdownListProps) {
  return (
    <div>
      <ProportionBar subgroups={subgroups} total={total} />
      <div className="space-y-3">
        {subgroups.map((g) => (
          <SubgroupCard key={g.kind} group={g} total={total} />
        ))}
      </div>
    </div>
  );
}
