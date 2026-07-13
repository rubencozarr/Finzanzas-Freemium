import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { MonthSwitcher } from "../../components/MonthSwitcher";
import { MONTHS_FULL } from "../../lib/constants";
import { fmt } from "../../lib/format";
import type { AssetWithTotal, FundWithBalance } from "../../types";

interface FondosTabProps {
  funds: FundWithBalance[];
  addFund: (name: string) => void;
  renameFund: (id: string, name: string) => void;
  deleteFund: (fund: FundWithBalance) => void;
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

export function FondosTab({
  funds,
  addFund,
  renameFund,
  deleteFund,
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
  const [editingFundId, setEditingFundId] = useState<string | null>(null);
  const [editFundName, setEditFundName] = useState("");
  const [deleteConfirmFund, setDeleteConfirmFund] = useState<FundWithBalance | null>(null);

  const isCurrentMonth = selectedMonthKey === currentMonthKey;
  const isHistorical = selectedMonthKey < currentMonthKey;

  // Calcular todo "a fecha de" el mes seleccionado
  const fundsAtDate = fundsBalanceHasta(selectedMonthKey);
  const assetsAtDate = assetsHasta(selectedMonthKey);
  const totalFondosAtDate = fundsAtDate.reduce((s, f) => s + f.balance, 0);
  const totalInvertidoAtDate = assetsAtDate.reduce((s, a) => s + a.invertido, 0);
  const ahorroLibreAtDate = ahorroLibreHasta(selectedMonthKey);
  const consolidado = ahorroLibreDisponibleParaMes(selectedMonthKey);
  const enCurso = ahorroLibreAtDate - consolidado;
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
                <p className="text-stone-400">Consolidado</p>
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
        <p className="text-[11px] text-stone-400 mt-3 pt-2 border-t border-slate-600">
          "Consolidado" es la suma de lo que te ha sobrado sin usar en meses anteriores. Es dinero ya cerrado que puedes gastar marcando
          "pagado con ahorro".
        </p>
      </div>

      <p className="text-sm font-semibold mb-2">Fondos de ahorro</p>
      <div className="flex gap-2 mb-4">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre del fondo (ej. Viajes)"
          className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-base bg-white"
        />
        <button
          onClick={() => {
            if (newName.trim()) {
              addFund(newName.trim());
              setNewName("");
            }
          }}
          className="bg-slate-800 text-white rounded-lg px-3 text-sm"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="space-y-3 mb-2">
        {funds.length === 0 && <p className="text-stone-400 text-sm text-center py-6">Todavía no tienes fondos creados.</p>}
        {fundsAtDate.map((f) => (
          <div key={f.id} className="bg-white rounded-lg border border-stone-100 px-3 py-3">
            {editingFundId === f.id ? (
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
            ) : (
              <div className="flex justify-between items-baseline gap-2 mb-2">
                <span className="text-sm font-medium min-w-0 truncate">{f.name}</span>
                <span className="font-mono text-sm text-teal-700 shrink-0">{fmt(f.balance)}</span>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => onQuickMove(f, "aportacion")} className="flex-1 text-xs bg-teal-50 text-teal-800 rounded-md px-2.5 py-1.5">
                Aportar
              </button>
              <button onClick={() => onQuickMove(f, "retiro")} className="flex-1 text-xs bg-amber-50 text-amber-800 rounded-md px-2.5 py-1.5">
                Retirar
              </button>
              <button
                onClick={() => {
                  setEditingFundId(f.id);
                  setEditFundName(f.name);
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
          </div>
        ))}
      </div>
      <p className="text-xs text-stone-400 mb-6">Si un gasto lo pagas con dinero de un fondo, márcalo como "pagado con ahorro" al crear ese gasto.</p>

      <p className="text-sm font-semibold mb-2">Inversión hasta {mesLabelSiempre}</p>
      <p className="text-xs text-stone-400 mb-3">
        Gestiona tus activos en{" "}
        <button onClick={onGoToAjustes} className="underline text-indigo-700">
          Ajustes → Inversión
        </button>
        .
      </p>
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
