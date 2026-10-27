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
var POSTID = '2';                                    // postituste (uus harjutus, nädala seis) valemite versioon; muutub, kui nende tekst muutub
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
var POSTS = ['Uus harjutus', 'Start', 'Nädala seis', 'Tulemused'];
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
    var on = plan.getRange(POST0, 2, 4, 1), onV = on.getValues();
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
  ScriptApp.newTrigger('kuuHarjutusVersioon').timeBased().everyMinutes(15).create();      // uuendaja toodud uus kood seadistab end ise
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
  var rows = plan.getRange(POST0, 1, 4, 12).getValues(), to = saaja_(plan), saadetud = [], vahele = [];
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
    var rows = plan.getRange(POST0, 1, 4, 12).getValues();
    var paev = new Date(Date.UTC(d[0], d[1] - 1, d[2])).getUTCDay();   // 0 = pühapäev
    var todo = [];
    if (d[2] >= 20 && kuuLeht_(pub, nx[0], nx[1])) todo.push([0, 'uus:' + nx[0] + '-' + nx[1]]);
    if (d[2] <= 2 && kuuLeht_(pub, d[0], d[1])) todo.push([1, 'start:' + d[0] + '-' + d[1]]);
    if (paev === 0 && d[2] > 2 && kuuLeht_(pub, d[0], d[1])) todo.push([2, 'nadal:' + t]);
    if (d[2] >= 3 && d[2] <= 5 && kuuLeht_(pub, pv[0], pv[1])) todo.push([3, 'tulemused:' + pv[0] + '-' + pv[1]]);
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
}

// kaib: kuu käib alles, siis loeb tempo (TÄITMINE), ka enne 10 arvestatud päeva (Erik 4.10: nädalakirjas oli 0 inimest 100% peal).
function kuuNumbrid_(sh, kaib) {
  var o = { kokku: 0, eesmark: 0, inimesi: 0, p80: 0, p100: 0, nimed100: [], kuningas: '', tagasi: [] };
  if (!sh) return o;
  o.eesmark = Number(sh.getRange(16, AW).getValue()) || 0;
  var parim = 0;
  sh.getRange(R0, 1, N, 47).getValues().forEach(function (r) {      // A … AU
    var nimi = str_(r[0]);
    if (!nimi) return;
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
    tekst = a1 === C_LOOS ? loosi_(arv_(sh)).tekst : a1 === C_KUU ? looKuuKohe_().tekst : saadaProov_(sh).tekst;
  } catch (err) { tekst = 'Ei õnnestunud: ' + (err && err.message ? err.message : err); }
  sh.getRange(nupp[a1]).setValue(txt_(tekst));
  e.range.setValue(false);
}

// Menüüst: sama loos, tulemus aknas.
function loosiMenuust() {
  var plan = plaan_(), r = loosi_(arv_(plan));
  if (plan) plan.getRange(C_LOOS_TULEMUS).setValue(r.tekst);
  SpreadsheetApp.getUi().alert('Loos', r.tekst, SpreadsheetApp.getUi().ButtonSet.OK);
}

// Uue kuu esimeses trennis: loosib lõppenud (eelmise) kuu piletite järgi.
// Loosib arv erinevat võitjat (arv plaani lahtrist C32). Kes on selle kuu loosis juba võitnud, uuesti ei võida.
// Võitjad lähevad Autahvli veergu LOOSIVÕITJAD.
function arv_(plan) {
  var n = plan ? Math.floor(Number(plan.getRange(C_LOOS_ARV).getValue())) : 0;
  return n >= 1 && n <= 10 ? n : 3;
}

function loosi_(arv) {
  arv = arv || 1;
  var pub = avalik_();
  if (!pub) return { tekst: 'Ühist tabelit veel pole. Vali „Kuu harjutus → Seadista“.' };
  KUUD_ = null;
  var t = tana_(), d = ymd_(t), k = eelmine_(d[0], d[1]);
  var m = kuuLeht_(pub, k[0], k[1]);
  if (!m) return { tekst: 'Eelmise kuu (' + ET_M[k[1] - 1].toLowerCase() + ') vahekaarti pole, loosida pole kelle vahel.' };
  var kn = ymd_(m.start)[1] - 1, kuu = ET_M[kn].toLowerCase(), kuus = ET_G[kn] + 's';
  var f = pub.getSheetByName(T_FAME), rida = -1, varem = [];
  if (f) {
    var a = f.getRange(FAME0, 1, FAMEN, 1).getValues();
    for (var i = 0; i < FAMEN; i++) if (String(a[i][0]) === m.name) { rida = FAME0 + i; break; }
    if (rida > 0) varem = str_(f.getRange(rida, FAME_WIN).getValue()).split(/\s*[,\n]\s*/).filter(String);
  }
  var nimed = m.sh.getRange(R0, 1, N, 1).getValues(), pil = m.sh.getRange(R0, PILETID, N, 1).getValues();
  var loos = [], kokku = 0;
  nimed.forEach(function (r, i) {
    var nimi = str_(r[0]), p = Math.floor(Number(pil[i][0]) || 0);
    if (!nimi || p <= 0 || varem.indexOf(nimi) >= 0) return;
    loos.push([nimi, p]); kokku += p;
  });
  if (!kokku) return { tekst: 'Loosis pole kedagi: ' + kuus + ' pole veel ühtegi piletit' + (varem.length ? ' (varem võitsid ' + varem.join(', ') + ')' : '') + '.' };
  var voitjad = [];
  while (voitjad.length < arv && loos.length) {
    var x = Math.floor(Math.random() * kokku), v = loos.length - 1;
    for (var j = 0; j < loos.length; j++) { if (x < loos[j][1]) { v = j; break; } x -= loos[j][1]; }
    voitjad.push(loos[v]); kokku -= loos[v][1]; loos.splice(v, 1);
  }
  if (rida > 0) { f.getRange(rida, FAME_WIN).setValue(varem.concat(voitjad.map(function (w) { return w[0]; })).join('\n')); autahvliKorgus_(f); }
  var aeg = Utilities.formatDate(new Date(), TZ, 'd.MM HH:mm');
  var loetelu = voitjad.map(function (w, i) { return (i + 1) + '. ' + w[0] + ' (' + w[1] + ' piletit)'; }).join(', ');
  return { nimi: voitjad[0][0], nimed: voitjad.map(function (w) { return w[0]; }), tekst: '🎉 ' + (voitjad.length > 1 ? 'Võitjad: ' : 'Võitja: ') + loetelu + ' · ' + kuu + ', ' + aeg + '. ' +
    (voitjad.length < arv ? 'Piletiga osalejaid oli ainult ' + voitjad.length + ', seega rohkem võitjaid polnud. ' : '') + 'Kirjutasin Autahvlile.' };
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
    var n = Number(vana.getRange(C_LOOS_ARV).getValue());
    if (n >= 1 && n <= 10) plan.getRange(C_LOOS_ARV).setValue(n);
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
    [POST0, POST0 + 2].forEach(function (rida) {
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
"=IF('Juhend | Guide'!$C$3=\"English\",\"For every day you reach your target you get 1 raffle ticket. Joker and sick days give no ticket, but they don't lower your monthly %. You get extra tickets on a double day (7.3) and with your team (8.4). See your tickets in the TICKETS column. The more tickets, the better your chance to win. Only the number of tickets counts, your level doesn't change your chance. The organiser draws the winners at the first training of the new month, when all of the month's tickets are in. One prize per person per month. Winners appear on the “Autahvel | Fame” tab.\",\"Iga trennipäeva eest, mil jõuad oma eesmärgini, saad 1 loosipileti. Jokkeri ja haiguspäeva eest piletit ei saa, aga kuu protsenti need ei vähenda. Lisapileteid saad topeltpäeval (7.3) ja tiimiga (8.4). Oma pileteid näed kuu vahekaardi veerus PILETID. Mida rohkem pileteid, seda suurem on võimalus auhind võita. Loosis loeb ainult piletite arv, sinu tase võiduvõimalust ei mõjuta. Korraldaja loosib võitjad uue kuu esimeses trennis, kui kõik kuu piletid on koos. Üks inimene saab kuus võita ühe auhinna. Võitjad ilmuvad vahekaardile „Autahvel“.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"For every day you reach your target you get 1 raffle ticket. Joker and sick days give no ticket, but they don't lower your monthly %. You get extra tickets on a double day (7.3) and with your team (8.4). See your tickets in the TICKETS column. The more tickets, the better your chance to win. Only the number of tickets counts, your level doesn't change your chance. The organiser draws the winners at the first training of the new month, when all of the month's tickets are in. One prize per person per month. Winners appear on the “Autahvel | Fame” tab.\",\"Iga trennipäeva eest, mil jõuad oma eesmärgini, saad 1 loosipileti. Jokkeri ja haiguspäeva eest piletit ei saa, aga kuu protsenti need ei vähenda. Lisapileteid saad topeltpäeval (7.3) ja tiimiga (8.4). Oma pileteid näed kuu vahekaardi tulbas PILETID. Mida rohkem pileteid, seda suurem on võimalus auhind võita. Loosis loeb ainult piletite arv, sinu tase võiduvõimalust ei mõjuta. Korraldaja loosib võitjad uue kuu esimeses trennis, kui kõik kuu piletid on koos. Üks inimene saab kuus võita ühe auhinna. Võitjad ilmuvad vahekaardile „Autahvel“.\")",
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
"day_rule": "AND($A5<>\"\",D$2<=$AW$3,$AW$2+D$2-1<=TODAY(),OR(AND(ISNUMBER(D5),D5>=0,D5<1000,OR(ISERROR(SEARCH(\"plank\",$AW$8&$AW$9)),AND(D5>0,D5<1),AND(D5>=60,MOD(D5,30)=0))),AND(UPPER(TRIM(D5))=\"J\",SUMPRODUCT(--(UPPER(TRIM($D5:$AH5))=\"J\"))<=2),UPPER(TRIM(D5))=\"H\",AND(UPPER(TRIM(D5))=\"X\",$AW$2+D$2-1<MAX(N(INDIRECT(\"'Nimekiri | Roster'!D\"&(ROW()-1))),$AW$21))))",
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
"Iga trennipäeva eest, mil jõuad oma eesmärgini, saad 1 loosipileti. Jokkeri ja haiguspäeva eest piletit ei saa, aga kuu protsenti need ei vähenda. Lisapileteid saad topeltpäeval (7.3) ja tiimiga (8.4). Oma pileteid näed kuu vahekaardi tulbas PILETID. Mida rohkem pileteid, seda suurem on võimalus auhind võita. Loosis loeb ainult piletite arv, sinu tase võiduvõimalust ei mõjuta. Korraldaja loosib võitjad uue kuu esimeses trennis, kui kõik kuu piletid on koos. Üks inimene saab kuus võita ühe auhinna. Võitjad ilmuvad vahekaardile „Autahvel“.",
"For every day you reach your target you get 1 raffle ticket. Joker and sick days give no ticket, but they don't lower your monthly %. You get extra tickets on a double day (7.3) and with your team (8.4). See your tickets in the TICKETS column. The more tickets, the better your chance to win. Only the number of tickets counts, your level doesn't change your chance. The organiser draws the winners at the first training of the new month, when all of the month's tickets are in. One prize per person per month. Winners appear on the “Autahvel | Fame” tab."
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
var EHITUS = 'b2376587b733';
var KH_XLSX = [
  "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",
  "BgAA4QwBAAAA"
];
// ================================================================ SKRIPTI LÕPP (kui see rida on olemas, on kogu skript kleebitud)
