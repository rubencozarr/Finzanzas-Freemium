import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, HelpCircle, PiggyBank, Settings2, Wallet } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useTransactions } from "./hooks/useTransactions";
import { useFunds } from "./hooks/useFunds";
import { useCategories } from "./hooks/useCategories";
import { useRecurring } from "./hooks/useRecurring";
import { useRecurringIncome } from "./hooks/useRecurringIncome";
import { useAssets } from "./hooks/useAssets";
import { useInvestmentConfig } from "./hooks/useInvestmentConfig";
import { useVariableBudget } from "./hooks/useVariableBudget";
import { useOnboardingStatus } from "./hooks/useOnboardingStatus";
import { useSubscription } from "./hooks/useSubscription";
import {
  ahorroLibreDisponibleParaMes,
  ahorroLibreHasta,
  ahorroLibrePseudoFund,
  assetsHasta,
  assetsWithTotal as computeAssetsWithTotal,
  computeMonth,
  computePendingPresets,
  fundsBalanceHasta,
  fundsWithBalance as computeFundsWithBalance,
  groupOrphanCategories,
  groupOrphanSubcategories,
  matchesCategory,
  matchesSubcategory,
  trendUltimos6Meses,
  yearMonthsData,
  yearTotals,
  type OrphanGroup,
  type OrphanSubcategoryGroup,
} from "./lib/calculations";
import { monthKey, todayISO } from "./lib/format";
import { buildBackup, downloadBackup, importBackup } from "./lib/backup";
import { NavButton } from "./components/NavButton";
import { Toast } from "./components/Toast";
import { NuevoMovimientoForm, type FormPreset } from "./components/NuevoMovimientoForm";
import { ApplyPresetsModal } from "./components/ApplyPresetsModal";
import { ResolveOrphansModal } from "./components/ResolveOrphansModal";
import { LoginScreen } from "./components/LoginScreen";
import { GuidedTour } from "./components/GuidedTour";
import { buildTourSteps } from "./lib/tourSteps";
import { HelpModal } from "./components/HelpModal";
import { MovimientosTab } from "./features/movimientos/MovimientosTab";
import { FondosTab } from "./features/fondos/FondosTab";
import { MensualTab } from "./features/mensual/MensualTab";
import { AnualTab } from "./features/anual/AnualTab";
import { AjustesTab } from "./features/ajustes/AjustesTab";
import type { AssetWithTotal, FundWithBalance, Transaction } from "./types";

type Tab = "movimientos" | "fondos" | "mensual" | "anual" | "ajustes";

function App() {
  const { user, loading: authLoading, signInWithPassword, signUp, signOut } = useAuth();
  const userId = user?.id;

  const { transactions, addTransaction, editTransaction, deleteTransaction, refetch: refetchTransactions } = useTransactions(userId);
  const { funds, addFund, renameFund, deleteFund, refetch: refetchFunds } = useFunds(userId);
  const {
    categories,
    addCategory,
    renameCategory,
    removeCategory,
    updateBudget,
    addSubcategory,
    removeSubcategory,
    moveCategory,
    refetch: refetchCategories,
  } = useCategories(userId);
  const { recurring, addRecurring, removeRecurring, updateRecurringAmount, refetch: refetchRecurring } = useRecurring(userId);
  const {
    recurringIncome,
    addRecurringIncome,
    removeRecurringIncome,
    updateRecurringIncomeAmount,
    refetch: refetchRecurringIncome,
  } = useRecurringIncome(userId);
  const { assets, addAsset, renameAsset, updateAssetPct, removeAsset, refetch: refetchAssets } = useAssets(userId);
  const { investmentConfig, setGlobalPct, refetch: refetchInvestmentConfig } = useInvestmentConfig(userId);
  const { variableBudget, updateVariableBudget, refetch: refetchVariableBudget } = useVariableBudget(userId);
  const { isPremium, canCreateCategory, canCreateFund, canNavigateToMonth } = useSubscription(userId);

  const [tab, setTab] = useState<Tab>("movimientos");
  const [ajustesSection, setAjustesSection] = useState("categorias");
  const goToAjustes = (section?: string) => {
    setAjustesSection(section || "categorias");
    setTab("ajustes");
  };

  // El componente App no se desmonta al cerrar sesión (solo cambia qué se renderiza según `user`),
  // así que sin este reset la siguiente sesión aparecería en la misma pestaña donde se cerró sesión
  // (normalmente Ajustes) en vez de arrancar en Movimientos.
  const handleSignOut = async () => {
    await signOut();
    setTab("movimientos");
    setAjustesSection("categorias");
  };
  const [cursor, setCursor] = useState(() => new Date());
  const [showForm, setShowForm] = useState(false);
  const [formPreset, setFormPreset] = useState<FormPreset | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [showApplyPresets, setShowApplyPresets] = useState(false);
  const [showResolveOrphans, setShowResolveOrphans] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // El estado del tutorial vive en Supabase (tabla user_settings), asociado al usuario y no al
  // navegador: así, si el mismo usuario entra desde otro dispositivo, no vuelve a verlo.
  const { completed: onboardingCompleted, loading: onboardingLoading, setOnboardingCompleted } = useOnboardingStatus(userId);
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [tourBaselineIncome, setTourBaselineIncome] = useState(0);
  const [tourBaselineRecurring, setTourBaselineRecurring] = useState(0);

  // Decide si arrancar el tour en cuanto se conoce el estado real de este usuario (tras el fetch a
  // Supabase), en vez de al montar el componente. No se evalúa nada mientras la sesión de Supabase
  // todavía se está restaurando (authLoading) ni mientras userId sea null/undefined: si no, al
  // reabrir la PWA habría una ventana en la que userId aún no ha resuelto y el tour se decidiría
  // sin conocer el flag real de completado, mostrándolo de nuevo aunque ya estuviera hecho. Además
  // se decide UNA sola vez por usuario (guardado en este ref): el listener de auth de Supabase puede
  // reevaluar loading/completed más de una vez para la misma sesión (getSession() + onAuthStateChange
  // compitiendo), y sin este guard eso podía reiniciar el tour a mitad de uso.
  const tourInitializedForUser = useRef<string | null>(null);
  useEffect(() => {
    if (authLoading || !userId || onboardingLoading) return;
    if (tourInitializedForUser.current === userId) return;
    tourInitializedForUser.current = userId;
    setTourActive(!onboardingCompleted);
    setTourStep(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, userId, onboardingLoading]);

  const tourSteps = useMemo(
    () =>
      buildTourSteps({
        ensureAjustes: () => setTab("ajustes"),
        ensureAjustesIngresos: () => {
          setTab("ajustes");
          setAjustesSection("ingresos");
        },
        ensureAjustesRecurrentes: () => {
          setTab("ajustes");
          setAjustesSection("recurrentes");
        },
        ensureMovimientos: () => setTab("movimientos"),
        ensureMovementForm: () => {
          setFormPreset(null);
          setEditingTx(null);
          setShowForm(true);
        },
        closeMovementForm: () => setShowForm(false),
      }),
    [],
  );

  const completeTour = () => {
    setOnboardingCompleted(true);
    setTourActive(false);
  };
  const restartTour = () => {
    setOnboardingCompleted(false);
    setShowHelp(false);
    setTourStep(0);
    setTourActive(true);
  };
  const handleTourNext = () => {
    if (tourStep >= tourSteps.length - 1) {
      completeTour();
    } else {
      setTourStep((s) => s + 1);
    }
  };

  const year = cursor.getFullYear();
  const monthIdx = cursor.getMonth();
  const selectedMonthKey = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
  const currentMonthKey = monthKey(todayISO());

  const fundsWithBalance = useMemo(() => computeFundsWithBalance(funds, transactions), [funds, transactions]);
  const assetsWithTotal = useMemo(() => computeAssetsWithTotal(assets, transactions), [assets, transactions]);
  const fundsForUsageDisplay = useMemo(
    () => [ahorroLibrePseudoFund(transactions), ...fundsWithBalance],
    [transactions, fundsWithBalance],
  );
  const trend6Meses = useMemo(() => trendUltimos6Meses(transactions, year, monthIdx), [transactions, year, monthIdx]);
  const orphanGroups = useMemo(() => groupOrphanCategories(transactions, categories), [transactions, categories]);
  const orphanSubcategoryGroups = useMemo(
    () => groupOrphanSubcategories(transactions, categories),
    [transactions, categories],
  );

  const getCategoryUsageCount = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return 0;
    return transactions.filter((t) => t.type === "gasto" && matchesCategory(t, cat)).length;
  };
  const getSubcategoryUsageCount = (categoryId: string, subcategoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    const sub = cat?.subcategories.find((s) => s.id === subcategoryId);
    if (!cat || !sub) return 0;
    return transactions.filter((t) => t.type === "gasto" && matchesCategory(t, cat) && matchesSubcategory(t, sub)).length;
  };
  const yearData = useMemo(() => yearMonthsData(transactions, year), [transactions, year]);
  const yearStats = useMemo(() => yearTotals(yearData), [yearData]);

  const monthTx = useMemo(
    () =>
      transactions
        .filter((t) => monthKey(t.date) === selectedMonthKey)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [transactions, selectedMonthKey],
  );

  const monthStats = useMemo(() => computeMonth(transactions, selectedMonthKey), [transactions, selectedMonthKey]);

  const getAhorroLibreDisponibleParaMes = (mKey: string) => ahorroLibreDisponibleParaMes(transactions, mKey);
  const getAhorroReal = (y: number, m: number) => computeMonth(transactions, `${y}-${String(m + 1).padStart(2, "0")}`).ahorroReal;

  const pending = useMemo(
    () => computePendingPresets({ monthTx, recurring, recurringIncome, investmentConfig, assets: isPremium ? assets : [] }),
    [monthTx, recurring, recurringIncome, investmentConfig, assets, isPremium],
  );

  const changeMonth = (delta: number) => {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + delta);
    setCursor(d);
  };
  const changeYear = (delta: number) => {
    const d = new Date(cursor);
    d.setFullYear(d.getFullYear() + delta);
    setCursor(d);
  };
  const goToMonthIndex = (m: number) => {
    const d = new Date(cursor);
    d.setMonth(m);
    setCursor(d);
  };

  const onQuickMove = (fund: FundWithBalance, type: "aportacion" | "retiro") => {
    setFormPreset({ type, fundId: fund.id });
    setEditingTx(null);
    setShowForm(true);
  };
  const onQuickInvest = (asset: AssetWithTotal) => {
    setFormPreset({ type: "inversion", assetId: asset.id });
    setEditingTx(null);
    setShowForm(true);
  };

  // Si el fondo tiene saldo, primero se registra como un retiro (que cuenta como ingreso del mes,
  // igual que cualquier otro retiro) para que el dinero vuelva al ahorro libre del usuario y quede
  // en el historial, y solo entonces se borra el fondo — si no, el saldo simplemente desaparecería.
  const onDeleteFund = async (fund: FundWithBalance) => {
    if (fund.balance > 0) {
      await addTransaction({
        type: "retiro",
        amount: fund.balance,
        date: todayISO(),
        category: fund.name,
        subcategory: null,
        note: `Fondo ${fund.name} eliminado — saldo devuelto`,
        fundId: fund.id,
      });
    }
    await deleteFund(fund.id);
  };

  const applyPresets = async ({
    income,
    expenses,
    investment,
  }: {
    income: { id: string; amount: number }[];
    expenses: { id: string; amount: number }[];
    investment: { id: string; amount: number }[];
  }) => {
    const baseDate = selectedMonthKey === monthKey(todayISO()) ? todayISO() : `${selectedMonthKey}-01`;
    const dateWithDay = (day: number | null) => {
      if (!day) return baseDate;
      const [y, m] = selectedMonthKey.split("-");
      const maxDay = new Date(parseInt(y), parseInt(m), 0).getDate();
      return `${selectedMonthKey}-${String(Math.min(day, maxDay)).padStart(2, "0")}`;
    };

    for (const it of income) {
      const tpl = recurringIncome.find((r) => r.id === it.id);
      if (!tpl || it.amount <= 0) continue;
      await addTransaction({
        type: "ingreso",
        amount: it.amount,
        date: dateWithDay(tpl.day),
        category: tpl.incomeCat,
        subcategory: null,
        note: tpl.note || "",
        recurringIncomeId: tpl.id,
      });
    }
    for (const it of expenses) {
      const tpl = recurring.find((r) => r.id === it.id);
      if (!tpl || it.amount <= 0) continue;
      const cat = categories.find((c) => c.id === tpl.categoryId);
      await addTransaction({
        type: "gasto",
        fixed: true,
        amount: it.amount,
        date: dateWithDay(tpl.day),
        category: cat?.name || "",
        categoryId: cat?.id ?? null,
        subcategory: tpl.subcategory || null,
        note: tpl.note || "",
        fundedBy: null,
        recurringId: tpl.id,
      });
    }
    for (const it of investment) {
      const asset = assets.find((a) => a.id === it.id);
      if (!asset || it.amount <= 0) continue;
      await addTransaction({
        type: "inversion",
        amount: it.amount,
        date: baseDate,
        category: asset.name,
        subcategory: null,
        note: "Plan de inversión mensual",
      });
    }
    setShowApplyPresets(false);
    showToast("Preestablecidos aplicados");
  };

  // Los movimientos que ya tienen categoryId (la referencia estable) muestran el nombre actualizado
  // automáticamente sin tocar nada: renombrar es un cambio trivial en la categoría. Esto solo
  // refresca el texto "category" (snapshot) de los movimientos afectados, para que el buscador
  // por texto y el backup exportado también queden al día — no es necesario para que los
  // desgloses de Mensual/Anual se actualicen, eso ya lo garantiza categoryId.
  const renameCategoryEverywhere = async (categoryId: string, newName: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (cat && cat.name !== newName) {
      const affected = transactions.filter(
        (t) => t.type === "gasto" && (t.categoryId ? t.categoryId === categoryId : t.category === cat.name),
      );
      for (const t of affected) {
        await editTransaction(t.id, { category: newName });
      }
    }
    await renameCategory(categoryId, newName);
  };

  // Reasigna TODOS los movimientos de un grupo de huérfanos de una sola vez (no uno a uno).
  const reassignOrphanGroup = async (group: OrphanGroup, categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    for (const id of group.ids) {
      await editTransaction(id, { categoryId: cat.id, category: cat.name });
    }
  };

  const reassignOrphanSubcategoryGroup = async (group: OrphanSubcategoryGroup, subcategoryId: string) => {
    const cat = categories.find((c) => c.id === group.categoryId);
    const sub = cat?.subcategories.find((s) => s.id === subcategoryId);
    if (!sub) return;
    for (const id of group.ids) {
      await editTransaction(id, { subcategoryId: sub.id, subcategory: sub.name });
    }
  };

  // Autoreparación puntual: rellena categoryId/subcategoryId en movimientos antiguos (de antes de
  // que existieran estos campos) cuyo nombre de categoría/subcategoría todavía coincide con una
  // actual. Los que ya no coinciden con ninguna (p. ej. de un renombrado de hace tiempo) no se
  // tocan: se detectan como huérfanos y el usuario los puede reasignar en bloque desde Movimientos.
  useEffect(() => {
    const catsToBackfill = transactions.filter((t) => t.type === "gasto" && !t.categoryId && t.category);
    catsToBackfill.forEach((t) => {
      const cat = categories.find((c) => c.name === t.category);
      if (cat) editTransaction(t.id, { categoryId: cat.id });
    });

    const subsToBackfill = transactions.filter(
      (t) => t.type === "gasto" && t.subcategory && !t.subcategoryId && (t.categoryId || categories.some((c) => c.name === t.category)),
    );
    subsToBackfill.forEach((t) => {
      const cat = categories.find((c) => c.id === t.categoryId || c.name === t.category);
      const sub = cat?.subcategories.find((s) => s.name === t.subcategory);
      if (sub) editTransaction(t.id, { subcategoryId: sub.id });
    });
  }, [transactions, categories, editTransaction]);

  // El formulario de nuevo movimiento no pausa el tour en los pasos que señalan algo dentro de él
  // (formOpen: true): ahí el modal debe permanecer abierto y visible por encima del overlay.
  const tourPaused =
    (showForm && !tourSteps[tourStep]?.formOpen) || showApplyPresets || showResolveOrphans || showHelp;

  // Aplica el prerrequisito de estado de cada paso al entrar en él (p. ej. cambiar de pestaña),
  // tanto si se llega haciendo clic en el elemento real como si se llega pulsando "Siguiente".
  useEffect(() => {
    if (!tourActive) return;
    tourSteps[tourStep]?.onEnter?.();
  }, [tourActive, tourStep, tourSteps]);

  // Fotografía el número de ingresos/gastos fijos al entrar en el paso de "añade uno nuevo", para
  // poder detectar más abajo que el usuario ha añadido uno real comparando contra el recuento actual.
  useEffect(() => {
    if (!tourActive) return;
    if (tourStep === 2) setTourBaselineIncome(recurringIncome.length);
    if (tourStep === 4) setTourBaselineRecurring(recurring.length);
  }, [tourActive, tourStep]);

  // Avanza el tour automáticamente cuando el usuario realiza la acción real señalada (en vez de
  // depender solo del botón "Siguiente"). No se condiciona a tourPaused: la transición de paso debe
  // registrarse en el momento en que se abre un modal (p. ej. el formulario de nuevo movimiento),
  // aunque el overlay del tour se oculte mientras ese modal esté abierto.
  useEffect(() => {
    if (!tourActive) return;
    if (tourStep === 0 && tab === "ajustes") setTourStep(1);
    else if (tourStep === 1 && ajustesSection === "ingresos") setTourStep(2);
    else if (tourStep === 2 && recurringIncome.length > tourBaselineIncome) setTourStep(3);
    else if (tourStep === 3 && ajustesSection === "recurrentes") setTourStep(4);
    else if (tourStep === 4 && recurring.length > tourBaselineRecurring) setTourStep(5);
    else if (tourStep === 5 && tab === "movimientos") setTourStep(6);
    else if (tourStep === 6 && showApplyPresets) setTourStep(7);
    else if (tourStep === 7 && showForm) setTourStep(8);
    // Los pasos 8 y 9 (tipos de movimiento) son solo explicativos y se avanzan con "Siguiente";
    // si el usuario cierra el formulario a mano en mitad de ellos, saltamos igualmente al siguiente
    // paso real (nav-mensual), cuyo onEnter ya se encarga de cerrar el formulario si siguiera abierto.
    else if ((tourStep === 8 || tourStep === 9) && !showForm) setTourStep(10);
    else if (tourStep === 10 && tab === "mensual") setTourStep(11);
    else if (tourStep === 11 && tab === "fondos") setTourStep(12);
  }, [
    tourActive,
    tourStep,
    tab,
    ajustesSection,
    recurringIncome.length,
    recurring.length,
    showApplyPresets,
    showForm,
    tourBaselineIncome,
    tourBaselineRecurring,
  ]);

  const onExport = () => {
    downloadBackup(
      buildBackup({ transactions, funds, categories, recurring, recurringIncome, assets, investmentConfig, variableBudget }),
    );
  };

  const onImport = async (data: unknown) => {
    const ok = await importBackup(userId, data);
    if (ok) {
      await Promise.all([
        refetchTransactions(),
        refetchFunds(),
        refetchCategories(),
        refetchRecurring(),
        refetchRecurringIncome(),
        refetchAssets(),
        refetchInvestmentConfig(),
        refetchVariableBudget(),
      ]);
      showToast("Datos importados");
    }
    return ok;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-400 text-sm">Cargando...</div>
    );
  }

  if (!user) {
    return <LoginScreen signInWithPassword={signInWithPassword} signUp={signUp} />;
  }

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 flex flex-col font-sans">
      <header
        className="bg-slate-800 text-stone-50 px-5 pb-4 flex items-start justify-between"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" }}
      >
        <div>
          <h1 className="font-serif text-xl tracking-tight">Mis cuentas</h1>
          <p className="text-stone-300 text-sm mt-0.5">Registro, fondos y resúmenes</p>
        </div>
        <button onClick={() => setShowHelp(true)} className="text-stone-300 hover:text-white mt-0.5">
          <HelpCircle size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24 max-w-md w-full mx-auto">
        {tab === "movimientos" && (
          <MovimientosTab
            isPremium={isPremium}
            canNavigateToMonth={canNavigateToMonth}
            monthIdx={monthIdx}
            year={year}
            changeMonth={changeMonth}
            changeYear={changeYear}
            goToMonthIndex={goToMonthIndex}
            getAhorroReal={getAhorroReal}
            monthTx={monthTx}
            allTransactions={transactions}
            stats={monthStats}
            funds={fundsWithBalance}
            categories={categories}
            deleteTransaction={deleteTransaction}
            onAdd={() => {
              setFormPreset(null);
              setEditingTx(null);
              setShowForm(true);
            }}
            onEdit={(tx) => {
              setEditingTx(tx);
              setFormPreset(null);
              setShowForm(true);
            }}
            hasAnyPending={pending.hasAnyPending}
            hasAnyConfigured={pending.hasAnyConfigured}
            onOpenApplyPresets={() => setShowApplyPresets(true)}
            onGoToAjustes={() => goToAjustes()}
            orphanCount={
              orphanGroups.reduce((s, g) => s + g.count, 0) + orphanSubcategoryGroups.reduce((s, g) => s + g.count, 0)
            }
            onResolveOrphans={() => setShowResolveOrphans(true)}
            toast={showToast}
          />
        )}
        {tab === "fondos" && (
          <FondosTab
            isPremium={isPremium}
            canCreateFund={canCreateFund}
            canNavigateToMonth={canNavigateToMonth}
            funds={fundsWithBalance}
            addFund={addFund}
            renameFund={renameFund}
            deleteFund={onDeleteFund}
            assets={assetsWithTotal}
            selectedMonthKey={selectedMonthKey}
            currentMonthKey={currentMonthKey}
            fundsBalanceHasta={(mKey) => fundsBalanceHasta(funds, transactions, mKey)}
            assetsHasta={(mKey) => assetsHasta(assets, transactions, mKey)}
            ahorroLibreHasta={(mKey) => ahorroLibreHasta(transactions, mKey)}
            ahorroLibreDisponibleParaMes={getAhorroLibreDisponibleParaMes}
            monthIdx={monthIdx}
            year={year}
            changeMonth={changeMonth}
            changeYear={changeYear}
            goToMonthIndex={goToMonthIndex}
            getAhorroReal={getAhorroReal}
            onQuickMove={onQuickMove}
            onQuickInvest={onQuickInvest}
            onGoToAjustes={() => goToAjustes("inversion")}
          />
        )}
        {tab === "mensual" && (
          <MensualTab
            isPremium={isPremium}
            canNavigateToMonth={canNavigateToMonth}
            monthIdx={monthIdx}
            year={year}
            changeMonth={changeMonth}
            changeYear={changeYear}
            goToMonthIndex={goToMonthIndex}
            getAhorroReal={getAhorroReal}
            stats={monthStats}
            monthTx={monthTx}
            categories={categories}
            funds={fundsForUsageDisplay}
            assets={assets}
            transactions={transactions}
            variableBudget={variableBudget}
            trend6Meses={trend6Meses}
            onGoToAjustes={() => goToAjustes("categorias")}
          />
        )}
        {tab === "anual" && (
          <AnualTab
            isPremium={isPremium}
            year={year}
            changeYear={changeYear}
            data={yearData}
            totals={yearStats}
            transactions={transactions}
            assets={assets}
            variableBudget={variableBudget}
          />
        )}
        {tab === "ajustes" && (
          <AjustesTab
            isPremium={isPremium}
            canCreateCategory={canCreateCategory}
            categories={categories}
            addCategory={addCategory}
            renameCategory={renameCategoryEverywhere}
            removeCategory={removeCategory}
            updateBudget={updateBudget}
            addSubcategory={addSubcategory}
            removeSubcategory={removeSubcategory}
            moveCategory={moveCategory}
            getCategoryUsageCount={getCategoryUsageCount}
            getSubcategoryUsageCount={getSubcategoryUsageCount}
            variableBudget={variableBudget}
            updateVariableBudget={updateVariableBudget}
            recurring={recurring}
            addRecurring={addRecurring}
            removeRecurring={removeRecurring}
            updateRecurringAmount={updateRecurringAmount}
            recurringIncome={recurringIncome}
            addRecurringIncome={addRecurringIncome}
            removeRecurringIncome={removeRecurringIncome}
            updateRecurringIncomeAmount={updateRecurringIncomeAmount}
            assets={assets}
            addAsset={addAsset}
            renameAsset={renameAsset}
            updateAssetPct={updateAssetPct}
            removeAsset={removeAsset}
            investmentConfig={investmentConfig}
            setGlobalPct={setGlobalPct}
            initialSection={ajustesSection}
            onSectionChange={setAjustesSection}
            onExport={onExport}
            onImport={onImport}
            onSignOut={handleSignOut}
          />
        )}
      </main>

      {showForm && (
        <NuevoMovimientoForm
          isPremium={isPremium}
          variableBudget={variableBudget}
          funds={fundsWithBalance}
          getAhorroLibreDisponibleParaMes={getAhorroLibreDisponibleParaMes}
          categories={categories}
          assets={assetsWithTotal}
          ahorroRealDisponible={monthStats.ahorroReal}
          monthTx={monthTx}
          initial={formPreset}
          editingTx={editingTx}
          defaultDate={selectedMonthKey === monthKey(todayISO()) ? todayISO() : `${selectedMonthKey}-01`}
          onClose={() => {
            setShowForm(false);
            setEditingTx(null);
          }}
          onSave={async (tx) => {
            if (editingTx) {
              await editTransaction(editingTx.id, tx);
              showToast("Movimiento actualizado");
            } else {
              await addTransaction(tx);
              showToast("Movimiento guardado");
            }
            setShowForm(false);
            setEditingTx(null);
          }}
        />
      )}
      {showApplyPresets && (
        <ApplyPresetsModal
          pendingIncome={pending.pendingIncome}
          pendingRecurring={pending.pendingRecurring}
          pendingInvestmentAssets={pending.pendingInvestmentAssets}
          categories={categories}
          investmentConfig={investmentConfig}
          ingresos={monthStats.ingresos + pending.pendingIncome.reduce((s, r) => s + r.amount, 0)}
          onClose={() => setShowApplyPresets(false)}
          onConfirm={applyPresets}
        />
      )}
      {showResolveOrphans && (
        <ResolveOrphansModal
          groups={orphanGroups}
          subcategoryGroups={orphanSubcategoryGroups}
          categories={categories}
          onClose={() => setShowResolveOrphans(false)}
          onApply={reassignOrphanGroup}
          onApplySubcategory={reassignOrphanSubcategoryGroup}
        />
      )}
      {tourActive && !tourPaused && (
        <GuidedTour
          step={tourSteps[tourStep]}
          stepIndex={tourStep}
          totalSteps={tourSteps.length}
          onNext={handleTourNext}
          onSkip={completeTour}
        />
      )}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} onRestartTour={restartTour} />}

      <nav
        className="sticky bottom-0 bg-white border-t border-stone-200 flex justify-around pt-2 max-w-md w-full mx-auto"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
      >
        <NavButton icon={<Wallet size={18} />} label="Movim." active={tab === "movimientos"} onClick={() => setTab("movimientos")} tourId="nav-movimientos" />
        <NavButton icon={<PiggyBank size={18} />} label="Fondos" active={tab === "fondos"} onClick={() => setTab("fondos")} tourId="nav-fondos" />
        <NavButton icon={<ArrowUpCircle size={18} />} label="Mensual" active={tab === "mensual"} onClick={() => setTab("mensual")} tourId="nav-mensual" />
        <NavButton icon={<ArrowDownCircle size={18} />} label="Anual" active={tab === "anual"} onClick={() => setTab("anual")} />
        <NavButton icon={<Settings2 size={18} />} label="Ajustes" active={tab === "ajustes"} onClick={() => setTab("ajustes")} tourId="nav-ajustes" />
      </nav>
      <Toast message={toastMsg} />
    </div>
  );
}

export default App;
