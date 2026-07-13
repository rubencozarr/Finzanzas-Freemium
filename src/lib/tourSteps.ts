export type TourPlacement = "top" | "bottom" | "left" | "right" | "center";

export interface TourStep {
  /** Selector CSS del elemento real a señalar, o null para un paso centrado sin señalar nada. */
  target: string | null;
  placement: TourPlacement;
  text: string;
  /** Se ejecuta al entrar en el paso, para garantizar que su elemento objetivo exista (p. ej. cambiar de pestaña). */
  onEnter?: () => void;
  /** Este paso señala algo dentro del formulario de nuevo movimiento: no hay que pausar el tour mientras esté abierto. */
  formOpen?: boolean;
}

interface TourActions {
  ensureAjustes: () => void;
  ensureAjustesIngresos: () => void;
  ensureAjustesRecurrentes: () => void;
  ensureMovimientos: () => void;
  ensureMovementForm: () => void;
  closeMovementForm: () => void;
}

/**
 * Recorrido guiado sobre elementos reales de la app (marcados con data-tour="...").
 * Cada paso avanza cuando el usuario pulsa "Siguiente" o interactúa de verdad con el elemento
 * señalado (ver la lógica de auto-avance en App.tsx).
 */
export function buildTourSteps(actions: TourActions): TourStep[] {
  return [
    {
      target: '[data-tour="nav-ajustes"]',
      placement: "top",
      text: "Primero vamos a configurar lo básico. Toca aquí para ir a Ajustes.",
    },
    {
      target: '[data-tour="ajustes-ingresos-btn"]',
      placement: "bottom",
      text: "Aquí puedes añadir tus ingresos recurrentes, como tu nómina. Toca para entrar.",
      onEnter: actions.ensureAjustes,
    },
    {
      target: '[data-tour="recurring-income-form"]',
      placement: "top",
      text: "Pon tu ingreso principal (nombre, importe, día del mes en que lo cobras) y dale a añadir.",
      onEnter: actions.ensureAjustesIngresos,
    },
    {
      target: '[data-tour="ajustes-recurrentes-btn"]',
      placement: "bottom",
      text: "Ahora configura los gastos que pagas todos los meses (alquiler, internet...). Toca para entrar.",
      onEnter: actions.ensureAjustes,
    },
    {
      target: '[data-tour="recurring-form"]',
      placement: "top",
      text: "Añade tus gastos fijos con su importe habitual.",
      onEnter: actions.ensureAjustesRecurrentes,
    },
    {
      target: '[data-tour="nav-movimientos"]',
      placement: "top",
      text: "Perfecto. Ahora ve a Movimientos, que es donde vas a registrar tu día a día.",
    },
    {
      target: '[data-tour="apply-presets-btn"]',
      placement: "bottom",
      text: "Cada mes, pulsa aquí para aplicar de golpe la nómina y gastos fijos que acabas de configurar.",
      onEnter: actions.ensureMovimientos,
    },
    {
      target: '[data-tour="new-movement-btn"]',
      placement: "top",
      text: "Y con este botón vas añadiendo los gastos e ingresos del día a día.",
      onEnter: actions.ensureMovimientos,
    },
    {
      target: '[data-tour="type-basic"]',
      placement: "bottom",
      text: "Los dos que más usarás. Ingreso es dinero que entra (nómina, extras). Gasto es dinero que sale (compras, ocio, facturas).",
      onEnter: actions.ensureMovementForm,
      formOpen: true,
    },
    {
      target: '[data-tour="type-funds"]',
      placement: "bottom",
      text: "Estos tres son para cuando uses fondos de ahorro o inversión. No te preocupes por ellos ahora — cuando los necesites, los encontrarás aquí.",
      onEnter: actions.ensureMovementForm,
      formOpen: true,
    },
    {
      target: '[data-tour="nav-mensual"]',
      placement: "top",
      text: "Aquí ves el resumen de cómo te ha ido el mes: ingresos, gastos, ahorro.",
      onEnter: actions.closeMovementForm,
    },
    {
      target: '[data-tour="nav-fondos"]',
      placement: "top",
      text: "Y aquí ves tu patrimonio total, tus fondos de ahorro y tu inversión.",
    },
    {
      target: null,
      placement: "center",
      text: "¡Listo! Ya puedes empezar. Si tienes dudas, pulsa el icono ? de arriba. ¡A gestionar tu dinero!",
    },
  ];
}
