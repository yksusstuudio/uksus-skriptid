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
var POSTID = '6';                                    // postituste (uus harjutus, nädala seis) valemite versioon; muutub, kui nende tekst muutub
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
    [POST0, POST0 + 2, POST0 + 3, uus].forEach(function (rida) {   // 26.11: ka tulemused (h/min sekundite kuul)
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
var EHITUS = '1d9b95b702de';
var KH_XLSX = [
  "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"
];
// ================================================================ SKRIPTI LÕPP (kui see rida on olemas, on kogu skript kleebitud)
