/**
 * ============================================================
 * SETUP AUTOMÁTICO — App Producción de Motos
 * ============================================================
 * CÓMO USAR:
 *  1. Abrir Google Sheets en blanco
 *  2. Menú Extensiones → Apps Script
 *  3. Pegar TODO este código (borrar lo que haya antes)
 *  4. Clic en ▶ Run → seleccionar función "crearEstructura"
 *  5. Aceptar los permisos que pide Google
 *  6. Esperar ~10 segundos → la hoja queda lista
 *  7. Copiar la URL del Sheets para conectar en AppSheets
 * ============================================================
 */

function crearEstructura() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  crearHojaProduccion(ss);
  crearHojaModelosRef(ss);
  cargarDatosPrueba(ss);

  SpreadsheetApp.getUi().alert(
    '✅ Estructura creada correctamente.\n\n' +
    '• Hoja "Produccion" → lista para conectar a AppSheets\n' +
    '• Hoja "MODELOS_REF" → tabla de referencia de modelos\n' +
    '• Se cargaron 15 registros de prueba\n\n' +
    'Siguiente paso: ir a appsheet.com → New App → usar esta URL.'
  );
}

// ─────────────────────────────────────────────────────────────
// HOJA: Produccion
// ─────────────────────────────────────────────────────────────
function crearHojaProduccion(ss) {
  // Eliminar si ya existe para recrear limpia
  var hoja = ss.getSheetByName('Produccion');
  if (hoja) ss.deleteSheet(hoja);

  hoja = ss.insertSheet('Produccion', 0);

  // Encabezados exactos — no cambiar el orden ni los nombres
  var encabezados = [
    'FECHA', 'ID', 'CHASIS', 'MODELO', 'CILINDRADA',
    'NUM. MOTOR', 'COLOR', 'RUEDA', 'OBS',
    'COD MOD', 'COD MOTOR',
    'SEMANA', 'MES', 'AÑO', 'MES_LABEL',
    'ES_HOY', 'ES_ESTA_SEMANA', 'ES_ESTE_MES'
  ];

  var fila1 = hoja.getRange(1, 1, 1, encabezados.length);
  fila1.setValues([encabezados]);

  // Formato de encabezados
  fila1.setBackground('#1565C0')
       .setFontColor('#FFFFFF')
       .setFontWeight('bold')
       .setFontSize(10);

  // Ancho de columnas
  hoja.setColumnWidth(1, 100);   // FECHA
  hoja.setColumnWidth(2, 50);    // ID
  hoja.setColumnWidth(3, 200);   // CHASIS
  hoja.setColumnWidth(4, 140);   // MODELO
  hoja.setColumnWidth(5, 85);    // CILINDRADA
  hoja.setColumnWidth(6, 180);   // NUM. MOTOR
  hoja.setColumnWidth(7, 80);    // COLOR
  hoja.setColumnWidth(8, 90);    // RUEDA
  hoja.setColumnWidth(9, 200);   // OBS
  hoja.setColumnWidth(10, 80);   // COD MOD
  hoja.setColumnWidth(11, 100);  // COD MOTOR

  // Congelar fila de encabezados
  hoja.setFrozenRows(1);

  Logger.log('Hoja Produccion creada.');
}

// ─────────────────────────────────────────────────────────────
// HOJA: MODELOS_REF (tabla de referencia)
// ─────────────────────────────────────────────────────────────
function crearHojaModelosRef(ss) {
  var hoja = ss.getSheetByName('MODELOS_REF');
  if (hoja) ss.deleteSheet(hoja);

  hoja = ss.insertSheet('MODELOS_REF', 1);

  var encabezados = ['COD_MOD', 'MODELO', 'CILINDRADA', 'RUEDA', 'COD_MOTOR', 'PREFIJO_CHASIS'];
  var datos = [
    ['1A', 'Cub 110',         110, 'ALEACION', '1P52FMH', 'PPA1A'],
    ['BA', 'Urban 110',       110, 'RAYOS',    '1P52FMH', 'PPABA'],
    ['2B', 'VX125',           125, 'ALEACION', '1P53FMI', 'PPA2B'],
    ['AD', 'Super Sport 200', 200, 'ALEACION', '163FML',  'PPAAD'],
    ['EE', 'Rally 250',       250, 'RAYOS',    '165FMM',  'PPAEE'],
    ['GC', 'Faiter SE 150',   150, 'ALEACION', '162FMJ',  'PPAGC']
  ];

  var fila1 = hoja.getRange(1, 1, 1, encabezados.length);
  fila1.setValues([encabezados]);
  fila1.setBackground('#2E7D32')
       .setFontColor('#FFFFFF')
       .setFontWeight('bold');

  hoja.getRange(2, 1, datos.length, encabezados.length).setValues(datos);
  hoja.setFrozenRows(1);

  // Autoajustar columnas
  for (var i = 1; i <= encabezados.length; i++) {
    hoja.autoResizeColumn(i);
  }

  Logger.log('Hoja MODELOS_REF creada con ' + datos.length + ' modelos.');
}

// ─────────────────────────────────────────────────────────────
// DATOS DE PRUEBA — 15 registros realistas
// ─────────────────────────────────────────────────────────────
function cargarDatosPrueba(ss) {
  var hoja = ss.getSheetByName('Produccion');
  var hoy = new Date();

  // Función helper para restar días a hoy
  function diasAtras(n) {
    var d = new Date(hoy);
    d.setDate(d.getDate() - n);
    return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  // [FECHA, ID, CHASIS, MODELO, CILINDRADA, NUM. MOTOR, COLOR, RUEDA, OBS, COD MOD, COD MOTOR]
  var registros = [
    // Hoy (5 registros)
    [diasAtras(0), 1,  'PPA1A4E2TSB00601', 'Cub 110',         110, '1P52FMH S9B00601', 'NEGRO',    'ALEACION', '',               '1A', '1P52FMH'],
    [diasAtras(0), 2,  'PPABA4E3TSB00602', 'Urban 110',       110, '1P52FMH S9B00602', 'AZUL',     'RAYOS',    '',               'BA', '1P52FMH'],
    [diasAtras(0), 3,  'PPA2B4E4TSB00603', 'VX125',           125, '1P53FMI S9B00603', 'GRIS',     'ALEACION', '',               '2B', '1P53FMI'],
    [diasAtras(0), 4,  'PPAAD5E2TSB00604', 'Super Sport 200', 200, '163FML  S9B00604', 'NEGRO',    'ALEACION', '',               'AD', '163FML'],
    [diasAtras(0), 5,  'PPAEE5E3TSB00605', 'Rally 250',       250, '165FMM  S9B00605', 'ROJO',     'RAYOS',    'Prueba inicial', 'EE', '165FMM'],

    // Ayer (3 registros)
    [diasAtras(1), 6,  'PPAGC4E2TSB00606', 'Faiter SE 150',   150, '162FMJ  S9B00606', 'NEGRO',    'ALEACION', '',               'GC', '162FMJ'],
    [diasAtras(1), 7,  'PPA1A4E3TSB00607', 'Cub 110',         110, '1P52FMH S9B00607', 'NARANJA',  'ALEACION', '',               '1A', '1P52FMH'],
    [diasAtras(1), 8,  'PPABA4E4TSB00608', 'Urban 110',       110, '1P52FMH S9B00608', 'BLANCO',   'RAYOS',    '',               'BA', '1P52FMH'],

    // Hace 2 días (3 registros)
    [diasAtras(2), 9,  'PPA2B5E2TSB00609', 'VX125',           125, '1P53FMI S9B00609', 'NEGRO',    'ALEACION', '',               '2B', '1P53FMI'],
    [diasAtras(2), 10, 'PPA1A5E3TSB00610', 'Cub 110',         110, '1P52FMH S9B00610', 'AZUL',     'ALEACION', '',               '1A', '1P52FMH'],
    [diasAtras(2), 11, 'PPAAD5E4TSB00611', 'Super Sport 200', 200, '163FML  S9B00611', 'GRIS',     'ALEACION', '',               'AD', '163FML'],

    // Hace 5 días (2 registros)
    [diasAtras(5), 12, 'PPAEE5E5TSB00612', 'Rally 250',       250, '165FMM  S9B00612', 'NEGRO',    'RAYOS',    '',               'EE', '165FMM'],
    [diasAtras(5), 13, 'PPAGC4E3TSB00613', 'Faiter SE 150',   150, '162FMJ  S9B00613', 'ROJO',     'ALEACION', '',               'GC', '162FMJ'],

    // Hace 10 días (2 registros)
    [diasAtras(10), 14, 'PPA1A4E4TSB00614', 'Cub 110',        110, '1P52FMH S9B00614', 'NEGRO',   'ALEACION', '',               '1A', '1P52FMH'],
    [diasAtras(10), 15, 'PPABA5E2TSB00615', 'Urban 110',      110, '1P52FMH S9B00615', 'NARANJA', 'RAYOS',    '',               'BA', '1P52FMH'],
  ];

  hoja.getRange(2, 1, registros.length, 11).setValues(registros);

  // Formato de fecha en columna A
  hoja.getRange(2, 1, registros.length, 1)
      .setNumberFormat('yyyy-mm-dd');

  // Alternar colores de filas
  for (var i = 0; i < registros.length; i++) {
    var color = (i % 2 === 0) ? '#F5F5F5' : '#FFFFFF';
    hoja.getRange(i + 2, 1, 1, 11).setBackground(color);
  }

  Logger.log('Cargados ' + registros.length + ' registros de prueba.');
}

// ─────────────────────────────────────────────────────────────
// FUNCIÓN DE LIMPIEZA — borra solo los datos, no los encabezados
// Útil para reiniciar las pruebas
// ─────────────────────────────────────────────────────────────
function limpiarDatosPrueba() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName('Produccion');

  if (!hoja) {
    SpreadsheetApp.getUi().alert('No se encontró la hoja "Produccion".');
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
// FUNCIÓN DE VERIFICACIÓN — valida que no haya chasis ni motores duplicados
// ─────────────────────────────────────────────────────────────
function verificarDuplicados() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName('Produccion');

  if (!hoja) {
    SpreadsheetApp.getUi().alert('No se encontró la hoja "Produccion".');
    return;
  }

  var datos = hoja.getDataRange().getValues();
  if (datos.length <= 1) {
    SpreadsheetApp.getUi().alert('La hoja no tiene datos.');
    return;
  }

  // Índices de columnas (0-based): CHASIS=2, NUM.MOTOR=5
  var chasisVisto = {};
  var motorVisto = {};
  var errores = [];

  for (var i = 1; i < datos.length; i++) {
    var fila = i + 1;
    var chasis = datos[i][2];
    var motor = datos[i][5];

    if (chasis) {
      if (chasisVisto[chasis]) {
        errores.push('Fila ' + fila + ': CHASIS duplicado → ' + chasis + ' (ya en fila ' + chasisVisto[chasis] + ')');
      } else {
        chasisVisto[chasis] = fila;
      }
    }

    if (motor) {
      if (motorVisto[motor]) {
        errores.push('Fila ' + fila + ': MOTOR duplicado → ' + motor + ' (ya en fila ' + motorVisto[motor] + ')');
      } else {
        motorVisto[motor] = fila;
      }
    }
  }

  if (errores.length === 0) {
    SpreadsheetApp.getUi().alert('✅ Sin duplicados. ' + (datos.length - 1) + ' registros verificados.');
  } else {
    SpreadsheetApp.getUi().alert('⚠ Se encontraron ' + errores.length + ' duplicado(s):\n\n' + errores.join('\n'));
  }
}
