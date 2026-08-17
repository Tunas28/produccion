/**
 * ============================================================
 * SETUP AUTOMÁTICO — Depósito de Materia Prima
 * ============================================================
 * CÓMO USAR:
 *  1. Abrir el mismo Google Sheets "Produccion" (o uno nuevo)
 *  2. Menú Extensiones → Apps Script
 *  3. Crear un archivo nuevo (o pegar debajo del setup.gs existente)
 *  4. Pegar TODO este código
 *  5. Clic en ▶ Run → seleccionar función "crearEstructuraDeposito"
 *  6. Aceptar los permisos que pide Google
 *  7. Esperar ~10 segundos → las hojas quedan listas
 *  8. Copiar la URL del Sheets para conectar/actualizar en AppSheets
 * ============================================================
 */

function crearEstructuraDeposito() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  crearHojaDeposito(ss);
  crearHojaMaterialesRef(ss);
  cargarDatosPruebaDeposito(ss);

  SpreadsheetApp.getUi().alert(
    '✅ Estructura de Depósito creada correctamente.\n\n' +
    '• Hoja "Deposito" → kardex de movimientos, lista para conectar a AppSheets\n' +
    '• Hoja "MATERIALES_REF" → tabla de referencia de materiales y stock\n' +
    '• Se cargaron movimientos de prueba\n\n' +
    'Siguiente paso: en AppSheets, Data → Add new table, para agregar ambas hojas.'
  );
}

// ─────────────────────────────────────────────────────────────
// HOJA: Deposito
// ─────────────────────────────────────────────────────────────
function crearHojaDeposito(ss) {
  var hoja = ss.getSheetByName('Deposito');
  if (hoja) ss.deleteSheet(hoja);

  hoja = ss.insertSheet('Deposito', 2);

  // Encabezados exactos — no cambiar el orden ni los nombres
  var encabezados = [
    'FECHA', 'ID', 'COD_MATERIAL', 'MATERIAL', 'UNIDAD',
    'TIPO_MOVIMIENTO', 'CANTIDAD', 'LOTE', 'PROVEEDOR_DESTINO',
    'RESPONSABLE', 'OBS', 'EFECTO_STOCK',
    'SEMANA', 'MES', 'AÑO', 'MES_LABEL',
    'ES_HOY', 'ES_ESTA_SEMANA', 'ES_ESTE_MES'
  ];

  var fila1 = hoja.getRange(1, 1, 1, encabezados.length);
  fila1.setValues([encabezados]);

  fila1.setBackground('#1565C0')
       .setFontColor('#FFFFFF')
       .setFontWeight('bold')
       .setFontSize(10);

  hoja.setColumnWidth(1, 100);   // FECHA
  hoja.setColumnWidth(2, 50);    // ID
  hoja.setColumnWidth(3, 100);   // COD_MATERIAL
  hoja.setColumnWidth(4, 150);   // MATERIAL
  hoja.setColumnWidth(5, 80);    // UNIDAD
  hoja.setColumnWidth(6, 120);   // TIPO_MOVIMIENTO
  hoja.setColumnWidth(7, 90);    // CANTIDAD
  hoja.setColumnWidth(8, 120);   // LOTE
  hoja.setColumnWidth(9, 160);   // PROVEEDOR_DESTINO
  hoja.setColumnWidth(10, 120);  // RESPONSABLE
  hoja.setColumnWidth(11, 200);  // OBS

  hoja.setFrozenRows(1);

  Logger.log('Hoja Deposito creada.');
}

// ─────────────────────────────────────────────────────────────
// HOJA: MATERIALES_REF (tabla de referencia)
// ─────────────────────────────────────────────────────────────
function crearHojaMaterialesRef(ss) {
  var hoja = ss.getSheetByName('MATERIALES_REF');
  if (hoja) ss.deleteSheet(hoja);

  hoja = ss.insertSheet('MATERIALES_REF', 3);

  var encabezados = ['COD_MATERIAL', 'MATERIAL', 'CATEGORIA', 'UNIDAD', 'STOCK_MINIMO'];
  var datos = [
    ['CH01',  'Chasis',              'Estructura', 'UNIDAD', 20],
    ['MT01',  'Motor',               'Motor',      'UNIDAD', 20],
    ['PIN01', 'Pintura',             'Pintura',    'LITRO',  50],
    ['NEU01', 'Neumático',           'Rodado',     'UNIDAD', 40],
    ['LLA01', 'Llanta/Rin',          'Rodado',     'UNIDAD', 40],
    ['BAT01', 'Batería',             'Eléctrico',  'UNIDAD', 20],
    ['CAB01', 'Cableado',            'Eléctrico',  'METRO',  200],
    ['TOR01', 'Tornillería',         'Insumos',    'KG',     30],
    ['ASI01', 'Asiento',             'Carrocería', 'UNIDAD', 20],
    ['TAN01', 'Tanque combustible',  'Carrocería', 'UNIDAD', 20]
  ];
  // ⚠ Materiales de EJEMPLO — reemplazar por los reales del depósito.

  var fila1 = hoja.getRange(1, 1, 1, encabezados.length);
  fila1.setValues([encabezados]);
  fila1.setBackground('#2E7D32')
       .setFontColor('#FFFFFF')
       .setFontWeight('bold');

  hoja.getRange(2, 1, datos.length, encabezados.length).setValues(datos);
  hoja.setFrozenRows(1);

  for (var i = 1; i <= encabezados.length; i++) {
    hoja.autoResizeColumn(i);
  }

  Logger.log('Hoja MATERIALES_REF creada con ' + datos.length + ' materiales.');
}

// ─────────────────────────────────────────────────────────────
// DATOS DE PRUEBA — movimientos realistas de los 6 tipos
// ─────────────────────────────────────────────────────────────
function cargarDatosPruebaDeposito(ss) {
  var hoja = ss.getSheetByName('Deposito');
  var hoy = new Date();

  function diasAtras(n) {
    var d = new Date(hoy);
    d.setDate(d.getDate() - n);
    return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  // [FECHA, ID, COD_MATERIAL, MATERIAL, UNIDAD, TIPO_MOVIMIENTO, CANTIDAD, LOTE, PROVEEDOR_DESTINO, RESPONSABLE, OBS]
  var registros = [
    [diasAtras(10), 1, 'CH01',  'Chasis',             'UNIDAD', 'ENTRADA',     50, 'LOTE-0001', 'Proveedor Chasis SA',  'Juan Pérez', ''],
    [diasAtras(10), 2, 'MT01',  'Motor',               'UNIDAD', 'ENTRADA',     50, 'LOTE-0002', 'Proveedor Motores SA', 'Juan Pérez', ''],
    [diasAtras(9),  3, 'PIN01', 'Pintura',              'LITRO',  'ENTRADA',    120, 'LOTE-0003', 'Pinturas del Sur',    'Ana Gómez',  ''],
    [diasAtras(8),  4, 'NEU01', 'Neumático',            'UNIDAD', 'ENTRADA',    80, 'LOTE-0004', 'Neumáticos SRL',      'Ana Gómez',  ''],
    [diasAtras(7),  5, 'CH01',  'Chasis',               'UNIDAD', 'INCOMPLETO', 3,  'LOTE-0001', '',                    'Juan Pérez', 'Faltaron 3 unidades en la recepción'],
    [diasAtras(6),  6, 'MT01',  'Motor',                'UNIDAD', 'INTERVENIDO', 2, 'LOTE-0002', '',                    'Carlos Ruiz', 'Se retiraron 2 motores para peritaje'],
    [diasAtras(5),  7, 'CH01',  'Chasis',               'UNIDAD', 'SALIDA',     20, '',           'Línea de producción', 'Carlos Ruiz', ''],
    [diasAtras(5),  8, 'MT01',  'Motor',                'UNIDAD', 'SALIDA',     20, '',           'Línea de producción', 'Carlos Ruiz', ''],
    [diasAtras(4),  9, 'PIN01', 'Pintura',              'LITRO',  'SALIDA',     30, '',           'Línea de pintura',    'Ana Gómez',  ''],
    [diasAtras(3),  10, 'CH01', 'Chasis',               'UNIDAD', 'COMPLETO',   3,  'LOTE-0001', 'Proveedor Chasis SA', 'Juan Pérez', 'Reposición de las 3 unidades faltantes'],
    [diasAtras(2),  11, 'NEU01', 'Neumático',           'UNIDAD', 'RECLAMADO',  5,  'LOTE-0004', 'Neumáticos SRL',      'Ana Gómez',  'Defecto de fabricación, devuelto al proveedor'],
    [diasAtras(1),  12, 'BAT01', 'Batería',             'UNIDAD', 'ENTRADA',    30, 'LOTE-0005', 'Baterías Norte',      'Juan Pérez', ''],
    [diasAtras(0),  13, 'LLA01', 'Llanta/Rin',          'UNIDAD', 'ENTRADA',    40, 'LOTE-0006', 'Rines y Llantas SA',  'Ana Gómez',  ''],
    [diasAtras(0),  14, 'BAT01', 'Batería',             'UNIDAD', 'SALIDA',     10, '',           'Línea de producción', 'Carlos Ruiz', '']
  ];

  hoja.getRange(2, 1, registros.length, 11).setValues(registros);

  // EFECTO_STOCK, SEMANA, MES, AÑO, MES_LABEL, ES_HOY, ES_ESTA_SEMANA, ES_ESTE_MES
  // son columnas virtuales/App formula en AppSheets: no se cargan por script.

  hoja.getRange(2, 1, registros.length, 1)
      .setNumberFormat('yyyy-mm-dd');

  for (var i = 0; i < registros.length; i++) {
    var color = (i % 2 === 0) ? '#F5F5F5' : '#FFFFFF';
    hoja.getRange(i + 2, 1, 1, 11).setBackground(color);
  }

  Logger.log('Cargados ' + registros.length + ' movimientos de prueba.');
}

// ─────────────────────────────────────────────────────────────
// FUNCIÓN DE LIMPIEZA — borra solo los datos, no los encabezados
// ─────────────────────────────────────────────────────────────
function limpiarDatosPruebaDeposito() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName('Deposito');

  if (!hoja) {
    SpreadsheetApp.getUi().alert('No se encontró la hoja "Deposito".');
    return;
  }

  var ultimaFila = hoja.getLastRow();
  if (ultimaFila > 1) {
    hoja.getRange(2, 1, ultimaFila - 1, hoja.getLastColumn()).clearContent();
    SpreadsheetApp.getUi().alert('Datos borrados. La hoja quedó lista para nuevas pruebas.');
  } else {
    SpreadsheetApp.getUi().alert('La hoja ya estaba vacía.');
  }
}

// ─────────────────────────────────────────────────────────────
// FUNCIÓN DE VERIFICACIÓN — alerta materiales con stock negativo
// (calculado localmente en Apps Script, replica la fórmula EFECTO_STOCK)
// ─────────────────────────────────────────────────────────────
function verificarStockNegativo() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaDep = ss.getSheetByName('Deposito');
  var hojaMat = ss.getSheetByName('MATERIALES_REF');

  if (!hojaDep || !hojaMat) {
    SpreadsheetApp.getUi().alert('Faltan las hojas "Deposito" y/o "MATERIALES_REF".');
    return;
  }

  var suma = { ENTRADA: 1, COMPLETO: 1, SALIDA: -1, INCOMPLETO: -1, INTERVENIDO: -1, RECLAMADO: -1 };

  var datosDep = hojaDep.getDataRange().getValues();
  var stock = {};
  for (var i = 1; i < datosDep.length; i++) {
    var cod = datosDep[i][2];       // COD_MATERIAL
    var tipo = datosDep[i][5];      // TIPO_MOVIMIENTO
    var cantidad = datosDep[i][6];  // CANTIDAD
    if (!cod) continue;
    var signo = suma[tipo] || 0;
    stock[cod] = (stock[cod] || 0) + signo * cantidad;
  }

  var datosMat = hojaMat.getDataRange().getValues();
  var alertas = [];
  for (var j = 1; j < datosMat.length; j++) {
    var codMat = datosMat[j][0];
    var nombre = datosMat[j][1];
    var actual = stock[codMat] || 0;
    if (actual < 0) {
      alertas.push(nombre + ' (' + codMat + '): stock ' + actual);
    }
  }

  if (alertas.length === 0) {
    SpreadsheetApp.getUi().alert('✅ Sin materiales en stock negativo.');
  } else {
    SpreadsheetApp.getUi().alert('⚠ Materiales con stock negativo:\n\n' + alertas.join('\n'));
  }
}
