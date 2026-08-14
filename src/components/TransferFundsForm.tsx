import { useState } from "react";
import { X } from "lucide-react";
import { fmt, round2 } from "../lib/format";
import { FREE_MAX_FUNDS } from "../lib/constants";
import type { FundWithBalance } from "../types";

interface TransferFundsFormProps {
  isPremium: boolean;
  fund: FundWithBalance; // fondo origen, ya fijado — no se puede cambiar desde este formulario
  funds: FundWithBalance[]; // todos los fondos, para el selector de destino
  onClose: () => void;
  onTransfer: (destinoFundId: string, amount: number) => void;
}

/** Formulario simple para mover dinero entre dos fondos propios: fondo origen fijo, selector de
 * destino (excluye el propio origen), importe. Deliberadamente fuera de NuevoMovimientoForm — solo se
 * abre desde dentro de un fondo en FondosTab. */
export function TransferFundsForm({ isPremium, fund, funds, onClose, onTransfer }: TransferFundsFormProps) {
  const destinoOptions = funds.filter((f) => f.id !== fund.id);
  const [destinoFundId, setDestinoFundId] = useState(destinoOptions[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [showAmountError, setShowAmountError] = useState(false);

  const destinoFund = destinoOptions.find((f) => f.id === destinoFundId);
  const amt = parseFloat(amount) || 0;

  // Contra el balance TOTAL del fondo origen (initialBalance + flowBalance), no solo flowBalance: el
  // usuario puede transferir hasta el saldo que ve en la tarjeta del fondo, saldo inicial incluido.
  // flowBalance puede quedar negativo tras esto si la parte "de más" venía del saldo inicial — es el
  // mismo comportamiento que ya tiene "Retirar" (ver retiroExcedeFondo en NuevoMovimientoForm.tsx, que
  // también compara contra selectedFund.balance), no es un caso nuevo de las transferencias.
  const excedeSaldo = amt > 0 && round2(amt) > round2(fund.balance);

  // Mismo criterio que "Aportar" en FondosTab.tsx (canContribute): en free con más de FREE_MAX_FUNDS
  // fondos, solo los marcados como activos son utilizables. Aplica a origen y destino por igual — un
  // fondo inactivo no puede ni enviar ni recibir una transferencia.
  const activeGateApplies = !isPremium && funds.length > FREE_MAX_FUNDS;
  const origenActivo = !activeGateApplies || !!fund.isActive;
  const destinoActivo = !activeGateApplies || !!destinoFund?.isActive;

  const canSubmit = !excedeSaldo && origenActivo && destinoActivo;

  const submit = () => {
    if (!amt || amt <= 0) {
      setShowAmountError(true);
      return;
    }
    if (!canSubmit || !destinoFundId) return;
    onTransfer(destinoFundId, amt);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-10" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <p className="font-serif text-base">Transferir a otro fondo</p>
          <button onClick={onClose} className="min-w-[44px] min-h-[44px] -m-3 flex items-center justify-center text-stone-500" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-stone-500 mb-1">Desde</p>
        <p className="text-sm font-medium mb-3">
          {fund.name} · <span className="font-mono text-stone-500">{fmt(fund.balance)} disponibles</span>
        </p>

        {destinoOptions.length === 0 ? (
          <p className="text-xs text-stone-500 mb-3">Necesitas al menos otro fondo para transferir.</p>
        ) : (
          <>
            <p className="text-xs text-stone-500 mb-1">Hacia</p>
            <select
              value={destinoFundId}
              onChange={(e) => setDestinoFundId(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-base bg-white mb-3"
            >
              {destinoOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setShowAmountError(false);
              }}
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="Importe a transferir (€)"
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-base font-mono mb-2"
            />
            {showAmountError && (!amt || amt <= 0) && (
              <p className="text-xs text-rose-600 mb-2">El importe es obligatorio y debe ser mayor que 0.</p>
            )}
            {excedeSaldo && (
              <p className="text-xs text-rose-600 mb-2">
                Este importe supera el saldo de {fund.name} ({fmt(fund.balance)}).
              </p>
            )}
            {!origenActivo && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-2 mb-3">
                {fund.name} no está entre tus fondos activos — actívalo para poder transferir desde él.
              </p>
            )}
            {destinoFund && !destinoActivo && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-2 mb-3">
                {destinoFund.name} no está entre tus fondos activos — actívalo para poder transferir hacia él.
              </p>
            )}

            <button
              onClick={submit}
              disabled={!canSubmit}
              className="w-full bg-slate-800 disabled:opacity-40 text-white rounded-lg py-2.5 text-sm font-medium"
            >
              Transferir
            </button>
          </>
        )}
      </div>
    </div>
  );
}
