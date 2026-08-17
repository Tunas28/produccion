-- ============================================================
-- deposito_movimientos — kardex de movimientos, APPEND-ONLY
-- (= Deposito en el diseño de AppSheet)
-- Nunca se edita ni se borra una fila ya insertada: para corregir
-- un error se carga un movimiento nuevo que lo compense.
-- ============================================================

create type tipo_movimiento as enum (
  'ENTRADA', 'SALIDA', 'COMPLETO', 'INCOMPLETO', 'INTERVENIDO', 'RECLAMADO'
);

create table deposito_movimientos (
  id                  bigserial primary key,
  fecha               date not null default current_date,
  material_id         int null references materiales(id),  -- null solo en el movimiento especial de asignación de chasis (ver 010)
  tipo_movimiento     tipo_movimiento not null,
  cantidad            numeric not null check (cantidad > 0),
  lote                text null references recepciones_ckd(lote),
  bulto_id            uuid null references bultos(id),
  proveedor_destino   text null,
  ubicacion_id        int null references ubicaciones(id),
  responsable         text null,
  cod_op              text null references ordenes_produccion(cod_op),
  mutation_id         uuid null,   -- idempotencia: evita duplicar si el cliente reintenta un guardado offline
  obs                 text null,
  created_at          timestamptz not null default now()
);

create index idx_deposito_material on deposito_movimientos (material_id);
create index idx_deposito_lote on deposito_movimientos (lote);
create index idx_deposito_fecha on deposito_movimientos (fecha);
create unique index idx_deposito_mutation_id on deposito_movimientos (mutation_id) where mutation_id is not null;

comment on table deposito_movimientos is
  'Convención de signo (EFECTO_STOCK): ENTRADA y COMPLETO suman stock; SALIDA, INCOMPLETO, INTERVENIDO y RECLAMADO restan. Ver vista stock_actual.';
