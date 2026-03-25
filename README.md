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
  PRODUCCION.yaml       — Todas las columnas con fórmulas y validaciones
  MODELOS_REF.yaml      — Tabla de referencia de modelos

expresiones/
  formulas_calculadas.yaml  — Fórmulas IFS para auto-completar desde el chasis
  validaciones.yaml         — Valid_if para unicidad de chasis y motor
  kpis.yaml                 — KPIs y configuración de los 7 gráficos
  slices.yaml               — Filtros de datos (hoy, semana, mes, año, todo)
  ux_vistas.yaml            — Vistas, navegación y dashboard completo
```

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
