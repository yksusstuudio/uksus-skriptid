/**
 * KUU HARJUTUS · skript
 *
 * See skript elab sinu privaatses tabelis (seal, kus on vahekaart „Kuuharjutus“) ja teeb kõik ise:
 *  • loob ühise tabeli, mida osalejad täidavad, ja jagab selle lingiga;
 *  • lisab nimekirja kirjutatud inimese igale kuu vahekaardile ja paneb X-id päevadele enne liitumist;
 *  • tõstab pausil olija uuelt kuult välja ja tagasi, kui ta valib uuesti „Osalen“;
 *  • „Eemalda“ + „Kinnitan eemaldamise“ kustutab inimese ja tema tulemused kõigilt vahekaartidelt;
 *  • hoiab keelevaliku kõigil vahekaartidel ühesugusena;
 *  • teeb reeglitest Google'i dokumendi ja paneb lingi vahekaardile „Reeglid“;
 *  • paneb tagasi nime, millel on selle kuu kirjeid, kui keegi selle kustutab või ära tõstab;
 *  • lukustab taseme pärast esimest nädalat ja vanad päevad;
 *  • teeb 20. kuupäeval järgmise kuu vahekaardi (kui harjutus on plaanis kirjas);
 *  • kuu lõppedes paneb tulemused lukku ja peidab vana kuu vahekaardi;
 *  • saadab sulle e-kirjaga valmis WhatsAppi postitused;
 *  • „Lisa uus grupp“: teine grupp saab oma ühise tabeli ja plaani vahekaardi („Kuuharjutus · nimi“), mille harjutused
 *    tulevad põhiplaanist; lingi, loosi ja postitused teeb skript igale grupile eraldi.
 *
 * Skript elab oma failis (näiteks „Kuu harjutus.gs“) ega sega sama tabeli teisi skripte:
 * tal pole funktsiooni onOpen, oma menüü lisab ta eraldi päästikuga ja kustutab ainult oma päästikud.
 *
 * PAIGALDUS JA UUENDAMINE (arvutis)
 *  1. Ava oma privaatne tabel → Laiendused → Apps Script.
 *  2. Ava fail „Kuu harjutus.gs“ (kui seda pole: + → Skript). Teisi faile ära puutu.
 *     Tühjenda see fail, kleebi see skript sinna ja vajuta Salvesta (💾).
 *     Skripti viimane rida on „SKRIPTI LÕPP“: kui seda pole, jäi kleepimine poolikuks.
 *  3. Vali ülal nupu „Käivita“ (Run) kõrval funktsioon kuuHarjutusSeadista ja vajuta „Käivita“.
 *     Google küsib luba ja hoiatab, et rakendus pole kontrollitud. See on sinu enda skript:
 *     vali oma konto → Täpsemalt (Advanced) → Ava … (Go to …) → Luba (Allow).
 *  4. Mine tabelisse ja laadi leht uuesti. Menüüribale tuleb „Kuu harjutus“ (ja teiste skriptide menüüd jäävad alles).
 *  5. Lõpus näitab skript ühise tabeli linki. Pane see WhatsAppi grupi kirjeldusse.
 *  Uuendamisel jäävad ühine tabel, link ja kõik kirjed samaks: skript uuendab vahekaardid ise.
 *  Plaanileht „Kuuharjutus“ tehakse uuendamisel uueks; sinu plaan, e-post ja linnukesed tulevad sinna üle.
 */

// Kõik on ühe nime (KuuHarjutus) all, et nimed ei läheks teiste skriptidega segi.
var KuuHarjutus = (function () {

// ---------------------------------------------------------------- seaded (ära muuda)
var TZ = 'Europe/Tallinn';
var VER = 'KH10';                                    // plaani vahekaardi tunnus (lahter T1)
var POSTID = '3';                                    // postituste (uus harjutus, nädala seis) valemite versioon; muutub, kui nende tekst muutub
var PUB_NAME = 'Kuu harjutus | Monthly challenge';
var DOC_NAME = 'Kuu harjutus · Reeglid | Rules';  // ühise tabeli nimi Drive'is
var T_GUIDE = 'Juhend | Guide', T_ROSTER = 'Nimekiri | Roster', T_BOARD = 'Ülevaade | Board',
    T_FAME = 'Autahvel | Fame', T_RULES = 'Reeglid | Rules', T_PLAN = 'Kuuharjutus';
var LANG = "'" + T_GUIDE + "'!$C$3";
var ET_M = ['Jaanuar', 'Veebruar', 'Märts', 'Aprill', 'Mai', 'Juuni', 'Juuli', 'August', 'September', 'Oktoober', 'November', 'Detsember'];
var ET_G = ['jaanuari', 'veebruari', 'märtsi', 'aprilli', 'mai', 'juuni', 'juuli', 'augusti', 'septembri', 'oktoobri', 'novembri', 'detsembri'];
var EN_S = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var IN = 'Osalen · In', PAUSE = 'Paus · Pause', REMOVE = 'Eemalda · Remove', CONFIRM = 'Kinnitan eemaldamise · Confirm removal';
var PUB_VER = 9;                                    // ühise tabeli kujunduse versioon
var LANG_LABEL = 'Keel / Language';
var KEEL = [[T_GUIDE, 'C3'], [T_ROSTER, 'D2'], [T_BOARD, 'C3'], [T_FAME, 'B3'], [T_RULES, 'C3']];   // kuu vahekaartidel C1
var CUR_LABEL = '▶ Praegune kuu · This month';
var N = 100;          // osalejate kohti (kuni v8 oli 50: vanem tabel saab read juurde, vt laienda_)
var N_VANA = 50;
var R0 = 5;           // kuu vahekaardil esimene osaleja (read 5–104)
var RR0 = 4;          // nimekirjas esimene nimi (read 4–103); kuu vahekaardi rida = nimekirja rida + 1
var FD = 4;           // veerg D = kuu 1. päev
var AW = 49;          // veerg AW: kuu vahekaardi seaded (read 1–20)
var FAME0 = 5, FAMEN = 36, FAME_GID = 29;   // Autahvel: kuude nimed A5:A40, vahekaardi gid veerus AC
var PL0 = 3, PLN = 24;                      // plaani read 3–26
var O_JUHIS = '2x päevad: kirjuta siia ainult päevade numbrid komaga, näiteks 7, 21. Tühi lahter tähendab, et sel kuul topeltpäevi pole. Kuu vahekaardi 2x-rida muutub kohe samaks ja lahtri märkusesse tuleb kinnitus. Kuu vahekaardil 2x-i lisada ei saa, skript võtab päevad alati siit.';
var C_LINK = 'C29', C_EMAIL = 'C30', C_PREVIEW = 'C31', C_LOOS_ARV = 'C32', C_LOOS = 'D32', C_LOOS_TULEMUS = 'E32', POST0 = 37;
var C_KUU = 'D33', C_KUU_TULEMUS = 'E33', C_PROOV = 'D34', C_PROOV_TULEMUS = 'E34', POST0_VANA = 35;   // KH5–KH8: postitused read 35–38 (KH9: 37–40 nagu praegu)
var PL_2X = 15;       // plaani tulp O: topeltpäevad (näiteks „7, 21“)
var PILETID = 40;      // kuu vahekaardi veerg AN: loosipiletid
var FAME_WIN = 10;    // Autahvli veerg J: loosivõitjad
var SEERIA = 50, KOHT = 51, KUU_TULPI = 51;   // kuu vahekaardi AX (päevi järjest) ja AY (koht edetabelis)
var EKS = 'Endine osaleja';                  // eemaldatu nimi lõppenud kuudes
var T_LOGI = 'Kuu harjutuse muudatused', VARU = 'Kuu harjutuse varukoopiad';   // privaatse tabeli logi, varukoopiate kaust
var ORANZ = ['#FFD9B3', '#9A4A0C'], VANA_KOLLANE = '#fff1c2';   // alla eesmärgi (v9; enne kollane)
var POSTS = ['Uus harjutus', 'Start', 'Nädala seis', 'Tulemused', 'Eesmärk täis'];
var NPOST = POSTS.length;     // postituste read POST0 … POST0+NPOST-1 (Eesmärk täis lisandus 27.10)
var MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
// Vana (v4) plaani eeltäidetud väärtused: need ei kirjuta uut plaani üle.
var V4 = {
  '2026-10': ['Kätekõverdused', 'Push-ups', 30, 50, 100, 'kätekõverdust', 'põlvedelt või käed laual', '100 või 30 kitsast', 'push-ups', 'on knees or hands on a table', '100 or 30 diamond'],
  '2026-11': ['Plank', 'Plank', 60, 120, 60, 'sekundit', '3 × 20 s', '60 s pingutatud plank', 'seconds', '3 × 20 s', '60 s RKC plank'],
  '2026-12': ['Püstolkükid', 'Pistol squats', 40, 50, 40, 'püstolkükki (mõlemad jalad kokku)', 'toolile', 'aeglaselt, toeta', 'pistol squats (both legs together)', 'to a chair', 'slow, no support']
};

// ================================================================ menüü

function menuu() {
  SpreadsheetApp.getUi().createMenu('Kuu harjutus')
    .addItem('Seadista', 'kuuHarjutusSeadista')
    .addItem('Ava ühine tabel', 'kuuHarjutusLink')
    .addSeparator()
    .addItem('Loo uus kuu vahekaart kohe', 'kuuHarjutusUusKuuleht')
    .addItem('Uuenda eelvaade', 'kuuHarjutusEelvaade')
    .addItem('Saada proov e-postiga', 'kuuHarjutusProov')
    .addSeparator()
    .addItem('Loosi võitjad', 'kuuHarjutusLoos')
    .addSeparator()
    .addItem('Lisa uus grupp', 'kuuHarjutusLisaGrupp')
    .addToUi();
}

// Selle skripti päästikud (ka vanade versioonide omad). Teiste skriptide päästikutesse ei puutu.
var MINU_PAASTIKUD = ['kuuHarjutusMenuu', 'kuuHarjutusOine', 'kuuHarjutusHommik', 'kuuHarjutusMuudatus', 'kuuHarjutusPlaan', 'kuuHarjutusYlevaade', 'kuuHarjutusNimekiri', 'kuuHarjutusVersioon', 'oine', 'hommik', 'muudatus'];

// Ühekordne seadistus. Võib käivitada ka mitu korda: olemasolevat ühist tabelit ta uuesti ei tee.
// Google peatab skripti 6 minuti pärast. Kui aega jääb väheks, jätab Seadista järgmise grupi tabeli uuenduse ja öise
// kontrolli pooleli. Järgmine Seadista jätkab sealt: selle koodiga (EHITUS) juba uuendatud tabeleid ta enam ei uuenda.
var AJAPIIR = 150000, HOOLDUSE_PIIR = 240000, SEADISTA_ALGUS = 0, JATKA = false;
function aegaOn_(piir) { return Date.now() - SEADISTA_ALGUS < piir; }
var POOLELI = 'Seadista jättis ajapuudusel osa tööd tegemata (Google lubab ühe käivituse jaoks 6 minutit). Vali „Kuu harjutus → Seadista“ veel kord, siis teeb see ülejäänu.';

// Ühise tabeli uuendus uue koodi järgi. Tagastab vea teksti või ''.
function uuendaPub_(pub) {
  var props = props_(), viga = '';
  if (JATKA && props.getProperty('EHITUS:' + pub.getId()) === EHITUS) return '';
  try { varukoopia_(pub); } catch (err) {}                   // vanad koopiad prügikasti
  var lukk = LockService.getScriptLock();
  if (!lukk.tryLock(120000)) throw new Error('Skript on praegu hõivatud. Proovi minuti pärast uuesti.');
  var uv;
  try {
    try { sobita_(pub, tana_(), true, true); } catch (err) {}  // ootel nimed ja puuduvad liitumiskuupäevad enne uuendust
    uv = uuenda_(pub);
  } finally { lukk.releaseLock(); }
  if (uv.length) viga = 'Osa uuendusi jäi tegemata, käivita Seadista uuesti. (' + uv.join('; ') + ')';
  else props.setProperty('EHITUS:' + pub.getId(), EHITUS);
  return viga;
}

function seadista() {
  SEADISTA_ALGUS = Date.now();
  PropertiesService.getScriptProperties().setProperty('SEADISTA_KAIB', String(SEADISTA_ALGUS));
  try { return seadista1_(); } finally { PropertiesService.getScriptProperties().deleteProperty('SEADISTA_KAIB'); }
}

function seadista1_() {
  var priv = SpreadsheetApp.getActive();
  GRUPP_ = null; KUUD_ = null;
  var props = props_();
  JATKA = props.getProperty('SEADISTA_JATKA') === EHITUS;
  props.setProperty('PRIV_ID', priv.getId());
  tz_(priv);

  var plan = plaan_(priv), vana = null;
  if (!plan) {
    vana = priv.getSheetByName(T_PLAN);
    if (vana) vana.setName(vabaNimi_(priv, T_PLAN + ' (vana)'));
  }
  var pub = avalik_(), viga = '', vastTehtud = !pub;
  if (!pub) {
    pub = impordi_(pubNimi_(), kaust_(priv));
    props.setProperty('PUB_ID', pub.getId());
    props.setProperty('PUB_VER:' + pub.getId(), String(PUB_VER));
    props.setProperty('EHITUS:' + pub.getId(), EHITUS);
  }
  tz_(pub);
  if (pub.getName() !== pubNimi_()) pub.rename(pubNimi_());
  if (!vastTehtud) viga = uuendaPub_(pub);                  // olemasolev tabel saab uue koodiga uued tekstid ja kujunduse

  var mall = pub.getSheetByName(T_PLAN);
  if (!plan) {
    var src = mall, ajutine = null;
    if (!src) { ajutine = impordi_(PUB_NAME + ' (ajutine)', null); src = ajutine.getSheetByName(T_PLAN); }
    plan = src.copyTo(priv).setName(vabaNimi_(priv, T_PLAN));
    if (ajutine) DriveApp.getFileById(ajutine.getId()).setTrashed(true);
    if (plan.isSheetHidden()) plan.showSheet();
    plan.hideColumns(20, 2);
    priv.setActiveSheet(plan);
    priv.moveActiveSheet(1);
    [C_LOOS, C_KUU, C_PROOV].forEach(function (a1) { plan.getRange(a1).insertCheckboxes().setValue(false); });
    var on = plan.getRange(POST0, 2, NPOST, 1), onV = on.getValues();
    on.insertCheckboxes();
    on.setValues(onV.map(function (r) { return [r[0] !== false && String(r[0]).toUpperCase() !== 'FALSE']; }));
    if (vana) migreeri_(vana, plan);
    if (vana && /^KH([5-9]|10)$/.test(String(vana.getRange('T1').getValue()))) priv.deleteSheet(vana);   // kõik on uuel vahekaardil
    try { plan.autoResizeRows(PL0, PLN); } catch (err) {}
    props.setProperty('POSTID', POSTID);                      // uus vahekaart tuli praegusest mallist
  }
  if (mall) pub.deleteSheet(mall);
  plan.getRange(PL0 - 1, PL_2X).setNote(O_JUHIS);                                                  // juhis tulba O pealkirjal, ka juba olemasoleval vahekaardil
  try { postiValemid_(plan); } catch (err) { viga += (viga ? ' ' : '') + 'Postituste tekste ei saanud uuendada: ' + (err && err.message ? err.message : err); }
  try { auhinnad_(plan); } catch (err) { viga += (viga ? ' ' : '') + 'Auhindade tabelit ei saanud teha: ' + (err && err.message ? err.message : err); }

  var jagatud = true;
  try {
    DriveApp.getFileById(pub.getId()).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
  } catch (err) { jagatud = false; }
  plan.getRange(C_LINK).setValue(pub.getUrl());
  lingid_(pub);
  var dok = '';
  try { dok = reeglid_(pub); } catch (err) { viga = 'Reeglite dokumenti ei saanud teha: ' + (err && err.message ? err.message : err); }
  var teised = [];                                           // teised grupid: igaühel oma ühine tabel
  grupid_(priv).forEach(function (g) {
    if (!g || !grupiNimi_(g)) return;
    grupiga_(g, function () {
      try { var x = grupiSeadista_(priv, g); teised.push(x); if (x.viga) viga += (viga ? ' ' : '') + x.nimi + ': ' + x.viga; }
      catch (err) { viga += (viga ? ' ' : '') + grupiNimi_(g) + ': ' + (err && err.message ? err.message : err); }
    });
  });

  ScriptApp.getProjectTriggers().forEach(function (tr) {
    if (MINU_PAASTIKUD.indexOf(tr.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(tr);
  });
  ScriptApp.newTrigger('kuuHarjutusMenuu').forSpreadsheet(priv.getId()).onOpen().create();
  ScriptApp.newTrigger('kuuHarjutusOine').timeBased().everyDays(1).atHour(0).inTimezone(TZ).create();
  ScriptApp.newTrigger('kuuHarjutusHommik').timeBased().everyDays(1).atHour(10).nearMinute(0).inTimezone(TZ).create();   // e-kirjad ja numbrid kell 10 (Erik 11.10)
  [pub].concat(teised.map(function (x) { return x.pub; })).forEach(function (p) {
    ScriptApp.newTrigger('kuuHarjutusMuudatus').forSpreadsheet(p.getId()).onEdit().create();
  });
  ScriptApp.newTrigger('kuuHarjutusPlaan').forSpreadsheet(priv.getId()).onEdit().create();
  ScriptApp.newTrigger('kuuHarjutusVersioon').timeBased().everyMinutes(1).create();       // uuendaja toodud uus kood seadistab end ise kohe (Erik 27.10)
  try { menuu(); } catch (err) {}

  var pooleli = teised.some(function (x) { return x.pooleli; });
  if (!pooleli && aegaOn_(HOOLDUSE_PIIR)) {
    try { hooldus_(); } catch (err) { viga += (viga ? ' ' : '') + String(err && err.message ? err.message : err); }
  } else pooleli = true;
  if (pooleli) { viga = POOLELI + (viga ? ' ' + viga : ''); props.setProperty('SEADISTA_JATKA', EHITUS); }
  else { props.deleteProperty('SEADISTA_JATKA'); PropertiesService.getScriptProperties().setProperty('SEADISTATUD', EHITUS); }

  var url = pub.getUrl();
  var html = '<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#2B241E">' +
    (pooleli ? '<p style="font-size:16px;color:#B00020"><b>Peaaegu valmis.</b> Vali „Kuu harjutus → Seadista“ veel kord, siis teeb see ülejäänu.</p>'
             : '<p style="font-size:16px"><b>Valmis!</b> Ühine tabel on olemas ja hoiab end ise korras.</p>') +
    '<p><a href="' + url + '" target="_blank" style="font-weight:bold;color:#8B6B47">👉 Ava ühine tabel</a></p>' +
    '<p>Link osalejatele (kopeeri ja pane WhatsAppi grupi kirjeldusse):<br>' +
    '<input value="' + url + '" readonly onclick="this.select()" style="width:100%;padding:6px;font-size:13px"></p>' +
    (jagatud ? '' : '<p style="color:#B00020">Jagamine ei õnnestunud. Ava ühine tabel → Jaga → Üldine juurdepääs: ' +
      '„Kõik, kellel on link“ ja roll „Redigeerija“.</p>') +
    teised.map(function (x) {
      return '<p><b>' + html_(x.nimi) + '</b>: <a href="' + x.pub.getUrl() + '" target="_blank" style="font-weight:bold;color:#8B6B47">👉 ava ühine tabel</a><br>' +
        '<input value="' + x.pub.getUrl() + '" readonly onclick="this.select()" style="width:100%;padding:6px;font-size:13px">' +
        (x.jagatud ? '' : '<br><span style="color:#B00020">Jagamine ei õnnestunud, jaga see tabel lingiga ise.</span>') + '</p>';
    }).join('') +
    '<p>Postitused tulevad sulle e-kirjaga: uus harjutus 20. kuupäeval, start 1. kuupäeval, nädala seis ' +
    'pühapäeviti ja tulemused 3. kuupäeval. Plaan on vahekaardil „Kuuharjutus“.</p>' +
    (dok ? '<p>Reeglid dokumendina (link on ka vahekaardil „Reeglid“): <a href="' + dok + '" target="_blank">ava</a></p>' : '') +
    (viga ? '<p style="color:#B00020">Märkus: ' + html_(viga) + '</p>' : '') + '</div>';
  try {
    SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(480).setHeight(360 + 90 * teised.length), 'Kuu harjutus');
  } catch (err) { Logger.log('Ühine tabel: ' + url + (viga ? '\n' + viga : '')); }
  return viga;
}

function naitaLinki() {
  var ui = SpreadsheetApp.getUi(), lingid = koigile_(null, function () {
    var pub = avalik_();
    return pub ? { nimi: GRUPP_ ? GRUPP_.nimi : '', url: pub.getUrl() } : null;
  }).filter(Boolean);
  if (!lingid.length) { ui.alert('Ühist tabelit veel pole. Vali „Kuu harjutus → Seadista“.'); return; }
  ui.showModalDialog(HtmlService.createHtmlOutput(
    '<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5">' + lingid.map(function (l) {
      return '<p><a href="' + l.url + '" target="_blank" style="font-weight:bold;color:#8B6B47">👉 Ava ' + (l.nimi ? html_(l.nimi) + ' grupi' : '') + ' ühine tabel</a><br>' +
        'Link osalejatele:<br><input value="' + l.url + '" readonly onclick="this.select()" style="width:100%;padding:6px"></p>';
    }).join('') + '</div>').setWidth(440).setHeight(60 + 110 * lingid.length), 'Kuu harjutus');
}

// Teeb puuduva kuu vahekaardi kohe: kõigepealt selle kuu oma, siis järgmise kuu oma.
function looUusKuuleht() {
  SpreadsheetApp.getUi().alert(looKuuKohe_().tekst);
}

function looKuuKohe_() {
  var pub = avalik_(), plan = plaan_();
  if (!pub || !plan) return { tekst: 'Vali enne „Kuu harjutus → Seadista“.' };
  KUUD_ = null;
  var t = tana_(), d = ymd_(t), k = kuuLeht_(pub, d[0], d[1]) ? jargmine_(d[0], d[1]) : [d[0], d[1]];
  var nimi = ET_M[k[1] - 1] + ' ' + k[0];
  if (kuuLeht_(pub, k[0], k[1])) return { tekst: 'Vahekaart „' + lehenimi_(k[0], k[1]) + '“ on ühises tabelis juba olemas.' };
  var cfg = planRida_(plan, k[0], k[1]);
  if (!cfg) return { tekst: 'Kirjuta enne vahekaardile „Kuuharjutus“ kuu ' + nimi + ' harjutus ja numbrid (tulbad C–H).' };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(60000)) return { tekst: 'Skript on praegu hõivatud. Proovi minuti pärast uuesti.' };
  try { looKuu_(pub, k[0], k[1], cfg, t, topelt_(plan, k[0], k[1])); } finally { lock.releaseLock(); }
  return { tekst: 'Valmis: ühises tabelis on nüüd vahekaart „' + lehenimi_(k[0], k[1]) + '“. (' + Utilities.formatDate(new Date(), TZ, 'd.MM HH:mm') + ')' };
}

// Arvutab eelvaate numbrid lahtri C31 kuupäeva järgi.
function uuendaEelvaade() {
  var pub = avalik_(), plan = plaan_();
  if (!pub || !plan) { SpreadsheetApp.getUi().alert('Vali enne „Kuu harjutus → Seadista“.'); return; }
  var d0 = toSerial_(plan.getRange(C_PREVIEW).getValue());
  if (d0 === null) { plan.getRange(C_PREVIEW).setFormula('=TODAY()'); d0 = tana_(); }
  statistika_(plan, pub, d0);
  SpreadsheetApp.flush();
  plan.getParent().toast('Eelvaade on uuendatud.', 'Kuu harjutus', 5);
}

// Saadab kõik sisse lülitatud postitused kohe sulle (eelvaate kuupäeva järgi).
function saadaProov() {
  var plan = plaan_();
  if (!plan || !avalik_()) { SpreadsheetApp.getUi().alert('Vali enne „Kuu harjutus → Seadista“.'); return; }
  SpreadsheetApp.getUi().alert(saadaProov_(plan).tekst);
}

function saadaProov_(plan) {
  var pub = avalik_();
  if (!pub) return { tekst: 'Vali enne „Kuu harjutus → Seadista“.' };
  var d0 = toSerial_(plan.getRange(C_PREVIEW).getValue());
  if (d0 === null) { plan.getRange(C_PREVIEW).setFormula('=TODAY()'); d0 = tana_(); }
  statistika_(plan, pub, d0);
  SpreadsheetApp.flush();
  var rows = plan.getRange(POST0, 1, NPOST, 12).getValues(), to = saaja_(plan), saadetud = [], vahele = [];
  rows.forEach(function (r, i) {
    if (r[1] !== true) return;
    var et = String(r[4]), en = String(r[11]);
    if (!et || et.charAt(0) === '(') { vahele.push(POSTS[i] + ' ' + et); return; }
    saada_(to, POSTS[i], et, en, true, i === 3 ? kysitlus_(eelmine_.apply(null, ymd_(d0).slice(0, 2))) : null);
    saadetud.push(POSTS[i]);
  });
  return { tekst: (saadetud.length ? 'Saatsin aadressile ' + to + ': ' + saadetud.join(', ') + '.' : 'Ühtegi postitust ei saadetud.') +
    (vahele.length ? ' Vahele jäi: ' + vahele.join('; ') : '') + ' (' + Utilities.formatDate(new Date(), TZ, 'd.MM HH:mm') + ')' };
}

// ================================================================ päästikud

// Iga öö kell 0–1.
function oine() { hooldus_(); }

// Iga päev kell 10 (10.00–10.15): postitused ja meeldetuletused; numbrid arvutatakse sel ajal uuesti.
function hommik() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(120000)) throw new Error('Skript oli hõivatud.');
  try {
    var vead = [];
    koigile_(null, function () { try { hommik1_(); } catch (err) { vead.push(err && err.message ? err.message : String(err)); } });
    if (vead.length) throw new Error(vead.join(' | '));
  } finally { lock.releaseLock(); }
}

function hommik1_() {
  {
    var pub = avalik_(), plan = plaan_();
    if (!pub || !plan) return;
    var t = tana_(), d = ymd_(t), nx = jargmine_(d[0], d[1]), pv = eelmine_(d[0], d[1]);
    try { kommentaarid_(pub); } catch (err) {}                // vead tulevad öise hoolduse teatesse
    plan.getRange(C_PREVIEW).setFormula('=TODAY()');
    statistika_(plan, pub, t);
    SpreadsheetApp.flush();
    var props = props_(), to = saaja_(plan);
    var rows = plan.getRange(POST0, 1, NPOST, 12).getValues();
    var paev = new Date(Date.UTC(d[0], d[1] - 1, d[2])).getUTCDay();   // 0 = pühapäev
    var todo = [];
    if (d[2] >= 20 && kuuLeht_(pub, nx[0], nx[1])) todo.push([0, 'uus:' + nx[0] + '-' + nx[1]]);
    if (d[2] <= 2 && kuuLeht_(pub, d[0], d[1])) todo.push([1, 'start:' + d[0] + '-' + d[1]]);
    if (paev === 0 && d[2] > 2 && kuuLeht_(pub, d[0], d[1])) todo.push([2, 'nadal:' + t]);
    if (d[2] >= 3 && d[2] <= 5 && kuuLeht_(pub, pv[0], pv[1])) todo.push([3, 'tulemused:' + pv[0] + '-' + pv[1]]);
    if (kuuLeht_(pub, d[0], d[1])) todo.push([4, 'eesmark:' + d[0] + '-' + d[1]]);   // kord kuus; tekst on „(…“, kuni eesmärk pole täis
    todo.forEach(function (x) {
      var r = rows[x[0]], et = String(r[4]), en = String(r[11]);
      if (props.getProperty(x[1]) || r[1] !== true || !et || et.charAt(0) === '(') return;
      saada_(to, POSTS[x[0]], et, en, false, x[0] === 3 ? kysitlus_(pv) : null);
      props.setProperty(x[1], new Date().toISOString());
    });
    var proovi = function (fn) { try { fn(); } catch (err) { Logger.log(err); } };
    proovi(function () { kaitseKoik_(pub, t); });                  // lukud ka siis, kui öine hooldus jäi pooleli
    if (!GRUPP_) proovi(function () { if (d[2] >= 28) jargmineKuu_(plan, d, props, to); });   // teise grupi plaan tuleb põhiplaanist
    if (paev === 0) proovi(function () { vaiksed_(pub, t, props, to); });
    proovi(function () { tervis_(props, t, to); });
    if (!GRUPP_) meeldetuleta_(pub, plan, t, props, to);
  }
}

// Kuu 28. päeval: kui järgmise kuu harjutus on plaanis kirjutamata, kopeerin selle kuu oma (tulbad C–N) ja annan teada.
function jargmineKuu_(plan, d, props, to) {
  var n = jargmine_(d[0], d[1]), key = 'autoplaan:' + n[0] + '-' + n[1];
  if (props.getProperty(key)) return;
  var i = planiRida_(plan, n[0], n[1]), j = planiRida_(plan, d[0], d[1]);
  if (i < 0 || j < 0 || str_(plan.getRange(PL0 + i, 3).getValue()) || !planRida_(plan, d[0], d[1])) return;
  plan.getRange(PL0 + i, 3, 1, 12).setValues(plan.getRange(PL0 + j, 3, 1, 12).getValues().map(function (r) { return r.map(txt_); }));
  props.setProperty(key, new Date().toISOString());
  var g = ET_G[n[1] - 1], ex = str_(plan.getRange(PL0 + j, 3).getValue());
  var tekst = g.charAt(0).toUpperCase() + g.slice(1) + ' harjutus oli plaanis kirjutamata, seepärast panin sinna sama harjutuse mis praegu (' + ex + ').' +
    '\n\nKui tahad teist harjutust, muuda vahekaardil „Kuuharjutus“ ' + g + ' rida. Uus kuu vahekaart tuleb ühisesse tabelisse järgmisel ööl.';
  kiri_({ to: to, subject: 'Kuu harjutus: ' + g + ' harjutus on sama mis praegu', body: tekst,
    htmlBody: '<div style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap">' + html_(tekst) + '</div>', name: 'Kuu harjutus' });
}

// Pühapäeval: kes pole viimasel 3 päeval midagi kirja pannud (liitunud vähemalt 3 päeva tagasi). Ainult sulle.
function vaiksed_(pub, t, props, to) {
  var key = 'vaiksed:' + t;
  if (props.getProperty(key)) return;
  var m = kuulehed_(pub, true).filter(function (x) { return !x.frozen && x.start <= t - 3 && t <= x.end + 1; }).pop();
  if (!m) return;
  var liit = pub.getSheetByName(T_ROSTER).getRange(RR0, 4, N, 1).getValues();
  var v = m.sh.getRange(R0, 1, N, FD + 30).getValues(), a = t - 3 - m.start, nimed = [];
  v.forEach(function (r, k) {
    var nimi = str_(r[0]), j = toSerial_(liit[k][0]);
    if (!nimi || (j !== null && j > t - 3)) return;
    var tyhi = true;
    for (var c = a; c < a + 3 && c < m.days; c++) if (str_(r[FD - 1 + c]) !== '') tyhi = false;
    if (tyhi) nimed.push(nimi);
  });
  props.setProperty(key, new Date().toISOString());
  if (!nimed.length) return;
  var tekst = 'Viimasel 3 päeval pole kirja pannud (' + nimed.length + '):\n' + nimed.join('\n') +
    '\n\nVõib-olla tasub neile meelde tuletada. Seda kirja näed ainult sina.';
  kiri_({ to: to, subject: 'Kuu harjutus: ' + nimed.length + ' inimest on 3 päeva vaiksed', body: tekst,
    htmlBody: '<div style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap">' + html_(tekst) + '</div>', name: 'Kuu harjutus' });
}

// Kui öine hooldus pole 30 tundi õnnestunud, saad kirja (kord päevas).
function tervis_(props, t, to) {
  var ok = Number(props.getProperty('OINE_OK')) || 0;
  if (!ok || Date.now() - ok < 30 * 3600 * 1000 || props.getProperty('TERVIS') === String(t)) return;
  var viga = props.getProperty('OINE_VIGA') || 'öine hooldus ei käivitunud';
  var tekst = 'Kuu harjutuse öine hooldus pole alates ' + Utilities.formatDate(new Date(ok), TZ, 'd.MM HH:mm') + ' õnnestunud.\n\nPõhjus: ' + viga +
    '\n\nAva oma tabel ja vali „Kuu harjutus → Seadista“. Kui see ei aita, saada see kiri edasi sellele, kes skripti tegi.';
  kiri_({ to: to, subject: 'Kuu harjutus: öine hooldus ei tööta', body: tekst,
    htmlBody: '<div style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap">' + html_(tekst) + '</div>', name: 'Kuu harjutus' });
  props.setProperty('TERVIS', String(t));
}

// Tulemuste kirjale lisaks: küsimus, kuidas harjutus sobis (vasta emojiga).
function kysitlus_(k) {
  var g = ET_G[k[1] - 1], en = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][k[1] - 1];
  return ['📊 Kuidas ' + g + ' harjutus sobis? Vasta emojiga:\n😴 liiga kerge\n👌 paras\n🥵 liiga raske',
          '📊 How was the ' + en + ' exercise? Reply with an emoji:\n😴 too easy\n👌 just right\n🥵 too hard'];
}

// Käivitub, kui keegi muudab ühist tabelit.
function muudatus(e) {
  if (!e || !e.range) return;
  var g = e.source ? PropertiesService.getScriptProperties().getProperty('GRUPP:' + e.source.getId()) : null;
  if (g) return grupiga_(g, function () { muudatus1_(e); kloonEdasi_(e); });
  GRUPP_ = null;
  muudatus1_(e);
  kloonEdasi_(e);
}

function muudatus1_(e) {
  var sh = e.range.getSheet(), nimi = sh.getName(), row = e.range.getRow(), col = e.range.getColumn();
  logi_(e);
  if (row <= 3) {                                            // keelevalik: kõik vahekaardid vahetavad keelt
    var a1 = keeleLahter_(sh);
    if (a1) {
      var c = sh.getRange(a1);
      if (row === c.getRow() && col === c.getColumn()) { keel_(e.source, str_(c.getValue())); return; }
    }
  }
  if (nimi === T_BOARD) {                                    // teise kuu ülevaade kehtib 5 minutit
    if (row === 4 && col === 3 && str_(sh.getRange('C4').getValue()) !== CUR_LABEL) ylevaateTaimer_();
    return;
  }
  if (nimi === T_ROSTER) {
    if (e.range.getLastColumn() < 2 || col > 3 || e.range.getLastRow() < RR0) return;
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(25000)) { nimekiriTaimer_(); return; }   // Erik 3.10: nimi jäi ilma kuupäevata; proovi umbes minuti pärast uuesti, mitte alles öösel
    var teated = [];
    try { laienda_(e.source); teated = sobita_(e.source, tana_(), true); } finally { lock.releaseLock(); }
    teata_(e, teated);
    return;
  }
  if (row < R0 && e.range.getLastRow() >= 4 && row <= 4 && col < FD + 31 && e.range.getLastColumn() >= FD) topeltTagasi_(e, sh);
  if (row < R0 || sh.getMaxColumns() < AW || sh.getRange(1, AW).getValue() !== 'KUULEHT') return;   // edasi ainult kuu vahekaardid
  if (e.range.getLastColumn() >= FD && col < FD + 31) { puhastaPaevad_(e.range); if (col >= FD) return; }
  if (e.range.getNumRows() !== 1 || e.range.getLastColumn() !== col) return;
  if (col === 2) tase_(e, sh, tana_());
  else if (col === 3 && !tiim_(e, sh, tana_())) {            // tiimi nimi: liigsed tühikud ära, et sama tiim loeks samaks
    var v = e.range.getValue(), s = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : v;
    if (s !== v) e.range.setValue(txt_(s));
  }
}

// Kuu vahekaardi 2x-rida muudab ainult plaan (tulp O). Käsitsi muudatus võetakse kohe tagasi.
function topeltTagasi_(e, sh) {
  var m = kuuInfo_(sh);
  if (!m) return;
  var plan = plaan_(), d = ymd_(m.start);
  if (!plan) return;
  if (topeltKuusse_(m, topelt_(plan, d[0], d[1])))
    teata_({ range: sh.getRange(4, FD), source: e.source }, ['2x päevi saab muuta ainult plaani vahekaardil (tulp O). Siin tehtud muudatus võeti tagasi.']);
}

// Eriku tulemused: põhigrupis tehtud muudatus läheb kohe samaks ka teiste gruppide tabelisse.
// Teises grupis Eriku rida (tase ja päevad) muuta ei saa, see võetakse põhigrupist tagasi. Tiim jääb igal grupil oma.
var KLOON = 'Erik';
function kloonEdasi_(e) {
  var r = e.range, sh = r.getSheet();
  if (r.getLastRow() < R0 || r.getRow() >= R0 + N || r.getLastColumn() < 2 || r.getColumn() >= FD + 31) return;
  if (r.getColumn() === 3 && r.getLastColumn() === 3) return;
  var m = kuuInfo_(sh);
  if (!m || m.frozen) return;
  var k = kloonRida_(e.source);
  if (k < 0 || R0 + k < r.getRow() || R0 + k > r.getLastRow()) return;
  var lock = LockService.getScriptLock(), muutus = false;
  if (!lock.tryLock(20000)) return;                          // öine hooldus teeb selle järgi
  try { muutus = kloon_(tana_(), m.start); } finally { lock.releaseLock(); }
  if (GRUPP_ && muutus) teata_({ range: sh.getRange(R0 + k, Math.max(r.getColumn(), 2)), source: e.source },
    [KLOON + ' kirjutab oma tulemused põhigrupi tabelisse ja need tulevad siia ise. Siin tehtud muudatus võeti tagasi. / ' +
     KLOON + '\'s results come from the main group\'s sheet, so this change was undone.']);
}

// Eriku koht nimekirjas (0 …), -1 kui teda pole.
function kloonRida_(pub) {
  var ro = pub.getSheetByName(T_ROSTER);
  if (!ro) return -1;
  var v = ro.getRange(RR0, 2, N, 1).getValues();
  for (var k = 0; k < N; k++) if (str_(v[k][0]).toLowerCase() === KLOON.toLowerCase()) return k;
  return -1;
}

// Kas kuu vahekaardi real k on Erik (pausi ajal on nimi tühi)?
function kloonKuus_(m, k) { return str_(m.sh.getRange(R0 + k, 1).getValue()).toLowerCase() === KLOON.toLowerCase(); }

// Kopeerib Eriku taseme ja päevad põhigrupi lukustamata kuudest (algus = ainult see kuu) teiste gruppide samadesse kuudesse.
// Kui teises grupis Erikut veel pole, lisab skript ta sealsesse nimekirja. Tagastab true, kui midagi muutus.
function kloon_(t, algus) {
  var priv = privaatne_(), teised = grupid_(priv).slice(1), muutus = false;
  if (!teised.length) return false;
  var allikas = grupiga_(null, function () {
    var pub = avalik_(), k = pub ? kloonRida_(pub) : -1;
    if (k < 0) return [];
    return kuulehed_(pub, true).filter(function (m) {
      return !m.frozen && t <= m.end + 1 && (!algus || m.start === algus) && kloonKuus_(m, k);
    }).map(function (m) {
      var r = m.sh.getRange(R0 + k, 2, 1, 33);
      return { start: m.start, v: r.getValues()[0], f: r.getNumberFormats()[0] };
    });
  });
  if (!allikas.length) return false;
  teised.forEach(function (g) {
    grupiga_(g, function () {
      var pub = avalik_();
      if (!pub) return;
      var k = kloonRida_(pub);
      if (k < 0) {
        var ro = pub.getSheetByName(T_ROSTER), v = ro ? ro.getRange(RR0, 2, N, 4).getValues() : [];
        for (var i = 0; i < v.length && k < 0; i++) if (!str_(v[i][0]) && !str_(v[i][3])) k = i;
        if (k < 0) return;                                   // nimekiri on täis
        ro.getRange(RR0 + k, 2).setValue(KLOON);
        sobita_(pub, t, true);
        k = kloonRida_(pub);
        if (k < 0) return;
        muutus = true;
      }
      allikas.forEach(function (a) {
        var m = kuulehed_(pub, true).filter(function (x) { return x.start === a.start && !x.frozen; })[0];
        if (!m || !kloonKuus_(m, k)) return;
        var r = m.sh.getRange(R0 + k, 2, 1, 33), v = r.getValues()[0], f = r.getNumberFormats()[0];
        var erinev = function (i) { return String(v[i]) !== String(a.v[i]) || f[i] !== a.f[i]; };
        if (erinev(0)) {
          m.sh.getRange(R0 + k, 2).setValue(txt_(a.v[0])).setNumberFormat(a.f[0]);
          muutus = true;
        }
        for (var j = 2; j < 33; j++) if (erinev(j)) {
          m.sh.getRange(R0 + k, FD, 1, 31).setNumberFormats([a.f.slice(2)]);
          reeglitaKirjuta_(m.sh.getRange(R0 + k, FD, 1, 31), function (x) { x.setValues([a.v.slice(2).map(txt_)]); });
          muutus = true;
          break;
        }
      });
    });
  });
  return muutus;
}

// Teade jääb lahtri märkusena näha (telefonis toasti ei näe). Öösel kustuvad.
function teata_(e, teated) {
  if (!teated || !teated.length) return;
  var tekst = teated.join('\n\n');
  try { e.range.getCell(1, 1).setNote('Kuu harjutus:\n' + tekst); } catch (err) {}
  try { e.source.toast(tekst, 'Kuu harjutus', 10); } catch (err) {}
}

// Päevade lahtrid: „j“ → „J“, tühikud ära, kellaaeg (1:30) → sekundid (90). Kleepimise kaitse (Erik 13.10): valem asendub oma
// väärtusega ja lahtrisse jääb ainult number 0–999, J (kuni 2 rea kohta), H või X (ainult enne liitumist), muu kustub.
// Kleepimine ei kontrolli lahtri reeglit ja toob kaasa allika reegli, seega pannakse päevade reegel ka tagasi.
function puhastaPaevad_(rng) {
  var sh = rng.getSheet(), m = kuuInfo_(sh);
  if (!m) return;
  var r0 = Math.max(rng.getRow(), R0), r1 = Math.min(rng.getLastRow(), R0 + N - 1), c0 = Math.max(rng.getColumn(), FD), c1 = Math.min(rng.getLastColumn(), FD + 30);
  if (r1 < r0 || c1 < c0) return;
  var r = sh.getRange(r0, c0, r1 - r0 + 1, c1 - c0 + 1);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;                            // öine hooldus teeb tüübikontrolli hiljem
  try {
    if (!paevadeKontroll_(m, r, true) && r.getNumRows() * r.getNumColumns() > 1) paevaReeglid_(sh);
  } finally { lock.releaseLock(); }
}

// Kontrollib päevalahtreid. ranged: ka J-piir ja X-reegel (muudatuse ajal); öösel ainult tüüp ja valemid.
// Tagastab true, kui midagi kirjutati (siis pandi ka reegel tagasi).
function paevadeKontroll_(m, r, ranged) {
  var sh = m.sh, v = r.getValues(), f = r.getFormulas(), d = null, muutus = false, vorm = [];
  var r0 = r.getRow(), c0 = r.getColumn(), liitus = null;
  var uus = v.map(function (row, i) {
    var jArv = null;
    return row.map(function (x, j) {
      var y = paevaVaartus_(x, function () { return (d = d || r.getDisplayValues())[i][j]; });
      if (typeof y === 'string' && /^\d+([.,]\d+)?$/.test(y)) y = Number(y.replace(',', '.'));
      var ok = y === '' || y === null || (typeof y === 'number' && isFinite(y) && y >= 0 && y < 1000 && (!m.plank || plankOk_(y))) || y === 'H' || y === 'J' || y === 'X';
      if (ok && ranged && y === 'X') {
        if (!liitus) { var ro = sh.getParent().getSheetByName(T_ROSTER); liitus = ro ? ro.getRange(RR0, 4, N, 1).getValues() : []; }
        var lj = liitus[r0 + i - R0] ? toSerial_(liitus[r0 + i - R0][0]) : null;
        ok = m.start + (c0 + j - FD) < Math.max(lj || 0, m.start);
      }
      if (ok && ranged && y === 'J') {
        if (jArv === null) {                                   // J-sid selles reas väljaspool kleebitud ala
          var rida = sh.getRange(r0 + i, FD, 1, 31).getValues()[0];
          jArv = rida.filter(function (z, k) { return k < c0 - FD || k >= c0 - FD + v[i].length ? String(z).trim().toUpperCase() === 'J' : false; }).length;
        }
        if (jArv >= 2) ok = false; else jArv++;
      }
      if (!ok) y = '';
      if (typeof y === 'number' && (f[i][j] || x instanceof Date)) vorm.push([i, j]);
      if (y !== x || f[i][j]) muutus = true;
      return y === null ? '' : y;
    });
  });
  if (!muutus) return false;
  reeglitaKirjuta_(r, function (x) { x.setValues(uus.map(function (row) { return row.map(txt_); })); });
  vorm.forEach(function (p) { r.getCell(p[0] + 1, p[1] + 1).setNumberFormat('0'); });
  return true;
}

function paevaVaartus_(x, kuva) {
  if (x instanceof Date) {
    var m = String(kuva()).trim().match(/^(\d+):(\d{2})(?::(\d{2}))?(?:\s*([AP])\.?M\.?)?$/i);   // ka „1:30:00 AM“
    if (!m) return x;
    if (m[4]) m[1] = String(Number(m[1]) % 12 + (/p/i.test(m[4]) ? 12 : 0));
    return Number(m[3] || 0) ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : Number(m[1]) * 60 + Number(m[2]);
  }
  if (typeof x !== 'string') return x;
  var s = x.replace(/\s+/g, ' ').trim();
  if (/^[jhx]$/i.test(s)) return s.toUpperCase();
  return s;
}

// Iga muudatus läheb privaatse tabeli vahekaardile „Muudatused“ (viimased 5000 rida).
function logi_(e) {
  try {
    var id = props_().getProperty('PRIV_ID');
    if (!id) return;
    var priv = SpreadsheetApp.openById(id), lg = priv.getSheetByName(T_LOGI);
    if (!lg) {
      lg = priv.insertSheet(T_LOGI);
      lg.getRange(1, 1, 1, 5).setValues([['Aeg', 'Vahekaart', 'Lahter', 'Oli', 'Sai']]).setFontWeight('bold');
      lg.setFrozenRows(1);
    }
    var r = e.range, n = r.getNumRows() * r.getNumColumns();
    var uus = e.value !== undefined ? e.value : n === 1 ? r.getValue() : '(' + n + ' lahtrit)';
    lg.appendRow([Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss'), (GRUPP_ ? GRUPP_.nimi + ' · ' : '') + r.getSheet().getName(), r.getA1Notation(),
      txt_(e.oldValue === undefined ? '' : e.oldValue), txt_(uus === undefined ? '' : uus)]);
  } catch (err) {}
}

// Nimekirja muudatus jäi teise käivituse (näiteks Seadista või öise kontrolli) taha ootama: sama grupi kõik ootel nimed
// sobitatakse umbes minuti pärast. Viie nurjunud katse järel jääb see öise kontrolli hooleks.
function nimekiriTaimer_() {
  var tr = ScriptApp.getProjectTriggers().filter(function (x) { return x.getHandlerFunction() === 'kuuHarjutusNimekiri'; });
  if (tr.length) return;
  ScriptApp.newTrigger('kuuHarjutusNimekiri').timeBased().after(60 * 1000).create();
}

function nimekiri() {
  ScriptApp.getProjectTriggers().forEach(function (x) { if (x.getHandlerFunction() === 'kuuHarjutusNimekiri') ScriptApp.deleteTrigger(x); });
  var p = PropertiesService.getScriptProperties(), lock = LockService.getScriptLock();
  if (!lock.tryLock(60000)) {
    var n = Number(p.getProperty('NIMEKIRI_PROOVID')) || 0;
    if (n < 5) { p.setProperty('NIMEKIRI_PROOVID', String(n + 1)); nimekiriTaimer_(); }
    return;
  }
  try {
    p.deleteProperty('NIMEKIRI_PROOVID');
    koigile_(null, function () {
      var pub = avalik_();
      if (pub) { laienda_(pub); sobita_(pub, tana_(), true, true); }
    });
  } finally { lock.releaseLock(); }
}

function ylevaateTaimer_() {
  var props = props_(), vana = Number(props.getProperty('YLEVAADE')) || 0;
  props.setProperty('YLEVAADE', String(Date.now()));
  var tr = ScriptApp.getProjectTriggers().filter(function (x) { return x.getHandlerFunction() === 'kuuHarjutusYlevaade'; });
  if (tr.length && Date.now() - vana < 10 * 60 * 1000) return;
  tr.forEach(function (x) { ScriptApp.deleteTrigger(x); });   // vana päästik jäi kuidagi alles
  ScriptApp.newTrigger('kuuHarjutusYlevaade').timeBased().after(5 * 60 * 1000).create();
}

// 5 minutit pärast viimast valikut läheb Ülevaade tagasi praegusele kuule.
function ylevaade() {
  var aeg = Number(props_().getProperty('YLEVAADE')) || 0, jaanud = aeg + 5 * 60 * 1000 - Date.now();
  ScriptApp.getProjectTriggers().forEach(function (tr) { if (tr.getHandlerFunction() === 'kuuHarjutusYlevaade') ScriptApp.deleteTrigger(tr); });
  if (jaanud > 30000) { ScriptApp.newTrigger('kuuHarjutusYlevaade').timeBased().after(jaanud).create(); return; }
  koigile_(null, function () {
    var pub = avalik_(), b = pub && pub.getSheetByName(T_BOARD);
    if (b && str_(b.getRange('C4').getValue()) !== CUR_LABEL) b.getRange('C4').setValue(CUR_LABEL);
  });
}

// Öine hooldus: nimekiri, kuu lõpp, uus kuu, plaani muudatused, lukud, numbrid.
function hooldus_() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(120000)) throw new Error('Skript oli hõivatud, proovin järgmisel ööl uuesti.');
  try {
    var vead = [];
    koigile_(null, function () {
      try { hooldus1_(); } catch (err) { vead.push(err && err.message ? err.message : String(err)); }
    });
    if (vead.length) throw new Error(vead.join(' | '));
  } finally { lock.releaseLock(); }
}

function hooldus1_() {
  {
    var pub = avalik_();
    if (!pub) throw new Error('Ühist tabelit' + (GRUPP_ ? ' (' + GRUPP_.nimi + ')' : '') + ' ei leitud. Vali privaatses tabelis „Kuu harjutus → Seadista“.');
    var priv = privaatne_(), plan = plaan_(priv), t = tana_(), vead = [];
    var samm = function (nimi, fn) {
      try { fn(); } catch (err) { vead.push(nimi + ': ' + (err && err.message ? err.message : err)); }
    };
    samm('ajavöönd', function () { tz_(pub); tz_(priv); });
    samm('vanad koopiad', function () { varukoopia_(pub); });
    samm('read', function () { laienda_(pub); });
    samm('keel', function () { keel_(pub, 'Eesti'); });           // igaüks valib keele ise, hommikul on see jälle eesti
    samm('lõppenud kuu', function () { kuulehed_(pub, true).forEach(function (m) { if (!m.frozen && t > m.end) staatiline_(m); }); });
    samm('nimekiri', function () { sobita_(pub, t, false); });
    samm('märkused', function () { markused_(pub); });
    samm('kommentaarid', function () { kommentaarid_(pub); });
    samm('pausile', function () {
      var nimed = eiTaitnud_(pub, t), to = plan ? saaja_(plan) : '';
      if (nimed.length && to) kiri_({ to: to, subject: 'Kuu harjutus: ' + nimed.length + ' pausile', body: 'Viimase 7 päeva jooksul polnud kirjeid, seepärast alustavad uut kuud pausil: ' + nimed.join(', ') +
        '.\nNad saavad tagasi, kui valivad nimekirjas „Osalen“.\n\nNo entries in the last 7 days, so these people start the new month paused: ' + nimed.join(', ') + '.\nThey can come back by picking “Osalen · In” on the roster.' });
    });
    samm('päevad', function () { kuulehed_(pub, true).forEach(function (m) { if (!m.frozen) puhastaPaevad2_(m); }); });
    samm('tasemed', function () { tasemed_(pub, t); });
    samm('graafik', function () { graafik_(pub); });
    samm('loosivõitjad', function () { voitjadVaade_(pub, false); });
    if (plan) samm('auhinnad', function () { auhinnad_(plan); });
    samm('kuu lõpp', function () {
      kuulehed_(pub).forEach(function (m) { if (!m.frozen && t > m.end + 1) kylmuta_(pub, m); });
    });
    if (plan) samm('postituste tekstid', function () { postiValemid_(plan); });
    if (plan && GRUPP_) samm('grupi valemid', function () { var p = grupid_(priv)[0]; if (p) grupiValemid_(plan, p); });
    if (GRUPP_) samm('pealkiri', function () { pealkiri_(pub); });
    if (plan) {
      samm('uus kuu', function () { uuedKuud_(pub, plan, t); });
      samm('plaan', function () { synk_(pub, plan, t); });
    }
    samm('järjestus', function () { jarjesta_(pub, t); });
    if (!GRUPP_) samm(KLOON + ' teistesse gruppidesse', function () { kloon_(t); });
    samm('lukud', function () { kaitseKoik_(pub, t); });
    samm('autahvel', function () { var f = pub.getSheetByName(T_FAME); if (f) { autahvliKorgus_(f); koigiAegade_(pub); } });
    samm('logi', function () { logiLyhemaks_(priv); });
    samm('ülevaade', function () {
      var b = pub.getSheetByName(T_BOARD);
      if (b) b.getRange('C4').setValue(CUR_LABEL);
      ScriptApp.getProjectTriggers().forEach(function (x) { if (x.getHandlerFunction() === 'kuuHarjutusYlevaade') ScriptApp.deleteTrigger(x); });
    });
    if (plan) samm('numbrid', function () { plan.getRange(C_PREVIEW).setFormula('=TODAY()'); statistika_(plan, pub, t); });
    var props = props_();
    if (vead.length) {
      props.setProperty('OINE_VIGA', vead.join(' | ').slice(0, 2000));
      throw new Error('Kuu harjutus' + silt_() + ': ' + vead.join(' | '));
    }
    props.setProperty('OINE_OK', String(Date.now()));
    props.deleteProperty('OINE_VIGA');
  }
}

// Kes 7 päevaga taset ei valinud, saab Põhi (sama eesmärk arvestati tal ka seni). Tase on siis niikuinii lukus.
function tasemed_(pub, t) {
  var ro = pub.getSheetByName(T_ROSTER);
  if (!ro) return;
  var liit = ro.getRange(RR0, 4, N, 1).getValues();
  kuulehed_(pub, true).forEach(function (m) {
    if (m.frozen || t > m.end || t <= m.start + 6) return;
    var a = m.sh.getRange(R0, 1, N, 2), v = a.getValues(), b = v.map(function (r) { return [r[1]]; }), muutus = false;
    v.forEach(function (r, k) {
      if (!str_(r[0]) || str_(r[1])) return;
      var j = toSerial_(liit[k][0]);
      if (t > Math.max(m.start, j === null ? m.start : j) + 6) { b[k][0] = TASEMED[1]; muutus = true; }
    });
    if (muutus) m.sh.getRange(R0, 2, N, 1).setValues(b);
  });
}

// Ülevaate graafiku abiandmed (tulbad Q–S) on peidus, graafik näitab neid ikka.
var GRAAFIK = 'Grupi korduste arv päevas / Group reps per day';
function graafik_(pub) {
  var b = pub.getSheetByName(T_BOARD);
  if (!b) return;
  var ch = b.getCharts()[0];
  if (!ch) return;
  try { if (ch.getOptions().get('title') !== GRAAFIK) { b.updateChart(ch.modify().setOption('title', GRAAFIK).build()); ch = b.getCharts()[0]; } }
  catch (err) { Logger.log('graafiku pealkiri: ' + err); }   // vanemas tabelis oli „Grupp kokku päevas“
  if (b.isColumnHiddenByUser(17)) return;
  try { b.updateChart(ch.modify().setHiddenDimensionStrategy(Charts.ChartHiddenDimensionStrategy.SHOW_BOTH).build()); }
  catch (err) { Logger.log('graafik: ' + err); return; }       // kui ei õnnestu, jäävad tulbad nähtavaks (graafik töötab ikka)
  b.hideColumns(17, 3);
}

// Erik 1.10: igaöised koopiad risustasid Sheetsi failide nimekirja, nii et koopiaid enam ei tehta. Turvavõrk on Google'i
// enda versiooniajalugu (ühine tabel → Fail → Versiooniajalugu), see hoiab iga muudatuse alles. Skripti varem tehtud
// koopiad lähevad prügikasti (sealt saab 30 päeva jooksul tagasi võtta), tühi kaust „Kuu harjutuse varukoopiad“ samuti.
function varukoopia_(pub) {
  var vanem = kaust_(pub), p = vanem ? DriveApp.getFolderById(vanem) : DriveApp.getRootFolder();
  var it = p.getFoldersByName(VARU);
  while (it.hasNext()) {
    var k = it.next();
    if (k.isTrashed()) continue;
    var fi = k.getFiles(), alles = 0;
    while (fi.hasNext()) {
      var f = fi.next();
      if (f.isTrashed()) continue;
      if (f.getName().indexOf(pubNimi_() + ' 2') === 0) f.setTrashed(true); else alles++;   // teise grupi koopiad koristab tema ise
    }
    if (!alles) k.setTrashed(true);
  }
}

// Päeva jooksul pandud teated (märkused) kustuvad öösel.
function markused_(pub) {
  var ro = pub.getSheetByName(T_ROSTER);
  if (ro) ro.getRange(RR0, 2, N, 2).clearNote();
  kuulehed_(pub, true).forEach(function (m) { if (!m.frozen) m.sh.getRange(R0, 1, N, 3).clearNote(); });
}

// Öösel samad parandused päevade lahtritele kui muudatuse ajal (kui keegi kleepis palju korraga): tüüp ja valemid.
function puhastaPaevad2_(m) {
  paevadeKontroll_(m, m.sh.getRange(R0, FD, N, 31), false);
}

// Erik 20.10: osalejate märkusi päevade lahtrites ei taha. Sheets ei lase kommenteerimist välja lülitada ja Drive'i API lubab
// kommentaari kustutada ainult selle autoril (403), seega kommentaare skript ei puutu (Erik kustutab need ise: Sheets → kommentaari
// kolme täpi menüü → Delete). Märkused päevade lahtrites (märkuse autorit ei näe, ka omaniku märkus kaob) tühjendatakse öösel ja kell 10.
// Skripti enda märkused on veergudes A–C, nimekirjas ja 2x lahtris (rida 4), neid see ei puuduta.
function kommentaarid_(pub) {
  kuulehed_(pub, true).forEach(function (m) { if (!m.frozen) m.sh.getRange(R0, FD, N, 31).clearNote(); });
}

// Erik 20.10: kes pole kuu viimase 7 päeva jooksul midagi kirja pannud (number, J või H), alustab uut kuud pausil, muidu loetakse
// lahkunuid ühisesse eesmärki ja protsenti. Erik 25.10: kes ei kirjutanud terve kuu jooksul ühtegi korda, jääb pausita (võis alustada poole pealt). Otsus tehakse kuu lõpetanud ööl 2. kuupäeval (siis on viimase päeva kirjed ka lisatud),
// üks kord kuus. Erik ise, juba pausil või eemaldamist ootavad, alles viimase 7 päeva sees liitunud ja need, kes on juba uuel kuul
// midagi kirja pannud, jäävad alles. Tagasi saab alati: nimekirjas „Osalen“. Tagastab pausile pandud nimed.
var PAUSI_PAEVI = 7;                                         // 0 = reegel väljas (testid)
function eiTaitnud_(pub, t) {
  if (!PAUSI_PAEVI) return [];
  var ro = pub.getSheetByName(T_ROSTER);
  if (!ro || nimekirjaKohti_(ro) < N) return [];
  var props = props_(), kuud = kuulehed_(pub);
  var vana = kuud.filter(function (m) {
    return t >= m.end + 2 && t <= m.end + 4 && !props.getProperty('eitaitnud:' + pub.getId() + ':' + m.start);
  }).pop();
  if (!vana) return [];
  props.setProperty('eitaitnud:' + pub.getId() + ':' + vana.start, String(t));
  var uus = kuud.filter(function (m) { return m.start === vana.end + 1; })[0];
  if (!uus) return [];
  var v = ro.getRange(RR0, 2, N, 5).getValues();
  var vp = vana.sh.getRange(R0, FD, N, vana.days).getValues(), up = uus.sh.getRange(R0, FD, N, uus.days).getValues();
  var kirje = function (x) { return typeof x === 'number' || /^[JH]$/i.test(str_(x)); };
  var nimed = [], elavad = kuud.filter(function (m) { return !m.frozen && m.start > vana.end; });
  v.forEach(function (r, k) {
    var nimi = str_(r[0]), liitus = toSerial_(r[2]);
    if (!nimi || nimi.toLowerCase() === KLOON.toLowerCase() || r[1] === PAUSE || r[1] === REMOVE || str_(r[4]) === REMOVE) return;
    if (liitus !== null && liitus > vana.end - PAUSI_PAEVI + 1) return;       // liitus viimase 7 päeva sees
    if (!vp[k].some(kirje)) return;                                           // terve kuu ilma kirjeta: ilmselt alustas poole pealt ega taha alustada (Erik 25.10)
    if (vp[k].slice(vana.days - PAUSI_PAEVI).some(kirje) || up[k].some(kirje)) return;
    ro.getRange(RR0 + k, 3).setValue(PAUSE).setNote('Kuu viimase 7 päeva jooksul polnud kirjeid, seepärast alustad uut kuud pausil. Tahad jätkata? Vali siin „Osalen“. / ' +
      'There were no entries in the last 7 days of the month, so you start the new month paused. Want to continue? Pick “Osalen · In” here.');
    ro.getRange(RR0 + k, 6).setValue(PAUSE);
    elavad.forEach(function (m) { tyhjenda_(m, k, false); });
    nimed.push(nimi);
  });
  return nimed;
}

function logiLyhemaks_(priv) {
  var lg = priv.getSheetByName(T_LOGI);
  if (lg && lg.getRange('A1').getValue() === 'Aeg' && lg.getLastRow() > 5001) lg.deleteRows(2, lg.getLastRow() - 5001);
}

// ================================================================ nimekiri

// Viib kuu vahekaardid nimekirjaga kooskõlla. Veerud E ja F (peidus) mäletavad eelmist nime ja olekut.
// naita = true: muudatus kohe (teated tagasi); false: öine hooldus, alles siis eemaldamised ja tühjade ridade kokkutõmbamine.
function sobita_(pub, t, naita, logist) {
  var ro = pub.getSheetByName(T_ROSTER);
  if (nimekirjaKohti_(ro) < N) return [];                      // vana 50 kohaga tabel, laienda_ pole veel õnnestunud
  var v0 = ro.getRange(RR0, 2, N, 5).getValues();          // B nimi, C olek, D liitus, E eelmine nimi, F eelmine olek
  var v = v0.map(function (r) { return [str_(r[0]), str_(r[1]), toSerial_(r[2]), str_(r[3]), str_(r[4])]; });
  var algne = JSON.stringify(v);
  var kuud = null, teated = [];
  var elus = function () {                                  // lukustamata kuud (ka lõppenud kuu 1. kuupäeval)
    if (!kuud) kuud = kuulehed_(pub, true).filter(function (m) { return !m.frozen && t <= m.end + 1; });
    return kuud;
  };
  var kaivad = function () {                                // käimasolevad ja tulevased kuud: ainult neis liiguvad read
    return elus().filter(function (m) { return t <= m.end; });
  };

  // Keegi tõstis või sorteeris nimesid: kõik nimed lähevad oma kohale tagasi.
  var koht = {};
  v.forEach(function (r, k) { if (r[3]) koht[r[3]] = k; });
  var tostetud = v.some(function (r, k) { return r[0] && r[0] !== r[3] && koht.hasOwnProperty(r[0]) && koht[r[0]] !== k; });
  if (tostetud) {
    var uued = v.filter(function (r) { return r[0] && !koht.hasOwnProperty(r[0]); }).map(function (r) { return [r[0], r[1]]; });
    v.forEach(function (r) { r[0] = r[3]; r[1] = r[3] ? r[4] : r[1]; });
    uued.forEach(function (u) {
      for (var k = 0; k < N; k++) if (!v[k][0] && !v[k][3]) { v[k][0] = u[0]; v[k][1] = u[1]; return; }
    });
    teated.push('Nimede järjekorda muuta ei saa, panin need tagasi. / Names can\'t be moved, I put them back.');
  }

  // Kellegi teise nimi kirjutati üle (tal on selle kuu kirjeid, nimi täiesti teine): vana nimi tagasi, uus nimi esimesse vabasse ritta.
  for (var o = 0; o < N; o++) {
    var ov = v[o];
    if (!ov[0] || !ov[3] || ov[0] === ov[3] || sarnane_(ov[0], ov[3])) continue;
    if (!elus().some(function (m) { return kirjed_(m, o); })) continue;
    var uusNimi = ov[0];
    ov[0] = ov[3];
    teated.push('See rida on ' + ov[3] + ' oma ja tal on selle kuu tulemusi, panin nime tagasi. Kirjuta „' + uusNimi + '“ esimesse vabasse ritta. / ' +
      'This row is ' + ov[3] + '\'s and has results this month, so I put the name back. Type “' + uusNimi + '” in the first empty row.');
  }

  // Uus nimi kaugemal kui esimene vaba rida: tõstan selle esimesse vabasse ritta, et vahele ei jääks tühje ridu.
  for (var u = 0; u < N; u++) {
    if (!v[u][0] || v[u][3]) continue;
    for (var w = 0; w < u; w++) {
      if (v[w][0] || v[w][3]) continue;
      v[w] = v[u]; v[u] = ['', '', null, '', ''];
      teated.push(v[w][0] + ': panin nime esimesse vabasse ritta. / ' + v[w][0] + ': moved to the first empty row.');
      break;
    }
  }

  // „Kinnitan eemaldamise“: öösel kaob inimene käimasolevatelt kuudelt, järgmised nihkuvad üles (alt üles, et indeksid ei nihkuks).
  // Lõppenud kuudes jääb tema rida alles nimega „Endine osaleja“.
  var eemaldati = false;
  for (var q = N - 1; q >= 0; q--) {
    var x = v[q];
    if (x[1] !== CONFIRM) continue;
    if (x[3] && x[4] === REMOVE && naita) {
      teated.push(x[3] + ' eemaldatakse täna öösel. Eksisid? Vali „Osalen“. / ' + x[3] + ' will be removed tonight. Mistake? Pick “Osalen · In”.');
    } else if (x[3] && x[4] === REMOVE) {
      var nimed = [x[3], x[0]].filter(function (s) { return s; });
      kuulehed_(pub).forEach(function (m) { eemaldaKuust_(m, q, nimed, t); });
      v.splice(q, 1);
      v.push(['', '', null, '', '']);
      eemaldati = true;
      teated.push(x[3] + ' on eemaldatud. / ' + x[3] + ' was removed.');
    } else {
      x[1] = x[4] === PAUSE ? PAUSE : x[3] ? IN : '';
      if (x[3]) teated.push('Kinnitamiseks vali enne „Eemalda · Remove“ ja siis „Kinnitan eemaldamise“. / Pick “Eemalda · Remove” first, then “Kinnitan eemaldamise · Confirm removal”.');
    }
  }

  for (var k = 0; k < N; k++) {
    var r = v[k];
    if (!r[0] && !r[3]) { r[2] = null; r[4] = ''; continue; }            // tühi rida
    if (r[1] === CONFIRM && r[0] === r[3]) continue;                      // eemaldatakse öösel
    if (!r[0]) {                                                          // nimi kustutati
      var kirjas = elus().some(function (m) { return kirjed_(m, k); });
      if (kirjas) {
        r[0] = r[3];
        teated.push(r[3] + ': sellel nimel on selle kuu kirjeid, nii seda kustutada ei saa. Järgmisel kuul ei osale? Vali „Paus“. ' +
          'Lõpetad päriselt? Vali „Eemalda“ ja siis „Kinnitan eemaldamise“. / ' +
          r[3] + ' has entries this month and can\'t be deleted like this. Skipping next month? Pick “Paus · Pause”. ' +
          'Leaving for good? Pick “Eemalda · Remove”, then “Kinnitan eemaldamise · Confirm removal”.');
      } else {
        kaivad().forEach(function (m) { tyhjenda_(m, k, true); });
        r[1] = ''; r[2] = null; r[3] = ''; r[4] = '';
      }
      continue;
    }
    if (!r[3]) {                                                          // uus nimi
      var st = r[1] === PAUSE ? PAUSE : IN;
      var lt = (!naita || logist) ? logiLiitumine_(r[0], t) : null;       // ootel nimi (lukk oli kinni): liitumise päev on see, mil nimi kirja pandi
      var lp = lt === null ? t : lt;
      r[1] = st; r[2] = lp; r[3] = r[0]; r[4] = st;
      kaivad().forEach(function (m) { liida_(m, k, lp); });
      if (st === PAUSE) kaivad().forEach(function (m) { paus_(m, k, lp); });
      continue;
    }
    if (r[2] === null && r[1] !== REMOVE) {                               // Erik 3.10: nimi on, liitumiskuupäev puudub
      var lii = liitumine_(pub, r[0], k, t);
      r[2] = lii;
      kaivad().forEach(function (m) { if (!onValem_(m, k)) liida_(m, k, lii); else xTaide_(m, k, lii); });
      teated.push(r[0] + ': liitumiskuupäev oli puudu, panin selle kirja. / ' + r[0] + ': the join date was missing, I filled it in.');
    }
    r[3] = r[0];                                                          // nimi võis muutuda: kuu vahekaardid võtavad selle ise
    if (r[1] === REMOVE) {                                                // ootab kinnitust: kuu vahekaardid jäävad nagu olid
      if (r[4] !== REMOVE) {
        r[4] = REMOVE;
        teated.push(r[0] + ': kinnitamiseks vali samas lahtris „Kinnitan eemaldamise“. Siis kustuvad see nimi ja kõik selle tulemused igalt vahekaardilt. Eksisid? Vali „Osalen“. / ' +
          r[0] + ': to confirm, pick “Kinnitan eemaldamise · Confirm removal” in the same cell. The name and all its results are then deleted from every tab. Mistake? Pick “Osalen · In”.');
      }
      continue;
    }
    var olek = r[1] === PAUSE ? PAUSE : IN;
    r[1] = olek;
    if (olek !== r[4]) {
      if (olek === PAUSE) {
        kaivad().forEach(function (m) { paus_(m, k, t); });
      } else {
        var hiljem = false;
        kaivad().forEach(function (m) { if (tagasi_(m, k, t)) hiljem = true; });
        if (hiljem) r[2] = t;                                             // tuli tagasi kuu keskel
      }
      r[4] = olek;
    }
  }

  // Öösel: tühjad read nimede vahel kaovad, allolevad nimed ja nende kuu read nihkuvad üles.
  for (var g = N - 2; g >= 0 && !naita; g--) {
    if (v[g][0] || v[g][3]) continue;
    var allpool = false;
    for (var h = g + 1; h < N; h++) if (v[h][0] || v[h][3]) { allpool = true; break; }
    if (!allpool) continue;
    kaivad().forEach(function (m) { eemaldaKuust_(m, g, [], t); });
    v.splice(g, 1);
    v.push(['', '', null, '', '']);
    eemaldati = true;
  }
  // Öösel: kuu vahekaardil ei jää ühtegi nime ega kirjet ridadele, mille nimekirjas pole kedagi.
  if (!naita) kaivad().forEach(function (m) {
    var ala = m.sh.getRange(R0, 1, N, 34), mv = ala.getValues(), mf = ala.getFormulas();
    for (var k2 = 0; k2 < N; k2++) {
      if (v[k2][0] || v[k2][3]) continue;
      var must = !mf[k2][0] && str_(mv[k2][0]) !== '';
      for (var c2 = 1; c2 < 34 && !must; c2++) if (str_(mv[k2][c2]) !== '') must = true;
      if (must) tyhjenda_(m, k2, true);
    }
  });

  if (eemaldati) {                                                        // palju ridu muutus: kirjuta korraga
    ro.getRange(RR0, 2, N, 5).setValues(v.map(function (r) { return [txt_(r[0]), txt_(r[1]), r[2] === null ? '' : r[2], txt_(r[3]), txt_(r[4])]; }));
    ro.getRange(RR0, 4, N, 1).setNumberFormat('d.mm.yyyy');
  } else if (JSON.stringify(v) !== algne) {
    var ennem = JSON.parse(algne);
    for (var i = 0; i < N; i++) {                                         // üks rida korraga: olek, kuupäev ja eelmine nimi ei jää pooleli
      var nm = v[i][0] !== ennem[i][0], muutus = nm;
      for (var j = 1; j < 5 && !muutus; j++) if (v[i][j] !== ennem[i][j]) muutus = true;
      if (!muutus) continue;
      var rida = [txt_(v[i][0]), txt_(v[i][1]), v[i][2] === null ? '' : v[i][2], txt_(v[i][3]), txt_(v[i][4])].slice(nm ? 0 : 1);   // nime lahtrisse puutun ainult siis, kui see muutus
      ro.getRange(RR0 + i, nm ? 2 : 3, 1, rida.length).setValues([rida]);
      if (v[i][2] !== null) ro.getRange(RR0 + i, 4).setNumberFormat('d.mm.yyyy');
    }
  }
  return teated;
}

// Liitumiskuupäev, mis nimekirjast puudub (nimi kirjutati, aga kuupäeva kirjutamine jäi pooleli). Otsib kolmest kohast:
// 1) muudatuste logist: millal see nimi nimekirja kirjutati, 2) kuu vahekaardi X-idest (liitumise päevani on X), 3) täna.
function liitumine_(pub, nimi, k, t) {
  var d = logiLiitumine_(nimi, t);
  if (d !== null) return d;
  var m = kuulehed_(pub, true).filter(function (x) { return !x.frozen && x.start <= t && t <= x.end; })[0];
  if (m && onValem_(m, k)) {
    var v = m.sh.getRange(R0 + k, FD, 1, m.days).getValues()[0], c = 0;
    while (c < v.length && str_(v[c]).toUpperCase() === 'X') c++;
    return Math.min(t, m.start + c);
  }
  return t;
}

function logiLiitumine_(nimi, t) {
  try {
    var id = props_().getProperty('PRIV_ID');
    var lg = id ? SpreadsheetApp.openById(id).getSheetByName(T_LOGI) : null;
    if (!lg || lg.getLastRow() < 2) return null;
    var n = Math.min(lg.getLastRow() - 1, 5000), v = lg.getRange(lg.getLastRow() - n + 1, 1, n, 5).getValues();
    var tab = (GRUPP_ ? GRUPP_.nimi + ' · ' : '') + T_ROSTER, lc = nimi.toLowerCase(), parim = null, uus = false;
    for (var i = 0; i < v.length; i++) {                      // logi on ajajärjekorras: viimane tühja lahtrisse kirjutatud sama nimi, muidu viimane sama nimi
      if (String(v[i][1]) !== tab || !/^B\d+$/.test(String(v[i][2])) || str_(v[i][4]).toLowerCase() !== lc) continue;
      var a = v[i][0], d = a instanceof Date ? toSerial_(a) : null, tuhi = str_(v[i][3]) === '';
      if (d === null) { var q = String(a).slice(0, 10).split('-'); if (q.length === 3 && Number(q[0]) > 2000) d = serial_(Number(q[0]), Number(q[1]), Number(q[2])); }
      if (d === null || d > t || (uus && !tuhi)) continue;
      parim = d; uus = uus || tuhi;
    }
    return parim;
  } catch (err) { return null; }
}

// Sama inimese nimi: kirjaviga parandatud (lühikeses nimes 1, pikemas 2 tähte), perenimi või initsiaal lisatud (Mari → Mari T).
function sarnane_(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase();
  var lyhem = Math.min(a.length, b.length);
  return erinevus_(a, b) <= (lyhem < 6 ? 1 : 2) || (lyhem >= 3 && (a.indexOf(b) === 0 || b.indexOf(a) === 0));
}

// Kahe nime erinevus tähtedes (Levenshtein): „Mari“ → „Mari K“ on 2, „Mari“ → „Jüri“ on 3.
function erinevus_(a, b) {
  var p = [];
  for (var j = 0; j <= b.length; j++) p.push(j);
  for (var i = 1; i <= a.length; i++) {
    var q = [i];
    for (var j2 = 1; j2 <= b.length; j2++) q.push(Math.min(p[j2] + 1, q[j2 - 1] + 1, p[j2 - 1] + (a.charAt(i - 1) === b.charAt(j2 - 1) ? 0 : 1)));
    p = q;
  }
  return p[b.length];
}

// Kuu alguses lähevad pausil olijad nimekirja lõppu, et kuu vahekaardi ülemised read oleksid osalejate omad.
// Tehakse üks kord kuus, kuu esimestel päevadel (öine hooldus). Kirjed liiguvad inimesega kaasa.
function jarjesta_(pub, t) {
  var kuu = kuulehed_(pub, true).filter(function (m) { return !m.frozen && m.start <= t && t <= m.end; })[0];
  if (!kuu) return;
  var props = props_(), key = 'järjestus:' + pub.getId() + ':' + kuu.start;
  if (props.getProperty(key)) return;
  if (t <= kuu.start + 2) pausidLoppu_(pub, t);
  props.setProperty(key, String(t));
}

function pausidLoppu_(pub, t) {
  var ro = pub.getSheetByName(T_ROSTER);
  if (nimekirjaKohti_(ro) < N) return false;
  var ala = ro.getRange(RR0, 2, N, 5), v = ala.getValues(), osaleb = [], paus = [], tyhi = [];
  v.forEach(function (r, k) { (!str_(r[0]) && !str_(r[3]) ? tyhi : str_(r[1]) === PAUSE ? paus : osaleb).push(k); });
  var p = osaleb.concat(paus, tyhi);
  if (p.every(function (k, i) { return k === i; })) return false;
  ala.setValues(p.map(function (k) { return v[k].map(function (x) { return x === null ? '' : txt_(x); }); }));
  ro.getRange(RR0, 4, N, 1).setNumberFormat('d.mm.yyyy');
  kuulehed_(pub, true).forEach(function (m) {
    if (m.frozen || t > m.end) return;                      // lõppenud kuu nimed on juba paigas (staatiline_)
    var r = m.sh.getRange(R0, 1, N, 34), mv = r.getValues(), mf = r.getFormulas();
    var uus = p.map(function (k, i) {
      var row = [mf[k][0] ? nimeValem_(m.sh, R0 + i) : txt_(mv[k][0])];
      for (var c = 1; c < 34; c++) row.push(mv[k][c] === null ? '' : txt_(mv[k][c]));
      return row;
    });
    reeglitaKirjuta_(r, function (x) { x.setValues(uus); });
  });
  return true;
}

// Mitu nimerida on nimekirjas (tulp A on 1, 2, 3 …).
function nimekirjaKohti_(ro) {
  var n = Math.min(N, ro.getMaxRows() - RR0 + 1), a = n > 0 ? ro.getRange(RR0, 1, n, 1).getValues() : [], k = 0;
  while (k < a.length && Number(a[k][0]) === k + 1) k++;
  return k;
}

// Mitu osaleja rida on kuu vahekaardil: jalus („✓ eesmärk täis“) on kaks rida pärast viimast.
function kuuKohti_(sh) {
  var n = Math.min(sh.getMaxRows(), R0 + N + 5) - R0 + 1, f = sh.getRange(R0, 1, n, 1).getFormulas();
  for (var i = 0; i < n; i++) if (f[i][0].indexOf('hit target') >= 0) return i - 1;
  return -1;
}

// Vanem tabel oli 50 kohaga: nimekiri ja kuu vahekaardid saavad ridu juurde, nimed ja kirjed jäävad oma kohale.
function laienda_(pub) {
  var ro = pub.getSheetByName(T_ROSTER), muutus = false;
  if (!ro) return false;
  var o = nimekirjaKohti_(ro);
  if (o >= 10 && o < N) {
    var v = ro.getRange(RR0, 2, o, 5).getValues();
    ro.insertRowsBefore(RR0 + o - 1, N - o);                  // vahele lisatud read: kõik viited laienevad ise
    var uus = [];
    for (var k = 0; k < N; k++) uus.push(k < o ? v[k].map(function (x) { return x === null ? '' : txt_(x); }) : ['', '', '', '', '']);
    ro.getRange(RR0, 2, N, 5).setValues(uus);
    ro.getRange(RR0, 1, N, 1).setValues(uus.map(function (r, i) { return [i + 1]; }));
    ro.getRange(RR0, 4, N, 1).setNumberFormat('d.mm.yyyy');
    ro.setRowHeights(RR0, N, 24);
    nimekirjaVormid_(ro);
    muutus = true;
  }
  KUUD_ = null;
  kuulehed_(pub).forEach(function (m) { if (laiendaKuu_(m.sh)) muutus = true; });
  if (muutus) { viitedLaiendus_(pub); KUUD_ = null; }
  return muutus;
}

function laiendaKuu_(sh) {
  var o = kuuKohti_(sh);
  if (o < 10 || o >= N) return false;
  var ala = sh.getRange(R0, 1, o, 34), v = ala.getValues(), f = ala.getFormulas();
  var taust = sh.getRange(R0, 1, 2, 3).getBackgrounds();
  sh.insertRowsBefore(R0 + o - 1, N - o);
  var uus = [];
  for (var k = 0; k < N; k++) {
    var row = [k < o ? (f[k][0] ? nimeValem_(sh, R0 + k) : txt_(v[k][0])) : ''];
    for (var c = 1; c < 34; c++) row.push(k < o && v[k][c] !== null ? txt_(v[k][c]) : '');
    uus.push(row);
  }
  reeglitaKirjuta_(sh.getRange(R0, 1, N, 34), function (x) { x.setValues(uus); });
  var r1 = sh.getRange(R0, 35, 1, 13).getFormulasR1C1()[0];
  sh.getRange(R0, 35, N, 13).setFormulasR1C1(uus.map(function () { return r1; }));
  [2, FD].forEach(function (c) {
    var dv = sh.getRange(R0, c).getDataValidation();
    if (dv) sh.getRange(R0, c, N, c === FD ? 31 : 1).setDataValidation(dv);
  });
  sh.getRange(R0, 1, N, 3).setBackgrounds(uus.map(function (r, k) { return taust[k % 2]; }));
  sh.setRowHeights(R0, N, 21);
  return true;
}

// Ülevaate ja Autahvli valemid loevad kuu vahekaarti INDIRECT-iga (tekstina), need ei laiene ise.
function viitedLaiendus_(pub) {
  [T_BOARD, T_FAME].forEach(function (n) {
    var sh = pub.getSheetByName(n);
    if (!sh) return;
    var ala = sh.getRange(1, 1, Math.min(sh.getMaxRows(), 60), Math.min(sh.getMaxColumns(), 30)), f = ala.getFormulas();
    f.forEach(function (row, i) {
      row.forEach(function (x, j) {
        if (!x || x.indexOf('INDIRECT') < 0) return;
        var y = laiendaTekst_(x);
        if (y !== x) ala.getCell(i + 1, j + 1).setFormula(y);
      });
    });
  });
}

function laiendaTekst_(x) {
  var o = N_VANA, d = N - o;
  return x.replace(/!(\$?[A-Z]{1,3}\$?)(\d+):(\$?[A-Z]{1,3}\$?)(\d+)"/g, function (s, a, r1, b, r2) {
    return +r1 === R0 && +r2 === R0 + o - 1 ? '!' + a + r1 + ':' + b + (R0 + N - 1) + '"' : s;
  }).replace(/!(\$?[A-Z]{1,3}\$?)(\d+)"/g, function (s, a, r) {
    return +r === R0 + o + 1 || +r === R0 + o + 2 ? '!' + a + (+r + d) + '"' : s;
  });
}

// Uus inimene: kuu vahekaardil tuleb nimi nähtavale ja päevadele enne liitumist X.
function liida_(m, k, t) {
  if (t > m.end) return;                                  // lõppenud kuusse (1. kuupäev) uut nime ei lisa
  var a = m.sh.getRange(R0 + k, 1);
  if (a.getFormula() === '') a.setFormula(nimeValem_(m.sh, R0 + k));
  xTaide_(m, k, t);
}

// Paus: ainult tulevastest kuudest välja. Käimasolev kuu jätkub nagu enne.
function paus_(m, k, t) {
  if (m.start <= t) return;
  tyhjenda_(m, k, false);
}

// Tagasi: kuu vahekaardil tuleb nimi uuesti nähtavale. Tagastab true, kui kuu oli juba alanud.
function tagasi_(m, k, t) {
  if (t > m.end) return false;
  var a = m.sh.getRange(R0 + k, 1);
  if (a.getFormula() !== '') return false;
  a.setFormula(nimeValem_(m.sh, R0 + k));
  xTaide_(m, k, t);
  return t > m.start;
}

function tyhjenda_(m, k, jataValem) {
  m.sh.getRange(R0 + k, 2, 1, 33).clearContent();          // tase, paar, päevad
  var a = m.sh.getRange(R0 + k, 1);
  if (jataValem) { if (a.getFormula() === '') a.setFormula(nimeValem_(m.sh, R0 + k)); } else a.clearContent();
}

// Eemaldab inimese käimasolevalt kuu vahekaardilt: tema rida kaob ja allolevad read nihkuvad ühe võrra üles.
// Lõpetatud kuus jäävad tulemused alles (kuu summa ei muutu), nime asemele tuleb „Endine osaleja“.
function eemaldaKuust_(m, k, nimed, t) {
  var sh = m.sh, a = sh.getRange(R0, 1, N, 1), i = k;
  if (m.frozen || t > m.end) {
    staatiline_(m);
    var av = a.getValues().map(function (r) { return str_(r[0]); });
    for (var j = 0; j < N; j++) if (nimed.indexOf(av[j]) >= 0) sh.getRange(R0 + j, 1).setValue(EKS);
    return;
  }
  var n = N - i;
  var rng = sh.getRange(R0 + i, 1, n, 34), vals = rng.getValues(), fs = rng.getFormulas();
  var uus = [];
  for (var r = 0; r < n; r++) {
    var src = r + 1 < n ? r + 1 : -1, row = [];
    row.push(src < 0 || fs[src][0] !== '' ? nimeValem_(sh, R0 + i + r) : '');
    for (var c = 1; c < 34; c++) row.push(src < 0 ? '' : txt_(vals[src][c]));
    uus.push(row);
  }
  reeglitaKirjuta_(rng, function (x) { x.setValues(uus); });
}

// Lõppenud kuu nimed valemitest tekstiks, et nimekirja muudatused seda kuud enam ei nihutaks.
function staatiline_(m) {
  var a = m.sh.getRange(R0, 1, N, 1);
  if (!a.getFormulas().some(function (r) { return r[0]; })) return;
  a.setValues(a.getValues().map(function (r) { return [txt_(r[0])]; }));
}

// X kõigile tühjadele päevadele enne tänast.
function xTaide_(m, k, t) {
  var n = Math.min(m.days, t - m.start);
  if (n <= 0) return;
  var r = m.sh.getRange(R0 + k, FD, 1, n), v = r.getValues()[0], muutus = false;
  v = v.map(function (x) { if (x === '' || x === null) { muutus = true; return 'X'; } return x; });
  if (muutus) reeglitaKirjuta_(r, function (x) { x.setValues([v]); });
}

// Päevalahtri reegel ei lase skriptilgi X-i kirjutada, kui nimekirja liitumiskuupäev pole veel kirjas (nt uus nimi,
// mille kuupäev kirjutatakse alles pärast kuu vahekaarte). Skript paneb need X-id ise, seega reegel on kirjutamise ajaks maas.
function reeglitaKirjuta_(r, fn) {
  r.clearDataValidations();
  try { return fn(r); } finally { paevaReeglid_(r.getSheet()); }
}

// Kuu vahekaardi päevade ja taseme reegel, alati valmis kujul (mitte getDataValidations → setDataValidations: see nihutas
// suhtelisi viiteid ja kõik sissekanded muutusid kehtetuks, Erik 12.10 Swedis). Käib ka öösel, nii paraneb vigane reegel ise.
function paevaReeglid_(sh) {
  var piir = plank_(sh);
  sh.getRange(R0, FD, N, 31).setDataValidation(SpreadsheetApp.newDataValidation().requireFormulaSatisfied('=' + KH_PATCH.day_rule)
    .setAllowInvalid(false).setHelpText(piir ? PLANK_ABI : KH_PATCH.day_help).build());
  sh.getRange(R0, 2, N, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(TASEMED, true)
    .setAllowInvalid(false).setHelpText(KH_PATCH.level_help).build());
  plankPais_(sh, piir);
}

// Plangu kuu (Erik 27.10): kirja saab panna ainult 60, 90, 120, 150 … sekundit. Päevareegel (KH_PATCH.day_rule) tunneb
// plangu ise ära harjutuse nime järgi (AW8/AW9), siin on abitekst, päise lisa ja kleepimise kontroll (paevadeKontroll_).
var PLANK_MIN = 60, PLANK_SAMM = 30;
var PLANK_ABI = 'Kirjuta oma reale tänasesse või eilsesse lahtrisse: aeg sekundites 30 kaupa, alates 60-st (60, 90, 120, 150 …), J (kuni 2 kuus) või H. / ' +
  "Use your row, today's or yesterday's cell: seconds in steps of 30, from 60 (60, 90, 120, 150 …), J (max 2 a month) or H.";
var PLANK_PAIS = '&IF(' + LANG + '="English","  ·  ⏱ Enter seconds in steps of 30, from 60: 60, 90, 120, 150 …",' +
  '"  ·  ⏱ Kirjuta aeg 30 sekundi kaupa, alates 60-st: 60, 90, 120, 150 …")';
function plank_(sh) { return /plank/i.test(str_(sh.getRange(8, AW).getValue()) + ' ' + str_(sh.getRange(9, AW).getValue())); }
function plankOk_(x) { return x >= PLANK_MIN && x % PLANK_SAMM === 0; }
function plankPais_(sh, piir) {
  var c = sh.getRange(1, FD), f = c.getFormula();
  if (!f) return;
  var i = f.indexOf('⏱'), alus = i < 0 ? f : f.slice(0, f.lastIndexOf('&IF(', i));   // vana lisa ära, ka kui Sheets kirjutas valemi veidi teisiti
  var uus = alus + (piir ? PLANK_PAIS : '');
  if (uus !== f) c.setFormula(uus);
}

function onValem_(m, k) { return m.sh.getRange(R0 + k, 1).getFormula() !== ''; }

// Kas real on selle kuu kirjeid (number, J või H)?
function kirjed_(m, k) {
  return m.sh.getRange(R0 + k, FD, 1, 31).getValues()[0].some(function (x) {
    return typeof x === 'number' || /^[JH]$/i.test(String(x).trim());
  });
}

// Tase: valida ja muuta saab kuu (või oma liitumise) esimese 7 päeva jooksul, siis on see kuu lõpuni lukus.
var TASEMED = ['Algaja · Starter', 'Põhi · Base', 'Pluss · Plus', 'Tipp · Beast'];
function tase_(e, sh, t) {
  return lukk7_(e, sh, t, 'Taset saab valida ja muuta ainult esimese 7 päeva jooksul, nüüd on see kuu lõpuni lukus. / ' +
    'You can pick or change your level only in your first 7 days, now it\'s locked until the month ends.');
}

// Erik 1.10: tiimi saab kirja panna ja muuta samuti ainult esimese 7 päeva jooksul, et keegi ei teeks kuu lõpus
// juba 100% peal olijatega kiiresti tiimi ainult lisapiletite pärast.
function tiim_(e, sh, t) {
  return lukk7_(e, sh, t, 'Tiimi saab kirja panna või muuta ainult esimese 7 päeva jooksul kuu algusest või oma liitumisest. ' +
    'Nüüd on tiim kuu lõpuni lukus, seepärast võeti sinu muudatus tagasi. Uue tiimi saad teha järgmisel kuul. / ' +
    'You can set or change your team only in your first 7 days of the month or after joining. Your team is now locked ' +
    'until the month ends, so your change was undone. You can make a new team next month.');
}

// Tase ja tiim: lubatud kuu algusest või liitumisest 7 päeva, hiljem võetakse muudatus tagasi. true = võeti tagasi.
function lukk7_(e, sh, t, teade) {
  var r = e.range, row = r.getRow();
  if (r.getNumRows() !== 1 || row < R0 || row >= R0 + N) return false;
  var s = sh.getRange(1, AW, 2, 1).getValues();
  if (s[0][0] !== 'KUULEHT') return false;
  var start = toSerial_(s[1][0]);
  if (start === null) return false;
  var liitus = toSerial_(e.source.getSheetByName(T_ROSTER).getRange(RR0 + row - R0, 4).getValue());
  if (t <= Math.max(start, liitus === null ? start : liitus) + 6) return false;
  if (e.value === undefined && str_(r.getValue()) !== '') return false;   // kleepimine: vana väärtust ei tea, jätan alles
  if (e.oldValue === undefined || e.oldValue === null || e.oldValue === '') r.clearContent(); else r.setValue(e.oldValue);
  teata_(e, [teade]);
  return true;
}

// ================================================================ kuu vahekaardid

// Kõik kuu vahekaardid alguse järjekorras. elusad = true jätab vahele lõpetatud (aastaga nimega) vahekaardid.
var KUUD_ = null;
function kuulehed_(pub, elusad) {
  if (!KUUD_) {
    KUUD_ = [];
    pub.getSheets().forEach(function (sh) {
      if ([T_GUIDE, T_ROSTER, T_BOARD, T_FAME, T_RULES, T_PLAN].indexOf(sh.getName()) >= 0) return;
      var m = kuuInfo_(sh);
      if (m) KUUD_.push(m);
    });
    KUUD_.sort(function (a, b) { return a.start - b.start; });
  }
  return KUUD_.filter(function (m) { return !elusad || !/\d{4}/.test(m.name); });
}

function kuuInfo_(sh) {
  if (sh.getMaxColumns() < AW) return null;
  var v;
  try { v = sh.getRange(1, AW, 20, 1).getValues(); } catch (err) { return null; }
  if (v[0][0] !== 'KUULEHT') return null;
  var start = toSerial_(v[1][0]), days = Number(v[2][0]);
  if (start === null || !days) return null;
  return { sh: sh, name: sh.getName(), start: start, days: days, end: start + days - 1, frozen: v[19][0] === 'lukus',
    plank: /plank/i.test(str_(v[7][0]) + ' ' + str_(v[8][0])) };
}

function kuuLeht_(pub, y, m) {
  var s = serial_(y, m, 1), k = kuulehed_(pub);
  for (var i = 0; i < k.length; i++) if (k[i].start === s) return k[i];
  return null;
}

function uuedKuud_(pub, plan, t) {
  var d = ymd_(t), n = jargmine_(d[0], d[1]), cfg;
  if (!kuuLeht_(pub, d[0], d[1]) && (cfg = planRida_(plan, d[0], d[1]))) looKuu_(pub, d[0], d[1], cfg, t, topelt_(plan, d[0], d[1]));
  if (d[2] >= 20 && !kuuLeht_(pub, n[0], n[1]) && (cfg = planRida_(plan, n[0], n[1]))) looKuu_(pub, n[0], n[1], cfg, t, topelt_(plan, n[0], n[1]));
}

// Uus kuu vahekaart: alati uusimast mallist (mitte eelmise kuu koopiast), seaded plaanist, nimed nimekirjast.
function looKuu_(pub, y, m, cfg, t, topelt) {
  var start = serial_(y, m, 1), days = paevi_(y, m), nimi = lehenimi_(y, m);
  var kuud = kuulehed_(pub);
  for (var i = 0; i < kuud.length; i++) if (kuud[i].start === start) return kuud[i].sh;
  var ees = pub.getSheetByName(nimi);
  if (ees) {                                                // sama nimega vana vahekaart jääb alles teise nimega
    ees.setName(vabaNimi_(pub, nimi + ' (vana)'));
    if (kuuInfo_(ees)) registreeri_(pub, ees, nimi);
  }
  var ajutine = impordi_(PUB_NAME + ' (ajutine)', null), sh;
  try {
    var src = ajutine.getSheets().filter(function (s) { return kuuInfo_(s); })[0];
    sh = src.copyTo(pub);
    viited_(sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()), sh.getName(), nimi);
    sh.setName(nimi);
  } finally { DriveApp.getFileById(ajutine.getId()).setTrashed(true); }
  try {
  if (sh.isSheetHidden()) sh.showSheet();
  var g = pub.getSheetByName(T_GUIDE);
  if (g) sh.getRange('C1').setValue(str_(g.getRange('C3').getValue()) === 'English' ? 'English' : 'Eesti');
  var parast = kuud.length ? kuud[kuud.length - 1].sh.getIndex() : pub.getSheetByName(T_ROSTER).getIndex();
  pub.setActiveSheet(sh);
  pub.moveActiveSheet(parast + 1);
  KUUD_ = null;

  sh.getRange(2, AW, 14, 1).setValues([[start], [days]].concat(cfg.map(function (x) { return [txt_(x)]; })));
  sh.getRange(2, AW).setNumberFormat('d.mm.yyyy');
  sh.getRange(20, AW).clearContent();
  sh.getRange(21, AW).setValue(Math.max(start, t)).setNumberFormat('d.mm.yyyy');   // X enne seda kuupäeva on lubatud
  sh.getRange(R0, 2, N, 33).clearContent();                 // tase, paar, päevad
  sh.getRange(4, FD, 1, 31).clearContent();                 // 2x
  sh.getRange(22, AW).clearContent();
  topeltKuusse_({ sh: sh, days: days }, topelt || []);
  paevaReeglid_(sh);                                        // plangu kuu reegel ja päis kohe, mitte alles öösel
  var ro = pub.getSheetByName(T_ROSTER).getRange(RR0, 2, N, 2).getValues();
  sh.getRange(R0, 1, N, 1).setValues(ro.map(function (r, k) { return [str_(r[1]) === PAUSE ? '' : nimeValem_(sh, R0 + k)]; }));
  sh.getRange('A3').setFormula(a3Valem_(sh));
  var kuu = { sh: sh, name: nimi, start: start, days: days, end: start + days - 1, frozen: false };
  if (t > start) ro.forEach(function (r, k) { if (str_(r[0]) && str_(r[1]) !== PAUSE) xTaide_(kuu, k, t); });
  registreeri_(pub, sh);
  kaitse_(sh, kuuAvatud_(kuu, t));
  } catch (err) {                                           // pooleli jäänud vahekaart ei jää osalejatele näha
    try { pub.deleteSheet(sh); } catch (e2) {}
    KUUD_ = null;
    throw err;
  }
  return sh;
}

// Kuu on läbi (ja 1. kuupäeva lisapäev ka): nimed jäävad paigale, vahekaart lukku ja peitu.
function kylmuta_(pub, m) {
  var a = m.sh.getRange(R0, 1, N, 1);
  a.setValues(a.getValues().map(function (r) { return [txt_(r[0])]; }));
  var goal = m.sh.getRange(16, AW);                         // ühine eesmärk ei muutu enam, kui nimekiri muutub
  goal.setValue(goal.getValue());
  m.sh.getRange(20, AW).setValue('lukus');
  var d = ymd_(m.start), uus = ET_M[d[1] - 1] + ' ' + d[0] + ' | ' + EN_S[d[1] - 1] + ' ' + d[0];
  if (m.sh.getName() !== uus && !pub.getSheetByName(uus)) {
    var vana = m.sh.getName();
    m.sh.setName(uus);
    m.name = uus;
    registreeri_(pub, m.sh, vana);
  }
  kaitse_(m.sh, []);
  if (!m.sh.isSheetHidden()) m.sh.hideSheet();
  m.frozen = true;
}

// Kui plaanis muudetakse kuud, mis pole veel alanud, jõuab muudatus kuu vahekaardile.
// Plaani 2x päevad (tulp O) jõuavad ka käimasolevasse kuusse: kuu 4. rida on alati täpselt plaani päevad.
function synk_(pub, plan, t) {
  kuulehed_(pub, true).forEach(function (m) {
    if (m.frozen || t > m.end) return;
    var d = ymd_(m.start);
    topeltKuusse_(m, topelt_(plan, d[0], d[1]));
    if (m.start < t) return;
    var cfg = planRida_(plan, d[0], d[1]);
    if (!cfg) return;
    var r = m.sh.getRange(4, AW, 12, 1), cur = r.getValues();
    if (cfg.some(function (x, i) { return String(x) !== String(cur[i][0]); })) r.setValues(cfg.map(function (x) { return [txt_(x)]; }));
  });
}

// Kuu vahekaardi 4. rida on alati täpselt plaani 2x päevad (topeltpäevi muudab ainult korraldaja plaanis).
var TOPELT_MARKUS = 'Täna tuleb teha kahekordselt - saad ka 2x pileteid. Tavaline kogus annab ikka 1 pileti ja loeb päeva tehtuks, aga lahter jääb oranžiks.\n\nDo double your target today and you get 2x tickets. The normal amount still gives 1 ticket and counts the day as done, but the cell stays orange.';
function topeltKuusse_(m, paevad) {
  var r = m.sh.getRange(4, FD, 1, 31), v = r.getValues()[0], muutus = false;
  for (var p = 1; p <= 31; p++) {
    var uus = p <= m.days && paevad.indexOf(p) >= 0 ? '2x' : '';
    if (str_(v[p - 1]) !== uus) { v[p - 1] = uus; muutus = true; }
  }
  if (muutus) r.setValues([v]);
  var nt = r.getNotes()[0], viimane = R0 + N - 1;           // 2x päeval on kuldne raam kogu veeru ulatuses (rida 2 kuni viimane nimi) ja rea 4 lahtril seletus
  for (var q = 1; q <= 31; q++) {
    var on = str_(v[q - 1]) === '2x', c = FD + q - 1;
    if (on) {
      if (nt[q - 1] !== TOPELT_MARKUS) { m.sh.getRange(4, c).setNote(TOPELT_MARKUS); muutus = true; }
      m.sh.getRange(4, c, viimane - 3, 1).setBorder(null, null, true, null, null, true, '#E6DED3', SpreadsheetApp.BorderStyle.SOLID);   // hallid reajooned tagasi (v11y kustutas need)
      m.sh.getRange(2, c, viimane - 1, 1).setBorder(true, true, true, true, null, null, '#B7791F', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    } else if (nt[q - 1]) {
      m.sh.getRange(4, c).setNote('');
      var veerg = m.sh.getRange(2, c, viimane - 1, 1);
      veerg.setBorder(false, false, false, false, false, false);
      m.sh.getRange(4, c, viimane - 3, 1).setBorder(null, null, true, null, null, true, '#E6DED3', SpreadsheetApp.BorderStyle.SOLID);
      muutus = true;
    }
  }
  var mal = m.sh.getRange(22, AW);
  if (str_(mal.getValue())) mal.setValue('');                // v9b mäletas siin plaani päevi, enam pole vaja
  return muutus;
}

// Plaani tulp O: päevad, mis on 2x (näiteks „7, 21“).
function topelt_(plan, y, m) {
  var i = planiRida_(plan, y, m);
  if (i < 0) return [];
  var s = str_(plan.getRange(PL0 + i, PL_2X).getDisplayValue()), n = paevi_(y, m), out = [];
  (s.match(/\d+/g) || []).forEach(function (x) { var p = Number(x); if (p >= 1 && p <= n && out.indexOf(p) < 0) out.push(p); });
  return out;
}

// Plaani rea number (0 = rida 3) kuule y-m, -1 kui sellist rida pole.
function planiRida_(plan, y, m) {
  var b = plan.getRange(PL0, 2, PLN, 1).getValues();
  for (var i = 0; i < PLN; i++) {
    var s = toSerial_(b[i][0]);
    if (s === null) continue;
    var d = ymd_(s);
    if (d[0] === y && d[1] === m) return i;
  }
  return -1;
}

// Autahvli veerg A on kuude nimekiri (sealt loevad Ülevaade ja Autahvel), veerus AC vahekaardi gid.
function registreeri_(pub, sh, vanaNimi) {
  var f = pub.getSheetByName(T_FAME);
  if (!f) return;
  var a = f.getRange(FAME0, 1, FAMEN, 1).getValues(), g = f.getRange(FAME0, FAME_GID, FAMEN, 1).getValues();
  var nimi = sh.getName(), gid = sh.getSheetId(), i;
  for (i = 0; i < FAMEN; i++) {
    var v = String(a[i][0]);
    if (v === nimi || (vanaNimi && v === vanaNimi) || (v && Number(g[i][0]) === gid)) break;
  }
  if (i === FAMEN) {
    for (i = 0; i < FAMEN; i++) if (String(a[i][0]) === '') break;
    if (i === FAMEN) {                                      // täis: vanim kuu läheb välja
      var jv = f.getRange(FAME0, 10, FAMEN, 1).getValues();
      f.getRange(FAME0, 1, FAMEN - 1, 1).setValues(a.slice(1));
      f.getRange(FAME0, 10, FAMEN - 1, 1).setValues(jv.slice(1));
      f.getRange(FAME0, FAME_GID, FAMEN - 1, 1).setValues(g.slice(1));
      f.getRange(FAME0 + FAMEN - 1, 10).clearContent();
      i = FAMEN - 1;
    }
  }
  f.getRange(FAME0 + i, 1).setValue(nimi);
  f.getRange(FAME0 + i, FAME_GID).setValue(gid);
}

// Juhendi lingid (nimekiri ja käimasolev kuu) ja kuu vahekaartide „tänane päev“ link.
function lingid_(pub) {
  var g = pub.getSheetByName(T_GUIDE), ro = pub.getSheetByName(T_ROSTER);
  var c = g.getRange(1, 3, Math.min(80, g.getMaxRows()), 1).getValues(), kuuLink = null, nimekLink = null;
  c.forEach(function (r, i) {
    var s = String(r[0]);
    var k = s.indexOf('👉'); if (k < 0 || k > 20) return;          // „[VAJUTA SIIA] 👉 …“ (1.10), varem „👉 …“
    if (s.indexOf('Nimekiri') >= 0 && !nimekLink) nimekLink = i + 1; else if (!kuuLink) kuuLink = i + 1;
  });
  var P = 'IF($C$3="English","[TAP HERE] ","[VAJUTA SIIA] ")&';      // Erik 1.10: lingi ees selge käsk
  if (nimekLink) g.getRange(nimekLink, 3).setFormula('=HYPERLINK("#gid=' + ro.getSheetId() + '&range=B4",' + P + '"👉 ' + T_ROSTER + '")');
  var F = "'" + T_FAME + "'!";
  if (kuuLink) g.getRange(kuuLink, 3).setFormula('=IFERROR(HYPERLINK("#gid="&INDEX(' + F + '$AC$5:$AC$40,MATCH(' + F + '$AB$4,' +
    F + '$A$5:$A$40,0)),' + P + '"👉 "&' + F + '$AB$4),' + P + '"👉 "&' + F + '$AB$4)');
  kuulehed_(pub).forEach(function (m) {
    registreeri_(pub, m.sh);
    if (!m.frozen) { m.sh.getRange('A3').setFormula(a3Valem_(m.sh)); nimed_(m.sh); }
  });
}

// Enne kuu algust: „⏳ algab 1.11“; kuu ajal link tänasele päevale.
function a3Valem_(sh) {
  return '=IF(TODAY()<$AW$2,IF(' + LANG + '="English","⏳ starts "&TEXT($AW$2,"d.m"),"⏳ algab "&TEXT($AW$2,"d.m")),' +
    'IF($AW$18=0,IF(' + LANG + '="English","↓ find your name","↓ leia oma nimi"),HYPERLINK("#gid=' + sh.getSheetId() +
    '&range="&ADDRESS(5,3+$AW$18,4),IF(' + LANG + '="English","➜ go to today","➜ tänane päev"))))';
}

// Nimi nimekirjast; nimele vajutades viib link sama rea tänasele päevale.
function nimeValem_(sh, row) {
  var b = "'" + T_ROSTER + "'!B" + (row - 1);
  return '=IF(' + b + '="",,HYPERLINK("#gid=' + sh.getSheetId() + '&range="&ADDRESS(ROW(),3+MAX(1,$AW$18),4),' + b + '))';
}

// ================================================================ lukud

function kaitseKoik_(pub, t) {
  var g = pub.getSheetByName(T_GUIDE), ro = pub.getSheetByName(T_ROSTER), b = pub.getSheetByName(T_BOARD);
  var f = pub.getSheetByName(T_FAME), rl = pub.getSheetByName(T_RULES);
  if (g) kaitse_(g, [g.getRange('C3')]);
  if (ro) kaitse_(ro, [ro.getRange(RR0, 2, N, 2), ro.getRange('D2')]);
  if (b) kaitse_(b, [b.getRange('C3:E3'), b.getRange('C4:E4')]);
  if (f) kaitse_(f, [f.getRange('B3')]);
  if (rl) kaitse_(rl, [rl.getRange('C3')]);
  kuulehed_(pub, true).forEach(function (m) { if (!m.frozen) { kaitse_(m.sh, kuuAvatud_(m, t)); paevaReeglid_(m.sh); } });
}

// Kuu vahekaardil on lahti keelevalik, tase, paar ja päevad eilsest ülehomseni (öö ja päeva vahetus mahub sisse).
// Mida täpselt kirjutada saab (ainult täna ja eile), otsustab lahtri reegel.
function kuuAvatud_(m, t) {
  var open = [m.sh.getRange('C1')];                         // keelevalik
  if (t <= m.end + 1) open.push(m.sh.getRange(R0, 2, N, 2));
  var a = Math.max(m.start, t - 1), b = Math.min(m.end, t + 2);
  if (a <= b) open.push(m.sh.getRange(R0, FD + a - m.start, N, b - a + 1));
  return open;
}

function kaitse_(sh, open) {
  var p = sh.getProtections(SpreadsheetApp.ProtectionType.SHEET)[0] || sh.protect();
  p.setDescription('Kuu harjutus');
  p.setUnprotectedRanges(open);
  p.addEditor(Session.getEffectiveUser());
  p.removeEditors(p.getEditors());
  if (p.canDomainEdit()) p.setDomainEdit(false);
}

// ================================================================ plaan ja numbrid

// Plaani rida kuule y-m: [Algaja, Põhi, Pluss, Tipp, harjutus, exercise, ühik, unit, Algaja märkus ×2, Tipp märkus ×2]
function planRida_(plan, y, m) {
  var rows = plan.getRange(PL0, 1, PLN, 14).getValues();
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i], s = toSerial_(r[1]);
    if (s === null) continue;
    var d = ymd_(s);
    if (d[0] !== y || d[1] !== m) continue;
    var ex = str_(r[2]), a = num_(r[4]), po = num_(r[5]), p = num_(r[6]), tp = num_(r[7]);
    if (!ex || !(a > 0) || !(po > 0) || !(p > 0) || !(tp > 0)) return null;
    var uEt = str_(r[8]) || 'kordust', uEn = str_(r[9]) || (/^sek/i.test(uEt) ? 'seconds' : 'reps');
    return [a, po, p, tp, ex, str_(r[3]) || ex, uEt, uEn, str_(r[10]), str_(r[11]) || str_(r[10]), str_(r[12]), str_(r[13]) || str_(r[12])];
  }
  return null;
}

// Numbrid postituste jaoks (vahekaardi „Kuuharjutus“ peidetud veerg U).
function statistika_(plan, pub, d0) {
  var d = ymd_(d0), p = eelmine_(d[0], d[1]);
  var c = kuuLeht_(pub, d[0], d[1]), e = kuuLeht_(pub, p[0], p[1]);
  var sc = c ? kuuNumbrid_(c.sh, true) : kuuNumbrid_(null), se = e ? kuuNumbrid_(e.sh) : kuuNumbrid_(null);
  plan.getRange('U6:U10').setValues([[sc.kokku], [sc.eesmark], [sc.inimesi], [sc.p80], [sc.p100]]);
  plan.getRange('U12:U19').setValues([[se.kokku], [se.eesmark], [se.inimesi], [se.p80], [se.nimed100.join(', ')],
    [se.kuningas], [se.tagasi.join(', ')], [Utilities.formatDate(new Date(), TZ, 'd.MM.yyyy HH:mm')]]);
  var sk = d[2] <= 2 ? [d[0], d[1]] : jargmine_(d[0], d[1]);          // Start: 1.–2. selle kuu, muidu järgmine start
  var s1 = sk[1] === d[1] ? sc : (function (k) { return k ? kuuNumbrid_(k.sh) : kuuNumbrid_(null); })(kuuLeht_(pub, sk[0], sk[1]));
  plan.getRange('U21:U22').setValues([[s1.eesmark], [s1.inimesi]]);
  var varem = c && sc.taisPaev ? c.days - sc.taisPaev : 0, jaanud = c ? c.end - d0 + 1 : 0;   // Erik 27.10: eesmärk täis enne kuu lõppu
  plan.getRange('U23:U24').setValues(varem > 0 && jaanud > 0 ? [[varem], [jaanud]] : [[''], ['']]);
}

// kaib: kuu käib alles, siis loeb tempo (TÄITMINE), ka enne 10 arvestatud päeva (Erik 4.10: nädalakirjas oli 0 inimest 100% peal).
function kuuNumbrid_(sh, kaib) {
  var o = { kokku: 0, eesmark: 0, inimesi: 0, p80: 0, p100: 0, nimed100: [], kuningas: '', tagasi: [], taisPaev: 0 };
  if (!sh) return o;
  o.eesmark = Number(sh.getRange(16, AW).getValue()) || 0;
  var parim = 0, paevas = [];                                      // paevas[k]: grupi kokku kuu (k+1). päeval
  sh.getRange(R0, 1, N, 47).getValues().forEach(function (r) {      // A … AU
    var nimi = str_(r[0]);
    if (!nimi) return;
    for (var k = 0; k < 31; k++) if (typeof r[FD - 1 + k] === 'number') paevas[k] = (paevas[k] || 0) + r[FD - 1 + k];
    var pct = r[36], lisa = Number(r[38]) || 0, embleem = str_(r[40]) !== '';   // embleem: vähemalt 10 arvestatud päeva
    o.inimesi++;
    o.kokku += Number(r[37]) || 0;
    if (typeof pct === 'number' && (embleem || kaib)) {
      if (pct >= 0.8) o.p80++;
      if (pct >= 1) { o.p100++; o.nimed100.push(nimi); }
      if (r[46] === 1 && pct >= 0.8 && embleem) o.tagasi.push(nimi);
    }
    if (lisa > parim) { parim = lisa; o.kuningas = nimi; }
  });
  for (var k = 0, sum = 0; k < paevas.length && o.eesmark > 0; k++) {   // päev, mil ühine eesmärk sai täis (0 = pole täis)
    sum += paevas[k] || 0;
    if (sum >= o.eesmark) { o.taisPaev = k + 1; break; }
  }
  return o;
}

// ================================================================ e-kirjad

function meeldetuleta_(pub, plan, t, props, to) {
  var key = 'meeldetuletus:' + t;
  if (props.getProperty(key)) return;
  var d = ymd_(t), n = jargmine_(d[0], d[1]), p = eelmine_(d[0], d[1]), viimane = paevi_(d[0], d[1]), k = null, selle = false;
  if (d[2] <= 3 && !kuuLeht_(pub, d[0], d[1]) && kuuLeht_(pub, p[0], p[1])) { k = d; selle = true; }
  else if ((d[2] === 20 || d[2] === 25 || d[2] === viimane) && kuuLeht_(pub, d[0], d[1]) &&
           !kuuLeht_(pub, n[0], n[1]) && !planRida_(plan, n[0], n[1])) k = n;
  if (!k) return;
  var g = ET_G[k[1] - 1], G = g.charAt(0).toUpperCase() + g.slice(1);
  var tekst = G + ' harjutus on plaanis veel kirjutamata' + (selle ? ', seepärast pole ühises tabelis selle kuu vahekaarti ja osalejad ei saa kirja panna.' : '.') +
    '\n\nAva oma tabelis vahekaart „Kuuharjutus“ ja täida ' + g + ' real harjutus ja numbrid (tulbad C–H).' +
    (selle ? '\n\nSiis vali menüüst „Kuu harjutus → Loo uus kuu vahekaart kohe“.'
           : '\n\nUus kuu vahekaart tuleb ühisesse tabelisse järgmisel ööl ise. Kohe saad selle teha menüüst „Kuu harjutus → Loo uus kuu vahekaart kohe“.');
  kiri_({ to: to, subject: 'Kuu harjutus: kirjuta ' + g + ' harjutus plaani', body: tekst,
    htmlBody: '<div style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap">' + html_(tekst) + '</div>', name: 'Kuu harjutus' });
  props.setProperty(key, new Date().toISOString());
}

function saada_(to, nimi, et, en, proov, lisa) {
  var plokk = function (pealkiri, tekst, silt) {
    return '<h3 style="margin:22px 0 8px">' + pealkiri + '</h3>' +
      '<a href="https://wa.me/?text=' + encodeURIComponent(tekst) + '" style="display:inline-block;background:#25D366;color:#fff;' +
      'padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold">📲 ' + silt + '</a>' +
      '<div style="white-space:pre-wrap;background:#F6F1EA;border-radius:8px;padding:12px;margin-top:10px">' + html_(tekst) + '</div>';
  };
  var html = '<div style="font-family:Arial,sans-serif;font-size:14px;color:#2B241E;max-width:560px">' +
    '<p>Postitus <b>' + html_(nimi) + '</b> on valmis. Vajuta nupule, vali WhatsAppis grupp ja saada.</p>' +
    plokk('Eesti keeles', et, 'Ava WhatsAppis') + plokk('In English', en, 'Open in WhatsApp') +
    (lisa ? '<p style="margin-top:28px">Soovi korral saada pärast tulemusi ka see küsimus:</p>' + plokk('Küsimus', lisa[0], 'Ava WhatsAppis') +
      plokk('Question', lisa[1], 'Open in WhatsApp') : '') + '</div>';
  var body = 'Postitus "' + nimi + '" on valmis.\n\nEESTI KEELES\n' + et + '\n\nAva WhatsAppis: https://wa.me/?text=' + encodeURIComponent(et) +
    '\n\n\nIN ENGLISH\n' + en + '\n\nOpen in WhatsApp: https://wa.me/?text=' + encodeURIComponent(en) +
    (lisa ? '\n\n\nKÜSIMUS\n' + lisa[0] + '\n\n' + lisa[1] : '');
  kiri_({ to: to, subject: (proov ? 'PROOV · ' : '') + 'Kuu harjutus: ' + nimi, body: body, htmlBody: html, name: 'Kuu harjutus' });
}

function saaja_(plan) {
  return str_(plan.getRange(C_EMAIL).getValue()) || Session.getEffectiveUser().getEmail();
}

// ================================================================ keel

function keeleLahter_(sh) {
  var n = sh.getName();
  for (var i = 0; i < KEEL.length; i++) if (KEEL[i][0] === n) return KEEL[i][1];
  return kuuInfo_(sh) ? 'C1' : null;
}

// Keel on lahtris Juhend!C3 (sealt loevad kõik valemid); teiste vahekaartide keelelahtrid näitavad sama.
function keel_(pub, lang) {
  if ((lang !== 'Eesti' && lang !== 'English') || !(Number(props_().getProperty('PUB_VER:' + pub.getId())) >= 6)) return;
  var sea = function (sh, a1) { var r = sh.getRange(a1); if (r.getValue() !== lang) r.setValue(lang); };
  KEEL.forEach(function (k) { var sh = pub.getSheetByName(k[0]); if (sh) sea(sh, k[1]); });
  kuulehed_(pub).forEach(function (m) { sea(m.sh, 'C1'); });
}

function keeleSilt_(r, tume, joondus) {
  r.setValue(LANG_LABEL).setFontFamily('Roboto').setFontSize(8).setFontWeight('bold').setFontColor(tume ? '#D9CEC0' : '#6E655B')
    .setHorizontalAlignment(joondus || 'center').setVerticalAlignment('middle').setWrap(true);
  if (tume) r.setBackground('#2B241E');
}

function keeleValik_(r, lang, suurus) {
  r.setValue(lang).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Eesti', 'English'], true).setAllowInvalid(false).build())
    .setBackground('#F2E8DA').setFontFamily('Oswald').setFontSize(suurus).setFontWeight('bold').setFontColor('#8B6B47')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
}

// ================================================================ vanema ühise tabeli uuendamine

function uus_(pub) {
  return Number(props_().getProperty('PUB_VER:' + pub.getId())) >= PUB_VER;
}

// v5 → v6: keelevalik igale vahekaardile, „Eemalda“, uued tekstid, uus reeglite vahekaart. Kirjed jäävad alles.
function uuenda_(pub) {
  var ver = Number(props_().getProperty('PUB_VER:' + pub.getId())) || 5;
  var g = pub.getSheetByName(T_GUIDE), lang = g && str_(g.getRange('C3').getValue()) === 'English' ? 'English' : 'Eesti';
  KUUD_ = null;
  var vead = [];
  var proovi = function (nimi, fn) {                             // üks ebaõnnestunud samm ei peata ülejäänut
    try { fn(); } catch (err) { vead.push(nimi + ': ' + (err && err.message ? err.message : err)); }
  };

  proovi('read', function () { laienda_(pub); viitedLaiendus_(pub); });
  proovi('tekstid', function () {
  var lehed = {}, kuud = kuulehed_(pub).map(function (m) { return m.sh; });   // muutunud tekstid (leitakse vana valemi järgi)
  KH_PATCH.cells.forEach(function (c) { (lehed[c[0]] = lehed[c[0]] || []).push(c); });
  Object.keys(lehed).forEach(function (nimi) {
    var shs = nimi === '*kuu*' ? kuud : [pub.getSheetByName(nimi)].filter(Boolean);
    shs.forEach(function (sh) {
      var n = Math.min(sh.getMaxRows(), 120), nc = Math.min(sh.getMaxColumns(), 50);
      var f = sh.getRange(1, 1, n, nc).getFormulas(), v = sh.getRange(1, 1, n, nc).getValues();
      lehed[nimi].forEach(function (c) {
        var vana = c[1].replace(/\s+/g, ''), valem = c[1].charAt(0) === '=';
        for (var i = 0; i < n; i++) for (var j = 0; j < nc; j++) {
          var cur = valem ? f[i][j] : (f[i][j] ? '' : String(v[i][j]));
          if (!cur || cur.replace(/\s+/g, '') !== vana) continue;
          var cell = sh.getRange(i + 1, j + 1);
          if (String(c[2]).charAt(0) === '=') cell.setFormula(c[2]); else cell.setValue(c[2]);
          f[i][j] = valem ? c[2] : ''; v[i][j] = c[2];
          if (c[3]) { sh.setRowHeight(i + 1, Math.round(c[3])); cell.setWrap(true); }
        }
      });
    });
  });
  });
  if (ver < 6) uuenda6_(pub, g, lang);

  var ajutine = null;
  proovi('mall', function () { ajutine = impordi_(PUB_NAME + ' (ajutine)', null); });   // uusim kujundus, ilma kirjeteta
  if (ajutine) {
    try {
      proovi('reeglid ja juhend', function () {
        var uusR = ajutine.getSheetByName(T_RULES).copyTo(pub), vanaR = pub.getSheetByName(T_RULES);
        var koht = vanaR ? vanaR.getIndex() : pub.getSheets().length;
        if (vanaR) pub.deleteSheet(vanaR);
        uusR.setName(T_RULES);
        uusR.getRange('C3').setValue(lang);
        pub.setActiveSheet(uusR);
        pub.moveActiveSheet(koht);
        juhend_(pub, ajutine.getSheetByName(T_GUIDE), lang);
      });
      proovi('kuu vahekaardid', function () {
        var mall = ajutine.getSheets().filter(function (x) { return kuuInfo_(x); })[0];
        KUUD_ = null;
        kuulehed_(pub, true).forEach(function (m) { if (!m.frozen) kuuMall_(m.sh, mall); });
      });
      proovi('ülevaade', function () { valemid_(ajutine.getSheetByName(T_BOARD), pub.getSheetByName(T_BOARD)); });
      proovi('edetabel', function () { edetabel_(pub, ajutine.getSheetByName(T_BOARD)); });
      proovi('loosivõitjad', function () { voitjadVaade_(pub, true); });   // edetabel_ tühjendas ka selle ala
      proovi('autahvli valemid', function () {
        var mf = ajutine.getSheetByName(T_FAME), f = pub.getSheetByName(T_FAME);
        if (!mf || !f) return;
        var r1 = mf.getRange(FAME0, 2, 1, 8).getFormulasR1C1()[0];
        f.getRange(FAME0, 2, FAMEN, 8).setFormulasR1C1(Array.apply(null, Array(FAMEN)).map(function () { return r1; }));
      });
    } finally { DriveApp.getFileById(ajutine.getId()).setTrashed(true); }
  }

  if (ver < 7) proovi('värvid', function () { varvid_(pub); });
  var ro = pub.getSheetByName(T_ROSTER);
  if (ro) proovi('nimekiri', function () { nimekirjaVormid_(ro); });
  proovi('autahvel', function () { autahvel_(pub); });
  proovi('päised', function () {
    [T_ROSTER, T_BOARD, T_FAME].forEach(function (n) {           // telefonis lõikas külmutatud ala kõrge päise pooleks
      var sh = pub.getSheetByName(n);
      if (sh && sh.getFrozenRows()) sh.setFrozenRows(0);
    });
  });

  KUUD_ = null;
  if (!vead.length) props_().setProperty('PUB_VER:' + pub.getId(), String(PUB_VER));
  return vead;
}

// Käimasolev kuu vahekaart saab uusima kujunduse: rea valemid, uued tulbad (AX järjest, AY koht), päised, värvid,
// tingimusvormingud, lahtri reeglid ja nimede lingid. Kirjed (A–AH) ja seaded (AV:AW) jäävad puutumata.
function kuuMall_(sh, mall) {
  if (!mall) return;
  if (sh.getMaxColumns() < KUU_TULPI) sh.insertColumnsAfter(sh.getMaxColumns(), KUU_TULPI - sh.getMaxColumns());
  sh.showColumns(SEERIA, 2);
  var o = kuuKohti_(sh);
  if (o !== N) return;                                       // vana suurus: laienda_ teeb enne ära
  [[35, 13], [SEERIA, 2]].forEach(function (p) {             // AI:AU ja AX:AY (AV:AW on seaded)
    var r1 = mall.getRange(R0, p[0], 1, p[1]).getFormulasR1C1()[0];
    sh.getRange(R0, p[0], N, p[1]).setFormulasR1C1(Array.apply(null, Array(N)).map(function () { return r1; }));
    var nf = mall.getRange(R0, p[0], 1, p[1]).getNumberFormats()[0];   // 1.10: LISA „+33%“ (vanal vahekaardil oli vorminguta 0,3333)
    sh.getRange(R0, p[0], N, p[1]).setNumberFormats(Array.apply(null, Array(N)).map(function () { return nf; }));
    var pea = mall.getRange(2, p[0], 2, p[1]), pf = pea.getFormulas(), pv = pea.getValues();
    sh.getRange(2, p[0], 2, p[1]).setValues(pf.map(function (r, i) { return r.map(function (x, j) { return x || txt_(pv[i][j]); }); }));
  });
  var viimane = R0 + N + 2, ala = mall.getRange(1, 1, viimane, KUU_TULPI), siht = sh.getRange(1, 1, viimane, KUU_TULPI);
  siht.setBackgrounds(ala.getBackgrounds());
  siht.setFontColors(ala.getFontColors());
  // Päise päevade rida (2) ja nädalapäevade rida (3) on alati samad; „täna“ kuldseks teeb ainult tingimusvorming.
  // Varasem Seadista võis eilse kulla lahtrisse kinni jätta, siis oli kuldne kaks päeva (Erik 3.10).
  sh.getRange(2, FD, 1, 31).setBackground('#2B241E').setFontColor('#FFFFFF');
  sh.getRange(3, FD, 1, 31).setBackground('#F6F1EA').setFontColor('#6E655B');
  var uusAla = sh.getRange(1, SEERIA, viimane, 2), mAla = mall.getRange(1, SEERIA, viimane, 2);
  uusAla.setFontWeights(mAla.getFontWeights()).setFontSizes(mAla.getFontSizes()).setHorizontalAlignments(mAla.getHorizontalAlignments())
    .setVerticalAlignments(mAla.getVerticalAlignments()).setNumberFormats(mAla.getNumberFormats());
  sh.getRange(R0, SEERIA, N, 2).setBorder(null, null, true, null, null, true, '#E6DED3', SpreadsheetApp.BorderStyle.SOLID);
  [1, SEERIA, KOHT, 35, 36, 37, 38, 39, 40, 41].forEach(function (c) { sh.setColumnWidth(c, mall.getColumnWidth(c)); });
  sh.setRowHeight(3, mall.getRowHeight(3));                  // 1.10: rea 3 vihjed (ühik, „üle eesmärgi“) mahuvad ära
  var r3 = mall.getRange(3, 1, 1, KUU_TULPI);
  sh.getRange(3, 1, 1, KUU_TULPI).setWraps(r3.getWraps()).setVerticalAlignments(r3.getVerticalAlignments());
  var gf = mall.getRange(16, AW).getFormula(), gc = sh.getRange(16, AW);   // ühine eesmärk: 1.10 iga inimese oma taseme eesmärk
  if (gf && gc.getFormula() && gc.getFormula() !== gf) gc.setFormula(gf);
  sh.setRowHeights(R0, N, mall.getRowHeight(R0));
  sh.setConditionalFormatRules(mall.getConditionalFormatRules().map(function (rule) {
    return rule.copy().setRanges(rule.getRanges().map(function (g) { return sh.getRange(g.getA1Notation()); })).build();
  }));
  paevaReeglid_(sh);
  sh.getRange(4, FD, 1, 31).clearDataValidations();          // 2x tuleb ainult plaanist
  sh.getRange(R0, 1, N, 1).setNumberFormats(Array.apply(null, Array(N)).map(function (x, k) { return ['"' + (k + 1) + '. "@']; }));   // järjekorranumber nime ees, nimi ise jääb samaks
  nimed_(sh);
}

// Nimede valemid (ka vanad, ilma lingita) uueks: nimi viib sama rea tänasele päevale.
function nimed_(sh) {
  var a = sh.getRange(R0, 1, N, 1), af = a.getFormulas(), av = a.getValues();
  if (af.every(function (r, k) { return !r[0] || r[0] === nimeValem_(sh, R0 + k); })) return;
  a.setValues(af.map(function (r, k) { return [r[0] ? nimeValem_(sh, R0 + k) : txt_(av[k][0])]; }));
}

// Mallis muutunud valemid (ainult lahtritesse, kus on praegu ka valem).
function valemid_(mall, sh) {
  if (!mall || !sh) return;
  var nr = Math.min(mall.getMaxRows(), sh.getMaxRows(), 80), nc = Math.min(mall.getMaxColumns(), sh.getMaxColumns(), 30);
  var mf = mall.getRange(1, 1, nr, nc).getFormulas(), ala = sh.getRange(1, 1, nr, nc), f = ala.getFormulas();
  for (var i = 0; i < nr; i++) for (var j = 0; j < nc; j++) {
    if (mf[i][j] && f[i][j] && mf[i][j] !== f[i][j]) ala.getCell(i + 1, j + 1).setFormula(mf[i][j].split("'" + mall.getName() + "'!").join("'" + sh.getName() + "'!"));
  }
}

// Edetabel (Erik 1.10): kõik osalejad (varem 20 esimest), võrdsed jagavad kohta, nimed ilma kuulehe järjekorranumbrita.
// Tõstab malli ülevaatest edetabeli ploki (pealkirjast alates) koos vormingu ja triibureeglitega üle.
function edetabel_(pub, mall) {
  var b = pub.getSheetByName(T_BOARD), r = KH_PATCH.board_rows;
  if (!b || !mall || !r) return;
  var n = r[1] - r[0] + 1, nc = 11;
  if (b.getMaxRows() < r[1]) b.insertRowsAfter(b.getMaxRows(), r[1] - b.getMaxRows());
  var uus = mall.copyTo(pub);
  try {
    var koht = b.getRange(r[0], 1, n, nc);
    koht.breakApart(); koht.clear();
    uus.getRange(r[0], 1, n, nc).copyTo(koht);
    viited_(koht, uus.getName(), b.getName());
    for (var i = r[0]; i <= r[1]; i++) b.setRowHeight(i, uus.getRowHeight(i));
  } finally { pub.deleteSheet(uus); }
  var reeglid = b.getConditionalFormatRules();                  // edetabeli vanad reeglid välja, malli omad asemele (mitte iga Seadistaga juurde)
  var mallR = mall.getConditionalFormatRules().filter(function (x) { return x.getRanges().some(function (g) { return g.getRow() >= r[0]; }); });
  if (mallR.length) b.setConditionalFormatRules(reeglid.filter(function (x) { return !x.getRanges().some(function (g) { return g.getRow() >= r[0] && g.getRow() <= r[1] && g.getColumn() <= 5; }); })
    .concat(mallR.map(function (x) { return x.copy().setRanges(x.getRanges().map(function (g) { return b.getRange(g.getA1Notation()); })).build(); })));
}

// Autahvel: iga nimi omal real (varem komadega ühes reas, paljud nimed ei mahtunud).
function autahvel_(pub) {
  var f = pub.getSheetByName(T_FAME);
  if (!f) return;
  var ala = f.getRange(FAME0, 1, FAMEN, FAME_WIN), fm = ala.getFormulas(), v = ala.getValues();
  for (var i = 0; i < FAMEN; i++) for (var j = 0; j < FAME_WIN; j++) {
    var x = fm[i][j];
    if (x && x.indexOf('TEXTJOIN(", ",') >= 0) ala.getCell(i + 1, j + 1).setFormula(x.split('TEXTJOIN(", ",').join('TEXTJOIN(CHAR(10),'));
    else if (!x && j === FAME_WIN - 1 && String(v[i][j]).indexOf(',') >= 0) ala.getCell(i + 1, j + 1).setValue(String(v[i][j]).split(/\s*,\s*/).join('\n'));
  }
  ala.setWrap(true);
  autahvliKorgus_(f);
}

// Autahvli all kõigi aegade tabel lõppenud kuudest: läbitud kuud (embleem), tehtud päevad, osaletud kuud.
var KA0 = 43;
function koigiAegade_(pub) {
  var f = pub.getSheetByName(T_FAME);
  if (!f) return;
  var koos = {};
  kuulehed_(pub).forEach(function (m) {
    if (!m.frozen) return;
    m.sh.getRange(R0, 1, N, 41).getValues().forEach(function (r) {
      var nimi = str_(r[0]);
      if (!nimi || nimi === EKS) return;
      var x = koos[nimi] = koos[nimi] || [nimi, 0, 0, 0];
      if (str_(r[40]) !== '') x[1]++;
      x[2] += Number(r[35]) || 0;
      x[3]++;
    });
  });
  var read = Object.keys(koos).map(function (k) { return koos[k]; });
  read.sort(function (a, b) { return b[1] - a[1] || b[2] - a[2] || b[3] - a[3] || (a[0] < b[0] ? -1 : 1); });
  var vaja = KA0 + 2 + Math.max(read.length, 1) + 1;
  if (f.getMaxRows() < vaja) f.insertRowsAfter(f.getMaxRows(), vaja - f.getMaxRows());
  var vanad = f.getMaxRows() - KA0 + 1;
  f.getRange(KA0, 1, vanad, 5).breakApart().clearContent().setBackground(null);
  var L = "'" + T_GUIDE + "'!$C$3=\"English\"";
  var tx = function (et, en) { return '=IF(' + L + ',"' + en + '","' + et + '")'; };
  f.getRange(KA0, 1, 1, 5).merge();
  f.getRange(KA0, 1).setFormula(tx('KÕIGI AEGADE TABEL · lõppenud kuud', 'ALL-TIME TABLE · finished months'))
    .setFontFamily('Oswald').setFontSize(13).setFontWeight('bold').setFontColor('#8B6B47').setVerticalAlignment('bottom').setHorizontalAlignment('left');
  f.setRowHeight(KA0, 34);
  f.getRange(KA0 + 1, 1, 1, 5).setFormulas([[tx('#', '#'), tx('NIMI', 'NAME'), tx('KUID LÄBITUD', 'MONTHS FINISHED'),
    tx('TEHTUD PÄEVI', 'DAYS DONE'), tx('KUID OSALENUD', 'MONTHS IN')]])
    .setBackground('#2B241E').setFontColor('#FFFFFF').setFontSize(8).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  f.setRowHeight(KA0 + 1, 30);
  if (!read.length) {
    f.getRange(KA0 + 2, 1, 1, 5).merge();
    f.getRange(KA0 + 2, 1).setFormula(tx('Täitub, kui esimene kuu on läbi.', 'Fills in when the first month ends.')).setFontColor('#6E655B').setFontWeight('normal');
    return;
  }
  var ala = f.getRange(KA0 + 2, 1, read.length, 5);
  ala.setValues(read.map(function (r, i) { return [i + 1, txt_(r[0]), r[1], r[2], r[3]]; }))
    .setFontSize(10).setFontColor('#2B241E').setFontWeight('normal').setVerticalAlignment('middle').setHorizontalAlignment('center').setNumberFormat('0');
  f.getRange(KA0 + 2, 2, read.length, 1).setHorizontalAlignment('left').setFontWeight('bold');
  f.getRange(KA0 + 2, 1, read.length, 5).setBackgrounds(read.map(function (r, i) { var c = i % 2 ? '#F6F1EA' : '#FFFFFF'; return [c, c, c, c, c]; }));
  f.setRowHeights(KA0 + 2, read.length, 22);
}

// Rea kõrgus nimede arvu järgi (autoResizeRows andis Google'is „tundmatu vea“).
function autahvliKorgus_(f) {
  var v = f.getRange(FAME0, 1, FAMEN, FAME_WIN).getDisplayValues();
  for (var i = 0; i < FAMEN; i++) {
    var read = 1;
    v[i].forEach(function (x) { read = Math.max(read, String(x).split('\n').length); });
    var h = Math.max(30, read * 16 + 10);
    if (f.getRowHeight(FAME0 + i) !== h) f.setRowHeight(FAME0 + i, h);
  }
}

// Nimekirja värvid ja nimelahtri reegel alati puhtaks: igaüks üks kord, kogu nimede alal, ilma käsitsi jäänud taustadeta.
function nimekirjaVormid_(ro) {
  var ala = ro.getRange(RR0, 1, N, 4), liik = {}, muud = [];
  ro.getConditionalFormatRules().forEach(function (rule) {
    var b = rule.getBooleanCondition(), f = b ? String((b.getCriteriaValues() || [''])[0]) : '';
    var k = f === '=' + KH_PATCH.roster_a2_rule ? '' :
      f.indexOf(REMOVE) >= 0 ? 'eemalda' : /\$C\d+="Paus/.test(f) ? 'paus' : /\$B\d+=""/.test(f) ? 'esimene' : '';
    if (!k) { muud.push(rule); return; }
    if (liik[k]) return;                                       // topelt või tükeldatud koopia: jääb ära
    var valem = k === 'eemalda' ? KH_PATCH.remove_rule : k === 'esimene' ? KH_PATCH.first_rule : '$C' + RR0 + '="' + PAUSE + '"';
    liik[k] = rule.copy().whenFormulaSatisfied('=' + valem).setRanges([ala]).build();
  });
  ro.setConditionalFormatRules(['eemalda', 'esimene', 'paus'].filter(function (k) { return liik[k]; })
    .map(function (k) { return liik[k]; }).concat(muud));
  ala.setBackground(null);
  ro.setColumnWidth(3, 190);                                 // olek mahub ära ka „Kinnitan eemaldamise · Confirm removal“
  ro.getRange(RR0, 3, N, 1).setHorizontalAlignment('left');
  ro.getRange(RR0, 2, N, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireFormulaSatisfied('=AND(COUNTIF($B$' + RR0 + ':$B$' + (RR0 + N - 1) + ',B' + RR0 + ')<=1,B' + (RR0 - 1) + '<>"")')   // ülemine rida peab olema täidetud
    .setAllowInvalid(false).setHelpText(KH_PATCH.name_help).build());
}

// v6: keelevalik igal vahekaardil, Eemalda nimekirjas.
function uuenda6_(pub, g, lang) {
  if (g) { g.getRange('B3').setFontSize(8).setWrap(true); }

  var ro = pub.getSheetByName(T_ROSTER);
  if (ro) {
    ro.getRange('A1:D1').breakApart(); ro.getRange('A2:D2').breakApart();
    ro.getRange('A1:C1').merge(); ro.getRange('A2:C2').merge();
    keeleSilt_(ro.getRange('D1'), true);
    keeleValik_(ro.getRange('D2'), lang, 12);
    ro.getRange(RR0, 3, N, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(KH_PATCH.status, true)
      .setAllowInvalid(false).setHelpText(KH_PATCH.status_help).build());
    var cf = ro.getConditionalFormatRules();
    cf.unshift(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=' + KH_PATCH.remove_rule)
      .setBackground('#FDE2E1').setFontColor('#B42318').setBold(true).setRanges([ro.getRange(RR0, 1, N, 4)]).build());
    cf.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=' + KH_PATCH.roster_a2_rule)
      .setBackground('#FDE2E1').setFontColor('#8A1C12').setBold(true).setRanges([ro.getRange('A2')]).build());
    ro.setConditionalFormatRules(cf);
  }

  kuulehed_(pub).forEach(function (m) {                     // rida 1: B silt, C keel, D:AO pealkiri
    var sh = m.sh, f = sh.getRange('B1').getFormula();
    sh.getRange(1, 2, 1, 40).breakApart();
    sh.getRange(1, 4, 1, 38).merge();
    if (f) sh.getRange('D1').setFormula(f);
    sh.getRange('D1').setFontFamily('Roboto').setFontSize(10).setFontWeight('bold').setFontColor('#FFFFFF')
      .setHorizontalAlignment('left').setVerticalAlignment('middle');
    keeleSilt_(sh.getRange('B1'), true);
    keeleValik_(sh.getRange('C1'), lang, 11);
  });

  var b = pub.getSheetByName(T_BOARD);
  if (b) {
    b.getRange('A3:B3').merge(); b.getRange('C3:E3').merge();
    keeleSilt_(b.getRange('A3'), false, 'right');
    keeleValik_(b.getRange('C3'), lang, 12);
    b.setRowHeight(3, 30);
  }
  var f = pub.getSheetByName(T_FAME);
  if (f) {
    keeleSilt_(f.getRange('A3'), false, 'right');
    keeleValik_(f.getRange('B3'), lang, 12);
    f.setRowHeight(3, 28);
  }
}

// v7: sinised ja hallid toonid Üksuse beežide vastu (taust, tekst, tingimusvormingud, vahekaardi sakid).
// Juhend tuleb iga kord uus: tekstid, ridade kõrgused, värvid ja jooned. Vahekaart ise jääb alles,
// sest teised vahekaardid võtavad keele selle lahtrist C3.
function juhend_(pub, mall, lang) {
  var g = pub.getSheetByName(T_GUIDE);
  if (!g || !mall) return;
  var uus = mall.copyTo(pub);
  try {
    var nr = Math.min(uus.getMaxRows(), uus.getLastRow() + 3), nc = Math.min(uus.getMaxColumns(), Math.max(uus.getLastColumn(), 3) + 1);
    if (g.getMaxRows() < nr) g.insertRowsAfter(g.getMaxRows(), nr - g.getMaxRows());
    if (g.getMaxColumns() < nc) g.insertColumnsAfter(g.getMaxColumns(), nc - g.getMaxColumns());
    var koht = g.getRange(1, 1, Math.max(nr, g.getLastRow()), Math.max(nc, g.getLastColumn()));
    koht.breakApart(); koht.clearDataValidations(); koht.clear();
    uus.getRange(1, 1, nr, nc).copyTo(g.getRange(1, 1, nr, nc));
    viited_(g.getRange(1, 1, nr, nc), uus.getName(), g.getName());
    for (var r = 1; r <= nr; r++) g.setRowHeight(r, uus.getRowHeight(r));
    for (var c = 1; c <= nc; c++) g.setColumnWidth(c, uus.getColumnWidth(c));
    g.getRange('C3').setValue(lang);
    if (uus.getTabColor()) g.setTabColor(uus.getTabColor());
  } finally { pub.deleteSheet(uus); }
}

// Ajutise koopia valemid viitavad koopia nimele; suuna need päris vahekaardile.
function viited_(ala, vana, uus) {
  var q = function (n) { return "'" + n.replace(/'/g, "''") + "'!"; };
  var f = ala.getFormulas();
  for (var i = 0; i < f.length; i++) for (var j = 0; j < f[i].length; j++) {
    var x = f[i][j];
    if (!x) continue;
    var y = x.split(q(vana)).join(q(uus));
    if (/^[A-Za-z0-9_]+$/.test(vana)) y = y.split(vana + '!').join(q(uus));
    if (y !== x) ala.getCell(i + 1, j + 1).setFormula(y);
  }
}

function varvid_(pub) {
  var P = {};
  Object.keys(KH_PATCH.palette || {}).forEach(function (k) { P['#' + k.toLowerCase()] = '#' + KH_PATCH.palette[k]; });
  var uus = function (c) { var x = c ? P[String(c).toLowerCase()] : null; return x || null; };
  pub.getSheets().forEach(function (sh) {
    var nr = sh.getMaxRows(), nc = sh.getMaxColumns();
    if (!nr || !nc) return;
    var rng = sh.getRange(1, 1, nr, nc), muut = false;
    var bg = rng.getBackgrounds().map(function (r) { return r.map(function (c) { var x = uus(c); if (x) { muut = true; return x; } return c; }); });
    if (muut) rng.setBackgrounds(bg);
    muut = false;
    var fc = rng.getFontColors().map(function (r) { return r.map(function (c) { var x = uus(c); if (x) { muut = true; return x; } return c; }); });
    if (muut) rng.setFontColors(fc);
    var cf = sh.getConditionalFormatRules(), cfm = false;
    cf = cf.map(function (rule) {
      var b = rule.getBooleanCondition();
      if (!b) return rule;
      var nb = uus(b.getBackground()), nf = uus(b.getFontColor());
      if (!nb && !nf) return rule;
      cfm = true;
      var bld = rule.copy();
      if (nb) bld.setBackground(nb);
      if (nf) bld.setFontColor(nf);
      return bld.build();
    });
    if (cfm) sh.setConditionalFormatRules(cf);
    var tab = uus(sh.getTabColor());
    if (tab) sh.setTabColor(tab);
  });
}


// ================================================================ loos

// Plaanilehe linnukesed (töötavad ka telefonis): D32 loos, D33 uus kuu vahekaart, D34 proov e-postiga.
// Tulp O (2x päevad) jõuab kohe kuu vahekaardile.
function plaaniMuudatus(e) {
  if (!e || !e.range) return;
  var sh = e.range.getSheet();
  if (!onPlaan_(sh)) return;
  var o = e.range.getColumn() <= PL_2X && e.range.getLastColumn() >= PL_2X && e.range.getRow() < PL0 + PLN && e.range.getLastRow() >= PL0;
  grupiga_(sh, function () { plaaniMuudatus1_(e, sh); });
  if (o && !grupiNimi_(sh)) grupid_(sh.getParent()).forEach(function (g) {   // teiste gruppide plaan võtab 2x päevad siit
    if (g && grupiNimi_(g)) grupiga_(g, function () { topeltElus_(g); });
  });
}

// Grupi elavate kuude 2x-rida plaani järgi. Tagastab kuud kujul {'2026-10': m}.
function topeltElus_(plan) {
  var pub = avalik_(), t = tana_(), elus = {};
  if (pub) kuulehed_(pub, true).forEach(function (m) {
    if (m.frozen || t > m.end) return;
    var d = ymd_(m.start);
    topeltKuusse_(m, topelt_(plan, d[0], d[1]));
    elus[d[0] + '-' + d[1]] = m;
  });
  return elus;
}

function plaaniMuudatus1_(e, sh) {
  var a1 = e.range.getA1Notation(), row = e.range.getRow();
  if (e.range.getColumn() <= PL_2X && e.range.getLastColumn() >= PL_2X && row < PL0 + PLN && e.range.getLastRow() >= PL0) {
    var elus = topeltElus_(sh);
    var r0 = Math.max(PL0, row), r1 = Math.min(PL0 + PLN - 1, e.range.getLastRow());
    for (var r = r0; r <= r1; r++) {
      var lahter = sh.getRange(r, PL_2X), s0 = toSerial_(sh.getRange(r, 2).getValue());
      if (s0 === null) continue;
      var d0 = ymd_(s0), p = topelt_(sh, d0[0], d0[1]), m0 = elus[d0[0] + '-' + d0[1]], kuu = ET_M[d0[1] - 1].toLowerCase();
      var mark = str_(lahter.getDisplayValue()) && !p.length ? 'Ei leidnud päevi. Kirjuta päevade numbrid komaga, näiteks 7, 21.'
        : (p.length ? 'Topeltpäevad on ' + p.map(function (x) { return x + '.'; }).join(', ').replace(/, (\d+\.)$/, ' ja $1') + ' ' + kuu + '. ' : 'Sel kuul topeltpäevi pole. ') +
          (m0 ? 'Kuu vahekaardil on see nüüd nii.' : 'Kuu vahekaardile lähevad need, kui see tehakse.');
      lahter.setNote(mark + ' (' + Utilities.formatDate(new Date(), TZ, 'd.MM HH:mm') + ')');
    }
    return;
  }
  var nupp = { }; nupp[C_LOOS] = C_LOOS_TULEMUS; nupp[C_KUU] = C_KUU_TULEMUS; nupp[C_PROOV] = C_PROOV_TULEMUS;
  if (!nupp[a1] || e.range.getValue() !== true) return;
  var tekst;
  try {
    tekst = a1 === C_LOOS ? loosi_(sh).tekst : a1 === C_KUU ? looKuuKohe_().tekst : saadaProov_(sh).tekst;
  } catch (err) { tekst = 'Ei õnnestunud: ' + (err && err.message ? err.message : err); }
  sh.getRange(nupp[a1]).setValue(txt_(tekst));
  e.range.setValue(false);
}

// Menüüst: sama loos, tulemus aknas.
function loosiMenuust() {
  var plan = plaan_(), r = loosi_(plan);
  if (plan) plan.getRange(C_LOOS_TULEMUS).setValue(txt_(r.tekst));
  SpreadsheetApp.getUi().alert('Loos', r.tekst, SpreadsheetApp.getUi().ButtonSet.OK);
}

// Erik 29.10: auhinnad ja nende arv on iga grupi plaani vahekaardil (tulbad V–X), võitjate arv tuleb sealt (C32 enam pole).
// Põhigrupi vahekaardil on ainult põhigrupi auhinnad, Swedi vahekaardil ainult Swedi omad.
var AUH_VEERG = 22, AUH0 = PL0, AUHN = 20;                    // V3:X22: auhind eesti k, inglise k, mitu
var AUH_PAIS = ['Auhind (eesti k)', 'Prize (inglise k)', 'Mitu loosime'];
var AUH_VAIKIMISI = {
  '': [['Üksuse kinkekaart 15€', 'Üksus gift card €15', 1], ['Üksuse kinkekaart 10€', 'Üksus gift card €10', 1],
       ['Üksuse kinkekaart 5€', 'Üksus gift card €5', 5], ['Kohviku kinkekaart „kuum jook“', 'Café gift card “hot drink”', 3]],
  'swed': [['Üksuse kinkekaart 15€', 'Üksus gift card €15', 1], ['Üksuse kinkekaart 10€', 'Üksus gift card €10', 1],
           ['Üksuse kinkekaart 5€', 'Üksus gift card €5', 1], ['Kohviku kinkekaart „kuum jook“', 'Café gift card “hot drink”', 2]]
};
var AUH_JUHIS = 'Kirjuta siia selle grupi auhinnad ja mitu tükki igat loosime. Linnuke D32 loosib nii mitu võitjat, kui palju auhindu siin kokku on. ' +
  'Iga võitja saab ühe auhinna ja selle, kumma, otsustab loos: piletite arv mõjutab ainult võiduvõimalust, mitte auhinda. Tühi rida või 0 tähendab, et seda auhinda ei loosita. ' +
  'Inglise keeles nimi pole kohustuslik, tühja lahtri asemel näidatakse eestikeelset.';
var LOOS_JUHIS = 'Uue kuu esimeses trennis tee lahtrisse D32 linnuke (käib ka telefonis). Tabel loosib lõppenud kuu piletite järgi välja kõik auhinnad paremal asuvast tabelist ' +
  '„Auhinnad“ (tulbad V–X) ja kirjutab võitjad ühise tabeli vahekaartidele „Ülevaade“ ja „Autahvel“. Üks inimene võidab kuus ühe auhinna, sina loosis ei osale.';
var LOOS_KASITSI = '7. Sinu käsitsi töö: kuu esimeses trennis õpeta tehnikat ja tee lahtrisse D32 linnuke: tabel loosib lõppenud kuu piletite järgi välja auhinnad tabelist „Auhinnad“ (tulbad V–X) ' +
  'ja kirjutab võitjad vahekaartidele „Ülevaade“ ja „Autahvel“. Piletid on kuu vahekaardi tulbas PILETID. Topeltpäevad kirjuta plaani tulpa O. Kui keegi lõpetab, vali tema real Nimekirjas „Paus“: ' +
  'uuel kuul teda enam pole. Kui ta tahab oma nime ja tulemused päriselt ära, vali „Eemalda“ ja siis „Kinnitan eemaldamise“. Ühise tabeli omanik oled sina, nii et kõiki lukustatud lahtreid saad vajadusel ise parandada.';

// Plaani vahekaardile auhindade tabel (kui seda veel pole) ja loosi juhised ilma võitjate arvuta. Käib Seadistas ja öösel.
function auhinnad_(plan) {
  if (!plan) return false;
  var c32 = plan.getRange(C_LOOS_ARV);
  if (c32.getDataValidation() || str_(c32.getValue())) { c32.setDataValidation(null); c32.setValue(''); }
  var juhis = plan.getRange(32, 9);
  if (str_(juhis.getValue()) !== LOOS_JUHIS) juhis.setValue(LOOS_JUHIS);
  var desc = plan.getMaxRows() > 42 ? plan.getRange(42, 1, Math.min(15, plan.getMaxRows() - 41), 1).getValues() : [];
  for (var i = 0; i < desc.length; i++) {
    var s = str_(desc[i][0]);
    if (/^7\. Sinu käsitsi töö/.test(s) && s !== LOOS_KASITSI) plan.getRange(42 + i, 1).setValue(LOOS_KASITSI);
  }
  if (plan.getMaxColumns() < AUH_VEERG + 3) plan.insertColumnsAfter(plan.getMaxColumns(), AUH_VEERG + 3 - plan.getMaxColumns());
  if (str_(plan.getRange(PL0 - 1, AUH_VEERG).getValue()) === AUH_PAIS[0]) return false;
  var kavand = plan.getRange('P2');                                   // Eriku enda visand (29.10) tulpades P–R
  if (/auhinn/i.test(str_(kavand.getValue()))) {
    var v = plan.getRange('P2:S30'); v.breakApart(); v.clear();
    plan.setColumnWidth(16, 12); plan.setColumnWidth(17, 12);
  }
  var vaik = AUH_VAIKIMISI[grupiNimi_(plan).toLowerCase()] || AUH_VAIKIMISI[''];
  var V = AUH_VEERG, ala = plan.getRange(AUH0, V, AUHN, 3);
  ala.breakApart(); ala.clear();
  plan.getRange(1, V, 1, 3).merge();
  plan.getRange(1, V).setValue('AUHINNAD').setFontFamily('Oswald').setFontSize(12).setFontWeight('bold').setFontColor('#8B6B47').setVerticalAlignment('middle');
  plan.getRange(PL0 - 1, V, 1, 3).setValues([AUH_PAIS]).setBackground('#2B241E').setFontColor('#FFFFFF').setFontSize(9).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  var read = [];
  for (var k = 0; k < AUHN; k++) read.push(vaik[k] ? vaik[k].map(txt_) : ['', '', '']);
  ala.setValues(read).setFontSize(10).setFontColor('#2B241E').setFontWeight('normal').setVerticalAlignment('middle').setWrap(true)
    .setBackgrounds(read.map(function (r, k) { var c = k % 2 ? '#FBF8F3' : '#FFFFFF'; return [c, c, c]; }));
  plan.getRange(AUH0, V, AUHN, 1).setFontWeight('bold');
  plan.getRange(AUH0, V + 2, AUHN, 1).setHorizontalAlignment('center').setFontColor('#8B6B47').setFontWeight('bold').setNumberFormat('0')
    .setDataValidation(SpreadsheetApp.newDataValidation().requireNumberBetween(0, 50).setAllowInvalid(false).setHelpText('Mitu tükki seda auhinda loosime (0–50).').build());
  plan.getRange(AUH0, V, AUHN, 3).setBorder(null, null, true, null, null, true, '#E6DED3', SpreadsheetApp.BorderStyle.SOLID);
  plan.getRange(PL0 - 1, V).setNote(AUH_JUHIS);
  plan.getRange(AUH0 + AUHN, V, 4, 3).merge();
  plan.getRange(AUH0 + AUHN, V).setValue(AUH_JUHIS).setFontSize(9).setFontColor('#6E655B').setFontStyle('italic').setWrap(true).setVerticalAlignment('top');
  plan.setColumnWidth(V, 200); plan.setColumnWidth(V + 1, 170); plan.setColumnWidth(V + 2, 80);
  return true;
}

// Auhinnad plaani järjekorras: [{et, en, n}]. Tühjad read ja 0 jäävad välja.
function auhinnaLoend_(plan) {
  if (!plan || plan.getMaxColumns() < AUH_VEERG + 2 || str_(plan.getRange(PL0 - 1, AUH_VEERG).getValue()) !== AUH_PAIS[0]) return [];
  return plan.getRange(AUH0, AUH_VEERG, AUHN, 3).getValues().map(function (r) {
    return { et: str_(r[0]), en: str_(r[1]) || str_(r[0]), n: Math.floor(Number(r[2]) || 0) };
  }).filter(function (a) { return a.et && a.n > 0; });
}

// Viimane loos (igal grupil oma): { kuu: '2026-10', aeg: '3.11.2026', voitjad: [{ nimi, p, et, en }] }.
function loosOlek_() {
  try { var o = JSON.parse(props_().getProperty('LOOS') || 'null'); return o && o.kuu && o.voitjad ? o : null; } catch (err) { return null; }
}
function kuuVoti_(y, m) { return y + '-' + (m < 10 ? '0' : '') + m; }
function piletit_(p) { return p + (p === 1 ? ' pilet' : ' piletit'); }

// Uue kuu esimeses trennis: loosib lõppenud (eelmise) kuu piletite järgi välja plaani tabeli „Auhinnad“ auhinnad.
// Rohkem pileteid = suurem võimalus võita. Auhinna väärtus võimalust ei mõjuta: auhinnad jagatakse võitjatele juhuslikult.
// Loosis on ainult need, kellel on vähemalt 1 pilet (reeglid 5.5). Korraldaja (KLOON) ja „Endine osaleja“ ei osale.
// Üks inimene võidab kuus ühe auhinna. Kui sama kuu loos on juba tehtud, loositakse ainult juurde lisatud auhinnad.
function loosi_(plan) {
  var pub = avalik_();
  if (!pub) return { tekst: 'Ühist tabelit veel pole. Vali „Kuu harjutus → Seadista“.' };
  KUUD_ = null;
  var t = tana_(), d = ymd_(t), k = eelmine_(d[0], d[1]);
  var m = kuuLeht_(pub, k[0], k[1]);
  if (!m) return { tekst: 'Eelmise kuu (' + ET_M[k[1] - 1].toLowerCase() + ') vahekaarti pole, loosida pole kelle vahel.' };
  var kn = ymd_(m.start)[1] - 1, kuus = ET_G[kn] + 's', Kuu = ET_G[kn].charAt(0).toUpperCase() + ET_G[kn].slice(1);
  var auh = auhinnaLoend_(plan);
  if (!auh.length) return { tekst: 'Auhindu pole kirjas. Kirjuta need sellel vahekaardil tabelisse „Auhinnad“ (tulbad V–X) ja tee siis linnuke uuesti.' };
  var voti = kuuVoti_(k[0], k[1]), olek = loosOlek_();
  if (!olek || olek.kuu !== voti) olek = { kuu: voti, aeg: '', voitjad: [] };
  var f = pub.getSheetByName(T_FAME), rida = -1, varem = olek.voitjad.map(function (w) { return w.nimi; });
  if (f) {
    var a = f.getRange(FAME0, 1, FAMEN, 1).getValues();
    for (var i = 0; i < FAMEN; i++) if (String(a[i][0]) === m.name) { rida = FAME0 + i; break; }
    if (rida > 0) str_(f.getRange(rida, FAME_WIN).getValue()).split(/\s*[,\n]\s*/).filter(String).forEach(function (x) { if (varem.indexOf(x) < 0) varem.push(x); });
  }
  var antud = {};
  olek.voitjad.forEach(function (w) { antud[w.et] = (antud[w.et] || 0) + 1; });
  var jaak = [];                                                     // auhinnad, mis on veel loosimata (üks kord iga tükk)
  auh.forEach(function (x) { for (var j = antud[x.et] || 0; j < x.n; j++) jaak.push(x); });
  var loetelu = function (ws) {
    return ws.map(function (w, i) { return (i + 1) + '. ' + w.nimi + ' (' + piletit_(w.p) + ') – ' + w.et; }).join('; ');
  };
  if (!jaak.length) return { tekst: Kuu + ' auhinnad on juba loositud (' + olek.aeg + '): ' + loetelu(jarjestaVoitjad_(olek.voitjad, auh)) +
    '. Kui lisad tabelisse „Auhinnad“ uusi auhindu, loosib linnuke ainult need juurde.' };
  var kloon = KLOON.toLowerCase();
  var nimed = m.sh.getRange(R0, 1, N, 1).getValues(), pil = m.sh.getRange(R0, PILETID, N, 1).getValues();
  var loos = [], kokku = 0;
  nimed.forEach(function (r, i) {
    var nimi = str_(r[0]), p = Math.floor(Number(pil[i][0]) || 0);
    if (!nimi || p <= 0 || nimi === EKS || nimi.toLowerCase() === kloon || varem.indexOf(nimi) >= 0) return;
    loos.push([nimi, p]); kokku += p;
  });
  if (!kokku) return { tekst: 'Loosis pole kedagi: ' + kuus + ' pole veel ühtegi piletit' + (varem.length ? ' (varem võitsid ' + varem.join(', ') + ')' : '') + '.' };
  for (var s = jaak.length - 1; s > 0; s--) { var r_ = Math.floor(Math.random() * (s + 1)), tmp = jaak[s]; jaak[s] = jaak[r_]; jaak[r_] = tmp; }
  var uued = [];
  while (uued.length < jaak.length && loos.length) {
    var x = Math.floor(Math.random() * kokku), v = loos.length - 1;
    for (var j = 0; j < loos.length; j++) { if (x < loos[j][1]) { v = j; break; } x -= loos[j][1]; }
    var pr = jaak[uued.length];
    uued.push({ nimi: loos[v][0], p: loos[v][1], et: pr.et, en: pr.en });
    kokku -= loos[v][1]; loos.splice(v, 1);
  }
  olek.voitjad = olek.voitjad.concat(uued);
  olek.aeg = Utilities.formatDate(new Date(), TZ, 'd.MM.yyyy');
  props_().setProperty('LOOS', JSON.stringify(olek));
  if (rida > 0) {
    var koik = varem.slice();
    uued.forEach(function (w) { koik.push(w.nimi); });
    f.getRange(rida, FAME_WIN).setValue(koik.join('\n')); autahvliKorgus_(f);
  }
  voitjadVaade_(pub, true);
  var aeg = Utilities.formatDate(new Date(), TZ, 'd.MM HH:mm'), jaab = jaak.length - uued.length;
  return { nimi: uued[0].nimi, nimed: uued.map(function (w) { return w.nimi; }),
    tekst: '🎉 ' + Kuu + ' loos on tehtud (' + aeg + '): ' + loetelu(jarjestaVoitjad_(uued, auh)) + '. ' +
      (jaab ? 'Piletiga osalejaid oli ainult ' + uued.length + ', seega jäi ' + jaab + (jaab === 1 ? ' auhind' : ' auhinda') + ' loosimata. ' : '') +
      'Võitjad on nüüd ühise tabeli vahekaartidel „Ülevaade“ ja „Autahvel“.' };
}

// Võitjad auhindade tabeli järjekorras (suurem auhind ülal, kui see on tabelis ülal), sama auhinna puhul loosi järjekorras.
function jarjestaVoitjad_(ws, auh) {
  var koht = {};
  auh.forEach(function (a, i) { if (!(a.et in koht)) koht[a.et] = i; });
  return ws.map(function (w, i) { return [w, i]; }).sort(function (a, b) {
    var x = a[0].et in koht ? koht[a[0].et] : 999, y = b[0].et in koht ? koht[b[0].et] : 999;
    return x - y || a[1] - b[1];
  }).map(function (x) { return x[0]; });
}

// Ülevaate vahekaardil graafiku „Grupi korduste arv päevas“ all (G19:J…): „<Kuu>kuu fortuuna soosis neid osalejaid“ ja viimase loosi võitjad.
// Uus loos (järgmise kuu alguses) asendab eelmise kuu võitjad, Autahvlile jäävad kõik alles. Enne esimest loosi on tabel tühi ja pealkirjas
// kuu, mille loos tuleb järgmisena. edetabel_ (Seadista) tühjendab read 19…121 tulpadeni K, seega joonistab Seadista selle pärast uuesti.
var VV0 = 19, VV_VEERG = 7, VV_MAX = 100;
function voitjadVaade_(pub, alati) {
  var b = pub.getSheetByName(T_BOARD);
  if (!b) return false;
  var olek = loosOlek_(), y, mm;
  if (olek) { y = Number(olek.kuu.slice(0, 4)); mm = Number(olek.kuu.slice(5)); }
  else {
    var d = ymd_(tana_()), k = eelmine_(d[0], d[1]), j = d[1] === 12 ? [d[0] + 1, 1] : [d[0], d[1] + 1];
    var v = [k, d, j].filter(function (x) { return kuuLeht_(pub, x[0], x[1]); })[0] || d;   // järgmisena loositav kuu
    y = v[0]; mm = v[1];
  }
  var voti = kuuVoti_(y, mm) + '|' + (olek ? olek.aeg + '|' + olek.voitjad.length : '-');
  if (!alati && props_().getProperty('LOOS_VAADE') === voti && /fortuuna/.test(b.getRange(VV0, VV_VEERG).getFormula())) return false;
  var plan = plaan_(), ws = olek ? jarjestaVoitjad_(olek.voitjad, auhinnaLoend_(plan)).slice(0, VV_MAX) : [];
  var L = "'" + T_GUIDE + "'!$C$3=\"English\"", q = function (s) { return String(s).replace(/"/g, '""'); };
  var tx = function (et, en) { return '=IF(' + L + ',"' + q(en) + '","' + q(et) + '")'; };
  var EN_K = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][mm - 1];
  var G = ET_G[mm - 1], Kuu = G.charAt(0).toUpperCase() + G.slice(1);
  if (b.getMaxRows() < VV0 + 2 + VV_MAX) b.insertRowsAfter(b.getMaxRows(), VV0 + 2 + VV_MAX - b.getMaxRows());
  var C = VV_VEERG, koht = b.getRange(VV0, C, VV_MAX + 3, 4);
  koht.breakApart(); koht.clear();
  b.getRange(VV0, C, 1, 4).merge();
  b.getRange(VV0, C).setFormula(tx(Kuu + 'kuu fortuuna soosis neid osalejaid', 'Fortune smiled on these participants in ' + EN_K))
    .setFontFamily('Oswald').setFontSize(14).setFontWeight('bold').setFontColor('#2B241E').setVerticalAlignment('bottom').setHorizontalAlignment('left');
  b.getRange(VV0 + 1, C, 1, 4).merge();
  b.getRange(VV0 + 1, C).setFormula(olek
      ? tx('Loosisime ' + olek.aeg + ' ' + G + ' piletite järgi. Mida rohkem pileteid, seda suurem oli võimalus võita. Kõik võitjad on ka vahekaardil „Autahvel“.',
           'Drawn on ' + olek.aeg + ' from the ' + EN_K + ' tickets. More tickets meant a better chance to win. All winners are also on the “Autahvel | Fame” tab.')
      : tx('Võitjad loosime uue kuu esimeses trennis ' + G + ' piletite järgi. Mida rohkem pileteid, seda suurem on võimalus võita.',
           'We draw the winners at the first training of the new month from the ' + EN_K + ' tickets. The more tickets, the better your chance to win.'))
    .setFontSize(8).setFontColor('#6E655B').setFontStyle('italic').setWrap(true).setVerticalAlignment('middle').setHorizontalAlignment('left');
  b.getRange(VV0 + 2, C, 1, 4).setFormulas([[tx('NR', '#'), tx('NIMI', 'NAME'), tx('PILETID', 'TICKETS'), tx('AUHIND', 'PRIZE')]])
    .setBackground('#2B241E').setFontColor('#FFFFFF').setFontSize(8).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
  if (!ws.length) {
    b.getRange(VV0 + 3, C, 1, 4).merge();
    b.getRange(VV0 + 3, C).setFormula(tx('Võitjad tulevad siia pärast loosi.', 'The winners appear here after the draw.'))
      .setFontSize(10).setFontColor('#6E655B').setHorizontalAlignment('center').setVerticalAlignment('middle');
  } else {
    var r0 = VV0 + 3, n = ws.length;
    b.getRange(r0, C, n, 3).setValues(ws.map(function (w, i) { return [i + 1, txt_(w.nimi), w.p]; }));
    b.getRange(r0, C + 3, n, 1).setFormulas(ws.map(function (w) { return [tx(w.et, w.en || w.et)]; }));
    b.getRange(r0, C, n, 4).setFontSize(10).setFontColor('#2B241E').setFontWeight('normal').setVerticalAlignment('middle').setHorizontalAlignment('center')
      .setBackgrounds(ws.map(function (w, i) { var c = i % 2 ? '#F6F1EA' : '#FFFFFF'; return [c, c, c, c]; }));
    b.getRange(r0, C, n, 1).setNumberFormat('0').setFontWeight('bold').setFontColor('#8B6B47');
    b.getRange(r0, C + 2, n, 1).setNumberFormat('0');
    b.getRange(r0, C + 1, n, 1).setHorizontalAlignment('left').setFontWeight('bold');
    b.getRange(r0, C + 3, n, 1).setHorizontalAlignment('left').setWrap(true);
  }
  b.setColumnWidth(C, 40); b.setColumnWidth(C + 1, 130); b.setColumnWidth(C + 2, 70); b.setColumnWidth(C + 3, 210);
  props_().setProperty('LOOS_VAADE', voti);
  return true;
}

// ================================================================ reeglid dokumendina

// Teeb (või uuendab) Google'i dokumendi reeglitega, jagab selle lugemiseks ja paneb lingi vahekaardile „Reeglid“.
function reeglid_(pub) {
  if (KH_PATCH.doc_url && !GRUPP_) return KH_PATCH.doc_url;   // põhigrupi dokument on valmis tehtud; teine grupp saab oma              // reeglite dokument on valmis tehtud, lingid on juba mallis
  var props = props_(), id = props.getProperty('DOC_ID'), doc = null;
  if (id) {
    try { if (!DriveApp.getFileById(id).isTrashed()) doc = DocumentApp.openById(id); } catch (err) { doc = null; }
  }
  var sisu = JSON.stringify(KH_PATCH.rules) + (GRUPP_ ? taisnimi_() : ''), h = 0;   // grupi nime muutus kirjutab dokumendi uuesti
  for (var i = 0; i < sisu.length; i++) h = (h * 31 + sisu.charCodeAt(i)) | 0;
  var sig = sisu.length + ':' + h;
  if (!doc) {
    doc = DocumentApp.create(DOC_NAME + silt_());
    props.setProperty('DOC_ID', doc.getId());
    props.deleteProperty('DOC_SISU');
    var kaust = kaust_(pub);
    if (kaust) { try { DriveApp.getFileById(doc.getId()).moveTo(DriveApp.getFolderById(kaust)); } catch (err) {} }
  }
  var docId = doc.getId(), url = doc.getUrl();
  try { if (doc.getName() !== DOC_NAME + silt_()) doc.setName(DOC_NAME + silt_()); } catch (err) {}              // enne sulgemist: suletud dokumendilt neid enam ei saa
  if (props.getProperty('DOC_SISU') !== sig) {
    kirjutaReeglid_(doc);
    props.setProperty('DOC_SISU', sig);
  }
  try { DriveApp.getFileById(docId).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (err) {}
  var rl = pub.getSheetByName(T_RULES);
  if (rl) rl.getRange('C4').setRichTextValue(SpreadsheetApp.newRichTextValue()
    .setText('📄 Ava reeglid dokumendina · Open the rules as a document').setLinkUrl(url).build());
  var g = pub.getSheetByName(T_GUIDE);                        // Juhendi lõpus: „Loe kõiki reegleid siit“
  if (g) {
    var n = Math.min(g.getMaxRows(), 120), f = g.getRange(1, 3, n, 1).getFormulas();
    for (var i = 0; i < n; i++) {
      if (f[i][0].indexOf('Loe kõiki reegleid siit') < 0) continue;
      var sisu = f[i][0].indexOf('=HYPERLINK("') === 0 ? f[i][0].replace(/^=HYPERLINK\("[^"]*",/, '').replace(/\)$/, '') : f[i][0].slice(1);
      g.getRange(i + 1, 3).setFormula('=HYPERLINK("' + url + '",' + sisu + ')');
    }
  }
  return url;
}

function kirjutaReeglid_(doc) {
  var body = doc.getBody(), H = DocumentApp.ParagraphHeading;
  body.clear();
  var p = body.getParagraphs()[0];
  p.setText('Kuu harjutus · Reeglid');                      // setText ei tagasta midagi (null), seepärast eraldi
  p.setHeading(H.TITLE);
  body.appendParagraph(taisnimi_() + ' · Üksus. English version below.').setHeading(H.NORMAL).editAsText().setBold(false);
  [1, 2].forEach(function (L) {
    if (L === 2) body.appendParagraph('Monthly challenge · Rules').setHeading(H.TITLE);
    KH_PATCH.rules.forEach(function (sek) {
      body.appendParagraph(sek[0][L - 1]).setHeading(H.HEADING2);
      sek[1].forEach(function (it) {
        if (it[0]) {
          var t = body.appendParagraph(it[0] + '  ' + grupiTekst_(it[L])).setHeading(H.NORMAL).editAsText();
          t.setBold(false); t.setBold(0, it[0].length - 1, true);
        } else {
          body.appendListItem(grupiTekst_(it[L])).setGlyphType(DocumentApp.GlyphType.BULLET).editAsText().setBold(false);
        }
      });
    });
  });
  doc.saveAndClose();
}

// ================================================================ seadistuse abid

// Vanast (v4) plaanist tuleb üle see, mida oled ise muutnud, ja e-post ning postituste linnukesed.
function migreeri_(vana, plan) {
  var tunnus = vana.getMaxColumns() >= 20 ? String(vana.getRange('T1').getValue()) : '';
  if (/^KH[5-9]$/.test(tunnus)) { migreeriKH5_(vana, plan, tunnus !== 'KH5', tunnus === 'KH7', tunnus === 'KH8' || tunnus === 'KH9', tunnus === 'KH9'); return; }
  if (str_(vana.getRange('K2').getValue()) !== 'Algus') return;
  var old = vana.getRange(3, 1, 13, 15).getValues();
  var rng = plan.getRange(PL0, 1, PLN, 14), nv = rng.getValues(), muutus = false;
  var OI = [2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14], NI = [2, 3, 4, 6, 7, 8, 10, 12, 9, 11, 13];
  old.forEach(function (r) {
    var s = toSerial_(r[10]);
    if (s === null) return;
    var d = ymd_(s), pre = V4[d[0] + '-' + d[1]] || [];
    nv.forEach(function (row) {
      var ns = toSerial_(row[1]);
      if (ns === null) return;
      var nd = ymd_(ns);
      if (nd[0] !== d[0] || nd[1] !== d[1]) return;
      OI.forEach(function (oi, j) {
        var val = r[oi] === null ? '' : r[oi], eel = pre[j] === undefined ? '' : pre[j];
        if (String(val).trim() === String(eel).trim()) return;
        row[NI[j]] = val;
        if (NI[j] === 4) row[5] = val;                     // v4-s tegid Algaja ja Põhi sama arvu
        muutus = true;
      });
    });
  });
  if (muutus) plan.getRange(PL0, 3, PLN, 12).setValues(nv.map(function (r) { return r.slice(2, 14).map(txt_); }));
  var mail = str_(vana.getRange('C19').getValue());
  if (mail.indexOf('@') > 0) plan.getRange(C_EMAIL).setValue(mail);
  var on = vana.getRange('B24:B27').getValues();
  plan.getRange(POST0, 2, 4, 1).setValues(on.map(function (r) { return [r[0] !== false && String(r[0]).toUpperCase() !== 'FALSE']; }));
}

// Eelmise versiooni (KH5–KH9) plaanist tuleb üle kõik: plaan kuude kaupa, e-post ja postituste linnukesed.
// KH5-s oli üks veerg „Algaja ja Põhi“ (E); nüüd on Algaja (E) ja Põhi (F) eraldi, alguses sama arvuga.
// KH9-s olid juba 2x päevad (tulp O) ja postitused samadel ridadel.
function migreeriKH5_(vana, plan, kh6, kh7, kh8, kh9) {
  var old = vana.getRange(PL0, 1, PLN, kh6 ? 14 : 13).getValues(), o2x = kh9 ? vana.getRange(PL0, PL_2X, PLN, 1).getDisplayValues() : null;
  var n2x = plan.getRange(PL0, PL_2X, PLN, 1).getValues(), on2x = false;
  var rng = plan.getRange(PL0, 1, PLN, 14), nv = rng.getValues();
  old.forEach(function (r) {
    var s = toSerial_(r[1]);
    if (s === null) return;
    var d = ymd_(s);
    nv.forEach(function (row) {
      var ns = toSerial_(row[1]);
      if (ns === null) return;
      var nd = ymd_(ns);
      if (nd[0] !== d[0] || nd[1] !== d[1]) return;
      var v = r.map(function (x) { return x === null ? '' : x; });
      if (o2x) { n2x[nv.indexOf(row)][0] = o2x[old.indexOf(r)][0]; on2x = true; }
      for (var i = 2; i < 14; i++) row[i] = kh6 ? v[i] : '';
      if (kh6) return;
      row[2] = v[2]; row[3] = v[3]; row[4] = v[4]; row[5] = v[4]; row[6] = v[5]; row[7] = v[6];
      row[8] = v[7]; row[9] = v[8]; row[10] = v[9]; row[11] = v[10]; row[12] = v[11]; row[13] = v[12];
    });
  });
  plan.getRange(PL0, 3, PLN, 12).setValues(nv.map(function (r) { return r.slice(2, 14).map(txt_); }));
  if (on2x) plan.getRange(PL0, PL_2X, PLN, 1).setValues(n2x.map(function (r) { return [txt_(str_(r[0]))]; }));
  plan.getRange(C_EMAIL).setValue(str_(vana.getRange(C_EMAIL).getValue()));
  var d0 = vana.getRange(C_PREVIEW), f0 = d0.getFormula();
  if (!f0 && toSerial_(d0.getValue()) !== null) plan.getRange(C_PREVIEW).setValue(d0.getValue());
  var on = vana.getRange(kh9 ? POST0 : POST0_VANA, 2, 4, 1).getValues();
  plan.getRange(POST0, 2, 4, 1).setValues(on.map(function (r) { return [r[0] !== false && String(r[0]).toUpperCase() !== 'FALSE']; }));
  if (kh7) plan.getRange(C_LOOS_TULEMUS).setValue(vana.getRange('D32').getValue());   // KH7-s oli tulemus D32-s
  if (kh8) {
    plan.getRange(C_LOOS_TULEMUS).setValue(txt_(vana.getRange(C_LOOS_TULEMUS).getValue()));
  }
}

// Teeb manustatud xlsx-failist Google'i tabeli (Drive'i kaudu, sinu kontole).
function impordi_(nimi, kaust) {
  var bytes = Utilities.base64Decode(KH_XLSX.join(''));
  var meta = { name: nimi, mimeType: 'application/vnd.google-apps.spreadsheet' };
  if (kaust) meta.parents = [kaust];
  var piir = 'kuuharjutus' + Date.now();
  var pea = '--' + piir + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(meta) +
    '\r\n--' + piir + '\r\nContent-Type: ' + MIME_XLSX + '\r\n\r\n';
  var saba = '\r\n--' + piir + '--';
  var payload = Utilities.newBlob(pea).getBytes().concat(bytes).concat(Utilities.newBlob(saba).getBytes());
  var res = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'post', contentType: 'multipart/related; boundary=' + piir, payload: payload,
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) throw new Error('Tabeli loomine ebaõnnestus (' + res.getResponseCode() + '): ' + res.getContentText());
  return SpreadsheetApp.openById(JSON.parse(res.getContentText()).id);
}

function kaust_(ss) {
  try {
    var it = DriveApp.getFileById(ss.getId()).getParents();
    return it.hasNext() ? it.next().getId() : null;
  } catch (err) { return null; }
}

function avalik_() {
  var props = props_(), id = props.getProperty('PUB_ID');
  if (!id) {
    var plan = plaan_(), m = plan ? String(plan.getRange(C_LINK).getValue()).match(/\/d\/([\w-]{20,})/) : null;
    if (m) id = m[1];
  }
  if (!id) return null;
  try {
    if (DriveApp.getFileById(id).isTrashed()) return null;
    return SpreadsheetApp.openById(id);
  } catch (err) { return null; }
}

function privaatne_() {
  var id = props_().getProperty('PRIV_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActive();
}

function plaan_(priv) {
  if (GRUPP_) {
    if (!GRUPP_.plan) GRUPP_.plan = grupid_(priv).filter(function (x) { return x && grupiNimi_(x) === GRUPP_.nimi; })[0] || null;
    return GRUPP_.plan;
  }
  priv = priv || privaatne_();
  var s = priv.getSheets();
  for (var i = 0; i < s.length; i++) if (onPlaan_(s[i]) && !grupiNimi_(s[i])) return s[i];
  return null;
}

// ================================================================ grupid

// Iga grupp = oma plaani vahekaart privaatses tabelis ja oma ühine tabel. Põhigrupi vahekaart on „Kuuharjutus“ (U1 tühi),
// teise grupi oma näiteks „Kuuharjutus · Swed“ (U1 = grupi nimi). Teise grupi plaan võtab harjutused põhiplaanist (valemid),
// üle kirjutatud lahter jääb grupile omaks. Link, loos, postitused ja skripti mälu (props_) on igal grupil oma.
var GRUPP_ = null;                                           // null = põhigrupp
var POHIGRUPP = 'Algajad ja Kalisteenika grupp';             // põhigrupi nimi reeglites (teises grupis tuleb selle asemele grupi nimi)

// Postituste eelvaate valemid (uus harjutus, nädala seis; eesti ja inglise keeles) elavad plaani vahekaardil, nii et uus tekst
// (Erik 20.10: nädalakiri näitas „7 inimest 100% peal ja 10 vähemalt 80%“, uue kuu teade sai uue sõnastuse) ei jõua olemasolevale
// vahekaardile ise. Kui versioon on vana, võetakse valemid mallist (kopeerimine säilitab valemi igas lokaadis). Käib korra.
function postiValemid_(plan) {
  var props = props_();
  if (props.getProperty('POSTID') === POSTID) return false;
  var priv = plan.getParent(), aj = impordi_(PUB_NAME + ' (ajutine)', null), tmp = null;
  try {
    tmp = aj.getSheetByName(T_PLAN).copyTo(priv);
    var uus = POST0 + 4;                                            // „Eesmärk täis“ (27.10): vanal vahekaardil seda rida pole
    if (!str_(plan.getRange(uus, 3).getValue())) {
      tmp.getRange(uus, 1, 1, 18).copyTo(plan.getRange(uus, 1, 1, 18));
      plan.setRowHeight(uus, tmp.getRowHeight(uus));
      plan.getRange(uus, 5, 1, 6).merge(); plan.getRange(uus, 12, 1, 6).merge();
      plan.getRange(uus, 2).insertCheckboxes().setValue(true);
      tmp.getRange('T23:T24').copyTo(plan.getRange('T23:T24'));
    }
    [POST0, POST0 + 2, uus].forEach(function (rida) {
      [5, 12].forEach(function (veerg) {
        tmp.getRange(rida, veerg).copyTo(plan.getRange(rida, veerg), SpreadsheetApp.CopyPasteType.PASTE_FORMULA, false);
      });
    });
  } finally {
    if (tmp) priv.deleteSheet(tmp);
    DriveApp.getFileById(aj.getId()).setTrashed(true);
  }
  props.setProperty('POSTID', POSTID);
  return true;
}

function onPlaan_(sh) { return !!sh && sh.getMaxColumns() >= 21 && sh.getRange('T1').getValue() === VER; }
function grupiNimi_(plan) { return plan ? str_(plan.getRange('U1').getValue()) : ''; }

// Kõik grupid: põhigrupp (tema vahekaart või null, kui seda veel pole) ja teised.
function grupid_(priv) {
  var s = (priv || privaatne_()).getSheets().filter(onPlaan_);
  return [s.filter(function (x) { return !grupiNimi_(x); })[0] || null].concat(s.filter(function (x) { return grupiNimi_(x); }));
}

// Käivitab fn grupi kontekstis (plaani vahekaart, null = põhigrupp, või grupi nimi).
function grupiga_(plan, fn) {
  var vana = GRUPP_, nimi = typeof plan === 'string' ? plan : grupiNimi_(plan);
  GRUPP_ = nimi ? { nimi: nimi, plan: typeof plan === 'string' ? null : plan } : null;
  KUUD_ = null;
  try { return fn(); } finally { GRUPP_ = vana; KUUD_ = null; }
}
function koigile_(priv, fn) { return grupid_(priv).map(function (g) { return grupiga_(g, fn); }); }

// Menüüst: tegevus käib selle grupi kohta, mille vahekaart on lahti (muidu põhigrupp).
function aktiivsele_(fn) {
  var sh = null;
  try { sh = SpreadsheetApp.getActiveSheet(); } catch (err) {}
  return grupiga_(onPlaan_(sh) ? sh : null, fn);
}

function silt_() { return GRUPP_ ? ' · ' + GRUPP_.nimi : ''; }
function pubNimi_() { return GRUPP_ ? 'Kuu harjutus · ' + GRUPP_.nimi + ' | Monthly challenge' : PUB_NAME; }
function grupiTekst_(s) { return GRUPP_ ? String(s).split(POHIGRUPP).join(taisnimi_()) : s; }
// Grupi nimi reeglites („kalisteenikagrupi (Swedpank grupp)“). Kui grupp siin kirjas pole, on see „<nimi> grupp“.
var GRUPI_NIMED = { 'swed': 'Swedpank grupp' };
function taisnimi_() {
  if (!GRUPP_) return POHIGRUPP;
  var n = GRUPP_.nimi;
  return GRUPI_NIMED[n.toLowerCase()] || (/grupp$/i.test(n) ? n : n + ' grupp');
}

// Skripti mälu: teise grupi võtmetel on lõpus @grupp. Ühised võtmed jäävad samaks.
function props_() {
  var p = PropertiesService.getScriptProperties();
  if (!GRUPP_) return p;
  var k = function (x) { return /^(PRIV_ID$|PUB_VER:|GRUPP:|YLEVAADE$)/.test(x) ? x : x + '@' + GRUPP_.nimi; };
  return { getProperty: function (x) { return p.getProperty(k(x)); },
           setProperty: function (x, v) { p.setProperty(k(x), v); return this; },
           deleteProperty: function (x) { p.deleteProperty(k(x)); return this; } };
}

// E-kirja pealkirjas on teise grupi nimi: „Kuu harjutus · Swed: Start“.
function kiri_(o) {
  o.subject = String(o.subject).replace('Kuu harjutus', 'Kuu harjutus' + silt_());
  MailApp.sendEmail(o);
}

// Menüüst „Lisa uus grupp“: uus plaani vahekaart (harjutused tulevad põhiplaanist) ja Seadista teeb grupile ühise tabeli.
function lisaGrupp() {
  var ui = SpreadsheetApp.getUi(), priv = SpreadsheetApp.getActive();
  GRUPP_ = null;
  var pohi = plaan_(priv);
  if (!pohi) { ui.alert('Vali enne „Kuu harjutus → Seadista“.'); return; }
  var v = ui.prompt('Lisa uus grupp', 'Kirjuta grupi nimi, näiteks Swed. See tuleb ühise tabeli ja vahekaardi nimesse.', ui.ButtonSet.OK_CANCEL);
  if (v.getSelectedButton() !== ui.Button.OK) return;
  var nimi = str_(v.getResponseText()).replace(/['"|@:!]/g, '').replace(/\s+/g, ' ').trim();
  if (!nimi) { ui.alert('Grupi nimi jäi tühjaks.'); return; }
  if (grupid_(priv).some(function (g) { return g && grupiNimi_(g).toLowerCase() === nimi.toLowerCase(); }) || priv.getSheetByName(T_PLAN + ' · ' + nimi)) {
    ui.alert('Grupp „' + nimi + '“ on juba olemas.'); return;
  }
  looGrupp_(priv, pohi, nimi);
  seadista();
}

function looGrupp_(priv, pohi, nimi) {
  var g = pohi.copyTo(priv).setName(T_PLAN + ' · ' + nimi), P = viide_(pohi);
  g.getRange('U1').setValue(nimi);
  g.getRange('A1').setValue('KUUHARJUTUS · ' + nimi + ' · korraldaja vahekaart (ainult sulle)');
  var f = [];
  for (var r = PL0; r < PL0 + PLN; r++) {
    var rida = [];
    for (var c = 3; c <= PL_2X; c++) { var a = P + String.fromCharCode(64 + c) + r; rida.push('=' + a); }
    f.push(rida);
  }
  var ala = g.getRange(PL0, 3, PLN, PL_2X - 2), vorm = ala.getNumberFormats();
  ala.clearNote().setNumberFormat('General').setFormulas(f).setNumberFormats(vorm);   // tulp O on tekst („7, 21“): valem enne, vorming siis tagasi
  g.getRange(C_LINK).setValue('');
  g.getRange(C_EMAIL).setFormula('=' + P + C_EMAIL);
  g.getRange(C_PREVIEW).setFormula('=TODAY()');
  [C_LOOS, C_KUU, C_PROOV].forEach(function (a) { g.getRange(a).setValue(false); });
  [C_LOOS_TULEMUS, C_KUU_TULEMUS, C_PROOV_TULEMUS].forEach(function (a) { g.getRange(a).setValue(''); });
  g.getRange(PL0 - 1, 3).setNote('Harjutused, numbrid ja 2x päevad tulevad vahekaardilt „' + T_PLAN + '“. Kui ' + nimi +
    ' grupil on mõnel kuul midagi teisiti, kirjuta see lahter siin üle. Link, loos, linnukesed ja postitused on sellel vahekaardil ainult ' + nimi + ' grupi omad.');
  g.hideColumns(20, 2);
  priv.setActiveSheet(g);
  priv.moveActiveSheet(priv.getSheets().indexOf(pohi) + 2);
  return g;
}

// Valemid grupi vahekaardil on lihtsad viited põhiplaanile (='Kuuharjutus'!C3). Koma ega semikoolonit neis pole,
// sest Eesti lokaadiga tabelis ei saa skripti kirjutatud komaga valemist aru (#ERROR!). Tühi lahter jääb tühjaks.
function viide_(pohi) { return "'" + pohi.getName().replace(/'/g, "''") + "'!"; }

// v11 kirjutas grupi vahekaardile =IF('Kuuharjutus'!C3="","",…): Eesti lokaadis #ERROR!. Need lahtrid saavad uue valemi,
// üle kirjutatud lahtrid jäävad nagu on. Käivitub Seadista ja öise hoolduse ajal.
function grupiValemid_(g, pohi) {
  var P = viide_(pohi), vana = /^=IF\('(?:[^']|'')*'!\$?([A-Z]+)\$?(\d+)\s*=\s*""\s*[,;]\s*""\s*[,;]/;
  [g.getRange(PL0, 3, PLN, PL_2X - 2), g.getRange(C_EMAIL)].forEach(function (ala) {
    var f = ala.getFormulas(), n = 0, koik = true;
    var uus = f.map(function (row) {
      return row.map(function (x) { var m = x.match(vana); if (m) { n++; return '=' + P + m[1] + m[2]; } koik = false; return x; });
    });
    if (!n) return;
    var vorm = ala.getNumberFormats();
    if (koik) { ala.setNumberFormat('General').setFormulas(uus).setNumberFormats(vorm); return; }
    uus.forEach(function (row, i) {
      row.forEach(function (x, j) {
        if (x !== f[i][j]) ala.getCell(i + 1, j + 1).setNumberFormat('General').setFormula(x).setNumberFormat(vorm[i][j]);
      });
    });
  });
}

// Teise grupi juhendi pealkiri: „ÜKSUSE KUU HARJUTUS ● SWED GRUPP“. Font on nii väike, et pealkiri mahub ühele reale.
function pealkiri_(pub) {
  var g = pub.getSheetByName(T_GUIDE);
  if (!g) return;
  var c = g.getRange('A1'), f = c.getFormula(), n = GRUPP_.nimi.toUpperCase();
  var et = 'ÜKSUSE KUU HARJUTUS', en = 'ÜKSUS MONTHLY CHALLENGE', et2 = et + ' ● ' + n + ' GRUPP', en2 = en + ' ● ' + n + ' GROUP';
  if (f.indexOf('"' + et + '"') < 0 || f.indexOf('"' + en + '"') < 0) return;   // juba tehtud
  c.setFormula(f.split('"' + et + '"').join('"' + et2 + '"').split('"' + en + '"').join('"' + en2 + '"'));
  c.setFontSize(Math.max(11, Math.min(20, Math.floor(20 * 24 / Math.max(et2.length, en2.length)))));
}

// Teise grupi ühine tabel: loob või uuendab, jagab lingiga, paneb lingi grupi plaani ja reeglid oma dokumenti.
function grupiSeadista_(priv, plan) {
  var pohi = grupid_(priv)[0];
  if (pohi) grupiValemid_(plan, pohi);
  var props = props_(), viga = '', pub = avalik_(), uus = !pub;
  try { postiValemid_(plan); } catch (err) { viga = 'Postituste tekste ei saanud uuendada: ' + (err && err.message ? err.message : err); }
  try { auhinnad_(plan); } catch (err) { viga += (viga ? ' ' : '') + 'Auhindade tabelit ei saanud teha: ' + (err && err.message ? err.message : err); }
  if (!pub) {
    pub = impordi_(pubNimi_(), kaust_(priv));
    props.setProperty('PUB_ID', pub.getId());
    props.setProperty('PUB_VER:' + pub.getId(), String(PUB_VER));
  }
  props.setProperty('GRUPP:' + pub.getId(), GRUPP_.nimi);
  tz_(pub);
  if (pub.getName() !== pubNimi_()) pub.rename(pubNimi_());
  var pooleli = false;
  if (uus) props.setProperty('EHITUS:' + pub.getId(), EHITUS);
  else if (!(JATKA && props.getProperty('EHITUS:' + pub.getId()) === EHITUS) && !aegaOn_(AJAPIIR)) pooleli = true;   // järgmine Seadista
  else viga = uuendaPub_(pub);
  var mall = pub.getSheetByName(T_PLAN);
  if (mall) pub.deleteSheet(mall);
  [false, true].forEach(function (v) { pub.createTextFinder(POHIGRUPP).matchFormulaText(v).replaceAllWith(taisnimi_()); });
  pealkiri_(pub);
  var jagatud = true;
  try { DriveApp.getFileById(pub.getId()).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT); } catch (err) { jagatud = false; }
  plan.getRange(C_LINK).setValue(pub.getUrl());
  lingid_(pub);
  var dok = '';
  try { dok = reeglid_(pub); } catch (err) { viga = 'Reeglite dokumenti ei saanud teha: ' + (err && err.message ? err.message : err); }
  return { nimi: GRUPP_.nimi, pub: pub, jagatud: jagatud, dok: dok, viga: viga, pooleli: pooleli };
}

function tz_(ss) { if (ss.getSpreadsheetTimeZone() !== TZ) ss.setSpreadsheetTimeZone(TZ); }

function vabaNimi_(ss, nimi) {
  if (!ss.getSheetByName(nimi)) return nimi;
  for (var i = 2; ; i++) if (!ss.getSheetByName(nimi + ' ' + i)) return nimi + ' ' + i;
}

// ================================================================ kuupäevad ja tekst

// Kuupäevad on seerianumbrid nagu tabelis (1 = 31.12.1899), et ajavööndid sassi ei läheks.
function serial_(y, m, d) { return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 864e5); }
function ymd_(s) { var x = new Date(Date.UTC(1899, 11, 30) + s * 864e5); return [x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate()]; }
function paevi_(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
function jargmine_(y, m) { return m === 12 ? [y + 1, 1] : [y, m + 1]; }
function eelmine_(y, m) { return m === 1 ? [y - 1, 12] : [y, m - 1]; }
function lehenimi_(y, m) { return ET_M[m - 1] + ' | ' + EN_S[m - 1]; }
function tana_() { return toSerial_(new Date()); }
function toSerial_(v) {
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return null;
    var p = Utilities.formatDate(v, TZ, 'yyyy-MM-dd').split('-');
    return serial_(Number(p[0]), Number(p[1]), Number(p[2]));
  }
  if (typeof v === 'number' && isFinite(v)) return Math.floor(v);
  return null;
}
function str_(v) { return v === null || v === undefined ? '' : String(v).trim(); }
function num_(v) { return typeof v === 'number' ? v : Number(String(v).replace(',', '.').trim() || NaN); }
function txt_(v) { return typeof v === 'string' && /^[=+\-@]/.test(v) ? "'" + v : v; }
function html_(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

// ================================================================ automaatne Seadista uue koodi järel
// Eraldi skript „Kuu harjutuse uuendaja“ vahetab selle koodi ise välja. Uus kood märkab, et teda pole veel seadistatud,
// ja käivitab Seadista ise: kui 6 minutist ei piisa, jätkab minuti pärast uuesti, kuni kõik on tehtud (kõige rohkem AUTO_MAX korda).
var AUTO_MAX = 6, AUTO_PAASTIK = 'kuuHarjutusAutoSeadista';

// Kiire kontroll iga päästiku alguses. Ei viska kunagi viga.
function versioon() {
  try {
    var p = PropertiesService.getScriptProperties();
    if (!p.getProperty('PRIV_ID') || p.getProperty('SEADISTATUD') === EHITUS || p.getProperty('AUTO_OOTEL') === EHITUS) return;
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(3000)) return;                          // proovin järgmisel korral
    try {
      if (p.getProperty('AUTO_OOTEL') === EHITUS) return;
      p.setProperty('AUTO_OOTEL', EHITUS);
      p.setProperty('AUTO_KORD', '0');
      autoJargmine_(60 * 1000);
    } finally { lock.releaseLock(); }
  } catch (err) { Logger.log('Versiooni kontroll: ' + (err && err.message ? err.message : err)); }
}

function autoJargmine_(ms) {
  ScriptApp.getProjectTriggers().forEach(function (tr) { if (tr.getHandlerFunction() === AUTO_PAASTIK) ScriptApp.deleteTrigger(tr); });
  ScriptApp.newTrigger(AUTO_PAASTIK).timeBased().after(ms).create();
}

function autoSeadista() {
  var p = PropertiesService.getScriptProperties();
  ScriptApp.getProjectTriggers().forEach(function (tr) { if (tr.getHandlerFunction() === AUTO_PAASTIK) ScriptApp.deleteTrigger(tr); });
  if (p.getProperty('SEADISTATUD') === EHITUS) { p.deleteProperty('AUTO_OOTEL'); return; }
  var kaib = Number(p.getProperty('SEADISTA_KAIB') || 0);
  if (kaib && Date.now() - kaib < 7 * 60 * 1000) { autoJargmine_(2 * 60 * 1000); return; }   // keegi käivitas Seadista ise, ootan
  var kord = Number(p.getProperty('AUTO_KORD') || 0) + 1;
  p.setProperty('AUTO_KORD', String(kord));
  var viga = '';
  try { viga = seadista() || ''; } catch (err) { viga = String(err && err.message ? err.message : err); }
  var to = Session.getEffectiveUser().getEmail();
  if (p.getProperty('SEADISTATUD') === EHITUS) {
    p.deleteProperty('AUTO_OOTEL');
    if (!viga) return;                                      // õnnestunud uuendusest kirja ei tule (Erik 27.10: risustab postkasti)
    MailApp.sendEmail({ to: to, name: 'Kuu harjutus', subject: 'Kuu harjutus: uus versioon on paigas',
      body: 'Skripti uus versioon on sees ja Seadista tegi kõik ise ära' + (kord > 1 ? ' (' + kord + ' korraga, sest kood on mahukas)' : '') +
        '. Sinult pole midagi vaja teha.' + (viga ? '\n\nMärkus: ' + viga : '') });
    return;
  }
  if (kord < AUTO_MAX) { autoJargmine_(60 * 1000); return; }
  MailApp.sendEmail({ to: to, name: 'Kuu harjutus', subject: 'Kuu harjutus: Seadista jäi pooleli',
    body: 'Skripti uus versioon on sees, aga Seadista ei jõudnud ' + AUTO_MAX + ' korraga lõpuni. ' +
      'Ava oma tabel ja vali „Kuu harjutus → Seadista“.' + (viga ? '\n\nViimane teade: ' + viga : '') });
}

return {
  versioon: versioon, autoSeadista: autoSeadista,
  menuu: menuu, seadista: seadista, naitaLinki: naitaLinki, looUusKuuleht: looUusKuuleht, uuendaEelvaade: uuendaEelvaade,
  saadaProov: saadaProov, lisaGrupp: lisaGrupp, aktiivsele: aktiivsele_, oine: oine, hommik: hommik, muudatus: muudatus, plaaniMuudatus: plaaniMuudatus, loosiMenuust: loosiMenuust, ylevaade: ylevaade, nimekiri: nimekiri,
  _: function (x) { return eval(x); }                       // ainult testimiseks
};
})();

// ================================================================ menüü ja päästikud (ainult need nimed on väljas)
function kuuHarjutusMenuu() { KuuHarjutus.versioon(); KuuHarjutus.menuu(); }
function kuuHarjutusSeadista() { KuuHarjutus.seadista(); }
function kuuHarjutusLink() { KuuHarjutus.naitaLinki(); }
function kuuHarjutusUusKuuleht() { KuuHarjutus.aktiivsele(KuuHarjutus.looUusKuuleht); }
function kuuHarjutusEelvaade() { KuuHarjutus.aktiivsele(KuuHarjutus.uuendaEelvaade); }
function kuuHarjutusProov() { KuuHarjutus.aktiivsele(KuuHarjutus.saadaProov); }
function kuuHarjutusLisaGrupp() { KuuHarjutus.lisaGrupp(); }
function kuuHarjutusOine() { KuuHarjutus.versioon(); KuuHarjutus.oine(); }
function kuuHarjutusHommik() { KuuHarjutus.versioon(); KuuHarjutus.hommik(); }
function kuuHarjutusMuudatus(e) { KuuHarjutus.versioon(); KuuHarjutus.muudatus(e); }
function kuuHarjutusPlaan(e) { KuuHarjutus.versioon(); KuuHarjutus.plaaniMuudatus(e); }
function kuuHarjutusLoos() { KuuHarjutus.aktiivsele(KuuHarjutus.loosiMenuust); }
function kuuHarjutusYlevaade() { KuuHarjutus.ylevaade(); }
function kuuHarjutusNimekiri() { KuuHarjutus.nimekiri(); }
function kuuHarjutusVersioon() { KuuHarjutus.versioon(); }
function kuuHarjutusAutoSeadista() { KuuHarjutus.autoSeadista(); }

// ================================================================ uuenduse andmed ja ühise tabeli fail (xlsx, base64)
var KH_PATCH = {
"cells": [
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"MONTHLY CHALLENGE\",\"KUU HARJUTUS\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"ÜKSUS MONTHLY CHALLENGE\",\"ÜKSUSE KUU HARJUTUS\")",
null
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Language\",\"Keel\")",
"Keel / Language",
null
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Tap the cell and pick Eesti to switch back. The whole sheet switches.\",\"Vajuta lahtrile ja vali English. Kogu tabel vahetab keelt.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Tap the cell and pick Eesti to switch back. You can also switch at the top of every tab, the whole sheet switches.\",\"Vajuta lahtrile ja vali English. Keelt saad vahetada ka iga vahekaardi ülaservas, kogu tabel vahetab keelt.\")",
30
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Below your target? Type it anyway. Every rep goes into the group total.\",\"Jäi alla eesmärgi? Kirjuta ikka. Iga kordus läheb ühisesse summasse.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Below your target? Type it anyway. Every rep you do at home goes into the group total we compete for.\",\"Jäid alla eesmärgi? Kirjuta ikka. Iga kodus tehtud kordus läheb ühisesse korduste summasse, mille nimel ka võistleme.\")",
75.19999999999999
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Joker, a day off. You get 2 a month and they count as done.\",\"Jokker ehk vaba päev. Kuus on 2 ja need loevad tehtuks.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Couldn't do it today? Type “J” in the cell. You can use a Joker 2 times a month. Joker days count as done.\",\"Täna ei saanud teha? Kirjuta lahtrisse „J“. 2 korda kuus võid kasutada Jokkerit. Jokkeri päevad loetakse tehtuks.\")",
61.4
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Forgot? You can still fill in yesterday's cell today. Older days are locked.\",\"Unustasid? Eilset lahtrit saad täita veel täna. Vanemaid päevi muuta ei saa.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Forgot to log it? You can still fill in yesterday's cell today. Older days are locked.\",\"Unustasid märkida? Eilset lahtrit saad täita veel täna. Vanemaid päevi muuta ei saa.\")",
61.4
],
[
"Juhend | Guide",
"=IFERROR(IF('Juhend | Guide'!$C$3=\"English\",CHOOSE(MONTH(INDIRECT(\"'\"&'Autahvel | Fame'!$AB$4&\"'!AW2\")),\"January\",\"February\",\"March\",\"April\",\"May\",\"June\",\"July\",\"August\",\"September\",\"October\",\"November\",\"December\")&\": \"&UPPER(INDIRECT(\"'\"&'Autahvel | Fame'!$AB$4&\"'!AW9\")),CHOOSE(MONTH(INDIRECT(\"'\"&'Autahvel | Fame'!$AB$4&\"'!AW2\")),\"Jaanuar\",\"Veebruar\",\"Märts\",\"Aprill\",\"Mai\",\"Juuni\",\"Juuli\",\"August\",\"September\",\"Oktoober\",\"November\",\"Detsember\")&\": \"&UPPER(INDIRECT(\"'\"&'Autahvel | Fame'!$AB$4&\"'!AW8\"))),\"\")",
"=IFERROR(IF('Juhend | Guide'!$C$3=\"English\",CHOOSE(MONTH(INDIRECT(\"'\"&'Autahvel | Fame'!$AB$4&\"'!AW2\")),\"January\",\"February\",\"March\",\"April\",\"May\",\"June\",\"July\",\"August\",\"September\",\"October\",\"November\",\"December\")&\" exercise: \"&UPPER(INDIRECT(\"'\"&'Autahvel | Fame'!$AB$4&\"'!AW9\")),CHOOSE(MONTH(INDIRECT(\"'\"&'Autahvel | Fame'!$AB$4&\"'!AW2\")),\"Jaanuari\",\"Veebruari\",\"Märtsi\",\"Aprilli\",\"Mai\",\"Juuni\",\"Juuli\",\"Augusti\",\"Septembri\",\"Oktoobri\",\"Novembri\",\"Detsembri\")&\" harjutus: \"&UPPER(INDIRECT(\"'\"&'Autahvel | Fame'!$AB$4&\"'!AW8\"))),\"\")",
null
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Pick it in the LEVEL column of the month tab. You can change it during your first week. All levels count the same.\",\"Taseme valid kuulehel veerus TASE. Muuta saad oma esimese nädala jooksul. Kõik tasemed loevad võrdselt.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"You can pick and change your level during the first 7 days from the start of the month or from when you joined. Then it's locked until the month ends. If you don't pick one, your level is Base. Try a harder level next month. All levels count the same.\",\"Taset saad valida ja muuta esimese 7 päeva jooksul kuu algusest või oma liitumisest. Siis on tase kuu lõpuni lukus. Kui sa taset ei vali, on sinu tase Põhi. Raskemat taset saad proovida järgmisel kuul. Kõiki tasemeid loeme võrdsena.\")",
80.52
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Badges: ✅ Finisher (80%), 🥇 Iron (100%), 🏆 Perfect (every day, no joker or H), 🔁 Comeback (missed 3+ days in a row but still finished), 💥 Volume champ (most reps above your daily target). All on the Fame tab.\",\"Embleemid: ✅ Läbitud (80%), 🥇 Raudne (100%), 🏆 Täiuslik (iga päev, ilma jokkeri ja H-ta), 🔁 Tagasitulek (vahele jäi 3+ päeva järjest, aga kuu sai ikka läbitud), 💥 Mahukuningas (kõige rohkem kordusi üle oma päeva eesmärgi). Kõik on vahekaardil Autahvel.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Badges:\n✅ Finisher: 80% of days done\n🥇 Iron: 100%\n🏆 Perfect: every day, no joker or H\n🔁 Comeback: missed 3+ days in a row but still finished\n💥 Volume champ: highest % above your daily target\nA badge needs at least 10 counted days in the month. All badge winners are shown on the Fame tab.\",\"Embleemid:\n✅ Läbitud: 80% päevadest tehtud\n🥇 Raudne: 100%\n🏆 Täiuslik: iga päev, ilma jokkeri ja H-ta\n🔁 Tagasitulek: vahele jäi 3+ päeva järjest, aga kuu sai ikka läbitud\n💥 Mahukuningas: kõige rohkem protsente üle oma päeva eesmärgi\nEmbleemi saab, kui kuus on vähemalt 10 arvestatud päeva. Kõik embleemide võitjad on näha vahekaardil „Autahvel“.\")",
171.79999999999998
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Badges: ✅ Finisher (80%), 🥇 Iron (100%), 🏆 Perfect (every day, no joker or H), 🔁 Comeback, 💥 Volume champ. All on the Fame tab.\",\"Embleemid: ✅ Läbitud (80%), 🥇 Raudne (100%), 🏆 Täiuslik (iga päev, ilma jokkeri ja H-ta), 🔁 Tagasitulek, 💥 Mahukuningas. Kõik on lehel Autahvel.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Badges:\n✅ Finisher: 80% of days done\n🥇 Iron: 100%\n🏆 Perfect: every day, no joker or H\n🔁 Comeback: missed 3+ days in a row but still finished\n💥 Volume champ: highest % above your daily target\nA badge needs at least 10 counted days in the month. All badge winners are shown on the Fame tab.\",\"Embleemid:\n✅ Läbitud: 80% päevadest tehtud\n🥇 Raudne: 100%\n🏆 Täiuslik: iga päev, ilma jokkeri ja H-ta\n🔁 Tagasitulek: vahele jäi 3+ päeva järjest, aga kuu sai ikka läbitud\n💥 Mahukuningas: kõige rohkem protsente üle oma päeva eesmärgi\nEmbleemi saab, kui kuus on vähemalt 10 arvestatud päeva. Kõik embleemide võitjad on näha vahekaardil „Autahvel“.\")",
171.79999999999998
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Every day you reach your target is one raffle ticket. Jokers and H give no ticket, and your % or level doesn't matter in the draw. See your tickets in the TICKETS column. We draw at the last training of the month.\",\"Iga päev, mil jõuad oma eesmärgini, on üks loosipilet. Jokker ja H pileteid ei anna, protsent ja tase loosis ei loe. Oma pileteid näed kuu vahekaardi tulbas PILETID. Loosime kuu viimases trennis.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"For every day you reach your target you get 1 raffle ticket. Joker and sick days give no ticket, but they don't lower your monthly %. See your tickets in the TICKETS column of the month tab. At the start of every month we draw prizes for the tickets!\",\"Iga trennipäeva eest, mil jõuad oma eesmärgini, saad 1 loosipileti. Jokkeri ja haiguspäeva eest piletit ei saa, aga kuu protsenti need ei vähenda. Oma pileteid näed kuu vahekaardi tulbas PILETID. Iga kuu alguses loosime piletite eest välja auhindu!\")",
116.6
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Every done day is one raffle ticket. We draw at the last training of the month.\",\"Iga tehtud päev on üks loosipilet. Loosime kuu viimases trennis.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"For every day you reach your target you get 1 raffle ticket. Joker and sick days give no ticket, but they don't lower your monthly %. See your tickets in the TICKETS column of the month tab. At the start of every month we draw prizes for the tickets!\",\"Iga trennipäeva eest, mil jõuad oma eesmärgini, saad 1 loosipileti. Jokkeri ja haiguspäeva eest piletit ei saa, aga kuu protsenti need ei vähenda. Oma pileteid näed kuu vahekaardi tulbas PILETID. Iga kuu alguses loosime piletite eest välja auhindu!\")",
116.6
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"If a day shows 2x and you do double your target that day, you get an extra ticket.\",\"Kui päeva kohal on 2x ja teed sel päeval kaks korda oma eesmärgi, saad lisapileti.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"If the organiser marks a day with 2x and you do double your target that day, you get an extra ticket.\",\"Kui korraldaja määrab trennipäeva kohale 2x ja teed sel päeval kaks korda oma eesmärgi, saad lisapileti.\")",
61.4
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"PAUSE\",\"PAUS\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"PAUSE AND LEAVING\",\"PAUS JA LAHKUMINE\")",
null
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Can't join next month? On the Roster tab pick “Paus · Pause” next to your name. When you're back, pick “Osalen · In” there. Don't delete your name.\",\"Järgmisel kuul ei saa osaleda? Vali lehel Nimekiri oma nime kõrval „Paus“. Tagasi tulles vali seal „Osalen“. Oma nime ära kustuta.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Can't join next month? On the Roster tab pick “Paus · Pause” next to your name, and “Osalen · In” when you're back. Leaving for good? Pick “Eemalda · Remove”, then “Kinnitan eemaldamise · Confirm removal”: your name and results are deleted from every tab.\",\"Järgmisel kuul ei saa osaleda? Vali vahekaardil „Nimekiri“ oma nime kõrval „Paus“, tagasi tulles „Osalen“. Lõpetad päriselt? Vali „Eemalda“ ja kinnituseks „Kinnitan eemaldamise“: sinu nimi ja tulemused kustuvad igalt vahekaardilt.\")",
104.6
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Can't join next month? On the Roster tab pick “Paus · Pause” next to your name, and “Osalen · In” when you're back. Leaving for good? Pick “Eemalda · Remove”, then “Kinnitan eemaldamise · Confirm removal”: your name and results are deleted from every tab.\",\"Järgmisel kuul ei saa osaleda? Vali lehel „Nimekiri“ oma nime kõrval „Paus“, tagasi tulles „Osalen“. Lõpetad päriselt? Vali „Eemalda“ ja kinnituseks „Kinnitan eemaldamise“: sinu nimi ja tulemused kustuvad igalt lehelt.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Can't join next month? On the Roster tab pick “Paus · Pause” next to your name, and “Osalen · In” when you're back. Leaving for good? Pick “Eemalda · Remove”, then “Kinnitan eemaldamise · Confirm removal”: your name and results are deleted from every tab.\",\"Järgmisel kuul ei saa osaleda? Vali vahekaardil „Nimekiri“ oma nime kõrval „Paus“, tagasi tulles „Osalen“. Lõpetad päriselt? Vali „Eemalda“ ja kinnituseks „Kinnitan eemaldamise“: sinu nimi ja tulemused kustuvad igalt vahekaardilt.\")",
104.6
],
[
"Nimekiri | Roster",
"=IF('Juhend | Guide'!$C$3=\"English\",\"ROSTER\",\"NIMEKIRI\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"PARTICIPANTS\",\"OSALEJATE NIMEKIRI\")",
null
],
[
"Nimekiri | Roster",
"=IF(COUNTIF($C$4:$C$103,\"Eemalda · Remove\")>0,IF('Juhend | Guide'!$C$3=\"English\",\"⚠️ Confirm the removal: on the red row pick “Kinnitan eemaldamise · Confirm removal”. That name and all its results are then deleted from every tab and the names below move up. Picked it by mistake? Pick “Osalen · In” again.\",\"⚠️ Kinnita eemaldamine: vali punasel real „Kinnitan eemaldamise“. Siis kustuvad see nimi ja kõik selle tulemused igalt vahekaardilt ning järgmised nimed nihkuvad ülespoole. Eksisid? Vali uuesti „Osalen“.\"),IF('Juhend | Guide'!$C$3=\"English\",\"Type your name in the first empty row (yellow). It appears on every month tab by itself. Skipping next month? Pick “Paus · Pause” next to your name, and “Osalen · In” when you're back. Leaving for good? Pick “Eemalda · Remove”.\",\"Kirjuta oma nimi esimesse vabasse ritta (kollane). See ilmub ise igale kuu vahekaardile. Järgmisel kuul ei osale? Vali oma nime kõrval „Paus“, tagasi tulles „Osalen“. Lõpetad päriselt? Vali „Eemalda“.\"))",
"=IF(COUNTIF($C$4:$C$103,\"Eemalda · Remove\")>0,IF('Juhend | Guide'!$C$3=\"English\",\"⚠️ Confirm the removal: on the red row pick “Kinnitan eemaldamise · Confirm removal”. The next night that name and this month's results are deleted and the names below move up. Picked it by mistake? Pick “Osalen · In” again before the night.\",\"⚠️ Kinnita eemaldamine: vali punasel real „Kinnitan eemaldamise“. Järgmisel ööl kustuvad see nimi ja selle kuu tulemused ning järgmised nimed nihkuvad ülespoole. Eksisid? Vali enne ööd uuesti „Osalen“.\"),IF('Juhend | Guide'!$C$3=\"English\",\"Type your name in the first empty row (yellow). It appears on every month tab by itself. Skipping next month? Pick “Paus · Pause” next to your name, and “Osalen · In” when you're back. Leaving for good? Pick “Eemalda · Remove”.\",\"Kirjuta oma nimi esimesse vabasse ritta (kollane). See ilmub ise igale kuu vahekaardile. Järgmisel kuul ei osale? Vali oma nime kõrval „Paus“, tagasi tulles „Osalen“. Lõpetad päriselt? Vali „Eemalda“.\"))",
78
],
[
"Nimekiri | Roster",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Type your name in the first empty row (yellow). It appears on every month tab by itself. Can't join next month? Pick “Paus · Pause” next to your name. When you're back, pick “Osalen · In”.\",\"Kirjuta oma nimi esimesse vabasse ritta (kollane). See ilmub ise igale kuulehele. Järgmisel kuul ei saa osaleda? Vali oma nime kõrval „Paus“. Tagasi tulles vali „Osalen“.\")",
"=IF(COUNTIF($C$4:$C$103,\"Eemalda · Remove\")>0,IF('Juhend | Guide'!$C$3=\"English\",\"⚠️ Confirm the removal: on the red row pick “Kinnitan eemaldamise · Confirm removal”. The next night that name and this month's results are deleted and the names below move up. Picked it by mistake? Pick “Osalen · In” again before the night.\",\"⚠️ Kinnita eemaldamine: vali punasel real „Kinnitan eemaldamise“. Järgmisel ööl kustuvad see nimi ja selle kuu tulemused ning järgmised nimed nihkuvad ülespoole. Eksisid? Vali enne ööd uuesti „Osalen“.\"),IF('Juhend | Guide'!$C$3=\"English\",\"Type your name in the first empty row (yellow). It appears on every month tab by itself. Skipping next month? Pick “Paus · Pause” next to your name, and “Osalen · In” when you're back. Leaving for good? Pick “Eemalda · Remove”.\",\"Kirjuta oma nimi esimesse vabasse ritta (kollane). See ilmub ise igale kuu vahekaardile. Järgmisel kuul ei osale? Vali oma nime kõrval „Paus“, tagasi tulles „Osalen“. Lõpetad päriselt? Vali „Eemalda“.\"))",
78
],
[
"Nimekiri | Roster",
"=IF(COUNTIF($C$4:$C$103,\"Eemalda · Remove\")>0,IF('Juhend | Guide'!$C$3=\"English\",\"⚠️ Confirm the removal: on the red row pick “Kinnitan eemaldamise · Confirm removal”. That name and all its results are then deleted from every tab and the names below move up. Picked it by mistake? Pick “Osalen · In” again.\",\"⚠️ Kinnita eemaldamine: vali punasel real „Kinnitan eemaldamise“. Siis kustuvad see nimi ja kõik selle tulemused igalt lehelt ning järgmised nimed nihkuvad ülespoole. Eksisid? Vali uuesti „Osalen“.\"),IF('Juhend | Guide'!$C$3=\"English\",\"Type your name in the first empty row (yellow). It appears on every month tab by itself. Skipping next month? Pick “Paus · Pause” next to your name, and “Osalen · In” when you're back. Leaving for good? Pick “Eemalda · Remove”.\",\"Kirjuta oma nimi esimesse vabasse ritta (kollane). See ilmub ise igale kuulehele. Järgmisel kuul ei osale? Vali oma nime kõrval „Paus“, tagasi tulles „Osalen“. Lõpetad päriselt? Vali „Eemalda“.\"))",
"=IF(COUNTIF($C$4:$C$103,\"Eemalda · Remove\")>0,IF('Juhend | Guide'!$C$3=\"English\",\"⚠️ Confirm the removal: on the red row pick “Kinnitan eemaldamise · Confirm removal”. The next night that name and this month's results are deleted and the names below move up. Picked it by mistake? Pick “Osalen · In” again before the night.\",\"⚠️ Kinnita eemaldamine: vali punasel real „Kinnitan eemaldamise“. Järgmisel ööl kustuvad see nimi ja selle kuu tulemused ning järgmised nimed nihkuvad ülespoole. Eksisid? Vali enne ööd uuesti „Osalen“.\"),IF('Juhend | Guide'!$C$3=\"English\",\"Type your name in the first empty row (yellow). It appears on every month tab by itself. Skipping next month? Pick “Paus · Pause” next to your name, and “Osalen · In” when you're back. Leaving for good? Pick “Eemalda · Remove”.\",\"Kirjuta oma nimi esimesse vabasse ritta (kollane). See ilmub ise igale kuu vahekaardile. Järgmisel kuul ei osale? Vali oma nime kõrval „Paus“, tagasi tulles „Osalen“. Lõpetad päriselt? Vali „Eemalda“.\"))",
78
],
[
"Ülevaade | Board",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Group progress and leaderboard. Everything updates by itself.\",\"Grupi seis ja edetabel. Kõik uueneb ise.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Group progress and leaderboard. All numbers update by themselves.\",\"Siin näed grupi seisu ja edetabelit. Kõik numbrid uuenevad ise.\")",
null
],
[
"Ülevaade | Board",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Order: completion, then done days, then extra reps.\",\"Järjestus: täitmine, siis tehtud päevad, siis lisakordused.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Higher result ranks first. With equal results, more days at your target ranks first. If that's equal too, more reps above your target decide.\",\"Eespool on see, kelle tulemus on kõrgem. Võrdse tulemuse korral on eespool see, kes on rohkem päevi oma eesmärgini jõudnud. Kui ka need on võrdsed, otsustab see, kes on teinud rohkem kordusi üle oma eesmärgi.\")",
40
],
[
"*kuu*",
"=IF('Juhend | Guide'!$C$3=\"English\",\"PAIR\",\"PAAR\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"TEAM\",\"TIIM\")",
null
],
[
"*kuu*",
"=IF('Juhend | Guide'!$C$3=\"English\",\"name or LOOKING\",\"nimi või OTSIN\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"team or LOOKING\",\"tiim või OTSIN\")",
null
],
[
"Ülevaade | Board",
"=IF('Juhend | Guide'!$C$3=\"English\",\"LOOKING FOR A PARTNER\",\"OTSIVAD PAARILIST\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"LOOKING FOR A TEAM\",\"OTSIVAD TIIMI\")",
null
],
[
"Autahvel | Fame",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Fills in by itself when a month ends. The organiser adds the raffle winners.\",\"Täitub ise, kui kuu on läbi. Loosivõitjad kirjutab korraldaja.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Fills in by itself when a month ends. Raffle winners appear here after the draw.\",\"Täitub ise, kui kuu on läbi. Loosivõitjad tulevad siia ise pärast loosi.\")",
null
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Tap the cell and pick Eesti to switch back. You can also switch at the top of every tab, the whole sheet switches.\",\"Vajuta lahtrile ja vali English. Keelt saad vahetada ka iga lehe ülaservas, kogu tabel vahetab keelt.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Tap the cell and pick Eesti to switch back. You can also switch at the top of every tab, the whole sheet switches.\",\"Vajuta lahtrile ja vali English. Keelt saad vahetada ka iga vahekaardi ülaservas, kogu tabel vahetab keelt.\")",
30.0
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Add your name on the Roster tab\",\"Kirjuta oma nimi lehele „Nimekiri“\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Add your name on the Roster tab\",\"Kirjuta oma nimi vahekaardile „Nimekiri“\")",
21.18
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"In the first empty row (it's yellow). You only do this once: your name appears on every month tab by itself.\",\"Kirjuta esimesse vabasse ritta (see on kollane). Seda teed ainult üks kord: sinu nimi ilmub ise igale kuulehele.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"In the first empty row (it's yellow). You only do this once: your name appears on every month tab by itself.\",\"Kirjuta esimesse vabasse ritta (see on kollane). Seda teed ainult üks kord: sinu nimi ilmub ise igale kuu vahekaardile.\")",
47.4
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Open the month tab and pick your level\",\"Ava kuu leht ja vali oma tase\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Open the month tab and pick your level\",\"Ava kuu vahekaart ja vali oma tase\")",
21.18
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Find your name and pick what suits you in the LEVEL column. The level descriptions are below.\",\"Leia oma nimi ja vali veerus TASE, mis sulle sobib. Tasemete kirjeldused on allpool.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Find your name and pick what suits you in the LEVEL column. The level descriptions are below.\",\"Leia oma nimi ja vali tulbas TASE, mis sulle sobib. Tasemete kirjeldused on allpool.\")",
47.4
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Pick this if you want a real challenge.\",\"Vali, kui tahad endale päris väljakutset.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Pick this if you want a real challenge.\",\"Vali, kui tahad endale suurt väljakutset.\")",
33.8
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Done at least 80% of your days? You've finished the month. See your % in the COMPLETION column of the month tab.\",\"Kui said vähemalt 80% päevadest tehtud, oled kuu läbinud. Oma protsenti näed kuulehe veerus TÄITMINE.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Done at least 80% of your days? You've finished the month. See your % in the COMPLETION column of the month tab.\",\"Kui said vähemalt 80% päevadest tehtud, oled kuu läbinud. Oma protsenti näed kuu vahekaardi tulbas TULEMUS.\")",
61.4
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"For every day you reach your target you get 1 raffle ticket. Joker and sick days give no ticket, but they don't lower your monthly %. See your tickets in the TICKETS column of the month tab. At the start of every month we draw prizes for the tickets!\",\"Iga trennipäeva eest, mil jõuad oma eesmärgini, saad 1 loosipileti. Jokkeri ja haiguspäeva eest piletit ei saa, aga kuu protsenti need ei vähenda. Oma pileteid näed kuulehe veerus PILETID. Iga kuu alguses loosime piletite eest välja auhindu!\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"For every day you reach your target you get 1 raffle ticket. Joker and sick days give no ticket, but they don't lower your monthly %. See your tickets in the TICKETS column of the month tab. At the start of every month we draw prizes for the tickets!\",\"Iga trennipäeva eest, mil jõuad oma eesmärgini, saad 1 loosipileti. Jokkeri ja haiguspäeva eest piletit ei saa, aga kuu protsenti need ei vähenda. Oma pileteid näed kuu vahekaardi tulbas PILETID. Iga kuu alguses loosime piletite eest välja auhindu!\")",
116.6
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Find a partner or even a trio and make a team (2–3 people). Each of you types the team name (for example Bears) in the TEAM column on the month tab, next to your own name. No team? Type LOOKING.\",\"Leia paariline või suisa kolmik ja looge tiim (2–3 inimest). Kirjutage tiimi nimi (näiteks Karud) kuu vahekaardil veergu TIIM, igaüks oma nime taha. Tiimi pole? Kirjuta OTSIN.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Find a partner or even a trio and make a team (2–3 people). Each of you types the team name (for example Bears) in the TEAM column on the month tab, next to your own name. No team? Type LOOKING.\",\"Leia paariline või suisa kolmik ja looge tiim (2–3 inimest). Kirjutage tiimi nimi (näiteks Karud) kuu vahekaardil tulpa TIIM, igaüks oma nime taha. Tiimi pole? Kirjuta OTSIN.\")",
89.0
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Everyone's reps go into one pot. See the progress on the Board tab.\",\"Kõigi kordused lähevad ühte potti. Seisu näed lehel „Ülevaade“.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Everyone's reps go into one pot. See the progress on the Board tab.\",\"Kõigi kordused lähevad ühte potti. Seisu näed vahekaardil „Ülevaade“.\")",
47.59999999999999
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Can't join next month? On the Roster tab pick “Paus · Pause” next to your name. You finish the current month as usual. At the start of the new month your name moves to the end of the list. When you're back, pick “Osalen · In” there. Don't delete your name.\",\"Järgmisel kuul ei saa osaleda? Vali lehel „Nimekiri“ oma nime kõrval „Paus“. Käimasoleva kuu teed lõpuni nagu tavaliselt. Uue kuu alguses liigub sinu nimi nimekirja lõppu. Tagasi tulles vali seal „Osalen“. Oma nime ära kustuta.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Can't join next month? On the Roster tab pick “Paus · Pause” next to your name. You finish the current month as usual. At the start of the new month your name moves to the end of the list. When you're back, pick “Osalen · In” there. Don't delete your name.\",\"Järgmisel kuul ei saa osaleda? Vali vahekaardil „Nimekiri“ oma nime kõrval „Paus“. Käimasoleva kuu teed lõpuni nagu tavaliselt. Uue kuu alguses liigub sinu nimi nimekirja lõppu. Tagasi tulles vali seal „Osalen“. Oma nime ära kustuta.\")",
116.6
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"TABS\",\"LEHED\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"TABS\",\"VAHEKAARDID\")",
28.0
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Month\",\"Kuuleht\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Month\",\"Kuu vahekaart\")",
116.6
],
[
"Nimekiri | Roster",
"=IF(COUNTIF($C$4:$C$103,\"Eemalda · Remove\")>0,IF('Juhend | Guide'!$C$3=\"English\",\"⚠️ Confirm the removal: on the red row pick “Kinnitan eemaldamise · Confirm removal”. The next night that name and this month's results are deleted and the names below move up. Picked it by mistake? Pick “Osalen · In” again before the night.\",\"⚠️ Kinnita eemaldamine: vali punasel real „Kinnitan eemaldamise“. Järgmisel ööl kustuvad see nimi ja selle kuu tulemused ning järgmised nimed nihkuvad ülespoole. Eksisid? Vali enne ööd uuesti „Osalen“.\"),IF('Juhend | Guide'!$C$3=\"English\",\"Type your name in the first empty row (yellow). It appears on every month tab by itself. Skipping next month? Pick “Paus · Pause” next to your name, and “Osalen · In” when you're back. Leaving for good? Pick “Eemalda · Remove”.\",\"Kirjuta oma nimi esimesse vabasse ritta (kollane). See ilmub ise igale kuulehele. Järgmisel kuul ei osale? Vali oma nime kõrval „Paus“, tagasi tulles „Osalen“. Lõpetad päriselt? Vali „Eemalda“.\"))",
"=IF(COUNTIF($C$4:$C$103,\"Eemalda · Remove\")>0,IF('Juhend | Guide'!$C$3=\"English\",\"⚠️ Confirm the removal: on the red row pick “Kinnitan eemaldamise · Confirm removal”. The next night that name and this month's results are deleted and the names below move up. Picked it by mistake? Pick “Osalen · In” again before the night.\",\"⚠️ Kinnita eemaldamine: vali punasel real „Kinnitan eemaldamise“. Järgmisel ööl kustuvad see nimi ja selle kuu tulemused ning järgmised nimed nihkuvad ülespoole. Eksisid? Vali enne ööd uuesti „Osalen“.\"),IF('Juhend | Guide'!$C$3=\"English\",\"Type your name in the first empty row (yellow). It appears on every month tab by itself. Skipping next month? Pick “Paus · Pause” next to your name, and “Osalen · In” when you're back. Leaving for good? Pick “Eemalda · Remove”.\",\"Kirjuta oma nimi esimesse vabasse ritta (kollane). See ilmub ise igale kuu vahekaardile. Järgmisel kuul ei osale? Vali oma nime kõrval „Paus“, tagasi tulles „Osalen“. Lõpetad päriselt? Vali „Eemalda“.\"))",
null
],
[
"*kuu*",
"=IF('Juhend | Guide'!$C$3=\"English\",\"COMPLETION\",\"TÄITMINE\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"COMPLETION\",\"TULEMUS\")",
null
],
[
"Ülevaade | Board",
"=IF('Juhend | Guide'!$C$3=\"English\",\"COMPLETION\",\"TÄITMINE\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"COMPLETION\",\"TULEMUS\")",
null
],
[
"Reeglid | Rules",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Pick the level that suits you in the LEVEL column of the month tab.\",\"Vali endale sobiv tase kuu vahekaardi veerus TASE.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Pick the level that suits you in the LEVEL column of the month tab.\",\"Vali endale sobiv tase kuu vahekaardi tulbas TASE.\")",
null
],
[
"Reeglid | Rules",
"=IF('Juhend | Guide'!$C$3=\"English\",\"You finish the month if you completed at least 80% of your days. See your % in the COMPLETION column. Joker days count as done, H and X days are left out. To get a badge you need at least 10 counted days in the month.\",\"Kuu on läbitud, kui oled teinud vähemalt 80% päevadest. Oma protsenti näed kuu vahekaardi veerus TULEMUS. Jokkeriga päev loeb tehtuks, H- ja X-päevi ei arvestata. Embleemi saamiseks peab sul kuus olema vähemalt 10 arvestatud päeva.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"You finish the month if you completed at least 80% of your days. See your % in the COMPLETION column. Joker days count as done, H and X days are left out. To get a badge you need at least 10 counted days in the month.\",\"Kuu on läbitud, kui oled teinud vähemalt 80% päevadest. Oma protsenti näed kuu vahekaardi tulbas TULEMUS. Jokkeriga päev loeb tehtuks, H- ja X-päevi ei arvestata. Embleemi saamiseks peab sul kuus olema vähemalt 10 arvestatud päeva.\")",
null
],
[
"Reeglid | Rules",
"=IF('Juhend | Guide'!$C$3=\"English\",\"For every day you reach your target you get 1 raffle ticket. Joker and sick days give no ticket, but they don't lower your monthly %. You get extra tickets on a double day (7.3) and with your team (8.4). See your tickets in the TICKETS column. The more tickets, the better your chance to win. Only the number of tickets counts, your level doesn't change your chance. The organiser draws the prizes at the first training of the new month, when all of the month's tickets are in. Everyone with at least one ticket is in the draw, the organiser isn't. The prize's value doesn't change your chance: each winner gets a random prize. One prize per person per month. Winners appear under the chart on the “Ülevaade | Board” tab and on the “Autahvel | Fame” tab.\",\"Iga trennipäeva eest, mil jõuad oma eesmärgini, saad 1 loosipileti. Jokkeri ja haiguspäeva eest piletit ei saa, aga kuu protsenti need ei vähenda. Lisapileteid saad topeltpäeval (7.3) ja tiimiga (8.4). Oma pileteid näed kuu vahekaardi veerus PILETID. Mida rohkem pileteid, seda suurem on võimalus auhind võita. Loosis loeb ainult piletite arv, sinu tase võiduvõimalust ei mõjuta. Korraldaja loosib auhinnad välja uue kuu esimeses trennis, kui kõik kuu piletid on koos. Loosis on kõik, kellel on vähemalt üks pilet, korraldaja ise loosis ei osale. Auhinna väärtus võiduvõimalust ei mõjuta, sest kes võidab, saab auhinna juhuslikult. Üks inimene saab kuus võita ühe auhinna. Võitjad ilmuvad vahekaardile „Ülevaade“ graafiku alla ja vahekaardile „Autahvel“.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"For every day you reach your target you get 1 raffle ticket. Joker and sick days give no ticket, but they don't lower your monthly %. You get extra tickets on a double day (7.3) and with your team (8.4). See your tickets in the TICKETS column. The more tickets, the better your chance to win. Only the number of tickets counts, your level doesn't change your chance. The organiser draws the prizes at the first training of the new month, when all of the month's tickets are in. Everyone with at least one ticket is in the draw, the organiser isn't. The prize's value doesn't change your chance: each winner gets a random prize. One prize per person per month. Winners appear under the chart on the “Ülevaade | Board” tab and on the “Autahvel | Fame” tab.\",\"Iga trennipäeva eest, mil jõuad oma eesmärgini, saad 1 loosipileti. Jokkeri ja haiguspäeva eest piletit ei saa, aga kuu protsenti need ei vähenda. Lisapileteid saad topeltpäeval (7.3) ja tiimiga (8.4). Oma pileteid näed kuu vahekaardi tulbas PILETID. Mida rohkem pileteid, seda suurem on võimalus auhind võita. Loosis loeb ainult piletite arv, sinu tase võiduvõimalust ei mõjuta. Korraldaja loosib auhinnad välja uue kuu esimeses trennis, kui kõik kuu piletid on koos. Loosis on kõik, kellel on vähemalt üks pilet, korraldaja ise loosis ei osale. Auhinna väärtus võiduvõimalust ei mõjuta, sest kes võidab, saab auhinna juhuslikult. Üks inimene saab kuus võita ühe auhinna. Võitjad ilmuvad vahekaardile „Ülevaade“ graafiku alla ja vahekaardile „Autahvel“.\")",
null
],
[
"Reeglid | Rules",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Skipping next month? On the “Nimekiri | Roster” tab pick “Paus · Pause” in the NEXT MONTH column next to your name. You finish the current month as usual, your row won't appear on the new month and your name moves to the end of the list when the new month starts. When you're back, pick “Osalen · In” there and your row comes right back. Don't delete your name.\",\"Kui sa järgmisel kuul kaasa ei tee, vali vahekaardil „Nimekiri“ oma nime kõrval veerus JÄRGMISEL KUUL „Paus“. Käimasoleva kuu teed lõpuni nagu tavaliselt, uuel kuul sinu rida ei ilmu ja uue kuu alguses liigub su nimi nimekirja lõppu. Tagasi tulles vali samas kohas „Osalen“ ja sinu rida ilmub kohe tagasi. Oma nime ära kustuta.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Skipping next month? On the “Nimekiri | Roster” tab pick “Paus · Pause” in the NEXT MONTH column next to your name. You finish the current month as usual, your row won't appear on the new month and your name moves to the end of the list when the new month starts. When you're back, pick “Osalen · In” there and your row comes right back. Don't delete your name.\",\"Kui sa järgmisel kuul kaasa ei tee, vali vahekaardil „Nimekiri“ oma nime kõrval tulbas JÄRGMISEL KUUL „Paus“. Käimasoleva kuu teed lõpuni nagu tavaliselt, uuel kuul sinu rida ei ilmu ja uue kuu alguses liigub su nimi nimekirja lõppu. Tagasi tulles vali samas kohas „Osalen“ ja sinu rida ilmub kohe tagasi. Oma nime ära kustuta.\")",
null
],
[
"Reeglid | Rules",
"=IF('Juhend | Guide'!$C$3=\"English\",\"If you're leaving for good, pick “Eemalda · Remove” in the same column and confirm with “Kinnitan eemaldamise · Confirm removal”. The next night your name and this month's results are deleted and the names below move up. In finished months the numbers stay under the name “Endine osaleja” (former member). Until that night you can still pick “Osalen · In”; after that it can't be undone.\",\"Kui lõpetad päriselt, vali samas veerus „Eemalda“ ja kinnituseks „Kinnitan eemaldamise“. Järgmisel ööl kustuvad sinu nimi ja käimasoleva kuu tulemused ning järgmised nimed nihkuvad ülespoole. Lõppenud kuudes jäävad numbrid alles nime „Endine osaleja“ all. Kuni ööni saad veel „Osalen“ valida, hiljem seda tagasi võtta ei saa.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"If you're leaving for good, pick “Eemalda · Remove” in the same column and confirm with “Kinnitan eemaldamise · Confirm removal”. The next night your name and this month's results are deleted and the names below move up. In finished months the numbers stay under the name “Endine osaleja” (former member). Until that night you can still pick “Osalen · In”; after that it can't be undone.\",\"Kui lõpetad päriselt, vali samas tulbas „Eemalda“ ja kinnituseks „Kinnitan eemaldamise“. Järgmisel ööl kustuvad sinu nimi ja käimasoleva kuu tulemused ning järgmised nimed nihkuvad ülespoole. Lõppenud kuudes jäävad numbrid alles nime „Endine osaleja“ all. Kuni ööni saad veel „Osalen“ valida, hiljem seda tagasi võtta ei saa.\")",
null
],
[
"Reeglid | Rules",
"=IF('Juhend | Guide'!$C$3=\"English\",\"It's easier together. Find a teammate or two and make a team (2–3 people). Each of you types the same team name in the TEAM column next to your name, for example “Bears”.\",\"Koos on lihtsam. Leia tiimikaaslane või suisa kaks ja looge tiim (2–3 inimest). Kirjutage kõik kuu vahekaardil oma nime taha veergu TIIM sama tiimi nimi, näiteks „Karud“.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"It's easier together. Find a teammate or two and make a team (2–3 people). Each of you types the same team name in the TEAM column next to your name, for example “Bears”.\",\"Koos on lihtsam. Leia tiimikaaslane või suisa kaks ja looge tiim (2–3 inimest). Kirjutage kõik kuu vahekaardil oma nime taha tulpa TIIM sama tiimi nimi, näiteks „Karud“.\")",
null
],
[
"Reeglid | Rules",
"=IF('Juhend | Guide'!$C$3=\"English\",\"No team? Type LOOKING in the TEAM column. Everyone looking is shown on the Board.\",\"Tiimikaaslast pole? Kirjuta veergu TIIM sõna OTSIN. Kõik otsijad on näha vahekaardil „Ülevaade“.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"No team? Type LOOKING in the TEAM column. Everyone looking is shown on the Board.\",\"Tiimikaaslast pole? Kirjuta tulpa TIIM sõna OTSIN. Kõik otsijad on näha vahekaardil „Ülevaade“.\")",
null
]
],
"roster_a2_rule": "COUNTIF($C$4:$C$103,\"Eemalda · Remove\")>0",
"status": [
"Osalen · In",
"Paus · Pause",
"Eemalda · Remove",
"Kinnitan eemaldamise · Confirm removal"
],
"status_help": "Paus = järgmisel kuul ei osale. Osalen = olen tagasi. Eemalda = kustutab nime ja tulemused, kinnita siis „Kinnitan eemaldamise“. / Paus = skip next month. Osalen = I'm back. Eemalda = deletes name and results, then confirm.",
"name_help": "Kirjuta oma nimi esimesse vabasse ritta. Sama nime ei saa kaks korda kirjutada, siis lisa initsiaal, näiteks Mari K. / Type your name in the first empty row. A name can't be used twice, so add an initial, e.g. Mari K.",
"first_rule": "AND($B4=\"\",$B3<>\"\")",
"remove_rule": "OR($C4=\"Eemalda · Remove\",$C4=\"Kinnitan eemaldamise · Confirm removal\")",
"day_rule": "AND($A5<>\"\",D$2<=$AW$3,$AW$2+D$2-1<=TODAY(),OR(AND(ISNUMBER(D5),D5>=0,D5<1000,OR(ISERROR(SEARCH(\"plank\",$AW$8&$AW$9)),AND(N(D5)>0,N(D5)<1),AND(N(D5)>=60,MOD(N(D5),30)=0))),AND(UPPER(TRIM(D5))=\"J\",SUMPRODUCT(--(UPPER(TRIM($D5:$AH5))=\"J\"))<=2),UPPER(TRIM(D5))=\"H\",AND(UPPER(TRIM(D5))=\"X\",$AW$2+D$2-1<MAX(N(INDIRECT(\"'Nimekiri | Roster'!D\"&(ROW()-1))),$AW$21))))",
"day_help": "Kirjuta oma reale tänasesse või eilsesse lahtrisse: number, J (kuni 2 kuus) või H. / Use your row, today's or yesterday's cell: a number, J (max 2 a month) or H.",
"level_help": "Vali ja muuda esimese 7 päeva jooksul, siis on tase kuu lõpuni lukus. Kui ei vali, oled Põhi. / Pick or change it in your first 7 days, then it's locked until the month ends. No pick means Base.",
"board_rows": [
19,
121
],
"plan": {},
"rules": [
[
[
"1. Mis see on?",
"1. What is this?"
],
[
[
"1.1",
"Kuu harjutus on meie kalisteenikagrupi (Algajad ja Kalisteenika grupp) kodune väljakutse. Igal kuul on üks harjutus: teed seda kodus iga päev natuke ja paned tulemuse ühisesse tabelisse kirja.",
"The monthly challenge is our calisthenics group's (Algajad ja Kalisteenika grupp) home challenge. Each month has one exercise: do a little of it at home every day and log it in the shared sheet."
],
[
"1.2",
"Peamine eesmärk on järjepidevus, mitte maksimaalne sooritus. Algajal ja tugevaimal on täpselt sama suur võimalus kuu läbida ja auhind võita.",
"The main goal is consistency, not maximum performance. A beginner and the strongest athlete have exactly the same chance to finish the month and win a prize."
],
[
"1.3",
"Esimene kuu on oktoober 2026 ja teeme kätekõverdusi.",
"The first month is October 2026 and we do push-ups."
],
[
"1.4",
"Kaasa võivad teha kõik grupi liikmed, ka need, kes saali ei jõua. Kirjuta oma nimi tabeli vahekaardile „Nimekiri“ või anna korraldajale teada. Tabeli link on WhatsAppi grupi kirjelduses.",
"Every group member can join, including those who can't make it to the studio. Add your name on the “Nimekiri | Roster” tab or tell the organiser. The sheet link is in the WhatsApp group description."
]
]
],
[
[
"2. Harjutus ja tase",
"2. Exercise and level"
],
[
[
"2.1",
"Uue kuu harjutusest anname WhatsAppis teada eelmise kuu 20. kuupäeval. Samal päeval tuleb tabelisse uue kuu vahekaart: seal saad kohe valida taseme, tulemusi saad kirjutada alates 1. kuupäevast.",
"We announce the next exercise in WhatsApp on the 20th of the month before. The new month tab appears in the sheet the same day: you can pick your level right away and log results from the 1st."
],
[
"2.2",
"Vali endale sobiv tase kuu vahekaardi tulbas TASE.",
"Pick the level that suits you in the LEVEL column of the month tab."
],
[
"",
"Algaja: kui alles alustad, teed sama arvu kordusi lihtsamas variandis. Näiteks oktoobris on see 30 kätekõverdust põlvedelt või kätega laua najal.",
"Starter: just starting? Same number of reps, easier version. For example, in October 30 push-ups on your knees or hands on a table."
],
[
"",
"Põhi: sobib enamikule. Näiteks oktoobris on see 30 kätekõverdust.",
"Base: suits most people. For example, in October 30 push-ups."
],
[
"",
"Pluss: vali see, kui oled juba tugevam. Näiteks oktoobris on see 50 kätekõverdust.",
"Plus: pick this if you're stronger. For example, in October 50 push-ups."
],
[
"",
"Tipp: vali see, kui tahad endale suurt väljakutset. Näiteks oktoobris on see 100 kätekõverdust.",
"Beast: pick this if you want a big challenge. For example, in October 100 push-ups."
],
[
"2.3",
"Kõiki tasemeid loeme võrdsena. Taset saad valida ja muuta esimese 7 päeva jooksul kuu algusest või oma liitumisest. Seejärel on tase kuu lõpuni lukus. Kui tunned, et jaksad rohkem, vali järgmisel kuul raskem tase.",
"All levels count the same. You can pick and change your level during the first 7 days from the start of the month or from when you joined. Then it's locked until the month ends. If you feel you can do more, pick a harder level next month."
],
[
"2.4",
"Kordused võid teha korraga või mitmes jaos, arvesse läheb päeva kogusumma. Plangu ja teiste hoidmiste puhul liida sekundid kokku, ühe jala harjutuste puhul mõlema jala kordused (20 + 20 = 40).",
"Do your reps at once or in several sets, the day's total counts. For planks and other holds add up the seconds, for single-leg exercises add both legs (20 + 20 = 40)."
],
[
"2.5",
"Arvesse lähevad ainult korralikult tehtud kordused. Õige tehnika õpetame selgeks kuu esimeses trennis.",
"Only clean reps count. We teach the technique at the first training of the month."
],
[
"2.6",
"Kuu harjutus on mõeldud igapäevase rutiini ehitamiseks ja seetõttu kõik harjutused mis me teeme ühiselt trennis arvesse ei lähe.",
"The monthly challenge is meant for building a daily routine, so any exercises we do together at training do not count."
]
]
],
[
[
"3. Kirja panemine",
"3. Logging"
],
[
[
"3.1",
"Kirjuta iga päev oma reale tänase kuupäeva lahtrisse number (mitu kordust või sekundit tegid), J (jokker ehk vaba päev, neid on kuus 2) või H (haige või vigastatud; pohmell siia ei loe, et sa teaks). Telefonis kasuta Google Sheetsi rakendust ja logi sisse, sest telefoni brauseris tabelisse kirjutada ei saa.",
"Every day type in today's cell on your row: a number (reps or seconds), J (joker, a free day, 2 a month) or H (sick or injured; a hangover doesn't count, just so you know). On a phone, use the Google Sheets app and sign in, because a phone browser can't edit the sheet."
],
[
"3.2",
"Tühi lahter tähendab, et päev jäi vahele. Päevadele enne sinu liitumist paneb tabel ise X-i.",
"An empty cell means a missed day. The sheet puts X on days before you joined."
],
[
"3.3",
"Tegid vähem kui eesmärk? Kirjuta ikka. Iga kodus tehtud kordus läheb ühisesse korduste summasse, mille nimel ka võistleme.",
"Did fewer than your target? Log it anyway. Every rep you do at home goes into the group total we compete for."
],
[
"3.4",
"Kirjuta ainult oma reale ja ainult seda, mida ise tegid. Kui telefon on tühi või oled maal netivaakumis, võid paluda tiimikaaslasel enda eest kirja panna.",
"Only log on your own row and only what you did yourself. If your phone is dead or you're somewhere without internet, you can ask a teammate to log it for you."
]
]
],
[
[
"4. Kui päev jääb vahele",
"4. Missed a day"
],
[
[
"4.1",
"Pole hullu. Eilse päeva saad täna järele teha: tee mõlema päeva kordused ja pane mõlemad kirja. Vanemaid päevi tabel muuta ei lase.",
"No problem. You can make up yesterday today: do both days' reps and log both. The sheet won't let you change older days."
],
[
"4.2",
"Kuus on kasutada 2 jokkerit (siin on pohmell lubatud). Kirjuta J ja loeme päeva tehtuks.",
"You have 2 jokers a month (a hangover is fine here). Type J and the day counts as done."
],
[
"4.3",
"Haige või lihased valutavad? Ära tee trenni, vaid kirjuta H. Need päevad sinu tulemust ei vähenda.",
"Sick or your muscles hurt? Don't train, type H. Those days don't lower your result."
]
]
],
[
[
"5. Kuu lõpp, embleemid ja loos",
"5. Month end, badges and raffle"
],
[
[
"5.1",
"Päev on tehtud, kui jõuad oma taseme eesmärgini. Siis muutub lahter roheliseks.",
"A day is done when you reach your level's target. The cell turns green."
],
[
"5.2",
"Kuu on läbitud, kui oled teinud vähemalt 80% päevadest. Oma protsenti näed kuu vahekaardi tulbas TULEMUS. Jokkeriga päev loeb tehtuks, H- ja X-päevi ei arvestata. Embleemi saamiseks peab sul kuus olema vähemalt 10 arvestatud päeva.",
"You finish the month if you completed at least 80% of your days. See your % in the COMPLETION column. Joker days count as done, H and X days are left out. To get a badge you need at least 10 counted days in the month."
],
[
"5.3",
"Kuu lõpus annab Üksus sulle embleemi: Läbitud (vähemalt 80%), Raudne (100%, jokkerid on lubatud) või Täiuslik (iga päev tehtud, ilma jokkeri ja H-ta). Lisaks on kaks eriembleemi:",
"At month end you get a badge from Üksus: Finisher (at least 80%), Iron (100%, jokers allowed) or Perfect (every day, no joker or H). There are also two special badges:"
],
[
"",
"🔁 Tagasitulek: sul jäi vahele 3 või rohkem päeva järjest, aga tulid tagasi ja läbisid kuu ikkagi (vähemalt 80%). See embleem tunnustab, et vahepealne paus ei lõpetanud sinu kuud.",
"🔁 Comeback: you missed 3 or more days in a row, but came back and still finished the month (at least 80%). It celebrates not letting a break end your month."
],
[
"",
"💥 Mahukuningas: selle saab see, kes tegi kuu jooksul oma päevasest eesmärgist protsentides kõige rohkem üle. Näiteks kui su eesmärk on 30 ja teed 45, on see päev 50% üle eesmärgi. Kuu jooksul need protsendid liituvad. Nii ei mängi tase rolli. Igal kuul saab selle embleemi üks inimene.",
"💥 Volume champ: whoever went the most percent over their own daily target during the month. For example, with a target of 30, doing 45 is 50% over target that day. The percentages add up over the month, so your level doesn't matter. One person gets it each month."
],
[
"5.4",
"Kõik embleemid ilmuvad ise vahekaardile „Autahvel“.",
"All badges appear on the “Autahvel | Fame” tab automatically."
],
[
"5.5",
"Iga trennipäeva eest, mil jõuad oma eesmärgini, saad 1 loosipileti. Jokkeri ja haiguspäeva eest piletit ei saa, aga kuu protsenti need ei vähenda. Lisapileteid saad topeltpäeval (7.3) ja tiimiga (8.4). Oma pileteid näed kuu vahekaardi tulbas PILETID. Mida rohkem pileteid, seda suurem on võimalus auhind võita. Loosis loeb ainult piletite arv, sinu tase võiduvõimalust ei mõjuta. Korraldaja loosib auhinnad välja uue kuu esimeses trennis, kui kõik kuu piletid on koos. Loosis on kõik, kellel on vähemalt üks pilet, korraldaja ise loosis ei osale. Auhinna väärtus võiduvõimalust ei mõjuta, sest kes võidab, saab auhinna juhuslikult. Üks inimene saab kuus võita ühe auhinna. Võitjad ilmuvad vahekaardile „Ülevaade“ graafiku alla ja vahekaardile „Autahvel“.",
"For every day you reach your target you get 1 raffle ticket. Joker and sick days give no ticket, but they don't lower your monthly %. You get extra tickets on a double day (7.3) and with your team (8.4). See your tickets in the TICKETS column. The more tickets, the better your chance to win. Only the number of tickets counts, your level doesn't change your chance. The organiser draws the prizes at the first training of the new month, when all of the month's tickets are in. Everyone with at least one ticket is in the draw, the organiser isn't. The prize's value doesn't change your chance: each winner gets a random prize. One prize per person per month. Winners appear under the chart on the “Ülevaade | Board” tab and on the “Autahvel | Fame” tab."
],
[
"5.6",
"Kuu viimase päeva saad kirja panna veel järgmise kuu 1. kuupäeval. Seejärel vahekaart lukustub ja uus kuu algab kohe.",
"You can still log the last day on the 1st of the next month. Then the tab locks and the new month starts right away."
]
]
],
[
[
"6. Liitumine ja paus",
"6. Joining and pausing"
],
[
[
"6.1",
"Liituda saab ka kuu keskel: kirjuta oma nimi vahekaardile „Nimekiri“. Varasematele päevadele tuleb ise X ja neid ei arvestata.",
"You can join mid-month: add your name on the “Nimekiri | Roster” tab. Earlier days get X automatically and don't count."
],
[
"6.2",
"Näiteks 8. oktoobril liitudes arvestatakse 24 päeva. Kui neist 20 on tehtud, on tulemus 83% ja kuu on läbitud.",
"For example, joining on 8 October counts 24 days. With 20 of them done you're at 83% and have finished the month."
],
[
"6.3",
"Kui sa järgmisel kuul kaasa ei tee, vali vahekaardil „Nimekiri“ oma nime kõrval tulbas JÄRGMISEL KUUL „Paus“. Käimasoleva kuu teed lõpuni nagu tavaliselt, uuel kuul sinu rida ei ilmu ja uue kuu alguses liigub su nimi nimekirja lõppu. Tagasi tulles vali samas kohas „Osalen“ ja sinu rida ilmub kohe tagasi. Oma nime ära kustuta.",
"Skipping next month? On the “Nimekiri | Roster” tab pick “Paus · Pause” in the NEXT MONTH column next to your name. You finish the current month as usual, your row won't appear on the new month and your name moves to the end of the list when the new month starts. When you're back, pick “Osalen · In” there and your row comes right back. Don't delete your name."
],
[
"6.4",
"Kui lõpetad päriselt, vali samas tulbas „Eemalda“ ja kinnituseks „Kinnitan eemaldamise“. Järgmisel ööl kustuvad sinu nimi ja käimasoleva kuu tulemused ning järgmised nimed nihkuvad ülespoole. Lõppenud kuudes jäävad numbrid alles nime „Endine osaleja“ all. Kuni ööni saad veel „Osalen“ valida, hiljem seda tagasi võtta ei saa.",
"If you're leaving for good, pick “Eemalda · Remove” in the same column and confirm with “Kinnitan eemaldamise · Confirm removal”. The next night your name and this month's results are deleted and the names below move up. In finished months the numbers stay under the name “Endine osaleja” (former member). Until that night you can still pick “Osalen · In”; after that it can't be undone."
],
[
"6.5",
"Kui sa ei ole kuu viimase 7 päeva jooksul midagi kirja pannud (ei numbrit, J-d ega H-d), alustad uut kuud pausil: skript paneb su 2. kuupäeva öösel nimekirjas pausile ja uue kuu rida kaob. Nii ei jää lahkunud inimesed ühisesse eesmärki ega protsentidesse. Kui sa pole terve kuu jooksul ühtegi korda kirjutanud, jääd pausita (võib-olla alustasid poole pealt). Samamoodi jääd alles, kui oled uuel kuul juba midagi kirja pannud või liitusid alles viimase 7 päeva jooksul. Tagasi tulles vali nimekirjas oma nime kõrval „Osalen“.",
"If you haven't logged anything (no number, J or H) in the last 7 days of the month, you start the new month paused: on the night of the 2nd the script puts you on pause on the roster and your row on the new month disappears. This way people who have left don't stay in the group goal and percentages. If you didn't log anything at all during the month, you are not paused (maybe you started halfway). You also stay in if you've already logged something in the new month or joined within the last 7 days of the month. When you're back, pick “Osalen · In” next to your name on the roster."
]
]
],
[
[
"7. Ühine eesmärk ja topeltpäev",
"7. Group goal and double day"
],
[
[
"7.1",
"Kõigi kordused lähevad ühte potti. Ühine eesmärk on kõigi 1. kuupäevaks nimekirjas olevate inimeste päevaeesmärkide summa terve kuu peale. Iga inimese päevaeesmärk sõltub tema tasemest (kui taset pole valitud, arvestame põhitaset). Näiteks kui 8 inimese päevaeesmärgid on kokku 420 kordust, on ühine eesmärk 420 × 31 päeva = 13 020 kordust. Hiljem liitujad aitavad meil sinna kiiremini jõuda. Seisu näed vahekaardil „Ülevaade“.",
"Everyone's reps go into one pot. The group goal is the sum of the daily targets of everyone on the roster on the 1st, for the whole month. Each person's daily target depends on their level (if no level is picked, we count Base). For example, if 8 people's daily targets add up to 420 reps, the group goal is 420 × 31 days = 13,020 reps. Later joiners help us get there faster. See progress on the “Ülevaade | Board” tab."
],
[
"7.2",
"Kui jõuame eesmärgini, tähistame seda koos grupipildi või mõne muu laheda tegevusega!",
"When we reach the goal, we celebrate with a group photo or something fun!"
],
[
"7.3",
"Vahel teeme topeltpäeva: korraldaja märgib trennipäeva kohale 2x. Kes teeb sel päeval oma eesmärgi kaks korda, saab lisapileti. Päev loeb tehtuks ka tavalise eesmärgiga.",
"Sometimes we have a double day: the organiser marks a training day with 2x. Do double your target that day and you get an extra ticket. Your normal target still counts as done."
]
]
],
[
[
"8. Tiimid",
"8. Teams"
],
[
[
"8.1",
"Koos on lihtsam. Leia tiimikaaslane või suisa kaks ja looge tiim (2–3 inimest). Kirjutage kõik kuu vahekaardil oma nime taha tulpa TIIM sama tiimi nimi, näiteks „Karud“.",
"It's easier together. Find a teammate or two and make a team (2–3 people). Each of you types the same team name in the TEAM column next to your name, for example “Bears”."
],
[
"8.2",
"Tiimikaaslast pole? Kirjuta tulpa TIIM sõna OTSIN. Kõik otsijad on näha vahekaardil „Ülevaade“.",
"No team? Type LOOKING in the TEAM column. Everyone looking is shown on the Board."
],
[
"8.3",
"Tiimikaaslased utsitavad üksteist. Kui tiimikaaslase lahter on õhtul veel tühi, saada talle sõnum „Kas täna juba tehtud?“. Suures grupis me kedagi nimeliselt välja ei too.",
"Teammates nudge each other. If a teammate's cell is still empty in the evening, message them: “Done today?”. Never call anyone out in the big group."
],
[
"8.4",
"Kui tiimi kõik liikmed teevad kuu 100% täis, saab iga tiimiliige 4 lisapiletit. Jokkerid (kuni 2) ja haiguspäevad ei võta tiimi lisapileteid ära, nii et igaüks võib kaks päeva Jokkeriga vahele jätta. Kui keegi tiimist jääb alla 100%, ei saa neid lisapileteid keegi. Lisapiletid tulevad tulpa PILETID kuu lõpus, kui tulemus on selge. Lisapiletid käivad 2- ja 3-liikmelisele tiimile.",
"If every team member completes the month at 100%, each of them gets 4 extra tickets. Jokers (up to 2) and sick days don't take the team tickets away, so everyone can skip two days with a Joker. If anyone in the team stays below 100%, nobody gets these extra tickets. The extra tickets appear in the TICKETS column when the month ends. The extra tickets are for teams of 2 or 3."
],
[
"8.5",
"Tiim kehtib ühe kuu. Tiimi saad kirja panna ja muuta esimese 7 päeva jooksul kuu algusest või oma liitumisest, siis on see kuu lõpuni lukus. Nii ei saa keegi kuu lõpus lisapiletite pärast kiiresti tiimi teha. Tiimis olemine ei ole kohustuslik.",
"A team lasts one month. You can set or change your team in your first 7 days from the start of the month or from when you joined, then it's locked until the month ends. That way nobody can form a team at the end of the month just for the extra tickets. Being in a team is optional."
]
]
],
[
[
"9. WhatsApp ja ausus",
"9. WhatsApp and honesty"
],
[
[
"9.1",
"WhatsAppi saadame 20. kuupäeval uue harjutuse, 1. kuupäeval stardi, pühapäeviti nädala seisu ja 3. kuupäeval tulemused. Kuu lõpus küsime ka, kas kuu oli liiga kerge, paras või liiga raske.",
"In WhatsApp: the new exercise on the 20th, the start on the 1st, a weekly update on Sundays and results on the 3rd. At month end we also ask whether the month was too easy, just right or too hard."
],
[
"9.2",
"Iga päev „tehtud“ kirjutama ei pea, aga pildid ja kaasaelamine on alati oodatud.",
"No need to post “done” every day, but photos and cheering are always welcome."
],
[
"9.3",
"Kõik põhineb ausal sõnal ja tõendeid me ei küsi.",
"Everything runs on the honour system. No proof needed."
],
[
"9.4",
"Kasuta tabelis eesnime või hüüdnime, sest lingi kaudu näevad tabelit kõik.",
"Use first names or nicknames in the sheet, because anyone with the link can see it."
],
[
"9.5",
"Reegleid võime muuta. Muudatustest anname teada enne uue kuu algust.",
"The rules may change. We announce changes before the new month starts."
]
]
]
],
"palette": {
"15202B": "2B241E",
"2B55E6": "8B6B47",
"E6ECFF": "F2E8DA",
"C9D5FA": "E3D3BC",
"1E3A8A": "5C4630",
"F1F4F8": "F6F1EA",
"F7F8FA": "FBF8F3",
"E4E8EE": "ECE5DC",
"EEF0F3": "F2EDE6",
"5B6673": "6E655B",
"C9D1DC": "D9CEC0",
"9AA3AE": "A59B8F",
"8A94A0": "978C80",
"A6AEB8": "B0A698",
"DCE1E8": "E6DED3"
}
};
var EHITUS = '58583f2ce1a8';
var KH_XLSX = [
  "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"
];
// ================================================================ SKRIPTI LÕPP (kui see rida on olemas, on kogu skript kleebitud)
