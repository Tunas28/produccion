-- ============================================================
-- Vistas — reemplazan los "Bots" y columnas virtuales de AppSheet.
-- Se calculan al vuelo, sin estado duplicado que mantener sincronizado.
-- ============================================================

-- Reemplaza MATERIALES_REF.STOCK_ACTUAL (rollup)
create view stock_actual as
select
  m.id as material_id,
  m.cod_material,
  m.nombre,
  coalesce(sum(case
    when d.tipo_movimiento in ('ENTRADA', 'COMPLETO') then d.cantidad
    when d.tipo_movimiento in ('SALIDA', 'INCOMPLETO', 'INTERVENIDO', 'RECLAMADO') then -d.cantidad
    else 0
  end), 0) as stock,
  m.stock_minimo,
  (coalesce(sum(case
    when d.tipo_movimiento in ('ENTRADA', 'COMPLETO') then d.cantidad
    when d.tipo_movimiento in ('SALIDA', 'INCOMPLETO', 'INTERVENIDO', 'RECLAMADO') then -d.cantidad
    else 0
  end), 0)) < m.stock_minimo as bajo_minimo
from materiales m
left join deposito_movimientos d on d.material_id = m.id
group by m.id, m.cod_material, m.nombre, m.stock_minimo;

-- Reemplaza MATERIALES_REF.ULTIMA_UBICACION
create view ultima_ubicacion as
select distinct on (d.material_id)
  d.material_id,
  u.modulo || '-' || u.nivel as ubicacion
from deposito_movimientos d
join ubicaciones u on u.id = d.ubicacion_id
where d.tipo_movimiento = 'ENTRADA' and d.ubicacion_id is not null
order by d.material_id, d.id desc;

-- Reemplaza el "Reporte Mensual" (SALDO_INICIAL_MES..SALDO_FINAL_MES)
-- Parámetro implícito: filtrar el resultado por rango de fechas desde
-- el cliente/API (ej. WHERE fecha >= date_trunc('month', now())).
create view reporte_mensual as
select
  m.id as material_id,
  m.cod_material,
  m.nombre,
  date_trunc('month', d.fecha)::date as mes,
  sum(d.cantidad) filter (where d.tipo_movimiento = 'ENTRADA') as entradas,
  sum(d.cantidad) filter (where d.tipo_movimiento = 'SALIDA') as salidas,
  sum(case
    when d.tipo_movimiento in ('COMPLETO') then d.cantidad
    when d.tipo_movimiento in ('INCOMPLETO', 'INTERVENIDO', 'RECLAMADO') then -d.cantidad
    else 0
  end) filter (where d.tipo_movimiento in ('COMPLETO', 'INCOMPLETO', 'INTERVENIDO', 'RECLAMADO')) as ajustes
from materiales m
join deposito_movimientos d on d.material_id = m.id
group by m.id, m.cod_material, m.nombre, date_trunc('month', d.fecha);

-- Reemplaza CHEQUEO_RECEPCION (antes poblada por el Bot 1 de AppSheet)
create view chequeo_recepcion as
select
  r.lote,
  b.material_id,
  mat.cod_material,
  b.cantidad_por_unidad * r.cantidad_kits_declarada as cantidad_esperada,
  coalesce(sum(d.cantidad) filter (
    where d.tipo_movimiento = 'ENTRADA' and d.lote = r.lote and d.material_id = b.material_id
  ), 0) as cantidad_recibida,
  (b.cantidad_por_unidad * r.cantidad_kits_declarada)
    - coalesce(sum(d.cantidad) filter (
        where d.tipo_movimiento = 'ENTRADA' and d.lote = r.lote and d.material_id = b.material_id
      ), 0) as faltante,
  b.critico
from recepciones_ckd r
join bom b on b.producto_id = r.producto_id
join materiales mat on mat.id = b.material_id
left join deposito_movimientos d on d.lote = r.lote and d.material_id = b.material_id
group by r.lote, b.material_id, mat.cod_material, b.cantidad_por_unidad, r.cantidad_kits_declarada, b.critico;

-- Reemplaza RECEPCIONES_CKD.ESTADO_QC / PIEZAS_FALTANTES / REQUIERE_RECLAMO
create view recepciones_estado as
select
  r.lote,
  r.reclamo_abierto,
  count(c.*) filter (where c.faltante > 0) as piezas_faltantes,
  count(c.*) filter (where c.faltante > 0 and c.critico) as piezas_criticas_faltantes,
  case
    when count(c.*) = 0 then 'PENDIENTE'
    when count(c.*) filter (where c.faltante > 0 and c.critico) > 0 then 'FALTANTES_CRITICOS'
    when count(c.*) filter (where c.faltante > 0) > 0 then 'FALTANTES_MENORES'
    else 'OK'
  end as estado_qc,
  (count(c.*) filter (where c.faltante > 0 and c.critico) > 0 and not r.reclamo_abierto) as requiere_reclamo
from recepciones_ckd r
left join chequeo_recepcion c on c.lote = r.lote
group by r.lote, r.reclamo_abierto;

-- Reemplaza PICKING_OP.CANTIDAD_REQUERIDA (antes generada por el Bot 3)
-- + UBICACION (vía ultima_ubicacion) + COMPLETO, uniendo con lo ya
-- preparado en picking_preparado.
create view picking_op as
select
  o.cod_op,
  b.material_id,
  mat.cod_material,
  b.cantidad_por_unidad * o.cantidad_a_producir as cantidad_requerida,
  coalesce(p.cantidad_preparada, 0) as cantidad_preparada,
  u.ubicacion,
  coalesce(p.cantidad_preparada, 0) >= (b.cantidad_por_unidad * o.cantidad_a_producir) as completo
from ordenes_produccion o
join bom b on b.producto_id = o.producto_id
join materiales mat on mat.id = b.material_id
left join picking_preparado p on p.cod_op = o.cod_op and p.material_id = b.material_id
left join ultima_ubicacion u on u.material_id = b.material_id;
