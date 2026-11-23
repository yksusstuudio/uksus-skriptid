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
var POSTID = '5';                                    // postituste (uus harjutus, nädala seis) valemite versioon; muutub, kui nende tekst muutub
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
var MINU_PAASTIKUD = ['kuuHarjutusMenuu', 'kuuHarjutusOine', 'kuuHarjutusHommik', 'kuuHarjutusMuudatus', 'kuuHarjutusPlaan', 'kuuHarjutusYlevaade', 'kuuHarjutusNimekiri', 'kuuHarjutusKloon', 'kuuHarjutusVersioon', 'oine', 'hommik', 'muudatus'];

// Ühekordne seadistus. Võib käivitada ka mitu korda: olemasolevat ühist tabelit ta uuesti ei tee.
// Google peatab skripti 6 minuti pärast. Kui aega jääb väheks, jätab Seadista järgmise grupi tabeli uuenduse ja öise
// kontrolli pooleli. Järgmine Seadista jätkab sealt: selle koodiga (EHITUS) juba uuendatud tabeleid ta enam ei uuenda.
var AJAPIIR = 150000, HOOLDUSE_PIIR = 240000, SEADISTA_ALGUS = 0, JATKA = false;
function aegaOn_(piir) { return Date.now() - SEADISTA_ALGUS < piir; }
var POOLELI = 'Seadista jättis ajapuudusel osa tööd tegemata (Google lubab ühe käivituse jaoks 6 minutit). Skript teeb ülejäänu ise minuti pärast, sul pole vaja midagi teha.';

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

  paastikud_(priv, [pub].concat(teised.map(function (x) { return x.pub; })).map(function (p) { return p.getId(); }));
  try { menuu(); } catch (err) {}

  var pooleli = teised.some(function (x) { return x.pooleli; });
  if (!pooleli && aegaOn_(HOOLDUSE_PIIR)) {
    try { hooldus_(); } catch (err) { viga += (viga ? ' ' : '') + String(err && err.message ? err.message : err); }
  } else pooleli = true;
  if (pooleli) {
    viga = POOLELI + (viga ? ' ' + viga : ''); props.setProperty('SEADISTA_JATKA', EHITUS);
    // Erik 2.11: „et ta ise käivituks mitu korda järjest“. Käsitsi Seadista jätkab ise minuti pärast (sama nagu uue koodi järel).
    if (!AUTO_JOOKS) try {
      var sp = PropertiesService.getScriptProperties();
      sp.setProperty('AUTO_OOTEL', EHITUS); sp.setProperty('AUTO_KORD', '0'); autoJargmine_(60 * 1000);
    } catch (err) {}
  }
  else { props.deleteProperty('SEADISTA_JATKA'); PropertiesService.getScriptProperties().setProperty('SEADISTATUD', EHITUS); }

  var url = pub.getUrl();
  var html = '<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#2B241E">' +
    (pooleli ? '<p style="font-size:16px;color:#B00020"><b>Peaaegu valmis.</b> Skript teeb ülejäänu ise minuti pärast, sul pole vaja midagi teha.</p>'
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
  try { if (e.source) PropertiesService.getScriptProperties().setProperty('MUUDATUS_AEG:' + e.source.getId(), String(Date.now())); } catch (err) {}
  var g = e.source ? PropertiesService.getScriptProperties().getProperty('GRUPP:' + e.source.getId()) : null;
  // Erik 4.11: Eriku tulemus ei jõudnud kohe Swedi. Kopeerimine käib ka siis, kui muu töötlus viskas vea.
  var tee = function () { try { muudatus1_(e); } finally { kloonEdasi_(e); } };
  if (g) return grupiga_(g, tee);
  GRUPP_ = null;
  tee();
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
    try {
      laienda_(e.source); teated = sobita_(e.source, tana_(), true);
      if (pausidLoppu_(e.source, tana_(), true))               // Erik 3.11: uus nimi kohe pausil olijate ette, mitte alles öösel
        try { e.source.toast('Nimi tõsteti pausil olijate ette, et kuu vahekaardile ei jääks tühje ridu. / The name moved above the paused people, so the month tab has no empty rows.', 'Kuu harjutus', 10); } catch (err) {}
    } finally { lock.releaseLock(); }
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
  if (!lock.tryLock(20000)) { kloonTaimer_('lukk'); return; }   // Erik 4.11: ei jää enam ööd ootama, proovib minuti pärast uuesti
  try { muutus = kloon_(tana_(), m.start); }
  catch (err) { kloonTaimer_(err && err.message ? err.message : String(err)); }
  finally { lock.releaseLock(); }
  if (GRUPP_ && muutus) teata_({ range: sh.getRange(R0 + k, Math.max(r.getColumn(), 2)), source: e.source },
    [KLOON + ' kirjutab oma tulemused põhigrupi tabelisse ja need tulevad siia ise. Siin tehtud muudatus võeti tagasi. / ' +
     KLOON + '\'s results come from the main group\'s sheet, so this change was undone.']);
}

// Kopeerimine jäi tegemata (skript oli hõivatud või tuli viga): umbes minuti pärast proovitakse uuesti (kuni 10 korda),
// minutikontroll teeb sama, kui ühekordne päästik peaks kaduma. Viimane abinõu on öine samm.
var KLOON_PAASTIK = 'kuuHarjutusKloon';
function kloonTaimer_(miks) {
  var p = PropertiesService.getScriptProperties();
  if (!p.getProperty('KLOON_OOTEL')) p.setProperty('KLOON_OOTEL', String(Date.now()));
  try { Logger.log('Eriku kopeerimine ootel: ' + miks); } catch (err) {}
  try {
    if (ScriptApp.getProjectTriggers().some(function (x) { return x.getHandlerFunction() === KLOON_PAASTIK; })) return;
    ScriptApp.newTrigger(KLOON_PAASTIK).timeBased().after(60 * 1000).create();
  } catch (err) {}
}
function kloonOotel() {
  var p = PropertiesService.getScriptProperties();
  try { ScriptApp.getProjectTriggers().forEach(function (x) { if (x.getHandlerFunction() === KLOON_PAASTIK) ScriptApp.deleteTrigger(x); }); } catch (err) {}
  if (!p.getProperty('KLOON_OOTEL') || !p.getProperty('PRIV_ID')) return;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) { kloonUuesti_(p, 'lukk'); return; }
  try {
    GRUPP_ = null; KUUD_ = null;
    kloon_(tana_());
    p.deleteProperty('KLOON_OOTEL'); p.deleteProperty('KLOON_PROOVID');
  } catch (err) { kloonUuesti_(p, err && err.message ? err.message : String(err)); }
  finally { lock.releaseLock(); }
}
function kloonUuesti_(p, miks) {
  var n = Number(p.getProperty('KLOON_PROOVID')) || 0;
  if (n >= 10) { p.deleteProperty('KLOON_OOTEL'); p.deleteProperty('KLOON_PROOVID'); return; }   // öine samm teeb ära
  p.setProperty('KLOON_PROOVID', String(n + 1));
  kloonTaimer_(miks);
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
      if (pub) { laienda_(pub); sobita_(pub, tana_(), true, true); pausidLoppu_(pub, tana_(), true); }
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
    samm('pausile', function () { autoPaus_(pub, plan, t); });
    samm('kirjeteta pausile', function () { kirjeteta_(pub, plan, t); });
    samm('päevad', function () { kuulehed_(pub, true).forEach(function (m) { if (!m.frozen) puhastaPaevad2_(m); }); });
    samm('tasemed', function () { tasemed_(pub, t); });
    samm('graafik', function () { graafik_(pub); });
    if (plan) samm('auhinnad', function () { auhinnad_(plan); });
    samm('loosivõitjad', function () { voitjadVaade_(pub, false); });
    samm('kuu lõpp', function () {
      kuulehed_(pub).forEach(function (m) { if (!m.frozen && t > m.end + 1) kylmuta_(pub, m); });
    });
    samm('loosi vahekaart', function () { KUUD_ = null; loosiLeht_(pub, plan); if (varuloos_(pub)) voitjadVaade_(pub, true); });
    if (plan) samm('loosi viisid', function () { loosiViisid_(plan, pub); });
    if (plan) samm('postituste tekstid', function () { postiValemid_(plan); });
    if (plan && GRUPP_) samm('grupi valemid', function () { var p = grupid_(priv)[0]; if (p) grupiValemid_(plan, p); });
    if (GRUPP_) samm('pealkiri', function () { pealkiri_(pub); });
    if (plan) {
      samm('uus kuu', function () { uuedKuud_(pub, plan, t); });
      samm('plaan', function () { synk_(pub, plan, t); });
    }
    samm('vana kuu', function () { vanadKuud_(pub); });
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
// kommentaari kustutada ainult selle autoril (403). Märkused päevade lahtrites (märkuse autorit ei näe, ka omaniku märkus kaob) tühjendatakse öösel ja kell 10.
// Skripti enda märkused on veergudes A–C, nimekirjas ja 2x lahtris (rida 4), neid see ei puuduta.
// Erik 30.10: kustutada ei saa, aga lahendada (resolve) saab iga toimetaja. Lahendatud kommentaar kaob lahtrist (oranž nurk läheb ära),
// ajalugu jääb alles. Eriku enda (skripti omaniku) kommentaarid jäävad lahtisteks.
function kommentaarid_(pub) {
  kuulehed_(pub, true).forEach(function (m) { if (!m.frozen) m.sh.getRange(R0, FD, N, 31).clearNote(); });
  var api = 'https://www.googleapis.com/drive/v3/files/' + pub.getId() + '/comments', pea = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() };
  var leht = '', vead = [];
  do {
    var res = UrlFetchApp.fetch(api + '?pageSize=100&includeDeleted=false&fields=nextPageToken,comments(id,resolved,author(me))' + (leht ? '&pageToken=' + encodeURIComponent(leht) : ''),
      { method: 'get', headers: pea, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error('Kommentaarid (list): ' + res.getResponseCode() + ' ' + res.getContentText().slice(0, 200));
    var j = JSON.parse(res.getContentText());
    (j.comments || []).forEach(function (c) {
      if (c.resolved || (c.author && c.author.me)) return;
      var r = UrlFetchApp.fetch(api + '/' + encodeURIComponent(c.id) + '/replies?fields=id', { method: 'post', contentType: 'application/json', headers: pea,
        payload: JSON.stringify({ action: 'resolve', content: 'Kommentaarid suletakse automaatselt. / Comments are closed automatically.' }), muteHttpExceptions: true });
      if (r.getResponseCode() !== 200 && vead.length < 3) vead.push(r.getResponseCode() + ' ' + r.getContentText().slice(0, 200));
    });
    leht = j.nextPageToken || '';
  } while (leht);
  if (vead.length) throw new Error('Kommentaarid (resolve): ' + vead.join(' | '));
}

// Erik 20.10: kes pole kuu viimase 7 päeva jooksul midagi kirja pannud (number, J või H), alustab uut kuud pausil, muidu loetakse
// lahkunuid ühisesse eesmärki ja protsenti. Erik 25.10: kes ei kirjutanud terve kuu jooksul ühtegi korda, jääb pausita (võis alustada poole pealt). Otsus tehakse kuu lõpetanud ööl 2. kuupäeval (siis on viimase päeva kirjed ka lisatud),
// üks kord kuus. Erik ise, juba pausil või eemaldamist ootavad, alles viimase 7 päeva sees liitunud ja need, kes on juba uuel kuul
// midagi kirja pannud, jäävad alles. Tagasi saab alati: nimekirjas „Osalen“. Tagastab pausile pandud nimed.
var PAUSI_PAEVI = 7;                                         // 0 = reegel väljas (testid)
// Erik 2.11: kes läheb automaatselt pausile, ei tohi uue kuu ühises eesmärgis ega protsentides kordagi olla. Seepärast otsustab skript
// kohe uue kuu esimesel ööl (mitte 2. ööl) ja ka uue koodi saabudes (kiire_, Seadista), kui öine töö jäi vahele. Kes paneb lõppenud kuu
// viimase päeva tulemuse kirja alles 1. kuupäeval, tuleb järgmisel ööl ise tagasi (tagasiPausilt_). Saadab korraldajale kirja.
function autoPaus_(pub, plan, t) {
  kuulehed_(pub, true).forEach(function (m) { if (!m.frozen && t > m.end) staatiline_(m); });   // lõppenud kuu nimed ei tohi ridade liikumisega nihkuda
  var tagasi = tagasiPausilt_(pub, t), nimed = eiTaitnud_(pub, t), to = plan ? saaja_(plan) : '';
  if (nimed.length && to) kiri_({ to: to, subject: 'Kuu harjutus' + silt_() + ': ' + nimed.length + ' pausile', body: 'Viimase 7 päeva jooksul polnud kirjeid, seepärast alustavad uut kuud pausil: ' + nimed.join(', ') +
    '.\nNad ei ole uue kuu ühises eesmärgis ega protsentides. Nad saavad tagasi, kui valivad nimekirjas „Osalen“.\n\nNo entries in the last 7 days, so these people start the new month paused: ' + nimed.join(', ') +
    '.\nThey are not counted in the new month\'s group goal or percentages. They can come back by picking “Osalen · In” on the roster.' });
  if (tagasi.length && to) kiri_({ to: to, subject: 'Kuu harjutus' + silt_() + ': ' + tagasi.length + ' tagasi pausilt', body: 'Panid eelmise kuu viimaste päevade tulemuse kirja hiljem, seepärast on nad jälle osalejad: ' + tagasi.join(', ') +
    '.\n\nThey logged the last days of the previous month late, so they are participants again: ' + tagasi.join(', ') + '.' });
  return nimed;
}

// Kuu esimesel ööl pausile pandud inimene, kes kirjutas järgmisel päeval (eilse lahtrisse) lõppenud kuu viimase 7 päeva sisse kirje,
// saab tagasi „Osalen“ ja uue kuu rea. Tehakse üks kord, 2.–4. kuupäeval.
function tagasiPausilt_(pub, t) {
  if (!PAUSI_PAEVI) return [];
  var ro = pub.getSheetByName(T_ROSTER);
  if (!ro || nimekirjaKohti_(ro) < N) return [];
  var props = props_(), kuud = kuulehed_(pub), id = pub.getId(), tulemus = [];
  kuud.forEach(function (vana) {
    var kl = 'eitaitnud:' + id + ':' + vana.start, kn = 'eitaitnudnimed:' + id + ':' + vana.start;
    if (t < vana.end + 2 || t > vana.end + 4 || props.getProperty(kl) !== String(vana.end + 1) || props.getProperty(kn) === null) return;
    var nimed = JSON.parse(props.getProperty(kn) || '[]');
    props.deleteProperty(kn);
    if (!nimed.length) return;
    var v = ro.getRange(RR0, 2, N, 5).getValues();
    var vv = vana.sh.getRange(R0, 1, N, FD - 1 + vana.days).getValues();
    var kirje = function (x) { return typeof x === 'number' || /^[JH]$/i.test(str_(x)); };
    var elavad = kuud.filter(function (m) { return !m.frozen && m.start > vana.end && t <= m.end; });
    nimed.forEach(function (nimi) {
      var lc = nimi.toLowerCase(), k = -1;
      v.forEach(function (r, i) { if (k < 0 && str_(r[0]).toLowerCase() === lc) k = i; });
      if (k < 0 || v[k][1] !== PAUSE || str_(v[k][4]) !== PAUSE) return;          // juba ise tagasi või eemaldatud
      var rida = vv.filter(function (r) { return str_(r[0]).toLowerCase() === lc; })[0];
      if (!rida || !rida.slice(FD - 1 + vana.days - PAUSI_PAEVI).some(kirje)) return;
      ro.getRange(RR0 + k, 3).setValue(IN).clearNote();
      ro.getRange(RR0 + k, 6).setValue(IN);
      elavad.forEach(function (m) { tagasi_(m, k, m.start); });
      tulemus.push(v[k][0]);
    });
  });
  return tulemus;
}

function eiTaitnud_(pub, t) {
  if (!PAUSI_PAEVI) return [];
  var ro = pub.getSheetByName(T_ROSTER);
  if (!ro || nimekirjaKohti_(ro) < N) return [];
  var props = props_(), kuud = kuulehed_(pub);
  var vana = kuud.filter(function (m) {
    return t >= m.end + 1 && t <= m.end + 4 && !props.getProperty('eitaitnud:' + pub.getId() + ':' + m.start);
  }).pop();
  if (!vana) return [];
  var uus = kuud.filter(function (m) { return m.start === vana.end + 1; })[0];
  if (!uus) return [];
  props.setProperty('eitaitnud:' + pub.getId() + ':' + vana.start, String(t));
  var v = ro.getRange(RR0, 2, N, 5).getValues();
  var vp0 = vana.sh.getRange(R0, FD, N, vana.days).getValues(), up = uus.sh.getRange(R0, FD, N, uus.days).getValues();
  // Lõppenud kuu read ei liigu koos nimekirjaga (pausid liiguvad igal ööl lõppu), seepärast otsin vana kuu rea nime järgi.
  var vnimed = vana.sh.getRange(R0, 1, N, 1).getValues().map(function (r) { return str_(r[0]).toLowerCase(); });
  var vp = v.map(function (r, k) {
    var i = vnimed.indexOf(str_(r[0]).toLowerCase());
    if (i < 0 && str_(r[3])) i = vnimed.indexOf(str_(r[3]).toLowerCase());
    return i >= 0 ? vp0[i] : [];
  });
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
  if (t === vana.end + 1) props.setProperty('eitaitnudnimed:' + pub.getId() + ':' + vana.start, JSON.stringify(nimed));
  return nimed;
}

// Erik 5.11: kes pole 10 päeva jooksul oma algusest (kuu 1. kuupäev või hilisem liitumine/tagasitulek) midagi kirja pannud (number, J või H),
// läheb pausile: tema rida kaob käimasolevalt (ja juba loodud järgmiselt) kuu vahekaardilt ning samal ööl liigub ta nimekirja ja kuu
// vahekaartide lõppu (pausidLoppu_). Otsus tehakse alles öösel, kui ka 10. päeva lahter pole enam kirjutatav (eilse lahtri aeg läbi).
// Tagasi tulles („Osalen“) on ta nagu uus liituja: liitumiskuupäev on see päev, varasemad päevad X, tase ja tiim valib uuesti.
// Ainult öises hoolduses, et päeval ükski rida ei kaoks ega nihkuks. Erik ise ja kõik, kes pole „Osalen“, jäävad puutumata.
var ALGUSE_PAEVI = 10;                                       // 0 = reegel väljas (vanad testid)
function kirjeteta_(pub, plan, t) {
  if (!ALGUSE_PAEVI) return [];
  var ro = pub.getSheetByName(T_ROSTER);
  if (!ro || nimekirjaKohti_(ro) < N) return [];
  var elavad = kuulehed_(pub, true).filter(function (m) { return !m.frozen && t <= m.end; });
  var m = elavad.filter(function (x) { return x.start <= t; })[0];
  if (!m || t < m.start + ALGUSE_PAEVI + 1) return [];
  var v = ro.getRange(RR0, 2, N, 5).getValues(), mv = m.sh.getRange(R0, 1, N, FD - 1 + m.days).getValues();
  var kirje = function (x) { return typeof x === 'number' || /^[JH]$/i.test(str_(x)); };
  var nimed = [], read = [];
  v.forEach(function (r, k) {
    var nimi = str_(r[0]), liitus = toSerial_(r[2]);
    if (!nimi || nimi.toLowerCase() === KLOON.toLowerCase() || str_(r[1]) !== IN || str_(r[4]) !== IN) return;
    if (str_(mv[k][0]).toLowerCase() !== nimi.toLowerCase()) return;              // rida pole sel kuul nähtav (või ei klapi): ei puutu
    var algus = Math.max(m.start, liitus === null ? m.start : liitus);
    if (t < algus + ALGUSE_PAEVI + 1) return;                                     // 10 päeva pole veel täis
    if (mv[k].slice(FD - 1).some(kirje)) return;
    ro.getRange(RR0 + k, 3).setValue(PAUSE).setNote(ALGUSE_MARKUS);
    ro.getRange(RR0 + k, 6).setValue(PAUSE);
    elavad.forEach(function (x) { tyhjenda_(x, k, false); });
    nimed.push(nimi); read.push(k);
  });
  if (read.length) pausidLoppu_(pub, t, false, read);                           // Erik 5.11: pausile minnes nimekirja kõige lõppu
  var to = nimed.length && plan ? saaja_(plan) : '';
  if (to) kiri_({ to: to, subject: 'Kuu harjutus' + silt_() + ': ' + nimed.length + ' pausile', body: 'Esimese ' + ALGUSE_PAEVI + ' päeva jooksul polnud kirjeid, seepärast on nad nüüd pausil ja nende rida kadus kuu vahekaardilt: ' +
    nimed.join(', ') + '.\nNad ei ole enam ühises eesmärgis ega protsentides. Kui nad valivad nimekirjas „Osalen“, alustavad nad nagu uued liitujad.\n\n' +
    'No entries in the first ' + ALGUSE_PAEVI + ' days, so these people are now paused and their row was removed from the month tab: ' + nimed.join(', ') +
    '.\nThey are no longer counted in the group goal or percentages. If they pick “Osalen · In” on the roster, they start like new members.' });
  return nimed;
}
var ALGUSE_MARKUS = 'Esimese 10 päeva jooksul polnud sul ühtegi kirjet, seepärast oled nüüd pausil ja sinu rida kadus kuu vahekaardilt. ' +
  'Tahad jätkata? Vali siin „Osalen“, siis alustad nagu uus liituja. / ' +
  'You had no entries in your first 10 days, so you are now paused and your row was removed from the month tab. ' +
  'Want to continue? Pick “Osalen · In” here and you start like a new member.';

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
    ro.getRange(RR0, 2, N, 1).clearDataValidations();                   // nimereegel lükkaks nihutamise vahepealse seisu tagasi
    try {
      ro.getRange(RR0, 2, N, 5).setValues(v.map(function (r) { return [txt_(r[0]), txt_(r[1]), r[2] === null ? '' : r[2], txt_(r[3]), txt_(r[4])]; }));
    } finally { nimeReegel_(ro); }
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
// Erik 1.–2.11: igal ööl liiguvad pausil olijad, kelle rida mõnel elaval kuu vahekaardil (käimasolev või juba loodud järgmine) on tühi,
// nimekirja ja kuu vahekaartide lõppu, nii et ühelegi vahekaardile ei jää auke. Käimasolevas kuus teeb ta lõpuni (tema rida on seal osalejate järel),
// järgmisele kuule ta ei ilmu enne, kui valib „Osalen“. Automaatne paus liigub samal ööl.
// Tagasi tulnu („Osalen“) liigub järgmisel ööl osalejate lõppu.
function jarjesta_(pub, t) {
  pausidLoppu_(pub, t);
}


// Uue koodi saabudes (kiire_, Seadista) suletakse augud kohe, aga ainult öösel (0–6), et ridade tõstmine ei satuks kellegi kirjutamise peale.
function pausidOosel_(pub) {
  if (Number(Utilities.formatDate(new Date(), TZ, 'HH')) < 6) pausidLoppu_(pub, tana_());
}

// paev = true (nimekirja muudatus päeval, Erik 3.11): liiguvad ainult pausil olijad, kelle rida on käimasolevas kuus täiesti tühi,
// ja nende alla lisatud uued nimed tõusevad nende ette. Pausil olijad, kes käimasolevat kuud veel teevad, jäävad paigale kuni ööni,
// nii ei nihku päeval ühtegi rida, kuhu keegi parasjagu kirjutab.
function pausidLoppu_(pub, t, paev, viimaseks) {
  var ro = pub.getSheetByName(T_ROSTER);
  if (nimekirjaKohti_(ro) < N) return false;
  var ala = ro.getRange(RR0, 2, N, 5), v = ala.getValues(), osaleb = [], pausNimega = [], pausTyhi = [], tyhi = [];
  var elavad = kuulehed_(pub, true).filter(function (m) { return !m.frozen && t <= m.end; });
  var nimed = elavad.map(function (m) { return m.sh.getRange(R0, 1, N, 1).getValues().map(function (r) { return str_(r[0]) !== ''; }); });
  var praegu = elavad.map(function (m) { return m.start <= t; }).indexOf(true);
  v.forEach(function (r, k) {
    if (!str_(r[0]) && !str_(r[3])) { tyhi.push(k); return; }
    var auk = nimed.some(function (a) { return !a[k]; });     // mõnel elaval kuu vahekaardil on tema rida tühi
    if (str_(r[1]) !== PAUSE || !auk) osaleb.push(k);
    else if (paev && (praegu < 0 || nimed[praegu][k])) osaleb.push(k);   // päeval jääb ta oma kohale
    else if (praegu >= 0 && nimed[praegu][k]) pausNimega.push(k);   // teeb käimasoleva kuu lõpuni (järgmises kuus teda pole)
    else pausTyhi.push(k);
  });
  if (viimaseks) pausTyhi = pausTyhi.filter(function (k) { return viimaseks.indexOf(k) < 0; })    // Erik 5.11: just pausile läinud kõige lõppu
    .concat(viimaseks.filter(function (k) { return pausTyhi.indexOf(k) >= 0; }));
  var p = osaleb.concat(pausNimega, pausTyhi, tyhi);
  if (paev) {                                               // päeval jäävad tühjad read ja eemaldatavad (Eemalda/Kinnitan samas lahtris) oma kohale
    var paigal = function (k) { return tyhi.indexOf(k) >= 0 || str_(v[k][1]) === REMOVE || str_(v[k][1]) === CONFIRM; };
    var jada = osaleb.concat(pausTyhi).filter(function (k) { return !paigal(k); }), j = 0;
    p = v.map(function (r, k) { return paigal(k) ? k : jada[j++]; });
  }
  if (p.every(function (k, i) { return k === i; })) return false;
  var rn = ala.getNotes();                                  // märkused (nt automaatse pausi selgitus) liiguvad inimesega kaasa
  // Nimereegel (iga nimi üks kord, ülemine rida täis) lükkaks ümbertõstmise vahepealse seisu tagasi (2.11 päris tabelis), seepärast ajutiselt maha.
  ro.getRange(RR0, 2, N, 1).clearDataValidations();
  try {
    ala.setValues(p.map(function (k) { return v[k].map(function (x) { return x === null ? '' : txt_(x); }); }));
  } finally { nimeReegel_(ro); }
  ala.setNotes(p.map(function (k) { return rn[k]; }));
  ro.getRange(RR0, 4, N, 1).setNumberFormat('d.mm.yyyy');
  kuulehed_(pub, true).forEach(function (m) {
    if (m.frozen || t > m.end) return;                      // lõppenud kuu nimed on juba paigas (staatiline_)
    var r = m.sh.getRange(R0, 1, N, 34), mv = r.getValues(), mf = r.getFormulas(), mn = r.getNotes();
    r.setNotes(p.map(function (k) { return mn[k]; }));
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
  var elus = kuud.filter(function (k) { return !k.frozen; });   // uus kuu tuleb viimase käimasoleva kuu järele, lõppenud kuu jääb paremale
  var parast = elus.length ? elus[elus.length - 1].sh.getIndex() : pub.getSheetByName(T_ROSTER).getIndex();
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
  KUUD_ = null;
  vanadKuud_(pub);
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
  kaitse_(m.sh, [m.sh.getRange('C1')]);                     // keelevalik jääb vabaks, sest vahekaart on nähtav
  m.frozen = true;
  KUUD_ = null;
  vanadKuud_(pub);
}

// Erik 1.11: lõppenud kuu jääb nähtavale (auhinnad loositakse hiljem) ja on uue kuu vahekaardist paremal.
// Peitu läheb alles siis, kui tekib ülejärgmise kuu vahekaart (oktoober kaob, kui detsembri oma tekib).
function vanadKuud_(pub) {
  KUUD_ = null;
  var kuud = kuulehed_(pub), elus = kuud.filter(function (m) { return !m.frozen; });
  var naha = kuud.filter(function (m) {
    return m.frozen && !kuud.some(function (k) { return k.start > m.end + 1; });
  });
  kuud.forEach(function (m) {
    if (!m.frozen) return;
    if (naha.indexOf(m) < 0) { if (!m.sh.isSheetHidden()) m.sh.hideSheet(); }
    else if (m.sh.isSheetHidden()) { m.sh.showSheet(); kaitse_(m.sh, [m.sh.getRange('C1')]); }
  });
  var ankur = elus.length ? elus[elus.length - 1].sh : pub.getSheetByName(T_ROSTER);
  if (!ankur || !naha.length) { KUUD_ = null; return; }
  naha.forEach(function (m, i) {
    var a = ankur.getIndex();                               // 1-põhine; vasakult ära tõstes nihkub ankur ühe võrra
    var koht = m.sh.getIndex() > a ? a + 1 + i : a + i;
    if (m.sh.getIndex() === koht) return;
    pub.setActiveSheet(m.sh);
    pub.moveActiveSheet(koht);
  });
  KUUD_ = null;
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
// Ühekordsed eripäevad (Erik 30.10): sama raam kui 2x päeval, reas 4 silt ja märkus. Kehtib kõigis gruppides.
// Eripäeval loeb iga tulemus (> 0) päeva tehtuks ja roheliseks (valemid: rea 4 silt, mis pole „2x“; mk_v5.py ERI).
var ERIPAEVAD = {
  '2026-10-31': { silt: 'NATO', link: 'https://shorturl.at/2ytSl',
    markus: 'NATO test: Tee nii palju kätekõverdusi kui suudad 2 min jooksul. Reeglid: https://shorturl.at/2ytSl (klikitav link on vasakul üleval lahtris A4)\nKirjuta lahtrisse oma tulemus. Täna loeb iga tulemus päeva tehtuks, ka siis, kui see jääb alla sinu päeva eesmärgi.\n\n' +
      'NATO test: Do as many push-ups as you can in 2 minutes. Rules: https://shorturl.at/2ytSl (clickable link at the top left, cell A4)\nWrite your result in the cell. Today any result counts the day as done, even if it is below your daily target.' }
};
function eripaev_(m, p) {
  if (p > m.days) return null;
  var d = ymd_(m.start);
  return ERIPAEVAD[d[0] + '-' + (d[1] < 10 ? '0' : '') + d[1] + '-' + (p < 10 ? '0' : '') + p] || null;
}
// Märkuses link ei ole klikitav ega kopeeritav (Erik 30.10), sildil peidaks link märkuse. Nii on eripäeva link lahtris A4
// (alati nähtaval, ka siis, kui veerud on paremale keritud). Tavakuus on A4 jälle malli valem „⚡ 2x = topeltpäev“.
var A4_VALEM = '=IF(\'' + T_GUIDE + '\'!$C$3="English","⚡ 2x = double day","⚡ 2x = topeltpäev")';
function eriLink_(m) {
  var eri = null, paev = 0;
  for (var p = 1; p <= 31 && !eri; p++) { var e = eripaev_(m, p); if (e && e.link) { eri = e; paev = p; } }
  var a4 = m.sh.getRange(4, 1);
  if (eri) {
    var tekst = '⚡ ' + eri.silt + ' ' + paev + '.' + ymd_(m.start)[1] + ':\n' + eri.link;
    if (!a4.getFormula() && str_(a4.getValue()) === tekst) return false;
    a4.setRichTextValue(SpreadsheetApp.newRichTextValue().setText(tekst).setLinkUrl(eri.link).build()).setWrap(true);
    m.sh.setRowHeight(4, 30);
    return true;
  }
  if (a4.getFormula() || str_(a4.getValue()).indexOf('http') < 0) return false;
  a4.setFormula(A4_VALEM).setWrap(false);
  m.sh.setRowHeight(4, 16);
  return true;
}
function topeltKuusse_(m, paevad) {
  var r = m.sh.getRange(4, FD, 1, 31), v = r.getValues()[0], muutus = false;
  for (var p = 1; p <= 31; p++) {
    var eri = eripaev_(m, p);
    var uus = eri ? eri.silt : p <= m.days && paevad.indexOf(p) >= 0 ? '2x' : '';
    if (str_(v[p - 1]) !== uus) { v[p - 1] = uus; muutus = true; }
  }
  if (muutus) r.setValues([v]);
  var nt = r.getNotes()[0], viimane = R0 + N - 1;           // 2x päeval on kuldne raam kogu veeru ulatuses (rida 2 kuni viimane nimi) ja rea 4 lahtril seletus
  for (var q = 1; q <= 31; q++) {
    var eri = eripaev_(m, q), on = eri || str_(v[q - 1]) === '2x', c = FD + q - 1, markus = eri ? eri.markus : TOPELT_MARKUS;
    if (on) {
      if (nt[q - 1] !== markus) { m.sh.getRange(4, c).setNote(markus); muutus = true; }
      if (eri) m.sh.getRange(4, c).setRichTextValue(SpreadsheetApp.newRichTextValue().setText(eri.silt).build())   // ilma lingita: link peidaks märkuse (Erik 30.10)
        .setBackground('#F2B531');                          // 2x kuldne taust tuleb tingimusvormingust, eripäeval paneme ise
      m.sh.getRange(4, c, viimane - 3, 1).setBorder(null, null, true, null, null, true, '#E6DED3', SpreadsheetApp.BorderStyle.SOLID);   // hallid reajooned tagasi (v11y kustutas need)
      m.sh.getRange(2, c, viimane - 1, 1).setBorder(true, true, true, true, null, null, '#B7791F', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    } else if (nt[q - 1]) {
      m.sh.getRange(4, c).setNote('').setBackground(null);
      var veerg = m.sh.getRange(2, c, viimane - 1, 1);
      veerg.setBorder(false, false, false, false, false, false);
      m.sh.getRange(4, c, viimane - 3, 1).setBorder(null, null, true, null, null, true, '#E6DED3', SpreadsheetApp.BorderStyle.SOLID);
      muutus = true;
    }
  }
  if (eriLink_(m)) muutus = true;
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
    for (var k = 0; k < 31; k++) if (typeof r[FD - 1 + k] === 'number') o.kokku += r[FD - 1 + k];   // 23.11: KOKKU (AL) on sekundite kuul minutid, siin päevade summa ühikutes
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

// Muutunud tekstid (leitakse vana valemi või teksti järgi). Kiire: käib ka kohe uue koodi järel, enne pikka Seadistat (Erik 30.10).
function tekstid_(pub) {
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
  proovi('tekstid', function () { tekstid_(pub); });
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
      proovi('loosi vahekaart', function () { loosiLeht_(pub, plaan_(privaatne_())); });
      proovi('loosivõitjad', function () { voitjadVaade_(pub, true); });   // edetabel_ tühjendas ka selle ala
      proovi('vana kuu', function () { vanadKuud_(pub); });
      proovi('automaatne paus', function () { KUUD_ = null; autoPaus_(pub, plaan_(privaatne_()), tana_()); });   // kui öine töö jäi vahele (Erik 2.11)
      proovi('pausid lõppu', function () { KUUD_ = null; pausidOosel_(pub); });
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
// 31.10 Erik: LISA (AM) alla eesmärgi miinusega. Tabeli importimisel jäi Sheetsis vorming ilma miinuseta (Vladimir -5% näitas 0%),
// seepärast paneb skript vormingu ise peale, kõigile kuu vahekaartidele (ka lukus).
var LISA_VORM = '"+"0%;"-"0%;0%';
function lisaVorming_(pub) {
  kuulehed_(pub, false).forEach(function (m) {
    try { m.sh.getRange(R0, 39, N, 1).setNumberFormat(LISA_VORM); } catch (err) { Logger.log('LISA vorming: ' + err); }
  });
}

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
    if (p[0] === 35) sh.getRange(R0, 39, N, 1).setNumberFormat(LISA_VORM);   // 31.10: LISA miinusega
    if (p[0] === 35) sh.getRange(R0, 38, N, 1).setNumberFormat('0');         // 23.11: KOKKU täisarvuna (sekundite kuul minutid)
    var pea = mall.getRange(2, p[0], 2, p[1]), pf = pea.getFormulas(), pv = pea.getValues();
    sh.getRange(2, p[0], 2, p[1]).setValues(pf.map(function (r, i) { return r.map(function (x, j) { return x || txt_(pv[i][j]); }); }));
  });
  var jalus = mall.getRange(R0 + N + 1, FD, 1, 31).getFormulasR1C1();   // „✓ eesmärk täis“ päevade kaupa (30.10: eripäeval loeb iga tulemus)
  if (jalus[0][0]) sh.getRange(R0 + N + 1, FD, 1, 31).setFormulasR1C1(jalus);
  sh.getRange(R0 + N + 2, 38).setNumberFormat('0');         // 23.11 Erik: KOKKU on sekundite kuul minutid, näitame täisminuteid
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
    b.getRange(r[0], 1, n, 12).breakApart();                 // fortuuna pealkiri on ühendatud G:L (30.10)
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
  nimeReegel_(ro);
}

function nimeReegel_(ro) {
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
  var tekst, p = props_();
  p.setProperty('NUPP_KAIB:' + a1, String(Date.now()));
  try {
    tekst = a1 === C_LOOS ? loosiLukuga_(sh) : a1 === C_KUU ? looKuuKohe_().tekst : saadaProov_(sh).tekst;
  } catch (err) { tekst = 'Ei õnnestunud: ' + (err && err.message ? err.message : err); }
  sh.getRange(nupp[a1]).setValue(txt_(tekst));
  e.range.setValue(false);
  p.deleteProperty('NUPP_KAIB:' + a1);
}

// Erik 2.11: „et ta ei lülituks välja no matter what“. Varem kustutas Seadista kõik Kuu harjutuse päästikud ja tegi need uuesti;
// kui see vahepeal katkes (mitu uuendust järjest), jäid menüü, linnukesed, öö ja hommik tööta. Nüüd lisatakse ainult puuduvad
// (kõigepealt lisamine, siis topelt- ja vanade kustutamine) ja vajalikke ei kustutata kunagi. Käib Seadistas, iga minut
// (minutipäästikust), öösel ja „Arhiiv & tähtajad“ öises käivituses (kui Kuu harjutuse enda päästikud peaksid ikkagi kaduma).
var PUSIVAD = ['kuuHarjutusMenuu', 'kuuHarjutusOine', 'kuuHarjutusHommik', 'kuuHarjutusMuudatus', 'kuuHarjutusPlaan', 'kuuHarjutusVersioon', 'oine', 'hommik', 'muudatus'];
function allikas_(t) { try { return String(t.getTriggerSourceId() || ''); } catch (err) { return ''; } }
function paastikud_(priv, pubIds) {
  var on = ScriptApp.getProjectTriggers(), hoia = [], vead = [], pid = priv.getId();
  var vaja = [
    { f: 'kuuHarjutusVersioon', loo: function () { ScriptApp.newTrigger('kuuHarjutusVersioon').timeBased().everyMinutes(1).create(); } },   // uuendaja toodud kood seadistab end ise (27.10)
    { f: 'kuuHarjutusPlaan', id: pid, loo: function () { ScriptApp.newTrigger('kuuHarjutusPlaan').forSpreadsheet(pid).onEdit().create(); } },
    { f: 'kuuHarjutusMenuu', id: pid, loo: function () { ScriptApp.newTrigger('kuuHarjutusMenuu').forSpreadsheet(pid).onOpen().create(); } },
    { f: 'kuuHarjutusOine', loo: function () { ScriptApp.newTrigger('kuuHarjutusOine').timeBased().everyDays(1).atHour(0).inTimezone(TZ).create(); } },
    { f: 'kuuHarjutusHommik', loo: function () { ScriptApp.newTrigger('kuuHarjutusHommik').timeBased().everyDays(1).atHour(10).nearMinute(0).inTimezone(TZ).create(); } }   // kell 10 (Erik 11.10)
  ].concat(pubIds.filter(String).map(function (id) {
    return { f: 'kuuHarjutusMuudatus', id: id, loo: function () { ScriptApp.newTrigger('kuuHarjutusMuudatus').forSpreadsheet(id).onEdit().create(); } };
  }));
  var lisatud = 0, puudu = [], VANAD = ['oine', 'hommik', 'muudatus'];
  // Tabeli päästik, mille tabelit ei saanud lugeda (allikas tühi), loeb samuti olemasolevaks: muidu tehtaks iga kord uus juurde.
  var sobib = function (x, v) { var a = allikas_(x); return x.getHandlerFunction() === v.f && (!v.id || a === v.id || a === ''); };
  vaja.forEach(function (v) {
    var t = on.filter(function (x) { return hoia.indexOf(x) < 0 && sobib(x, v); })[0];
    if (t) hoia.push(t); else puudu.push(v);
  });
  // Erik 4.11: päästikud kadusid. Nüüd kustutatakse ainult vanad nimed ja täpsed topeltid (sama funktsioon ja sama tabel kui
  // allesjäänul), enne uute lisamist, et vabastada kohti projekti 20 päästiku piirist. Kõik muu jääb alles.
  on.forEach(function (x) {
    var f = x.getHandlerFunction();
    if (PUSIVAD.indexOf(f) < 0 || hoia.indexOf(x) >= 0) return;
    var topelt = hoia.some(function (h) { return h.getHandlerFunction() === f && allikas_(h) === allikas_(x); });
    if (VANAD.indexOf(f) < 0 && !topelt) return;
    try { ScriptApp.deleteTrigger(x); } catch (err) {}
  });
  puudu.forEach(function (v) {
    try { v.loo(); lisatud++; } catch (err) { vead.push(v.f + ': ' + (err && err.message ? err.message : err)); }
  });
  var pp = PropertiesService.getScriptProperties();
  if (vead.length) { Logger.log('Päästikud: ' + vead.join(' | ')); pp.setProperty('PAASTIKU_VIGA', Utilities.formatDate(new Date(), TZ, 'd.MM HH:mm') + ' ' + vead.join(' | ')); }
  else pp.deleteProperty('PAASTIKU_VIGA');
  return lisatud;
}

// Erik 4.11: päästikud olid olemas ja õiged, aga Google ei käivitanud neid (minutipäästik ja muutmise päästikud), käsitsi
// kustutamine ja uuesti tegemine aitas. Nüüd teeb skript seda ise. Ainult skripti mälu lugemine, tabeleid ei avata.
// Minutipäästik vait > 15 min (märkab iga teine käivitus: muutmine, öö, hommik, avamine) → uus minutipäästik.
// Ühise tabeli muutmise päästik vait > 8 h (kontroll kell 12–23) → see päästik uuesti. Kumbagi kõige rohkem kord 30 min / 8 h.
function elusta_(minutist, e) {
  var p = PropertiesService.getScriptProperties(), nyyd = Date.now(), MIN = 60 * 1000;
  if (e && e.source) try { p.setProperty('MUUDATUS_AEG:' + e.source.getId(), String(nyyd)); } catch (err) {}
  var k = p.getProperties();
  if (!k.PRIV_ID) return;
  if (minutist) p.setProperty('VERSIOON_AEG', String(nyyd));
  else if (k.VERSIOON_AEG && nyyd - Number(k.VERSIOON_AEG) > 15 * MIN && nyyd - (Number(k.ELUSTA_V) || 0) > 30 * MIN) {
    p.setProperty('ELUSTA_V', String(nyyd));
    uusPaastik_('kuuHarjutusVersioon', null);
    p.setProperty('VERSIOON_AEG', String(nyyd));            // anna uuele aega
  }
  var tund = Number(Utilities.formatDate(new Date(), TZ, 'HH'));
  if (tund < 12) return;
  Object.keys(k).forEach(function (v) {
    if (!/^PUB_ID(@|$)/.test(v) || !k[v]) return;
    var id = k[v], aeg = Number(k['MUUDATUS_AEG:' + id]) || 0;
    if (!aeg) { p.setProperty('MUUDATUS_AEG:' + id, String(nyyd)); return; }
    if (nyyd - aeg <= 8 * 60 * MIN || nyyd - (Number(k['ELUSTA_M:' + id]) || 0) <= 8 * 60 * MIN) return;
    p.setProperty('ELUSTA_M:' + id, String(nyyd));
    uusPaastik_('kuuHarjutusMuudatus', id);
  });
}
function uusPaastik_(f, id) {
  ScriptApp.getProjectTriggers().forEach(function (x) {
    if (x.getHandlerFunction() === f && (!id || allikas_(x) === id)) { try { ScriptApp.deleteTrigger(x); } catch (err) {} }
  });
  if (id) ScriptApp.newTrigger(f).forSpreadsheet(id).onEdit().create();
  else ScriptApp.newTrigger(f).timeBased().everyMinutes(1).create();
  Logger.log('Päästik ' + f + (id ? ' ' + id : '') + ' tehti uuesti (ei käivitunud).');
}

// Kõigi gruppide ühiste tabelite id-d (päästikute jaoks).
function pubIdid_(priv) {
  return grupid_(priv).map(function (g) { return grupiga_(g, function () { return props_().getProperty('PUB_ID') || ''; }); }).filter(String);
}
function paastikudKorda() {
  var p = PropertiesService.getScriptProperties();
  if (!p.getProperty('PRIV_ID')) return 0;
  var priv = privaatne_();
  return paastikud_(priv, pubIdid_(priv));
}

// Erik 4.11: päästikud olid olemas, aga ei käivitunud. Editoris käivitatav ülevaade (Execution log): mis päästikud on ja
// mis tabelitele need vaatavad, võrreldes skripti mälus olevate tabelitega.
function paastikudNaita() {
  var p = PropertiesService.getScriptProperties(), rida = [];
  var nimi = function (id) { try { return SpreadsheetApp.openById(id).getName(); } catch (err) { return 'EI AVANE: ' + (err && err.message ? err.message : err); } };
  var priv = p.getProperty('PRIV_ID') || '';
  rida.push('PRIV_ID ' + priv + ' = ' + nimi(priv));
  try { rida.push('See projekt on seotud tabeliga ' + SpreadsheetApp.getActive().getId()); } catch (err) {}
  if (priv) pubIdid_(privaatne_()).forEach(function (id) { rida.push('PUB_ID ' + id + ' = ' + nimi(id)); });
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var tyyp = '', allikas = '';
    try { tyyp = String(t.getEventType()); } catch (err) {}
    try { allikas = String(t.getTriggerSource()); } catch (err) {}
    rida.push(t.getHandlerFunction() + ' | ' + tyyp + ' | ' + allikas + ' | ' + allikas_(t) + ' | ' + t.getUniqueId());
  });
  rida.push('KLOON_OOTEL ' + (p.getProperty('KLOON_OOTEL') || '-') + ', PAASTIKU_VIGA ' + (p.getProperty('PAASTIKU_VIGA') || '-') +
    ', SEADISTATUD ' + (p.getProperty('SEADISTATUD') || '-') + ', EHITUS ' + EHITUS);
  rida.forEach(function (x) { Logger.log(x); });
  return rida.join('\n');
}

// Erik 4.11: telefonis jäi linnuke D32 peale ja loosi ei tulnud (päästikud ei töötanud), inimesed ootasid. Veebileht (Apps Script
// „Deploy → Test deployments → Web app“, ainult sinule) teeb loosi ilma päästikuteta: lingi avamine telefoni brauseris, nupp, tulemus kohe.
// Leht parandab avamisel ka puuduvad päästikud ja näitab koodi versiooni.
function veeb() {
  var priv = privaatne_(), seis = '';
  try { var n = paastikud_(priv, pubIdid_(priv)); seis = n ? 'Lisasin ' + n + ' puuduvat päästikut, nüüd on need korras.' : 'Päästikud on korras.'; }
  catch (err) { seis = 'Päästikuid ei saanud kontrollida: ' + (err && err.message ? err.message : err); }
  var nupud = grupid_(priv).filter(Boolean).map(function (g) {
    var nimi = grupiNimi_(g), silt = nimi ? nimi + ' grupp' : 'Põhigrupp';
    var g1 = html_(nimi).replace(/'/g, '');
    return '<button onclick="loosi(this,\'' + g1 + '\',false)">🎟️ Loosi võitjad: ' + html_(silt) + '</button>' +
      '<button class="proov" onclick="loosi(this,\'' + g1 + '\',true)">Proovi (ei salvesta): ' + html_(silt) + '</button>' + (!omanikVeebis_() ? '' :
      '<button class="tyhista" onclick="if(confirm(\'Kas kustutan ' + html_(silt).replace(/'/g, '') + ' viimase loosi tulemuse? Siis saad uuesti loosida.\'))loosi(this,\'' + g1 + '\',\'tuhista\')">Tühista loos (saad uuesti loosida): ' + html_(silt) + '</button>');
  }).join('');
  var html = '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>' +
    'body{font-family:Arial,sans-serif;background:#FBF8F3;color:#2B241E;margin:0;padding:18px}h1{font-size:22px;margin:0 0 6px}' +
    'p{font-size:14px;line-height:1.45}button{display:block;width:100%;font-size:18px;font-weight:bold;padding:16px;margin:12px 0;border:0;border-radius:10px;background:#8B6B47;color:#fff}' +
    'button.proov{background:#fff;color:#8B6B47;border:2px solid #8B6B47;font-size:15px;padding:10px}button.tyhista{background:transparent;color:#B3261E;font-size:12px;font-weight:normal;padding:6px;margin:0 0 18px}button:disabled{background:#B0A698;color:#fff}#tulemus{font-size:15px;line-height:1.5;background:#fff;border:1px solid #E6DED3;border-radius:10px;padding:12px;white-space:pre-wrap;display:none}' +
    '.vaike{font-size:12px;color:#6E655B}</style></head><body><h1>Kuu harjutus</h1>' +
    '<p>Vajuta nuppu: tabel loosib eelmise kuu piletite järgi kõik auhinnad ja võitjad tulevad kohe vahekaartidele „Ülevaade“ ja „Autahvel“. Teine vajutus uut loosi ei tee. ' +
    '„Proovi“ teeb loosi läbi, aga ei salvesta midagi: sellega saad enne trenni kontrollida, et kõik töötab.</p>' +
    nupud + '<div id="tulemus"></div><p class="vaike">' + html_(seis) + ' Versioon ' + html_(EHITUS) + '.</p>' +
    '<script>function loosi(b,g,p){var t=document.getElementById("tulemus"),s=b.textContent,a=Date.now(),koik=document.querySelectorAll("button");koik.forEach(function(x){x.disabled=true;});' +
    'b.textContent="Loosin…";t.style.display="none";var vaba=function(){koik.forEach(function(x){x.disabled=false;});b.textContent=s;};' +
    'var kell=setTimeout(function(){t.textContent="Vastust pole 10 sekundiga. Kasuta Loosiratast või varuloosi (vahekaart „Loos | Draw“, lahter B3).";t.style.display="block";},10000);' +
    'google.script.run.withSuccessHandler(function(r){clearTimeout(kell);t.textContent=r+" ("+((Date.now()-a)/1000).toFixed(1)+" s)";t.style.display="block";vaba();})' +
    '.withFailureHandler(function(e){clearTimeout(kell);t.textContent="Ei õnnestunud: "+(e&&e.message?e.message:e)+". Kasuta Loosiratast või varuloosi (vahekaart „Loos | Draw“, lahter B3).";t.style.display="block";vaba();})' +
    '.kuuHarjutusVeebiLoos(g,p);}</script></body></html>';
  return HtmlService.createHtmlOutput(html).setTitle('Kuu harjutus · loos').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Veebilehe nupp: sama mis linnuke D32 selle grupi vahekaardil (tulemus ka E32-sse), aga ilma päästikuta.
// Tühistada saab ainult omanik (testjuurutus /dev või editor). Avalik link (/exec, „Kõik“, Erik 5.11: telefonis mitme kontoga
// /dev ei avane) näitab ainult loosi ja proovi nuppu: võõras ei saa tulemust kustutada.
function omanikVeebis_() {
  var a = '', e = '';
  try { a = String(Session.getActiveUser().getEmail() || ''); e = String(Session.getEffectiveUser().getEmail() || ''); } catch (err) {}
  return !!a && a === e;
}

function veebiLoos(nimi, proov) {
  if (proov === 'tuhista') return omanikVeebis_() ? loosiTuhista_(nimi) : 'Tühistada saab ainult tabeli omanik arvutist (Apps Scripti testjuurutus või editor).';
  var priv = privaatne_(), g = grupid_(priv).filter(function (x) { return x && grupiNimi_(x) === String(nimi || ''); })[0];
  if (!g) return 'Gruppi „' + nimi + '“ ei leitud.';
  return grupiga_(g, function () {
    var p = props_(), t;
    p.setProperty('NUPP_KAIB:' + C_LOOS, String(Date.now()));
    if (proov) return loosi_(g, { proov: true }).tekst;
    p.setProperty('NUPP_KAIB:' + C_LOOS, String(Date.now()));
    try { t = loosiLukuga_(g, 'veebileht'); } catch (err) { t = 'Ei õnnestunud: ' + (err && err.message ? err.message : err); }
    finally { p.deleteProperty('NUPP_KAIB:' + C_LOOS); }
    g.getRange(C_LOOS_TULEMUS).setValue(txt_(t));
    g.getRange(C_LOOS).setValue(false);
    return t;
  });
}

// Erik 2.11 (telefonis): linnuke D32 jäi peale ja loosi ei tulnud, Google ei käivitanud muudatuse päästikut (tõenäoliselt
// käis samal ajal uuenduse Seadista, mis teeb päästikud uuesti). Minutipäästik vaatab linnukesi: kui linnuke on peal ka
// järgmisel minutil ja ükski käivitus seda parajasti ei tee, teeb ta sama, mis linnuke oleks teinud.
function linnukesed_() {
  var p0 = PropertiesService.getScriptProperties();
  if (!p0.getProperty('PRIV_ID')) return;
  // Erik 4.11: Google lubab päästikutele kokku 90 minutit päevas. Iga minut tabelit avada on kallis, seega ainult loosi ajal
  // (kuu 1.–10. päev, kell 7–23). Mujal teeb linnuke oma töö muudatuse päästikuga nagu alati.
  var nyyd = Utilities.formatDate(new Date(), TZ, 'd HH').split(' ').map(Number);
  if (nyyd[0] > 10 || nyyd[1] < 7 || nyyd[1] >= 23) return;
  grupid_(privaatne_()).forEach(function (g) {
    if (!g || !minutAegaOn_()) return;                         // aeg otsas: järgmine minut jätkab (NUPP: võtmed jäävad alles)
    grupiga_(g, function () {
      var p = props_(), v = g.getRange(C_LOOS + ':' + C_PROOV).getValues();
      [C_LOOS, C_KUU, C_PROOV].forEach(function (a1, i) {
        var k = 'NUPP:' + a1, nyyd = Date.now();
        if (v[i][0] !== true) { if (p.getProperty(k)) p.deleteProperty(k); return; }
        var nagi = Number(p.getProperty(k)) || 0, kaib = Number(p.getProperty('NUPP_KAIB:' + a1)) || 0;
        if (!nagi) { p.setProperty(k, String(nyyd)); return; }
        if (nyyd - nagi < 50000 || nyyd - kaib < 300000 || !minutAegaOn_()) return;
        p.deleteProperty(k);
        plaaniMuudatus1_({ range: g.getRange(a1) }, g);
      });
    });
  });
}

// Erik 5.11 01:07: veebilehe nupp tegi põhigrupi oktoobri loosi öösel kogemata (ilma inimesteta). Tühistus kustutab viimase loosi
// tulemuse (vahekaart „Loos | Draw“, skripti mälu, Autahvel, Ülevaade), et saaks trennis uuesti loosida.
function loosiTuhista_(nimi) {
  var priv = privaatne_(), g = grupid_(priv).filter(function (x) { return x && grupiNimi_(x) === String(nimi || ''); })[0];
  if (!g) return 'Gruppi „' + nimi + '“ ei leitud.';
  return grupiga_(g, function () {
    var pub = avalik_();
    if (!pub) return 'Ühist tabelit ei leitud.';
    var o = loosOlek_(pub);
    if (!o) return 'Tühistada pole midagi: loosi tulemust pole.';
    var y = Number(o.kuu.slice(0, 4)), m = Number(o.kuu.slice(5)), sh = pub.getSheetByName(T_LOOS);
    if (sh) sh.getRange(LS0, 8, LSN, 7).clearContent();
    props_().deleteProperty('LOOS'); props_().deleteProperty('LOOS_VAADE');
    var mk = kuuLeht_(pub, y, m), f = pub.getSheetByName(T_FAME);
    if (mk && f) {
      var a = f.getRange(FAME0, 1, FAMEN, 1).getValues();
      for (var i = 0; i < FAMEN; i++) if (String(a[i][0]) === mk.name) { f.getRange(FAME0 + i, FAME_WIN).setValue(''); autahvliKorgus_(f); }
    }
    voitjadVaade_(pub, true);
    var t = ET_G[m - 1].charAt(0).toUpperCase() + ET_G[m - 1].slice(1) + ' loos (' + o.aeg + ', ' + o.voitjad.length + ' võitjat) on tühistatud. Võid uuesti loosida.';
    g.getRange(C_LOOS_TULEMUS).setValue(t);
    return t;
  });
}
function tuhistaLoos(nimi) { return loosiTuhista_(nimi || ''); }

// Editorist: kuuHarjutusLoosiLingid('https://script.google.com/macros/s/…/exec', 'https://script.google.com/macros/s/…/exec')
function loosiLingid(veeb, ratas) {
  var p = PropertiesService.getScriptProperties(), ok = function (u) { return /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/(exec|dev)$/.test(str_(u)); };
  if (veeb !== undefined && veeb !== null) { if (str_(veeb) && !ok(veeb)) throw new Error('Veebilehe link ei ole õige: ' + veeb); p.setProperty('LOOS_LINK_VEEB', str_(veeb)); }
  if (ratas !== undefined && ratas !== null) { if (str_(ratas) && !ok(ratas)) throw new Error('Loosiratta link ei ole õige: ' + ratas); p.setProperty('LOOS_LINK_RATAS', str_(ratas)); }
  var priv = privaatne_(), n = 0;
  koigile_(priv, function () { var pl = plaan_(priv); if (pl) { loosiViisid_(pl, avalik_()); n++; } });
  return 'Loosi viisid on uuendatud ' + n + ' grupi plaanis.';
}

// Linnuke D32 ja veebileht: sama loos, aga kaks korraga ei loosi (oma märge, mitte skripti lukk: Seadista hoiab lukku minuteid).
function loosiLukuga_(sh, viis) {
  var p = props_(), k = Number(p.getProperty('LOOS_KAIB')) || 0;
  if (Date.now() - k < 45000) {
    Utilities.sleep(6000);                                           // teine loos lõpeb tavaliselt mõne sekundiga
    var o = loosOlek_();
    return o ? 'Teine loos käis samal ajal ja on tehtud (' + o.aeg + '): ' + o.voitjad.map(function (w, i) { return (i + 1) + '. ' + w.nimi + ' – ' + w.et; }).join('; ') + '.'
      : 'Teine loos käib parajasti. Vaata mõne sekundi pärast vahekaarti „Loos | Draw“ ühises tabelis.';
  }
  p.setProperty('LOOS_KAIB', String(Date.now()));
  try { return loosi_(sh, { viis: viis || 'linnuke D32', kontroll: true }).tekst; } finally { p.deleteProperty('LOOS_KAIB'); }
}

// Menüüst: sama loos, tulemus aknas.
function loosiMenuust() {
  var plan = plaan_(), r = loosi_(plan, { viis: 'menüü', kontroll: true });
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

// Erik 5.11: „pane kõik need 4 linki minu kuuharjutuse seadete alla … selge ja kindel ülevaade ja nupud“.
// Plaani vahekaardil V28:X33 plokk „Loosi viisid“: neli linki järjekorras. Veebilehe ja Loosiratta lingi annab
// kuuHarjutusLoosiLingid(veeb, ratas) (skripti seaded LOOS_LINK_VEEB/RATAS, kõigil gruppidel sama), linnuke ja varuloos arvutatakse.
var LV0 = 28, LV_PAIS = 'LOOSI VIISID';
function loosiLingid_() {
  var p = PropertiesService.getScriptProperties();
  return { veeb: str_(p.getProperty('LOOS_LINK_VEEB')), ratas: str_(p.getProperty('LOOS_LINK_RATAS')) };
}
function loosiViisid_(plan, pub) {
  if (!plan) return;
  if (plan.getMaxColumns() < AUH_VEERG + 3) plan.insertColumnsAfter(plan.getMaxColumns(), AUH_VEERG + 3 - plan.getMaxColumns());
  if (plan.getMaxRows() < LV0 + 6) plan.insertRowsAfter(plan.getMaxRows(), LV0 + 6 - plan.getMaxRows());
  var V = AUH_VEERG, L = loosiLingid_(), priv = plan.getParent(), loos = pub ? pub.getSheetByName(T_LOOS) : null;
  var privUrl = priv.getUrl().replace(/\/edit.*$/, '/edit'), pubUrl = pub ? pub.getUrl().replace(/\/edit.*$/, '/edit') : '';
  var viisid = [
    ['1. Veebileht', L.veeb, 'Vajuta lehel „Loosi võitjad“. Kõige kiirem, töötab ilma päästikuta.', 'Link tuleb siia, kui veebileht on avalikuks tehtud.'],
    ['2. Loosiratas', L.ratas, 'Eraldi kood ja eraldi projekt. Vajuta „Loosi võitjad“.', 'Link tuleb siia, kui Loosiratas on avalikuks tehtud.'],
    ['3. Linnuke D32', privUrl + '#gid=' + plan.getSheetId() + '&range=D32', 'Pane siin vahekaardil lahtrisse D32 linnuke. Vastus tuleb lahtrisse E32.', ''],
    ['4. Varuloos B3', loos ? pubUrl + '#gid=' + loos.getSheetId() + '&range=B3' : '', 'Ühise tabeli vahekaart „Loos | Draw“: kirjuta lahtrisse B3 number, näiteks 7. Töötab ilma skriptita.', 'Vahekaart „Loos | Draw“ tehakse ühisesse tabelisse öösel.']
  ];
  var ala = plan.getRange(LV0, V, 6, 3);
  ala.breakApart();
  plan.getRange(LV0, V, 1, 3).merge();
  plan.getRange(LV0, V).setValue(LV_PAIS).setFontFamily('Oswald').setFontSize(12).setFontWeight('bold').setFontColor('#8B6B47').setVerticalAlignment('bottom');
  plan.getRange(LV0 + 1, V, 1, 3).merge();
  plan.getRange(LV0 + 1, V).setValue('Kui üks viis 10 sekundiga ei vasta, võta kohe järgmine. Kehtib esimene loos, teist korda ei loosita.')
    .setFontSize(9).setFontColor('#6E655B').setFontStyle('italic').setWrap(true).setVerticalAlignment('middle');
  viisid.forEach(function (v, i) {
    var r = LV0 + 2 + i, nupp = plan.getRange(r, V), txt = plan.getRange(r, V + 1, 1, 2);
    var rt = SpreadsheetApp.newRichTextValue().setText(v[1] ? v[0] + ' ▶' : v[0]);
    if (v[1]) rt = rt.setLinkUrl(v[1]);
    nupp.setRichTextValue(rt.build()).setBackground(v[1] ? '#8B6B47' : '#B0A698').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(11)
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    txt.merge();
    plan.getRange(r, V + 1).setValue(v[1] ? v[2] : (v[3] || v[2])).setFontSize(9).setFontColor('#2B241E').setFontStyle('normal').setWrap(true).setVerticalAlignment('middle');
  });
}

// Auhinnad plaani järjekorras: [{et, en, n}]. Tühjad read ja 0 jäävad välja.
function auhinnaLoend_(plan) {
  if (!plan || plan.getMaxColumns() < AUH_VEERG + 2 || str_(plan.getRange(PL0 - 1, AUH_VEERG).getValue()) !== AUH_PAIS[0]) return [];
  return plan.getRange(AUH0, AUH_VEERG, AUHN, 3).getValues().map(function (r) {
    return { et: str_(r[0]), en: str_(r[1]) || str_(r[0]), n: Math.floor(Number(r[2]) || 0) };
  }).filter(function (a) { return a.et && a.n > 0; });
}

// Viimane loos (igal grupil oma): { kuu: '2026-10', aeg: '3.11.2026', voitjad: [{ nimi, p, et, en }] }.
function loosOlek_(pub) {
  try { var kirje = loosiKirje_(pub || avalik_()); if (kirje) return kirje; } catch (err) { Logger.log('Loosi vahekaart: ' + err); }
  try { var o = JSON.parse(props_().getProperty('LOOS') || 'null'); return o && o.kuu && o.voitjad ? o : null; } catch (err) { return null; }
}
function loosis_(n, uued) { return 'loosis oli ' + n + (n === 1 ? ' inimene' : ' inimest') + ', loositaks ' + uued.length + (uued.length === 1 ? ' auhind.' : ' auhinda.'); }
function kuuVoti_(y, m) { return y + '-' + (m < 10 ? '0' : '') + m; }
function piletit_(p) { return p + (p === 1 ? ' pilet' : ' piletit'); }

// Uue kuu esimeses trennis: loosib lõppenud (eelmise) kuu piletite järgi välja plaani tabeli „Auhinnad“ auhinnad.
// Rohkem pileteid = suurem võimalus võita. Auhinna väärtus võimalust ei mõjuta: auhinnad jagatakse võitjatele juhuslikult.
// Loosis on ainult need, kellel on vähemalt 1 pilet (reeglid 5.5). Korraldaja (KLOON) ja „Endine osaleja“ ei osale.
// Üks inimene võidab kuus ühe auhinna. Kui sama kuu loos on juba tehtud, loositakse ainult juurde lisatud auhinnad.
function loosi_(plan, valik) {
  valik = valik || {};
  var proov = !!valik.proov, eel = proov ? 'PROOV, midagi ei salvestatud. ' : '';
  var pub = avalik_();
  if (!pub) return { tekst: 'Ühist tabelit veel pole. Vali „Kuu harjutus → Seadista“.' };
  KUUD_ = null;
  var t = tana_(), d = ymd_(t), k = eelmine_(d[0], d[1]);
  var m = kuuLeht_(pub, k[0], k[1]);
  if (!m) return { tekst: 'Eelmise kuu (' + ET_M[k[1] - 1].toLowerCase() + ') vahekaarti pole, loosida pole kelle vahel.' };
  var kn = ymd_(m.start)[1] - 1, kuus = ET_G[kn] + 's', Kuu = ET_G[kn].charAt(0).toUpperCase() + ET_G[kn].slice(1);
  var auh = auhinnaLoend_(plan);
  if (!auh.length) return { tekst: 'Auhindu pole kirjas. Kirjuta need sellel vahekaardil tabelisse „Auhinnad“ (tulbad V–X) ja tee siis linnuke uuesti.' };
  if (!proov) {
    try { loosiLeht_(pub, plan); } catch (err) { Logger.log('Loosi vahekaart: ' + err); }
    var vl = varuloos_(pub);
    if (vl) return vl;
  } else if (pub.getSheetByName(T_LOOS) && Number(pub.getSheetByName(T_LOOS).getRange('B3').getValue()) > 0) {
    return { tekst: eel + 'Vahekaardil „Loos | Draw“ on varuloosi number, seega tegelik loos võtab varuloosi tulemuse.' };
  }
  var voti = kuuVoti_(k[0], k[1]), olek = loosOlek_(pub);
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
  if (!jaak.length) return { tekst: eel + Kuu + ' auhinnad on juba loositud (' + olek.aeg + '): ' + loetelu(jarjestaVoitjad_(olek.voitjad, auh)) +
    '. Kui lisad tabelisse „Auhinnad“ uusi auhindu, loosib linnuke ainult need juurde.' };
  var kloon = KLOON.toLowerCase();
  var nimed = m.sh.getRange(R0, 1, N, 1).getValues(), pil = m.sh.getRange(R0, PILETID, N, 1).getValues();
  var loos = [], kokku = 0;
  nimed.forEach(function (r, i) {
    var nimi = str_(r[0]), p = Math.floor(Number(pil[i][0]) || 0);
    if (!nimi || p <= 0 || nimi === EKS || nimi.toLowerCase() === kloon || varem.indexOf(nimi) >= 0) return;
    loos.push([nimi, p]); kokku += p;
  });
  if (!kokku && olek.voitjad.length) return { tekst: eel + Kuu + ' auhinnad on juba loositud (' + olek.aeg + '): ' + loetelu(jarjestaVoitjad_(olek.voitjad, auh)) +
    '. Rohkem piletiga osalejaid pole, seega ' + jaak.length + (jaak.length === 1 ? ' auhind jääb' : ' auhinda jääb') + ' loosimata.' };
  if (!kokku) return { tekst: eel + 'Loosis pole kedagi: ' + kuus + ' pole veel ühtegi piletit' + (varem.length ? ' (varem võitsid ' + varem.join(', ') + ')' : '') + '.' };
  for (var s = jaak.length - 1; s > 0; s--) { var r_ = Math.floor(Math.random() * (s + 1)), tmp = jaak[s]; jaak[s] = jaak[r_]; jaak[r_] = tmp; }
  var uued = [];
  while (uued.length < jaak.length && loos.length) {
    var x = Math.floor(Math.random() * kokku), v = loos.length - 1;
    for (var j = 0; j < loos.length; j++) { if (x < loos[j][1]) { v = j; break; } x -= loos[j][1]; }
    var pr = jaak[uued.length];
    uued.push({ nimi: loos[v][0], p: loos[v][1], et: pr.et, en: pr.en });
    kokku -= loos[v][1]; loos.splice(v, 1);
  }
  if (proov) return { tekst: eel + 'Loos töötab: ' + loosis_(loos.length + uued.length, uued) + ' Näiteks võidaksid: ' + loetelu(jarjestaVoitjad_(uued, auh)) + '.' };
  if (valik.kontroll) {                                              // teine mehhanism jõudis vahepeal ette: tema tulemus jääb
    var veel = loosiKirje_(pub);
    if (veel && veel.kuu === voti && veel.voitjad.length > olek.voitjad.length) return { tekst: Kuu + ' auhinnad on juba loositud (' + veel.aeg + '): ' + loetelu(jarjestaVoitjad_(veel.voitjad, auh)) + '.' };
  }
  olek.voitjad = olek.voitjad.concat(uued);
  olek.aeg = Utilities.formatDate(new Date(), TZ, 'd.MM.yyyy');
  loosiKirjuta_(pub, { kuu: olek.kuu, aeg: olek.aeg, voitjad: jarjestaVoitjad_(olek.voitjad, auh) }, valik.viis || 'linnuke D32');
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
// Erik 30.10: pealkiri ja selgitus on tabeli päise kohal (read 20–21, mitte 19–20, sest edetabeli selgituse rida 20 on kõrge) ja nime järel tulp TIIM.
// Tulbad G H I J ja L: K on Ülevaate peidetud abitulp (edetabeli MATCH ja $K$4), seda ei puuduta. Peidetud K tõttu paistab tabel ühtne.
var VV0 = 20, VV_VEERG = 7, VV_MAX = 100, VV_TULBAD = [7, 8, 9, 10, 12];
function voitjadVaade_(pub, alati) {
  var b = pub.getSheetByName(T_BOARD);
  if (!b) return false;
  var olek = loosOlek_(pub), y, mm;
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
  var C = VV_VEERG, T5 = VV_TULBAD;
  var plokk = function (r, n) { return [b.getRange(r, C, n, 4), b.getRange(r, 12, n, 1)]; };   // G:J ja L
  var ylal = b.getRange(VV0 - 1, C, 3, 6);                  // read 19–21 G:L (K on seal tühi), ka vana paigutuse rida 19
  ylal.breakApart(); ylal.clear();
  plokk(VV0 + 2, VV_MAX + 1).forEach(function (x) { x.breakApart(); x.clear(); });
  var rida = function (r, vals, fn) { b.getRange(r, C, 1, 4)[fn]([vals.slice(0, 4)]); b.getRange(r, 12)[fn === 'setValues' ? 'setValue' : 'setFormula'](vals[4]); };
  var yhine = function (r) { var g = b.getRange(r, C, 1, r < VV0 + 2 ? 6 : 4); g.merge(); return g; };   // allpool on K-s edetabeli valemid
  yhine(VV0);
  b.getRange(VV0, C).setFormula(tx(Kuu + 'kuu fortuuna soosis neid osalejaid', 'Fortune smiled on these participants in ' + EN_K))
    .setFontFamily('Oswald').setFontSize(14).setFontWeight('bold').setFontColor('#2B241E').setVerticalAlignment('bottom').setHorizontalAlignment('left').setWrap(false);
  yhine(VV0 + 1);
  b.getRange(VV0 + 1, C).setFormula(olek
      ? tx('Loosisime ' + olek.aeg + ' ' + G + ' piletite järgi. Mida rohkem pileteid, seda suurem oli võimalus võita. Kõik võitjad on ka vahekaardil „Autahvel“.',
           'Drawn on ' + olek.aeg + ' from the ' + EN_K + ' tickets. More tickets meant a better chance to win. All winners are also on the “Autahvel | Fame” tab.')
      : tx('Võitjad loosime uue kuu esimeses trennis ' + G + ' piletite järgi. Mida rohkem pileteid, seda suurem on võimalus võita.',
           'We draw the winners at the first training of the new month from the ' + EN_K + ' tickets. The more tickets, the better your chance to win.'))
    .setFontSize(8).setFontColor('#6E655B').setFontStyle('italic').setWrap(true).setVerticalAlignment('middle').setHorizontalAlignment('left');
  rida(VV0 + 2, [tx('NR', '#'), tx('NIMI', 'NAME'), tx('TIIM', 'TEAM'), tx('LOOSIPILETITE ARV', 'RAFFLE TICKETS'), tx('AUHIND', 'PRIZE')], 'setFormulas');
  plokk(VV0 + 2, 1).forEach(function (x) {
    x.setBackground('#2B241E').setFontColor('#FFFFFF').setFontSize(8).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  });
  if (!ws.length) {
    yhine(VV0 + 3);
    b.getRange(VV0 + 3, C).setFormula(tx('Võitjad tulevad siia pärast loosi.', 'The winners appear here after the draw.'))
      .setFontSize(10).setFontColor('#6E655B').setHorizontalAlignment('center').setVerticalAlignment('middle');
  } else {
    var r0 = VV0 + 3, n = ws.length, tiim = tiimid_(pub, y, mm);
    b.getRange(r0, C, n, 4).setValues(ws.map(function (w, i) { return [i + 1, txt_(w.nimi), txt_(tiim[w.nimi] || ''), w.p]; }));
    b.getRange(r0, 12, n, 1).setFormulas(ws.map(function (w) { return [tx(w.et, w.en || w.et)]; }));
    plokk(r0, n).forEach(function (x, k) {
      x.setFontSize(10).setFontColor('#2B241E').setFontWeight('normal').setVerticalAlignment('middle').setHorizontalAlignment(k ? 'left' : 'center')
        .setBackgrounds(ws.map(function (w, i) { var c = i % 2 ? '#F6F1EA' : '#FFFFFF'; return k ? [c] : [c, c, c, c]; }));
    });
    b.getRange(r0, C, n, 1).setNumberFormat('0').setFontWeight('bold').setFontColor('#8B6B47');
    b.getRange(r0, C + 3, n, 1).setNumberFormat('0');
    b.getRange(r0, C + 1, n, 1).setHorizontalAlignment('left').setFontWeight('bold');
    b.getRange(r0, C + 2, n, 1).setHorizontalAlignment('left').setFontColor('#6E655B');
    b.getRange(r0, 12, n, 1).setWrap(true);
  }
  b.setColumnWidth(C, 40); b.setColumnWidth(C + 1, 130); b.setColumnWidth(C + 2, 120); b.setColumnWidth(C + 3, 110); b.setColumnWidth(12, 210);
  props_().setProperty('LOOS_VAADE', voti);
  return true;
}

// Loositud kuu tiimid nime järgi (tulp C). OTSIN/LOOKING ei ole tiim.
function tiimid_(pub, y, mm) {
  var m = kuuLeht_(pub, y, mm), out = {};
  if (!m) return out;
  m.sh.getRange(R0, 1, N, 3).getValues().forEach(function (r) {
    var nimi = str_(r[0]), t = str_(r[2]);
    if (nimi && t && !/^(OTSIN|LOOKING)$/i.test(t)) out[nimi] = t;
  });
  return out;
}


// Erik 4.11: „peab olema 3x erinevat mehanismi … loos peab toimuma kohe, 10 sek jooksul max“. Loosi tulemus elab nüüd ühise tabeli
// vahekaardil „Loos | Draw“ (mitte ainult skripti mälus), nii et kõik mehhanismid näevad sama tulemust ja teist loosi ei tule:
//   1) linnuke D32 (see skript), 2) veebilehe nupp (see skript, ilma päästikuta), 3) eraldi projekt „Loosiratas“ (oma kood, loosiratas.gs),
//   4) varuloos ilma skriptita: Erik kirjutab lahtrisse B3 numbri ja valemid loosivad kohe (sama reegel: piletid kaaluvad, auhind juhuslik,
//      Erik ja piletita ei osale, üks auhind inimese kohta). Skript kannab varuloosi tulemuse hiljem ise Ülevaatesse ja Autahvlile.
// Salvestatud tulemus: H6:N105 (H kuu kujul 202610, I nr, J nimi, K piletid, L auhind, M prize, N „aeg · viis“ esimesel real). Peidetud abitulbad H–Z.
// Esimene salvestatud tulemus võidab alati: iga mehhanism vaatab enne loosi, kas selle kuu tulemus (või varuloos) on juba olemas.
var T_LOOS = 'Loos | Draw', LS0 = 6, LSN = 100, LSV = 30, LOOS_LEHT_VER = 'L4';
var LS_ET = ET_M.map(function (x) { return '"' + x + '"'; }).join(','), LS_EN = EN_S.map(function (x) { return '"' + x + '"'; }).join(',');
function loosiValemid_() {
  var kuu = function (nimi) {
    return 'IF(AND(INDIRECT("\'"&' + nimi + '&"\'!AW1")="KUULEHT",YEAR(INDIRECT("\'"&' + nimi + '&"\'!AW2"))*100+MONTH(INDIRECT("\'"&' + nimi + '&"\'!AW2"))=$H$2),' + nimi + ',NA())';
  };
  var v = {
    H2: '=YEAR(EDATE(TODAY(),-1))*100+MONTH(EDATE(TODAY(),-1))',
    I2: '=CHOOSE(MOD($H$2,100),' + LS_ET + ')&" "&INT($H$2/100)&" | "&CHOOSE(MOD($H$2,100),' + LS_EN + ')&" "&INT($H$2/100)',
    J2: '=CHOOSE(MOD($H$2,100),' + LS_ET + ')&" | "&CHOOSE(MOD($H$2,100),' + LS_EN + ')',
    B2: '=IFERROR(' + kuu('$K$2') + ',IFERROR(' + kuu('$I$2') + ',IFERROR(' + kuu('$J$2') + ',"")))',
    H3: '=SUMPRODUCT(--(LEN($T$6:$T$105)>0))',
    A4: '=IF(N($B$3)<0,"PROOV (miinusega number): nii loosiksid valemid praegu. Midagi ei salvestata, kustuta number pärast proovi. Öösel kustutab skript selle ise.",IF($H$6=$H$2,"✓ Loos on tehtud: "&$N$6&". Võitjad on all ning vahekaartidel „Ülevaade“ ja „Autahvel“.",IF($B$2="","Loositava kuu vahekaarti ei leitud.",' +
        'IF(ISNUMBER($B$3),"Varuloosi tulemus. Skript kannab selle ise vahekaartidele „Ülevaade“ ja „Autahvel“.","Loosimata. Loosis on "&COUNTIF($W$6:$W$105,TRUE)&" inimest, kokku "&SUMPRODUCT(($W$6:$W$105)*($R$6:$R$105))&" piletit."))))'
  };
  var nimi = 'INDEX($Q$6:$Q$105,MATCH(LARGE($S$6:$S$105,ROW()-5),$S$6:$S$105,0))';
  var auh = function (c) { return 'INDEX($' + c + '$6:$' + c + '$105,MATCH(LARGE($V$6:$V$105,ROW()-5),$V$6:$V$105,0))'; };
  v.naita = ['=IF(B6="","",ROW()-5)',
    '=IF(AND($H$6=$H$2,NOT(N($B$3)<0)),J6&"",IF(OR(NOT(ISNUMBER($B$3)),ROW()-5>$H$3),"",IFERROR(IF(LARGE($S$6:$S$105,ROW()-5)<0,"",' + nimi + '),"")))',
    '=IF(B6="","",IF(AND($H$6=$H$2,NOT(N($B$3)<0)),K6,IFERROR(INDEX($R$6:$R$105,MATCH(B6,$Q$6:$Q$105,0)),"")))',
    '=IF(B6="","",IF(AND($H$6=$H$2,NOT(N($B$3)<0)),L6,IFERROR(' + auh('T') + ',"")))',
    '=IF(B6="","",IF(AND($H$6=$H$2,NOT(N($B$3)<0)),M6,IFERROR(' + auh('U') + ',"")))'];
  v.abi = ['=IF($B$2="","",IFERROR(TRIM(INDIRECT("\'"&$B$2&"\'!A"&(ROW()-1))&""),""))',               // Q nimi
    '=IF($B$2="",0,IFERROR(INT(N(INDIRECT("\'"&$B$2&"\'!AN"&(ROW()-1)))),0))',                             // R piletid
    '=IF(AND(W6,ISNUMBER($B$3)),POWER(MOD(ABS(SIN(ABS($B$3)*129898/10000+ROW()*78233/1000))*437585453/10000,1)*999998/1000000+1/1000000,1/R6)+ROW()/1000000000000,-1)'];   // S võti
  v.auhv = '=IF(T6="",-1,MOD(ABS(SIN(ABS(N($B$3))*393468/10000+ROW()*11135/1000))*246346345/10000,1)+ROW()/1000000000000)';   // V
  v.sees = '=AND(Q6<>"",R6>=1,Q6<>"' + EKS + '",LOWER(Q6)<>"' + KLOON.toLowerCase() + '")';                // W
  return v;
}

// Teeb/uuendab vahekaardi „Loos | Draw“: valemid (kord iga versiooni kohta), auhindade tükid plaanist, loositava kuu nimi.
// Salvestatud tulemust (H:N) ja varuloosi numbrit (B3) ei puutu.
function loosiLeht_(pub, plan) {
  var sh = pub.getSheetByName(T_LOOS), uus = !sh;
  if (uus) sh = pub.insertSheet(T_LOOS, pub.getSheets().length);
  if (sh.getMaxColumns() < 26) sh.insertColumnsAfter(sh.getMaxColumns(), 26 - sh.getMaxColumns());
  if (sh.getMaxRows() < LS0 + LSN) sh.insertRowsAfter(sh.getMaxRows(), LS0 + LSN - sh.getMaxRows());
  if (str_(sh.getRange('Z1').getValue()) !== LOOS_LEHT_VER) {
    var v = loosiValemid_(), rida = function (a) { var o = []; for (var i = 0; i < a; i++) o.push(i); return o; };
    sh.getRange('A1:E5').breakApart();
    sh.getRange('A1:F5').clearContent();
    sh.getRange('A1:E1').merge();
    sh.getRange('A1').setValue('LOOS | DRAW').setFontFamily('Oswald').setFontSize(16).setFontWeight('bold').setFontColor('#2B241E');
    sh.getRange('A2').setValue('Loositav kuu | Month');
    sh.getRange('A3').setValue('Varuloos | Backup draw');
    sh.getRange('A2:A3').setFontWeight('bold').setFontSize(10).setFontColor('#6E655B');
    sh.getRange('B2').setFormula(v.B2).setFontWeight('bold');
    sh.getRange('B3').setBackground('#FFF4D6').setHorizontalAlignment('center').setFontWeight('bold').setFontSize(14)
      .setDataValidation(SpreadsheetApp.newDataValidation().requireNumberBetween(-999999, 999999).setAllowInvalid(false)
        .setHelpText('Loos: suvaline number 1–999999, võitjad tulevad kohe alla. Proov: miinusega number (näiteks -7), midagi ei salvestata.').build());
    sh.getRange('C3:E3').merge();
    sh.getRange('C3').setValue('Ainult Erikule, kui linnuke D32, veebileht ja Loosiratas kõik ei tööta: kirjuta lahtrisse B3 suvaline number (näiteks 7). ' +
      'Võitjad tulevad kohe alla, skripti pole vaja. Skript kannab nad hiljem ise vahekaartidele „Ülevaade“ ja „Autahvel“. ' +
      'Proovimiseks kirjuta miinusega number (näiteks -7): siis näed, kuidas valemid loosiksid, aga midagi ei salvestata.')
      .setFontSize(9).setFontStyle('italic').setFontColor('#6E655B').setWrap(true).setVerticalAlignment('middle');
    sh.getRange('A4:E4').merge();
    sh.getRange('A4').setFormula(v.A4).setFontSize(10).setFontColor('#2B241E').setWrap(true);
    sh.getRange('H2:J2').setFormulas([[v.H2, v.I2, v.J2]]);
    sh.getRange('H3').setFormula(v.H3);
    sh.getRange('A5:E5').setValues([['NR', 'NIMI | NAME', 'LOOSIPILETITE ARV | TICKETS', 'AUHIND', 'PRIZE']])
      .setBackground('#2B241E').setFontColor('#FFFFFF').setFontSize(8).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
    sh.getRange('H5:N5').setValues([['kuu', 'nr', 'nimi', 'piletid', 'auhind', 'prize', 'aeg / viis']]);
    sh.getRange('Q5:W5').setValues([['nimi', 'piletid', 'võti', 'auhind', 'prize', 'auhinna võti', 'loosis']]);
    sh.getRange(LS0, 1, LSV, 5).setFormulas(rida(LSV).map(function (i) { return v.naita.map(function (f) { return f.replace(/([A-Z])6(?![0-9])/g, '$1' + (LS0 + i)); }); }));
    sh.getRange(LS0, 1, LSV, 5).setFontSize(11).setVerticalAlignment('middle')
      .setBackgrounds(rida(LSV).map(function (i) { var c = i % 2 ? '#F6F1EA' : '#FFFFFF'; return [c, c, c, c, c]; }));
    sh.getRange(LS0, 1, LSV, 1).setHorizontalAlignment('center').setFontWeight('bold').setFontColor('#8B6B47');
    sh.getRange(LS0, 2, LSV, 1).setFontWeight('bold');
    sh.getRange(LS0, 3, LSV, 1).setHorizontalAlignment('center');
    var ab = rida(LSN).map(function (i) { return v.abi.map(function (f) { return f.replace(/([A-Z])6(?![0-9])/g, '$1' + (LS0 + i)); }); });
    sh.getRange(LS0, 17, LSN, 3).setFormulas(ab);
    sh.getRange(LS0, 22, LSN, 2).setFormulas(rida(LSN).map(function (i) { var r = LS0 + i; return [v.auhv.replace(/T6/g, 'T' + r), v.sees.replace(/([QR])6/g, '$1' + r)]; }));
    sh.setColumnWidth(1, 40); sh.setColumnWidth(2, 170); sh.setColumnWidth(3, 110); sh.setColumnWidth(4, 200); sh.setColumnWidth(5, 180);
    sh.setRowHeight(3, 48); sh.setRowHeight(4, 34);
    sh.getRange('Z1').setValue(LOOS_LEHT_VER);
    sh.hideColumns(7, 20);                                   // G–Z: salvestatud tulemus ja abitulbad
    kaitse_(sh, []);                                         // ainult omanik (Erik ja skript) saab muuta
  }
  var b3 = sh.getRange('B3');
  if (typeof b3.getValue() === 'number' && b3.getValue() < 0 && Utilities.formatDate(new Date(), TZ, 'HH') < '06') b3.setValue('');   // unustatud proov öösel ära
  var olek = null;
  if (!Number(sh.getRange(LS0, 8).getValue())) {             // vana loos (enne 4.11) oli ainult skripti mälus: kanna üle
    try { olek = JSON.parse(props_().getProperty('LOOS') || 'null'); } catch (err) { olek = null; }
    if (olek && olek.kuu && olek.voitjad && olek.voitjad.length) loosiKirjuta_(pub, olek, 'linnuke', true);
  }
  if (plan) {                                                // auhinnad tükkidena (5 × 5€ = 5 rida), tabeli järjekorras
    var tk = [];
    auhinnaLoend_(plan).forEach(function (a) { for (var j = 0; j < a.n && tk.length < LSN; j++) tk.push([txt_(a.et), txt_(a.en)]); });
    while (tk.length < LSN) tk.push(['', '']);
    var ala = sh.getRange(LS0, 20, LSN, 2);
    if (JSON.stringify(ala.getValues().map(function (r) { return [str_(r[0]), str_(r[1])]; })) !== JSON.stringify(tk.map(function (r) { return [str_(r[0]), str_(r[1])]; }))) ala.setValues(tk);
  }
  var d = ymd_(tana_()), k = eelmine_(d[0], d[1]), m = kuuLeht_(pub, k[0], k[1]);   // täpne vahekaardi nimi (valem leiab ka ise)
  var kv = [[m ? m.name : '', m ? k[0] * 100 + k[1] : '']], k2 = sh.getRange('K2:L2');
  if (JSON.stringify(k2.getValues()) !== JSON.stringify(kv)) k2.setValues(kv);
  return sh;
}

// Salvestatud tulemus vahekaardilt: { kuu: '2026-10', aeg, viis, voitjad: [{ nimi, p, et, en }] } või null.
function loosiKirje_(pub) {
  var sh = pub && pub.getSheetByName(T_LOOS);
  if (!sh || sh.getMaxColumns() < 14) return null;
  var v = sh.getRange(LS0, 8, LSN, 7).getValues(), k = Math.floor(Number(v[0][0]) || 0);
  if (k < 200001) return null;
  var av = str_(v[0][6]).split(' · ');
  return { kuu: kuuVoti_(Math.floor(k / 100), k % 100), aeg: (av[0] || '').split(' ')[0], viis: av[1] || '',
    voitjad: v.filter(function (r) { return str_(r[2]); }).map(function (r) { return { nimi: str_(r[2]), p: Math.floor(Number(r[3]) || 0), et: str_(r[4]), en: str_(r[5]) || str_(r[4]) }; }) };
}
function loosiKirjuta_(pub, olek, viis, vanaAeg) {
  var sh = pub.getSheetByName(T_LOOS) || loosiLeht_(pub, null);
  var k = Number(olek.kuu.slice(0, 4)) * 100 + Number(olek.kuu.slice(5)), aeg = vanaAeg ? olek.aeg : Utilities.formatDate(new Date(), TZ, 'd.MM.yyyy HH:mm');
  var read = olek.voitjad.slice(0, LSN).map(function (w, i) { return [k, i + 1, txt_(w.nimi), w.p, txt_(w.et), txt_(w.en || w.et), i ? '' : aeg + ' · ' + viis]; });
  while (read.length < LSN) read.push(['', '', '', '', '', '', '']);
  sh.getRange(LS0, 8, LSN, 7).setValues(read);
  if (sh.getRange('B3').getValue() !== '') sh.getRange('B3').setValue('');   // varuloosi number pole enam vaja
}

// Varuloos (number lahtris B3, valemid loosisid): kui selle kuu tulemust veel salvestatud pole, salvestab valemite tulemuse,
// kirjutab võitjad Autahvlile ja Ülevaatesse. Tagastab { tekst } või null, kui varuloosi pole.
function varuloos_(pub) {
  var sh = pub.getSheetByName(T_LOOS);
  if (!sh) return null;
  var p = sh.getRange('A2:N3').getValues(), seemne = p[1][1];
  if (typeof seemne !== 'number' || !(seemne > 0)) return null;
  var d = ymd_(tana_()), k = eelmine_(d[0], d[1]), voti = k[0] * 100 + k[1];
  if (Number(sh.getRange(LS0, 8).getValue()) === voti) return null;
  if (Number(p[0][7]) !== voti) return null;                  // valemite kuu ei klapi (TODAY), ei julge
  var ws = sh.getRange(LS0, 1, LSV, 5).getValues().filter(function (r) { return str_(r[1]); })
    .map(function (r) { return { nimi: str_(r[1]), p: Math.floor(Number(r[2]) || 0), et: str_(r[3]), en: str_(r[4]) || str_(r[3]) }; });
  if (!ws.length) return null;
  var olek = { kuu: kuuVoti_(k[0], k[1]), aeg: Utilities.formatDate(new Date(), TZ, 'd.MM.yyyy'), voitjad: ws };
  loosiKirjuta_(pub, olek, 'varuloos');
  props_().setProperty('LOOS', JSON.stringify(olek));
  var m = kuuLeht_(pub, k[0], k[1]);
  if (m) autahvliVoitjad_(pub, m.name, ws.map(function (w) { return w.nimi; }), false);
  voitjadVaade_(pub, true);
  var Kuu = ET_G[k[1] - 1].charAt(0).toUpperCase() + ET_G[k[1] - 1].slice(1);
  return { tekst: Kuu + ' loos tehti varuloosiga (vahekaart „Loos | Draw“, number ' + seemne + '): ' +
    ws.map(function (w, i) { return (i + 1) + '. ' + w.nimi + ' (' + piletit_(w.p) + ') – ' + w.et; }).join('; ') + '. Võitjad on nüüd ka vahekaartidel „Ülevaade“ ja „Autahvel“.' };
}

// Autahvli kuu reale (tulp J) võitjate nimed: lisa = true lisab olemasolevatele.
function autahvliVoitjad_(pub, kuuNimi, nimed, lisa) {
  var f = pub.getSheetByName(T_FAME);
  if (!f) return;
  var a = f.getRange(FAME0, 1, FAMEN, 1).getValues();
  for (var i = 0; i < FAMEN; i++) if (String(a[i][0]) === kuuNimi) {
    var c = f.getRange(FAME0 + i, FAME_WIN), koik = lisa ? str_(c.getValue()).split(/\s*[,\n]\s*/).filter(String) : [];
    nimed.forEach(function (x) { if (koik.indexOf(x) < 0) koik.push(x); });
    c.setValue(koik.join('\n')); autahvliKorgus_(f);
    return;
  }
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
      sek[1].forEach(function (it, k) {
        var jargmine = sek[1][k + 1];                       // Erik 30.10: iga lõigu järel tühi rida (loetelu punktid jäävad koos)
        if (it[0]) {
          var t = body.appendParagraph(it[0] + '  ' + grupiTekst_(it[L])).setHeading(H.NORMAL).editAsText();
          t.setBold(false); t.setBold(0, it[0].length - 1, true);
        } else {
          body.appendListItem(grupiTekst_(it[L])).setGlyphType(DocumentApp.GlyphType.BULLET).editAsText().setBold(false);
        }
        if (!(jargmine && !jargmine[0])) body.appendParagraph('').setHeading(H.NORMAL);
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
    if (korda_(function () { return DriveApp.getFileById(id).isTrashed(); })) return null;
    return korda_(function () { return SpreadsheetApp.openById(id); });
  } catch (err) { return null; }
}

function privaatne_() {
  var id = props_().getProperty('PRIV_ID');
  return id ? korda_(function () { return SpreadsheetApp.openById(id); }) : SpreadsheetApp.getActive();
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
var AUTO_JOOKS = false;                                     // true, kui Seadista käivitas autoSeadista (mitte Erik)

// Erik 8.11: minutipäästik ületas 7.11 korra 6 minuti piiri ja sai kaks korda Google'i serveri vea (iga kord pärast mitut minutit
// ootamist). Tavaliselt kestab ta 4–30 sekundit. Nüüd: (1) kui eelmine minutikäivitus veel käib või Seadista käib, jäävad rasked
// sammud (linnukesed, päästikute kontroll) sel minutil vahele, et käivitused ei kuhjuks samale tabelile; (2) linnukesed ja kiire
// uuendus lõpetavad 4 minuti järel ja ülejäänu tehakse järgmisel minutil; (3) tabeli avamine proovib ajutise serveri vea korral uuesti.
var MINUT_PIIR = 4 * 60 * 1000, MINUT_ALGUS = 0;            // MINUT_ALGUS = 0: mitte minutipäästik, piirangut pole
function minutAegaOn_() { return !MINUT_ALGUS || Date.now() - MINUT_ALGUS < MINUT_PIIR; }
function ajutine_(err) {
  return /server error|Service (Spreadsheets|unavailable|error)|timed out|try again|Internal error|Backend error/i.test(String(err && err.message ? err.message : err));
}
// Käivitab fn; ajutise Google'i vea korral proovib veel kaks korda (1,5 s ja 4 s pausiga), kui aega on.
function korda_(fn) {
  for (var i = 0; ; i++) {
    try { return fn(); } catch (err) {
      if (i >= 2 || !ajutine_(err) || !minutAegaOn_()) throw err;
      Utilities.sleep(i ? 4000 : 1500);
    }
  }
}

// Kiire kontroll iga päästiku alguses. Ei viska kunagi viga.
function versioon(kiire, e) {
  var p0 = PropertiesService.getScriptProperties(), raske = true;
  if (kiire) {
    MINUT_ALGUS = Date.now();
    var eelmine = Number(p0.getProperty('MINUT_KAIB')) || 0, sk = Number(p0.getProperty('SEADISTA_KAIB')) || 0;
    raske = !(eelmine && MINUT_ALGUS - eelmine < 6 * 60 * 1000) && !(sk && MINUT_ALGUS - sk < 7 * 60 * 1000);
    if (raske) p0.setProperty('MINUT_KAIB', String(MINUT_ALGUS));
    else Logger.log('Eelmine minutikäivitus või Seadista käib veel: linnukesed ja päästikute kontroll jäävad sel minutil vahele.');
  }
  try { versioon1_(kiire, e, raske); }
  finally { if (kiire && raske) try { p0.deleteProperty('MINUT_KAIB'); } catch (err) {} }
}
function versioon1_(kiire, e, raske) {
  try { elusta_(kiire, e); } catch (err) { Logger.log('Elustamine: ' + (err && err.message ? err.message : err)); }
  // Erik 4.11: iga minut tehtud päästikute kontroll (avab privaatse tabeli ja loeb kõik vahekaardid) kulutas Gmaili konto
  // päästikute päevalimiidi (90 min) hommikuks ära ja siis ei käivitunud ükski päästik. Nüüd kord tunnis; Seadista ja öö teevad ka.
  if (kiire && raske) try {
    var pk = PropertiesService.getScriptProperties(), pv = Number(pk.getProperty('PAASTIKUD_AEG')) || 0;
    if (Date.now() - pv >= 60 * 60 * 1000) { pk.setProperty('PAASTIKUD_AEG', String(Date.now())); paastikudKorda(); }
  } catch (err) { Logger.log('Päästikud: ' + (err && err.message ? err.message : err)); }
  if (kiire && raske) try { linnukesed_(); } catch (err) { Logger.log('Linnukesed: ' + (err && err.message ? err.message : err)); }
  try {
    var p = PropertiesService.getScriptProperties();
    if (kiire && Date.now() - (Number(p.getProperty('KLOON_OOTEL')) || Date.now()) > 3 * 60 * 1000) kloonOotel();   // ühekordne päästik kadus
    if (!p.getProperty('PRIV_ID') || p.getProperty('SEADISTATUD') === EHITUS) return;
    // Kiire osa tehakse minutipäästikust kord iga uue koodi kohta, ka siis, kui osaleja muudatus märkas koodi enne (2.11: muidu jäi see vahele).
    var vajaKiire = kiire && p.getProperty('KIIRE_TEHTUD') !== EHITUS;
    if (p.getProperty('AUTO_OOTEL') === EHITUS && !vajaKiire) return;
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(3000)) return;                          // proovin järgmisel korral
    try {
      if (p.getProperty('AUTO_OOTEL') !== EHITUS) {
        p.setProperty('AUTO_OOTEL', EHITUS);
        p.setProperty('AUTO_KORD', '0');
        autoJargmine_(60 * 1000);
      }
      if (vajaKiire) p.setProperty('KIIRE_TEHTUD', EHITUS);
    } finally { lock.releaseLock(); }
    if (vajaKiire) kiire_();                                 // ilma lukuta nagu enne: ei oota pooleliolevat Seadistat
  } catch (err) { Logger.log('Versiooni kontroll: ' + (err && err.message ? err.message : err)); }
}

// Kohe uue koodi järel (Erik 30.10: 15 minutit on liiga kaua): ainult tekstid ja 2x/eripäevad kõigis gruppides.
// Täis-Seadista (mall, valemid, kaitsed) tuleb minut hiljem nagu enne.
function kiire_() {
  var priv = korda_(function () { return SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('PRIV_ID')); });
  var jai = 0;
  grupid_(priv).forEach(function (g) {
    if (!g) return;
    if (!minutAegaOn_()) { jai++; return; }
    try {
      grupiga_(g, function () {
        KUUD_ = null;
        var pub = avalik_();
        if (!pub) return;
        try { var pl = plaan_(privaatne_()); autoPaus_(pub, pl, tana_()); } catch (e) { Logger.log('Automaatne paus: ' + e.message); }
        try { pausidOosel_(pub); } catch (e) { Logger.log('Pausid: ' + e.message); }
        tekstid_(pub);
        lisaVorming_(pub);                                   // enne muud, et üks ebaõnnestunud samm seda ei takistaks
        topeltElus_(g);
        try { vanadKuud_(pub); } catch (e) { Logger.log('Vana kuu: ' + e.message); }
        try { loosiLeht_(pub, g); } catch (e) { Logger.log('Loosi vahekaart: ' + e.message); }
        try { loosiViisid_(g, pub); } catch (e) { Logger.log('Loosi viisid: ' + e.message); }
      });
    } catch (err) { Logger.log('Kiire uuendus: ' + (err && err.message ? err.message : err)); }
  });
  KUUD_ = null;
  if (jai) {                                                  // aeg otsas: järgmine minut teeb kiire osa uuesti (kuni Seadista on tehtud)
    Logger.log('Kiire uuendus: ' + jai + ' grupp(i) jäi ajapuudusel järgmisele minutile.');
    PropertiesService.getScriptProperties().deleteProperty('KIIRE_TEHTUD');
  }
}

function autoJargmine_(ms) {
  ScriptApp.getProjectTriggers().forEach(function (tr) { if (tr.getHandlerFunction() === AUTO_PAASTIK) ScriptApp.deleteTrigger(tr); });
  ScriptApp.newTrigger(AUTO_PAASTIK).timeBased().after(ms).create();
}

function autoSeadista() {
  var p = PropertiesService.getScriptProperties();
  ScriptApp.getProjectTriggers().forEach(function (tr) { if (tr.getHandlerFunction() === AUTO_PAASTIK) ScriptApp.deleteTrigger(tr); });
  if (p.getProperty('SEADISTATUD') === EHITUS && p.getProperty('AUTO_UUESTI') !== EHITUS) { p.deleteProperty('AUTO_OOTEL'); return; }
  var kaib = Number(p.getProperty('SEADISTA_KAIB') || 0);
  if (kaib && Date.now() - kaib < 7 * 60 * 1000) { autoJargmine_(2 * 60 * 1000); return; }   // keegi käivitas Seadista ise, ootan
  var kord = Number(p.getProperty('AUTO_KORD') || 0) + 1;
  p.setProperty('AUTO_KORD', String(kord));
  var viga = '';
  AUTO_JOOKS = true;
  try { viga = seadista() || ''; } catch (err) { viga = String(err && err.message ? err.message : err); }
  finally { AUTO_JOOKS = false; }
  var valmis = p.getProperty('SEADISTATUD') === EHITUS;
  // Erik 2.11: uuendustest kirju ei tule. Õnnestunud uuendusest ei tule midagi; kui mõni samm jäi tegemata, proovib skript
  // vaikselt uuesti (kokku kuni AUTO_MAX korda). Kiri tuleb ainult siis, kui Seadista ei jõudnud ka siis lõpuni ja Erik peab ise käivitama.
  if (valmis && !viga) { p.deleteProperty('AUTO_OOTEL'); p.deleteProperty('AUTO_UUESTI'); return; }
  if (kord < AUTO_MAX) {
    if (valmis) p.setProperty('AUTO_UUESTI', EHITUS);
    autoJargmine_(60 * 1000); return;
  }
  p.deleteProperty('AUTO_UUESTI');                          // AUTO_OOTEL jääb: sama koodiga uuesti ei alustata
  if (valmis) { Logger.log('Automaatne Seadista: ' + viga); return; }      // osa samme jäi tegemata: järgmine kood või käsitsi Seadista teeb need uuesti
  MailApp.sendEmail({ to: Session.getEffectiveUser().getEmail(), name: 'Kuu harjutus', subject: 'Kuu harjutus: Seadista jäi pooleli',
    body: 'Skripti uus versioon on sees, aga Seadista ei jõudnud ' + AUTO_MAX + ' korraga lõpuni. ' +
      'Ava oma tabel ja vali „Kuu harjutus → Seadista“.' + (viga ? '\n\nViimane teade: ' + viga : '') });
}

return {
  versioon: versioon, autoSeadista: autoSeadista, paastikudKorda: paastikudKorda, veeb: veeb, veebiLoos: veebiLoos, tuhistaLoos: tuhistaLoos, loosiLingid: loosiLingid,
  menuu: menuu, seadista: seadista, naitaLinki: naitaLinki, looUusKuuleht: looUusKuuleht, uuendaEelvaade: uuendaEelvaade,
  saadaProov: saadaProov, lisaGrupp: lisaGrupp, aktiivsele: aktiivsele_, oine: oine, hommik: hommik, muudatus: muudatus, plaaniMuudatus: plaaniMuudatus, loosiMenuust: loosiMenuust, ylevaade: ylevaade, nimekiri: nimekiri, kloonOotel: kloonOotel, paastikudNaita: paastikudNaita,
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
function kuuHarjutusMuudatus(e) { KuuHarjutus.versioon(false, e); KuuHarjutus.muudatus(e); }
function kuuHarjutusPlaan(e) { KuuHarjutus.versioon(); KuuHarjutus.plaaniMuudatus(e); }
function doGet() { return KuuHarjutus.veeb(); }                   // veebileht loosiks telefonis (Erik 4.11)
function kuuHarjutusVeebiLoos(g, proov) { return KuuHarjutus.veebiLoos(g, proov); }
function kuuHarjutusLoosiLingid(veeb, ratas) { return KuuHarjutus.loosiLingid(veeb, ratas); }   // editorist: veebilehe ja Loosiratta /exec lingid plaani plokki „Loosi viisid“
function kuuHarjutusTuhistaLoos(g) { return KuuHarjutus.tuhistaLoos(g); }   // editorist: põhigrupp; Swed: kuuHarjutusTuhistaLoos('Swed')
function kuuHarjutusLoos() { KuuHarjutus.aktiivsele(KuuHarjutus.loosiMenuust); }
function kuuHarjutusYlevaade() { KuuHarjutus.ylevaade(); }
function kuuHarjutusNimekiri() { KuuHarjutus.nimekiri(); }
function kuuHarjutusKloon() { KuuHarjutus.kloonOotel(); }
function kuuHarjutusPaastikudNaita() { return KuuHarjutus.paastikudNaita(); }   // editoris: päästikute ülevaade (Erik 4.11)
function kuuHarjutusVersioon() { KuuHarjutus.versioon(true); }
function kuuHarjutusPaastikud() { return KuuHarjutus.paastikudKorda(); }   // „Arhiiv & tähtajad“ öine käivitus kutsub seda (Erik 2.11)
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
"=IF('Juhend | Guide'!$C$3=\"English\",\"Badges:\n✅ Finisher: 80% of days done\n🥇 Iron: 100%\n🏆 Perfect: every day, no joker or H\n🔁 Comeback: missed 3+ days in a row but still finished\n💥 Volume champ: highest average EXTRA, i.e. most above your target per day on average\nA badge needs at least 10 counted days in the month. All badge winners are shown on the Fame tab.\",\"Embleemid:\n✅ Läbitud: 80% päevadest tehtud\n🥇 Raudne: 100%\n🏆 Täiuslik: iga päev, ilma jokkeri ja H-ta\n🔁 Tagasitulek: vahele jäi 3+ päeva järjest, aga kuu sai ikka läbitud\n💥 Mahukuningas: kõige suurem keskmine LISA ehk keskmiselt päevas kõige rohkem üle oma eesmärgi\nEmbleemi saab, kui kuus on vähemalt 10 arvestatud päeva. Kõik embleemide võitjad on näha vahekaardil „Autahvel“.\")",
185.6
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Badges: ✅ Finisher (80%), 🥇 Iron (100%), 🏆 Perfect (every day, no joker or H), 🔁 Comeback, 💥 Volume champ. All on the Fame tab.\",\"Embleemid: ✅ Läbitud (80%), 🥇 Raudne (100%), 🏆 Täiuslik (iga päev, ilma jokkeri ja H-ta), 🔁 Tagasitulek, 💥 Mahukuningas. Kõik on lehel Autahvel.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Badges:\n✅ Finisher: 80% of days done\n🥇 Iron: 100%\n🏆 Perfect: every day, no joker or H\n🔁 Comeback: missed 3+ days in a row but still finished\n💥 Volume champ: highest average EXTRA, i.e. most above your target per day on average\nA badge needs at least 10 counted days in the month. All badge winners are shown on the Fame tab.\",\"Embleemid:\n✅ Läbitud: 80% päevadest tehtud\n🥇 Raudne: 100%\n🏆 Täiuslik: iga päev, ilma jokkeri ja H-ta\n🔁 Tagasitulek: vahele jäi 3+ päeva järjest, aga kuu sai ikka läbitud\n💥 Mahukuningas: kõige suurem keskmine LISA ehk keskmiselt päevas kõige rohkem üle oma eesmärgi\nEmbleemi saab, kui kuus on vähemalt 10 arvestatud päeva. Kõik embleemide võitjad on näha vahekaardil „Autahvel“.\")",
185.6
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
"=IFERROR(COUNTIF(INDIRECT(\"'\"&$K$4&\"'!AO5:AO104\"),\"?*\"),0)",
"=IFERROR(COUNTIFS(INDIRECT(\"'\"&$K$4&\"'!AK5:AK104\"),\"<1\",INDIRECT(\"'\"&$K$4&\"'!AO5:AO104\"),\"?*\"),0)",
null
],
[
"Ülevaade | Board",
"=IF('Juhend | Guide'!$C$3=\"English\",\"FINISHED 80%+\",\"LÄBINUD 80%+\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"80%+\",\"80%+\")",
null
],
[
"Ülevaade | Board",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Order: completion, then done days, then extra reps.\",\"Järjestus: täitmine, siis tehtud päevad, siis lisakordused.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"The athletes ranked highest are those who achieved their set goals on the highest percentage of the days they participated in (column COMPLETION %).\n\nIf two or more athletes have the same COMPLETION %, those who completed more days overall are ranked higher (column DONE).\n\nIf the number of completed days is also equal, those who exceeded their targets by a greater margin are ranked higher. The more they exceeded their targets, the higher their ranking.\",\"Eespool on need atleedid, kes saavutasid oma eesmärgi suuremal osal päevadest, mil nad tegid kaasa (tulp TULEMUS %).\n\nKui TULEMUS % tulp on võrdne, on eespool osalejad, kes on kokku läbinud rohkem treeningpäevi (tulp TEHTUD).\n\nKui ka läbitud päevade arv on võrdne, on eespool atleedid, kes ületasid oma seatud eesmärki rohkem. Mida suurem oli eesmärgi ületamine, seda kõrgem on koht pingereas.\")",
110
],
[
"Ülevaade | Board",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Higher result ranks first. With equal results, more days at your target ranks first. If that's equal too, more reps above your target decide.\",\"Eespool on see, kelle tulemus on kõrgem. Võrdse tulemuse korral on eespool see, kes on rohkem päevi oma eesmärgini jõudnud. Kui ka need on võrdsed, otsustab see, kes on teinud rohkem kordusi üle oma eesmärgi.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"The athletes ranked highest are those who achieved their set goals on the highest percentage of the days they participated in (column COMPLETION %).\n\nIf two or more athletes have the same COMPLETION %, those who completed more days overall are ranked higher (column DONE).\n\nIf the number of completed days is also equal, those who exceeded their targets by a greater margin are ranked higher. The more they exceeded their targets, the higher their ranking.\",\"Eespool on need atleedid, kes saavutasid oma eesmärgi suuremal osal päevadest, mil nad tegid kaasa (tulp TULEMUS %).\n\nKui TULEMUS % tulp on võrdne, on eespool osalejad, kes on kokku läbinud rohkem treeningpäevi (tulp TEHTUD).\n\nKui ka läbitud päevade arv on võrdne, on eespool atleedid, kes ületasid oma seatud eesmärki rohkem. Mida suurem oli eesmärgi ületamine, seda kõrgem on koht pingereas.\")",
110
],
[
"Ülevaade | Board",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Ahead are those who reached their target on a bigger share of the days they took part (COMPLETION %). If that % is equal, more days done in total ranks first. If that's equal too, whoever went more above their own target ranks first.\",\"Eespool on need osalejad, kes jõudsid suuremal osal oma osalemise päevadest oma eesmärgini (TULEMUS %). Kui see protsent on võrdne, on eespool see, kellel on kokku rohkem tehtud päevi. Kui ka need on võrdsed, on eespool see, kes tegi oma eesmärgist rohkem üle: mida rohkem üle, seda eespool.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"The athletes ranked highest are those who achieved their set goals on the highest percentage of the days they participated in (column COMPLETION %).\n\nIf two or more athletes have the same COMPLETION %, those who completed more days overall are ranked higher (column DONE).\n\nIf the number of completed days is also equal, those who exceeded their targets by a greater margin are ranked higher. The more they exceeded their targets, the higher their ranking.\",\"Eespool on need atleedid, kes saavutasid oma eesmärgi suuremal osal päevadest, mil nad tegid kaasa (tulp TULEMUS %).\n\nKui TULEMUS % tulp on võrdne, on eespool osalejad, kes on kokku läbinud rohkem treeningpäevi (tulp TEHTUD).\n\nKui ka läbitud päevade arv on võrdne, on eespool atleedid, kes ületasid oma seatud eesmärki rohkem. Mida suurem oli eesmärgi ületamine, seda kõrgem on koht pingereas.\")",
110
],
[
"Ülevaade | Board",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Ahead are the athletes who reached their target on more of the days they took part (COMPLETION %). If that is equal, those with more done days overall rank ahead. If that's equal too, those who went more above their target rank ahead: the more above, the higher.\",\"Eespool on need atleedid, kes jõudsid rohkem nendest päevadest, kus nad osa võtsid, oma seatud eesmärgini (TULEMUS %). Kui see on võrdne, jäävad eespoole need, kellel on üldse rohkem tehtud päevi. Kui ka need on võrdsed, jäävad eespoole need, kes tegid oma eesmärgist rohkem üle: mida rohkem üle, seda eespool.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"The athletes ranked highest are those who achieved their set goals on the highest percentage of the days they participated in (column COMPLETION %).\n\nIf two or more athletes have the same COMPLETION %, those who completed more days overall are ranked higher (column DONE).\n\nIf the number of completed days is also equal, those who exceeded their targets by a greater margin are ranked higher. The more they exceeded their targets, the higher their ranking.\",\"Eespool on need atleedid, kes saavutasid oma eesmärgi suuremal osal päevadest, mil nad tegid kaasa (tulp TULEMUS %).\n\nKui TULEMUS % tulp on võrdne, on eespool osalejad, kes on kokku läbinud rohkem treeningpäevi (tulp TEHTUD).\n\nKui ka läbitud päevade arv on võrdne, on eespool atleedid, kes ületasid oma seatud eesmärki rohkem. Mida suurem oli eesmärgi ületamine, seda kõrgem on koht pingereas.\")",
110
],
[
"Ülevaade | Board",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Above are the athletes who achieved their goals on more of the days they participated (COMPLETION %). If that is equal, those with more done days overall rank ahead. If that's equal too, those who went more above their target rank ahead: the more above, the higher.\",\"Eespool on need atleedid, kes jõudsid rohkem nendest päevadest, kus nad osa võtsid, oma seatud eesmärgini (TULEMUS %). Kui see on võrdne, jäävad eespoole need, kellel on üldse rohkem tehtud päevi. Kui ka need on võrdsed, jäävad eespoole need, kes tegid oma eesmärgist rohkem üle: mida rohkem üle, seda eespool.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"The athletes ranked highest are those who achieved their set goals on the highest percentage of the days they participated in (column COMPLETION %).\n\nIf two or more athletes have the same COMPLETION %, those who completed more days overall are ranked higher (column DONE).\n\nIf the number of completed days is also equal, those who exceeded their targets by a greater margin are ranked higher. The more they exceeded their targets, the higher their ranking.\",\"Eespool on need atleedid, kes saavutasid oma eesmärgi suuremal osal päevadest, mil nad tegid kaasa (tulp TULEMUS %).\n\nKui TULEMUS % tulp on võrdne, on eespool osalejad, kes on kokku läbinud rohkem treeningpäevi (tulp TEHTUD).\n\nKui ka läbitud päevade arv on võrdne, on eespool atleedid, kes ületasid oma seatud eesmärki rohkem. Mida suurem oli eesmärgi ületamine, seda kõrgem on koht pingereas.\")",
110
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
"1. Mis on kuu harjutus?",
"1. What is the monthly challenge?"
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
"💥 Mahukuningas: selle saab see, kes tegi keskmiselt päevas oma eesmärgist kõige rohkem üle (kuu vahekaardi tulp LISA). Näiteks kui su eesmärk on 50 ja teed enamasti 60, on sul keskmiselt umbes +20%. Päevad alla eesmärgi vähendavad keskmist, nii et LISA võib olla ka miinuses. Arvesse lähevad need, kes on kuus osalenud vähemalt 10 päeva. Nii ei mängi tase rolli. Igal kuul saab selle embleemi üks inimene.",
"💥 Volume champ: whoever went the most over their own daily target on average per day (the EXTRA column of the month tab). For example, with a target of 50 and mostly doing 60, you are about +20% on average. Days below your target lower the average, so EXTRA can also be negative. Only people who took part for at least 10 days count. Your level doesn't matter. One person gets it each month."
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
"Kui sa ei ole kuu viimase 7 päeva jooksul midagi kirja pannud (ei numbrit, J-d ega H-d), alustad uut kuud pausil: skript paneb su uue kuu esimesel ööl nimekirjas pausile ja uue kuu rida kaob. Kui paned kuu viimase päeva tulemuse kirja alles järgmisel päeval, tuled järgmisel ööl ise tagasi. Nii ei jää lahkunud inimesed ühisesse eesmärki ega protsentidesse. Kui sa pole terve kuu jooksul ühtegi korda kirjutanud, jääd pausita (võib-olla alustasid poole pealt). Samamoodi jääd alles, kui oled uuel kuul juba midagi kirja pannud või liitusid alles viimase 7 päeva jooksul. Tagasi tulles vali nimekirjas oma nime kõrval „Osalen“.",
"If you haven't logged anything (no number, J or H) in the last 7 days of the month, you start the new month paused: on the first night of the new month the script puts you on pause on the roster and your row on the new month disappears. If you log the month's last day only the next day, you're back automatically the following night. This way people who have left don't stay in the group goal and percentages. If you didn't log anything at all during the month, you are not paused (maybe you started halfway). You also stay in if you've already logged something in the new month or joined within the last 7 days of the month. When you're back, pick “Osalen · In” next to your name on the roster."
],
[
"6.6",
"Kui sa ei ole 10 päeva jooksul kuu algusest (või oma liitumisest) midagi kirja pannud (ei numbrit, J-d ega H-d), paneb skript su pausile. Sinu rida kaob kuu vahekaardilt ja nimi liigub nimekirja lõppu. Nii ei jää lahkunud inimesed pärssima ühist eesmärki. Tagasi tulles vali nimekirjas oma nime kõrval „Osalen“, siis alustad nagu uus liituja.",
"If you haven't logged anything (no number, J or H) within 10 days of the start of the month (or of joining), the script puts you on pause. Your row disappears from the month tab and your name moves to the end of the list. This way people who have left don't hold back the group goal. When you're back, pick “Osalen · In” next to your name on the roster and you start like a new member."
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
var EHITUS = '30d293926541';
var KH_XLSX = [
  "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"
];
// ================================================================ SKRIPTI LÕPP (kui see rida on olemas, on kogu skript kleebitud)
