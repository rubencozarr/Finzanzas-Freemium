import { useState } from "react";
import { Check, X } from "lucide-react";
import { fmt } from "../lib/format";
import { planFundedRecurringApplications } from "../lib/calculations";
import type { Asset, Category, FundWithBalance, InvestmentConfig, Recurring, RecurringIncome } from "../types";

interface ApplyPresetsPayload {
  income: { id: string; amount: number }[];
  expenses: { id: string; amount: number }[];
  investment: { id: string; amount: number }[];
}

// Datos del aviso ya resueltos (nombre de fondo/categoría, no ids) en el momento de calcularlo:
// applyPresets va aplicando movimientos uno a uno con await, así que React puede re-renderizar este
// modal, todavía montado, a medio aplicar — si el aviso volviera a buscar por id en pendingRecurring/
// funds (props que van cambiando según se aplican gastos), un gasto ya aplicado podía desaparecer de
// esas listas a mitad de la operación y el .find() fallar, dejando la pantalla en blanco.
interface FundWarningDisplay {
  recurringId: string;
  fundName: string;
  categoryName: string;
  amount: number;
  fundAmount: number;
  normalAmount: number;
  availableBefore: number;
  consumedByOthers: boolean;
}

interface ApplyPresetsModalProps {
  pendingIncome: RecurringIncome[];
  pendingRecurring: Recurring[];
  pendingInvestmentAssets: Asset[];
  categories: Category[];
  funds: FundWithBalance[];
  investmentConfig: InvestmentConfig;
  ingresos: number;
  onClose: () => void;
  onConfirm: (payload: ApplyPresetsPayload) => void;
}

interface ItemState {
  checked: boolean;
  amount: number;
}

export function ApplyPresetsModal({
  pendingIncome,
  pendingRecurring,
  pendingInvestmentAssets,
  categories,
  funds,
  investmentConfig,
  ingresos,
  onClose,
  onConfirm,
}: ApplyPresetsModalProps) {
  const totalSuggestedInvest = ingresos * ((investmentConfig.globalPct || 0) / 100);

  const [incomeItems, setIncomeItems] = useState<Record<string, ItemState>>(() =>
    Object.fromEntries(pendingIncome.map((r) => [r.id, { checked: true, amount: r.amount }])),
  );
  const [expenseItems, setExpenseItems] = useState<Record<string, ItemState>>(() =>
    Object.fromEntries(pendingRecurring.map((r) => [r.id, { checked: true, amount: r.amount }])),
  );
  const [investItems, setInvestItems] = useState<Record<string, ItemState>>(() =>
    Object.fromEntries(
      pendingInvestmentAssets.map((a) => [
        a.id,
        { checked: true, amount: Math.round(totalSuggestedInvest * ((a.pct || 0) / 100) * 100) / 100 },
      ]),
    ),
  );

  const toggle = (setter: typeof setIncomeItems, id: string) =>
    setter((s) => ({ ...s, [id]: { ...s[id], checked: !s[id].checked } }));
  const setAmt = (setter: typeof setIncomeItems, id: string, val: string) =>
    setter((s) => ({ ...s, [id]: { ...s[id], amount: parseFloat(val) || 0 } }));

  // Si algún gasto fijo "pagar desde un fondo" no tiene saldo suficiente, se avisa antes de aplicar de
  // verdad (informar, no preguntar: un único botón "Continuar") en vez de aplicar directamente.
  const [pendingPayload, setPendingPayload] = useState<ApplyPresetsPayload | null>(null);
  const [warnings, setWarnings] = useState<FundWarningDisplay[] | null>(null);

  const confirm = () => {
    const payload: ApplyPresetsPayload = {
      income: pendingIncome.filter((r) => incomeItems[r.id]?.checked).map((r) => ({ id: r.id, amount: incomeItems[r.id].amount })),
      expenses: pendingRecurring
        .filter((r) => expenseItems[r.id]?.checked)
        .map((r) => ({ id: r.id, amount: expenseItems[r.id].amount })),
      investment: pendingInvestmentAssets
        .filter((a) => investItems[a.id]?.checked)
        .map((a) => ({ id: a.id, amount: investItems[a.id].amount })),
    };
    const plans = planFundedRecurringApplications(
      payload.expenses.map((e) => ({
        id: e.id,
        amount: e.amount,
        fundedByFundId: pendingRecurring.find((r) => r.id === e.id)?.fundedByFundId,
      })),
      funds,
    );
    const newWarnings: FundWarningDisplay[] = plans
      .filter((p) => p.normalAmount > 0)
      .map((p) => {
        const tpl = pendingRecurring.find((r) => r.id === p.recurringId);
        const fund = funds.find((f) => f.id === p.fundId);
        return {
          recurringId: p.recurringId,
          fundName: fund?.name ?? "el fondo",
          categoryName: categories.find((c) => c.id === tpl?.categoryId)?.name ?? "",
          amount: p.amount,
          fundAmount: p.fundAmount,
          normalAmount: p.normalAmount,
          availableBefore: p.availableBefore,
          consumedByOthers: (fund?.balance ?? 0) > p.availableBefore,
        };
      });
    if (newWarnings.length === 0) {
      onConfirm(payload);
      return;
    }
    setPendingPayload(payload);
    setWarnings(newWarnings);
  };

  const confirmAfterWarning = () => {
    if (pendingPayload) onConfirm(pendingPayload);
  };

  const nothingPending = pendingIncome.length === 0 && pendingRecurring.length === 0 && pendingInvestmentAssets.length === 0;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-20" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl w-full max-w-md p-4 max-h-[85dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <p className="font-serif text-base">{warnings ? "Antes de continuar" : "Ingresos y gastos preestablecidos"}</p>
          <button onClick={onClose} className="text-stone-400">
            <X size={18} />
          </button>
        </div>

        {warnings ? (
          <>
            <div className="space-y-2 mb-4">
              {warnings.map((w) => (
                <p key={w.recurringId} className="text-sm text-amber-800 bg-amber-50 rounded-md px-3 py-2">
                  {w.availableBefore <= 0 ? (
                    <>
                      El fondo <strong>{w.fundName}</strong>{" "}
                      {w.consumedByOthers ? "ya se ha usado por completo en otros gastos de esta aplicación" : "no tiene saldo disponible"}
                      . El gasto <strong>{w.categoryName}</strong> ({fmt(w.amount)}) se registrará íntegro como gasto del mes.
                    </>
                  ) : w.consumedByOthers ? (
                    <>
                      El fondo <strong>{w.fundName}</strong> ya se ha usado para otros gastos de esta aplicación y le quedan{" "}
                      {fmt(w.availableBefore)}. El gasto <strong>{w.categoryName}</strong> ({fmt(w.amount)}) se pagará con esos{" "}
                      {fmt(w.availableBefore)}, y los {fmt(w.normalAmount)} restantes se registrarán como gasto del mes.
                    </>
                  ) : (
                    <>
                      El fondo <strong>{w.fundName}</strong> tiene {fmt(w.availableBefore)} pero el gasto{" "}
                      <strong>{w.categoryName}</strong> es de {fmt(w.amount)}. Se pagarán {fmt(w.fundAmount)} del fondo y{" "}
                      {fmt(w.normalAmount)} se registrarán como gasto del mes.
                    </>
                  )}
                </p>
              ))}
            </div>
            <button onClick={confirmAfterWarning} className="w-full bg-teal-700 text-white rounded-lg py-2.5 text-sm font-medium">
              Continuar
            </button>
          </>
        ) : (
        <>
        {nothingPending && (
          <div className="text-center py-6">
            <Check size={32} className="mx-auto text-teal-600 mb-2" />
            <p className="text-sm text-stone-600">Todo aplicado este mes</p>
            <p className="text-xs text-stone-400 mt-1">
              Si necesitas reaplicar algo, borra primero el movimiento correspondiente y vuelve aquí.
            </p>
          </div>
        )}

        {pendingIncome.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2 text-emerald-700">Ingresos recurrentes</p>
            <div className="space-y-2">
              {pendingIncome.map((r) => (
                <label key={r.id} className="flex items-center justify-between gap-2 bg-white border border-stone-100 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <input type="checkbox" checked={incomeItems[r.id]?.checked} onChange={() => toggle(setIncomeItems, r.id)} />
                    <span className="text-sm truncate">{r.name || r.incomeCat}</span>
                  </div>
                  <input
                    type="number"
                    value={incomeItems[r.id]?.amount}
                    onChange={(e) => setAmt(setIncomeItems, r.id, e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-20 border border-stone-200 rounded-md px-1.5 py-1 text-base font-mono text-right shrink-0"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {pendingRecurring.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2 text-slate-700">Gastos fijos</p>
            <div className="space-y-2">
              {pendingRecurring.map((r) => {
                const cat = categories.find((c) => c.id === r.categoryId);
                return (
                  <label key={r.id} className="flex items-center justify-between gap-2 bg-white border border-stone-100 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <input type="checkbox" checked={expenseItems[r.id]?.checked} onChange={() => toggle(setExpenseItems, r.id)} />
                      <span className="text-sm truncate">
                        {cat?.name}
                        {r.subcategory ? ` · ${r.subcategory}` : ""}
                      </span>
                    </div>
                    <input
                      type="number"
                      value={expenseItems[r.id]?.amount}
                      onChange={(e) => setAmt(setExpenseItems, r.id, e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-20 border border-stone-200 rounded-md px-1.5 py-1 text-base font-mono text-right shrink-0"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {pendingInvestmentAssets.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2 text-indigo-700">Plan de inversión</p>
            <p className="text-xs text-stone-500 mb-2">
              Sugerido: {fmt(totalSuggestedInvest)} ({investmentConfig.globalPct || 0}% de tus ingresos del mes, incluyendo los de
              arriba)
            </p>
            <div className="space-y-2">
              {pendingInvestmentAssets.map((a) => (
                <label key={a.id} className="flex items-center justify-between gap-2 bg-white border border-stone-100 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <input type="checkbox" checked={investItems[a.id]?.checked} onChange={() => toggle(setInvestItems, a.id)} />
                    <span className="text-sm truncate">
                      {a.name} <span className="text-stone-400">· {a.pct || 0}%</span>
                    </span>
                  </div>
                  <input
                    type="number"
                    value={investItems[a.id]?.amount}
                    onChange={(e) => setAmt(setInvestItems, a.id, e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-20 border border-stone-200 rounded-md px-1.5 py-1 text-base font-mono text-right shrink-0"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        <button onClick={confirm} className="w-full bg-teal-700 text-white rounded-lg py-2.5 text-sm font-medium">
          Confirmar
        </button>
        </>
        )}
      </div>
    </div>
  );
}
