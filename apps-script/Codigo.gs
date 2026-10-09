/**
 * FAN · Avisos de compra del banco desde Gmail
 *
 * Qué hace: busca en tu Gmail los correos del remitente indicado, toma de cada uno la frase del
 * aviso ("compra por $… en … el dd/mm/aaaa hh:mm") y se la entrega a la app FAN cuando esta la pide.
 * Solo lee: no modifica, no envía ni borra correos.
 *
 * Cómo se publica: Implementar → Nueva implementación → Aplicación web,
 * con "Ejecutar como: Yo" y "Quién tiene acceso: Cualquier usuario".
 */
var REMITENTE = 'enviodigital@bancochile.cl';
var DIAS_MAX = 120;
var PATRON = /compra\s+por\s.{1,260}?\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}/gi;

// FAN llama a esta función al abrir la app. Responde con los avisos de los últimos días.
function doGet(e) {
  var dias = parseInt(e && e.parameter && e.parameter.dias, 10);
  if (!(dias >= 1)) dias = 30;
  if (dias > DIAS_MAX) dias = DIAS_MAX;
  var salida;
  try {
    salida = { ok: true, dias: dias, avisos: leerAvisos(dias) };
  } catch (err) {
    salida = { ok: false, error: String((err && err.message) || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(salida)).setMimeType(ContentService.MimeType.JSON);
}

function leerAvisos(dias) {
  var desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
  var consulta = 'from:' + REMITENTE + ' newer_than:' + dias + 'd';
  var avisos = [], vistos = {};
  for (var inicio = 0; inicio < 400; inicio += 100) {
    var hilos = GmailApp.search(consulta, inicio, 100);
    GmailApp.getMessagesForThreads(hilos).forEach(function (mensajes) {
      mensajes.forEach(function (m) {
        if (m.getDate() < desde) return;
        if (String(m.getFrom()).toLowerCase().indexOf(REMITENTE) < 0) return;
        var hallados = limpiar(m.getPlainBody()).match(PATRON) || limpiar(m.getBody()).match(PATRON) || [];
        hallados.forEach(function (frase) {
          if (!vistos[frase]) { vistos[frase] = true; avisos.push(frase); }
        });
      });
    });
    if (hilos.length < 100) break;
  }
  return avisos;
}

function limpiar(texto) {
  return String(texto || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#36;|&dollar;/gi, '$')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ');
}

// Para probar desde el editor: elige "probar" arriba, toca Ejecutar y mira el registro de ejecución.
function probar() {
  var avisos = leerAvisos(30);
  Logger.log(avisos.length + ' avisos de compra en los últimos 30 días');
  avisos.forEach(function (frase) { Logger.log(frase); });
}
