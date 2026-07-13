import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, PiggyBank, Wallet, ArrowDownCircle, ArrowUpCircle, X, Settings2, Repeat, Search, Pencil, Download, Upload, Check } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, ReferenceLine } from "recharts";

const INCOME_CATS = ["Ingreso fijo", "Ingreso extra"];
const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MONTHS_FULL = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const uid = () => Math.random().toString(36).slice(2, 10);
const AHORRO_LIBRE_ID = "ahorro_libre";
const todayISO = () => new Date().toISOString().slice(0, 10);
const monthKey = (dateStr) => dateStr.slice(0, 7);
const prevMonthKey = (mKey) => {
  const [y, m] = mKey.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const fmt = (n) => (n < 0 ? "-" : "") + Math.abs(n).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

const TYPE_META = {
  ingreso: { color: "text-emerald-700", sign: 1 },
  gasto: { color: "text-rose-700", sign: -1 },
  aportacion: { color: "text-teal-700", sign: -1 },
  retiro: { color: "text-amber-700", sign: 1 },
  inversion: { color: "text-indigo-700", sign: -1 },
};

const DEFAULT_CATEGORIES = [
  { id: uid(), type: "fixed", name: "Vivienda", subcategories: [] },
  { id: uid(), type: "fixed", name: "Suministros", subcategories: [] },
  { id: uid(), type: "fixed", name: "Seguros", subcategories: [] },
  { id: uid(), type: "fixed", name: "Suscripciones", subcategories: [] },
  { id: uid(), type: "fixed", name: "Otros fijos", subcategories: [] },
  { id: uid(), type: "variable", name: "Alimentación", subcategories: [{ id: uid(), name: "Supermercado" }, { id: uid(), name: "Restaurantes" }] },
  { id: uid(), type: "variable", name: "Transporte", subcategories: [{ id: uid(), name: "Gasolina" }, { id: uid(), name: "Transporte público" }, { id: uid(), name: "Taxi/VTC" }] },
  { id: uid(), type: "variable", name: "Ocio", subcategories: [{ id: uid(), name: "Cine" }, { id: uid(), name: "Tapas" }, { id: uid(), name: "Restaurantes" }, { id: uid(), name: "Otros ocio" }] },
  { id: uid(), type: "variable", name: "Salud", subcategories: [{ id: uid(), name: "Farmacia" }, { id: uid(), name: "Médico" }] },
  { id: uid(), type: "variable", name: "Imprevistos", subcategories: [] },
  { id: uid(), type: "variable", name: "Otros variables", subcategories: [] },
];

function Chip({ label, active, onClick, tone = "neutral" }) {
  const tones = {
    fixed: active ? "bg-slate-800 text-white border-slate-800" : "border-stone-200 text-slate-600 bg-white",
    variable: active ? "bg-rose-600 text-white border-rose-600" : "border-stone-200 text-rose-700 bg-white",
    neutral: active ? "bg-teal-700 text-white border-teal-700" : "border-stone-200 text-teal-800 bg-white",
    amber: active ? "bg-amber-600 text-white border-amber-600" : "border-stone-200 text-amber-700 bg-white",
    indigo: active ? "bg-indigo-600 text-white border-indigo-600" : "border-stone-200 text-indigo-700 bg-white",
  };
  return <button onClick={onClick} className={`text-xs rounded-full px-3 py-1.5 border whitespace-nowrap ${tones[tone]}`}>{label}</button>;
}

export default function GestorFinanzas() {
  const [loaded, setLoaded] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [funds, setFunds] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [recurring, setRecurring] = useState([]);
  const [recurringIncome, setRecurringIncome] = useState([]);
  const [assets, setAssets] = useState([]);
  const [investmentConfig, setInvestmentConfig] = useState({ globalPct: 0 });
  const [variableBudget, setVariableBudget] = useState(0);
  const [tab, setTab] = useState("movimientos");
  const [ajustesSection, setAjustesSection] = useState("categorias");
  const goToAjustes = (section) => { setAjustesSection(section || "categorias"); setTab("ajustes"); };
  const [cursor, setCursor] = useState(() => new Date());
  const [showForm, setShowForm] = useState(false);
  const [formPreset, setFormPreset] = useState(null);
  const [editingTx, setEditingTx] = useState(null);
  const [showApplyPresets, setShowApplyPresets] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 2500); };

  useEffect(() => {
    (async () => {
      for (const [key, setter] of [["transactions", setTransactions], ["funds", setFunds], ["categories", setCategories], ["recurring", setRecurring], ["recurringIncome", setRecurringIncome], ["assets", setAssets], ["investmentConfig", setInvestmentConfig], ["variableBudget", setVariableBudget]]) {
        try { const r = await window.storage.get(key); if (r) setter(JSON.parse(r.value)); } catch (e) {}
      }
      setLoaded(true);
    })();
  }, []);
  useEffect(() => { if (loaded) window.storage.set("transactions", JSON.stringify(transactions)).catch(() => {}); }, [transactions, loaded]);
  useEffect(() => { if (loaded) window.storage.set("funds", JSON.stringify(funds)).catch(() => {}); }, [funds, loaded]);
  useEffect(() => { if (loaded) window.storage.set("categories", JSON.stringify(categories)).catch(() => {}); }, [categories, loaded]);
  useEffect(() => { if (loaded) window.storage.set("recurring", JSON.stringify(recurring)).catch(() => {}); }, [recurring, loaded]);
  useEffect(() => { if (loaded) window.storage.set("recurringIncome", JSON.stringify(recurringIncome)).catch(() => {}); }, [recurringIncome, loaded]);
  useEffect(() => { if (loaded) window.storage.set("assets", JSON.stringify(assets)).catch(() => {}); }, [assets, loaded]);
  useEffect(() => { if (loaded) window.storage.set("investmentConfig", JSON.stringify(investmentConfig)).catch(() => {}); }, [investmentConfig, loaded]);
  useEffect(() => { if (loaded) window.storage.set("variableBudget", JSON.stringify(variableBudget)).catch(() => {}); }, [variableBudget, loaded]);

  const year = cursor.getFullYear();
  const monthIdx = cursor.getMonth();
  const selectedMonthKey = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;

  const addTransaction = (tx) => {
    if (tx.type === "gasto" && tx.splitFundId) {
      const splitId = uid();
      const ordinarioAmount = Math.max(0, tx.amount - tx.splitFundAmount);
      const { splitFundId, splitFundAmount, ...base } = tx;
      setTransactions((prev) => [
        ...prev,
        { id: uid(), ...base, amount: ordinarioAmount, fundedBy: null, splitId },
        { id: uid(), ...base, amount: splitFundAmount, fundedBy: splitFundId, splitId },
      ]);
      return;
    }
    setTransactions((prev) => [...prev, { id: uid(), ...tx }]);
  };

  const deleteTransaction = (id) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;
    if (tx.splitId) {
      setTransactions((prev) => prev.filter((t) => t.splitId !== tx.splitId));
    } else {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const editTransaction = (id, updates) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const addFund = (name) => setFunds((prev) => [...prev, { id: uid(), name }]);
  const addAsset = (name) => setAssets((prev) => [...prev, { id: uid(), name, pct: 0 }]);

  // El saldo de cada fondo se calcula siempre a partir del historial de movimientos,
  // nunca se guarda ni se modifica directamente, así no se puede desincronizar.
  const fundsWithBalance = useMemo(() => funds.map((f) => {
    const aportado = transactions.filter((t) => t.type === "aportacion" && t.fundId === f.id).reduce((s, t) => s + t.amount, 0);
    const retirado = transactions.filter((t) => t.type === "retiro" && t.fundId === f.id).reduce((s, t) => s + t.amount, 0);
    const usado = transactions.filter((t) => t.type === "gasto" && t.fundedBy === f.id).reduce((s, t) => s + t.amount, 0);
    return { ...f, balance: aportado - retirado - usado };
  }), [funds, transactions]);

  const assetsWithTotal = useMemo(() => assets.map((a) => {
    const invertido = transactions.filter((t) => t.type === "inversion" && t.category === a.name).reduce((s, t) => s + t.amount, 0);
    return { ...a, invertido };
  }), [assets, transactions]);

  // Versiones "a fecha de" para la tarjeta de patrimonio histórica
  const fundsBalanceHasta = (mKey) => funds.map((f) => {
    const rel = transactions.filter((t) => monthKey(t.date) <= mKey);
    const aportado = rel.filter((t) => t.type === "aportacion" && t.fundId === f.id).reduce((s, t) => s + t.amount, 0);
    const retirado = rel.filter((t) => t.type === "retiro" && t.fundId === f.id).reduce((s, t) => s + t.amount, 0);
    const usado = rel.filter((t) => t.type === "gasto" && t.fundedBy === f.id).reduce((s, t) => s + t.amount, 0);
    return { ...f, balance: aportado - retirado - usado };
  });
  const assetsHasta = (mKey) => assets.map((a) => {
    const invertido = transactions.filter((t) => t.type === "inversion" && t.category === a.name && monthKey(t.date) <= mKey).reduce((s, t) => s + t.amount, 0);
    return { ...a, invertido };
  });

  const ahorroLibreBruto = useMemo(() => {
    const ingresosTotal = transactions.filter((t) => t.type === "ingreso" || t.type === "retiro").reduce((s, t) => s + t.amount, 0);
    const gastosOrdinariosTotal = transactions.filter((t) => t.type === "gasto" && !t.fundedBy).reduce((s, t) => s + t.amount, 0);
    const aportacionesTotal = transactions.filter((t) => t.type === "aportacion").reduce((s, t) => s + t.amount, 0);
    const inversionTotal = transactions.filter((t) => t.type === "inversion").reduce((s, t) => s + t.amount, 0);
    return ingresosTotal - gastosOrdinariosTotal - aportacionesTotal - inversionTotal;
  }, [transactions]);
  const gastoLibreTotal = useMemo(() => transactions.filter((t) => t.type === "gasto" && t.fundedBy === AHORRO_LIBRE_ID).reduce((s, t) => s + t.amount, 0), [transactions]);
  const ahorroLibreAcumulado = ahorroLibreBruto - gastoLibreTotal;
  const ahorroLibrePseudoFund = { id: AHORRO_LIBRE_ID, name: "Ahorro libre acumulado", balance: ahorroLibreAcumulado, virtualTotalAportado: ahorroLibreBruto };
  const fundsForUsageDisplay = [ahorroLibrePseudoFund, ...fundsWithBalance];

  const ahorroLibreHasta = (mKey) => {
    const relevant = transactions.filter((t) => monthKey(t.date) <= mKey);
    const ingresosTotal = relevant.filter((t) => t.type === "ingreso" || t.type === "retiro").reduce((s, t) => s + t.amount, 0);
    const gastosOrdinariosTotal = relevant.filter((t) => t.type === "gasto" && !t.fundedBy).reduce((s, t) => s + t.amount, 0);
    const aportacionesTotal = relevant.filter((t) => t.type === "aportacion").reduce((s, t) => s + t.amount, 0);
    const inversionTotal = relevant.filter((t) => t.type === "inversion").reduce((s, t) => s + t.amount, 0);
    const gastoLibre = relevant.filter((t) => t.type === "gasto" && t.fundedBy === AHORRO_LIBRE_ID).reduce((s, t) => s + t.amount, 0);
    return ingresosTotal - gastosOrdinariosTotal - aportacionesTotal - inversionTotal - gastoLibre;
  };

  const ahorroLibreDisponibleParaMes = (mKey) => ahorroLibreHasta(prevMonthKey(mKey));
  const currentMonthKey = monthKey(todayISO());

  const monthTx = useMemo(() => transactions.filter((t) => monthKey(t.date) === selectedMonthKey).sort((a, b) => (a.date < b.date ? 1 : -1)), [transactions, selectedMonthKey]);

  const computeMonth = (mKey) => {
    const tx = transactions.filter((t) => monthKey(t.date) === mKey);
    const ingresos = tx.filter((t) => t.type === "ingreso" || t.type === "retiro").reduce((s, t) => s + t.amount, 0);
    const gastoTx = tx.filter((t) => t.type === "gasto");
    const fixedOrdinario = gastoTx.filter((t) => t.fixed && !t.fundedBy).reduce((s, t) => s + t.amount, 0);
    const variableOrdinario = gastoTx.filter((t) => !t.fixed && !t.fundedBy).reduce((s, t) => s + t.amount, 0);
    const gastosFinanciados = gastoTx.filter((t) => t.fundedBy).reduce((s, t) => s + t.amount, 0);
    const gastosFinanciadosLibre = gastoTx.filter((t) => t.fundedBy === AHORRO_LIBRE_ID).reduce((s, t) => s + t.amount, 0);
    const gastosOrdinarios = fixedOrdinario + variableOrdinario;
    const aportaciones = tx.filter((t) => t.type === "aportacion").reduce((s, t) => s + t.amount, 0);
    const inversion = tx.filter((t) => t.type === "inversion").reduce((s, t) => s + t.amount, 0);
    const ahorroTotal = ingresos - gastosOrdinarios;
    const ahorroReal = ahorroTotal - aportaciones - inversion;
    return { ingresos, fixedOrdinario, variableOrdinario, gastosOrdinarios, gastosFinanciados, gastosFinanciadosLibre, gastosTotal: gastosOrdinarios + gastosFinanciados, aportaciones, inversion, ahorroTotal, ahorroReal };
  };

  const monthStats = computeMonth(selectedMonthKey);

  const yearMonthsData = useMemo(() => {
    let acumulado = ahorroLibreHasta(`${year - 1}-12`);
    return Array.from({ length: 12 }, (_, i) => {
      const mKey = `${year}-${String(i + 1).padStart(2, "0")}`;
      const s = computeMonth(mKey);
      acumulado += s.ahorroReal - s.gastosFinanciadosLibre;
      return { mes: MONTHS_ES[i], ingresos: s.ingresos, gastos: s.gastosOrdinarios + s.inversion, fixedOrdinario: s.fixedOrdinario, variableOrdinario: s.variableOrdinario, gastosFinanciados: s.gastosFinanciados, inversion: s.inversion, ahorroReal: s.ahorroReal, tasaAhorro: s.ingresos ? (s.ahorroReal / s.ingresos) * 100 : 0, acumulado };
    });
  }, [transactions, year]);

  const yearTotals = yearMonthsData.reduce((acc, m) => ({
    ingresos: acc.ingresos + m.ingresos, gastos: acc.gastos + m.gastos, ahorroReal: acc.ahorroReal + m.ahorroReal,
    fixedOrdinario: acc.fixedOrdinario + m.fixedOrdinario, variableOrdinario: acc.variableOrdinario + m.variableOrdinario, gastosFinanciados: acc.gastosFinanciados + m.gastosFinanciados,
    inversion: acc.inversion + m.inversion,
  }), { ingresos: 0, gastos: 0, ahorroReal: 0, fixedOrdinario: 0, variableOrdinario: 0, gastosFinanciados: 0, inversion: 0 });

  const totalInvertido = assetsWithTotal.reduce((s, a) => s + a.invertido, 0);
  const changeMonth = (delta) => { const d = new Date(cursor); d.setMonth(d.getMonth() + delta); setCursor(d); };
  const changeYear = (delta) => { const d = new Date(cursor); d.setFullYear(d.getFullYear() + delta); setCursor(d); };
  const goToMonthIndex = (m) => { const d = new Date(cursor); d.setMonth(m); setCursor(d); };
  const getAhorroReal = (y, m) => computeMonth(`${y}-${String(m + 1).padStart(2, "0")}`).ahorroReal;

  const trendUltimos6Meses = useMemo(() => {
    const out = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, monthIdx - i, 1);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      out.push({ mes: MONTHS_ES[d.getMonth()], value: computeMonth(mKey).ahorroReal });
    }
    return out;
  }, [transactions, year, monthIdx]);
  const pendingRecurring = recurring.filter((r) => !monthTx.some((t) => t.recurringId === r.id));
  const pendingIncome = recurringIncome.filter((r) => !monthTx.some((t) => t.recurringIncomeId === r.id));
  const hasInvestmentPlan = investmentConfig.globalPct > 0 && assets.length > 0;
  const pendingInvestment = hasInvestmentPlan && !monthTx.some((t) => t.type === "inversion");
  const hasAnyPending = pendingRecurring.length > 0 || pendingInvestment || pendingIncome.length > 0;
  const hasAnyConfigured = recurring.length > 0 || recurringIncome.length > 0 || hasInvestmentPlan;

  const applyPresets = ({ income, expenses, investment }) => {
    const baseDate = selectedMonthKey === monthKey(todayISO()) ? todayISO() : `${selectedMonthKey}-01`;
    const dateWithDay = (day) => {
      if (!day) return baseDate;
      const [y, m] = selectedMonthKey.split("-");
      const maxDay = new Date(parseInt(y), parseInt(m), 0).getDate();
      return `${selectedMonthKey}-${String(Math.min(day, maxDay)).padStart(2, "0")}`;
    };
    income.forEach((it) => {
      const tpl = recurringIncome.find((r) => r.id === it.id);
      if (!tpl || it.amount <= 0) return;
      addTransaction({ type: "ingreso", amount: it.amount, date: dateWithDay(tpl.day), category: tpl.incomeCat, note: tpl.note || "", recurringIncomeId: tpl.id });
    });
    expenses.forEach((it) => {
      const tpl = recurring.find((r) => r.id === it.id);
      if (!tpl || it.amount <= 0) return;
      const cat = categories.find((c) => c.id === tpl.categoryId);
      addTransaction({ type: "gasto", fixed: true, amount: it.amount, date: dateWithDay(tpl.day), category: cat?.name || "", subcategory: tpl.subcategory || null, note: tpl.note || "", fundedBy: null, recurringId: tpl.id });
    });
    investment.forEach((it) => {
      const asset = assets.find((a) => a.id === it.id);
      if (!asset || it.amount <= 0) return;
      addTransaction({ type: "inversion", amount: it.amount, date: baseDate, category: asset.name, note: "Plan de inversión mensual" });
    });
    setShowApplyPresets(false);
    showToast("Preestablecidos aplicados");
  };

  const exportData = () => {
    const data = { version: 1, exportedAt: new Date().toISOString(), transactions, funds, categories, recurring, recurringIncome, assets, investmentConfig, variableBudget };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mis-cuentas-backup-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (data) => {
    if (!data || typeof data !== "object") return false;
    if (Array.isArray(data.transactions)) setTransactions(data.transactions);
    if (Array.isArray(data.funds)) setFunds(data.funds);
    if (Array.isArray(data.categories)) setCategories(data.categories);
    if (Array.isArray(data.recurring)) setRecurring(data.recurring);
    if (Array.isArray(data.recurringIncome)) setRecurringIncome(data.recurringIncome);
    if (Array.isArray(data.assets)) setAssets(data.assets);
    if (data.investmentConfig) setInvestmentConfig(data.investmentConfig);
    if (data.variableBudget != null) setVariableBudget(data.variableBudget);
    return true;
  };

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 flex flex-col font-sans">
      <header className="bg-slate-800 text-stone-50 px-5 pt-6 pb-4">
        <h1 className="font-serif text-xl tracking-tight">Mis cuentas</h1>
        <p className="text-stone-300 text-sm mt-0.5">Registro, fondos y resúmenes</p>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24 max-w-md w-full mx-auto">
        {tab === "movimientos" && (
          <MovimientosTab monthIdx={monthIdx} year={year} changeMonth={changeMonth} changeYear={changeYear} goToMonthIndex={goToMonthIndex} getAhorroReal={getAhorroReal} monthTx={monthTx} allTransactions={transactions} stats={monthStats} funds={fundsWithBalance}
            deleteTransaction={deleteTransaction} onAdd={() => { setFormPreset(null); setEditingTx(null); setShowForm(true); }}
            onEdit={(tx) => { setEditingTx(tx); setFormPreset(null); setShowForm(true); }}
            hasAnyPending={hasAnyPending} hasAnyConfigured={hasAnyConfigured} onOpenApplyPresets={() => setShowApplyPresets(true)} onGoToAjustes={() => goToAjustes()} toast={showToast} />
        )}
        {tab === "fondos" && (
          <FondosTab funds={fundsWithBalance} addFund={addFund} renameFund={(id, name) => setFunds((p) => p.map((f) => (f.id === id ? { ...f, name } : f)))} deleteFund={(id) => setFunds((p) => p.filter((f) => f.id !== id))}
            assets={assetsWithTotal} selectedMonthKey={selectedMonthKey} currentMonthKey={currentMonthKey}
            fundsBalanceHasta={fundsBalanceHasta} assetsHasta={assetsHasta} ahorroLibreHasta={ahorroLibreHasta} ahorroLibreDisponibleParaMes={ahorroLibreDisponibleParaMes}
            monthIdx={monthIdx} year={year} changeMonth={changeMonth} changeYear={changeYear} goToMonthIndex={goToMonthIndex} getAhorroReal={getAhorroReal}
            onQuickMove={(fund, type) => { setFormPreset({ type, fundId: fund.id }); setEditingTx(null); setShowForm(true); }}
            onQuickInvest={(asset) => { setFormPreset({ type: "inversion", assetId: asset.id }); setEditingTx(null); setShowForm(true); }}
            onGoToAjustes={() => goToAjustes("inversion")} />
        )}
        {tab === "mensual" && <MensualTab monthIdx={monthIdx} year={year} changeMonth={changeMonth} changeYear={changeYear} goToMonthIndex={goToMonthIndex} getAhorroReal={getAhorroReal} stats={monthStats} monthTx={monthTx} categories={categories} funds={fundsForUsageDisplay} assets={assets} transactions={transactions} variableBudget={variableBudget} trend6Meses={trendUltimos6Meses} onGoToAjustes={() => goToAjustes("categorias")} />}
        {tab === "anual" && <AnualTab year={year} changeYear={changeYear} data={yearMonthsData} totals={yearTotals} transactions={transactions} assets={assets} variableBudget={variableBudget} />}
        {tab === "ajustes" && (
          <AjustesTab categories={categories} setCategories={setCategories} recurring={recurring} setRecurring={setRecurring}
            recurringIncome={recurringIncome} setRecurringIncome={setRecurringIncome}
            assets={assets} setAssets={setAssets} addAsset={addAsset} investmentConfig={investmentConfig} setInvestmentConfig={setInvestmentConfig}
            variableBudget={variableBudget} setVariableBudget={setVariableBudget}
            initialSection={ajustesSection} onExport={exportData} onImport={importData} />
        )}
      </main>

      {showForm && (
        <NuevoMovimientoForm funds={fundsWithBalance} getAhorroLibreDisponibleParaMes={ahorroLibreDisponibleParaMes} categories={categories} assets={assetsWithTotal} ahorroRealDisponible={monthStats.ahorroReal} monthTx={monthTx} initial={formPreset} editingTx={editingTx}
          defaultDate={selectedMonthKey === monthKey(todayISO()) ? todayISO() : `${selectedMonthKey}-01`}
          onClose={() => { setShowForm(false); setEditingTx(null); }}
          onSave={(tx) => { if (editingTx) { editTransaction(editingTx.id, tx); showToast("Movimiento actualizado"); } else { addTransaction(tx); showToast("Movimiento guardado"); } setShowForm(false); setEditingTx(null); }} />
      )}
      {showApplyPresets && (
        <ApplyPresetsModal pendingIncome={pendingIncome} pendingRecurring={pendingRecurring} pendingInvestment={pendingInvestment}
          categories={categories} assets={assets} investmentConfig={investmentConfig} ingresos={monthStats.ingresos + pendingIncome.reduce((s, r) => s + r.amount, 0)}
          onClose={() => setShowApplyPresets(false)} onConfirm={applyPresets} />
      )}

      <nav className="sticky bottom-0 bg-white border-t border-stone-200 flex justify-around py-2 max-w-md w-full mx-auto">
        <NavButton icon={<Wallet size={18} />} label="Movim." active={tab === "movimientos"} onClick={() => setTab("movimientos")} />
        <NavButton icon={<PiggyBank size={18} />} label="Fondos" active={tab === "fondos"} onClick={() => setTab("fondos")} />
        <NavButton icon={<ArrowUpCircle size={18} />} label="Mensual" active={tab === "mensual"} onClick={() => setTab("mensual")} />
        <NavButton icon={<ArrowDownCircle size={18} />} label="Anual" active={tab === "anual"} onClick={() => setTab("anual")} />
        <NavButton icon={<Settings2 size={18} />} label="Ajustes" active={tab === "ajustes"} onClick={() => setTab("ajustes")} />
      </nav>
      {toastMsg && <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">{toastMsg}</div>}
    </div>
  );
}

function NavButton({ icon, label, active, onClick }) {
  return <button onClick={onClick} className={`flex flex-col items-center gap-0.5 px-1.5 py-1 text-[11px] ${active ? "text-teal-700" : "text-stone-400"}`}>{icon}{label}</button>;
}

function MonthSwitcher({ monthIdx, year, changeMonth, changeYear, goToMonthIndex, getAhorroReal }) {
  const [open, setOpen] = useState(false);
  const hasPicker = !!(changeYear && goToMonthIndex);
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between">
        <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-full hover:bg-stone-200 text-slate-600"><ChevronLeft size={18} /></button>
        {hasPicker ? (
          <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 font-serif text-base capitalize">
            {MONTHS_FULL[monthIdx]} {year} <ChevronDown size={15} className={`text-stone-400 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        ) : (
          <span className="font-serif text-base capitalize">{MONTHS_FULL[monthIdx]} {year}</span>
        )}
        <button onClick={() => changeMonth(1)} className="p-1.5 rounded-full hover:bg-stone-200 text-slate-600"><ChevronRight size={18} /></button>
      </div>
      {open && hasPicker && (
        <div className="mt-2 bg-white border border-stone-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2.5">
            <button onClick={() => changeYear(-1)} className="p-1 rounded-full hover:bg-stone-100 text-slate-500"><ChevronLeft size={16} /></button>
            <span className="text-sm font-medium">{year}</span>
            <button onClick={() => changeYear(1)} className="p-1 rounded-full hover:bg-stone-100 text-slate-500"><ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {MONTHS_ES.map((m, i) => {
              const ahorro = getAhorroReal ? getAhorroReal(year, i) : 0;
              const dot = ahorro > 0 ? "bg-teal-500" : ahorro < 0 ? "bg-rose-500" : "bg-stone-300";
              const active = i === monthIdx;
              return (
                <button key={m} onClick={() => { goToMonthIndex(i); setOpen(false); }} className={`flex flex-col items-center gap-1 rounded-lg py-2 text-xs ${active ? "bg-slate-800 text-white" : "bg-stone-50 text-slate-600"}`}>
                  {m}
                  <span className={`w-1.5 h-1.5 rounded-full ${dot} ${active ? "ring-2 ring-white ring-offset-1 ring-offset-slate-800" : ""}`} />
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-stone-400 mt-2">Verde: ahorro real positivo ese mes · Rojo: negativo</p>
        </div>
      )}
    </div>
  );
}

function mergeSplitDisplay(monthTx, funds) {
  const seen = new Set();
  const items = [];
  monthTx.forEach((t) => {
    if (seen.has(t.id)) return;
    if (t.splitId) {
      const group = monthTx.filter((g) => g.splitId === t.splitId);
      group.forEach((g) => seen.add(g.id));
      const total = group.reduce((s, g) => s + g.amount, 0);
      const fundedPart = group.find((g) => g.fundedBy);
      const fund = fundedPart ? funds.find((f) => f.id === fundedPart.fundedBy) : null;
      items.push({ ids: group.map((g) => g.id), date: t.date, category: t.category, subcategory: t.subcategory, note: t.note, type: "gasto", amount: total, splitLabel: fund ? `parte pagada con ahorro (${fund.name}: ${fmt(fundedPart.amount)})` : null });
    } else {
      seen.add(t.id);
      items.push({ ids: [t.id], date: t.date, category: t.category, subcategory: t.subcategory, note: t.note, type: t.type, amount: t.amount, fundedBy: t.fundedBy, raw: t });
    }
  });
  return items;
}

function MovimientosTab({ monthIdx, year, changeMonth, changeYear, goToMonthIndex, getAhorroReal, monthTx, allTransactions, stats, funds, deleteTransaction, onAdd, onEdit, hasAnyPending, hasAnyConfigured, onOpenApplyPresets, onGoToAjustes, toast }) {
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const displayItems = useMemo(() => mergeSplitDisplay(monthTx, funds), [monthTx, funds]);

  const searchResults = useMemo(() => {
    if (!search.trim() && !filterType) return [];
    const q = search.trim().toLowerCase();
    return allTransactions
      .filter((t) => (!filterType || t.type === filterType) && (!q || (t.category || "").toLowerCase().includes(q) || (t.subcategory || "").toLowerCase().includes(q) || (t.note || "").toLowerCase().includes(q)))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 50);
  }, [search, filterType, allTransactions]);

  const searching = search.trim().length > 0 || filterType;
  const selectedIds = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
  const selectedTotal = allTransactions.filter((t) => selectedIds.includes(t.id)).reduce((s, t) => s + t.amount, 0);

  const doDeleteSelected = () => {
    selectedIds.forEach((id) => deleteTransaction(id));
    setSelected({});
    setSelectMode(false);
    setConfirmDelete(false);
    toast(`${selectedIds.length} movimiento${selectedIds.length > 1 ? "s" : ""} eliminado${selectedIds.length > 1 ? "s" : ""}`);
  };

  const toggleSelect = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const renderTxRow = (t, id, canEdit) => (
    <div key={id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2.5 border border-stone-100">
      {selectMode && <input type="checkbox" checked={!!selected[id]} onChange={() => toggleSelect(id)} className="mr-2 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-sm truncate">{t.category}{t.subcategory ? ` · ${t.subcategory}` : ""}{t.note ? ` · ${t.note}` : ""}{t.fundedBy ? " · pagado con ahorro" : ""}</p>
        <p className="text-xs text-stone-400">{t.date}{t.splitLabel ? ` · ${t.splitLabel}` : ""}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`font-mono text-sm ${TYPE_META[t.type].color}`}>{TYPE_META[t.type].sign > 0 ? "+" : "-"}{fmt(t.amount)}</span>
        {!selectMode && canEdit && <button onClick={() => onEdit(t.raw || t)} className="text-stone-300 hover:text-slate-700"><Pencil size={14} /></button>}
        {!selectMode && <button onClick={() => setDeleteConfirmId(id)} className="text-stone-300 hover:text-rose-600"><Trash2 size={15} /></button>}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex-1"><MonthSwitcher monthIdx={monthIdx} year={year} changeMonth={changeMonth} changeYear={changeYear} goToMonthIndex={goToMonthIndex} getAhorroReal={getAhorroReal} /></div>
      </div>
      <div className="flex justify-between items-center -mt-2 mb-2">
        <button onClick={onGoToAjustes} className="flex items-center gap-1 text-xs text-stone-400"><Repeat size={13} /> Preestablecidos</button>
        <div className="flex gap-3">
          {!selectMode && <button onClick={() => setShowSearch((s) => !s)} className="flex items-center gap-1 text-xs text-stone-400"><Search size={13} /> Buscar</button>}
          <button onClick={() => { setSelectMode((s) => !s); setSelected({}); }} className={`flex items-center gap-1 text-xs ${selectMode ? "text-rose-600 font-medium" : "text-stone-400"}`}>{selectMode ? "Cancelar selección" : "Seleccionar"}</button>
        </div>
      </div>

      {showSearch && (
        <div className="mb-3 space-y-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por categoría, nota..." className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white" autoFocus />
          <div className="flex flex-wrap gap-1.5">
            <Chip label="Todos" active={!filterType} onClick={() => setFilterType("")} />
            {[["ingreso", "Ingresos"], ["gasto", "Gastos"], ["inversion", "Inversión"], ["aportacion", "Aportaciones"], ["retiro", "Retiros"]].map(([v, l]) => (
              <Chip key={v} label={l} active={filterType === v} onClick={() => setFilterType(filterType === v ? "" : v)} />
            ))}
          </div>
        </div>
      )}

      {selectMode && selectedIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-2.5 mb-3 flex items-center justify-between">
          <span className="text-sm text-rose-800">{selectedIds.length} seleccionado{selectedIds.length > 1 ? "s" : ""} · {fmt(selectedTotal)}</span>
          <button onClick={() => setConfirmDelete(true)} className="bg-rose-600 text-white rounded-md px-3 py-1 text-xs font-medium">Borrar</button>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-20" onClick={() => setConfirmDelete(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
            <p className="font-serif text-base mb-2">¿Borrar {selectedIds.length} movimiento{selectedIds.length > 1 ? "s" : ""}?</p>
            <p className="text-sm text-stone-600 mb-4">Se eliminarán permanentemente y se recalcularán todos los saldos afectados.</p>
            <button onClick={doDeleteSelected} className="w-full bg-rose-600 text-white rounded-lg py-2.5 text-sm font-medium mb-2">Sí, borrar</button>
            <button onClick={() => setConfirmDelete(false)} className="w-full border border-stone-200 text-stone-600 rounded-lg py-2.5 text-sm font-medium">Cancelar</button>
          </div>
        </div>
      )}

      {!searching && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <StatCard label="Ingresos" value={stats.ingresos} tone="emerald" />
            <StatCard label="Gastos" value={stats.gastosOrdinarios} tone="rose" />
            <StatCard label="Sobrante del mes" value={stats.ahorroTotal} tone="slate" />
            <StatCard label="Libre en curso" value={stats.ahorroReal} tone="teal" />
          </div>
          {stats.gastosFinanciados > 0 && <p className="text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-2 mb-3">+ {fmt(stats.gastosFinanciados)} gastados este mes desde fondos de ahorro</p>}
          {stats.inversion > 0 && <p className="text-xs text-indigo-700 bg-indigo-50 rounded-md px-3 py-2 mb-3">{fmt(stats.inversion)} invertidos este mes</p>}

          {hasAnyConfigured && (
            <button onClick={onOpenApplyPresets} className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 mb-2 text-sm font-medium ${hasAnyPending ? "bg-slate-800 text-white" : "bg-stone-100 text-stone-500 border border-stone-200"}`}>
              {hasAnyPending ? <><Repeat size={16} /> Añadir ingresos y gastos preestablecidos</> : <><Check size={16} /> Preestablecidos del mes aplicados</>}
            </button>
          )}

          <button onClick={onAdd} className="w-full flex items-center justify-center gap-2 bg-teal-700 text-white rounded-lg py-2.5 mb-4 text-sm font-medium"><Plus size={16} /> Nuevo movimiento</button>

          <div className="space-y-1">
            {displayItems.length === 0 && <p className="text-stone-400 text-sm text-center py-8">Sin movimientos este mes todavía.</p>}
            {displayItems.map((t) => renderTxRow(t, t.ids[0], !!t.raw))}
          </div>
        </>
      )}

      {searching && (
        <div className="space-y-1">
          <p className="text-xs text-stone-400 mb-2">{searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""}{searchResults.length === 50 ? " (máx. 50)" : ""}</p>
          {searchResults.length === 0 && <p className="text-stone-400 text-sm text-center py-8">No hay movimientos que coincidan.</p>}
          {searchResults.map((t) => renderTxRow({ ...t, raw: t }, t.id, !t.splitId))}
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-20" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-white rounded-t-2xl w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
            <p className="font-serif text-base mb-2">¿Borrar este movimiento?</p>
            <p className="text-sm text-stone-600 mb-4">Se eliminará permanentemente y se recalcularán los saldos afectados.</p>
            <button onClick={() => { deleteTransaction(deleteConfirmId); setDeleteConfirmId(null); toast("Movimiento eliminado"); }} className="w-full bg-rose-600 text-white rounded-lg py-2.5 text-sm font-medium mb-2">Sí, borrar</button>
            <button onClick={() => setDeleteConfirmId(null)} className="w-full border border-stone-200 text-stone-600 rounded-lg py-2.5 text-sm font-medium">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }) {
  const tones = { emerald: "bg-emerald-50 text-emerald-800", rose: "bg-rose-50 text-rose-800", slate: "bg-slate-100 text-slate-800", teal: "bg-teal-50 text-teal-800", indigo: "bg-indigo-50 text-indigo-800", amber: "bg-amber-50 text-amber-800" };
  return <div className={`rounded-lg px-3 py-2.5 ${tones[tone]}`}><p className="text-xs opacity-70">{label}</p><p className="font-mono text-base mt-0.5">{fmt(value)}</p></div>;
}

function FondosTab({ funds, addFund, renameFund, deleteFund, assets, selectedMonthKey, currentMonthKey, fundsBalanceHasta, assetsHasta, ahorroLibreHasta, ahorroLibreDisponibleParaMes, monthIdx, year, changeMonth, changeYear, goToMonthIndex, getAhorroReal, onQuickMove, onQuickInvest, onGoToAjustes }) {
  const [newName, setNewName] = useState("");
  const [editingFundId, setEditingFundId] = useState(null);
  const [editFundName, setEditFundName] = useState("");
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

  const mesLabel = isCurrentMonth ? "actual" : MONTHS_FULL[parseInt(selectedMonthKey.split("-")[1]) - 1] + " " + selectedMonthKey.split("-")[0];
  const enCursoLabel = isCurrentMonth ? "En curso (este mes):" : `Generado en ${MONTHS_FULL[parseInt(selectedMonthKey.split("-")[1]) - 1]}:`;

  return (
    <div>
      <MonthSwitcher monthIdx={monthIdx} year={year} changeMonth={changeMonth} changeYear={changeYear} goToMonthIndex={goToMonthIndex} getAhorroReal={getAhorroReal} />

      {isHistorical && <p className="text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-2 mb-3">Estás viendo datos históricos a cierre de {mesLabel}.</p>}

      <div className={`bg-slate-800 text-stone-50 rounded-lg px-4 py-3 mb-5 ${isHistorical ? "border-2 border-dashed border-slate-500" : ""}`}>
        <p className="text-xs text-stone-300">Patrimonio total{isHistorical ? ` a cierre de ${mesLabel}` : ""}</p>
        <p className="font-mono text-2xl mt-0.5">{fmt(patrimonioTotal)}</p>
        <p className="text-xs text-stone-400 mt-1">Ahorro e inversión son cosas distintas: el ahorro no arriesga valor, la inversión sí.</p>
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-600">
          <div>
            <p className="text-xs text-stone-400">Ahorro (libre + fondos)</p>
            <p className="font-mono text-lg text-teal-400">{fmt(totalAhorro)}</p>
            <div className="text-[11px] text-stone-100 font-medium mt-1 space-y-0.5">
              <div className="flex justify-between"><span>Consolidado:</span><span>{fmt(consolidado)}</span></div>
              <div className="flex justify-between"><span>{enCursoLabel}</span><span>{fmt(enCurso)}</span></div>
              <div className="flex justify-between"><span>Fondos:</span><span>{fmt(totalFondosAtDate)}</span></div>
            </div>
          </div>
          <div>
            <p className="text-xs text-stone-400">Inversión</p>
            <p className="font-mono text-lg text-indigo-400">{fmt(totalInvertidoAtDate)}</p>
            <p className="text-[11px] text-stone-400 mt-1">Sujeta a que suba o baje de valor</p>
          </div>
        </div>
        <p className="text-[11px] text-stone-400 mt-3 pt-2 border-t border-slate-600">"Consolidado" es la suma de lo que te ha sobrado sin usar en meses anteriores. Es dinero ya cerrado que puedes gastar marcando "pagado con ahorro".</p>
      </div>

      <p className="text-sm font-semibold mb-2">Fondos de ahorro</p>
      <div className="flex gap-2 mb-4">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre del fondo (ej. Viajes)" className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white" />
        <button onClick={() => { if (newName.trim()) { addFund(newName.trim()); setNewName(""); } }} className="bg-slate-800 text-white rounded-lg px-3 text-sm"><Plus size={16} /></button>
      </div>
      <div className="space-y-3 mb-2">
        {funds.length === 0 && <p className="text-stone-400 text-sm text-center py-6">Todavía no tienes fondos creados.</p>}
        {fundsAtDate.map((f) => (
          <div key={f.id} className="bg-white rounded-lg border border-stone-100 px-3 py-3">
            {editingFundId === f.id ? (
              <div className="flex gap-2 mb-2">
                <input value={editFundName} onChange={(e) => setEditFundName(e.target.value)} className="flex-1 border border-stone-200 rounded-md px-2 py-1 text-sm" autoFocus />
                <button onClick={() => { renameFund(f.id, editFundName); setEditingFundId(null); }} className="text-teal-700"><Check size={16} /></button>
                <button onClick={() => setEditingFundId(null)} className="text-stone-400"><X size={16} /></button>
              </div>
            ) : (
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm font-medium">{f.name}</span>
                <span className="font-mono text-sm text-teal-700">{fmt(f.balance)}</span>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => onQuickMove(f, "aportacion")} className="flex-1 text-xs bg-teal-50 text-teal-800 rounded-md px-2.5 py-1.5">Aportar</button>
              <button onClick={() => onQuickMove(f, "retiro")} className="flex-1 text-xs bg-amber-50 text-amber-800 rounded-md px-2.5 py-1.5">Retirar</button>
              <button onClick={() => { setEditingFundId(f.id); setEditFundName(f.name); }} className="text-stone-300 hover:text-slate-700"><Pencil size={14} /></button>
              <button onClick={() => { if (f.balance === 0 || confirm(`¿Eliminar "${f.name}"? Tiene ${fmt(f.balance)} de saldo.`)) deleteFund(f.id); }} className="text-stone-300 hover:text-rose-600"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-stone-400 mb-6">Si un gasto lo pagas con dinero de un fondo, márcalo como "pagado con ahorro" al crear ese gasto.</p>

      <p className="text-sm font-semibold mb-2">Inversión</p>
      <p className="text-xs text-stone-400 mb-3">Gestiona tus activos en <button onClick={onGoToAjustes} className="underline text-indigo-700">Ajustes → Inversión</button>.</p>
      <div className="space-y-3">
        {assets.length === 0 && <p className="text-stone-400 text-sm text-center py-6">Todavía no tienes activos. Configúralos en Ajustes → Inversión.</p>}
        {assetsAtDate.map((a) => {
          const pct = totalInvertidoAtDate ? (a.invertido / totalInvertidoAtDate) * 100 : 0;
          return (
            <div key={a.id} className="bg-white rounded-lg border border-stone-100 px-3 py-3">
              <div className="flex justify-between items-baseline mb-1"><span className="text-sm font-medium">{a.name}</span><span className="font-mono text-sm text-indigo-700">{fmt(a.invertido)} · {pct.toFixed(0)}%</span></div>
              <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden mb-2"><div className="h-full bg-indigo-400" style={{ width: `${Math.min(100, pct)}%` }} /></div>
              <button onClick={() => onQuickInvest(a)} className="w-full text-xs bg-indigo-50 text-indigo-800 rounded-md px-2.5 py-1.5">Invertir</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildBreakdown(monthTx, categories, mode) {
  const relevant = mode === "financiado" ? categories : categories.filter((c) => c.type === (mode === "fixedOrdinario" ? "fixed" : "variable"));
  return relevant
    .map((cat) => {
      const catTx = monthTx.filter((t) => t.type === "gasto" && t.category === cat.name && (mode === "financiado" ? !!t.fundedBy : !t.fundedBy));
      const total = catTx.reduce((s, t) => s + t.amount, 0);
      const subcats = cat.subcategories.map((sc) => ({ name: sc.name, total: catTx.filter((t) => t.subcategory === sc.name).reduce((s, t) => s + t.amount, 0) })).filter((sc) => sc.total > 0);
      const sinClasificar = catTx.filter((t) => !t.subcategory).reduce((s, t) => s + t.amount, 0);
      return { name: cat.name, total, subcats, sinClasificar, budget: cat.budget || 0 };
    })
    .filter((c) => c.total > 0);
}

function buildFundUsage(monthTx, transactions, funds) {
  return funds
    .map((fund) => {
      const fundTx = monthTx.filter((t) => t.type === "gasto" && t.fundedBy === fund.id);
      const total = fundTx.reduce((s, t) => s + t.amount, 0);
      if (total <= 0) return null;
      const totalAportado = fund.virtualTotalAportado != null ? fund.virtualTotalAportado : transactions.filter((t) => t.type === "aportacion" && t.fundId === fund.id).reduce((s, t) => s + t.amount, 0);
      const catMap = {};
      fundTx.forEach((t) => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
      const cats = Object.entries(catMap)
        .map(([name, amt]) => ({ name, total: amt, pct: totalAportado ? (amt / totalAportado) * 100 : 0 }))
        .sort((a, b) => b.total - a.total);
      return { id: fund.id, name: fund.name, total, totalAportado, pct: totalAportado ? (total / totalAportado) * 100 : 0, cats };
    })
    .filter(Boolean);
}

function CategoryCard({ name, total, pct, subcats, sinClasificar, tone, budget }) {
  const [expanded, setExpanded] = useState(false);
  const accent = tone === "fixed" ? "border-slate-400" : tone === "variable" ? "border-rose-400" : tone === "inversion" ? "border-indigo-400" : "border-amber-400";
  const barColor = tone === "fixed" ? "bg-slate-400" : tone === "variable" ? "bg-rose-400" : tone === "inversion" ? "bg-indigo-400" : "bg-amber-400";
  const subBarColor = tone === "fixed" ? "bg-slate-200" : tone === "variable" ? "bg-rose-200" : tone === "inversion" ? "bg-indigo-200" : "bg-amber-200";

  const hasBudget = budget > 0;
  const budgetPct = hasBudget ? (total / budget) * 100 : 0;
  const overBudget = hasBudget && total > budget;
  const budgetBarColor = overBudget ? "bg-rose-500" : budgetPct >= 80 ? "bg-amber-500" : "bg-emerald-500";
  const hasDetail = subcats.length > 0 || sinClasificar > 0 || hasBudget;

  return (
    <div className={`border-l-4 ${accent} border-y border-r border-stone-100 bg-white rounded-r-lg mb-2 overflow-hidden`}>
      <button onClick={() => hasDetail && setExpanded((e) => !e)} className={`w-full text-left pl-3 pr-3 py-2.5 ${hasDetail ? "" : "cursor-default"}`}>
        <div className="flex justify-between items-center text-sm mb-1">
          <span className="font-medium flex items-center gap-1.5">
            {name}
            {overBudget && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
          </span>
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="font-mono text-xs">{hasBudget ? `${fmt(total)} / ${fmt(budget)}` : `${fmt(total)}${pct != null ? ` · ${pct.toFixed(0)}%` : ""}`}</span>
            {hasDetail && (expanded ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />)}
          </span>
        </div>
        {(hasBudget || pct != null) && (
          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div className={`h-full ${hasBudget ? budgetBarColor : barColor}`} style={{ width: `${Math.min(100, hasBudget ? budgetPct : pct)}%` }} />
          </div>
        )}
      </button>
      {expanded && (
        <div className="px-3 pb-2.5">
          {hasBudget && (
            <p className={`text-xs mb-2 ${overBudget ? "text-rose-600 font-medium" : "text-stone-400"}`}>
              {overBudget ? `Presupuesto superado en ${fmt(total - budget)}` : `${budgetPct.toFixed(0)}% del presupuesto`}
            </p>
          )}
          {subcats.length > 0 && (
            <div className="border-l-2 border-stone-100 ml-1 pl-3 space-y-1.5">
              {subcats.map((sc) => {
                const scPct = total ? (sc.total / total) * 100 : 0;
                return (
                  <div key={sc.name}>
                    <div className="flex justify-between text-xs text-stone-500"><span>{sc.name}</span><span className="font-mono">{fmt(sc.total)} · {scPct.toFixed(0)}%</span></div>
                    <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden"><div className={`h-full ${subBarColor}`} style={{ width: `${Math.min(100, scPct)}%` }} /></div>
                  </div>
                );
              })}
              {sinClasificar > 0 && <div className="flex justify-between text-xs text-stone-400"><span>Sin subcategoría</span><span className="font-mono">{fmt(sinClasificar)}</span></div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const GROUP_BADGE = {
  fixed: "bg-slate-700 text-white",
  variable: "bg-rose-600 text-white",
  ahorro: "bg-amber-600 text-white",
  inversion: "bg-indigo-600 text-white",
};

function GroupHeader({ title, total, tone, extra, expanded, onToggle }) {
  return (
    <button onClick={onToggle} className="w-full text-left mb-2">
      <div className="flex justify-between items-center">
        <span className={`text-xs font-semibold uppercase tracking-wide rounded-full px-2.5 py-1 ${GROUP_BADGE[tone]} inline-flex items-center gap-1`}>
          {title}
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </span>
        <span className="font-mono text-sm">{fmt(total)}{extra ? <span className="text-stone-400"> · {extra}</span> : ""}</span>
      </div>
    </button>
  );
}

function CategoryGroup({ title, total, pct, cats, tone, showPct, budget }) {
  const [expanded, setExpanded] = useState(false);
  const hasBudget = budget > 0;
  const budgetPct = hasBudget ? (total / budget) * 100 : 0;
  const overBudget = hasBudget && total > budget;
  const isEmpty = total === 0;
  return (
    <div className={`mb-5 ${isEmpty ? "opacity-40" : ""}`}>
      <GroupHeader title={title} total={total} tone={tone} extra={showPct ? `${pct.toFixed(0)}% de tus ingresos` : null} expanded={expanded} onToggle={() => !isEmpty && setExpanded((e) => !e)} />
      {hasBudget && !isEmpty && (
        <p className={`text-xs -mt-1 mb-2 ${overBudget ? "text-rose-600 font-medium" : "text-stone-400"}`}>
          {overBudget ? `Presupuesto total de variable superado en ${fmt(total - budget)}` : `${budgetPct.toFixed(0)}% de tu presupuesto total de variable (${fmt(budget)})`}
        </p>
      )}
      {expanded && (cats.length === 0
        ? <p className="text-stone-400 text-xs mb-2">Sin movimientos en este bloque.</p>
        : cats.map((c) => <CategoryCard key={c.name} name={c.name} total={c.total} pct={showPct ? (total ? (c.total / total) * pct : 0) : null} subcats={c.subcats} sinClasificar={c.sinClasificar} tone={tone} budget={c.budget} />))}
    </div>
  );
}

function FundUsageCard({ f }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-l-4 border-amber-400 border-y border-r border-stone-100 bg-white rounded-r-lg mb-2 overflow-hidden">
      <button onClick={() => setExpanded((e) => !e)} className="w-full text-left pl-3 pr-3 py-2.5">
        <div className="flex justify-between items-center text-sm mb-1">
          <span className="font-medium">{f.name}</span>
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="font-mono text-xs">{fmt(f.total)} · {f.pct.toFixed(0)}% del fondo</span>
            {expanded ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
          </span>
        </div>
        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400" style={{ width: `${Math.min(100, f.pct)}%` }} />
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-2.5">
          <p className="text-xs text-stone-400 mb-2">de {fmt(f.totalAportado)} ahorrados en total en este fondo</p>
          <div className="border-l-2 border-stone-100 ml-1 pl-3 space-y-1.5">
            {f.cats.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-xs text-stone-500"><span>{c.name}</span><span className="font-mono">{fmt(c.total)} · {c.pct.toFixed(0)}% del fondo</span></div>
                <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden"><div className="h-full bg-amber-200" style={{ width: `${Math.min(100, c.pct)}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FundUsageGroup({ total, funds }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mb-5">
      <GroupHeader title="Uso de ahorro" total={total} tone="ahorro" expanded={expanded} onToggle={() => setExpanded((e) => !e)} />
      {expanded && (funds.length === 0
        ? <p className="text-stone-400 text-xs mb-2">Ningún gasto pagado con fondos este mes.</p>
        : funds.map((f) => <FundUsageCard key={f.id} f={f} />))}
    </div>
  );
}

function buildAssetBreakdown(monthTx, assets) {
  return assets
    .map((a) => {
      const total = monthTx.filter((t) => t.type === "inversion" && t.category === a.name).reduce((s, t) => s + t.amount, 0);
      return { name: a.name, total, subcats: [], sinClasificar: 0 };
    })
    .filter((a) => a.total > 0)
    .sort((a, b) => b.total - a.total);
}

function CategoryOverviewDonut({ data, title, ingresos }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total <= 0) return null;
  return (
    <div className="bg-white rounded-lg border border-stone-100 p-4 mb-5">
      <p className="text-sm font-medium mb-3">{title}</p>
      <div className="flex items-center gap-4">
        <div style={{ width: 120, height: 120 }} className="shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={36} outerRadius={58} paddingAngle={2} stroke="none">
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[8px] text-stone-400 leading-tight">Total</span>
            <span className="font-mono text-[11px] font-semibold text-slate-700 leading-tight">{fmt(total)}</span>
          </div>
        </div>
        <div className="flex-1 space-y-1.5 min-w-0">
          {data.map((d) => {
            const pctGasto = ((d.value / total) * 100).toFixed(0);
            const pctIng = ingresos ? ((d.value / ingresos) * 100).toFixed(0) : null;
            return (
              <div key={d.name}>
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="flex items-center gap-1.5 min-w-0"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} /><span className="truncate">{d.name}</span></span>
                  <span className="font-mono text-stone-600 shrink-0">{fmt(d.value)} · {pctGasto}%</span>
                </div>
                {pctIng && d.name !== "Uso de ahorro" && <p className="text-[10px] text-stone-400 ml-5 -mt-0.5">{pctIng}% de tus ingresos</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SparklineTrend({ data }) {
  const mean = data.length ? data.reduce((s, d) => s + d.value, 0) / data.length : 0;
  return (
    <div className="mb-5">
      <p className="text-sm font-medium mb-2">Tendencia de tu ahorro (últimos 6 meses)</p>
      <div className="bg-white rounded-lg border border-stone-100 p-2" style={{ height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 10, left: 10, bottom: 0 }}>
            <XAxis dataKey="mes" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => fmt(v)} />
            <ReferenceLine y={0} stroke="#d6d3d1" strokeWidth={1} label={{ value: "0", position: "left", fontSize: 9, fill: "#a8a29e" }} />
            <ReferenceLine y={mean} stroke="#0f766e" strokeWidth={1} strokeDasharray="4 3" label={{ value: "media", position: "right", fontSize: 9, fill: "#0f766e" }} />
            <Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-stone-400 mt-1.5">Línea continua gris = 0€ (por debajo estás perdiendo dinero). Línea punteada verde = tu media de estos 6 meses ({fmt(mean)}). Si tu línea sube mes a mes, vas mejorando.</p>
    </div>
  );
}

function MensualTab({ monthIdx, year, changeMonth, changeYear, goToMonthIndex, getAhorroReal, stats, monthTx, categories, funds, assets, transactions, variableBudget, trend6Meses, onGoToAjustes }) {
  const fixedCats = useMemo(() => buildBreakdown(monthTx, categories, "fixedOrdinario"), [monthTx, categories]);
  const variableCats = useMemo(() => buildBreakdown(monthTx, categories, "variableOrdinario"), [monthTx, categories]);
  const fundUsage = useMemo(() => buildFundUsage(monthTx, transactions, funds), [monthTx, transactions, funds]);
  const assetCats = useMemo(() => buildAssetBreakdown(monthTx, assets), [monthTx, assets]);

  const pctFijo = stats.ingresos ? (stats.fixedOrdinario / stats.ingresos) * 100 : 0;
  const pctVariable = stats.ingresos ? (stats.variableOrdinario / stats.ingresos) * 100 : 0;
  const pctInversion = stats.ingresos ? (stats.inversion / stats.ingresos) * 100 : 0;
  const gastosTotales = stats.fixedOrdinario + stats.variableOrdinario + stats.inversion;
  const pctGastosTotales = stats.ingresos ? (gastosTotales / stats.ingresos) * 100 : 0;

  const overviewData = [
    { name: "Gasto fijo", value: stats.fixedOrdinario, color: "#94a3b8" },
    { name: "Gasto variable", value: stats.variableOrdinario, color: "#fb7185" },
    { name: "Inversión", value: stats.inversion, color: "#818cf8" },
    { name: "Uso de ahorro", value: stats.gastosFinanciados, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <MonthSwitcher monthIdx={monthIdx} year={year} changeMonth={changeMonth} changeYear={changeYear} goToMonthIndex={goToMonthIndex} getAhorroReal={getAhorroReal} />
      <div className="bg-white rounded-lg border border-stone-100 p-4 mb-5 space-y-2 text-sm">
        <Row label="Ingresos" value={stats.ingresos} bold tone="emerald" />
        <Row label="Gastos totales" value={-gastosTotales} pctText={`${pctGastosTotales.toFixed(0)}% de ingresos`} bold />
        {stats.aportaciones > 0 && <Row label="Aportaciones a fondos" value={-stats.aportaciones} />}
        <div className="border-t border-stone-100 pt-3 mt-2 -mx-4 px-4 pb-3 bg-teal-50 rounded-b-lg">
          <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide mb-1 flex items-center gap-1.5"><PiggyBank size={13} /> Tu ahorro</p>
          <p className="text-xs text-stone-500 mb-0.5">Ahorro libre en curso este mes</p>
          <p className="font-mono text-lg text-teal-800">{fmt(stats.ahorroReal)}</p>
          <p className="text-xs text-stone-500 mt-1">Lo que te ha sobrado este mes, sin contar fondos ni inversión. Al cerrar el mes, se sumará a tu ahorro libre consolidado.</p>
        </div>
      </div>

      <CategoryOverviewDonut data={overviewData} title="De dónde ha salido tu dinero este mes" ingresos={stats.ingresos} />

      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-stone-500">Desglose por categoría</p>
        <button onClick={onGoToAjustes} className="text-stone-400 hover:text-slate-700"><Settings2 size={16} /></button>
      </div>

      <CategoryGroup title="Gasto fijo" total={stats.fixedOrdinario} pct={pctFijo} cats={fixedCats} tone="fixed" showPct />
      <CategoryGroup title="Gasto variable" total={stats.variableOrdinario} pct={pctVariable} cats={variableCats} tone="variable" showPct budget={variableBudget} />
      <CategoryGroup title="Inversión" total={stats.inversion} pct={pctInversion} cats={assetCats} tone="inversion" showPct />
      <FundUsageGroup total={stats.gastosFinanciados} funds={fundUsage} />

      <SparklineTrend data={trend6Meses} />
    </div>
  );
}

function Row({ label, value, bold, tone, muted, pctText }) {
  const toneColor = tone === "teal" ? "text-teal-700" : tone === "indigo" ? "text-indigo-700" : tone === "amber" ? "text-amber-700" : tone === "emerald" ? "text-emerald-700" : "";
  return (
    <div className="flex justify-between">
      <span className={`${bold ? "font-medium" : muted ? "text-stone-400" : "text-stone-500"} ${tone ? toneColor : ""}`}>{label}</span>
      <span className={`font-mono text-right ${bold ? "font-medium" : ""} ${tone ? toneColor : muted ? "text-stone-400" : ""}`}>
        {fmt(value)}{pctText ? <span className="text-stone-400"> · {pctText}</span> : ""}
      </span>
    </div>
  );
}

function ChartCard({ title, explanation, height, children }) {
  return (
    <div className="mb-4">
      <p className="text-sm font-medium mb-2">{title}</p>
      <div className="bg-white rounded-lg border border-stone-100 p-2" style={height ? { height } : undefined}>
        {children}
      </div>
      <p className="text-xs text-stone-400 mt-1.5">{explanation}</p>
    </div>
  );
}

function BudgetComplianceChart({ data, variableBudget }) {
  if (!(variableBudget > 0)) {
    return <p className="text-xs text-stone-400 bg-white rounded-lg border border-stone-100 p-3">Configura un presupuesto total de gasto variable en Ajustes → Categorías para activar este gráfico.</p>;
  }
  return (
    <div className="bg-white rounded-lg border border-stone-100 p-3">
      <div className="grid grid-cols-12 gap-1">
        {data.map((m) => {
          const noData = m.ingresos === 0 && m.variableOrdinario === 0;
          const over = m.variableOrdinario > variableBudget;
          return (
            <div key={m.mes} className="flex flex-col items-center gap-1">
              <div className={`w-full aspect-square rounded ${noData ? "bg-stone-100" : over ? "bg-rose-500" : "bg-emerald-500"}`} />
              <span className="text-[9px] text-stone-400">{m.mes}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" />Dentro del presupuesto</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500" />Superado</span>
      </div>
    </div>
  );
}

function ChartsSection({ data, variableBudget, assetBreakdown, totalInversion }) {
  const [expanded, setExpanded] = useState(false);
  const assetDonutData = (assetBreakdown || []).map((a, i) => ({ name: a.name, value: a.total, color: ["#818cf8", "#a78bfa", "#c4b5fd", "#6366f1", "#4f46e5"][i % 5] }));
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
          <ChartCard title="Tasa de ahorro mensual" explanation='Qué % de tus ingresos ahorras cada mes. Es la referencia más directa de si tu gestión mejora o empeora.' height={180}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v) => `${v.toFixed(0)}%`} />
                <ReferenceLine y={0} stroke="#c3c2b7" />
                <Line type="monotone" dataKey="tasaAhorro" stroke="#0f766e" strokeWidth={2} dot={{ r: 2 }} name="Tasa de ahorro" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Ingresos vs gastos por mes" explanation="Si las barras de gastos se acercan o superan a las de ingresos con frecuencia, es la primera señal de alerta." height={200}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="ingresos" fill="#059669" name="Ingresos" radius={[3, 3, 0, 0]} />
                <Bar dataKey="gastos" fill="#e11d48" name="Gastos" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Ahorro libre consolidado, mes a mes" explanation="Tu saldo real acumulado. Si esta línea baja de forma sostenida, estás usando ahorro más rápido de lo que generas." height={180}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Line type="monotone" dataKey="acumulado" stroke="#d97706" strokeWidth={2} dot={{ r: 2 }} name="Ahorro libre consolidado" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Evolución de gasto fijo vs variable" explanation="Si el variable crece de forma sostenida mientras el fijo no se mueve, suele ser la señal más temprana de descontrol." height={200}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="fixedOrdinario" fill="#64748b" name="Gasto fijo" radius={[3, 3, 0, 0]} />
                <Bar dataKey="variableOrdinario" fill="#fb7185" name="Gasto variable" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Cumplimiento de presupuesto de variable" explanation="En cuántos meses te has mantenido dentro del presupuesto general de gasto variable.">
            <BudgetComplianceChart data={data} variableBudget={variableBudget} />
          </ChartCard>

          {assetDonutData.length > 0 && (
            <ChartCard title="Inversión por activo" explanation="Cómo se reparte lo que has invertido este año entre tus distintos activos.">
              <div className="flex items-center gap-4 py-2">
                <div style={{ width: 100, height: 100 }} className="shrink-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={assetDonutData} dataKey="value" nameKey="name" innerRadius={30} outerRadius={48} paddingAngle={2} stroke="none">
                        {assetDonutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="font-mono text-[10px] font-semibold text-slate-700">{fmt(totalInversion)}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-1.5 min-w-0">
                  {assetDonutData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs gap-2">
                      <span className="flex items-center gap-1.5 min-w-0"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} /><span className="truncate">{d.name}</span></span>
                      <span className="font-mono text-stone-600 shrink-0">{fmt(d.value)} · {totalInversion ? ((d.value / totalInversion) * 100).toFixed(0) : 0}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          )}
        </div>
      )}
    </div>
  );
}

function AnualTab({ year, changeYear, data, totals, transactions, assets, variableBudget }) {
  const [assetsExpanded, setAssetsExpanded] = useState(false);
  const pctFijo = totals.ingresos ? (totals.fixedOrdinario / totals.ingresos) * 100 : 0;
  const pctVariable = totals.ingresos ? (totals.variableOrdinario / totals.ingresos) * 100 : 0;
  const pctInversion = totals.ingresos ? (totals.inversion / totals.ingresos) * 100 : 0;

  const overviewDataAnual = [
    { name: "Gasto fijo", value: totals.fixedOrdinario, color: "#94a3b8" },
    { name: "Gasto variable", value: totals.variableOrdinario, color: "#fb7185" },
    { name: "Inversión", value: totals.inversion, color: "#818cf8" },
    { name: "Uso de ahorro", value: totals.gastosFinanciados, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  const assetYearBreakdown = useMemo(() => {
    const yearTx = transactions.filter((t) => t.type === "inversion" && t.date.slice(0, 4) === String(year));
    return assets
      .map((a) => ({ name: a.name, total: yearTx.filter((t) => t.category === a.name).reduce((s, t) => s + t.amount, 0) }))
      .filter((a) => a.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [transactions, assets, year]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => changeYear(-1)} className="p-1.5 rounded-full hover:bg-stone-200 text-slate-600"><ChevronLeft size={18} /></button>
        <span className="font-serif text-base">{year}</span>
        <button onClick={() => changeYear(1)} className="p-1.5 rounded-full hover:bg-stone-200 text-slate-600"><ChevronRight size={18} /></button>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <StatCard label="Ingresos año" value={totals.ingresos} tone="emerald" />
        <StatCard label="Gastos año" value={totals.gastos} tone="rose" />
        <div className="col-span-2 rounded-lg px-3 py-2.5 bg-teal-50">
          <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide mb-1 flex items-center gap-1.5"><PiggyBank size={13} /> Tu ahorro</p>
          <p className="text-xs text-stone-500 mb-0.5">Ahorro libre generado este año</p>
          <p className="font-mono text-lg text-teal-800">{fmt(totals.ahorroReal)}</p>
        </div>
        <StatCard label="Invertido este año" value={totals.inversion} tone="indigo" />
      </div>
      <p className="text-xs text-stone-400 -mt-2 mb-4">Estos datos son solo de {year}, comparables entre años. Tu posición patrimonial acumulada (cuánto tienes en total) la ves en Fondos e inversión.</p>

      <CategoryOverviewDonut data={overviewDataAnual} title="De dónde ha salido tu dinero este año" ingresos={totals.ingresos} />

      <ChartsSection data={data} variableBudget={variableBudget} assetBreakdown={assetYearBreakdown} totalInversion={totals.inversion} />
    </div>
  );
}

function NuevoMovimientoForm({ funds, getAhorroLibreDisponibleParaMes, categories, assets, defaultDate, ahorroRealDisponible, monthTx, initial, editingTx, onClose, onSave }) {
  const [type, setType] = useState(editingTx?.type || initial?.type || "gasto");
  const [categoryId, setCategoryId] = useState(() => {
    if (editingTx && (editingTx.type === "gasto")) return categories.find((c) => c.name === editingTx.category)?.id || "";
    return "";
  });
  const [subcategory, setSubcategory] = useState(editingTx?.subcategory || "");
  const [incomeCat, setIncomeCat] = useState(editingTx?.type === "ingreso" ? editingTx.category : INCOME_CATS[0]);
  const [fundId, setFundId] = useState(() => {
    if (editingTx && (editingTx.type === "aportacion" || editingTx.type === "retiro")) return editingTx.fundId || funds[0]?.id || "";
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

  // El ahorro libre disponible se recalcula según la fecha del movimiento y nunca incluye
  // el propio mes: solo puedes gastar como "ahorro" lo acumulado en meses anteriores a este.
  const ahorroLibreDisponible = getAhorroLibreDisponibleParaMes(monthKey(date || defaultDate));
  const fundingOptions = [{ id: AHORRO_LIBRE_ID, name: "Ahorro libre consolidado", balance: ahorroLibreDisponible }, ...funds];

  const currentCat = categories.find((c) => c.id === categoryId);
  const needsFund = type === "aportacion" || type === "retiro";
  const needsAsset = type === "inversion";
  const fixedCats = categories.filter((c) => c.type === "fixed");
  const variableCats = categories.filter((c) => c.type === "variable");
  const selectedFund = funds.find((f) => f.id === fundId);

  const amt = parseFloat(amount) || 0;
  const remaining = ahorroRealDisponible ?? 0;
  const shortfall = !editingTx && type === "gasto" && !fundedByFund && remaining > 0 ? Math.max(0, amt - remaining) : 0;
  const retiroExcedeFondo = type === "retiro" && selectedFund && amt > selectedFund.balance + (editingTx?.type === "retiro" && editingTx.fundId === fundId ? editingTx.amount : 0);

  const categoryBudget = type === "gasto" && currentCat?.type === "variable" ? currentCat.budget || 0 : 0;
  const spentInCategoryThisMonth = categoryBudget > 0
    ? monthTx.filter((t) => t.type === "gasto" && t.category === currentCat.name && (!editingTx || t.id !== editingTx.id)).reduce((s, t) => s + t.amount, 0)
    : 0;
  const projectedCategoryTotal = spentInCategoryThisMonth + amt;

  const fundedFund = fundingOptions.find((f) => f.id === fundedId);
  const fundedYaContaba = editingTx?.type === "gasto" && editingTx.fundedBy === fundedId ? editingTx.amount : 0;
  const fundedExcede = type === "gasto" && fundedByFund && fundedFund && amt > fundedFund.balance + fundedYaContaba;

  const shortfallFund = fundingOptions.find((f) => f.id === shortfallFundId);
  const shortfallExcede = shortfallFund && shortfall > shortfallFund.balance;

  const buildBase = () => {
    const fund = funds.find((f) => f.id === fundId);
    const asset = assets.find((a) => a.id === assetId);
    return {
      type, date, note,
      fixed: type === "gasto" ? currentCat?.type === "fixed" : undefined,
      category: needsFund ? fund?.name || "Fondo" : needsAsset ? asset?.name || "Activo" : type === "ingreso" ? incomeCat : currentCat?.name || "",
      subcategory: type === "gasto" ? subcategory || null : undefined,
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
    if (type === "gasto" && !categoryId) return;
    if (shortfall > 0) { setAskShortfall(true); return; }
    onSave({ ...buildBase(), amount: amt });
  };

  const confirmWithoutFund = () => { onSave({ ...buildBase(), amount: amt }); };
  const confirmWithFund = () => { onSave({ ...buildBase(), amount: amt, splitFundId: shortfallFundId, splitFundAmount: shortfall }); };

  if (askShortfall) {
    return (
      <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-10" onClick={onClose}>
        <div className="bg-white rounded-t-2xl w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-3"><p className="font-serif text-base">Tu ahorro real no llega</p><button onClick={onClose} className="text-stone-400"><X size={18} /></button></div>
          <p className="text-sm text-stone-600 mb-1">Este gasto es de <span className="font-mono">{fmt(amt)}</span>, pero tu ahorro real disponible este mes es de <span className="font-mono">{fmt(remaining)}</span>.</p>
          <p className="text-sm text-stone-600 mb-1">¿Quieres cubrir la diferencia de <span className="font-mono font-medium">{fmt(shortfall)}</span> con un fondo o con tu ahorro libre acumulado?</p>
          <p className="text-xs text-stone-400 mb-4">Solo puedes usar el ahorro libre consolidado (de meses anteriores). El sobrante de este mes es ahorro en curso.</p>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {fundingOptions.map((f) => <Chip key={f.id} tone="amber" label={`${f.name} · ${fmt(f.balance)}`} active={shortfallFundId === f.id} onClick={() => setShortfallFundId(f.id)} />)}
          </div>
          {shortfallExcede && <p className="text-xs text-rose-600 mb-2">Ahí no tienes suficiente ({fmt(shortfallFund.balance)} disponibles). Elige otra opción o reduce el importe.</p>}

          <button onClick={confirmWithFund} disabled={shortfallExcede} className="w-full bg-teal-700 disabled:opacity-40 text-white rounded-lg py-2.5 text-sm font-medium mb-2">
            Sí, cubrir {fmt(shortfall)} con {shortfallFund?.name || "esto"}
          </button>
          <button onClick={confirmWithoutFund} className="w-full border border-stone-200 text-stone-600 rounded-lg py-2.5 text-sm font-medium">
            No, dejar el ahorro real en negativo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-10" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full max-w-md p-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3"><p className="font-serif text-base">{editingTx ? "Editar movimiento" : "Nuevo movimiento"}</p><button onClick={onClose} className="text-stone-400"><X size={18} /></button></div>

        <div className="grid grid-cols-5 gap-1.5 mb-4">
          {[["ingreso", "Ingreso"], ["gasto", "Gasto"], ["aportacion", "Aportar"], ["retiro", "Retirar"], ["inversion", "Invertir"]].map(([v, l]) => (
            <button key={v} disabled={!!editingTx} onClick={() => setType(v)} className={`text-xs rounded-md py-2 border disabled:opacity-40 ${type === v ? "bg-slate-800 text-white border-slate-800" : "border-stone-200 text-stone-500"}`}>{l}</button>
          ))}
        </div>
        {editingTx && <p className="text-xs text-stone-400 -mt-2.5 mb-4">El tipo de movimiento no se puede cambiar al editar. Si necesitas cambiarlo, borra este y crea uno nuevo.</p>}

        {needsFund && (
          <div className="mb-4">
            <p className="text-xs text-stone-500 mb-1.5">Fondo</p>
            <div className="flex flex-wrap gap-1.5">
              {funds.length === 0 && <span className="text-xs text-stone-400">Crea un fondo primero en la pestaña Fondos</span>}
              {funds.map((f) => <Chip key={f.id} label={`${f.name} · ${fmt(f.balance)}`} active={fundId === f.id} onClick={() => setFundId(f.id)} />)}
            </div>
            {retiroExcedeFondo && <p className="text-xs text-rose-600 mt-2">No puedes retirar más de lo que hay en el fondo ({fmt(selectedFund.balance)} disponibles).</p>}
          </div>
        )}

        {needsAsset && (
          <div className="mb-4">
            <p className="text-xs text-stone-500 mb-1.5">Activo</p>
            <div className="flex flex-wrap gap-1.5">
              {assets.length === 0 && <span className="text-xs text-stone-400">Crea un activo primero en Ajustes</span>}
              {assets.map((a) => <Chip key={a.id} tone="indigo" label={`${a.name} · ${fmt(a.invertido)}`} active={assetId === a.id} onClick={() => setAssetId(a.id)} />)}
            </div>
          </div>
        )}

        {type === "ingreso" && (
          <div className="mb-4">
            <p className="text-xs text-stone-500 mb-1.5">Tipo de ingreso</p>
            <div className="flex flex-wrap gap-1.5">{INCOME_CATS.map((c) => <Chip key={c} label={c} active={incomeCat === c} onClick={() => setIncomeCat(c)} />)}</div>
          </div>
        )}

        {type === "gasto" && (
          <>
            <div className="mb-3">
              <p className="text-xs text-stone-500 mb-1.5">Fijos</p>
              <div className="flex flex-wrap gap-1.5">{fixedCats.map((c) => <Chip key={c.id} tone="fixed" label={c.name} active={categoryId === c.id} onClick={() => { setCategoryId(c.id); setSubcategory(""); }} />)}</div>
            </div>
            <div className="mb-3">
              <p className="text-xs text-stone-500 mb-1.5">Variables</p>
              <div className="flex flex-wrap gap-1.5">{variableCats.map((c) => <Chip key={c.id} tone="variable" label={c.name} active={categoryId === c.id} onClick={() => { setCategoryId(c.id); setSubcategory(""); }} />)}</div>
            </div>
            {currentCat && currentCat.subcategories.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-stone-500 mb-1.5">Subcategoría</p>
                <div className="flex flex-wrap gap-1.5">
                  <Chip label="Sin subcategoría" active={!subcategory} onClick={() => setSubcategory("")} />
                  {currentCat.subcategories.map((sc) => <Chip key={sc.id} label={sc.name} active={subcategory === sc.name} onClick={() => setSubcategory(sc.name)} />)}
                </div>
              </div>
            )}
            {categoryBudget > 0 && (
              <p className={`text-xs rounded-md px-3 py-2 mb-3 ${projectedCategoryTotal > categoryBudget ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                Llevas {fmt(spentInCategoryThisMonth)} de {fmt(categoryBudget)} en {currentCat.name} este mes.
                {amt > 0 ? (projectedCategoryTotal > categoryBudget ? ` Con este gasto lo superarás en ${fmt(projectedCategoryTotal - categoryBudget)}.` : ` Con este gasto quedarían ${fmt(categoryBudget - projectedCategoryTotal)} libres.`) : ""}
              </p>
            )}
            <label className="flex items-center gap-2 text-sm mb-1"><input type="checkbox" checked={fundedByFund} onChange={(e) => setFundedByFund(e.target.checked)} />Pagado con ahorro (fondo o ahorro libre acumulado)</label>
            {fundedByFund && (
              <>
                <p className="text-xs text-stone-400 mb-2">No afecta a tu ahorro total del mes: se descuenta del ahorro libre consolidado (lo acumulado en meses anteriores). El sobrante de este mes es ahorro en curso y todavía no puedes gastarlo como ahorro.</p>
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {fundingOptions.map((f) => <Chip key={f.id} tone="amber" label={`${f.name} · ${fmt(f.balance)}`} active={fundedId === f.id} onClick={() => setFundedId(f.id)} />)}
                </div>
                {fundedExcede && <p className="text-xs text-rose-600 mt-1 mb-3">No hay suficiente en {fundedFund.name} ({fmt(fundedFund.balance)} disponibles).</p>}
              </>
            )}
            {amt > 0 && !fundedByFund && remaining > 0 && amt > remaining && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-2 mb-3 mt-3">Este importe supera tu ahorro real disponible ({fmt(remaining)}). Al guardar te preguntaremos si quieres cubrir la diferencia con un fondo o tu ahorro libre.</p>
            )}
          </>
        )}

        <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Importe (€)" className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-base font-mono mb-3 mt-3" autoFocus />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm mb-1" />
        {date && (() => { const diff = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24); return diff > 365 ? <p className="text-xs text-amber-700 mb-2">Esta fecha es a más de 12 meses en el futuro. ¿Seguro que es correcta?</p> : diff < -730 ? <p className="text-xs text-amber-700 mb-2">Esta fecha es de hace más de 2 años. ¿Seguro que es correcta?</p> : <div className="mb-2" />; })()}
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota (opcional)" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm mb-4" />
        <button onClick={submit} disabled={retiroExcedeFondo || fundedExcede} className="w-full bg-teal-700 disabled:opacity-40 text-white rounded-lg py-2.5 text-sm font-medium">{editingTx ? "Guardar cambios" : "Guardar"}</button>
      </div>
    </div>
  );
}

function CategoriasEditor({ categories, setCategories, variableBudget, setVariableBudget }) {
  const [newSubName, setNewSubName] = useState({});
  const [newCatName, setNewCatName] = useState({ fixed: "", variable: "" });

  const addSub = (catId) => {
    const name = (newSubName[catId] || "").trim();
    if (!name) return;
    setCategories((prev) => prev.map((c) => (c.id === catId ? { ...c, subcategories: [...c.subcategories, { id: uid(), name }] } : c)));
    setNewSubName((s) => ({ ...s, [catId]: "" }));
  };
  const removeSub = (catId, subId) => setCategories((prev) => prev.map((c) => (c.id === catId ? { ...c, subcategories: c.subcategories.filter((s) => s.id !== subId) } : c)));
  const addCat = (type) => {
    const name = newCatName[type].trim();
    if (!name) return;
    setCategories((prev) => [...prev, { id: uid(), type, name, subcategories: [] }]);
    setNewCatName((s) => ({ ...s, [type]: "" }));
  };
  const removeCat = (id) => setCategories((prev) => prev.filter((c) => c.id !== id));
  const updateBudget = (id, val) => setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, budget: parseFloat(val) || 0 } : c)));

  const moveCategory = (id, direction) => {
    setCategories((prev) => {
      const arr = [...prev];
      const idx = arr.findIndex((c) => c.id === id);
      if (idx === -1) return prev;
      const type = arr[idx].type;
      let swapIdx = -1;
      if (direction === -1) {
        for (let j = idx - 1; j >= 0; j--) if (arr[j].type === type) { swapIdx = j; break; }
      } else {
        for (let j = idx + 1; j < arr.length; j++) if (arr[j].type === type) { swapIdx = j; break; }
      }
      if (swapIdx === -1) return prev;
      [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
      return arr;
    });
  };

  const renderGroup = (type, title) => {
    const list = categories.filter((c) => c.type === type);
    return (
    <div className="mb-5">
      <p className="text-sm font-semibold mb-2">{title}</p>
      {type === "fixed" && <p className="text-xs text-stone-400 mb-2">Los gastos fijos no llevan presupuesto: ya conoces su importe porque los defines en "Gastos fijos habituales".</p>}
      {type === "variable" && (() => {
        const sumaCat = list.reduce((s, c) => s + (c.budget || 0), 0);
        const excede = variableBudget > 0 && sumaCat > variableBudget;
        return (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-stone-500">Presupuesto total de todo lo variable</span>
              <input type="number" inputMode="decimal" value={variableBudget || ""} onChange={(e) => setVariableBudget(parseFloat(e.target.value) || 0)} placeholder="Sin límite" className="w-24 border border-stone-200 rounded-md px-2 py-1 text-xs font-mono" />
            </div>
            {excede && <p className="text-xs text-amber-700 bg-amber-50 rounded-md px-2.5 py-1.5">Los presupuestos por categoría suman {fmt(sumaCat)}, pero tu presupuesto total es {fmt(variableBudget)}.</p>}
          </div>
        );
      })()}
      <div className="space-y-3">
        {list.map((cat, i) => (
          <div key={cat.id} className="border border-stone-100 rounded-lg p-2.5 bg-white">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">{cat.name}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => moveCategory(cat.id, -1)} disabled={i === 0} className={`${i === 0 ? "text-stone-200" : "text-stone-400 hover:text-slate-700"}`}><ChevronUp size={15} /></button>
                <button onClick={() => moveCategory(cat.id, 1)} disabled={i === list.length - 1} className={`${i === list.length - 1 ? "text-stone-200" : "text-stone-400 hover:text-slate-700"}`}><ChevronDown size={15} /></button>
                <button onClick={() => removeCat(cat.id)} className="text-stone-300 hover:text-rose-600"><Trash2 size={14} /></button>
              </div>
            </div>
            {type === "variable" && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-stone-500">Presupuesto mensual</span>
                <input type="number" inputMode="decimal" value={cat.budget || ""} onChange={(e) => updateBudget(cat.id, e.target.value)} placeholder="Sin límite" className="w-24 border border-stone-200 rounded-md px-2 py-1 text-xs font-mono" />
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {cat.subcategories.map((sc) => (
                <span key={sc.id} className="flex items-center gap-1 bg-stone-100 text-xs rounded-full px-2 py-1">{sc.name}<button onClick={() => removeSub(cat.id, sc.id)} className="text-stone-400 hover:text-rose-600"><X size={11} /></button></span>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input value={newSubName[cat.id] || ""} onChange={(e) => setNewSubName((s) => ({ ...s, [cat.id]: e.target.value }))} placeholder="Nueva subcategoría" className="flex-1 border border-stone-200 rounded-md px-2 py-1 text-xs" />
              <button onClick={() => addSub(cat.id)} className="bg-stone-800 text-white rounded-md px-2"><Plus size={13} /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 mt-2">
        <input value={newCatName[type]} onChange={(e) => setNewCatName((s) => ({ ...s, [type]: e.target.value }))} placeholder={`Nueva categoría ${type === "fixed" ? "fija" : "variable"}`} className="flex-1 border border-stone-200 rounded-md px-2 py-1.5 text-xs" />
        <button onClick={() => addCat(type)} className="bg-slate-800 text-white rounded-md px-2.5 text-xs"><Plus size={14} /></button>
      </div>
    </div>
    );
  };

  return <div>{renderGroup("fixed", "Categorías fijas")}{renderGroup("variable", "Categorías variables")}</div>;
}

function RecurringEditor({ categories, recurring, setRecurring }) {
  const fixedCats = categories.filter((c) => c.type === "fixed");
  const [categoryId, setCategoryId] = useState(fixedCats[0]?.id || "");
  const [subcategory, setSubcategory] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [day, setDay] = useState("");
  const currentCat = categories.find((c) => c.id === categoryId);

  const add = () => {
    const amt = parseFloat(amount);
    if (!categoryId || !amt || amt <= 0) return;
    setRecurring((prev) => [...prev, { id: uid(), categoryId, subcategory: subcategory || null, amount: amt, note, day: parseInt(day) || null }]);
    setAmount(""); setNote(""); setSubcategory(""); setDay("");
  };
  const remove = (id) => setRecurring((prev) => prev.filter((r) => r.id !== id));
  const updateAmount = (id, val) => setRecurring((prev) => prev.map((r) => (r.id === id ? { ...r, amount: parseFloat(val) || 0 } : r)));

  return (
    <div>
      <p className="text-xs text-stone-500 mb-3">Defínelos una vez. Cada mes podrás aplicarlos de golpe desde Movimientos, ajustando el importe si algo ha cambiado.</p>
      <div className="space-y-2 mb-4">
        {recurring.length === 0 && <p className="text-stone-400 text-sm text-center py-4">Todavía no tienes gastos fijos habituales.</p>}
        {recurring.map((r) => {
          const cat = categories.find((c) => c.id === r.categoryId);
          return (
            <div key={r.id} className="flex items-center justify-between bg-white border border-stone-100 rounded-lg px-3 py-2">
              <div className="min-w-0"><p className="text-sm truncate">{cat?.name}{r.subcategory ? ` · ${r.subcategory}` : ""}{r.day ? ` · día ${r.day}` : ""}</p>{r.note && <p className="text-xs text-stone-400 truncate">{r.note}</p>}</div>
              <div className="flex items-center gap-2 shrink-0">
                <input type="number" value={r.amount} onChange={(e) => updateAmount(r.id, e.target.value)} className="w-20 border border-stone-200 rounded-md px-1.5 py-1 text-sm font-mono text-right" />
                <button onClick={() => remove(r.id)} className="text-stone-300 hover:text-rose-600"><Trash2 size={15} /></button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-sm font-medium mb-2">Añadir nuevo</p>
      <div className="flex flex-wrap gap-1.5 mb-3">{fixedCats.map((c) => <Chip key={c.id} tone="fixed" label={c.name} active={categoryId === c.id} onClick={() => { setCategoryId(c.id); setSubcategory(""); }} />)}</div>
      {currentCat && currentCat.subcategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Chip label="Sin subcategoría" active={!subcategory} onClick={() => setSubcategory("")} />
          {currentCat.subcategories.map((sc) => <Chip key={sc.id} label={sc.name} active={subcategory === sc.name} onClick={() => setSubcategory(sc.name)} />)}
        </div>
      )}
      <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Importe habitual (€)" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm mb-3 font-mono" />
      <input type="number" inputMode="numeric" value={day} onChange={(e) => setDay(e.target.value)} placeholder="Día habitual del mes (opcional, ej. 5)" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm mb-3" min="1" max="31" />
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota (opcional)" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm mb-3" />
      <button onClick={add} className="w-full bg-slate-800 text-white rounded-lg py-2.5 text-sm font-medium">Añadir gasto fijo habitual</button>
    </div>
  );
}

function InvestmentEditor({ assets, setAssets, addAsset, config, setConfig }) {
  const [newName, setNewName] = useState("");
  const totalPct = assets.reduce((s, a) => s + (a.pct || 0), 0);

  const updateAssetPct = (id, val) => setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, pct: parseFloat(val) || 0 } : a)));
  const renameAsset = (id, name) => setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, name } : a)));
  const removeAsset = (id) => setAssets((prev) => prev.filter((a) => a.id !== id));

  return (
    <div>
      <p className="text-sm font-semibold mb-2">% de tus ingresos destinado a inversión</p>
      <div className="flex items-center gap-2 mb-1">
        <input type="number" inputMode="decimal" value={config.globalPct || ""} onChange={(e) => setConfig({ ...config, globalPct: parseFloat(e.target.value) || 0 })} className="w-24 border border-stone-200 rounded-lg px-3 py-2 text-sm font-mono" />
        <span className="text-sm text-stone-500">% de los ingresos de cada mes</span>
      </div>
      <p className="text-xs text-stone-400 mb-5">Es solo una plantilla orientativa: al aplicar el plan cada mes podrás ajustar los importes reales, y si algún mes no inviertes nada, no pasa nada.</p>

      <p className="text-sm font-semibold mb-2">Reparto entre activos</p>
      <div className="space-y-2 mb-3">
        {assets.length === 0 && <p className="text-stone-400 text-sm text-center py-4">Todavía no tienes activos de inversión.</p>}
        {assets.map((a) => (
          <div key={a.id} className="flex items-center gap-2 bg-white border border-stone-100 rounded-lg px-3 py-2">
            <input value={a.name} onChange={(e) => renameAsset(a.id, e.target.value)} className="flex-1 border border-stone-200 rounded-md px-2 py-1 text-sm min-w-0" />
            <div className="flex items-center gap-1 shrink-0">
              <input type="number" value={a.pct || ""} onChange={(e) => updateAssetPct(a.id, e.target.value)} className="w-14 border border-stone-200 rounded-md px-1.5 py-1 text-sm font-mono text-right" />
              <span className="text-xs text-stone-400">%</span>
            </div>
            <button onClick={() => removeAsset(a.id)} className="text-stone-300 hover:text-rose-600 shrink-0"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      {assets.length > 0 && <p className={`text-xs mb-4 ${totalPct === 100 ? "text-stone-400" : "text-amber-700"}`}>Suma actual del reparto: {totalPct.toFixed(0)}% {totalPct !== 100 ? "(lo ideal es que sume 100%)" : ""}</p>}
      <div className="flex gap-1.5">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nuevo activo (ej. Oro, SP500)" className="flex-1 border border-stone-200 rounded-md px-2 py-1.5 text-xs" />
        <button onClick={() => { if (newName.trim()) { addAsset(newName.trim()); setNewName(""); } }} className="bg-indigo-700 text-white rounded-md px-2.5 text-xs"><Plus size={14} /></button>
      </div>
    </div>
  );
}

function RecurringIncomeEditor({ recurringIncome, setRecurringIncome }) {
  const [incomeCat, setIncomeCat] = useState(INCOME_CATS[0]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [day, setDay] = useState("");

  const add = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    setRecurringIncome((prev) => [...prev, { id: uid(), incomeCat, name: name.trim() || incomeCat, amount: amt, note, day: parseInt(day) || null }]);
    setName(""); setAmount(""); setNote(""); setDay("");
  };
  const remove = (id) => setRecurringIncome((prev) => prev.filter((r) => r.id !== id));
  const updateAmount = (id, val) => setRecurringIncome((prev) => prev.map((r) => (r.id === id ? { ...r, amount: parseFloat(val) || 0 } : r)));

  return (
    <div>
      <p className="text-xs text-stone-500 mb-3">Defínelos una vez (por ejemplo tu nómina). Cada mes podrás aplicarlos junto al resto de preestablecidos desde Movimientos.</p>
      <div className="space-y-2 mb-4">
        {recurringIncome.length === 0 && <p className="text-stone-400 text-sm text-center py-4">Todavía no tienes ingresos recurrentes.</p>}
        {recurringIncome.map((r) => (
          <div key={r.id} className="flex items-center justify-between bg-white border border-stone-100 rounded-lg px-3 py-2">
            <div className="min-w-0"><p className="text-sm truncate">{r.name}{r.day ? ` · día ${r.day}` : ""}</p><p className="text-xs text-stone-400 truncate">{r.incomeCat}{r.note ? ` · ${r.note}` : ""}</p></div>
            <div className="flex items-center gap-2 shrink-0">
              <input type="number" value={r.amount} onChange={(e) => updateAmount(r.id, e.target.value)} className="w-20 border border-stone-200 rounded-md px-1.5 py-1 text-sm font-mono text-right" />
              <button onClick={() => remove(r.id)} className="text-stone-300 hover:text-rose-600"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm font-medium mb-2">Añadir nuevo</p>
      <div className="flex flex-wrap gap-1.5 mb-3">{INCOME_CATS.map((c) => <Chip key={c} label={c} active={incomeCat === c} onClick={() => setIncomeCat(c)} />)}</div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre (ej. Nómina)" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm mb-3" />
      <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Importe habitual (€)" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm mb-3 font-mono" />
      <input type="number" inputMode="numeric" value={day} onChange={(e) => setDay(e.target.value)} placeholder="Día habitual del mes (opcional, ej. 28)" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm mb-3" min="1" max="31" />
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota (opcional)" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm mb-3" />
      <button onClick={add} className="w-full bg-slate-800 text-white rounded-lg py-2.5 text-sm font-medium">Añadir ingreso recurrente</button>
    </div>
  );
}

function AjustesTab({ categories, setCategories, recurring, setRecurring, recurringIncome, setRecurringIncome, assets, setAssets, addAsset, investmentConfig, setInvestmentConfig, variableBudget, setVariableBudget, initialSection, onExport, onImport }) {
  const [section, setSection] = useState(initialSection || "categorias");
  const [importConfirm, setImportConfirm] = useState(null);
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { try { setImportConfirm(JSON.parse(reader.result)); } catch { alert("Archivo no válido."); } };
    reader.readAsText(file);
    e.target.value = "";
  };
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-5">
        <button onClick={() => setSection("categorias")} className={`text-sm rounded-lg py-2 border ${section === "categorias" ? "bg-slate-800 text-white border-slate-800" : "border-stone-200 text-stone-500 bg-white"}`}>Categorías</button>
        <button onClick={() => setSection("recurrentes")} className={`text-sm rounded-lg py-2 border ${section === "recurrentes" ? "bg-slate-800 text-white border-slate-800" : "border-stone-200 text-stone-500 bg-white"}`}>Gastos fijos</button>
        <button onClick={() => setSection("ingresos")} className={`text-sm rounded-lg py-2 border ${section === "ingresos" ? "bg-emerald-700 text-white border-emerald-700" : "border-stone-200 text-stone-500 bg-white"}`}>Ingresos</button>
        <button onClick={() => setSection("inversion")} className={`text-sm rounded-lg py-2 border ${section === "inversion" ? "bg-indigo-700 text-white border-indigo-700" : "border-stone-200 text-stone-500 bg-white"}`}>Inversión</button>
      </div>
      {section === "categorias" && <CategoriasEditor categories={categories} setCategories={setCategories} variableBudget={variableBudget} setVariableBudget={setVariableBudget} />}
      {section === "recurrentes" && <RecurringEditor categories={categories} recurring={recurring} setRecurring={setRecurring} />}
      {section === "ingresos" && <RecurringIncomeEditor recurringIncome={recurringIncome} setRecurringIncome={setRecurringIncome} />}
      {section === "inversion" && <InvestmentEditor assets={assets} setAssets={setAssets} addAsset={addAsset} config={investmentConfig} setConfig={setInvestmentConfig} />}

      <div className="border-t border-stone-200 mt-6 pt-4">
        <p className="text-xs text-stone-400 mb-3">Copia de seguridad de tus datos</p>
        <div className="flex gap-2">
          <button onClick={onExport} className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 text-white rounded-lg py-2 text-xs font-medium"><Download size={14} /> Exportar</button>
          <label className="flex-1 flex items-center justify-center gap-1.5 border border-stone-200 text-slate-700 rounded-lg py-2 text-xs font-medium cursor-pointer bg-white"><Upload size={14} /> Importar<input type="file" accept="application/json" onChange={handleFile} className="hidden" /></label>
        </div>
      </div>

      {importConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-30" onClick={() => setImportConfirm(null)}>
          <div className="bg-white rounded-t-2xl w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
            <p className="font-serif text-base mb-2">¿Reemplazar tus datos?</p>
            <p className="text-sm text-stone-600 mb-4">Esto sustituirá todos tus movimientos, fondos, categorías y configuración actuales. No se puede deshacer.</p>
            <button onClick={() => { onImport(importConfirm); setImportConfirm(null); }} className="w-full bg-rose-600 text-white rounded-lg py-2.5 text-sm font-medium mb-2">Sí, reemplazar mis datos</button>
            <button onClick={() => setImportConfirm(null)} className="w-full border border-stone-200 text-stone-600 rounded-lg py-2.5 text-sm font-medium">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ApplyPresetsModal({ pendingIncome, pendingRecurring, pendingInvestment, categories, assets, investmentConfig, ingresos, onClose, onConfirm }) {
  const totalSuggestedInvest = ingresos * ((investmentConfig.globalPct || 0) / 100);
  const investAssets = pendingInvestment ? assets : [];

  const [incomeItems, setIncomeItems] = useState(() => Object.fromEntries(pendingIncome.map((r) => [r.id, { checked: true, amount: r.amount }])));
  const [expenseItems, setExpenseItems] = useState(() => Object.fromEntries(pendingRecurring.map((r) => [r.id, { checked: true, amount: r.amount }])));
  const [investItems, setInvestItems] = useState(() => Object.fromEntries(investAssets.map((a) => [a.id, { checked: true, amount: Math.round(totalSuggestedInvest * ((a.pct || 0) / 100) * 100) / 100 }])));

  const toggle = (setter, id) => setter((s) => ({ ...s, [id]: { ...s[id], checked: !s[id].checked } }));
  const setAmt = (setter, id, val) => setter((s) => ({ ...s, [id]: { ...s[id], amount: parseFloat(val) || 0 } }));

  const confirm = () => {
    onConfirm({
      income: pendingIncome.filter((r) => incomeItems[r.id]?.checked).map((r) => ({ id: r.id, amount: incomeItems[r.id].amount })),
      expenses: pendingRecurring.filter((r) => expenseItems[r.id]?.checked).map((r) => ({ id: r.id, amount: expenseItems[r.id].amount })),
      investment: investAssets.filter((a) => investItems[a.id]?.checked).map((a) => ({ id: a.id, amount: investItems[a.id].amount })),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-20" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full max-w-md p-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3"><p className="font-serif text-base">Ingresos y gastos preestablecidos</p><button onClick={onClose} className="text-stone-400"><X size={18} /></button></div>

        {pendingIncome.length === 0 && pendingRecurring.length === 0 && !pendingInvestment && (
          <div className="text-center py-6">
            <Check size={32} className="mx-auto text-teal-600 mb-2" />
            <p className="text-sm text-stone-600">Todo aplicado este mes</p>
            <p className="text-xs text-stone-400 mt-1">Si necesitas reaplicar algo, borra primero el movimiento correspondiente y vuelve aquí.</p>
          </div>
        )}

        {pendingIncome.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2 text-emerald-700">Ingresos recurrentes</p>
            <div className="space-y-2">
              {pendingIncome.map((r) => (
                <label key={r.id} className="flex items-center justify-between bg-white border border-stone-100 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <input type="checkbox" checked={incomeItems[r.id]?.checked} onChange={() => toggle(setIncomeItems, r.id)} />
                    <span className="text-sm truncate">{r.name || r.incomeCat}</span>
                  </div>
                  <input type="number" value={incomeItems[r.id]?.amount} onChange={(e) => setAmt(setIncomeItems, r.id, e.target.value)} className="w-20 border border-stone-200 rounded-md px-1.5 py-1 text-sm font-mono text-right shrink-0" />
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
                  <label key={r.id} className="flex items-center justify-between bg-white border border-stone-100 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <input type="checkbox" checked={expenseItems[r.id]?.checked} onChange={() => toggle(setExpenseItems, r.id)} />
                      <span className="text-sm truncate">{cat?.name}{r.subcategory ? ` · ${r.subcategory}` : ""}</span>
                    </div>
                    <input type="number" value={expenseItems[r.id]?.amount} onChange={(e) => setAmt(setExpenseItems, r.id, e.target.value)} className="w-20 border border-stone-200 rounded-md px-1.5 py-1 text-sm font-mono text-right shrink-0" />
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {investAssets.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2 text-indigo-700">Plan de inversión</p>
            <p className="text-xs text-stone-500 mb-2">Sugerido: {fmt(totalSuggestedInvest)} ({investmentConfig.globalPct || 0}% de tus ingresos del mes, incluyendo los de arriba)</p>
            <div className="space-y-2">
              {investAssets.map((a) => (
                <label key={a.id} className="flex items-center justify-between bg-white border border-stone-100 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <input type="checkbox" checked={investItems[a.id]?.checked} onChange={() => toggle(setInvestItems, a.id)} />
                    <span className="text-sm truncate">{a.name} <span className="text-stone-400">· {a.pct || 0}%</span></span>
                  </div>
                  <input type="number" value={investItems[a.id]?.amount} onChange={(e) => setAmt(setInvestItems, a.id, e.target.value)} className="w-20 border border-stone-200 rounded-md px-1.5 py-1 text-sm font-mono text-right shrink-0" />
                </label>
              ))}
            </div>
          </div>
        )}

        <button onClick={confirm} className="w-full bg-teal-700 text-white rounded-lg py-2.5 text-sm font-medium">Confirmar</button>
      </div>
    </div>
  );
}
