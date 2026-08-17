-- ============================================================
-- materiales — catálogo de materias primas
-- (= MATERIALES_REF en el diseño de AppSheet)
-- ============================================================

create type unidad_medida as enum ('UNIDAD', 'KG', 'LITRO', 'METRO');

create table materiales (
  id             serial primary key,
  cod_material   text not null unique,
  nombre         text not null,
  categoria      text null,
  unidad         unidad_medida not null,
  stock_minimo   numeric not null default 0,
  created_at     timestamptz not null default now()
);

comment on table materiales is
  'Categorías confirmadas para motos CKD: Plásticos, Motores, Partes de Chasis, Ventiladores CKD. El resto (rodado, eléctrico, pintura, etc.) son ejemplos sin confirmar del diseño original en AppSheet.';
