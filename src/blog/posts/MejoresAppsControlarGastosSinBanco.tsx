import { PenLine, Users, Layers, Zap, Check } from "lucide-react";
import { AppComparisonTable } from "../components/AppComparisonTable";
import { AppReviewCard } from "../components/AppReviewCard";
import { ChooseList } from "../components/ChooseList";
import { CardDivider } from "../components/CardDivider";
import { ArticleBanner } from "../components/ArticleBanner";
import { GooglePlayBadge } from "../../components/GooglePlayBadge";
import { SectionTitleAccent } from "../../components/SectionTitleAccent";

const COMPARISON_APPS = ["Nitid", "Monefy", "Goodbudget", "Money Manager", "1Money"];

const COMPARISON_ROWS = [
  { label: "Entrada manual", values: ["yes", "yes", "yes", "yes", "yes"] },
  { label: "Sin conexión bancaria", values: ["yes", "yes", "yes", "yes", "yes"] },
  { label: "Fondos de ahorro con metas", values: ["yes", "no", "Sobres", "no", "no"] },
  { label: "Seguimiento de inversión", values: ["yes", "no", "no", "no", "no"] },
  { label: "Análisis anual", values: ["yes", "no", "no", "Básico", "no"] },
  { label: "Insights automáticos", values: ["yes", "no", "no", "no", "no"] },
  { label: "Sin anuncios (plan gratis)", values: ["yes", "no", "no", "no", "no"] },
  { label: "Precio Premium", values: ["29,99€/año", "~60€/año", "~80€/año", "~30€/año", "~30€/año"], emphasis: true },
  { label: "Idioma español", values: ["yes", "yes", "Parcial", "yes", "yes"] },
];

const NITID_FREE_ITEMS = [
  "Transacciones ilimitadas",
  "2 fondos de ahorro",
  "Gráficos mensuales con composición de gastos",
  "Resumen anual",
  "Categorías personalizables (6 fijas + 6 variables)",
  "Exportación de datos",
  "Sin publicidad",
];

const NITID_PREMIUM_ITEMS = [
  "Fondos de ahorro ilimitados con metas",
  "Inversión desglosada por activos",
  "Análisis anual completo con comparativa entre años",
  "Insights automáticos",
  "Categorías y subcategorías ilimitadas",
  "Presupuestos por categoría",
  "Historial completo",
  "Exportación a Excel",
];

function CheckItemList({ items, tone }: { items: string[]; tone: "emerald" | "teal" }) {
  const iconColor = tone === "emerald" ? "text-emerald-600" : "text-teal-600";
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-2">
          <Check size={13} className={`${iconColor} shrink-0`} strokeWidth={3} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const CHOOSE_ITEMS = [
  { icon: PenLine, label: "Si solo quieres apuntar gastos", text: "Monefy o 1Money se centran en eso." },
  { icon: Users, label: "Si necesitas gastos compartidos con otra persona", text: "Goodbudget con su sistema de sobres." },
  {
    icon: Layers,
    label: "Si quieres control de gastos + ahorro con metas + inversión, todo junto",
    text: "Nitid es la única que combina las tres cosas sin pedir acceso a tu banco.",
    highlighted: true,
  },
  { icon: Zap, label: "Si quieres algo básico y no te importan los anuncios", text: "Money Manager funciona." },
];

export function MejoresAppsControlarGastosSinBanco() {
  return (
    <article>
      <ArticleBanner
        title="Las 5 mejores apps para controlar gastos sin conectar tu banco (2026)"
        subtitle="Comparativa de las mejores apps de control de gastos con entrada manual, sin dar acceso a tu banco."
        date="4 de agosto de 2026"
      />

      <p className="py-8 text-center text-xl sm:text-2xl text-stone-700 font-medium italic">
        ¿Se puede tener el control de tus finanzas sin renunciar a tu privacidad?
      </p>

      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm">
        <div className="flex flex-col gap-4 text-stone-600 leading-relaxed">
          <p>
            Quieres saber en qué se va tu dinero cada mes, pero no te apetece darle las contraseñas de tu banco a una app. Es normal. Cada vez más
            personas prefieren registrar sus gastos de forma manual: sin conexiones bancarias, sin compartir datos sensibles, y con la
            tranquilidad de que nadie más tiene acceso a su información financiera.
          </p>
          <p>
            El registro manual tiene una ventaja que las apps automáticas no pueden ofrecer: te obliga a ser consciente de cada gasto. No es un
            "instalar y olvidar", es un hábito que te hace pensar dos veces antes de gastar. Y eso, a la larga, es lo que realmente cambia tu
            relación con el dinero.
          </p>
        </div>

        <p className="my-6 pl-4 border-l-4 border-teal-400 text-lg text-teal-700 font-medium leading-snug">
          Te obliga a ser consciente de cada gasto.
        </p>

        <p className="text-stone-600 leading-relaxed">
          Hemos analizado las apps de control de gastos más populares que funcionan sin conectar tu banco. Estas son las 5 que merece la pena
          probar en 2026.
        </p>
      </div>

      <div className="mt-10 text-center">
        <h2 className="text-2xl font-bold text-stone-900">Comparativa rápida</h2>
        <SectionTitleAccent />
      </div>
      <AppComparisonTable apps={COMPARISON_APPS} rows={COMPARISON_ROWS} highlightLogo="/icon-512.png" />

      <div className="mt-8">
        <AppReviewCard
          number={1}
          name="Nitid — Control de gastos, ahorro e inversión en una sola app"
          isOurApp
          intro={
            <>
              <p className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">
                <strong>Transparencia:</strong> Nitid es nuestra app. La incluimos primera porque está diseñada exactamente para lo que busca este
                artículo: controlar gastos sin dar acceso a tu banco. Aun así, la comparativa es honesta y cada app tiene su espacio.
              </p>
              <p>
                Nitid combina tres cosas que la mayoría de apps ofrecen por separado: control de gastos e ingresos, fondos de ahorro con metas, y
                seguimiento de inversión por activos. Todo con entrada manual y sin pedirte datos bancarios.
              </p>
            </>
          }
          highlights={
            <>
              <p>
                La versión gratuita ya es funcional de verdad: registra tus gastos sin límite y descubre en qué se te va el dinero con gráficos
                claros. Crea fondos de ahorro para lo que te importa (vacaciones, fondo de emergencia, un capricho), consulta tu resumen anual
                para saber si vas mejor o peor que el año pasado, y exporta tus datos cuando quieras. Sin publicidad y sin límite de tiempo.
              </p>
              <p>
                El análisis mensual te muestra en qué categorías gastas más con un gráfico de composición, y los insights automáticos te avisan
                cuando algo cambia en tus hábitos de gasto, para que tomes decisiones a tiempo y no te lleves sorpresas a fin de mes.
              </p>
              <p>
                La gestión de inversión es algo que casi ninguna app de esta categoría ofrece. Puedes definir tus activos, asignar porcentajes de
                reparto, y ver si tu distribución real coincide con la que quieres. No es un broker, no mueve dinero, pero te da la foto completa
                de dónde está tu dinero.
              </p>
            </>
          }
          drawbacks={
            <p>
              No se conecta al banco (que es el punto de esta comparativa, pero si alguien busca automatización, Nitid no es la opción). No tiene
              versión de escritorio, es mobile-first.
            </p>
          }
          priceFree={<CheckItemList items={NITID_FREE_ITEMS} tone="emerald" />}
          pricePremium={
            <>
              <p className="font-semibold text-teal-900">29,99€/año — 2,50€/mes</p>
              <p className="mt-1.5 mb-1.5 text-stone-400 italic">Todo lo del plan gratuito, más:</p>
              <CheckItemList items={NITID_PREMIUM_ITEMS} tone="teal" />
            </>
          }
          idealFor="Para quien quiere controlar gastos, ahorrar con objetivos concretos y además llevar un seguimiento de su inversión, todo en una sola app y sin dar datos bancarios."
        />
      </div>

      <CardDivider />

      <AppReviewCard
        number={2}
        name="Monefy — Registro de gastos con gráfico circular"
        highlights={
          <p>
            La interfaz está diseñada para hacer una sola cosa: registrar gastos rápido. Si lo único que necesitas es apuntar gastos y ver cómo se
            distribuyen, Monefy se centra en eso sin distracciones.
          </p>
        }
        drawbacks={
          <p>
            La versión gratuita tiene anuncios, lo que rompe bastante la experiencia en una app que abres varias veces al día. No tiene fondos de
            ahorro, ni metas, ni seguimiento de inversión, ni análisis anual, ni insights automáticos. Es una app de registro puro: apuntas gastos
            y ves el donut. Si necesitas profundidad o gestionar tu ahorro, se queda corta.
          </p>
        }
        priceFree="con anuncios"
        pricePremium="~60€/año (pago único de por vida en algunas versiones, pero varía)"
        idealFor="Para quien solo necesita apuntar gastos y ver un gráfico, sin más complicaciones."
      />

      <CardDivider />

      <AppReviewCard
        number={3}
        name="Goodbudget — El método de los sobres, digitalizado"
        highlights={
          <p>
            Permite sincronizar los sobres entre varias personas, lo que lo hace útil para gastos compartidos con pareja, familia o compañeros de
            piso. Si gestionas gastos con alguien más, es una funcionalidad que otras apps de esta lista no tienen.
          </p>
        }
        drawbacks={
          <p>
            No tiene seguimiento de inversión ni análisis anual con gráficos detallados. La versión gratuita está limitada a 1 cuenta y 10 sobres,
            lo que puede quedarse corto rápidamente. El precio premium es alto para lo que ofrece. Y el soporte del idioma español es parcial.
          </p>
        }
        priceFree="1 cuenta, 10 sobres"
        pricePremium="Plus: ~80€/año. Cuentas y sobres ilimitados, sincronización entre 5 dispositivos"
        idealFor="Para quien necesita gestionar gastos compartidos con otra persona y le funciona el enfoque de límites estrictos por categoría."
      />

      <CardDivider />

      <AppReviewCard
        number={4}
        name="Money Manager — Registro básico con más de 10 millones de descargas"
        highlights={
          <p>
            Es gratuita con funcionalidades que cubren lo esencial del registro de gastos. Permite exportar a CSV para quien quiera revisar datos
            fuera de la app.
          </p>
        }
        drawbacks={
          <>
            <p>
              La versión gratuita tiene anuncios que aparecen con frecuencia. No tiene insights automáticos, ni análisis anual con comparativa
              entre años, ni fondos de ahorro con metas, ni seguimiento de inversión.
            </p>
            <p>
              Algunos usuarios reportan bugs como ingresos que aparecen sin haberlos introducido, o dificultad para encontrar totales acumulados.
              Con 10 millones de descargas, la app ha crecido mucho pero el desarrollo no siempre ha seguido el ritmo.
            </p>
          </>
        }
        priceFree="con anuncios"
        pricePremium="~30€/año"
        idealFor="Para quien busca algo funcional y básico para registrar gastos, y no le molestan los anuncios."
      />

      <CardDivider />

      <AppReviewCard
        number={5}
        name="1Money — Diseño cuidado y categorías visuales"
        highlights={
          <p>
            La interfaz es visualmente atractiva y la navegación entre meses es fluida. Si valoras el diseño en las apps que usas a diario, 1Money
            cuida ese aspecto.
          </p>
        }
        drawbacks={
          <p>
            No tiene fondos de ahorro con metas, ni seguimiento de inversión, ni análisis anual profundo, ni insights automáticos. Es una app de
            registro y visualización de gastos, sin las capas de ahorro e inversión que ofrecen otras opciones.
          </p>
        }
        priceFree="funciones básicas completas"
        pricePremium="~30€/año"
        idealFor="Para quien valora una interfaz visual cuidada y solo necesita registrar gastos sin funciones avanzadas de ahorro o inversión."
      />

      <div className="mt-10 text-center">
        <h2 className="text-2xl font-bold text-stone-900">Entonces, ¿cuál elegir?</h2>
        <SectionTitleAccent />
      </div>
      <p className="text-sm text-stone-600 text-center">Depende de lo que necesites:</p>
      <ChooseList items={CHOOSE_ITEMS} />
      <p className="mt-6 text-sm text-stone-600 leading-relaxed text-center">
        Todas son opciones válidas. La mejor es la que se adapta a cómo quieres gestionar tu dinero.
      </p>
      <p className="mt-2 text-lg text-stone-400 italic text-center">Lo importante es empezar.</p>

      <div className="my-8 flex justify-center">
        <GooglePlayBadge />
      </div>
    </article>
  );
}
