# Diseño de WMS propio — Motos + Bicicletas CKD

> Estado: **DISEÑO, sin construir todavía.** Este documento reemplaza
> la decisión anterior de "sin backend propio" en el README principal.
> Ver justificación abajo.

## 1. Por qué se revierte la decisión de "solo Sheets/AppSheets"

La decisión original de quedarnos en Google Sheets + AppSheets asumía
un volumen de **20-100 motos/día**. El volumen real confirmado es:

| Producto | Volumen mensual | Aprox. diario |
|---|---|---|
| Motos | 6.000 | ~200/día |
| Bicicletas | 6.000 | ~200/día |
| Ventiladores CKD (material) | 4.000 | ~130/día |

Esto son **~400 unidades/día combinadas**, muy por encima del rango
que Sheets/AppSheets soporta cómodo. Cada unidad además dispara
varios movimientos de depósito (recepción, picking con 15-30 líneas
de BOM, salida), así que `Deposito` puede crecer decenas de miles de
filas por mes. A ese ritmo:

- Las fórmulas `SUM(SELECT(...))` que usa todo el diseño actual
  (stock, KPIs, reportes mensuales) se vuelven notablemente lentas en
  AppSheets mucho antes de los límites duros de Google Sheets.
- 4+ operarios escribiendo simultáneamente sobre el mismo Google
  Sheets empieza a generar conflictos/lentitud.

**Conclusión: a este volumen, un backend propio con base de datos
real se justifica técnicamente.** No hace falta la versión
"enterprise" (VIN de 17 dígitos, GS1 DataMatrix, microservicios) que
se propuso en un documento externo — eso resuelve un problema de
escala/regulación distinto al de este proyecto. Alcanza con una base
de datos relacional bien diseñada y una interfaz simple de escaneo.

## 2. Restricciones de este proyecto (confirmadas por el cliente)

- **No hay hosting/infraestructura previa.** Arrancamos de cero.
- **El mantenimiento futuro se hace vía sesiones de IA (Claude)**, no
  hay (todavía) un developer humano dedicado. Esto pesa MUCHO en la
  elección de stack: cuantas menos piezas para operar/mantener a
  mano, mejor.
- Sin ERP/WMS previo — este sistema es la primera herramienta digital
  real del depósito.

## 3. Stack elegido

| Capa | Elección | Por qué |
|---|---|---|
| Base de datos | **PostgreSQL gestionado (Supabase)** | Managed, sin administración de servidor, backups automáticos, plan gratuito/económico alcanza para este volumen. |
| Backend / API | **Supabase (Postgres + Auto API + Auth + Realtime) + Edge Functions puntuales** | Evita construir y mantener un servidor de API propio. El CRUD sale gratis con la API autogenerada de Supabase (PostgREST) + Row Level Security. Solo se escribe código (Edge Functions, Deno/TypeScript) para la lógica que hoy son los "Bots" de AppSheet. |
| Lógica de negocio (ex-Bots) | **Funciones/vistas SQL** dentro de Postgres | Más simple y confiable que Bots: se resuelve con `VIEW`s (ver sección 6) en vez de triggers que insertan filas — menos estado que mantener sincronizado. |
| Frontend operarios | **PWA (React + Vite + TypeScript)**, con escaneo de código de barras/QR vía cámara del celular (librería `@zxing/browser` o similar). Cada escaneo/guardado lleva un `mutation_id` (UUID generado en el celular) para poder reintentar sin duplicar si se corta la conexión — barato de agregar desde el día 1, aunque no se construya offline-first completo todavía. | Instalable desde el navegador (ícono en el celular), sin pasar por App Store/Play Store. Un solo lenguaje (TypeScript) en todo el stack, lo que facilita mantenerlo desde sesiones de IA. |
| Autenticación | **Supabase Auth** (email/magic link) | Para los ~4 operarios + supervisores, sin construir login propio. |
| Hosting del frontend | **Vercel o Netlify** (plan gratuito) | Deploy automático con cada push a git, cero administración de servidor. |
| Control de versiones / CI | Este mismo repo de GitHub | Cada cambio de esquema o de la PWA se versiona acá, igual que las YAML de AppSheet hoy. |

**Por qué NO un backend 100% custom (Node/Express o FastAPI con
servidor propio):** técnicamente también resuelve el problema, pero
suma una pieza más para desplegar, versionar y mantener (el propio
servidor de API) sin beneficio real para este caso — Supabase ya da
API, auth, backups y panel de administración de tablas out-of-the-box.
Menos piezas = más sostenible para mantenimiento vía sesiones de IA.

**Por qué NO AppSheet conectado a una base SQL externa** (opción
intermedia que existe): requiere licencia AppSheet/Workspace
Enterprise Plus, que no está confirmada y probablemente no la
tienen. Se descarta por costo/incertidumbre de licencia.

## 4. Esquema relacional (mapeo desde las tablas actuales de AppSheet)

```
productos            (unifica MODELOS_REF + el futuro catálogo de bicicletas)
  id (PK)
  cod_mod             text unique
  tipo_producto        enum('MOTO','BICICLETA')
  nombre               text
  cilindrada           int null            -- solo motos
  rueda                text null
  prefijo_chasis       text null           -- solo motos, para el scan de Producción
  activo               boolean default true

materiales            (= MATERIALES_REF)
  id (PK)
  cod_material         text unique
  nombre               text
  categoria            text
  unidad               enum('UNIDAD','KG','LITRO','METRO')
  stock_minimo         numeric

bom                    (= BOM_REF)
  id (PK)
  producto_id           FK -> productos
  material_id           FK -> materiales
  cantidad_por_unidad   numeric
  critico               boolean
  UNIQUE(producto_id, material_id)

ubicaciones            (= UBICACIONES)
  id (PK)
  modulo                text
  nivel                 enum('PISO','NIVEL_1','NIVEL_2','NIVEL_3')
  zona                  text null
  estado                enum('LIBRE','OCUPADO')
  UNIQUE(modulo, nivel)

bultos                 (NUEVO — confirmado: dentro de un contenedor hay
                        bultos separados que conviene trackear aparte,
                        ej. "este pallet son 10 chasis", "esta caja
                        son 4 motores". Nivel intermedio entre el
                        contenedor (lote) y el material.)
  id (PK, uuid)
  lote                   FK -> recepciones_ckd
  codigo_bulto            text            -- escrito/etiqueta física del bulto (pallet/caja/huacal)
  tipo_bulto               text null       -- libre: 'PALLET','CAJA','HUACAL'... no crítico, solo informativo
  material_id              FK -> materiales
  cantidad_declarada       numeric         -- ej. 10 (chasis), 4 (motores)
  ubicacion_id             FK -> ubicaciones null
  estado                   enum('EN_TRANSITO','UBICADO','EN_CUARENTENA','CONSUMIDO')
  UNIQUE(lote, codigo_bulto)

deposito_movimientos   (= Deposito — kardex, append-only, NUNCA se edita ni borra)
  id (PK, bigserial)
  fecha                 date
  material_id            FK -> materiales
  tipo_movimiento        enum('ENTRADA','SALIDA','COMPLETO','INCOMPLETO','INTERVENIDO','RECLAMADO')
  cantidad               numeric
  lote                   text null          -- código de contenedor/remito del proveedor
  bulto_id                FK -> bultos null  -- de qué bulto puntual vino/salió esta cantidad
  proveedor_destino      text null
  ubicacion_id           FK -> ubicaciones null
  responsable            text null
  cod_op                 FK -> ordenes_produccion null
  obs                    text null
  created_at             timestamptz default now()

chasis_secuencias      (NUEVO — confirmado: los chasis llegan "en
                        cajas sin números", vírgenes. El número de
                        chasis NO viene de fábrica, se asigna acá
                        internamente. NO se confirmó que sea un VIN
                        legal/regulado — se mantiene la convención ya
                        usada en Producción, prefijo tipo "PPA1A"+
                        correlativo, NO el formato ISO 3779 de 17
                        caracteres con dígito verificador. Si en
                        algún momento se confirma que hace falta un
                        VIN legal real, esto se revisa.)
  producto_id (PK)        FK -> productos
  prefijo                 text             -- reutiliza productos.prefijo_chasis
  ultimo_numero           int default 0
  activo                  boolean default true

recepciones_ckd        (= RECEPCIONES_CKD)
  lote (PK)              text
  fecha                  date
  cod_op                 text null
  producto_id            FK -> productos
  cantidad_kits_declarada numeric
  responsable_qc         text null
  reclamo_abierto        boolean default false
  fecha_reclamo          date null
  obs_reclamo            text null
  obs                    text null

ordenes_produccion     (= ORDENES_PRODUCCION)
  cod_op (PK)            text
  fecha                  date
  producto_id            FK -> productos
  cantidad_a_producir    numeric
  estado                 enum('PENDIENTE','EN_PREPARACION','ENVIADO_A_LINEA','COMPLETADO')

picking_preparado       (única parte de PICKING_OP que necesita guardarse — lo "requerido" se calcula, ver vista)
  cod_op                 FK -> ordenes_produccion
  material_id             FK -> materiales
  cantidad_preparada      numeric default 0
  PRIMARY KEY (cod_op, material_id)
```

## 5. Asignación de número de chasis (función atómica, no un VIN legal)

Confirmado: los chasis llegan en bultos **sin ningún número** (vírgenes).
El número se asigna acá, la primera vez que un chasis se retira de un
bulto para armar una OP. Como pueden asignarse varios en simultáneo
(varios operarios armando kits a la vez), la asignación tiene que ser
atómica para no duplicar ni saltear números — el mismo patrón de
bloqueo `FOR UPDATE` del documento externo es correcto acá, pero
**sin el aparato de VIN legal** (no se confirmó que haga falta el
formato ISO 3779 de 17 caracteres con dígito verificador — se
mantiene la convención ya usada en `Producción`: prefijo tipo
`PPA1A` + correlativo).

```sql
CREATE OR REPLACE FUNCTION generar_numero_chasis(
    p_producto_id INT,
    p_bulto_id UUID,      -- bulto de chasis vírgenes del que se descuenta 1 unidad
    p_operador TEXT
) RETURNS TEXT AS $$
DECLARE
  v_ultimo INT;
  v_prefijo TEXT;
  v_numero TEXT;
  v_disponible NUMERIC;
BEGIN
  -- 1. Bloqueo de la secuencia del producto
  SELECT ultimo_numero, prefijo INTO v_ultimo, v_prefijo
  FROM chasis_secuencias
  WHERE producto_id = p_producto_id AND activo = TRUE
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No hay secuencia de numeración parametrizada para este producto';
  END IF;

  -- 2. Bloqueo y descuento de 1 chasis virgen del bulto indicado
  SELECT cantidad_declarada INTO v_disponible
  FROM bultos WHERE id = p_bulto_id AND estado != 'CONSUMIDO'
  FOR UPDATE;

  IF v_disponible IS NULL OR v_disponible < 1 THEN
    RAISE EXCEPTION 'No hay chasis vírgenes disponibles en el bulto indicado';
  END IF;

  UPDATE bultos SET cantidad_declarada = cantidad_declarada - 1,
    estado = CASE WHEN cantidad_declarada - 1 <= 0 THEN 'CONSUMIDO' ELSE estado END
  WHERE id = p_bulto_id;

  -- 3. Incrementar correlativo y armar el número
  v_ultimo := v_ultimo + 1;
  UPDATE chasis_secuencias SET ultimo_numero = v_ultimo WHERE producto_id = p_producto_id;
  v_numero := v_prefijo || LPAD(v_ultimo::TEXT, 8, '0');

  -- 4. Registro en kardex
  INSERT INTO deposito_movimientos (fecha, material_id, tipo_movimiento, cantidad, bulto_id, responsable, obs)
  VALUES (CURRENT_DATE, NULL, 'SALIDA', 1, p_bulto_id, p_operador, 'Asignación de número de chasis: ' || v_numero);

  RETURN v_numero;
END;
$$ LANGUAGE plpgsql;
```

> Si en algún momento se confirma que el número de chasis SÍ necesita
> ser un VIN legal (registro vehicular ante el gobierno), esta función
> se extiende para calcular el dígito verificador (ISO 3779) y
> encodear año/planta — no es un cambio estructural grande, pero hay
> que saberlo antes de imprimir/grabar el número en la pieza física.

## 6. Lo que en AppSheet eran "Bots"/columnas virtuales, acá son VIEWs

Ventaja grande de una base real: en vez de un Bot que inserta filas
en `CHEQUEO_RECEPCION` o `PICKING_OP` (con el riesgo de que no
dispare o quede desincronizado), esas tablas se reemplazan por
**vistas SQL calculadas al vuelo** — siempre consistentes, sin estado
duplicado que mantener.

```sql
-- Reemplaza CHEQUEO_RECEPCION (antes poblada por el Bot 1)
CREATE VIEW chequeo_recepcion AS
SELECT
  r.lote,
  b.material_id,
  b.cantidad_por_unidad * r.cantidad_kits_declarada AS cantidad_esperada,
  COALESCE(SUM(d.cantidad) FILTER (
    WHERE d.tipo_movimiento = 'ENTRADA' AND d.lote = r.lote AND d.material_id = b.material_id
  ), 0) AS cantidad_recibida,
  b.critico
FROM recepciones_ckd r
JOIN bom b ON b.producto_id = r.producto_id
LEFT JOIN deposito_movimientos d ON d.lote = r.lote AND d.material_id = b.material_id
GROUP BY r.lote, b.material_id, b.cantidad_por_unidad, r.cantidad_kits_declarada, b.critico;

-- Reemplaza el rollup STOCK_ACTUAL de MATERIALES_REF
CREATE VIEW stock_actual AS
SELECT
  material_id,
  SUM(CASE
    WHEN tipo_movimiento IN ('ENTRADA','COMPLETO') THEN cantidad
    ELSE -cantidad
  END) AS stock
FROM deposito_movimientos
GROUP BY material_id;

-- Reemplaza el "Reporte Mensual" (SALDO_INICIAL_MES...SALDO_FINAL_MES)
-- se resuelve con un filtro por rango de fechas sobre la misma lógica.

-- Reemplaza PICKING_OP.CANTIDAD_REQUERIDA (antes generada por el Bot 3)
CREATE VIEW picking_requerido AS
SELECT
  o.cod_op,
  b.material_id,
  b.cantidad_por_unidad * o.cantidad_a_producir AS cantidad_requerida
FROM ordenes_produccion o
JOIN bom b ON b.producto_id = o.producto_id;
```

`ESTADO_QC` de una recepción (PENDIENTE/OK/FALTANTES_MENORES/
FALTANTES_CRITICOS) y `REQUIERE_RECLAMO` se resuelven igual, con una
vista que agrega sobre `chequeo_recepcion`.

## 7. Plan de migración (fases)

1. **Crear el proyecto Supabase** y aplicar el esquema de la sección 4
   (como migraciones SQL versionadas en este repo, `backend/migrations/`).
2. **Migrar los catálogos** (materiales, productos/modelos, BOM,
   ubicaciones) desde las hojas actuales — son pocas filas, migración
   manual o script simple.
3. **Construir el frontend mínimo**: las 2-3 pantallas de mayor uso
   diario primero — Registrar Movimiento (Depósito) y Picking a
   Línea. El resto de las vistas de AppSheet se van migrando después.
4. **Correr en paralelo** con Sheets/AppSheets un tiempo corto, para
   validar que los números coincidan (stock, KPIs) antes de cortar.
5. **Apagar AppSheet** una vez validado. El histórico de Sheets queda
   archivado (exportado a CSV) por las dudas.

Este documento y el esquema quedan versionados acá para que
cualquier sesión futura (de IA o de un developer humano, si en algún
momento se suma uno) pueda retomar el trabajo sin perder contexto.

## 8. Costo estimado

- Supabase: plan gratuito cubre bastante para arrancar (500MB DB,
  50k usuarios activos/mes de auth); el plan Pro (~USD 25/mes) da
  más capacidad de DB y backups diarios — probablemente necesario
  apenas se migre el volumen real (miles de filas/mes).
- Vercel/Netlify: plan gratuito alcanza para el frontend.
- Total estimado para arrancar: **USD 0-25/mes**, muy por debajo del
  costo de un backend 100% custom con servidor propio.

## 9. Fuera de alcance (explícitamente descartado, no por olvido)

Se evaluó un segundo documento externo con una propuesta de WMS
industrial (LPN bajo GS1-128/DataMatrix con impresión térmica,
terminales PDA dedicadas Honeywell/Zebra, arquitectura offline con
SQLite local). Se tomaron las partes que aplicaban (bultos dentro de
un contenedor, asignación atómica de número de chasis) y se
descartó el resto, con esta justificación:

| Idea del documento | Por qué se descarta (por ahora) |
|---|---|
| PDAs dedicadas (Honeywell/Zebra) + impresora térmica ZT411 | Confirmado: van a seguir con el celular, no hay presupuesto/decisión de comprar hardware industrial. |
| Etiquetas GS1-128/DataMatrix impresas | Depende de tener impresora térmica — sin eso, no aplica. Si más adelante compran una, es un agregado menor (generar el DataMatrix es una librería, no un cambio de arquitectura). |
| VIN de 17 caracteres con dígito verificador (ISO 3779) | No se confirmó que el número de chasis sea un VIN legal — se implementa la versión simple (sección 5) hasta que se confirme lo contrario. |
| Arquitectura offline-first con SQLite local + cola de mutaciones | Pensada para PDAs con conectividad inestable en planta. Con celulares (navegador), un PWA con Service Worker + IndexedDB puede dar algo similar más adelante, pero no es parte del MVP — se evalúa si en la práctica hay problemas de señal en el galpón. |
| Máquina de estados completa por ítem individual (LPN_EN_TRANSITO, RESERVADO_KITTING, STAGING_LINEA, etc.) | Buena idea conceptual, pero es un nivel de granularidad mayor al de `bultos`/`deposito_movimientos` ya diseñado. Se deja como posible refinamiento futuro, no del MVP. |

Lo que SÍ se incorporó de ese documento (barato, sin nuevo hardware):
**`bultos`** (nivel intermedio pallet/caja entre contenedor y
material) y **`generar_numero_chasis()`** (asignación atómica sin
duplicados, versión simple sin VIN legal).

## 10. Próximo paso

Este documento es el diseño — falta **construir**. Cuando se confirme
que este diseño está bien, el siguiente paso es:
1. Crear el proyecto en Supabase (requiere que el cliente cree una
   cuenta — no se puede hacer por él).
2. Escribir las migraciones SQL de la sección 4 en este repo.
3. Scaffoldear el proyecto frontend (React + Vite + TS + Supabase
   client).
