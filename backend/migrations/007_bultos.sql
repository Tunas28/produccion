-- ============================================================
-- bultos — nivel intermedio entre contenedor (lote) y material
-- Confirmado (DUDAS_PENDIENTES #17): dentro de un contenedor hay
-- bultos separados que conviene trackear aparte (ej. "este pallet
-- son 10 chasis", "esta caja son 4 motores").
-- ============================================================

create type estado_bulto as enum ('EN_TRANSITO', 'UBICADO', 'EN_CUARENTENA', 'CONSUMIDO');

create table bultos (
  id                    uuid primary key default gen_random_uuid(),
  lote                  text not null references recepciones_ckd(lote),
  codigo_bulto          text not null,        -- etiqueta física del bulto (pallet/caja/huacal)
  tipo_bulto            text null,            -- libre: 'PALLET', 'CAJA', 'HUACAL'... solo informativo
  material_id           int not null references materiales(id),
  cantidad_declarada    numeric not null check (cantidad_declarada >= 0),
  ubicacion_id          int null references ubicaciones(id),
  estado                estado_bulto not null default 'EN_TRANSITO',
  created_at            timestamptz not null default now(),
  unique (lote, codigo_bulto)
);

comment on table bultos is
  'cantidad_declarada se va descontando a medida que se retiran unidades (ej. al generar_numero_chasis()); estado pasa a CONSUMIDO cuando llega a 0.';
