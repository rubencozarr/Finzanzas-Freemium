# Especificación completa — App de gestión de finanzas personales

## Resumen del producto

App web tipo PWA para gestionar finanzas personales: registro de ingresos y gastos, fondos de ahorro, inversión, presupuestos, y análisis con gráficos. Diseñada mobile-first, orientada a que cualquier persona (no solo el creador) pueda usarla.

## Stack técnico

- React + Vite
- Tailwind CSS
- Recharts (gráficos)
- Lucide React (iconos)
- Supabase (autenticación + base de datos PostgreSQL)
- Vite PWA plugin (para instalación en móvil)
- Despliegue en Vercel o Netlify (gratis)

## Prototipo de referencia

El archivo `docs/gestor-finanzas.jsx` es el prototipo funcional completo (1.700+ líneas, un solo archivo React). Se debe migrar a una estructura de proyecto real (componentes, hooks, utilidades separados), NO copiar tal cual. Este documento es la fuente de verdad; si el prototipo difiere de este documento, este documento manda.

---

## ARQUITECTURA DE DATOS

### Transactions (movimientos)
```
{
  id: string,
  user_id: string,
  type: "ingreso" | "gasto" | "aportacion" | "retiro" | "inversion",
  amount: number (siempre positivo),
  date: string (ISO "YYYY-MM-DD"),
  category: string,
  subcategory: string | null,
  note: string,
  fixed: boolean | null (solo para gastos: true=fijo, false=variable),
  fundId: string | null (solo para aportacion/retiro: a qué fondo),
  fundedBy: string | null (solo para gastos: id del fondo o "ahorro_libre"),
  splitId: string | null (gastos divididos entre ingreso y fondo),
  recurringId: string | null (enlace al gasto fijo preestablecido),
  recurringIncomeId: string | null (enlace al ingreso recurrente)
}
```

### Funds (fondos de ahorro)
```
{
  id: string,
  user_id: string,
  name: string
}
```
**REGLA CRÍTICA**: El saldo de un fondo NUNCA se guarda. Siempre se deriva del historial de movimientos: aportado − retirado − usado. Esto es "autocurativo": si se borra un movimiento, el saldo se recalcula automáticamente.

### Categories (categorías de gasto)
```
{
  id: string,
  user_id: string,
  type: "fixed" | "variable",
  name: string,
  subcategories: [{ id: string, name: string }],
  budget: number | null (presupuesto mensual, solo para variables),
  sort_order: number
}
```

Categorías por defecto (al crear cuenta):
- Fijas: Vivienda, Suministros, Seguros, Suscripciones, Otros fijos
- Variables: Alimentación (sub: Supermercado, Restaurantes), Transporte (sub: Gasolina, Transporte público, Taxi/VTC), Ocio (sub: Cine, Tapas, Restaurantes, Otros ocio), Salud (sub: Farmacia, Médico), Imprevistos, Otros variables

### Recurring (gastos fijos preestablecidos)
```
{
  id: string,
  user_id: string,
  categoryId: string,
  subcategory: string | null,
  amount: number,
  note: string,
  day: number | null (día habitual del mes, 1-31, opcional)
}
```

### RecurringIncome (ingresos recurrentes)
```
{
  id: string,
  user_id: string,
  incomeCat: "Ingreso fijo" | "Ingreso extra",
  name: string,
  amount: number,
  note: string,
  day: number | null (día habitual del mes, 1-31, opcional)
}
```

### Assets (activos de inversión)
```
{
  id: string,
  user_id: string,
  name: string,
  pct: number (% del reparto del plan de inversión)
}
```
**REGLA**: El total invertido por activo se deriva siempre del historial (movimientos tipo "inversion" donde category === nombre del activo). Nunca se guarda.

### InvestmentConfig
```
{
  user_id: string,
  globalPct: number (% de ingresos destinado a inversión)
}
```

### VariableBudget
```
number (presupuesto general mensual de todo el gasto variable)
```

---

## TERMINOLOGÍA DEL AHORRO — CRÍTICO

Estos tres términos se usan en TODA la app con significados exactos. No usar sinónimos ni variaciones.

### Ahorro libre consolidado
**Qué es**: La suma de todo lo que ha sobrado en meses anteriores sin usar. Es dinero ya cerrado que no va a cambiar.
**Cálculo**: `ahorroLibreHasta(prevMonthKey(mesActual))` — acumulado histórico hasta el mes anterior al que se está mirando.
**Dónde aparece**: Tarjeta de Patrimonio en Fondos, chip del formulario al marcar "pagado con ahorro", modal de cubrir diferencia.
**Puede gastarse**: Sí, marcando "pagado con ahorro" en un gasto.

### Ahorro libre en curso
**Qué es**: Lo que ha sobrado en el mes que se está mirando, sin contar fondos ni inversión. Todavía puede cambiar (si es el mes actual) o ya es definitivo (si es un mes pasado).
**Cálculo**: `ahorroLibreHasta(mes) - ahorroLibreHasta(prevMonthKey(mes))`
**Dónde aparece**: Tarjeta de Patrimonio (con etiqueta dinámica), StatCards de Movimientos ("Libre en curso"), tarjeta de Tu ahorro en Mensual.
**Puede gastarse como ahorro**: NO directamente. Para gastar este dinero, simplemente se meten gastos normales. Solo se convierte en "consolidado" cuando el mes cierra.
**Etiqueta dinámica**: Si es el mes actual → "En curso (este mes)". Si es un mes pasado → "Generado en [mes]".

### Ahorro libre
**Qué es**: La suma de consolidado + en curso. Es el total libre sin asignar a ningún fondo.
**Dónde aparece**: Desglose "Libre" en la tarjeta de Patrimonio (como suma, sin apellido).

### Regla de verificación
Si el usuario puede gastarlo como ahorro → se llama "consolidado". Si no puede todavía → se llama "en curso". Si es la suma de ambos → se llama "libre" a secas.

### Fórmula de ahorro libre "a fecha de"
```
ahorroLibreHasta(mKey) =
  SUM(ingresos + retiros hasta mKey)
  - SUM(gastos ordinarios hasta mKey)  // gastos sin fundedBy
  - SUM(aportaciones hasta mKey)
  - SUM(inversiones hasta mKey)
  - SUM(gastos pagados con ahorro_libre hasta mKey)
```

### Lo que NO es ahorro
- La inversión NO es ahorro (puede perder valor). Se muestra siempre separada.
- Los gastos pagados con fondos NO reducen el ahorro del mes. Se descuentan del fondo.

---

## PESTAÑAS DE LA APP

### 1. MOVIMIENTOS

**Navegación por mes**: Selector desplegable (grid 12 meses con puntitos verde/rojo según ahorro libre en curso positivo/negativo). Plegado por defecto, se abre al tocar el nombre del mes.

**StatCards (4)**: Ingresos | Gastos | Sobrante del mes (ingresos − gastos ordinarios) | Libre en curso (después de fondos e inversión).

**Avisos contextuales**: Si hay gastos financiados con fondos este mes, aviso ámbar. Si hay inversión, aviso indigo.

**Botón de preestablecidos**: SIEMPRE visible si hay preestablecidos configurados (no solo si hay pendientes). Dos estados visuales:
- Pendientes: botón oscuro prominente, "Añadir ingresos y gastos preestablecidos"
- Todo aplicado: botón suave con check, "Preestablecidos del mes aplicados"
- Al pulsar con todo aplicado: modal muestra "Todo aplicado este mes" con instrucciones para reaplicar.

**REGLA DE PREESTABLECIDOS DE INVERSIÓN**: Cada activo se considera pendiente individualmente (no globalmente). Si tienes 3 activos y borras el movimiento de uno, ese activo vuelve a pendiente pero los otros dos siguen aplicados. El check es: para cada activo, ¿hay un movimiento tipo "inversion" con category === nombre_del_activo este mes?

**Botón "Nuevo movimiento"**: Abre formulario con 5 tipos (Ingreso, Gasto, Aportar, Retirar, Invertir).

**Lista de movimientos**: Con iconos de editar (lápiz) y borrar (papelera). Borrar siempre pide confirmación (modal, no confirm() nativo). Gastos divididos (splitId) se muestran fusionados visualmente.

**Selección múltiple**: Botón "Seleccionar" activa modo con checkboxes. Resumen flotante ("3 seleccionados · 245,00€") y borrado con confirmación. El modo selección oculta los botones individuales de editar/borrar.

**Buscador**: Desplegable con campo de texto + filtros por tipo (Todos, Ingresos, Gastos, Inversión, Aportaciones, Retiros). Busca en todo el historial (no solo el mes actual) por categoría, subcategoría y nota. Máximo 50 resultados. Persistente al cambiar de pestaña.

**Validación de fechas**: Aviso visual (no bloqueante) si la fecha es > 12 meses en el futuro o > 2 años en el pasado.

**Aviso de presupuesto en tiempo real**: Al crear un gasto en una categoría variable con presupuesto, muestra cuánto llevas gastado y si este gasto te haría superarlo.

### 2. FONDOS E INVERSIÓN

**MonthSwitcher**: Igual que en Movimientos. Al cambiar de mes, todos los datos se recalculan "a cierre de ese mes".

**Indicador histórico**: Si el mes seleccionado es anterior al actual, aviso ámbar "Estás viendo datos históricos a cierre de [mes año]" y borde punteado en la tarjeta de patrimonio. Los meses futuros o el actual NO son históricos.

**Tarjeta de Patrimonio total** (a cierre del mes seleccionado):
- Patrimonio total (suma de todo)
- Ahorro (libre + fondos): con desglose Consolidado / En curso o Generado en [mes] / Fondos
- Inversión: total invertido hasta ese mes
- Texto explicativo: "Consolidado es la suma de lo que te ha sobrado sin usar en meses anteriores. Es dinero ya cerrado que puedes gastar marcando 'pagado con ahorro'."

**Todos los cálculos son "a fecha de"**:
- Fondos: saldo con movimientos hasta ese mes
- Inversión: total invertido hasta ese mes
- Ahorro libre: acumulado hasta ese mes

**Lista de fondos**: Crear (input + botón), renombrar (icono lápiz), eliminar (icono papelera con confirmación si tiene saldo). Botones Aportar/Retirar. Se muestran todos los fondos actuales con saldo a la fecha seleccionada.

**Lista de inversión**: Activos con importe, %, barra de progreso, botón Invertir. Enlace funcional "Ajustes → Inversión" que lleva directamente a la sección de inversión en Ajustes. Los activos solo se gestionan (crear/renombrar/borrar) desde Ajustes, no desde aquí.

### 3. MENSUAL

**MonthSwitcher** (igual que las otras pestañas).

**Bloque de resumen** (simplificado):
- Ingresos (bold, verde)
- Gastos totales (bold, con % de ingresos)
- Aportaciones a fondos (solo si > 0)
- Tarjeta "Tu ahorro" (fondo verde): "Ahorro libre en curso este mes" con explicación "Lo que te ha sobrado este mes, sin contar fondos ni inversión. Al cerrar el mes, se sumará a tu ahorro libre consolidado."

**Donut "De dónde ha salido tu dinero este mes"**: Porciones para Gasto fijo, Gasto variable, Inversión, Uso de ahorro (solo los que > 0). Total en el centro. Leyenda con doble %: % del gasto total (principal) + % de ingresos (secundario, debajo en texto más pequeño). Uso de ahorro NO lleva % de ingresos.

**4 bloques plegables** (en este orden): Gasto fijo, Gasto variable (con presupuesto general si configurado), Inversión, Uso de ahorro. Plegados por defecto. Cuando total = 0, opacidad reducida y no clicable. Cada uno muestra total + % de ingresos en la cabecera.

**Categorías dentro de cada bloque**: Plegables (nombre + importe + barra, se expande al tocar). Las que tienen presupuesto muestran gastado/presupuesto, barra que cambia de color (verde → ámbar al 80% → rojo al superar). Puntito rojo visible incluso plegada.

**Sparkline de tendencia (6 meses)**: Debajo de los bloques. Línea de ahorro libre en curso de los últimos 6 meses. Línea de referencia en 0 (gris continua, etiqueta "0") y media (teal punteada, etiqueta "media"). Explicación debajo.

### 4. ANUAL

**Selector de año** (flechas izquierda/derecha).

**Tarjetas de rendimiento del año** (solo flujos, comparables entre años):
- Ingresos año (verde)
- Gastos año (rojo)
- Tarjeta "Tu ahorro": "Ahorro libre generado este año"
- Invertido este año (indigo)
- Texto: "Estos datos son solo de [año], comparables entre años. Tu posición patrimonial acumulada la ves en Fondos e inversión."

**NO hay datos acumulados en Anual** (para evitar redundancia con Fondos e inversión).

**Donut "De dónde ha salido tu dinero este año"**: Mismo formato que Mensual (doble %, total en centro).

**Sección plegable "Gráficos y análisis"** (6 gráficos, en este orden):
1. **Tasa de ahorro mensual (%)**: LineChart, % de ingresos ahorrado cada mes. ReferenceLine en 0.
2. **Ingresos vs gastos por mes**: BarChart agrupado.
3. **Ahorro libre consolidado, mes a mes**: LineChart ámbar, acumulado que arrastra de años anteriores.
4. **Evolución gasto fijo vs variable**: BarChart agrupado.
5. **Cumplimiento presupuesto variable**: Grid 12 cuadrados (verde/rojo/gris). Solo activo si hay presupuesto general configurado.
6. **Inversión por activo (donut)**: PieChart con total en centro, solo si hay inversión este año. Datos del año (no acumulado).

Cada gráfico con título + gráfico + explicación de para qué sirve.

### 5. AJUSTES

**4 secciones** en grid 2×2: Categorías, Gastos fijos, Ingresos, Inversión. Se puede llegar a una sección específica desde otras pestañas (ej: Fondos → Ajustes → Inversión).

**Categorías**: Fijas y variables separadas. Las fijas no llevan presupuesto (con nota explicativa). Las variables llevan presupuesto individual opcional + presupuesto general de todo lo variable. Aviso ámbar si la suma de presupuestos por categoría supera el general. Reordenar (flechas ↑↓), renombrar, eliminar, subcategorías.

**Gastos fijos**: Lista de preestablecidos con categoría, subcategoría, importe editable, día habitual (opcional), nota. Crear/eliminar.

**Ingresos**: Lista de ingresos recurrentes con tipo (Ingreso fijo/extra), nombre, importe editable, día habitual (opcional), nota. Crear/eliminar.

**Inversión**: % global de ingresos + reparto entre activos (%). Crear/renombrar/eliminar activos. Aviso si los % no suman 100.

**Exportar/Importar** (siempre visible al final de Ajustes, independiente de la sección):
- Exportar: descarga JSON con versión, fecha, y absolutamente todos los datos (transactions, funds, categories, recurring, recurringIncome, assets, investmentConfig, variableBudget).
- Importar: seleccionar archivo, confirmación antes de reemplazar, carga todo.

---

## FORMULARIO DE NUEVO MOVIMIENTO

**5 tipos**: Ingreso, Gasto, Aportar (a fondo), Retirar (de fondo), Invertir (en activo).
**Edición**: No permite cambiar el tipo (nota explicativa). Carga todos los campos del movimiento existente.

**Tipo Gasto**:
- Selector de categoría (fija/variable) y subcategoría
- Checkbox "Pagado con ahorro (fondo o ahorro libre consolidado)": muestra opciones de fondos + ahorro libre consolidado con saldo visible
- Validación: no puedes gastar más de lo que hay en el fondo/ahorro libre seleccionado
- Si el gasto supera el ahorro libre en curso del mes y NO está marcado como pagado con ahorro: pregunta "¿cubrir la diferencia con un fondo o ahorro libre consolidado?" con opciones

**Tipo Invertir**: Selector de activo con total invertido visible.

**Toast de confirmación**: Al guardar, editar, borrar o aplicar preestablecidos, toast flotante 2.5s.

---

## APLICACIÓN DE PREESTABLECIDOS

Un solo botón abre un modal consolidado con 3 secciones (solo las que tienen items pendientes):
1. Ingresos recurrentes (con checkboxes e importes editables)
2. Gastos fijos (con checkboxes e importes editables)
3. Plan de inversión (con checkboxes e importes editables, sugerencia calculada como % de ingresos incluyendo los ingresos pendientes de aplicar)

La fecha de cada movimiento usa el día habitual configurado (si existe). Si no, usa la fecha del día (si es el mes actual) o el 1 del mes (si es otro mes).

**Bug corregido en esta spec**: La inversión se marca como pendiente/aplicada POR ACTIVO, no globalmente. Cada activo se verifica individualmente: ¿existe un movimiento tipo "inversion" con category === nombre_del_activo en este mes?

---

## GASTO DIVIDIDO (splitId)

Cuando un gasto supera el ahorro libre en curso del mes y el usuario elige cubrir la diferencia con un fondo/ahorro libre consolidado, se crean 2 movimientos con el mismo `splitId`:
1. Gasto ordinario por la parte cubierta con ingresos del mes
2. Gasto con fundedBy por la parte cubierta con el fondo/ahorro libre

Visualmente se muestran como un solo movimiento fusionado. Al borrar, se borran ambos (filtrar por splitId).

---

## CÁLCULOS FINANCIEROS CLAVE

### computeMonth(mKey)
```
ingresos = SUM(ingreso + retiro del mes)
fixedOrdinario = SUM(gastos fijos sin fundedBy)
variableOrdinario = SUM(gastos variables sin fundedBy)
gastosOrdinarios = fixedOrdinario + variableOrdinario
gastosFinanciados = SUM(gastos con fundedBy)
aportaciones = SUM(aportaciones del mes)
inversion = SUM(inversiones del mes)
ahorroTotal = ingresos - gastosOrdinarios
ahorroReal = ahorroTotal - aportaciones - inversion (= "libre en curso")
```

### Patrimonio a fecha de (para Fondos)
Todos los saldos se recalculan filtrando movimientos hasta el mes seleccionado (inclusive):
- Fondos: aportado − retirado − usado (solo movimientos hasta ese mes)
- Inversión: SUM inversiones hasta ese mes
- Ahorro libre: fórmula de ahorroLibreHasta(mKey)

### Datos anuales
- Flujos (del año): ingresos, gastos, ahorro generado, inversión → se reinician cada enero, comparables entre años
- La gráfica de ahorro libre consolidado mes a mes SÍ arrastra de años anteriores (empieza en ahorroLibreHasta(diciembre del año anterior))

---

## REGLAS DE NEGOCIO ADICIONALES

1. Los saldos de fondos y activos NUNCA se guardan, siempre se derivan del historial
2. Al borrar un movimiento con splitId, se borran TODOS los movimientos con ese splitId
3. La inversión NO es ahorro. Se muestra siempre separada visual y textualmente
4. Los presupuestos son solo para categorías variables (no fijas)
5. El presupuesto general de variable y los presupuestos por categoría son complementarios, no excluyentes
6. Los textos explicativos largos deben implementarse como tooltips (icono ? que muestra texto al tocar) en la app real

---

## DISEÑO VISUAL

- Mobile-first, max-width 448px centrado
- Paleta: stone (neutros), teal (ahorro), rose (gastos variables), slate (gastos fijos), indigo (inversión), amber (uso de ahorro / ahorro libre), emerald (ingresos)
- Fuente serif para títulos de sección, sans-serif para el resto
- Fuente mono para cifras
- Bloques plegables con opacidad reducida cuando están a 0
- Indicador histórico: borde punteado + aviso ámbar cuando se ven datos de un mes pasado
- Toast de confirmación: flotante arriba, fondo oscuro, 2.5 segundos

---

## AUTENTICACIÓN Y MULTI-USUARIO

- Login con email (Supabase Auth)
- Cada tabla tiene user_id
- Row Level Security en Supabase: cada usuario solo ve sus propios datos
- No hay datos compartidos entre usuarios

---

## PWA

- manifest.json con nombre, iconos, tema
- Service worker para funcionamiento offline básico (los datos se sincronizan al reconectar)
- Instalable desde el navegador en iOS y Android
