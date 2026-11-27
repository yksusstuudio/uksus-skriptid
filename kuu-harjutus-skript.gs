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
var POSTID = '7';                                    // postituste (uus harjutus, nädala seis) valemite versioon; muutub, kui nende tekst muutub
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
    [POST0, POST0 + 1, POST0 + 2, POST0 + 3, uus].forEach(function (rida) {   // 26.–27.11: ka start ja tulemused (h/min sekundite kuul)
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
        try { eesmarkUuesti_(); } catch (e) { Logger.log('Eesmärk täis uuesti: ' + e.message); }
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

// Erik 27.11: novembri „Eesmärk täis“ kiri tuli sekundites („38 820 sekundit“). Pärast parandust (tunnid ja minutid) saadab
// hommikune käivitus (kell 10) selle kirja uue tekstiga veel ühe korra, ainult grupile, kellele see oli juba saadetud. Käib korra.
var EESMARK_UUESTI = '2026-11';
function eesmarkUuesti_() {
  var props = props_(), d = ymd_(tana_());
  if (props.getProperty('EESMARK_UUESTI') === EESMARK_UUESTI) return;
  props.setProperty('EESMARK_UUESTI', EESMARK_UUESTI);
  if (d[0] + '-' + d[1] === EESMARK_UUESTI) props.deleteProperty('eesmark:' + EESMARK_UUESTI);
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
var EHITUS = 'b3754ba8ad0b';
var KH_XLSX = [
  "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"
];
// ================================================================ SKRIPTI LÕPP (kui see rida on olemas, on kogu skript kleebitud)
