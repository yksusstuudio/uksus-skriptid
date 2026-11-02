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
    samm('pausile', function () { autoPaus_(pub, plan, t); });
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

function pausidLoppu_(pub, t) {
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
    else if (praegu >= 0 && nimed[praegu][k]) pausNimega.push(k);   // teeb käimasoleva kuu lõpuni (järgmises kuus teda pole)
    else pausTyhi.push(k);
  });
  var p = osaleb.concat(pausNimega, pausTyhi, tyhi);
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
    var pea = mall.getRange(2, p[0], 2, p[1]), pf = pea.getFormulas(), pv = pea.getValues();
    sh.getRange(2, p[0], 2, p[1]).setValues(pf.map(function (r, i) { return r.map(function (x, j) { return x || txt_(pv[i][j]); }); }));
  });
  var jalus = mall.getRange(R0 + N + 1, FD, 1, 31).getFormulasR1C1();   // „✓ eesmärk täis“ päevade kaupa (30.10: eripäeval loeb iga tulemus)
  if (jalus[0][0]) sh.getRange(R0 + N + 1, FD, 1, 31).setFormulasR1C1(jalus);
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
    tekst = a1 === C_LOOS ? loosi_(sh).tekst : a1 === C_KUU ? looKuuKohe_().tekst : saadaProov_(sh).tekst;
  } catch (err) { tekst = 'Ei õnnestunud: ' + (err && err.message ? err.message : err); }
  sh.getRange(nupp[a1]).setValue(txt_(tekst));
  e.range.setValue(false);
  p.deleteProperty('NUPP_KAIB:' + a1);
}

// Erik 2.11 (telefonis): linnuke D32 jäi peale ja loosi ei tulnud, Google ei käivitanud muudatuse päästikut (tõenäoliselt
// käis samal ajal uuenduse Seadista, mis teeb päästikud uuesti). Minutipäästik vaatab linnukesi: kui linnuke on peal ka
// järgmisel minutil ja ükski käivitus seda parajasti ei tee, teeb ta sama, mis linnuke oleks teinud.
function linnukesed_() {
  var p0 = PropertiesService.getScriptProperties();
  if (!p0.getProperty('PRIV_ID')) return;
  grupid_(privaatne_()).forEach(function (g) {
    if (!g) return;
    grupiga_(g, function () {
      var p = props_(), v = g.getRange(C_LOOS + ':' + C_PROOV).getValues();
      [C_LOOS, C_KUU, C_PROOV].forEach(function (a1, i) {
        var k = 'NUPP:' + a1, nyyd = Date.now();
        if (v[i][0] !== true) { if (p.getProperty(k)) p.deleteProperty(k); return; }
        var nagi = Number(p.getProperty(k)) || 0, kaib = Number(p.getProperty('NUPP_KAIB:' + a1)) || 0;
        if (!nagi) { p.setProperty(k, String(nyyd)); return; }
        if (nyyd - nagi < 50000 || nyyd - kaib < 300000) return;
        p.deleteProperty(k);
        plaaniMuudatus1_({ range: g.getRange(a1) }, g);
      });
    });
  });
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
// Erik 30.10: pealkiri ja selgitus on tabeli päise kohal (read 20–21, mitte 19–20, sest edetabeli selgituse rida 20 on kõrge) ja nime järel tulp TIIM.
// Tulbad G H I J ja L: K on Ülevaate peidetud abitulp (edetabeli MATCH ja $K$4), seda ei puuduta. Peidetud K tõttu paistab tabel ühtne.
var VV0 = 20, VV_VEERG = 7, VV_MAX = 100, VV_TULBAD = [7, 8, 9, 10, 12];
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
function versioon(kiire) {
  if (kiire) try { linnukesed_(); } catch (err) { Logger.log('Linnukesed: ' + (err && err.message ? err.message : err)); }
  try {
    var p = PropertiesService.getScriptProperties();
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
  var priv = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('PRIV_ID'));
  grupid_(priv).forEach(function (g) {
    if (!g) return;
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
      });
    } catch (err) { Logger.log('Kiire uuendus: ' + (err && err.message ? err.message : err)); }
  });
  KUUD_ = null;
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
  try { viga = seadista() || ''; } catch (err) { viga = String(err && err.message ? err.message : err); }
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
function kuuHarjutusVersioon() { KuuHarjutus.versioon(true); }
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
var EHITUS = '3412b0ee7556';
var KH_XLSX = [
  "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"
];
// ================================================================ SKRIPTI LÕPP (kui see rida on olemas, on kogu skript kleebitud)
