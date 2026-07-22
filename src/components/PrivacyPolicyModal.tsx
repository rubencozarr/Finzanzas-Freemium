import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";

interface PrivacySection {
  title: string;
  body: React.ReactNode;
}

// Marcadores [FECHA]/[TU NOMBRE COMPLETO]/[TU EMAIL]/[TU CIUDAD, PAÍS] deliberadamente sin rellenar:
// los completa el usuario más adelante.
const EFFECTIVE_DATE = "[FECHA]";
const LAST_UPDATED = "[FECHA]";
const CONTACT_EMAIL = "[TU EMAIL]";

const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    title: "1. Responsable del tratamiento de datos",
    body: (
      <>
        <p className="mb-2">El responsable del tratamiento de tus datos personales es:</p>
        <ul className="list-disc pl-4 space-y-1 mb-2">
          <li>Nombre: [TU NOMBRE COMPLETO]</li>
          <li>Correo electrónico de contacto: {CONTACT_EMAIL}</li>
          <li>Ubicación: [TU CIUDAD, PAÍS]</li>
        </ul>
        <p>
          Si tienes cualquier duda o consulta sobre esta política o el tratamiento de tus datos, puedes contactar con nosotros
          en el correo indicado.
        </p>
      </>
    ),
  },
  {
    title: "2. Qué datos personales recogemos",
    body: (
      <>
        <p className="mb-3">
          Klaro recoge únicamente los datos mínimos necesarios para prestar el servicio. No recogemos datos innecesarios ni
          datos que no nos hayas proporcionado tú directamente.
        </p>

        <p className="font-medium text-slate-700 mb-1">2.1. Datos de cuenta:</p>
        <ul className="list-disc pl-4 space-y-1 mb-3">
          <li>
            Dirección de correo electrónico, utilizada para crear y gestionar tu cuenta, y para comunicaciones esenciales del
            servicio (como recuperación de contraseña).
          </li>
          <li>Contraseña, almacenada de forma cifrada. Nunca tenemos acceso a tu contraseña en texto plano.</li>
        </ul>

        <p className="font-medium text-slate-700 mb-1">2.2. Datos financieros introducidos por ti:</p>
        <ul className="list-disc pl-4 space-y-1 mb-2">
          <li>Movimientos (ingresos, gastos, aportaciones, retiros, inversiones) con sus importes, fechas, categorías y notas.</li>
          <li>Fondos de ahorro con sus nombres, saldos iniciales, metas e iconos.</li>
          <li>Categorías y subcategorías de gasto con presupuestos opcionales.</li>
          <li>Gastos fijos e ingresos recurrentes.</li>
          <li>Activos de inversión con porcentajes de reparto.</li>
          <li>Cualquier otra información financiera que introduzcas voluntariamente en la aplicación.</li>
        </ul>
        <p className="mb-3">
          Todos estos datos financieros los introduces tú de forma manual. Klaro no se conecta con tu banco, no accede a tus
          cuentas bancarias, y no obtiene información financiera de ninguna fuente externa.
        </p>

        <p className="font-medium text-slate-700 mb-1">2.3. Datos de suscripción (solo usuarios Premium):</p>
        <ul className="list-disc pl-4 space-y-1 mb-3">
          <li>Información relativa a tu plan de suscripción (tipo de plan, estado, fechas de inicio y fin).</li>
          <li>Identificadores de cliente y suscripción de Lemon Squeezy (nuestro proveedor de pagos).</li>
          <li>No almacenamos datos de tu tarjeta de crédito o débito ni ningún otro dato de pago directo.</li>
        </ul>

        <p className="font-medium text-slate-700 mb-1">2.4. Datos técnicos:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            Klaro no utiliza cookies de rastreo, ni herramientas de analítica de terceros, ni tecnologías de seguimiento
            publicitario.
          </li>
          <li>No recopilamos datos de tu dispositivo, tu ubicación, tus contactos, tu cámara ni ningún otro sensor o recurso de tu teléfono.</li>
        </ul>
      </>
    ),
  },
  {
    title: "3. Para qué utilizamos tus datos",
    body: (
      <>
        <p className="mb-2">Utilizamos tus datos exclusivamente para las siguientes finalidades:</p>
        <ul className="list-disc pl-4 space-y-1 mb-3">
          <li>Prestación del servicio: guardar, procesar y mostrar tu información financiera dentro de la aplicación.</li>
          <li>Gestión de tu cuenta: permitirte iniciar sesión, recuperar tu contraseña y gestionar tus preferencias.</li>
          <li>Gestión de suscripciones: procesar altas, bajas y cambios en tu plan Premium.</li>
          <li>Comunicaciones esenciales del servicio: como el envío de correos de recuperación de contraseña.</li>
        </ul>
        <p className="mb-2">Klaro no utiliza tus datos para:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Enviarte publicidad o comunicaciones comerciales no solicitadas.</li>
          <li>Crear perfiles publicitarios o de comportamiento.</li>
          <li>Vender, alquilar o compartir tu información con terceros con fines comerciales.</li>
          <li>Entrenar modelos de inteligencia artificial o análisis de datos masivos.</li>
        </ul>
      </>
    ),
  },
  {
    title: "4. Base legal del tratamiento (RGPD)",
    body: (
      <>
        <p className="mb-2">El tratamiento de tus datos se basa en:</p>
        <ul className="list-disc pl-4 space-y-1 mb-3">
          <li>
            Ejecución contractual (artículo 6.1.b del RGPD): el tratamiento es necesario para prestarte el servicio que
            solicitas al crear tu cuenta y usar la aplicación.
          </li>
          <li>
            Consentimiento (artículo 6.1.a del RGPD): al registrarte y aceptar esta política de privacidad, consientes el
            tratamiento de tus datos para las finalidades descritas.
          </li>
          <li>
            Interés legítimo (artículo 6.1.f del RGPD): en casos limitados, como la prevención de fraude o la seguridad del
            servicio.
          </li>
        </ul>
        <p>Puedes retirar tu consentimiento en cualquier momento eliminando tu cuenta.</p>
      </>
    ),
  },
  {
    title: "5. Con quién compartimos tus datos",
    body: (
      <>
        <p className="mb-2">
          No vendemos, alquilamos ni compartimos tus datos personales con terceros con fines comerciales o publicitarios. Solo
          compartimos datos con los proveedores estrictamente necesarios para el funcionamiento del servicio:
        </p>
        <ul className="list-disc pl-4 space-y-2 mb-3">
          <li>
            <strong>Supabase</strong> (supabase.com): nuestro proveedor de infraestructura de base de datos y autenticación.
            Almacena tus datos de cuenta y tus datos financieros de forma segura. Sus servidores se encuentran en la Unión
            Europea. Puedes consultar su política de privacidad en{" "}
            <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">
              supabase.com/privacy
            </a>
            .
          </li>
          <li>
            <strong>Lemon Squeezy</strong> (lemonsqueezy.com): nuestro proveedor de pagos, que actúa como Merchant of Record
            (intermediario de pago) para las suscripciones Premium. Gestiona el cobro y la facturación. Procesa los datos de
            pago necesarios (tarjeta de crédito/débito) directamente, sin que Klaro tenga acceso a ellos. Puedes consultar su
            política de privacidad en{" "}
            <a
              href="https://www.lemonsqueezy.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-700 underline"
            >
              lemonsqueezy.com/privacy
            </a>
            .
          </li>
          <li>
            <strong>Vercel</strong> (vercel.com): nuestro proveedor de alojamiento web. Sirve la aplicación pero no almacena
            datos de usuario. Puedes consultar su política de privacidad en{" "}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-700 underline"
            >
              vercel.com/legal/privacy-policy
            </a>
            .
          </li>
        </ul>
        <p className="mb-2">
          Estos proveedores actúan como encargados del tratamiento y solo procesan tus datos según nuestras instrucciones y
          para la finalidad del servicio.
        </p>
        <p>
          No realizamos transferencias internacionales de datos fuera del Espacio Económico Europeo, salvo las que puedan
          derivarse del uso de Lemon Squeezy y Vercel, que cuentan con las garantías adecuadas (Cláusulas Contractuales Tipo de
          la Comisión Europea o equivalentes).
        </p>
      </>
    ),
  },
  {
    title: "6. Cuánto tiempo conservamos tus datos",
    body: (
      <>
        <p className="mb-2">Conservamos tus datos mientras mantengas tu cuenta activa en Klaro.</p>
        <p className="mb-2">Si eliminas tu cuenta, tus datos personales y financieros se eliminarán de nuestros sistemas. Ten en cuenta que:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Puedes exportar todos tus datos antes de eliminar tu cuenta (Ajustes {">"} Exportar).</li>
          <li>Algunos datos pueden mantenerse en copias de seguridad durante un periodo limitado antes de ser eliminados definitivamente.</li>
          <li>Los datos de facturación gestionados por Lemon Squeezy se conservarán según sus propias obligaciones legales y fiscales.</li>
        </ul>
      </>
    ),
  },
  {
    title: "7. Tus derechos",
    body: (
      <>
        <p className="mb-2">
          De acuerdo con el Reglamento General de Protección de Datos (RGPD) y la legislación española vigente (Ley Orgánica
          3/2018, de Protección de Datos Personales y garantía de los derechos digitales), tienes los siguientes derechos:
        </p>
        <ul className="list-disc pl-4 space-y-1 mb-3">
          <li>
            Derecho de acceso: puedes solicitar una copia de todos los datos personales que tenemos sobre ti. También puedes
            exportar tus datos financieros en cualquier momento desde la propia aplicación (Ajustes {">"} Exportar).
          </li>
          <li>Derecho de rectificación: puedes corregir cualquier dato inexacto directamente desde la aplicación, o solicitarnos la corrección por correo electrónico.</li>
          <li>Derecho de supresión ("derecho al olvido"): puedes solicitar la eliminación de tus datos eliminando tu cuenta o contactando con nosotros.</li>
          <li>Derecho a la portabilidad: puedes exportar tus datos en formato JSON o Excel desde la aplicación.</li>
          <li>Derecho de oposición: puedes oponerte al tratamiento de tus datos en determinadas circunstancias contactando con nosotros.</li>
          <li>Derecho a la limitación del tratamiento: puedes solicitar que limitemos el uso de tus datos en determinadas circunstancias.</li>
          <li>Derecho a no ser objeto de decisiones automatizadas: Klaro no realiza decisiones automatizadas ni perfilado que produzca efectos jurídicos sobre ti.</li>
        </ul>
        <p className="mb-2">
          Para ejercer cualquiera de estos derechos, contacta con nosotros en {CONTACT_EMAIL}. Responderemos en un plazo
          máximo de 30 días.
        </p>
        <p className="mb-2">
          Si consideras que tus derechos no han sido atendidos correctamente, puedes presentar una reclamación ante la Agencia
          Española de Protección de Datos (
          <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">
            www.aepd.es
          </a>
          ).
        </p>
        <p>
          Para usuarios en California (EE.UU.): de acuerdo con la Ley de Privacidad del Consumidor de California (CCPA/CPRA),
          tienes derecho a saber qué datos personales recogemos, a solicitar su eliminación y a no ser discriminado por
          ejercer tus derechos de privacidad. Klaro no vende ni comparte datos personales según la definición de la CCPA.
        </p>
      </>
    ),
  },
  {
    title: "8. Seguridad de los datos",
    body: (
      <>
        <p className="mb-2">
          Aplicamos medidas técnicas y organizativas para proteger tus datos personales contra el acceso no autorizado, la
          pérdida, la alteración o la destrucción. Estas medidas incluyen:
        </p>
        <ul className="list-disc pl-4 space-y-1 mb-3">
          <li>Cifrado de todas las comunicaciones entre la aplicación y nuestros servidores (HTTPS/TLS).</li>
          <li>Contraseñas almacenadas con hash criptográfico seguro (gestionado por Supabase Auth).</li>
          <li>Control de acceso a nivel de fila (Row Level Security) en la base de datos: cada usuario solo puede acceder a sus propios datos.</li>
          <li>Separación de claves de acceso entre el frontend (público) y el backend (privado).</li>
        </ul>
        <p>
          Ningún sistema es 100% seguro. Si detectamos una brecha de seguridad que afecte a tus datos personales, te lo
          notificaremos y tomaremos las medidas necesarias de acuerdo con la legislación vigente.
        </p>
      </>
    ),
  },
  {
    title: "9. Menores de edad",
    body: (
      <p>
        Klaro no está dirigido a menores de 16 años. No recogemos conscientemente datos de menores de 16 años. Si eres padre o
        tutor y crees que un menor ha proporcionado datos personales sin tu consentimiento, contacta con nosotros en{" "}
        {CONTACT_EMAIL} y eliminaremos esa información.
      </p>
    ),
  },
  {
    title: "10. Cambios en esta política de privacidad",
    body: (
      <>
        <p className="mb-2">
          Podemos actualizar esta política de privacidad para reflejar cambios en nuestras prácticas o en la legislación
          aplicable. Te informaremos de cambios significativos a través de la aplicación o por correo electrónico. Te
          recomendamos revisar esta política periódicamente.
        </p>
        <p>La fecha de la última actualización se indica al principio de este documento.</p>
      </>
    ),
  },
  {
    title: "11. Información adicional para Google Play",
    body: (
      <>
        <p className="mb-2">De conformidad con las directrices de Google Play:</p>
        <ul className="list-disc pl-4 space-y-1 mb-3">
          <li>Klaro no recopila datos de ubicación.</li>
          <li>Klaro no recopila datos de contactos, SMS, registro de llamadas ni contenido multimedia del dispositivo.</li>
          <li>Klaro no contiene publicidad ni utiliza SDKs publicitarios.</li>
          <li>Klaro no comparte datos con terceros para fines publicitarios.</li>
          <li>
            Los datos financieros que el usuario introduce son tratados como información sensible y se protegen con las
            medidas de seguridad descritas en esta política.
          </li>
          <li>El usuario puede solicitar la eliminación de sus datos en cualquier momento.</li>
        </ul>
        <p>Si tienes cualquier pregunta sobre esta política de privacidad, no dudes en contactar con nosotros en {CONTACT_EMAIL}.</p>
      </>
    ),
  },
];

interface PrivacyPolicyModalProps {
  onClose: () => void;
}

export function PrivacyPolicyModal({ onClose }: PrivacyPolicyModalProps) {
  const [open, setOpen] = useState<Set<number>>(new Set());

  const toggle = (i: number) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className="fixed inset-0 bg-stone-50 z-50 flex flex-col">
      <header
        className="bg-slate-800 text-stone-50 px-5 pb-4 flex items-center justify-between shrink-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" }}
      >
        <h1 className="font-serif text-xl tracking-tight">Política de privacidad</h1>
        <button onClick={onClose} className="text-stone-300 hover:text-white">
          <X size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8 max-w-md w-full mx-auto">
        <div className="bg-white rounded-lg border border-stone-100 p-3 mb-4">
          <p className="text-xs text-stone-400">Fecha de entrada en vigor: {EFFECTIVE_DATE}</p>
          <p className="text-xs text-stone-400 mb-2">Última actualización: {LAST_UPDATED}</p>
          <p className="text-sm text-stone-600">
            En Klaro nos tomamos muy en serio la privacidad de tus datos. Esta política de privacidad explica qué información
            recogemos, cómo la utilizamos, con quién la compartimos, y cuáles son tus derechos. Te recomendamos que la leas
            detenidamente.
          </p>
        </div>

        <div className="space-y-2">
          {PRIVACY_SECTIONS.map((section, i) => {
            const expanded = open.has(i);
            return (
              <div key={section.title} className="bg-white rounded-lg border border-stone-100 overflow-hidden">
                <button onClick={() => toggle(i)} className="w-full text-left px-3 py-3 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-800">{section.title}</span>
                  {expanded ? (
                    <ChevronUp size={16} className="text-stone-400 shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-stone-400 shrink-0" />
                  )}
                </button>
                {expanded && <div className="text-sm text-stone-600 px-3 pb-3 -mt-1">{section.body}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
