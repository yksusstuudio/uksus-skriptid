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
var EHITUS = '21b79f41a691';
var KH_XLSX = [
  "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"
];
// ================================================================ SKRIPTI LÕPP (kui see rida on olemas, on kogu skript kleebitud)
