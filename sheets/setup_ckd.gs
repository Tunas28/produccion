/**
 * ============================================================
 * SETUP AUTOMÁTICO — Recepción CKD / BOM / Kitting (DISEÑO)
 * ============================================================
 * ⚠ ARQUITECTURA CAMBIADA: se decidió migrar a un backend propio
 *   (PostgreSQL/Supabase) por el volumen real del negocio — ver
 *   backend/DISENO.md. Este script de AppSheet queda como
 *   REFERENCIA del modelo de datos original, no como el plan de
 *   implementación final.
 *
 * ⚠ La hoja DUDAS_PENDIENTES que arma este script tiene solo las
 *   primeras 15 preguntas y puede estar desactualizada en sus
 *   respuestas — columnas/DUDAS_PENDIENTES.yaml es la fuente de
 *   verdad (ya tiene 18 preguntas, la mayoría respondidas).
 *
 * CÓMO USAR:
 *  1. Abrir el mismo Google Sheets "Produccion"
 *  2. Menú Extensiones → Apps Script
 *  3. Crear un archivo nuevo, pegar TODO este código
 *  4. Clic en ▶ Run → seleccionar función "crearEstructuraCKD"
 *  5. Aceptar los permisos que pide Google
 *  6. Ir primero a la hoja "DUDAS_PENDIENTES" y empezar a
 *     responder — cada respuesta puede requerir ajustar BOM_REF
 *     u otra hoja antes de conectar todo a AppSheets.
 * ============================================================
 */

function crearEstructuraCKD() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  crearHojaBOM(ss);
  crearHojaRecepcionesCKD(ss);
  crearHojaChequeoRecepcion(ss);
  crearHojaOrdenesProduccion(ss);
  crearHojaPickingOP(ss);
  crearHojaDudasPendientes(ss);

  SpreadsheetApp.getUi().alert(
    '✅ Estructura CKD/BOM/Kitting creada (borrador).\n\n' +
    '• BOM_REF, RECEPCIONES_CKD, CHEQUEO_RECEPCION\n' +
    '• ORDENES_PRODUCCION, PICKING_OP\n' +
    '• DUDAS_PENDIENTES — 15 preguntas de diseño (2 respondidas)\n\n' +
    '⚠ Empezar por DUDAS_PENDIENTES antes de conectar esto a AppSheets:\n' +
    'varias respuestas pueden cambiar las tablas.\n\n' +
    'Los Bots (CHEQUEO_RECEPCION y PICKING_OP se auto-completan) se\n' +
    'configuran en AppSheets → Automation, ver expresiones/ckd_bots.yaml.'
  );
}

// ─────────────────────────────────────────────────────────────
// HOJA: BOM_REF
// ─────────────────────────────────────────────────────────────
function crearHojaBOM(ss) {
  var hoja = ss.getSheetByName('BOM_REF');
  if (hoja) ss.deleteSheet(hoja);
  hoja = ss.insertSheet('BOM_REF');

  var encabezados = ['ID_BOM', 'COD_MOD', 'COD_MATERIAL', 'CANTIDAD_POR_UNIDAD', 'CRITICO'];
  var datos = [
    ['1A-CH01', '1A', 'CH01',  1,   true],
    ['1A-MT01', '1A', 'MT01',  1,   true],
    ['1A-PLA01','1A', 'PLA01', 1,   false],
    ['1A-VEN01','1A', 'VEN01', 1,   true],
    ['1A-NEU01','1A', 'NEU01', 2,   false],
    ['1A-BAT01','1A', 'BAT01', 1,   true],
    ['BA-CH01', 'BA', 'CH01',  1,   true],
    ['BA-MT01', 'BA', 'MT01',  1,   true],
    ['BA-PLA01','BA', 'PLA01', 1,   false],
    ['BA-LLA01','BA', 'LLA01', 2,   false],
    ['2B-CH01', '2B', 'CH01',  1,   true],
    ['2B-MT01', '2B', 'MT01',  1,   true],
    ['2B-VEN01','2B', 'VEN01', 1,   true],
    ['2B-PIN01','2B', 'PIN01', 0.5, false]
  ];
  // ⚠ BOM de EJEMPLO — COD_MOD "1A"/"BA"/"2B" son los 3 modelos
  //   PLACEHOLDER de MODELOS_REF, NO los 3 modelos reales de moto CKD
  //   confirmados (ver DUDAS_PENDIENTES #13). Completar con las piezas
  //   y modelos reales antes de usar esto en producción.

  escribirEncabezado(hoja, encabezados, '#455A64');
  hoja.getRange(2, 1, datos.length, encabezados.length).setValues(datos);
  hoja.setFrozenRows(1);
  Logger.log('Hoja BOM_REF creada con ' + datos.length + ' líneas.');
}

// ─────────────────────────────────────────────────────────────
// HOJA: RECEPCIONES_CKD (vacía, se carga desde la app)
// ─────────────────────────────────────────────────────────────
function crearHojaRecepcionesCKD(ss) {
  var hoja = ss.getSheetByName('RECEPCIONES_CKD');
  if (hoja) ss.deleteSheet(hoja);
  hoja = ss.insertSheet('RECEPCIONES_CKD');

  var encabezados = [
    'LOTE', 'FECHA', 'COD_OP', 'COD_MOD', 'CANTIDAD_KITS_DECLARADA',
    'RESPONSABLE_QC', 'OBS', 'RECLAMO_ABIERTO', 'FECHA_RECLAMO', 'OBS_RECLAMO',
    'ESTADO_QC', 'PIEZAS_FALTANTES', 'REQUIERE_RECLAMO'
  ];
  escribirEncabezado(hoja, encabezados, '#1565C0');
  hoja.setFrozenRows(1);
  Logger.log('Hoja RECEPCIONES_CKD creada (vacía).');
}

// ─────────────────────────────────────────────────────────────
// HOJA: CHEQUEO_RECEPCION (vacía — la puebla el Bot 1)
// ─────────────────────────────────────────────────────────────
function crearHojaChequeoRecepcion(ss) {
  var hoja = ss.getSheetByName('CHEQUEO_RECEPCION');
  if (hoja) ss.deleteSheet(hoja);
  hoja = ss.insertSheet('CHEQUEO_RECEPCION');

  var encabezados = [
    'ID_CHEQUEO', 'LOTE', 'COD_MATERIAL', 'CANTIDAD_ESPERADA',
    'CANTIDAD_RECIBIDA', 'FALTANTE', 'CRITICO'
  ];
  escribirEncabezado(hoja, encabezados, '#2E7D32');
  hoja.setFrozenRows(1);
  Logger.log('Hoja CHEQUEO_RECEPCION creada (vacía, la puebla el Bot).');
}

// ─────────────────────────────────────────────────────────────
// HOJA: ORDENES_PRODUCCION (vacía, se carga desde la app)
// ─────────────────────────────────────────────────────────────
function crearHojaOrdenesProduccion(ss) {
  var hoja = ss.getSheetByName('ORDENES_PRODUCCION');
  if (hoja) ss.deleteSheet(hoja);
  hoja = ss.insertSheet('ORDENES_PRODUCCION');

  var encabezados = [
    'COD_OP', 'FECHA', 'COD_MOD', 'CANTIDAD_A_PRODUCIR', 'ESTADO',
    'OBS', 'MATERIALES_FALTANTES_PICKING'
  ];
  escribirEncabezado(hoja, encabezados, '#1565C0');
  hoja.setFrozenRows(1);
  Logger.log('Hoja ORDENES_PRODUCCION creada (vacía).');
}

// ─────────────────────────────────────────────────────────────
// HOJA: PICKING_OP (vacía — la puebla el Bot 3)
// ─────────────────────────────────────────────────────────────
function crearHojaPickingOP(ss) {
  var hoja = ss.getSheetByName('PICKING_OP');
  if (hoja) ss.deleteSheet(hoja);
  hoja = ss.insertSheet('PICKING_OP');

  var encabezados = [
    'ID_PICKING', 'COD_OP', 'COD_MATERIAL', 'CANTIDAD_REQUERIDA',
    'CANTIDAD_PREPARADA', 'UBICACION', 'COMPLETO'
  ];
  escribirEncabezado(hoja, encabezados, '#2E7D32');
  hoja.setFrozenRows(1);
  Logger.log('Hoja PICKING_OP creada (vacía, la puebla el Bot).');
}

// ─────────────────────────────────────────────────────────────
// HOJA: DUDAS_PENDIENTES — 15 preguntas de diseño (13-15 agregadas
// tras la primera ronda de respuestas del cliente sobre ubicación
// rotativa, categorías de materiales CKD y bicicletas)
// ─────────────────────────────────────────────────────────────
function crearHojaDudasPendientes(ss) {
  var hoja = ss.getSheetByName('DUDAS_PENDIENTES');
  if (hoja) ss.deleteSheet(hoja);
  hoja = ss.insertSheet('DUDAS_PENDIENTES', 0); // primera hoja, para que se vea de entrada

  var encabezados = ['ID', 'CATEGORIA', 'PREGUNTA', 'POR_QUE_IMPORTA', 'ESTADO', 'RESPUESTA'];
  var datos = [
    [1, 'BOM / Piezas críticas',
      '¿Qué se considera "pieza crítica"? ¿Lo definís vos material por material, o hay ya un criterio/checklist de calidad de la empresa?',
      'Define cómo se completa la columna CRITICO en BOM_REF.', 'ABIERTA', ''],

    [2, 'BOM / Piezas críticas',
      '¿Cuántas piezas distintas lleva realmente un modelo dentro de cada categoría confirmada (plásticos, motores, partes de chasis, ventiladores CKD)?',
      'BOM_REF hoy tiene solo 1 SKU de ejemplo por categoría. Falta el detalle real (probablemente 15-30+ ítems por modelo).', 'PARCIAL',
      'PARCIAL: se confirmaron las 4 categorías para motos CKD (3 modelos). Falta el detalle de SKUs, cantidades y cuáles son críticas.'],

    [3, 'Recepción CKD',
      'El código de contenedor (LOTE), ¿lo asigna el proveedor en el remito/ASN, o lo generan ustedes al recibirlo?',
      'Define si LOTE sigue siendo texto libre escaneable o necesita un generador correlativo propio.', 'ABIERTA', ''],

    [4, 'Recepción CKD',
      '¿Un contenedor siempre trae piezas para UN solo modelo, o vienen varios modelos mezclados en el mismo contenedor?',
      'Si es mixto, RECEPCIONES_CKD.COD_MOD (un solo modelo por recepción) no alcanza y hay que rediseñar a nivel de líneas por modelo.', 'ABIERTA', ''],

    [5, 'Recepción CKD',
      'Cuando el QC detecta faltantes críticos, ¿qué pasa en la práctica? ¿Se rechaza todo el contenedor, se acepta con nota, se abre reclamo?',
      'Define si hace falta un estado adicional en ESTADO_QC (ej. RECHAZADO) y una vista/acción para el reclamo.', 'ABIERTA', ''],

    [6, 'Orden de Producción',
      'Hoy, ¿cómo se genera la Orden de Producción (OP)? ¿Manual en papel/Excel, o ya existe en algún sistema?',
      'Define si COD_OP se sigue cargando a mano en ORDENES_PRODUCCION o conviene importarlo desde otro lado.', 'ABIERTA', ''],

    [7, 'Orden de Producción',
      '¿Cuántas líneas de ensamble simultáneas hay en la planta?',
      'Si hay más de una línea, PICKING_OP necesitaría un campo LINEA_DESTINO.', 'ABIERTA', ''],

    [8, 'Depósito / Ubicación',
      'La ubicación en estantería, ¿es fija por material o rota según espacio disponible?',
      'Si rota, un campo de texto fijo no alcanza — habría que trackearla como parte de cada movimiento.', 'RESPONDIDA',
      'Rotativa: "en rack que no son fijos, según se liberan se va ocupando". Implementado: tabla UBICACIONES + Deposito.UBICACION por movimiento + MATERIALES_REF.ULTIMA_UBICACION (orientativa).'],

    [9, 'Depósito / Ubicación',
      '¿Quién arma el kit físicamente hoy? ¿Un operario con lista impresa, con tablet, o hay transporte automático?',
      "Confirma si la vista 'Picking a Línea' en celular/tablet alcanza o hace falta otra interfaz.", 'ABIERTA', ''],

    [10, 'Trazabilidad y calidad',
      'El material de referencia menciona trazabilidad de qué operario y qué herramienta ajustó cada pieza — mucho más fino que lo que hoy registra Producción.',
      '¿Vale la pena ese nivel de detalle, o alcanza con RESPONSABLE en cada movimiento de depósito?', 'ABIERTA', ''],

    [11, 'OEE / paradas de línea',
      'Para las métricas OEE (paradas, cuellos de botella): ¿hoy miden tiempos de parada de alguna forma?',
      'Sheets/AppSheets no sirve para captura en tiempo real de eventos de máquina — si hace falta, es otra herramienta.', 'ABIERTA', ''],

    [12, 'Escala / performance',
      'Con 20-100 motos/día, Deposito puede acumular miles de filas al año y las fórmulas SUM(SELECT(...)) se ponen lentas.',
      '¿Está bien archivar movimientos de más de N meses a una hoja histórica, o necesitan todo siempre "vivo"?', 'ABIERTA', ''],

    [13, 'Catálogo de Productos',
      'Confirmado: son 3 modelos de moto CKD (no 6). ¿Cuáles son los 3 modelos reales — nombres, cilindrada, código/prefijo de chasis? MODELOS_REF y BOM_REF todavía tienen los 6 modelos de EJEMPLO originales del repo, nunca confirmados como reales.',
      'Hay que reemplazar MODELOS_REF y BOM_REF por los 3 modelos reales — todo lo que referencia COD_MOD depende de esto.', 'ABIERTA', ''],

    [14, 'Catálogo de Productos',
      'Bicicletas (~24 modelos): ¿comparten el mismo depósito/materiales que las motos, o es una zona/inventario separado? ¿También llegan como CKD con BOM y recepción/QC, o se arman/compran distinto?',
      'Define la arquitectura: catálogo unificado (MODELOS_REF con TIPO_PRODUCTO=MOTO/BICICLETA) compartiendo Deposito/BOM_REF, o un sistema paralelo tipo BICICLETAS_REF + BOM_BICICLETAS + depósito propio. Decisión de mayor impacto pendiente.', 'ABIERTA', ''],

    [15, 'Catálogo de Productos',
      'Para bicicletas, ¿armo ya la estructura de tablas con un par de modelos de ejemplo (como se hizo con motos), o esperamos a tener la lista real de los ~24 modelos?',
      'Evita fabricar 24 modelos y BOM inventados de la nada — mejor confirmar alcance antes de generar datos de ejemplo que después haya que descartar.', 'ABIERTA', '']
  ];

  escribirEncabezado(hoja, encabezados, '#B71C1C');
  hoja.getRange(2, 1, datos.length, encabezados.length).setValues(datos);
  hoja.setFrozenRows(1);
  hoja.setColumnWidth(3, 420); // PREGUNTA
  hoja.setColumnWidth(4, 420); // POR_QUE_IMPORTA
  hoja.setColumnWidth(6, 300); // RESPUESTA
  hoja.getRange(2, 3, datos.length, 2).setWrap(true);

  Logger.log('Hoja DUDAS_PENDIENTES creada con ' + datos.length + ' preguntas.');
}

// ─────────────────────────────────────────────────────────────
// Helper de formato de encabezado, reutilizado por todas las hojas
// ─────────────────────────────────────────────────────────────
function escribirEncabezado(hoja, encabezados, colorFondo) {
  var fila1 = hoja.getRange(1, 1, 1, encabezados.length);
  fila1.setValues([encabezados]);
  fila1.setBackground(colorFondo)
       .setFontColor('#FFFFFF')
       .setFontWeight('bold')
       .setFontSize(10);
  for (var i = 1; i <= encabezados.length; i++) {
    hoja.autoResizeColumn(i);
  }
}
