# Migraciones SQL

Esquema completo del backend, tal como está diseñado en
[`../DISENO.md`](../DISENO.md). Pensado para pegar y correr en el
**SQL Editor de Supabase** (Project → SQL Editor → New query), en
orden, una vez que exista el proyecto.

Si más adelante se instala la CLI de Supabase (`supabase`), estos
mismos archivos se pueden mover a `supabase/migrations/` con el
prefijo de timestamp que pide la CLI — por ahora, sin CLI, alcanza
con correrlos a mano en orden.

## Orden de ejecución

1. `001_extensiones.sql` — extensiones de Postgres que usa el esquema
2. `002_productos.sql` — catálogo de motos + bicicletas (unificado)
3. `003_materiales.sql` — catálogo de materiales
4. `004_bom.sql` — lista de materiales por producto
5. `005_ubicaciones.sql` — racks (módulo × nivel)
6. `006_recepciones_ckd.sql` — recepción de contenedores CKD
7. `007_bultos.sql` — bultos dentro de un contenedor (referencia recepciones_ckd)
8. `008_ordenes_produccion.sql` + `picking_preparado`
9. `009_deposito_movimientos.sql` — kardex (tabla central, append-only)
10. `010_chasis_secuencias.sql` + función `generar_numero_chasis()`
11. `011_vistas.sql` — reemplazo de los "Bots"/columnas virtuales de AppSheet (stock, última ubicación, reporte mensual, chequeo de recepción, estado QC, picking)

## Estado

✅ Las 11 migraciones se corrieron y probaron contra un Postgres 16
real (local, de prueba) con datos de ejemplo: alta de producto,
materiales, BOM, recepción con un faltante no crítico, generación de
2 números de chasis desde un bulto, consumo del bulto hasta
`CONSUMIDO`, y verificación de que un 9° intento sobre un bulto de 10
falla correctamente ("no hay chasis disponibles"). Las vistas
(`stock_actual`, `chequeo_recepcion`, `recepciones_estado`,
`picking_op`, `reporte_mensual`, `ultima_ubicacion`) devolvieron los
valores esperados en todos los casos.

⚠ Lo que NO se probó porque no existe todavía: correrlas contra un
proyecto real de **Supabase** (la prueba fue con Postgres genérico).
Falta también cargar datos reales (catálogo de motos/bicicletas —
ver `columnas/DUDAS_PENDIENTES.yaml` #13-15 — y materiales reales en
vez de los 3 de ejemplo usados en la prueba).

## Nota sobre `deposito_movimientos.material_id` nulo

El único caso donde `material_id` puede ser `null` en el kardex es el
movimiento que genera `generar_numero_chasis()` (es un evento de
identidad, no de material) — todo lo demás siempre debe tener
material asociado.
