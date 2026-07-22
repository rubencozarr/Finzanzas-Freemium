export type TourPlacement = "top" | "bottom" | "left" | "right" | "center";

export interface TourStep {
  /** Selector CSS del elemento real a señalar, o null para un paso centrado sin señalar nada. */
  target: string | null;
  placement: TourPlacement;
  text: string;
  /** Se ejecuta al entrar en el paso (yendo hacia delante o hacia atrás), para fijar el estado que
   * ese paso necesita (p. ej. cambiar de pestaña, abrir/cerrar el formulario de movimiento). */
  onEnter?: () => void;
  /** Este paso señala algo dentro del formulario de nuevo movimiento: no hay que pausar el tour
   * mientras esté abierto. */
  formOpen?: boolean;
}

interface TourActions {
  ensureAjustes: () => void;
  ensureAjustesIngresos: () => void;
  ensureAjustesRecurrentes: () => void;
  ensureAjustesInversion: () => void;
  ensureMovimientos: () => void;
  ensureMovementForm: () => void;
  closeMovementForm: () => void;
  ensureFondos: () => void;
  ensureMensual: () => void;
  ensureAnual: () => void;
}

/**
 * Recorrido guiado sobre elementos reales de la app (marcados con data-tour="..."). Puramente
 * explicativo: cada paso se avanza con "Siguiente"/"Anterior", sin esperar a que el usuario realice
 * ninguna acción real. Cada onEnter fija el estado completo que ese paso necesita, para que funcione
 * igual de bien navegando hacia delante que hacia atrás.
 */
export function buildTourSteps(actions: TourActions, isPremium: boolean): TourStep[] {
  return [
    {
      target: null,
      placement: "center",
      text: "Bienvenido a Klaro. Aquí podrás controlar tus gastos, ahorrar con objetivos e invertir, todo desde tu móvil y sin dar acceso a tu banco.",
    },
    {
      target: '[data-tour="nav-ajustes"]',
      placement: "top",
      text: "Primero vamos a configurar lo básico para que luego registrar tus movimientos sea mucho más rápido.",
      onEnter: actions.ensureAjustes,
    },
    {
      target: '[data-tour="recurring-income-form"]',
      placement: "top",
      text: "Añade aquí tus ingresos fijos, como tu sueldo. Así cada mes podrás aplicarlos con un solo toque.",
      onEnter: actions.ensureAjustesIngresos,
    },
    {
      target: '[data-tour="recurring-form"]',
      placement: "top",
      text: "Ahora tus gastos fijos: alquiler, luz, internet, seguros... Configúralos una vez y olvídate de registrarlos uno a uno cada mes.",
      onEnter: actions.ensureAjustesRecurrentes,
    },
    {
      target: '[data-tour="ajustes-inversion-section"]',
      placement: "top",
      text: isPremium
        ? "Aquí configuras tu inversión: qué porcentaje de tus ingresos invertir y en qué activos repartirlo."
        : "Aquí puedes configurar tu inversión: qué porcentaje de tus ingresos invertir y en qué activos repartirlo. Esta función está disponible con Premium.",
      onEnter: actions.ensureAjustesInversion,
    },
    {
      target: '[data-tour="nav-movimientos"]',
      placement: "top",
      text: "Vamos a Movimientos. Desde aquí controlas todo tu dinero.",
      onEnter: actions.ensureMovimientos,
    },
    {
      target: '[data-tour="new-movement-btn"]',
      placement: "top",
      text: "Desde este botón registras todo: ingresos, gastos, aportaciones a fondos, retiros e inversiones.",
      onEnter: () => {
        actions.ensureMovimientos();
        actions.closeMovementForm();
      },
    },
    {
      target: '[data-tour="type-basic"]',
      placement: "bottom",
      text: "Con Ingreso y Gasto registras tus movimientos del día a día. Cada uno se refleja automáticamente en tu resumen del mes.",
      onEnter: () => {
        actions.ensureMovimientos();
        actions.ensureMovementForm();
      },
      formOpen: true,
    },
    {
      target: '[data-tour="type-funds"]',
      placement: "bottom",
      text: "También puedes aportar dinero a tus fondos de ahorro, retirarlo cuando lo necesites, o registrar una inversión.",
      onEnter: () => {
        actions.ensureMovimientos();
        actions.ensureMovementForm();
      },
      formOpen: true,
    },
    {
      target: '[data-tour="apply-presets-btn"]',
      placement: "bottom",
      text: "¿Recuerdas los ingresos y gastos fijos que configuraste? Con este botón los aplicas todos de golpe. Un toque y tu mes queda registrado.",
      onEnter: () => {
        actions.ensureMovimientos();
        actions.closeMovementForm();
      },
    },
    {
      target: '[data-tour="movimientos-statcards"]',
      placement: "bottom",
      text: "Estas tarjetas te muestran cuánto has ingresado, cuánto has gastado y cuánto te queda libre este mes. Se actualizan con cada movimiento.",
      onEnter: () => {
        actions.ensureMovimientos();
        actions.closeMovementForm();
      },
    },
    {
      target: '[data-tour="nav-fondos"]',
      placement: "top",
      text: isPremium
        ? "Crea fondos para organizar tu ahorro por objetivos: vacaciones, emergencias, un coche... Crea todos los fondos que necesites y ponles metas de ahorro para ver tu progreso."
        : "Crea fondos para organizar tu ahorro por objetivos: vacaciones, emergencias, un coche... Puedes crear hasta 2 fondos. Con Premium puedes crear fondos ilimitados y ponerles metas de ahorro.",
      onEnter: actions.ensureFondos,
    },
    {
      target: '[data-tour="nav-mensual"]',
      placement: "top",
      text: "Aquí ves el desglose completo de tu mes: en qué has gastado más, cómo se reparte entre gastos fijos y variables, y tu ahorro.",
      onEnter: actions.ensureMensual,
    },
    {
      target: '[data-tour="nav-anual"]',
      placement: "top",
      text: "Y aquí la foto del año: totales de ingresos, gastos, ahorro e inversión.",
      onEnter: actions.ensureAnual,
    },
    {
      target: null,
      placement: "center",
      text: "¡Listo! Empieza registrando tu primer movimiento. Cuantos más datos registres, más útil será la app para ti.",
      onEnter: actions.ensureMovimientos,
    },
  ];
}
