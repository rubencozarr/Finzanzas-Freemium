import { useMemo, useState } from "react";
import { Check, Pencil, Plus, Repeat, Search, Trash2 } from "lucide-react";
import { Chip } from "../../components/Chip";
import { StatCard } from "../../components/StatCard";
import { MonthSwitcher } from "../../components/MonthSwitcher";
import {
  isOrphanGasto,
  isOrphanSubcategory,
  mergeSplitDisplay,
  resolveCategoryName,
  resolveSubcategoryName,
  type DisplayTransactionItem,
  type MonthStats,
} from "../../lib/calculations";
import { AHORRO_LIBRE_ID, TYPE_META } from "../../lib/constants";
import { fmt } from "../../lib/format";
import type { Category, FundWithBalance, Transaction, TransactionType } from "../../types";

const FILTER_OPTIONS: [TransactionType, string][] = [
  ["ingreso", "Ingresos"],
  ["gasto", "Gastos"],
  ["inversion", "Inversión"],
  ["aportacion", "Aportaciones"],
  ["retiro", "Retiros"],
];

const ORPHAN_FILTER = "sin_categoria";
type FilterValue = TransactionType | "" | typeof ORPHAN_FILTER;

/** Color de tarjeta por tipo de movimiento, para identificar el gasto de un vistazo. */
function rowToneClass(t: Pick<DisplayTransactionItem, "type" | "fixed">): string {
  switch (t.type) {
    case "ingreso":
      return "bg-emerald-50 border-l-4 border-emerald-400";
    case "gasto":
      return t.fixed ? "bg-blue-50 border-l-4 border-blue-800" : "bg-rose-50 border-l-4 border-rose-300";
    case "aportacion":
    case "retiro":
      return "bg-amber-50 border-l-4 border-amber-400";
    case "inversion":
      return "bg-indigo-50 border-l-4 border-indigo-300";
    default:
      return "bg-white border border-stone-100";
  }
}

interface MovimientosTabProps {
  isPremium: boolean;
  canNavigateToMonth: (monthDate: Date) => boolean;
  monthIdx: number;
  year: number;
  changeMonth: (delta: number) => void;
  changeYear: (delta: number) => void;
  goToMonthIndex: (m: number) => void;
  getAhorroReal: (year: number, monthIdx: number) => number;
  monthTx: Transaction[];
  allTransactions: Transaction[];
  stats: MonthStats;
  funds: FundWithBalance[];
  categories: Category[];
  deleteTransaction: (id: string) => void;
  onAdd: () => void;
  onEdit: (tx: Transaction) => void;
  hasAnyPending: boolean;
  hasAnyConfigured: boolean;
  onOpenApplyPresets: () => void;
  onGoToAjustes: () => void;
  orphanCount: number;
  onResolveOrphans: () => void;
  toast: (msg: string) => void;
}

export function MovimientosTab({
  isPremium,
  canNavigateToMonth,
  monthIdx,
  year,
  changeMonth,
  changeYear,
  goToMonthIndex,
  getAhorroReal,
  monthTx,
  allTransactions,
  stats,
  funds,
  categories,
  deleteTransaction,
  onAdd,
  onEdit,
  hasAnyPending,
  hasAnyConfigured,
  onOpenApplyPresets,
  onGoToAjustes,
  orphanCount,
  onResolveOrphans,
  toast,
}: MovimientosTabProps) {
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [filterType, setFilterType] = useState<FilterValue>("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const displayItems = useMemo(() => mergeSplitDisplay(monthTx, funds), [monthTx, funds]);

  const orphanTx = useMemo(() => allTransactions.filter((t) => isOrphanGasto(t, categories)), [allTransactions, categories]);

  const searchResults = useMemo(() => {
    if (!search.trim() && !filterType) return [];
    if (filterType === ORPHAN_FILTER) return orphanTx.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 50);
    const q = search.trim().toLowerCase();
    return allTransactions
      .filter(
        (t) =>
          (!filterType || t.type === filterType) &&
          (!q ||
            (t.category || "").toLowerCase().includes(q) ||
            (t.subcategory || "").toLowerCase().includes(q) ||
            (t.note || "").toLowerCase().includes(q)),
      )
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 50);
  }, [search, filterType, allTransactions, orphanTx]);

  const searching = search.trim().length > 0 || !!filterType;
  const selectedIds = Object.entries(selected)
    .filter(([, v]) => v)
    .map(([k]) => k);
  const selectedTotal = allTransactions.filter((t) => selectedIds.includes(t.id)).reduce((s, t) => s + t.amount, 0);

  const doDeleteSelected = () => {
    selectedIds.forEach((id) => deleteTransaction(id));
    setSelected({});
    setSelectMode(false);
    setConfirmDelete(false);
    toast(`${selectedIds.length} movimiento${selectedIds.length > 1 ? "s" : ""} eliminado${selectedIds.length > 1 ? "s" : ""}`);
  };

  const toggleSelect = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  const visibleIds = searching ? searchResults.map((t) => t.id) : displayItems.map((t) => t.ids[0]);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected[id]);
  const toggleSelectAll = () => {
    setSelected((s) => {
      const next = { ...s };
      visibleIds.forEach((id) => {
        next[id] = !allVisibleSelected;
      });
      return next;
    });
  };

  const renderTxRow = (t: DisplayTransactionItem, id: string, canEdit: boolean) => {
    const displayCategory = resolveCategoryName(t, categories);
    const displaySubcategory = resolveSubcategoryName(t, categories);
    const orphan = isOrphanGasto(t, categories);
    const orphanSub = !orphan && isOrphanSubcategory(t, categories);
    const fundedByName = t.fundedBy
      ? t.fundedBy === AHORRO_LIBRE_ID
        ? "ahorro libre consolidado"
        : funds.find((f) => f.id === t.fundedBy)?.name || "un fondo"
      : null;
    return (
    <div key={id} className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 ${rowToneClass(t)}`}>
      {selectMode && <input type="checkbox" checked={!!selected[id]} onChange={() => toggleSelect(id)} className="mr-2 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-sm truncate">
          {displayCategory}
          {orphan && <span className="text-amber-600"> · sin categoría válida</span>}
          {displaySubcategory ? ` · ${displaySubcategory}` : ""}
          {orphanSub && <span className="text-amber-600"> (sin subcategoría válida)</span>}
          {t.note ? ` · ${t.note}` : ""}
        </p>
        <p className="text-xs text-stone-400 mt-1">{t.date}</p>
        {fundedByName && <p className="text-xs text-amber-700 mt-0.5">Pagado con {fundedByName}</p>}
        {t.splitLabel && <p className="text-xs text-amber-700 mt-0.5">{t.splitLabel}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`font-mono text-sm ${TYPE_META[t.type].color}`}>
          {TYPE_META[t.type].sign > 0 ? "+" : "-"}
          {fmt(t.amount)}
        </span>
        {!selectMode && canEdit && (
          <button onClick={() => onEdit(t.raw!)} className="text-stone-300 hover:text-slate-700">
            <Pencil size={14} />
          </button>
        )}
        {!selectMode && (
          <button onClick={() => setDeleteConfirmId(id)} className="text-stone-300 hover:text-rose-600">
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex-1">
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
        </div>
      </div>
      <div className="flex justify-between items-center -mt-2 mb-2">
        <button onClick={onGoToAjustes} className="flex items-center gap-1 text-xs text-stone-400">
          <Repeat size={13} /> Preestablecidos
        </button>
        <div className="flex gap-3">
          {!selectMode && (
            <button onClick={() => setShowSearch((s) => !s)} className="flex items-center gap-1 text-xs text-stone-400">
              <Search size={13} /> Buscar
            </button>
          )}
          <button
            onClick={() => {
              setSelectMode((s) => !s);
              setSelected({});
            }}
            className={`flex items-center gap-1 text-xs ${selectMode ? "text-rose-600 font-medium" : "text-stone-400"}`}
          >
            {selectMode ? "Cancelar selección" : "Seleccionar"}
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="mb-3 space-y-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por categoría, nota..."
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-base bg-white"
            autoFocus
          />
          <div className="flex flex-wrap gap-1.5">
            <Chip label="Todos" active={!filterType} onClick={() => setFilterType("")} />
            {FILTER_OPTIONS.map(([v, l]) => (
              <Chip key={v} label={l} active={filterType === v} onClick={() => setFilterType(filterType === v ? "" : v)} />
            ))}
            {orphanTx.length > 0 && (
              <Chip
                tone="amber"
                label={`Sin categoría (${orphanTx.length})`}
                active={filterType === ORPHAN_FILTER}
                onClick={() => setFilterType(filterType === ORPHAN_FILTER ? "" : ORPHAN_FILTER)}
              />
            )}
          </div>
        </div>
      )}

      {!showSearch && !selectMode && orphanCount > 0 && (
        <button onClick={onResolveOrphans} className="w-full text-left text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-2 mb-3">
          {orphanCount} movimiento{orphanCount > 1 ? "s" : ""} con una categoría que ya no existe (p. ej. tras dividir o renombrar una
          categoría antigua). Toca aquí para reasignarlos todos de una vez.
        </button>
      )}

      {selectMode && selectedIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-2.5 mb-3 flex items-center justify-between">
          <span className="text-sm text-rose-800">
            {selectedIds.length} seleccionado{selectedIds.length > 1 ? "s" : ""} · {fmt(selectedTotal)}
          </span>
          <button onClick={() => setConfirmDelete(true)} className="bg-rose-600 text-white rounded-md px-3 py-1 text-xs font-medium">
            Borrar
          </button>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-20" onClick={() => setConfirmDelete(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
            <p className="font-serif text-base mb-2">
              ¿Borrar {selectedIds.length} movimiento{selectedIds.length > 1 ? "s" : ""}?
            </p>
            <p className="text-sm text-stone-600 mb-4">Se eliminarán permanentemente y se recalcularán todos los saldos afectados.</p>
            <button onClick={doDeleteSelected} className="w-full bg-rose-600 text-white rounded-lg py-2.5 text-sm font-medium mb-2">
              Sí, borrar
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="w-full border border-stone-200 text-stone-600 rounded-lg py-2.5 text-sm font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {!searching && (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <StatCard label="Ingresos" value={stats.ingresos} tone="emerald" />
            <StatCard label="Gastos" value={stats.gastosOrdinarios} tone="rose" />
            <StatCard label="Libre en curso" value={stats.ahorroReal} tone="teal" />
          </div>
          {stats.gastosFinanciados > 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-2 mb-3">
              + {fmt(stats.gastosFinanciados)} gastados este mes desde fondos de ahorro
            </p>
          )}
          {stats.inversion > 0 && (
            <p className="text-xs text-indigo-700 bg-indigo-50 rounded-md px-3 py-2 mb-3">{fmt(stats.inversion)} invertidos este mes</p>
          )}

          {hasAnyConfigured && (
            <button
              data-tour="apply-presets-btn"
              onClick={onOpenApplyPresets}
              className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 mb-2 text-sm font-medium ${hasAnyPending ? "bg-slate-800 text-white" : "bg-stone-100 text-stone-500 border border-stone-200"}`}
            >
              {hasAnyPending ? (
                <>
                  <Repeat size={16} /> Añadir ingresos y gastos preestablecidos
                </>
              ) : (
                <>
                  <Check size={16} /> Preestablecidos del mes aplicados
                </>
              )}
            </button>
          )}

          <button
            data-tour="new-movement-btn"
            onClick={onAdd}
            className="w-full flex items-center justify-center gap-2 bg-teal-700 text-white rounded-lg py-2.5 mb-4 text-sm font-medium"
          >
            <Plus size={16} /> Nuevo movimiento
          </button>

          <div className="space-y-1">
            {selectMode && visibleIds.length > 0 && (
              <label className="flex items-center gap-2 px-3 py-2 text-sm text-stone-600">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
                Seleccionar todo ({visibleIds.length})
              </label>
            )}
            {displayItems.length === 0 && <p className="text-stone-400 text-sm text-center py-8">Sin movimientos este mes todavía.</p>}
            {displayItems.map((t) => renderTxRow(t, t.ids[0], !!t.raw))}
          </div>
        </>
      )}

      {searching && (
        <div className="space-y-1">
          <p className="text-xs text-stone-400 mb-2">
            {searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""}
            {searchResults.length === 50 ? " (máx. 50)" : ""}
          </p>
          {selectMode && visibleIds.length > 0 && (
            <label className="flex items-center gap-2 px-3 py-2 text-sm text-stone-600">
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
              Seleccionar todo ({visibleIds.length})
            </label>
          )}
          {searchResults.length === 0 && <p className="text-stone-400 text-sm text-center py-8">No hay movimientos que coincidan.</p>}
          {searchResults.map((t) =>
            renderTxRow(
              {
                ids: [t.id],
                date: t.date,
                category: t.category,
                categoryId: t.categoryId,
                subcategory: t.subcategory,
                subcategoryId: t.subcategoryId,
                note: t.note,
                type: t.type,
                fixed: t.fixed,
                amount: t.amount,
                fundedBy: t.fundedBy,
                raw: t,
              },
              t.id,
              !t.splitId,
            ),
          )}
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-20" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-white rounded-t-2xl w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
            <p className="font-serif text-base mb-2">¿Borrar este movimiento?</p>
            <p className="text-sm text-stone-600 mb-4">Se eliminará permanentemente y se recalcularán los saldos afectados.</p>
            <button
              onClick={() => {
                deleteTransaction(deleteConfirmId);
                setDeleteConfirmId(null);
                toast("Movimiento eliminado");
              }}
              className="w-full bg-rose-600 text-white rounded-lg py-2.5 text-sm font-medium mb-2"
            >
              Sí, borrar
            </button>
            <button
              onClick={() => setDeleteConfirmId(null)}
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
