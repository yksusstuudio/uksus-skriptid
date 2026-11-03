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
var VAHE = 1;                                                // mitme minuti järel kontrollib (Erik 27.10: et oleks kohe)
var OIGUSE_OOTUS = 30;                                       // kui skriptile pole ligipääsu, proovib sellega uuesti alles mitme minuti pärast
var AJUTINE_TUNDE = 24;                                      // ajutisest tõrkest (503 jms) kirjutab alles siis, kui see kestab nii mitu tundi

function paigalda() {
  PropertiesService.getScriptProperties().deleteProperty('vahe');
  kaivitus_();
  var tulemus = uuenda();
  Logger.log('Valmis. ' + tulemus);
}

function uuenda() {
  var lukk = LockService.getScriptLock();
  if (!lukk.tryLock(1000)) return 'Teine uuendus juba käib.';
  try {
    kaivitus_();
    return uuenda_();
  } catch (e) {
    if (onAjutine_(e, 'üldine')) return 'Ajutine tõrge, proovin järgmisel minutil uuesti: ' + e.message;
    teataViga_('üldine:' + (e && e.voti || String(e && e.message || e)), String(e && e.message || e));
    throw e;
  } finally {
    lukk.releaseLock();
  }
}

// Kontrolli ajastus. Uuendaja uus versioon saab vahet muuta ilma, et Erik peaks „paigalda“ uuesti käivitama.
function kaivitus_() {
  var omad = PropertiesService.getScriptProperties();
  if (omad.getProperty('vahe') === String(VAHE)) return;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'uuenda') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('uuenda').timeBased().everyMinutes(VAHE).create();
  omad.setProperty('vahe', String(VAHE));
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

  // Iga minut: üks väike päring. Kui hoidlas pole uut muudatust, rohkem midagi ei tehta.
  var muudatus = lae_('', 'https://api.github.com/repos/yksusstuudio/uksus-skriptid/commits/main', 'application/vnd.github.sha').trim();
  if (muudatus && omad.getProperty('muudatus') === muudatus) return 'Uut versiooni pole.';

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
  if (!uued.length) { korras_('üldine'); omad.setProperty('muudatus', muudatus); return 'Uut versiooni pole.'; }

  // Iga projekt korraga: üks lugemine, üks kirjutamine. Uuendaja ise viimasena.
  var projektid = [];
  uued.forEach(function (u) { if (projektid.indexOf(u.s.projekt) < 0) projektid.push(u.s.projekt); });
  projektid.sort(function (a, b) { return (a === 'ISE') - (b === 'ISE'); });
  var tehtud = [], vead = [], ootel = false;
  projektid.forEach(function (pr) {
    var siin = uued.filter(function (u) { return u.s.projekt === pr; });
    var nimi = siin.map(function (u) { return u.s.nimi; }).join(', ');
    if (Number(omad.getProperty('oota:' + pr) || 0) > Date.now()) { ootel = true; return; }   // ligipääs puudus hiljuti, ei koputa iga minut
    try {                                                    // ühe skripti viga ei peata teiste uuendamist
      var id = projektiId_(pr, omad);
      var failid = loeProjekt_(id);
      var muutus = false, nimed = [];
      siin.forEach(function (u) {
        var f = leiaFail_(failid, u.s);
        var tekst = peidetud_(u, f.source, omad);
        if (f.source !== tekst) { f.source = tekst; muutus = true; nimed.push(u.s.nimi); }
      });
      if (muutus) kirjutaProjekt_(id, failid);
      tehtud = tehtud.concat(nimed);
      siin.forEach(function (u) { omad.setProperty('rasi:' + u.s.nimi, u.rasi); });
      korras_(pr);
    } catch (e) {
      var tekst = String(e && e.message || e);
      vead.push('„' + nimi + '“: ' + tekst);
      if (onAjutine_(e, pr)) return;                         // 503 jms: vaikselt uuesti järgmisel minutil
      if (e && e.liik === 'oigus') {
        omad.setProperty('oota:' + pr, String(Date.now() + OIGUSE_OOTUS * 60000));
        teataViga_(pr + ':oigus', oiguseJuhis_(nimi, projektiId_(pr, omad)));
      } else {
        teataViga_(pr + ':' + (e && e.voti || tekst), '„' + nimi + '“: ' + tekst);
      }
    }
  });

  if (vead.length || ootel) {                                // proovib uuesti; kiri sama vea kohta ainult üks kord
    return (tehtud.length ? 'Uuendasin: ' + tehtud.join(', ') + '. ' : '') +
      (vead.length ? 'Vead: ' + vead.join(' | ') : 'Mõni skript ootab ligipääsu.');
  }
  korras_('üldine');
  omad.setProperty('muudatus', muudatus);
  if (!tehtud.length) return 'Uued versioonid olid juba sees.';
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

function lae_(tee, aadress, kuju) {
  var voti = PropertiesService.getScriptProperties().getProperty('GITHUBI_VOTI');
  var r = paring_(aadress || HOIDLA + encodeURI(tee) + '?ref=main', { muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + voti, Accept: kuju || 'application/vnd.github.raw', 'X-GitHub-Api-Version': '2022-11-28' } });
  if (r.getResponseCode() >= 500 || r.getResponseCode() === 429) throw viga_('GitHub oli hetkel kättesaamatu (kood ' + r.getResponseCode() + ').', 'ajutine');
  if (r.getResponseCode() === 401) throw new Error('GitHubi lugemisvõti ei kehti enam (aegus või kustutati). Tee uus võti ja kirjuta see koodi ülaossa GITHUBI_VOTI reale, siis käivita „paigalda“.');
  if (r.getResponseCode() !== 200) throw new Error('Faili ' + (tee || 'muudatuste nimekiri') + ' ei saanud GitHubist kätte (kood ' + r.getResponseCode() + ').');
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
  var r = paring_('https://script.googleapis.com/v1/projects/' + id + '/content',
    { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw apiViga_(r);
  return (JSON.parse(r.getContentText()).files || []).map(function (f) { return { name: f.name, type: f.type, source: f.source }; });
}

function kirjutaProjekt_(id, failid) {
  var r = paring_('https://script.googleapis.com/v1/projects/' + id + '/content', {
    method: 'put', contentType: 'application/json', headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: JSON.stringify({ files: failid }), muteHttpExceptions: true
  });
  if (r.getResponseCode() !== 200) throw apiViga_(r);
}

function rasi_(tekst) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, tekst, Utilities.Charset.UTF_8));
}

function viga_(tekst, liik, voti) {
  var e = new Error(tekst);
  e.liik = liik || '';
  e.voti = voti || '';
  return e;
}

// Võrgutõrge (aegumine, DNS) on ajutine nagu 503.
function paring_(aadress, valikud) {
  try {
    return UrlFetchApp.fetch(aadress, valikud);
  } catch (e) {
    throw viga_('Ühendus katkes (' + String(e && e.message || e).slice(0, 100) + ').', 'ajutine');
  }
}

// Kirja läheb ainult lühike selgitus, mitte Google'i HTML-leht.
function apiViga_(r) {
  var kood = r.getResponseCode(), tekst = r.getContentText(), sonum = '';
  try { sonum = JSON.parse(tekst).error.message || ''; } catch (e) { sonum = ''; }
  if (kood >= 500 || kood === 429) return viga_('Google oli hetkel üle koormatud (kood ' + kood + ').', 'ajutine');
  if (kood === 403 && /has not been used in project|SERVICE_DISABLED/i.test(tekst)) {
    return viga_('Selle uuendaja Google Cloudi projektis on Apps Script API sisse lülitamata (vaata seadistuslehe Google Cloudi samme). Google: ' + (sonum || tekst.slice(0, 200)), '', 'api-pilv');
  }
  if (kood === 403 && /Apps Script API/i.test(tekst)) {
    return viga_('Apps Script API on välja lülitatud. Lülita see sisse: https://script.google.com/home/usersettings', '', 'api-kasutaja');
  }
  if (kood === 403) return viga_('Uuendajal pole sellele skriptile ligipääsu (403).', 'oigus', 'oigus');
  if (kood === 404) return viga_('Sellise ID-ga skripti ei leitud. Kontrolli skripti ID-d.', '', '404');
  return viga_('Google vastas veaga ' + kood + (sonum ? ': ' + sonum : '') + '.', '', 'kood' + kood);
}

function oiguseJuhis_(nimi, id) {
  var mina = Session.getEffectiveUser().getEmail();
  return '„' + nimi + '“ jäi uuendamata, sest uuendaja ei pääse sellele skriptile ligi. ' +
    'Uuendaja töötab kontoga ' + mina + ', aga see skript kuulub teisele Google kontole.\n\n' +
    'Tee üks kord nii:\n' +
    '1. Ava see skript selle kontoga, kellele skript kuulub: https://script.google.com/home/projects/' + id + '/edit\n' +
    '2. Vajuta paremal üleval „Jaga“, lisa ' + mina + ' ja vali „Muutja“. ' +
    'Kui skript on tabeli küljes ja „Jaga“ nuppu ei ole, jaga samamoodi seda tabelit.\n\n' +
    'Uuendaja proovib iga ' + OIGUSE_OOTUS + ' minuti järel ise uuesti, rohkem ei pea sa midagi tegema. ' +
    'Selle vea kohta rohkem kirju ei tule. Seni töötab „' + nimi + '“ vana koodiga edasi.';
}

// Ajutine tõrge (503, 429, võrk): kirja ei saadeta. Ainult siis tuleb üks kiri, kui see kestab üle AJUTINE_TUNDE tunni.
function onAjutine_(e, koht) {
  if (!e || e.liik !== 'ajutine') return false;
  var omad = PropertiesService.getScriptProperties(), voti = 'ajutine:' + koht;
  var algus = Number(omad.getProperty(voti) || 0);
  if (!algus) { omad.setProperty(voti, String(Date.now())); return true; }
  if (Date.now() - algus > AJUTINE_TUNDE * 3600000) {
    teataViga_(koht + ':ajutine', e.message + ' See tõrge on kestnud üle ' + AJUTINE_TUNDE +
      ' tunni. Tavaliselt läheb see ise üle ja uuendaja proovib edasi.');
  }
  return true;
}

// Skript läks korda: unusta selle vead, et uus viga tuleks jälle kirjaga.
function korras_(koht) {
  var omad = PropertiesService.getScriptProperties();
  omad.deleteProperty('ajutine:' + koht);
  omad.deleteProperty('oota:' + koht);
  var teatatud = JSON.parse(omad.getProperty('teatatud') || '{}'), muutus = false;
  Object.keys(teatatud).forEach(function (k) { if (k.indexOf(koht + ':') === 0) { delete teatatud[k]; muutus = true; } });
  if (muutus) omad.setProperty('teatatud', JSON.stringify(teatatud));
}

// Iga vea kohta saadab kirja ainult ühe korra (kuni see skript jälle korda läheb), et postkast ei täituks.
function teataViga_(voti, tekst) {
  var omad = PropertiesService.getScriptProperties();
  omad.deleteProperty('viga');                               // vana uuendaja mälu
  var teatatud = JSON.parse(omad.getProperty('teatatud') || '{}');
  if (teatatud[voti]) return;
  teatatud[voti] = 1;
  omad.setProperty('teatatud', JSON.stringify(teatatud));
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Kuu harjutuse uuendaja: uuendus jäi tegemata',
    tekst + '\n\nTeised skriptid töötavad edasi nagu enne.');
}

// ================================================================ UUENDAJA LÕPP
