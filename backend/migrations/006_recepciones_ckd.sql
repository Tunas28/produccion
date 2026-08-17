-- ============================================================
-- recepciones_ckd — un registro por contenedor/ASN de CKD recibido
-- (= RECEPCIONES_CKD en el diseño de AppSheet)
-- Confirmado: LOTE lo asigna el proveedor en el remito (#3), un
-- solo modelo por contenedor (#4), ante faltantes críticos se abre
-- reclamo al proveedor, no se rechaza el contenedor (#5).
-- ============================================================

create table recepciones_ckd (
  lote                        text primary key,   -- código de contenedor/remito, lo asigna el proveedor
  fecha                       date not null default current_date,
  cod_op                      text null,
  producto_id                 int not null references productos(id),
  cantidad_kits_declarada     numeric not null check (cantidad_kits_declarada > 0),
  responsable_qc              text null,
  reclamo_abierto             boolean not null default false,
  fecha_reclamo               date null,
  obs_reclamo                 text null,
  obs                         text null,
  created_at                  timestamptz not null default now()
);
