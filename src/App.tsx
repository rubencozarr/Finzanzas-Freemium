import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { useSavingsMilestone } from "./hooks/useSavingsMilestone";
import { FREE_MAX_CATEGORIES, FREE_MAX_FUNDS } from "./lib/constants";
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
  planFundedRecurringApplications,
  trendUltimos6Meses,
  yearMonthsData,
  yearTotals,
  type OrphanGroup,
  type OrphanSubcategoryGroup,
} from "./lib/calculations";
import { fmt, monthKey, todayISO } from "./lib/format";
import { buildBackup, downloadBackup, importBackup } from "./lib/backup";
import { exportToExcel } from "./lib/exportExcel";
import { NavButton } from "./components/NavButton";
import { Toast } from "./components/Toast";
import { MilestoneNotice } from "./components/MilestoneNotice";
import { NuevoMovimientoForm, type FormPreset } from "./components/NuevoMovimientoForm";
import { ApplyPresetsModal } from "./components/ApplyPresetsModal";
import { ResolveOrphansModal } from "./components/ResolveOrphansModal";
import { LoginScreen } from "./components/LoginScreen";
import { GuidedTour } from "./components/GuidedTour";
import { buildTourSteps } from "./lib/tourSteps";
import { HelpModal } from "./components/HelpModal";
import { PremiumScreen } from "./components/PremiumScreen";
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
  const {
    funds,
    addFund,
    renameFund,
    deleteFund,
    updateFundGoal,
    updateFundActive,
    updateFundIcon,
    updateFundOrder,
    loading: fundsLoading,
    refetch: refetchFunds,
  } = useFunds(userId);
  const {
    categories,
    addCategory,
    renameCategory,
    removeCategory,
    updateBudget,
    addSubcategory,
    removeSubcategory,
    moveCategory,
    updateCategoryActive,
    loading: categoriesLoading,
    refetch: refetchCategories,
  } = useCategories(userId);
  const {
    recurring,
    addRecurring,
    removeRecurring,
    updateRecurringAmount,
    updateRecurringFundedByFund,
    refetch: refetchRecurring,
  } = useRecurring(userId);
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
  const { shown: savingsMilestoneShown, markShown: markSavingsMilestoneShown } = useSavingsMilestone(userId);

  // Downgrade/importación: un free puede heredar más fondos/categorías "activos" que su límite (los
  // datos importados o los de una cuenta que antes era premium llegan con is_active = true). En cuanto
  // se detecta ese estado se desactivan todos, para que el usuario elija su selección desde cero dentro
  // del límite. Autolimitado: en cuanto la desactivación se aplica, el recuento de activos baja del
  // límite y el efecto deja de disparar. El bloqueo mensual de fondos/categorías activas (una vez se
  // usan) se deriva directamente de las transacciones del mes en FondosTab.tsx/CategoriasEditor.tsx
  // (por elemento, no de forma global), así que no hace falta ningún estado ni escritura aquí.
  useEffect(() => {
    if (isPremium || fundsLoading) return;
    const activeFunds = funds.filter((f) => f.isActive);
    if (funds.length <= FREE_MAX_FUNDS || activeFunds.length <= FREE_MAX_FUNDS) return;
    activeFunds.forEach((f) => updateFundActive(f.id, false));
  }, [isPremium, fundsLoading, funds, updateFundActive]);

  useEffect(() => {
    if (isPremium || categoriesLoading) return;
    const overLimitTypes = (["fixed", "variable"] as const).filter((type) => {
      const list = categories.filter((c) => c.type === type);
      return list.length > FREE_MAX_CATEGORIES[type] && list.filter((c) => c.isActive).length > FREE_MAX_CATEGORIES[type];
    });
    if (overLimitTypes.length === 0) return;
    overLimitTypes.forEach((type) => {
      categories.filter((c) => c.type === type && c.isActive).forEach((c) => updateCategoryActive(c.id, false));
    });
  }, [isPremium, categoriesLoading, categories, updateCategoryActive]);

  const [tab, setTabRaw] = useState<Tab>("movimientos");
  // El scroll de <main> (más abajo) se pierde al cambiar de pestaña porque el contenido del tab
  // saliente se desmonta y el navegador reposiciona el scroll para el nuevo contenido. Se guarda el
  // scrollTop de cada tab en este ref (no en estado: no necesita re-render) al salir de él, y se
  // restaura en el useLayoutEffect de más abajo al volver.
  const mainRef = useRef<HTMLElement>(null);
  const scrollPositions = useRef<Partial<Record<Tab, number>>>({});
  // Cada pestaña, una vez visitada, se queda montada (ver render de <main> más abajo) para no perder
  // los useMemo internos de cada tab. Se oculta con "invisible h-0 overflow-hidden", NO con
  // display:none: display:none colapsa el elemento a 0×0, así que ResponsiveContainer (Recharts)
  // tiene que volver a medir y redibujar el gráfico entero CADA VEZ que la pestaña se vuelve a
  // mostrar, no solo la primera vez — eso es lo que se sentía como "carga" al cambiar a una pestaña
  // con gráficos. h-0 + overflow-hidden recorta la ALTURA a 0 (sin aportar espacio de scroll) pero dentro
  // del flujo normal del documento, sin position:absolute: el ANCHO no se ve afectado por la altura en
  // el modelo de caja de bloque, así que Recharts sigue midiendo el ancho real. (Se probó primero con
  // position:absolute + inset:0, pero un elemento posicionado siempre se pinta POR ENCIMA de sus
  // hermanos en flujo normal aunque sea invisible/pointer-events:none — eso bloqueaba el scroll táctil
  // de la pestaña visible.) Se añade al set aquí, en el mismo ciclo que cambia `tab`, para que la
  // primera vez que una pestaña se monta ya sea la visible.
  const [visitedTabs, setVisitedTabs] = useState<Set<Tab>>(new Set(["movimientos"]));
  const setTab = (newTab: Tab) => {
    if (mainRef.current) scrollPositions.current[tab] = mainRef.current.scrollTop;
    setVisitedTabs((prev) => (prev.has(newTab) ? prev : new Set(prev).add(newTab)));
    setTabRaw(newTab);
  };
  useLayoutEffect(() => {
    const saved = scrollPositions.current[tab] ?? 0;
    if (mainRef.current) mainRef.current.scrollTop = saved;
    // Un solo set en el commit no basta: si el contenido del tab termina de asentar su altura un
    // frame después (p. ej. fuentes o primer layout de algún gráfico), el navegador puede recolocar
    // el scroll ligeramente. Se reafirma el mismo valor guardado un frame más tarde para corregirlo.
    const raf = requestAnimationFrame(() => {
      if (mainRef.current) mainRef.current.scrollTop = saved;
    });
    return () => cancelAnimationFrame(raf);
  }, [tab]);
  const [ajustesSection, setAjustesSection] = useState("categorias");
  // Vive en App (no en AnualTab) para que sobreviva a salir y volver a la pestaña Anual: AnualTab solo
  // se renderiza cuando tab === "anual", así que un estado local ahí se perdía cada vez que el usuario
  // iba a Mensual a mirar un mes y volvía.
  const [compareYear, setCompareYear] = useState<number | null>(null);
  const goToAjustes = (section?: string) => {
    setAjustesSection(section || "categorias");
    // Fuerza que Ajustes se abra arriba del todo (donde vive la tarjeta "Tu plan"), en vez de
    // restaurar el scroll donde se dejó la última vez: relevante para "Ver planes" desde un
    // PremiumGate, que quiere llevar directo a esa tarjeta, no a media pestaña.
    scrollPositions.current.ajustes = 0;
    if (tab === "ajustes" && mainRef.current) mainRef.current.scrollTop = 0;
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
  const [showPremiumScreen, setShowPremiumScreen] = useState(false);
  const onOpenPremiumScreen = () => setShowPremiumScreen(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };
  const [milestoneMsg, setMilestoneMsg] = useState<string | null>(null);

  // El estado del tutorial vive en Supabase (tabla user_settings), asociado al usuario y no al
  // navegador: así, si el mismo usuario entra desde otro dispositivo, no vuelve a verlo.
  const { completed: onboardingCompleted, loading: onboardingLoading, setOnboardingCompleted } = useOnboardingStatus(userId);
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

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
      buildTourSteps(
        {
          ensureAjustes: () => setTab("ajustes"),
          ensureAjustesIngresos: () => {
            setTab("ajustes");
            setAjustesSection("ingresos");
          },
          ensureAjustesRecurrentes: () => {
            setTab("ajustes");
            setAjustesSection("recurrentes");
          },
          ensureAjustesInversion: () => {
            setTab("ajustes");
            setAjustesSection("inversion");
          },
          ensureMovimientos: () => setTab("movimientos"),
          ensureMovementForm: () => {
            setFormPreset(null);
            setEditingTx(null);
            setShowForm(true);
          },
          closeMovementForm: () => setShowForm(false),
          ensureFondos: () => setTab("fondos"),
          ensureMensual: () => setTab("mensual"),
          ensureAnual: () => setTab("anual"),
        },
        isPremium,
      ),
    [isPremium],
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
  const handleTourPrev = () => setTourStep((s) => Math.max(0, s - 1));

  const year = cursor.getFullYear();
  const monthIdx = cursor.getMonth();
  const selectedMonthKey = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
  const currentMonthKey = monthKey(todayISO());

  const fundsWithBalance = useMemo(() => computeFundsWithBalance(funds, transactions), [funds, transactions]);

  // Aviso de conversión free: la primera vez que el total ahorrado entre fondos llega a 500€, se avisa
  // una sola vez (savings_milestone_shown en Supabase evita que vuelva a salir en sesiones futuras).
  useEffect(() => {
    if (isPremium || savingsMilestoneShown || !userId) return;
    const totalFondos = fundsWithBalance.reduce((s, f) => s + f.balance, 0);
    if (totalFondos >= 500) {
      setMilestoneMsg("¡Ya llevas 500€ ahorrados! Con Premium puedes poner metas a cada fondo y ver tu progreso.");
      markSavingsMilestoneShown();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium, savingsMilestoneShown, userId, fundsWithBalance]);

  // Aviso premium al alcanzar la meta de un fondo. Vive aquí (no en FondosTab) porque App no se
  // desmonta al cambiar de pestaña: si esto estuviera en FondosTab, guardar la aportación desde
  // Movimientos y volver a Fondos remontaría el componente y perdería el saldo anterior, sin poder
  // detectar el cruce. Igual que el aviso de arriba, el primer render solo guarda la base sin
  // comparar, para no felicitar de nuevo por metas ya alcanzadas en sesiones previas.
  const prevFundBalancesRef = useRef<Record<string, number> | null>(null);
  useEffect(() => {
    if (isPremium) {
      const prev = prevFundBalancesRef.current;
      if (prev) {
        const totalFondos = fundsWithBalance.reduce((s, f) => s + f.balance, 0);
        fundsWithBalance.forEach((f) => {
          if (f.goalAmount == null) return;
          const wasBelow = (prev[f.id] ?? -Infinity) < f.goalAmount;
          if (wasBelow && f.balance >= f.goalAmount) {
            setMilestoneMsg(`¡Has alcanzado tu meta de ${f.name}! Llevas ${fmt(totalFondos)} ahorrados en total entre todos tus fondos.`);
          }
        });
      }
    }
    prevFundBalancesRef.current = Object.fromEntries(fundsWithBalance.map((f) => [f.id, f.balance]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium, fundsWithBalance]);

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
        // El nombre que el usuario le puso al ingreso recurrente (p. ej. "Nómina") se guarda en
        // subcategory: MovimientosTab ya lo muestra para cualquier tipo de movimiento vía
        // resolveSubcategoryName. Si no lo personalizó, name cae por defecto al propio incomeCat
        // (ver RecurringIncomeEditor), y mostrarlo sería redundante con la categoría.
        subcategory: tpl.name && tpl.name !== tpl.incomeCat ? tpl.name : null,
        note: tpl.note || "",
        recurringIncomeId: tpl.id,
      });
    }
    const plans = planFundedRecurringApplications(
      expenses.map((it) => ({
        id: it.id,
        amount: it.amount,
        fundedByFundId: recurring.find((r) => r.id === it.id)?.fundedByFundId,
      })),
      fundsWithBalance,
    );
    for (const it of expenses) {
      const tpl = recurring.find((r) => r.id === it.id);
      if (!tpl || it.amount <= 0) continue;
      const cat = categories.find((c) => c.id === tpl.categoryId);
      const base = {
        type: "gasto" as const,
        fixed: true,
        date: dateWithDay(tpl.day),
        category: cat?.name || "",
        categoryId: cat?.id ?? null,
        subcategory: tpl.subcategory || null,
        note: tpl.note || "",
        recurringId: tpl.id,
      };
      const plan = plans.find((p) => p.recurringId === tpl.id);
      if (!plan) {
        await addTransaction({ ...base, amount: it.amount, fundedBy: null });
      } else if (plan.normalAmount <= 0) {
        await addTransaction({ ...base, amount: it.amount, fundedBy: plan.fundId });
      } else if (plan.fundAmount > 0) {
        await addTransaction({
          ...base,
          amount: it.amount,
          fundedBy: null,
          splitFundId: plan.fundId,
          splitFundAmount: plan.fundAmount,
        });
      } else {
        await addTransaction({ ...base, amount: it.amount, fundedBy: null });
      }
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
    (showForm && !tourSteps[tourStep]?.formOpen) || showApplyPresets || showResolveOrphans || showHelp || showPremiumScreen;

  // Aplica el prerrequisito de estado de cada paso al entrar en él (p. ej. cambiar de pestaña, abrir
  // o cerrar el formulario de movimiento), tanto avanzando con "Siguiente" como retrocediendo con
  // "Anterior" — cada paso es puramente explicativo, no espera ninguna acción real del usuario.
  useEffect(() => {
    if (!tourActive) return;
    tourSteps[tourStep]?.onEnter?.();
  }, [tourActive, tourStep, tourSteps]);

  // Caso especial: en el paso que señala el botón real "Nuevo movimiento" (sin formOpen, porque el
  // formulario todavía no está abierto en ese paso), si el usuario toca el botón de verdad en vez de
  // "Siguiente", showForm pasa a true y tourPaused ocultaría el tour entero hasta que cerrara el
  // formulario, dando sensación de que el tutorial se ha quedado colgado. En vez de eso, se avanza al
  // paso siguiente (que sí espera el formulario abierto), igual que si hubiera pulsado "Siguiente".
  const newMovementBtnStepIndex = tourSteps.findIndex((s) => s.target === '[data-tour="new-movement-btn"]');
  useEffect(() => {
    if (!tourActive) return;
    if (tourStep === newMovementBtnStepIndex && showForm) setTourStep(tourStep + 1);
  }, [tourActive, tourStep, showForm, newMovementBtnStepIndex]);

  const onExport = () => {
    downloadBackup(
      buildBackup({ transactions, funds, categories, recurring, recurringIncome, assets, investmentConfig, variableBudget }),
    );
  };

  const onExportExcel = () => exportToExcel({ transactions, funds: fundsWithBalance, categories });

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

      <main ref={mainRef} className="flex-1 overflow-y-auto px-4 pt-4 pb-24 max-w-md w-full mx-auto">
        {visitedTabs.has("movimientos") && (
          <div className={tab === "movimientos" ? "" : "invisible h-0 overflow-hidden pointer-events-none"}>
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
            onOpenPremiumScreen={onOpenPremiumScreen}
            orphanCount={
              orphanGroups.reduce((s, g) => s + g.count, 0) + orphanSubcategoryGroups.reduce((s, g) => s + g.count, 0)
            }
            onResolveOrphans={() => setShowResolveOrphans(true)}
            toast={showToast}
          />
          </div>
        )}
        {visitedTabs.has("fondos") && (
          <div className={tab === "fondos" ? "" : "invisible h-0 overflow-hidden pointer-events-none"}>
          <FondosTab
            isPremium={isPremium}
            canCreateFund={canCreateFund}
            canNavigateToMonth={canNavigateToMonth}
            funds={fundsWithBalance}
            transactions={transactions}
            addFund={addFund}
            renameFund={renameFund}
            deleteFund={onDeleteFund}
            updateFundGoal={updateFundGoal}
            updateFundActive={updateFundActive}
            updateFundIcon={updateFundIcon}
            updateFundOrder={updateFundOrder}
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
            onOpenPremiumScreen={onOpenPremiumScreen}
          />
          </div>
        )}
        {visitedTabs.has("mensual") && (
          <div className={tab === "mensual" ? "" : "invisible h-0 overflow-hidden pointer-events-none"}>
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
            onOpenPremiumScreen={onOpenPremiumScreen}
          />
          </div>
        )}
        {visitedTabs.has("anual") && (
          <div className={tab === "anual" ? "" : "invisible h-0 overflow-hidden pointer-events-none"}>
          <AnualTab
            isPremium={isPremium}
            year={year}
            changeYear={changeYear}
            data={yearData}
            totals={yearStats}
            transactions={transactions}
            assets={assets}
            variableBudget={variableBudget}
            compareYear={compareYear}
            onCompareYearChange={setCompareYear}
            onOpenPremiumScreen={onOpenPremiumScreen}
          />
          </div>
        )}
        {visitedTabs.has("ajustes") && (
          <div className={tab === "ajustes" ? "" : "invisible h-0 overflow-hidden pointer-events-none"}>
          <AjustesTab
            isPremium={isPremium}
            onOpenPremiumScreen={onOpenPremiumScreen}
            canCreateCategory={canCreateCategory}
            categories={categories}
            addCategory={addCategory}
            renameCategory={renameCategoryEverywhere}
            removeCategory={removeCategory}
            updateBudget={updateBudget}
            addSubcategory={addSubcategory}
            removeSubcategory={removeSubcategory}
            moveCategory={moveCategory}
            updateCategoryActive={updateCategoryActive}
            transactions={transactions}
            currentMonthKey={currentMonthKey}
            getCategoryUsageCount={getCategoryUsageCount}
            getSubcategoryUsageCount={getSubcategoryUsageCount}
            variableBudget={variableBudget}
            updateVariableBudget={updateVariableBudget}
            funds={fundsWithBalance}
            recurring={recurring}
            addRecurring={addRecurring}
            removeRecurring={removeRecurring}
            updateRecurringAmount={updateRecurringAmount}
            updateRecurringFundedByFund={updateRecurringFundedByFund}
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
            onExportExcel={onExportExcel}
            onImport={onImport}
            onSignOut={handleSignOut}
          />
          </div>
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
          funds={fundsWithBalance}
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
          onPrev={handleTourPrev}
          onSkip={completeTour}
        />
      )}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} onRestartTour={restartTour} />}

      {showPremiumScreen && (
        <PremiumScreen
          isPremium={isPremium}
          userId={userId}
          userEmail={user?.email ?? undefined}
          onClose={() => setShowPremiumScreen(false)}
        />
      )}

      <nav
        className="sticky bottom-0 bg-white border-t border-stone-200 flex justify-around pt-2 max-w-md w-full mx-auto"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
      >
        <NavButton icon={<Wallet size={18} />} label="Movim." active={tab === "movimientos"} onClick={() => setTab("movimientos")} tourId="nav-movimientos" />
        <NavButton icon={<PiggyBank size={18} />} label="Fondos" active={tab === "fondos"} onClick={() => setTab("fondos")} tourId="nav-fondos" />
        <NavButton icon={<ArrowUpCircle size={18} />} label="Mensual" active={tab === "mensual"} onClick={() => setTab("mensual")} tourId="nav-mensual" />
        <NavButton icon={<ArrowDownCircle size={18} />} label="Anual" active={tab === "anual"} onClick={() => setTab("anual")} tourId="nav-anual" />
        <NavButton icon={<Settings2 size={18} />} label="Ajustes" active={tab === "ajustes"} onClick={() => setTab("ajustes")} tourId="nav-ajustes" />
      </nav>
      <Toast message={toastMsg} />
      <MilestoneNotice message={milestoneMsg} onClose={() => setMilestoneMsg(null)} />
    </div>
  );
}

export default App;
