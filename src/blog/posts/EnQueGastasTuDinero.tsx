import { Lightbulb, Clock, Calculator, TrendingUp, Check } from "lucide-react";
import { ArticleBanner } from "../components/ArticleBanner";
import { StepCard } from "../components/StepCard";
import { Callout } from "../components/Callout";
import { PullQuote } from "../components/PullQuote";
import { DeviceFrame } from "../components/DeviceFrame";
import { SectionTitleAccent } from "../../components/SectionTitleAccent";
import { GooglePlayBadge } from "../../components/GooglePlayBadge";

const CATEGORIES = [
  { emoji: "🛒", name: "Alimentación", description: "supermercado + comer fuera" },
  { emoji: "🚗", name: "Transporte", description: "gasolina, parking, transporte público" },
  { emoji: "🎬", name: "Ocio", description: "salir, cine, planes, hobbies" },
  { emoji: "👕", name: "Ropa y compras", description: "" },
  { emoji: "💊", name: "Salud", description: "farmacia, médico" },
  { emoji: "📦", name: "Otros", description: "todo lo que no encaje arriba" },
];

const APP_STEPS = [
  "Configuras tus categorías fijas y variables una vez y listo.",
  "Registras cada gasto en 3 toques en vez de escribir en una nota.",
  "Los totales por categoría se calculan solos con gráficos visuales.",
  "La tasa de ahorro se calcula automáticamente cada mes.",
  "Puedes poner presupuestos por categoría y crear fondos de ahorro con metas que muestran tu progreso.",
];

export function EnQueGastasTuDinero() {
  return (
    <article>
      <ArticleBanner
        title="Cómo saber en qué gastas tu dinero cada mes"
        subtitle="Un método práctico que puedes empezar hoy, sin hojas de cálculo y sin dar acceso a tu banco."
        date="4 de agosto de 2026"
      />

      <p className="py-8 text-center text-xl sm:text-2xl text-stone-700 font-medium italic">
        Llegas a fin de mes, miras tu cuenta, y no entiendes cómo has gastado tanto. ¿Te suena?
      </p>

      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm">
        <div className="flex flex-col gap-4 text-stone-600 leading-relaxed">
          <p>
            No eres el único. La mayoría de personas no saben en qué se les va el dinero, y no es por falta de inteligencia ni de intención. Es
            porque nadie nos enseña a hacerlo.
          </p>
          <p>
            La buena noticia: descubrirlo es más fácil de lo que parece. No necesitas hojas de cálculo, ni conectar tu banco a una app, ni
            dedicarle horas. Con este método en 5 pasos puedes pasar de "no sé adónde va mi dinero" a "sé exactamente en qué gasto" en menos de un
            mes.
          </p>
        </div>
        <PullQuote>"El problema no es que gastes mucho. Es que no sabes en qué gastas."</PullQuote>
      </div>

      <div className="mt-8 flex flex-col gap-8">
        <StepCard number={1} title="Separa tus gastos fijos de los variables">
          <p>
            Antes de registrar nada, necesitas entender que hay dos tipos de gastos completamente diferentes, y que controlarlos funciona de
            forma distinta.
          </p>
          <p>
            <strong className="text-stone-800">Gastos fijos</strong> son los que pagas cada mes y que no cambian (o cambian poco): alquiler,
            hipoteca, luz, agua, internet, seguros, suscripciones, cuota del gimnasio. Los pagas sí o sí, y son bastante predecibles.
          </p>
          <p>
            <strong className="text-stone-800">Gastos variables</strong> son los que dependen de tus decisiones día a día: supermercado, comer
            fuera, transporte, ropa, ocio, regalos. Aquí es donde realmente se te escapa el dinero sin darte cuenta, y donde tienes más capacidad
            de actuar.
          </p>
          <Callout tone="amber" icon={Lightbulb}>
            <p>
              <strong>¿Por qué importa esta distinción?</strong> Porque los gastos fijos los configuras una vez y los olvidas. Los variables son
              los que necesitas vigilar cada semana. Si intentas controlar todo junto, te abrumas y abandonas.
            </p>
            <p>
              <strong>Hazlo ahora:</strong> Haz una lista mental (o escríbela) de tus gastos fijos mensuales. Seguro que son entre 5 y 10
              conceptos. El resto, todo lo que pagas día a día, son tus gastos variables. Esos son los que vamos a rastrear.
            </p>
          </Callout>
        </StepCard>

        <StepCard number={2} title="Registra cada gasto variable durante un mes">
          <p>Este es el paso que marca la diferencia. Y es más sencillo de lo que parece.</p>
          <p>
            Cada vez que gastes dinero en algo que no sea un gasto fijo, apúntalo. No importa el método: una nota en el móvil, un mensaje de
            WhatsApp a ti mismo, o una app. Lo que importa es que lo hagas en el momento, no al final del día, porque al final del día ya se te ha
            olvidado el café, el parking y la compra pequeña del supermercado.
          </p>
          <Callout tone="teal" icon={Clock}>
            <p>
              <strong>¿Cuánto tiempo lleva?</strong> Menos de lo que piensas. Registrar un gasto tarda 5 segundos. Si gastas en 6-8 cosas al día,
              estamos hablando de menos de un minuto al día. Lo que cuesta enviar un WhatsApp.
            </p>
          </Callout>
          <p>
            El primer mes es el más importante. No intentes cambiar nada todavía. Solo registra. El objetivo no es gastar menos, es saber en qué
            gastas. La conciencia viene primero, las decisiones después.
          </p>
          <div>
            <p className="font-semibold text-stone-800">Dos errores comunes que debes evitar:</p>
            <ul className="mt-2 flex flex-col gap-2 list-disc pl-5">
              <li>
                <strong className="text-stone-800">No redondear.</strong> Si el café ha costado 1,80€, pon 1,80€, no 2€. Los redondeos se acumulan
                y al final del mes los números no cuadran, lo que te hace perder confianza en el sistema.
              </li>
              <li>
                <strong className="text-stone-800">No dejar los gastos pequeños fuera.</strong> El chicle de 1€, el parking de 2€, la botella de
                agua de 0,80€. Son precisamente los gastos pequeños e invisibles los que más se acumulan. Si un café diario de 1,80€ parece
                insignificante, multiplícalo por 30: son 54€ al mes y 648€ al año.
              </li>
            </ul>
          </div>
        </StepCard>

        <StepCard number={3} title="Agrupa por categorías y mira los totales">
          <p>
            Después de un mes registrando, toca mirar los datos. Y aquí es donde viene la revelación que tiene todo el mundo la primera vez que
            hace este ejercicio.
          </p>
          <p>Agrupa tus gastos en 5-8 categorías. No hace falta ser muy específico, con categorías amplias basta:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => (
              <div key={cat.name} className="flex flex-col items-center text-center gap-1 p-3 rounded-xl bg-white border border-stone-200">
                <span className="text-2xl">{cat.emoji}</span>
                <span className="font-bold text-stone-800 text-sm">{cat.name}</span>
                {cat.description && <span className="text-xs text-stone-500">({cat.description})</span>}
              </div>
            ))}
          </div>
          <p>
            Ahora suma el total de cada categoría. Este es el momento en que la mayoría de personas se sorprende. Casi todo el mundo tiene una
            categoría que gasta el doble o el triple de lo que pensaba. Puede ser alimentación (comer fuera suma rápido), transporte (el coche es
            un agujero invisible) u ocio (los planes de fin de semana se acumulan).
          </p>
          <PullQuote>"No se trata de juzgar cómo gastas. Se trata de que lo que gastas coincida con lo que tú quieres."</PullQuote>
          <p>
            Quizás descubres que gastas 300€ al mes en comer fuera y eso te parece bien porque es tu forma de socializar. Perfecto. Lo importante
            es que lo sepas y lo decidas conscientemente, no que te enteres por sorpresa a final de mes.
          </p>
        </StepCard>

        <StepCard number={4} title="Calcula tu tasa de ahorro">
          <p>
            Ahora que sabes cuánto ganas y cuánto gastas (fijos + variables), puedes calcular algo que muy poca gente conoce pero que es la
            métrica más importante de tus finanzas personales: tu tasa de ahorro.
          </p>
          <Callout tone="stone" icon={Calculator}>
            <p className="font-semibold text-stone-800">La fórmula:</p>
            <p>Tasa de ahorro = (Ingresos - Gastos fijos - Gastos variables) ÷ Ingresos × 100</p>
            <p className="mt-2 font-semibold text-stone-800">Ejemplo:</p>
            <ul className="list-disc pl-5">
              <li>Ingresos: 1.800€</li>
              <li>Gastos fijos: 900€</li>
              <li>Gastos variables: 600€</li>
              <li>Sobra: 300€</li>
              <li>
                Tasa de ahorro: 300 ÷ 1.800 × 100 = <strong>16,7%</strong>
              </li>
            </ul>
          </Callout>
          <p>
            ¿Y eso es mucho o poco? Depende de tu situación, pero como referencia general: si estás por debajo del 10%, estás viviendo muy al
            límite. Entre el 10% y el 20% es un rango saludable. Por encima del 20%, vas muy bien.
          </p>
          <p>
            Lo realmente útil de la tasa de ahorro no es el número en sí, sino ver cómo cambia mes a mes. Si un mes baja, sabes que has gastado
            más. Si sube, estás avanzando. Es un termómetro simple de tu salud financiera.
          </p>
        </StepCard>

        <StepCard number={5} title="Decide y actúa (pero solo después de los datos)">
          <p>
            Este es el paso que la mayoría de guías pone primero ("¡haz un presupuesto!") y es un error. Hacer un presupuesto sin saber en qué
            gastas es como ponerte a dieta sin haberte pesado. No funciona porque no tienes una base real sobre la que decidir.
          </p>
          <p>Ahora que tienes los datos de un mes real, puedes tomar decisiones con fundamento:</p>
          <p>
            <strong className="text-stone-800">Si una categoría te parece excesiva:</strong> Ponle un límite concreto. No "gastaré menos en
            ocio", sino "gastaré máximo 150€ en ocio este mes". Un número concreto es algo que puedes medir, "menos" no lo es.
          </p>
          <p>
            <strong className="text-stone-800">Si quieres empezar a ahorrar:</strong> No intentes ahorrar "lo que sobre". Trata el ahorro como un
            gasto fijo más: cada mes, antes de gastar en variable, aparta una cantidad fija. Puede ser 50€, 100€ o lo que puedas. Lo importante es
            que sea automático y no negociable.
          </p>
          <p>
            <strong className="text-stone-800">Si quieres ahorrar para algo concreto:</strong> Ponle nombre y fecha. "Vacaciones de verano —
            1.200€ — julio 2027" es mucho más motivante que "ahorrar para vacaciones". Cuando ves el progreso hacia una meta concreta, el hábito
            se refuerza solo.
          </p>
          <Callout tone="emerald" icon={TrendingUp}>
            <p>
              <strong>El patrón que se repite:</strong> La mayoría de personas que siguen este método descubren que pueden ahorrar entre 100€ y
              300€ al mes sin cambiar drásticamente su estilo de vida. Solo con ser conscientes de lo que gastan y eliminar 2-3 gastos que no les
              aportan nada.
            </p>
          </Callout>
        </StepCard>
      </div>

      <div className="mt-10 text-center">
        <h2 className="text-2xl font-bold text-stone-900">¿Y si quieres hacerlo más fácil?</h2>
        <SectionTitleAccent />
      </div>
      <div className="rounded-2xl bg-white border border-teal-300 shadow-md p-6">
        <p className="text-stone-600 leading-relaxed">
          Todo lo que hemos descrito en estos 5 pasos puedes hacerlo con un papel y un bolígrafo. Pero seamos realistas: mantener el hábito con
          notas sueltas durante más de dos semanas es difícil.
        </p>
        <div className="mt-5 flex justify-center">
          <DeviceFrame src="/screenshot-raw-mensual.webp" alt="Composición de gastos por categoría en Nitid" width={600} height={1246} />
        </div>
        <p className="mt-5 font-semibold text-stone-800">Nitid integra este método para facilitarte cada paso:</p>
        <ul className="mt-3 flex flex-col gap-2.5">
          {APP_STEPS.map((step, i) => (
            <li key={step} className="flex items-start gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-50 shrink-0 mt-0.5">
                <Check size={12} className="text-teal-600" strokeWidth={3} />
              </span>
              <span className="text-sm text-stone-600">
                <strong className="text-stone-800">Paso {i + 1}:</strong> {step}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-stone-600 leading-relaxed">Entrada manual, sin conectar tu banco, sin anuncios y gratis.</p>
        <div className="mt-6 flex justify-center">
          <GooglePlayBadge />
        </div>
      </div>

      <p className="mt-10 text-lg text-stone-400 italic text-center">
        "El mejor momento para empezar fue hace un año. El segundo mejor momento es hoy."
      </p>

      <div className="my-8 flex justify-center">
        <GooglePlayBadge />
      </div>
    </article>
  );
}
