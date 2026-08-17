-- ============================================================
-- productos — catálogo unificado de motos + bicicletas
-- (= MODELOS_REF en el diseño de AppSheet, más TIPO_PRODUCTO)
-- ============================================================

create type tipo_producto as enum ('MOTO', 'BICICLETA');

create table productos (
  id               serial primary key,
  cod_mod          text not null unique,
  tipo_producto    tipo_producto not null,
  nombre           text not null,
  cilindrada       int null,           -- solo motos
  rueda            text null,          -- ALEACION / RAYOS, si aplica
  prefijo_chasis   text null,          -- solo motos, para generar_numero_chasis()
  activo           boolean not null default true,
  created_at       timestamptz not null default now()
);

comment on table productos is
  'Catálogo de modelos de moto y bicicleta. DUDAS_PENDIENTES #13 (3 modelos reales de moto) y #14/#15 (catálogo de bicicletas) todavía están abiertas — cargar acá cuando se confirmen.';
