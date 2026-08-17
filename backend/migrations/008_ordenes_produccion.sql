-- ============================================================
-- ordenes_produccion — encabezado de OP: modelo + cantidad a producir
-- (= ORDENES_PRODUCCION en el diseño de AppSheet)
-- Confirmado: no existe ningún proceso de OP hoy (#6, nace acá),
-- 1 sola línea de ensamble por ahora (#7, no hace falta LINEA_DESTINO).
-- ============================================================

create type estado_op as enum ('PENDIENTE', 'EN_PREPARACION', 'ENVIADO_A_LINEA', 'COMPLETADO');

create table ordenes_produccion (
  cod_op                 text primary key,
  fecha                  date not null default current_date,
  producto_id            int not null references productos(id),
  cantidad_a_producir    numeric not null check (cantidad_a_producir > 0),
  estado                 estado_op not null default 'PENDIENTE',
  created_at             timestamptz not null default now()
);

-- picking_preparado — única parte de PICKING_OP que necesita guardarse.
-- Lo "requerido" se calcula en la vista picking_requerido (ver 011_vistas.sql).
create table picking_preparado (
  cod_op               text not null references ordenes_produccion(cod_op),
  material_id          int not null references materiales(id),
  cantidad_preparada   numeric not null default 0,
  primary key (cod_op, material_id)
);
