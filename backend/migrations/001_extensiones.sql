-- ============================================================
-- Extensiones de Postgres requeridas por el esquema
-- ============================================================

-- gen_random_uuid() para las claves primarias UUID (bultos)
create extension if not exists pgcrypto;
