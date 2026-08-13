/// <reference types="node" />
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Función serverless de Vercel (convención actual para api/*.ts: handler Request/Response estándar
// web, no el patrón antiguo VercelRequest/@vercel/node). request.text() da los bytes exactos del
// body sin ninguna configuración adicional, necesario para verificar la firma HMAC.

// Rate limiting básico en memoria: suficiente para el volumen actual de este webhook (solo eventos de
// suscripción de clientes de pago reales, no un endpoint público de alto tráfico) y no requiere
// provisionar Redis/Upstash. Funciona porque este archivo corre en el runtime Node por defecto de
// Vercel (no edge): una instancia caliente conserva este Map entre invocaciones. Limitaciones conocidas
// y aceptadas: el contador se reinicia en un cold start y no se comparte entre instancias concurrentes
// si Vercel escala horizontalmente, así que no es un límite global exacto — pero sí frena una ráfaga
// desde un mismo origen, que es la amenaza real aquí. La barrera de seguridad de fondo sigue siendo la
// verificación de firma HMAC de más abajo: sin el secret nadie puede generar un evento válido pase lo
// que pase con este límite, así que esto es solo para evitar ruido/coste de invocaciones, no lo que
// impide altas de premium fraudulentas.
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  // Evita que requestLog crezca sin límite si llegan muchas IPs distintas de forma sostenida (poco
  // probable para este webhook en concreto, pero barato de evitar).
  if (requestLog.size > 1000) requestLog.clear();
  return timestamps.length > RATE_LIMIT;
}

type AppStatus = "active" | "cancelled" | "past_due";
type AppPlan = "free" | "premium";

// Lemon Squeezy tiene 7 estados posibles; nuestra columna "status" solo admite 3. "cancelled" NO
// revoca el acceso todavía (periodo de gracia hasta que termina lo ya pagado); solo "expired" lo
// hace de verdad, así que es el único caso que baja "plan" a "free".
function mapLemonStatus(lsStatus: string): { status: AppStatus; plan: AppPlan } {
  switch (lsStatus) {
    case "on_trial":
    case "active":
    case "paused":
      return { status: "active", plan: "premium" };
    case "past_due":
    case "unpaid":
      return { status: "past_due", plan: "premium" };
    case "cancelled":
      return { status: "cancelled", plan: "premium" };
    case "expired":
      return { status: "cancelled", plan: "free" };
    default:
      console.error(`lemonsqueezy-webhook: estado desconocido "${lsStatus}", se trata como activo`);
      return { status: "active", plan: "premium" };
  }
}

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  // Sin persistSession/autoRefreshToken: no hay sesión de usuario que mantener en una invocación
  // serverless sin estado, y por defecto el cliente intentaría usar localStorage (no existe en Node).
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function updateByLemonSubscriptionId(
  supabase: SupabaseClient,
  lemonSubscriptionId: string,
  patch: { status: AppStatus; plan: AppPlan },
) {
  const { error } = await supabase
    .from("subscriptions")
    .update({ status: patch.status, plan: patch.plan, updated_at: new Date().toISOString() })
    .eq("lemonsqueezy_subscription_id", lemonSubscriptionId);
  if (error) console.error("lemonsqueezy-webhook: error actualizando por lemonsqueezy_subscription_id", error);
}

export async function POST(request: Request) {
  // Antes de leer el body: rechazo barato para una IP que esté mandando ráfagas, sin gastar el trabajo
  // de parsear/verificar la firma de una petición que ya vamos a descartar.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return new Response("Too many requests", { status: 429 });
  }

  const rawBody = await request.text();

  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const signatureHeader = request.headers.get("x-signature");
  if (!secret || !signatureHeader) {
    return new Response("Missing signature", { status: 401 });
  }

  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  const digestBuf = Buffer.from(digest, "utf8");
  const signatureBuf = Buffer.from(signatureHeader, "utf8");
  // timingSafeEqual lanza si los buffers miden distinto, en vez de devolver false: sin esta
  // comprobación de longitud antes, una firma inválida de otro tamaño tumbaría la función con un 500
  // y Lemon Squeezy reintentaría sin fin.
  const validSignature = digestBuf.length === signatureBuf.length && timingSafeEqual(digestBuf, signatureBuf);
  if (!validSignature) {
    return new Response("Invalid signature", { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 401 });
  }

  const eventName: string | undefined = event?.meta?.event_name;
  const data = event?.data;
  const supabase = getSupabaseAdmin();

  try {
    if (eventName === "subscription_created") {
      const userId = event?.meta?.custom_data?.user_id;
      if (!userId) {
        console.error("lemonsqueezy-webhook: subscription_created sin meta.custom_data.user_id");
      } else {
        const { error } = await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            plan: "premium",
            status: "active",
            lemonsqueezy_subscription_id: data?.id ?? null,
            lemonsqueezy_customer_id: data?.attributes?.customer_id != null ? String(data.attributes.customer_id) : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
        if (error) console.error("lemonsqueezy-webhook: error en upsert de subscription_created", error);
      }
    } else if (eventName === "subscription_updated") {
      const lsStatus = data?.attributes?.status;
      if (data?.id && lsStatus) await updateByLemonSubscriptionId(supabase, data.id, mapLemonStatus(lsStatus));
    } else if (eventName === "subscription_cancelled") {
      if (data?.id) await updateByLemonSubscriptionId(supabase, data.id, mapLemonStatus("cancelled"));
    } else if (eventName === "subscription_expired") {
      if (data?.id) await updateByLemonSubscriptionId(supabase, data.id, mapLemonStatus("expired"));
    } else if (eventName === "subscription_payment_failed") {
      // subscription-invoices, no subscriptions: el id de la suscripción va en attributes, data.id es
      // el id de la factura.
      const lemonSubscriptionId = data?.attributes?.subscription_id;
      if (lemonSubscriptionId != null) {
        await updateByLemonSubscriptionId(supabase, String(lemonSubscriptionId), mapLemonStatus("past_due"));
      }
    }
    // Evento no reconocido: no se hace nada, pero se responde 200 igualmente (ver más abajo).
  } catch (err) {
    console.error("lemonsqueezy-webhook: error procesando evento", eventName, err);
  }

  // Siempre 200 con firma válida, incluso si el evento no se reconoce o falló al escribir en la base
  // de datos: reintentar no arregla ninguno de esos dos casos, y Lemon Squeezy reintenta agresivamente
  // ante cualquier respuesta que no sea 2xx. Solo la firma inválida (arriba) devuelve no-200.
  return new Response("OK", { status: 200 });
}
