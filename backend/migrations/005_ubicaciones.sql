-- ============================================================
-- ubicaciones — racks del depósito, módulo × nivel
-- (= UBICACIONES en el diseño de AppSheet)
-- Confirmado: la ubicación es ROTATIVA (no fija por material) y
-- cada módulo de rack tiene el piso más 3 niveles encima.
-- ============================================================

create type nivel_rack as enum ('PISO', 'NIVEL_1', 'NIVEL_2', 'NIVEL_3');
create type estado_ubicacion as enum ('LIBRE', 'OCUPADO');

create table ubicaciones (
  id           serial primary key,
  modulo       text not null,
  nivel        nivel_rack not null,
  zona         text null,
  estado       estado_ubicacion not null default 'LIBRE',
  unique (modulo, nivel)
);

comment on table ubicaciones is
  'Arranca vacía. Cargar con INSERT INTO ubicaciones (modulo, nivel, zona) SELECT ''A-1'', unnest(enum_range(NULL::nivel_rack)), ''Motos CKD''; (o similar) por cada módulo real.';
