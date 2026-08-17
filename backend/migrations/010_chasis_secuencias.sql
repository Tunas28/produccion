-- ============================================================
-- chasis_secuencias + generar_numero_chasis()
-- Confirmado (DUDAS_PENDIENTES #16): los chasis llegan "en cajas sin
-- números" (vírgenes). El número se asigna acá, internamente. NO se
-- confirmó que sea un VIN legal (ISO 3779) — se usa la convención ya
-- existente: prefijo (ej. "PPA1A") + correlativo de 8 dígitos.
-- ============================================================

create table chasis_secuencias (
  producto_id     int primary key references productos(id),
  prefijo         text not null,          -- reutiliza productos.prefijo_chasis
  ultimo_numero   int not null default 0,
  activo          boolean not null default true
);

create or replace function generar_numero_chasis(
    p_producto_id int,
    p_bulto_id uuid,
    p_operador text
) returns text as $$
declare
  v_ultimo int;
  v_prefijo text;
  v_numero text;
  v_disponible numeric;
begin
  -- 1. Bloqueo de la secuencia del producto (evita duplicados/saltos con varios operarios en simultáneo)
  select ultimo_numero, prefijo into v_ultimo, v_prefijo
  from chasis_secuencias
  where producto_id = p_producto_id and activo = true
  for update;

  if not found then
    raise exception 'No hay secuencia de numeración parametrizada para el producto %', p_producto_id;
  end if;

  -- 2. Bloqueo y descuento de 1 chasis virgen del bulto indicado
  select cantidad_declarada into v_disponible
  from bultos
  where id = p_bulto_id and estado != 'CONSUMIDO'
  for update;

  if v_disponible is null or v_disponible < 1 then
    raise exception 'No hay chasis vírgenes disponibles en el bulto %', p_bulto_id;
  end if;

  update bultos
  set cantidad_declarada = cantidad_declarada - 1,
      estado = case when cantidad_declarada - 1 <= 0 then 'CONSUMIDO'::estado_bulto else estado end
  where id = p_bulto_id;

  -- 3. Incrementar correlativo y armar el número
  v_ultimo := v_ultimo + 1;
  update chasis_secuencias set ultimo_numero = v_ultimo where producto_id = p_producto_id;
  v_numero := v_prefijo || lpad(v_ultimo::text, 8, '0');

  -- 4. Registro en el kardex (material_id null: no es un movimiento de material, es de identidad)
  insert into deposito_movimientos (fecha, material_id, tipo_movimiento, cantidad, bulto_id, responsable, obs)
  values (current_date, null, 'SALIDA', 1, p_bulto_id, p_operador, 'Asignación de número de chasis: ' || v_numero);

  return v_numero;
end;
$$ language plpgsql;

comment on function generar_numero_chasis is
  'Si en algún momento se confirma que el número de chasis necesita validez legal de VIN, extender para calcular el dígito verificador ISO 3779 y encodear año/planta antes de grabarlo en la pieza física.';
