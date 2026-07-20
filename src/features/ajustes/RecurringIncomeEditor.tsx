import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Chip } from "../../components/Chip";
import { INCOME_CATS } from "../../lib/constants";
import type { IncomeCategory, RecurringIncome } from "../../types";

interface RecurringIncomeEditorProps {
  recurringIncome: RecurringIncome[];
  addRecurringIncome: (r: Omit<RecurringIncome, "id">) => void;
  removeRecurringIncome: (id: string) => void;
  updateRecurringIncomeAmount: (id: string, amount: number) => void;
}

export function RecurringIncomeEditor({
  recurringIncome,
  addRecurringIncome,
  removeRecurringIncome,
  updateRecurringIncomeAmount,
}: RecurringIncomeEditorProps) {
  const [incomeCat, setIncomeCat] = useState<IncomeCategory>(INCOME_CATS[0]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [day, setDay] = useState("");

  const add = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    addRecurringIncome({ incomeCat, name: name.trim() || incomeCat, amount: amt, note, day: parseInt(day) || null });
    setName("");
    setAmount("");
    setNote("");
    setDay("");
  };

  return (
    <div>
      <p className="text-xs text-stone-500 mb-3">
        Defínelos una vez (por ejemplo tu nómina). Cada mes podrás aplicarlos junto al resto de preestablecidos desde Movimientos.
      </p>
      <div className="space-y-2 mb-4">
        {recurringIncome.length === 0 && <p className="text-stone-400 text-sm text-center py-4">Todavía no tienes ingresos recurrentes.</p>}
        {recurringIncome.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-2 bg-white border border-stone-100 rounded-lg px-3 py-2">
            <div className="min-w-0">
              <p className="text-sm truncate">
                {r.name}
                {r.day ? ` · día ${r.day}` : ""}
              </p>
              <p className="text-xs text-stone-400 truncate">
                {r.incomeCat}
                {r.note ? ` · ${r.note}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                value={r.amount}
                onChange={(e) => updateRecurringIncomeAmount(r.id, parseFloat(e.target.value) || 0)}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-20 border border-stone-200 rounded-md px-1.5 py-1 text-base font-mono text-right"
              />
              <button onClick={() => removeRecurringIncome(r.id)} className="text-stone-300 hover:text-rose-600">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div>
        {/* El tour señala solo esta cabecera (no el formulario entero, que es alto y cambia de
         * posición según el teclado): así el tooltip nunca compite por espacio con los campos. */}
        <p data-tour="recurring-income-form" className="text-sm font-medium mb-2">
          Añadir nuevo
        </p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {INCOME_CATS.map((c) => (
            <Chip key={c} label={c} active={incomeCat === c} onClick={() => setIncomeCat(c)} />
          ))}
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre (ej. Nómina)"
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-base mb-3"
        />
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onWheel={(e) => e.currentTarget.blur()}
          placeholder="Importe habitual (€)"
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-base mb-3 font-mono"
        />
        <input
          type="number"
          inputMode="numeric"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          placeholder="Día habitual del mes (opcional, ej. 28)"
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-base mb-3"
          min="1"
          max="31"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nota (opcional)"
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-base mb-3"
        />
        <button onClick={add} className="w-full bg-slate-800 text-white rounded-lg py-2.5 text-sm font-medium">
          Añadir ingreso recurrente
        </button>
      </div>
    </div>
  );
}
