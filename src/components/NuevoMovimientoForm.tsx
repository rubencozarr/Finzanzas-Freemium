import { useEffect, useState } from "react";
import { Crown, X } from "lucide-react";
import { Chip } from "./Chip";
import { AHORRO_LIBRE_ID, FREE_MAX_CATEGORIES, FREE_MAX_FUNDS, INCOME_CATS } from "../lib/constants";
import { matchesCategory } from "../lib/calculations";
import { fmt, monthKey, round2 } from "../lib/format";
import type { NewTransaction } from "../hooks/useTransactions";
import type { AssetWithTotal, Category, FundWithBalance, Transaction, TransactionType } from "../types";

export interface FormPreset {
  type: TransactionType;
  fundId?: string;
  assetId?: string;
}

interface NuevoMovimientoFormProps {
  isPremium: boolean;
  variableBudget: number;
  funds: FundWithBalance[];
  getAhorroLibreDisponibleParaMes: (mKey: string) => number;
  categories: Category[];
  assets: AssetWithTotal[];
  defaultDate: string;
  ahorroRealDisponible: number;
  monthTx: Transaction[];
  initial: FormPreset | null;
  editingTx: Transaction | null;
  onClose: () => void;
  onSave: (tx: NewTransaction) => void;
}

const TYPE_OPTIONS: [TransactionType, string][] = [
  ["ingreso", "Ingreso"],
  ["gasto", "Gasto"],
  ["aportacion", "Aportar"],
  ["retiro", "Retirar"],
  ["inversion", "Invertir"],
];

// Corona sobre el botón "Invertir" cuando es free (mismo patrón que FundLockBadge en FondosTab.tsx):
// toca para abrir/cerrar el tooltip. stopPropagation evita que el toque también intente seleccionar
// el tipo "inversion" en el botón que cubre.
function InvestmentLockBadge() {
  const [open, setOpen] = useState(false);
  return (
    <span className="absolute -top-1.5 -right-1.5">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="text-amber-500 hover:text-amber-600 bg-white rounded-full"
      >
        <Crown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-10 w-36 bg-slate-800 text-white text-[11px] rounded-lg px-2.5 py-2 shadow-lg">
          Para invertir necesitas Premium
        </div>
      )}
    </span>
  );
}

export function NuevoMovimientoForm({
  isPremium,
  variableBudget,
  funds,
  getAhorroLibreDisponibleParaMes,
  categories,
  assets,
  defaultDate,
  ahorroRealDisponible,
  monthTx,
  initial,
  editingTx,
  onClose,
  onSave,
}: NuevoMovimientoFormProps) {
  const [type, setType] = useState<TransactionType>(editingTx?.type || initial?.type || "gasto");
  const [categoryId, setCategoryId] = useState(() => {
    if (editingTx && editingTx.type === "gasto") {
      if (editingTx.categoryId && categories.some((c) => c.id === editingTx.categoryId)) return editingTx.categoryId;
      return categories.find((c) => c.name === editingTx.category)?.id || "";
    }
    return "";
  });
  const [subcategory, setSubcategory] = useState(() => {
    if (editingTx?.type === "gasto" && editingTx.subcategoryId) {
      const cat = categories.find((c) => c.id === editingTx.categoryId || c.name === editingTx.category);
      const sub = cat?.subcategories.find((s) => s.id === editingTx.subcategoryId);
      if (sub) return sub.name;
    }
    return editingTx?.subcategory || "";
  });
  const [incomeCat, setIncomeCat] = useState(editingTx?.type === "ingreso" ? editingTx.category : INCOME_CATS[0]);
  const [fundId, setFundId] = useState(() => {
    if (editingTx && (editingTx.type === "aportacion" || editingTx.type === "retiro"))
      return editingTx.fundId || funds[0]?.id || "";
    return initial?.fundId || funds[0]?.id || "";
  });
  const [assetId, setAssetId] = useState(() => {
    if (editingTx && editingTx.type === "inversion") return assets.find((a) => a.name === editingTx.category)?.id || "";
    return initial?.assetId || assets[0]?.id || "";
  });
  const [amount, setAmount] = useState(editingTx ? String(editingTx.amount) : "");
  const [date, setDate] = useState(editingTx?.date || defaultDate);
  const [note, setNote] = useState(editingTx?.note || "");
  const [fundedByFund, setFundedByFund] = useState(!!editingTx?.fundedBy);
  const [fundedId, setFundedId] = useState(editingTx?.fundedBy || AHORRO_LIBRE_ID);
  const [askShortfall, setAskShortfall] = useState(false);
  const [shortfallFundId, setShortfallFundId] = useState(AHORRO_LIBRE_ID);
  // Se ha visto a usuarios darle a "Guardar" sin haber tocado ninguna categoría (el botón no hacía
  // nada y no quedaba claro por qué). Solo se activa tras un intento real de guardar, para no mostrar
  // el aviso antes de que el usuario haya llegado a esa parte del formulario.
  const [showCategoryError, setShowCategoryError] = useState(false);

  // El ahorro libre disponible se recalcula según la fecha del movimiento y nunca incluye
  // el propio mes: solo puedes gastar como "ahorro" lo acumulado en meses anteriores a este.
  const ahorroLibreDisponible = getAhorroLibreDisponibleParaMes(monthKey(date || defaultDate));
  const fundingOptions = [
    { id: AHORRO_LIBRE_ID, name: "Ahorro libre consolidado", balance: ahorroLibreDisponible },
    ...funds,
  ];

  const currentCat = categories.find((c) => c.id === categoryId);
  const needsFund = type === "aportacion" || type === "retiro";
  const needsAsset = type === "inversion";
  // Downgrade/importación: un free con más de 6 categorías de un tipo solo puede crear movimientos
  // nuevos con las que tenga marcadas como "activas" (mismo mecanismo que "fondo activo" en
  // FondosTab.tsx). Las categorías inactivas no desaparecen del resto de la app, solo de este selector.
  const allFixedCats = categories.filter((c) => c.type === "fixed");
  const allVariableCats = categories.filter((c) => c.type === "variable");
  const fixedCats =
    !isPremium && allFixedCats.length > FREE_MAX_CATEGORIES.fixed ? allFixedCats.filter((c) => c.isActive) : allFixedCats;
  const variableCats =
    !isPremium && allVariableCats.length > FREE_MAX_CATEGORIES.variable
      ? allVariableCats.filter((c) => c.isActive)
      : allVariableCats;
  const selectedFund = funds.find((f) => f.id === fundId);
  // Solo se puede aportar a fondos activos si el free tiene más fondos que el límite (mismo mecanismo
  // que en FondosTab.tsx). Retirar y "pagado con ahorro" (fundingOptions, más abajo) nunca se
  // restringen: el usuario debe poder acceder a su dinero siempre, esté el fondo activo o no.
  const contributableFunds = !isPremium && funds.length > FREE_MAX_FUNDS ? funds.filter((f) => f.isActive) : funds;
  const fundOptionsForType = type === "aportacion" ? contributableFunds : funds;

  // Si el usuario cambia a "Aportar" con un fondo ya seleccionado que no es activo (o al abrir el
  // formulario directamente en ese estado), se corrige a la primera opción válida. No se toca mientras
  // se edita un movimiento existente: el fondo ya asignado se conserva aunque ahora esté inactivo.
  useEffect(() => {
    if (editingTx || type !== "aportacion") return;
    if (!fundOptionsForType.some((f) => f.id === fundId)) {
      setFundId(fundOptionsForType[0]?.id ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const amt = parseFloat(amount) || 0;
  const remaining = ahorroRealDisponible ?? 0;
  const shortfall = !editingTx && type === "gasto" && !fundedByFund && remaining > 0 ? Math.max(0, round2(amt - remaining)) : 0;
  const retiroExcedeFondo =
    type === "retiro" &&
    !!selectedFund &&
    round2(amt) >
      round2(selectedFund.balance + (editingTx?.type === "retiro" && editingTx.fundId === fundId ? editingTx.amount : 0));

  const categoryBudget = type === "gasto" && currentCat?.type === "variable" ? currentCat.budget || 0 : 0;
  const spentInCategoryThisMonth =
    categoryBudget > 0
      ? monthTx
          .filter((t) => t.type === "gasto" && matchesCategory(t, currentCat!) && (!editingTx || t.id !== editingTx.id))
          .reduce((s, t) => s + t.amount, 0)
      : 0;
  const projectedCategoryTotal = spentInCategoryThisMonth + amt;

  // Aviso de presupuesto para free: en vez del desglose por categoría (premium), se compara contra el
  // presupuesto general de gasto variable. Mismo criterio que "variableOrdinario" en calculations.ts
  // (excluye gastos financiados con ahorro), para que la cifra coincida con la que ya ve el usuario en
  // Mensual/Movimientos.
  const showGlobalBudgetNotice = !isPremium && type === "gasto" && currentCat?.type === "variable" && variableBudget > 0;
  const spentVariableThisMonth = showGlobalBudgetNotice
    ? monthTx
        .filter((t) => t.type === "gasto" && !t.fixed && !t.fundedBy && (!editingTx || t.id !== editingTx.id))
        .reduce((s, t) => s + t.amount, 0)
    : 0;
  const projectedVariableTotal = spentVariableThisMonth + amt;

  const fundedFund = fundingOptions.find((f) => f.id === fundedId);
  const fundedYaContaba = editingTx?.type === "gasto" && editingTx.fundedBy === fundedId ? editingTx.amount : 0;
  const fundedExcede =
    type === "gasto" && fundedByFund && !!fundedFund && round2(amt) > round2(fundedFund.balance + fundedYaContaba);

  const shortfallFund = fundingOptions.find((f) => f.id === shortfallFundId);
  const shortfallExcede = !!shortfallFund && round2(shortfall) > round2(shortfallFund.balance);

  const buildBase = (): Omit<Transaction, "id" | "amount"> => {
    const fund = funds.find((f) => f.id === fundId);
    const asset = assets.find((a) => a.id === assetId);
    return {
      type,
      date,
      note,
      fixed: type === "gasto" ? currentCat?.type === "fixed" : undefined,
      category: needsFund ? fund?.name || "Fondo" : needsAsset ? asset?.name || "Activo" : type === "ingreso" ? incomeCat : currentCat?.name || "",
      categoryId: type === "gasto" ? currentCat?.id ?? null : null,
      subcategory: type === "gasto" ? subcategory || null : null,
      subcategoryId:
        type === "gasto" && subcategory ? currentCat?.subcategories.find((s) => s.name === subcategory)?.id ?? null : null,
      fundId: needsFund ? fundId : null,
      fundedBy: type === "gasto" && fundedByFund ? fundedId : null,
    };
  };

  const submit = () => {
    if (!amt || amt <= 0 || !date) return;
    if (needsFund && !fundId) return;
    if (needsAsset && !assetId) return;
    if (retiroExcedeFondo) return;
    if (fundedExcede) return;
    if (type === "gasto" && !categoryId) {
      setShowCategoryError(true);
      return;
    }
    if (shortfall > 0) {
      setAskShortfall(true);
      return;
    }
    onSave({ ...buildBase(), amount: amt });
  };

  const confirmWithoutFund = () => onSave({ ...buildBase(), amount: amt });
  const confirmWithFund = () =>
    onSave({ ...buildBase(), amount: amt, splitFundId: shortfallFundId, splitFundAmount: shortfall });

  if (askShortfall) {
    return (
      <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-10" onClick={onClose}>
        <div className="bg-white rounded-t-2xl w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-3">
            <p className="font-serif text-base">Tu ahorro real no llega</p>
            <button onClick={onClose} className="text-stone-400">
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-stone-600 mb-1">
            Este gasto es de <span className="font-mono">{fmt(amt)}</span>, pero tu ahorro real disponible este mes es de{" "}
            <span className="font-mono">{fmt(remaining)}</span>.
          </p>
          <p className="text-sm text-stone-600 mb-1">
            ¿Quieres cubrir la diferencia de <span className="font-mono font-medium">{fmt(shortfall)}</span> con un fondo o
            con tu ahorro libre acumulado?
          </p>
          <p className="text-xs text-stone-400 mb-4">
            Solo puedes usar el ahorro libre consolidado (de meses anteriores). El sobrante de este mes es ahorro en curso.
          </p>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {fundingOptions.map((f) => (
              <Chip
                key={f.id}
                tone="amber"
                label={`${f.name} · ${fmt(f.balance)}`}
                active={shortfallFundId === f.id}
                onClick={() => setShortfallFundId(f.id)}
              />
            ))}
          </div>
          {shortfallExcede && (
            <p className="text-xs text-rose-600 mb-2">
              Ahí no tienes suficiente ({fmt(shortfallFund!.balance)} disponibles). Elige otra opción o reduce el importe.
            </p>
          )}

          <button
            onClick={confirmWithFund}
            disabled={shortfallExcede}
            className="w-full bg-teal-700 disabled:opacity-40 text-white rounded-lg py-2.5 text-sm font-medium mb-2"
          >
            Sí, cubrir {fmt(shortfall)} con {shortfallFund?.name || "esto"}
          </button>
          <button
            onClick={confirmWithoutFund}
            className="w-full border border-stone-200 text-stone-600 rounded-lg py-2.5 text-sm font-medium"
          >
            No, dejar el ahorro real en negativo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-10" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl w-full max-w-md p-4 max-h-[85dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <p className="font-serif text-base">{editingTx ? "Editar movimiento" : "Nuevo movimiento"}</p>
          <button onClick={onClose} className="text-stone-400">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1.5 mb-4">
          <div data-tour="type-basic" className="grid grid-cols-2 gap-1.5 flex-[2]">
            {TYPE_OPTIONS.slice(0, 2).map(([v, l]) => (
              <button
                key={v}
                disabled={!!editingTx}
                onClick={() => setType(v)}
                className={`text-xs rounded-md py-2 border disabled:opacity-40 ${type === v ? "bg-slate-800 text-white border-slate-800" : "border-stone-200 text-stone-500"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <div data-tour="type-funds" className="grid grid-cols-3 gap-1.5 flex-[3]">
            {TYPE_OPTIONS.slice(2).map(([v, l]) => {
              const investmentBlocked = v === "inversion" && !isPremium;
              return (
                <div key={v} className="relative">
                  <button
                    disabled={!!editingTx || investmentBlocked}
                    onClick={() => setType(v)}
                    className={`w-full text-xs rounded-md py-2 border disabled:opacity-40 ${type === v ? "bg-slate-800 text-white border-slate-800" : "border-stone-200 text-stone-500"}`}
                  >
                    {l}
                  </button>
                  {investmentBlocked && <InvestmentLockBadge />}
                </div>
              );
            })}
          </div>
        </div>
        {editingTx && (
          <p className="text-xs text-stone-400 -mt-2.5 mb-4">
            El tipo de movimiento no se puede cambiar al editar. Si necesitas cambiarlo, borra este y crea uno nuevo.
          </p>
        )}

        {needsFund && (
          <div className="mb-4">
            <p className="text-xs text-stone-500 mb-1.5">Fondo</p>
            <div className="flex flex-wrap gap-1.5">
              {funds.length === 0 && <span className="text-xs text-stone-400">Crea un fondo primero en la pestaña Fondos</span>}
              {funds.length > 0 && fundOptionsForType.length === 0 && (
                <span className="text-xs text-stone-400">No tienes ningún fondo activo. Actívalo en la pestaña Fondos.</span>
              )}
              {fundOptionsForType.map((f) => (
                <Chip key={f.id} label={`${f.name} · ${fmt(f.balance)}`} active={fundId === f.id} onClick={() => setFundId(f.id)} />
              ))}
            </div>
            {retiroExcedeFondo && (
              <p className="text-xs text-rose-600 mt-2">
                No puedes retirar más de lo que hay en el fondo ({fmt(selectedFund!.balance)} disponibles).
              </p>
            )}
          </div>
        )}

        {needsAsset && (
          <div className="mb-4">
            <p className="text-xs text-stone-500 mb-1.5">Activo</p>
            <div className="flex flex-wrap gap-1.5">
              {assets.length === 0 && <span className="text-xs text-stone-400">Crea un activo primero en Ajustes</span>}
              {assets.map((a) => (
                <Chip
                  key={a.id}
                  tone="indigo"
                  label={`${a.name} · ${fmt(a.invertido)}`}
                  active={assetId === a.id}
                  onClick={() => setAssetId(a.id)}
                />
              ))}
            </div>
          </div>
        )}

        {type === "ingreso" && (
          <div className="mb-4">
            <p className="text-xs text-stone-500 mb-1.5">Tipo de ingreso</p>
            <div className="flex flex-wrap gap-1.5">
              {INCOME_CATS.map((c) => (
                <Chip key={c} label={c} active={incomeCat === c} onClick={() => setIncomeCat(c)} />
              ))}
            </div>
          </div>
        )}

        {type === "gasto" && (
          <>
            <div className="mb-3">
              <p className="text-xs text-stone-500 mb-1.5">Fijos</p>
              {fixedCats.length === 0 ? (
                <p className="text-xs text-stone-400">No tienes ninguna categoría fija activada. Actívala en Ajustes.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {fixedCats.map((c) => (
                    <Chip
                      key={c.id}
                      tone="fixed"
                      label={c.name}
                      active={categoryId === c.id}
                      onClick={() => {
                        setCategoryId(c.id);
                        setSubcategory("");
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="mb-3">
              <p className="text-xs text-stone-500 mb-1.5">Variables</p>
              {variableCats.length === 0 ? (
                <p className="text-xs text-stone-400">No tienes ninguna categoría variable activada. Actívala en Ajustes.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {variableCats.map((c) => (
                    <Chip
                      key={c.id}
                      tone="variable"
                      label={c.name}
                      active={categoryId === c.id}
                      onClick={() => {
                        setCategoryId(c.id);
                        setSubcategory("");
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            {isPremium && currentCat && currentCat.subcategories.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-stone-500 mb-1.5">Subcategoría</p>
                <div className="flex flex-wrap gap-1.5">
                  <Chip label="Sin subcategoría" active={!subcategory} onClick={() => setSubcategory("")} />
                  {currentCat.subcategories.map((sc) => (
                    <Chip key={sc.id} label={sc.name} active={subcategory === sc.name} onClick={() => setSubcategory(sc.name)} />
                  ))}
                </div>
              </div>
            )}
            {isPremium && categoryBudget > 0 && (
              <p
                className={`text-xs rounded-md px-3 py-2 mb-3 ${projectedCategoryTotal > categoryBudget ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}
              >
                Llevas {fmt(spentInCategoryThisMonth)} de {fmt(categoryBudget)} en {currentCat!.name} este mes.
                {amt > 0
                  ? projectedCategoryTotal > categoryBudget
                    ? ` Con este gasto lo superarás en ${fmt(projectedCategoryTotal - categoryBudget)}.`
                    : ` Con este gasto quedarían ${fmt(categoryBudget - projectedCategoryTotal)} libres.`
                  : ""}
              </p>
            )}
            {showGlobalBudgetNotice && (
              <p
                className={`text-xs rounded-md px-3 py-2 mb-3 ${projectedVariableTotal > variableBudget ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}
              >
                Llevas {fmt(spentVariableThisMonth)} de {fmt(variableBudget)} en gasto variable este mes.
                {amt > 0
                  ? projectedVariableTotal > variableBudget
                    ? ` Con este gasto lo superarás en ${fmt(projectedVariableTotal - variableBudget)}.`
                    : ` Con este gasto quedarían ${fmt(variableBudget - projectedVariableTotal)} libres.`
                  : ""}
              </p>
            )}
            <label className="flex items-center gap-2 text-sm mb-1">
              <input type="checkbox" checked={fundedByFund} onChange={(e) => setFundedByFund(e.target.checked)} />
              Pagado con ahorro (fondo o ahorro libre acumulado)
            </label>
            {fundedByFund && (
              <>
                <p className="text-xs text-stone-400 mb-2">
                  No afecta a tu ahorro total del mes: se descuenta del ahorro libre consolidado (lo acumulado en meses
                  anteriores). El sobrante de este mes es ahorro en curso y todavía no puedes gastarlo como ahorro.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {fundingOptions.map((f) => (
                    <Chip
                      key={f.id}
                      tone="amber"
                      label={`${f.name} · ${fmt(f.balance)}`}
                      active={fundedId === f.id}
                      onClick={() => setFundedId(f.id)}
                    />
                  ))}
                </div>
                {fundedExcede && (
                  <p className="text-xs text-rose-600 mt-1 mb-3">
                    No hay suficiente en {fundedFund!.name} ({fmt(fundedFund!.balance)} disponibles).
                  </p>
                )}
              </>
            )}
            {amt > 0 && !fundedByFund && remaining > 0 && amt > remaining && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-2 mb-3 mt-3">
                Este importe supera tu ahorro real disponible ({fmt(remaining)}). Al guardar te preguntaremos si quieres cubrir la
                diferencia con un fondo o tu ahorro libre.
              </p>
            )}
          </>
        )}

        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onWheel={(e) => e.currentTarget.blur()}
          placeholder="Importe (€)"
          className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-base font-mono mb-3 mt-3"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-base mb-1"
        />
        {date &&
          (() => {
            const diff = (new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
            return diff > 365 ? (
              <p className="text-xs text-amber-700 mb-2">Esta fecha es a más de 12 meses en el futuro. ¿Seguro que es correcta?</p>
            ) : diff < -730 ? (
              <p className="text-xs text-amber-700 mb-2">Esta fecha es de hace más de 2 años. ¿Seguro que es correcta?</p>
            ) : (
              <div className="mb-2" />
            );
          })()}
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nota (opcional)"
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-base mb-4"
        />
        {showCategoryError && type === "gasto" && !categoryId && (
          <p className="text-xs text-rose-500 mb-2">Elige una categoría arriba antes de guardar.</p>
        )}
        <button
          onClick={submit}
          disabled={retiroExcedeFondo || fundedExcede}
          className="w-full bg-teal-700 disabled:opacity-40 text-white rounded-lg py-2.5 text-sm font-medium"
        >
          {editingTx ? "Guardar cambios" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
