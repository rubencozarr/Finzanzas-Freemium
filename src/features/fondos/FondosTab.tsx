import { useState } from "react";
import { Check, Crown, Info, Pencil, Plus, Target, Trash2, X } from "lucide-react";
import { MonthSwitcher } from "../../components/MonthSwitcher";
import { PremiumGate } from "../../components/PremiumGate";
import { CategoryOverviewDonut, type DonutDatum } from "../../components/CategoryOverviewDonut";
import { GroupHeader } from "../../components/GroupHeader";
import { ALL_FUND_ICONS, DEFAULT_FUND_ICON, FREE_MAX_FUNDS, MONTHS_FULL, PREMIUM_FUND_ICONS } from "../../lib/constants";
import { fundAvgNetContribution } from "../../lib/calculations";
import { fundIconComponent } from "../../lib/fundIcons";
import { usePersistentState } from "../../lib/persistentState";
import { firstOfNextMonthISO, fmt, formatMonthYear, monthKey } from "../../lib/format";
import type { AssetWithTotal, FundWithBalance, Transaction } from "../../types";

// Paletas locales para los donuts de esta pestaña. La de inversión duplica deliberadamente los mismos
// tonos índigo que ASSET_COLORS en ChartsSection.tsx (coherencia visual con Anual) en vez de importarla,
// para no acoplar dos features no relacionadas.
const FUND_DONUT_COLORS = ["#0d9488", "#14b8a6", "#2dd4bf", "#5eead4", "#0f766e", "#134e4a"];
const FONDOS_ASSET_COLORS = ["#818cf8", "#a78bfa", "#c4b5fd", "#6366f1", "#4f46e5"];
const PREMIUM_ICON_SET = new Set<string>(PREMIUM_FUND_ICONS);

interface FondosTabProps {
  isPremium: boolean;
  canCreateFund: (currentCount: number) => boolean;
  canNavigateToMonth: (monthDate: Date) => boolean;
  funds: FundWithBalance[];
  transactions: Transaction[];
  addFund: (name: string, icon?: string | null) => void;
  renameFund: (id: string, name: string) => void;
  deleteFund: (fund: FundWithBalance) => void;
  updateFundGoal: (id: string, amount: number | null) => void;
  updateFundActive: (id: string, active: boolean) => void;
  updateFundIcon: (id: string, icon: string) => void;
  assets: AssetWithTotal[];
  selectedMonthKey: string;
  currentMonthKey: string;
  fundsBalanceHasta: (mKey: string) => FundWithBalance[];
  assetsHasta: (mKey: string) => AssetWithTotal[];
  ahorroLibreHasta: (mKey: string) => number;
  ahorroLibreDisponibleParaMes: (mKey: string) => number;
  monthIdx: number;
  year: number;
  changeMonth: (delta: number) => void;
  changeYear: (delta: number) => void;
  goToMonthIndex: (m: number) => void;
  getAhorroReal: (year: number, monthIdx: number) => number;
  onQuickMove: (fund: FundWithBalance, type: "aportacion" | "retiro") => void;
  onQuickInvest: (asset: AssetWithTotal) => void;
  onGoToAjustes: () => void;
}

// Corona junto al nombre del fondo cuando está activo y la selección ya quedó fijada este mes (mismo
// patrón visual/interacción que PremiumHintBadge en MonthlyInsights.tsx: toca para abrir/cerrar el
// tooltip, no se cierra solo al tocar fuera).
function FundLockBadge({ lockedUntil }: { lockedUntil: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex shrink-0">
      <button onClick={() => setOpen((o) => !o)} className="text-amber-500 hover:text-amber-600">
        <Crown size={13} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-10 w-48 bg-slate-800 text-white text-[11px] rounded-lg px-2.5 py-2 shadow-lg">
          Tu selección está fijada hasta {formatMonthYear(lockedUntil)}. Con Premium puedes aportar a todos tus fondos sin
          límite.
        </div>
      )}
    </span>
  );
}

// Explica qué es "Consolidado" en la tarjeta de Patrimonio. Mismo patrón que FundLockBadge, pero con
// tooltip claro (bg-white) en vez de oscuro: esta tarjeta ya tiene fondo bg-slate-800, así que un
// tooltip también oscuro se confundiría con el fondo.
function ConsolidadoInfoBadge() {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex shrink-0">
      <button onClick={() => setOpen((o) => !o)} className="text-stone-400 hover:text-stone-200">
        <Info size={11} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-10 w-52 bg-white text-slate-700 text-[11px] rounded-lg px-2.5 py-2 shadow-lg">
          Es la suma de lo que te ha sobrado sin usar en meses anteriores. Dinero ya cerrado que puedes gastar marcando "pagado
          con ahorro".
        </div>
      )}
    </span>
  );
}

// Rejilla de selección de icono para crear/editar un fondo. Los iconos premium se muestran atenuados
// con una corona; tocarlos sin ser premium no selecciona nada y abre un tooltip breve, igual que el
// resto de tooltips de esta pestaña.
function FundIconPicker({ value, onChange, isPremium }: { value: string; onChange: (icon: string) => void; isPremium: boolean }) {
  const [hint, setHint] = useState<string | null>(null);
  return (
    <div className="grid grid-cols-6 gap-1.5 mb-3">
      {ALL_FUND_ICONS.map((icon) => {
        const locked = !isPremium && PREMIUM_ICON_SET.has(icon);
        const selected = value === icon;
        const Icon = fundIconComponent(icon);
        return (
          <div key={icon} className="relative">
            <button
              type="button"
              onClick={() => {
                if (locked) {
                  if (!selected) setHint((h) => (h === icon ? null : icon));
                  return;
                }
                onChange(icon);
                setHint(null);
              }}
              className={`w-full min-h-[44px] flex items-center justify-center rounded-lg border ${
                selected ? "bg-teal-50 border-teal-400 text-teal-700" : locked ? "border-stone-200 text-stone-300" : "border-stone-200 text-stone-700"
              }`}
            >
              <Icon size={20} />
            </button>
            {locked && <Crown size={10} className="absolute bottom-0.5 right-0.5 text-amber-500" />}
            {hint === icon && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-10 w-32 bg-slate-800 text-white text-[11px] rounded-lg px-2 py-1.5 shadow-lg text-center">
                Disponible con Premium
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FondosTab({
  isPremium,
  canCreateFund,
  canNavigateToMonth,
  funds,
  transactions,
  addFund,
  renameFund,
  deleteFund,
  updateFundGoal,
  updateFundActive,
  updateFundIcon,
  assets,
  selectedMonthKey,
  currentMonthKey,
  fundsBalanceHasta,
  assetsHasta,
  ahorroLibreHasta,
  ahorroLibreDisponibleParaMes,
  monthIdx,
  year,
  changeMonth,
  changeYear,
  goToMonthIndex,
  getAhorroReal,
  onQuickMove,
  onQuickInvest,
  onGoToAjustes,
}: FondosTabProps) {
  const [newName, setNewName] = useState("");
  const [newFundIcon, setNewFundIcon] = useState<string>(DEFAULT_FUND_ICON);
  const [creatingFund, setCreatingFund] = useState(false);
  const [editingFundId, setEditingFundId] = useState<string | null>(null);
  const [editFundName, setEditFundName] = useState("");
  const [editFundIcon, setEditFundIcon] = useState<string>(DEFAULT_FUND_ICON);
  const [deleteConfirmFund, setDeleteConfirmFund] = useState<FundWithBalance | null>(null);
  const [editingGoalFundId, setEditingGoalFundId] = useState<string | null>(null);
  const [goalAmountInput, setGoalAmountInput] = useState("");
  // Con pocos fondos/activos, un desplegable solo añade un toque extra sin beneficio (y un donut de un
  // solo segmento tampoco aporta nada); con varios, ordena la pantalla y da una vista general rápida.
  const [fundsExpanded, setFundsExpanded] = usePersistentState("fondos.fundsExpanded", false);
  const [assetsExpanded, setAssetsExpanded] = usePersistentState("fondos.assetsExpanded", false);
  const showFundsCollapse = funds.length > 2;
  const showAssetsCollapse = assets.length > 2;

  // Downgrade/importación: un free con más de 2 fondos puede ver y retirar de todos, pero solo aportar
  // a los que marque como "activos" (máx. FREE_MAX_FUNDS). Con ≤2 fondos (el caso normal en free, ya
  // que no se puede crear un 3º) esto no aparece: todos sus fondos son utilizables sin más.
  const showActiveToggle = !isPremium && funds.length > FREE_MAX_FUNDS;
  const activeCount = funds.filter((f) => f.isActive).length;
  // El bloqueo es por fondo, no global: un fondo activo al que ya se ha aportado este mes no se puede
  // desactivar, pero el otro hueco (si no se ha usado todavía) sigue libre para activar/desactivar.
  // Así se evita seguir rotando fondos ya usados sin bloquear el resto de la selección disponible.
  const fundContributedThisMonth = (fundId: string) =>
    transactions.some((t) => t.type === "aportacion" && t.fundId === fundId && monthKey(t.date) === currentMonthKey);

  const isCurrentMonth = selectedMonthKey === currentMonthKey;
  const isHistorical = selectedMonthKey < currentMonthKey;

  // Calcular todo "a fecha de" el mes seleccionado
  const fundsAtDate = fundsBalanceHasta(selectedMonthKey);
  const assetsAtDate = assetsHasta(selectedMonthKey);
  const totalFondosAtDate = fundsAtDate.reduce((s, f) => s + f.balance, 0);
  const totalInvertidoAtDate = assetsAtDate.reduce((s, a) => s + a.invertido, 0);
  const ahorroLibreAtDate = ahorroLibreHasta(selectedMonthKey);
  const consolidado = ahorroLibreDisponibleParaMes(selectedMonthKey);
  // "En curso" es el flujo propio de ESTE mes (ingresos - gastos ordinarios - aportaciones - inversión),
  // igual que ahorroReal de computeMonth (ya usado por Mensual y por los puntos de color de
  // MonthSwitcher) — NO la resta ahorroLibreAtDate - consolidado: esa resta también arrastraba los
  // gastos "pagados con ahorro consolidado" de este mes, cuando en realidad esos gastos tiran del
  // consolidado ya acumulado en meses anteriores, no del flujo que este mes está generando. Con la
  // resta antigua, un gasto así desaparecía sin rastro: bajaba "en curso" pero el consolidado del mes
  // siguiente no reflejaba ese descuento (los dos números salían de la misma cuenta, así que el efecto
  // se cancelaba).
  const enCurso = getAhorroReal(year, monthIdx);
  const totalAhorro = ahorroLibreAtDate + totalFondosAtDate;
  const patrimonioTotal = totalAhorro + totalInvertidoAtDate;

  const mesLabel = isCurrentMonth
    ? "actual"
    : MONTHS_FULL[parseInt(selectedMonthKey.split("-")[1]) - 1] + " " + selectedMonthKey.split("-")[0];
  // A diferencia de mesLabel (que dice "actual"), este texto siempre lleva el nombre del mes,
  // incluido el mes en curso, para el rótulo "Inversión hasta [mes]".
  const mesLabelSiempre = `${MONTHS_FULL[parseInt(selectedMonthKey.split("-")[1]) - 1]} ${selectedMonthKey.split("-")[0]}`;
  const enCursoLabel = isCurrentMonth ? "En curso (este mes)" : `Generado en ${MONTHS_FULL[parseInt(selectedMonthKey.split("-")[1]) - 1]}`;

  const doDeleteFund = () => {
    if (!deleteConfirmFund) return;
    deleteFund(deleteConfirmFund);
    setDeleteConfirmFund(null);
  };

  return (
    <div>
      <MonthSwitcher
        isPremium={isPremium}
        canNavigateToMonth={canNavigateToMonth}
        monthIdx={monthIdx}
        year={year}
        changeMonth={changeMonth}
        changeYear={changeYear}
        goToMonthIndex={goToMonthIndex}
        getAhorroReal={getAhorroReal}
      />

      {isHistorical && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-2 mb-3">Estás viendo datos históricos a cierre de {mesLabel}.</p>
      )}

      <div className={`bg-slate-800 text-stone-50 rounded-lg px-4 py-3 mb-5 ${isHistorical ? "border-2 border-dashed border-slate-500" : ""}`}>
        <p className="text-xs text-stone-300">Patrimonio total{isHistorical ? ` a cierre de ${mesLabel}` : ""}</p>
        <p className="font-mono text-2xl mt-0.5">{fmt(patrimonioTotal)}</p>
        <p className="text-xs text-stone-400 mt-1">Ahorro e inversión son cosas distintas: el ahorro no arriesga valor, la inversión sí.</p>
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-600">
          <div>
            <p className="text-xs text-stone-400">Ahorro (libre + fondos)</p>
            <p className="font-mono text-lg text-teal-400">{fmt(totalAhorro)}</p>
            <div className="text-[11px] mt-2 space-y-1.5">
              <div>
                <p className="text-stone-400 flex items-center gap-1">
                  Consolidado
                  <ConsolidadoInfoBadge />
                </p>
                <p className="font-mono text-stone-50 text-xs">{fmt(consolidado)}</p>
              </div>
              <div>
                <p className="text-stone-400">{enCursoLabel}</p>
                <p className="font-mono text-stone-50 text-xs">{fmt(enCurso)}</p>
              </div>
              <div>
                <p className="text-stone-400">Fondos</p>
                <p className="font-mono text-stone-50 text-xs">{fmt(totalFondosAtDate)}</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs text-stone-400">Inversión hasta {mesLabelSiempre}</p>
            <p className="font-mono text-lg text-indigo-400">{fmt(totalInvertidoAtDate)}</p>
            <p className="text-[11px] text-stone-400 mt-1">Sujeta a que suba o baje de valor</p>
          </div>
        </div>
      </div>

      <p className="text-sm font-semibold mb-2">Fondos de ahorro</p>
      {canCreateFund(funds.length) ? (
        <div className="mb-4">
          <div className="flex gap-2 mb-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onFocus={() => setCreatingFund(true)}
              placeholder="Nombre del fondo (ej. Viajes)"
              className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-base bg-white"
            />
            <button
              onClick={() => {
                if (newName.trim()) {
                  addFund(newName.trim(), newFundIcon);
                  setNewName("");
                  setNewFundIcon(DEFAULT_FUND_ICON);
                  setCreatingFund(false);
                }
              }}
              className="bg-slate-800 text-white rounded-lg px-3 text-sm"
            >
              <Plus size={16} />
            </button>
            {creatingFund && (
              <button
                onClick={() => {
                  setNewName("");
                  setNewFundIcon(DEFAULT_FUND_ICON);
                  setCreatingFund(false);
                }}
                className="text-stone-400 px-1"
              >
                <X size={18} />
              </button>
            )}
          </div>
          {creatingFund && <FundIconPicker value={newFundIcon} onChange={setNewFundIcon} isPremium={isPremium} />}
        </div>
      ) : (
        <div className="mb-4">
          <PremiumGate message="Con Premium puedes crear fondos ilimitados y poner metas de ahorro" />
        </div>
      )}
      {showActiveToggle && (
        <div className="mb-3">
          <p className="text-xs text-stone-400">
            Elige tus {FREE_MAX_FUNDS} fondos activos para aportaciones. Una vez hagas la primera aportación del mes, la
            selección se mantendrá hasta el mes siguiente.
          </p>
        </div>
      )}
      {(() => {
        const withBalance = fundsAtDate.filter((f) => f.balance > 0);
        if (withBalance.length < 2) return null;
        const fundDonutData: DonutDatum[] = withBalance.map((f, i) => ({
          name: f.name,
          value: f.balance,
          color: FUND_DONUT_COLORS[i % FUND_DONUT_COLORS.length],
        }));
        return <CategoryOverviewDonut data={fundDonutData} title="Distribución de tus fondos de ahorro" ingresos={0} />;
      })()}
      {showFundsCollapse && (
        <GroupHeader
          title={`Mis fondos (${funds.length})`}
          total={totalFondosAtDate}
          tone="fondos"
          expanded={fundsExpanded}
          onToggle={() => setFundsExpanded((e) => !e)}
        />
      )}
      {(!showFundsCollapse || fundsExpanded) && (
      <div className="space-y-3 mb-2">
        {funds.length === 0 && <p className="text-stone-400 text-sm text-center py-6">Todavía no tienes fondos creados.</p>}
        {fundsAtDate.map((f) => {
          const fundLocked = showActiveToggle && f.isActive && fundContributedThisMonth(f.id);
          return (
          <div key={f.id} className="bg-white rounded-lg border border-stone-100 px-3 py-3">
            {editingFundId === f.id ? (
              <div className="mb-2">
                <div className="flex gap-2 mb-2">
                  <input
                    value={editFundName}
                    onChange={(e) => setEditFundName(e.target.value)}
                    className="flex-1 border border-stone-200 rounded-md px-2 py-1 text-base"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      renameFund(f.id, editFundName);
                      updateFundIcon(f.id, editFundIcon);
                      setEditingFundId(null);
                    }}
                    className="text-teal-700"
                  >
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingFundId(null)} className="text-stone-400">
                    <X size={16} />
                  </button>
                </div>
                <FundIconPicker value={editFundIcon} onChange={setEditFundIcon} isPremium={isPremium} />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  {(() => {
                    const Icon = fundIconComponent(f.icon);
                    return <Icon size={24} className="text-teal-600 shrink-0" />;
                  })()}
                  <span className="flex items-center gap-1 min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">{f.name}</span>
                    {fundLocked && <FundLockBadge lockedUntil={firstOfNextMonthISO()} />}
                  </span>
                </div>
                {(!isPremium || f.goalAmount == null) && <p className="font-mono text-2xl text-teal-700 mb-2">{fmt(f.balance)}</p>}
              </>
            )}
            {showActiveToggle && (
              <button
                onClick={() => updateFundActive(f.id, !f.isActive)}
                disabled={fundLocked || (!f.isActive && activeCount >= FREE_MAX_FUNDS)}
                className={`text-[11px] px-2 py-0.5 rounded-full border mb-2 ${
                  f.isActive
                    ? "bg-teal-50 text-teal-700 border-teal-200"
                    : activeCount >= FREE_MAX_FUNDS
                      ? "text-stone-300 border-stone-100"
                      : "text-stone-400 border-stone-200"
                } ${fundLocked ? "opacity-50" : ""}`}
              >
                {f.isActive ? "Fondo activo ✓" : "Marcar como activo"}
              </button>
            )}
            {isPremium &&
              (editingGoalFundId === f.id ? (
                <div className="flex items-center gap-1.5 mb-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={goalAmountInput}
                    onChange={(e) => setGoalAmountInput(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="Importe meta (€)"
                    className="flex-1 border border-stone-200 rounded-md px-2 py-1 text-base font-mono"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      const amount = parseFloat(goalAmountInput);
                      if (amount > 0) updateFundGoal(f.id, amount);
                      setEditingGoalFundId(null);
                    }}
                    className="text-emerald-700 shrink-0"
                  >
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingGoalFundId(null)} className="text-stone-400 shrink-0">
                    <X size={16} />
                  </button>
                  {f.goalAmount != null && (
                    <button
                      onClick={() => {
                        updateFundGoal(f.id, null);
                        setEditingGoalFundId(null);
                      }}
                      className="text-stone-300 hover:text-rose-600 shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ) : f.goalAmount == null ? (
                <button
                  onClick={() => {
                    setEditingGoalFundId(f.id);
                    setGoalAmountInput("");
                  }}
                  className="flex items-center gap-1 text-xs text-stone-400 hover:text-emerald-700 hover:border-emerald-300 border border-dashed border-stone-200 rounded-md px-2 py-1 mb-2"
                >
                  <Target size={12} />
                  Poner meta de ahorro
                </button>
              ) : (
                (() => {
                  const reached = f.balance >= f.goalAmount!;
                  const pct = Math.min(100, (f.balance / f.goalAmount!) * 100);
                  const avgNet = fundAvgNetContribution(transactions, f.id, 3);
                  const monthsToGoal = avgNet > 0 ? Math.ceil((f.goalAmount! - f.balance) / avgNet) : null;
                  return (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                          {reached && <Check size={14} className="text-emerald-600" />}
                          {fmt(f.balance)} de {fmt(f.goalAmount!)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="font-mono text-sm text-emerald-700">{pct.toFixed(0)}%</span>
                          <button
                            onClick={() => {
                              setEditingGoalFundId(f.id);
                              setGoalAmountInput(String(f.goalAmount));
                            }}
                            className="text-stone-300 hover:text-slate-700"
                          >
                            <Pencil size={11} />
                          </button>
                        </span>
                      </div>
                      <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                        <div className={`h-full ${reached ? "bg-emerald-500" : "bg-emerald-400"}`} style={{ width: `${pct}%` }} />
                      </div>
                      {!reached && (
                        <p className="text-[11px] text-stone-400 mt-1">
                          A este ritmo lo alcanzas en {monthsToGoal != null ? `${monthsToGoal} mes${monthsToGoal === 1 ? "" : "es"}` : "—"}
                        </p>
                      )}
                    </div>
                  );
                })()
              ))}
            {(() => {
              const canContribute = isPremium || funds.length <= FREE_MAX_FUNDS || !!f.isActive;
              return (
                <>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onQuickMove(f, "aportacion")}
                      disabled={!canContribute}
                      className={`flex-1 text-xs rounded-md px-2.5 py-1.5 ${canContribute ? "bg-teal-50 text-teal-800" : "bg-stone-100 text-stone-300"}`}
                    >
                      Aportar
                    </button>
                    <button onClick={() => onQuickMove(f, "retiro")} className="flex-1 text-xs bg-amber-50 text-amber-800 rounded-md px-2.5 py-1.5">
                      Retirar
                    </button>
                    <button
                      onClick={() => {
                        setEditingFundId(f.id);
                        setEditFundName(f.name);
                        setEditFundIcon(f.icon ?? DEFAULT_FUND_ICON);
                      }}
                      className="text-stone-300 hover:text-slate-700"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (f.balance === 0) deleteFund(f);
                        else setDeleteConfirmFund(f);
                      }}
                      className="text-stone-300 hover:text-rose-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {!canContribute && <p className="text-[11px] text-stone-400 mt-1.5">Selecciona este fondo como activo para aportar</p>}
                </>
              );
            })()}
          </div>
          );
        })}
      </div>
      )}
      <p className="text-xs text-stone-400 mb-6">Si un gasto lo pagas con dinero de un fondo, márcalo como "pagado con ahorro" al crear ese gasto.</p>

      <p className="text-sm font-semibold mb-2">Inversión hasta {mesLabelSiempre}</p>
      {isPremium ? (
        <>
          <p className="text-xs text-stone-400 mb-3">
            Gestiona tus activos en{" "}
            <button onClick={onGoToAjustes} className="underline text-indigo-700">
              Ajustes → Inversión
            </button>
            .
          </p>
          {(() => {
            const conInversion = assetsAtDate.filter((a) => a.invertido > 0);
            if (conInversion.length < 2) return null;
            const assetDonutData: DonutDatum[] = conInversion.map((a, i) => ({
              name: a.name,
              value: a.invertido,
              color: FONDOS_ASSET_COLORS[i % FONDOS_ASSET_COLORS.length],
            }));
            const withPct = conInversion.map((a) => ({
              name: a.name,
              real: totalInvertidoAtDate ? (a.invertido / totalInvertidoAtDate) * 100 : 0,
              target: a.pct,
            }));
            const maxDiff = Math.max(...withPct.map((a) => Math.abs(a.real - a.target)));
            const matches = maxDiff < 2;
            return (
              <>
                <CategoryOverviewDonut data={assetDonutData} title="Distribución de tu inversión" ingresos={0} />
                {matches ? (
                  <p className="flex items-center gap-1.5 text-xs text-emerald-700 mb-3">
                    <Check size={14} /> Tu inversión real coincide con tu objetivo configurado
                  </p>
                ) : (
                  <p className="text-xs text-teal-700 mb-3">
                    Objetivo: {withPct.map((a) => `${a.name} ${a.target.toFixed(0)}%`).join(" / ")} — Real:{" "}
                    {withPct.map((a) => `${a.name} ${a.real.toFixed(0)}%`).join(" / ")}
                  </p>
                )}
              </>
            );
          })()}
          {showAssetsCollapse && (
            <GroupHeader
              title={`Mis activos (${assets.length})`}
              total={totalInvertidoAtDate}
              tone="inversion"
              expanded={assetsExpanded}
              onToggle={() => setAssetsExpanded((e) => !e)}
            />
          )}
          {(!showAssetsCollapse || assetsExpanded) && (
          <div className="space-y-3">
            {assets.length === 0 && (
              <p className="text-stone-400 text-sm text-center py-6">Todavía no tienes activos. Configúralos en Ajustes → Inversión.</p>
            )}
            {assetsAtDate.map((a) => {
              const pct = totalInvertidoAtDate ? (a.invertido / totalInvertidoAtDate) * 100 : 0;
              return (
                <div key={a.id} className="bg-white rounded-lg border border-stone-100 px-3 py-3">
                  <div className="flex justify-between items-baseline gap-2 mb-1">
                    <span className="text-sm font-medium min-w-0 truncate">{a.name}</span>
                    <span className="font-mono text-sm text-indigo-700 shrink-0">
                      {fmt(a.invertido)} · {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-indigo-400" style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                  <button onClick={() => onQuickInvest(a)} className="w-full text-xs bg-indigo-50 text-indigo-800 rounded-md px-2.5 py-1.5">
                    Invertir
                  </button>
                </div>
              );
            })}
          </div>
          )}
        </>
      ) : (
        <PremiumGate message="Gestiona tus activos y reparto de inversión con Premium" />
      )}

      {deleteConfirmFund && (
        <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-20" onClick={() => setDeleteConfirmFund(null)}>
          <div className="bg-white rounded-t-2xl w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
            <p className="font-serif text-base mb-2">¿Eliminar "{deleteConfirmFund.name}"?</p>
            <p className="text-sm text-stone-600 mb-4">
              Se devolverá el saldo de {fmt(deleteConfirmFund.balance)} a tu ahorro libre. Esta acción no se puede deshacer.
            </p>
            <button onClick={doDeleteFund} className="w-full bg-rose-600 text-white rounded-lg py-2.5 text-sm font-medium mb-2">
              Sí, eliminar
            </button>
            <button
              onClick={() => setDeleteConfirmFund(null)}
              className="w-full border border-stone-200 text-stone-600 rounded-lg py-2.5 text-sm font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
