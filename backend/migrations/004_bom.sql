-- ============================================================
-- bom — lista de materiales por producto (Bill of Materials)
-- (= BOM_REF en el diseño de AppSheet)
-- ============================================================

create table bom (
  id                     serial primary key,
  producto_id            int not null references productos(id),
  material_id            int not null references materiales(id),
  cantidad_por_unidad    numeric not null check (cantidad_por_unidad > 0),
  critico                boolean not null default false,
  unique (producto_id, material_id)
);

comment on table bom is
  'CRITICO confirmado (DUDAS_PENDIENTES #1): "todo lo que si falta no se puede armar la moto" — la mayoría de las líneas debería ser critico=true; false solo para lo opcional/no bloqueante.';
