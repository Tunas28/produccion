# App de Producción de Motos — Guía Completa

## ¿Qué hace esta app?

El operario escanea con la cámara del celular el **código QR del número de chasis**.
La app completa automáticamente el modelo, cilindrada, tipo de rueda y códigos.
El operario solo ingresa el **número de motor** y el **color**.
El sistema valida que no haya chasis ni motores duplicados.

---

## PASO A PASO — Configuración en AppSheets

### PARTE 1 — Preparar Google Sheets

**Paso 1.** Crear un Google Sheets con el nombre `Produccion`.

**Paso 2.** En la primera hoja (renombrarla `Produccion`), crear estos encabezados
exactamente en la fila 1 (una columna por celda):

```
FECHA | ID | CHASIS | MODELO | CILINDRADA | NUM. MOTOR | COLOR | RUEDA | OBS | COD MOD | COD MOTOR | SEMANA | MES | AÑO | MES_LABEL | ES_HOY | ES_ESTA_SEMANA | ES_ESTE_MES
```

**Paso 3.** Crear una segunda hoja llamada `MODELOS_REF` con estos encabezados y datos:

| COD_MOD | MODELO | CILINDRADA | RUEDA | COD_MOTOR | PREFIJO_CHASIS |
|---------|--------|------------|-------|-----------|----------------|
| 1A | Cub 110 | 110 | ALEACION | 1P52FMH | PPA1A |
| BA | Urban 110 | 110 | RAYOS | 1P52FMH | PPABA |
| 2B | VX125 | 125 | ALEACION | 1P53FMI | PPA2B |
| AD | Super Sport 200 | 200 | ALEACION | 163FML | PPAAD |
| EE | Rally 250 | 250 | RAYOS | 165FMM | PPAEE |
| GC | Faiter SE 150 | 150 | ALEACION | 162FMJ | PPAGC |

---

### PARTE 2 — Conectar AppSheets

**Paso 4.** Ir a [appsheet.com](https://appsheet.com) → **New App** → **Start with existing data** → seleccionar el Google Sheets creado.

**Paso 5.** AppSheets detectará la hoja `Produccion` automáticamente.
Verificar que la columna **CHASIS** quede marcada como `Key`.

---

### PARTE 3 — Configurar columnas (Data → Tables → Produccion → Columns)

Para cada columna, aplicar la configuración indicada. Usar **App formula** para las calculadas.

#### Columnas que el usuario INGRESA:

| Columna | Tipo | Required | Notas |
|---------|------|----------|-------|
| FECHA | Date | Sí | Initial value: `TODAY()` |
| CHASIS | Text | Sí | Key=ON, Scan=ON (QR), ver Valid_if abajo |
| NUM. MOTOR | Text | Sí | ver Valid_if abajo |
| COLOR | Enum | Sí | Valores: NEGRO, AZUL, GRIS, ROJO, NARANJA, BLANCO |
| OBS | LongText | No | — |

#### Columnas AUTO-CALCULADAS (App formula, Editable=OFF):

**ID:**
```
MAXROW("Produccion", "ID") + 1
```

**MODELO:**
```
IFS(
  LEFT([CHASIS], 5) = "PPA1A", "Cub 110",
  LEFT([CHASIS], 5) = "PPABA", "Urban 110",
  LEFT([CHASIS], 5) = "PPA2B", "VX125",
  LEFT([CHASIS], 5) = "PPAAD", "Super Sport 200",
  LEFT([CHASIS], 5) = "PPAEE", "Rally 250",
  LEFT([CHASIS], 5) = "PPAGC", "Faiter SE 150",
  TRUE, "DESCONOCIDO"
)
```

**CILINDRADA:**
```
IFS(
  LEFT([CHASIS], 5) = "PPA1A", 110,
  LEFT([CHASIS], 5) = "PPABA", 110,
  LEFT([CHASIS], 5) = "PPA2B", 125,
  LEFT([CHASIS], 5) = "PPAAD", 200,
  LEFT([CHASIS], 5) = "PPAEE", 250,
  LEFT([CHASIS], 5) = "PPAGC", 150,
  TRUE, 0
)
```

**RUEDA:**
```
IFS(
  LEFT([CHASIS], 5) = "PPA1A", "ALEACION",
  LEFT([CHASIS], 5) = "PPABA", "RAYOS",
  LEFT([CHASIS], 5) = "PPA2B", "ALEACION",
  LEFT([CHASIS], 5) = "PPAAD", "ALEACION",
  LEFT([CHASIS], 5) = "PPAEE", "RAYOS",
  LEFT([CHASIS], 5) = "PPAGC", "ALEACION",
  TRUE, ""
)
```

**COD MOD:**
```
IFS(
  LEFT([CHASIS], 5) = "PPA1A", "1A",
  LEFT([CHASIS], 5) = "PPABA", "BA",
  LEFT([CHASIS], 5) = "PPA2B", "2B",
  LEFT([CHASIS], 5) = "PPAAD", "AD",
  LEFT([CHASIS], 5) = "PPAEE", "EE",
  LEFT([CHASIS], 5) = "PPAGC", "GC",
  TRUE, ""
)
```

**COD MOTOR:**
```
IFS(
  LEFT([CHASIS], 5) = "PPA1A", "1P52FMH",
  LEFT([CHASIS], 5) = "PPABA", "1P52FMH",
  LEFT([CHASIS], 5) = "PPA2B", "1P53FMI",
  LEFT([CHASIS], 5) = "PPAAD", "163FML",
  LEFT([CHASIS], 5) = "PPAEE", "165FMM",
  LEFT([CHASIS], 5) = "PPAGC", "162FMJ",
  TRUE, ""
)
```

#### Columnas VIRTUALES para KPIs (App formula, Show=OFF, Editable=OFF):

**SEMANA:** `WEEKNUM([FECHA])`

**MES:** `MONTH([FECHA])`

**AÑO:** `YEAR([FECHA])`

**MES_LABEL:** `TEXT([FECHA], "MMM YYYY")`

**ES_HOY:** `[FECHA] = TODAY()`

**ES_ESTA_SEMANA:**
```
AND(
  WEEKNUM([FECHA]) = WEEKNUM(TODAY()),
  YEAR([FECHA]) = YEAR(TODAY())
)
```

**ES_ESTE_MES:**
```
AND(
  MONTH([FECHA]) = MONTH(TODAY()),
  YEAR([FECHA]) = YEAR(TODAY())
)
```

---

### PARTE 4 — Configurar validaciones (columna → Valid_if)

#### Valid_if para CHASIS:
```
AND(
  STARTS_WITH(UPPER(TRIM([CHASIS])), "PPA"),
  LEN(TRIM([CHASIS])) >= 15,
  NOT(IN([CHASIS], SELECT(Produccion[CHASIS], [_THISROW_BEFORE] <> [_THISROW])))
)
```
> Mensaje de error: *"Chasis inválido o duplicado."*

#### Valid_if para NUM. MOTOR:
```
AND(
  LEN(TRIM([NUM. MOTOR])) > 0,
  NOT(IN([NUM. MOTOR], SELECT(Produccion[NUM. MOTOR], [_THISROW_BEFORE] <> [_THISROW]))),
  OR(LEN([COD MOTOR]) = 0, STARTS_WITH(UPPER(TRIM([NUM. MOTOR])), UPPER([COD MOTOR])))
)
```
> Mensaje de error: *"Número de motor duplicado o no corresponde al modelo."*

---

### PARTE 5 — Crear Slices (Data → Slices)

Crear los siguientes slices para alimentar los gráficos:

| Nombre | Filter |
|--------|--------|
| Produccion_Hoy | `[FECHA] = TODAY()` |
| Produccion_Este_Mes | `AND(MONTH([FECHA]) = MONTH(TODAY()), YEAR([FECHA]) = YEAR(TODAY()))` |
| Produccion_Esta_Semana | `AND(WEEKNUM([FECHA]) = WEEKNUM(TODAY()), YEAR([FECHA]) = YEAR(TODAY()))` |
| Produccion_Este_Anio | `YEAR([FECHA]) = YEAR(TODAY())` |
| Produccion_Todo | `TRUE` |

---

### PARTE 6 — Crear Vistas (UX → Views)

Crear 5 vistas en la barra de navegación:

#### Vista 1 — "Registrar Moto" (Form)
- **Table:** Produccion
- **View type:** Form
- Activar el ícono de cámara/QR en el campo CHASIS (Scan = ON)
- Los campos calculados deben estar en modo solo lectura

#### Vista 2 — "Hoy" (Table)
- **Slice:** Produccion_Hoy
- **View type:** Table
- **Sort:** ID descendente
- **Columns:** ID, CHASIS, MODELO, COLOR, NUM. MOTOR

#### Vista 3 — "Buscar" (Table)
- **Slice:** Produccion_Todo
- **View type:** Table
- Activar búsqueda en CHASIS, NUM. MOTOR, MODELO

#### Vista 4 — "Dashboard" (Dashboard)
- **View type:** Dashboard
- Agregar los paneles detallados en la siguiente sección

#### Vista 5 — "Historial" (Table)
- **Slice:** Produccion_Todo
- **View type:** Table
- **Sort:** FECHA descendente, ID descendente

---

### PARTE 7 — Configurar Dashboard y Gráficos (UX → Views → Dashboard)

El Dashboard combina KPIs (números) y gráficos (charts).

#### Paso 7a — Agregar KPIs como "Deck" o referencias en vistas

En AppSheets los KPIs se muestran como **Chart views** del tipo `Deck` o como el campo **Header** de una vista.

Para mostrar los 5 KPIs principales, crear una vista de tipo **Deck** con el slice `Produccion_Hoy`:

| KPI | Fórmula | Dónde pegar |
|-----|---------|-------------|
| Motos hoy | `COUNTIF(Produccion[ES_HOY], TRUE)` | Header de vista "Hoy" |
| Motos semana | `COUNTIF(Produccion[ES_ESTA_SEMANA], TRUE)` | Header de vista semanal |
| Motos mes | `COUNTIF(Produccion[ES_ESTE_MES], TRUE)` | Header Dashboard |
| Promedio día | `ROUND(COUNTIF(Produccion[ES_ESTE_MES], TRUE) / MAX(1, DAY(TODAY())), 1)` | Dashboard |
| Total acumulado | `COUNT(Produccion[CHASIS])` | Dashboard |

#### Paso 7b — Agregar gráficos al Dashboard

Para cada gráfico: en el Dashboard, hacer clic en **Add View** y seleccionar la vista de tipo Chart correspondiente.

**Gráfico 1 — Por Modelo Hoy** (Bar horizontal)
- Slice: `Produccion_Hoy`
- Group by: `MODELO`
- Chart type: Bar

**Gráfico 2 — Tendencia Diaria del Mes** (Line)
- Slice: `Produccion_Este_Mes`
- Group by: `FECHA`
- Chart type: Line

**Gráfico 3 — Por Color del Mes** (Pie)
- Slice: `Produccion_Este_Mes`
- Group by: `COLOR`
- Chart type: Pie

**Gráfico 4 — Aleación vs Rayos** (Pie)
- Slice: `Produccion_Este_Mes`
- Group by: `RUEDA`
- Chart type: Pie

**Gráfico 5 — Modelo × Color** (Bar apilado)
- Slice: `Produccion_Este_Mes`
- Group by: `MODELO`
- Series: `COLOR`
- Chart type: Stacked Bar

**Gráfico 6 — Producción Semanal del Año** (Bar)
- Slice: `Produccion_Este_Anio`
- Group by: `SEMANA`
- Chart type: Bar

**Gráfico 7 — Histórico Mensual** (Bar)
- Slice: `Produccion_Todo`
- Group by: `MES_LABEL`
- Chart type: Bar

---

### PARTE 8 — Guardar y desplegar

**Paso 8.** Hacer clic en **Save** en el editor de AppSheets.

**Paso 9.** Clic en **SYNC** para que AppSheets relea la hoja.

**Paso 10.** En la sección **Manage → Deploy**, hacer clic en **Move app to deployed state** para activar la app en producción.

**Paso 11.** Compartir la app con los operarios desde **Users → Users & permissions**.

---

## CÓMO PROBAR LA APP — Paso a paso

### Prueba 1 — Carga normal (caso exitoso)

1. Abrir la app en el celular
2. Tocar **"Registrar Moto"**
3. Verificar que FECHA = hoy (automático)
4. En el campo CHASIS, tocar el ícono de cámara y escanear este QR de prueba:
   ```
   PPA1A4E2TSB00612
   ```
5. Verificar que se completen solos:
   - MODELO → `Cub 110`
   - CILINDRADA → `110`
   - RUEDA → `ALEACION`
   - COD MOD → `1A`
   - COD MOTOR → `1P52FMH`
6. Ingresar NUM. MOTOR: `1P52FMH S9999001`
7. Seleccionar COLOR: `NEGRO`
8. Tocar **Guardar**
9. Verificar que aparece en la vista "Hoy"

### Prueba 2 — Chasis duplicado (debe rechazar)

1. Repetir la Prueba 1 con el mismo chasis `PPA1A4E2TSB00612`
2. La app debe mostrar el error:
   > *"Chasis inválido o duplicado."*
3. No debe permitir guardar

### Prueba 3 — Motor duplicado (debe rechazar)

1. Ingresar un chasis nuevo: `PPA1A4E3TSB00613`
2. Ingresar el mismo motor de la Prueba 1: `1P52FMH S9999001`
3. La app debe mostrar el error:
   > *"Número de motor duplicado o no corresponde al modelo."*

### Prueba 4 — Motor con prefijo incorrecto (debe rechazar)

1. Ingresar chasis: `PPA1A4E3TSB00613` (Cub 110 → COD MOTOR = 1P52FMH)
2. Ingresar motor con prefijo incorrecto: `165FMM 22E00999`
3. La app debe rechazarlo porque `165FMM` corresponde a Rally 250, no Cub 110

### Prueba 5 — Todos los modelos

Probar uno de cada modelo para verificar el mapeo automático:

| Chasis de prueba | Modelo esperado | COD MOTOR |
|-----------------|-----------------|-----------|
| `PPA1A4ETSB00001` | Cub 110 | 1P52FMH |
| `PPABA4ETSB00001` | Urban 110 | 1P52FMH |
| `PPA2B4ETSB00001` | VX125 | 1P53FMI |
| `PPAAD5ETSB00001` | Super Sport 200 | 163FML |
| `PPAEE5ETSB00001` | Rally 250 | 165FMM |
| `PPAGC5ETSB00001` | Faiter SE 150 | 162FMJ |

### Prueba 6 — Dashboard y KPIs

1. Registrar al menos 5 motos de diferentes modelos y colores
2. Abrir la vista **Dashboard**
3. Verificar:
   - KPI "Motos hoy" muestra el conteo correcto
   - Gráfico "Por Modelo Hoy" muestra barras por cada modelo cargado
   - Gráfico "Por Color del Mes" muestra la distribución de colores

### Prueba 7 — Búsqueda

1. Ir a la vista **Buscar**
2. Escribir los primeros caracteres de un chasis ya cargado
3. Verificar que aparece el registro
4. Buscar un número de motor parcial y verificar que lo encuentra

---

## Estructura de archivos de este repositorio

```
columnas/
  PRODUCCION.yaml           — Todas las columnas con fórmulas y validaciones
  MODELOS_REF.yaml          — Tabla de referencia de modelos
  DEPOSITO.yaml             — Columnas del kardex de movimientos de materia prima
  MATERIALES_REF.yaml       — Tabla de referencia de materiales y stock

expresiones/
  formulas_calculadas.yaml  — Fórmulas IFS para auto-completar desde el chasis
  validaciones.yaml         — Valid_if para unicidad de chasis y motor
  kpis.yaml                 — KPIs y configuración de los 7 gráficos
  slices.yaml               — Filtros de datos (hoy, semana, mes, año, todo)
  ux_vistas.yaml             — Vistas, navegación y dashboard completo

  deposito_formulas_calculadas.yaml — Fórmulas de lookup, stock y rollup
  deposito_validaciones.yaml        — Valid_if del depósito
  deposito_kpis.yaml                — KPIs y gráficos del depósito
  deposito_slices.yaml              — Filtros de datos del depósito (incluye "mes")
  deposito_ux_vistas.yaml           — Vistas, navegación y dashboard del depósito

sheets/
  setup.gs             — Script para crear las hojas de Producción
  setup_deposito.gs    — Script para crear las hojas de Depósito de Materia Prima
```

---

## Sistema 2: Depósito de Materia Prima

### ¿Qué hace?

Lleva el **kardex** (historial de movimientos) de los materiales del depósito:
quién ingresó qué material, cuánto salió a producción, y el estado de cada
lote (completo, incompleto, intervenido o reclamado). Con eso calcula el
**stock actual** de cada material en tiempo real y alerta cuando cae por
debajo del mínimo.

### ¿Qué necesitamos para crear un "mes de depósito"?

Un "mes de depósito" no es una hoja aparte por mes: es el **filtro por mes**
(slice `Deposito_Este_Mes`, columnas virtuales `MES` / `AÑO` / `MES_LABEL`)
aplicado sobre una única tabla `Deposito` que acumula todos los movimientos.
Para tenerlo funcionando hace falta:

1. **La tabla `MATERIALES_REF`** — catálogo de materiales (código, nombre,
   categoría, unidad, stock mínimo). Sin esto no se puede validar ni
   calcular stock. Ver `columnas/MATERIALES_REF.yaml`.
2. **La tabla `Deposito`** — un registro por cada movimiento, con
   `FECHA`, `COD_MATERIAL`, `TIPO_MOVIMIENTO` (ENTRADA, SALIDA, COMPLETO,
   INCOMPLETO, INTERVENIDO, RECLAMADO) y `CANTIDAD`. Ver `columnas/DEPOSITO.yaml`.
3. **Las columnas calculadas `MES`, `AÑO`, `MES_LABEL` y `ES_ESTE_MES`**
   sobre `FECHA` — son las que agrupan los movimientos por mes.
4. **El slice `Deposito_Este_Mes`** (y los slices por tipo de movimiento del
   mes) — alimentan los KPIs y gráficos mensuales.
5. **La columna de rollup `STOCK_ACTUAL`** en `MATERIALES_REF` — suma/resta
   los movimientos de `Deposito` (columna `EFECTO_STOCK`) para saber cuánto
   queda de cada material, sin depender de "cerrar" el mes.

En otras palabras: cargando movimientos día a día en `Deposito`, el "mes de
depósito" se arma solo — no requiere ningún paso manual de cierre mensual.

### PASO A PASO — Configuración en Google Sheets

**Paso 1.** En el mismo Google Sheets `Produccion` (o uno nuevo), crear la
hoja `MATERIALES_REF` con los encabezados y datos de ejemplo:

| COD_MATERIAL | MATERIAL | CATEGORIA | UNIDAD | STOCK_MINIMO |
|---|---|---|---|---|
| CH01 | Chasis | Estructura | UNIDAD | 20 |
| MT01 | Motor | Motor | UNIDAD | 20 |
| PIN01 | Pintura | Pintura | LITRO | 50 |
| NEU01 | Neumático | Rodado | UNIDAD | 40 |
| LLA01 | Llanta/Rin | Rodado | UNIDAD | 40 |
| BAT01 | Batería | Eléctrico | UNIDAD | 20 |
| CAB01 | Cableado | Eléctrico | METRO | 200 |
| TOR01 | Tornillería | Insumos | KG | 30 |
| ASI01 | Asiento | Carrocería | UNIDAD | 20 |
| TAN01 | Tanque combustible | Carrocería | UNIDAD | 20 |

> ⚠ Estos son materiales de **ejemplo**. Reemplazar/ampliar con los
> materiales reales del depósito.

**Paso 2.** Crear la hoja `Deposito` con estos encabezados en la fila 1:

```
FECHA | ID | COD_MATERIAL | MATERIAL | UNIDAD | TIPO_MOVIMIENTO | CANTIDAD | LOTE | PROVEEDOR_DESTINO | RESPONSABLE | OBS | EFECTO_STOCK | SEMANA | MES | AÑO | MES_LABEL | ES_HOY | ES_ESTA_SEMANA | ES_ESTE_MES
```

**Paso 3.** También se puede generar todo automáticamente con Apps Script:
pegar `sheets/setup_deposito.gs` y correr `crearEstructuraDeposito()`
(crea ambas hojas y carga movimientos de prueba).

### Configurar columnas en AppSheets (Data → Tables → Deposito → Columns)

#### Columnas que el usuario INGRESA:

| Columna | Tipo | Required | Notas |
|---|---|---|---|
| FECHA | Date | Sí | Initial value: `TODAY()` |
| COD_MATERIAL | Ref → MATERIALES_REF | Sí | ver Valid_if abajo |
| TIPO_MOVIMIENTO | Enum | Sí | ENTRADA, SALIDA, COMPLETO, INCOMPLETO, INTERVENIDO, RECLAMADO |
| CANTIDAD | Number | Sí | Valid_if: `[CANTIDAD] > 0` |
| LOTE | Text | No | Recomendado para trazar COMPLETO/INCOMPLETO/INTERVENIDO/RECLAMADO |
| PROVEEDOR_DESTINO | Text | No | Proveedor (entrada) o destino/área (salida) |
| RESPONSABLE | Text | No | — |
| OBS | LongText | No | — |

#### Columnas AUTO-CALCULADAS (App formula, Editable=OFF):

**MATERIAL:** `LOOKUP([COD_MATERIAL], "MATERIALES_REF", "COD_MATERIAL", "MATERIAL")`

**UNIDAD:** `LOOKUP([COD_MATERIAL], "MATERIALES_REF", "COD_MATERIAL", "UNIDAD")`

**ID:** `MAXROW("Deposito", "ID") + 1`

**EFECTO_STOCK** (cantidad con signo, base del stock):
```
IFS(
  [TIPO_MOVIMIENTO] = "ENTRADA", [CANTIDAD],
  [TIPO_MOVIMIENTO] = "COMPLETO", [CANTIDAD],
  [TIPO_MOVIMIENTO] = "SALIDA", -[CANTIDAD],
  [TIPO_MOVIMIENTO] = "INCOMPLETO", -[CANTIDAD],
  [TIPO_MOVIMIENTO] = "INTERVENIDO", -[CANTIDAD],
  [TIPO_MOVIMIENTO] = "RECLAMADO", -[CANTIDAD],
  TRUE, 0
)
```
> Convención por defecto: ENTRADA y COMPLETO suman stock; SALIDA, INCOMPLETO,
> INTERVENIDO y RECLAMADO restan. Ajustar si el proceso real es distinto.

#### Columnas VIRTUALES para KPIs (igual patrón que Producción):

**SEMANA:** `WEEKNUM([FECHA])` · **MES:** `MONTH([FECHA])` · **AÑO:** `YEAR([FECHA])`
**MES_LABEL:** `TEXT([FECHA], "MMM YYYY")` · **ES_HOY:** `[FECHA] = TODAY()`
**ES_ESTA_SEMANA** y **ES_ESTE_MES:** igual fórmula que en `Producción`, ver `columnas/DEPOSITO.yaml`.

#### En la tabla `MATERIALES_REF` (rollup desde Deposito):

**STOCK_ACTUAL:**
```
SUM(SELECT(Deposito[EFECTO_STOCK], [COD_MATERIAL] = [_THISROW].[COD_MATERIAL]))
```

**BAJO_MINIMO:** `[STOCK_ACTUAL] < [STOCK_MINIMO]`

### Validaciones (Valid_if)

- **COD_MATERIAL:** `IN([COD_MATERIAL], MATERIALES_REF[COD_MATERIAL])` — el material debe existir.
- **CANTIDAD:** `[CANTIDAD] > 0`.

Ver el detalle completo, incluida la recomendación de `LOTE`, en
`expresiones/deposito_validaciones.yaml`.

### Slices, KPIs, gráficos y vistas

Ver `expresiones/deposito_slices.yaml`, `expresiones/deposito_kpis.yaml` y
`expresiones/deposito_ux_vistas.yaml` para la configuración completa:
slice `Deposito_Este_Mes` (el "mes de depósito"), slices por tipo de
movimiento del mes, KPIs de entradas/salidas/incompletos/intervenidos/
reclamados del mes, gráfico de stock actual por material, y las vistas
"Registrar Movimiento", "Stock Actual", "Buscar", "Dashboard Depósito" e
"Historial Depósito".

### Prueba rápida

1. Cargar el catálogo `MATERIALES_REF` y correr `crearEstructuraDeposito()`
   (o cargar manualmente).
2. Registrar una ENTRADA de 50 unidades de `CH01` (Chasis).
3. Ver la vista **Stock Actual**: `CH01` debe mostrar `STOCK_ACTUAL = 50`.
4. Registrar una SALIDA de 10 unidades de `CH01`.
5. Verificar que `STOCK_ACTUAL` bajó a 40 y que el KPI "Salidas del mes"
   del Dashboard muestra 10.
6. Registrar una entrada baja (por ejemplo `STOCK_MINIMO = 20` y llevar el
   stock por debajo) y verificar que el material aparece resaltado en
   **Stock Actual** y sumado en el KPI "Materiales bajo mínimo".

---

## Modelos y mapeo de prefijos de chasis

| Prefijo | Modelo | cc | Rueda | COD MOD | COD MOTOR |
|---------|--------|----|-------|---------|-----------|
| PPA1A | Cub 110 | 110 | ALEACION | 1A | 1P52FMH |
| PPABA | Urban 110 | 110 | RAYOS | BA | 1P52FMH |
| PPA2B | VX125 | 125 | ALEACION | 2B | 1P53FMI |
| PPAAD | Super Sport 200 | 200 | ALEACION | AD | 163FML |
| PPAEE | Rally 250 | 250 | RAYOS | EE | 165FMM |
| PPAGC | Faiter SE 150 | 150 | ALEACION | GC | 162FMJ |

---

## KPIs disponibles

| KPI | Fórmula AppSheets |
|-----|-------------------|
| Motos hoy | `COUNTIF(Produccion[ES_HOY], TRUE)` |
| Motos esta semana | `COUNTIF(Produccion[ES_ESTA_SEMANA], TRUE)` |
| Motos este mes | `COUNTIF(Produccion[ES_ESTE_MES], TRUE)` |
| Promedio diario (mes) | `ROUND(COUNTIF(Produccion[ES_ESTE_MES], TRUE) / MAX(1, DAY(TODAY())), 1)` |
| Total histórico | `COUNT(Produccion[CHASIS])` |

---

## Gráficos configurados

| # | Nombre | Tipo | Slice | Agrupación |
|---|--------|------|-------|------------|
| 1 | Por Modelo — Hoy | Bar horizontal | Produccion_Hoy | MODELO |
| 2 | Producción Diaria — Mes | Line | Produccion_Este_Mes | FECHA |
| 3 | Por Color — Mes | Pie | Produccion_Este_Mes | COLOR |
| 4 | Aleación vs Rayos — Mes | Pie | Produccion_Este_Mes | RUEDA |
| 5 | Modelo × Color — Mes | Stacked Bar | Produccion_Este_Mes | MODELO / COLOR |
| 6 | Producción Semanal — Año | Bar | Produccion_Este_Anio | SEMANA |
| 7 | Histórico Mensual | Bar | Produccion_Todo | MES_LABEL |
