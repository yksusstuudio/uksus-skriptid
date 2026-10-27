/**
 * Kuu harjutuse uuendaja
 *
 * Toob sinu skriptide uued versioonid ise sinu tabelite Apps Scripti (Kuu harjutus, hinnalugeja jt)
 * ja uuendab ka iseennast. Kood on sinu privaatses GitHubi hoidlas, mida uuendaja loeb lugemisvõtmega.
 * Mida uuendada, on kirjas sealses failis uuendaja.json.
 * Vahetab ainult seal nimetatud faile. Teised failid jäävad täpselt samaks.
 *
 * Ühekordne seadistus:
 *  1. Pane alumistele ridadele jutumärkide vahele oma tabeli skripti ID ja GitHubi lugemisvõti.
 *     Pärast esimest käivitust jäävad need meelde ja uuendaja uued versioonid neid ridu enam ei vaja.
 *  2. Vali ülal funktsioon „paigalda“, vajuta Käivita ja luba ligipääs.
 */
var SKRIPTI_ID = 'PANE_SIIA_SKRIPTI_ID';
var GITHUBI_VOTI = 'PANE_SIIA_GITHUBI_VOTI';

var HOIDLA = 'https://api.github.com/repos/yksusstuudio/uksus-skriptid/contents/';
var SEADED = 'uuendaja.json';

function paigalda() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'uuenda') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('uuenda').timeBased().everyMinutes(15).create();
  var tulemus = uuenda();
  Logger.log('Valmis. ' + tulemus);
}

function uuenda() {
  var lukk = LockService.getScriptLock();
  if (!lukk.tryLock(1000)) return 'Teine uuendus juba käib.';
  try {
    return uuenda_();
  } catch (e) {
    teataViga_(String(e && e.message || e));
    throw e;
  } finally {
    lukk.releaseLock();
  }
}

// Projekti ID: TABEL = Eriku tabeli skript (meeles skripti seadetes), ISE = see uuendaja, muidu ID ise.
function projektiId_(nimi, omad) {
  if (nimi === 'ISE') return ScriptApp.getScriptId();
  if (nimi === 'TABEL') return omad.getProperty('TABEL_ID');
  return nimi;
}

function uuenda_() {
  var omad = PropertiesService.getScriptProperties();
  if (/^[A-Za-z0-9_-]{20,}$/.test(SKRIPTI_ID) && SKRIPTI_ID.indexOf('PANE_SIIA') < 0) omad.setProperty('TABEL_ID', SKRIPTI_ID);   // jääb meelde ka pärast enda uuendust
  if (/^(github_pat_|ghp_)\w{20,}$/.test(GITHUBI_VOTI)) omad.setProperty('GITHUBI_VOTI', GITHUBI_VOTI);
  if (!omad.getProperty('GITHUBI_VOTI')) throw new Error('GitHubi lugemisvõti on panemata. Kirjuta see koodi ülaossa GITHUBI_VOTI reale.');
  var tabel = omad.getProperty('TABEL_ID');
  if (!tabel) throw new Error('Skripti ID on panemata. Kirjuta see koodi ülaossa SKRIPTI_ID reale.');
  if (tabel === ScriptApp.getScriptId()) {
    throw new Error('Uuendaja peab olema eraldi projektis, mitte tabeli skripti sees. Tee see uues projektis: https://script.google.com/home/projects/create');
  }
  if (omad.getProperty('rasi') && !omad.getProperty('rasi:Kuu harjutus')) {                // vana uuendaja mälu
    omad.setProperty('rasi:Kuu harjutus', omad.getProperty('rasi'));
    omad.deleteProperty('rasi');
  }

  var seaded = JSON.parse(lae_(SEADED));
  var uued = [];                                             // { s: sihtmärk, tekst, rasi }
  seaded.sihtmargid.forEach(function (s) {
    var tekst = lae_(s.allikas);
    if ((s.tunnus && tekst.indexOf(s.tunnus) < 0) || !lopugaa_(tekst, s.lopp)) {
      throw new Error('„' + s.nimi + '“: allalaaditud kood on poolik, jätsin vana alles.');
    }
    var rasi = rasi_(tekst);
    if (omad.getProperty('rasi:' + s.nimi) !== rasi) uued.push({ s: s, tekst: tekst, rasi: rasi });
  });
  if (!uued.length) return 'Uut versiooni pole.';

  // Iga projekt korraga: üks lugemine, üks kirjutamine. Uuendaja ise viimasena.
  var projektid = [];
  uued.forEach(function (u) { if (projektid.indexOf(u.s.projekt) < 0) projektid.push(u.s.projekt); });
  projektid.sort(function (a, b) { return (a === 'ISE') - (b === 'ISE'); });
  var tehtud = [];
  projektid.forEach(function (pr) {
    var id = projektiId_(pr, omad);
    var siin = uued.filter(function (u) { return u.s.projekt === pr; });
    var failid = loeProjekt_(id);
    var muutus = false;
    siin.forEach(function (u) {
      var f = leiaFail_(failid, u.s);
      var tekst = peidetud_(u, f.source, omad);
      if (f.source !== tekst) { f.source = tekst; muutus = true; tehtud.push(u.s.nimi); }
    });
    if (muutus) kirjutaProjekt_(id, failid);
    siin.forEach(function (u) { omad.setProperty('rasi:' + u.s.nimi, u.rasi); });
  });

  omad.deleteProperty('viga');
  if (!tehtud.length) return 'Uued versioonid olid juba sees.';
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Skriptid on uuendatud: ' + tehtud.join(', '),
    'Uus versioon on sees: ' + tehtud.join(', ') + '. Sinult pole midagi vaja teha.\n\nTeisi faile ma ei puutunud.');
  return 'Uuendasin: ' + tehtud.join(', ') + '.';
}

// Avalikus koodis on mõne väärtuse asemel kohatäide (nt „Bilans 2026“ tabeli ID). Päris väärtus võetakse esimesel korral
// praegusest failist ja hoitakse uuendaja seadetes; kirjutades pannakse see kohatäite asemele tagasi.
function peidetud_(u, praegu, omad) {
  var tekst = u.tekst;
  (u.s.peidetud || []).forEach(function (p) {
    var voti = 'peidus:' + p.kohataide, vaartus = omad.getProperty(voti);
    if (!vaartus) {
      var m = new RegExp(p.muster).exec(praegu);
      if (!m) throw new Error('„' + u.s.nimi + '“: ei leidnud praegusest failist väärtust ' + p.kohataide + ', jätsin vana alles.');
      vaartus = m[1];
      omad.setProperty(voti, vaartus);
    }
    tekst = tekst.split(p.kohataide).join(vaartus);
  });
  return tekst;
}

function lae_(tee) {
  var voti = PropertiesService.getScriptProperties().getProperty('GITHUBI_VOTI');
  var r = UrlFetchApp.fetch(HOIDLA + encodeURI(tee) + '?ref=main', { muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + voti, Accept: 'application/vnd.github.raw', 'X-GitHub-Api-Version': '2022-11-28' } });
  if (r.getResponseCode() === 401) throw new Error('GitHubi lugemisvõti ei kehti enam (aegus või kustutati). Tee uus võti ja kirjuta see koodi ülaossa GITHUBI_VOTI reale, siis käivita „paigalda“.');
  if (r.getResponseCode() !== 200) throw new Error('Faili ' + tee + ' ei saanud GitHubist kätte (kood ' + r.getResponseCode() + ').');
  return r.getContentText('UTF-8');
}

// Viimane rida peab sisaldama lõpumärki: siis on fail tervikuna kohal.
function lopugaa_(tekst, lopp) {
  var read = tekst.replace(/\s+$/, '').split('\n');
  return !!lopp && read[read.length - 1].indexOf(lopp) >= 0;
}

function leiaFail_(failid, s) {
  var leitud = failid.filter(function (f) {
    return f.type === 'SERVER_JS' && (s.tunnus ? String(f.source).indexOf(s.tunnus) >= 0 : f.name === s.fail);
  });
  if (leitud.length !== 1) {
    throw new Error(leitud.length
      ? 'Skriptis on ' + leitud.length + ' faili „' + s.nimi + '“ jaoks. Jäta alles üks ja kustuta teised.'
      : 'Skriptis pole faili „' + (s.fail || s.nimi) + '“. Kontrolli skripti ID-d ja faili nime.');
  }
  return leitud[0];
}

function loeProjekt_(id) {
  var r = UrlFetchApp.fetch('https://script.googleapis.com/v1/projects/' + id + '/content',
    { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error(apiViga_(r));
  return (JSON.parse(r.getContentText()).files || []).map(function (f) { return { name: f.name, type: f.type, source: f.source }; });
}

function kirjutaProjekt_(id, failid) {
  var r = UrlFetchApp.fetch('https://script.googleapis.com/v1/projects/' + id + '/content', {
    method: 'put', contentType: 'application/json', headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: JSON.stringify({ files: failid }), muteHttpExceptions: true
  });
  if (r.getResponseCode() !== 200) throw new Error(apiViga_(r));
}

function rasi_(tekst) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, tekst, Utilities.Charset.UTF_8));
}

function apiViga_(r) {
  var tekst = r.getContentText();
  if (r.getResponseCode() === 403 && /has not been used in project|SERVICE_DISABLED/i.test(tekst)) {
    return 'Selle uuendaja Google Cloudi projektis on Apps Script API sisse lülitamata (vaata seadistuslehe Google Cloudi samme). Google: ' + tekst.slice(0, 300);
  }
  if (r.getResponseCode() === 403 && /Apps Script API/i.test(tekst)) {
    return 'Apps Script API on välja lülitatud. Lülita see sisse: https://script.google.com/home/usersettings (Google: ' + tekst.slice(0, 200) + ')';
  }
  if (r.getResponseCode() === 404) return 'Sellise ID-ga skripti ei leitud. Kontrolli skripti ID-d.';
  return 'Google vastas veaga ' + r.getResponseCode() + ': ' + tekst.slice(0, 300);
}

// Sama vea kohta saadab kirja ainult ühe korra, et postkast ei täituks.
function teataViga_(tekst) {
  var omad = PropertiesService.getScriptProperties();
  if (omad.getProperty('viga') === tekst) return;
  omad.setProperty('viga', tekst);
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Kuu harjutuse uuendaja: uuendus jäi tegemata',
    tekst + '\n\nVanad skriptid töötavad edasi nagu enne.');
}

// ================================================================ UUENDAJA LÕPP
