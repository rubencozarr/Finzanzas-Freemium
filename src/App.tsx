import { lazy, Suspense, startTransition, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { usePrivacyAcceptance } from "./hooks/usePrivacyAcceptance";
import { useKeyboardInset } from "./hooks/useKeyboardInset";
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
import { NavButton } from "./components/NavButton";
import { Toast } from "./components/Toast";
import { MilestoneNotice } from "./components/MilestoneNotice";
import { UpdateBanner } from "./components/UpdateBanner";
import { LoadingScreen } from "./components/LoadingScreen";
import { useRegisterSW } from "virtual:pwa-register/react";
import { LoginScreen } from "./components/LoginScreen";
import { LandingPage } from "./components/LandingPage";
import { ResetPasswordScreen } from "./components/ResetPasswordScreen";
import { isRunningAsTWA } from "./lib/platform";
import { buildTourSteps } from "./lib/tourSteps";
import { PrivacyReacceptanceModal } from "./components/PrivacyReacceptanceModal";
// Estático a propósito, no lazy: LoginScreen.tsx ya lo importa de forma estática (el enlace a la
// política de privacidad está también en el propio formulario de registro), así que ya viaja en el
// bundle principal de todos modos — envolverlo en lazy() aquí no lo separaría a otro chunk (Rollup
// avisa de esto: "dynamic import will not move module into another chunk").
import { PrivacyPolicyModal } from "./components/PrivacyPolicyModal";
import type { AssetWithTotal, FundWithBalance, Transaction } from "./types";
import type { FormPreset } from "./components/NuevoMovimientoForm";

// Todo lo que solo hace falta con sesión ya iniciada (los 5 tabs y los modales/tour de la app en sí)
// se carga bajo demanda: un visitante sin sesión (landing/login) no debería tener que descargar ni un
// byte de esto — antes, al ser imports estáticos, formaban parte del mismo bundle que la landing y lo
// inflaban a >1MB para cualquier visita, fuera a loguearse o no (causa principal de LCP/FCP lentos en
// Lighthouse). Cada import() cae en su propio chunk; el <Suspense> del return autenticado (más abajo)
// enseña LoadingScreen mientras se descargan la primera vez, justo después de iniciar sesión.
// PrivacyReacceptanceModal se queda como import estático a propósito: es diminuto (66 líneas) y su
// propio "if" vive fuera de ese Suspense (antes de montar el resto de la app autenticada), así que
// separarlo no aporta nada y solo añadiría un segundo boundary de Suspense para un caso raro.
const NuevoMovimientoForm = lazy(() =>
  import("./components/NuevoMovimientoForm").then((m) => ({ default: m.NuevoMovimientoForm })),
);
const TransferFundsForm = lazy(() => import("./components/TransferFundsForm").then((m) => ({ default: m.TransferFundsForm })));
const ApplyPresetsModal = lazy(() => import("./components/ApplyPresetsModal").then((m) => ({ default: m.ApplyPresetsModal })));
const ResolveOrphansModal = lazy(() =>
  import("./components/ResolveOrphansModal").then((m) => ({ default: m.ResolveOrphansModal })),
);
const GuidedTour = lazy(() => import("./components/GuidedTour").then((m) => ({ default: m.GuidedTour })));
const HelpModal = lazy(() => import("./components/HelpModal").then((m) => ({ default: m.HelpModal })));
const PremiumScreen = lazy(() => import("./components/PremiumScreen").then((m) => ({ default: m.PremiumScreen })));
const MovimientosTab = lazy(() =>
  import("./features/movimientos/MovimientosTab").then((m) => ({ default: m.MovimientosTab })),
);
const FondosTab = lazy(() => import("./features/fondos/FondosTab").then((m) => ({ default: m.FondosTab })));
const MensualTab = lazy(() => import("./features/mensual/MensualTab").then((m) => ({ default: m.MensualTab })));
const AnualTab = lazy(() => import("./features/anual/AnualTab").then((m) => ({ default: m.AnualTab })));
const AjustesTab = lazy(() => import("./features/ajustes/AjustesTab").then((m) => ({ default: m.AjustesTab })));

type Tab = "movimientos" | "fondos" | "mensual" | "anual" | "ajustes";

function App() {
  const {
    user,
    loading: authLoading,
    passwordRecovery,
    signInWithPassword,
    signUp,
    signOut,
    resetPasswordForEmail,
    updatePassword,
    clearPasswordRecovery,
    deleteAccount,
  } = useAuth();
  const userId = user?.id;
  // Solo importa cuando !user: dentro del TWA de Play Store siempre se salta directo al login (no
  // tiene sentido enseñar la landing dentro de la propia app instalada), así que este estado solo se
  // usa para el flujo de navegador web normal.
  const [showLoginScreen, setShowLoginScreen] = useState(false);
  const keyboardInset = useKeyboardInset();

  const {
    transactions,
    addTransaction,
    editTransaction,
    deleteTransaction,
    loading: transactionsLoading,
    refetch: refetchTransactions,
  } = useTransactions(userId);
  const {
    funds,
    addFund,
    renameFund,
    deleteFund,
    updateFundGoal,
    setFundGoalNotified,
    updateFundInitialBalance,
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
  const {
    isPremium,
    canCreateCategory,
    canCreateFund,
    canNavigateToMonth,
    refetch: refetchSubscription,
  } = useSubscription(userId);
  const {
    shown: savingsMilestoneShown,
    loading: savingsMilestoneLoading,
    markShown: markSavingsMilestoneShown,
  } = useSavingsMilestone(userId);
  const { needsReacceptance, loading: privacyLoading, recordAcceptance: recordPrivacyAcceptance } = usePrivacyAcceptance(userId);

  // <meta name="theme-color"> es fijo en index.html (navy, a juego con la cabecera bg-slate-800 de la
  // app). Las pantallas de login/carga/privacidad son claras (bg-stone-50) sin esa cabecera, así que si
  // no se actualiza aquí, iOS sigue pintando el hueco del rebote elástico (overscroll) con el navy
  // desactualizado — se nota sobre todo al cerrar sesión, cuando la página pasa de una pantalla alta
  // (con scroll) a una corta y el navegador muestra ese hueco brevemente antes de que el usuario
  // deslice y fuerce el repintado.
  const showingMainApp = !authLoading && !passwordRecovery && !!user && !privacyLoading && !needsReacceptance;
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", showingMainApp ? "#1e293b" : "#fafaf9");
  }, [showingMainApp]);

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
  // Mismo reset que handleSignOut: tras un borrado con éxito, App tampoco se desmonta (solo cambia qué
  // se renderiza según `user`, que pasa a null dentro de deleteAccount), así que sin esto la próxima
  // vez que alguien inicie sesión en esta pestaña del navegador aparecería en Ajustes.
  const handleDeleteAccount = async () => {
    const result = await deleteAccount();
    if (!result.error) {
      setTab("movimientos");
      setAjustesSection("categorias");
    }
    return result;
  };
  const [cursor, setCursor] = useState(() => new Date());
  const [showForm, setShowForm] = useState(false);
  const [formPreset, setFormPreset] = useState<FormPreset | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  // Fondo origen de una transferencia en curso (TransferFundsForm), o null si el formulario está
  // cerrado. Deliberadamente separado de showForm/formPreset: transferir no pasa por
  // NuevoMovimientoForm, tiene su propio formulario simple, solo accesible desde FondosTab.
  const [transferFund, setTransferFund] = useState<FundWithBalance | null>(null);
  const [showApplyPresets, setShowApplyPresets] = useState(false);
  const [showResolveOrphans, setShowResolveOrphans] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showPremiumScreen, setShowPremiumScreen] = useState(false);
  const onOpenPremiumScreen = () => setShowPremiumScreen(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };
  const [milestoneMsg, setMilestoneMsg] = useState<string | null>(null);

  // Detecta un Service Worker nuevo ya instalado y esperando (ver comentario de registerType: 'prompt'
  // en vite.config.ts): needRefresh pasa a true cuando hay una versión nueva disponible; el usuario
  // decide cuándo aplicarla desde el banner, en vez de que se aplique sola en segundo plano.
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | undefined>();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      setSwRegistration(registration);
    },
  });

  // Sin esto, una pestaña que se queda abierta mucho tiempo (el caso típico de una PWA/TWA, que casi
  // nadie cierra del todo) solo se entera de una versión nueva la próxima vez que recargue por su cuenta
  // — el navegador comprueba el SW en segundo plano, pero con una cadencia de horas, no minutos. Se
  // comprueba activamente cada 30 minutos Y cada vez que la pestaña vuelve a primer plano (típico en
  // móvil: cambiar de app y volver), que es cuando de verdad importa que se entere pronto.
  useEffect(() => {
    if (!swRegistration) return;
    const checkForUpdate = () => swRegistration.update();
    const intervalId = setInterval(checkForUpdate, 30 * 60 * 1000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [swRegistration]);

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
  // flowBalance, no balance: el saldo inicial que el usuario indique en un fondo no debe disparar este
  // aviso — solo cuenta lo aportado de verdad desde la app.
  // IMPORTANTE: no evaluar nada mientras savingsMilestoneLoading siga en curso. Antes de que esa
  // consulta responda, savingsMilestoneShown vale false por DEFECTO (no porque la fila diga que no se
  // ha mostrado todavía) — sin este guard, si funds/transactions ya habían cargado y sumaban ≥500€, el
  // aviso podía disparar con ese false provisional, y como el estado inicial siempre vuelve a false en
  // cada recarga, repetía el aviso cada vez en vez de solo la primera.
  useEffect(() => {
    if (isPremium || savingsMilestoneShown || !userId || savingsMilestoneLoading) return;
    const totalFondos = fundsWithBalance.reduce((s, f) => s + f.flowBalance, 0);
    if (totalFondos >= 500) {
      setMilestoneMsg("¡Ya llevas 500€ ahorrados! Con Premium puedes poner metas a cada fondo y ver tu progreso.");
      markSavingsMilestoneShown();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium, savingsMilestoneShown, userId, savingsMilestoneLoading, fundsWithBalance]);

  // Aviso premium al alcanzar la meta de un fondo. Vive aquí (no en FondosTab) porque App no se
  // desmonta al cambiar de pestaña: si esto estuviera en FondosTab, guardar la aportación desde
  // Movimientos y volver a Fondos remontaría el componente. Se basa en goal_notified (persistido en
  // Supabase, no en un ref en memoria).
  // IMPORTANTE: no evaluar nada mientras funds o transactions siguen cargando. fundsWithBalance se
  // recalcula en cuanto CUALQUIERA de los dos llega, así que si funds ya está pero transactions
  // todavía no, el saldo se ve momentáneamente en 0 (por debajo de la meta) — sin este guard, esa
  // lectura a medias resetea goal_notified a false, y al llegar transactions de verdad el saldo
  // "cruza" la meta otra vez y repite el aviso en cada recarga.
  useEffect(() => {
    if (!isPremium || fundsLoading || transactionsLoading) return;
    fundsWithBalance.forEach((f) => {
      if (f.goalAmount == null) return;
      const reached = f.balance >= f.goalAmount;
      if (reached && !f.goalNotified) {
        setMilestoneMsg(`¡Has alcanzado tu meta de ${fmt(f.goalAmount)} en ${f.name}!`);
        setFundGoalNotified(f.id, true);
      } else if (!reached && f.goalNotified) {
        // El saldo volvió a bajar de la meta (p. ej. un retiro): se resetea sin avisar, para poder
        // notificar de nuevo la próxima vez que se alcance.
        setFundGoalNotified(f.id, false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium, fundsLoading, transactionsLoading, fundsWithBalance]);

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
        // Empate (0) en vez de forzar -1 en fechas iguales: el comparador anterior nunca devolvía 0,
        // así que para dos movimientos del mismo día "a antes que b" y "b antes que a" eran ambos
        // ciertos a la vez (comparador inválido), desordenando el date desc, created_at desc que ya
        // trae la query de useTransactions. Con 0, el sort (estable) respeta ese orden para el empate.
        .sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1)),
    [transactions, selectedMonthKey],
  );

  const monthStats = useMemo(() => computeMonth(transactions, selectedMonthKey), [transactions, selectedMonthKey]);

  const getAhorroLibreDisponibleParaMes = (mKey: string) => ahorroLibreDisponibleParaMes(transactions, mKey);
  const getAhorroReal = (y: number, m: number) => computeMonth(transactions, `${y}-${String(m + 1).padStart(2, "0")}`).ahorroReal;

  const pending = useMemo(
    () => computePendingPresets({ monthTx, recurring, recurringIncome, investmentConfig, assets: isPremium ? assets : [] }),
    [monthTx, recurring, recurringIncome, investmentConfig, assets, isPremium],
  );

  // Cambiar de mes/año no debe mover el scroll: el usuario puede estar mirando algo a media pestaña
  // (p. ej. la lista de fondos) y esperar seguir viéndolo en la misma posición con los datos del nuevo
  // mes. Sin esto, el navegador puede recolocar el scroll si el contenido del mes/año nuevo tiene menos
  // altura que el anterior. Se guarda el scrollTop justo ANTES del cambio de estado (no después: para
  // entonces React ya habría podido repintar con el contenido nuevo y el valor capturado sería el del
  // mes nuevo, no el que había al pulsar el botón) y se reafirma en el useLayoutEffect de más abajo tras
  // el re-render, igual que el mecanismo de restauración de scroll al cambiar de pestaña.
  const preCursorChangeScrollRef = useRef<number | null>(null);
  const captureScrollBeforeCursorChange = () => {
    if (mainRef.current) preCursorChangeScrollRef.current = mainRef.current.scrollTop;
  };
  // startTransition: cursor alimenta monthTx/monthStats/yearData, que a su vez alimentan los gráficos
  // (Recharts) de TODAS las pestañas ya visitadas, no solo la activa — siguen montadas aunque estén
  // ocultas (ver visitedTabs más abajo), así que cambiar de mes vuelve a renderizarlas todas de golpe.
  // Sin startTransition ese render es una sola tanda sincrónica que bloquea el hilo principal, y el
  // navegador no puede procesar un segundo clic en "mes siguiente" hasta que termina. Marcándolo como
  // transición, React puede interrumpir ese render a medio hacer en cuanto llega un clic nuevo (evento
  // de prioridad más alta) y saltar directo al mes más reciente pedido, en vez de renderizar cada mes
  // intermedio de uno en uno.
  const changeMonth = (delta: number) => {
    captureScrollBeforeCursorChange();
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + delta);
    startTransition(() => setCursor(d));
  };
  const changeYear = (delta: number) => {
    captureScrollBeforeCursorChange();
    const d = new Date(cursor);
    d.setFullYear(d.getFullYear() + delta);
    startTransition(() => setCursor(d));
  };
  const goToMonthIndex = (m: number) => {
    captureScrollBeforeCursorChange();
    const d = new Date(cursor);
    d.setMonth(m);
    startTransition(() => setCursor(d));
  };
  useLayoutEffect(() => {
    const saved = preCursorChangeScrollRef.current;
    if (saved == null) return;
    preCursorChangeScrollRef.current = null;
    if (mainRef.current) mainRef.current.scrollTop = saved;
    const raf = requestAnimationFrame(() => {
      if (mainRef.current) mainRef.current.scrollTop = saved;
    });
    return () => cancelAnimationFrame(raf);
  }, [cursor]);

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
  const onQuickTransfer = (fund: FundWithBalance) => setTransferFund(fund);
  const onTransferFunds = async (destinoFundId: string, amount: number) => {
    if (!transferFund) return;
    const destinoFund = fundsWithBalance.find((f) => f.id === destinoFundId);
    await addTransaction({
      type: "transferencia",
      amount,
      // Mismo criterio que defaultDate de NuevoMovimientoForm (aportar/retiro): respeta el mes que se
      // está viendo en Fondos, no siempre "hoy" — si estás viendo marzo, la transferencia se registra
      // en marzo.
      date: selectedMonthKey === monthKey(todayISO()) ? todayISO() : `${selectedMonthKey}-01`,
      category: transferFund.name, // snapshot del fondo ORIGEN, mismo criterio que aportacion/retiro
      subcategory: null,
      note: "",
      fundId: transferFund.id,
      fundIdDestino: destinoFundId,
      fundIdDestinoName: destinoFund?.name ?? null,
    });
    setTransferFund(null);
  };

  // Si el fondo tiene saldo, primero se registra como un retiro para que el dinero vuelva al ahorro
  // libre del usuario y quede en el historial, y solo entonces se borra el fondo — si no, el saldo
  // simplemente desaparecería.
  const onDeleteFund = async (fund: FundWithBalance) => {
    // flowBalance, no balance: si el fondo tiene saldo inicial, esa parte nunca ha sido dinero que pasó
    // por el flujo de la app (no es una aportación, es lo que el usuario ya tenía ahorrado antes) — no
    // se devuelve como retiro, se pierde intencionadamente. Solo se devuelve al ahorro libre lo que de
    // verdad se aportó/generó a través de la app (ver aviso en el diálogo de confirmación, FondosTab.tsx).
    //
    // Fuga conocida y aceptada (ver también el comentario en fundsWithBalance, calculations.ts): si este
    // fondo recibió dinero por TRANSFERENCIA desde otro fondo que a su vez tenía saldo inicial, esa parte
    // ya cuenta aquí como flowBalance normal — se devolvería como retiro igual que cualquier otro euro
    // "de verdad aportado", aunque en su fondo de origen nunca se habría devuelto así. Caso marginal
    // (transferir + borrar el fondo receptor después) con impacto acotado a un único mes de "Libre en
    // curso"; no se resuelve por ahora.
    if (fund.flowBalance > 0) {
      await addTransaction({
        type: "retiro",
        amount: fund.flowBalance,
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
        const fundName = fundsWithBalance.find((f) => f.id === plan.fundId)?.name ?? null;
        await addTransaction({ ...base, amount: it.amount, fundedBy: plan.fundId, fundedByName: fundName });
      } else if (plan.fundAmount > 0) {
        const fundName = fundsWithBalance.find((f) => f.id === plan.fundId)?.name ?? null;
        await addTransaction({
          ...base,
          amount: it.amount,
          fundedBy: null,
          fundedByName: fundName,
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
    (showForm && !tourSteps[tourStep]?.formOpen) ||
    showApplyPresets ||
    showResolveOrphans ||
    showHelp ||
    showPrivacy ||
    showPremiumScreen;

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

  // Import dinámico: ExcelJS pesa ~930 KB (más que el resto del bundle de la app junta) y solo lo
  // necesita este botón, premium y enterrado en Ajustes — con un import estático arriba del archivo se
  // descargaba para cualquier visita, incluida la landing sin sesión. Así solo se pide de la red la
  // primera vez que alguien pulsa "Exportar Excel" de verdad.
  const onExportExcel = async () => {
    const { exportToExcel } = await import("./lib/exportExcel");
    await exportToExcel({ transactions, funds: fundsWithBalance, categories });
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
    return <LoadingScreen />;
  }

  // Antes que el "if (!user)": al abrir el enlace de recuperación, Supabase ya deja al usuario con una
  // sesión válida, así que sin comprobar esto primero se colaría directo a la app sin haber cambiado
  // la contraseña.
  if (passwordRecovery) {
    return (
      <ResetPasswordScreen
        onSubmit={updatePassword}
        onDone={() => {
          clearPasswordRecovery();
          showToast("Contraseña actualizada correctamente");
        }}
      />
    );
  }

  if (!user) {
    // Dentro del TWA, ir directo al login: es la propia app instalada, no un visitante del navegador.
    // Fuera del TWA (navegador web normal), la landing es la puerta de entrada hasta que el visitante
    // pulsa "Ya tengo cuenta" o vuelve a intentar el login (showLoginScreen no se resetea a propósito:
    // no tiene sentido devolver a la landing a alguien que ya pidió ver el login).
    if (!isRunningAsTWA() && !showLoginScreen) {
      return <LandingPage onLoginClick={() => setShowLoginScreen(true)} />;
    }
    return (
      <LoginScreen
        signInWithPassword={signInWithPassword}
        signUp={signUp}
        resetPasswordForEmail={resetPasswordForEmail}
        recordPrivacyAcceptance={recordPrivacyAcceptance}
      />
    );
  }

  // Se muestra encima de todo, antes de cargar cualquier pestaña: bloquea el uso de la app hasta que
  // se reacepte una política de privacidad actualizada (privacy_version desactualizado o nulo).
  if (privacyLoading) {
    return <LoadingScreen />;
  }
  if (needsReacceptance) {
    return <PrivacyReacceptanceModal onAccept={() => recordPrivacyAcceptance(userId!)} />;
  }

  return (
    // Suspense: los 5 tabs y los modales/tour de más abajo son todos React.lazy (ver el porqué arriba,
    // junto a esos const). El fallback solo se ve una vez, la primera vez que alguien inicia sesión en
    // esta pestaña — a partir de ahí los chunks ya están en caché del navegador.
    <Suspense fallback={<LoadingScreen />}>
      {/* h-dvh (no min-h-screen): min-h-screen es solo un SUELO, no un techo — con contenido más alto
          que la pantalla, este contenedor flex crecía más allá del viewport y "arrastraba" a <main> con
          él, así que overflow-y-auto de <main> nunca llegaba a activarse de verdad: quien hacía scroll
          era la ventana/documento entero, no <main>. Todo el scroll interno (restaurar posición al
          cambiar de pestaña, preservarlo al cambiar de mes/año, y el header sticky) depende de que
          <main> sea el contenedor que de verdad hace scroll — con h-dvh, la altura queda fija a la
          pantalla y flex-1 + overflow-y-auto en <main> sí generan una región de scroll interna real. */}
      <div className="h-dvh bg-stone-50 text-slate-800 flex flex-col font-sans">
      <header
        className="bg-slate-800 text-stone-50 px-5 pb-4 flex items-start justify-between"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" }}
      >
        <div>
          <h1 className="font-serif text-xl tracking-tight">Nitid</h1>
          <p className="text-stone-300 text-sm mt-0.5">Registro, fondos y resúmenes</p>
        </div>
        <button onClick={() => setShowHelp(true)} className="text-stone-300 hover:text-white mt-0.5">
          <HelpCircle size={20} />
        </button>
      </header>

      {/* Sin pt-4 aquí: position:sticky con top:0 "clampa" contra el padding-box del contenedor con
          scroll y anula cualquier margen negativo que un hijo intente usar para colarse en él, así que
          un padding-top del propio <main> siempre deja un hueco por encima del selector sticky de mes/
          año que ninguna de las 4 pestañas con selector puede cubrir. En vez de eso, ese hueco lo pone
          cada pestaña por su cuenta: MonthSwitcher/AnualTab lo llevan como su propio pt-4 (pintado con
          su propio fondo, así se queda fijo con ellos), y AjustesTab (la única sin selector) lo lleva en
          su primer elemento para no perder el espaciado que antes venía gratis de aquí. */}
      <main ref={mainRef} className="flex-1 overflow-y-auto px-4 pb-24 max-w-md w-full mx-auto">
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
            updateFundInitialBalance={updateFundInitialBalance}
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
            onQuickTransfer={onQuickTransfer}
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
            onShowPrivacy={() => setShowPrivacy(true)}
            onDeleteAccount={handleDeleteAccount}
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
            // Sin este try/catch, un error al guardar (p. ej. de red o de la base de datos) dejaba el
            // formulario abierto sin ningún aviso: el usuario veía el botón "sin reaccionar" porque
            // setShowForm(false) nunca se llegaba a ejecutar.
            try {
              if (editingTx) {
                await editTransaction(editingTx.id, tx);
                showToast("Movimiento actualizado");
              } else {
                await addTransaction(tx);
                showToast("Movimiento guardado");
              }
              setShowForm(false);
              setEditingTx(null);
            } catch (e) {
              showToast(e instanceof Error ? e.message : "No se pudo guardar el movimiento.");
            }
          }}
        />
      )}
      {transferFund && (
        <TransferFundsForm
          isPremium={isPremium}
          fund={transferFund}
          funds={fundsWithBalance}
          onClose={() => setTransferFund(null)}
          onTransfer={async (destinoFundId, amount) => {
            try {
              await onTransferFunds(destinoFundId, amount);
              showToast("Transferencia guardada");
            } catch (e) {
              showToast(e instanceof Error ? e.message : "No se pudo guardar la transferencia.");
            }
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
      {showPrivacy && <PrivacyPolicyModal onClose={() => setShowPrivacy(false)} />}

      {showPremiumScreen && (
        <PremiumScreen
          isPremium={isPremium}
          userId={userId}
          userEmail={user?.email ?? undefined}
          onClose={() => setShowPremiumScreen(false)}
          onCheckoutSuccess={() => {
            showToast("¡Pago completado! Activando Premium...");
            // El webhook que activa "subscriptions" en Supabase llega por separado y puede tardar
            // unos segundos; un solo refetch no basta si aún no ha procesado, así que se reintenta
            // una vez más a los pocos segundos.
            refetchSubscription();
            setTimeout(refetchSubscription, 4000);
          }}
          onReturnFromExternalCheckout={() => {
            // TWA: no sabemos si pagó de verdad, solo que volvió a la app tras abrir el navegador
            // externo — sin toast de "completado" (sería presuponer). Si el webhook ya activó Premium
            // mientras tanto, isPremium se actualiza solo y la interfaz se pone al día en cuanto
            // refetchSubscription resuelva, sin que el usuario tenga que cerrar y reabrir la app.
            refetchSubscription();
            setTimeout(refetchSubscription, 4000);
          }}
        />
      )}

      <nav
        // position: fixed (no sticky) anclado con el hueco de useKeyboardInset: con sticky, al abrir el
        // teclado el layout viewport/100dvh no siempre se actualiza en el mismo frame y la barra se
        // queda mal colocada hasta el próximo scroll (ver comentario en useKeyboardInset.ts). Fixed +
        // visualViewport la mantiene pegada a lo que sea visible de verdad en todo momento.
        className="fixed left-0 right-0 bottom-0 bg-white border-t border-stone-200 flex justify-around pt-2 max-w-md w-full mx-auto"
        style={{
          bottom: keyboardInset,
          paddingBottom: keyboardInset > 0 ? "0.5rem" : "calc(env(safe-area-inset-bottom) + 0.5rem)",
        }}
      >
        <NavButton icon={<Wallet size={18} />} label="Movim." active={tab === "movimientos"} onClick={() => setTab("movimientos")} tourId="nav-movimientos" />
        <NavButton icon={<PiggyBank size={18} />} label="Fondos" active={tab === "fondos"} onClick={() => setTab("fondos")} tourId="nav-fondos" />
        <NavButton icon={<ArrowUpCircle size={18} />} label="Mensual" active={tab === "mensual"} onClick={() => setTab("mensual")} tourId="nav-mensual" />
        <NavButton icon={<ArrowDownCircle size={18} />} label="Anual" active={tab === "anual"} onClick={() => setTab("anual")} tourId="nav-anual" />
        <NavButton icon={<Settings2 size={18} />} label="Ajustes" active={tab === "ajustes"} onClick={() => setTab("ajustes")} tourId="nav-ajustes" />
      </nav>
      <Toast message={toastMsg} />
      <MilestoneNotice message={milestoneMsg} onClose={() => setMilestoneMsg(null)} />
      {needRefresh && <UpdateBanner onUpdate={() => updateServiceWorker()} onDismiss={() => setNeedRefresh(false)} />}
      </div>
    </Suspense>
  );
}

export default App;
